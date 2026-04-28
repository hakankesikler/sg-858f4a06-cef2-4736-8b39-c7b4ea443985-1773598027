import { supabase } from "@/integrations/supabase/client";

export interface Customer {
  id?: string;
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  address?: string;
  status?: string;
  last_contact?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  city?: string;
  account_type?: string;
  tc_no?: string;
  vergi_no?: string;
  tax_office?: string;
  mersis?: string;
  ticaret_sicil_no?: string;
  short_name?: string;
  tags?: string;
  website?: string;
  fax?: string;
  branch_address?: string;
  invoice_email?: string;
  district?: string;
  postal_code?: string;
  vade_gunu?: number | null;
  sabit_iskonto?: number | null;
  supplier_category?: string | null;
  customer_code?: string;
  // Nakliyeci alanları
  authorized_person_name?: string | null;
  authorized_person_phone?: string | null;
  authorized_person_email?: string | null;
  work_area?: string | null;
  specialty?: string[] | null;
  payment_method?: string | null;
  payment_day?: number | null;
  // Forwarder/Havayolu alanları
  carrier_type?: string | null;
  iata_code?: string | null;
  fiata_number?: string | null;
  scac_code?: string | null;
  airline_prefix?: string | null;
  service_types?: string[] | null;
  service_regions?: string[] | null;
  equipment_types?: string[] | null;
}

export const crmService = {
  // Get all customers
  async getCustomers() {
    console.log("=== CRM SERVICE GET CUSTOMERS START ===");
    
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("name", { ascending: true });

    console.log("=== RAW SUPABASE QUERY RESULT ===");
    console.log("Error:", error);
    console.log("Data count:", data?.length || 0);
    
    if (error) {
      console.error("Error fetching customers:", error);
      throw error;
    }

    console.log("=== SEARCHING FOR TEKNİK İSTİF ===");
    
    // Search with exact vergi_no
    const byVergiNo = data?.find(c => c.vergi_no === '8360477578');
    console.log("Search by vergi_no '8360477578':", byVergiNo ? "FOUND" : "NOT FOUND");
    if (byVergiNo) {
      console.log("✅ FOUND BY VERGI NO:", {
        id: byVergiNo.id,
        code: byVergiNo.customer_code,
        name: byVergiNo.name,
        account_type: byVergiNo.account_type
      });
    }
    
    // Search by name containing "TEKNİK"
    const byName = data?.filter(c => c.name?.includes('TEKNİK'));
    console.log("Search by name containing 'TEKNİK':", byName?.length || 0, "results");
    if (byName && byName.length > 0) {
      console.log("First match:", byName[0].name);
    }
    
    // Search by name containing "ISTIF" (without İ)
    const byNameAlt = data?.filter(c => c.name?.includes('ISTIF') || c.name?.includes('İSTİF'));
    console.log("Search by name containing 'ISTIF/İSTİF':", byNameAlt?.length || 0, "results");
    
    // List first 20 customer codes to see the pattern
    console.log("First 20 customer codes:", data?.slice(0, 20).map(c => c.customer_code));
    
    // Check CST-000306 specifically
    const byCode = data?.find(c => c.customer_code === 'CST-000306');
    console.log("Search by customer_code 'CST-000306':", byCode ? "FOUND" : "NOT FOUND");
    if (byCode) {
      console.log("✅ FOUND BY CODE:", {
        id: byCode.id,
        name: byCode.name,
        account_type: byCode.account_type
      });
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
  async getNextCustomerCode(accountType: string, supplierCategory?: string): Promise<string> {
    try {
      // Determine prefix based on account type and supplier category
      let prefix = "CST"; // Customer
      
      if (accountType === "musteri") {
        prefix = "CST";
      } else if (accountType === "tedarikci") {
        if (supplierCategory === "nakliyeci") {
          prefix = "NKL";
        } else if (supplierCategory === "forwarder") {
          prefix = "FWD";
        } else {
          prefix = "YGD"; // Yardımcı/Diğer tedarikçi
        }
      } else if (accountType === "personel") {
        prefix = "PRS";
      } else if (accountType === "ortak") {
        prefix = "ORT";
      }

      // Get the latest customer code with this prefix
      const { data, error } = await supabase
        .from("customers")
        .select("customer_code")
        .not("customer_code", "is", null)
        .like("customer_code", `${prefix}-%`)
        .order("customer_code", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error fetching last customer code:", error);
        return `${prefix}-000001`;
      }

      if (!data || data.length === 0) {
        // No customers with this prefix yet
        return `${prefix}-000001`;
      }

      // Extract number from last code (e.g., "CST-000001" -> 1)
      const lastCode = data[0].customer_code;
      const match = lastCode?.match(new RegExp(`${prefix}-(\\d+)`));
      
      if (!match) {
        // Invalid format, start fresh
        return `${prefix}-000001`;
      }

      const lastNumber = parseInt(match[1], 10);
      const nextNumber = lastNumber + 1;
      
      // Format with leading zeros (CST-000001, CST-000002, etc.)
      const nextCode = `${prefix}-${nextNumber.toString().padStart(6, "0")}`;
      
      console.log("=== GENERATED CUSTOMER CODE ===");
      console.log("Account Type:", accountType);
      console.log("Supplier Category:", supplierCategory);
      console.log("Prefix:", prefix);
      console.log("Next Code:", nextCode);
      
      return nextCode;
    } catch (error) {
      console.error("Error generating customer code:", error);
      return "CST-000001";
    }
  },

  // Create new customer
  async createCustomer(customer: Customer) {
    // Generate customer code if not provided
    if (!customer.customer_code) {
      customer.customer_code = await this.getNextCustomerCode(
        customer.account_type || "musteri",
        customer.supplier_category || undefined
      );
    }

    console.log("=== CREATING CUSTOMER ===");
    console.log("Customer Code:", customer.customer_code);
    console.log("Account Type:", customer.account_type);

    const { data, error } = await supabase
      .from("customers")
      .insert(customer)
      .select()
      .single();

    if (error) {
      console.error("Error creating customer:", error);
      throw error;
    }

    return data;
  },

  // Update customer
  async updateCustomer(id: string, updates: Partial<Customer>) {
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