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
  associateRecords: any[];
  customerFinancialDirectory: any[];
  providerSummary: { records: number; matched: number; review: number };
  syncRuns: any[];
  integrationPartners: any[];
  outboundQueue: { pending: number; review: number };
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

async function activeSalesInvoiceRows(limit = 500) {
  const { data, error } = await (supabase.from("sales_invoices" as any) as any)
    .select("*")
    .is("archived_at", null)
    .not("invoice_no", "like", "ALACAK-%")
    .not("invoice_no", "like", "BORC-%")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

async function optionalAllRows(
  table: string,
  orderColumn = "id",
  filters: Record<string, string> = {},
  pageSize = 1000,
) {
  try {
    const result: any[] = [];
    for (let from = 0; ; from += pageSize) {
      let query = (supabase.from(table as any) as any)
        .select("*")
        .order(orderColumn, { ascending: true })
        .range(from, from + pageSize - 1);
      Object.entries(filters).forEach(([column, value]) => { query = query.eq(column, value); });
      const { data, error } = await query;
      if (error) throw error;
      const page = data || [];
      result.push(...page);
      if (page.length < pageSize) break;
    }
    return result;
  } catch {
    return [];
  }
}

async function optionalProviderRows(providerEnvironment: string, limit = 1000) {
  try {
    const { data, error } = await (supabase.from("kolaybi_master_records" as any) as any)
      .select("*")
      .eq("provider_environment", providerEnvironment)
      .order("last_seen_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  } catch { return []; }
}

async function optionalProviderCount(providerEnvironment: string, matchStatus?: string) {
  try {
    let query = (supabase.from("kolaybi_master_records" as any) as any)
      .select("id", { count: "exact", head: true })
      .eq("provider_environment", providerEnvironment)
      .in("resource_type", ["associate", "product", "expense_type", "sales_invoice", "purchase_invoice", "general_expense", "vault", "vault_transaction"]);
    if (matchStatus) query = query.eq("match_status", matchStatus);
    const { count, error } = await query;
    if (error) throw error;
    return Number(count || 0);
  } catch { return 0; }
}

async function optionalCount(table: string, statuses: string[]) {
  try {
    const { count, error } = await (supabase.from(table as any) as any)
      .select("id", { count: "exact", head: true }).in("status", statuses);
    if (error) throw error;
    return Number(count || 0);
  } catch { return 0; }
}

async function financeTransactions() {
  try {
    const { data, error } = await (supabase as any).from("transactions")
      .select("*,financial_accounts(account_name)")
      .order("transaction_date", { ascending: false }).limit(1000);
    if (error) throw error;
    return data || [];
  } catch { return optionalRows("transactions", "transaction_date", 1000); }
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

const KOLAYBI_SYNC_RESOURCES = [
  "products",
  "expense_types",
  "vaults",
  "associates",
  "general_expenses",
  "sales_invoices",
  "purchase_invoices",
  "vault_transactions",
] as const;
type KolayBiSyncResource = (typeof KOLAYBI_SYNC_RESOURCES)[number];

async function synchronizeResource(resource: string) {
  return authenticatedFetch("/api/kolaybi/office-sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      resource,
      idempotencyKey: `kolaybi-office:${resource}:${crypto.randomUUID()}`,
    }),
  });
}

async function synchronizeAllResources() {
  const results: any[] = [];
  const errors: string[] = [];
  const runPhase = async (resources: readonly KolayBiSyncResource[], concurrency: number) => {
    let nextIndex = 0;
    const workers = Array.from({ length: Math.min(concurrency, resources.length) }, async () => {
      while (nextIndex < resources.length) {
        const resource = resources[nextIndex];
        nextIndex += 1;
        try {
          results.push(await synchronizeResource(resource));
        } catch (error: any) {
          errors.push(`${resource}: ${String(error?.message || error)}`);
        }
      }
    });
    await Promise.all(workers);
  };
  await runPhase(["products", "expense_types", "vaults"], 3);
  await runPhase(["associates", "general_expenses", "sales_invoices", "purchase_invoices"], 3);
  await runPhase(["vault_transactions"], 1);
  const runs = results.map((result) => result?.run).filter(Boolean);
  const run = runs.reduce((summary, current) => ({
    received_count: summary.received_count + Number(current.received_count || 0),
    matched_count: summary.matched_count + Number(current.matched_count || 0),
    review_count: summary.review_count + Number(current.review_count || 0),
    failed_count: summary.failed_count + Number(current.failed_count || 0),
  }), { received_count: 0, matched_count: 0, review_count: 0, failed_count: 0 });
  return { success: errors.length === 0 && run.failed_count === 0, run, results, errors };
}

export const kolaybiOfficeService = {
  async getData(): Promise<KolayBiOfficeData> {
    const [syncRuns, integrationPartners] = await Promise.all([
      optionalRows("kolaybi_sync_runs", "started_at"),
      optionalRows("integration_partners", "updated_at", 20),
    ]);
    const kolaybiPartner = integrationPartners.find((row) => row.code === "KOLAYBI") || null;
    const configuredEnvironment = kolaybiPartner?.environment || syncRuns[0]?.provider_environment;
    const providerEnvironment = configuredEnvironment === "live" ? "live" : "test";
    const [
      salesInvoices, purchaseInvoices, expenses, products, customers,
      financialAccounts, transactions, projects, shipments, providerRecords, associateRecords,
      customerFinancialDirectory, providerRecordsCount, providerMatchedCount, providerReviewCount,
      outboundPending, outboundReview, salesInvoiceProviderRecords,
    ] = await Promise.all([
      activeSalesInvoiceRows(),
      optionalRows("purchase_invoices", "created_at"),
      rows("expenses", "expense_date"),
      rows("products_services", "created_at"),
      optionalAllRows("customers", "id"),
      rows("financial_accounts", "created_at"),
      financeTransactions(),
      Promise.resolve([]),
      rows("shipments", "created_at"),
      optionalProviderRows(providerEnvironment, 1000),
      optionalAllRows("kolaybi_master_records", "id", { provider_environment: providerEnvironment, resource_type: "associate" }),
      optionalAllRows("rex_customer_financial_directory", "customer_id"),
      optionalProviderCount(providerEnvironment),
      optionalProviderCount(providerEnvironment, "matched"),
      optionalProviderCount(providerEnvironment, "review_required"),
      optionalCount("kolaybi_outbound_jobs", ["pending", "processing"]),
      optionalCount("kolaybi_outbound_jobs", ["review_required", "dead"]),
      optionalAllRows("kolaybi_master_records", "id", { resource_type: "sales_invoice" }),
    ]);

    const currentEnvironmentInvoiceIds = new Set(
      salesInvoiceProviderRecords
        .filter((record) => record.provider_environment === providerEnvironment && record.local_entity_id)
        .map((record) => String(record.local_entity_id)),
    );
    const otherEnvironmentInvoiceIds = new Set(
      salesInvoiceProviderRecords
        .filter((record) => record.provider_environment !== providerEnvironment && record.local_entity_id)
        .map((record) => String(record.local_entity_id)),
    );
    const visibleSalesInvoices = salesInvoices.filter((invoice) => (
      !otherEnvironmentInvoiceIds.has(String(invoice.id))
      || currentEnvironmentInvoiceIds.has(String(invoice.id))
    ));

    return {
      salesInvoices: visibleSalesInvoices, purchaseInvoices, expenses, products, customers, financialAccounts, transactions, projects, shipments,
      providerRecords, associateRecords, customerFinancialDirectory,
      providerSummary: { records: providerRecordsCount, matched: providerMatchedCount, review: providerReviewCount },
      syncRuns, integrationPartners, outboundQueue: { pending: outboundPending, review: outboundReview },
    };
  },

  async health() {
    return authenticatedFetch("/api/kolaybi/office-sync");
  },

  async synchronize(resource = "all") {
    return resource === "all" ? synchronizeAllResources() : synchronizeResource(resource);
  },

  async synchronizeOutbound(limit = 20) {
    return authenticatedFetch("/api/kolaybi/outbound-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ limit }),
    });
  },

  async synchronizeAssociateTransactions(customerId: string) {
    return authenticatedFetch("/api/kolaybi/associate-transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId }),
    });
  },

  async synchronizeAssociate(customerId: string) {
    return authenticatedFetch(`/api/kolaybi/associates/${customerId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ automatic: true }),
    });
  },

  async resolveMapping(input: { recordId: string; action: "match" | "ignore"; localEntityId?: string }) {
    return authenticatedFetch("/api/kolaybi/mappings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  },

  async reviewImportedProduct(input: { recordId: string; decision: "approve" | "reject" }) {
    return authenticatedFetch("/api/kolaybi/mappings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recordId: input.recordId, action: input.decision }),
    });
  },
};
