import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { proceedKolayBiInvoice, publicKolayBiError } from "@/lib/kolaybi";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Yalnızca POST desteklenir." });
  const bearer = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : "";
  const invoiceId = String(req.query.invoiceId || "");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!bearer) return res.status(401).json({ error: "Oturum doğrulanamadı." });
  if (!invoiceId || !supabaseUrl || !anonKey || !serviceKey) return res.status(500).json({ error: "Sunucu ayarları eksik." });

  const userDb = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${bearer}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await userDb.auth.getUser(bearer);
  if (userError || !userData.user) return res.status(401).json({ error: "Oturum süresi dolmuş." });
  const { data: allowed } = await userDb.rpc("rex_has_permission" as any, {
    p_key: "accounting.accounts",
    p_required: "manage",
  } as any);
  if (!allowed) return res.status(403).json({ error: "Tahsilat işleme yetkiniz yok." });

  const amount = Number(req.body?.amount);
  const financialAccountId = String(req.body?.financialAccountId || "");
  const customerId = String(req.body?.customerId || "");
  const paymentDate = String(req.body?.paymentDate || "").slice(0, 10);
  if (!Number.isFinite(amount) || amount <= 0 || !financialAccountId || !customerId || !/^\d{4}-\d{2}-\d{2}$/.test(paymentDate)) {
    return res.status(422).json({ error: "Tahsilat bilgileri eksik veya geçersiz." });
  }

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const [{ data: invoice }, { data: account }] = await Promise.all([
    admin.from("sales_invoices").select("id,customer_id,kolaybi_document_id").eq("id", invoiceId).single(),
    admin.from("financial_accounts").select("id,kolaybi_vault_id,source,provider_environment").eq("id", financialAccountId).single(),
  ]);
  if (!invoice || invoice.customer_id !== customerId) return res.status(404).json({ error: "Müşteriye ait fatura bulunamadı." });
  if (!invoice.kolaybi_document_id) return res.status(409).json({ error: "Fatura henüz KolayBi ile eşleştirilmemiş." });
  if (!account?.kolaybi_vault_id) return res.status(409).json({ error: "Seçilen finans hesabının KolayBi kasa/banka eşlemesi yok." });

  try {
    const provider = await proceedKolayBiInvoice(admin, {
      invoiceId,
      vaultId: Number(account.kolaybi_vault_id),
      amount,
      issueDate: paymentDate,
    });
    const { data: paymentId, error: paymentError } = await userDb.rpc("rex_record_customer_payment" as any, {
      p_customer_id: customerId,
      p_transaction_type: "tahsilat",
      p_amount: amount,
      p_payment_method: String(req.body?.paymentMethod || "Havale"),
      p_payment_date: paymentDate,
      p_financial_account_id: financialAccountId,
      p_reference_no: String(req.body?.referenceNo || "") || null,
      p_description: String(req.body?.description || "") || null,
      p_currency: String(req.body?.currency || "TRY"),
      p_related_invoice_id: invoiceId,
      p_related_purchase_id: null,
    } as any);
    if (paymentError) {
      return res.status(409).json({
        error: `Tahsilat KolayBi'ye işlendi ancak REX TYS kaydı tamamlanamadı: ${paymentError.message}`,
        providerApplied: true,
      });
    }
    return res.status(200).json({ success: true, paymentId, provider });
  } catch (error: any) {
    const publicError = publicKolayBiError(error);
    return res.status(publicError.status && publicError.status >= 400 && publicError.status < 500 ? 422 : 502).json({ error: publicError.message });
  }
}
