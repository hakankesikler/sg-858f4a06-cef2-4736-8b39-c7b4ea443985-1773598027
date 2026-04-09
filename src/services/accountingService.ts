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
type Customer = Database["public"]["Tables"]["customers"]["Row"];

export const accountingService = {
  // ==================== EXPENSE CATEGORIES & TYPES ====================
  async getExpenseCategories(): Promise<any[]> {
    const { data, error } = await supabase
      .from("expense_categories" as any)
      .select(`
        *,
        expense_types (*)
      `)
      .order("name");

    if (error) throw error;
    return data || [];
  },

  async createExpenseCategory(name: string): Promise<any> {
    const { data, error } = await supabase
      .from("expense_categories" as any)
      .insert({ name })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateExpenseCategory(id: string, name: string): Promise<any> {
    const { data, error } = await supabase
      .from("expense_categories" as any)
      .update({ name, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteExpenseCategory(id: string): Promise<void> {
    const { error } = await supabase
      .from("expense_categories" as any)
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async createExpenseType(categoryId: string, name: string): Promise<any> {
    const { data, error } = await supabase
      .from("expense_types" as any)
      .insert({ category_id: categoryId, name })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateExpenseType(id: string, name: string): Promise<any> {
    const { data, error } = await supabase
      .from("expense_types" as any)
      .update({ name, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteExpenseType(id: string): Promise<void> {
    const { error } = await supabase
      .from("expense_types" as any)
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  // ==================== EXPENSES ====================
  async getExpenses(filters?: {
    startDate?: string;
    endDate?: string;
    categoryId?: string;
    typeId?: string;
  }): Promise<any[]> {
    let query: any = supabase
      .from("expenses" as any)
      .select(`
        *,
        expense_categories (id, name),
        expense_types (id, name)
      `)
      .order("expense_date", { ascending: false });

    if (filters?.startDate) query = query.gte("expense_date", filters.startDate);
    if (filters?.endDate) query = query.lte("expense_date", filters.endDate);
    if (filters?.categoryId) query = query.eq("category_id", filters.categoryId);
    if (filters?.typeId) query = query.eq("type_id", filters.typeId);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async createExpense(expense: {
    type_id?: string;
    category_id?: string;
    amount: number;
    description?: string;
    expense_date: string;
    payment_method?: string;
    reference_no?: string;
  }): Promise<any> {
    const { data, error } = await supabase
      .from("expenses")
      .insert(expense)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateExpense(id: string, expense: any): Promise<any> {
    const { data, error } = await supabase
      .from("expenses")
      .update({ ...expense, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteExpense(id: string): Promise<void> {
    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  // ==================== INVOICES (SALES) ====================
  async getInvoices(): Promise<any[]> {
    const { data, error } = await supabase
      .from("invoices")
      .select("*, customers(name, company)")
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getInvoiceById(id: string): Promise<any> {
    const { data, error } = await supabase
      .from("invoices")
      .select("*, customers(*)")
      .eq("id", id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async createInvoice(invoice: InvoiceInsert): Promise<any> {
    const { data, error } = await supabase
      .from("invoices")
      .insert(invoice)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateInvoice(id: string, updates: Partial<InvoiceInsert>): Promise<any> {
    const { data, error } = await supabase
      .from("invoices")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteInvoice(id: string): Promise<void> {
    const { error } = await supabase
      .from("invoices")
      .delete()
      .eq("id", id);
    
    if (error) throw error;
  },

  // ==================== PAYMENTS ====================
  async getPayments(): Promise<any[]> {
    const { data, error } = await supabase
      .from("payments")
      .select("*, invoices(invoice_no)")
      .order("payment_date", { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async createPayment(payment: PaymentInsert): Promise<any> {
    const { data, error } = await supabase
      .from("payments")
      .insert(payment)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // ==================== PURCHASES ====================
  async getPurchases(): Promise<any[]> {
    const { data, error } = await supabase
      .from("purchases")
      .select("*, customers!purchases_supplier_id_fkey(name, company)")
      .order("purchase_date", { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async createPurchase(purchase: any): Promise<any> {
    const { data, error } = await supabase
      .from("purchases")
      .insert(purchase)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updatePurchase(id: string, updates: any): Promise<any> {
    const { data, error } = await supabase
      .from("purchases")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deletePurchase(id: string): Promise<void> {
    const { error } = await supabase
      .from("purchases")
      .delete()
      .eq("id", id);
    
    if (error) throw error;
  },

  // ==================== PRODUCTS & SERVICES ====================
  async getProducts(): Promise<any[]> {
    const { data, error } = await supabase
      .from("products_services")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async createProduct(product: any): Promise<any> {
    const { data, error } = await supabase
      .from("products_services")
      .insert(product)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateProduct(id: string, updates: any): Promise<any> {
    const { data, error } = await supabase
      .from("products_services")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase
      .from("products_services")
      .delete()
      .eq("id", id);
    
    if (error) throw error;
  },

  // ==================== FINANCIAL ACCOUNTS ====================
  async getFinancialAccounts(): Promise<any[]> {
    const { data, error } = await supabase
      .from("financial_accounts")
      .select("*")
      .eq("is_active", true)
      .order("account_name", { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async createFinancialAccount(account: any): Promise<any> {
    const { data, error } = await supabase
      .from("financial_accounts")
      .insert(account)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // ==================== TRANSACTIONS ====================
  async getTransactions(): Promise<any[]> {
    const { data, error } = await supabase
      .from("transactions")
      .select("*, financial_accounts(account_name, account_type)")
      .order("transaction_date", { ascending: false })
      .limit(50);
    
    if (error) throw error;
    return data || [];
  },

  async createTransaction(transaction: any): Promise<any> {
    const { data, error } = await supabase
      .from("transactions")
      .insert(transaction)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // ==================== PROJECTS ====================
  async getProjects(): Promise<any[]> {
    const { data, error } = await supabase
      .from("projects")
      .select("*, customers(name, company)")
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getProjectById(id: string): Promise<any> {
    const { data, error } = await supabase
      .from("projects")
      .select("*, customers(*), project_costs(*)")
      .eq("id", id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async createProject(project: any): Promise<any> {
    const { data, error } = await supabase
      .from("projects")
      .insert(project)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateProject(id: string, updates: any): Promise<any> {
    const { data, error } = await supabase
      .from("projects")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // ==================== STATISTICS ====================
  async getFinancialStats(): Promise<any> {
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

  async getDashboardStats(): Promise<any> {
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
  async getCustomerAccounts(): Promise<any[]> {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data?.map(c => ({ ...c, balance: 0 })) || [];
  },

  async getCustomerAccountStats(): Promise<any> {
    const { data: customers } = await supabase.from("customers").select("id");
    const { data: invoices } = await supabase.from("invoices").select("amount, tax, status");
    const { data: purchases } = await supabase.from("purchases").select("subtotal, tax, status");

    const totalReceivables = invoices?.reduce((sum, inv) => {
      if (inv.status === "Bekliyor" || inv.status === "Gecikmiş") {
        return sum + Number(inv.amount) + Number(inv.tax);
      }
      return sum;
    }, 0) || 0;

    const totalPayables = purchases?.reduce((sum, pur) => {
      if (pur.status === "Bekliyor" || pur.status === "Gecikmiş") {
        return sum + Number(pur.subtotal) + Number(pur.tax);
      }
      return sum;
    }, 0) || 0;

    const netPosition = totalReceivables - totalPayables;
    const total = customers?.length || 0;

    return { totalReceivables, totalPayables, netPosition, accountCount: total, activeAccounts: total };
  },

  // ==================== EMPLOYEE ACCOUNTS (PERSONEL CARİLERİ) ====================
  async getEmployeeAccounts(): Promise<any[]> {
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

    if (error) throw error;
    return data || [];
  },

  async getEmployeeAccountStats(): Promise<any> {
    const { data } = await supabase.from("employee_accounts").select("balance, advance_balance, salary");

    const totalOwed = data?.reduce((sum, acc) => sum + (Number(acc.balance) < 0 ? Math.abs(Number(acc.balance)) : 0), 0) || 0;
    const totalAdvances = data?.reduce((sum, acc) => sum + Number(acc.advance_balance), 0) || 0;
    const monthlySalaryBudget = data?.reduce((sum, acc) => sum + Number(acc.salary), 0) || 0;
    const accountCount = data?.length || 0;

    return { totalOwed, totalAdvances, monthlySalaryBudget, accountCount };
  },

  async createEmployeeAccount(accountData: any): Promise<any> {
    const { data, error } = await supabase
      .from("employee_accounts")
      .insert([accountData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateEmployeeAccount(id: string, accountData: any): Promise<any> {
    const { data, error } = await supabase
      .from("employee_accounts")
      .update({ ...accountData, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ==================== PARTNER ACCOUNTS (ORTAKLAR CARİLERİ) ====================
  async getPartnerAccounts(): Promise<any[]> {
    const { data, error } = await supabase
      .from("partner_accounts")
      .select("*")
      .eq("is_active", true)
      .order("share_percentage", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getPartnerAccountStats(): Promise<any> {
    const { data } = await supabase.from("partner_accounts").select("capital_contribution, balance, share_percentage");

    const totalCapital = data?.reduce((sum, acc) => sum + Number(acc.capital_contribution), 0) || 0;
    const totalBalance = data?.reduce((sum, acc) => sum + Number(acc.balance), 0) || 0;
    const partnerCount = data?.length || 0;
    const totalShares = data?.reduce((sum, acc) => sum + Number(acc.share_percentage), 0) || 0;

    return { totalCapital, totalBalance, partnerCount, totalShares };
  },

  async createPartnerAccount(accountData: any): Promise<any> {
    const { data, error } = await supabase
      .from("partner_accounts")
      .insert([accountData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePartnerAccount(id: string, accountData: any): Promise<any> {
    const { data, error } = await supabase
      .from("partner_accounts")
      .update({ ...accountData, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ==================== ACCOUNT TRANSACTIONS ====================
  async getAccountTransactions(accountType: string, accountId: string, limit = 10): Promise<any[]> {
    const { data, error } = await supabase
      .from("account_transactions")
      .select("*")
      .eq("account_type", accountType)
      .eq("account_id", accountId)
      .order("transaction_date", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  // ==================== SALES INVOICES (DETAILED) ====================
  async getSalesInvoices(): Promise<any[]> {
    const { data, error } = await supabase
      .from("sales_invoices")
      .select(`
        *,
        customers (
          name,
          company,
          email,
          phone,
          address,
          tax_id:id,
          tax_office:name
        ),
        sales_invoice_items (
          id,
          product_code,
          description,
          quantity,
          unit,
          unit_price,
          subtotal,
          tax_rate,
          tax_amount,
          discount_amount,
          total
        )
      `)
      .order("invoice_date", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getSalesInvoiceById(id: string): Promise<any> {
    const { data, error } = await supabase
      .from("sales_invoices")
      .select(`
        *,
        customers (
          name,
          company,
          email,
          phone,
          address,
          tax_id:id,
          tax_office:name,
          city:name,
          country:name
        ),
        sales_invoice_items (
          id,
          product_code,
          description,
          quantity,
          unit,
          unit_price,
          subtotal,
          tax_rate,
          tax_amount,
          discount_amount,
          total
        )
      `)
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async createSalesInvoice(invoiceData: any, items: any[]): Promise<any> {
    // Create invoice header
    const { data: invoice, error: invoiceError } = await supabase
      .from("sales_invoices")
      .insert([invoiceData])
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // Create invoice items
    const itemsWithInvoiceId = items.map(item => ({
      ...item,
      invoice_id: invoice.id
    }));

    const { error: itemsError } = await supabase
      .from("sales_invoice_items")
      .insert(itemsWithInvoiceId);

    if (itemsError) throw itemsError;

    return invoice;
  },

  async updateSalesInvoice(id: string, invoiceData: any, items?: any[]): Promise<any> {
    // Update invoice header
    const { data: invoice, error: invoiceError } = await supabase
      .from("sales_invoices")
      .update({ ...invoiceData, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // If items provided, update them
    if (items && items.length > 0) {
      // Delete existing items
      await supabase.from("sales_invoice_items").delete().eq("invoice_id", id);

      // Insert new items
      const itemsWithInvoiceId = items.map(item => ({
        ...item,
        invoice_id: id
      }));

      const { error: itemsError } = await supabase
        .from("sales_invoice_items")
        .insert(itemsWithInvoiceId);

      if (itemsError) throw itemsError;
    }

    return invoice;
  },

  async deleteSalesInvoice(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("sales_invoices")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  },

  async getSalesInvoiceStats(): Promise<any> {
    const { data } = await supabase.from("sales_invoices").select("grand_total, payment_status, invoice_date");

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const totalRevenue = data?.reduce((sum, inv) => sum + Number(inv.grand_total), 0) || 0;
    const paidInvoices = data?.filter(inv => inv.payment_status === "Ödendi").length || 0;
    const pendingInvoices = data?.filter(inv => inv.payment_status === "Bekliyor").length || 0;
    const overdueInvoices = data?.filter(inv => inv.payment_status === "Gecikmiş").length || 0;
    
    const monthlyRevenue = data?.filter(inv => {
      const invDate = new Date(inv.invoice_date);
      return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
    }).reduce((sum, inv) => sum + Number(inv.grand_total), 0) || 0;

    return {
      totalRevenue,
      monthlyRevenue,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      totalInvoices: data?.length || 0
    };
  }
};