import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  deliveryDocumentService,
  deliveryDocumentTypeLabels,
  type DeliveryDocumentType,
} from "@/services/deliveryDocumentService";
import { FileImage, FileText, ShieldCheck, Trash2, Upload } from "lucide-react";

interface DeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipmentId: string;
  shipmentCode: string;
  onSuccess: () => void;
}

interface SelectedDeliveryFile {
  id: string;
  file: File;
  documentType: DeliveryDocumentType;
  notes: string;
  previewUrl?: string;
}

const acceptedTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
const maxFileSize = 10 * 1024 * 1024;

export function DeliveryModal({ isOpen, onClose, shipmentId, shipmentCode, onSuccess }: DeliveryModalProps) {
  const { toast } = useToast();
  const [deliveredTo, setDeliveredTo] = useState("");
  const [files, setFiles] = useState<SelectedDeliveryFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split("T")[0]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(event.target.files || []);
    const accepted: SelectedDeliveryFile[] = [];
    for (const file of incoming) {
      if (!acceptedTypes.has(file.type)) {
        toast({ title: "Dosya kabul edilmedi", description: `${file.name}: yalnızca PDF, JPG, PNG veya WEBP yüklenebilir.`, variant: "destructive" });
        continue;
      }
      if (file.size < 1 || file.size > maxFileSize) {
        toast({ title: "Dosya kabul edilmedi", description: `${file.name}: dosya boyutu 10 MB sınırını aşamaz.`, variant: "destructive" });
        continue;
      }
      accepted.push({
        id: crypto.randomUUID(),
        file,
        documentType: "delivery_proof",
        notes: "",
        previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      });
    }
    setFiles((current) => [...current, ...accepted].slice(0, 10));
    event.target.value = "";
  };

  const updateFile = (id: string, patch: Partial<SelectedDeliveryFile>) => {
    setFiles((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const removeFile = (id: string) => {
    setFiles((current) => {
      const removed = current.find((item) => item.id === id);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return current.filter((item) => item.id !== id);
    });
  };

  const resetForm = () => {
    files.forEach((item) => item.previewUrl && URL.revokeObjectURL(item.previewUrl));
    setFiles([]);
    setDeliveredTo("");
    setDeliveryDate(new Date().toISOString().split("T")[0]);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!deliveredTo.trim() || !deliveryDate || files.length === 0) {
      toast({ title: "Eksik bilgi", description: "Teslim alan, teslim tarihi ve en az bir teslim evrakı zorunludur.", variant: "destructive" });
      return;
    }
    if (!files.some((item) => item.documentType === "delivery_proof")) {
      toast({ title: "Teslim evrakı gerekli", description: "Dosyalardan en az biri ‘Teslim Evrakı’ türünde olmalıdır.", variant: "destructive" });
      return;
    }

    try {
      setIsSubmitting(true);
      const uploaded = await deliveryDocumentService.uploadMany(
        shipmentId,
        files.map((item) => ({ file: item.file, documentType: item.documentType, notes: item.notes })),
      );
      await deliveryDocumentService.markDelivered(shipmentId, deliveredTo, deliveryDate, uploaded.map((item) => item.id));

      const waitingCount = uploaded.filter((item) => item.scanStatus !== "clean").length;
      toast({
        title: "Teslimat tamamlandı",
        description: waitingCount
          ? `${uploaded.length} belge kaydedildi. ${waitingCount} belge özel karantinada virüs taraması bekliyor.`
          : `${uploaded.length} belge virüs taramasından temiz geçti ve kaydedildi.`,
      });
      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      toast({ title: "Teslim işlemi tamamlanamadı", description: error?.message || "Beklenmeyen bir hata oluştu.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[760px]">
        <DialogHeader>
          <DialogTitle>Sevkiyatı Teslim Et</DialogTitle>
          <p className="text-sm text-muted-foreground">Sevkiyat: <span className="font-semibold">{shipmentCode}</span></p>
        </DialogHeader>

        <div className="grid gap-4 py-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="delivered-to">Teslim Alan Kişi *</Label>
            <Input id="delivered-to" value={deliveredTo} onChange={(event) => setDeliveredTo(event.target.value)} placeholder="Örn: Ahmet Yılmaz" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="delivery-date">Teslim Tarihi *</Label>
            <Input id="delivery-date" type="date" value={deliveryDate} onChange={(event) => setDeliveryDate(event.target.value)} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <Label htmlFor="delivery-files">Teslim Belge Paketi *</Label>
              <p className="text-xs text-muted-foreground">Bir defada en fazla 10 adet PDF veya fotoğraf, dosya başına 10 MB.</p>
            </div>
            <Button type="button" variant="outline" onClick={() => document.getElementById("delivery-files")?.click()}>
              <Upload className="mr-2 h-4 w-4" /> Belge veya Fotoğraf Ekle
            </Button>
            <Input id="delivery-files" type="file" multiple accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={handleFileChange} className="hidden" />
          </div>

          {files.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Henüz belge seçilmedi.</div>
          ) : (
            <div className="space-y-3">
              {files.map((item) => (
                <div key={item.id} className="grid gap-3 rounded-lg border bg-slate-50 p-3 sm:grid-cols-[72px_1fr_auto]">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded border bg-white">
                    {item.previewUrl ? <img src={item.previewUrl} alt="Belge önizleme" className="h-full w-full object-cover" /> : <FileText className="h-7 w-7 text-red-600" />}
                  </div>
                  <div className="min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      {item.file.type.startsWith("image/") ? <FileImage className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                      <span className="truncate text-sm font-medium">{item.file.name}</span>
                      <span className="text-xs text-muted-foreground">{(item.file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    <select
                      value={item.documentType}
                      onChange={(event) => updateFile(item.id, { documentType: event.target.value as DeliveryDocumentType })}
                      className="h-9 w-full rounded-md border bg-white px-3 text-sm"
                    >
                      {Object.entries(deliveryDocumentTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                    <Textarea value={item.notes} onChange={(event) => updateFile(item.id, { notes: event.target.value })} placeholder="Belge açıklaması (isteğe bağlı)" className="min-h-16 bg-white" />
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(item.id)} title="Belgeyi kaldır">
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            Dosyalar özel karantina alanına yüklenir. Temiz tarama sonucu alınmayan yeni belgeler müşteriye gösterilmez.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>İptal</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? "Belgeler kontrol ediliyor..." : "Teslimatı Tamamla"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
