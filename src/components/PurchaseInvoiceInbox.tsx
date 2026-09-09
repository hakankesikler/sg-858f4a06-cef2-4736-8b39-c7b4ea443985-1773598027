import { useCallback, useEffect, useMemo, useState } from "react";
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
  PurchaseInvoiceStats,
  purchaseInvoiceService,
} from "@/services/purchaseInvoiceService";
import { AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown, CheckCircle2, Eye, FileUp, Link2, Loader2, RefreshCw, SearchCheck } from "lucide-react";

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

const paymentLabel: Record<string, string> = {
  paid: "Ödendi",
  partially_paid: "Kısmi Ödendi",
  unpaid: "Ödenmedi",
};

const PAGE_SIZE = 50;
type SortBy = "invoice_date" | "grand_total" | "payment_status";
type SortDirection = "asc" | "desc";

type AllocationState = Record<string, { selected: boolean; amount: string }>;

export function PurchaseInvoiceInbox() {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<IncomingPurchaseInvoice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [stats, setStats] = useState<PurchaseInvoiceStats>({ review_required: 0, approval_pending: 0, unpaid: 0, partially_paid: 0, paid: 0 });
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("review_required");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [sortBy, setSortBy] = useState<SortBy>("invoice_date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [manualOpen, setManualOpen] = useState(false);
  const [matchInvoice, setMatchInvoice] = useState<IncomingPurchaseInvoice | null>(null);
  const [candidates, setCandidates] = useState<PurchaseInvoiceCandidate[]>([]);
  const [allocations, setAllocations] = useState<AllocationState>({});
  const [generalExpense, setGeneralExpense] = useState("0");
  const [checked, setChecked] = useState(false);
  const [matchReason, setMatchReason] = useState("");
  const [issuerReason, setIssuerReason] = useState("");
  const [approvalNote, setApprovalNote] = useState("");
  const [billingSupplierId, setBillingSupplierId] = useState("");
  const [form, setForm] = useState({
    invoiceNo: "", invoiceDate: new Date().toISOString().slice(0, 10), dueDate: "",
    documentType: "e_archive" as "e_invoice" | "e_archive", issuerName: "", issuerTaxId: "",
    currency: "TRY", netTotal: "", vatTotal: "", withholdingTotal: "0", grandTotal: "",
    description: "", operationalSupplierId: "",
  });
  const [file, setFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [invoiceData, supplierData, summary] = await Promise.all([
        purchaseInvoiceService.list({ page, pageSize: PAGE_SIZE, search: debouncedSearch, status, paymentStatus, sortBy, sortDirection }),
        purchaseInvoiceService.suppliers(),
        purchaseInvoiceService.stats(),
      ]);
      setInvoices(invoiceData.items);
      setTotal(invoiceData.total);
      setSuppliers(supplierData);
      setStats(summary);
    } catch (error: any) {
      toast({ title: "Alış faturaları yüklenemedi", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, paymentStatus, sortBy, sortDirection, status, toast]);

  useEffect(() => {
    const timer = window.setTimeout(() => { setPage(0); setDebouncedSearch(search); }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => { void load(); }, [load]);

  const selectedTotal = useMemo(() => Object.values(allocations).reduce((sum, value) =>
    sum + (value.selected ? Number(value.amount || 0) : 0), 0), [allocations]);
  const distributionTotal = selectedTotal + Number(generalExpense || 0);
  const toggleSort = (column: SortBy) => {
    setPage(0);
    if (sortBy === column) setSortDirection((current) => current === "asc" ? "desc" : "asc");
    else {
      setSortBy(column);
      setSortDirection("desc");
    }
  };
  const sortIcon = (column: SortBy) => sortBy !== column
    ? <ArrowUpDown className="ml-1 h-3.5 w-3.5" aria-hidden="true"/>
    : sortDirection === "asc"
      ? <ArrowUp className="ml-1 h-3.5 w-3.5" aria-hidden="true"/>
      : <ArrowDown className="ml-1 h-3.5 w-3.5" aria-hidden="true"/>;
  const matchingBillingSuppliers = useMemo(() => {
    const invoiceTax = (matchInvoice?.issuer_tax_id || "").replace(/\D/g, "");
    return suppliers.filter((supplier) => [supplier.vergi_no, supplier.tc_no]
      .some((value) => String(value || "").replace(/\D/g, "") === invoiceTax));
  }, [matchInvoice?.issuer_tax_id, suppliers]);

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
      setBillingSupplierId(invoice.billing_supplier_id || "");
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
      const details = [
        `${result.imported || 0} yeni alış faturası havuza alındı`,
        `${result.existing || 0} mevcut kayıt güncellendi`,
      ];
      if (result.skipped) details.push(`${result.skipped} kayıt zorunlu tedarikçi bilgisi eksik olduğu için alınamadı`);
      if (result.errors?.length) details.push(`${result.errors.length} kayıt hatası oluştu`);
      toast({
        title: result.skipped || result.errors?.length ? "Gelen faturalar kontrol gerektiriyor" : "Gelen faturalar güncellendi",
        description: `${details.join(" · ")}.`,
        variant: result.errors?.length ? "destructive" : "default",
      });
      await load();
    } catch (error: any) {
      toast({ title: "Gelen faturalar yenilenemedi", description: error.message, variant: "destructive" });
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

  const assignBillingSupplier = async () => {
    if (!matchInvoice || !billingSupplierId) return;
    try {
      setBusy(true);
      await purchaseInvoiceService.setBillingSupplier(matchInvoice.id, billingSupplierId);
      const selected = suppliers.find((supplier) => supplier.id === billingSupplierId);
      setMatchInvoice({
        ...matchInvoice,
        billing_supplier_id: billingSupplierId,
        billing_supplier: selected ? { id: selected.id, name: selected.name, company: selected.company } : null,
      });
      toast({ title: "Fatura carisi eşleştirildi", description: "Borç ve ödeme kaydı bu yasal cari adına oluşturulacak." });
      await load();
    } catch (error: any) {
      toast({ title: "Fatura carisi eşleştirilemedi", description: error.message, variant: "destructive" });
    } finally { setBusy(false); }
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
    <div className="grid gap-3 md:grid-cols-5">
      <Card className="p-4 border-l-4 border-l-blue-500"><div className="text-sm text-slate-500">İncelenecek</div><div className="text-2xl font-bold">{stats.review_required}</div></Card>
      <Card className="p-4 border-l-4 border-l-amber-500"><div className="text-sm text-slate-500">Yönetici Onayı</div><div className="text-2xl font-bold">{stats.approval_pending}</div></Card>
      <Card className="p-4 border-l-4 border-l-orange-500"><div className="text-sm text-slate-500">Ödenmemiş</div><div className="text-2xl font-bold">{stats.unpaid}</div></Card>
      <Card className="p-4 border-l-4 border-l-yellow-500"><div className="text-sm text-slate-500">Kısmi Ödenmiş</div><div className="text-2xl font-bold">{stats.partially_paid}</div></Card>
      <Card className="p-4 border-l-4 border-l-slate-400"><div className="text-sm text-slate-500">Ödenmiş / Geçmiş</div><div className="text-2xl font-bold">{stats.paid}</div></Card>
    </div>

    <Card className="p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div><h2 className="text-xl font-semibold">Gelen Alış Faturaları</h2><p className="text-sm text-slate-500">Gelen e-faturalar ve yüklenen e-arşivler tek kontrol havuzunda.</p></div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void sync()} disabled={busy}><RefreshCw className="mr-2 h-4 w-4"/>Gelenleri Yenile</Button>
          <Button onClick={() => setManualOpen(true)}><FileUp className="mr-2 h-4 w-4"/>E-Arşiv Yükle</Button>
        </div>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-[minmax(0,1fr)_220px_220px]">
        <Input placeholder="Fatura no, unvan veya VKN ile ara" value={search} onChange={(event) => setSearch(event.target.value)} />
        <Select value={paymentStatus} onValueChange={(value) => { setPage(0); setPaymentStatus(value); if (value !== "all") setStatus("all"); }}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">Tüm Ödeme Durumları</SelectItem><SelectItem value="unpaid">Ödenmemiş</SelectItem><SelectItem value="partially_paid">Kısmi Ödenmiş</SelectItem><SelectItem value="paid">Ödenmiş</SelectItem></SelectContent></Select>
        <Select value={status} onValueChange={(value) => { setPage(0); setStatus(value); }}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">Tüm İş Akışları</SelectItem>{Object.entries(statusLabel).map(([value,label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
      </div>
    </Card>

    <Card className="overflow-hidden">
      <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Kaynak</TableHead><TableHead>Fatura</TableHead><TableHead>Düzenleyen</TableHead><TableHead>Fatura Carisi</TableHead><TableHead>Operasyon Taşıyıcısı</TableHead><TableHead><Button type="button" variant="ghost" size="sm" className="-ml-3 h-8 px-3 text-slate-500" onClick={() => toggleSort("invoice_date")} aria-label={`Tarihe göre ${sortBy === "invoice_date" && sortDirection === "desc" ? "artan" : "azalan"} sırala`}>Tarih{sortIcon("invoice_date")}</Button></TableHead><TableHead><Button type="button" variant="ghost" size="sm" className="-ml-3 h-8 px-3 text-slate-500" onClick={() => toggleSort("grand_total")} aria-label={`Tutara göre ${sortBy === "grand_total" && sortDirection === "desc" ? "artan" : "azalan"} sırala`}>Tutar{sortIcon("grand_total")}</Button></TableHead><TableHead><Button type="button" variant="ghost" size="sm" className="-ml-3 h-8 px-3 text-slate-500" onClick={() => toggleSort("payment_status")} aria-label={`Ödeme durumuna göre ${sortBy === "payment_status" && sortDirection === "desc" ? "artan" : "azalan"} sırala`}>Ödeme{sortIcon("payment_status")}</Button></TableHead><TableHead>İş Akışı</TableHead><TableHead className="text-right">İşlem</TableHead></TableRow></TableHeader>
      <TableBody>{loading ? <TableRow><TableCell colSpan={10} className="py-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin"/></TableCell></TableRow> : invoices.length === 0 ? <TableRow><TableCell colSpan={10} className="py-10 text-center text-slate-500">Bu filtreye uygun alış faturası yok.</TableCell></TableRow> : invoices.map((invoice) => <TableRow key={invoice.id}>
        <TableCell><Badge variant="outline">{invoice.source === "kolaybi" ? "Otomatik" : "Manuel"}</Badge></TableCell>
        <TableCell><div className="font-mono font-medium">{invoice.invoice_no}</div><div className="text-xs text-slate-500">{invoice.document_type === "e_invoice" ? "E-Fatura" : "E-Arşiv"}</div></TableCell>
        <TableCell><div className="max-w-56 font-medium">{invoice.issuer_name}</div><div className="text-xs text-slate-500">{invoice.issuer_tax_id}</div></TableCell>
        <TableCell>{invoice.billing_supplier?.company || invoice.billing_supplier?.name || <div><span className="text-amber-700">Cari eşleşmesi bekliyor</span><div className="text-xs text-slate-500">{invoice.issuer_tax_id}</div></div>}</TableCell>
        <TableCell>{invoice.operational_supplier?.company || invoice.operational_supplier?.name || <span className="text-slate-500">Henüz bilinmiyor</span>}</TableCell>
        <TableCell>{new Date(invoice.invoice_date).toLocaleDateString("tr-TR")}</TableCell>
        <TableCell className="font-semibold">{money(invoice.grand_total, invoice.currency)}</TableCell>
        <TableCell><Badge variant="outline" className={invoice.payment_status === "paid" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}>{paymentLabel[invoice.payment_status || ""] || invoice.payment_status || "Bilinmiyor"}</Badge></TableCell>
        <TableCell><Badge variant="outline" className={statusClass(invoice.status)}>{statusLabel[invoice.status] || invoice.status}</Badge></TableCell>
        <TableCell><div className="flex justify-end gap-1">{(invoice.file_path || invoice.official_uuid) && <Button size="sm" variant="ghost" onClick={() => void openDocument(invoice)} title="Belgeyi aç"><Eye className="h-4 w-4"/></Button>}<Button size="sm" variant="outline" onClick={() => void openMatch(invoice)}><SearchCheck className="mr-1 h-4 w-4"/>{["review_required","match_proposed"].includes(invoice.status) ? "Eşleştir" : "İncele"}</Button></div></TableCell>
      </TableRow>)}</TableBody></Table></div>
      <div className="flex items-center justify-between border-t px-4 py-3 text-sm"><span>{total === 0 ? "0 kayıt" : `${page * PAGE_SIZE + 1}-${Math.min((page + 1) * PAGE_SIZE, total)} / ${total} kayıt`}</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={page === 0 || loading} onClick={() => setPage((value) => Math.max(0, value - 1))}>Önceki</Button><Button size="sm" variant="outline" disabled={(page + 1) * PAGE_SIZE >= total || loading} onClick={() => setPage((value) => value + 1)}>Sonraki</Button></div></div>
    </Card>

    <Dialog open={manualOpen} onOpenChange={setManualOpen}><DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Manuel E-Arşiv / Alış Faturası Yükle</DialogTitle></DialogHeader>
      <div className="grid gap-4 md:grid-cols-2">
        <div><Label>Fatura No *</Label><Input value={form.invoiceNo} onChange={(e) => setForm({...form,invoiceNo:e.target.value})}/></div>
        <div><Label>Belge Türü *</Label><Select value={form.documentType} onValueChange={(value:"e_invoice"|"e_archive") => setForm({...form,documentType:value})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="e_archive">E-Arşiv</SelectItem><SelectItem value="e_invoice">E-Fatura</SelectItem></SelectContent></Select></div>
        <div><Label>Fatura Tarihi *</Label><Input type="date" value={form.invoiceDate} onChange={(e) => setForm({...form,invoiceDate:e.target.value})}/></div>
        <div><Label>Vade Tarihi</Label><Input type="date" value={form.dueDate} onChange={(e) => setForm({...form,dueDate:e.target.value})}/></div>
        <div><Label>Faturayı Düzenleyen *</Label><Input value={form.issuerName} onChange={(e) => setForm({...form,issuerName:e.target.value})}/></div>
        <div><Label>VKN / TCKN *</Label><Input inputMode="numeric" value={form.issuerTaxId} onChange={(e) => setForm({...form,issuerTaxId:e.target.value.replace(/\D/g,"").slice(0,11)})}/></div>
        <div className="md:col-span-2"><Label>Operasyon Taşıyıcısı (Opsiyonel)</Label><Select value={form.operationalSupplierId || "none"} onValueChange={(value) => setForm({...form,operationalSupplierId:value === "none" ? "" : value})}><SelectTrigger><SelectValue placeholder="Henüz bilinmiyor"/></SelectTrigger><SelectContent><SelectItem value="none">Henüz bilinmiyor</SelectItem>{suppliers.map((supplier) => <SelectItem key={supplier.id} value={supplier.id}>{supplier.company || supplier.name}</SelectItem>)}</SelectContent></Select><p className="mt-1 text-xs text-slate-500">Fatura carisi VKN/TCKN ile ayrıca belirlenir; operasyon taşıyıcısıyla aynı olmak zorunda değildir.</p></div>
        <div><Label>Net Tutar *</Label><Input type="number" min="0" step="0.01" value={form.netTotal} onChange={(e) => setForm({...form,netTotal:e.target.value})}/></div>
        <div><Label>KDV *</Label><Input type="number" min="0" step="0.01" value={form.vatTotal} onChange={(e) => setForm({...form,vatTotal:e.target.value})}/></div>
        <div><Label>Tevkifat</Label><Input type="number" min="0" step="0.01" value={form.withholdingTotal} onChange={(e) => setForm({...form,withholdingTotal:e.target.value})}/></div>
        <div className="flex gap-2"><div className="flex-1"><Label>Genel Toplam *</Label><Input type="number" min="0" step="0.01" value={form.grandTotal} onChange={(e) => setForm({...form,grandTotal:e.target.value})}/></div><div className="w-28"><Label>Para Birimi</Label><Select value={form.currency} onValueChange={(value) => setForm({...form,currency:value})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{["TRY","USD","EUR","GBP"].map((item)=><SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div></div>
        <div className="md:col-span-2"><Label>Fatura Açıklaması</Label><Textarea value={form.description} onChange={(e) => setForm({...form,description:e.target.value})} placeholder="Varsa plaka, güzergâh, taşıma veya referans bilgisi"/></div>
        <div className="md:col-span-2"><Label>PDF veya XML Belgesi *</Label><Input type="file" accept=".pdf,.xml,application/pdf,application/xml,text/xml" onChange={(e) => setFile(e.target.files?.[0] || null)}/><p className="mt-1 text-xs text-slate-500">En fazla 15 MB. Belge özel alanda saklanır.</p></div>
      </div><DialogFooter><Button variant="outline" onClick={() => setManualOpen(false)}>Vazgeç</Button><Button onClick={() => void submitManual()} disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Havuza Kaydet</Button></DialogFooter></DialogContent>
    </Dialog>

    <Dialog open={Boolean(matchInvoice)} onOpenChange={(open) => !open && setMatchInvoice(null)}><DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto"><DialogHeader><DialogTitle>Fatura ve İş Eşleştirme</DialogTitle></DialogHeader>{matchInvoice && <div className="space-y-5">
      <div className="grid gap-3 rounded-lg border bg-slate-50 p-4 md:grid-cols-5"><div><div className="text-xs text-slate-500">Fatura</div><div className="font-mono font-semibold">{matchInvoice.invoice_no}</div></div><div><div className="text-xs text-slate-500">Düzenleyen</div><div className="font-semibold">{matchInvoice.issuer_name}</div><div className="text-xs">{matchInvoice.issuer_tax_id}</div></div><div><div className="text-xs text-slate-500">Fatura Carisi</div><div className="font-semibold">{matchInvoice.billing_supplier?.company || matchInvoice.billing_supplier?.name || "Eşleşmedi"}</div></div><div><div className="text-xs text-slate-500">Toplam</div><div className="font-semibold">{money(matchInvoice.grand_total,matchInvoice.currency)}</div></div><div><div className="text-xs text-slate-500">Durum</div><Badge variant="outline" className={statusClass(matchInvoice.status)}>{statusLabel[matchInvoice.status]}</Badge></div></div>
      {!matchInvoice.billing_supplier_id && ["review_required","match_proposed","approval_pending","matched"].includes(matchInvoice.status) && <Card className="space-y-3 border-orange-200 bg-orange-50 p-4"><div className="font-semibold text-orange-900">Faturayı düzenleyen cari eşleşmedi</div><p className="text-sm text-orange-800">VKN/TCKN ile otomatik eşleşme bulunamadı. Yalnızca faturadaki VKN/TCKN ile aynı olan cari seçilebilir.</p>{matchingBillingSuppliers.length > 0 ? <div className="flex flex-col gap-2 md:flex-row"><Select value={billingSupplierId || "none"} onValueChange={(value) => setBillingSupplierId(value === "none" ? "" : value)}><SelectTrigger className="flex-1"><SelectValue placeholder="Fatura carisini seçin"/></SelectTrigger><SelectContent><SelectItem value="none">Fatura carisini seçin</SelectItem>{matchingBillingSuppliers.map((supplier) => <SelectItem key={supplier.id} value={supplier.id}>{supplier.company || supplier.name} · {supplier.vergi_no || supplier.tc_no}</SelectItem>)}</SelectContent></Select><Button onClick={() => void assignBillingSupplier()} disabled={busy || !billingSupplierId}>Fatura Carisini Bağla</Button></div> : <div className="rounded-md border border-orange-200 bg-white p-3 text-sm text-orange-900">Bu VKN/TCKN için aktif tedarikçi cari kartı yok. Cari kart açıldığında fatura otomatik bağlanır.</div>}</Card>}
      {["review_required","match_proposed"].includes(matchInvoice.status) ? <>
        <div><h3 className="font-semibold">Sistemin önerdiği işler</h3><p className="text-sm text-slate-500">Bir veya birden fazla işi seçip her işe düşen tutarı yazın.</p></div>
        <div className="space-y-2">{candidates.length === 0 ? <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><AlertTriangle className="mr-2 inline h-4 w-4"/>Uygun aday bulunamadı. Faturanın tamamını genel gider olarak ayırabilir veya sevkiyat bilgilerini kontrol edebilirsiniz.</div> : candidates.map((candidate) => { const state=allocations[candidate.shipment_id] || {selected:false,amount:""}; const variance=Number(state.amount||0)-Number(candidate.expected_cost||0); return <div key={candidate.shipment_id} className={`grid gap-3 rounded-lg border p-3 md:grid-cols-[32px_1fr_130px_120px] ${state.selected ? "border-blue-300 bg-blue-50" : ""}`}><Checkbox checked={state.selected} onCheckedChange={(value) => setAllocations({...allocations,[candidate.shipment_id]:{selected:Boolean(value),amount:state.amount || String(candidate.expected_cost || "")}})}/><div><div className="flex flex-wrap items-center gap-2"><span className="font-mono font-semibold">{candidate.shipment_code}</span><Badge variant="outline">%{candidate.score} uyum</Badge></div><div className="text-sm">{candidate.origin || "-"} → {candidate.destination || "-"}</div><div className="text-xs text-slate-500">{candidate.supplier_name || "Operasyon taşıyıcısı belirtilmemiş"} · {(candidate.reasons || []).join(" · ")}</div></div><div><div className="text-xs text-slate-500">Tahmini maliyet</div><div>{money(Number(candidate.expected_cost||0),candidate.cost_currency||"TRY")}</div>{state.selected && <div className={`text-xs ${variance>0.01?"text-red-600":variance<(-0.01)?"text-emerald-700":"text-slate-500"}`}>Fark: {money(variance,candidate.cost_currency||"TRY")}</div>}</div><div><Label className="text-xs">Gerçekleşen maliyet</Label><Input type="number" min="0" step="0.01" disabled={!state.selected} value={state.amount} onChange={(e) => setAllocations({...allocations,[candidate.shipment_id]:{...state,amount:e.target.value}})}/></div></div>})}</div>
        <div className="grid gap-3 md:grid-cols-2"><div><Label>Sevkiyata ait olmayan genel gider</Label><Input type="number" min="0" step="0.01" value={generalExpense} onChange={(e)=>setGeneralExpense(e.target.value)}/></div><div className={`rounded-lg border p-3 ${Math.abs(distributionTotal-matchInvoice.grand_total)<=0.01 ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}><div className="text-xs text-slate-500">Dağıtım / Fatura Toplamı</div><div className="font-semibold">{money(distributionTotal,matchInvoice.currency)} / {money(matchInvoice.grand_total,matchInvoice.currency)}</div></div></div>
        <div><Label>Eşleştirme Notu</Label><Textarea value={matchReason} onChange={(e)=>setMatchReason(e.target.value)} placeholder="Fatura açıklaması yetersizse kontrolün nasıl yapıldığını yazın."/></div>
        <label className="flex items-start gap-3 rounded-lg border p-3"><Checkbox checked={checked} onCheckedChange={(value)=>setChecked(Boolean(value))}/><span className="text-sm">Fatura carisini, operasyon taşıyıcısını, tutarı ve seçilen işleri kontrol ettim. Eşleştirmenin doğru olduğunu onaylıyorum.</span></label>
      </> : <>
        <div><h3 className="font-semibold">Bağlanan işler</h3>{matchInvoice.allocations?.filter((item)=>item.active).map((item)=>{const expected=Number(item.shipment?.cost||0);const difference=Number(item.amount)-expected;return <div key={item.id} className="mt-2 flex justify-between rounded-lg border p-3"><span className="font-mono">{item.shipment?.shipment_code}</span><div className="text-right"><div className="font-semibold">Gerçekleşen: {money(item.amount,matchInvoice.currency)}</div><div className="text-xs text-slate-500">Tahmini: {money(expected,item.shipment?.cost_currency||matchInvoice.currency)} · Fark: {money(difference,item.shipment?.cost_currency||matchInvoice.currency)}</div></div></div>})}</div>
        {matchInvoice.status === "approval_pending" && <Card className="space-y-3 border-amber-200 bg-amber-50 p-4"><div className="flex items-center gap-2 font-semibold text-amber-900"><AlertTriangle className="h-4 w-4"/>Şirket sahibi onayı gerekiyor</div><p className="text-sm text-amber-800">Operasyon taşıyıcısı ile fatura carisi farklı olabilir; çoklu iş dağıtımı veya maliyet farkı ayrıca kontrol edilmelidir.</p>{matchInvoice.operational_supplier_id && <><Label>Fatura carisi ile operasyon taşıyıcısı ilişkisinin açıklaması</Label><Textarea value={issuerReason} onChange={(e)=>setIssuerReason(e.target.value)} placeholder="Örn. operasyon taşıyıcısının onaylı alt yüklenicisi veya fatura düzenleyicisidir."/><Button variant="outline" onClick={() => void approveIssuer()} disabled={busy}><Link2 className="mr-2 h-4 w-4"/>Taşıyıcı–Fatura Carisi İlişkisini Onayla</Button></>}</Card>}
        {["matched","approval_pending"].includes(matchInvoice.status) && <Card className="space-y-3 border-emerald-200 bg-emerald-50 p-4"><div className="flex items-center gap-2 font-semibold text-emerald-900"><CheckCircle2 className="h-4 w-4"/>Nihai muhasebe onayı</div><Textarea value={approvalNote} onChange={(e)=>setApprovalNote(e.target.value)} placeholder="Onay notu (isteğe bağlı)"/><Button onClick={() => void approveInvoice()} disabled={busy}>Şirket Sahibi Olarak Onayla</Button></Card>}
      </>}
    </div>}<DialogFooter>{matchInvoice && ["review_required","match_proposed"].includes(matchInvoice.status) && <Button onClick={() => void submitMatch()} disabled={busy || !checked || Math.abs(distributionTotal-matchInvoice.grand_total)>0.01}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Kontrol Edildi, Eşleştir</Button>}</DialogFooter></DialogContent></Dialog>
  </div>;
}
