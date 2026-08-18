import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { fetchKolayBiPdf, publicKolayBiError } from "@/lib/kolaybi";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Yalnızca GET desteklenir." });
  const token = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : "";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const invoiceId = typeof req.query.invoiceId === "string" ? req.query.invoiceId : "";
  if (!token) return res.status(401).json({ error: "Oturum doğrulanamadı." });
  if (!supabaseUrl || !anonKey) return res.status(500).json({ error: "Sunucu veritabanı ayarları eksik." });
  if (!invoiceId) return res.status(400).json({ error: "Fatura kimliği zorunludur." });

  const db = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await db.auth.getUser(token);
  if (userError || !userData.user) return res.status(401).json({ error: "Oturum süresi dolmuş." });
  const { data: allowed } = await db.rpc("rex_has_role" as any, { required_roles: ["admin", "accounting"] } as any);
  if (!allowed) return res.status(403).json({ error: "Fatura görüntüleme yetkiniz bulunmuyor." });

  try {
    const pdf = await fetchKolayBiPdf(db, invoiceId);
    const bytes = Buffer.from(pdf.base64, "base64");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=\"${String(pdf.invoiceNo).replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf\"`);
    res.setHeader("Cache-Control", "private, no-store");
    return res.status(200).send(bytes);
  } catch (error: any) {
    const safe = publicKolayBiError(error);
    return res.status(safe.retryable ? 502 : 422).json({ error: safe.message });
  }
}

