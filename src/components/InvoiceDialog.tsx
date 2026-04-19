import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { X, Plus, Trash2, Loader2 } from "lucide-react";

interface InvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  shipment?: any;  // Optional - for shipment-based invoices
}

const defaultNotes = `** Taşıma İşleri Organizatörlüğü Belge Numarası: İZM.U-NET.TİO.35.6323
** Taşımalarınız Rex Lojistik güvencesinde ve sigortalıdır.
** İrsaliye yerine geçmektedir.
** Faturaya 8 gün içerisinde itiraz edilmezse kabul edilmiş sayılır.
** BU FATURA MUHTEVİYATI ALT YÜKLEMECİLER İLE YAPILDIĞINDAN DOLAYI, KDV G.U.T (I/C-2.1.3.11.2.) KANUN GEREĞİ TEVKİFAT UYGULANMAMIŞTIR
** Banka Bilgilerimiz:
** REX LOJİSTİK TAŞIMACILIK DEPOLAMA DANIŞMANLIK LİMİTED ŞİRKETİ
** TR24 0001 5001 5800 7355 9235 06
* Yalınızca,
* Sicil Numarası: 240976, İşletme Merkezi: İzmir`;

export function InvoiceDialog({ isOpen, onClose, onSuccess, shipment }: InvoiceDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  
  const [formData, setFormData] = useState({
    invoiceDate: new Date().toISOString().split("T")[0],
    items: [
      {
        description: "Taşıma Hizmeti",
        notes: "",
        quantity: 1,
        unitPrice: 0,
        vatRate: 20,
      },
    ],
    notes: defaultNotes,
  });

  // Load customers for manual invoice mode
  useEffect(() => {
    if (isOpen && !shipment) {
      loadCustomers();
    }
    
    // If shipment exists, set customer automatically
    if (shipment?.customer_id) {
      setSelectedCustomerId(shipment.customer_id);
    }
  }, [isOpen, shipment]);

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, company")
        .order("company");

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error("Error loading customers:", error);
      toast({
        title: "Hata",
        description: "Müşteriler yüklenirken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate customer selection
    if (!selectedCustomerId) {
      toast({
        title: "Uyarı",
        description: "Lütfen bir müşteri seçin",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Calculate totals
      const subtotal = formData.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );
      const totalVat = formData.items.reduce(
        (sum, item) =>
          sum + (item.quantity * item.unitPrice * item.vatRate) / 100,
        0
      );
      const grandTotal = subtotal + totalVat;

      // Generate invoice number
      const { data: lastInvoice } = await supabase
        .from("sales_invoices")
        .select("invoice_no")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      let invoiceNo = "SF-2024-001";
      if (lastInvoice?.invoice_no) {
        const lastNum = parseInt(lastInvoice.invoice_no.split("-")[2]);
        invoiceNo = `SF-2024-${String(lastNum + 1).padStart(3, "0")}`;
      }

      // Create invoice
      const { error: invoiceError } = await supabase.from("sales_invoices").insert({
        invoice_no: invoiceNo,
        customer_id: selectedCustomerId,
        shipment_id: shipment?.id || null,  // null for manual invoices
        invoice_date: formData.invoiceDate,
        items: formData.items as any,
        subtotal,
        total_vat: totalVat,
        grand_total: grandTotal,
        payment_status: "pending",
        invoice_type: "sales",
        currency: "TRY",
        notes: formData.notes,
      } as any);

      if (invoiceError) throw invoiceError;

      // Update shipment invoice status if shipment exists
      if (shipment?.id) {
        const { error: updateError } = await supabase
          .from("shipments")
          .update({ invoice_status: "faturalandi" })
          .eq("id", shipment.id);

        if (updateError) throw updateError;
      }

      toast({
        title: "Başarılı",
        description: `Fatura ${invoiceNo} oluşturuldu`,
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error creating invoice:", error);
      toast({
        title: "Hata",
        description: error.message || "Fatura oluşturulurken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>
              {shipment ? "Sevkiyattan Fatura Oluştur" : "Satış Faturası Oluştur"}
            </span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {/* CUSTOMER SELECTION - Only show for manual invoices */}
            {!shipment && (
              <div className="col-span-2 space-y-2">
                <Label htmlFor="customer" className="text-sm font-semibold">
                  Müşteri Seçimi *
                </Label>
                <Select
                  value={selectedCustomerId}
                  onValueChange={setSelectedCustomerId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Müşteri seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.company || customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* INVOICE DATE */}
            <div className="space-y-2">
              <Label htmlFor="invoiceDate" className="text-sm font-semibold">
                Fatura Tarihi
              </Label>
              <Input
                type="date"
                id="invoiceDate"
                value={formData.invoiceDate}
                onChange={(e) =>
                  setFormData({ ...formData, invoiceDate: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Oluşturuluyor...
                </>
              ) : (
                "Faturalandır"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}