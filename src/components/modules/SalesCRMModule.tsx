import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness, CalendarClock, CheckCircle2, ChevronRight, ClipboardList,
  Mail, MapPin, Phone, Plus, RefreshCw, Target, TrendingUp, UserCheck, Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { hasPermission, type PermissionMap } from "@/lib/staff-permissions";
import {
  salesCrmService, type ActivityOutcome, type ActivityType, type CrmActivity,
  type CrmOffer, type CrmOpportunity, type CrmStage, type QuoteDetail,
  type SalesPerformance, type SalesRepresentative,
} from "@/services/salesCrmService";

const stageConfig: Record<CrmStage, { label: string; short: string; color: string; dot: string }> = {
  introduction: { label: "Tanıtım Yapılanlar", short: "Tanıtım", color: "border-sky-200 bg-sky-50 text-sky-800", dot: "bg-sky-500" },
  quote_required: { label: "Teklif Verilecek", short: "Teklif Verilecek", color: "border-orange-200 bg-orange-50 text-orange-800", dot: "bg-orange-500" },
  follow_up: { label: "Takipteki Müşteriler", short: "Takipte", color: "border-violet-200 bg-violet-50 text-violet-800", dot: "bg-violet-500" },
  won: { label: "Kazanılan Müşteriler", short: "Kazanıldı", color: "border-emerald-200 bg-emerald-50 text-emerald-800", dot: "bg-emerald-500" },
  lost: { label: "Kaybedilenler", short: "Kaybedildi", color: "border-slate-200 bg-slate-100 text-slate-700", dot: "bg-slate-500" },
};

const activityLabels: Record<ActivityType, string> = { call: "Telefon araması", visit: "Müşteri ziyareti", email: "E-posta", meeting: "Görüşme", note: "Not" };
const outcomeLabels: Record<ActivityOutcome, string> = {
  reached: "Görüşüldü", not_reached: "Ulaşılamadı", introduction_completed: "Tanıtım yapıldı",
  positive: "Olumlu", negative: "Olumsuz", follow_up: "Takip edilecek", quote_requested: "Teklif istendi",
  quote_sent: "Teklif iletildi", no_interest: "İlgilenmiyor", other: "Diğer",
};

const today = () => new Date().toISOString().slice(0, 10);
const localDateTime = (date = new Date()) => {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};
const readableDate = (value?: string | null) => value ? new Date(value).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" }) : "Planlanmadı";
const money = (value?: number | null, currency = "TRY") => value == null ? "-" : new Intl.NumberFormat("tr-TR", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);

export function SalesCRMModule({ permissions }: { permissions: PermissionMap }) {
  const { toast } = useToast();
  const canManage = hasPermission(permissions, "crm.sales_pipeline", "manage");
  const canCreateCustomer = hasPermission(permissions, "crm.customers", "manage");
  const canCreateJob = hasPermission(permissions, "sales.work_orders", "manage");
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState<CrmOpportunity[]>([]);
  const [representatives, setRepresentatives] = useState<SalesRepresentative[]>([]);
  const [performance, setPerformance] = useState<SalesPerformance[]>([]);
  const [dateFrom, setDateFrom] = useState(today());
  const [dateTo, setDateTo] = useState(today());
  const [stageFilter, setStageFilter] = useState<CrmStage | "all">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CrmOpportunity | null>(null);
  const [activities, setActivities] = useState<CrmActivity[]>([]);
  const [offers, setOffers] = useState<CrmOffer[]>([]);
  const [quoteDetail, setQuoteDetail] = useState<QuoteDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [prospectOpen, setProspectOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activityForm, setActivityForm] = useState({ activity_type: "call" as ActivityType, outcome: "reached" as ActivityOutcome, summary: "", activity_at: localDateTime(), next_action_at: "" });
  const [offerForm, setOfferForm] = useState({ subject: "Taşımacılık hizmet teklifi", amount: "", currency: "TRY", status: "sent" as CrmOffer["status"], valid_until: "", notes: "" });
  const [prospectForm, setProspectForm] = useState({ company_name: "", contact_name: "", email: "", phone: "", assigned_to: "", next_action_at: "", notes: "" });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [opportunityRows, repRows, performanceRows] = await Promise.all([
        salesCrmService.listOpportunities(), salesCrmService.listRepresentatives(), salesCrmService.performance(dateFrom, dateTo),
      ]);
      setOpportunities(opportunityRows);
      setRepresentatives(repRows);
      setPerformance(performanceRows);
      if (selected) setSelected(opportunityRows.find((item) => item.id === selected.id) || null);
    } catch (error: any) {
      toast({ title: "CRM yüklenemedi", description: error?.message || "Satış verileri alınamadı.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  useEffect(() => { void loadAll(); }, [dateFrom, dateTo]);

  const totals = useMemo(() => performance.reduce((sum, item) => ({
    calls: sum.calls + Number(item.calls), visits: sum.visits + Number(item.visits), emails: sum.emails + Number(item.emails),
    meetings: sum.meetings + Number(item.customer_meetings), introductions: sum.introductions + Number(item.introductions),
    quotes: sum.quotes + Number(item.quotes_sent), won: sum.won + Number(item.won),
  }), { calls: 0, visits: 0, emails: 0, meetings: 0, introductions: 0, quotes: 0, won: 0 }), [performance]);

  const stageCounts = useMemo(() => opportunities.reduce((result, item) => ({ ...result, [item.stage]: (result[item.stage] || 0) + 1 }), {} as Record<CrmStage, number>), [opportunities]);
  const filtered = useMemo(() => opportunities.filter((item) => {
    if (stageFilter !== "all" && item.stage !== stageFilter) return false;
    const needle = search.trim().toLocaleLowerCase("tr-TR");
    return !needle || [item.company_name, item.contact_name, item.email, item.phone].some((value) => value?.toLocaleLowerCase("tr-TR").includes(needle));
  }), [opportunities, search, stageFilter]);

  const repName = (id?: string | null) => representatives.find((item) => item.user_id === id)?.full_name || (id ? "Atanmış temsilci" : "Atanmadı");

  const openDetail = async (item: CrmOpportunity) => {
    setSelected(item); setDetailOpen(true); setQuoteDetail(null);
    try {
      const [activityRows, offerRows, quote] = await Promise.all([
        salesCrmService.listActivities(item.id), salesCrmService.listOffers(item.id),
        item.quote_request_id ? salesCrmService.getQuoteDetail(item.quote_request_id) : Promise.resolve(null),
      ]);
      setActivities(activityRows); setOffers(offerRows); setQuoteDetail(quote);
    } catch (error: any) { toast({ title: "Detay yüklenemedi", description: error?.message, variant: "destructive" }); }
  };

  const refreshDetail = async () => {
    if (!selected) return;
    const current = (await salesCrmService.listOpportunities()).find((item) => item.id === selected.id);
    if (current) await openDetail(current);
    await loadAll();
  };

  const saveActivity = async () => {
    if (!selected || activityForm.summary.trim().length < 3) return;
    setSubmitting(true);
    try {
      await salesCrmService.addActivity({ opportunity_id: selected.id, customer_id: selected.customer_id, ...activityForm,
        activity_at: new Date(activityForm.activity_at).toISOString(), next_action_at: activityForm.next_action_at ? new Date(activityForm.next_action_at).toISOString() : null });
      toast({ title: "Faaliyet kaydedildi", description: `${activityLabels[activityForm.activity_type]} CRM geçmişine eklendi.` });
      setActivityOpen(false); setActivityForm({ activity_type: "call", outcome: "reached", summary: "", activity_at: localDateTime(), next_action_at: "" });
      await refreshDetail();
    } catch (error: any) { toast({ title: "Faaliyet kaydedilemedi", description: error?.message, variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  const saveOffer = async () => {
    if (!selected || !offerForm.subject.trim() || Number(offerForm.amount) < 0) return;
    setSubmitting(true);
    try {
      const created = await salesCrmService.createOffer({ opportunity_id: selected.id, quote_request_id: selected.quote_request_id,
        customer_id: selected.customer_id, subject: offerForm.subject.trim(), amount: Number(offerForm.amount), currency: offerForm.currency,
        status: offerForm.status, valid_until: offerForm.valid_until || null, notes: offerForm.notes || null });
      toast({ title: created.status === "sent" ? "Teklif gönderildi ve takibe alındı" : "Teklif taslağı kaydedildi", description: created.offer_no });
      setOfferOpen(false); setOfferForm({ subject: "Taşımacılık hizmet teklifi", amount: "", currency: "TRY", status: "sent", valid_until: "", notes: "" });
      await refreshDetail();
    } catch (error: any) { toast({ title: "Teklif kaydedilemedi", description: error?.message, variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  const saveProspect = async () => {
    if (!prospectForm.company_name.trim()) return;
    setSubmitting(true);
    try {
      await salesCrmService.createOpportunity({ ...prospectForm, next_action_at: prospectForm.next_action_at ? new Date(prospectForm.next_action_at).toISOString() : null });
      toast({ title: "Potansiyel müşteri eklendi", description: "Tanıtım yapılacaklar listesine kaydedildi." });
      setProspectOpen(false); setProspectForm({ company_name: "", contact_name: "", email: "", phone: "", assigned_to: "", next_action_at: "", notes: "" });
      await loadAll();
    } catch (error: any) { toast({ title: "Kayıt oluşturulamadı", description: error?.message, variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  const updateOpportunity = async (updates: Partial<CrmOpportunity>, success: string) => {
    if (!selected) return;
    setSubmitting(true);
    try { await salesCrmService.updateOpportunity(selected.id, updates); toast({ title: success }); await refreshDetail(); }
    catch (error: any) { toast({ title: "İşlem tamamlanamadı", description: error?.message, variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  const convertCustomer = async () => {
    if (!selected) return;
    setSubmitting(true);
    try { await salesCrmService.convertToCustomer(selected.id); toast({ title: "Müşteri cari kartı oluşturuldu" }); await refreshDetail(); }
    catch (error: any) { toast({ title: "Cari oluşturulamadı", description: error?.message, variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  const createJob = async () => {
    if (!selected) return;
    setSubmitting(true);
    try { await salesCrmService.createJobFromQuote(selected.id); toast({ title: "İş emri oluşturuldu", description: "Operasyon onayına gönderildi." }); await refreshDetail(); }
    catch (error: any) { toast({ title: "İş emri oluşturulamadı", description: error?.message, variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  if (loading && opportunities.length === 0) return <div className="p-10 text-center text-slate-500">Satış CRM hazırlanıyor...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e96d25]">Satış çalışma alanı</p><h1 className="mt-1 text-3xl font-bold text-[#10213e]">Müşteri Görüşmeleri ve Teklif Süreci</h1><p className="mt-1 text-slate-600">İlk temastan ilk işin resmî faturasına kadar tüm satış sürecini yönetin.</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="w-40 bg-white" />
          <span className="text-slate-400">—</span><Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="w-40 bg-white" />
          <Button variant="outline" onClick={() => void loadAll()}><RefreshCw className="mr-2 h-4 w-4" />Yenile</Button>
          {canManage && <Button className="bg-[#e96d25] hover:bg-[#d95e1d]" onClick={() => setProspectOpen(true)}><Plus className="mr-2 h-4 w-4" />Yeni Potansiyel</Button>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
        {[
          [Phone, "Arama", totals.calls, "text-blue-700 bg-blue-50"], [MapPin, "Ziyaret", totals.visits, "text-orange-700 bg-orange-50"],
          [Mail, "E-posta", totals.emails, "text-cyan-700 bg-cyan-50"], [Users, "Görüşme", totals.meetings, "text-indigo-700 bg-indigo-50"],
          [UserCheck, "Tanıtım", totals.introductions, "text-sky-700 bg-sky-50"], [ClipboardList, "Teklif", totals.quotes, "text-violet-700 bg-violet-50"],
          [CheckCircle2, "Kazanılan", totals.won, "text-emerald-700 bg-emerald-50"],
        ].map(([Icon, label, value, style]) => {
          const MetricIcon = Icon as typeof Phone;
          return <Card key={String(label)} className="border-slate-200 p-4 shadow-sm"><div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${style}`}><MetricIcon className="h-4 w-4" /></div><p className="text-xs font-semibold text-slate-500">{String(label)}</p><p className="mt-1 text-2xl font-bold text-[#10213e]">{Number(value)}</p></Card>;
        })}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {(Object.keys(stageConfig) as CrmStage[]).map((stage) => <button key={stage} onClick={() => setStageFilter(stage)} className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${stageFilter === stage ? stageConfig[stage].color + " ring-2 ring-current/10" : "border-slate-200 bg-white"}`}><div className="flex items-center justify-between"><span className="text-sm font-semibold">{stageConfig[stage].label}</span><span className={`h-2.5 w-2.5 rounded-full ${stageConfig[stage].dot}`} /></div><p className="mt-2 text-3xl font-bold">{stageCounts[stage] || 0}</p></button>)}
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-white p-5 md:flex-row md:items-center md:justify-between"><div><h2 className="text-xl font-bold text-[#10213e]">Satış Listesi</h2><p className="text-sm text-slate-500">{filtered.length} kayıt gösteriliyor</p></div><div className="flex gap-2"><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Firma, kişi, e-posta veya telefon ara" className="w-full md:w-80" />{stageFilter !== "all" && <Button variant="outline" onClick={() => setStageFilter("all")}>Tümünü Göster</Button>}</div></div>
        <div className="divide-y divide-slate-100">
          {filtered.length === 0 && <div className="p-10 text-center text-slate-500">Bu aşamada satış kaydı bulunmuyor.</div>}
          {filtered.map((item) => <button key={item.id} onClick={() => void openDetail(item)} className="grid w-full gap-3 p-5 text-left transition hover:bg-slate-50 md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-center">
            <div><div className="flex flex-wrap items-center gap-2"><p className="font-bold text-[#10213e]">{item.company_name}</p>{item.source === "website" && <Badge className="bg-[#e96d25] text-white">Web teklif talebi</Badge>}</div><p className="mt-1 text-sm text-slate-500">{item.contact_name || "Yetkili belirtilmedi"} · {item.phone || item.email || "İletişim bilgisi yok"}</p></div>
            <div><Badge variant="outline" className={stageConfig[item.stage].color}>{stageConfig[item.stage].short}</Badge><p className="mt-1 text-xs text-slate-500">{money(item.estimated_value, item.currency)}</p></div>
            <div><p className="text-sm font-medium text-slate-700">{repName(item.assigned_to)}</p><p className="mt-1 text-xs text-slate-500"><CalendarClock className="mr-1 inline h-3.5 w-3.5" />{readableDate(item.next_action_at)}</p></div><ChevronRight className="h-5 w-5 text-slate-400" />
          </button>)}
        </div>
      </Card>

      <Card className="border-slate-200 p-5 shadow-sm"><div className="mb-4 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-[#e96d25]" /><h2 className="text-xl font-bold text-[#10213e]">Satış Temsilcisi Performansı</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-sm"><thead><tr className="border-b text-left text-xs uppercase tracking-wide text-slate-500"><th className="py-3">Temsilci</th><th>Arama</th><th>Ziyaret</th><th>Görüşme</th><th>E-posta</th><th>Tanıtım</th><th>Teklif</th><th>Kazanılan</th><th>Dönüşüm</th></tr></thead><tbody>{performance.map((item) => { const conversion = Number(item.quotes_sent) ? Math.round(Number(item.won) / Number(item.quotes_sent) * 100) : 0; return <tr key={item.user_id} className="border-b last:border-0"><td className="py-4"><p className="font-semibold text-[#10213e]">{item.full_name}</p><p className="text-xs text-slate-500">{item.email}</p></td><td>{item.calls}</td><td>{item.visits}</td><td>{item.customer_meetings}</td><td>{item.emails}</td><td>{item.introductions}</td><td>{item.quotes_sent}</td><td className="font-bold text-emerald-700">{item.won}</td><td>%{conversion}</td></tr>; })}</tbody></table></div></Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}><DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto"><DialogHeader><DialogTitle className="flex flex-wrap items-center gap-3 text-2xl text-[#10213e]">{selected?.company_name}{selected && <Badge variant="outline" className={stageConfig[selected.stage].color}>{stageConfig[selected.stage].label}</Badge>}</DialogTitle></DialogHeader>{selected && <div className="space-y-6">
        <div className="grid gap-4 rounded-2xl bg-slate-50 p-4 md:grid-cols-3"><div><p className="text-xs font-semibold uppercase text-slate-500">İlgili kişi</p><p className="mt-1 font-medium">{selected.contact_name || "-"}</p><p className="text-sm text-slate-500">{selected.phone || "-"} · {selected.email || "-"}</p></div><div><p className="text-xs font-semibold uppercase text-slate-500">Satış temsilcisi</p>{canManage ? <select value={selected.assigned_to || ""} onChange={(event) => void updateOpportunity({ assigned_to: event.target.value || null }, "Satış temsilcisi güncellendi")} className="mt-1 w-full rounded-md border bg-white px-3 py-2"><option value="">Atanmadı</option>{representatives.map((rep) => <option key={rep.user_id} value={rep.user_id}>{rep.full_name}</option>)}</select> : <p className="mt-1">{repName(selected.assigned_to)}</p>}</div><div><p className="text-xs font-semibold uppercase text-slate-500">Sonraki işlem</p><p className="mt-1 font-medium">{readableDate(selected.next_action_at)}</p><p className="text-sm text-slate-500">Tahmini değer: {money(selected.estimated_value, selected.currency)}</p></div></div>
        {quoteDetail && <div className="rounded-2xl border border-orange-200 bg-orange-50/70 p-5"><div className="mb-3 flex items-center gap-2"><ClipboardList className="h-5 w-5 text-[#e96d25]" /><h3 className="font-bold text-[#10213e]">Web Sitesinden Alınan Teklif Talebi</h3></div><div className="grid gap-3 text-sm md:grid-cols-3"><div><span className="text-slate-500">Taşıma:</span><p className="font-medium">{quoteDetail.service_type === "domestic" ? "Yurtiçi" : "Uluslararası"} · {quoteDetail.transport_mode === "road" ? "Karayolu" : quoteDetail.transport_mode === "air" ? "Havayolu" : "Denizyolu"}</p></div><div><span className="text-slate-500">Güzergâh:</span><p className="font-medium">{quoteDetail.loading_point} → {quoteDetail.delivery_point}</p></div><div><span className="text-slate-500">Yük kalemi:</span><p className="font-medium">{quoteDetail.cargos?.length || 0} kalem</p></div></div>{quoteDetail.special_requirements && <p className="mt-3 rounded-lg bg-white p-3 text-sm">{quoteDetail.special_requirements}</p>}</div>}
        {canManage && <div className="flex flex-wrap gap-2"><Button onClick={() => setActivityOpen(true)}><Phone className="mr-2 h-4 w-4" />Faaliyet Kaydet</Button><Button className="bg-[#e96d25] hover:bg-[#d95e1d]" onClick={() => setOfferOpen(true)}><ClipboardList className="mr-2 h-4 w-4" />Teklif Oluştur</Button>{!selected.customer_id && canCreateCustomer && <Button variant="outline" onClick={() => void convertCustomer()} disabled={submitting}><Users className="mr-2 h-4 w-4" />Cari Oluştur</Button>}{selected.quote_request_id && selected.customer_id && !selected.first_job_id && canCreateJob && <Button variant="outline" onClick={() => void createJob()} disabled={submitting}><BriefcaseBusiness className="mr-2 h-4 w-4" />İş Emrine Dönüştür</Button>}{selected.first_job_id && <Badge className="px-3 py-2 bg-blue-100 text-blue-800">İlk iş emri oluşturuldu</Badge>}{selected.first_invoice_id && <Badge className="px-3 py-2 bg-emerald-100 text-emerald-800">İlk resmî fatura kesildi</Badge>}</div>}
        <div className="grid gap-6 lg:grid-cols-2"><div><h3 className="mb-3 font-bold text-[#10213e]">Görüşme ve Faaliyet Geçmişi</h3><div className="space-y-3">{activities.length === 0 && <p className="rounded-xl border border-dashed p-5 text-center text-sm text-slate-500">Henüz faaliyet kaydı yok.</p>}{activities.map((item) => <div key={item.id} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{activityLabels[item.activity_type]} · {outcomeLabels[item.outcome]}</p><p className="mt-1 text-sm text-slate-600">{item.summary}</p></div><span className="whitespace-nowrap text-xs text-slate-500">{readableDate(item.activity_at)}</span></div>{item.next_action_at && <p className="mt-2 text-xs font-medium text-orange-700">Sonraki işlem: {readableDate(item.next_action_at)}</p>}</div>)}</div></div><div><h3 className="mb-3 font-bold text-[#10213e]">Verilen Teklifler</h3><div className="space-y-3">{offers.length === 0 && <p className="rounded-xl border border-dashed p-5 text-center text-sm text-slate-500">Henüz teklif oluşturulmadı.</p>}{offers.map((item) => <div key={item.id} className="rounded-xl border border-slate-200 p-4"><div className="flex justify-between gap-3"><div><p className="font-semibold">{item.offer_no}</p><p className="text-sm text-slate-600">{item.subject}</p></div><Badge variant="outline">{item.status === "sent" ? "Gönderildi" : item.status === "draft" ? "Taslak" : item.status}</Badge></div><p className="mt-3 text-lg font-bold text-[#10213e]">{money(item.amount, item.currency)}</p><p className="text-xs text-slate-500">{item.sent_at ? `Gönderim: ${readableDate(item.sent_at)}` : "Henüz gönderilmedi"}</p></div>)}</div></div></div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><strong>Kazanılma kuralı:</strong> Bu kayıt elle “Kazanıldı” yapılamaz. İlk iş emri onaylanıp sevkiyat tamamlandıktan ve KolayBi üzerinden resmî e-fatura/e-arşiv oluştuğunda sistem otomatik taşır.</div>
      </div>}</DialogContent></Dialog>

      <Dialog open={activityOpen} onOpenChange={setActivityOpen}><DialogContent><DialogHeader><DialogTitle>Günlük Satış Faaliyeti Kaydet</DialogTitle></DialogHeader><div className="grid gap-4 md:grid-cols-2"><div><Label>Faaliyet türü</Label><select value={activityForm.activity_type} onChange={(e) => setActivityForm({ ...activityForm, activity_type: e.target.value as ActivityType })} className="mt-1 w-full rounded-md border px-3 py-2">{Object.entries(activityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><div><Label>Görüşme sonucu</Label><select value={activityForm.outcome} onChange={(e) => setActivityForm({ ...activityForm, outcome: e.target.value as ActivityOutcome })} className="mt-1 w-full rounded-md border px-3 py-2">{Object.entries(outcomeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><div><Label>İşlem tarihi ve saati</Label><Input type="datetime-local" value={activityForm.activity_at} onChange={(e) => setActivityForm({ ...activityForm, activity_at: e.target.value })} /></div><div><Label>Sonraki işlem tarihi</Label><Input type="datetime-local" value={activityForm.next_action_at} onChange={(e) => setActivityForm({ ...activityForm, next_action_at: e.target.value })} /></div><div className="md:col-span-2"><Label>Kısa görüşme özeti *</Label><Textarea value={activityForm.summary} onChange={(e) => setActivityForm({ ...activityForm, summary: e.target.value })} placeholder="Görüşülen konu, müşterinin ihtiyacı ve sonraki adımı yazın..." /></div></div><DialogFooter><Button variant="outline" onClick={() => setActivityOpen(false)}>Vazgeç</Button><Button onClick={() => void saveActivity()} disabled={submitting || activityForm.summary.trim().length < 3}>Kaydet</Button></DialogFooter></DialogContent></Dialog>

      <Dialog open={offerOpen} onOpenChange={setOfferOpen}><DialogContent><DialogHeader><DialogTitle>Teklif Oluştur</DialogTitle></DialogHeader><div className="grid gap-4 md:grid-cols-2"><div className="md:col-span-2"><Label>Teklif konusu *</Label><Input value={offerForm.subject} onChange={(e) => setOfferForm({ ...offerForm, subject: e.target.value })} /></div><div><Label>Tutar *</Label><Input type="number" min="0" step="0.01" value={offerForm.amount} onChange={(e) => setOfferForm({ ...offerForm, amount: e.target.value })} /></div><div><Label>Para birimi</Label><select value={offerForm.currency} onChange={(e) => setOfferForm({ ...offerForm, currency: e.target.value })} className="mt-1 w-full rounded-md border px-3 py-2">{["TRY","USD","EUR","GBP"].map((item) => <option key={item}>{item}</option>)}</select></div><div><Label>Durum</Label><select value={offerForm.status} onChange={(e) => setOfferForm({ ...offerForm, status: e.target.value as CrmOffer["status"] })} className="mt-1 w-full rounded-md border px-3 py-2"><option value="draft">Taslak</option><option value="sent">Gönderildi</option></select></div><div><Label>Geçerlilik tarihi</Label><Input type="date" value={offerForm.valid_until} onChange={(e) => setOfferForm({ ...offerForm, valid_until: e.target.value })} /></div><div className="md:col-span-2"><Label>Not</Label><Textarea value={offerForm.notes} onChange={(e) => setOfferForm({ ...offerForm, notes: e.target.value })} /></div></div><DialogFooter><Button variant="outline" onClick={() => setOfferOpen(false)}>Vazgeç</Button><Button className="bg-[#e96d25] hover:bg-[#d95e1d]" onClick={() => void saveOffer()} disabled={submitting || !offerForm.amount}>Teklifi Kaydet</Button></DialogFooter></DialogContent></Dialog>

      <Dialog open={prospectOpen} onOpenChange={setProspectOpen}><DialogContent><DialogHeader><DialogTitle>Yeni Potansiyel Müşteri</DialogTitle></DialogHeader><div className="grid gap-4 md:grid-cols-2"><div><Label>Firma adı *</Label><Input value={prospectForm.company_name} onChange={(e) => setProspectForm({ ...prospectForm, company_name: e.target.value })} /></div><div><Label>İlgili kişi</Label><Input value={prospectForm.contact_name} onChange={(e) => setProspectForm({ ...prospectForm, contact_name: e.target.value })} /></div><div><Label>Telefon</Label><Input value={prospectForm.phone} onChange={(e) => setProspectForm({ ...prospectForm, phone: e.target.value })} /></div><div><Label>E-posta</Label><Input type="email" value={prospectForm.email} onChange={(e) => setProspectForm({ ...prospectForm, email: e.target.value })} /></div><div><Label>Satış temsilcisi</Label><select value={prospectForm.assigned_to} onChange={(e) => setProspectForm({ ...prospectForm, assigned_to: e.target.value })} className="mt-1 w-full rounded-md border px-3 py-2"><option value="">Otomatik / kendim</option>{representatives.map((rep) => <option key={rep.user_id} value={rep.user_id}>{rep.full_name}</option>)}</select></div><div><Label>İlk takip tarihi</Label><Input type="datetime-local" value={prospectForm.next_action_at} onChange={(e) => setProspectForm({ ...prospectForm, next_action_at: e.target.value })} /></div><div className="md:col-span-2"><Label>Not</Label><Textarea value={prospectForm.notes} onChange={(e) => setProspectForm({ ...prospectForm, notes: e.target.value })} /></div></div><DialogFooter><Button variant="outline" onClick={() => setProspectOpen(false)}>Vazgeç</Button><Button onClick={() => void saveProspect()} disabled={submitting || !prospectForm.company_name.trim()}><Target className="mr-2 h-4 w-4" />Tanıtım Listesine Ekle</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
