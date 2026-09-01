import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import {
  createR2DownloadUrl,
  createR2UploadUrl,
  deleteR2Object,
  isR2Namespace,
  safeR2Path,
  type R2Namespace,
} from "@/lib/r2-server";

const rolesByNamespace: Record<R2Namespace, string[]> = {
  "shipment-documents": ["admin", "operations"],
  "shipment-exception-documents": ["admin", "operations"],
  "driver-documents": ["admin", "operations"],
  "vehicle-documents": ["admin", "operations"],
  "purchase-invoice-documents": ["admin", "accounting"],
};

const mimeTypesByNamespace: Record<R2Namespace, Set<string>> = {
  "shipment-documents": new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]),
  "shipment-exception-documents": new Set(["image/jpeg", "image/png", "image/webp"]),
  "driver-documents": new Set(["application/pdf", "image/jpeg", "image/png"]),
  "vehicle-documents": new Set(["application/pdf", "image/jpeg", "image/png"]),
  "purchase-invoice-documents": new Set(["application/pdf", "application/xml", "text/xml"]),
};

function bearerToken(req: NextApiRequest) {
  return req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : "";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Yalnızca POST desteklenir." });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return res.status(500).json({ error: "Sunucu kimlik doğrulama ayarları eksik." });

  const bearer = bearerToken(req);
  if (!bearer) return res.status(401).json({ error: "Oturum doğrulanamadı." });

  const db = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${bearer}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await db.auth.getUser(bearer);
  if (userError || !userData.user) return res.status(401).json({ error: "Oturum süresi dolmuş." });

  const namespace = req.body?.namespace;
  if (!isR2Namespace(namespace)) return res.status(400).json({ error: "Depolama alanı geçersiz." });
  const { data: allowed } = await db.rpc("rex_has_role" as never, { required_roles: rolesByNamespace[namespace] } as never);
  if (!allowed) return res.status(403).json({ error: "Bu belge alanı için yetkiniz bulunmuyor." });

  try {
    const path = safeR2Path(req.body?.path);
    const operation = req.body?.operation;
    if (operation === "upload") {
      const contentType = typeof req.body?.contentType === "string" ? req.body.contentType.trim().slice(0, 150) : "";
      const contentLength = Number(req.body?.contentLength || 0);
      if (!mimeTypesByNamespace[namespace].has(contentType) || !Number.isSafeInteger(contentLength) || contentLength < 1 || contentLength > 15 * 1024 * 1024) {
        return res.status(400).json({ error: "Dosya türü veya boyutu geçersiz." });
      }
      const url = await createR2UploadUrl(namespace, path, contentType);
      return res.status(200).json({ url, expiresIn: 300 });
    }
    if (operation === "download") {
      const url = await createR2DownloadUrl(namespace, path);
      return res.status(200).json({ url, expiresIn: 300 });
    }
    if (operation === "delete") {
      await deleteR2Object(namespace, path);
      return res.status(200).json({ deleted: true });
    }
    return res.status(400).json({ error: "Depolama işlemi geçersiz." });
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 240) : "R2 işlemi tamamlanamadı.";
    return res.status(502).json({ error: message });
  }
}
