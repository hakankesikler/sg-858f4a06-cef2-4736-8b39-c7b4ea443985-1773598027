import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Vercel Cron invokes configured paths with GET. POST remains available for
  // an authenticated manual retry from an operations tool.
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Desteklenmeyen işlem." });
  }
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "") || "";
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) return res.status(401).json({ error: "Yetkisiz istek." });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return res.status(503).json({ error: "CRM zamanlayıcısı yapılandırılmamış." });
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const [{ data: notifications, error: notificationError }, { data: expired, error: expiryError }] = await Promise.all([
    admin.rpc("rex_crm_generate_notifications" as never), admin.rpc("rex_crm_expire_offers" as never),
  ]);
  if (notificationError || expiryError) return res.status(500).json({ error: notificationError?.message || expiryError?.message });
  return res.status(200).json({ notifications, expired });
}
