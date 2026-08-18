import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const defaultBaseUrl = "https://ofis-sandbox-api.kolaybi.com/kolaybi/v1";

async function json(response: Response) {
  const value = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(String(value?.message || value?.error?.message || `KolayBi HTTP ${response.status}`).slice(0, 500));
  return value;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Yalnızca GET desteklenir." });
  const bearer = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : "";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!bearer || !supabaseUrl || !anonKey) return res.status(401).json({ error: "Oturum doğrulanamadı." });
  const db = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${bearer}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData } = await db.auth.getUser(bearer);
  if (!userData.user) return res.status(401).json({ error: "Oturum süresi dolmuş." });
  const { data: allowed } = await db.rpc("rex_has_role" as any, { required_roles: ["admin", "accounting"] } as any);
  if (!allowed) return res.status(403).json({ error: "Fatura belgesi görüntüleme yetkiniz yok." });
  const invoiceId = Array.isArray(req.query.invoiceId) ? req.query.invoiceId[0] : req.query.invoiceId;
  const { data: invoice, error } = await db.from("incoming_purchase_invoices" as any).select("invoice_no,official_uuid").eq("id", invoiceId).single();
  if (error || !invoice) return res.status(404).json({ error: "Alış faturası bulunamadı." });
  const record = invoice as any;
  if (!record.official_uuid) return res.status(422).json({ error: "Faturanın KolayBi UUID bilgisi bulunmuyor." });
  const apiKey = process.env.KOLAYBI_API_KEY;
  const channel = process.env.KOLAYBI_CHANNEL;
  const baseUrl = (process.env.KOLAYBI_BASE_URL || defaultBaseUrl).replace(/\/$/, "");
  if (!apiKey || !channel) return res.status(422).json({ error: "KolayBi bağlantı bilgileri eksik." });
  try {
    const tokenResponse = await fetch(`${baseUrl}/access_token`, { method: "POST", headers: { Channel: channel, "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ api_key: apiKey }), signal: AbortSignal.timeout(25_000) });
    const tokenJson = await json(tokenResponse);
    const token = tokenJson?.data?.access_token || tokenJson?.data?.token || tokenJson?.data;
    if (typeof token !== "string" || !token) throw new Error("KolayBi erişim anahtarı alınamadı.");
    const pdfResponse = await fetch(`${baseUrl}/invoices/e-document/view?uuid=${encodeURIComponent(record.official_uuid)}`, { headers: { Channel: channel, Authorization: `Bearer ${token}`, Accept: "application/json" }, signal: AbortSignal.timeout(25_000) });
    const pdfJson = await json(pdfResponse);
    const payload = pdfJson?.data || pdfJson;
    if (!payload?.src) throw new Error("KolayBi PDF çıktısı alınamadı.");
    const buffer = Buffer.from(String(payload.src).replace(/^data:application\/pdf;base64,/, ""), "base64");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${String(record.invoice_no).replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf"`);
    res.setHeader("Cache-Control", "private, no-store");
    return res.status(200).send(buffer);
  } catch (fetchError: any) {
    return res.status(502).json({ error: String(fetchError?.message || "KolayBi PDF alınamadı.").slice(0, 500) });
  }
}
