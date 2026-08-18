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
  events: PublicTrackingEvent[];
}

export const publicTrackingService = {
  normalize(number: string) {
    return number.trim().toUpperCase();
  },

  async track(number: string): Promise<PublicTrackingResult | null> {
    const trackingNumber = this.normalize(number);
    if (!/^REX-[A-F0-9]{16}$/.test(trackingNumber)) return null;

    const { data, error } = await supabase.rpc("rex_public_track_shipment" as any, {
      p_tracking_number: trackingNumber,
    } as any);
    if (error) throw error;
    return data ? (data as unknown as PublicTrackingResult) : null;
  },
};
