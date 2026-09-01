import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { cancelKolayBiInvoice, publicKolayBiError } from "@/lib/kolaybi";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Yalnızca POST desteklenir." });
  const bearer = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : "";
  const invoiceId = String(req.query.invoiceId || "");
  const reason = String(req.body?.reason || "").trim();
  const cancellationType = String(req.body?.cancellationType || "") as "iptal" | "iade";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!bearer) return res.status(401).json({ error: "Oturum doğrulanamadı." });
  if (!invoiceId || !supabaseUrl || !anonKey || !serviceKey) return res.status(500).json({ error: "Sunucu ayarları eksik." });
  if (reason.length < 10 || !["iptal", "iade"].includes(cancellationType)) {
    return res.status(422).json({ error: "İptal/iade türü ve en az 10 karakterlik neden zorunludur." });
  }

  const userDb = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${bearer}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await userDb.auth.getUser(bearer);
  if (userError || !userData.user) return res.status(401).json({ error: "Oturum süresi dolmuş." });
  const { data: allowed } = await userDb.rpc("rex_has_permission" as any, {
    p_key: "accounting.sales",
    p_required: "manage",
  } as any);
  if (!allowed) return res.status(403).json({ error: "Fatura iptal/iade yetkiniz yok." });

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  try {
    const provider = await cancelKolayBiInvoice(admin, { invoiceId, cancellationType, reason });
    const externalReference = provider.reference || String(req.body?.externalReference || "").trim() || null;
    const { error: localError } = await userDb.rpc("rex_cancel_sales_invoice" as any, {
      p_invoice_id: invoiceId,
      p_reason: reason,
      p_cancellation_type: cancellationType,
      p_external_reference: externalReference,
    } as any);
    if (localError) {
      return res.status(409).json({
        error: `KolayBi işlemi tamamlandı ancak REX TYS kaydı tamamlanamadı: ${localError.message}`,
        providerApplied: provider.providerApplied,
        providerReference: externalReference,
      });
    }
    return res.status(200).json({ success: true, providerApplied: provider.providerApplied, providerReference: externalReference });
  } catch (error: any) {
    const publicError = publicKolayBiError(error);
    return res.status(publicError.status && publicError.status >= 400 && publicError.status < 500 ? 422 : 502).json({ error: publicError.message });
  }
}
