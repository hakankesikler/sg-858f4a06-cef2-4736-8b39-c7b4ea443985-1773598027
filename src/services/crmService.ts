import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Customer = Database["public"]["Tables"]["customers"]["Row"];

export const crmService = {
  // Get all customers
  async getCustomers() {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching customers:", error);
      return [];
    }

    return data || [];
  },

  // Get customer by ID with related data
  async getCustomerById(id: string) {
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .single();

    if (customerError) {
      console.error("Error fetching customer:", customerError);
      return null;
    }

    // Get related shipments
    const { data: shipments } = await supabase
      .from("shipments")
      .select("*")
      .eq("customer_id", id)
      .order("created_at", { ascending: false });

    // Get related invoices
    const { data: invoices } = await supabase
      .from("invoices")
      .select("*")
      .eq("customer_id", id)
      .order("created_at", { ascending: false });

    return {
      ...customer,
      shipments: shipments || [],
      invoices: invoices || []
    };
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

  // Create new customer
  async createCustomer(customerData: {
    name: string;
    company?: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    status: "Aktif" | "Potansiyel" | "Eski Müşteri";
    notes?: string;
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
          notes: customerData.notes || null,
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
  },

  // Update customer
  async updateCustomer(id: string, customerData: Partial<Customer>) {
    const { data, error } = await supabase
      .from("customers")
      .update({
        ...customerData,
        last_contact: new Date().toISOString()
      })
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

    return true;
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
  }
};