import { supabase } from "@/integrations/supabase/client";
import { deletePrivateDocument, getPrivateDocumentSignedUrl, uploadPrivateDocument } from "@/lib/private-storage";

export type IncomingPurchaseInvoice = {
  id: string;
  source: "kolaybi" | "manual";
  document_type: "e_invoice" | "e_archive";
  invoice_no: string;
  invoice_date: string;
  due_date?: string | null;
  issuer_name: string;
  issuer_tax_id: string;
  currency: string;
  net_total: number;
  vat_total: number;
  withholding_total: number;
  grand_total: number;
  description?: string | null;
  status: string;
  operational_supplier_id?: string | null;
  billing_supplier_id?: string | null;
  file_path?: string | null;
  official_uuid?: string | null;
  matched_at?: string | null;
  approved_at?: string | null;
  created_at: string;
  operational_supplier?: { id: string; name?: string | null; company?: string | null } | null;
  billing_supplier?: { id: string; name?: string | null; company?: string | null } | null;
  allocations?: PurchaseInvoiceAllocation[];
};

export type PurchaseInvoiceAllocation = {
  id: string;
  invoice_id: string;
  shipment_id: string;
  amount: number;
  active: boolean;
  shipment?: {
    id: string;
    shipment_code: string;
    origin?: string | null;
    destination?: string | null;
    cost?: number | null;
    cost_currency?: string | null;
  } | null;
};

export type PurchaseInvoiceCandidate = {
  shipment_id: string;
  shipment_code: string;
  supplier_id?: string | null;
  supplier_name?: string | null;
  origin?: string | null;
  destination?: string | null;
  pickup_date?: string | null;
  shipment_status?: string | null;
  expected_cost?: number | null;
  cost_currency?: string | null;
  score: number;
  reasons: string[];
};

export type ManualPurchaseInvoiceInput = {
  invoiceNo: string;
  invoiceDate: string;
  dueDate?: string;
  documentType: "e_invoice" | "e_archive";
  issuerName: string;
  issuerTaxId: string;
  currency: string;
  netTotal: number;
  vatTotal: number;
  withholdingTotal: number;
  grandTotal: number;
  description?: string;
  operationalSupplierId?: string;
  file: File;
};

async function sha256(file: File) {
  const bytes = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((value) => value.toString(16).padStart(2, "0")).join("");
}

async function authenticatedFetch(url: string, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Oturum süresi dolmuş. Lütfen yeniden giriş yapın.");
  const response = await fetch(url, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json.error || "İşlem tamamlanamadı.");
  return json;
}

export const purchaseInvoiceService = {
  async list(): Promise<IncomingPurchaseInvoice[]> {
    const { data, error } = await (supabase as any)
      .from("incoming_purchase_invoices")
      .select("*, operational_supplier:customers!incoming_purchase_invoices_operational_supplier_id_fkey(id,name,company), billing_supplier:customers!incoming_purchase_invoices_billing_supplier_id_fkey(id,name,company), allocations:purchase_invoice_allocations(*,shipment:shipments(id,shipment_code,origin,destination,cost,cost_currency))")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async suppliers() {
    const { data, error } = await (supabase as any)
      .from("customers")
      .select("id,name,company,customer_code,vergi_no,tc_no,account_type")
      .in("account_type", ["tedarikci", "her_ikisi"])
      .is("archived_at", null)
      .order("name");
    if (error) throw error;
    return data || [];
  },

  async candidates(invoiceId: string): Promise<PurchaseInvoiceCandidate[]> {
    const { data, error } = await (supabase as any).rpc("rex_purchase_invoice_candidates", { p_invoice_id: invoiceId });
    if (error) throw error;
    return data || [];
  },

  async createManual(input: ManualPurchaseInvoiceInput) {
    if (!input.file || !["application/pdf", "application/xml", "text/xml"].includes(input.file.type)) {
      throw new Error("Yalnızca PDF veya XML fatura belgesi yüklenebilir.");
    }
    if (input.file.size > 15 * 1024 * 1024) throw new Error("Fatura belgesi 15 MB'dan büyük olamaz.");
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Oturum süresi dolmuş.");
    const hash = await sha256(input.file);
    const extension = input.file.name.toLowerCase().endsWith(".xml") ? "xml" : "pdf";
    const path = `${userData.user.id}/${crypto.randomUUID()}.${extension}`;
    const reference = await uploadPrivateDocument("purchase-invoice-documents", path, input.file);
    const { data, error } = await (supabase as any).rpc("rex_create_manual_purchase_invoice", {
      p_invoice_no: input.invoiceNo,
      p_invoice_date: input.invoiceDate,
      p_due_date: input.dueDate || null,
      p_document_type: input.documentType,
      p_issuer_name: input.issuerName,
      p_issuer_tax_id: input.issuerTaxId,
      p_currency: input.currency,
      p_net_total: input.netTotal,
      p_vat_total: input.vatTotal,
      p_withholding_total: input.withholdingTotal,
      p_grand_total: input.grandTotal,
      p_description: input.description || null,
      p_file_path: reference,
      p_file_hash: hash,
      p_operational_supplier_id: input.operationalSupplierId || null,
    });
    if (error) {
      await deletePrivateDocument(reference, "purchase-invoice-documents");
      throw error;
    }
    return data as string;
  },

  async match(invoiceId: string, allocations: Array<{ shipmentId: string; amount: number; score: number; reasons: string[] }>, generalExpense: number, checked: boolean, reason?: string) {
    const { data, error } = await (supabase as any).rpc("rex_match_purchase_invoice", {
      p_invoice_id: invoiceId,
      p_allocations: allocations.map((item) => ({ shipment_id: item.shipmentId, amount: item.amount, score: item.score, reasons: item.reasons })),
      p_general_expense: generalExpense,
      p_checked: checked,
      p_reason: reason || null,
    });
    if (error) throw error;
    return data as string;
  },

  async approveIssuer(invoiceId: string, reason: string) {
    const { error } = await (supabase as any).rpc("rex_approve_supplier_invoice_issuer", { p_invoice_id: invoiceId, p_reason: reason });
    if (error) throw error;
  },

  async setBillingSupplier(invoiceId: string, supplierId: string) {
    const { error } = await (supabase as any).rpc("rex_set_purchase_invoice_billing_supplier", {
      p_invoice_id: invoiceId,
      p_supplier_id: supplierId,
    });
    if (error) throw error;
  },

  async approve(invoiceId: string, note?: string) {
    const { error } = await (supabase as any).rpc("rex_approve_purchase_invoice", { p_invoice_id: invoiceId, p_confirmation: true, p_note: note || null });
    if (error) throw error;
  },

  async signedDocumentUrl(path: string) {
    return getPrivateDocumentSignedUrl(path, "purchase-invoice-documents");
  },

  async openKolayBiDocument(invoiceId: string) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error("Oturum süresi dolmuş.");
    const response = await fetch(`/api/kolaybi/purchase-invoices/${invoiceId}/pdf`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) {
      const value = await response.json().catch(() => ({}));
      throw new Error(value.error || "KolayBi fatura belgesi açılamadı.");
    }
    const url = URL.createObjectURL(await response.blob());
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  },

  async syncKolayBi() {
    return authenticatedFetch("/api/kolaybi/purchase-invoices/sync", { method: "POST", body: JSON.stringify({}) });
  },
};
