import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_BASE_URL = "https://ofis-sandbox-api.kolaybi.com/kolaybi/v1";
const SUPPORTED_RESOURCES = ["associates", "products", "sales_invoices", "purchase_invoices"] as const;
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

function safePayload(resource: Resource, item: any) {
  if (resource === "associates") {
    return {
      id: item?.id, code: item?.code, name: item?.name, surname: item?.surname,
      identity_no: item?.identity_no, associate_type: item?.associate_type,
      email: item?.email, phone: item?.phone, country: item?.country,
      address: Array.isArray(item?.address) ? item.address.slice(0, 10) : [],
      balances: Array.isArray(item?.balances) ? item.balances.slice(0, 10) : [],
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
      tags: Array.isArray(item?.tags) ? item.tags.slice(0, 20) : [],
    };
  }
  return {
    id: item?.id, document_id: item?.document_id, uuid: item?.uuid,
    serial_no: item?.serial_no, invoice_no: item?.invoice_no,
    type: item?.type, status: item?.status, issue_date: item?.issue_date || item?.order_date,
    due_date: item?.due_date, currency: item?.currency,
    total: item?.total ?? item?.grand_total, balance: item?.balance,
    associate_id: item?.associate_id || item?.contact_id,
    description: item?.description,
  };
}

function normalized(resource: Resource, item: any) {
  const payload = safePayload(resource, item);
  const externalId = text(item?.id || item?.document_id || item?.uuid || item?.serial_no || item?.invoice_no);
  if (!externalId) return null;
  if (resource === "associates") {
    const name = [text(item?.name), text(item?.surname)].filter(Boolean).join(" ");
    const balance = Array.isArray(item?.balances) ? item.balances[0] : null;
    return { externalId, displayName: name || text(item?.code), code: text(item?.code), taxIdentity: digits(item?.identity_no), currency: text(balance?.currency).toUpperCase() || null, amount: number(balance?.balance), payload };
  }
  if (resource === "products") {
    return { externalId, displayName: text(item?.name), code: text(item?.code), taxIdentity: "", currency: text(item?.sale_currency || item?.purchase_currency).toUpperCase() || null, amount: number(item?.sale_price || item?.purchase_price), payload };
  }
  return {
    externalId,
    displayName: text(item?.serial_no || item?.invoice_no || item?.document_no || `Fatura ${externalId}`),
    code: text(item?.serial_no || item?.invoice_no || item?.document_no),
    taxIdentity: "",
    currency: text(item?.currency).toUpperCase() || "TRY",
    amount: number(item?.grand_total || item?.total || item?.payable_amount),
    payload,
  };
}

async function findLocal(admin: any, resource: Resource, item: any, row: ReturnType<typeof normalized>) {
  if (!row) return null;
  if (resource === "associates") {
    let result: any = null;
    const { data: byProvider } = await admin.from("customers").select("id").eq("kolaybi_contact_id", Number(row.externalId)).maybeSingle();
    result = byProvider;
    if (!result && [10, 11].includes(row.taxIdentity.length)) {
      const { data } = await admin.from("customers").select("id").or(`vergi_no.eq.${row.taxIdentity},tc_no.eq.${row.taxIdentity}`).limit(1).maybeSingle();
      result = data;
    }
    if (!result && text(item?.email)) {
      const { data } = await admin.from("customers").select("id").ilike("email", text(item.email)).limit(1).maybeSingle();
      result = data;
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
    const { data } = await admin.from("products_services").select("id,code").eq("code", row.code).maybeSingle();
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
  }
  if (resource === "sales_invoices") {
    const { data } = await admin.from("sales_invoices").select("id").or(`kolaybi_document_id.eq.${row.externalId},invoice_no.eq.${row.code}`).limit(1).maybeSingle();
    if (data?.id) return { type: "sales_invoice", id: data.id };
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
  if (resource === "sales_invoices") return "/invoices?type=sale_invoice&has_products=true";
  return "/invoices?type=purchase_invoice&has_products=true";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!["GET", "POST"].includes(req.method || "")) return res.status(405).json({ error: "Yalnızca GET ve POST desteklenir." });
  const bearer = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : "";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!bearer) return res.status(401).json({ error: "Oturum doğrulanamadı." });
  if (!supabaseUrl || !anonKey || !serviceKey) return res.status(500).json({ error: "Sunucu veritabanı ayarları eksik." });

  const userDb = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${bearer}` } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: userError } = await userDb.auth.getUser(bearer);
  if (userError || !userData.user) return res.status(401).json({ error: "Oturum süresi dolmuş." });
  const requiredLevel = req.method === "POST" ? "manage" : "view";
  const { data: allowed } = await userDb.rpc("rex_has_permission" as any, { p_key: req.method === "POST" ? "integrations.connections" : "integrations.monitoring", p_required: requiredLevel } as any);
  if (!allowed) return res.status(403).json({ error: "KolayBi entegrasyon işlemi için yetkiniz yok." });

  const apiKey = process.env.KOLAYBI_API_KEY;
  const channel = process.env.KOLAYBI_CHANNEL;
  const baseUrl = (process.env.KOLAYBI_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
  if (!apiKey || !channel) return res.status(422).json({ error: "KolayBi API anahtarı ve Channel bilgileri tamamlanmalıdır." });

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const updatePartner = async (success: boolean, errorMessage?: string | null, synced = false) => {
    const now = new Date().toISOString();
    await admin.from("integration_partners").update({
      environment: baseUrl.includes("sandbox") ? "test" : "live",
      status: success ? (baseUrl.includes("sandbox") ? "testing" : "active") : "error",
      ...(synced ? { last_sync_at: now } : {}),
      ...(success ? { last_success_at: now, last_error: null } : { last_error: text(errorMessage).slice(0, 500) || "KolayBi bağlantısı doğrulanamadı." }),
      updated_by: userData.user.id,
      updated_at: now,
    }).eq("code", "KOLAYBI");
  };

  try {
    const token = await accessToken(baseUrl, apiKey, channel);
    if (req.method === "GET") {
      const companies = await providerRequest(`${baseUrl}/companies`, { method: "GET", headers: { Channel: channel, Authorization: `Bearer ${token}`, Accept: "application/json" } });
      await updatePartner(true);
      return res.status(200).json({ success: true, environment: baseUrl.includes("sandbox") ? "test" : "live", companies: listFrom(companies) });
    }

    const requested = text(req.body?.resource || "all");
    const resources: Resource[] = requested === "all" ? [...SUPPORTED_RESOURCES] : SUPPORTED_RESOURCES.includes(requested as Resource) ? [requested as Resource] : [];
    if (!resources.length) return res.status(400).json({ error: "Desteklenmeyen senkronizasyon kaynağı." });

    const idempotencyKey = text(req.body?.idempotencyKey || `kolaybi-office:${crypto.randomUUID()}`);
    const { data: existing } = await admin.from("kolaybi_sync_runs").select("*").eq("idempotency_key", idempotencyKey).maybeSingle();
    if (existing) return res.status(200).json({ success: existing.status === "completed", alreadyProcessed: true, run: existing });
    const { data: run, error: runError } = await admin.from("kolaybi_sync_runs").insert({ resource_type: requested, idempotency_key: idempotencyKey, started_by: userData.user.id }).select().single();
    if (runError) throw runError;
    await admin.from("kolaybi_sync_events").insert({ run_id: run.id, resource_type: requested, event_type: "sync_started", status: "info", summary: "KolayBi ofis senkronizasyonu başlatıldı", actor_id: userData.user.id, actor_email: userData.user.email });

    let received = 0; let matched = 0; let review = 0; let failed = 0;
    const errors: string[] = [];
    for (const resource of resources) {
      try {
        const json = await providerRequest(`${baseUrl}${endpoint(resource)}`, { method: "GET", headers: { Channel: channel, Authorization: `Bearer ${token}`, Accept: "application/json" } });
        const records = listFrom(json).slice(0, 1000);
        received += records.length;
        for (const item of records) {
          const row = normalized(resource, item);
          if (!row) { failed += 1; continue; }
          const local = await findLocal(admin, resource, item, row);
          const matchStatus = local ? "matched" : "review_required";
          if (local) matched += 1; else review += 1;
          const { error } = await admin.from("kolaybi_master_records").upsert({
            resource_type: resource === "sales_invoices" ? "sales_invoice" : resource === "purchase_invoices" ? "purchase_invoice" : resource.slice(0, -1),
            external_id: row.externalId,
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
          }, { onConflict: "resource_type,external_id" });
          if (error) { failed += 1; errors.push(error.message); continue; }
          await admin.from("kolaybi_sync_events").insert({
            run_id: run.id, resource_type: resource, external_id: row.externalId,
            event_type: local ? "record_matched" : "review_required",
            status: local ? "success" : "warning",
            summary: local ? `${row.displayName || row.externalId} TMS kaydıyla eşleştirildi` : `${row.displayName || row.externalId} için kullanıcı kontrolü gerekiyor`,
            actor_id: userData.user.id, actor_email: userData.user.email,
          });
        }
      } catch (error: any) {
        failed += 1;
        errors.push(`${resource}: ${String(error?.message || error).slice(0, 300)}`);
      }
    }
    const status = failed === 0 ? "completed" : received > 0 ? "partial" : "failed";
    const { data: completed } = await admin.from("kolaybi_sync_runs").update({ status, received_count: received, matched_count: matched, review_count: review, failed_count: failed, last_error: errors[0] || null, completed_at: new Date().toISOString(), metadata: { resources } }).eq("id", run.id).select().single();
    await admin.from("kolaybi_sync_events").insert({ run_id: run.id, resource_type: requested, event_type: status === "failed" ? "sync_failed" : "sync_completed", status: status === "completed" ? "success" : status === "partial" ? "warning" : "error", summary: `Senkronizasyon tamamlandı: ${received} kayıt, ${matched} eşleşme, ${review} kontrol`, metadata: { errors: errors.slice(0, 10) }, actor_id: userData.user.id, actor_email: userData.user.email });
    await updatePartner(status !== "failed", errors[0] || null, true);
    return res.status(status === "failed" ? 502 : 200).json({ success: status !== "failed", run: completed, errors: errors.slice(0, 10) });
  } catch (error: any) {
    await updatePartner(false, String(error?.message || error), req.method === "POST");
    return res.status(error?.status === 401 ? 401 : 502).json({ error: String(error?.message || "KolayBi bağlantısı tamamlanamadı.").slice(0, 500) });
  }
}
