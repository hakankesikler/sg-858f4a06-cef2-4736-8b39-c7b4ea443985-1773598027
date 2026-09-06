import { supabase } from "@/integrations/supabase/client";

export type ShipmentRouteStopType = "pickup" | "delivery";

export interface ShipmentRouteStopInput {
  id?: string;
  stop_key: string;
  stop_type: ShipmentRouteStopType;
  sequence_no: number;
  company_name: string;
  address_line?: string;
  district?: string;
  city: string;
  contact_name?: string;
  contact_phone?: string;
  instructions?: string;
  planned_at?: string;
}

export interface ShipmentRouteStop extends ShipmentRouteStopInput {
  id: string;
  shipment_id: string;
  created_at?: string;
  updated_at?: string;
}

export const shipmentRouteService = {
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
