import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_BASE_URL = "https://ofis-sandbox-api.kolaybi.com/kolaybi/v1";

async function readJson(response: Response) {
  const body = await response.text();
  let parsed: any = {};
  try { parsed = body ? JSON.parse(body) : {}; } catch { parsed = { message: body }; }
  if (!response.ok) throw new Error(String(parsed?.message || parsed?.error?.message || `KolayBi HTTP ${response.status}`).slice(0, 500));
  return parsed;
}

function splitName(value: string, corporate: boolean) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (corporate) return { name: parts.slice(0, -1).join(" ") || value.trim(), surname: parts.at(-1) || "Firma" };
  return { name: parts.slice(0, -1).join(" ") || parts[0] || "Cari", surname: parts.at(-1) || "Hesap" };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Yalnızca POST desteklenir." });
  const bearer = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : "";
  const customerId = String(req.query.customerId || "");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!bearer) return res.status(401).json({ error: "Oturum doğrulanamadı." });
  if (!customerId || !supabaseUrl || !anonKey || !serviceKey) return res.status(500).json({ error: "Sunucu ayarları eksik." });

  const userDb = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${bearer}` } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: userError } = await userDb.auth.getUser(bearer);
  if (userError || !userData.user) return res.status(401).json({ error: "Oturum süresi dolmuş." });
  const { data: allowed } = await userDb.rpc("rex_has_permission" as any, { p_key: "accounting.accounts", p_required: "manage" } as any);
  if (!allowed) return res.status(403).json({ error: "Cari senkronizasyonu için yetkiniz yok." });

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: customer, error: customerError } = await admin.from("customers").select("*").eq("id", customerId).single();
  if (customerError || !customer) return res.status(404).json({ error: "Cari bulunamadı." });
  if (customer.kolaybi_contact_id) return res.status(200).json({ success: true, alreadyLinked: true, contactId: customer.kolaybi_contact_id, addressId: customer.kolaybi_address_id });

  const identityNo = String(customer.vergi_no || customer.tc_no || "").replace(/\D/g, "");
  if (![10, 11].includes(identityNo.length)) return res.status(422).json({ error: "KolayBi aktarımı için 10 haneli VKN veya 11 haneli TCKN zorunludur." });
  const apiKey = process.env.KOLAYBI_API_KEY || "";
  const channel = process.env.KOLAYBI_CHANNEL || "";
  const baseUrl = (process.env.KOLAYBI_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
  if (!baseUrl.includes("sandbox")) return res.status(409).json({ error: "Cari oluşturma yalnızca KolayBi sandbox ortamında etkinleştirilmiştir." });
  if (!apiKey || !channel) return res.status(422).json({ error: "KolayBi API anahtarı ve Channel bilgileri tamamlanmalıdır." });

  try {
    const tokenResponse = await fetch(`${baseUrl}/access_token`, { method: "POST", headers: { Channel: channel, "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ api_key: apiKey }), signal: AbortSignal.timeout(25_000) });
    const tokenJson = await readJson(tokenResponse);
    const token = tokenJson?.data?.access_token || tokenJson?.data?.token || tokenJson?.data;
    if (typeof token !== "string" || !token) throw new Error("KolayBi erişim anahtarı alınamadı.");

    const corporate = identityNo.length === 10;
    const names = splitName(String(customer.company || customer.name || "Cari Hesap"), corporate);
    const form = new URLSearchParams({ name: names.name, surname: names.surname, identity_no: identityNo, is_corporate: String(corporate), associate_type: ["tedarikci", "personel", "ortak"].includes(String(customer.account_type)) ? "supplier" : "customer", code: String(customer.customer_code || "") });
    if (customer.tax_office) form.set("tax_office", String(customer.tax_office));
    if (customer.website) form.set("website", String(customer.website));
    if (customer.phone) form.set("phone", String(customer.phone));
    if (customer.email) form.set("email", String(customer.email));
    if (customer.address) form.set("addresses[address]", String(customer.address));
    if (customer.city) form.set("addresses[city]", String(customer.city));
    if (customer.district) form.set("addresses[district]", String(customer.district));
    if (customer.postal_code) form.set("addresses[postal_code]", String(customer.postal_code));
    form.set("addresses[country]", "Türkiye");
    form.set("addresses[address_type]", "invoice");
    form.set("addresses[is_abroad]", "false");

    const createResponse = await fetch(`${baseUrl}/associates`, { method: "POST", headers: { Channel: channel, Authorization: `Bearer ${token}`, "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" }, body: form.toString(), signal: AbortSignal.timeout(25_000) });
    const createJson = await readJson(createResponse);
    const created = createJson?.data || createJson;
    const contactId = Number(created?.id || created?.contact_id || 0);
    const address = (Array.isArray(created?.address) ? created.address : []).find((item: any) => item?.address_type === "invoice") || created?.address?.[0];
    const addressId = Number(address?.id || 0) || null;
    if (!Number.isSafeInteger(contactId) || contactId <= 0) throw new Error("KolayBi cari kimliği dönmedi.");

    const { error: updateError } = await admin.from("customers").update({ kolaybi_contact_id: contactId, ...(addressId ? { kolaybi_address_id: addressId } : {}), updated_at: new Date().toISOString() }).eq("id", customerId);
    if (updateError) throw updateError;
    await admin.from("kolaybi_master_records").upsert({ provider_environment: "test", resource_type: "associate", external_id: String(contactId), local_entity_type: "customer", local_entity_id: customerId, match_status: "matched", display_name: customer.company || customer.name, external_code: created?.code || customer.customer_code, tax_identity: identityNo, payload: { id: contactId, code: created?.code, name: created?.name, surname: created?.surname, identity_no: identityNo, address: created?.address || [] }, last_seen_at: new Date().toISOString() }, { onConflict: "provider_environment,resource_type,external_id" });
    await admin.from("kolaybi_sync_events").insert({ resource_type: "associate", external_id: String(contactId), provider_environment: "test", event_type: "record_matched", status: "success", summary: `${customer.company || customer.name} KolayBi sandbox cari hesabı olarak oluşturuldu ve eşleştirildi`, actor_id: userData.user.id, actor_email: userData.user.email, metadata: { customer_id: customerId, address_id: addressId } });
    return res.status(201).json({ success: true, contactId, addressId });
  } catch (error: any) {
    return res.status(502).json({ error: String(error?.message || "KolayBi cari aktarımı tamamlanamadı.").slice(0, 500) });
  }
}
