import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight, Ban, BarChart3, Boxes, Building2, CheckCircle2, CircleDollarSign,
  Clock3, FileSpreadsheet, Landmark, Loader2, PackageCheck, Receipt,
  RefreshCw, ShoppingCart, TriangleAlert, Link2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PurchaseInvoiceInbox } from "@/components/PurchaseInvoiceInbox";
import { InvoiceConfigurationPanel } from "@/components/InvoiceConfigurationPanel";
import { GeneralExpenseWorkspace } from "@/components/GeneralExpenseWorkspace";
import { FinanceWorkspace } from "@/components/FinanceWorkspace";
import { useToast } from "@/hooks/use-toast";
import { downloadExcel } from "@/lib/excel";
import { hasPermission, type PermissionMap } from "@/lib/staff-permissions";
import { kolaybiOfficeService, type KolayBiOfficeData } from "@/services/kolaybiOfficeService";

const EMPTY_DATA: KolayBiOfficeData = {
  salesInvoices: [], purchaseInvoices: [], expenses: [], products: [], customers: [],
  financialAccounts: [], transactions: [], projects: [], shipments: [], providerRecords: [], syncRuns: [],
  integrationPartners: [], outboundQueue: { pending: 0, review: 0 },
};

const money = (value: unknown, currency = "TRY") =>
  `${Number(value || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${String(currency || "TRY").toUpperCase()}`;

const currencyCode = (value: unknown) => {
  const raw = typeof value === "string" || typeof value === "number"
    ? String(value)
    : value && typeof value === "object"
      ? String((value as any).code || (value as any).key || (value as any).iso_code || (value as any).currency || (value as any).value || "")
      : "";
  const candidate = raw.trim().toUpperCase();
  const direct = candidate.match(/\b(TRY|TL|USD|EUR|GBP)\b/)?.[1];
  return direct === "TL" ? "TRY" : direct || "TRY";
};

const date = (value: unknown) => {
  if (!value) return "-";
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleDateString("tr-TR");
};

const dateTime = (value: unknown) => {
  if (!value) return "Henüz yok";
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? "Henüz yok" : parsed.toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" });
};

const statusClass = (status: string) => {
  const value = status.toLowerCase();
  if (["official", "matched", "completed", "approved", "ödendi", "tamamlandı", "faturalandi"].some((item) => value.includes(item))) return "border-green-200 bg-green-50 text-green-700";
  if (["failed", "error", "rejected", "iptal", "gecik"].some((item) => value.includes(item))) return "border-red-200 bg-red-50 text-red-700";
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
  const [mappingSelections, setMappingSelections] = useState<Record<string, string>>({});
  const [mappingBusy, setMappingBusy] = useState<string | null>(null);
  const canManageSync = hasPermission(permissions, "integrations.connections", "manage");
  const canViewMonitoring = hasPermission(permissions, "integrations.monitoring");
  const canViewSales = hasPermission(permissions, "accounting.sales");
  const canViewPurchase = hasPermission(permissions, "accounting.purchase");
  const canViewAccounts = hasPermission(permissions, "accounting.accounts");
  const canViewExpenses = hasPermission(permissions, "accounting.expenses");
  const canManageExpenses = hasPermission(permissions, "accounting.expenses", "manage");
  const canManageInvoiceSettings = hasPermission(permissions, "accounting.accounts", "manage");

  const load = async () => {
    setLoading(true);
    try {
      const result = await kolaybiOfficeService.getData();
      setData(result);
    } catch (error: any) {
      toast({ title: "Entegre ofis yüklenemedi", description: error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const checkConnection = async (showToast = true) => {
    try {
      const result = await kolaybiOfficeService.health();
      setConnection(result);
      if (showToast) toast({ title: "KolayBi bağlantısı hazır", description: `${result.companies?.length || 0} şirket erişilebilir.` });
    } catch (error: any) {
      setConnection({ success: false });
      if (showToast) toast({ title: "KolayBi bağlantısı doğrulanamadı", description: error.message, variant: "destructive" });
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const synchronize = async (resource = "all") => {
    setSyncing(true);
    try {
      const result = await kolaybiOfficeService.synchronize(resource);
      const outbound = resource === "all" ? await kolaybiOfficeService.synchronizeOutbound(20) : null;
      await load();
      toast({
        title: result.success ? "Senkronizasyon tamamlandı" : "Senkronizasyon kısmen tamamlandı",
        description: `${result.run?.received_count || 0} kayıt alındı, ${result.run?.matched_count || 0} kayıt eşleşti${outbound ? `; ${outbound.succeeded || 0} cari KolayBi'ye aktarıldı` : ""}.`,
      });
    } catch (error: any) {
      toast({ title: "Senkronizasyon tamamlanamadı", description: error.message, variant: "destructive" });
    } finally { setSyncing(false); }
  };

  const resolveMapping = async (record: any, action: "match" | "ignore") => {
    const localEntityId = mappingSelections[record.id];
    if (action === "match" && !localEntityId) {
      toast({ title: "TMS kaydı seçin", description: "Eşleştirme için ilgili cari veya ürün/hizmet kaydını seçmelisiniz.", variant: "destructive" });
      return;
    }
    setMappingBusy(record.id);
    try {
      await kolaybiOfficeService.resolveMapping({ recordId: record.id, action, localEntityId });
      setMappingSelections((current) => { const next = { ...current }; delete next[record.id]; return next; });
      await load();
      toast({
        title: action === "match" ? "Eşleştirme kaydedildi" : "Kayıt yok sayıldı",
        description: `${record.display_name || record.external_code || "KolayBi kaydı"} için karar denetim geçmişine işlendi.`,
      });
    } catch (error: any) {
      toast({ title: "Eşleştirme kaydedilemedi", description: error.message, variant: "destructive" });
    } finally { setMappingBusy(null); }
  };

  const reviewImportedProduct = async (record: any, decision: "approve" | "reject") => {
    setMappingBusy(record.id);
    try {
      await kolaybiOfficeService.reviewImportedProduct({ recordId: record.id, decision });
      await load();
      toast({
        title: decision === "approve" ? "Ürün kullanıma açıldı" : "Ürün pasif bırakıldı",
        description: `${record.display_name || record.external_code || "KolayBi ürünü"} kararı denetim geçmişine işlendi.`,
      });
    } catch (error: any) {
      toast({ title: "Ürün kararı kaydedilemedi", description: error.message, variant: "destructive" });
    } finally { setMappingBusy(null); }
  };

  const reviewRecords = useMemo(
    () => data.providerRecords.filter((row) => ["associate", "product"].includes(row.resource_type)
      && row.match_status === "review_required"
      && !(row.resource_type === "product" && row.local_entity_id)),
    [data.providerRecords],
  );

  const totals = useMemo(() => {
    const sales = data.salesInvoices.reduce((sum, row) => sum + Number(row.grand_total || row.total || 0), 0);
    const purchases = data.purchaseInvoices.reduce((sum, row) => sum + Number(row.grand_total || row.total || 0), 0);
    const expenses = data.expenses.reduce((sum, row) => sum + Number(row.total || row.amount || 0), 0);
    const cash = data.financialAccounts.reduce((sum, row) => sum + Number(row.balance || 0), 0);
    const delivered = data.shipments.filter((row) => ["teslim_edildi", "teslim edildi", "faturalandi"].includes(String(row.status || "").toLowerCase())).length;
    const waitingInvoice = data.shipments.filter((row) => ["beklemede", "fatura_taslagi", "kolaybi_bekliyor", "fatura_hatasi"].includes(String(row.invoice_status || "").toLowerCase())).length;
    return { sales, purchases, expenses, cash, delivered, waitingInvoice };
  }, [data]);

  const accountBalanceRows = useMemo(() => data.providerRecords
    .filter((record) => record.resource_type === "associate")
    .flatMap((record) => {
      let payload = record.payload || {};
      if (typeof payload === "string") {
        try { payload = JSON.parse(payload); } catch { payload = {}; }
      }
      const balances = Array.isArray(payload?.balances) ? payload.balances : [];
      return balances.map((balance: any) => {
        const amount = Number(balance?.balance || 0);
        const currency = currencyCode(balance?.currency || record.currency);
        const parsedTantamount = balance?.tantamount === null || balance?.tantamount === undefined ? Number.NaN : Number(balance.tantamount);
        const companyAmount = Number.isFinite(parsedTantamount)
          ? parsedTantamount
          : currency === "TRY" ? amount : 0;
        return {
          externalId: record.external_id,
          name: record.display_name || [payload?.name, payload?.surname].filter(Boolean).join(" ") || record.external_code || record.external_id,
          code: record.external_code || payload?.code || "-",
          accountType: payload?.associate_type || "cari",
          currency,
          balance: amount,
          companyAmount,
          direction: amount > 0 ? "Tahsil Edilecek" : "Ödenecek",
          lastSeenAt: record.last_seen_at,
        };
      });
    })
    .filter((row) => Math.abs(row.balance) >= 0.01)
    .sort((left, right) => Math.abs(right.companyAmount || right.balance) - Math.abs(left.companyAmount || left.balance)), [data.providerRecords]);

  const balanceSummary = useMemo(() => accountBalanceRows.reduce((summary, row) => {
    if (row.balance > 0) summary.receivable += Math.abs(row.companyAmount);
    if (row.balance < 0) summary.payable += Math.abs(row.companyAmount);
    return summary;
  }, { receivable: 0, payable: 0 }), [accountBalanceRows]);

  const reconciliation = useMemo(() => {
    const activeResources = new Set(["associate", "product", "expense_type", "sales_invoice", "purchase_invoice", "general_expense", "vault", "vault_transaction"]);
    const records = data.providerRecords.filter((record) => activeResources.has(record.resource_type));
    const matched = records.filter((record) => record.match_status === "matched").length;
    const review = records.filter((record) => record.match_status === "review_required").length;
    const latestRun = data.syncRuns[0] || null;
    const latestAt = latestRun?.completed_at || latestRun?.started_at || null;
    const ageHours = latestAt ? (Date.now() - new Date(latestAt).getTime()) / 3_600_000 : Number.POSITIVE_INFINITY;
    return {
      records: records.length,
      matched,
      review,
      failed: Number(latestRun?.failed_count || 0),
      latestAt,
      healthy: Boolean(latestAt && ageHours <= 2 && Number(latestRun?.failed_count || 0) === 0),
    };
  }, [data.providerRecords, data.syncRuns]);

  const kolaybiPartner = data.integrationPartners.find((row) => row.code === "KOLAYBI") || null;
  const providerEnvironment = connection?.environment || kolaybiPartner?.environment || data.syncRuns[0]?.provider_environment || null;
  const latestSyncAt = reconciliation.latestAt || kolaybiPartner?.last_sync_at || null;
  const nextSyncAt = latestSyncAt ? new Date(new Date(latestSyncAt).getTime() + 60 * 60 * 1000).toISOString() : null;
  const outboundPending = data.outboundQueue.pending;
  const outboundReview = data.outboundQueue.review;

  const balanceExportRows = useMemo(() => accountBalanceRows.map((row) => ({
    "Cari Kodu": row.code,
    "Cari Ünvanı": row.name,
    "Cari Tipi": row.accountType,
    "Bakiye Durumu": row.direction,
    "Para Birimi": row.currency,
    "Döviz Bakiyesi": Math.abs(row.balance),
    "Şirket Para Birimi Karşılığı": Math.abs(row.companyAmount),
    "KolayBi ID": row.externalId,
    "Son Güncelleme": row.lastSeenAt,
  })), [accountBalanceRows]);

  const recordsByType = (type: string) => data.providerRecords.filter((row) => row.resource_type === type);
  const mappingCount = data.providerRecords.filter((row) => row.match_status === "matched").length;
  const reviewCount = data.providerRecords.filter((row) => row.match_status === "review_required").length;
  const pendingProductCount = data.products.filter((row) => row.external_source === "kolaybi" && row.approval_status === "pending").length;

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
            {canViewMonitoring && <Button variant="secondary" onClick={() => void checkConnection(true)}><CheckCircle2 className="mr-2 h-4 w-4" />Bağlantı Testi</Button>}
            {canManageSync && <Button className="bg-white text-[#173f73] hover:bg-blue-50" disabled={syncing} onClick={() => void synchronize("all")}>{syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}Şimdi Senkronize Et</Button>}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs text-blue-50">
          <Clock3 className="h-4 w-4 shrink-0" />
          <span><strong>Otomatik senkronizasyon aktif.</strong> KolayBi verileri saatlik alınır; yeni cariler en geç 15 dakika içinde aktarılır. Düğmeler yalnızca bağlantı testi ve acil yenileme içindir. Eşleşmiş cari kartın ünvan/adres değişikliği KolayBi API kısıtı nedeniyle KolayBi'de yapılır; ilişki ve muhasebe hareketleri otomatik alınmaya devam eder.</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-xs">
          <span className="rounded-full bg-white/15 px-3 py-1">Ortam: {providerEnvironment === "live" ? "Canlı" : providerEnvironment === "test" ? "Sandbox" : "Yapılandırılmadı"}</span>
          <span className="rounded-full bg-white/15 px-3 py-1">Durum: {reconciliation.healthy ? "Güncel" : latestSyncAt ? "Kontrol gerekli" : "İlk çalışma bekleniyor"}</span>
          <span className="rounded-full bg-white/15 px-3 py-1">Eşleşen: {mappingCount}</span>
          <span className="rounded-full bg-white/15 px-3 py-1">Kontrol gereken: {reviewCount}</span>
          <span className="rounded-full bg-white/15 px-3 py-1">Cari kuyruğu: {outboundPending} bekleyen{outboundReview ? `, ${outboundReview} kontrol` : ""}</span>
          <span className="rounded-full bg-white/15 px-3 py-1">Son çalışma: {dateTime(latestSyncAt)}</span>
          <span className="rounded-full bg-white/15 px-3 py-1">Sonraki kontrol: {dateTime(nextSyncAt)}</span>
        </div>
        {(data.syncRuns[0]?.last_error || kolaybiPartner?.last_error) && <p className="mt-3 rounded-lg bg-red-950/25 px-3 py-2 text-xs text-red-50">Son uyarı: {data.syncRuns[0]?.last_error || kolaybiPartner?.last_error}</p>}
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
          {reviewCount > 0 && <Card className="border-amber-200 bg-amber-50"><CardContent className="flex items-center gap-3 p-4"><TriangleAlert className="h-5 w-5 text-amber-600" /><div><p className="font-semibold text-amber-900">{reviewCount} kayıt kontrol bekliyor</p><p className="text-sm text-amber-800">VKN/TCKN, cari kodu ve tekil e-posta eşleşmeleri otomatik yapılır. Burada yalnızca çelişkili/mükerrer cariler ile yeni ürünlerin kullanım onayı kalır.</p></div></CardContent></Card>}
          {reviewRecords.length > 0 && <Card>
            <CardHeader>
              <CardTitle>KolayBi Eşleştirme Kontrolü</CardTitle>
              <CardDescription>Otomatik ve kesin eşleştirilemeyen istisnaları inceleyin. Her karar değiştirilemeyen denetim geçmişine eklenir.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-xl border">
                <Table>
                  <TableHeader><TableRow><TableHead>Kaynak</TableHead><TableHead>KolayBi kaydı</TableHead><TableHead>Kod / VKN</TableHead><TableHead>TMS kaydı</TableHead><TableHead className="text-right">İşlem</TableHead></TableRow></TableHeader>
                  <TableBody>{reviewRecords.map((record) => {
                    const isAssociate = record.resource_type === "associate";
                    const options = isAssociate ? data.customers : data.products;
                    const busy = mappingBusy === record.id;
                    return <TableRow key={record.id}>
                      <TableCell><Badge variant="outline">{isAssociate ? "Cari" : "Ürün / Hizmet"}</Badge></TableCell>
                      <TableCell><p className="font-medium">{record.display_name || "Adsız kayıt"}</p><p className="text-xs text-slate-500">KolayBi #{record.external_id}</p></TableCell>
                      <TableCell className="font-mono text-xs">{record.external_code || record.tax_identity || "-"}</TableCell>
                      <TableCell className="min-w-72">
                        {canManageSync ? <Select value={mappingSelections[record.id] || ""} onValueChange={(value) => setMappingSelections((current) => ({ ...current, [record.id]: value }))} disabled={busy}>
                          <SelectTrigger><SelectValue placeholder={isAssociate ? "TMS carisi seçin" : "TMS ürün/hizmeti seçin"} /></SelectTrigger>
                          <SelectContent>{options.filter((item) => item.id).map((item) => <SelectItem key={item.id} value={item.id}>
                            {isAssociate
                              ? `${item.company || item.name}${item.vergi_no || item.tc_no ? ` — ${item.vergi_no || item.tc_no}` : ""}`
                              : `${item.code || "Kodsuz"} — ${item.name}`}
                          </SelectItem>)}</SelectContent>
                        </Select> : <span className="text-sm text-slate-500">Yönetme yetkisi gerekli</span>}
                      </TableCell>
                      <TableCell><div className="flex justify-end gap-2">
                        <Button size="sm" disabled={!canManageSync || busy || !mappingSelections[record.id]} onClick={() => void resolveMapping(record, "match")}>
                          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}Eşleştir
                        </Button>
                        <Button size="sm" variant="outline" disabled={!canManageSync || busy} onClick={() => void resolveMapping(record, "ignore")}><Ban className="mr-2 h-4 w-4" />Yok say</Button>
                      </div></TableCell>
                    </TableRow>;
                  })}</TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>}
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
          <GeneralExpenseWorkspace
            expenses={data.expenses}
            canManage={canManageExpenses}
            canSync={canManageSync}
            syncing={syncing}
            onSync={async (resource) => { await synchronize(resource); }}
          />
        </TabsContent>

        <TabsContent value="products" className="mt-5 space-y-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h3 className="text-xl font-bold">Ürünler ve Hizmetler</h3><p className="text-sm text-slate-500">KolayBi ürün kartları test/canlı ortamı ayrılarak otomatik alınır; onay verilene kadar işlemlerde kullanılamaz.</p></div>{canManageSync && <Button variant="outline" disabled={syncing} onClick={() => void synchronize("products")}><RefreshCw className="mr-2 h-4 w-4" />KolayBi'den Yenile</Button>}</div>
          {pendingProductCount > 0 && <Card className="border-amber-200 bg-amber-50"><CardContent className="flex items-center gap-3 p-4"><TriangleAlert className="h-5 w-5 text-amber-600" /><div><p className="font-semibold text-amber-900">{pendingProductCount} ürün/hizmet kullanım onayı bekliyor</p><p className="text-sm text-amber-800">Onaylanmayan kartlar teklif ve fatura seçimlerine açılmaz.</p></div></CardContent></Card>}
          <Card><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Kod</TableHead><TableHead>Ad</TableHead><TableHead>Tip</TableHead><TableHead>KDV</TableHead><TableHead>Kaynak</TableHead><TableHead>Durum</TableHead><TableHead className="text-right">Satış Fiyatı</TableHead><TableHead className="text-right">İşlem</TableHead></TableRow></TableHeader><TableBody>
            {data.products.length === 0 ? <EmptyRow columns={8} /> : data.products.map((row) => {
              const mapped = recordsByType("product").find((record) => record.local_entity_id === row.id && (!row.provider_environment || record.provider_environment === row.provider_environment));
              const imported = row.external_source === "kolaybi";
              const approvalLabel = row.approval_status === "pending" ? "Onay bekliyor" : row.approval_status === "approved" ? "Aktif" : row.approval_status === "rejected" ? "Reddedildi" : row.is_active === false ? "Pasif" : "Yerel kayıt";
              const busy = mapped && mappingBusy === mapped.id;
              return <TableRow key={row.id}>
                <TableCell><p className="font-mono">{row.code}</p>{row.provider_code && row.provider_code !== row.code && <p className="text-xs text-slate-500">KolayBi: {row.provider_code}</p>}</TableCell>
                <TableCell className="font-medium">{row.name}</TableCell><TableCell>{row.type}</TableCell><TableCell>%{row.tax_rate ?? 20}</TableCell>
                <TableCell>{imported ? <div className="flex flex-wrap gap-1"><Badge variant="outline">KolayBi</Badge><Badge variant="outline" className={row.provider_environment === "live" ? "border-green-200 bg-green-50 text-green-700" : "border-blue-200 bg-blue-50 text-blue-700"}>{row.provider_environment === "live" ? "Canlı" : "Test"}</Badge></div> : <Badge variant="outline">REX TYS</Badge>}</TableCell>
                <TableCell><Badge variant="outline" className={statusClass(row.approval_status || mapped?.match_status || "review")}>{approvalLabel}</Badge></TableCell>
                <TableCell className="text-right">{money(row.sale_price, row.sale_currency || "TRY")}</TableCell>
                <TableCell><div className="flex justify-end gap-2">{imported && row.approval_status === "pending" && mapped && <>
                  <Button size="sm" disabled={!canManageSync || busy} onClick={() => void reviewImportedProduct(mapped, "approve")}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}Onayla</Button>
                  <Button size="sm" variant="outline" disabled={!canManageSync || busy} onClick={() => void reviewImportedProduct(mapped, "reject")}><Ban className="mr-2 h-4 w-4" />Reddet</Button>
                </>}</div></TableCell>
              </TableRow>;
            })}
          </TableBody></Table></div></Card>
        </TabsContent>

        <TabsContent value="associates" className="mt-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-xl font-bold">Cari Hesaplar</h3><p className="text-sm text-slate-500">Müşteri, tedarikçi, personel ve ortak carilerinin VKN/TCKN, adres ve e-belge türü eşleşmesi</p></div>{canManageSync && <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={syncing} onClick={() => void synchronize("associates")}><RefreshCw className="mr-2 h-4 w-4" />Carileri Yenile</Button><Button variant="outline" disabled={syncing} onClick={() => void synchronize("sales_invoices")}><RefreshCw className="mr-2 h-4 w-4" />E-Belge Türlerini Karşılaştır</Button></div>}</div>
          <Card><Table><TableHeader><TableRow><TableHead>Ünvan</TableHead><TableHead>Tip</TableHead><TableHead>VKN/TCKN</TableHead><TableHead>E-posta</TableHead><TableHead>E-Belge</TableHead><TableHead>KolayBi</TableHead></TableRow></TableHeader><TableBody>
            {data.customers.length === 0 ? <EmptyRow columns={6} /> : data.customers.map((row) => { const mapped = recordsByType("associate").find((record) => record.local_entity_id === row.id); const eDocumentLabel = row.kolaybi_e_document_type === "e_invoice" ? "E-Fatura" : row.kolaybi_e_document_type === "e_archive" ? "E-Arşiv" : "Kontrol Gerekli"; return <TableRow key={row.id}><TableCell className="font-medium">{row.company || row.name}</TableCell><TableCell>{row.account_type || "musteri"}</TableCell><TableCell>{row.vergi_no || row.tc_no || "-"}</TableCell><TableCell>{row.email || "-"}</TableCell><TableCell><Badge variant="outline" className={statusClass(row.kolaybi_e_document_type ? "matched" : "review")}>{eDocumentLabel}</Badge></TableCell><TableCell><Badge variant="outline" className={statusClass(mapped?.match_status || "review")}>{mapped ? `Eşleşti #${mapped.external_id}` : "Kontrol Gerekli"}</Badge></TableCell></TableRow>; })}
          </TableBody></Table></Card>
        </TabsContent>

        <TabsContent value="finance" className="mt-5 space-y-5">
          <FinanceWorkspace
            accounts={data.financialAccounts}
            transactions={data.transactions}
            canSync={canManageSync}
            syncing={syncing}
            onSync={async (resource) => { await synchronize(resource); }}
          />
          <InvoiceConfigurationPanel canManage={canManageInvoiceSettings} />
        </TabsContent>

        <TabsContent value="reports" className="mt-5 space-y-5">
          <div><h3 className="text-xl font-bold">Raporlar ve Mutabakat</h3><p className="text-sm text-slate-500">Kullanılan satış, alış, gider, cari ve finans akışlarını karşılaştırın; XLSX olarak alın.</p></div>
          <Card className={reconciliation.healthy ? "border-green-200" : "border-amber-200"}>
            <CardHeader className="gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div><CardTitle>KolayBi ↔ REX TYS Mutabakatı</CardTitle><CardDescription>Yalnızca fiilen kullanılan sekiz kaynak izlenir. Sipariş, irsaliye, proforma, stok, çek/senet ve tarihsel projeler kapsam dışıdır.</CardDescription></div>
              <Badge variant="outline" className={reconciliation.healthy ? "border-green-200 bg-green-50 text-green-700" : "border-amber-200 bg-amber-50 text-amber-700"}>{reconciliation.healthy ? "Akış Güncel" : "Kontrol Gerekli"}</Badge>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-4">
              <div className="rounded-xl border bg-slate-50 p-4"><p className="text-xs text-slate-500">KolayBi kayıtları</p><p className="mt-1 text-2xl font-bold">{reconciliation.records}</p></div>
              <div className="rounded-xl border border-green-200 bg-green-50 p-4"><p className="text-xs text-green-700">Eşleşen</p><p className="mt-1 text-2xl font-bold text-green-900">{reconciliation.matched}</p></div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-xs text-amber-700">İnsan kontrolü</p><p className="mt-1 text-2xl font-bold text-amber-900">{reconciliation.review}</p></div>
              <div className="rounded-xl border border-red-200 bg-red-50 p-4"><p className="text-xs text-red-700">Son çalışmadaki hata</p><p className="mt-1 text-2xl font-bold text-red-900">{reconciliation.failed}</p></div>
              <p className="text-xs text-slate-500 md:col-span-4">Son senkronizasyon: {reconciliation.latestAt ? new Date(reconciliation.latestAt).toLocaleString("tr-TR") : "Henüz çalışmadı"}. İki saati aşan veya hata içeren akışlar kontrol gerektirir.</p>
            </CardContent>
          </Card>
          {canViewAccounts && <Card>
            <CardHeader className="gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle>Cari Borç / Alacak Raporu</CardTitle>
                <CardDescription>KolayBi'nin güncel cari bakiyeleri gösterilir; bakiyesi 0,00 olan cariler otomatik olarak gizlenir.</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                {canManageSync && <Button variant="outline" disabled={syncing} onClick={() => void synchronize("associates")}>
                  {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}Bakiyeleri Yenile
                </Button>}
                <Button variant="outline" disabled={balanceExportRows.length === 0} onClick={() => void exportRows("rex-cari-borc-alacak-raporu", balanceExportRows)}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />XLSX İndir
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-green-200 bg-green-50 p-4"><p className="text-sm text-green-700">Tahsil Edilecek</p><p className="mt-1 text-xl font-bold text-green-900">{money(balanceSummary.receivable)}</p></div>
                <div className="rounded-xl border border-orange-200 bg-orange-50 p-4"><p className="text-sm text-orange-700">Ödenecek</p><p className="mt-1 text-xl font-bold text-orange-900">{money(balanceSummary.payable)}</p></div>
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4"><p className="text-sm text-blue-700">Açık Bakiyeli Cari</p><p className="mt-1 text-xl font-bold text-blue-900">{accountBalanceRows.length}</p></div>
              </div>
              <div className="overflow-x-auto rounded-xl border">
                <Table><TableHeader><TableRow><TableHead>Cari</TableHead><TableHead>Kod</TableHead><TableHead>Durum</TableHead><TableHead>Para</TableHead><TableHead className="text-right">Bakiye</TableHead><TableHead className="text-right">TRY Karşılığı</TableHead></TableRow></TableHeader><TableBody>
                  {accountBalanceRows.length === 0 ? <EmptyRow columns={6} text="Açık bakiyeli cari bulunmuyor. KolayBi bağlantısı tamamlandıktan sonra Bakiyeleri Yenile düğmesini kullanın." /> : accountBalanceRows.map((row) => <TableRow key={`${row.externalId}-${row.currency}`}><TableCell className="font-medium">{row.name}</TableCell><TableCell className="font-mono">{row.code}</TableCell><TableCell><Badge variant="outline" className={row.balance > 0 ? "border-green-200 bg-green-50 text-green-700" : "border-orange-200 bg-orange-50 text-orange-700"}>{row.direction}</Badge></TableCell><TableCell>{row.currency}</TableCell><TableCell className="text-right font-semibold">{money(Math.abs(row.balance), row.currency)}</TableCell><TableCell className="text-right">{money(Math.abs(row.companyAmount))}</TableCell></TableRow>)}
                </TableBody></Table>
              </div>
              <p className="text-xs text-slate-500">0,01 altındaki yuvarlama farkları sıfır kabul edilir. Pozitif bakiye tahsil edilecek, negatif bakiye ödenecek olarak gösterilir.</p>
            </CardContent>
          </Card>}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              { title: "Satış Faturaları", icon: Receipt, rows: data.salesInvoices.map((r) => ({ "Fatura No": r.invoice_no, Tarih: r.invoice_date, Durum: r.integration_status, Ödeme: r.payment_status, Para: r.currency, Tutar: r.grand_total })) },
              { title: "Alış Faturaları", icon: ShoppingCart, rows: data.purchaseInvoices.map((r) => ({ "Fatura No": r.invoice_no, Tedarikçi: r.issuer_name, Tarih: r.invoice_date, Durum: r.match_status, Para: r.currency, Tutar: r.grand_total })) },
              { title: "Genel Giderler", icon: CircleDollarSign, rows: data.expenses.map((r) => ({ "Gider No": r.expense_no, Tarih: r.expense_date, Kategori: r.category, Açıklama: r.description, Durum: r.status, Tutar: r.total || r.amount })) },
              { title: "Ürün ve Hizmetler", icon: Boxes, rows: data.products.map((r) => ({ Kod: r.code, Ad: r.name, Tip: r.type, KDV: r.tax_rate, "Satış Fiyatı": r.sale_price, Stok: r.stock_quantity })) },
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
