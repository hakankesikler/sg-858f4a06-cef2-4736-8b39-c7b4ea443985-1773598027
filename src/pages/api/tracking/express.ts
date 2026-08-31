import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

function text(value: unknown) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function trackingStatus(payload: any) {
  const source = payload?.data || payload?.result || payload;
  const latest = source?.latest_event || source?.last_event || source?.events?.[0] || {};
  const rawStatus = text(source?.status || source?.tracking_status || source?.stage || latest?.status || latest?.stage);
  const normalized = rawStatus.toLocaleUpperCase("tr-TR");
  const canonicalStatus =
    /DELIVERED|TESLİM/.test(normalized) ? "TESLİM EDİLDİ"
    : /OUT.FOR.DELIVERY|DAĞITIMDA/.test(normalized) ? "DAĞITIMDA"
    : /CUSTOMS|GÜMRÜK/.test(normalized) ? "GÜMRÜKTE"
    : /HUB|DISTRIBUTION.CENTER|DAĞITIM MERKEZ/.test(normalized) ? "DAĞITIM MERKEZİNDE"
    : /ORIGIN|PICKED.UP|DEPARTED|ÇIKIŞ/.test(normalized) ? "ÇIKIŞ NOKTASINDA"
    : /EXCEPTION|FAILED|SORUN|İSTİSNA/.test(normalized) ? "İSTİSNA"
    : /CREATED|LABEL|OLUŞTUR/.test(normalized) ? "GÖNDERİ OLUŞTURULDU"
    : rawStatus;
  return {
    status: canonicalStatus,
    description: text(source?.description || source?.status_description || latest?.description || latest?.message),
    occurredAt: text(source?.updated_at || source?.last_update || latest?.date || latest?.occurred_at),
  };
}

async function quickShipperLookup(awb: string, reference: string) {
  const template = process.env.QUICKSHIPPER_TRACKING_API_URL;
  const apiKey = process.env.QUICKSHIPPER_API_KEY;
  if (!template || !apiKey) return null;
  const url = template
    .replaceAll("{awb}", encodeURIComponent(awb))
    .replaceAll("{reference}", encodeURIComponent(reference));
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      "X-API-Key": apiKey,
      ...(process.env.QUICKSHIPPER_CHANNEL ? { "X-Channel": process.env.QUICKSHIPPER_CHANNEL } : {}),
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`QuickShipper HTTP ${response.status}`);
  return trackingStatus(await response.json());
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Yalnızca GET desteklenir." });
  }
  const identifier = text(req.query.identifier).replace(/\s+/g, "").toUpperCase();
  if (!/^REX-[A-F0-9]{16}$/.test(identifier) && !/^[A-Z0-9-]{6,40}$/.test(identifier)) {
    return res.status(400).json({ error: "Geçersiz takip numarası." });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return res.status(503).json({ error: "Takip servisi yapılandırılmamış." });

  const publicClient = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data, error } = await publicClient.rpc("rex_public_track_shipment" as never, { p_tracking_number: identifier } as never);
  if (error) return res.status(502).json({ error: "Takip bilgisi alınamadı." });
  if (!data) return res.status(404).json({ error: "Gönderi bulunamadı." });
  const shipment: any = data;

  if (shipment.service_mode === "international_express" && shipment.awb_number) {
    try {
      const live = await quickShipperLookup(shipment.awb_number, shipment.provider_reference || "");
      if (live?.status) {
        shipment.carrier_status = live.status.toLocaleUpperCase("tr-TR");
        shipment.carrier_status_description = live.description || shipment.carrier_status_description;
        shipment.carrier_last_synced_at = live.occurredAt || new Date().toISOString();
        shipment.carrier_source = "quickshipper";

        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (serviceKey) {
          const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
          const { data: current } = await admin.from("shipments").select("id,shipment_code,carrier_status").eq("tracking_number", shipment.tracking_number).maybeSingle();
          if (current?.id) {
            await admin.from("shipments").update({
              carrier_status: shipment.carrier_status,
              carrier_status_description: shipment.carrier_status_description || null,
              carrier_last_synced_at: shipment.carrier_last_synced_at,
            }).eq("id", current.id);
            if (current.carrier_status !== shipment.carrier_status) {
              await admin.from("shipment_events").insert({
                shipment_id: current.id,
                shipment_code: current.shipment_code,
                event_type: "carrier_status_changed",
                old_status: current.carrier_status,
                new_status: shipment.carrier_status,
                changed_fields: { carrier_status: { old: current.carrier_status, new: shipment.carrier_status } },
                actor_email: "system@rexlojistik.com",
                actor_role: "system",
                source: "quickshipper",
                note: shipment.carrier_status_description || "QuickShipper taşıyıcı durum güncellemesi",
              });
            }
          }
        }
      }
    } catch {
      shipment.carrier_source = "rex_cache";
    }
  }

  res.setHeader("Cache-Control", "private, no-store");
  return res.status(200).json(shipment);
}
