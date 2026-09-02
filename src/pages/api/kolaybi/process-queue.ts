import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { processKolayBiJob, publicKolayBiError } from "@/lib/kolaybi";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Yalnızca GET ve POST desteklenir." });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const cronSecret = process.env.CRON_SECRET;
  if (!supabaseUrl || !anonKey) return res.status(500).json({ error: "Sunucu veritabanı ayarları eksik." });

  const bearer = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : "";
  const isCron = Boolean(cronSecret && serviceKey && bearer === cronSecret);
  const db = createClient(supabaseUrl, isCron ? serviceKey! : anonKey, {
    global: isCron ? undefined : { headers: { Authorization: `Bearer ${bearer}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (!isCron) {
    if (!bearer) return res.status(401).json({ error: "Oturum doğrulanamadı." });
    const { data: userData, error: userError } = await db.auth.getUser(bearer);
    if (userError || !userData.user) return res.status(401).json({ error: "Oturum süresi dolmuş." });
    const { data: allowed } = await db.rpc("rex_has_role" as any, {
      required_roles: ["admin", "accounting"],
    } as any);
    if (!allowed) return res.status(403).json({ error: "Faturalandırma yetkiniz bulunmuyor." });
  }

  const requestedLimit = Number(req.method === "POST" ? req.body?.limit : req.query.limit);
  const limit = Math.max(1, Math.min(Number.isFinite(requestedLimit) ? requestedLimit : 5, 10));
  let queuedStatusChecks = 0;
  if (isCron) {
    const { data, error } = await db.rpc("rex_queue_stale_invoice_status_checks" as any, {
      p_limit: limit,
    } as any);
    if (error) {
      console.error("KolayBi otomatik durum sorguları kuyruğa alınamadı", error);
    } else {
      queuedStatusChecks = Number(data || 0);
    }
  }

  const results: any[] = [];
  for (let index = 0; index < limit; index += 1) {
    try {
      const result = await processKolayBiJob(db);
      if (!result.processed) break;
      results.push(result);
    } catch (error: any) {
      results.push({ success: false, ...publicKolayBiError(error) });
    }
  }
  return res.status(200).json({
    success: true,
    queuedStatusChecks,
    processed: results.length,
    results,
  });
}
