import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight, BarChart3, Boxes, Building2, CheckCircle2, CircleDollarSign,
  FileSpreadsheet, FolderKanban, Landmark, Loader2, PackageCheck, Receipt,
  RefreshCw, ShoppingCart, TriangleAlert, Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PurchaseInvoiceInbox } from "@/components/PurchaseInvoiceInbox";
import { useToast } from "@/hooks/use-toast";
import { downloadExcel } from "@/lib/excel";
import { hasPermission, type PermissionMap } from "@/lib/staff-permissions";
import { kolaybiOfficeService, type KolayBiOfficeData } from "@/services/kolaybiOfficeService";

const EMPTY_DATA: KolayBiOfficeData = {
  salesInvoices: [], purchaseInvoices: [], expenses: [], products: [], customers: [],
  financialAccounts: [], transactions: [], projects: [], shipments: [], providerRecords: [], syncRuns: [],
};

const money = (value: unknown, currency = "TRY") =>
  `${Number(value || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${String(currency || "TRY").toUpperCase()}`;

const date = (value: unknown) => {
  if (!value) return "-";
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleDateString("tr-TR");
};

const statusClass = (status: string) => {
  const value = status.toLowerCase();
  if (["official", "matched", "completed", "ödendi", "tamamlandı", "faturalandi"].some((item) => value.includes(item))) return "border-green-200 bg-green-50 text-green-700";
  if (["failed", "error", "iptal", "gecik"].some((item) => value.includes(item))) return "border-red-200 bg-red-50 text-red-700";
  if (["review", "bek", "partial", "taslak"].some((item) => value.includes(item))) return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-blue-200 bg-blue-50 text-blue-700";
};

function EmptyRow({ columns, text = "Henüz kayıt bulunmuyor." }: { columns: number; text?: string }) {
  return <TableRow><TableCell colSpan={columns} className="py-10 text-center text-slate-500">{text}</TableCell></TableRow>;
}

function StatCard({ title, value, description, icon: Icon, tone = "blue" }: { title: string; value: string; description: string; icon: React.ElementType; tone?: "blue" | "orange" | "green" | "purple" }) {
  const tones = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    orange: "border-orange-200 bg-orange-50 text-orange-700",
    green: "border-green-200 bg-green-50 text-green-700",
    purple: "border-purple-200 bg-purple-50 text-purple-700",
  };
  return (
    <Card className={`border ${tones[tone]}`}>
      <CardContent className="flex items-start justify-between p-5">
        <div><p className="text-sm font-medium">{title}</p><p className="mt-2 text-2xl font-bold text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-600">{description}</p></div>
        <Icon className="h-6 w-6" />
      </CardContent>
    </Card>
  );
}

export function KolayBiOfficeModule({ permissions }: { permissions: PermissionMap }) {
  const { toast } = useToast();
  const [data, setData] = useState<KolayBiOfficeData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connection, setConnection] = useState<{ success: boolean; environment?: string; companies?: any[] } | null>(null);
  const canManageSync = hasPermission(permissions, "integrations.connections", "manage");
  const canViewMonitoring = hasPermission(permissions, "integrations.monitoring");
  const canViewSales = hasPermission(permissions, "accounting.sales");
  const canViewPurchase = hasPermission(permissions, "accounting.purchase");
  const canViewAccounts = hasPermission(permissions, "accounting.accounts");
  const canViewExpenses = hasPermission(permissions, "accounting.expenses");

  const load = async () => {
    setLoading(true);
    try {
      const result = await kolaybiOfficeService.getData();
      setData(result);
    } catch (error: any) {
      toast({ title: "Entegre ofis yüklenemedi", description: error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const checkConnection = async () => {
    try {
      const result = await kolaybiOfficeService.health();
      setConnection(result);
      toast({ title: "KolayBi bağlantısı hazır", description: `${result.companies?.length || 0} şirket erişilebilir.` });
    } catch (error: any) {
      setConnection({ success: false });
      toast({ title: "KolayBi bağlantısı doğrulanamadı", description: error.message, variant: "destructive" });
    }
  };

  const synchronize = async (resource = "all") => {
    setSyncing(true);
    try {
      const result = await kolaybiOfficeService.synchronize(resource);
      await load();
      toast({
        title: result.success ? "Senkronizasyon tamamlandı" : "Senkronizasyon kısmen tamamlandı",
        description: `${result.run?.received_count || 0} kayıt alındı, ${result.run?.matched_count || 0} kayıt otomatik eşleşti.`,
      });
    } catch (error: any) {
      toast({ title: "Senkronizasyon tamamlanamadı", description: error.message, variant: "destructive" });
    } finally { setSyncing(false); }
  };

  const totals = useMemo(() => {
    const sales = data.salesInvoices.reduce((sum, row) => sum + Number(row.grand_total || row.total || 0), 0);
    const purchases = data.purchaseInvoices.reduce((sum, row) => sum + Number(row.grand_total || row.total || 0), 0);
    const expenses = data.expenses.reduce((sum, row) => sum + Number(row.total || row.amount || 0), 0);
    const cash = data.financialAccounts.reduce((sum, row) => sum + Number(row.balance || 0), 0);
    const delivered = data.shipments.filter((row) => ["teslim_edildi", "teslim edildi", "faturalandi"].includes(String(row.status || "").toLowerCase())).length;
    const waitingInvoice = data.shipments.filter((row) => ["beklemede", "fatura_taslagi", "kolaybi_bekliyor", "fatura_hatasi"].includes(String(row.invoice_status || "").toLowerCase())).length;
    return { sales, purchases, expenses, cash, delivered, waitingInvoice };
  }, [data]);

  const recordsByType = (type: string) => data.providerRecords.filter((row) => row.resource_type === type);
  const mappingCount = data.providerRecords.filter((row) => row.match_status === "matched").length;
  const reviewCount = data.providerRecords.filter((row) => row.match_status === "review_required").length;

  const exportRows = async (name: string, rows: Record<string, unknown>[]) => {
    try { await downloadExcel(name, rows, "REX TYS"); }
    catch (error: any) { toast({ title: "Excel raporu oluşturulamadı", description: error.message, variant: "destructive" }); }
  };

  if (loading) return <div className="flex min-h-64 items-center justify-center gap-3 text-slate-600"><Loader2 className="h-5 w-5 animate-spin" /> Entegre ofis hazırlanıyor...</div>;

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-[#173f73] via-[#244f84] to-[#e66d22] p-6 text-white shadow-sm">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <Badge className="mb-3 border-white/25 bg-white/15 text-white hover:bg-white/15">REX TYS + KolayBi</Badge>
            <h2 className="text-2xl font-bold">KolayBi Entegre Ofis</h2>
            <p className="mt-2 max-w-3xl text-sm text-blue-50">Satıştan sevkiyata, alış faturası eşleştirmesinden tahsilat ve kârlılığa kadar tek iş akışı. Operasyon kaydı REX TYS’de, resmî muhasebe belgesi KolayBi’de yönetilir.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canViewMonitoring && <Button variant="secondary" onClick={() => void checkConnection()}><CheckCircle2 className="mr-2 h-4 w-4" />Bağlantıyı Kontrol Et</Button>}
            {canManageSync && <Button className="bg-white text-[#173f73] hover:bg-blue-50" disabled={syncing} onClick={() => void synchronize("all")}>{syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}Tümünü Senkronize Et</Button>}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-xs">
          <span className="rounded-full bg-white/15 px-3 py-1">Ortam: {connection?.environment === "live" ? "Canlı" : connection?.environment === "test" ? "Test" : "Kontrol bekliyor"}</span>
          <span className="rounded-full bg-white/15 px-3 py-1">Eşleşen: {mappingCount}</span>
          <span className="rounded-full bg-white/15 px-3 py-1">Kontrol gereken: {reviewCount}</span>
          <span className="rounded-full bg-white/15 px-3 py-1">Son çalışma: {data.syncRuns[0] ? date(data.syncRuns[0].started_at) : "Henüz yok"}</span>
        </div>
      </div>

      <Tabs defaultValue="home" className="w-full">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-slate-100 p-1">
          <TabsTrigger value="home">Anasayfa</TabsTrigger>
          {canViewSales && <TabsTrigger value="sales">Satış Yönetimi</TabsTrigger>}
          {canViewPurchase && <TabsTrigger value="purchase">Satın Alma</TabsTrigger>}
          {canViewExpenses && <TabsTrigger value="expenses">Genel Gider</TabsTrigger>}
          {(canViewSales || canViewPurchase) && <TabsTrigger value="products">Ürünler ve Hizmetler</TabsTrigger>}
          {canViewAccounts && <TabsTrigger value="associates">Cari Hesaplar</TabsTrigger>}
          {canViewAccounts && <TabsTrigger value="finance">Finans</TabsTrigger>}
          {canViewAccounts && <TabsTrigger value="projects">Projeler</TabsTrigger>}
          <TabsTrigger value="reports">Raporlar</TabsTrigger>
        </TabsList>

        <TabsContent value="home" className="mt-5 space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Satış Faturaları" value={money(totals.sales)} description={`${data.salesInvoices.length} belge`} icon={Receipt} tone="green" />
            <StatCard title="Alış ve Giderler" value={money(totals.purchases + totals.expenses)} description="Tedarikçi faturaları ve genel gider" icon={ShoppingCart} tone="orange" />
            <StatCard title="Finansal Bakiye" value={money(totals.cash)} description={`${data.financialAccounts.length} kasa/banka hesabı`} icon={Landmark} tone="blue" />
            <StatCard title="Faturaya Hazır Sevkiyat" value={String(totals.waitingInvoice)} description={`${totals.delivered} teslim edilmiş sevkiyat`} icon={PackageCheck} tone="purple" />
          </div>
          <Card>
            <CardHeader><CardTitle>Satış – Operasyon – Muhasebe Akışı</CardTitle><CardDescription>Bir işin tekliften resmî faturaya kadar ilerleyişi</CardDescription></CardHeader>
            <CardContent className="grid gap-3 lg:grid-cols-7 lg:items-center">
              {[
                ["1", "Teklif / İş", "Satış"], ["2", "Onay", "Satış"], ["3", "Sevkiyat", "Operasyon"],
                ["4", "Teslim Evrakı", "Operasyon"], ["5", "Fatura Taslağı", "Muhasebe"], ["6", "KolayBi e-Belge", "Muhasebe"], ["7", "Tahsilat / Kârlılık", "Finans"],
              ].map(([step, title, owner], index) => (
                <div key={step} className="relative rounded-xl border bg-white p-4">
                  <div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#173f73] text-xs font-bold text-white">{step}</span><span className="font-semibold">{title}</span></div>
                  <p className="mt-2 text-xs text-slate-500">{owner}</p>
                  {index < 6 && <ArrowRight className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-orange-500 lg:block" />}
                </div>
              ))}
            </CardContent>
          </Card>
          {reviewCount > 0 && <Card className="border-amber-200 bg-amber-50"><CardContent className="flex items-center gap-3 p-4"><TriangleAlert className="h-5 w-5 text-amber-600" /><div><p className="font-semibold text-amber-900">{reviewCount} kayıt eşleştirme kontrolü bekliyor</p><p className="text-sm text-amber-800">Yanlış cari veya ürün seçilmemesi için bilinmeyen KolayBi kayıtları otomatik oluşturulmadı.</p></div></CardContent></Card>}
        </TabsContent>

        <TabsContent value="sales" className="mt-5 space-y-4">
          <div className="flex items-center justify-between"><div><h3 className="text-xl font-bold">Satış Yönetimi</h3><p className="text-sm text-slate-500">Teslim edilen sevkiyattan KolayBi e-fatura/e-arşiv ve tahsilat takibine</p></div>{canManageSync && <Button variant="outline" disabled={syncing} onClick={() => void synchronize("sales_invoices")}><RefreshCw className="mr-2 h-4 w-4" />Satışları Yenile</Button>}</div>
          <Card><Table><TableHeader><TableRow><TableHead>Fatura No</TableHead><TableHead>Tarih</TableHead><TableHead>Belge</TableHead><TableHead>KolayBi Durumu</TableHead><TableHead>Ödeme</TableHead><TableHead className="text-right">Tutar</TableHead></TableRow></TableHeader><TableBody>
            {data.salesInvoices.length === 0 ? <EmptyRow columns={6} /> : data.salesInvoices.map((row) => <TableRow key={row.id}><TableCell className="font-mono">{row.invoice_no}</TableCell><TableCell>{date(row.invoice_date || row.created_at)}</TableCell><TableCell>{row.document_type === "e_invoice" ? "E-Fatura" : "E-Arşiv"}</TableCell><TableCell><Badge variant="outline" className={statusClass(row.integration_status || "draft")}>{row.integration_status || "Taslak"}</Badge></TableCell><TableCell>{row.payment_status || "Bekliyor"}</TableCell><TableCell className="text-right font-semibold">{money(row.grand_total, row.currency)}</TableCell></TableRow>)}
          </TableBody></Table></Card>
        </TabsContent>

        <TabsContent value="purchase" className="mt-5 space-y-4">
          <div><h3 className="text-xl font-bold">Satın Alma Yönetimi</h3><p className="text-sm text-slate-500">KolayBi gelen e-faturaları sevkiyat, tedarikçi ve ruhsat sahibi ayrımından bağımsız olarak doğru işe eşleştirin.</p></div>
          <PurchaseInvoiceInbox />
        </TabsContent>

        <TabsContent value="expenses" className="mt-5 space-y-4">
          <div><h3 className="text-xl font-bold">Genel Gider Yönetimi</h3><p className="text-sm text-slate-500">Kira, yakıt, ofis, bakım ve diğer operasyon dışı giderler</p></div>
          <Card><Table><TableHeader><TableRow><TableHead>Gider No</TableHead><TableHead>Tarih</TableHead><TableHead>Kategori</TableHead><TableHead>Açıklama</TableHead><TableHead>Durum</TableHead><TableHead className="text-right">Tutar</TableHead></TableRow></TableHeader><TableBody>
            {data.expenses.length === 0 ? <EmptyRow columns={6} /> : data.expenses.map((row) => <TableRow key={row.id}><TableCell className="font-mono">{row.expense_no}</TableCell><TableCell>{date(row.expense_date)}</TableCell><TableCell>{row.category}</TableCell><TableCell>{row.description}</TableCell><TableCell><Badge variant="outline" className={statusClass(row.status || "Bekliyor")}>{row.status || "Bekliyor"}</Badge></TableCell><TableCell className="text-right font-semibold">{money(row.total || row.amount)}</TableCell></TableRow>)}
          </TableBody></Table></Card>
        </TabsContent>

        <TabsContent value="products" className="mt-5 space-y-4">
          <div className="flex items-center justify-between"><div><h3 className="text-xl font-bold">Ürünler ve Hizmetler</h3><p className="text-sm text-slate-500">Taşıma hizmeti kodları, KDV oranları, fiyatlar ve KolayBi eşleşmeleri</p></div>{canManageSync && <Button variant="outline" disabled={syncing} onClick={() => void synchronize("products")}><RefreshCw className="mr-2 h-4 w-4" />Ürünleri Yenile</Button>}</div>
          <Card><Table><TableHeader><TableRow><TableHead>Kod</TableHead><TableHead>Ad</TableHead><TableHead>Tip</TableHead><TableHead>KDV</TableHead><TableHead>KolayBi</TableHead><TableHead className="text-right">Satış Fiyatı</TableHead></TableRow></TableHeader><TableBody>
            {data.products.length === 0 ? <EmptyRow columns={6} /> : data.products.map((row) => { const mapped = recordsByType("product").find((record) => record.local_entity_id === row.id); return <TableRow key={row.id}><TableCell className="font-mono">{row.code}</TableCell><TableCell>{row.name}</TableCell><TableCell>{row.type}</TableCell><TableCell>%{row.tax_rate ?? 20}</TableCell><TableCell><Badge variant="outline" className={statusClass(mapped?.match_status || "review")}>{mapped ? "Eşleşti" : "Kontrol Gerekli"}</Badge></TableCell><TableCell className="text-right">{money(row.sale_price)}</TableCell></TableRow>; })}
          </TableBody></Table></Card>
        </TabsContent>

        <TabsContent value="associates" className="mt-5 space-y-4">
          <div className="flex items-center justify-between"><div><h3 className="text-xl font-bold">Cari Hesaplar</h3><p className="text-sm text-slate-500">Müşteri, tedarikçi, personel ve ortak carilerinin VKN/TCKN ve adres eşleşmesi</p></div>{canManageSync && <Button variant="outline" disabled={syncing} onClick={() => void synchronize("associates")}><RefreshCw className="mr-2 h-4 w-4" />Carileri Yenile</Button>}</div>
          <Card><Table><TableHeader><TableRow><TableHead>Ünvan</TableHead><TableHead>Tip</TableHead><TableHead>VKN/TCKN</TableHead><TableHead>E-posta</TableHead><TableHead>KolayBi</TableHead></TableRow></TableHeader><TableBody>
            {data.customers.length === 0 ? <EmptyRow columns={5} /> : data.customers.map((row) => { const mapped = recordsByType("associate").find((record) => record.local_entity_id === row.id); return <TableRow key={row.id}><TableCell className="font-medium">{row.company || row.name}</TableCell><TableCell>{row.account_type || "musteri"}</TableCell><TableCell>{row.vergi_no || row.tc_no || "-"}</TableCell><TableCell>{row.email || "-"}</TableCell><TableCell><Badge variant="outline" className={statusClass(mapped?.match_status || "review")}>{mapped ? `Eşleşti #${mapped.external_id}` : "Kontrol Gerekli"}</Badge></TableCell></TableRow>; })}
          </TableBody></Table></Card>
        </TabsContent>

        <TabsContent value="finance" className="mt-5 space-y-5">
          <div><h3 className="text-xl font-bold">Finans</h3><p className="text-sm text-slate-500">Banka, kasa, kredi kartı, tahsilat, ödeme ve virman görünümü</p></div>
          <div className="grid gap-4 md:grid-cols-3">{data.financialAccounts.slice(0, 6).map((row) => <Card key={row.id}><CardContent className="p-5"><div className="flex items-center justify-between"><Landmark className="h-5 w-5 text-blue-700" /><Badge variant="outline">{row.currency}</Badge></div><p className="mt-3 font-semibold">{row.account_name}</p><p className="mt-2 text-2xl font-bold">{money(row.balance, row.currency)}</p><p className="mt-1 text-xs text-slate-500">{row.bank_name || row.account_type}</p></CardContent></Card>)}</div>
          <Card><Table><TableHeader><TableRow><TableHead>Tarih</TableHead><TableHead>İşlem No</TableHead><TableHead>Tür</TableHead><TableHead>Açıklama</TableHead><TableHead className="text-right">Tutar</TableHead></TableRow></TableHeader><TableBody>
            {data.transactions.length === 0 ? <EmptyRow columns={5} /> : data.transactions.slice(0, 100).map((row) => <TableRow key={row.id}><TableCell>{date(row.transaction_date)}</TableCell><TableCell className="font-mono">{row.transaction_no}</TableCell><TableCell>{row.type}</TableCell><TableCell>{row.description}</TableCell><TableCell className="text-right font-semibold">{money(row.amount)}</TableCell></TableRow>)}
          </TableBody></Table></Card>
        </TabsContent>

        <TabsContent value="projects" className="mt-5 space-y-4">
          <div><h3 className="text-xl font-bold">Projeler</h3><p className="text-sm text-slate-500">Müşteri veya taşıma projesi bazında bütçe, maliyet ve sonuç</p></div>
          <Card><Table><TableHeader><TableRow><TableHead>Kod</TableHead><TableHead>Proje</TableHead><TableHead>Durum</TableHead><TableHead>Başlangıç</TableHead><TableHead className="text-right">Bütçe</TableHead><TableHead className="text-right">Maliyet</TableHead><TableHead className="text-right">Fark</TableHead></TableRow></TableHeader><TableBody>
            {data.projects.length === 0 ? <EmptyRow columns={7} /> : data.projects.map((row) => <TableRow key={row.id}><TableCell className="font-mono">{row.project_code}</TableCell><TableCell>{row.project_name}</TableCell><TableCell><Badge variant="outline" className={statusClass(row.status || "")}>{row.status}</Badge></TableCell><TableCell>{date(row.start_date)}</TableCell><TableCell className="text-right">{money(row.budget)}</TableCell><TableCell className="text-right">{money(row.actual_cost)}</TableCell><TableCell className="text-right font-semibold">{money(Number(row.budget || 0) - Number(row.actual_cost || 0))}</TableCell></TableRow>)}
          </TableBody></Table></Card>
        </TabsContent>

        <TabsContent value="reports" className="mt-5 space-y-5">
          <div><h3 className="text-xl font-bold">Raporlar</h3><p className="text-sm text-slate-500">Satış, alış, gider, finans, proje, cari ve entegrasyon raporlarını XLSX olarak alın.</p></div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              { title: "Satış Faturaları", icon: Receipt, rows: data.salesInvoices.map((r) => ({ "Fatura No": r.invoice_no, Tarih: r.invoice_date, Durum: r.integration_status, Ödeme: r.payment_status, Para: r.currency, Tutar: r.grand_total })) },
              { title: "Alış Faturaları", icon: ShoppingCart, rows: data.purchaseInvoices.map((r) => ({ "Fatura No": r.invoice_no, Tedarikçi: r.issuer_name, Tarih: r.invoice_date, Durum: r.match_status, Para: r.currency, Tutar: r.grand_total })) },
              { title: "Genel Giderler", icon: CircleDollarSign, rows: data.expenses.map((r) => ({ "Gider No": r.expense_no, Tarih: r.expense_date, Kategori: r.category, Açıklama: r.description, Durum: r.status, Tutar: r.total || r.amount })) },
              { title: "Cari Hesaplar", icon: Users, rows: data.customers.map((r) => ({ Ünvan: r.company || r.name, Tip: r.account_type, "VKN/TCKN": r.vergi_no || r.tc_no, Eposta: r.email, Telefon: r.phone })) },
              { title: "Ürün ve Hizmetler", icon: Boxes, rows: data.products.map((r) => ({ Kod: r.code, Ad: r.name, Tip: r.type, KDV: r.tax_rate, "Satış Fiyatı": r.sale_price, Stok: r.stock_quantity })) },
              { title: "Projeler ve Kârlılık", icon: FolderKanban, rows: data.projects.map((r) => ({ Kod: r.project_code, Proje: r.project_name, Durum: r.status, Bütçe: r.budget, Maliyet: r.actual_cost, Fark: Number(r.budget || 0) - Number(r.actual_cost || 0) })) },
              { title: "Finans Hareketleri", icon: Landmark, rows: data.transactions.map((r) => ({ Tarih: r.transaction_date, "İşlem No": r.transaction_no, Tür: r.type, Açıklama: r.description, Tutar: r.amount })) },
              { title: "KolayBi Eşleşmeleri", icon: RefreshCw, rows: data.providerRecords.map((r) => ({ Kaynak: r.resource_type, "KolayBi ID": r.external_id, Ad: r.display_name, Kod: r.external_code, Durum: r.match_status, "Son Görülme": r.last_seen_at })) },
              { title: "Sevkiyat-Fatura Durumu", icon: PackageCheck, rows: data.shipments.map((r) => ({ "Takip No": r.tracking_number, Durum: r.status, "Fatura Durumu": r.invoice_status, "Teslim Tarihi": r.delivery_date, Tutar: r.price })) },
            ].map(({ title, icon: Icon, rows }) => <Card key={title}><CardHeader><div className="flex items-center gap-2"><Icon className="h-5 w-5 text-[#173f73]" /><CardTitle className="text-base">{title}</CardTitle></div><CardDescription>{rows.length} kayıt</CardDescription></CardHeader><CardContent><Button variant="outline" className="w-full" disabled={rows.length === 0} onClick={() => void exportRows(`rex-${title.toLocaleLowerCase("tr-TR").replace(/\s+/g, "-")}`, rows)}><FileSpreadsheet className="mr-2 h-4 w-4" />XLSX İndir</Button></CardContent></Card>)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
