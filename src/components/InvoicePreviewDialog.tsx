import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InvoiceTemplate } from "./InvoiceTemplate";
import { X, FileText } from "lucide-react";

interface InvoicePreviewDialogProps {
  open: boolean;
  onClose: () => void;
  invoiceData: any;
}

export function InvoicePreviewDialog({ open, onClose, invoiceData }: InvoicePreviewDialogProps) {
  if (!invoiceData) return null;

  // Transform database data to template format
  const templateData = {
    invoiceNo: invoiceData.invoice_no || "",
    invoiceDate: invoiceData.invoice_date || new Date().toISOString(),
    scenario: "TEMEL",
    invoiceType: invoiceData.invoice_type === "sales" ? "SATIŞ" : "ALIŞ",
    createdAt: invoiceData.created_at || new Date().toISOString(),
    ettn: invoiceData.ettn || undefined,
    customerName: invoiceData.customer?.company || invoiceData.customer?.name || "Bilinmeyen Cari",
    customerPhone: invoiceData.customer?.phone || undefined,
    customerWebsite: invoiceData.customer?.website || undefined,
    customerEmail: invoiceData.customer?.email || undefined,
    customerTaxOffice: invoiceData.customer?.tax_office || undefined,
    customerTaxNumber: invoiceData.customer?.tax_number || undefined,
    items: invoiceData.items?.map((item: any) => ({
      description: item.description || "Taşıma Hizmeti",
      lineDescription: item.notes || `${item.description || "Taşıma Hizmeti"}`,
      quantity: item.quantity || 1,
      unitPrice: item.unit_price || 0,
      total: item.total_price || 0,
      vatRate: item.vat_rate || 20,
      vatAmount: item.vat_amount || 0,
    })) || [],
    subtotal: invoiceData.subtotal || 0,
    vatBase: invoiceData.subtotal || 0,
    vatAmount: invoiceData.total_vat || 0,
    grandTotal: invoiceData.grand_total || 0,
    currency: invoiceData.currency || "TRY",
    notes: invoiceData.notes || undefined,
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[1000px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Fatura Önizleme - {invoiceData.invoice_no}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="mt-4">
          <InvoiceTemplate data={templateData} />
        </div>
      </DialogContent>
    </Dialog>
  );
}