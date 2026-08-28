import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { sendCrmOfferEmail } from "@/lib/crm-offer-delivery";

const clean = (value: unknown, max = 255) => typeof value === "string" ? value.trim().slice(0, max) : "";
const validOrigin = (req: NextApiRequest) => {
  const origin = clean(req.headers.origin || req.headers.referer, 500);
  const host = clean(req.headers.host);
  if (!origin || !host) return false;
  try { return new URL(origin).host === host; } catch { return false; }
};

export const config = { api: { bodyParser: { sizeLimit: "8kb" } } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Desteklenmeyen işlem." });
  if (!validOrigin(req)) return res.status(403).json({ error: "Geçersiz istek kaynağı." });
  const token = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : "";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token) return res.status(401).json({ error: "Oturum doğrulanamadı." });
  if (!url || !anon) return res.status(503).json({ error: "Teklif gönderim servisi yapılandırılmamış." });
  const userDb = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data: auth, error: authError } = await userDb.auth.getUser(token);
  if (authError || !auth.user) return res.status(401).json({ error: "Oturum süresi dolmuş." });
  const { data: allowed } = await userDb.rpc("rex_has_permission" as never, { p_key: "crm.sales_pipeline", p_required: "manage" } as never);
  if (!allowed) return res.status(403).json({ error: "Teklif gönderme yetkiniz bulunmuyor." });
  const offerId = clean(req.query.offerId, 36);
  if (!/^[0-9a-f-]{36}$/i.test(offerId)) return res.status(400).json({ error: "Teklif kimliği geçersiz." });
  const { data: offer, error: offerError } = await userDb.from("crm_offers").select("*,crm_offer_items(*)").eq("id", offerId).maybeSingle();
  if (offerError || !offer) return res.status(404).json({ error: "Teklif bulunamadı." });
  if (offer.email_status === "sent" && offer.email_provider_id) return res.status(200).json({ success: true, alreadySent: true, providerId: offer.email_provider_id });
  if (!["not_required", "approved"].includes(offer.approval_status)) return res.status(409).json({ error: "Teklif yönetici onayı tamamlanmadan gönderilemez." });
  const { data: opportunity } = await userDb.from("crm_opportunities").select("company_name,contact_name,email,assigned_to").eq("id", offer.opportunity_id).maybeSingle();
  if (!opportunity) return res.status(404).json({ error: "Teklifin satış kaydı bulunamadı." });
  const recipientEmail = clean(req.body?.recipientEmail || offer.recipient_email || opportunity.email).toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(recipientEmail)) return res.status(400).json({ error: "Müşterinin geçerli e-posta adresi bulunmuyor." });
  await userDb.from("crm_offers").update({ email_status: "sending", recipient_email: recipientEmail, email_error: null, updated_at: new Date().toISOString() }).eq("id", offerId);
  try {
    const providerId = await sendCrmOfferEmail(offer, { company_name: opportunity.company_name, contact_name: opportunity.contact_name, email: recipientEmail });
    const now = new Date().toISOString();
    const { error: updateError } = await userDb.from("crm_offers").update({ status: "sent", recipient_email: recipientEmail, email_status: "sent", email_provider_id: providerId, email_sent_at: now, sent_at: now, email_error: null, updated_at: now }).eq("id", offerId);
    if (updateError) throw updateError;
    await userDb.from("crm_activities").insert({ opportunity_id: offer.opportunity_id, customer_id: offer.customer_id, activity_type: "email", outcome: "quote_sent", summary: `${offer.offer_no} numaralı teklif ${recipientEmail} adresine gönderildi.`, activity_at: now, created_by: auth.user.id });
    return res.status(200).json({ success: true, providerId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Teklif e-postası gönderilemedi.";
    await userDb.from("crm_offers").update({ email_status: "failed", email_error: message.slice(0, 500), updated_at: new Date().toISOString() }).eq("id", offerId);
    return res.status(502).json({ error: message });
  }
}
