import { supabase } from "@/integrations/supabase/client";

async function authenticatedApi(url: string, body: unknown) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Oturum süresi dolmuş. Lütfen yeniden giriş yapın.");
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "İşlem tamamlanamadı.");
  return result;
}

export const workflowService = {
  async recordCustomerPayment(input: {
    customerId: string;
    transactionType: "odeme" | "tahsilat";
    amount: number;
    paymentMethod: string;
    paymentDate: string;
    financialAccountId: string;
    referenceNo?: string;
    description?: string;
    currency: string;
    relatedInvoiceId?: string | null;
    relatedPurchaseId?: string | null;
  }) {
    const { data, error } = await supabase.rpc("rex_record_customer_payment" as any, {
      p_customer_id: input.customerId,
      p_transaction_type: input.transactionType,
      p_amount: input.amount,
      p_payment_method: input.paymentMethod,
      p_payment_date: input.paymentDate,
      p_financial_account_id: input.financialAccountId,
      p_reference_no: input.referenceNo || null,
      p_description: input.description || null,
      p_currency: input.currency,
      p_related_invoice_id: input.relatedInvoiceId || null,
      p_related_purchase_id: input.relatedPurchaseId || null,
    } as any);

    if (error) throw error;
    return data as unknown as string;
  },

  async recordKolayBiCustomerPayment(input: {
    customerId: string;
    amount: number;
    paymentMethod: string;
    paymentDate: string;
    financialAccountId: string;
    referenceNo?: string;
    description?: string;
    currency: string;
    relatedInvoiceId: string;
  }) {
    return authenticatedApi(`/api/kolaybi/invoices/${input.relatedInvoiceId}/proceed`, input);
  },

  async cancelSalesInvoice(input: {
    invoiceId: string;
    reason: string;
    cancellationType: "iptal" | "iade";
    externalReference?: string;
  }) {
    return authenticatedApi(`/api/kolaybi/invoices/${input.invoiceId}/cancel`, input);
  },

  async recordCustomerAdjustment(input: {
    customerId: string;
    transactionType: "Borç" | "Alacak";
    amount: number;
    transactionDate: string;
    currency: string;
    description?: string;
  }) {
    const { data, error } = await supabase.rpc("rex_record_customer_adjustment" as any, {
      p_customer_id: input.customerId,
      p_transaction_type: input.transactionType,
      p_amount: input.amount,
      p_transaction_date: input.transactionDate,
      p_currency: input.currency,
      p_description: input.description || null,
    } as any);
    if (error) throw error;
    return data as unknown as string;
  },
};
