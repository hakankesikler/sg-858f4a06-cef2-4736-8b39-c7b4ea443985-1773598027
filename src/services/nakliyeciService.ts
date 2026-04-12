import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Driver = Database["public"]["Tables"]["customer_drivers"]["Row"];
type DriverInsert = Database["public"]["Tables"]["customer_drivers"]["Insert"];
type Vehicle = Database["public"]["Tables"]["customer_vehicles"]["Row"];
type VehicleInsert = Database["public"]["Tables"]["customer_vehicles"]["Insert"];

export const nakliyeciService = {
  // Driver operations
  async createDriver(data: DriverInsert) {
    const { data: driver, error } = await supabase
      .from("customer_drivers")
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error("Error creating driver:", error);
      throw error;
    }

    return driver;
  },

  async getDriversByCustomer(customerId: string) {
    const { data, error } = await supabase
      .from("customer_drivers")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching drivers:", error);
      throw error;
    }

    return data || [];
  },

  async updateDriver(id: string, updates: Partial<DriverInsert>) {
    const { data, error } = await supabase
      .from("customer_drivers")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating driver:", error);
      throw error;
    }

    return data;
  },

  async deleteDriver(id: string) {
    const { error } = await supabase
      .from("customer_drivers")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting driver:", error);
      throw error;
    }
  },

  // Vehicle operations
  async createVehicle(data: VehicleInsert) {
    const { data: vehicle, error } = await supabase
      .from("customer_vehicles")
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error("Error creating vehicle:", error);
      throw error;
    }

    return vehicle;
  },

  async getVehiclesByCustomer(customerId: string) {
    const { data, error } = await supabase
      .from("customer_vehicles")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching vehicles:", error);
      throw error;
    }

    return data || [];
  },

  async updateVehicle(id: string, updates: Partial<VehicleInsert>) {
    const { data, error } = await supabase
      .from("customer_vehicles")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating vehicle:", error);
      throw error;
    }

    return data;
  },

  async deleteVehicle(id: string) {
    const { error } = await supabase
      .from("customer_vehicles")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting vehicle:", error);
      throw error;
    }
  }
};