import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, RadioTower, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { uetdsService, type UetdsDashboardRow, type UetdsSettings } from "@/services/uetdsService";

const statusLabel: Record<string, string> = {
  incomplete: "Bilgi Eksik",
  ready: "Gönderime Hazır",
  queued: "Kuyrukta",
  sending: "Gönderiliyor",
  accepted: "Bakanlık Kabul Etti",
  partial_error: "Kısmi Hata",
  error: "Gönderim Hatası",
  update_pending: "Güncelleme Bekliyor",
  cancel_pending: "İptal Bildirimi Bekliyor",
  cancelled: "İptal Edildi",
  carrier_reported: "Taşıyıcı Bildirdi",
};

export function UetdsPanel({ onChanged }: { onChanged?: () => void }) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<UetdsSettings | null>(null);
  const [rows, setRows] = useState<UetdsDashboardRow[]>([]);
  const [references, setReferences] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const [nextSettings, nextRows] = await Promise.all([
        uetdsService.getSettings(),
        uetdsService.getDashboard(),
      ]);
      setSettings(nextSettings);
      setRows(nextRows);
    } catch (error: any) {
      toast({ title: "U-ETDS bilgileri alınamadı", description: error?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const recordReference = async (row: UetdsDashboardRow) => {
    const reference = references[row.shipment_id]?.trim();
    if (!reference || reference.length < 3) {
      toast({ title: "Referans gerekli", description: "Taşıyıcının U-ETDS bildirim referansını girin.", variant: "destructive" });
      return;
    }
    try {
      setBusyId(row.shipment_id);
      await uetdsService.recordCarrierReference(row.shipment_id, reference);
      toast({ title: "Referans kaydedildi", description: `${row.shipment_code} U-ETDS kaydı doğrulama geçmişine eklendi.` });
      await load();
      onChanged?.();
    } catch (error: any) {
      toast({ title: "Referans kaydedilemedi", description: error?.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const queueSubmission = async (row: UetdsDashboardRow) => {
    try {
      setBusyId(row.shipment_id);
      await uetdsService.prepareSubmission(row.shipment_id);
      toast({ title: "Gönderim kuyruğa alındı", description: `${row.shipment_code} U-ETDS V2 kuyruğuna eklendi.` });
      await load();
      onChanged?.();
    } catch (error: any) {
      toast({ title: "Kuyruğa alınamadı", description: error?.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-700"><RadioTower className="h-6 w-6" /></div>
            <div>
              <h3 className="text-lg font-semibold">U-ETDS Bildirim Merkezi</h3>
              <p className="mt-1 max-w-3xl text-sm text-slate-600">
                Sevkiyat uygunluğunu kontrol eder, REX veya taşıyıcı tarafından yapılan bildirimin referansını ve değiştirilemez işlem geçmişini saklar.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Yenile
          </Button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div className="rounded-lg border bg-slate-50 p-3"><p className="text-xs text-slate-500">Ortam</p><p className="font-semibold">{settings?.environment === "live" ? "Canlı" : settings?.environment === "test" ? "Test" : "Hazırlık"}</p></div>
          <div className="rounded-lg border bg-slate-50 p-3"><p className="text-xs text-slate-500">Varsayılan bildirim</p><p className="font-semibold">{settings?.reporter_mode === "rex" ? "REX bildirir" : "Taşıyıcı bildirir"}</p></div>
          <div className="rounded-lg border bg-slate-50 p-3"><p className="text-xs text-slate-500">Yetki belgesi</p><p className="font-semibold">{settings?.certificate_type || "-"} · {settings?.certificate_expiry || "-"}</p></div>
          <div className="rounded-lg border bg-slate-50 p-3"><p className="text-xs text-slate-500">Yola çıkış kontrolü</p><p className="font-semibold">{settings?.enforcement_enabled ? "Zorunlu" : "Hazırlık modunda"}</p></div>
        </div>

        {settings?.environment === "disabled" && (
          <div className="mt-4 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Bakanlık test kullanıcısı, sabit çıkış IP’si ve güvenli bağlantı geçidi tanımlanana kadar otomatik gönderim kapalıdır. Taşıyıcı referansı kaydı kullanılabilir.</span>
          </div>
        )}
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50">
              <tr><th className="p-3 text-left">SEVKİYAT</th><th className="p-3 text-left">BİLDİRİM</th><th className="p-3 text-left">UYGUNLUK</th><th className="p-3 text-left">REFERANS / İŞLEM</th></tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.shipment_id} className="border-b align-top">
                  <td className="p-3"><p className="font-semibold">{row.shipment_code}</p><p className="text-xs text-slate-500">{row.planned_departure_at ? new Date(row.planned_departure_at).toLocaleString("tr-TR") : "Hareket zamanı girilmedi"}</p></td>
                  <td className="p-3"><p>{row.reporter_mode === "rex" ? "REX" : "Taşıyıcı"}</p><span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-1 text-xs">{statusLabel[row.journey_status] || row.journey_status}</span>{row.last_error && <p className="mt-1 text-xs text-red-700">{row.last_error}</p>}</td>
                  <td className="p-3">
                    {row.ready ? <span className="inline-flex items-center gap-1 text-green-700"><CheckCircle2 className="h-4 w-4" /> Hazır</span> : <div><span className="inline-flex items-center gap-1 text-amber-700"><Clock3 className="h-4 w-4" /> Eksik</span><p className="mt-1 max-w-md text-xs text-slate-500">{row.missing_fields?.join(" · ")}</p></div>}
                  </td>
                  <td className="p-3">
                    {row.reference_number ? <p className="font-mono text-xs text-green-700">{row.reference_number}</p> : row.reporter_mode === "carrier" ? (
                      <div className="flex min-w-[300px] gap-2"><Input value={references[row.shipment_id] || ""} onChange={(event) => setReferences((current) => ({ ...current, [row.shipment_id]: event.target.value }))} placeholder="Taşıyıcı U-ETDS referansı" /><Button size="sm" onClick={() => void recordReference(row)} disabled={busyId === row.shipment_id}>Kaydet</Button></div>
                    ) : (
                      <Button size="sm" onClick={() => void queueSubmission(row)} disabled={!row.ready || settings?.environment === "disabled" || busyId === row.shipment_id}>Gönderim Kuyruğuna Al</Button>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && rows.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-500">U-ETDS kapsamına alınacak sevkiyat bulunmuyor.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
