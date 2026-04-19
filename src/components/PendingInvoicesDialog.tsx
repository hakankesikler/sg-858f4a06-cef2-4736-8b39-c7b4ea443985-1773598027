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
import { Loader2, FileText, Search, X } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { InvoiceDialog } from "@/components/InvoiceDialog";

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
  const [searchTerm, setSearchTerm] = useState("");
  
  // Invoice dialog state
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPendingShipments();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredShipments(shipments);
    } else {
      const filtered = shipments.filter((shipment) => {
        const customerName = (shipment.customers?.company || shipment.customers?.name || "").toLowerCase();
        const trackingNumber = (shipment.tracking_number || "").toLowerCase();
        const search = searchTerm.toLowerCase();
        
        return customerName.includes(search) || trackingNumber.includes(search);
      });
      setFilteredShipments(filtered);
    }
  }, [searchTerm, shipments]);

  const loadPendingShipments = async () => {
    setLoading(true);
    try {
      // Fetch delivered shipments that haven't been invoiced yet
      const { data, error } = await supabase
        .from("shipments")
        .select(`
          *,
          customers:customer_id (
            id,
            name,
            company,
            tax_number,
            tax_office
          ),
          shipment_cargo (
            id,
            cargo_name,
            quantity,
            unit_price,
            total_price
          )
        `)
        .eq("status", "teslim_edildi")
        .or("invoice_status.is.null,invoice_status.neq.faturalandi")
        .order("actual_delivery_date", { ascending: false });

      if (error) throw error;

      setShipments(data || []);
      setFilteredShipments(data || []);
    } catch (error: any) {
      console.error("Error loading pending shipments:", error);
      toast({
        title: "Hata",
        description: "Sevkiyatlar yüklenirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
    if (!shipment.shipment_cargo || shipment.shipment_cargo.length === 0) {
      return 0;
    }
    return shipment.shipment_cargo.reduce(
      (sum: number, cargo: any) => sum + (cargo.total_price || 0),
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
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Faturalanmayı Bekleyen Sevkiyatlar
              </span>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Müşteri veya sevkiyat numarasına göre ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Müşteri
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Sevkiyat No
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                      Tutar
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Teslim Tarihi
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                      İşlem
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                        <p className="text-sm text-gray-500 mt-2">Yükleniyor...</p>
                      </td>
                    </tr>
                  ) : filteredShipments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        {searchTerm ? "Arama sonucu bulunamadı" : "Faturalanmayı bekleyen sevkiyat bulunmuyor"}
                      </td>
                    </tr>
                  ) : (
                    filteredShipments.map((shipment) => (
                      <tr key={shipment.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">
                            {shipment.customers?.company || shipment.customers?.name || "Bilinmeyen"}
                          </div>
                          {shipment.customers?.tax_number && (
                            <div className="text-xs text-gray-500">
                              VKN: {shipment.customers.tax_number}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-mono text-sm text-gray-900">
                            {shipment.tracking_number || "-"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="font-semibold text-gray-900">
                            {formatCurrency(calculateShipmentTotal(shipment))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">
                            {formatDate(shipment.actual_delivery_date)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            size="sm"
                            onClick={() => handleCreateInvoice(shipment)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Fatura Oluştur
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          {!loading && filteredShipments.length > 0 && (
            <div className="flex justify-between items-center px-4 py-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">
                Toplam {filteredShipments.length} sevkiyat
              </div>
              <div className="font-semibold text-gray-900">
                Toplam Tutar:{" "}
                {formatCurrency(
                  filteredShipments.reduce(
                    (sum, shipment) => sum + calculateShipmentTotal(shipment),
                    0
                  )
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Invoice Dialog */}
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
    </>
  );
}