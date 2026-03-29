import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Invoice = Database["public"]["Tables"]["invoices"]["Row"];
type InvoiceInsert = Database["public"]["Tables"]["invoices"]["Insert"];
type Payment = Database["public"]["Tables"]["payments"]["Row"];
type PaymentInsert = Database["public"]["Tables"]["payments"]["Insert"];

export const accountingService = {
  // Invoices
  async getInvoices() {
    const { data, error } = await supabase
      .from("invoices")
      .select("*, customers(name, company)")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching invoices:", error);
      throw error;
    }
    return data || [];
  },

  async getInvoiceById(id: string) {
    const { data, error } = await supabase
      .from("invoices")
      .select("*, customers(*)")
      .eq("id", id)
      .single();
    
    if (error) {
      console.error("Error fetching invoice:", error);
      throw error;
    }
    return data;
  },

  async createInvoice(invoice: InvoiceInsert) {
    const { data, error } = await supabase
      .from("invoices")
      .insert(invoice)
      .select()
      .single();
    
    if (error) {
      console.error("Error creating invoice:", error);
      throw error;
    }
    return data;
  },

  async updateInvoice(id: string, updates: Partial<InvoiceInsert>) {
    const { data, error } = await supabase
      .from("invoices")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating invoice:", error);
      throw error;
    }
    return data;
  },

  async deleteInvoice(id: string) {
    const { error } = await supabase
      .from("invoices")
      .delete()
      .eq("id", id);
    
    if (error) {
      console.error("Error deleting invoice:", error);
      throw error;
    }
  },

  // Payments
  async getPayments() {
    const { data, error } = await supabase
      .from("payments")
      .select("*, invoices(invoice_no)")
      .order("payment_date", { ascending: false });
    
    if (error) {
      console.error("Error fetching payments:", error);
      throw error;
    }
    return data || [];
  },

  async createPayment(payment: PaymentInsert) {
    const { data, error } = await supabase
      .from("payments")
      .insert(payment)
      .select()
      .single();
    
    if (error) {
      console.error("Error creating payment:", error);
      throw error;
    }
    return data;
  },

  // Statistics
  async getFinancialStats() {
    const { data: invoices, error } = await supabase
      .from("invoices")
      .select("amount, tax, status");
    
    if (error) {
      console.error("Error fetching financial stats:", error);
      throw error;
    }

    const totalRevenue = invoices?.reduce((sum, inv) => sum + Number(inv.amount) + Number(inv.tax), 0) || 0;
    const paid = invoices?.filter(i => i.status === "Ödendi").length || 0;
    const pending = invoices?.filter(i => i.status === "Bekliyor").length || 0;
    const overdue = invoices?.filter(i => i.status === "Gecikmiş").length || 0;

    return { totalRevenue, paid, pending, overdue };
  }
};