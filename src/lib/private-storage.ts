import { supabase } from "@/integrations/supabase/client";

function parseStorageReference(reference: string, fallbackBucket?: string) {
  if (reference.startsWith("storage://")) {
    const value = reference.slice("storage://".length);
    const slash = value.indexOf("/");
    return slash > 0 ? { bucket: value.slice(0, slash), path: value.slice(slash + 1) } : null;
  }

  try {
    const url = new URL(reference);
    const marker = "/storage/v1/object/public/";
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex >= 0) {
      const value = decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
      const slash = value.indexOf("/");
      return slash > 0 ? { bucket: value.slice(0, slash), path: value.slice(slash + 1) } : null;
    }
  } catch {
    if (fallbackBucket) return { bucket: fallbackBucket, path: reference.replace(/^\/+/, "") };
  }

  return null;
}

export function storageReference(bucket: string, path: string) {
  return `storage://${bucket}/${path}`;
}

export async function openPrivateDocument(reference: string, fallbackBucket?: string) {
  const parsed = parseStorageReference(reference, fallbackBucket);
  if (!parsed) throw new Error("Belge adresi geçersiz.");

  const popup = window.open("", "_blank", "noopener,noreferrer");
  const { data, error } = await supabase.storage.from(parsed.bucket).createSignedUrl(parsed.path, 300);
  if (error || !data?.signedUrl) {
    popup?.close();
    throw error || new Error("Belge bağlantısı oluşturulamadı.");
  }

  if (popup) popup.location.href = data.signedUrl;
  else window.location.assign(data.signedUrl);
}
