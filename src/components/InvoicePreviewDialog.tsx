import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InvoiceTemplate, type InvoiceTemplateData } from "./InvoiceTemplate";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, FileText, Loader2, X } from "lucide-react";

interface InvoicePreviewDialogProps {
  open: boolean;
  onClose: () => void;
  invoiceData: UnknownRecord | null;
}

type UnknownRecord = Record<string, unknown>;

const firstObject = (value: unknown): UnknownRecord => {
  if (Array.isArray(value)) return firstObject(value[0]);
  return value && typeof value === "object" ? (value as UnknownRecord) : {};
};

const numberValue = (...values: unknown[]) => {
  for (const value of values) {
    if (value === null || value === undefined || value === "") continue;
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

const textValue = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return undefined;
};

const safeQrImage = (value: unknown) => {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  if (/^data:image\/(png|jpeg|jpg|webp|svg\+xml);base64,/i.test(normalized)) return normalized;
  if (/^https:\/\//i.test(normalized)) return normalized;
  return undefined;
};

export function normalizeInvoiceForPreview(invoice: UnknownRecord): InvoiceTemplateData {
  const customer = firstObject(invoice.customer || invoice.customers);
  const rawItems = Array.isArray(invoice.items)
    ? invoice.items
    : Array.isArray(invoice.sales_invoice_items)
      ? invoice.sales_invoice_items
      : [];

  const items = rawItems.map((value) => {
    const rawItem = firstObject(value);
    const quantity = numberValue(rawItem.quantity, 1) || 1;
    const unitPrice = numberValue(rawItem.unit_price, rawItem.unitPrice);
    const discountAmount = numberValue(rawItem.discount_amount, rawItem.discountAmount);
    const subtotal = numberValue(
      rawItem.subtotal,
      rawItem.line_extension_amount,
      quantity * unitPrice - discountAmount,
    );
    const vatRate = numberValue(rawItem.tax_rate, rawItem.vat_rate, rawItem.vatRate);
    const vatAmount = numberValue(
      rawItem.tax_amount,
      rawItem.vat_amount,
      rawItem.vatAmount,
      subtotal * vatRate / 100,
    );

    return {
      productCode: textValue(rawItem.product_code, rawItem.productCode),
      description: textValue(rawItem.description, rawItem.name) || "Taşıma Hizmeti",
      lineDescription: textValue(rawItem.notes, rawItem.line_description),
      quantity,
      unit: textValue(rawItem.unit) || "Adet",
      unitPrice,
      discountAmount,
      subtotal,
      vatRate,
      vatAmount,
      total: numberValue(rawItem.total, subtotal + vatAmount),
    };
  });

  const calculatedSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const calculatedVat = items.reduce((sum, item) => sum + item.vatAmount, 0);
  const subtotal = numberValue(invoice.subtotal, calculatedSubtotal);
  const vatAmount = numberValue(invoice.total_tax, invoice.total_vat, calculatedVat);
  const grandTotal = numberValue(invoice.grand_total, subtotal + vatAmount);
  const documentKind = invoice.document_type === "e_invoice" || customer.kolaybi_e_document_type === "e_invoice"
    ? "e_invoice"
    : "e_archive";
  const scenario = textValue(invoice.document_scenario, customer.kolaybi_e_document_scenario)
    || (documentKind === "e_invoice" ? "TEMELFATURA" : "EARSIVFATURA");
  const officialInvoiceNo = textValue(invoice.official_invoice_no);
  const localInvoiceNo = textValue(invoice.invoice_no);
  const rawBankAccounts = Array.isArray(invoice.bank_accounts_snapshot) ? invoice.bank_accounts_snapshot : [];
  const bankAccounts = rawBankAccounts.map((value) => {
    const account = firstObject(value);
    return {
      label: textValue(account.label),
      account_holder: textValue(account.account_holder),
      bank_name: textValue(account.bank_name),
      branch_name: textValue(account.branch_name),
      iban: textValue(account.iban),
      swift_code: textValue(account.swift_code),
      currency: textValue(account.currency),
    };
  });

  return {
    invoiceNo: officialInvoiceNo || localInvoiceNo || "Taslak",
    tysReference: officialInvoiceNo && officialInvoiceNo !== localInvoiceNo ? localInvoiceNo : undefined,
    invoiceDate: textValue(invoice.invoice_date, invoice.created_at) || new Date().toISOString(),
    dueDate: textValue(invoice.due_date),
    scenario,
    invoiceType: (textValue(invoice.kolaybi_document_type) || "SATIS").toUpperCase(),
    documentKind,
    customizationNo: textValue(invoice.customization_no) || "TR1.2",
    createdAt: textValue(invoice.created_at) || new Date().toISOString(),
    ettn: textValue(invoice.official_uuid, invoice.ettn),
    customerName: textValue(customer.company, customer.name) || "Cari bilgisi yüklenemedi",
    customerAddress: textValue(customer.address, customer.branch_address),
    customerDistrict: textValue(customer.district),
    customerCity: textValue(customer.city),
    customerPhone: textValue(customer.phone),
    customerWebsite: textValue(customer.website),
    customerEmail: textValue(customer.invoice_email, customer.email),
    customerTaxOffice: textValue(customer.tax_office),
    customerTaxNumber: textValue(customer.vergi_no, customer.tax_number, customer.tc_no),
    customerTaxLabel: customer.vergi_no || customer.tax_number ? "VKN" : customer.tc_no ? "TCKN" : undefined,
    items,
    subtotal,
    discountAmount: numberValue(invoice.total_discount, invoice.general_discount),
    vatAmount,
    grandTotal,
    currency: textValue(invoice.currency) || "TRY",
    notes: textValue(invoice.notes),
    paymentMethod: textValue(invoice.payment_method),
    bankAccounts,
    qrImage: safeQrImage(invoice.qr_code || invoice.qrCode || invoice.qr_url || invoice.barcode_image),
    officialPdfUrl: typeof invoice.pdf_url === "string" && /^https:\/\//i.test(invoice.pdf_url)
      ? invoice.pdf_url
      : undefined,
    isOfficial: invoice.integration_status === "official" || Boolean(officialInvoiceNo || invoice.official_uuid),
  };
}

export function InvoicePreviewDialog({ open, onClose, invoiceData }: InvoicePreviewDialogProps) {
  const [loadState, setLoadState] = useState<{
    invoiceId?: string;
    data?: UnknownRecord;
    error?: string;
  }>({});
  const invoiceId = textValue(invoiceData?.id);

  useEffect(() => {
    if (!open || !invoiceId || !invoiceData) return;

    let cancelled = false;

    void (async () => {
      const { data, error } = await supabase
        .from("sales_invoices")
        .select(`
          *,
          customer:customers!sales_invoices_customer_id_fkey(
            id,name,company,address,branch_address,district,city,phone,website,email,invoice_email,
            tax_office,vergi_no,tc_no,kolaybi_e_document_type,kolaybi_e_document_scenario
          ),
          items:sales_invoice_items(
            id,created_at,product_code,description,quantity,unit,unit_price,subtotal,
            tax_rate,tax_amount,discount_amount,total
          )
        `)
        .eq("id", invoiceId)
        .single();

      if (cancelled) return;
      if (error || !data) {
        setLoadState({
          invoiceId,
          data: invoiceData,
          error: "Cari veya fatura kalemleri tam yüklenemedi. Listede bulunan bilgiler gösteriliyor.",
        });
      } else {
        setLoadState({ invoiceId, data: firstObject(data) });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [invoiceData, invoiceId, open]);

  const hasResolvedCurrentInvoice = Boolean(invoiceId && loadState.invoiceId === invoiceId && loadState.data);
  const loading = Boolean(open && invoiceId && !hasResolvedCurrentInvoice);
  const resolvedInvoice = hasResolvedCurrentInvoice ? loadState.data || null : invoiceData;
  const loadError = loadState.invoiceId === invoiceId ? loadState.error : undefined;

  const templateData = useMemo(
    () => resolvedInvoice ? normalizeInvoiceForPreview(resolvedInvoice) : null,
    [resolvedInvoice],
  );

  if (!invoiceData) return null;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent className="max-h-[96vh] w-[min(1180px,96vw)] max-w-none overflow-auto p-4 sm:p-6">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Fatura Önizleme · {textValue(invoiceData.official_invoice_no, invoiceData.invoice_no) || "Taslak"}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8" aria-label="Önizlemeyi kapat">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {loadError ? (
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{loadError}</span>
          </div>
        ) : null}

        {loading || !templateData ? (
          <div className="flex min-h-72 items-center justify-center gap-3 text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            Fatura, cari ve kalem bilgileri hazırlanıyor…
          </div>
        ) : (
          <InvoiceTemplate data={templateData} />
        )}
      </DialogContent>
    </Dialog>
  );
}
