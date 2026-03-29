import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Shipment = Database["public"]["Tables"]["shipments"]["Row"];
type ShipmentInsert = Database["public"]["Tables"]["shipments"]["Insert"];
type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
type Warehouse = Database["public"]["Tables"]["warehouses"]["Row"];

export const logisticsService = {
  // Shipments
  async getShipments() {
    const { data, error } = await supabase
      .from("shipments")
      .select("*, customers(name, company), vehicles(plate_no, driver_name)")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching shipments:", error);
      throw error;
    }
    return data || [];
  },

  async getShipmentById(id: string) {
    const { data, error } = await supabase
      .from("shipments")
      .select("*, customers(*), vehicles(*)")
      .eq("id", id)
      .single();
    
    if (error) {
      console.error("Error fetching shipment:", error);
      throw error;
    }
    return data;
  },

  async createShipment(shipment: ShipmentInsert) {
    const { data, error } = await supabase
      .from("shipments")
      .insert(shipment)
      .select()
      .single();
    
    if (error) {
      console.error("Error creating shipment:", error);
      throw error;
    }
    return data;
  },

  async updateShipment(id: string, updates: Partial<ShipmentInsert>) {
    const { data, error } = await supabase
      .from("shipments")
      .update(updates)
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

  // Vehicles
  async getVehicles() {
    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching vehicles:", error);
      throw error;
    }
    return data || [];
  },

  // Warehouses
  async getWarehouses() {
    const { data, error } = await supabase
      .from("warehouses")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching warehouses:", error);
      throw error;
    }
    return data || [];
  },

  // Statistics
  async getShipmentStats() {
    const { data: shipments, error } = await supabase
      .from("shipments")
      .select("status");
    
    if (error) {
      console.error("Error fetching shipment stats:", error);
      throw error;
    }

    const active = shipments?.filter(s => s.status === "Yolda" || s.status === "Dağıtımda").length || 0;
    const pending = shipments?.filter(s => s.status === "Hazırlanıyor").length || 0;
    const completed = shipments?.filter(s => s.status === "Teslim Edildi").length || 0;

    return { active, pending, completed };
  }
};