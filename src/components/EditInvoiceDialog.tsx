import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type SalesInvoice = Tables<"sales_invoices">;
type InvoiceItem = Tables<"sales_invoice_items">;
type ProductService = Tables<"products_services">;

interface InvoiceItemForm extends Partial<InvoiceItem> {
  tempId?: string;
  kolaybi_product_id?: number | null;
  withholding_code?: string | null;
  withholding_value?: number | null;
  withholding_type?: string | null;
  exemption_code?: string | null;
}

interface EditInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: SalesInvoice | null;
  onSaved: () => void;
}

export function EditInvoiceDialog({
  open,
  onOpenChange,
  invoice,
  onSaved,
}: EditInvoiceDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InvoiceItemForm[]>([]);
  const [catalog, setCatalog] = useState<ProductService[]>([]);

  useEffect(() => {
    if (invoice && open) {
      setInvoiceDate(invoice.invoice_date || "");
      setDueDate(invoice.due_date || "");
      setNotes(invoice.notes || "");
      const loadEditorData = async () => {
        const [itemsResult, catalogResult, shipmentsResult] = await Promise.all([
          supabase
            .from("sales_invoice_items")
            .select("*")
            .eq("invoice_id", invoice.id),
          supabase
            .from("products_services")
            .select("*")
            .eq("invoice_enabled", true)
            .eq("is_active", true)
            .order("invoice_sort_order", { ascending: true })
            .order("name", { ascending: true }),
          supabase
            .from("shipments")
            .select("satis_tutar,shipment_cargo_items(adet,birim_fiyat,alt_toplam_fiyat)")
            .eq("sale_invoice_id", invoice.id),
        ]);

        if (itemsResult.error || catalogResult.error || shipmentsResult.error) {
          console.error(
            "Error loading invoice editor data:",
            itemsResult.error || catalogResult.error || shipmentsResult.error,
          );
          return;
        }

        const loadedItems = (itemsResult.data || []) as InvoiceItemForm[];
        const hasPositiveInvoiceAmount = loadedItems.some((item) => Number(item.unit_price) > 0 || Number(item.total) > 0);
        const shipmentAmount = (shipmentsResult.data || []).reduce((sum, shipment) => {
          const recordedSalesAmount = Number(shipment.satis_tutar || 0);
          if (recordedSalesAmount > 0) return sum + recordedSalesAmount;
          const cargoAmount = (shipment.shipment_cargo_items || []).reduce(
            (cargoSum, cargo) => cargoSum + Number(cargo.alt_toplam_fiyat ?? (Number(cargo.adet || 0) * Number(cargo.birim_fiyat || 0))),
            0,
          );
          return sum + cargoAmount;
        }, 0);

        if (!hasPositiveInvoiceAmount && loadedItems.length === 1 && shipmentAmount > 0) {
          const taxRate = Number(loadedItems[0].tax_rate || 0);
          loadedItems[0] = {
            ...loadedItems[0],
            quantity: 1,
            unit_price: shipmentAmount,
            subtotal: shipmentAmount,
            tax_amount: shipmentAmount * (taxRate / 100),
            total: shipmentAmount * (1 + taxRate / 100),
          };
        }

        setItems(loadedItems);
        setCatalog(catalogResult.data || []);
      };

      void loadEditorData();
    }
  }, [invoice, open]);

  const addItem = () => {
    const defaultProduct = catalog[0];
    const defaultPrice = Number(defaultProduct?.sale_price) || 0;
    const defaultTaxRate = Number(defaultProduct?.tax_rate) || 0;
    setItems([
      ...items,
      {
        tempId: `temp-${Date.now()}`,
        product_code: defaultProduct?.code || "",
        description: defaultProduct?.name || "",
        quantity: 1,
        unit: defaultProduct?.unit || "Adet",
        unit_price: defaultPrice,
        tax_rate: defaultTaxRate,
        kolaybi_product_id: defaultProduct?.kolaybi_product_id || null,
        subtotal: defaultPrice,
        tax_amount: defaultPrice * (defaultTaxRate / 100),
        total: defaultPrice * (1 + defaultTaxRate / 100),
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof InvoiceItemForm, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Recalculate totals
    const item = newItems[index];
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unit_price) || 0;
    const taxRate = Number(item.tax_rate) || 0;

    item.subtotal = qty * price;
    item.tax_amount = item.subtotal * (taxRate / 100);
    item.total = item.subtotal + item.tax_amount;

    setItems(newItems);
  };

  const selectCatalogItem = (index: number, productId: string) => {
    const product = catalog.find((entry) => entry.id === productId);
    if (!product) return;

    const newItems = [...items];
    const quantity = Number(newItems[index].quantity) || 1;
    const unitPrice = Number(newItems[index].unit_price) || Number(product.sale_price) || 0;
    const taxRate = Number(product.tax_rate) || 0;
    const subtotal = quantity * unitPrice;

    newItems[index] = {
      ...newItems[index],
      product_code: product.code,
      description: product.name,
      unit: product.unit || "Adet",
      unit_price: unitPrice,
      tax_rate: taxRate,
      kolaybi_product_id: product.kolaybi_product_id,
      subtotal,
      tax_amount: subtotal * (taxRate / 100),
      total: subtotal * (1 + taxRate / 100),
    };
    setItems(newItems);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const totalTax = items.reduce((sum, item) => sum + (item.tax_amount || 0), 0);
    const grandTotal = items.reduce((sum, item) => sum + (item.total || 0), 0);

    return { subtotal, totalTax, grandTotal };
  };

  const handleSave = async () => {
    if (!invoice?.id) return;

    if (items.length === 0 || items.some((item) => !item.product_code || !item.description)) {
      toast({
        title: "Eksik bilgi",
        description: "En az bir geçerli ürün veya hizmet kalemi seçmelisiniz.",
        variant: "destructive",
      });
      return;
    }
    if (items.some((item) => Number(item.quantity) <= 0 || Number(item.unit_price) <= 0)) {
      toast({
        title: "Fatura tutarı kontrol edilmeli",
        description: "0 TL tutarlı veya miktarı sıfır olan bir fatura taslağı kaydedilemez.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.rpc("rex_update_sales_invoice_draft" as any, {
        p_invoice_id: invoice.id,
        p_invoice_date: invoiceDate,
        p_due_date: dueDate,
        p_notes: notes,
        p_items: items.map((item) => ({
          productCode: item.product_code,
          description: item.description || "",
          quantity: item.quantity || 0,
          unit: item.unit || "Adet",
          unitPrice: item.unit_price || 0,
          vatRate: item.tax_rate || 0,
          kolaybiProductId: item.kolaybi_product_id || null,
          withholdingCode: item.withholding_code || null,
          withholdingValue: item.withholding_value || null,
          withholdingType: item.withholding_type || null,
          exemptionCode: item.exemption_code || null,
        })),
      } as any);
      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Fatura güncellendi",
      });

      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving invoice:", error);
      toast({
        title: "Hata",
        description: error.message || "Fatura güncellenirken hata oluştu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fatura Düzenle - {invoice?.invoice_no}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fatura Tarihi</Label>
              <Input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Vade Tarihi</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Fatura Kalemleri</Label>
              <Button size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" />
                Kalem Ekle
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-left">Ürün / Hizmet</th>
                    <th className="px-2 py-2 text-left">Açıklama</th>
                    <th className="px-2 py-2 text-right w-20">Miktar</th>
                    <th className="px-2 py-2 text-left w-20">Birim</th>
                    <th className="px-2 py-2 text-right w-24">Birim Fiyat</th>
                    <th className="px-2 py-2 text-right w-16">KDV %</th>
                    <th className="px-2 py-2 text-right w-24">Toplam</th>
                    <th className="px-2 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id || item.tempId} className="border-t">
                      <td className="px-2 py-2 min-w-56">
                        <Select
                          value={
                            catalog.find((entry) => entry.code === item.product_code)?.id ||
                            undefined
                          }
                          onValueChange={(value) => selectCatalogItem(index, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={item.product_code || "Kalem seçin"} />
                          </SelectTrigger>
                          <SelectContent>
                            {catalog.map((entry) => (
                              <SelectItem key={entry.id} value={entry.id}>
                                {entry.code} · {entry.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-2 py-2">
                        <Input
                          value={item.description || ""}
                          onChange={(e) =>
                            updateItem(index, "description", e.target.value)
                          }
                          placeholder="Hizmet/Ürün açıklaması"
                        />
                        {Number(item.tax_rate) === 0 ? (
                          <Input
                            className="mt-2"
                            value={item.exemption_code || ""}
                            onChange={(e) =>
                              updateItem(index, "exemption_code", e.target.value)
                            }
                            placeholder="İstisna kodu (ör. 311)"
                          />
                        ) : null}
                      </td>
                      <td className="px-2 py-2">
                        <Input
                          type="number"
                          value={item.quantity || ""}
                          onChange={(e) =>
                            updateItem(index, "quantity", parseFloat(e.target.value) || 0)
                          }
                          className="text-right"
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <Input
                          value={item.unit || ""}
                          onChange={(e) => updateItem(index, "unit", e.target.value)}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <Input
                          type="number"
                          value={item.unit_price || ""}
                          onChange={(e) =>
                            updateItem(index, "unit_price", parseFloat(e.target.value) || 0)
                          }
                          className="text-right"
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <Input
                          type="number"
                          value={item.tax_rate || ""}
                          onChange={(e) =>
                            updateItem(index, "tax_rate", parseFloat(e.target.value) || 0)
                          }
                          className="text-right"
                          min="0"
                          max="100"
                        />
                      </td>
                      <td className="px-2 py-2 text-right font-medium">
                        {(item.total || 0).toFixed(2)} ₺
                      </td>
                      <td className="px-2 py-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Ara Toplam:</span>
                <span className="font-medium">{totals.subtotal.toFixed(2)} ₺</span>
              </div>
              <div className="flex justify-between">
                <span>KDV:</span>
                <span className="font-medium">{totals.totalTax.toFixed(2)} ₺</span>
              </div>
              <div className="flex justify-between text-base font-bold">
                <span>Genel Toplam:</span>
                <span>{totals.grandTotal.toFixed(2)} ₺</span>
              </div>
            </div>
          </div>

          <div>
            <Label>Notlar</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Fatura notları..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
