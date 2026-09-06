import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { processKolayBiJob, publicKolayBiError } from "@/lib/kolaybi";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Yalnızca POST desteklenir." });

  const token = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : "";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!token) return res.status(401).json({ error: "Oturum doğrulanamadı." });
  if (!supabaseUrl || !anonKey || !serviceKey) return res.status(500).json({ error: "Sunucu veritabanı ayarları eksik." });

  const db = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await db.auth.getUser(token);
  if (userError || !userData.user) return res.status(401).json({ error: "Oturum süresi dolmuş." });
  const { data: allowed } = await db.rpc("rex_has_role" as any, {
    required_roles: ["admin", "accounting"],
  } as any);
  if (!allowed) return res.status(403).json({ error: "Faturalandırma yetkiniz bulunmuyor." });

  const invoiceId = typeof req.body?.invoiceId === "string" ? req.body.invoiceId : "";
  if (!invoiceId) return res.status(400).json({ error: "Fatura kimliği zorunludur." });

  try {
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const result = await processKolayBiJob(db, invoiceId, {
      admin,
      actorId: userData.user.id,
      actorEmail: userData.user.email,
    });
    return res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    const safe = publicKolayBiError(error);
    return res.status(safe.retryable ? 502 : 422).json({
      error: safe.message,
      retryable: safe.retryable,
      queued: safe.retryable,
    });
  }
}
