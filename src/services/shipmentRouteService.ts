import { supabase } from "@/integrations/supabase/client";

export type ShipmentRouteStopType = "pickup" | "delivery";
export type ShipmentPartyType = "corporate" | "individual";

export interface ShipmentRouteStopInput {
  id?: string;
  stop_key: string;
  stop_type: ShipmentRouteStopType;
  sequence_no: number;
  company_name: string;
  party_type?: ShipmentPartyType;
  identity_no?: string | null;
  source_customer_id?: string | null;
  address_line?: string;
  district?: string;
  city: string;
  contact_name?: string;
  contact_phone?: string;
  instructions?: string;
  planned_at?: string;
}

export interface ShipmentPartyDirectoryEntry {
  id: string;
  customer_id?: string | null;
  party_type: ShipmentPartyType;
  identity_no?: string | null;
  company_name: string;
  address_line?: string | null;
  district?: string | null;
  city?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  use_count: number;
  last_used_at: string;
}

export interface ShipmentRouteStop extends ShipmentRouteStopInput {
  id: string;
  shipment_id: string;
  created_at?: string;
  updated_at?: string;
}

export const shipmentRouteService = {
  async getPartyDirectory(): Promise<ShipmentPartyDirectoryEntry[]> {
    const rows: ShipmentPartyDirectoryEntry[] = [];
    const pageSize = 1000;
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await supabase.from("shipment_party_directory")
        .select("id,customer_id,party_type,identity_no,company_name,address_line,district,city,contact_name,contact_phone,use_count,last_used_at")
        .order("last_used_at", { ascending: false })
        .order("id", { ascending: true })
        .range(from, from + pageSize - 1);
      if (error) throw error;
      const page = (data || []) as ShipmentPartyDirectoryEntry[];
      rows.push(...page);
      if (page.length < pageSize) break;
    }
    return rows;
  },

  async getStops(shipmentId: string): Promise<ShipmentRouteStop[]> {
    const { data, error } = await supabase.from("shipment_route_stops")
      .select("*")
      .eq("shipment_id", shipmentId)
      .order("stop_type", { ascending: true })
      .order("sequence_no", { ascending: true });
    if (error) throw error;
    return (data || []) as ShipmentRouteStop[];
  },
};
