import { useEffect, useState } from "react";
import { ArrowRight, Clock3, Loader2, UserRound } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { transportJobService, type TransportJob, type TransportJobEvent } from "@/services/transportJobService";
import { useToast } from "@/hooks/use-toast";

interface TransportJobHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  job: TransportJob | null;
}

const eventLabels: Record<string, string> = {
  job_created: "İş emri oluşturuldu",
  job_updated: "İş emri güncellendi",
  job_approved: "İş emri onaylandı",
  job_rejected: "İş emri reddedildi",
  job_deleted: "İş emri silindi",
};

const statusLabels: Record<string, string> = {
  onay_bekliyor: "Onay bekliyor",
  onaylandi: "Onaylandı",
  reddedildi: "Reddedildi",
};

export function TransportJobHistoryDialog({ isOpen, onClose, job }: TransportJobHistoryDialogProps) {
  const [events, setEvents] = useState<TransportJobEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen || !job?.id) return;
    setLoading(true);
    transportJobService.getHistory(job.id)
      .then(setEvents)
      .catch((error) => toast({ title: "İşlem geçmişi yüklenemedi", description: error?.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [isOpen, job?.id, toast]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock3 className="h-5 w-5" /> İş Emri Geçmişi — {job?.job_code}
          </DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Geçmiş yükleniyor...
          </div>
        ) : events.length === 0 ? (
          <div className="py-12 text-center text-gray-500">Bu iş emri için geçmiş kaydı bulunamadı.</div>
        ) : (
          <div className="relative ml-3 space-y-5 border-l-2 border-slate-200 py-2 pl-6">
            {events.map((event) => (
              <div key={event.id} className="relative rounded-lg border bg-white p-4 shadow-sm">
                <span className="absolute -left-[33px] top-5 h-3 w-3 rounded-full bg-blue-600 ring-4 ring-white" />
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{eventLabels[event.event_type] || event.event_type}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <UserRound className="h-3 w-3" />
                      {event.actor_email || (event.source === "system" ? "Sistem" : "Kullanıcı")}
                      {event.actor_role ? ` (${event.actor_role})` : ""}
                    </p>
                  </div>
                  <time className="whitespace-nowrap text-xs text-slate-500">
                    {format(new Date(event.event_at), "dd MMM yyyy HH:mm", { locale: tr })}
                  </time>
                </div>
                {event.old_status !== event.new_status && (event.old_status || event.new_status) && (
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <span className="rounded bg-slate-100 px-2 py-1">{statusLabels[event.old_status || ""] || event.old_status || "—"}</span>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                    <span className="rounded bg-blue-50 px-2 py-1 text-blue-800">{statusLabels[event.new_status || ""] || event.new_status || "—"}</span>
                  </div>
                )}
                {event.note && <p className="mt-3 text-sm text-slate-600">{event.note}</p>}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
