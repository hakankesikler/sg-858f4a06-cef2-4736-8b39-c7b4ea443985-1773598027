import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { synchronizeKolayBiAssociate } from "@/lib/kolaybi-associates";
import { resolveCustomerEDocumentProfile } from "@/lib/kolaybi-customer-e-document";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Yalnızca POST desteklenir." });
  const bearer = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : "";
  const customerId = String(req.query.customerId || "");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!bearer) return res.status(401).json({ error: "Oturum doğrulanamadı." });
  if (!customerId || !supabaseUrl || !anonKey || !serviceKey) return res.status(500).json({ error: "Sunucu ayarları eksik." });

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
  if (!allowed) return res.status(403).json({ error: "Satış faturası oluşturma yetkiniz yok." });

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  try {
    const { data: customer } = await admin.from("customers")
      .select("kolaybi_contact_id,kolaybi_address_id")
      .eq("id", customerId).single();
    if (!customer?.kolaybi_contact_id || !customer?.kolaybi_address_id) {
      await synchronizeKolayBiAssociate({
        admin,
        customerId,
        actorId: userData.user.id,
        actorEmail: userData.user.email,
      });
    }
    const profile = await resolveCustomerEDocumentProfile({ admin, customerId });
    return res.status(200).json({ success: true, profile });
  } catch (error: any) {
    const message = String(error?.message || "Cari e-belge türü doğrulanamadı.").slice(0, 500);
    if (error?.reviewRequired) {
      return res.status(200).json({
        success: true,
        profile: null,
        providerResolutionPending: true,
        message,
      });
    }
    return res.status(502).json({ error: message, reviewRequired: false });
  }
}
