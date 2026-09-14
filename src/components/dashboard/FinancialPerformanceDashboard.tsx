import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  Pencil,
  RefreshCw,
  Target,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const currencies = ["TRY", "EUR", "USD", "GBP"] as const;

type Currency = (typeof currencies)[number];

type FinancialActual = {
  revenue: number;
  directCost: number;
  grossProfit: number;
  grossMargin?: number;
  costMarkup?: number;
  operatingExpenses: number;
  netProfit: number;
  shipmentCount?: number;
};

type FinancialTarget = {
  revenue: number;
  directCost: number;
  grossProfit: number;
  operatingExpenses: number;
  netProfit: number;
};

type MonthlyRow = {
  month: number;
  revenue: number;
  directCost: number;
  grossProfit: number;
  grossMargin: number;
  costMarkup: number;
  operatingExpenses: number;
  netProfit: number;
  shipmentCount: number;
  revenueTarget: number;
  directCostTarget: number;
  grossProfitTarget: number;
  operatingExpenseTarget: number;
  netProfitTarget: number;
};

type DailyRow = {
  date: string;
  revenue: number;
  directCost: number;
  grossProfit: number;
  grossMargin: number;
  operatingExpenses: number;
  netProfit: number;
  shipmentCount: number;
};

type FinancialDashboardData = {
  year: number;
  month: number;
  currency: Currency;
  basis: string;
  generatedAt: string;
  yearActual: FinancialActual;
  yearTarget: FinancialTarget;
  monthActual: FinancialActual;
  monthTarget: FinancialTarget;
  previousYearActual: FinancialActual;
  dataQuality: {
    missingRevenueCount: number;
    missingCostCount: number;
    currencyMismatchCount: number;
  };
  monthly: MonthlyRow[];
  daily: DailyRow[];
};

type TargetDraft = {
  month: number;
  revenueTarget: string;
  directCostTarget: string;
  operatingExpenseTarget: string;
};

function money(value: number, currency: Currency) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function percent(value: number) {
  return `%${Number(value || 0).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}`;
}

function signedPercent(value: number) {
  const formatted = Math.abs(value).toLocaleString("tr-TR", { maximumFractionDigits: 1 });
  return `%${value >= 0 ? "+" : "-"}${formatted}`;
}

function ratio(actual: number, target: number) {
  return target > 0 ? (actual / target) * 100 : 0;
}

function change(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function parseAmount(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

async function fetchFinancialDashboard(year: number, month: number, currency: Currency) {
  return supabase.rpc("rex_financial_dashboard" as never, {
    p_year: year,
    p_month: month,
    p_currency: currency,
  } as never);
}

function MetricCard({
  title,
  value,
  helper,
  icon,
  accent,
}: {
  title: string;
  value: string;
  helper: string;
  icon: ReactNode;
  accent: string;
}) {
  return (
    <Card className={`border-slate-200 border-t-4 bg-white p-5 shadow-sm ${accent}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-600">{title}</p>
        <div className="rounded-xl bg-slate-50 p-2 text-[#173f73]">{icon}</div>
      </div>
      <p className="break-words text-2xl font-bold tracking-tight text-[#10213e]">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{helper}</p>
    </Card>
  );
}

function ProgressLine({ label, actual, target, currency }: { label: string; actual: number; target: number; currency: Currency }) {
  const progress = ratio(actual, target);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className="text-slate-600">{target > 0 ? `${money(actual, currency)} / ${money(target, currency)}` : "Hedef girilmedi"}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${progress >= 100 ? "bg-emerald-500" : progress >= 75 ? "bg-blue-500" : "bg-orange-500"}`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      {target > 0 && <p className="text-xs text-slate-500">Gerçekleşme {percent(progress)} · Kalan {money(Math.max(target - actual, 0), currency)}</p>}
    </div>
  );
}

function MonthlyRevenueChart({ rows, currency }: { rows: MonthlyRow[]; currency: Currency }) {
  const maximum = Math.max(1, ...rows.flatMap((row) => [row.revenue, row.revenueTarget]));
  return (
    <div className="overflow-x-auto pb-2">
      <div className="grid min-w-[760px] grid-cols-12 gap-3" aria-label="Aylık ciro ve hedef grafiği">
        {rows.map((row) => (
          <div key={row.month} className="flex flex-col items-center gap-2">
            <div className="flex h-44 w-full items-end justify-center gap-1 rounded-xl bg-slate-50 px-2 pt-3">
              <div
                className="w-4 rounded-t bg-[#173f73]"
                style={{ height: `${Math.max(row.revenue > 0 ? 4 : 0, (row.revenue / maximum) * 100)}%` }}
                title={`Gerçekleşen: ${money(row.revenue, currency)}`}
              />
              <div
                className="w-4 rounded-t bg-[#f47b31]/75"
                style={{ height: `${Math.max(row.revenueTarget > 0 ? 4 : 0, (row.revenueTarget / maximum) * 100)}%` }}
                title={`Hedef: ${money(row.revenueTarget, currency)}`}
              />
            </div>
            <span className="text-xs font-semibold text-slate-600">{monthNames[row.month - 1].slice(0, 3)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FinancialPerformanceDashboard({ canManageTargets }: { canManageTargets: boolean }) {
  const { toast } = useToast();
  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [currency, setCurrency] = useState<Currency>("TRY");
  const [data, setData] = useState<FinancialDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [targetDialogOpen, setTargetDialogOpen] = useState(false);
  const [targetDraft, setTargetDraft] = useState<TargetDraft[]>([]);
  const [savingTargets, setSavingTargets] = useState(false);

  const refreshDashboard = async () => {
    setLoading(true);
    setError("");
    const { data: response, error: dashboardError } = await fetchFinancialDashboard(year, month, currency);
    if (dashboardError) {
      setError(dashboardError.message);
      setData(null);
    } else {
      setData(response as unknown as FinancialDashboardData);
    }
    setLoading(false);
  };

  useEffect(() => {
    let active = true;
    void fetchFinancialDashboard(year, month, currency).then(({ data: response, error: dashboardError }) => {
      if (!active) return;
      if (dashboardError) {
        setError(dashboardError.message);
        setData(null);
      } else {
        setError("");
        setData(response as unknown as FinancialDashboardData);
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, [currency, month, year]);

  const years = useMemo(() => Array.from({ length: 7 }, (_, index) => today.getFullYear() - 4 + index), [today]);
  const yearRevenueChange = data ? change(data.yearActual.revenue, data.previousYearActual.revenue) : 0;
  const yearProfitChange = data ? change(data.yearActual.grossProfit, data.previousYearActual.grossProfit) : 0;
  const dataIssueCount = data
    ? data.dataQuality.missingRevenueCount + data.dataQuality.missingCostCount + data.dataQuality.currencyMismatchCount
    : 0;

  const visibleDailyRows = useMemo(() => {
    if (!data) return [];
    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;
    return data.daily.filter((row) => {
      if (!isCurrentMonth) return true;
      return new Date(`${row.date}T12:00:00`).getDate() <= today.getDate();
    });
  }, [data, month, today, year]);

  const openTargetEditor = () => {
    if (!data) return;
    setTargetDraft(data.monthly.map((row) => ({
      month: row.month,
      revenueTarget: String(row.revenueTarget || ""),
      directCostTarget: String(row.directCostTarget || ""),
      operatingExpenseTarget: String(row.operatingExpenseTarget || ""),
    })));
    setTargetDialogOpen(true);
  };

  const updateTarget = (monthNo: number, key: keyof Omit<TargetDraft, "month">, value: string) => {
    setTargetDraft((current) => current.map((row) => row.month === monthNo ? { ...row, [key]: value } : row));
  };

  const saveTargets = async () => {
    setSavingTargets(true);
    const payload = targetDraft.map((row) => ({
      month: row.month,
      revenueTarget: parseAmount(row.revenueTarget),
      directCostTarget: parseAmount(row.directCostTarget),
      operatingExpenseTarget: parseAmount(row.operatingExpenseTarget),
    }));
    const { error: saveError } = await supabase.rpc("rex_save_financial_targets" as never, {
      p_year: year,
      p_currency: currency,
      p_targets: payload,
    } as never);
    setSavingTargets(false);
    if (saveError) {
      toast({ title: "Hedefler kaydedilemedi", description: saveError.message, variant: "destructive" });
      return;
    }
    setTargetDialogOpen(false);
    toast({ title: "Hedefler güncellendi", description: `${year} ${currency} aylık hedefleri kaydedildi.` });
    await refreshDashboard();
  };

  const draftTotals = targetDraft.reduce((totals, row) => ({
    revenue: totals.revenue + parseAmount(row.revenueTarget),
    cost: totals.cost + parseAmount(row.directCostTarget),
    expense: totals.expense + parseAmount(row.operatingExpenseTarget),
  }), { revenue: 0, cost: 0, expense: 0 });

  return (
    <section className="space-y-5" aria-labelledby="financial-dashboard-title">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-end md:justify-between md:p-6">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#e96d25]">
            <BarChart3 className="h-4 w-4" /> Yönetim özeti
          </div>
          <h2 id="financial-dashboard-title" className="text-2xl font-bold text-[#10213e]">Finansal Performans</h2>
          <p className="mt-1 text-sm text-slate-600">Sevkiyatların yükleme tarihine göre iş bazlı ciro, maliyet ve kârlılık · KDV hariç</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select aria-label="Rapor yılı" value={year} onChange={(event) => { setLoading(true); setYear(Number(event.target.value)); }} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm">
            {years.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select aria-label="Rapor ayı" value={month} onChange={(event) => { setLoading(true); setMonth(Number(event.target.value)); }} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm">
            {monthNames.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
          </select>
          <select aria-label="Para birimi" value={currency} onChange={(event) => { setLoading(true); setCurrency(event.target.value as Currency); }} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm">
            {currencies.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <Button variant="outline" size="icon" onClick={() => void refreshDashboard()} disabled={loading} title="Verileri yenile">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          {canManageTargets && <Button variant="outline" onClick={openTargetEditor} disabled={!data}><Pencil className="mr-2 h-4 w-4" />Hedefleri Düzenle</Button>}
        </div>
      </div>

      {error && (
        <Card className="border-amber-200 bg-amber-50 p-5 text-amber-900">
          <div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-5 w-5" /><div><p className="font-semibold">Finans özeti henüz hazırlanamadı</p><p className="mt-1 text-sm">{error}</p></div></div>
        </Card>
      )}

      {loading && !data && <Card className="p-10 text-center text-slate-500">Finansal göstergeler hesaplanıyor...</Card>}

      {data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <MetricCard title={`${monthNames[month - 1]} Cirosu`} value={money(data.monthActual.revenue, currency)} helper={`${data.monthActual.shipmentCount || 0} işten otomatik hesaplandı`} icon={<CircleDollarSign className="h-5 w-5" />} accent="border-t-[#2d69a5]" />
            <MetricCard title="Doğrudan Maliyet" value={money(data.monthActual.directCost, currency)} helper="Sevkiyatlara kayıtlı taşıma maliyeti" icon={<WalletCards className="h-5 w-5" />} accent="border-t-rose-400" />
            <MetricCard title="Brüt Kâr" value={money(data.monthActual.grossProfit, currency)} helper="Ciro − doğrudan maliyet" icon={<TrendingUp className="h-5 w-5" />} accent={data.monthActual.grossProfit >= 0 ? "border-t-emerald-500" : "border-t-red-500"} />
            <MetricCard title="Brüt Kâr Marjı" value={percent(data.monthActual.grossMargin || 0)} helper={`Maliyet üstü oran ${percent(data.monthActual.costMarkup || 0)}`} icon={<Target className="h-5 w-5" />} accent="border-t-cyan-500" />
            <MetricCard title="Genel Gider" value={money(data.monthActual.operatingExpenses, currency)} helper="Muhasebedeki dönem giderleri" icon={<TrendingDown className="h-5 w-5" />} accent="border-t-amber-400" />
            <MetricCard title="Net Faaliyet Sonucu" value={money(data.monthActual.netProfit, currency)} helper="Brüt kâr − genel gider" icon={<BarChart3 className="h-5 w-5" />} accent={data.monthActual.netProfit >= 0 ? "border-t-emerald-600" : "border-t-red-600"} />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <Card className="p-5 md:p-6">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div><h3 className="text-lg font-bold text-[#10213e]">Hedef Gerçekleşmesi</h3><p className="text-sm text-slate-500">Aylık ve yıllık hedeflerle canlı karşılaştırma</p></div>
                <Badge variant="outline">{year} · {currency}</Badge>
              </div>
              <div className="space-y-5">
                <ProgressLine label={`${monthNames[month - 1]} ciro hedefi`} actual={data.monthActual.revenue} target={data.monthTarget.revenue} currency={currency} />
                <ProgressLine label="Yıllık ciro hedefi" actual={data.yearActual.revenue} target={data.yearTarget.revenue} currency={currency} />
                <ProgressLine label="Yıllık brüt kâr hedefi" actual={data.yearActual.grossProfit} target={data.yearTarget.grossProfit} currency={currency} />
              </div>
            </Card>

            <Card className="p-5 md:p-6">
              <h3 className="text-lg font-bold text-[#10213e]">Yıllık Görünüm</h3>
              <p className="mb-5 text-sm text-slate-500">Geçen yılın aynı para birimiyle karşılaştırması</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-blue-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Yıllık ciro</p><p className="mt-2 text-xl font-bold text-[#10213e]">{money(data.yearActual.revenue, currency)}</p><p className="mt-1 text-xs text-slate-600">{yearRevenueChange === null ? "Geçen yıl veri yok" : `Geçen yıla göre ${signedPercent(yearRevenueChange)}`}</p></div>
                <div className="rounded-2xl bg-emerald-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Yıllık brüt kâr</p><p className="mt-2 text-xl font-bold text-[#10213e]">{money(data.yearActual.grossProfit, currency)}</p><p className="mt-1 text-xs text-slate-600">{yearProfitChange === null ? "Geçen yıl veri yok" : `Geçen yıla göre ${signedPercent(yearProfitChange)}`}</p></div>
                <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Yıllık marj</p><p className="mt-2 text-xl font-bold text-[#10213e]">{percent(data.yearActual.grossMargin || 0)}</p><p className="mt-1 text-xs text-slate-500">Brüt kâr / ciro</p></div>
                <div className="rounded-2xl bg-orange-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Yıllık iş sayısı</p><p className="mt-2 text-xl font-bold text-[#10213e]">{data.yearActual.shipmentCount || 0}</p><p className="mt-1 text-xs text-slate-500">İptal olmayan sevkiyatlar</p></div>
              </div>
            </Card>
          </div>

          <Card className="p-5 md:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div><h3 className="text-lg font-bold text-[#10213e]">Aylık Ciro ve Hedef Grafiği</h3><p className="text-sm text-slate-500">Lacivert gerçekleşen · turuncu hedef</p></div>
              <Badge className="bg-[#10213e] text-white hover:bg-[#10213e]">{percent(ratio(data.yearActual.revenue, data.yearTarget.revenue))} yıllık gerçekleşme</Badge>
            </div>
            <MonthlyRevenueChart rows={data.monthly} currency={currency} />
          </Card>

          {dataIssueCount > 0 && (
            <Card className="border-amber-200 bg-amber-50 p-5">
              <div className="flex items-start gap-3 text-amber-950">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <div><p className="font-semibold">Kârlılık kontrolü gereken kayıtlar var</p><p className="mt-1 text-sm">{data.dataQuality.missingRevenueCount} işte satış tutarı, {data.dataQuality.missingCostCount} işte maliyet eksik; {data.dataQuality.currencyMismatchCount} işte satış ve maliyet para birimi farklı. Toplamlar para birimi dönüştürülmeden gösterilir.</p></div>
              </div>
            </Card>
          )}

          <Card className="overflow-hidden">
            <div className="border-b border-slate-200 p-5 md:p-6"><h3 className="text-lg font-bold text-[#10213e]">{monthNames[month - 1]} Günlük Performansı</h3><p className="text-sm text-slate-500">Her günün işi, cirosu, doğrudan maliyeti ve kazancı</p></div>
            <div className="max-h-[520px] overflow-auto">
              <table className="w-full min-w-[920px] text-sm">
                <thead className="sticky top-0 z-10 bg-[#10213e] text-white">
                  <tr><th className="p-3 text-left">Tarih</th><th className="p-3 text-right">İş</th><th className="p-3 text-right">Ciro</th><th className="p-3 text-right">Doğrudan Maliyet</th><th className="p-3 text-right">Brüt Kâr</th><th className="p-3 text-right">Marj</th><th className="p-3 text-right">Genel Gider</th><th className="p-3 text-right">Net Sonuç</th></tr>
                </thead>
                <tbody>
                  {visibleDailyRows.map((row) => (
                    <tr key={row.date} className="border-b border-slate-100 odd:bg-white even:bg-slate-50/70">
                      <td className="p-3 font-medium text-slate-700">{new Date(`${row.date}T12:00:00`).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" })}</td>
                      <td className="p-3 text-right">{row.shipmentCount}</td>
                      <td className="p-3 text-right font-semibold">{money(row.revenue, currency)}</td>
                      <td className="p-3 text-right">{money(row.directCost, currency)}</td>
                      <td className={`p-3 text-right font-semibold ${row.grossProfit < 0 ? "text-red-600" : "text-emerald-700"}`}>{money(row.grossProfit, currency)}</td>
                      <td className="p-3 text-right">{percent(row.grossMargin)}</td>
                      <td className="p-3 text-right">{money(row.operatingExpenses, currency)}</td>
                      <td className={`p-3 text-right font-semibold ${row.netProfit < 0 ? "text-red-600" : "text-[#10213e]"}`}>{money(row.netProfit, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-slate-200 p-5 md:p-6"><h3 className="text-lg font-bold text-[#10213e]">{year} Aylık Gerçekleşen Bütçe</h3><p className="text-sm text-slate-500">Hedef, gerçekleşen ve kârlılık aynı tabloda</p></div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] text-sm">
                <thead className="bg-sky-100 text-[#10213e]"><tr><th className="p-3 text-left">Ay</th><th className="p-3 text-right">Ciro</th><th className="p-3 text-right">Ciro Hedefi</th><th className="p-3 text-right">Gerçekleşme</th><th className="p-3 text-right">Maliyet / Hedef</th><th className="p-3 text-right">Brüt Kâr / Hedef</th><th className="p-3 text-right">Marj</th><th className="p-3 text-right">Genel Gider / Hedef</th><th className="p-3 text-right">Net Sonuç / Hedef</th><th className="p-3 text-right">İş</th></tr></thead>
                <tbody>
                  {data.monthly.map((row) => (
                    <tr key={row.month} className={`border-b border-slate-100 ${row.month === month ? "bg-orange-50" : "odd:bg-white even:bg-slate-50/70"}`}>
                      <td className="p-3 font-semibold">{monthNames[row.month - 1]}</td><td className="p-3 text-right">{money(row.revenue, currency)}</td><td className="p-3 text-right">{money(row.revenueTarget, currency)}</td><td className="p-3 text-right"><Badge variant={ratio(row.revenue, row.revenueTarget) >= 100 ? "default" : "outline"}>{row.revenueTarget > 0 ? percent(ratio(row.revenue, row.revenueTarget)) : "—"}</Badge></td><td className="p-3 text-right"><div>{money(row.directCost, currency)}</div><div className="text-xs text-slate-400">Hedef {money(row.directCostTarget, currency)}</div></td><td className={`p-3 text-right font-semibold ${row.grossProfit < 0 ? "text-red-600" : "text-emerald-700"}`}><div>{money(row.grossProfit, currency)}</div><div className="text-xs font-normal text-slate-400">Hedef {money(row.grossProfitTarget, currency)}</div></td><td className="p-3 text-right">{percent(row.grossMargin)}</td><td className="p-3 text-right"><div>{money(row.operatingExpenses, currency)}</div><div className="text-xs text-slate-400">Hedef {money(row.operatingExpenseTarget, currency)}</div></td><td className={`p-3 text-right font-semibold ${row.netProfit < 0 ? "text-red-600" : "text-[#10213e]"}`}><div>{money(row.netProfit, currency)}</div><div className="text-xs font-normal text-slate-400">Hedef {money(row.netProfitTarget, currency)}</div></td><td className="p-3 text-right">{row.shipmentCount}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[#10213e] font-semibold text-white"><tr><td className="p-3">YIL</td><td className="p-3 text-right">{money(data.yearActual.revenue, currency)}</td><td className="p-3 text-right">{money(data.yearTarget.revenue, currency)}</td><td className="p-3 text-right">{data.yearTarget.revenue > 0 ? percent(ratio(data.yearActual.revenue, data.yearTarget.revenue)) : "—"}</td><td className="p-3 text-right"><div>{money(data.yearActual.directCost, currency)}</div><div className="text-xs font-normal text-slate-300">Hedef {money(data.yearTarget.directCost, currency)}</div></td><td className="p-3 text-right"><div>{money(data.yearActual.grossProfit, currency)}</div><div className="text-xs font-normal text-slate-300">Hedef {money(data.yearTarget.grossProfit, currency)}</div></td><td className="p-3 text-right">{percent(data.yearActual.grossMargin || 0)}</td><td className="p-3 text-right"><div>{money(data.yearActual.operatingExpenses, currency)}</div><div className="text-xs font-normal text-slate-300">Hedef {money(data.yearTarget.operatingExpenses, currency)}</div></td><td className="p-3 text-right"><div>{money(data.yearActual.netProfit, currency)}</div><div className="text-xs font-normal text-slate-300">Hedef {money(data.yearTarget.netProfit, currency)}</div></td><td className="p-3 text-right">{data.yearActual.shipmentCount || 0}</td></tr></tfoot>
              </table>
            </div>
          </Card>

          <p className="flex items-center gap-2 text-xs text-slate-500"><CalendarDays className="h-4 w-4" /> Ciro ve doğrudan maliyet sevkiyatın yükleme tarihine; genel gider muhasebe kayıt tarihine yazılır. İptal işler hesaba katılmaz.</p>
        </>
      )}

      <Dialog open={targetDialogOpen} onOpenChange={setTargetDialogOpen}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader><DialogTitle>{year} {currency} Aylık Finans Hedefleri</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-600">Aylık hedefleri girin; yıllık hedef ve hedef kâr sistem tarafından otomatik toplanır.</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-slate-100"><tr><th className="p-3 text-left">Ay</th><th className="p-3 text-left">Ciro Hedefi</th><th className="p-3 text-left">Doğrudan Maliyet Hedefi</th><th className="p-3 text-left">Genel Gider Hedefi</th><th className="p-3 text-right">Hedef Net Sonuç</th></tr></thead>
              <tbody>
                {targetDraft.map((row) => {
                  const netTarget = parseAmount(row.revenueTarget) - parseAmount(row.directCostTarget) - parseAmount(row.operatingExpenseTarget);
                  return <tr key={row.month} className="border-b"><td className="p-3 font-semibold">{monthNames[row.month - 1]}</td><td className="p-2"><Input inputMode="decimal" value={row.revenueTarget} onChange={(event) => updateTarget(row.month, "revenueTarget", event.target.value)} /></td><td className="p-2"><Input inputMode="decimal" value={row.directCostTarget} onChange={(event) => updateTarget(row.month, "directCostTarget", event.target.value)} /></td><td className="p-2"><Input inputMode="decimal" value={row.operatingExpenseTarget} onChange={(event) => updateTarget(row.month, "operatingExpenseTarget", event.target.value)} /></td><td className={`p-3 text-right font-semibold ${netTarget < 0 ? "text-red-600" : "text-emerald-700"}`}>{money(netTarget, currency)}</td></tr>;
                })}
              </tbody>
              <tfoot className="bg-[#10213e] text-white"><tr><td className="p-3 font-semibold">YIL</td><td className="p-3">{money(draftTotals.revenue, currency)}</td><td className="p-3">{money(draftTotals.cost, currency)}</td><td className="p-3">{money(draftTotals.expense, currency)}</td><td className="p-3 text-right font-semibold">{money(draftTotals.revenue - draftTotals.cost - draftTotals.expense, currency)}</td></tr></tfoot>
            </table>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setTargetDialogOpen(false)}>Vazgeç</Button><Button onClick={() => void saveTargets()} disabled={savingTargets}>{savingTargets ? "Kaydediliyor..." : "Hedefleri Kaydet"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
