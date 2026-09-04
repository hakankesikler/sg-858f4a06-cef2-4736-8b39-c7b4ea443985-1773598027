import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_BASE_URL = "https://ofis-sandbox-api.kolaybi.com/kolaybi/v1";
const SUPPORTED_RESOURCES = ["associates", "products", "expense_types", "sales_invoices", "purchase_invoices", "general_expenses", "vaults", "vault_transactions"] as const;
type Resource = (typeof SUPPORTED_RESOURCES)[number];

class ProviderError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

async function readJson(response: Response) {
  const body = await response.text();
  if (!body) return {};
  try { return JSON.parse(body); } catch { throw new ProviderError("KolayBi geçersiz bir yanıt döndürdü.", response.status); }
}

async function providerRequest(url: string, init: RequestInit) {
  let response: Response;
  try {
    response = await fetch(url, { ...init, signal: AbortSignal.timeout(25_000) });
  } catch (error: any) {
    throw new ProviderError(`KolayBi bağlantısı kurulamadı: ${String(error?.message || error)}`);
  }
  const json = await readJson(response);
  if (!response.ok) {
    throw new ProviderError(String(json?.message || json?.error?.message || `KolayBi HTTP ${response.status}`).slice(0, 500), response.status);
  }
  return json;
}

function listFrom(json: any) {
  if (Array.isArray(json?.data?.data)) return json.data.data;
  if (Array.isArray(json?.data?.items)) return json.data.items;
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.items)) return json.items;
  return [];
}

function transactionablesFrom(json: any) {
  return Array.isArray(json?.data?.transactionables) ? json.data.transactionables : [];
}

function text(value: any) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function digits(value: any) {
  return text(value).replace(/\D/g, "");
}

function number(value: any) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function currency(value: any) {
  const candidate = text(value).toUpperCase();
  return ["TRY", "USD", "EUR", "GBP"].includes(candidate) ? candidate : "TRY";
}

function invoiceHeader(item: any) {
  return item?.header || item?.document?.header || {};
}

function invoiceEDocument(item: any) {
  return item?._e_document || item?.e_document || item?.document || {};
}

function eDocumentProfile(item: any) {
  const official = invoiceEDocument(item);
  const scenario = text(official?.scenario || official?.document_scenario).toUpperCase();
  const officialIdentity = text(official?.uuid || official?.ettn || official?.no || official?.invoice_no);
  if (!officialIdentity || !["EARSIVFATURA", "TEMELFATURA", "TICARIFATURA", "KAMU"].includes(scenario)) return null;
  const header = invoiceHeader(item);
  const issueDate = text(official?.issue_date || header?.issue_date || item?.issue_date).slice(0, 10);
  return {
    documentType: scenario === "EARSIVFATURA" ? "e_archive" as const : "e_invoice" as const,
    scenario,
    evidenceAt: /^\d{4}-\d{2}-\d{2}$/.test(issueDate) ? `${issueDate}T12:00:00.000Z` : new Date().toISOString(),
    documentId: text(official?.document_id || item?.commercial_doc_id || item?.document_id || item?.id),
  };
}

async function updateCustomerEDocumentProfile(
  admin: any,
  customerId: string,
  profile: NonNullable<ReturnType<typeof eDocumentProfile>>,
  providerEnvironment: "test" | "live",
) {
  const { data: current, error: currentError } = await admin.from("customers")
    .select("kolaybi_e_document_environment,kolaybi_e_document_evidence_at")
    .eq("id", customerId).single();
  if (currentError) throw currentError;
  if (current?.kolaybi_e_document_environment === "live" && providerEnvironment === "test") return false;
  if (
    current?.kolaybi_e_document_environment === providerEnvironment &&
    current?.kolaybi_e_document_evidence_at &&
    new Date(current.kolaybi_e_document_evidence_at).getTime() > new Date(profile.evidenceAt).getTime()
  ) return false;
  const { error } = await admin.from("customers").update({
    kolaybi_e_document_type: profile.documentType,
    kolaybi_e_document_scenario: profile.scenario,
    kolaybi_e_document_source: "kolaybi_official_invoice",
    kolaybi_e_document_environment: providerEnvironment,
    kolaybi_e_document_evidence_at: profile.evidenceAt,
    kolaybi_e_document_checked_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", customerId);
  if (error) throw error;
  return true;
}

function safePayload(resource: Resource, item: any) {
  if (resource === "vaults") {
    return { id: item?.id, type: item?.type, name: item?.name, balance: item?.balance, currency: item?.currency };
  }
  if (resource === "vault_transactions") {
    return {
      id: item?.id, transaction_id: item?.transaction_id,
      transaction_type: item?.transaction_type, transaction_subtype: item?.transaction_subtype,
      issue_date: item?.issue_date, cash_flow_direction: item?.cash_flow_direction,
      amount: item?.amount, currency: item?.currency, exchange_rate: item?.exchange_rate,
      exchange_amount: item?.exchange_amount, quote_currency: item?.quote_currency,
      description: item?.description, cumulative: item?.cumulative,
      associates: Array.isArray(item?.associates) ? item.associates.slice(0, 20) : [],
      serial_no: item?.serial_no,
      projects: Array.isArray(item?.projects) ? item.projects.slice(0, 20) : [],
      vault_destinations: Array.isArray(item?.vault_destinations) ? item.vault_destinations.slice(0, 20) : [],
      vault_id: item?._vault_id, vault_name: item?._vault_name,
    };
  }
  if (resource === "associates") {
    return {
      id: item?.id, code: item?.code, name: item?.name, surname: item?.surname,
      identity_no: item?.identity_no, associate_type: item?.associate_type,
      email: item?.email, phone: item?.phone, country: item?.country,
      address: Array.isArray(item?.address) ? item.address.slice(0, 10) : [],
      balances: Array.isArray(item?.balances) ? item.balances.slice(0, 10).map((balance: any) => ({
        ...balance,
        currency: currency(balance?.currency),
      })) : [],
      tags: Array.isArray(item?.tags) ? item.tags.slice(0, 20) : [],
    };
  }
  if (resource === "products") {
    return {
      id: item?.id, code: item?.code, name: item?.name, product_type: item?.product_type,
      vat_type: item?.vat_type, vat_value: item?.vat_value, barcode: item?.barcode,
      description: item?.description, purchase_price: item?.purchase_price,
      purchase_currency: item?.purchase_currency, sale_price: item?.sale_price,
      sale_currency: item?.sale_currency, total_stock_quantity: item?.total_stock_quantity,
      unit: item?.unit || item?.unit_name, is_active: item?.is_active ?? item?.active,
      tags: Array.isArray(item?.tags) ? item.tags.slice(0, 20) : [],
    };
  }
  if (resource === "expense_types") {
    return { id: item?.id, name: item?.name, description: item?.description };
  }
  if (resource === "general_expenses") {
    return {
      commercial_doc_id: item?.commercial_doc_id, currency: item?.currency,
      tracking_currency: item?.tracking_currency, commercial_doc_type: item?.commercial_doc_type,
      commercial_doc_status: item?.commercial_doc_status,
      financial_action_type_id: item?.financial_action_type_id,
      e_document_status: item?.e_document_status, header: item?.header,
      total: item?.total, payment_plan: item?.payment_plan,
      projects: Array.isArray(item?.projects) ? item.projects.slice(0, 20) : [],
      tags: Array.isArray(item?.tags) ? item.tags.slice(0, 20) : [],
    };
  }
  return {
    id: item?.id, commercial_doc_id: item?.commercial_doc_id, document_id: item?.document_id, uuid: item?.uuid,
    serial_no: item?.serial_no, invoice_no: item?.invoice_no,
    type: item?.type, status: item?.status, issue_date: item?.issue_date || item?.order_date,
    due_date: item?.due_date, currency: item?.currency, tracking_currency: item?.tracking_currency,
    total: item?.total ?? item?.grand_total, balance: item?.balance,
    associate_id: item?.associate_id || item?.contact_id,
    description: item?.description,
    commercial_doc_status: item?.commercial_doc_status,
    e_document_status: item?.e_document_status,
    payment_plan: item?.payment_plan,
    header: item?.header ? {
      serial_no: item.header.serial_no,
      issue_date: item.header.issue_date,
      due_date: item.header.due_date,
      description: item.header.description,
      associate: item.header.associate ? {
        id: item.header.associate.id,
        full_name: item.header.associate.full_name,
        identity_no: item.header.associate.identity_no,
      } : null,
    } : null,
    e_document: item?._e_document ? {
      document_id: item._e_document.document_id,
      uuid: item._e_document.uuid,
      no: item._e_document.no,
      status: item._e_document.status,
      scenario: item._e_document.scenario,
      type: item._e_document.type,
      issue_date: item._e_document.issue_date,
      cancelled_at: item._e_document.cancelled_at,
    } : null,
  };
}

function normalized(resource: Resource, item: any) {
  const payload = safePayload(resource, item);
  const externalId = text(item?.id || item?.commercial_doc_id || item?.document_id || item?.uuid || item?.serial_no || item?.invoice_no);
  if (!externalId) return null;
  if (resource === "vaults") {
    return { externalId, displayName: text(item?.name) || `Finans Hesabı ${externalId}`, code: text(item?.type), taxIdentity: "", currency: currency(item?.currency), amount: number(item?.balance), payload };
  }
  if (resource === "vault_transactions") {
    const transactionType = text(item?.transaction_type?.description || item?.transaction_type?.value || item?.transaction_type?.key);
    return {
      externalId: `${text(item?._vault_id)}:${externalId}`,
      displayName: text(item?.description) || transactionType || `Finans Hareketi ${externalId}`,
      code: text(item?.serial_no || item?.transaction_id || item?.id), taxIdentity: "",
      currency: currency(item?.currency), amount: Math.abs(number(item?.amount)), payload,
    };
  }
  if (resource === "associates") {
    const name = [text(item?.name), text(item?.surname)].filter(Boolean).join(" ");
    const balance = Array.isArray(item?.balances) ? item.balances[0] : null;
    return { externalId, displayName: name || text(item?.code), code: text(item?.code), taxIdentity: digits(item?.identity_no), currency: text(balance?.currency).toUpperCase() || null, amount: number(balance?.balance), payload };
  }
  if (resource === "products") {
    return { externalId, displayName: text(item?.name), code: text(item?.code), taxIdentity: "", currency: text(item?.sale_currency || item?.purchase_currency).toUpperCase() || null, amount: number(item?.sale_price || item?.purchase_price), payload };
  }
  if (resource === "expense_types") {
    return { externalId, displayName: text(item?.name) || `Gider Tipi ${externalId}`, code: text(item?.id), taxIdentity: "", currency: null, amount: 0, payload };
  }
  if (resource === "general_expenses") {
    const header = item?.header || {};
    const totals = item?.total || {};
    return {
      externalId,
      displayName: text(header?.serial_no || `Genel Gider ${externalId}`),
      code: text(header?.serial_no), taxIdentity: "", currency: currency(item?.currency),
      amount: number(totals?.grand_total ?? totals?.total_amount), payload,
    };
  }
  const header = invoiceHeader(item);
  const totals = item?.total || {};
  return {
    externalId,
    displayName: text(header?.serial_no || item?.serial_no || item?.invoice_no || item?.document_no || `Fatura ${externalId}`),
    code: text(header?.serial_no || item?.serial_no || item?.invoice_no || item?.document_no),
    taxIdentity: digits(header?.associate?.identity_no),
    currency: text(item?.currency).toUpperCase() || "TRY",
    amount: number(totals?.grand_total ?? totals?.total_amount ?? item?.grand_total ?? item?.payable_amount),
    payload,
  };
}

function productType(value: unknown) {
  const normalizedValue = text(value).toLocaleLowerCase("tr-TR");
  return normalizedValue.includes("hizmet") || normalizedValue.includes("service") ? "Hizmet" : "Ürün";
}

function productUnit(value: unknown) {
  const candidate = text(value);
  const allowed = ["Adet", "Kg", "Ton", "Metre", "M2", "M3", "Litre", "Paket", "Saat", "Gün"];
  return allowed.find((unit) => unit.toLocaleLowerCase("tr-TR") === candidate.toLocaleLowerCase("tr-TR")) || "Adet";
}

function providerProductCode(row: NonNullable<ReturnType<typeof normalized>>, environment: "test" | "live") {
  const providerCode = (row.code || row.externalId).replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 80);
  return environment === "test" ? `KB-TEST-${providerCode}` : providerCode || `KB-LIVE-${row.externalId}`;
}

async function findLocal(
  admin: any,
  resource: Resource,
  item: any,
  row: ReturnType<typeof normalized>,
  providerEnvironment: "test" | "live",
) {
  if (!row) return null;
  if (resource === "vaults") {
    const vaultId = Number(item?.id);
    if (!Number.isSafeInteger(vaultId) || vaultId <= 0) throw new ProviderError("KolayBi finans hesabı kimliği geçerli değil.");
    const providerType = text(item?.type).toLowerCase();
    const accountType = providerType.includes("safe") || providerType.includes("cash") ? "Kasa"
      : providerType.includes("credit") ? "Kredi Kartı" : "Banka";
    const now = new Date().toISOString();
    const accountData = {
      account_name: row.displayName, account_type: accountType,
      currency: row.currency || "TRY", balance: row.amount, provider_balance: row.amount,
      source: "kolaybi", provider: "kolaybi", provider_environment: providerEnvironment,
      kolaybi_vault_id: vaultId, provider_type: text(item?.type) || null,
      is_active: true, last_synced_at: now, updated_at: now,
    };
    const { data: existing } = await admin.from("financial_accounts").select("id")
      .eq("source", "kolaybi").eq("provider_environment", providerEnvironment)
      .eq("kolaybi_vault_id", vaultId).maybeSingle();
    if (existing?.id) {
      const { error } = await admin.from("financial_accounts").update(accountData).eq("id", existing.id);
      if (error) throw error;
      return { type: "financial_account", id: existing.id };
    }
    const { data: created, error } = await admin.from("financial_accounts").insert(accountData).select("id").single();
    if (error) throw error;
    return { type: "financial_account", id: created.id };
  }
  if (resource === "vault_transactions") {
    const vaultId = Number(item?._vault_id);
    const transactionableId = Number(item?.id);
    if (!Number.isSafeInteger(vaultId) || !Number.isSafeInteger(transactionableId)) throw new ProviderError("KolayBi finans hareketi kimliği geçerli değil.");
    const direction = number(item?.cash_flow_direction);
    const type = direction < 0 ? "Giden" : direction > 0 ? "Gelen"
      : Array.isArray(item?.vault_destinations) && item.vault_destinations.length ? "Virman" : "Gelen";
    const typeLabel = text(item?.transaction_type?.description || item?.transaction_type?.value || item?.transaction_type?.key);
    const subtypeLabel = text(item?.transaction_subtype?.description || item?.transaction_subtype?.value || item?.transaction_subtype?.key);
    const associates = Array.isArray(item?.associates) ? item.associates : [];
    const projects = Array.isArray(item?.projects) ? item.projects : [];
    const now = new Date().toISOString();
    const transactionData = {
      transaction_no: `KB-${providerEnvironment === "test" ? "TEST" : "LIVE"}-V${vaultId}-T${transactionableId}`,
      account_id: item?._vault_account_id || null, type,
      category: typeLabel || subtypeLabel || "KolayBi Finans",
      amount: Math.abs(number(item?.amount)), description: text(item?.description) || typeLabel || subtypeLabel || "KolayBi finans hareketi",
      reference_no: text(item?.serial_no || item?.transaction_id) || null,
      transaction_date: text(item?.issue_date).slice(0, 10) || new Date().toISOString().slice(0, 10),
      source: "kolaybi", provider: "kolaybi", provider_environment: providerEnvironment,
      provider_vault_id: vaultId, provider_transactionable_id: transactionableId,
      provider_transaction_id: Number(item?.transaction_id) || null,
      provider_transaction_type: typeLabel || null, provider_transaction_subtype: subtypeLabel || null,
      provider_payment_method: text(item?.payment_method?.description || item?.payment_method?.value || item?.payment_method) || null,
      cash_flow_direction: direction || 0, currency: currency(item?.currency),
      exchange_rate: number(item?.exchange_rate) || null, exchange_amount: number(item?.exchange_amount) || null,
      quote_currency: text(item?.quote_currency).toUpperCase() || null,
      cumulative_balance: number(item?.cumulative),
      associate_name: associates.map((value: any) => text(value?.name || value?.full_name)).filter(Boolean).join(", ") || null,
      project_names: projects.map((value: any) => text(value?.name || value?.title)).filter(Boolean).join(", ") || null,
      raw_payload: safePayload(resource, item), last_synced_at: now,
    };
    const { data: existing } = await admin.from("transactions").select("id")
      .eq("source", "kolaybi").eq("provider_environment", providerEnvironment)
      .eq("provider_vault_id", vaultId).eq("provider_transactionable_id", transactionableId).maybeSingle();
    if (existing?.id) {
      const { error } = await admin.from("transactions").update(transactionData).eq("id", existing.id);
      if (error) throw error;
      return { type: "financial_transaction", id: existing.id };
    }
    const { data: created, error } = await admin.from("transactions").insert(transactionData).select("id").single();
    if (error) throw error;
    return { type: "financial_transaction", id: created.id };
  }
  if (resource === "associates") {
    let result: any = null;
    const { data: byProvider } = await admin.from("customers").select("id")
      .eq("kolaybi_contact_id", Number(row.externalId)).is("archived_at", null).maybeSingle();
    result = byProvider;
    if (!result && [10, 11].includes(row.taxIdentity.length)) {
      const { data } = await admin.from("customers").select("id")
        .or(`vergi_no.eq.${row.taxIdentity},tc_no.eq.${row.taxIdentity}`)
        .is("archived_at", null).limit(2);
      if (data?.length === 1) result = data[0];
    }
    if (!result && row.code) {
      const { data } = await admin.from("customers").select("id")
        .eq("customer_code", row.code).is("archived_at", null).limit(2);
      if (data?.length === 1) result = data[0];
    }
    if (!result && text(item?.email)) {
      const { data } = await admin.from("customers").select("id")
        .ilike("email", text(item.email)).is("archived_at", null).limit(2);
      if (data?.length === 1) result = data[0];
    }
    if (result?.id) {
      const invoiceAddress = (Array.isArray(item?.address) ? item.address : []).find((address: any) => address?.address_type === "invoice") || item?.address?.[0];
      await admin.from("customers").update({
        kolaybi_contact_id: Number(row.externalId),
        ...(invoiceAddress?.id ? { kolaybi_address_id: Number(invoiceAddress.id) } : {}),
      }).eq("id", result.id);
      return { type: "customer", id: result.id };
    }
  }
  if (resource === "products") {
    const externalId = Number(row.externalId);
    if (!Number.isSafeInteger(externalId) || externalId <= 0) {
      throw new ProviderError("KolayBi ürün kimliği geçerli değil.");
    }
    const { data: providerProduct } = await admin.from("products_services")
      .select("id,code,approval_status")
      .eq("external_source", "kolaybi")
      .eq("provider_environment", providerEnvironment)
      .eq("kolaybi_product_id", externalId)
      .maybeSingle();
    if (providerProduct?.id) {
      const providerActive = item?.is_active ?? item?.active;
      const approved = providerProduct.approval_status === "approved";
      await admin.from("products_services").update({
        name: row.displayName || row.code || `KolayBi Ürün ${row.externalId}`,
        description: text(item?.description) || null,
        type: productType(item?.product_type),
        unit: productUnit(item?.unit || item?.unit_name),
        purchase_price: number(item?.purchase_price),
        sale_price: number(item?.sale_price),
        tax_rate: number(item?.vat_value),
        stock_quantity: Math.round(number(item?.total_stock_quantity)),
        provider_code: row.code || null,
        provider_barcode: text(item?.barcode) || null,
        purchase_currency: text(item?.purchase_currency).toUpperCase() || null,
        sale_currency: text(item?.sale_currency).toUpperCase() || null,
        provider_active: typeof providerActive === "boolean" ? providerActive : null,
        is_active: approved ? providerActive !== false : false,
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", providerProduct.id);
      return {
        type: "product", id: providerProduct.id,
        matchStatus: approved ? "matched" : providerProduct.approval_status === "rejected" ? "ignored" : "review_required",
        eventType: "product_sync_updated",
      };
    }

    const { data } = row.code
      ? await admin.from("products_services").select("id,code").eq("code", row.code).maybeSingle()
      : { data: null };
    if (data?.id) {
      await admin.from("invoice_product_mappings").upsert({
        product_code: data.code,
        kolaybi_product_id: Number(row.externalId),
        description: row.displayName,
        vat_rate: number(item?.vat_value),
        active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: "product_code" });
      return { type: "product", id: data.id };
    }

    let code = providerProductCode(row, providerEnvironment);
    const { data: codeCollision } = await admin.from("products_services").select("id").eq("code", code).maybeSingle();
    if (codeCollision?.id) code = `${code}-${row.externalId}`;
    const providerActive = item?.is_active ?? item?.active;
    const { data: created, error: createError } = await admin.from("products_services").insert({
      code,
      name: row.displayName || row.code || `KolayBi Ürün ${row.externalId}`,
      description: text(item?.description) || null,
      type: productType(item?.product_type),
      unit: productUnit(item?.unit || item?.unit_name),
      purchase_price: number(item?.purchase_price),
      sale_price: number(item?.sale_price),
      tax_rate: number(item?.vat_value),
      stock_quantity: Math.round(number(item?.total_stock_quantity)),
      min_stock_level: 0,
      is_active: false,
      external_source: "kolaybi",
      provider_environment: providerEnvironment,
      kolaybi_product_id: externalId,
      provider_code: row.code || null,
      provider_barcode: text(item?.barcode) || null,
      purchase_currency: text(item?.purchase_currency).toUpperCase() || null,
      sale_currency: text(item?.sale_currency).toUpperCase() || null,
      provider_active: typeof providerActive === "boolean" ? providerActive : null,
      approval_status: "pending",
      last_synced_at: new Date().toISOString(),
      notes: `KolayBi ${providerEnvironment === "test" ? "test" : "canlı"} ortamından otomatik aktarıldı. Kullanıma açılması için onay gerekir.`,
    }).select("id").single();
    if (createError) throw createError;
    return { type: "product", id: created.id, matchStatus: "review_required", eventType: "product_imported_pending" };
  }
  if (resource === "expense_types") {
    const externalId = Number(row.externalId);
    if (!Number.isSafeInteger(externalId) || externalId <= 0) throw new ProviderError("KolayBi gider tipi kimliği geçerli değil.");
    const now = new Date().toISOString();
    const { data: existingMapping } = await admin.from("expense_type_provider_mappings")
      .select("id,expense_type_id").eq("provider", "kolaybi")
      .eq("provider_environment", providerEnvironment).eq("external_id", externalId).maybeSingle();
    if (existingMapping?.expense_type_id) {
      await admin.from("expense_type_provider_mappings").update({
        provider_name: row.displayName, provider_description: text(item?.description) || null,
        last_synced_at: now, updated_at: now,
      }).eq("id", existingMapping.id);
      return { type: "expense_type", id: existingMapping.expense_type_id };
    }

    const { data: namedType } = await admin.from("expense_types").select("id")
      .ilike("name", row.displayName).limit(1).maybeSingle();
    let expenseTypeId = namedType?.id;
    if (!expenseTypeId) {
      const { data: fallbackCategory } = await admin.from("expense_categories").select("id")
        .eq("name", "Kategorisiz").single();
      const { data: createdType, error: typeError } = await admin.from("expense_types").insert({
        category_id: fallbackCategory.id, name: row.displayName,
        description: text(item?.description) || null, source: "kolaybi", is_active: true,
      }).select("id").single();
      if (typeError) throw typeError;
      expenseTypeId = createdType.id;
    }
    const { error: mappingError } = await admin.from("expense_type_provider_mappings").insert({
      expense_type_id: expenseTypeId, provider: "kolaybi", provider_environment: providerEnvironment,
      external_id: externalId, provider_name: row.displayName,
      provider_description: text(item?.description) || null, last_synced_at: now,
    });
    if (mappingError) throw mappingError;
    return { type: "expense_type", id: expenseTypeId };
  }
  if (resource === "general_expenses") {
    const documentId = Number(row.externalId);
    if (!Number.isSafeInteger(documentId) || documentId <= 0) throw new ProviderError("KolayBi genel gider kimliği geçerli değil.");
    const header = item?.header || {};
    const totals = item?.total || {};
    const payment = item?.payment_plan || {};
    const typeExternalId = Number(item?.financial_action_type_id || 0);
    const { data: typeMapping } = typeExternalId > 0
      ? await admin.from("expense_type_provider_mappings").select("expense_type_id,expense_types(category_id,name,expense_categories(name))")
        .eq("provider", "kolaybi").eq("provider_environment", providerEnvironment)
        .eq("external_id", typeExternalId).maybeSingle()
      : { data: null };
    const joinedType = Array.isArray(typeMapping?.expense_types) ? typeMapping.expense_types[0] : typeMapping?.expense_types;
    const joinedCategory = Array.isArray(joinedType?.expense_categories) ? joinedType.expense_categories[0] : joinedType?.expense_categories;
    const remaining = number(payment?.total_remaining);
    const paid = number(payment?.total_paid);
    const providerStatus = text(item?.commercial_doc_status?.value || item?.commercial_doc_status?.key || item?.commercial_doc_status);
    const loweredStatus = providerStatus.toLowerCase();
    const status = loweredStatus.includes("cancel") ? "İptal"
      : loweredStatus.includes("draft") ? "Taslak"
        : remaining <= 0 ? "Ödendi" : paid > 0 ? "Kısmi Ödendi" : "Bekliyor";
    const issueDate = text(header?.issue_date).slice(0, 10) || new Date().toISOString().slice(0, 10);
    const dueDate = text(header?.due_date).slice(0, 10) || null;
    const subtotal = number(totals?.subtotal ?? totals?.total_amount ?? totals?.grand_total);
    const totalVat = number(totals?.total_vat);
    const expenseData = {
      expense_no: `KB-${providerEnvironment.toUpperCase()}-${documentId}`,
      category: text(joinedCategory?.name) || "Kategorisiz",
      category_id: joinedType?.category_id || null, type_id: typeMapping?.expense_type_id || null,
      description: text(header?.description) || text(joinedType?.name) || `KolayBi genel gider ${documentId}`,
      amount: subtotal, tax: totalVat, expense_date: issueDate, due_date: dueDate,
      vendor: text(header?.associate?.full_name) || null, invoice_no: text(header?.serial_no) || null,
      status, source: "kolaybi", provider_environment: providerEnvironment,
      kolaybi_document_id: documentId,
      kolaybi_financial_action_type_id: typeExternalId || null,
      provider_document_no: text(header?.serial_no) || null, provider_status: providerStatus || null,
      e_document_status: text(item?.e_document_status) || null,
      payment_status: text(payment?.payment_status_value) || null,
      currency: currency(item?.currency), balance: remaining,
      provider_total: number(totals?.grand_total ?? totals?.total_amount), last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { data: existingExpense } = await admin.from("expenses").select("id")
      .eq("source", "kolaybi").eq("provider_environment", providerEnvironment)
      .eq("kolaybi_document_id", documentId).maybeSingle();
    if (existingExpense?.id) {
      const { error } = await admin.from("expenses").update(expenseData).eq("id", existingExpense.id);
      if (error) throw error;
      return { type: "general_expense", id: existingExpense.id };
    }
    const { data: createdExpense, error } = await admin.from("expenses").insert(expenseData).select("id").single();
    if (error) throw error;
    return { type: "general_expense", id: createdExpense.id };
  }
  if (resource === "sales_invoices") {
    const profile = eDocumentProfile(item);
    let customerId: string | null = null;
    if ([10, 11].includes(row.taxIdentity.length)) {
      const { data: customers } = await admin.from("customers").select("id")
        .or(`vergi_no.eq.${row.taxIdentity},tc_no.eq.${row.taxIdentity}`)
        .is("archived_at", null).limit(2);
      if (customers?.length === 1) customerId = customers[0].id;
    }
    const invoiceFilter = row.code
      ? `kolaybi_document_id.eq.${row.externalId},invoice_no.eq.${row.code},official_invoice_no.eq.${row.code},kolaybi_invoice_no.eq.${row.code}`
      : `kolaybi_document_id.eq.${row.externalId}`;
    const { data } = await admin.from("sales_invoices")
      .select("id,customer_id,grand_total,due_date,payment_status")
      .or(invoiceFilter).limit(1).maybeSingle();
    customerId = data?.customer_id || customerId;
    if (profile && customerId) await updateCustomerEDocumentProfile(admin, customerId, profile, providerEnvironment);
    if (data?.id) {
      const payment = item?.payment_plan || item?.payment || {};
      const hasPayment = item?.payment_plan !== undefined || item?.payment !== undefined || item?.balance !== undefined;
      const remaining = number(payment?.remaining_amount ?? payment?.balance ?? item?.balance);
      const total = number(item?.total?.grand_total ?? item?.total ?? item?.grand_total ?? data.grand_total);
      const paymentStatus = !hasPayment ? data.payment_status
        : remaining <= 0.01 ? "Ödendi"
          : total > 0 && remaining < total ? "Kısmi Ödendi"
            : data.due_date && data.due_date < new Date().toISOString().slice(0, 10) ? "Gecikmiş" : "Bekliyor";
      const { error } = await admin.rpc("rex_reconcile_sales_invoice_from_provider", {
        p_invoice_id: data.id,
        p_provider_status: text(item?.commercial_doc_status || item?.status) || null,
        p_kolaybi_status: text(item?.e_document_status || item?.status) || null,
        p_e_invoice_status: text(item?.e_document_status) || null,
        p_has_profile: Boolean(profile),
        p_document_type: profile?.documentType || null,
        p_document_scenario: profile?.scenario || null,
        p_official_uuid: profile ? text(invoiceEDocument(item)?.uuid) || null : null,
        p_official_invoice_no: profile ? text(invoiceEDocument(item)?.no || invoiceEDocument(item)?.invoice_no) || null : null,
        p_payment_status: paymentStatus || null,
      });
      if (error) throw error;
      return { type: "sales_invoice", id: data.id };
    }
  }
  if (resource === "purchase_invoices") {
    const { data } = await admin.from("purchase_invoices").select("id").or(`provider_document_id.eq.${row.externalId},invoice_no.eq.${row.code}`).limit(1).maybeSingle();
    if (data?.id) return { type: "purchase_invoice", id: data.id };
  }
  return null;
}

async function accessToken(baseUrl: string, apiKey: string, channel: string) {
  const json = await providerRequest(`${baseUrl}/access_token`, {
    method: "POST",
    headers: { Channel: channel, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ api_key: apiKey }),
  });
  const token = json?.data?.access_token || json?.data?.token || json?.data;
  if (typeof token !== "string" || !token) throw new ProviderError("KolayBi erişim anahtarı alınamadı.");
  return token;
}

function endpoint(resource: Resource) {
  if (resource === "associates") return "/associates";
  if (resource === "products") return "/products";
  if (resource === "expense_types") return "/financial_action_types";
  if (resource === "sales_invoices") return "/invoices?type=sale_invoice&has_products=true";
  if (resource === "purchase_invoices") return "/invoices?type=purchase_invoice&has_products=true";
  if (resource === "vaults") return "/vaults";
  return "/invoices?type=general_expense";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!["GET", "POST"].includes(req.method || "")) return res.status(405).json({ error: "Yalnızca GET ve POST desteklenir." });
  const bearer = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : "";
  const cronSecret = process.env.CRON_SECRET || "";
  const cronMode = Boolean(cronSecret && bearer === cronSecret && req.method === "GET" && req.query.mode === "active");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!bearer) return res.status(401).json({ error: "Oturum doğrulanamadı." });
  if (!supabaseUrl || !anonKey || !serviceKey) return res.status(500).json({ error: "Sunucu veritabanı ayarları eksik." });

  let actor: { id: string | null; email: string } = { id: null, email: "system@rex.local" };
  if (!cronMode) {
    const userDb = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${bearer}` } }, auth: { persistSession: false, autoRefreshToken: false } });
    const { data: userData, error: userError } = await userDb.auth.getUser(bearer);
    if (userError || !userData.user) return res.status(401).json({ error: "Oturum süresi dolmuş." });
    const requiredLevel = req.method === "POST" ? "manage" : "view";
    const { data: allowed } = await userDb.rpc("rex_has_permission" as any, { p_key: req.method === "POST" ? "integrations.connections" : "integrations.monitoring", p_required: requiredLevel } as any);
    if (!allowed) return res.status(403).json({ error: "KolayBi entegrasyon işlemi için yetkiniz yok." });
    actor = { id: userData.user.id, email: userData.user.email || "" };
  }

  const apiKey = process.env.KOLAYBI_API_KEY;
  const channel = process.env.KOLAYBI_CHANNEL;
  let companyId = text(process.env.KOLAYBI_COMPANY_ID);
  const baseUrl = (process.env.KOLAYBI_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
  const providerEnvironment: "test" | "live" = baseUrl.includes("sandbox") ? "test" : "live";
  if (!apiKey || !channel) return res.status(422).json({ error: "KolayBi API anahtarı ve Channel bilgileri tamamlanmalıdır." });

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const updatePartner = async (success: boolean, errorMessage?: string | null, synced = false) => {
    const now = new Date().toISOString();
    await admin.from("integration_partners").update({
      environment: providerEnvironment,
      status: success ? (providerEnvironment === "test" ? "testing" : "active") : "error",
      ...(synced ? { last_sync_at: now } : {}),
      ...(success ? { last_success_at: now, last_error: null } : { last_error: text(errorMessage).slice(0, 500) || "KolayBi bağlantısı doğrulanamadı." }),
      ...(actor.id ? { updated_by: actor.id } : {}),
      updated_at: now,
    }).eq("code", "KOLAYBI");
  };

  try {
    const token = await accessToken(baseUrl, apiKey, channel);
    if (req.method === "GET" && !cronMode) {
      const companies = await providerRequest(`${baseUrl}/companies`, { method: "GET", headers: { Channel: channel, Authorization: `Bearer ${token}`, Accept: "application/json" } });
      return res.status(200).json({ success: true, environment: providerEnvironment, companies: listFrom(companies) });
    }

    const requested = text(cronMode ? "all" : req.body?.resource || "all");
    const resources: Resource[] = requested === "all" ? [...SUPPORTED_RESOURCES] : SUPPORTED_RESOURCES.includes(requested as Resource) ? [requested as Resource] : [];
    if (!resources.length) return res.status(400).json({ error: "Desteklenmeyen senkronizasyon kaynağı." });
    if (!companyId && resources.includes("sales_invoices")) {
      const companyJson = await providerRequest(`${baseUrl}/companies`, {
        method: "GET", headers: { Channel: channel, Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const companies = listFrom(companyJson);
      if (companies.length === 1) companyId = text(companies[0]?.id || companies[0]?.company_id);
      if (!companyId) throw new ProviderError("E-belge karşılaştırması için KolayBi şirket kimliği belirlenemedi.");
    }

    const hourKey = new Date().toISOString().slice(0, 13);
    const idempotencyKey = text(cronMode ? `kolaybi-office:active:${hourKey}` : req.body?.idempotencyKey || `kolaybi-office:${crypto.randomUUID()}`);
    const { data: existing } = await admin.from("kolaybi_sync_runs").select("*").eq("idempotency_key", idempotencyKey).maybeSingle();
    if (existing) return res.status(200).json({ success: existing.status === "completed", alreadyProcessed: true, run: existing });
    const { data: run, error: runError } = await admin.from("kolaybi_sync_runs").insert({ resource_type: requested, provider_environment: providerEnvironment, idempotency_key: idempotencyKey, started_by: actor.id }).select().single();
    if (runError) throw runError;
    await admin.from("kolaybi_sync_events").insert({ run_id: run.id, resource_type: requested, provider_environment: providerEnvironment, event_type: "sync_started", status: "info", summary: cronMode ? "KolayBi otomatik aktif akış senkronizasyonu başlatıldı" : "KolayBi ofis senkronizasyonu başlatıldı", actor_id: actor.id, actor_email: actor.email });

    let received = 0; let matched = 0; let review = 0; let failed = 0;
    const errors: string[] = [];
    for (const resource of resources) {
      try {
        let records: any[] = [];
        if (resource === "vault_transactions") {
          const { data: vaults, error: vaultError } = await admin.from("financial_accounts")
            .select("id,account_name,kolaybi_vault_id").eq("source", "kolaybi")
            .eq("provider_environment", providerEnvironment).not("kolaybi_vault_id", "is", null).limit(100);
          if (vaultError) throw vaultError;
          const headers = { Channel: channel, Authorization: `Bearer ${token}`, Accept: "application/json" };
          for (let index = 0; index < (vaults || []).length; index += 5) {
            const batch = (vaults || []).slice(index, index + 5);
            const results = await Promise.allSettled(batch.map((vault: any) => providerRequest(`${baseUrl}/vaults/${vault.kolaybi_vault_id}/transactions`, { method: "GET", headers })));
            results.forEach((result, resultIndex) => {
              if (result.status === "rejected") {
                errors.push(`vault ${batch[resultIndex].kolaybi_vault_id}: ${String(result.reason?.message || result.reason).slice(0, 200)}`);
                failed += 1;
                return;
              }
              records.push(...transactionablesFrom(result.value).map((item: any) => ({ ...item, _vault_id: batch[resultIndex].kolaybi_vault_id, _vault_name: batch[resultIndex].account_name, _vault_account_id: batch[resultIndex].id })));
            });
          }
          records = records.slice(0, 3000);
        } else {
          const json = await providerRequest(`${baseUrl}${endpoint(resource)}`, { method: "GET", headers: { Channel: channel, Authorization: `Bearer ${token}`, Accept: "application/json" } });
          records = listFrom(json);
          if (resource === "sales_invoices" && companyId) {
            const query = new URLSearchParams({ company_id: String(companyId), direction: "outbound" });
            const officialJson = await providerRequest(`${baseUrl}/e_document/invoices?${query.toString()}`, {
              method: "GET", headers: { Channel: channel, Authorization: `Bearer ${token}`, Accept: "application/json" },
            });
            const officialByDocument = new Map(
              listFrom(officialJson).map((official: any) => [
                text(official?.document_id || official?.id), official,
              ]),
            );
            records = records.map((record: any) => ({
              ...record,
              _e_document: officialByDocument.get(text(record?.commercial_doc_id || record?.document_id || record?.id)) || null,
            }));
          }
        }
        received += records.length;
        for (const item of records) {
          const row = normalized(resource, item);
          if (!row) { failed += 1; continue; }
          const local = await findLocal(admin, resource, item, row, providerEnvironment);
          const matchStatus = local?.matchStatus || (local ? "matched" : "review_required");
          if (matchStatus === "matched") matched += 1;
          else if (matchStatus === "review_required") review += 1;
          const { error } = await admin.from("kolaybi_master_records").upsert({
            resource_type: resource === "sales_invoices" ? "sales_invoice"
              : resource === "purchase_invoices" ? "purchase_invoice"
                : resource === "expense_types" ? "expense_type"
                  : resource === "general_expenses" ? "general_expense"
                    : resource === "vaults" ? "vault"
                      : resource === "vault_transactions" ? "vault_transaction" : resource.slice(0, -1),
            external_id: row.externalId,
            provider_environment: providerEnvironment,
            local_entity_type: local?.type || null,
            local_entity_id: local?.id || null,
            match_status: matchStatus,
            display_name: row.displayName || null,
            external_code: row.code || null,
            tax_identity: row.taxIdentity || null,
            currency: row.currency,
            amount: row.amount,
            payload: row.payload,
            last_seen_at: new Date().toISOString(),
          }, { onConflict: "provider_environment,resource_type,external_id" });
          if (error) { failed += 1; errors.push(error.message); continue; }
          await admin.from("kolaybi_sync_events").insert({
            run_id: run.id, resource_type: resource, external_id: row.externalId,
            provider_environment: providerEnvironment,
            event_type: local?.eventType || (local ? "record_matched" : "review_required"),
            status: matchStatus === "matched" ? "success" : "warning",
            summary: local?.eventType === "product_imported_pending"
              ? `${row.displayName || row.externalId} pasif ürün kartı olarak aktarıldı; onay bekliyor`
              : local?.eventType === "product_sync_updated"
                ? `${row.displayName || row.externalId} ürün kartı güncellendi`
                : local ? `${row.displayName || row.externalId} TMS kaydıyla eşleştirildi` : `${row.displayName || row.externalId} için kullanıcı kontrolü gerekiyor`,
            actor_id: actor.id, actor_email: actor.email,
          });
        }
      } catch (error: any) {
        failed += 1;
        errors.push(`${resource}: ${String(error?.message || error).slice(0, 300)}`);
      }
    }
    const status = failed === 0 ? "completed" : received > 0 ? "partial" : "failed";
    const { data: completed } = await admin.from("kolaybi_sync_runs").update({ status, received_count: received, matched_count: matched, review_count: review, failed_count: failed, last_error: errors[0] || null, completed_at: new Date().toISOString(), metadata: { resources, automatic: cronMode, direction: "inbound" } }).eq("id", run.id).select().single();
    await admin.from("kolaybi_sync_events").insert({ run_id: run.id, resource_type: requested, provider_environment: providerEnvironment, event_type: status === "failed" ? "sync_failed" : "sync_completed", status: status === "completed" ? "success" : status === "partial" ? "warning" : "error", summary: `Senkronizasyon tamamlandı: ${received} kayıt, ${matched} eşleşme, ${review} kontrol`, metadata: { errors: errors.slice(0, 10), provider_environment: providerEnvironment, automatic: cronMode }, actor_id: actor.id, actor_email: actor.email });
    await updatePartner(status === "completed", errors[0] || null, true);
    return res.status(status === "failed" ? 502 : 200).json({ success: status !== "failed", run: completed, errors: errors.slice(0, 10) });
  } catch (error: any) {
    await updatePartner(false, String(error?.message || error), req.method === "POST" || cronMode);
    return res.status(error?.status === 401 ? 401 : 502).json({ error: String(error?.message || "KolayBi bağlantısı tamamlanamadı.").slice(0, 500) });
  }
}
