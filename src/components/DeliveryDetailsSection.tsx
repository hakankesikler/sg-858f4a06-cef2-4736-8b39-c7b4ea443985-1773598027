import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { deliveryDocumentService } from "@/services/deliveryDocumentService";
import { deliveryDateInput, deliveryTimestamp, deliveryDetailsService, type DeliveryDetails } from "@/services/deliveryDetailsService";

interface Props {
  shipment: DeliveryDetails & { id: string };
  onDocuments: () => void;
  onChanged: () => void;
}

function errorMessage(error: unknown) {
  return error && typeof error === "object" && "message" in error ? String(error.message) : "Lütfen tekrar deneyin.";
}

export function DeliveryDetailsSection({ shipment, onDocuments, onChanged }: Props) {
  const { toast } = useToast();
  const [saved, setSaved] = useState<DeliveryDetails | null>(null);
  const [expected, setExpected] = useState<DeliveryDetails | null>(null);
  const [recipient, setRecipient] = useState("");
  const [date, setDate] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [error, setError] = useState("");
  const current = saved ?? shipment;
  const displayDate = deliveryDateInput(current);

  useEffect(() => {
    let cancelled = false;
    void deliveryDocumentService.permissions().then((value) => {
      if (!cancelled) setCanEdit(value.remove);
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  async function edit() {
    if (busy || !canEdit) return;
    setBusy(true);
    try {
      const latest = await deliveryDetailsService.get(shipment.id);
      setSaved(latest);
      setExpected(latest);
      setRecipient(latest.delivered_to ?? "");
      setDate(deliveryDateInput(latest));
      setError("");
      setOpen(true);
    } catch (err) {
      toast({ title: "Teslimat bilgileri alınamadı", description: errorMessage(err), variant: "destructive" });
    } finally { setBusy(false); }
  }

  async function save() {
    if (busy || !expected || !canEdit) return;
    if (!recipient.trim() || recipient.trim().length > 200 || !date) {
      setError("Teslim alan kişiyi ve geçerli bir teslim tarihi girin.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await deliveryDetailsService.update(shipment.id, recipient, deliveryTimestamp(date, expected), expected);
      setSaved(result);
      setOpen(false);
      toast({ title: "Teslimat bilgileri güncellendi", description: "Değişiklikler sevkiyat geçmişine kaydedildi." });
      onChanged();
    } catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  }

  return <section className="border-t pt-4">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h3 className="font-semibold text-green-600">✅ Teslimat Bilgileri</h3>
      {canEdit && <Button type="button" variant="outline" disabled={busy} onClick={() => void edit()}>Teslimat Bilgilerini Düzenle</Button>}
    </div>
    <div className="grid gap-4 rounded-lg bg-green-50 p-4 md:grid-cols-3">
      <div className="space-y-2"><p className="text-sm font-semibold">Teslim Tarihi</p><p className="rounded-md border bg-white px-3 py-2">{displayDate ? `${displayDate.slice(8, 10)}.${displayDate.slice(5, 7)}.${displayDate.slice(0, 4)} ${displayDate.slice(11)}` : "-"}</p></div>
      <div className="space-y-2"><p className="text-sm font-semibold">Teslim Alan Kişi</p><p className="break-words rounded-md border bg-white px-3 py-2">{current.delivered_to || "-"}</p></div>
      <div className="space-y-2"><p className="text-sm font-semibold">Teslim Evrakı</p><Button type="button" variant="outline" className="h-auto whitespace-normal bg-white text-blue-600" onClick={onDocuments}>Evrakları Görüntüle / Düzenle</Button></div>
    </div>
    <Dialog open={open} onOpenChange={(value) => { if (!busy) setOpen(value); }}>
      <DialogContent className="sm:max-w-lg" onKeyDown={(event) => { if (event.key === "Enter" && event.target instanceof HTMLInputElement) { event.preventDefault(); event.stopPropagation(); void save(); } }}>
        <DialogHeader><DialogTitle>Teslimat Bilgilerini Düzenle</DialogTitle><DialogDescription>Doğru teslim evrağına göre kişi ve tarihi düzeltin. Tarih ve saat Türkiye saatidir. Değişiklikler işlem geçmişine kaydedilir.</DialogDescription></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label htmlFor="correct-delivery-recipient">Teslim Alan Kişi</Label><Input id="correct-delivery-recipient" value={recipient} onChange={(event) => setRecipient(event.target.value)} maxLength={200} disabled={busy} autoComplete="off" required aria-invalid={!!error && !recipient.trim()} /></div>
          <div className="space-y-2"><Label htmlFor="correct-delivery-date">Teslim Tarihi ve Saati</Label><Input id="correct-delivery-date" type="datetime-local" value={date} onChange={(event) => setDate(event.target.value)} disabled={busy} required aria-invalid={!!error && !date} /></div>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        </div>
        <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>Vazgeç</Button><Button type="button" disabled={busy} onClick={() => void save()}>{busy ? "Kaydediliyor..." : "Teslimat Bilgilerini Kaydet"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </section>;
}
