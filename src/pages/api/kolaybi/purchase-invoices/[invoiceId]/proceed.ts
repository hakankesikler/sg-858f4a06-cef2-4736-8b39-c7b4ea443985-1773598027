import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { proceedKolayBiDocument, publicKolayBiError } from "@/lib/kolaybi";

function providerTransactionId(value: any) {
  const candidate = value?.transaction_id ?? value?.id ?? value?.payment_id ?? value?.data?.transaction_id ?? value?.data?.id;
  return candidate === undefined || candidate === null ? null : String(candidate);
}

function providerEnvironment(value: unknown) {
  if (value === "test" || value === "live") return value;
  return String(process.env.KOLAYBI_BASE_URL || "").toLowerCase().includes("sandbox") ? "test" : "live";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Yalnızca POST desteklenir." });
  const bearer = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : "";
  const incomingInvoiceId = String(req.query.invoiceId || "");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!bearer) return res.status(401).json({ error: "Oturum doğrulanamadı." });
  if (!incomingInvoiceId || !supabaseUrl || !anonKey || !serviceKey) return res.status(500).json({ error: "Sunucu ayarları eksik." });

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
  if (!allowed) return res.status(403).json({ error: "Tedarikçi ödemesi işleme yetkiniz yok." });

  const amount = Number(req.body?.amount);
  const financialAccountId = String(req.body?.financialAccountId || "");
  const customerId = String(req.body?.customerId || "");
  const purchaseId = String(req.body?.relatedPurchaseId || "");
  const paymentDate = String(req.body?.paymentDate || "").slice(0, 10);
  if (!Number.isFinite(amount) || amount <= 0 || !financialAccountId || !customerId || !purchaseId || !/^\d{4}-\d{2}-\d{2}$/.test(paymentDate)) {
    return res.status(422).json({ error: "Ödeme bilgileri eksik veya geçersiz." });
  }

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const [{ data: incoming }, { data: purchase }, { data: account }] = await Promise.all([
    admin.from("incoming_purchase_invoices").select("id,provider_document_id,legacy_purchase_id,billing_supplier_id,operational_supplier_id,provider_balance").eq("id", incomingInvoiceId).single(),
    admin.from("purchases").select("id,supplier_id,total,paid_amount,status").eq("id", purchaseId).single(),
    admin.from("financial_accounts").select("id,kolaybi_vault_id,provider_environment").eq("id", financialAccountId).single(),
  ]);
  if (!incoming || incoming.legacy_purchase_id !== purchaseId) return res.status(404).json({ error: "Alış faturası eşleşmesi bulunamadı." });
  if (!purchase || purchase.supplier_id !== customerId) return res.status(404).json({ error: "Tedarikçiye ait alış faturası bulunamadı." });
  if (!account?.kolaybi_vault_id) return res.status(409).json({ error: "Seçilen finans hesabının KolayBi kasa/banka eşlemesi yok." });
  const documentId = Number(incoming.provider_document_id || 0);
  if (!Number.isSafeInteger(documentId) || documentId <= 0) return res.status(409).json({ error: "Alış faturası KolayBi belgesiyle eşleşmemiş." });
  const remaining = Math.max(Number(purchase.total || 0) - Number(purchase.paid_amount || 0), 0);
  if (amount > remaining + 0.01) return res.status(422).json({ error: "Ödeme açık alış faturası bakiyesini aşamaz." });

  try {
    const provider = await proceedKolayBiDocument({
      documentId,
      vaultId: Number(account.kolaybi_vault_id),
      amount,
      issueDate: paymentDate,
    });
    const { data: paymentId, error: paymentError } = await userDb.rpc("rex_record_customer_payment" as any, {
      p_customer_id: customerId,
      p_transaction_type: "odeme",
      p_amount: amount,
      p_payment_method: String(req.body?.paymentMethod || "Havale"),
      p_payment_date: paymentDate,
      p_financial_account_id: financialAccountId,
      p_reference_no: String(req.body?.referenceNo || "") || null,
      p_description: String(req.body?.description || "") || null,
      p_currency: String(req.body?.currency || "TRY"),
      p_related_invoice_id: null,
      p_related_purchase_id: purchaseId,
    } as any);
    if (paymentError) {
      return res.status(409).json({
        error: `Ödeme KolayBi'ye işlendi ancak REX TYS kaydı tamamlanamadı: ${paymentError.message}`,
        providerApplied: true,
      });
    }
    await admin.from("customer_payments").update({
      sync_status: "synced",
      provider_environment: providerEnvironment(account.provider_environment),
      provider_transaction_id: providerTransactionId(provider),
      provider_payload: provider,
      provider_synced_at: new Date().toISOString(),
      provider_error: null,
    }).eq("id", paymentId);
    return res.status(200).json({ success: true, paymentId, provider });
  } catch (error: any) {
    const publicError = publicKolayBiError(error);
    return res.status(publicError.status && publicError.status >= 400 && publicError.status < 500 ? 422 : 502).json({ error: publicError.message });
  }
}
