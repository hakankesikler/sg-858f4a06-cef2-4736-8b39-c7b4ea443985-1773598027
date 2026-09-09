import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, FileDown, Mail, MessageSquare, X } from "lucide-react";
import { generateWaybill, type WaybillData } from "@/components/WaybillGenerator";

export interface ShipmentNotificationData extends WaybillData {
  driver_name?: string;
  driver_phone?: string;
  vehicle_plate?: string;
  trailer_plate?: string;
  customer_phone?: string;
  customer_email?: string;
}

interface ShipmentNotificationDialogProps {
  open: boolean;
  onClose: () => void;
  shipmentData: ShipmentNotificationData;
}

const normalizeWhatsAppPhone = (value: string) => {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return `90${digits.slice(1)}`;
  if (digits.length === 10) return `90${digits}`;
  return digits;
};

export const formatShipmentNotificationMessage = (shipment: ShipmentNotificationData) => {
  const shipmentLines = [
    `*Sevkiyat:* ${shipment.shipment_code}`,
    shipment.tracking_number ? `*Takip no:* ${shipment.tracking_number}` : null,
    `*Rota:* ${shipment.origin || "-"} > ${shipment.destination || "-"}`,
  ].filter(Boolean);
  const assignmentLines = [
    shipment.driver_name ? `*Sürücü:* ${shipment.driver_name}` : null,
    shipment.driver_phone ? `*Telefon:* ${shipment.driver_phone}` : null,
    shipment.vehicle_plate ? `*Çekici:* ${shipment.vehicle_plate}` : null,
    shipment.trailer_plate ? `*Dorse:* ${shipment.trailer_plate}` : null,
  ].filter(Boolean);
  const trackingLines = shipment.tracking_url
    ? ["*Canlı takip:*", shipment.tracking_url]
    : [];

  return [
    "*REX LOJİSTİK - SEVKİYAT BİLGİSİ*",
    "",
    ...shipmentLines,
    ...(assignmentLines.length ? ["", ...assignmentLines] : []),
    ...(trackingLines.length ? ["", ...trackingLines] : []),
    "",
    "İyi günler dileriz.",
    "*REX Lojistik*",
  ].join("\n");
};

export function ShipmentNotificationDialog({ open, onClose, shipmentData }: ShipmentNotificationDialogProps) {
  const message = formatShipmentNotificationMessage(shipmentData);

  const handleWhatsApp = () => {
    if (!shipmentData.customer_phone) {
      alert("Müşteri telefon numarası bulunamadı.");
      return;
    }
    const phone = normalizeWhatsAppPhone(shipmentData.customer_phone);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };

  const handleEmail = () => {
    if (!shipmentData.customer_email) {
      alert("Müşteri e-posta adresi bulunamadı.");
      return;
    }
    const subject = encodeURIComponent(`REX Lojistik - Sevkiyat Bilgisi (${shipmentData.shipment_code})`);
    window.location.href = `mailto:${shipmentData.customer_email}?subject=${subject}&body=${encodeURIComponent(message.replace(/\*/g, ""))}`;
  };

  const handleCopyLink = async () => {
    if (!shipmentData.tracking_url) {
      alert("Takip bağlantısı henüz oluşturulmadı.");
      return;
    }
    await navigator.clipboard.writeText(shipmentData.tracking_url);
    alert("Takip bağlantısı kopyalandı.");
  };

  const handleDownloadWaybill = async () => {
    try {
      await generateWaybill({
        ...shipmentData,
        driver: shipmentData.driver || {
          full_name: shipmentData.driver_name,
          phone_1: shipmentData.driver_phone,
        },
        vehicle: shipmentData.vehicle || {
          cekici_plakasi: shipmentData.vehicle_plate,
          dorse_plakasi: shipmentData.trailer_plate,
        },
      });
    } catch (error) {
      console.error("Waybill generation failed:", error);
      alert("Taşıma belgesi oluşturulamadı. Lütfen tekrar deneyin.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Sevkiyat başarıyla kaydedildi</DialogTitle>
          <DialogDescription>
            Mesajı paylaşabilir veya REX antetli taşıma belgesini indirebilirsiniz.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">WhatsApp mesajı önizlemesi</p>
            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-800">{message}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Button onClick={() => void handleCopyLink()} className="h-20 flex-col gap-2" variant="outline">
              <Copy className="h-6 w-6 text-orange-600" />
              <span>Takip Linki</span>
            </Button>
            <Button onClick={handleWhatsApp} className="h-20 flex-col gap-2" variant="outline">
              <MessageSquare className="h-6 w-6 text-green-600" />
              <span>WhatsApp</span>
            </Button>
            <Button onClick={handleEmail} className="h-20 flex-col gap-2" variant="outline">
              <Mail className="h-6 w-6 text-blue-600" />
              <span>E-posta</span>
            </Button>
            <Button onClick={() => void handleDownloadWaybill()} className="h-20 flex-col gap-2" variant="outline">
              <FileDown className="h-6 w-6 text-[#173763]" />
              <span>Waybill PDF</span>
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Kapat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
