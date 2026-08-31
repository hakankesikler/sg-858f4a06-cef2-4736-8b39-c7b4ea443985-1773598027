import { supabase } from "@/integrations/supabase/client";

export type KolayBiOfficeData = {
  salesInvoices: any[];
  purchaseInvoices: any[];
  expenses: any[];
  products: any[];
  customers: any[];
  financialAccounts: any[];
  transactions: any[];
  projects: any[];
  shipments: any[];
  providerRecords: any[];
  syncRuns: any[];
};

async function rows(table: string, orderColumn = "created_at", ascending = false, limit = 500) {
  const { data, error } = await (supabase.from(table as any) as any)
    .select("*")
    .order(orderColumn, { ascending })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

async function optionalRows(table: string, orderColumn = "created_at", limit = 500) {
  try { return await rows(table, orderColumn, false, limit); } catch { return []; }
}

async function authenticatedFetch(url: string, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Oturum süresi dolmuş. Lütfen yeniden giriş yapın.");
  const response = await fetch(url, {
    ...init,
    headers: { ...(init.headers || {}), Authorization: `Bearer ${token}` },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "KolayBi entegrasyon işlemi tamamlanamadı.");
  return result;
}

export const kolaybiOfficeService = {
  async getData(): Promise<KolayBiOfficeData> {
    const [
      salesInvoices, purchaseInvoices, expenses, products, customers,
      financialAccounts, transactions, projects, shipments, providerRecords, syncRuns,
    ] = await Promise.all([
      rows("sales_invoices", "created_at"),
      optionalRows("purchase_invoices", "created_at"),
      rows("expenses", "expense_date"),
      rows("products_services", "created_at"),
      rows("customers", "created_at"),
      rows("financial_accounts", "created_at"),
      rows("transactions", "transaction_date"),
      rows("projects", "created_at"),
      rows("shipments", "created_at"),
      optionalRows("kolaybi_master_records", "last_seen_at", 1000),
      optionalRows("kolaybi_sync_runs", "started_at"),
    ]);
    return { salesInvoices, purchaseInvoices, expenses, products, customers, financialAccounts, transactions, projects, shipments, providerRecords, syncRuns };
  },

  async health() {
    return authenticatedFetch("/api/kolaybi/office-sync");
  },

  async synchronize(resource = "all") {
    return authenticatedFetch("/api/kolaybi/office-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resource,
        idempotencyKey: `kolaybi-office:${resource}:${crypto.randomUUID()}`,
      }),
    });
  },

  async resolveMapping(input: { recordId: string; action: "match" | "ignore"; localEntityId?: string }) {
    return authenticatedFetch("/api/kolaybi/mappings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  },
};
