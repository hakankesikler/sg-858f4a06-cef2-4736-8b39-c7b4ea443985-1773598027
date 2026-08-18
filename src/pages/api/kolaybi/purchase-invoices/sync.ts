import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const defaultBaseUrl = "https://ofis-sandbox-api.kolaybi.com/kolaybi/v1";

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

function numberValue(...values: any[]) {
  const value = Number(firstValue(...values, 0));
  return Number.isFinite(value) ? value : 0;
}

function dateValue(value: any) {
  const date = String(value || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : new Date().toISOString().slice(0, 10);
}

function normalize(item: any) {
  const contact = item?.contact || item?.supplier || item?.sender || item?.account || {};
  const totals = item?.totals || item?.amounts || {};
  const documentId = firstValue(item?.document_id, item?.id, item?.invoice_id);
  const invoiceNo = firstValue(item?.no, item?.invoice_no, item?.serial_no, item?.document_no);
  const issuerName = firstValue(contact?.title, contact?.company_name, contact?.name, item?.sender_title, item?.supplier_name);
  const issuerTaxId = String(firstValue(contact?.tax_number, contact?.tax_id, contact?.identity_number, item?.sender_tax_number, item?.tax_number, "")).replace(/\D/g, "");
  const grandTotal = numberValue(totals?.grand_total, totals?.total, item?.grand_total, item?.total, item?.payable_amount);
  if (!documentId || !invoiceNo || !issuerName || ![10, 11].includes(issuerTaxId.length) || grandTotal <= 0) return null;
  return {
    provider_document_id: String(documentId),
    official_uuid: firstValue(item?.uuid, item?.ettn, item?.official_uuid) || null,
    document_type: String(firstValue(item?.document_type, item?.e_document_type, "e_invoice")).toLowerCase().includes("archive") ? "e_archive" : "e_invoice",
    invoice_no: String(invoiceNo),
    invoice_date: dateValue(firstValue(item?.invoice_date, item?.order_date, item?.date, item?.issue_date)),
    due_date: firstValue(item?.due_date, item?.maturity_date) ? dateValue(firstValue(item?.due_date, item?.maturity_date)) : null,
    issuer_name: String(issuerName),
    issuer_tax_id: issuerTaxId,
    issuer_tax_office: firstValue(contact?.tax_office, item?.tax_office) || null,
    currency: String(firstValue(item?.currency, totals?.currency, "TRY")).toUpperCase(),
    net_total: numberValue(totals?.subtotal, totals?.net_total, item?.subtotal, item?.net_total, grandTotal),
    vat_total: numberValue(totals?.vat_total, totals?.tax, item?.vat_total, item?.tax),
    withholding_total: numberValue(totals?.withholding_total, item?.withholding_total),
    grand_total: grandTotal,
    description: firstValue(item?.description, item?.notes, item?.note) || null,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Yalnızca POST desteklenir." });
  const bearer = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : "";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!bearer) return res.status(401).json({ error: "Oturum doğrulanamadı." });
  if (!supabaseUrl || !anonKey) return res.status(500).json({ error: "Sunucu veritabanı ayarları eksik." });

  const db = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${bearer}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await db.auth.getUser(bearer);
  if (userError || !userData.user) return res.status(401).json({ error: "Oturum süresi dolmuş." });
  const { data: allowed } = await db.rpc("rex_has_role" as any, { required_roles: ["admin", "accounting"] } as any);
  if (!allowed) return res.status(403).json({ error: "Alış faturalarını görüntüleme yetkiniz yok." });

  const apiKey = process.env.KOLAYBI_API_KEY;
  const channel = process.env.KOLAYBI_CHANNEL;
  const companyId = process.env.KOLAYBI_COMPANY_ID;
  const baseUrl = (process.env.KOLAYBI_BASE_URL || defaultBaseUrl).replace(/\/$/, "");
  if (!apiKey || !channel || !companyId) {
    return res.status(422).json({ error: "KolayBi API anahtarı, Channel ve Company ID bilgileri tamamlanmalıdır." });
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
    startDate.setDate(startDate.getDate() - 90);
    const params = new URLSearchParams({
      company_id: companyId,
      direction: "inbound",
      start_date: startDate.toISOString().slice(0, 10),
      end_date: endDate.toISOString().slice(0, 10),
      page: "1",
      per_page: "100",
    });
    const listJson = await request(`${baseUrl}/e_document/invoices?${params.toString()}`, {
      method: "GET",
      headers: { Channel: channel, Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    });
    const list = Array.isArray(listJson?.data?.data) ? listJson.data.data
      : Array.isArray(listJson?.data?.items) ? listJson.data.items
      : Array.isArray(listJson?.data) ? listJson.data
      : Array.isArray(listJson?.items) ? listJson.items : [];
    let imported = 0;
    let existing = 0;
    let skipped = 0;
    const errors: string[] = [];
    for (const item of list) {
      const normalized = normalize(item);
      if (!normalized) { skipped += 1; continue; }
      const { data, error } = await db.rpc("rex_import_kolaybi_purchase_invoice" as any, { p_invoice: normalized } as any);
      if (error) { errors.push(String(error.message).slice(0, 200)); continue; }
      if ((data as any)?.created) imported += 1; else existing += 1;
    }
    return res.status(200).json({ success: true, received: list.length, imported, existing, skipped, errors: errors.slice(0, 10) });
  } catch (error: any) {
    return res.status(502).json({ error: String(error?.message || "KolayBi bağlantısı tamamlanamadı.").slice(0, 500) });
  }
}
