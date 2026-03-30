import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Invoice = Database["public"]["Tables"]["invoices"]["Row"];
type InvoiceInsert = Database["public"]["Tables"]["invoices"]["Insert"];
type Payment = Database["public"]["Tables"]["payments"]["Row"];
type PaymentInsert = Database["public"]["Tables"]["payments"]["Insert"];
type Purchase = Database["public"]["Tables"]["purchases"]["Row"];
type Expense = Database["public"]["Tables"]["expenses"]["Row"];
type Product = Database["public"]["Tables"]["products_services"]["Row"];
type FinancialAccount = Database["public"]["Tables"]["financial_accounts"]["Row"];
type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
type Project = Database["public"]["Tables"]["projects"]["Row"];

export const accountingService = {
  // ==================== INVOICES (SALES) ====================
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

  // ==================== PAYMENTS ====================
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

  // ==================== PURCHASES ====================
  async getPurchases() {
    const { data, error } = await supabase
      .from("purchases")
      .select("*, customers!purchases_supplier_id_fkey(name, company)")
      .order("purchase_date", { ascending: false });
    
    if (error) {
      console.error("Error fetching purchases:", error);
      throw error;
    }
    return data || [];
  },

  async createPurchase(purchase: any) {
    const { data, error } = await supabase
      .from("purchases")
      .insert(purchase)
      .select()
      .single();
    
    if (error) {
      console.error("Error creating purchase:", error);
      throw error;
    }
    return data;
  },

  async updatePurchase(id: string, updates: any) {
    const { data, error } = await supabase
      .from("purchases")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating purchase:", error);
      throw error;
    }
    return data;
  },

  async deletePurchase(id: string) {
    const { error } = await supabase
      .from("purchases")
      .delete()
      .eq("id", id);
    
    if (error) {
      console.error("Error deleting purchase:", error);
      throw error;
    }
  },

  // ==================== EXPENSES ====================
  async getExpenses() {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("expense_date", { ascending: false });
    
    if (error) {
      console.error("Error fetching expenses:", error);
      throw error;
    }
    return data || [];
  },

  async createExpense(expense: any) {
    const { data, error } = await supabase
      .from("expenses")
      .insert(expense)
      .select()
      .single();
    
    if (error) {
      console.error("Error creating expense:", error);
      throw error;
    }
    return data;
  },

  async updateExpense(id: string, updates: any) {
    const { data, error } = await supabase
      .from("expenses")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating expense:", error);
      throw error;
    }
    return data;
  },

  async deleteExpense(id: string) {
    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", id);
    
    if (error) {
      console.error("Error deleting expense:", error);
      throw error;
    }
  },

  // ==================== PRODUCTS & SERVICES ====================
  async getProducts() {
    const { data, error } = await supabase
      .from("products_services")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
    return data || [];
  },

  async createProduct(product: any) {
    const { data, error } = await supabase
      .from("products_services")
      .insert(product)
      .select()
      .single();
    
    if (error) {
      console.error("Error creating product:", error);
      throw error;
    }
    return data;
  },

  async updateProduct(id: string, updates: any) {
    const { data, error } = await supabase
      .from("products_services")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating product:", error);
      throw error;
    }
    return data;
  },

  async deleteProduct(id: string) {
    const { error } = await supabase
      .from("products_services")
      .delete()
      .eq("id", id);
    
    if (error) {
      console.error("Error deleting product:", error);
      throw error;
    }
  },

  // ==================== FINANCIAL ACCOUNTS ====================
  async getFinancialAccounts() {
    const { data, error } = await supabase
      .from("financial_accounts")
      .select("*")
      .eq("is_active", true)
      .order("account_name", { ascending: true });
    
    if (error) {
      console.error("Error fetching financial accounts:", error);
      throw error;
    }
    return data || [];
  },

  async createFinancialAccount(account: any) {
    const { data, error } = await supabase
      .from("financial_accounts")
      .insert(account)
      .select()
      .single();
    
    if (error) {
      console.error("Error creating financial account:", error);
      throw error;
    }
    return data;
  },

  // ==================== TRANSACTIONS ====================
  async getTransactions() {
    const { data, error } = await supabase
      .from("transactions")
      .select("*, financial_accounts(account_name, account_type)")
      .order("transaction_date", { ascending: false })
      .limit(50);
    
    if (error) {
      console.error("Error fetching transactions:", error);
      throw error;
    }
    return data || [];
  },

  async createTransaction(transaction: any) {
    const { data, error } = await supabase
      .from("transactions")
      .insert(transaction)
      .select()
      .single();
    
    if (error) {
      console.error("Error creating transaction:", error);
      throw error;
    }
    return data;
  },

  // ==================== PROJECTS ====================
  async getProjects() {
    const { data, error } = await supabase
      .from("projects")
      .select("*, customers(name, company)")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching projects:", error);
      throw error;
    }
    return data || [];
  },

  async getProjectById(id: string) {
    const { data, error } = await supabase
      .from("projects")
      .select("*, customers(*), project_costs(*)")
      .eq("id", id)
      .single();
    
    if (error) {
      console.error("Error fetching project:", error);
      throw error;
    }
    return data;
  },

  async createProject(project: any) {
    const { data, error } = await supabase
      .from("projects")
      .insert(project)
      .select()
      .single();
    
    if (error) {
      console.error("Error creating project:", error);
      throw error;
    }
    return data;
  },

  async updateProject(id: string, updates: any) {
    const { data, error } = await supabase
      .from("projects")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating project:", error);
      throw error;
    }
    return data;
  },

  // ==================== STATISTICS ====================
  async getFinancialStats() {
    const { data: invoices } = await supabase.from("invoices").select("amount, tax, status");
    const { data: purchases } = await supabase.from("purchases").select("amount, tax");
    const { data: expenses } = await supabase.from("expenses").select("amount, tax");

    const totalRevenue = invoices?.reduce((sum, inv) => sum + Number(inv.amount) + Number(inv.tax), 0) || 0;
    const totalCosts = (purchases?.reduce((sum, p) => sum + Number(p.amount) + Number(p.tax), 0) || 0) +
                       (expenses?.reduce((sum, e) => sum + Number(e.amount) + Number(e.tax), 0) || 0);
    const profit = totalRevenue - totalCosts;
    const paid = invoices?.filter(i => i.status === "Ödendi").length || 0;
    const pending = invoices?.filter(i => i.status === "Bekliyor").length || 0;
    const overdue = invoices?.filter(i => i.status === "Gecikmiş").length || 0;

    return { totalRevenue, totalCosts, profit, paid, pending, overdue };
  },

  async getDashboardStats() {
    const { data: invoices } = await supabase.from("invoices").select("amount, tax, status");
    const { data: purchases } = await supabase.from("purchases").select("amount, tax, status");
    const { data: expenses } = await supabase.from("expenses").select("amount, tax");
    const { data: projects } = await supabase.from("projects").select("budget, total_cost, status");

    const salesRevenue = invoices?.reduce((sum, inv) => sum + Number(inv.amount) + Number(inv.tax), 0) || 0;
    const purchaseCosts = purchases?.reduce((sum, p) => sum + Number(p.amount) + Number(p.tax), 0) || 0;
    const expenseCosts = expenses?.reduce((sum, e) => sum + Number(e.amount) + Number(e.tax), 0) || 0;
    const activeProjects = projects?.filter(p => p.status === "Devam Ediyor").length || 0;

    return {
      salesRevenue,
      purchaseCosts,
      expenseCosts,
      totalProfit: salesRevenue - purchaseCosts - expenseCosts,
      activeProjects,
      pendingInvoices: invoices?.filter(i => i.status === "Bekliyor").length || 0,
      overdueInvoices: invoices?.filter(i => i.status === "Gecikmiş").length || 0
    };
  },

  // ==================== CARI ACCOUNTS (CUSTOMERS) ====================
  async getCariAccounts() {
    const { data, error } = await supabase
      .from("cari_cards")
      .select("*, customers(name, company, email, phone)")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching cari accounts:", error);
      throw error;
    }
    return data || [];
  },

  async getCariStats() {
    const { data } = await supabase.from("cari_cards").select("balance, account_type");
    
    const totalReceivables = data?.filter(c => c.account_type === "Müşteri" && Number(c.balance) < 0)
                                  .reduce((sum, c) => sum + Math.abs(Number(c.balance)), 0) || 0;
    const totalPayables = data?.filter(c => c.account_type === "Tedarikçi" && Number(c.balance) > 0)
                               .reduce((sum, c) => sum + Number(c.balance), 0) || 0;
    
    return {
      totalReceivables,
      totalPayables,
      netPosition: totalReceivables - totalPayables,
      accountCount: data?.length || 0
    };
  }
};