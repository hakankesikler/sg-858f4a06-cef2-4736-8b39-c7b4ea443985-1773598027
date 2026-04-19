import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface InvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  shipment: any;
}

export function InvoiceDialog({ isOpen, onClose, onSuccess, shipment }: InvoiceDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Purchase invoice (Alış Faturası - Tedarikçiden gelen)
  const [purchaseInvoiceNo, setPurchaseInvoiceNo] = useState("");
  const [purchaseAmount, setPurchaseAmount] = useState("");
  
  // Sales invoice (Satış Faturası - Müşteriye kesilen)
  const [salesInvoiceNo, setSalesInvoiceNo] = useState("");
  const [salesAmount, setSalesAmount] = useState("");

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

  useEffect(() => {
    if (isOpen && shipment) {
      // Reset form
      setPurchaseInvoiceNo("");
      setPurchaseAmount(shipment.cost?.toString() || "");
      setSalesAmount("");
      
      // Generate next sales invoice number
      generateNextSalesInvoiceNo();
    }
  }, [isOpen, shipment]);

  const generateNextSalesInvoiceNo = async () => {
    try {
      const { data, error } = await supabase
        .from("sales_invoices")
        .select("invoice_no")
        .order("invoice_no", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error fetching last sales invoice:", error);
        setSalesInvoiceNo("SAT-2026-0001");
        return;
      }

      if (!data || data.length === 0) {
        setSalesInvoiceNo("SAT-2026-0001");
        return;
      }

      const lastInvoice = data[0].invoice_no;
      const match = lastInvoice?.match(/SAT-(\d+)-(\d+)/);
      
      if (!match) {
        setSalesInvoiceNo("SAT-2026-0001");
        return;
      }

      const lastNumber = parseInt(match[2], 10);
      const nextNumber = lastNumber + 1;
      const year = new Date().getFullYear();
      const nextInvoiceNo = `SAT-${year}-${nextNumber.toString().padStart(4, "0")}`;
      
      setSalesInvoiceNo(nextInvoiceNo);
    } catch (error) {
      console.error("Error generating sales invoice number:", error);
      setSalesInvoiceNo("SAT-2026-0001");
    }
  };

  const calculateProfit = () => {
    const sales = parseFloat(salesAmount) || 0;
    const purchase = parseFloat(purchaseAmount) || 0;
    return sales - purchase;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!purchaseInvoiceNo.trim()) {
      toast({
        title: "Eksik Bilgi",
        description: "Alış faturası numarasını giriniz",
        variant: "destructive",
      });
      return;
    }

    if (!salesAmount || parseFloat(salesAmount) <= 0) {
      toast({
        title: "Eksik Bilgi",
        description: "Satış faturası tutarını giriniz",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create purchase invoice (Alış Faturası)
      const { data: purchaseInvoice, error: purchaseError } = await supabase
        .from("purchases")
        .insert({
          supplier_id: shipment.supplier_id,
          shipment_id: shipment.id,
          purchase_no: purchaseInvoiceNo,
          purchase_date: new Date().toISOString().split('T')[0],
          due_date: new Date().toISOString().split('T')[0],
          total: parseFloat(purchaseAmount),
          subtotal: parseFloat(purchaseAmount),
          status: "beklemede",
        })
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // 2. Create sales invoice (Satış Faturası)
      const { data: salesInvoice, error: salesError } = await supabase
        .from("sales_invoices")
        .insert({
          customer_id: shipment.customer_id,
          shipment_id: shipment.id,
          invoice_no: salesInvoiceNo,
          invoice_date: new Date().toISOString().split('T')[0],
          due_date: new Date().toISOString().split('T')[0],
          grand_total: parseFloat(salesAmount),
          subtotal: parseFloat(salesAmount),
          currency: shipment.currency || "TRY",
          status: "beklemede",
        })
        .select()
        .single();

      if (salesError) throw salesError;

      // 3. Update shipment with invoice references
      const { error: shipmentError } = await supabase
        .from("shipments")
        .update({
          invoice_status: "faturalandi",
          sale_invoice_id: salesInvoice.id,
          purchase_invoice_id: purchaseInvoice.id,
        })
        .eq("id", shipment.id);

      if (shipmentError) throw shipmentError;

      toast({
        title: "Başarılı",
        description: "Faturalar başarıyla oluşturuldu",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error creating invoices:", error);
      toast({
        title: "Hata",
        description: error.message || "Faturalar oluşturulurken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!shipment) return null;

  const profit = calculateProfit();
  const profitColor = profit >= 0 ? "text-green-600" : "text-red-600";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sevkiyatı Faturalandır</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sevkiyat Özeti */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <h3 className="font-semibold text-sm">Sevkiyat Bilgileri</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Sevkiyat Kodu:</span>
                <span className="ml-2 font-medium">{shipment.shipment_code}</span>
              </div>
              <div>
                <span className="text-gray-600">Müşteri:</span>
                <span className="ml-2 font-medium">{shipment.customer?.name || "-"}</span>
              </div>
              <div>
                <span className="text-gray-600">Tedarikçi:</span>
                <span className="ml-2 font-medium">{shipment.supplier?.name || "-"}</span>
              </div>
              <div>
                <span className="text-gray-600">Rota:</span>
                <span className="ml-2 font-medium">{shipment.origin} → {shipment.destination}</span>
              </div>
            </div>
          </div>

          {/* Alış Faturası (Tedarikçiden Gelen) */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              Alış Faturası (Tedarikçiden Gelen)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tedarikçi</Label>
                <Input
                  value={shipment.supplier?.name || "-"}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <Label>Fatura Numarası *</Label>
                <Input
                  placeholder="Örn: TED-2026-001"
                  value={purchaseInvoiceNo}
                  onChange={(e) => setPurchaseInvoiceNo(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Tutar (Maliyet)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={purchaseAmount}
                  onChange={(e) => setPurchaseAmount(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Para Birimi</Label>
                <Input
                  value={shipment.cost_currency || "TRY"}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Satış Faturası (Müşteriye Kesilen) */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Satış Faturası (Müşteriye Kesilen)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Müşteri</Label>
                <Input
                  value={shipment.customer?.name || "-"}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <Label>Fatura Numarası</Label>
                <Input
                  value={salesInvoiceNo}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <Label>Tutar (Satış) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Müşteriye fatura tutarı"
                  value={salesAmount}
                  onChange={(e) => setSalesAmount(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Para Birimi</Label>
                <Input
                  value={shipment.currency || "TRY"}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Özet ve Kâr/Zarar */}
          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <h3 className="font-semibold text-sm">Özet</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Satış Tutarı:</span>
                <span className="font-medium text-green-600">
                  {salesAmount ? `${parseFloat(salesAmount).toFixed(2)} ${shipment.currency || "TRY"}` : "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Alış Tutarı:</span>
                <span className="font-medium text-red-600">
                  {purchaseAmount ? `${parseFloat(purchaseAmount).toFixed(2)} ${shipment.cost_currency || "TRY"}` : "-"}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-blue-200">
                <span className="font-semibold">Kâr/Zarar:</span>
                <span className={`font-bold ${profitColor}`}>
                  {salesAmount && purchaseAmount ? `${profit.toFixed(2)} TL` : "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
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