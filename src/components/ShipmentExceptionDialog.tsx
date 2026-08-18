import { useEffect, useState } from "react";
import { AlertTriangle, Camera, CheckCircle2, FileImage, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { openPrivateDocument } from "@/lib/private-storage";
import {
  shipmentExceptionService,
  type ExceptionResponsible,
  type ShipmentException,
  type ShipmentExceptionType,
} from "@/services/shipmentExceptionService";

const typeLabels: Record<ShipmentExceptionType, string> = {
  gecikme: "Gecikme",
  arac_arizasi: "Araç Arızası",
  hasarli_teslimat: "Hasarlı Teslimat",
  eksik_teslimat: "Eksik Teslimat",
  teslim_edilemedi: "Teslim Edilemedi",
  iade: "İade",
  iptal: "İptal",
};

const typeColors: Record<ShipmentExceptionType, string> = {
  gecikme: "bg-amber-100 text-amber-800",
  arac_arizasi: "bg-orange-100 text-orange-800",
  hasarli_teslimat: "bg-red-100 text-red-800",
  eksik_teslimat: "bg-rose-100 text-rose-800",
  teslim_edilemedi: "bg-purple-100 text-purple-800",
  iade: "bg-blue-100 text-blue-800",
  iptal: "bg-slate-200 text-slate-900",
};

function localNow() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export function ShipmentExceptionDialog({
  isOpen,
  onClose,
  shipment,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  shipment: { id: string; shipment_code?: string | null } | null;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [exceptions, setExceptions] = useState<ShipmentException[]>([]);
  const [responsibles, setResponsibles] = useState<ExceptionResponsible[]>([]);
  const [exceptionType, setExceptionType] = useState<ShipmentExceptionType>("gecikme");
  const [description, setDescription] = useState("");
  const [responsibleUserId, setResponsibleUserId] = useState("");
  const [occurredAt, setOccurredAt] = useState(localNow());
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!shipment?.id) return;
    try {
      setLoading(true);
      const [nextExceptions, nextResponsibles] = await Promise.all([
        shipmentExceptionService.list(shipment.id),
        shipmentExceptionService.getResponsibles(),
      ]);
      setExceptions(nextExceptions);
      setResponsibles(nextResponsibles);
      setResponsibleUserId((current) => current || nextResponsibles[0]?.user_id || "");
    } catch (error: any) {
      toast({ title: "İstisna kayıtları yüklenemedi", description: error?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isOpen) void load(); }, [isOpen, shipment?.id]);

  const selectFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
    if (selected.length > 5) {
      toast({ title: "En fazla 5 fotoğraf", variant: "destructive" });
      return;
    }
    const invalid = selected.find((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024);
    if (invalid) {
      toast({ title: "Geçersiz fotoğraf", description: "Yalnız JPG, PNG veya WEBP; dosya başına en fazla 5 MB.", variant: "destructive" });
      return;
    }
    setFiles(selected);
  };

  const submit = async () => {
    if (!shipment?.id || description.trim().length < 10 || !responsibleUserId || !occurredAt) {
      toast({ title: "Eksik bilgi", description: "En az 10 karakter açıklama, sorumlu kişi ve olay zamanı zorunludur.", variant: "destructive" });
      return;
    }
    try {
      setSubmitting(true);
      const photoUrls = await shipmentExceptionService.uploadPhotos(shipment.id, files);
      await shipmentExceptionService.create({
        shipmentId: shipment.id,
        exceptionType,
        description: description.trim(),
        photoUrls,
        responsibleUserId,
        occurredAt: new Date(occurredAt).toISOString(),
      });
      toast({ title: "İstisna kaydedildi", description: `${typeLabels[exceptionType]} olayı sevkiyat geçmişine eklendi.` });
      setDescription(""); setFiles([]); setOccurredAt(localNow()); setExceptionType("gecikme");
      await load();
      onSuccess();
    } catch (error: any) {
      toast({ title: "İstisna kaydedilemedi", description: error?.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const resolve = async (item: ShipmentException) => {
    const note = window.prompt("İstisnanın nasıl sonuçlandığını yazın (en az 5 karakter):");
    if (!note || note.trim().length < 5) return;
    try {
      await shipmentExceptionService.resolve(item.id, note.trim());
      toast({ title: "İstisna sonuçlandırıldı" });
      await load();
      onSuccess();
    } catch (error: any) {
      toast({ title: "İşlem tamamlanamadı", description: error?.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-600" />Sevkiyat İstisnaları — {shipment?.shipment_code}</DialogTitle></DialogHeader>

        <div className="rounded-lg border bg-slate-50 p-4">
          <h3 className="mb-4 font-semibold">Yeni İstisna Kaydı</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label>İstisna Türü *</Label><Select value={exceptionType} onValueChange={(value) => setExceptionType(value as ShipmentExceptionType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(typeLabels).map(([value,label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Sorumlu Kişi *</Label><Select value={responsibleUserId} onValueChange={setResponsibleUserId}><SelectTrigger><SelectValue placeholder="Sorumlu seçin" /></SelectTrigger><SelectContent>{responsibles.map((person) => <SelectItem key={person.user_id} value={person.user_id}>{person.email} ({person.role})</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Olay Tarihi ve Saati *</Label><Input type="datetime-local" value={occurredAt} max={localNow()} onChange={(event) => setOccurredAt(event.target.value)} /></div>
            <div className="space-y-2"><Label>Fotoğraflar (en fazla 5)</Label><Input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={selectFiles} /><p className="text-xs text-slate-500">{files.length ? `${files.length} fotoğraf seçildi` : "JPG, PNG veya WEBP · dosya başına en fazla 5 MB"}</p></div>
            <div className="space-y-2 md:col-span-2"><Label>Açıklama *</Label><Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} placeholder="Olayın sebebini, etkisini ve yapılan işlemi ayrıntılı yazın (en az 10 karakter)" /></div>
          </div>
          {exceptionType === "iptal" && <p className="mt-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">İptal kaydı oluşturulduğunda mevcut güvenli sevkiyat iptal kuralları da çalışır. Faturalı veya teslim edilmiş sevkiyat doğrudan iptal edilemez.</p>}
          <div className="mt-4 flex justify-end"><Button onClick={() => void submit()} disabled={submitting}>{submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}İstisnayı Kaydet</Button></div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">İstisna Geçmişi</h3>
          {loading ? <div className="py-8 text-center text-slate-500"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div> : exceptions.map((item) => (
            <div key={item.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-start justify-between gap-2"><div><span className={`rounded-full px-2 py-1 text-xs font-medium ${typeColors[item.exception_type]}`}>{typeLabels[item.exception_type]}</span><span className={`ml-2 rounded-full px-2 py-1 text-xs ${item.status === "open" ? "bg-amber-50 text-amber-800" : "bg-green-50 text-green-800"}`}>{item.status === "open" ? "Açık" : "Sonuçlandı"}</span></div><time className="text-xs text-slate-500">{new Date(item.occurred_at).toLocaleString("tr-TR")}</time></div>
              <p className="mt-3 text-sm text-slate-700">{item.description}</p>
              <p className="mt-2 text-xs text-slate-500">Sorumlu: {item.responsible_email} · Kaydeden: {item.created_by_email || "-"}</p>
              {item.photo_urls?.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{item.photo_urls.map((photo,index) => <Button key={photo} variant="outline" size="sm" onClick={() => void openPrivateDocument(photo,"shipment-exception-documents")}><FileImage className="mr-1 h-4 w-4" />Fotoğraf {index+1}</Button>)}</div>}
              {item.status === "resolved" && <div className="mt-3 rounded bg-green-50 p-3 text-sm text-green-800"><CheckCircle2 className="mr-1 inline h-4 w-4" />{item.resolution_note}</div>}
              {item.status === "open" && <div className="mt-3 flex justify-end"><Button variant="outline" size="sm" onClick={() => void resolve(item)}>Sonuçlandır</Button></div>}
            </div>
          ))}
          {!loading && exceptions.length === 0 && <div className="rounded-lg border border-dashed py-8 text-center text-sm text-slate-500">Bu sevkiyat için istisna kaydı bulunmuyor.</div>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
