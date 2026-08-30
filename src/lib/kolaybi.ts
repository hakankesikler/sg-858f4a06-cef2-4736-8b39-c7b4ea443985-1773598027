type DatabaseClient = any;

const DEFAULT_BASE_URL = "https://ofis-sandbox-api.kolaybi.com/kolaybi/v1";

type KolayBiConfig = {
  apiKey: string;
  channel: string;
  baseUrl: string;
  defaultProductId?: number;
  autoSendEDocument: boolean;
  prefix?: string;
};

class KolayBiError extends Error {
  retryable: boolean;
  status?: number;

  constructor(message: string, retryable: boolean, status?: number) {
    super(message);
    this.name = "KolayBiError";
    this.retryable = retryable;
    this.status = status;
  }
}

function getConfig(): KolayBiConfig {
  const apiKey = process.env.KOLAYBI_API_KEY || "";
  const channel = process.env.KOLAYBI_CHANNEL || "";
  if (!apiKey || !channel) {
    throw new KolayBiError(
      "KolayBi API anahtarı ve Channel bilgisi tamamlanmalıdır.",
      false,
    );
  }

  const product = Number(process.env.KOLAYBI_PRODUCT_ID || "");
  return {
    apiKey,
    channel,
    baseUrl: (process.env.KOLAYBI_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, ""),
    defaultProductId: Number.isFinite(product) && product > 0 ? product : undefined,
    autoSendEDocument: process.env.KOLAYBI_AUTO_SEND_E_DOCUMENT === "true",
    prefix: process.env.KOLAYBI_E_DOCUMENT_PREFIX || undefined,
  };
}

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text.slice(0, 1000) };
  }
}

function responseMessage(json: any, fallback: string) {
  return String(json?.message || json?.error?.message || json?.error || fallback).slice(0, 1000);
}

function isRetryableStatus(status: number) {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

async function fetchKolayBi(url: string, init: RequestInit) {
  let response: Response;
  try {
    response = await fetch(url, { ...init, signal: AbortSignal.timeout(25_000) });
  } catch (error: any) {
    throw new KolayBiError(`KolayBi bağlantı hatası: ${String(error?.message || error)}`, true);
  }
  const json = await readJson(response);
  if (!response.ok) {
    throw new KolayBiError(
      responseMessage(json, `KolayBi HTTP ${response.status}`),
      isRetryableStatus(response.status),
      response.status,
    );
  }
  return json;
}

async function getAccessToken(config: KolayBiConfig) {
  const json = await fetchKolayBi(`${config.baseUrl}/access_token`, {
    method: "POST",
    headers: {
      Channel: config.channel,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ api_key: config.apiKey }),
  });
  const token = json?.data?.access_token || json?.data?.token || json?.data;
  if (typeof token !== "string" || !token) {
    throw new KolayBiError("KolayBi erişim anahtarı alınamadı.", true);
  }
  return token;
}

async function recordResult(
  db: DatabaseClient,
  input: {
    jobId: string;
    status: "submitted" | "official" | "failed" | "mapping_required" | "status_checked";
    retryable?: boolean;
    error?: string | null;
    documentId?: number | null;
    uuid?: string | null;
    invoiceNo?: string | null;
    providerStatus?: string | null;
    pdfUrl?: string | null;
    result?: any;
  },
) {
  const { error } = await db.rpc("rex_record_invoice_sync_result", {
    p_job_id: input.jobId,
    p_status: input.status,
    p_retryable: input.retryable || false,
    p_error: input.error || null,
    p_document_id: input.documentId || null,
    p_uuid: input.uuid || null,
    p_invoice_no: input.invoiceNo || null,
    p_provider_status: input.providerStatus || null,
    p_pdf_url: input.pdfUrl || null,
    p_result: input.result || {},
  });
  if (error) throw error;
}

function validateInvoice(invoice: any, config: KolayBiConfig) {
  if (!invoice.customer?.kolaybi_contact_id || !invoice.customer?.kolaybi_address_id) {
    throw new KolayBiError("Cari KolayBi Contact ID ve Address ID eşlemesi eksik.", false);
  }
  if (!Array.isArray(invoice.items) || invoice.items.length === 0) {
    throw new KolayBiError("Faturada gönderilecek kalem bulunmuyor.", false);
  }
  if (!["TRY", "USD", "EUR", "GBP"].includes(invoice.currency)) {
    throw new KolayBiError("Desteklenmeyen fatura para birimi.", false);
  }
  if (invoice.currency !== "TRY" && Number(invoice.exchange_rate) <= 0) {
    throw new KolayBiError("Dövizli faturada geçerli kur zorunludur.", false);
  }
  if (invoice.document_type === "e_archive" && invoice.document_scenario !== "EARSIVFATURA") {
    throw new KolayBiError("E-arşiv senaryosu EARSIVFATURA olmalıdır.", false);
  }
  if (
    invoice.document_type === "e_invoice" &&
    !["TEMELFATURA", "TICARIFATURA", "KAMU"].includes(invoice.document_scenario)
  ) {
    throw new KolayBiError("Geçersiz e-fatura senaryosu.", false);
  }

  for (const item of invoice.items) {
    const productId = Number(item.kolaybi_product_id || config.defaultProductId || 0);
    if (!productId) {
      throw new KolayBiError(
        `${item.product_code || "HIZMET"} ürünü için KolayBi ürün eşlemesi eksik.`,
        false,
      );
    }
    const vatRate = Number(item.tax_rate);
    if (!Number.isFinite(vatRate) || vatRate < 0 || vatRate > 100) {
      throw new KolayBiError("Fatura kaleminde geçersiz KDV oranı var.", false);
    }
    if (vatRate === 0 && !item.exemption_code) {
      throw new KolayBiError("Sıfır KDV oranlı kalemde istisna kodu zorunludur.", false);
    }
    if (Boolean(item.withholding_code) !== Boolean(item.withholding_value)) {
      throw new KolayBiError("Tevkifat kodu ve oranı birlikte girilmelidir.", false);
    }
  }
}

function invoiceForm(invoice: any, config: KolayBiConfig) {
  const form = new URLSearchParams();
  form.set("contact_id", String(invoice.customer.kolaybi_contact_id));
  form.set("address_id", String(invoice.customer.kolaybi_address_id));
  form.set("order_date", invoice.invoice_date);
  form.set("due_date", invoice.due_date);
  form.set("currency", String(invoice.currency || "TRY").toLowerCase());
  form.set("tracking_currency", "try");
  form.set("exchange_rate", String(invoice.exchange_rate || 1));
  form.set("cross_currency_rate", String(invoice.exchange_rate || 1));
  form.set("serial_no", invoice.invoice_no);
  form.set("description", invoice.notes || `REX ${invoice.invoice_no}`);
  form.set("receiver_email", invoice.customer.invoice_email || invoice.customer.email || "");
  form.set("type", "sale_invoice");
  form.set("document_type", invoice.kolaybi_document_type || "SATIS");
  form.set("document_scenario", invoice.document_scenario);
  if (invoice.shipment_id) form.set("shipment_include", "true");
  if ((invoice.kolaybi_document_type || "SATIS") === "ISTISNA") {
    const exemptionCode = invoice.exemption_code || invoice.items.find((item: any) => item.exemption_code)?.exemption_code;
    if (exemptionCode) form.set("vat_exemption_reason_code", String(exemptionCode));
  }

  invoice.items.forEach((item: any, index: number) => {
    form.set(
      `items[${index}][product_id]`,
      String(item.kolaybi_product_id || config.defaultProductId),
    );
    form.set(`items[${index}][quantity]`, String(item.quantity));
    form.set(`items[${index}][unit_price]`, String(item.unit_price));
    form.set(`items[${index}][vat_rate]`, String(item.tax_rate || 0));
    form.set(`items[${index}][description]`, item.description || "Taşıma hizmeti");
    if (item.withholding_code) {
      form.set(`items[${index}][withholding_code]`, String(item.withholding_code));
      form.set(`items[${index}][withholding_value]`, String(item.withholding_value));
      form.set(
        `items[${index}][withholding_type]`,
        String(item.withholding_type || "PERCENTAGE"),
      );
    }
    if (item.exemption_code) {
      form.set(`items[${index}][exemption_code]`, String(item.exemption_code));
    }
  });
  return form;
}

function providerData(json: any) {
  return json?.data || json || {};
}

async function loadInvoice(db: DatabaseClient, invoiceId: string) {
  const { data, error } = await db
    .from("sales_invoices")
    .select(
      "*, customer:customers!sales_invoices_customer_id_fkey(id,name,email,invoice_email,kolaybi_contact_id,kolaybi_address_id), items:sales_invoice_items(*)",
    )
    .eq("id", invoiceId)
    .single();
  if (error || !data) throw new KolayBiError("Fatura bulunamadı.", false);
  return data;
}

export async function processKolayBiJob(db: DatabaseClient, invoiceId?: string | null) {
  const workerId = `rex-${crypto.randomUUID()}`;
  const { data: claimed, error: claimError } = await db.rpc("rex_claim_invoice_sync_job", {
    p_worker_id: workerId,
    p_invoice_id: invoiceId || null,
  });
  if (claimError) throw claimError;
  if (!claimed) return { processed: false, reason: "Kuyrukta çalışmaya hazır fatura yok." };

  const job = claimed as {
    job_id: string;
    invoice_id: string;
    job_type: "send" | "status";
    attempt: number;
  };

  try {
    const config = getConfig();
    const invoice = await loadInvoice(db, job.invoice_id);
    const token = await getAccessToken(config);
    const commonHeaders = {
      Channel: config.channel,
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    };

    if (job.job_type === "status") {
      if (!invoice.kolaybi_document_id) {
        throw new KolayBiError("KolayBi belge kimliği henüz oluşmadı.", false);
      }
      const detailJson = await fetchKolayBi(
        `${config.baseUrl}/invoices/${invoice.kolaybi_document_id}`,
        { headers: commonHeaders },
      );
      const detail = providerData(detailJson);
      await recordResult(db, {
        jobId: job.job_id,
        status: detail.uuid ? "official" : "status_checked",
        documentId: Number(invoice.kolaybi_document_id),
        uuid: detail.uuid,
        invoiceNo: detail.no,
        providerStatus: detail.status,
        result: detail,
      });
      return { processed: true, invoiceId: job.invoice_id, status: detail.status || "checked" };
    }

    validateInvoice(invoice, config);
    let documentId = Number(invoice.kolaybi_document_id || 0);
    let createData: any = {};
    if (!documentId) {
      const createJson = await fetchKolayBi(`${config.baseUrl}/invoices`, {
        method: "POST",
        headers: {
          ...commonHeaders,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: invoiceForm(invoice, config).toString(),
      });
      createData = providerData(createJson);
      documentId = Number(createData.document_id || createData.id || createData.document?.id || 0);
      if (!documentId) throw new KolayBiError("KolayBi fatura belge kimliği dönmedi.", true);
      const { error: documentError } = await db.rpc("rex_record_invoice_provider_document", {
        p_job_id: job.job_id,
        p_document_id: documentId,
        p_provider_status: createData.status || "created",
        p_result: createData,
      });
      if (documentError) throw documentError;
    }

    if (!config.autoSendEDocument) {
      await recordResult(db, {
        jobId: job.job_id,
        status: "submitted",
        documentId,
        providerStatus: createData.status || invoice.provider_status || "created",
        result: createData,
      });
      return { processed: true, invoiceId: job.invoice_id, status: "submitted", documentId };
    }

    const sendForm = new URLSearchParams({ document_id: String(documentId) });
    if (config.prefix) sendForm.set("prefix", config.prefix);
    const sendJson = await fetchKolayBi(`${config.baseUrl}/invoices/e-document/create`, {
      method: "POST",
      headers: {
        ...commonHeaders,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: sendForm.toString(),
    });
    const official = providerData(sendJson);
    await recordResult(db, {
      jobId: job.job_id,
      status: "official",
      documentId,
      uuid: official.uuid,
      invoiceNo: official.no,
      providerStatus: official.status,
      result: official,
    });
    return {
      processed: true,
      invoiceId: job.invoice_id,
      status: "official",
      documentId,
      uuid: official.uuid,
      invoiceNo: official.no,
    };
  } catch (error: any) {
    const retryable = error instanceof KolayBiError ? error.retryable : true;
    const message = String(error?.message || error).slice(0, 1000);
    const status = message.includes("eşlemesi eksik") ? "mapping_required" : "failed";
    try {
      await recordResult(db, {
        jobId: job.job_id,
        status,
        retryable,
        error: message,
      });
    } catch (recordError) {
      console.error("KolayBi kuyruk sonucu kaydedilemedi", recordError);
    }
    throw new KolayBiError(message, retryable, error?.status);
  }
}

export async function fetchKolayBiPdf(db: DatabaseClient, invoiceId: string) {
  const config = getConfig();
  const invoice = await loadInvoice(db, invoiceId);
  if (!invoice.official_uuid && !invoice.kolaybi_uuid) {
    throw new KolayBiError("Resmî fatura UUID bilgisi henüz oluşmadı.", false);
  }
  const token = await getAccessToken(config);
  const uuid = invoice.official_uuid || invoice.kolaybi_uuid;
  const json = await fetchKolayBi(
    `${config.baseUrl}/invoices/e-document/view?uuid=${encodeURIComponent(uuid)}`,
    {
      headers: {
        Channel: config.channel,
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    },
  );
  const data = providerData(json);
  if (!data.src || String(data.output_type || "pdf").toLowerCase() !== "pdf") {
    throw new KolayBiError("KolayBi PDF çıktısı alınamadı.", true);
  }
  return { base64: String(data.src), invoiceNo: invoice.official_invoice_no || invoice.invoice_no };
}

export function publicKolayBiError(error: any) {
  return {
    message: String(error?.message || "KolayBi işlemi tamamlanamadı.").slice(0, 1000),
    retryable: error instanceof KolayBiError ? error.retryable : true,
    status: error?.status,
  };
}
