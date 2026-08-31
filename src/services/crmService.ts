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
  kolaybi_contact_id?: number | null;
  kolaybi_address_id?: number | null;
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
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .is("archived_at", null)
      .range(0, 999)
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
  async getNextCustomerCode(accountType: string, supplierCategory?: string): Promise<string> {
    try {
      // Determine prefix based on account type and supplier category
      let prefix = "CST"; // Customer
      
      if (accountType === "musteri") {
        prefix = "CST";
      } else if (accountType === "tedarikci") {
        if (supplierCategory === "nakliyeci") {
          prefix = "NKL";
        } else if (supplierCategory === "tasiyici") {
          prefix = "TSY";
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

    const { data, error } = await supabase
      .from("customers")
      .insert(customer as any)
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
      .update(updates as any)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating customer:", error);
      throw error;
    }

    return data;
  },

  async archiveCustomer(id: string, reason: string) {
    const { error } = await supabase.rpc("rex_archive_customer" as never, {
      p_customer_id: id,
      p_reason: reason,
    } as never);
    if (error) {
      throw error;
    }
  },

  async bulkImportCustomers(fileName: string, idempotencyKey: string, rows: Array<Record<string, unknown>>) {
    const { data, error } = await supabase.rpc("rex_crm_import_customers" as never, {
      p_file_name: fileName,
      p_idempotency_key: idempotencyKey,
      p_rows: rows,
    } as never);
    if (error) throw error;
    return data as unknown as { batch_id: string; row_count: number; already_processed: boolean };
  },

  async mergeCustomers(sourceId: string, targetId: string, reason: string) {
    const { error } = await supabase.rpc("rex_crm_merge_customers" as never, {
      p_source: sourceId,
      p_target: targetId,
      p_reason: reason,
    } as never);
    if (error) throw error;
  }
};
