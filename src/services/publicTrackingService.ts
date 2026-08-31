import { supabase } from "@/integrations/supabase/client";

export interface PublicTrackingEvent {
  event_type: string;
  old_status?: string | null;
  new_status?: string | null;
  event_at: string;
}

export interface PublicTrackingResult {
  tracking_number: string;
  shipment_code: string;
  status: string;
  origin?: string | null;
  destination?: string | null;
  pickup_date?: string | null;
  estimated_delivery_date?: string | null;
  delivery_date?: string | null;
  delivered_to?: string | null;
  delivery_proof_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  service_mode?: "road" | "international_express";
  booking_provider?: string | null;
  express_carrier?: string | null;
  awb_number?: string | null;
  provider_reference?: string | null;
  package_type?: "document" | "package" | null;
  origin_country_code?: string | null;
  destination_country_code?: string | null;
  carrier_status?: string | null;
  carrier_status_description?: string | null;
  carrier_last_synced_at?: string | null;
  carrier_tracking_url?: string | null;
  events: PublicTrackingEvent[];
}

export const publicTrackingService = {
  normalize(number: string) {
    return number.trim().replace(/\s+/g, "").toUpperCase();
  },

  async track(number: string): Promise<PublicTrackingResult | null> {
    const trackingNumber = this.normalize(number);
    if (!/^REX-[A-F0-9]{16}$/.test(trackingNumber) && !/^[A-Z0-9-]{6,40}$/.test(trackingNumber)) return null;

    try {
      const response = await fetch(`/api/tracking/express?identifier=${encodeURIComponent(trackingNumber)}`, {
        headers: { Accept: "application/json" },
      });
      if (response.status === 404) return null;
      if (response.ok) return await response.json() as PublicTrackingResult;
    } catch {
      // Ağ veya sağlayıcı sorunu halinde mevcut REX takip kaydına güvenli biçimde dön.
    }

    const { data, error } = await supabase.rpc("rex_public_track_shipment" as any, {
      p_tracking_number: trackingNumber,
    } as any);
    if (error) throw error;
    return data ? (data as unknown as PublicTrackingResult) : null;
  },
};
