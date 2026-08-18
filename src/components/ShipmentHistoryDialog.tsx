import { useEffect, useState } from "react";
import { ArrowRight, Clock3, Loader2, UserRound } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { shipmentService, type ShipmentEvent } from "@/services/shipmentService";
import { useToast } from "@/hooks/use-toast";

interface ShipmentHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: { id: string; shipment_code?: string | null } | null;
}

const eventLabels: Record<string, string> = {
  history_enabled: "Geçmiş kaydı etkinleştirildi",
  created: "Sevkiyat oluşturuldu",
  updated: "Sevkiyat bilgileri güncellendi",
  assignment_changed: "Sürücü veya araç ataması değiştirildi",
  status_changed: "Sevkiyat durumu değiştirildi",
  delivery_document_added: "Teslim evrakı yüklendi",
  delivered: "Sevkiyat teslim edildi",
  invoiced: "Sevkiyat faturalandırıldı",
  invoice_unlinked: "Fatura bağlantısı kaldırıldı",
  deleted: "Sevkiyat silindi",
  owner_approved_edit: "Tamamlanmış sevkiyat değişikliği onaylandı",
};

const fieldLabels: Record<string, string> = {
  customer_id: "Müşteri",
  supplier_id: "Tedarikçi",
  driver_id: "Sürücü",
  vehicle_id: "Araç",
  origin: "Çıkış",
  destination: "Varış",
  pickup_date: "Yükleme tarihi",
  estimated_delivery_date: "Tahmini teslim tarihi",
  delivery_date: "Teslim tarihi",
  delivered_to: "Teslim alan",
  status: "Durum",
  cost: "Maliyet",
  cost_currency: "Maliyet para birimi",
  currency: "Para birimi",
  sender_name: "Gönderici",
  receiver: "Alıcı",
  receiver_district: "Alıcı ilçe",
  sender_ii: "Gönderici il",
  receiver_ii: "Alıcı il",
  adet: "Adet",
  cinsi: "Yük cinsi",
  kg_ds: "Kg/Desi",
  toplam_kg_ds: "Toplam Kg/Desi",
  satis_tutar: "Satış tutarı",
  delivery_proof_url: "Teslim evrakı",
  invoice_status: "Fatura durumu",
  sale_invoice_id: "Fatura bağlantısı",
};

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Evet" : "Hayır";
  if (typeof value === "object") return "Kayıt ayrıntıları";
  return String(value);
}

function visibleChanges(event: ShipmentEvent) {
  return Object.entries(event.changed_fields || {})
    .filter(([key]) => key !== "new_record" && key !== "deleted_record" && !(key === "status" && event.old_status !== event.new_status))
    .map(([key, raw]) => {
      const change = (raw && typeof raw === "object" ? raw : {}) as { old?: unknown; new?: unknown; old_label?: unknown; new_label?: unknown };
      if (key === "delivery_proof_url") {
        return { key, label: fieldLabels[key], oldValue: change.old ? "Belge vardı" : "Belge yoktu", newValue: change.new ? "Belge yüklendi" : "Belge kaldırıldı" };
      }
      return { key, label: fieldLabels[key] || key, oldValue: change.old_label ?? change.old, newValue: change.new_label ?? change.new };
    });
}

export function ShipmentHistoryDialog({ isOpen, onClose, shipment }: ShipmentHistoryDialogProps) {
  const [events, setEvents] = useState<ShipmentEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen || !shipment?.id) return;
    setLoading(true);
    shipmentService.getShipmentHistory(shipment.id)
      .then(setEvents)
      .catch((error) => toast({ title: "Geçmiş yüklenemedi", description: error?.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [isOpen, shipment?.id, toast]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Clock3 className="h-5 w-5" />Sevkiyat Geçmişi — {shipment?.shipment_code}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-500"><Loader2 className="h-5 w-5 mr-2 animate-spin" />Geçmiş yükleniyor...</div>
        ) : events.length === 0 ? (
          <div className="py-12 text-center text-gray-500">Bu sevkiyat için geçmiş kaydı bulunamadı.</div>
        ) : (
          <div className="relative ml-3 border-l-2 border-slate-200 pl-6 space-y-6 py-2">
            {events.map((event) => {
              const changes = visibleChanges(event);
              return <div key={event.id} className="relative rounded-lg border bg-white p-4 shadow-sm">
                <span className="absolute -left-[33px] top-5 h-3 w-3 rounded-full bg-blue-600 ring-4 ring-white" />
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div><p className="font-semibold text-slate-900">{eventLabels[event.event_type] || event.event_type}</p><p className="mt-1 text-xs text-slate-500 flex items-center gap-1"><UserRound className="h-3 w-3" />{event.actor_email || (event.source === "system" ? "Sistem" : "Kullanıcı")} {event.actor_role ? `(${event.actor_role})` : ""}</p></div>
                  <time className="text-xs text-slate-500 whitespace-nowrap">{format(new Date(event.event_at), "dd MMM yyyy HH:mm", { locale: tr })}</time>
                </div>
                {event.old_status !== event.new_status && (event.old_status || event.new_status) && <div className="mt-3 flex items-center gap-2 text-sm"><span className="rounded bg-slate-100 px-2 py-1">{event.old_status || "—"}</span><ArrowRight className="h-4 w-4 text-slate-400" /><span className="rounded bg-blue-50 px-2 py-1 text-blue-800">{event.new_status || "—"}</span></div>}
                {changes.length > 0 && <div className="mt-3 divide-y rounded border bg-slate-50">{changes.map((change) => <div key={change.key} className="grid grid-cols-[140px_1fr] gap-3 px-3 py-2 text-sm"><span className="font-medium text-slate-600">{change.label}</span><span className="text-slate-700">{displayValue(change.oldValue)} <ArrowRight className="inline h-3 w-3 mx-1" /> {displayValue(change.newValue)}</span></div>)}</div>}
                {event.note && <p className="mt-3 text-sm text-slate-600">{event.note}</p>}
              </div>;
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
