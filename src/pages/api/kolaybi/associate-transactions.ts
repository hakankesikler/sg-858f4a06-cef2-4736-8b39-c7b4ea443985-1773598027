import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_BASE_URL = "https://ofis-sandbox-api.kolaybi.com/kolaybi/v1";
const text = (value: unknown) => value === undefined || value === null ? "" : String(value).trim();
const number = (value: unknown) => { const parsed = Number(value || 0); return Number.isFinite(parsed) ? parsed : 0; };
const currency = (value: unknown) => { const candidate = text(value).toUpperCase(); return ["TRY", "USD", "EUR", "GBP"].includes(candidate) ? candidate : "TRY"; };
const label = (value: any) => text(value?.description || value?.value || value?.key || value);

async function providerJson(url: string, init: RequestInit) {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(25_000) });
  const body = await response.text();
  let json: any = {};
  try { json = body ? JSON.parse(body) : {}; } catch { throw new Error("KolayBi geçersiz yanıt döndürdü."); }
  if (!response.ok) throw new Error(text(json?.message || json?.error?.message || `KolayBi HTTP ${response.status}`));
  return json;
}

function mapTransactionType(item: any): "Borç" | "Alacak" {
  const value = `${label(item?.transaction_type)} ${label(item?.transaction_subtype)}`.toLocaleLowerCase("tr-TR");
  if (/tahsil|collection|proceed|alacak/.test(value)) return "Alacak";
  if (/ödeme|payment|borç/.test(value)) return "Borç";
  return number(item?.cash_flow_direction) < 0 ? "Alacak" : "Borç";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Yalnızca POST desteklenir." });
  const bearer = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : "";
  const customerId = text(req.body?.customerId);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!bearer) return res.status(401).json({ error: "Oturum doğrulanamadı." });
  if (!customerId) return res.status(400).json({ error: "Cari seçilmedi." });
  if (!supabaseUrl || !anonKey || !serviceKey) return res.status(500).json({ error: "Sunucu veritabanı ayarları eksik." });

  const userDb = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${bearer}` } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: userError } = await userDb.auth.getUser(bearer);
  if (userError || !userData.user) return res.status(401).json({ error: "Oturum süresi dolmuş." });
  const { data: allowed } = await userDb.rpc("rex_has_permission" as any, { p_key: "accounting.accounts", p_required: "manage" } as any);
  if (!allowed) return res.status(403).json({ error: "Cari hareketlerini yenileme yetkiniz yok." });

  const apiKey = process.env.KOLAYBI_API_KEY;
  const channel = process.env.KOLAYBI_CHANNEL;
  const baseUrl = (process.env.KOLAYBI_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
  const environment: "test" | "live" = baseUrl.includes("sandbox") ? "test" : "live";
  if (!apiKey || !channel) return res.status(422).json({ error: "KolayBi bağlantı bilgileri tamamlanmalıdır." });

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  try {
    const { data: customer, error: customerError } = await admin.from("customers")
      .select("id,name,company,kolaybi_contact_id").eq("id", customerId).maybeSingle();
    if (customerError) throw customerError;
    if (!customer) return res.status(404).json({ error: "Cari bulunamadı." });
    const associateId = Number(customer.kolaybi_contact_id || 0);
    if (!Number.isSafeInteger(associateId) || associateId <= 0) return res.status(422).json({ error: "Bu cari henüz KolayBi ile eşleştirilmemiş. Önce Cari Hesaplar eşleştirmesini yenileyin." });

    const tokenJson = await providerJson(`${baseUrl}/access_token`, {
      method: "POST", headers: { Channel: channel, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ api_key: apiKey }),
    });
    const token = tokenJson?.data?.access_token || tokenJson?.data?.token || tokenJson?.data;
    if (typeof token !== "string" || !token) throw new Error("KolayBi erişim anahtarı alınamadı.");
    const json = await providerJson(`${baseUrl}/associates/${associateId}/transactions`, {
      method: "GET", headers: { Channel: channel, Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    const records = Array.isArray(json?.data?.transactionables) ? json.data.transactionables.slice(0, 3000) : [];
    const now = new Date().toISOString();
    let inserted = 0; let updated = 0;

    for (const item of records) {
      const transactionableId = Number(item?.id);
      if (!Number.isSafeInteger(transactionableId)) continue;
      const typeLabel = label(item?.transaction_type);
      const subtypeLabel = label(item?.transaction_subtype);
      const transactionData = {
        account_type: "Genel", account_id: customer.id, customer_id: customer.id,
        transaction_type: mapTransactionType(item), amount: Math.abs(number(item?.amount)),
        description: text(item?.description) || subtypeLabel || typeLabel || "KolayBi cari hareketi",
        reference_no: text(item?.serial_no || item?.transaction_id) || `KB-${environment.toUpperCase()}-A${associateId}-T${transactionableId}`,
        transaction_date: text(item?.issue_date).slice(0, 10) || new Date().toISOString().slice(0, 10),
        currency: currency(item?.currency), source: "kolaybi", provider: "kolaybi", provider_environment: environment,
        provider_associate_id: associateId, provider_transactionable_id: transactionableId,
        provider_transaction_id: Number(item?.transaction_id) || null,
        provider_transaction_type: typeLabel || null, provider_transaction_subtype: subtypeLabel || null,
        provider_payment_method: label(item?.payment_method) || null,
        cash_flow_direction: number(item?.cash_flow_direction), due_date: text(item?.due_date).slice(0, 10) || null,
        exchange_rate: number(item?.exchange_rate) || null, exchange_amount: number(item?.exchange_amount) || null,
        quote_currency: text(item?.quote_currency).toUpperCase() || null, cumulative_balance: number(item?.cumulative),
        raw_payload: { id: item?.id, transaction_id: item?.transaction_id, transaction_type: item?.transaction_type, transaction_subtype: item?.transaction_subtype, issue_date: item?.issue_date, due_date: item?.due_date, amount: item?.amount, currency: item?.currency, exchange_rate: item?.exchange_rate, exchange_amount: item?.exchange_amount, quote_currency: item?.quote_currency, cash_flow_direction: item?.cash_flow_direction, description: item?.description, serial_no: item?.serial_no, cumulative: item?.cumulative },
        last_synced_at: now,
      };
      const { data: existing } = await admin.from("account_transactions").select("id")
        .eq("source", "kolaybi").eq("provider_environment", environment)
        .eq("provider_associate_id", associateId).eq("provider_transactionable_id", transactionableId).maybeSingle();
      if (existing?.id) {
        const { error } = await admin.from("account_transactions").update(transactionData).eq("id", existing.id);
        if (error) throw error;
        updated += 1;
      } else {
        const { error } = await admin.from("account_transactions").insert({ ...transactionData, created_by: userData.user.id });
        if (error) throw error;
        inserted += 1;
      }
    }

    await admin.from("kolaybi_sync_events").insert({ resource_type: "associate_transactions", external_id: String(associateId), provider_environment: environment, event_type: "associate_transactions_synced", status: "success", summary: `${customer.company || customer.name} cari hareketleri yenilendi: ${inserted} yeni, ${updated} güncel`, metadata: { customer_id: customer.id, received: records.length, inserted, updated }, actor_id: userData.user.id, actor_email: userData.user.email });
    return res.status(200).json({ success: true, received: records.length, inserted, updated, environment });
  } catch (error: any) {
    return res.status(502).json({ error: text(error?.message || "KolayBi cari hareketleri alınamadı.").slice(0, 500) });
  }
}
