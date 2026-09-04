import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { synchronizeKolayBiAssociate } from "@/lib/kolaybi-associates";

function isReviewRequired(error: any) {
  const message = String(error?.message || "");
  return Boolean(error?.reviewRequired)
    || message.includes("VKN")
    || message.includes("TCKN")
    || message.includes("başka bir REX TYS")
    || message.includes("birden fazla cari");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET" && req.method !== "POST") return res.status(405).json({ error: "Yalnızca GET ve POST desteklenir." });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const cronSecret = process.env.CRON_SECRET;
  const bearer = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : "";
  const isCron = req.method === "GET" && Boolean(cronSecret && bearer === cronSecret);
  if (!supabaseUrl || !anonKey || !serviceKey) return res.status(500).json({ error: "Sunucu ayarları eksik." });

  let actorId: string | null = null;
  let actorEmail: string | null = null;
  if (!isCron) {
    if (req.method !== "POST" || !bearer) return res.status(401).json({ error: "Oturum doğrulanamadı." });
    const userDb = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${bearer}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await userDb.auth.getUser(bearer);
    if (userError || !userData.user) return res.status(401).json({ error: "Oturum süresi dolmuş." });
    const { data: allowed } = await userDb.rpc("rex_has_permission" as any, {
      p_key: "integrations.connections", p_required: "manage",
    } as any);
    if (!allowed) return res.status(403).json({ error: "Senkronizasyon yönetimi için yetkiniz yok." });
    actorId = userData.user.id;
    actorEmail = userData.user.email || null;
  }

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const rawLimit = Number(req.method === "POST" ? req.body?.limit : req.query.limit);
  const limit = Math.max(1, Math.min(Number.isFinite(rawLimit) ? rawLimit : 20, 50));
  const workerId = `${isCron ? "cron" : "manual"}:${crypto.randomUUID()}`;
  const results: any[] = [];

  for (let index = 0; index < limit; index += 1) {
    const { data: job, error: claimError } = await admin.rpc("rex_claim_kolaybi_outbound_job" as any, {
      p_worker_id: workerId,
    } as any);
    if (claimError) return res.status(500).json({ error: claimError.message, processed: results.length, results });
    if (!job?.id) break;

    try {
      const result = await synchronizeKolayBiAssociate({
        admin,
        customerId: String(job.entity_id),
        actorId,
        actorEmail: actorEmail || (isCron ? "system@rex.local" : null),
      });
      const { error: finishError } = await admin.rpc("rex_finish_kolaybi_outbound_job" as any, {
        p_job_id: job.id, p_success: true, p_retryable: false, p_error: null,
      } as any);
      if (finishError) throw finishError;
      results.push({ jobId: job.id, customerId: job.entity_id, success: true, ...result });
    } catch (error: any) {
      const message = String(error?.message || "KolayBi cari senkronizasyonu tamamlanamadı.").slice(0, 500);
      const reviewRequired = isReviewRequired(error);
      await admin.rpc("rex_finish_kolaybi_outbound_job" as any, {
        p_job_id: job.id, p_success: false, p_retryable: !reviewRequired, p_error: message,
      } as any);
      results.push({ jobId: job.id, customerId: job.entity_id, success: false, reviewRequired, error: message });
    }
  }

  return res.status(200).json({
    success: results.every((item) => item.success),
    automatic: isCron,
    processed: results.length,
    succeeded: results.filter((item) => item.success).length,
    failed: results.filter((item) => !item.success).length,
    results,
  });
}
