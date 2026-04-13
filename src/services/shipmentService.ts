import { supabase } from "@/integrations/supabase/client";

export interface Shipment {
  id?: string;
  shipment_code?: string;
  supplier_id?: string | null;
  driver_id?: string | null;
  vehicle_id?: string | null;
  customer_id?: string | null;
  origin: string;
  destination: string;
  pickup_date?: string | null;
  delivery_date?: string | null;
  estimated_delivery_date?: string | null;
  cost?: number | null;
  cost_currency?: string;
  currency?: string;
  status?: string;
  sender_name?: string | null;
  sender_ii?: string | null;
  receiver?: string | null;
  receiver_district?: string | null;
  receiver_ii?: string | null;
  adet?: number | null;
  cinsi?: string | null;
  kg_ds?: number | null;
  toplam_kg_ds?: number | null;
  satis_birim?: number | null;
  satis_tutar?: number | null;
  created_at?: string;
  updated_at?: string;
}

export const shipmentService = {
  async getShipments() {
    const { data, error } = await supabase
      .from("shipments")
      .select(`
        *,
        driver:drivers(id, driver_code, full_name),
        vehicle:vehicles(id, vehicle_code, cekici_plakasi, arac_tipi),
        customer:customers(id, customer_code, name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching shipments:", error);
      throw error;
    }

    return data || [];
  },

  async getNextShipmentCode(): Promise<string> {
    try {
      const { data, error } = await supabase
        .from("shipments")
        .select("shipment_code")
        .not("shipment_code", "is", null)
        .order("shipment_code", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error fetching last shipment code:", error);
        return "SHP-000001";
      }

      if (!data || data.length === 0) {
        return "SHP-000001";
      }

      const lastCode = data[0].shipment_code;
      const match = lastCode?.match(/SHP-(\d+)/);
      
      if (!match) {
        return "SHP-000001";
      }

      const lastNumber = parseInt(match[1], 10);
      const nextNumber = lastNumber + 1;
      const nextCode = `SHP-${nextNumber.toString().padStart(6, "0")}`;
      
      return nextCode;
    } catch (error) {
      console.error("Error generating shipment code:", error);
      return "SHP-000001";
    }
  },

  async createShipment(shipment: Shipment) {
    if (!shipment.shipment_code) {
      shipment.shipment_code = await this.getNextShipmentCode();
    }

    const { data, error } = await supabase
      .from("shipments")
      .insert(shipment as any)
      .select()
      .single();

    if (error) {
      console.error("Error creating shipment:", error);
      throw error;
    }

    return data;
  },

  async updateShipment(id: string, shipment: Partial<Shipment>) {
    const { data, error } = await supabase
      .from("shipments")
      .update({ ...shipment, updated_at: new Date().toISOString() } as any)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating shipment:", error);
      throw error;
    }

    return data;
  },

  async deleteShipment(id: string) {
    const { error } = await supabase
      .from("shipments")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting shipment:", error);
      throw error;
    }
  },

  async getShipmentById(id: string) {
    const { data, error } = await supabase
      .from("shipments")
      .select(`
        *,
        driver:drivers(id, driver_code, full_name, phone_1),
        vehicle:vehicles(id, vehicle_code, cekici_plakasi, arac_tipi),
        customer:customers(id, customer_code, name, phone)
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching shipment:", error);
      throw error;
    }

    return data;
  }
};