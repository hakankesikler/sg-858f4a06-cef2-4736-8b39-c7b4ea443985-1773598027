import type { SupabaseClient } from "@supabase/supabase-js";
import { assertKolayBiSyncEnabled } from "@/lib/kolaybi-live-gate";

const DEFAULT_BASE_URL = "https://ofis-sandbox-api.kolaybi.com/kolaybi/v1";
const PAGE_SIZE = 100;
const MAX_PAGES = 40;
const VALID_SCENARIOS = ["EARSIVFATURA", "TEMELFATURA", "TICARIFATURA", "KAMU"] as const;

type Scenario = (typeof VALID_SCENARIOS)[number];

export type CustomerEDocumentProfile = {
  documentType: "e_archive" | "e_invoice";
  scenario: Scenario;
  source: string;
  environment: "test" | "live";
  evidenceAt: string;
};

type ReviewableError = Error & { reviewRequired?: boolean };

function reviewError(message: string) {
  const error = new Error(message) as ReviewableError;
  error.reviewRequired = true;
  return error;
}

async function readJson(response: Response) {
  const body = await response.text();
  let parsed: any = {};
  try { parsed = body ? JSON.parse(body) : {}; } catch { parsed = { message: body }; }
  if (!response.ok) {
    throw new Error(String(parsed?.message || parsed?.error?.message || `KolayBi HTTP ${response.status}`).slice(0, 500));
  }
  return parsed;
}

function listFrom(json: any): any[] {
  if (Array.isArray(json?.data?.data)) return json.data.data;
  if (Array.isArray(json?.data?.items)) return json.data.items;
  if (Array.isArray(json?.data?.results)) return json.data.results;
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.items)) return json.items;
  if (Array.isArray(json?.results)) return json.results;
  return [];
}

function lastPageFrom(json: any) {
  const value = Number(json?.data?.last_page || json?.data?.meta?.last_page || json?.meta?.last_page || 0);
  return Number.isFinite(value) && value > 0 ? Math.min(Math.trunc(value), MAX_PAGES) : null;
}

function text(value: unknown) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function digits(value: unknown) {
  return text(value).replace(/\D/g, "");
}

function commercialDocumentId(value: any) {
  return Number(value?.commercial_doc_id || value?.document_id || value?.id || 0);
}

function commercialSerialNo(value: any) {
  return text(value?.header?.serial_no || value?.serial_no || value?.invoice_no).toUpperCase();
}

function officialDocumentId(value: any) {
  return Number(value?.document_id || value?.commercial_doc_id || value?.id || 0);
}

function officialSerialNo(value: any) {
  return text(value?.no || value?.invoice_no || value?.serial_no).toUpperCase();
}

function profileFromOfficialInvoice(value: any, environment: "test" | "live"): CustomerEDocumentProfile | null {
  const scenario = text(value?.scenario || value?.document_scenario).toUpperCase() as Scenario;
  const officialIdentity = text(value?.uuid || value?.ettn || value?.no || value?.invoice_no);
  if (!officialIdentity || !VALID_SCENARIOS.includes(scenario)) return null;
  const rawEvidence = text(value?.issue_date || value?.invoice_date);
  const parsedEvidence = rawEvidence ? new Date(rawEvidence) : new Date();
  return {
    documentType: scenario === "EARSIVFATURA" ? "e_archive" : "e_invoice",
    scenario,
    source: "kolaybi_official_invoice_on_demand",
    environment,
    evidenceAt: Number.isNaN(parsedEvidence.getTime()) ? new Date().toISOString() : parsedEvidence.toISOString(),
  };
}

function storedProfile(customer: any, environment: "test" | "live"): CustomerEDocumentProfile | null {
  const documentType = customer?.kolaybi_e_document_type;
  const scenario = text(customer?.kolaybi_e_document_scenario).toUpperCase() as Scenario;
  if (
    !["e_archive", "e_invoice"].includes(documentType) ||
    !VALID_SCENARIOS.includes(scenario) ||
    customer?.kolaybi_e_document_environment !== environment
  ) return null;
  return {
    documentType,
    scenario: documentType === "e_archive" ? "EARSIVFATURA" : scenario === "EARSIVFATURA" ? "TEMELFATURA" : scenario,
    source: text(customer?.kolaybi_e_document_source) || "stored_customer_profile",
    environment,
    evidenceAt: text(customer?.kolaybi_e_document_evidence_at) || new Date().toISOString(),
  };
}

function sandboxIdentityProfile(customer: any): CustomerEDocumentProfile | null {
  const identity = text(customer?.vergi_no || customer?.tc_no).replace(/\D/g, "");
  const now = new Date().toISOString();
  if (identity === "1020304050" || identity === "12345678901") {
    return { documentType: "e_invoice", scenario: "TICARIFATURA", source: "kolaybi_sandbox_test_identity", environment: "test", evidenceAt: now };
  }
  if (identity === "11111111111") {
    return { documentType: "e_archive", scenario: "EARSIVFATURA", source: "kolaybi_sandbox_test_identity", environment: "test", evidenceAt: now };
  }
  return null;
}

async function providerRequest(url: string, headers: Record<string, string>, init: RequestInit = {}) {
  return readJson(await fetch(url, { ...init, headers: { ...headers, ...(init.headers || {}) }, signal: AbortSignal.timeout(25_000) }));
}

async function pagedProviderList(
  baseUrl: string,
  path: string,
  params: URLSearchParams,
  headers: Record<string, string>,
) {
  const rows = new Map<string, any>();
  const seenPages = new Set<string>();
  let page = 1;
  let lastPage: number | null = null;
  do {
    const pageParams = new URLSearchParams(params);
    pageParams.set("page", String(page));
    pageParams.set("per_page", String(PAGE_SIZE));
    const json = await providerRequest(`${baseUrl}${path}?${pageParams.toString()}`, headers);
    const pageRows = listFrom(json);
    const rowKey = (row: any) => text(
      row?.commercial_doc_id || row?.document_id || row?.id || row?.uuid ||
      row?.no || row?.invoice_no || row?.serial_no || row?.header?.serial_no,
    );
    const fingerprint = `${pageRows.length}:${rowKey(pageRows[0])}:${rowKey(pageRows.at(-1))}`;
    if (seenPages.has(fingerprint)) break;
    seenPages.add(fingerprint);
    pageRows.forEach((row, index) => rows.set(rowKey(row) || `${page}:${index}`, row));
    const reportedLastPage = lastPageFrom(json);
    if (reportedLastPage) lastPage = Math.max(lastPage || 1, reportedLastPage);
    if (pageRows.length < PAGE_SIZE) break;
    page += 1;
  } while (page <= (lastPage || MAX_PAGES) && page <= MAX_PAGES);
  return [...rows.values()];
}

async function resolveCompanyId(baseUrl: string, headers: Record<string, string>) {
  const configured = Number(process.env.KOLAYBI_COMPANY_ID || 0);
  if (Number.isSafeInteger(configured) && configured > 0) return configured;
  const companies = listFrom(await providerRequest(`${baseUrl}/companies`, headers));
  const companyId = Number(companies[0]?.id || companies[0]?.company_id || 0);
  if (!Number.isSafeInteger(companyId) || companyId <= 0) throw new Error("KolayBi şirket kimliği alınamadı.");
  return companyId;
}

export async function resolveCustomerEDocumentProfile(input: {
  admin: SupabaseClient<any>;
  customerId: string;
}): Promise<CustomerEDocumentProfile> {
  const { admin, customerId } = input;
  const { data: customer, error: customerError } = await admin.from("customers")
    .select("id,name,company,vergi_no,tc_no,kolaybi_contact_id,kolaybi_e_document_type,kolaybi_e_document_scenario,kolaybi_e_document_source,kolaybi_e_document_environment,kolaybi_e_document_evidence_at")
    .eq("id", customerId).single();
  if (customerError || !customer) throw new Error("Cari bulunamadı.");

  const apiKey = process.env.KOLAYBI_API_KEY || "";
  const channel = process.env.KOLAYBI_CHANNEL || "";
  const baseUrl = (process.env.KOLAYBI_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
  const environment: "test" | "live" = baseUrl.includes("sandbox") ? "test" : "live";
  if (!apiKey || !channel) throw new Error("KolayBi bağlantı bilgileri tamamlanmalıdır.");
  assertKolayBiSyncEnabled(baseUrl);

  const current = storedProfile(customer, environment);
  if (current) return current;
  const sandbox = environment === "test" ? sandboxIdentityProfile(customer) : null;
  if (sandbox) {
    const now = new Date().toISOString();
    const { error } = await admin.from("customers").update({
      kolaybi_e_document_type: sandbox.documentType,
      kolaybi_e_document_scenario: sandbox.scenario,
      kolaybi_e_document_source: sandbox.source,
      kolaybi_e_document_environment: sandbox.environment,
      kolaybi_e_document_evidence_at: sandbox.evidenceAt,
      kolaybi_e_document_checked_at: now,
      updated_at: now,
    }).eq("id", customerId);
    if (error) throw error;
    return sandbox;
  }

  const contactId = Number(customer.kolaybi_contact_id || 0);
  if (!Number.isSafeInteger(contactId) || contactId <= 0) {
    throw reviewError("Cari KolayBi ile henüz eşleşmemiş. Önce cari eşleştirmesi tamamlanmalıdır.");
  }

  const tokenJson = await readJson(await fetch(`${baseUrl}/access_token`, {
    method: "POST",
    headers: { Channel: channel, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ api_key: apiKey }),
    signal: AbortSignal.timeout(25_000),
  }));
  const token = tokenJson?.data?.access_token || tokenJson?.data?.token || tokenJson?.data;
  if (typeof token !== "string" || !token) throw new Error("KolayBi erişim anahtarı alınamadı.");
  const headers = { Channel: channel, Authorization: `Bearer ${token}`, Accept: "application/json" };
  const companyId = await resolveCompanyId(baseUrl, headers);

  const syncDays = Math.min(Math.max(Number(process.env.KOLAYBI_SALES_PROFILE_SYNC_DAYS || 1825), 90), 3650);
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - syncDays * 24 * 60 * 60 * 1_000);
  const commercialQuery = new URLSearchParams({
    type: "sale_invoice",
    associate_id: String(contactId),
    has_products: "false",
    start_date: startDate.toISOString().slice(0, 10),
    end_date: endDate.toISOString().slice(0, 10),
  });
  const customerIdentity = digits(customer.vergi_no || customer.tc_no);
  const commercialReceived = await pagedProviderList(baseUrl, "/invoices", commercialQuery, headers);
  const commercialRows = commercialReceived
    .filter((row) => {
      const returnedAssociateId = Number(row?.associate_id || row?.contact_id || row?.header?.associate?.id || 0);
      const returnedIdentity = digits(row?.header?.associate?.identity_no || row?.associate?.identity_no);
      if (returnedAssociateId > 0 && returnedAssociateId !== contactId) return false;
      return !customerIdentity || !returnedIdentity || returnedIdentity === customerIdentity;
    })
    .sort((left, right) => text(right?.header?.issue_date || right?.issue_date).localeCompare(text(left?.header?.issue_date || left?.issue_date)));

  console.info("[kolaybi:customer-e-document] commercial history scanned", {
    customerId,
    contactId,
    received: commercialReceived.length,
    matched: commercialRows.length,
  });

  const documentIds = new Set(
    commercialRows.map(commercialDocumentId).filter((value) => Number.isSafeInteger(value) && value > 0),
  );
  const serialNos = new Set(commercialRows.map(commercialSerialNo).filter(Boolean));

  let resolved: CustomerEDocumentProfile | null = null;
  if (commercialRows.length > 0) {
    const partyName = text(customer.company || customer.name);
    const officialByPartyQuery = new URLSearchParams({
      company_id: String(companyId),
      direction: "outbound",
      party_name: partyName,
      min_issue_date: startDate.toISOString().slice(0, 10),
      max_issue_date: endDate.toISOString().slice(0, 10),
    });
    const officialByParty = (await pagedProviderList(baseUrl, "/e_document/invoices", officialByPartyQuery, headers))
      .filter((row) => documentIds.has(officialDocumentId(row)) || serialNos.has(officialSerialNo(row)))
      .sort((left, right) => text(right?.issue_date || right?.invoice_date).localeCompare(text(left?.issue_date || left?.invoice_date)));
    resolved = officialByParty.map((row) => profileFromOfficialInvoice(row, environment)).find(Boolean) || null;
  }

  // Some KolayBi accounts do not apply party_name consistently. In that case,
  // query recent invoices by their verified commercial document IDs in small batches.
  const fallbackCandidates = resolved ? [] : commercialRows.slice(0, 20);
  for (let index = 0; index < fallbackCandidates.length && !resolved; index += 5) {
    const batch = fallbackCandidates.slice(index, index + 5);
    const results = await Promise.all(batch.map(async (commercial) => {
      const documentId = commercialDocumentId(commercial);
      if (!Number.isSafeInteger(documentId) || documentId <= 0) return null;
      const officialQuery = new URLSearchParams({
        company_id: String(companyId),
        direction: "outbound",
        document_id: String(documentId),
      });
      const officialRows = listFrom(await providerRequest(`${baseUrl}/e_document/invoices?${officialQuery.toString()}`, headers));
      return officialRows.find((row) => officialDocumentId(row) === documentId) || null;
    }));
    resolved = results.map((row) => profileFromOfficialInvoice(row, environment)).find(Boolean) || null;
  }

  if (!resolved) {
    console.warn("[kolaybi:customer-e-document] official history not resolved", {
      customerId,
      contactId,
      commercialReceived: commercialReceived.length,
      commercialMatched: commercialRows.length,
      candidateDocuments: documentIds.size,
    });
    throw reviewError(
      "KolayBi'de bu cari için resmî e-belge geçmişi bulunamadı. E-Fatura/E-Arşiv türü çalışan tarafından tahmin edilmeden önce KolayBi cari mükellefiyet kaydı kontrol edilmelidir.",
    );
  }

  const now = new Date().toISOString();
  const { error: updateError } = await admin.from("customers").update({
    kolaybi_e_document_type: resolved.documentType,
    kolaybi_e_document_scenario: resolved.scenario,
    kolaybi_e_document_source: resolved.source,
    kolaybi_e_document_environment: resolved.environment,
    kolaybi_e_document_evidence_at: resolved.evidenceAt,
    kolaybi_e_document_checked_at: now,
    updated_at: now,
  }).eq("id", customerId);
  if (updateError) throw updateError;
  return resolved;
}
