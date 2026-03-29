import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Customer = Database["public"]["Tables"]["customers"]["Row"];
type CustomerInsert = Database["public"]["Tables"]["customers"]["Insert"];
type CariCard = Database["public"]["Tables"]["cari_cards"]["Row"];

export const crmService = {
  // Customers
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

  async deleteCustomer(id: string) {
    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", id);
    
    if (error) {
      console.error("Error deleting customer:", error);
      throw error;
    }
  },

  // Cari Cards
  async getCariCards() {
    const { data, error } = await supabase
      .from("cari_cards")
      .select("*, customers(*)")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching cari cards:", error);
      throw error;
    }
    return data || [];
  },

  async getCariCardByCustomerId(customerId: string) {
    const { data, error } = await supabase
      .from("cari_cards")
      .select("*, customers(*)")
      .eq("customer_id", customerId)
      .single();
    
    if (error) {
      console.error("Error fetching cari card:", error);
      throw error;
    }
    return data;
  },

  // Statistics
  async getCustomerStats() {
    const { data: customers, error } = await supabase
      .from("customers")
      .select("status");
    
    if (error) {
      console.error("Error fetching customer stats:", error);
      throw error;
    }

    const total = customers?.length || 0;
    const active = customers?.filter(c => c.status === "Aktif").length || 0;
    const potential = customers?.filter(c => c.status === "Potansiyel").length || 0;
    const old = customers?.filter(c => c.status === "Eski Müşteri").length || 0;

    return { total, active, potential, old };
  },

  // Create new customer
  async createCustomer(customerData: {
    name: string;
    company?: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    status: "Aktif" | "Potansiyel" | "Eski Müşteri";
  }) {
    const { data, error } = await supabase
      .from("customers")
      .insert([
        {
          name: customerData.name,
          company: customerData.company || null,
          email: customerData.email,
          phone: customerData.phone || null,
          address: customerData.address || null,
          city: customerData.city || null,
          status: customerData.status,
          last_contact: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating customer:", error);
      throw error;
    }

    return data;
  }
};