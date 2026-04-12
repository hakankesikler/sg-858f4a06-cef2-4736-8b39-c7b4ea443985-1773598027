import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Customer = Database["public"]["Tables"]["customers"]["Row"];
type CustomerInsert = Database["public"]["Tables"]["customers"]["Insert"];

export const crmService = {
  // Get all customers
  async getCustomers() {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching customers:", error);
      throw error;
    }

    return data || [];
  },

  // Get customer by ID with related data
  async getCustomerById(id: string) {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching customer:", error);
      throw error;
    }

    return data;
  },

  // Get customer stats
  async getCustomerStats() {
    const customers = await this.getCustomers();
    
    const total = customers.length;
    const active = customers.filter(c => c.status === "Aktif").length || 0;
    const potential = customers.filter(c => c.status === "Potansiyel").length || 0;
    const old = customers.filter(c => c.status === "Eski Müşteri").length || 0;

    return { total, active, potential, old };
  },

  // Get unique cities for filter
  async getCities() {
    const { data, error } = await supabase
      .from("customers")
      .select("city")
      .not("city", "is", null);

    if (error) {
      console.error("Error fetching cities:", error);
      return [];
    }

    const cities = [...new Set(data.map(c => c.city).filter(Boolean))];
    return cities.sort();
  },

  // Get next customer code
  async getNextCustomerCode(): Promise<string> {
    try {
      // Get the latest customer code
      const { data, error } = await supabase
        .from("customers")
        .select("customer_code")
        .not("customer_code", "is", null)
        .order("customer_code", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error fetching last customer code:", error);
        // If error, start from CAR000001
        return "CAR000001";
      }

      if (!data || data.length === 0) {
        // No customers yet, start from CAR000001
        return "CAR000001";
      }

      // Extract number from last code (e.g., "CAR000123" -> 123)
      const lastCode = data[0].customer_code;
      const match = lastCode?.match(/CAR(\d+)/);
      
      if (!match) {
        // Invalid format, start fresh
        return "CAR000001";
      }

      const lastNumber = parseInt(match[1], 10);
      const nextNumber = lastNumber + 1;
      
      // Format with leading zeros (CAR000001, CAR000002, etc.)
      const nextCode = `CAR${nextNumber.toString().padStart(6, "0")}`;
      
      return nextCode;
    } catch (error) {
      console.error("Error generating customer code:", error);
      return "CAR000001";
    }
  },

  // Create new customer
  async createCustomer(data: CustomerInsert) {
    // Generate customer code if not provided
    if (!data.customer_code) {
      data.customer_code = await this.getNextCustomerCode();
    }

    const { data: customer, error } = await supabase
      .from("customers")
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error("Error creating customer:", error);
      throw error;
    }

    return customer;
  },

  // Update customer
  async updateCustomer(id: string, updates: Partial<CustomerInsert>) {
    const { data, error } = await supabase
      .from("customers")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating customer:", error);
      throw error;
    }

    return data;
  },

  // Delete customer
  async deleteCustomer(id: string) {
    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting customer:", error);
      throw error;
    }
  }
};