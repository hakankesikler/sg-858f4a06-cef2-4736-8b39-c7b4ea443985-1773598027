import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import {
  createR2DownloadUrl,
  createR2UploadUrl,
  deleteR2Object,
  inspectR2Object,
  isR2Namespace,
  safeR2Path,
  type R2Namespace,
} from "@/lib/r2-server";

const permissionByNamespace: Record<R2Namespace, string> = {
  "shipment-documents": "operations.delivery",
  "shipment-exception-documents": "operations.exceptions",
  "driver-documents": "operations.assignments",
  "vehicle-documents": "operations.assignments",
  "purchase-invoice-documents": "accounting.purchase",
};

const mimeTypesByNamespace: Record<R2Namespace, Set<string>> = {
  "shipment-documents": new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]),
  "shipment-exception-documents": new Set(["image/jpeg", "image/png", "image/webp"]),
  "driver-documents": new Set(["application/pdf", "image/jpeg", "image/png"]),
  "vehicle-documents": new Set(["application/pdf", "image/jpeg", "image/png"]),
  "purchase-invoice-documents": new Set(["application/pdf", "application/xml", "text/xml"]),
};

const extensionByMimeType: Record<string, string> = {
  "application/pdf": "pdf",
  "application/xml": "xml",
  "text/xml": "xml",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

type UploadGrant = {
  uid: string;
  namespace: R2Namespace;
  path: string;
  contentType: string;
  contentLength: number;
  exp: number;
};

function bearerToken(req: NextApiRequest) {
  return req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : "";
}

function uploadTokenSecret() {
  const secret = process.env.R2_UPLOAD_TOKEN_SECRET?.trim() || process.env.R2_SECRET_ACCESS_KEY?.trim();
  if (!secret) throw new Error("R2 yükleme doğrulama anahtarı eksik.");
  return secret;
}

function signUploadGrant(grant: UploadGrant) {
  const payload = Buffer.from(JSON.stringify(grant)).toString("base64url");
  const signature = createHmac("sha256", uploadTokenSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function verifyUploadGrant(value: unknown, userId: string, namespace: R2Namespace, path: string): UploadGrant {
  if (typeof value !== "string" || value.length > 2400) throw new Error("Yükleme doğrulaması geçersiz.");
  const [payload, suppliedSignature, extra] = value.split(".");
  if (!payload || !suppliedSignature || extra) throw new Error("Yükleme doğrulaması geçersiz.");
  const expectedSignature = createHmac("sha256", uploadTokenSecret()).update(payload).digest("base64url");
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    throw new Error("Yükleme doğrulaması geçersiz.");
  }
  const grant = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as UploadGrant;
  if (
    grant.uid !== userId
    || grant.namespace !== namespace
    || grant.path !== path
    || !Number.isSafeInteger(grant.contentLength)
    || grant.exp < Math.floor(Date.now() / 1000)
  ) {
    throw new Error("Yükleme doğrulaması geçersiz veya süresi dolmuş.");
  }
  return grant;
}

function uuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function generatedUploadPath(namespace: R2Namespace, requestedPath: string, userId: string, contentType: string) {
  const parts = safeR2Path(requestedPath).split("/");
  let prefix: string[];
  if (namespace === "shipment-documents") {
    if (parts[0] !== "delivery-documents" || parts[1] !== userId || !uuid(parts[2] || "")) throw new Error("Belge yolu geçersiz.");
    prefix = parts.slice(0, 3);
  } else if (namespace === "shipment-exception-documents") {
    if (parts[0] !== "exceptions" || !uuid(parts[1] || "")) throw new Error("Belge yolu geçersiz.");
    prefix = parts.slice(0, 2);
  } else if (namespace === "purchase-invoice-documents") {
    if (parts[0] !== userId) throw new Error("Belge yolu geçersiz.");
    prefix = [userId];
  } else {
    if (!uuid(parts[0] || "")) throw new Error("Belge yolu geçersiz.");
    prefix = [parts[0]];
  }
  return `${prefix.join("/")}/${randomUUID()}.${extensionByMimeType[contentType]}`;
}

async function isObjectReferenced(admin: any, namespace: R2Namespace, path: string) {
  const reference = `r2://${namespace}/${path}`;
  let query: any;
  if (namespace === "shipment-documents") query = admin.from("delivery_documents").select("id").eq("file_reference", reference);
  else if (namespace === "shipment-exception-documents") query = admin.from("shipment_exceptions").select("id").contains("photo_urls", [reference]);
  else if (namespace === "purchase-invoice-documents") query = admin.from("incoming_purchase_invoices").select("id").eq("file_path", reference);
  else if (namespace === "driver-documents") query = admin.from("drivers").select("id").eq("ehliyet_dosyasi_url", reference);
  else query = admin.from("vehicles").select("id").eq("ruhsat_dosyasi_url", reference);
  const { data, error } = await query.limit(1);
  if (error) throw error;
  return Boolean(data?.length);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");
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
  const operation = req.body?.operation;
  if (!["upload", "verify-upload", "cleanup-upload", "download"].includes(operation)) {
    return res.status(400).json({ error: "Depolama işlemi geçersiz." });
  }
  const { data: allowed } = await db.rpc("rex_has_permission" as never, {
    p_key: permissionByNamespace[namespace],
    p_required: operation === "download" ? "view" : "manage",
  } as never);
  if (!allowed) return res.status(403).json({ error: "Bu belge alanı için yetkiniz bulunmuyor." });

  try {
    if (operation === "upload") {
      const contentType = typeof req.body?.contentType === "string" ? req.body.contentType.trim().slice(0, 150) : "";
      const contentLength = Number(req.body?.contentLength || 0);
      if (!mimeTypesByNamespace[namespace].has(contentType) || !Number.isSafeInteger(contentLength) || contentLength < 1 || contentLength > 15 * 1024 * 1024) {
        return res.status(400).json({ error: "Dosya türü veya boyutu geçersiz." });
      }
      const path = generatedUploadPath(namespace, req.body?.path, userData.user.id, contentType);
      const url = await createR2UploadUrl(namespace, path, contentType, contentLength);
      const uploadToken = signUploadGrant({
        uid: userData.user.id,
        namespace,
        path,
        contentType,
        contentLength,
        exp: Math.floor(Date.now() / 1000) + 600,
      });
      return res.status(200).json({ url, path, uploadToken, expiresIn: 300 });
    }

    const path = safeR2Path(req.body?.path);
    if (operation === "download") {
      const url = await createR2DownloadUrl(namespace, path);
      return res.status(200).json({ url, expiresIn: 300 });
    }

    const grant = verifyUploadGrant(req.body?.uploadToken, userData.user.id, namespace, path);
    if (operation === "verify-upload") {
      const object = await inspectR2Object(namespace, path);
      if (object.contentLength !== grant.contentLength || object.contentType !== grant.contentType) {
        await deleteR2Object(namespace, path);
        return res.status(400).json({ error: "Yüklenen dosyanın türü veya gerçek boyutu doğrulanamadı." });
      }
      return res.status(200).json({ verified: true });
    }

    const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) return res.status(503).json({ error: "Güvenli geri alma hizmeti yapılandırılmamış." });
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    if (await isObjectReferenced(admin, namespace, path)) {
      return res.status(409).json({ error: "Kayıtlı bir belge silinemez." });
    }
    await deleteR2Object(namespace, path);
    return res.status(200).json({ deleted: true });
  } catch (error) {
    console.error("[storage/signed-url] R2 operation failed", error);
    return res.status(502).json({ error: "Belge depolama işlemi güvenli biçimde tamamlanamadı." });
  }
}
