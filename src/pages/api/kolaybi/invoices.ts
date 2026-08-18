import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const defaultBaseUrl = "https://ofis-sandbox-api.kolaybi.com/kolaybi/v1";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Yalnızca POST desteklenir" });

  const authHeader = req.headers.authorization;
  const userToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!userToken) return res.status(401).json({ error: "Oturum doğrulanamadı" });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const apiKey = process.env.KOLAYBI_API_KEY;
  const channel = process.env.KOLAYBI_CHANNEL;
  const productId = process.env.KOLAYBI_PRODUCT_ID;
  const baseUrl = (process.env.KOLAYBI_BASE_URL || defaultBaseUrl).replace(/\/$/, "");
  if (!supabaseUrl || !anonKey) return res.status(500).json({ error: "Supabase sunucu ayarları eksik" });
  if (!apiKey || !channel || !productId) {
    return res.status(503).json({
      error: "KolayBi bağlantısı hazır, ancak KOLAYBI_API_KEY, KOLAYBI_CHANNEL ve KOLAYBI_PRODUCT_ID ayarları tamamlanmalı.",
    });
  }

  const db = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${userToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await db.auth.getUser(userToken);
  if (userError || !userData.user) return res.status(401).json({ error: "Oturum süresi dolmuş" });
  const { data: allowed } = await db.rpc("rex_has_role" as any, { required_roles: ["admin", "accounting"] } as any);
  if (!allowed) return res.status(403).json({ error: "Faturalandırma yetkiniz bulunmuyor" });

  const invoiceId = typeof req.body?.invoiceId === "string" ? req.body.invoiceId : "";
  if (!invoiceId) return res.status(400).json({ error: "Fatura kimliği zorunludur" });

  const { data: invoice, error: invoiceError } = await (db.from("sales_invoices") as any)
    .select("*, customer:customers!sales_invoices_customer_id_fkey(id,name,kolaybi_contact_id,kolaybi_address_id), items:sales_invoice_items(*)")
    .eq("id", invoiceId)
    .single();
  if (invoiceError || !invoice) return res.status(404).json({ error: "Fatura bulunamadı" });
  if (invoice.kolaybi_document_id) return res.status(200).json({ success: true, documentId: invoice.kolaybi_document_id, alreadySynced: true });
  if (!invoice.customer?.kolaybi_contact_id || !invoice.customer?.kolaybi_address_id) {
    await (db.from("sales_invoices") as any).update({ kolaybi_status: "mapping_required", kolaybi_error: "Cari KolayBi eşlemesi eksik" }).eq("id", invoiceId);
    return res.status(422).json({ error: "Seçilen carinin KolayBi contact_id ve address_id eşlemesi eksik." });
  }

  try {
    const tokenResponse = await fetch(`${baseUrl}/access_token`, {
      method: "POST",
      headers: { Channel: channel, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ api_key: apiKey }),
    });
    const tokenJson = await tokenResponse.json();
    const accessToken = tokenJson?.data?.access_token || tokenJson?.data?.token || tokenJson?.data;
    if (!tokenResponse.ok || typeof accessToken !== "string") throw new Error(tokenJson?.message || "KolayBi erişim anahtarı alınamadı");

    const form = new URLSearchParams();
    form.set("contact_id", String(invoice.customer.kolaybi_contact_id));
    form.set("address_id", String(invoice.customer.kolaybi_address_id));
    form.set("order_date", invoice.invoice_date);
    form.set("currency", invoice.currency || "TRY");
    form.set("notes", invoice.notes || `REX ${invoice.invoice_no}`);
    (invoice.items || []).forEach((item: any, index: number) => {
      form.set(`items[${index}][product_id]`, productId);
      form.set(`items[${index}][quantity]`, String(item.quantity));
      form.set(`items[${index}][unit_price]`, String(item.unit_price));
      form.set(`items[${index}][vat_rate]`, String(item.tax_rate || 0));
      form.set(`items[${index}][description]`, item.description || "Taşıma hizmeti");
    });
    const createResponse = await fetch(`${baseUrl}/invoices`, {
      method: "POST",
      headers: { Channel: channel, Authorization: `Bearer ${accessToken}`, "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: form.toString(),
    });
    const createJson = await createResponse.json();
    const documentId = createJson?.data?.document_id;
    if (!createResponse.ok || !documentId) throw new Error(createJson?.message || "KolayBi faturası oluşturulamadı");

    let status = "created";
    if (process.env.KOLAYBI_AUTO_SEND_E_DOCUMENT === "true") {
      const sendForm = new URLSearchParams({ document_id: String(documentId) });
      const sendResponse = await fetch(`${baseUrl}/invoices/e-document/create`, {
        method: "POST",
        headers: { Channel: channel, Authorization: `Bearer ${accessToken}`, "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
        body: sendForm.toString(),
      });
      if (!sendResponse.ok) throw new Error("Fatura oluştu ancak e-belge gönderimi başarısız oldu");
      status = "e_document_sent";
    }
    await (db.from("sales_invoices") as any).update({ kolaybi_document_id: documentId, kolaybi_status: status, kolaybi_synced_at: new Date().toISOString(), kolaybi_error: null }).eq("id", invoiceId);
    return res.status(200).json({ success: true, documentId, status });
  } catch (error: any) {
    await (db.from("sales_invoices") as any).update({ kolaybi_status: "failed", kolaybi_error: String(error?.message || error).slice(0, 1000) }).eq("id", invoiceId);
    return res.status(502).json({ error: error?.message || "KolayBi bağlantısı başarısız oldu" });
  }
}
