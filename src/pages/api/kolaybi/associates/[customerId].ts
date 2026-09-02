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

function listFrom(json: any) {
  if (Array.isArray(json?.data?.data)) return json.data.data;
  if (Array.isArray(json?.data?.items)) return json.data.items;
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.items)) return json.items;
  return [];
}

function digits(value: unknown) {
  return String(value || "").replace(/\D/g, "");
}

function preferredAddress(associate: any) {
  const addresses = Array.isArray(associate?.address)
    ? associate.address
    : Array.isArray(associate?.addresses) ? associate.addresses : [];
  return addresses.find((item: any) => item?.address_type === "invoice") || addresses[0] || null;
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
  const [{ data: canManageCustomers }, { data: canManageAccounts }] = await Promise.all([
    userDb.rpc("rex_has_permission" as any, { p_key: "crm.customers", p_required: "manage" } as any),
    userDb.rpc("rex_has_permission" as any, { p_key: "accounting.accounts", p_required: "manage" } as any),
  ]);
  if (!canManageCustomers && !canManageAccounts) return res.status(403).json({ error: "Cari senkronizasyonu için yetkiniz yok." });

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: customer, error: customerError } = await admin.from("customers").select("*").eq("id", customerId).single();
  if (customerError || !customer) return res.status(404).json({ error: "Cari bulunamadı." });
  const identityNo = digits(customer.vergi_no || customer.tc_no);
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

    const headers = { Channel: channel, Authorization: `Bearer ${token}`, Accept: "application/json" };
    let associate: any = null;
    let matchMethod = "tax_identity";

    const storedContactId = Number(customer.kolaybi_contact_id || 0);
    if (Number.isSafeInteger(storedContactId) && storedContactId > 0) {
      try {
        const detailResponse = await fetch(`${baseUrl}/associates/${storedContactId}`, {
          method: "GET", headers, signal: AbortSignal.timeout(25_000),
        });
        const detailJson = await readJson(detailResponse);
        const detail = detailJson?.data || detailJson;
        if (digits(detail?.identity_no) === identityNo) {
          associate = detail;
          matchMethod = "existing_reference";
        }
      } catch {
        // Eski veya geçersiz bir kimlik varsa kesin VKN/TCKN aramasıyla onarılır.
      }
    }

    if (!associate) {
      const lookupResponse = await fetch(`${baseUrl}/associates?identity_no=${encodeURIComponent(identityNo)}`, {
        method: "GET", headers, signal: AbortSignal.timeout(25_000),
      });
      const lookupJson = await readJson(lookupResponse);
      const exactMatches = listFrom(lookupJson).filter((item: any) => digits(item?.identity_no) === identityNo);
      if (exactMatches.length > 1) {
        return res.status(409).json({
          error: "KolayBi aynı VKN/TCKN için birden fazla cari döndürdü. Yanlış eşleşmeyi önlemek için Entegrasyon Merkezi'nden kontrol edin.",
          reviewRequired: true,
        });
      }
      associate = exactMatches[0] || null;
    }

    let createdInProvider = false;
    if (!associate) {
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

      const createResponse = await fetch(`${baseUrl}/associates`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(), signal: AbortSignal.timeout(25_000),
      });
      const createJson = await readJson(createResponse);
      associate = createJson?.data || createJson;
      createdInProvider = true;
      matchMethod = "created_from_tms";
    }

    const contactId = Number(associate?.id || associate?.contact_id || 0);
    const address = preferredAddress(associate);
    const addressId = Number(address?.id || 0) || null;
    if (!Number.isSafeInteger(contactId) || contactId <= 0) throw new Error("KolayBi cari kimliği dönmedi.");

    const { data: conflictingMapping } = await admin.from("kolaybi_master_records")
      .select("local_entity_id,display_name")
      .eq("provider_environment", "test")
      .eq("resource_type", "associate")
      .eq("external_id", String(contactId))
      .eq("match_status", "matched")
      .neq("local_entity_id", customerId)
      .maybeSingle();
    if (conflictingMapping?.local_entity_id) {
      return res.status(409).json({
        error: `Bu KolayBi carisi başka bir REX TYS kartıyla eşleşmiş: ${conflictingMapping.display_name || "kayıt"}.`,
        reviewRequired: true,
      });
    }

    const { error: updateError } = await admin.from("customers").update({ kolaybi_contact_id: contactId, ...(addressId ? { kolaybi_address_id: addressId } : {}), updated_at: new Date().toISOString() }).eq("id", customerId);
    if (updateError) throw updateError;
    const { error: staleMappingError } = await admin.from("kolaybi_master_records").update({
      match_status: "review_required", local_entity_type: null, local_entity_id: null,
    }).eq("provider_environment", "test").eq("resource_type", "associate")
      .eq("local_entity_id", customerId).eq("match_status", "matched")
      .neq("external_id", String(contactId));
    if (staleMappingError) throw staleMappingError;
    const { error: mappingError } = await admin.from("kolaybi_master_records").upsert({ provider_environment: "test", resource_type: "associate", external_id: String(contactId), local_entity_type: "customer", local_entity_id: customerId, match_status: "matched", display_name: customer.company || customer.name, external_code: associate?.code || customer.customer_code, tax_identity: identityNo, payload: { id: contactId, code: associate?.code, name: associate?.name, surname: associate?.surname, identity_no: identityNo, address: associate?.address || associate?.addresses || [] }, last_seen_at: new Date().toISOString() }, { onConflict: "provider_environment,resource_type,external_id" });
    if (mappingError) throw mappingError;
    await admin.from("kolaybi_sync_events").insert({ resource_type: "associate", external_id: String(contactId), provider_environment: "test", event_type: "record_matched", status: "success", summary: createdInProvider ? `${customer.company || customer.name} KolayBi sandbox'ta otomatik oluşturuldu ve eşleştirildi` : `${customer.company || customer.name} VKN/TCKN ile KolayBi'ye otomatik eşleştirildi`, actor_id: userData.user.id, actor_email: userData.user.email, metadata: { customer_id: customerId, address_id: addressId, automatic: true, match_method: matchMethod } });
    return res.status(createdInProvider ? 201 : 200).json({ success: true, alreadyLinked: matchMethod === "existing_reference", created: createdInProvider, matched: !createdInProvider, matchMethod, environment: "test", contactId, addressId });
  } catch (error: any) {
    return res.status(502).json({ error: String(error?.message || "KolayBi cari aktarımı tamamlanamadı.").slice(0, 500) });
  }
}
