import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  IncomingPurchaseInvoice,
  PurchaseInvoiceCandidate,
  purchaseInvoiceService,
} from "@/services/purchaseInvoiceService";
import { AlertTriangle, CheckCircle2, Eye, FileUp, Link2, Loader2, RefreshCw, SearchCheck } from "lucide-react";

const statusLabel: Record<string, string> = {
  review_required: "İncelenecek",
  match_proposed: "Eşleşme Önerildi",
  approval_pending: "Yönetici Onayı",
  matched: "Eşleştirildi",
  approved: "Onaylandı",
  payment_pending: "Ödeme Bekliyor",
  paid: "Ödendi",
  disputed: "İtirazlı",
  rejected: "Reddedildi",
  duplicate: "Mükerrer",
  cancelled: "İptal Edildi",
};

const statusClass = (status: string) => {
  if (["paid", "approved", "payment_pending", "matched"].includes(status)) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "approval_pending") return "bg-amber-50 text-amber-700 border-amber-200";
  if (["disputed", "rejected", "duplicate"].includes(status)) return "bg-red-50 text-red-700 border-red-200";
  return "bg-blue-50 text-blue-700 border-blue-200";
};

const money = (value: number, currency = "TRY") =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency }).format(Number(value || 0));

type AllocationState = Record<string, { selected: boolean; amount: string }>;

export function PurchaseInvoiceInbox() {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<IncomingPurchaseInvoice[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [manualOpen, setManualOpen] = useState(false);
  const [matchInvoice, setMatchInvoice] = useState<IncomingPurchaseInvoice | null>(null);
  const [candidates, setCandidates] = useState<PurchaseInvoiceCandidate[]>([]);
  const [allocations, setAllocations] = useState<AllocationState>({});
  const [generalExpense, setGeneralExpense] = useState("0");
  const [checked, setChecked] = useState(false);
  const [matchReason, setMatchReason] = useState("");
  const [issuerReason, setIssuerReason] = useState("");
  const [approvalNote, setApprovalNote] = useState("");
  const [form, setForm] = useState({
    invoiceNo: "", invoiceDate: new Date().toISOString().slice(0, 10), dueDate: "",
    documentType: "e_archive" as "e_invoice" | "e_archive", issuerName: "", issuerTaxId: "",
    currency: "TRY", netTotal: "", vatTotal: "", withholdingTotal: "0", grandTotal: "",
    description: "", operationalSupplierId: "",
  });
  const [file, setFile] = useState<File | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const [invoiceData, supplierData] = await Promise.all([purchaseInvoiceService.list(), purchaseInvoiceService.suppliers()]);
      setInvoices(invoiceData);
      setSuppliers(supplierData);
    } catch (error: any) {
      toast({ title: "Alış faturaları yüklenemedi", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => invoices.filter((invoice) => {
    const haystack = `${invoice.invoice_no} ${invoice.issuer_name} ${invoice.issuer_tax_id}`.toLocaleLowerCase("tr-TR");
    return (status === "all" || invoice.status === status) && haystack.includes(search.toLocaleLowerCase("tr-TR"));
  }), [invoices, search, status]);

  const selectedTotal = useMemo(() => Object.values(allocations).reduce((sum, value) =>
    sum + (value.selected ? Number(value.amount || 0) : 0), 0), [allocations]);
  const distributionTotal = selectedTotal + Number(generalExpense || 0);

  const openMatch = async (invoice: IncomingPurchaseInvoice) => {
    try {
      setBusy(true);
      setMatchInvoice(invoice);
      const result = await purchaseInvoiceService.candidates(invoice.id);
      setCandidates(result);
      setAllocations({});
      setGeneralExpense("0");
      setChecked(false);
      setMatchReason("");
    } catch (error: any) {
      setMatchInvoice(null);
      toast({ title: "Aday işler bulunamadı", description: error.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  const submitManual = async () => {
    if (!file) return toast({ title: "Belge zorunlu", description: "PDF veya XML faturayı seçin.", variant: "destructive" });
    try {
      setBusy(true);
      await purchaseInvoiceService.createManual({
        ...form,
        netTotal: Number(form.netTotal), vatTotal: Number(form.vatTotal),
        withholdingTotal: Number(form.withholdingTotal), grandTotal: Number(form.grandTotal), file,
        operationalSupplierId: form.operationalSupplierId || undefined,
      });
      toast({ title: "Fatura havuza alındı", description: "Belge eşleştirme kontrolüne hazır." });
      setManualOpen(false);
      setFile(null);
      setForm({ invoiceNo: "", invoiceDate: new Date().toISOString().slice(0, 10), dueDate: "", documentType: "e_archive", issuerName: "", issuerTaxId: "", currency: "TRY", netTotal: "", vatTotal: "", withholdingTotal: "0", grandTotal: "", description: "", operationalSupplierId: "" });
      await load();
    } catch (error: any) {
      toast({ title: "Fatura kaydedilemedi", description: error.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  const submitMatch = async () => {
    if (!matchInvoice) return;
    const selected = candidates.filter((candidate) => allocations[candidate.shipment_id]?.selected).map((candidate) => ({
      shipmentId: candidate.shipment_id,
      amount: Number(allocations[candidate.shipment_id].amount),
      score: candidate.score,
      reasons: candidate.reasons || [],
    }));
    try {
      setBusy(true);
      const nextStatus = await purchaseInvoiceService.match(matchInvoice.id, selected, Number(generalExpense || 0), checked, matchReason);
      toast({ title: "Eşleştirme kaydedildi", description: nextStatus === "approval_pending" ? "İşlem şirket sahibi onayına gönderildi." : "Fatura iş ile eşleştirildi." });
      setMatchInvoice(null);
      await load();
    } catch (error: any) {
      toast({ title: "Eşleştirme tamamlanamadı", description: error.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  const sync = async () => {
    try {
      setBusy(true);
      const result = await purchaseInvoiceService.syncKolayBi();
      toast({ title: "KolayBi kontrol edildi", description: `${result.imported || 0} yeni alış faturası havuza alındı.` });
      await load();
    } catch (error: any) {
      toast({ title: "KolayBi senkronizasyonu tamamlanamadı", description: error.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  const openDocument = async (invoice: IncomingPurchaseInvoice) => {
    try {
      if (invoice.file_path) window.open(await purchaseInvoiceService.signedDocumentUrl(invoice.file_path), "_blank", "noopener,noreferrer");
      else if (invoice.official_uuid) await purchaseInvoiceService.openKolayBiDocument(invoice.id);
      else throw new Error("Bu faturaya ait görüntülenebilir belge henüz yok.");
    }
    catch (error: any) { toast({ title: "Belge açılamadı", description: error.message, variant: "destructive" }); }
  };

  const approveIssuer = async () => {
    if (!matchInvoice) return;
    try {
      setBusy(true);
      await purchaseInvoiceService.approveIssuer(matchInvoice.id, issuerReason);
      toast({ title: "Fatura düzenleyicisi bağlantısı onaylandı" });
      setIssuerReason("");
      await load();
    } catch (error: any) { toast({ title: "Bağlantı onaylanamadı", description: error.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const approveInvoice = async () => {
    if (!matchInvoice) return;
    try {
      setBusy(true);
      await purchaseInvoiceService.approve(matchInvoice.id, approvalNote);
      toast({ title: "Alış faturası onaylandı", description: "Fatura ödeme bekleyenlere ve iş maliyetine aktarıldı." });
      setMatchInvoice(null);
      await load();
    } catch (error: any) { toast({ title: "Fatura onaylanamadı", description: error.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  return <div className="space-y-5">
    <div className="grid gap-3 md:grid-cols-3">
      <Card className="p-4 border-l-4 border-l-blue-500"><div className="text-sm text-slate-500">İncelenecek</div><div className="text-2xl font-bold">{invoices.filter((item) => item.status === "review_required").length}</div></Card>
      <Card className="p-4 border-l-4 border-l-amber-500"><div className="text-sm text-slate-500">Yönetici Onayı</div><div className="text-2xl font-bold">{invoices.filter((item) => item.status === "approval_pending").length}</div></Card>
      <Card className="p-4 border-l-4 border-l-emerald-500"><div className="text-sm text-slate-500">Ödeme Bekleyen</div><div className="text-2xl font-bold">{invoices.filter((item) => item.status === "payment_pending").length}</div></Card>
    </div>

    <Card className="p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div><h2 className="text-xl font-semibold">Gelen Alış Faturaları</h2><p className="text-sm text-slate-500">KolayBi e-faturaları ve yüklenen e-arşivler tek kontrol havuzunda.</p></div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void sync()} disabled={busy}><RefreshCw className="mr-2 h-4 w-4"/>KolayBi’den Kontrol Et</Button>
          <Button onClick={() => setManualOpen(true)}><FileUp className="mr-2 h-4 w-4"/>E-Arşiv Yükle</Button>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2 md:flex-row">
        <Input placeholder="Fatura no, unvan veya VKN ile ara" value={search} onChange={(event) => setSearch(event.target.value)} />
        <Select value={status} onValueChange={setStatus}><SelectTrigger className="md:w-56"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">Tüm Durumlar</SelectItem>{Object.entries(statusLabel).map(([value,label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
      </div>
    </Card>

    <Card className="overflow-hidden">
      <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Kaynak</TableHead><TableHead>Fatura</TableHead><TableHead>Düzenleyen</TableHead><TableHead>Nakliyeci</TableHead><TableHead>Tarih</TableHead><TableHead>Tutar</TableHead><TableHead>Durum</TableHead><TableHead className="text-right">İşlem</TableHead></TableRow></TableHeader>
      <TableBody>{loading ? <TableRow><TableCell colSpan={8} className="py-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin"/></TableCell></TableRow> : filtered.length === 0 ? <TableRow><TableCell colSpan={8} className="py-10 text-center text-slate-500">Bu filtreye uygun alış faturası yok.</TableCell></TableRow> : filtered.map((invoice) => <TableRow key={invoice.id}>
        <TableCell><Badge variant="outline">{invoice.source === "kolaybi" ? "KolayBi" : "Manuel"}</Badge></TableCell>
        <TableCell><div className="font-mono font-medium">{invoice.invoice_no}</div><div className="text-xs text-slate-500">{invoice.document_type === "e_invoice" ? "E-Fatura" : "E-Arşiv"}</div></TableCell>
        <TableCell><div className="max-w-56 font-medium">{invoice.issuer_name}</div><div className="text-xs text-slate-500">{invoice.issuer_tax_id}</div></TableCell>
        <TableCell>{invoice.supplier?.company || invoice.supplier?.name || <span className="text-amber-700">Henüz seçilmedi</span>}</TableCell>
        <TableCell>{new Date(invoice.invoice_date).toLocaleDateString("tr-TR")}</TableCell>
        <TableCell className="font-semibold">{money(invoice.grand_total, invoice.currency)}</TableCell>
        <TableCell><Badge variant="outline" className={statusClass(invoice.status)}>{statusLabel[invoice.status] || invoice.status}</Badge></TableCell>
        <TableCell><div className="flex justify-end gap-1">{(invoice.file_path || invoice.official_uuid) && <Button size="sm" variant="ghost" onClick={() => void openDocument(invoice)} title="Belgeyi aç"><Eye className="h-4 w-4"/></Button>}<Button size="sm" variant="outline" onClick={() => void openMatch(invoice)}><SearchCheck className="mr-1 h-4 w-4"/>{["review_required","match_proposed"].includes(invoice.status) ? "Eşleştir" : "İncele"}</Button></div></TableCell>
      </TableRow>)}</TableBody></Table></div>
    </Card>

    <Dialog open={manualOpen} onOpenChange={setManualOpen}><DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Manuel E-Arşiv / Alış Faturası Yükle</DialogTitle></DialogHeader>
      <div className="grid gap-4 md:grid-cols-2">
        <div><Label>Fatura No *</Label><Input value={form.invoiceNo} onChange={(e) => setForm({...form,invoiceNo:e.target.value})}/></div>
        <div><Label>Belge Türü *</Label><Select value={form.documentType} onValueChange={(value:"e_invoice"|"e_archive") => setForm({...form,documentType:value})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="e_archive">E-Arşiv</SelectItem><SelectItem value="e_invoice">E-Fatura</SelectItem></SelectContent></Select></div>
        <div><Label>Fatura Tarihi *</Label><Input type="date" value={form.invoiceDate} onChange={(e) => setForm({...form,invoiceDate:e.target.value})}/></div>
        <div><Label>Vade Tarihi</Label><Input type="date" value={form.dueDate} onChange={(e) => setForm({...form,dueDate:e.target.value})}/></div>
        <div><Label>Faturayı Düzenleyen *</Label><Input value={form.issuerName} onChange={(e) => setForm({...form,issuerName:e.target.value})}/></div>
        <div><Label>VKN / TCKN *</Label><Input inputMode="numeric" value={form.issuerTaxId} onChange={(e) => setForm({...form,issuerTaxId:e.target.value.replace(/\D/g,"").slice(0,11)})}/></div>
        <div className="md:col-span-2"><Label>Taşımayı Yapan Nakliyeci</Label><Select value={form.operationalSupplierId || "none"} onValueChange={(value) => setForm({...form,operationalSupplierId:value === "none" ? "" : value})}><SelectTrigger><SelectValue placeholder="Henüz bilinmiyor"/></SelectTrigger><SelectContent><SelectItem value="none">Henüz bilinmiyor</SelectItem>{suppliers.map((supplier) => <SelectItem key={supplier.id} value={supplier.id}>{supplier.company || supplier.name}</SelectItem>)}</SelectContent></Select><p className="mt-1 text-xs text-slate-500">Fatura sahibi ile nakliyeci farklı olabilir; bağlantı yönetici onayına gider.</p></div>
        <div><Label>Net Tutar *</Label><Input type="number" min="0" step="0.01" value={form.netTotal} onChange={(e) => setForm({...form,netTotal:e.target.value})}/></div>
        <div><Label>KDV *</Label><Input type="number" min="0" step="0.01" value={form.vatTotal} onChange={(e) => setForm({...form,vatTotal:e.target.value})}/></div>
        <div><Label>Tevkifat</Label><Input type="number" min="0" step="0.01" value={form.withholdingTotal} onChange={(e) => setForm({...form,withholdingTotal:e.target.value})}/></div>
        <div className="flex gap-2"><div className="flex-1"><Label>Genel Toplam *</Label><Input type="number" min="0" step="0.01" value={form.grandTotal} onChange={(e) => setForm({...form,grandTotal:e.target.value})}/></div><div className="w-28"><Label>Para Birimi</Label><Select value={form.currency} onValueChange={(value) => setForm({...form,currency:value})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{["TRY","USD","EUR","GBP"].map((item)=><SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div></div>
        <div className="md:col-span-2"><Label>Fatura Açıklaması</Label><Textarea value={form.description} onChange={(e) => setForm({...form,description:e.target.value})} placeholder="Varsa plaka, güzergâh, taşıma veya referans bilgisi"/></div>
        <div className="md:col-span-2"><Label>PDF veya XML Belgesi *</Label><Input type="file" accept=".pdf,.xml,application/pdf,application/xml,text/xml" onChange={(e) => setFile(e.target.files?.[0] || null)}/><p className="mt-1 text-xs text-slate-500">En fazla 15 MB. Belge özel alanda saklanır.</p></div>
      </div><DialogFooter><Button variant="outline" onClick={() => setManualOpen(false)}>Vazgeç</Button><Button onClick={() => void submitManual()} disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Havuza Kaydet</Button></DialogFooter></DialogContent>
    </Dialog>

    <Dialog open={Boolean(matchInvoice)} onOpenChange={(open) => !open && setMatchInvoice(null)}><DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto"><DialogHeader><DialogTitle>Fatura ve İş Eşleştirme</DialogTitle></DialogHeader>{matchInvoice && <div className="space-y-5">
      <div className="grid gap-3 rounded-lg border bg-slate-50 p-4 md:grid-cols-4"><div><div className="text-xs text-slate-500">Fatura</div><div className="font-mono font-semibold">{matchInvoice.invoice_no}</div></div><div><div className="text-xs text-slate-500">Düzenleyen</div><div className="font-semibold">{matchInvoice.issuer_name}</div><div className="text-xs">{matchInvoice.issuer_tax_id}</div></div><div><div className="text-xs text-slate-500">Toplam</div><div className="font-semibold">{money(matchInvoice.grand_total,matchInvoice.currency)}</div></div><div><div className="text-xs text-slate-500">Durum</div><Badge variant="outline" className={statusClass(matchInvoice.status)}>{statusLabel[matchInvoice.status]}</Badge></div></div>
      {["review_required","match_proposed"].includes(matchInvoice.status) ? <>
        <div><h3 className="font-semibold">Sistemin önerdiği işler</h3><p className="text-sm text-slate-500">Bir veya birden fazla işi seçip her işe düşen tutarı yazın.</p></div>
        <div className="space-y-2">{candidates.length === 0 ? <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><AlertTriangle className="mr-2 inline h-4 w-4"/>Uygun aday bulunamadı. Faturanın tamamını genel gider olarak ayırabilir veya sevkiyat bilgilerini kontrol edebilirsiniz.</div> : candidates.map((candidate) => { const state=allocations[candidate.shipment_id] || {selected:false,amount:""}; return <div key={candidate.shipment_id} className={`grid gap-3 rounded-lg border p-3 md:grid-cols-[32px_1fr_130px_120px] ${state.selected ? "border-blue-300 bg-blue-50" : ""}`}><Checkbox checked={state.selected} onCheckedChange={(value) => setAllocations({...allocations,[candidate.shipment_id]:{selected:Boolean(value),amount:state.amount || String(candidate.expected_cost || "")}})}/><div><div className="flex flex-wrap items-center gap-2"><span className="font-mono font-semibold">{candidate.shipment_code}</span><Badge variant="outline">%{candidate.score} uyum</Badge></div><div className="text-sm">{candidate.origin || "-"} → {candidate.destination || "-"}</div><div className="text-xs text-slate-500">{candidate.supplier_name || "Nakliyeci belirtilmemiş"} · {(candidate.reasons || []).join(" · ")}</div></div><div><div className="text-xs text-slate-500">Beklenen maliyet</div><div>{money(Number(candidate.expected_cost||0),candidate.cost_currency||"TRY")}</div></div><div><Label className="text-xs">Bu işe ayrılan</Label><Input type="number" min="0" step="0.01" disabled={!state.selected} value={state.amount} onChange={(e) => setAllocations({...allocations,[candidate.shipment_id]:{...state,amount:e.target.value}})}/></div></div>})}</div>
        <div className="grid gap-3 md:grid-cols-2"><div><Label>Sevkiyata ait olmayan genel gider</Label><Input type="number" min="0" step="0.01" value={generalExpense} onChange={(e)=>setGeneralExpense(e.target.value)}/></div><div className={`rounded-lg border p-3 ${Math.abs(distributionTotal-matchInvoice.grand_total)<=0.01 ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}><div className="text-xs text-slate-500">Dağıtım / Fatura Toplamı</div><div className="font-semibold">{money(distributionTotal,matchInvoice.currency)} / {money(matchInvoice.grand_total,matchInvoice.currency)}</div></div></div>
        <div><Label>Eşleştirme Notu</Label><Textarea value={matchReason} onChange={(e)=>setMatchReason(e.target.value)} placeholder="Fatura açıklaması yetersizse kontrolün nasıl yapıldığını yazın."/></div>
        <label className="flex items-start gap-3 rounded-lg border p-3"><Checkbox checked={checked} onCheckedChange={(value)=>setChecked(Boolean(value))}/><span className="text-sm">Faturayı, nakliyeciyi, tutarı ve seçilen işleri kontrol ettim. Eşleştirmenin doğru olduğunu onaylıyorum.</span></label>
      </> : <>
        <div><h3 className="font-semibold">Bağlanan işler</h3>{matchInvoice.allocations?.filter((item)=>item.active).map((item)=><div key={item.id} className="mt-2 flex justify-between rounded-lg border p-3"><span className="font-mono">{item.shipment?.shipment_code}</span><span className="font-semibold">{money(item.amount,matchInvoice.currency)}</span></div>)}</div>
        {matchInvoice.status === "approval_pending" && <Card className="space-y-3 border-amber-200 bg-amber-50 p-4"><div className="flex items-center gap-2 font-semibold text-amber-900"><AlertTriangle className="h-4 w-4"/>Şirket sahibi onayı gerekiyor</div><p className="text-sm text-amber-800">Fatura sahibi/nakliyeci farklılığı, çoklu iş dağıtımı veya maliyet aşımı tespit edildi.</p><Label>Fatura sahibi ile nakliyeci ilişkisinin açıklaması</Label><Textarea value={issuerReason} onChange={(e)=>setIssuerReason(e.target.value)} placeholder="Örn. nakliyecinin onaylı alt yüklenicisi ve faturayı düzenleyen firmadır."/><Button variant="outline" onClick={() => void approveIssuer()} disabled={busy}><Link2 className="mr-2 h-4 w-4"/>Düzenleyici Bağlantısını Onayla</Button></Card>}
        {["matched","approval_pending"].includes(matchInvoice.status) && <Card className="space-y-3 border-emerald-200 bg-emerald-50 p-4"><div className="flex items-center gap-2 font-semibold text-emerald-900"><CheckCircle2 className="h-4 w-4"/>Nihai muhasebe onayı</div><Textarea value={approvalNote} onChange={(e)=>setApprovalNote(e.target.value)} placeholder="Onay notu (isteğe bağlı)"/><Button onClick={() => void approveInvoice()} disabled={busy}>Şirket Sahibi Olarak Onayla</Button></Card>}
      </>}
    </div>}<DialogFooter>{matchInvoice && ["review_required","match_proposed"].includes(matchInvoice.status) && <Button onClick={() => void submitMatch()} disabled={busy || !checked || Math.abs(distributionTotal-matchInvoice.grand_total)>0.01}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Kontrol Edildi, Eşleştir</Button>}</DialogFooter></DialogContent></Dialog>
  </div>;
}
