import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { processUetdsJob } from "@/lib/uetds";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET" && req.method !== "POST") return res.status(405).json({ error: "Yalnızca GET ve POST desteklenir." });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const cronSecret = process.env.CRON_SECRET;
  const bearer = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : "";
  if (!supabaseUrl || !serviceKey || !cronSecret) return res.status(503).json({ error: "U-ETDS kuyruk işleyicisi henüz etkin değil." });
  if (bearer !== cronSecret) return res.status(401).json({ error: "Yetkisiz istek." });
  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const requestedLimit = Number(req.method === "POST" ? req.body?.limit : req.query.limit);
  const limit = Math.max(1, Math.min(Number.isFinite(requestedLimit) ? requestedLimit : 5, 10));
  const results: any[] = [];
  for (let index = 0; index < limit; index += 1) {
    const result = await processUetdsJob(db);
    if (!result.processed) break;
    results.push(result);
  }
  return res.status(200).json({ success: true, processed: results.length, results });
}
