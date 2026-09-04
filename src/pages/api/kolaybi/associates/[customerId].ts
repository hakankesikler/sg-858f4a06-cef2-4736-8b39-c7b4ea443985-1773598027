import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { synchronizeKolayBiAssociate } from "@/lib/kolaybi-associates";

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

  const [{ data: canManageCustomers }, { data: canManageAccounts }] = await Promise.all([
    userDb.rpc("rex_has_permission" as any, { p_key: "crm.customers", p_required: "manage" } as any),
    userDb.rpc("rex_has_permission" as any, { p_key: "accounting.accounts", p_required: "manage" } as any),
  ]);
  if (!canManageCustomers && !canManageAccounts) return res.status(403).json({ error: "Cari senkronizasyonu için yetkiniz yok." });

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  try {
    const result = await synchronizeKolayBiAssociate({
      admin,
      customerId,
      actorId: userData.user.id,
      actorEmail: userData.user.email,
    });
    return res.status(result.created ? 201 : 200).json(result);
  } catch (error: any) {
    const reviewRequired = Boolean(error?.reviewRequired);
    const message = String(error?.message || "KolayBi cari aktarımı tamamlanamadı.").slice(0, 500);
    const status = message === "Cari bulunamadı." ? 404
      : reviewRequired ? 409
        : message.includes("zorunludur") || message.includes("tamamlanmalıdır") ? 422 : 502;
    return res.status(status).json({ error: message, ...(reviewRequired ? { reviewRequired: true } : {}) });
  }
}
