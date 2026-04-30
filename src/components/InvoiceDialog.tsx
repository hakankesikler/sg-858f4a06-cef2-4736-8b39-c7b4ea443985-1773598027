import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { X, Plus, Trash2, Loader2 } from "lucide-react";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  subtotal: number;
  vatAmount: number;
  total: number;
}

interface InvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedCustomer?: any;
  shipment?: any;
  onSuccess?: () => void;
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

export function InvoiceDialog({ isOpen, onClose, preSelectedCustomer, shipment, onSuccess }: InvoiceDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>(preSelectedCustomer?.id || "");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [currency, setCurrency] = useState("TRY");
  const [paymentStatus, setPaymentStatus] = useState("Bekliyor");
  const [notes, setNotes] = useState(defaultNotes);
  
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: "1",
      description: "Taşıma Hizmeti",
      quantity: 1,
      unitPrice: 0,
      vatRate: 20,
      subtotal: 0,
      vatAmount: 0,
      total: 0,
    },
  ]);

  // Load customers for manual invoice mode
  useEffect(() => {
    if (isOpen && !shipment) {
      loadCustomers();
    }
    
    // If shipment exists, set customer automatically
    if (shipment?.customer_id) {
      setSelectedCustomer(shipment.customer_id);
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

  const calculateItemTotals = (item: Partial<InvoiceItem>): InvoiceItem => {
    const quantity = item.quantity || 0;
    const unitPrice = item.unitPrice || 0;
    const vatRate = item.vatRate || 0;
    
    const subtotal = quantity * unitPrice;
    const vatAmount = (subtotal * vatRate) / 100;
    const total = subtotal + vatAmount;
    
    return {
      id: item.id || Date.now().toString(),
      description: item.description || "",
      quantity,
      unitPrice,
      vatRate,
      subtotal,
      vatAmount,
      total,
    };
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = calculateItemTotals({
      ...newItems[index],
      [field]: value,
    });
    setItems(newItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        description: "",
        quantity: 1,
        unitPrice: 0,
        vatRate: 20,
        subtotal: 0,
        vatAmount: 0,
        total: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const totals = items.reduce(
    (acc, item) => ({
      subtotal: acc.subtotal + item.subtotal,
      vat: acc.vat + item.vatAmount,
      grandTotal: acc.grandTotal + item.total,
    }),
    { subtotal: 0, vat: 0, grandTotal: 0 }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate customer selection
    if (!selectedCustomer && !shipment) {
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
      const subtotal = items.reduce(
        (sum, item) => sum + item.subtotal,
        0
      );
      const totalVat = items.reduce(
        (sum, item) => sum + item.vatAmount,
        0
      );
      const grandTotal = items.reduce(
        (sum, item) => sum + item.total,
        0
      );

      // Generate unique invoice number with date
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
      
      // Get last invoice number for today
      const { data: lastInvoice } = await supabase
        .from("sales_invoices")
        .select("invoice_no")
        .like("invoice_no", `SF-${dateStr}-%`)
        .order("invoice_no", { ascending: false })
        .limit(1)
        .single();

      let invoiceNo = `SF-${dateStr}-001`;
      if (lastInvoice?.invoice_no) {
        const lastNum = parseInt(lastInvoice.invoice_no.split("-")[2]);
        invoiceNo = `SF-${dateStr}-${String(lastNum + 1).padStart(3, "0")}`;
      }

      // Prepare invoice data
      const invoiceData: any = {
        customer_id: shipment?.customer_id || selectedCustomer,
        invoice_date: invoiceDate,
        due_date: dueDate,
        invoice_no: invoiceNo,
        currency: currency,
        payment_status: paymentStatus,
        subtotal: totals.subtotal,
        total_tax: totals.vat,
        grand_total: totals.grandTotal,
        notes: notes,
      };

      // If shipment exists, add shipment_id
      if (shipment?.id) {
        invoiceData.shipment_id = shipment.id;
      }

      // Create the sales invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from("sales_invoices")
        .insert(invoiceData)
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Insert invoice items
      const invoiceItems = items.map((item) => ({
        invoice_id: invoice.id,
        product_code: shipment?.shipment_code || "HIZMET",
        description: item.description,
        quantity: item.quantity,
        unit: "Adet",
        unit_price: item.unitPrice,
        subtotal: item.subtotal,
        tax_rate: item.vatRate,
        tax_amount: item.vatAmount,
        total: item.total,
      }));

      const { error: itemsError } = await supabase
        .from("sales_invoice_items")
        .insert(invoiceItems);

      if (itemsError) throw itemsError;

      // Update shipment status if applicable
      if (shipment?.id) {
        await supabase
          .from("shipments")
          .update({ 
            invoice_status: "faturalandi",
            sale_invoice_id: invoice?.id 
          })
          .eq("id", shipment.id);
      }

      toast({
        title: "Başarılı",
        description: `Satış faturası ${invoiceNo} oluşturuldu`,
      });

      if (onSuccess) onSuccess();
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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Satış Faturası Oluştur</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* TEMEL BİLGİLER */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-lg">Temel Bilgiler</h3>
            
            <div className="grid grid-cols-3 gap-4">
              {/* CUSTOMER SELECTION */}
              {!shipment && (
                <div className="space-y-2">
                  <Label htmlFor="customer" className="text-sm font-semibold">
                    Müşteri *
                  </Label>
                  <Select
                    value={selectedCustomer}
                    onValueChange={setSelectedCustomer}
                    disabled={!!preSelectedCustomer}
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
                  Fatura Tarihi *
                </Label>
                <Input
                  type="date"
                  id="invoiceDate"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  required
                />
              </div>

              {/* DUE DATE */}
              <div className="space-y-2">
                <Label htmlFor="dueDate" className="text-sm font-semibold">
                  Vade Tarihi *
                </Label>
                <Input
                  type="date"
                  id="dueDate"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>

              {/* CURRENCY */}
              <div className="space-y-2">
                <Label htmlFor="currency" className="text-sm font-semibold">
                  Para Birimi
                </Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRY">TRY</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* PAYMENT STATUS */}
              <div className="space-y-2">
                <Label htmlFor="paymentStatus" className="text-sm font-semibold">
                  Ödeme Durumu
                </Label>
                <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bekliyor">Bekliyor</SelectItem>
                    <SelectItem value="Ödendi">Ödendi</SelectItem>
                    <SelectItem value="Kısmi Ödendi">Kısmi Ödendi</SelectItem>
                    <SelectItem value="Gecikmiş">Gecikmiş</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* ÜRÜN/HİZMET KALEMLERİ */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Ürün/Hizmet Bilgileri</h3>
              <Button type="button" onClick={addItem} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Kalem Ekle
              </Button>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4">
                    <Label className="text-xs">Ürün/Hizmet Adı</Label>
                    <Input
                      placeholder="Açıklama..."
                      value={item.description}
                      onChange={(e) => handleItemChange(index, "description", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Miktar</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, "quantity", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Birim Fiyat</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, "unitPrice", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-1">
                    <Label className="text-xs">KDV %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={item.vatRate}
                      onChange={(e) => handleItemChange(index, "vatRate", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Toplam</Label>
                    <Input
                      type="text"
                      value={item.total.toFixed(2)}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                  <div className="col-span-1 flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ÖZET */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-right">
              <div></div>
              <div></div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Ara Toplam:</span>
                  <span>{totals.subtotal.toFixed(2)} {currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Toplam KDV:</span>
                  <span>{totals.vat.toFixed(2)} {currency}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Genel Toplam:</span>
                  <span>{totals.grandTotal.toFixed(2)} {currency}</span>
                </div>
              </div>
            </div>
          </div>

          {/* NOTES */}
          <div className="space-y-2">
            <Label htmlFor="notes">Açıklama / Notlar</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              className="font-mono text-xs"
            />
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
                  Kaydediliyor...
                </>
              ) : (
                "Faturayı Kaydet"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}