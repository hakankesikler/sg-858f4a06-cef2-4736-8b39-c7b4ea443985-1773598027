import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { isKolayBiSyncEnabled } from "@/lib/kolaybi-live-gate";

const defaultBaseUrl = "https://ofis-sandbox-api.kolaybi.com/kolaybi/v1";
const pageSize = 100;
const maxPages = 20;

type SkipReason =
  | "missing_document_id"
  | "missing_invoice_no"
  | "missing_supplier_name"
  | "missing_supplier_identity"
  | "invalid_total";

type NormalizedResult =
  | { invoice: Record<string, unknown>; reason: null }
  | { invoice: null; reason: SkipReason };

async function readJson(response: Response) {
  const body = await response.text();
  if (!body) return {};
  try { return JSON.parse(body); } catch { throw new Error("KolayBi geçersiz bir yanıt döndürdü."); }
}

async function request(url: string, init: RequestInit) {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(25_000) });
  const json = await readJson(response);
  if (!response.ok) throw new Error(String(json?.message || json?.error?.message || `KolayBi HTTP ${response.status}`).slice(0, 500));
  return json;
}

function firstValue(...values: any[]) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function textValue(...values: any[]) {
  const value = firstValue(...values);
  if (value === undefined || value === null) return "";
  if (["string", "number"].includes(typeof value)) return String(value).trim();
  return String(firstValue(value?.value, value?.name, value?.title, value?.description, value?.iso_code, "")).trim();
}

function numberValue(...values: any[]) {
  const value = firstValue(...values, 0);
  const candidate = typeof value === "object" && value !== null
    ? firstValue(value?.amount, value?.value, value?.total, value?.grand_total, 0)
    : value;
  const parsed = Number(candidate);
  return Number.isFinite(parsed) ? parsed : 0;
}

function digits(...values: any[]) {
  return textValue(...values).replace(/\D/g, "");
}

function dateValue(value: any) {
  const date = String(value || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : new Date().toISOString().slice(0, 10);
}

function documentKey(value: any) {
  return textValue(value).toLocaleUpperCase("tr-TR").replace(/[^A-Z0-9]/g, "");
}

function partyCandidates(item: any) {
  return [
    item?.header?.associate,
    item?.commercial_doc?.header?.associate,
    item?.invoice?.header?.associate,
    item?.associate,
    item?.contact,
    item?.supplier,
    item?.sender,
    item?.issuer,
    item?.vendor,
    item?.account,
    item?.party,
    item?.sender_party,
  ].filter((candidate) => candidate && typeof candidate === "object");
}

function associateReferenceIds(item: any) {
  return [
    item?.header?.associate?.id,
    item?.commercial_doc?.header?.associate?.id,
    item?.invoice?.header?.associate?.id,
    item?.associate?.id,
    item?.contact?.id,
    item?.supplier?.id,
    item?.sender?.id,
    item?.issuer?.id,
    item?.associate_id,
    item?.contact_id,
    item?.supplier_id,
    item?.sender_id,
    item?.issuer_id,
  ].map((value) => textValue(value)).filter(Boolean);
}

function partyName(parties: any[], official: any, commercial: any) {
  for (const party of parties) {
    const name = textValue(
      party?.full_name,
      party?.title,
      party?.company_name,
      party?.trade_name,
      party?.name,
      [party?.name, party?.surname].filter(Boolean).join(" "),
    );
    if (name) return name;
  }
  return textValue(
    official?.sender_title,
    official?.supplier_name,
    official?.issuer_name,
    official?.party_name,
    commercial?.sender_title,
    commercial?.supplier_name,
    commercial?.issuer_name,
    commercial?.associate_name,
  );
}

function partyIdentity(parties: any[], official: any, commercial: any) {
  for (const party of parties) {
    const identity = digits(
      party?.identity_no,
      party?.identity_number,
      party?.tax_number,
      party?.tax_id,
      party?.vkn,
      party?.tckn,
    );
    if ([10, 11].includes(identity.length)) return identity;
  }
  return digits(
    official?.sender_tax_number,
    official?.supplier_tax_number,
    official?.issuer_tax_id,
    official?.identity_no,
    official?.tax_number,
    official?.vkn,
    official?.tckn,
    commercial?.sender_tax_number,
    commercial?.supplier_tax_number,
    commercial?.issuer_tax_id,
    commercial?.identity_no,
    commercial?.tax_number,
    commercial?.vkn,
    commercial?.tckn,
  );
}

function inferDocumentType(official: any, commercial: any) {
  const value = textValue(
    official?.scenario,
    official?.document_scenario,
    official?.document_type,
    official?.e_document_type,
    official?.type,
    commercial?.e_document?.scenario,
    commercial?.e_document?.document_type,
    commercial?.document_scenario,
    commercial?.document_type,
  ).toLocaleUpperCase("tr-TR");
  return /EARSIV|E-ARSIV|E_AR[SŞ]IV|ARCHIVE|AR[SŞ]IV/.test(value) ? "e_archive" : "e_invoice";
}

function normalize(official: any, commercial: any, associate: any): NormalizedResult {
  const parties = [...partyCandidates(official), ...partyCandidates(commercial), ...partyCandidates(associate), associate].filter(Boolean);
  const officialTotals = official?.totals || official?.amounts || {};
  const commercialTotals = commercial?.total || commercial?.totals || commercial?.amounts || {};
  const payment = commercial?.payment_plan || commercial?.payment || official?.payment_plan || official?.payment || {};
  const documentId = textValue(
    official?.document_id,
    official?.id,
    official?.invoice_id,
    official?.uuid,
    commercial?.commercial_doc_id,
    commercial?.document_id,
    commercial?.id,
    commercial?.invoice_id,
  );
  const invoiceNo = textValue(
    official?.no,
    official?.invoice_no,
    official?.serial_no,
    official?.document_no,
    commercial?.serial_no,
    commercial?.invoice_no,
    commercial?.no,
    commercial?.document_no,
    commercial?.header?.serial_no,
  );
  const issuerName = partyName(parties, official, commercial);
  const issuerTaxId = partyIdentity(parties, official, commercial);
  const grandTotal = numberValue(
    official?.exchange_grand_total,
    official?.grand_total,
    official?.payable_amount,
    officialTotals?.grand_total,
    officialTotals?.total,
    commercialTotals?.grand_total,
    commercialTotals?.total,
    commercial?.grand_total,
    commercial?.payable_amount,
  );

  if (!documentId) return { invoice: null, reason: "missing_document_id" };
  if (!invoiceNo) return { invoice: null, reason: "missing_invoice_no" };
  if (!issuerName) return { invoice: null, reason: "missing_supplier_name" };
  if (![10, 11].includes(issuerTaxId.length)) return { invoice: null, reason: "missing_supplier_identity" };
  if (grandTotal <= 0) return { invoice: null, reason: "invalid_total" };

  const taxOffice = parties.map((party) => textValue(party?.tax_office, party?.tax_office_name)).find(Boolean);
  return {
    invoice: {
      provider_document_id: documentId,
      official_uuid: textValue(official?.uuid, official?.ettn, official?.official_uuid, commercial?.e_document?.uuid, commercial?.uuid) || null,
      document_type: inferDocumentType(official, commercial),
      invoice_no: invoiceNo.toLocaleUpperCase("tr-TR"),
      invoice_date: dateValue(firstValue(official?.issue_date, official?.invoice_date, commercial?.issue_date, commercial?.invoice_date, commercial?.order_date, commercial?.date)),
      due_date: firstValue(commercial?.due_date, commercial?.maturity_date, official?.due_date, official?.maturity_date)
        ? dateValue(firstValue(commercial?.due_date, commercial?.maturity_date, official?.due_date, official?.maturity_date))
        : null,
      issuer_name: issuerName,
      issuer_tax_id: issuerTaxId,
      issuer_tax_office: taxOffice || textValue(official?.tax_office, commercial?.tax_office) || null,
      currency: textValue(official?.grand_currency, official?.currency, officialTotals?.currency, commercial?.currency, commercialTotals?.currency, "TRY").toUpperCase(),
      net_total: numberValue(
        official?.exchange_subtotal,
        official?.subtotal,
        officialTotals?.subtotal,
        officialTotals?.net_total,
        commercialTotals?.subtotal,
        commercialTotals?.net_total,
        commercial?.subtotal,
        grandTotal,
      ),
      vat_total: numberValue(
        official?.exchange_total_vat,
        official?.total_vat,
        official?.vat_total,
        officialTotals?.vat_total,
        officialTotals?.tax,
        commercialTotals?.total_vat,
        commercialTotals?.vat_total,
        commercial?.vat_total,
      ),
      withholding_total: numberValue(official?.withholding_total, officialTotals?.withholding_total, commercialTotals?.withholding_total, commercial?.withholding_total),
      grand_total: grandTotal,
      description: textValue(commercial?.description, commercial?.notes, commercial?.note, official?.description, official?.notes, official?.note) || null,
      provider_status: firstValue(commercial?.commercial_doc_status, commercial?.status, official?.status, official?.document_status) || null,
      e_document_status: firstValue(official?.status, official?.e_document_status, official?.gib_status, commercial?.e_document_status) || null,
      payment_status: firstValue(payment?.payment_status_value, payment?.status, commercial?.payment_status, official?.payment_status) || null,
      provider_balance: numberValue(payment?.remaining_amount, payment?.balance, commercial?.balance, official?.balance),
    },
    reason: null,
  };
}

function listFrom(json: any) {
  if (Array.isArray(json?.data?.data)) return json.data.data;
  if (Array.isArray(json?.data?.items)) return json.data.items;
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.items)) return json.items;
  return [];
}

function lastPageFrom(json: any) {
  const value = Number(json?.data?.last_page || json?.data?.meta?.last_page || json?.meta?.last_page || 1);
  return Number.isFinite(value) && value > 0 ? Math.min(Math.trunc(value), maxPages) : 1;
}

async function pagedProviderList(baseUrl: string, path: string, params: URLSearchParams, headers: Record<string, string>) {
  const rows: any[] = [];
  let page = 1;
  let lastPage = 1;
  do {
    params.set("page", String(page));
    params.set("per_page", String(pageSize));
    const json = await request(`${baseUrl}${path}?${params.toString()}`, { method: "GET", headers });
    const pageRows = listFrom(json);
    rows.push(...pageRows);
    lastPage = Math.max(lastPage, lastPageFrom(json));
    if (pageRows.length < pageSize && lastPage === 1) break;
    page += 1;
  } while (page <= lastPage && page <= maxPages);
  return rows;
}

function addUnique(index: Map<string, any | null>, key: string, value: any) {
  if (!key) return;
  if (!index.has(key)) index.set(key, value);
  else if (index.get(key) !== value) index.set(key, null);
}

function commercialIndexes(rows: any[]) {
  const byId = new Map<string, any | null>();
  const byNo = new Map<string, any | null>();
  for (const row of rows) {
    [row?.commercial_doc_id, row?.document_id, row?.id, row?.invoice_id].forEach((value) => addUnique(byId, documentKey(value), row));
    [row?.serial_no, row?.invoice_no, row?.no, row?.document_no, row?.header?.serial_no].forEach((value) => addUnique(byNo, documentKey(value), row));
  }
  return { byId, byNo };
}

function matchingCommercial(official: any, indexes: ReturnType<typeof commercialIndexes>) {
  for (const value of [official?.document_id, official?.id, official?.invoice_id]) {
    const match = indexes.byId.get(documentKey(value));
    if (match) return match;
  }
  for (const value of [official?.no, official?.invoice_no, official?.serial_no, official?.document_no]) {
    const match = indexes.byNo.get(documentKey(value));
    if (match) return match;
  }
  return null;
}

async function associateIndex(admin: any, providerEnvironment: "test" | "live") {
  const result = new Map<string, any>();
  for (let from = 0; from < 10_000; from += 1_000) {
    const { data, error } = await admin.from("kolaybi_master_records")
      .select("external_id,payload")
      .eq("provider_environment", providerEnvironment)
      .eq("resource_type", "associate")
      .range(from, from + 999);
    if (error) throw error;
    for (const row of data || []) result.set(textValue(row.external_id), row.payload || {});
    if ((data || []).length < 1_000) break;
  }
  return result;
}

function matchingAssociate(official: any, commercial: any, associates: Map<string, any>) {
  for (const id of [...associateReferenceIds(commercial), ...associateReferenceIds(official)]) {
    const match = associates.get(id);
    if (match) return match;
  }
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!["GET", "POST"].includes(req.method || "")) return res.status(405).json({ error: "Yalnızca GET ve POST desteklenir." });
  const bearer = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : "";
  const cronSecret = process.env.CRON_SECRET || "";
  const cronMode = Boolean(cronSecret && bearer === cronSecret && req.method === "GET");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!bearer) return res.status(401).json({ error: "Oturum doğrulanamadı." });
  if (!supabaseUrl || !anonKey || !serviceKey) return res.status(500).json({ error: "Sunucu veritabanı ayarları eksik." });

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  if (!cronMode) {
    const authDb = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${bearer}` } }, auth: { persistSession: false, autoRefreshToken: false } });
    const { data: userData, error: userError } = await authDb.auth.getUser(bearer);
    if (userError || !userData.user) return res.status(401).json({ error: "Oturum süresi dolmuş." });
    const { data: allowed } = await authDb.rpc("rex_has_role" as any, { required_roles: ["admin", "accounting"] } as any);
    if (!allowed) return res.status(403).json({ error: "Alış faturalarını görüntüleme yetkiniz yok." });
  }

  const apiKey = process.env.KOLAYBI_API_KEY;
  const channel = process.env.KOLAYBI_CHANNEL;
  const companyId = process.env.KOLAYBI_COMPANY_ID;
  const baseUrl = (process.env.KOLAYBI_BASE_URL || defaultBaseUrl).replace(/\/$/, "");
  if (!apiKey || !channel || !companyId) {
    return res.status(422).json({ error: "KolayBi API anahtarı, Channel ve Company ID bilgileri tamamlanmalıdır." });
  }
  if (!isKolayBiSyncEnabled(baseUrl)) {
    return res.status(503).json({ error: "KolayBi canlı senkronizasyonu güvenli geçiş için kapalıdır." });
  }

  try {
    const tokenJson = await request(`${baseUrl}/access_token`, {
      method: "POST",
      headers: { Channel: channel, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ api_key: apiKey }),
    });
    const accessToken = tokenJson?.data?.access_token || tokenJson?.data?.token || tokenJson?.data;
    if (typeof accessToken !== "string" || !accessToken) throw new Error("KolayBi erişim anahtarı alınamadı.");

    const endDate = new Date();
    const startDate = new Date();
    const syncDays = Math.min(Math.max(Number(process.env.KOLAYBI_PURCHASE_SYNC_DAYS || 730), 30), 3650);
    startDate.setDate(startDate.getDate() - syncDays);
    const minIssueDate = startDate.toISOString().slice(0, 10);
    const maxIssueDate = endDate.toISOString().slice(0, 10);
    const headers = { Channel: channel, Authorization: `Bearer ${accessToken}`, Accept: "application/json" };
    const providerEnvironment = baseUrl.includes("sandbox") ? "test" as const : "live" as const;

    const [officialRows, commercialRows, associates] = await Promise.all([
      pagedProviderList(baseUrl, "/e_document/invoices", new URLSearchParams({
        company_id: companyId,
        direction: "inbound",
        min_issue_date: minIssueDate,
        max_issue_date: maxIssueDate,
      }), headers),
      pagedProviderList(baseUrl, "/invoices", new URLSearchParams({
        type: "purchase_invoice",
        has_products: "true",
        start_date: minIssueDate,
        end_date: maxIssueDate,
      }), headers),
      associateIndex(admin, providerEnvironment),
    ]);

    const indexes = commercialIndexes(commercialRows);
    let imported = 0;
    let existing = 0;
    let commercialMatches = 0;
    let associateMatches = 0;
    let suppliersCreated = 0;
    let suppliersPromoted = 0;
    let supplierInvoicesLinked = 0;
    let supplierReviews = 0;
    const ensuredSupplierTaxes = new Set<string>();
    const skipReasons: Record<SkipReason, number> = {
      missing_document_id: 0,
      missing_invoice_no: 0,
      missing_supplier_name: 0,
      missing_supplier_identity: 0,
      invalid_total: 0,
    };
    const errors: string[] = [];

    for (const official of officialRows) {
      const commercial = matchingCommercial(official, indexes);
      if (commercial) commercialMatches += 1;
      const associate = matchingAssociate(official, commercial, associates);
      if (associate) associateMatches += 1;
      const normalized = normalize(official, commercial, associate);
      if (!normalized.invoice) {
        skipReasons[normalized.reason] += 1;
        continue;
      }
      const supplierTax = String(normalized.invoice.issuer_tax_id || "").replace(/\D/g, "");
      if (!ensuredSupplierTaxes.has(supplierTax)) {
        ensuredSupplierTaxes.add(supplierTax);
        const { data: supplierResult, error: supplierError } = await admin.rpc(
          "rex_ensure_kolaybi_purchase_supplier" as any,
          {
            p_invoice: normalized.invoice,
            p_associate: associate || {},
            p_provider_environment: providerEnvironment,
          } as any,
        );
        if (supplierError) {
          errors.push(`${textValue(official?.no, official?.document_id, "Bilinmeyen belge")}: tedarikçi carisi oluşturulamadı: ${String(supplierError.message).slice(0, 180)}`);
        } else {
          const ensured = supplierResult as any;
          if (ensured?.created) suppliersCreated += 1;
          if (ensured?.promoted) suppliersPromoted += 1;
          supplierInvoicesLinked += Number(ensured?.linked || 0);
          if (ensured?.review_required) supplierReviews += 1;
        }
      }
      const { data, error } = await admin.rpc("rex_import_kolaybi_purchase_invoice" as any, { p_invoice: normalized.invoice } as any);
      if (error) {
        errors.push(`${textValue(official?.no, official?.document_id, "Bilinmeyen belge")}: ${String(error.message).slice(0, 180)}`);
        continue;
      }
      if ((data as any)?.created) imported += 1;
      else existing += 1;
    }

    const skipped = Object.values(skipReasons).reduce((sum, count) => sum + count, 0);
    console.info("KolayBi purchase invoice sync completed", {
      providerEnvironment,
      officialReceived: officialRows.length,
      commercialReceived: commercialRows.length,
      commercialMatches,
      associateMatches,
      suppliersCreated,
      suppliersPromoted,
      supplierInvoicesLinked,
      supplierReviews,
      imported,
      existing,
      skipped,
      skipReasons,
      errorCount: errors.length,
    });
    return res.status(200).json({
      success: errors.length === 0,
      received: officialRows.length,
      official_received: officialRows.length,
      commercial_received: commercialRows.length,
      commercial_matches: commercialMatches,
      associate_matches: associateMatches,
      suppliers_created: suppliersCreated,
      suppliers_promoted: suppliersPromoted,
      supplier_invoices_linked: supplierInvoicesLinked,
      supplier_reviews: supplierReviews,
      imported,
      existing,
      skipped,
      skip_reasons: skipReasons,
      errors: errors.slice(0, 10),
    });
  } catch (error: any) {
    return res.status(502).json({ error: String(error?.message || "KolayBi bağlantısı tamamlanamadı.").slice(0, 500) });
  }
}
