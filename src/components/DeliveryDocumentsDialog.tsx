import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  deliveryDocumentService,
  deliveryDocumentTypeLabels,
  type DeliveryDocument,
  type DeliveryDocumentType,
} from "@/services/deliveryDocumentService";
import { AlertTriangle, CheckCircle2, Eye, FileClock, FilePlus2, Loader2, RefreshCcw, ShieldAlert, Upload } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface DeliveryDocumentsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: { id: string; shipment_code?: string | null } | null;
  readOnly?: boolean;
  onChanged?: () => void;
}

const statusLabels = {
  pending: { label: "Tarama Bekliyor", className: "bg-amber-100 text-amber-800" },
  clean: { label: "Temiz", className: "bg-green-100 text-green-800" },
  infected: { label: "Zararlı Dosya", className: "bg-red-100 text-red-800" },
  error: { label: "Tarama Hatası", className: "bg-red-100 text-red-800" },
  legacy_unscanned: { label: "Eski Belge · Taranmamış", className: "bg-slate-200 text-slate-700" },
} as const;

export function DeliveryDocumentsDialog({ isOpen, onClose, shipment, readOnly = false, onChanged }: DeliveryDocumentsDialogProps) {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<DeliveryDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documentType, setDocumentType] = useState<DeliveryDocumentType>("delivery_proof");
  const [notes, setNotes] = useState("");
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<{ url: string; mimeType: string; name: string } | null>(null);

  const loadDocuments = async () => {
    if (!shipment?.id) return;
    try {
      setLoading(true);
      setDocuments(await deliveryDocumentService.list(shipment.id));
    } catch (error: any) {
      toast({ title: "Belgeler alınamadı", description: error?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && shipment?.id) void loadDocuments();
    if (!isOpen) setPreview(null);
  }, [isOpen, shipment?.id]);

  const groupedDocuments = useMemo(() => {
    const groups = new Map<string, DeliveryDocument[]>();
    documents.forEach((document) => {
      const group = groups.get(document.document_group_id) || [];
      group.push(document);
      groups.set(document.document_group_id, group);
    });
    return Array.from(groups.values()).map((group) => group.sort((a, b) => b.version_number - a.version_number));
  }, [documents]);

  const uploadNewDocuments = async () => {
    if (!shipment?.id || newFiles.length === 0) return;
    try {
      setUploading(true);
      const results = await deliveryDocumentService.uploadMany(
        shipment.id,
        newFiles.map((file) => ({ file, documentType, notes })),
      );
      const waiting = results.filter((item) => item.scanStatus !== "clean").length;
      toast({
        title: `${results.length} belge kaydedildi`,
        description: waiting ? `${waiting} belge güvenli karantinada tarama bekliyor.` : "Belgelerin tamamı temiz sonuçlandı.",
      });
      setNewFiles([]);
      setNotes("");
      await loadDocuments();
      onChanged?.();
    } catch (error: any) {
      toast({ title: "Belge yüklenemedi", description: error?.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const uploadVersion = async (previous: DeliveryDocument, file?: File) => {
    if (!shipment?.id || !file) return;
    try {
      setUploading(true);
      const result = await deliveryDocumentService.upload(shipment.id, {
        file,
        documentType: previous.document_type,
        notes: `Sürüm ${previous.version_number} yerine yüklendi`,
        supersedesDocumentId: previous.id,
      });
      toast({
        title: "Yeni sürüm kaydedildi",
        description: result.scanStatus === "clean" ? "Temiz tarama sonucuyla etkinleştirildi." : "Tarama tamamlanana kadar önceki sürüm etkin kalacak.",
      });
      await loadDocuments();
      onChanged?.();
    } catch (error: any) {
      toast({ title: "Yeni sürüm yüklenemedi", description: error?.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const retryScan = async (document: DeliveryDocument) => {
    try {
      setLoading(true);
      await deliveryDocumentService.retryScan(document.id);
      toast({ title: "Virüs taraması tamamlandı", description: "Belge temiz olarak doğrulandı." });
      await loadDocuments();
      onChanged?.();
    } catch (error: any) {
      toast({ title: "Tarama tamamlanamadı", description: error?.message, variant: "destructive" });
      await loadDocuments();
    } finally {
      setLoading(false);
    }
  };

  const previewDocument = async (document: DeliveryDocument) => {
    try {
      const url = await deliveryDocumentService.preview(document);
      setPreview({ url, mimeType: document.mime_type, name: document.original_file_name });
    } catch (error: any) {
      toast({ title: "Önizleme açılamadı", description: error?.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-[960px]">
        <DialogHeader>
          <DialogTitle>Teslim Belge Paketi</DialogTitle>
          <p className="text-sm text-muted-foreground">Sevkiyat: {shipment?.shipment_code || "-"}</p>
        </DialogHeader>

        {!readOnly && (
          <div className="grid gap-3 rounded-lg border bg-slate-50 p-4 md:grid-cols-[220px_1fr_auto]">
            <div className="space-y-2">
              <Label>Belge Türü</Label>
              <select value={documentType} onChange={(event) => setDocumentType(event.target.value as DeliveryDocumentType)} className="h-10 w-full rounded-md border bg-white px-3 text-sm">
                {Object.entries(deliveryDocumentTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Açıklama</Label>
              <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Tutanak veya belge açıklaması" className="min-h-10 bg-white" />
            </div>
            <div className="flex flex-col justify-end gap-2">
              <Input type="file" multiple accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={(event) => setNewFiles(Array.from(event.target.files || []))} />
              <Button onClick={uploadNewDocuments} disabled={uploading || newFiles.length === 0}>
                {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {newFiles.length ? `${newFiles.length} Belge Yükle` : "Belge Seçin"}
              </Button>
            </div>
          </div>
        )}

        {loading && documents.length === 0 ? (
          <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : groupedDocuments.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">Bu sevkiyat için teslim belgesi bulunmuyor.</div>
        ) : (
          <div className="space-y-4">
            {groupedDocuments.map((versions) => (
              <div key={versions[0].document_group_id} className="overflow-hidden rounded-lg border">
                {versions.map((document, index) => {
                  const scan = statusLabels[document.scan_status];
                  return (
                    <div key={document.id} className={`grid gap-3 border-b p-4 last:border-b-0 md:grid-cols-[1fr_180px_auto] ${index > 0 ? "bg-slate-50" : "bg-white"}`}>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {document.is_active ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <FileClock className="h-4 w-4 text-slate-500" />}
                          <span className="font-medium">{deliveryDocumentTypeLabels[document.document_type]}</span>
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">Sürüm {document.version_number}</span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${scan.className}`}>{scan.label}</span>
                        </div>
                        <p className="mt-1 truncate text-sm">{document.original_file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(document.uploaded_at), "dd MMM yyyy HH:mm", { locale: tr })} · {document.uploaded_by_email || "Sistem"}
                        </p>
                        {document.notes && <p className="mt-2 text-sm text-slate-600">{document.notes}</p>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <p>{document.file_size ? `${(document.file_size / 1024 / 1024).toFixed(2)} MB` : "Boyut bilgisi yok"}</p>
                        <p className="mt-1">{document.mime_type}</p>
                        {!document.is_active && <p className="mt-1">Geçmiş sürüm</p>}
                      </div>
                      <div className="flex flex-wrap items-start justify-end gap-1">
                        {["clean", "legacy_unscanned"].includes(document.scan_status) && (
                          <Button variant="outline" size="sm" onClick={() => void previewDocument(document)}><Eye className="mr-1 h-4 w-4" /> Önizle</Button>
                        )}
                        {!readOnly && ["pending", "error"].includes(document.scan_status) && (
                          <Button variant="outline" size="sm" onClick={() => void retryScan(document)}><RefreshCcw className="mr-1 h-4 w-4" /> Tara</Button>
                        )}
                        {!readOnly && document.is_active && document.scan_status !== "infected" && (
                          <label className="inline-flex h-9 cursor-pointer items-center rounded-md border bg-white px-3 text-xs font-medium hover:bg-slate-50">
                            <FilePlus2 className="mr-1 h-4 w-4" /> Yeni Sürüm
                            <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" className="hidden" onChange={(event) => void uploadVersion(document, event.target.files?.[0])} />
                          </label>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {documents.some((document) => document.scan_status === "infected") && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /> Zararlı olarak belirlenen dosyalar etkinleştirilmez ve önizlemeye kapalı tutulur.
          </div>
        )}
        {documents.some((document) => document.scan_status === "legacy_unscanned") && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> Eski belgeler yeni tarama sistemi kurulmadan önce yüklenmiştir; yeni bir sürüm yükleyerek taratabilirsiniz.
          </div>
        )}

        {preview && (
          <div className="rounded-lg border bg-slate-950 p-3">
            <div className="mb-2 flex items-center justify-between text-sm text-white">
              <span className="truncate">{preview.name}</span>
              <Button variant="secondary" size="sm" onClick={() => setPreview(null)}>Önizlemeyi Kapat</Button>
            </div>
            {preview.mimeType.startsWith("image/") ? (
              <img src={preview.url} alt={preview.name} className="mx-auto max-h-[520px] max-w-full rounded bg-white object-contain" />
            ) : (
              <iframe src={preview.url} title={preview.name} className="h-[520px] w-full rounded bg-white" />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

