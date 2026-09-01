import { supabase } from "@/integrations/supabase/client";

type StorageLocation = { backend: "supabase" | "r2"; bucket: string; path: string };

function parseStorageReference(reference: string, fallbackBucket?: string): StorageLocation | null {
  if (reference.startsWith("r2://")) {
    const value = reference.slice("r2://".length);
    const slash = value.indexOf("/");
    return slash > 0 ? { backend: "r2", bucket: value.slice(0, slash), path: value.slice(slash + 1) } : null;
  }

  if (reference.startsWith("storage://")) {
    const value = reference.slice("storage://".length);
    const slash = value.indexOf("/");
    return slash > 0 ? { backend: "supabase", bucket: value.slice(0, slash), path: value.slice(slash + 1) } : null;
  }

  try {
    const url = new URL(reference);
    const marker = "/storage/v1/object/public/";
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex >= 0) {
      const value = decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
      const slash = value.indexOf("/");
      return slash > 0 ? { backend: "supabase", bucket: value.slice(0, slash), path: value.slice(slash + 1) } : null;
    }
  } catch {
    if (fallbackBucket) return { backend: "supabase", bucket: fallbackBucket, path: reference.replace(/^\/+/, "") };
  }

  return null;
}

export function storageReference(bucket: string, path: string) {
  return `storage://${bucket}/${path}`;
}

export function r2Reference(bucket: string, path: string) {
  return `r2://${bucket}/${path}`;
}

function shouldUseR2() {
  return process.env.NEXT_PUBLIC_PRIVATE_STORAGE_BACKEND === "r2";
}

async function r2Request(payload: Record<string, unknown>) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Oturum süresi dolmuş. Lütfen yeniden giriş yapın.");
  const response = await fetch("/api/storage/signed-url", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result?.error || "R2 işlemi tamamlanamadı.");
  return result as { url?: string; deleted?: boolean };
}

export async function uploadPrivateDocument(bucket: string, path: string, file: File) {
  if (!shouldUseR2()) {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { contentType: file.type, cacheControl: "3600", upsert: false });
    if (error) throw error;
    return storageReference(bucket, path);
  }

  const signed = await r2Request({
    operation: "upload",
    namespace: bucket,
    path,
    contentType: file.type,
    contentLength: file.size,
  });
  if (!signed.url) throw new Error("R2 yükleme bağlantısı oluşturulamadı.");
  const upload = await fetch(signed.url, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
  if (!upload.ok) throw new Error(`R2 yüklemesi başarısız (${upload.status}).`);
  return r2Reference(bucket, path);
}

export async function deletePrivateDocument(reference: string, fallbackBucket?: string) {
  const parsed = parseStorageReference(reference, fallbackBucket);
  if (!parsed) return;
  if (parsed.backend === "r2") {
    await r2Request({ operation: "delete", namespace: parsed.bucket, path: parsed.path });
    return;
  }
  const { error } = await supabase.storage.from(parsed.bucket).remove([parsed.path]);
  if (error) throw error;
}

export async function getPrivateDocumentSignedUrl(reference: string, fallbackBucket?: string) {
  const parsed = parseStorageReference(reference, fallbackBucket);
  if (!parsed) throw new Error("Belge adresi geçersiz.");

  if (parsed.backend === "r2") {
    const result = await r2Request({ operation: "download", namespace: parsed.bucket, path: parsed.path });
    if (!result.url) throw new Error("R2 belge bağlantısı oluşturulamadı.");
    return result.url;
  }

  const { data, error } = await supabase.storage.from(parsed.bucket).createSignedUrl(parsed.path, 300);
  if (error || !data?.signedUrl) {
    throw error || new Error("Belge bağlantısı oluşturulamadı.");
  }
  return data.signedUrl;
}

export async function openPrivateDocument(reference: string, fallbackBucket?: string) {
  const popup = window.open("about:blank", "_blank");
  if (popup) popup.opener = null;

  try {
    const signedUrl = await getPrivateDocumentSignedUrl(reference, fallbackBucket);
    if (popup) popup.location.href = signedUrl;
    else window.location.assign(signedUrl);
  } catch (error) {
    popup?.close();
    throw error;
  }
}
