import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { X, Search, Loader2, FileText } from "lucide-react";
import { InvoiceDialog } from "./InvoiceDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { invoiceIntegrationService } from "@/services/invoiceIntegrationService";

interface PendingInvoicesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PendingInvoicesDialog({
  isOpen,
  onClose,
  onSuccess,
}: PendingInvoicesDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [shipments, setShipments] = useState<any[]>([]);
  const [filteredShipments, setFilteredShipments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  
  // Çoklu seçim için yeni state'ler
  const [selectedShipmentIds, setSelectedShipmentIds] = useState<string[]>([]);
  const [showBulkInvoiceDialog, setShowBulkInvoiceDialog] = useState(false);
  const [bulkShipments, setBulkShipments] = useState<any[]>([]);

  // Calculate overall total from loaded shipments
  const totalAmount = shipments.reduce((sum, shipment) => sum + (shipment.totalAmount || 0), 0);

  useEffect(() => {
    if (isOpen) {
      loadPendingShipments();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredShipments(shipments);
    } else {
      const filtered = shipments.filter((shipment) => {
        const customerName = (shipment.customers?.company || shipment.customers?.name || "").toLowerCase();
        const trackingNumber = (shipment.shipment_code || "").toLowerCase();
        const search = searchQuery.toLowerCase();
        
        return customerName.includes(search) || trackingNumber.includes(search);
      });
      setFilteredShipments(filtered);
    }
  }, [searchQuery, shipments]);

  const loadPendingShipments = async () => {
    console.log("🔵 PendingInvoicesDialog: Starting to load shipments...");
    
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("shipments")
        .select(`
          id,
          shipment_code,
          customer_id,
          actual_delivery_date,
          customers!shipments_customer_id_fkey (
            id,
            name,
            company,
            vergi_no
          ),
          shipment_cargo_items (
            id,
            adet,
            birim_fiyat,
            alt_toplam_fiyat
          )
        `)
        .eq("status", "teslim_edildi")
        .is("sale_invoice_id", null)
        .order("created_at", { ascending: false });

      console.log("🔵 Pending shipments query result:", { 
        dataCount: data?.length || 0,
        data, 
        error,
        errorDetails: error ? {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        } : null
      });

      if (error) {
        console.error("🔴 Query error:", error);
        throw error;
      }

      // Calculate totalAmount for each shipment
      const shipmentsWithTotal = (data || []).map(shipment => {
        const totalAmount = Array.isArray(shipment.shipment_cargo_items)
          ? shipment.shipment_cargo_items.reduce((sum: number, cargo: any) => {
              return sum + Number(cargo.alt_toplam_fiyat ?? ((cargo.adet || 0) * (cargo.birim_fiyat || 0)));
            }, 0)
          : 0;
        
        return {
          ...shipment,
          totalAmount
        };
      });

      console.log("🟢 Shipments loaded successfully:", shipmentsWithTotal.length);
      setShipments(shipmentsWithTotal);
      setFilteredShipments(shipmentsWithTotal);
    } catch (error: any) {
      console.error("🔴 Error loading pending shipments:", error);
      toast({
        title: "Hata",
        description: error.message || "Sevkiyatlar yüklenirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Çoklu seçim toggle
  const toggleShipmentSelection = (shipmentId: string) => {
    setSelectedShipmentIds(prev => {
      if (prev.includes(shipmentId)) {
        return prev.filter(id => id !== shipmentId);
      } else {
        return [...prev, shipmentId];
      }
    });
  };

  // Tüm seçim toggle
  const toggleSelectAll = () => {
    if (selectedShipmentIds.length === filteredShipments.length) {
      setSelectedShipmentIds([]);
    } else {
      setSelectedShipmentIds(filteredShipments.map(s => s.id));
    }
  };

  // Seçilileri faturalandır
  const handleBulkInvoice = () => {
    if (selectedShipmentIds.length === 0) {
      toast({
        title: "Uyarı",
        description: "Lütfen en az bir sevkiyat seçin",
        variant: "destructive",
      });
      return;
    }

    // Seçili sevkiyatların aynı müşteriye ait olup olmadığını kontrol et
    const selectedShipmentsData = shipments.filter(s => selectedShipmentIds.includes(s.id));
    const customerIds = [...new Set(selectedShipmentsData.map(s => s.customer_id))];
    
    if (customerIds.length > 1) {
      toast({
        title: "Uyarı",
        description: "Farklı müşterilere ait sevkiyatlar tek faturada birleştirilemez",
        variant: "destructive",
      });
      return;
    }

    setBulkShipments(selectedShipmentsData);
    setShowBulkInvoiceDialog(true);
  };

  const handleCreateInvoice = (shipment: any) => {
    setSelectedShipment(shipment);
    setShowInvoiceDialog(true);
  };

  const handleInvoiceSuccess = () => {
    loadPendingShipments();
    onSuccess();
    setShowInvoiceDialog(false);
    setSelectedShipment(null);
  };

  const calculateShipmentTotal = (shipment: any) => {
    if (!shipment.shipment_cargo_items || shipment.shipment_cargo_items.length === 0) {
      return 0;
    }
    return shipment.shipment_cargo_items.reduce(
      (sum: number, cargo: any) => sum + Number(cargo.alt_toplam_fiyat ?? ((cargo.adet || 0) * (cargo.birim_fiyat || 0))),
      0
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "dd.MM.yyyy", { locale: tr });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                <span>Faturalanmayı Bekleyen Sevkiyatlar</span>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {/* ARAMA */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Müşteri veya sevkiyat numarasına göre ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* SEÇİLİ SEVKIYAT SAYISI VE TOPLU İŞLEM */}
          {selectedShipmentIds.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-sm font-medium text-blue-900">
                {selectedShipmentIds.length} sevkiyat seçildi
              </span>
              <Button
                onClick={handleBulkInvoice}
                className="bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                Seçilileri Faturalandır
              </Button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : filteredShipments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Faturalanmayı bekleyen sevkiyat bulunmuyor
            </div>
          ) : (
            <>
              {/* HEADER */}
              <div className="grid grid-cols-[auto_1fr_150px_150px_150px_150px] gap-4 pb-3 border-b font-semibold text-sm text-gray-700">
                <div className="flex items-center">
                  <Checkbox
                    checked={selectedShipmentIds.length === filteredShipments.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </div>
                <div>MÜŞTERİ</div>
                <div>SEVKİYAT NO</div>
                <div className="text-right">TUTAR</div>
                <div>TESLİM TARİHİ</div>
                <div>İŞLEM</div>
              </div>

              {/* SEVKIYAT LİSTESİ */}
              <div className="space-y-2">
                {filteredShipments.map((shipment) => (
                  <div
                    key={shipment.id}
                    className={`grid grid-cols-[auto_1fr_150px_150px_150px_150px] gap-4 p-4 rounded-lg transition-colors ${
                      selectedShipmentIds.includes(shipment.id)
                        ? "bg-blue-50 border border-blue-200"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center">
                      <Checkbox
                        checked={selectedShipmentIds.includes(shipment.id)}
                        onCheckedChange={() => toggleShipmentSelection(shipment.id)}
                      />
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {shipment.customers?.company || shipment.customers?.name || "Bilinmeyen Müşteri"}
                      </div>
                      {shipment.customers?.vergi_no && (
                        <div className="text-xs text-gray-500">VKN: {shipment.customers.vergi_no}</div>
                      )}
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-700">
                        {shipment.shipment_code}
                      </div>
                    </div>

                    <div className="text-sm font-semibold text-gray-900 text-right">
                      {shipment.totalAmount.toLocaleString("tr-TR")}₺
                    </div>

                    <div className="text-sm text-gray-600">
                      {shipment.actual_delivery_date
                        ? format(new Date(shipment.actual_delivery_date), "dd.MM.yyyy", { locale: tr })
                        : "-"}
                    </div>

                    <div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedShipment(shipment);
                          setShowInvoiceDialog(true);
                        }}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        Fatura Oluştur
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* ÖZET */}
              <div className="flex justify-between items-center pt-4 border-t mt-4">
                <span className="text-sm text-gray-600">
                  Toplam {filteredShipments.length} sevkiyat
                </span>
                <span className="text-lg font-bold text-gray-900">
                  Toplam Tutar: {totalAmount.toLocaleString("tr-TR")}₺
                </span>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* TEK SEVKİYAT FATURA DİALOĞU */}
      {showInvoiceDialog && selectedShipment && (
        <InvoiceDialog
          isOpen={showInvoiceDialog}
          onClose={() => {
            setShowInvoiceDialog(false);
            setSelectedShipment(null);
          }}
          onSuccess={handleInvoiceSuccess}
          shipment={selectedShipment}
        />
      )}

      {/* TOPLU SEVKİYAT FATURA DİALOĞU */}
      {showBulkInvoiceDialog && bulkShipments.length > 0 && (
        <BulkInvoiceDialog
          isOpen={showBulkInvoiceDialog}
          onClose={() => {
            setShowBulkInvoiceDialog(false);
            setBulkShipments([]);
          }}
          onSuccess={() => {
            setShowBulkInvoiceDialog(false);
            setBulkShipments([]);
            setSelectedShipmentIds([]);
            handleInvoiceSuccess();
          }}
          shipments={bulkShipments}
        />
      )}
    </>
  );
}

// TOPLU FATURA DİALOĞU
function BulkInvoiceDialog({ isOpen, onClose, onSuccess, shipments }: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  shipments: any[];
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);

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

  const [notes, setNotes] = useState(defaultNotes);

  // Toplam tutarları hesapla
  const totalAmount = shipments.reduce((sum, s) => sum + s.totalAmount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const invoiceData = await invoiceIntegrationService.createDraft({
        customerId: shipments[0].customer_id,
        shipmentIds: shipments.map(s => s.id),
        invoiceDate,
        dueDate: invoiceDate,
        currency: "TRY",
        paymentStatus: "Bekliyor",
        notes,
        documentType: "e_archive",
        documentScenario: "EARSIVFATURA",
        exchangeRate: 1,
        idempotencyKey: crypto.randomUUID(),
        items: shipments.map(shipment => ({
          productCode: "HIZMET",
          description: `Taşıma Hizmeti - ${shipment.shipment_code}`,
          quantity: 1,
          unit: "Adet",
          unitPrice: shipment.totalAmount / 1.2,
          vatRate: 20,
        })),
      });
      let integrationMessage = "KolayBi gönderim kuyruğuna alındı";
      try {
        const sync = await invoiceIntegrationService.send(invoiceData.id);
        integrationMessage = sync.status === "official" ? "resmî e-belge oluşturuldu" : "KolayBi'ye gönderildi";
      } catch (syncError: any) {
        integrationMessage = `taslak korundu; gönderim bekliyor: ${syncError.message}`;
      }

      toast({
        title: "Fatura taslağı oluşturuldu",
        description: `${shipments.length} sevkiyat için ${invoiceData.invoice_no}; ${integrationMessage}.`,
      });

      onSuccess();
    } catch (error: any) {
      console.error("Error creating bulk invoice:", error);
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
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Toplu Fatura Oluştur</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Seçili Sevkiyatlar:</h3>
            <ul className="space-y-1 text-sm text-blue-800">
              {shipments.map(s => (
                <li key={s.id}>
                  • {s.shipment_code} - {s.totalAmount.toLocaleString("tr-TR")}₺
                </li>
              ))}
            </ul>
            <div className="mt-3 pt-3 border-t border-blue-300 font-bold text-blue-900">
              Toplam: {totalAmount.toLocaleString("tr-TR")}₺
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Fatura Tarihi</label>
            <Input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Alt Notlar</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={8}
              className="w-full p-3 border rounded-lg text-sm font-mono"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Faturalandır
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
