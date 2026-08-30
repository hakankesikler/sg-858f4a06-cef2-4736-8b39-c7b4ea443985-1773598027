import { supabase } from "@/integrations/supabase/client";
import type { InvoiceCategory } from "@/services/invoicePresentationService";

export type InvoiceDocumentType = "e_invoice" | "e_archive";

export type SecureInvoiceInput = {
  customerId: string;
  shipmentIds: string[];
  invoiceDate: string;
  dueDate: string;
  currency: string;
  paymentStatus: string;
  notes: string;
  items: Array<{
    productCode: string;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    vatRate: number;
    kolaybiProductId?: number | null;
    withholdingCode?: string | null;
    withholdingValue?: number | null;
    withholdingType?: "PERCENTAGE" | "NUMERIC" | null;
    exemptionCode?: string | null;
  }>;
  documentType: InvoiceDocumentType;
  documentScenario: "EARSIVFATURA" | "TEMELFATURA" | "TICARIFATURA" | "KAMU";
  exchangeRate: number;
  idempotencyKey: string;
  invoiceCategory?: InvoiceCategory;
  noteTemplateId?: string | null;
  bankAccountIds?: string[];
  includeBankDetails?: boolean;
};

async function authenticatedFetch(url: string, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Oturum süresi dolmuş. Lütfen yeniden giriş yapın.");
  return fetch(url, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
}

async function responseJson(response: Response) {
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Fatura entegrasyonu tamamlanamadı.");
  return result;
}

export const invoiceIntegrationService = {
  async createDraft(input: SecureInvoiceInput) {
    const { data, error } = await supabase.rpc("rex_create_sales_invoice_secure_v2" as any, {
      p_customer_id: input.customerId,
      p_shipment_ids: input.shipmentIds,
      p_invoice_date: input.invoiceDate,
      p_due_date: input.dueDate,
      p_currency: input.currency,
      p_payment_status: input.paymentStatus,
      p_notes: input.notes,
      p_items: input.items,
      p_document_type: input.documentType,
      p_document_scenario: input.documentScenario,
      p_exchange_rate: input.exchangeRate,
      p_idempotency_key: input.idempotencyKey,
      p_invoice_category: input.invoiceCategory || "domestic_transport",
      p_note_template_id: input.noteTemplateId || null,
      p_bank_account_ids: input.bankAccountIds || [],
      p_include_bank_details: input.includeBankDetails === true,
    } as any);
    if (error) throw error;
    return data as unknown as {
      id: string;
      invoice_no: string;
      grand_total: number;
      integration_status: string;
      already_exists: boolean;
    };
  },

  async send(invoiceId: string) {
    const response = await authenticatedFetch("/api/kolaybi/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId }),
    });
    return responseJson(response);
  },

  async retry(invoiceId: string) {
    const { error } = await supabase.rpc("rex_queue_invoice_sync" as any, {
      p_invoice_id: invoiceId,
    } as any);
    if (error) throw error;
    return this.send(invoiceId);
  },

  async processQueue(limit = 5) {
    const response = await authenticatedFetch("/api/kolaybi/process-queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ limit }),
    });
    return responseJson(response);
  },

  async refreshStatus(invoiceId: string) {
    const response = await authenticatedFetch(`/api/kolaybi/invoices/${invoiceId}/status`, {
      method: "POST",
    });
    return responseJson(response);
  },

  async openPdf(invoiceId: string) {
    const response = await authenticatedFetch(`/api/kolaybi/invoices/${invoiceId}/pdf`);
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.error || "Fatura PDF'i alınamadı.");
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  },
};
