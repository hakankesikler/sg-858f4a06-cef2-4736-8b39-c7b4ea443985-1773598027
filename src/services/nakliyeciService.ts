import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Driver = Database["public"]["Tables"]["drivers"]["Row"];
type DriverInsert = Database["public"]["Tables"]["drivers"]["Insert"];
type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
type VehicleInsert = Database["public"]["Tables"]["vehicles"]["Insert"];

export const nakliyeciService = {
  // Driver operations
  async createDriver(data: DriverInsert) {
    const { data: driver, error } = await supabase
      .from("drivers")
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
      .from("drivers")
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
      .from("drivers")
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
      .from("drivers")
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
      .from("vehicles")
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
      .from("vehicles")
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
      .from("vehicles")
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
      .from("vehicles")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting vehicle:", error);
      throw error;
    }
  }
};