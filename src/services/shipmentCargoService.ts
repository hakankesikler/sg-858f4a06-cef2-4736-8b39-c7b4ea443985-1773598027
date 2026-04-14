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
    }));

    const { error } = await supabase
      .from("shipment_cargo_items")
      .insert(itemsToInsert);

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