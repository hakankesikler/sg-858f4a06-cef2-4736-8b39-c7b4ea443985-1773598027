import { supabase } from "@/integrations/supabase/client";

export type UetdsEnvironment = "disabled" | "test" | "live";
export type UetdsReporterMode = "rex" | "carrier";

export interface UetdsSettings {
  environment: UetdsEnvironment;
  reporter_mode: UetdsReporterMode;
  enforcement_enabled: boolean;
  certificate_type: string;
  certificate_number?: string | null;
  unet_number?: string | null;
  certificate_expiry?: string | null;
  gateway_url?: string | null;
  fixed_egress_ip?: string | null;
}

export interface UetdsDashboardRow {
  shipment_id: string;
  shipment_code: string;
  shipment_status: string;
  reporter_mode: UetdsReporterMode;
  planned_departure_at?: string | null;
  journey_status: string;
  reference_number?: string | null;
  last_error?: string | null;
  ready: boolean;
  missing_fields: string[];
}

export const uetdsService = {
  async getSettings(): Promise<UetdsSettings | null> {
    const { data, error } = await (supabase.from("uetds_settings" as any) as any)
      .select("environment,reporter_mode,enforcement_enabled,certificate_type,certificate_number,unet_number,certificate_expiry,gateway_url,fixed_egress_ip")
      .eq("id", true)
      .maybeSingle();
    if (error) throw error;
    return data as UetdsSettings | null;
  },

  async getDashboard(): Promise<UetdsDashboardRow[]> {
    const { data, error } = await supabase.rpc("rex_uetds_dashboard" as any);
    if (error) throw error;
    return (data || []) as unknown as UetdsDashboardRow[];
  },

  async prepareSubmission(shipmentId: string): Promise<string> {
    const { data, error } = await supabase.rpc("rex_prepare_uetds_submission" as any, {
      p_shipment_id: shipmentId,
    } as any);
    if (error) throw error;
    return data as unknown as string;
  },

  async recordCarrierReference(shipmentId: string, reference: string): Promise<string> {
    const { data, error } = await supabase.rpc("rex_record_carrier_uetds_reference" as any, {
      p_shipment_id: shipmentId,
      p_reference: reference,
    } as any);
    if (error) throw error;
    return data as unknown as string;
  },
};
