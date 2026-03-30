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
    const { data: purchases } = await supabase.from("purchases").select("subtotal, tax");
    const { data: expenses } = await supabase.from("expenses").select("amount, tax");

    const totalRevenue = invoices?.reduce((sum, inv) => sum + Number(inv.amount) + Number(inv.tax), 0) || 0;
    const totalCosts = (purchases?.reduce((sum, p) => sum + Number(p.subtotal) + Number(p.tax), 0) || 0) +
                       (expenses?.reduce((sum, e) => sum + Number(e.amount) + Number(e.tax), 0) || 0);
    const profit = totalRevenue - totalCosts;
    const paid = invoices?.filter(i => i.status === "Ödendi").length || 0;
    const pending = invoices?.filter(i => i.status === "Bekliyor").length || 0;
    const overdue = invoices?.filter(i => i.status === "Gecikmiş").length || 0;

    return { totalRevenue, totalCosts, profit, paid, pending, overdue };
  },

  async getDashboardStats() {
    const { data: invoices } = await supabase.from("invoices").select("amount, tax, status");
    const { data: purchases } = await supabase.from("purchases").select("subtotal, tax, status");
    const { data: expenses } = await supabase.from("expenses").select("amount, tax");
    const { data: projects } = await supabase.from("projects").select("budget, actual_cost, status");

    const salesRevenue = invoices?.reduce((sum, inv) => sum + Number(inv.amount) + Number(inv.tax), 0) || 0;
    const purchaseCosts = purchases?.reduce((sum, p) => sum + Number(p.subtotal) + Number(p.tax), 0) || 0;
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
  async getCustomerAccounts() {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching customer accounts:", error);
      throw error;
    }

    // Since we don't have balance on customers table, we could fetch invoices and calculate it, 
    // but for now we'll return them with a pseudo balance for the UI to handle or fetch separately if needed.
    return data?.map(c => ({ ...c, balance: 0 })) || [];
  },

  async getCustomerAccountStats() {
    const { data: customers } = await supabase.from("customers").select("id");
    const { data: invoices } = await supabase.from("invoices").select("amount, tax, status");

    const totalReceivables = invoices?.reduce((sum, inv) => {
      if (inv.status === "Bekliyor" || inv.status === "Gecikmiş") {
        return sum + Number(inv.amount) + Number(inv.tax);
      }
      return sum;
    }, 0) || 0;

    // For payables we would look at purchases from suppliers
    const { data: purchases } = await supabase.from("purchases").select("subtotal, tax, status");
    const totalPayables = purchases?.reduce((sum, pur) => {
      if (pur.status === "Bekliyor" || pur.status === "Gecikmiş") {
        return sum + Number(pur.subtotal) + Number(pur.tax);
      }
      return sum;
    }, 0) || 0;

    const netPosition = totalReceivables - totalPayables;
    const total = customers?.length || 0;
    const active = total; // Simplified active calculation

    return { totalReceivables, totalPayables, netPosition, accountCount: total, activeAccounts: active };
  },

  // ==================== EMPLOYEE ACCOUNTS (PERSONEL CARİLERİ) ====================
  async getEmployeeAccounts() {
    const { data, error } = await supabase
      .from("employee_accounts")
      .select(`
        *,
        employees (
          first_name,
          last_name,
          email,
          phone,
          position,
          department
        )
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching employee accounts:", error);
      throw error;
    }

    return data || [];
  },

  async getEmployeeAccountStats() {
    const { data } = await supabase.from("employee_accounts").select("balance, advance_balance, salary");

    const totalOwed = data?.reduce((sum, acc) => sum + (Number(acc.balance) < 0 ? Math.abs(Number(acc.balance)) : 0), 0) || 0;
    const totalAdvances = data?.reduce((sum, acc) => sum + Number(acc.advance_balance), 0) || 0;
    const monthlySalaryBudget = data?.reduce((sum, acc) => sum + Number(acc.salary), 0) || 0;
    const accountCount = data?.length || 0;

    return { totalOwed, totalAdvances, monthlySalaryBudget, accountCount };
  },

  async createEmployeeAccount(accountData: any) {
    const { data, error } = await supabase
      .from("employee_accounts")
      .insert([accountData])
      .select()
      .single();

    if (error) {
      console.error("Error creating employee account:", error);
      throw error;
    }

    return data;
  },

  async updateEmployeeAccount(id: string, accountData: any) {
    const { data, error } = await supabase
      .from("employee_accounts")
      .update({ ...accountData, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating employee account:", error);
      throw error;
    }

    return data;
  },

  // ==================== PARTNER ACCOUNTS (ORTAKLAR CARİLERİ) ====================
  async getPartnerAccounts() {
    const { data, error } = await supabase
      .from("partner_accounts")
      .select("*")
      .eq("is_active", true)
      .order("share_percentage", { ascending: false });

    if (error) {
      console.error("Error fetching partner accounts:", error);
      throw error;
    }

    return data || [];
  },

  async getPartnerAccountStats() {
    const { data } = await supabase.from("partner_accounts").select("capital_contribution, balance, share_percentage");

    const totalCapital = data?.reduce((sum, acc) => sum + Number(acc.capital_contribution), 0) || 0;
    const totalBalance = data?.reduce((sum, acc) => sum + Number(acc.balance), 0) || 0;
    const partnerCount = data?.length || 0;
    const totalShares = data?.reduce((sum, acc) => sum + Number(acc.share_percentage), 0) || 0;

    return { totalCapital, totalBalance, partnerCount, totalShares };
  },

  async createPartnerAccount(accountData: any) {
    const { data, error } = await supabase
      .from("partner_accounts")
      .insert([accountData])
      .select()
      .single();

    if (error) {
      console.error("Error creating partner account:", error);
      throw error;
    }

    return data;
  },

  async updatePartnerAccount(id: string, accountData: any) {
    const { data, error } = await supabase
      .from("partner_accounts")
      .update({ ...accountData, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating partner account:", error);
      throw error;
    }

    return data;
  },

  // ==================== ACCOUNT TRANSACTIONS ====================
  async getAccountTransactions(accountType: string, accountId: string, limit = 10) {
    const { data, error } = await supabase
      .from("account_transactions")
      .select("*")
      .eq("account_type", accountType)
      .eq("account_id", accountId)
      .order("transaction_date", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching transactions:", error);
      throw error;
    }

    return data || [];
  }
};