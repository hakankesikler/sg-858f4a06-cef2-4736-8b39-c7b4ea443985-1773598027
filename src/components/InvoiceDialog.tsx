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
  preSelectedCustomer?: any;
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

export function InvoiceDialog({ isOpen, onClose, preSelectedCustomer }: InvoiceDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>(preSelectedCustomer?.id || "");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0]);
  
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

      // Get cargo items first to calculate totals
      const { data: cargoItems } = await supabase
        .from("shipment_cargo_items")
        .select("*")
        .eq("shipment_id", shipment.id);

      // Calculate totals from cargo items
      let calculatedSubtotal = 0;
      let calculatedTax = 0;
      let calculatedGrandTotal = 0;

      if (cargoItems && cargoItems.length > 0) {
        cargoItems.forEach((cargo: any) => {
          const itemSubtotal = cargo.alt_toplam_fiyat || 0;
          const itemTax = itemSubtotal * 0.20;
          calculatedSubtotal += itemSubtotal;
          calculatedTax += itemTax;
          calculatedGrandTotal += (itemSubtotal + itemTax);
        });
      }

      // Create invoice with calculated totals
      const { data: invoiceData, error: invoiceError } = await supabase
        .from("sales_invoices")
        .insert({
          invoice_no: invoiceNo,
          customer_id: shipment.customer_id,
          shipment_id: shipment.id,
          invoice_date: formData.invoiceDate,
          due_date: formData.invoiceDate,
          subtotal: calculatedSubtotal,
          total_tax: calculatedTax,
          grand_total: calculatedGrandTotal,
          payment_status: "Bekliyor",
          currency: "TRY",
          notes: formData.notes,
          e_invoice_status: "taslak", // TASLAK status
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items from cargo
      if (invoiceData && cargoItems && cargoItems.length > 0) {
        const items = cargoItems.map((cargo: any) => ({
          invoice_id: invoiceData.id,
          product_code: shipment.shipment_code,
          description: `Taşıma Hizmeti - ${cargo.cinsi || shipment.shipment_code}`,
          quantity: cargo.adet || 1,
          unit: cargo.cinsi || "Adet",
          unit_price: cargo.birim_fiyat || 0,
          subtotal: cargo.alt_toplam_fiyat || 0,
          tax_rate: 20,
          tax_amount: (cargo.alt_toplam_fiyat || 0) * 0.20,
          total: (cargo.alt_toplam_fiyat || 0) * 1.20,
        }));

        const { error: itemsError } = await supabase
          .from("sales_invoice_items")
          .insert(items);

        if (itemsError) throw itemsError;
      }

      // Update shipment status
      await supabase
        .from("shipments")
        .update({ 
          invoice_status: "faturalandi",
          sale_invoice_id: invoiceData?.id 
        })
        .eq("id", shipment.id);

      toast({
        title: "Başarılı",
        description: `TASLAK fatura ${invoiceNo} oluşturuldu. Satış listesinde görüntüleyebilirsiniz.`,
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