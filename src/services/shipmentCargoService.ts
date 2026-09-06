import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type ShipmentCargoItem = Tables<"shipment_cargo_items">;

export interface CargoItemInput {
  adet: number;
  cinsi: string;
  kg_ds: number;
  sira_no: number;
  birim_fiyat?: number;
  alt_toplam_fiyat?: number;
  uetds_load_type_code?: string;
  uetds_unit_code?: string;
  dangerous_goods?: boolean;
  un_number?: string;
  dangerous_transport_code?: number;
  uetds_description?: string;
  pickup_stop_id?: string | null;
  delivery_stop_id?: string | null;
  pickup_stop_key?: string;
  delivery_stop_key?: string;
  route_description?: string;
}

export const shipmentCargoService = {
  async getCargoItems(shipmentId: string): Promise<ShipmentCargoItem[]> {
    const { data, error } = await supabase
      .from("shipment_cargo_items")
      .select("*")
      .eq("shipment_id", shipmentId)
      .order("sira_no", { ascending: true });

    if (error) {
      console.error("Error fetching cargo items:", error);
      throw error;
    }

    return data || [];
  },

  async createCargoItems(shipmentId: string, items: CargoItemInput[]): Promise<void> {
    const itemsToInsert = items.map(item => ({
      shipment_id: shipmentId,
      adet: item.adet,
      cinsi: item.cinsi,
      kg_ds: item.kg_ds,
      sira_no: item.sira_no,
      birim_fiyat: item.birim_fiyat || 0,
      alt_toplam_fiyat: item.alt_toplam_fiyat || 0
      ,uetds_load_type_code: item.uetds_load_type_code || null
      ,uetds_unit_code: item.uetds_unit_code || "KG"
      ,dangerous_goods: Boolean(item.dangerous_goods)
      ,un_number: item.un_number || null
      ,dangerous_transport_code: item.dangerous_transport_code || null
      ,uetds_description: item.uetds_description || null
    }));

    const { error } = await supabase
      .from("shipment_cargo_items")
      .insert(itemsToInsert as any);

    if (error) {
      console.error("Error creating cargo items:", error);
      throw error;
    }
  },

  async updateCargoItems(shipmentId: string, items: CargoItemInput[]): Promise<void> {
    // Delete existing items
    await this.deleteCargoItems(shipmentId);
    
    // Insert new items
    await this.createCargoItems(shipmentId, items);
  },

  async deleteCargoItems(shipmentId: string): Promise<void> {
    const { error } = await supabase
      .from("shipment_cargo_items")
      .delete()
      .eq("shipment_id", shipmentId);

    if (error) {
      console.error("Error deleting cargo items:", error);
      throw error;
    }
  }
};
