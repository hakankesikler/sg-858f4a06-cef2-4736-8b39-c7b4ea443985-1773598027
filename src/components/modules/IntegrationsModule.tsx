import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle, CheckCircle2, CloudCog, FileSpreadsheet, Link2, Loader2,
  RefreshCw, ShieldCheck, Upload, XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { downloadCsv } from "@/lib/csv";
import { hasPermission, type PermissionMap } from "@/lib/staff-permissions";
import {
  readShipmentImportFile, shipmentImportTemplate, validateShipmentImportRows,
  type ShipmentImportPreviewRow,
} from "@/lib/shipment-import";
import { crmService, type Customer } from "@/services/crmService";
import {
  integrationService, type IntegrationImportBatch, type IntegrationPartner,
} from "@/services/integrationService";

const statusLabels: Record<string, string> = {
  draft: "Kurulum bekliyor", testing: "Test", active: "Aktif", paused: "Durduruldu", error: "Hata",
  processing: "İşleniyor", completed: "Tamamlandı", partial: "Kısmi", failed: "Başarısız",
};

const statusClass = (status: string) => {
  if (["active", "completed"].includes(status)) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (["testing", "processing"].includes(status)) return "border-blue-200 bg-blue-50 text-blue-700";
  if (["partial", "draft", "paused"].includes(status)) return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-red-200 bg-red-50 text-red-700";
};

const formatDateTime = (value?: string | null) => value
  ? new Date(value).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })
  : "Henüz yok";

export function IntegrationsModule({ permissions }: { permissions: PermissionMap }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [processingFile, setProcessingFile] = useState(false);
  const [importing, setImporting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [partners, setPartners] = useState<IntegrationPartner[]>([]);
  const [batches, setBatches] = useState<IntegrationImportBatch[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileHash, setFileHash] = useState("");
  const [previewRows, setPreviewRows] = useState<ShipmentImportPreviewRow[]>([]);

  const canViewConnections = hasPermission(permissions, "integrations.connections");
  const canViewImports = hasPermission(permissions, "integrations.imports") || hasPermission(permissions, "integrations.monitoring");
  const canImport = hasPermission(permissions, "integrations.imports", "manage")
    && hasPermission(permissions, "operations.shipments", "manage");
  const invalidRows = useMemo(() => previewRows.filter((row) => row.errors.length > 0), [previewRows]);
  const validRows = previewRows.length - invalidRows.length;

  const loadData = async () => {
    setLoading(true);
    try {
      const customerPromise = crmService.getCustomers();
      const partnerPromise = canViewConnections || canViewImports ? integrationService.getPartners() : Promise.resolve([]);
      const batchPromise = canViewImports ? integrationService.getImportBatches() : Promise.resolve([]);
      const [customerData, partnerData, batchData] = await Promise.all([customerPromise, partnerPromise, batchPromise]);
      setCustomers(customerData.filter((customer) => !customer.account_type || customer.account_type === "musteri"));
      setPartners(partnerData);
      setBatches(batchData);
    } catch (error: any) {
      toast({ title: "Entegrasyon bilgileri yüklenemedi", description: error?.message || "Bağlantı hatası", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadData(); }, []);

  const resetPreview = () => {
    setFileName("");
    setFileHash("");
    setPreviewRows([]);
  };

  const handleFile = async (file?: File) => {
    if (!file) return;
    setProcessingFile(true);
    resetPreview();
    try {
      const parsed = await readShipmentImportFile(file);
      const preview = validateShipmentImportRows(parsed.rows);
      setFileName(file.name);
      setFileHash(parsed.hash);
      setPreviewRows(preview);
      toast({
        title: "Dosya kontrol edildi",
        description: `${preview.length} satır okundu; ${preview.filter((row) => row.errors.length === 0).length} satır aktarıma hazır.`,
      });
    } catch (error: any) {
      toast({ title: "Dosya okunamadı", description: error?.message || "Dosya biçimi geçersiz", variant: "destructive" });
    } finally {
      setProcessingFile(false);
    }
  };

  const handleImport = async () => {
    if (!customerId || !fileHash || previewRows.length === 0 || invalidRows.length > 0 || !canImport) return;
    setImporting(true);
    try {
      const result = await integrationService.importCustomerShipments({
        customerId,
        fileName,
        idempotencyKey: `${customerId}:${fileHash}`.slice(0, 128),
        rows: previewRows.map((row) => row.payload),
      });
      toast({
        title: result.already_processed ? "Dosya daha önce işlenmiş" : "Toplu aktarım tamamlandı",
        description: `${result.imported} sevkiyat oluşturuldu, ${result.duplicate} mükerrer, ${result.failed + result.invalid} hatalı.`,
      });
      resetPreview();
      await loadData();
    } catch (error: any) {
      toast({ title: "Aktarım yapılamadı", description: error?.message || "Sevkiyatlar kaydedilemedi", variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#173f73]" /></div>;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-blue-100 bg-gradient-to-r from-[#10213e] via-[#173f73] to-[#22568d] p-6 text-white shadow-lg md:p-8">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e96d25] shadow-lg shadow-orange-950/20"><CloudCog className="h-6 w-6" /></div>
        <h1 className="text-3xl font-bold">Entegrasyon Merkezi</h1>
        <p className="mt-2 max-w-3xl text-blue-100">Müşteri toplu gönderilerini, taşıyıcı bağlantılarını ve muhasebe servislerini tek güvenli alanda izleyin.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-t-4 border-t-[#173f73] p-5"><p className="text-sm text-slate-500">Bağlantılar</p><p className="mt-2 text-3xl font-bold text-[#10213e]">{partners.length}</p><p className="mt-1 text-xs text-slate-500">{partners.filter((item) => item.status === "active").length} aktif</p></Card>
        <Card className="border-t-4 border-t-emerald-500 p-5"><p className="text-sm text-slate-500">Aktarılan Sevkiyat</p><p className="mt-2 text-3xl font-bold text-[#10213e]">{batches.reduce((sum, batch) => sum + batch.imported_rows, 0)}</p><p className="mt-1 text-xs text-emerald-700">Dosya aktarımları toplamı</p></Card>
        <Card className="border-t-4 border-t-amber-500 p-5"><p className="text-sm text-slate-500">Mükerrer Engeli</p><p className="mt-2 text-3xl font-bold text-[#10213e]">{batches.reduce((sum, batch) => sum + batch.duplicate_rows, 0)}</p><p className="mt-1 text-xs text-amber-700">Yinelenen kayıt oluşturulmadı</p></Card>
        <Card className="border-t-4 border-t-red-500 p-5"><p className="text-sm text-slate-500">İnceleme Bekleyen</p><p className="mt-2 text-3xl font-bold text-[#10213e]">{batches.reduce((sum, batch) => sum + batch.failed_rows + batch.invalid_rows, 0)}</p><p className="mt-1 text-xs text-red-700">Hatalı veya eksik satır</p></Card>
      </div>

      <Tabs defaultValue={canImport ? "import" : "history"}>
        <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-xl border bg-white p-1.5">
          <TabsTrigger value="import" disabled={!canViewImports}><FileSpreadsheet className="mr-2 h-4 w-4" />Toplu Sevkiyat</TabsTrigger>
          <TabsTrigger value="connections" disabled={!canViewConnections}><Link2 className="mr-2 h-4 w-4" />Bağlantılar</TabsTrigger>
          <TabsTrigger value="history" disabled={!canViewImports}><RefreshCw className="mr-2 h-4 w-4" />İşlem Geçmişi</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-5">
          {!canImport && <Card className="border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Toplu aktarım için “Toplu sevkiyat” ve “Sevkiyat oluşturma” yetkilerinin ikisi de açık olmalıdır.</Card>}
          <Card className="p-5 md:p-6">
            <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
              <div className="space-y-4">
                <div><h2 className="text-xl font-semibold text-[#10213e]">Müşteri dosyasını hazırlayın</h2><p className="mt-1 text-sm text-slate-500">CSV veya XLSX, en fazla 8 MB ve 1000 sevkiyat.</p></div>
                <div className="space-y-2"><Label>Anlaşmalı müşteri</Label><Select value={customerId} onValueChange={(value) => { setCustomerId(value); resetPreview(); }} disabled={!canImport}><SelectTrigger><SelectValue placeholder="Müşteri seçin" /></SelectTrigger><SelectContent>{customers.map((customer) => <SelectItem key={customer.id} value={customer.id!}>{customer.customer_code ? `${customer.customer_code} — ` : ""}{customer.name}</SelectItem>)}</SelectContent></Select></div>
                <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => downloadCsv("rex-toplu-sevkiyat-sablonu.csv", shipmentImportTemplate)}><FileSpreadsheet className="mr-2 h-4 w-4" />Şablonu İndir</Button><Button onClick={() => document.getElementById("integration-shipment-file")?.click()} disabled={!customerId || !canImport || processingFile}><Upload className="mr-2 h-4 w-4" />{processingFile ? "Kontrol ediliyor..." : "Dosya Seç"}</Button></div>
                <Input id="integration-shipment-file" className="hidden" type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => { void handleFile(event.target.files?.[0]); event.target.value = ""; }} />
                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-slate-700"><ShieldCheck className="mb-2 h-5 w-5 text-[#173f73]" /><strong>Mükerrerlik koruması:</strong> Aynı dosya veya müşteri referansı tekrar gönderildiğinde ikinci sevkiyat açılmaz.</div>
              </div>
              <div className="rounded-2xl border bg-slate-50 p-5">
                <h3 className="font-semibold text-[#10213e]">Dosya önizleme</h3>
                {!previewRows.length ? <div className="flex min-h-44 flex-col items-center justify-center text-center text-slate-400"><FileSpreadsheet className="mb-3 h-10 w-10" /><p>Dosya seçildiğinde satırlar kaydedilmeden önce burada kontrol edilir.</p></div> : <div className="space-y-4">
                  <p className="truncate text-sm font-medium text-slate-700">{fileName}</p>
                  <div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-lg bg-white p-3"><p className="text-2xl font-bold">{previewRows.length}</p><p className="text-xs text-slate-500">Toplam</p></div><div className="rounded-lg bg-emerald-50 p-3"><p className="text-2xl font-bold text-emerald-700">{validRows}</p><p className="text-xs text-emerald-700">Hazır</p></div><div className="rounded-lg bg-red-50 p-3"><p className="text-2xl font-bold text-red-700">{invalidRows.length}</p><p className="text-xs text-red-700">Hatalı</p></div></div>
                  {invalidRows.length > 0 && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"><AlertCircle className="mr-2 inline h-4 w-4" />Hatalı satırlar düzeltilmeden aktarım başlamaz.</div>}
                  <Button className="w-full bg-[#e96d25] hover:bg-[#d95e1d]" disabled={invalidRows.length > 0 || importing || !canImport} onClick={() => void handleImport()}>{importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}{importing ? "Sevkiyatlar aktarılıyor..." : `${validRows} Sevkiyatı Aktar`}</Button>
                </div>}
              </div>
            </div>
          </Card>

          {previewRows.length > 0 && <Card className="overflow-hidden"><Table><TableHeader><TableRow><TableHead>Satır</TableHead><TableHead>Referans</TableHead><TableHead>Gönderici / Alıcı</TableHead><TableHead>Güzergâh</TableHead><TableHead>Yük</TableHead><TableHead>Kontrol</TableHead></TableRow></TableHeader><TableBody>{previewRows.slice(0, 100).map((row) => <TableRow key={row.rowNumber}><TableCell>{row.rowNumber}</TableCell><TableCell className="font-medium">{row.payload.external_order_id || "—"}</TableCell><TableCell>{row.payload.sender_name || "—"}<br /><span className="text-xs text-slate-500">{row.payload.receiver || "—"}</span></TableCell><TableCell>{row.payload.origin || "—"} → {row.payload.destination || "—"}</TableCell><TableCell>{row.payload.quantity ?? "—"} × {row.payload.unit_weight ?? "—"} kg/ds<br /><span className="text-xs text-slate-500">{row.payload.cargo_type || "—"}</span></TableCell><TableCell>{row.errors.length === 0 ? <span className="flex items-center gap-1 text-emerald-700"><CheckCircle2 className="h-4 w-4" />Hazır</span> : <span className="flex items-start gap-1 text-red-700"><XCircle className="mt-0.5 h-4 w-4 shrink-0" />{row.errors.join(", ")}</span>}</TableCell></TableRow>)}</TableBody></Table>{previewRows.length > 100 && <p className="border-t p-3 text-center text-xs text-slate-500">İlk 100 satır gösteriliyor.</p>}</Card>}
        </TabsContent>

        <TabsContent value="connections" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{partners.map((partner) => <Card key={partner.id} className="p-5"><div className="flex items-start justify-between gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#173f73]"><Link2 className="h-5 w-5" /></div><Badge variant="outline" className={statusClass(partner.status)}>{statusLabels[partner.status] || partner.status}</Badge></div><h3 className="mt-4 font-semibold text-[#10213e]">{partner.name}</h3><p className="mt-1 text-sm text-slate-500">{partner.partner_type === "customer" ? "Müşteri" : partner.partner_type === "carrier" ? "Taşıyıcı" : "Muhasebe / Entegratör"} · {partner.channel.toUpperCase()}</p><div className="mt-4 border-t pt-3 text-xs text-slate-500"><p>Ortam: {partner.environment === "live" ? "Canlı" : "Test"}</p><p className="mt-1">Son başarılı işlem: {formatDateTime(partner.last_success_at)}</p>{partner.last_error && <p className="mt-2 text-red-600">{partner.last_error}</p>}</div></Card>)}</div>
          {partners.length === 0 && <Card className="p-10 text-center text-slate-500">Henüz bağlantı kaydı bulunmuyor.</Card>}
        </TabsContent>

        <TabsContent value="history">
          <Card className="overflow-hidden"><Table><TableHeader><TableRow><TableHead>Tarih</TableHead><TableHead>Müşteri</TableHead><TableHead>Dosya</TableHead><TableHead>Durum</TableHead><TableHead>Aktarılan</TableHead><TableHead>Mükerrer</TableHead><TableHead>Hatalı</TableHead></TableRow></TableHeader><TableBody>{batches.map((batch) => <TableRow key={batch.id}><TableCell>{formatDateTime(batch.created_at)}</TableCell><TableCell>{batch.customer?.name || "—"}</TableCell><TableCell className="max-w-56 truncate">{batch.file_name}</TableCell><TableCell><Badge variant="outline" className={statusClass(batch.status)}>{statusLabels[batch.status] || batch.status}</Badge></TableCell><TableCell className="text-emerald-700">{batch.imported_rows}</TableCell><TableCell className="text-amber-700">{batch.duplicate_rows}</TableCell><TableCell className="text-red-700">{batch.invalid_rows + batch.failed_rows}</TableCell></TableRow>)}{batches.length === 0 && <TableRow><TableCell colSpan={7} className="h-32 text-center text-slate-500">Henüz toplu aktarım yapılmadı.</TableCell></TableRow>}</TableBody></Table></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
