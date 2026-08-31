import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

function text(value: unknown) {
  return value === undefined || value === null ? "" : String(value).trim();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Yalnızca POST desteklenir." });
  }

  const bearer = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : "";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!bearer) return res.status(401).json({ error: "Oturum doğrulanamadı." });
  if (!supabaseUrl || !anonKey) return res.status(500).json({ error: "Sunucu veritabanı ayarları eksik." });

  const userDb = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${bearer}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await userDb.auth.getUser(bearer);
  if (userError || !userData.user) return res.status(401).json({ error: "Oturum süresi dolmuş." });

  const { data: allowed } = await userDb.rpc("rex_has_permission" as any, {
    p_key: "integrations.connections",
    p_required: "manage",
  } as any);
  if (!allowed) return res.status(403).json({ error: "KolayBi eşleştirmelerini yönetme yetkiniz yok." });

  const recordId = text(req.body?.recordId);
  const action = text(req.body?.action);
  const localEntityId = text(req.body?.localEntityId);
  if (!recordId || !["match", "ignore", "approve", "reject"].includes(action)) {
    return res.status(400).json({ error: "Eşleştirme isteği geçersiz." });
  }
  if (action === "match" && !localEntityId) {
    return res.status(400).json({ error: "Eşleştirilecek TMS kaydını seçin." });
  }

  const productDecision = action === "approve" || action === "reject";
  const { data, error } = productDecision
    ? await userDb.rpc("rex_review_kolaybi_product" as any, {
      p_record_id: recordId,
      p_decision: action,
    } as any)
    : await userDb.rpc("rex_resolve_kolaybi_mapping" as any, {
      p_record_id: recordId,
      p_action: action,
      p_local_entity_id: localEntityId || null,
    } as any);
  if (error) {
    const message = String(error.message || "KolayBi eşleştirmesi kaydedilemedi.").slice(0, 500);
    const status = /yetkiniz yok/i.test(message) ? 403 : /bulunamadı/i.test(message) ? 404 : /zaten/i.test(message) ? 409 : 422;
    return res.status(status).json({ error: message });
  }

  return res.status(200).json({ success: true, result: data });
}
