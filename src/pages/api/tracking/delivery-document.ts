import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { createR2ViewUrl, safeR2Path } from "@/lib/r2-server";

const deliveryStatuses = new Set(["teslim_edildi", "Teslim Edildi"]);
const allowedScanStatuses = new Set(["clean", "legacy_unscanned"]);
const accessWindowMs = 24 * 60 * 60 * 1000;

function trackingNumber(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, "").toUpperCase() : "";
}

function deliveryReference(value: unknown) {
  if (typeof value !== "string") return null;
  const r2Prefix = "r2://shipment-documents/";
  const storagePrefix = "storage://shipment-documents/";
  if (value.startsWith(r2Prefix)) return { backend: "r2" as const, path: safeR2Path(value.slice(r2Prefix.length)) };
  if (value.startsWith(storagePrefix)) return { backend: "supabase" as const, path: safeR2Path(value.slice(storagePrefix.length)) };
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Yalnızca GET desteklenir." });
  }

  const tracking = trackingNumber(req.query.tracking);
  if (!/^REX-[A-F0-9]{16}$/.test(tracking)) return res.status(400).json({ error: "Geçersiz takip numarası." });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return res.status(503).json({ error: "Belge görüntüleme servisi yapılandırılmamış." });

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: shipment, error: shipmentError } = await (admin.from("shipments") as any)
    .select("id,status,delivered_at")
    .eq("tracking_number", tracking)
    .maybeSingle();
  if (shipmentError) return res.status(502).json({ error: "Teslimat bilgisi doğrulanamadı." });
  if (!shipment || !deliveryStatuses.has(shipment.status)) return res.status(404).json({ error: "Teslim edilmiş sevkiyat bulunamadı." });

  const deliveredAt = new Date(shipment.delivered_at || "").getTime();
  if (!Number.isFinite(deliveredAt)) return res.status(404).json({ error: "Teslim zamanı bulunamadı." });
  if (Date.now() >= deliveredAt + accessWindowMs) {
    return res.status(410).json({ error: "Teslim evrakının 24 saatlik görüntüleme süresi doldu." });
  }

  const { data: document, error: documentError } = await (admin.from("delivery_documents") as any)
    .select("file_reference,scan_status")
    .eq("shipment_id", shipment.id)
    .eq("document_type", "delivery_proof")
    .eq("is_active", true)
    .in("scan_status", [...allowedScanStatuses])
    .order("uploaded_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (documentError) return res.status(502).json({ error: "Teslim evrakı doğrulanamadı." });
  if (!document) return res.status(404).json({ error: "Görüntülenebilir teslim evrakı bulunamadı." });

  try {
    const reference = deliveryReference(document.file_reference);
    if (!reference || !allowedScanStatuses.has(document.scan_status)) {
      return res.status(404).json({ error: "Görüntülenebilir teslim evrakı bulunamadı." });
    }
    const signedUrl = reference.backend === "r2"
      ? await createR2ViewUrl("shipment-documents", reference.path)
      : (await admin.storage.from("shipment-documents").createSignedUrl(reference.path, 300)).data?.signedUrl;
    if (!signedUrl) return res.status(502).json({ error: "Güvenli belge bağlantısı oluşturulamadı." });
    return res.redirect(302, signedUrl);
  } catch (error) {
    console.error("[tracking/delivery-document] secure preview failed", error);
    return res.status(502).json({ error: "Teslim evrakı güvenli biçimde açılamadı." });
  }
}
