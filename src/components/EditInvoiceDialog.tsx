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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type SalesInvoice = Tables<"sales_invoices">;
type InvoiceItem = Tables<"sales_invoice_items">;

interface InvoiceItemForm extends Partial<InvoiceItem> {
  tempId?: string;
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

  useEffect(() => {
    if (invoice && open) {
      setInvoiceDate(invoice.invoice_date || "");
      setDueDate(invoice.due_date || "");
      setNotes(invoice.notes || "");
      loadInvoiceItems();
    }
  }, [invoice, open]);

  const loadInvoiceItems = async () => {
    if (!invoice?.id) return;

    const { data, error } = await supabase
      .from("sales_invoice_items")
      .select("*")
      .eq("invoice_id", invoice.id);

    if (error) {
      console.error("Error loading invoice items:", error);
      return;
    }

    setItems(data || []);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        tempId: `temp-${Date.now()}`,
        description: "",
        quantity: 1,
        unit: "Adet",
        unit_price: 0,
        tax_rate: 20,
        subtotal: 0,
        tax_amount: 0,
        total: 0,
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

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const totalTax = items.reduce((sum, item) => sum + (item.tax_amount || 0), 0);
    const grandTotal = items.reduce((sum, item) => sum + (item.total || 0), 0);

    return { subtotal, totalTax, grandTotal };
  };

  const handleSave = async () => {
    if (!invoice?.id) return;

    try {
      setLoading(true);

      const { subtotal, totalTax, grandTotal } = calculateTotals();

      // Update invoice
      const { error: invoiceError } = await supabase
        .from("sales_invoices")
        .update({
          invoice_date: invoiceDate,
          due_date: dueDate,
          notes: notes,
          subtotal: subtotal,
          total_tax: totalTax,
          grand_total: grandTotal,
        })
        .eq("id", invoice.id);

      if (invoiceError) throw invoiceError;

      // Delete existing items
      await supabase
        .from("sales_invoice_items")
        .delete()
        .eq("invoice_id", invoice.id);

      // Insert new items
      const itemsToInsert = items.map((item) => ({
        invoice_id: invoice.id,
        product_code: item.product_code || "",
        description: item.description || "",
        quantity: item.quantity || 0,
        unit: item.unit || "Adet",
        unit_price: item.unit_price || 0,
        subtotal: item.subtotal || 0,
        tax_rate: item.tax_rate || 0,
        tax_amount: item.tax_amount || 0,
        total: item.total || 0,
      }));

      const { error: itemsError } = await supabase
        .from("sales_invoice_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

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
                      <td className="px-2 py-2">
                        <Input
                          value={item.description || ""}
                          onChange={(e) =>
                            updateItem(index, "description", e.target.value)
                          }
                          placeholder="Hizmet/Ürün açıklaması"
                        />
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