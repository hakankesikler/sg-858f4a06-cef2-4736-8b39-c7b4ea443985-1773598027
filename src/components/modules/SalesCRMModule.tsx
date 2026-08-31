import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, BriefcaseBusiness, CalendarClock, CheckCircle2, ChevronRight, ClipboardList,
  FileSpreadsheet, Mail, MapPin, Phone, Plus, RefreshCw, Send, Settings2, Target, TrendingUp, UserCheck, Users,
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
import { downloadExcel } from "@/lib/excel";
import { GpslineDeliveryEstimator } from "@/components/GpslineDeliveryEstimator";
import {
  salesCrmService, type ActivityOutcome, type ActivityType, type CrmActivity,
  type CrmContact, type CrmNotification, type CrmOffer, type CrmOfferItem, type CrmOpportunity, type CrmStage, type CrmTask, type Customer360, type QuoteDetail,
  type CrmSettings, type CrmSupplier, type SalesPerformance, type SalesRepresentative,
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
const emptyOfferForm = () => ({
  subject: "Taşımacılık hizmet teklifi", currency: "TRY", status: "sent" as CrmOffer["status"], valid_until: "", notes: "",
  pickup_location: "", delivery_location: "", service_type: "Karayolu taşımacılığı", vehicle_type: "", cargo_description: "",
  supplier_id: "", collection_date: "", destination_district: "", estimated_delivery_date: "", transit_schedule_snapshot: null as Record<string, unknown> | null,
  weight_kg: "", pallet_count: "", cost_amount: "", vat_rate: "20", payment_terms: "", incoterm: "", exchange_rate: "",
  items: [{ description: "Taşıma hizmeti", quantity: 1, unit: "sefer", unit_price: 0, tax_rate: 20 }] as CrmOfferItem[],
});

export function SalesCRMModule({ permissions }: { permissions: PermissionMap }) {
  const { toast } = useToast();
  const canManage = hasPermission(permissions, "crm.sales_pipeline", "manage");
  const canCreateCustomer = hasPermission(permissions, "crm.customers", "manage");
  const canCreateJob = hasPermission(permissions, "sales.work_orders", "manage");
  const canExport = hasPermission(permissions, "crm.exports", "view");
  const canConfigure = hasPermission(permissions, "crm.settings", "manage");
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState<CrmOpportunity[]>([]);
  const [representatives, setRepresentatives] = useState<SalesRepresentative[]>([]);
  const [suppliers, setSuppliers] = useState<CrmSupplier[]>([]);
  const [performance, setPerformance] = useState<SalesPerformance[]>([]);
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [notifications, setNotifications] = useState<CrmNotification[]>([]);
  const [canApproveOffers, setCanApproveOffers] = useState(false);
  const [dateFrom, setDateFrom] = useState(today());
  const [dateTo, setDateTo] = useState(today());
  const [stageFilter, setStageFilter] = useState<CrmStage | "all">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CrmOpportunity | null>(null);
  const [activities, setActivities] = useState<CrmActivity[]>([]);
  const [offers, setOffers] = useState<CrmOffer[]>([]);
  const [quoteDetail, setQuoteDetail] = useState<QuoteDetail | null>(null);
  const [customer360, setCustomer360] = useState<Customer360 | null>(null);
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState<CrmTask | null>(null);
  const [offerOpen, setOfferOpen] = useState(false);
  const [prospectOpen, setProspectOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [crmSettings, setCrmSettings] = useState<CrmSettings | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activityForm, setActivityForm] = useState({ activity_type: "call" as ActivityType, outcome: "reached" as ActivityOutcome, summary: "", activity_at: localDateTime(), next_action_at: "" });
  const [offerForm, setOfferForm] = useState(emptyOfferForm);
  const [prospectForm, setProspectForm] = useState({ company_name: "", contact_name: "", email: "", phone: "", assigned_to: "", next_action_at: "", notes: "" });
  const [contactForm, setContactForm] = useState({ full_name: "", title: "", department: "", email: "", phone: "", preferred_channel: "email", is_decision_maker: false, is_primary: false, commercial_consent: false });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [opportunityRows, repRows, performanceRows, taskRows, ownerApproval, notificationRows, supplierRows] = await Promise.all([
        salesCrmService.listOpportunities(), salesCrmService.listRepresentatives(), salesCrmService.performance(dateFrom, dateTo), salesCrmService.listTasks(), salesCrmService.canApproveOffers(), salesCrmService.listNotifications(), salesCrmService.listSuppliers(),
      ]);
      setOpportunities(opportunityRows);
      setRepresentatives(repRows);
      setPerformance(performanceRows);
      setTasks(taskRows);
      setCanApproveOffers(ownerApproval);
      setNotifications(notificationRows);
      setSuppliers(supplierRows);
      if (selected) setSelected(opportunityRows.find((item) => item.id === selected.id) || null);
    } catch (error: any) {
      toast({ title: "CRM yüklenemedi", description: error?.message || "Satış verileri alınamadı.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  useEffect(() => { void loadAll(); }, [dateFrom, dateTo]);

  const totals = useMemo(() => performance.reduce((sum, item) => ({
    calls: sum.calls + Number(item.calls), visits: sum.visits + Number(item.visits), emails: sum.emails + Number(item.emails),
    meetings: sum.meetings + Number(item.customer_meetings), introductions: sum.introductions + Number(item.introductions),
    quotes: sum.quotes + Number(item.quotes_sent), won: sum.won + Number(item.won), lost: sum.lost + Number(item.lost),
    overdue: sum.overdue + Number(item.tasks_overdue), pipeline: sum.pipeline + Number(item.pipeline_value),
    forecast: sum.forecast + Number(item.weighted_forecast), wonValue: sum.wonValue + Number(item.won_value),
  }), { calls: 0, visits: 0, emails: 0, meetings: 0, introductions: 0, quotes: 0, won: 0, lost: 0, overdue: 0, pipeline: 0, forecast: 0, wonValue: 0 }), [performance]);

  const stageCounts = useMemo(() => opportunities.reduce((result, item) => ({ ...result, [item.stage]: (result[item.stage] || 0) + 1 }), {} as Record<CrmStage, number>), [opportunities]);
  const filtered = useMemo(() => opportunities.filter((item) => {
    if (stageFilter !== "all" && item.stage !== stageFilter) return false;
    const needle = search.trim().toLocaleLowerCase("tr-TR");
    return !needle || [item.company_name, item.contact_name, item.email, item.phone].some((value) => value?.toLocaleLowerCase("tr-TR").includes(needle));
  }), [opportunities, search, stageFilter]);

  const repName = (id?: string | null) => representatives.find((item) => item.user_id === id)?.full_name || (id ? "Atanmış temsilci" : "Atanmadı");

  const openDetail = async (item: CrmOpportunity) => {
    setSelected(item); setDetailOpen(true); setQuoteDetail(null); setCustomer360(null);
    try {
      const [activityRows, offerRows, quote] = await Promise.all([
        salesCrmService.listActivities(item.id), salesCrmService.listOffers(item.id),
        item.quote_request_id ? salesCrmService.getQuoteDetail(item.quote_request_id) : Promise.resolve(null),
      ]);
      setActivities(activityRows); setOffers(offerRows); setQuoteDetail(quote);
      if (item.customer_id) {
        const [summary, contactRows] = await Promise.all([salesCrmService.customer360(item.customer_id), salesCrmService.listContacts(item.customer_id)]);
        setCustomer360(summary); setContacts(contactRows);
      } else setContacts([]);
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
      const activity = { ...activityForm, activity_at: new Date(activityForm.activity_at).toISOString(), next_action_at: activityForm.next_action_at ? new Date(activityForm.next_action_at).toISOString() : null };
      if (taskToComplete) await salesCrmService.completeTask(taskToComplete.id, activity);
      else await salesCrmService.addActivity({ opportunity_id: selected.id, customer_id: selected.customer_id, ...activity });
      toast({ title: taskToComplete ? "Görev sonucu kaydedildi" : "Faaliyet kaydedildi", description: `${activityLabels[activityForm.activity_type]} CRM geçmişine eklendi.` });
      setActivityOpen(false); setTaskToComplete(null); setActivityForm({ activity_type: "call", outcome: "reached", summary: "", activity_at: localDateTime(), next_action_at: "" });
      await refreshDetail();
    } catch (error: any) { toast({ title: "Faaliyet kaydedilemedi", description: error?.message, variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  const saveOffer = async () => {
    const amount = offerForm.items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0), 0);
    if (!selected || !offerForm.subject.trim() || !offerForm.items.length || amount <= 0) return;
    setSubmitting(true);
    try {
      const shouldSend = offerForm.status === "sent";
      const created = await salesCrmService.createOffer({ opportunity_id: selected.id, quote_request_id: selected.quote_request_id,
        customer_id: selected.customer_id, subject: offerForm.subject.trim(), amount, currency: offerForm.currency,
        status: "draft", valid_until: offerForm.valid_until || null, notes: offerForm.notes || null,
        pickup_location: offerForm.pickup_location || quoteDetail?.loading_point || null,
        delivery_location: offerForm.delivery_location || quoteDetail?.delivery_point || null,
        supplier_id: offerForm.supplier_id || null, collection_date: offerForm.collection_date || null,
        destination_district: offerForm.destination_district || null, estimated_delivery_date: offerForm.estimated_delivery_date || null,
        transit_schedule_snapshot: offerForm.transit_schedule_snapshot,
        service_type: offerForm.service_type || null, vehicle_type: offerForm.vehicle_type || null,
        cargo_description: offerForm.cargo_description || null, weight_kg: offerForm.weight_kg ? Number(offerForm.weight_kg) : null,
        pallet_count: offerForm.pallet_count ? Number(offerForm.pallet_count) : null, cost_amount: Number(offerForm.cost_amount || 0),
        vat_rate: Number(offerForm.vat_rate || 20), payment_terms: offerForm.payment_terms || null, incoterm: offerForm.incoterm || null,
        exchange_rate: offerForm.currency === "TRY" ? null : Number(offerForm.exchange_rate || 0), items: offerForm.items });
      if (shouldSend && created.approval_status !== "pending") await salesCrmService.sendOffer(created.id, selected.email || undefined);
      toast({ title: shouldSend && created.approval_status !== "pending" ? "Teklif e-posta ile gönderildi" : created.approval_status === "pending" ? "Teklif yönetici onayına gönderildi" : "Teklif taslağı kaydedildi", description: created.offer_no });
      setOfferOpen(false); setOfferForm(emptyOfferForm());
      await refreshDetail();
    } catch (error: any) { toast({ title: "Teklif kaydedilemedi", description: error?.message, variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  const saveProspect = async () => {
    if (!prospectForm.company_name.trim()) return;
    setSubmitting(true);
    try {
      const duplicates = await salesCrmService.findDuplicates(prospectForm.company_name, prospectForm.email, prospectForm.phone);
      if (duplicates.length && !window.confirm(`${duplicates.length} benzer müşteri veya satış kaydı bulundu. Yine de yeni kayıt oluşturulsun mu?`)) return;
      await salesCrmService.createOpportunity({ ...prospectForm, next_action_at: prospectForm.next_action_at ? new Date(prospectForm.next_action_at).toISOString() : null });
      toast({ title: "Potansiyel müşteri eklendi", description: "Tanıtım yapılacaklar listesine kaydedildi." });
      setProspectOpen(false); setProspectForm({ company_name: "", contact_name: "", email: "", phone: "", assigned_to: "", next_action_at: "", notes: "" });
      await loadAll();
    } catch (error: any) { toast({ title: "Kayıt oluşturulamadı", description: error?.message, variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  const completeTask = (task: CrmTask) => {
    const opportunity = opportunities.find((item) => item.id === task.opportunity_id);
    if (!opportunity) return;
    setSelected(opportunity);
    setTaskToComplete(task);
    setActivityForm({
      activity_type: task.task_type === "visit" ? "visit" : task.task_type === "email" ? "email" : "call",
      outcome: task.task_type === "quote" ? "quote_sent" : "reached",
      summary: "",
      activity_at: localDateTime(),
      next_action_at: "",
    });
    setActivityOpen(true);
  };

  const sendOffer = async (offer: CrmOffer) => {
    setSubmitting(true);
    try { await salesCrmService.sendOffer(offer.id, selected?.email || undefined); toast({ title: "Teklif müşteriye gönderildi", description: offer.offer_no }); await refreshDetail(); }
    catch (error: any) { toast({ title: "Teklif gönderilemedi", description: error?.message, variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  const reviewOffer = async (offer: CrmOffer, decision: "approve" | "reject") => {
    const note = decision === "reject" ? window.prompt("Ret nedenini yazın:") || "" : "";
    if (decision === "reject" && note.trim().length < 3) return;
    setSubmitting(true);
    try { await salesCrmService.reviewOffer(offer.id, decision, note); toast({ title: decision === "approve" ? "Teklif onaylandı" : "Teklif reddedildi" }); await refreshDetail(); }
    catch (error: any) { toast({ title: "Onay işlemi yapılamadı", description: error?.message, variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  const reviseOffer = async (offer: CrmOffer) => {
    const reason = window.prompt("Revizyon nedenini yazın:") || "";
    if (reason.trim().length < 3) return;
    setSubmitting(true);
    try { await salesCrmService.createOfferRevision(offer.id, reason.trim()); toast({ title: "Teklif revizyonu oluşturuldu" }); await refreshDetail(); }
    catch (error: any) { toast({ title: "Revizyon oluşturulamadı", description: error?.message, variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  const decideOffer = async (offer: CrmOffer, decision: "accepted" | "rejected" | "cancelled") => {
    const actorName = decision === "cancelled" ? "REX Lojistik" : window.prompt("Kararı veren müşteri yetkilisinin adı:") || "";
    if (decision !== "cancelled" && actorName.trim().length < 2) return;
    const channel = decision === "cancelled" ? "internal" : window.prompt("Onay/ret kanalı (e-posta, telefon, imzalı belge):", "e-posta") || "";
    const reason = decision === "accepted" ? "" : window.prompt(decision === "rejected" ? "Ret nedenini yazın:" : "İptal nedenini yazın:") || "";
    if (decision !== "accepted" && reason.trim().length < 3) return;
    setSubmitting(true);
    try { await salesCrmService.decideOffer(offer.id, decision, actorName.trim(), channel.trim(), reason.trim()); toast({ title: decision === "accepted" ? "Teklif kabul edildi" : decision === "rejected" ? "Teklif reddedildi" : "Teklif iptal edildi" }); await refreshDetail(); }
    catch (error: any) { toast({ title: "Teklif sonucu kaydedilemedi", description: error?.message, variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  const exportSales = async () => {
    await downloadExcel(`REX_CRM_${dateFrom}_${dateTo}.xlsx`, opportunities.map((item) => ({
      Firma: item.company_name, Yetkili: item.contact_name || "", Telefon: item.phone || "", "E-posta": item.email || "",
      Aşama: stageConfig[item.stage].label, Temsilci: repName(item.assigned_to), "Sonraki İşlem": readableDate(item.next_action_at),
      "Tahmini Değer": item.estimated_value || 0, "Para Birimi": item.currency, Kaynak: item.source,
    })), "Satış CRM");
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

  const openSettings = async () => {
    try { setCrmSettings(await salesCrmService.getSettings()); setSettingsOpen(true); }
    catch (error: any) { toast({ title: "CRM ayarları yüklenemedi", description: error?.message, variant: "destructive" }); }
  };

  const saveSettings = async () => {
    if (!crmSettings) return;
    setSubmitting(true);
    try { await salesCrmService.updateSettings(crmSettings); toast({ title: "CRM ayarları güncellendi" }); setSettingsOpen(false); }
    catch (error: any) { toast({ title: "Ayarlar kaydedilemedi", description: error?.message, variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  const saveContact = async () => {
    if (!selected?.customer_id || contactForm.full_name.trim().length < 2) return;
    setSubmitting(true);
    try {
      const normalized = { ...contactForm, title: contactForm.title || null, department: contactForm.department || null,
        email: contactForm.email || null, phone: contactForm.phone || null, preferred_channel: contactForm.preferred_channel || null };
      if (editingContactId) await salesCrmService.updateContact(editingContactId, normalized);
      else await salesCrmService.createContact({ customer_id: selected.customer_id, opportunity_id: selected.id, ...normalized });
      toast({ title: editingContactId ? "Müşteri yetkilisi güncellendi" : "Müşteri yetkilisi eklendi" }); setContactOpen(false); setEditingContactId(null);
      setContactForm({ full_name: "", title: "", department: "", email: "", phone: "", preferred_channel: "email", is_decision_maker: false, is_primary: false, commercial_consent: false });
      await refreshDetail();
    } catch (error: any) { toast({ title: "Yetkili kaydedilemedi", description: error?.message, variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  const editContact = (contact: CrmContact) => {
    setEditingContactId(contact.id);
    setContactForm({ full_name: contact.full_name, title: contact.title || "", department: contact.department || "", email: contact.email || "", phone: contact.phone || "", preferred_channel: contact.preferred_channel || "email", is_decision_maker: contact.is_decision_maker, is_primary: contact.is_primary, commercial_consent: contact.commercial_consent });
    setContactOpen(true);
  };

  const deactivateContact = async (contact: CrmContact) => {
    if (!window.confirm(`${contact.full_name} aktif müşteri yetkilileri listesinden çıkarılsın mı?`)) return;
    await salesCrmService.updateContact(contact.id, { active: false });
    await refreshDetail();
  };

  const readNotification = async (notification: CrmNotification) => {
    await salesCrmService.markNotificationRead(notification.id);
    setNotifications((rows) => rows.filter((item) => item.id !== notification.id));
    const opportunity = opportunities.find((item) => item.id === notification.opportunity_id);
    if (opportunity) await openDetail(opportunity);
  };

  if (loading && opportunities.length === 0) return <div className="p-10 text-center text-slate-500">Satış CRM hazırlanıyor...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e96d25]">Satış çalışma alanı</p><h1 className="mt-1 text-3xl font-bold text-[#10213e]">Müşteri Görüşmeleri ve Teklif Süreci</h1><p className="mt-1 text-slate-600">İlk temastan ilk işin resmî faturasına kadar tüm satış sürecini yönetin.</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="w-40 bg-white" />
          <span className="text-slate-400">—</span><Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="w-40 bg-white" />
          {canExport && <Button variant="outline" onClick={() => void exportSales()} disabled={!opportunities.length}><FileSpreadsheet className="mr-2 h-4 w-4" />Excel</Button>}
          <Button variant="outline" onClick={() => void loadAll()}><RefreshCw className="mr-2 h-4 w-4" />Yenile</Button>
          {canConfigure && <Button variant="outline" onClick={() => void openSettings()}><Settings2 className="mr-2 h-4 w-4" />CRM Ayarları</Button>}
          {canManage && <Button className="bg-[#e96d25] hover:bg-[#d95e1d]" onClick={() => setProspectOpen(true)}><Plus className="mr-2 h-4 w-4" />Yeni Potansiyel</Button>}
        </div>
      </div>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>CRM Otomasyon ve Onay Ayarları</DialogTitle></DialogHeader>
          {crmSettings && <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-3 rounded-lg border p-3 md:col-span-2"><input type="checkbox" checked={crmSettings.automatic_assignment} onChange={(e) => setCrmSettings({ ...crmSettings, automatic_assignment: e.target.checked })} /><span><strong>Otomatik temsilci ataması</strong><span className="block text-xs text-slate-500">Yeni web taleplerini uygun satış temsilcisine dağıtır.</span></span></label>
            <div><Label>İlk yanıt SLA (dakika)</Label><Input type="number" min="15" max="10080" value={crmSettings.response_sla_minutes} onChange={(e) => setCrmSettings({ ...crmSettings, response_sla_minutes: Number(e.target.value) })} /></div>
            <div><Label>Teklif takip süresi (gün)</Label><Input type="number" min="1" max="30" value={crmSettings.offer_follow_up_days} onChange={(e) => setCrmSettings({ ...crmSettings, offer_follow_up_days: Number(e.target.value) })} /></div>
            <div><Label>TRY onay limiti</Label><Input type="number" min="0" value={crmSettings.approval_threshold_try} onChange={(e) => setCrmSettings({ ...crmSettings, approval_threshold_try: Number(e.target.value) })} /></div>
            <div><Label>USD onay limiti</Label><Input type="number" min="0" value={crmSettings.approval_threshold_usd} onChange={(e) => setCrmSettings({ ...crmSettings, approval_threshold_usd: Number(e.target.value) })} /></div>
            <div><Label>EUR onay limiti</Label><Input type="number" min="0" value={crmSettings.approval_threshold_eur} onChange={(e) => setCrmSettings({ ...crmSettings, approval_threshold_eur: Number(e.target.value) })} /></div>
            <div><Label>GBP onay limiti</Label><Input type="number" min="0" value={crmSettings.approval_threshold_gbp} onChange={(e) => setCrmSettings({ ...crmSettings, approval_threshold_gbp: Number(e.target.value) })} /></div>
            <div className="md:col-span-2"><Label>Asgari brüt marj (%)</Label><Input type="number" min="-100" max="100" step="0.1" value={crmSettings.minimum_margin_percent} onChange={(e) => setCrmSettings({ ...crmSettings, minimum_margin_percent: Number(e.target.value) })} /><p className="mt-1 text-xs text-slate-500">Bu oranın altındaki teklifler tutardan bağımsız olarak şirket sahibi onayına düşer.</p></div>
          </div>}
          <DialogFooter><Button variant="outline" onClick={() => setSettingsOpen(false)}>Vazgeç</Button><Button onClick={() => void saveSettings()} disabled={submitting || !crmSettings}>Kaydet</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {notifications.length > 0 && <Card className="border-amber-200 bg-amber-50/70 p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3"><div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-700" /><div><h2 className="font-bold text-[#10213e]">CRM Uyarıları</h2><p className="text-xs text-slate-600">Geciken görevler ve süresi yaklaşan teklifler</p></div></div><Badge className="bg-amber-700 text-white">{notifications.length}</Badge></div>
        <div className="grid gap-2 lg:grid-cols-2">{notifications.slice(0, 6).map((notification) => <button key={notification.id} onClick={() => void readNotification(notification)} className={`rounded-xl border bg-white p-3 text-left transition hover:shadow-sm ${notification.severity === "critical" ? "border-red-200" : "border-amber-200"}`}><p className="font-semibold text-[#10213e]">{notification.title}</p><p className="mt-1 text-sm text-slate-600">{notification.message}</p><p className="mt-1 text-xs text-slate-400">{readableDate(notification.created_at)}</p></button>)}</div>
      </Card>}

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

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-slate-200 p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Açık satış havuzu</p><p className="mt-2 text-2xl font-bold text-[#10213e]">{money(totals.pipeline, "TRY")}</p><p className="mt-1 text-xs text-slate-500">Tekliflerin kur karşılığıyla TL toplamı</p></Card>
        <Card className="border-violet-200 bg-violet-50/50 p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Ağırlıklı tahmin</p><p className="mt-2 text-2xl font-bold text-violet-900">{money(totals.forecast, "TRY")}</p><p className="mt-1 text-xs text-violet-700">Aşama olasılıklarıyla beklenen gelir</p></Card>
        <Card className="border-emerald-200 bg-emerald-50/50 p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Kazanılan değer</p><p className="mt-2 text-2xl font-bold text-emerald-900">{money(totals.wonValue, "TRY")}</p><p className="mt-1 text-xs text-emerald-700">Seçili tarih aralığında faturaya dönen</p></Card>
        <Card className={`${totals.overdue ? "border-red-200 bg-red-50/50" : "border-slate-200"} p-4 shadow-sm`}><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Geciken görev</p><p className={`mt-2 text-2xl font-bold ${totals.overdue ? "text-red-700" : "text-[#10213e]"}`}>{totals.overdue}</p><p className="mt-1 text-xs text-slate-500">Sonuç girilmemiş süresi geçmiş görev</p></Card>
      </div>

      <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-2"><CalendarClock className="h-5 w-5 text-[#e96d25]" /><h2 className="text-xl font-bold text-[#10213e]">Bugünün Satış Görevleri</h2></div><p className="mt-1 text-sm text-slate-600">Web talepleri, aramalar ve teklif takipleri otomatik sıraya alınır.</p></div><Badge className="bg-[#10213e] text-white">{tasks.length} açık görev</Badge></div>
        <div className="grid gap-3 lg:grid-cols-2">{tasks.slice(0, 8).map((task) => { const opportunity = opportunities.find((item) => item.id === task.opportunity_id); const overdue = new Date(task.due_at).getTime() < Date.now(); return <div key={task.id} className={`flex items-center justify-between gap-3 rounded-xl border bg-white p-4 ${overdue ? "border-red-200" : "border-slate-200"}`}><button className="min-w-0 flex-1 text-left" onClick={() => opportunity && void openDetail(opportunity)}><div className="flex items-center gap-2"><p className="truncate font-semibold text-[#10213e]">{task.title}</p>{overdue && <Badge className="bg-red-100 text-red-700"><AlertTriangle className="mr-1 h-3 w-3" />Gecikti</Badge>}</div><p className="mt-1 text-xs text-slate-500">{readableDate(task.due_at)} · {repName(task.assigned_to)}</p></button>{canManage && <Button size="sm" variant="outline" onClick={() => completeTask(task)}><CheckCircle2 className="mr-1 h-4 w-4" />Sonuç Gir</Button>}</div>; })}{tasks.length === 0 && <p className="col-span-2 rounded-xl border border-dashed bg-white p-6 text-center text-sm text-slate-500">Açık satış görevi bulunmuyor.</p>}</div>
      </Card>

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

      <Card className="border-slate-200 p-5 shadow-sm"><div className="mb-4 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-[#e96d25]" /><h2 className="text-xl font-bold text-[#10213e]">Satış Temsilcisi Performansı</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[1250px] text-sm"><thead><tr className="border-b text-left text-xs uppercase tracking-wide text-slate-500"><th className="py-3">Temsilci</th><th>Arama</th><th>Ziyaret</th><th>Görüşme</th><th>E-posta</th><th>Teklif</th><th>Kazanılan</th><th>Kaybedilen</th><th>Dönüşüm</th><th>Geciken</th><th>Satış döngüsü</th><th>Ort. marj</th><th>Ağırlıklı tahmin</th></tr></thead><tbody>{performance.map((item) => { const conversion = Number(item.quotes_sent) ? Math.round(Number(item.won) / Number(item.quotes_sent) * 100) : 0; return <tr key={item.user_id} className="border-b last:border-0"><td className="py-4"><p className="font-semibold text-[#10213e]">{item.full_name}</p><p className="text-xs text-slate-500">{item.email}</p></td><td>{item.calls}</td><td>{item.visits}</td><td>{item.customer_meetings}</td><td>{item.emails}</td><td>{item.quotes_sent}</td><td className="font-bold text-emerald-700">{item.won}</td><td>{item.lost}</td><td>%{conversion}</td><td className={Number(item.tasks_overdue) ? "font-bold text-red-700" : ""}>{item.tasks_overdue}</td><td>{Number(item.avg_sales_cycle_days).toFixed(1)} gün</td><td>%{Number(item.avg_margin_percent).toFixed(1)}</td><td>{money(Number(item.weighted_forecast), "TRY")}</td></tr>; })}</tbody></table></div></Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}><DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto"><DialogHeader><DialogTitle className="flex flex-wrap items-center gap-3 text-2xl text-[#10213e]">{selected?.company_name}{selected && <Badge variant="outline" className={stageConfig[selected.stage].color}>{stageConfig[selected.stage].label}</Badge>}</DialogTitle></DialogHeader>{selected && <div className="space-y-6">
        <div className="grid gap-4 rounded-2xl bg-slate-50 p-4 md:grid-cols-3"><div><p className="text-xs font-semibold uppercase text-slate-500">İlgili kişi</p><p className="mt-1 font-medium">{selected.contact_name || "-"}</p><p className="text-sm text-slate-500">{selected.phone || "-"} · {selected.email || "-"}</p></div><div><p className="text-xs font-semibold uppercase text-slate-500">Satış temsilcisi</p>{canManage ? <select value={selected.assigned_to || ""} onChange={(event) => void updateOpportunity({ assigned_to: event.target.value || null }, "Satış temsilcisi güncellendi")} className="mt-1 w-full rounded-md border bg-white px-3 py-2"><option value="">Atanmadı</option>{representatives.map((rep) => <option key={rep.user_id} value={rep.user_id}>{rep.full_name}</option>)}</select> : <p className="mt-1">{repName(selected.assigned_to)}</p>}</div><div><p className="text-xs font-semibold uppercase text-slate-500">Sonraki işlem</p><p className="mt-1 font-medium">{readableDate(selected.next_action_at)}</p><p className="text-sm text-slate-500">Tahmini değer: {money(selected.estimated_value, selected.currency)}</p></div></div>
        {customer360 && <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5"><h3 className="mb-3 font-bold text-[#10213e]">Müşteri 360°</h3><div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4"><div><p className="text-slate-500">İş / Sevkiyat</p><p className="text-lg font-bold">{customer360.job_count || 0} / {customer360.shipment_count || 0}</p></div><div><p className="text-slate-500">Teslim edilen</p><p className="text-lg font-bold text-emerald-700">{customer360.delivered_count || 0}</p></div><div><p className="text-slate-500">Faturalanan</p><p className="text-lg font-bold">{money(customer360.invoiced_total || 0, selected.currency)}</p></div><div><p className="text-slate-500">Açık bakiye / İstisna</p><p className="text-lg font-bold text-orange-700">{money(customer360.outstanding_total || 0, selected.currency)} · {customer360.exception_count || 0}</p></div></div></div>}
        {selected.customer_id && <div className="rounded-2xl border border-slate-200 p-5"><div className="mb-3 flex items-center justify-between gap-3"><div><h3 className="font-bold text-[#10213e]">Müşteri Yetkilileri</h3><p className="text-xs text-slate-500">Karar verici, iletişim tercihi ve ticari ileti onayı ayrı kaydedilir.</p></div>{canCreateCustomer && <Button size="sm" variant="outline" onClick={() => { setEditingContactId(null); setContactForm({ full_name: "", title: "", department: "", email: "", phone: "", preferred_channel: "email", is_decision_maker: false, is_primary: false, commercial_consent: false }); setContactOpen(true); }}><Plus className="mr-1 h-4 w-4" />Yetkili Ekle</Button>}</div><div className="grid gap-2 md:grid-cols-2">{contacts.map((contact) => <div key={contact.id} className="rounded-xl border bg-slate-50 p-3"><div className="flex items-start justify-between gap-2"><div><p className="font-semibold text-[#10213e]">{contact.full_name}</p><p className="text-xs text-slate-500">{contact.title || contact.department || "Görev belirtilmedi"}</p></div><div className="flex items-center gap-1">{contact.is_decision_maker && <Badge className="bg-violet-100 text-violet-800">Karar verici</Badge>}{canCreateCustomer && <button className="rounded p-1 text-slate-500 hover:bg-white" onClick={() => editContact(contact)} title="Yetkiliyi düzenle"><Settings2 className="h-4 w-4" /></button>}{canCreateCustomer && <button className="rounded p-1 text-amber-700 hover:bg-white" onClick={() => void deactivateContact(contact)} title="Yetkiliyi pasife al">×</button>}</div></div><p className="mt-2 text-xs text-slate-600">{contact.phone || "-"} · {contact.email || "-"}</p><p className="mt-1 text-xs text-slate-500">Tercih: {contact.preferred_channel || "belirtilmedi"} · Ticari ileti: {contact.commercial_consent ? "Onaylı" : "Onaysız"}</p></div>)}{contacts.length === 0 && <p className="rounded-xl border border-dashed p-4 text-center text-sm text-slate-500 md:col-span-2">Henüz müşteri yetkilisi eklenmedi.</p>}</div></div>}
        {quoteDetail && <div className="rounded-2xl border border-orange-200 bg-orange-50/70 p-5"><div className="mb-3 flex items-center gap-2"><ClipboardList className="h-5 w-5 text-[#e96d25]" /><h3 className="font-bold text-[#10213e]">Web Sitesinden Alınan Teklif Talebi</h3></div><div className="grid gap-3 text-sm md:grid-cols-3"><div><span className="text-slate-500">Taşıma:</span><p className="font-medium">{quoteDetail.service_type === "domestic" ? "Yurtiçi" : "Uluslararası"} · {quoteDetail.transport_mode === "road" ? "Karayolu" : quoteDetail.transport_mode === "air" ? "Havayolu" : "Denizyolu"}</p></div><div><span className="text-slate-500">Güzergâh:</span><p className="font-medium">{quoteDetail.loading_point} → {quoteDetail.delivery_point}</p></div><div><span className="text-slate-500">Yük kalemi:</span><p className="font-medium">{quoteDetail.cargos?.length || 0} kalem</p></div></div>{quoteDetail.special_requirements && <p className="mt-3 rounded-lg bg-white p-3 text-sm">{quoteDetail.special_requirements}</p>}</div>}
        {canManage && <div className="flex flex-wrap gap-2"><Button onClick={() => setActivityOpen(true)}><Phone className="mr-2 h-4 w-4" />Faaliyet Kaydet</Button><Button className="bg-[#e96d25] hover:bg-[#d95e1d]" onClick={() => setOfferOpen(true)}><ClipboardList className="mr-2 h-4 w-4" />Teklif Oluştur</Button>{!selected.customer_id && canCreateCustomer && <Button variant="outline" onClick={() => void convertCustomer()} disabled={submitting}><Users className="mr-2 h-4 w-4" />Cari Oluştur</Button>}{selected.quote_request_id && selected.customer_id && !selected.first_job_id && canCreateJob && <Button variant="outline" onClick={() => void createJob()} disabled={submitting}><BriefcaseBusiness className="mr-2 h-4 w-4" />İş Emrine Dönüştür</Button>}{selected.first_job_id && <Badge className="px-3 py-2 bg-blue-100 text-blue-800">İlk iş emri oluşturuldu</Badge>}{selected.first_invoice_id && <Badge className="px-3 py-2 bg-emerald-100 text-emerald-800">İlk resmî fatura kesildi</Badge>}</div>}
        {canManage && selected.stage !== "won" && <div className="flex flex-wrap gap-2">{selected.stage !== "lost" ? <Button variant="outline" className="text-slate-600" onClick={() => { const reason = window.prompt("Bu satışın kaybedilme nedenini yazın:") || ""; if (reason.trim().length >= 3) void updateOpportunity({ stage: "lost", lost_reason: reason.trim() }, "Kayıp nedeni kaydedildi"); }}><AlertTriangle className="mr-2 h-4 w-4" />Kaybedildi Olarak İşaretle</Button> : <Button variant="outline" onClick={() => void updateOpportunity({ stage: "introduction", lost_reason: null }, "Kayıt yeniden tanıtım aşamasına alındı")}>Yeniden Tanıtıma Al</Button>}</div>}
        <div className="grid gap-6 lg:grid-cols-2">
          <div><h3 className="mb-3 font-bold text-[#10213e]">Görüşme ve Faaliyet Geçmişi</h3><div className="space-y-3">{activities.length === 0 && <p className="rounded-xl border border-dashed p-5 text-center text-sm text-slate-500">Henüz faaliyet kaydı yok.</p>}{activities.map((item) => <div key={item.id} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{activityLabels[item.activity_type]} · {outcomeLabels[item.outcome]}</p><p className="mt-1 text-sm text-slate-600">{item.summary}</p></div><span className="whitespace-nowrap text-xs text-slate-500">{readableDate(item.activity_at)}</span></div>{item.next_action_at && <p className="mt-2 text-xs font-medium text-orange-700">Sonraki işlem: {readableDate(item.next_action_at)}</p>}</div>)}</div></div>
          <div><h3 className="mb-3 font-bold text-[#10213e]">Verilen Teklifler</h3><div className="space-y-3">{offers.length === 0 && <p className="rounded-xl border border-dashed p-5 text-center text-sm text-slate-500">Henüz teklif oluşturulmadı.</p>}{offers.map((item) => {
            const margin = item.amount > 0 ? Math.round(((item.amount - Number(item.cost_amount || 0)) / item.amount) * 100) : 0;
            const statusLabel = item.approval_status === "pending" ? "Yönetici onayı bekliyor" : item.status === "draft" ? "Taslak" : item.status === "sent" ? "Müşteri kararı bekleniyor" : item.status === "accepted" ? "Kabul edildi" : item.status === "rejected" ? "Reddedildi" : item.status === "cancelled" ? "İptal edildi" : "Süresi doldu";
            return <div key={item.id} className="rounded-xl border border-slate-200 p-4"><div className="flex justify-between gap-3"><div><p className="font-semibold">{item.offer_no} · R{item.revision_no || 1} / V{item.version_no || 1}</p><p className="text-sm text-slate-600">{item.subject}</p></div><Badge variant="outline">{statusLabel}</Badge></div>{item.pickup_location && <p className="mt-2 text-xs text-slate-500">{item.pickup_location} → {item.delivery_location || "-"}</p>}<div className="mt-3 flex items-end justify-between"><p className="text-lg font-bold text-[#10213e]">{money(item.amount, item.currency)}</p><p className={`text-xs font-semibold ${margin < 8 ? "text-red-600" : "text-emerald-700"}`}>Marj %{margin}</p></div><p className="text-xs text-slate-500">{item.email_sent_at ? `Gönderim: ${readableDate(item.email_sent_at)}` : item.email_error ? `Hata: ${item.email_error}` : "Henüz gönderilmedi"}</p>
              {canApproveOffers && item.approval_status === "pending" && <div className="mt-3 flex gap-2"><Button size="sm" onClick={() => void reviewOffer(item, "approve")} disabled={submitting}>Onayla</Button><Button size="sm" variant="outline" onClick={() => void reviewOffer(item, "reject")} disabled={submitting}>Reddet</Button></div>}
              {!canApproveOffers && item.approval_status === "pending" && <p className="mt-2 text-xs font-medium text-orange-700">Şirket sahibi onayı bekleniyor.</p>}
              {canManage && ["not_required","approved"].includes(item.approval_status) && item.email_status !== "sent" && <Button size="sm" className="mt-3 bg-[#e96d25] hover:bg-[#d95e1d]" onClick={() => void sendOffer(item)} disabled={submitting}><Send className="mr-2 h-4 w-4" />E-posta ile Gönder</Button>}
              {canManage && item.status === "sent" && <div className="mt-3 flex flex-wrap gap-2"><Button size="sm" onClick={() => void decideOffer(item, "accepted")}>Kabul</Button><Button size="sm" variant="outline" onClick={() => void decideOffer(item, "rejected")}>Ret</Button><Button size="sm" variant="outline" onClick={() => void reviseOffer(item)}>Revizyon</Button><Button size="sm" variant="ghost" onClick={() => void decideOffer(item, "cancelled")}>İptal</Button></div>}
              {canManage && ["accepted","rejected","expired","cancelled"].includes(item.status) && <Button size="sm" variant="outline" className="mt-3" onClick={() => void reviseOffer(item)}>Yeni Revizyon Oluştur</Button>}
              {item.decision_at && <p className="mt-2 text-xs text-slate-500">Karar: {item.decision_by_name || "-"} · {item.decision_channel || "-"} · {readableDate(item.decision_at)}</p>}
            </div>;
          })}</div></div>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><strong>Kazanılma kuralı:</strong> Bu kayıt elle “Kazanıldı” yapılamaz. İlk iş emri onaylanıp sevkiyat tamamlandıktan ve KolayBi üzerinden resmî e-fatura/e-arşiv oluştuğunda sistem otomatik taşır.</div>
      </div>}</DialogContent></Dialog>

      <Dialog open={contactOpen} onOpenChange={(open) => { setContactOpen(open); if (!open) setEditingContactId(null); }}><DialogContent><DialogHeader><DialogTitle>{editingContactId ? "Müşteri Yetkilisini Düzenle" : "Müşteri Yetkilisi Ekle"}</DialogTitle></DialogHeader><div className="grid gap-4 md:grid-cols-2"><div className="md:col-span-2"><Label>Ad soyad *</Label><Input value={contactForm.full_name} onChange={(e) => setContactForm({ ...contactForm, full_name: e.target.value })} /></div><div><Label>Görevi / ünvanı</Label><Input value={contactForm.title} onChange={(e) => setContactForm({ ...contactForm, title: e.target.value })} /></div><div><Label>Departman</Label><Input value={contactForm.department} onChange={(e) => setContactForm({ ...contactForm, department: e.target.value })} /></div><div><Label>E-posta</Label><Input type="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} /></div><div><Label>Telefon</Label><Input value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} /></div><div><Label>Tercih edilen kanal</Label><select value={contactForm.preferred_channel} onChange={(e) => setContactForm({ ...contactForm, preferred_channel: e.target.value })} className="mt-1 w-full rounded-md border px-3 py-2"><option value="email">E-posta</option><option value="phone">Telefon</option><option value="whatsapp">WhatsApp</option><option value="meeting">Yüz yüze görüşme</option></select></div><div className="space-y-2 pt-6"><label className="flex items-center gap-2"><input type="checkbox" checked={contactForm.is_decision_maker} onChange={(e) => setContactForm({ ...contactForm, is_decision_maker: e.target.checked })} />Karar verici</label><label className="flex items-center gap-2"><input type="checkbox" checked={contactForm.is_primary} onChange={(e) => setContactForm({ ...contactForm, is_primary: e.target.checked })} />Birincil yetkili</label><label className="flex items-center gap-2"><input type="checkbox" checked={contactForm.commercial_consent} onChange={(e) => setContactForm({ ...contactForm, commercial_consent: e.target.checked })} />Ticari ileti onayı mevcut</label></div></div><DialogFooter><Button variant="outline" onClick={() => setContactOpen(false)}>Vazgeç</Button><Button onClick={() => void saveContact()} disabled={submitting || contactForm.full_name.trim().length < 2 || (!contactForm.email.trim() && !contactForm.phone.trim())}>Kaydet</Button></DialogFooter></DialogContent></Dialog>

      <Dialog open={activityOpen} onOpenChange={(open) => { setActivityOpen(open); if (!open) setTaskToComplete(null); }}><DialogContent><DialogHeader><DialogTitle>{taskToComplete ? "Görev Sonucunu Kaydet" : "Günlük Satış Faaliyeti Kaydet"}</DialogTitle></DialogHeader>{taskToComplete && <p className="rounded-lg bg-orange-50 p-3 text-sm text-orange-900">Görev ancak sonuç ve görüşme özetiyle tamamlanacaktır: <strong>{taskToComplete.title}</strong></p>}<div className="grid gap-4 md:grid-cols-2"><div><Label>Faaliyet türü</Label><select value={activityForm.activity_type} onChange={(e) => setActivityForm({ ...activityForm, activity_type: e.target.value as ActivityType })} className="mt-1 w-full rounded-md border px-3 py-2">{Object.entries(activityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><div><Label>Görüşme sonucu</Label><select value={activityForm.outcome} onChange={(e) => setActivityForm({ ...activityForm, outcome: e.target.value as ActivityOutcome })} className="mt-1 w-full rounded-md border px-3 py-2">{Object.entries(outcomeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><div><Label>İşlem tarihi ve saati</Label><Input type="datetime-local" value={activityForm.activity_at} onChange={(e) => setActivityForm({ ...activityForm, activity_at: e.target.value })} /></div><div><Label>Sonraki işlem tarihi</Label><Input type="datetime-local" value={activityForm.next_action_at} onChange={(e) => setActivityForm({ ...activityForm, next_action_at: e.target.value })} /></div><div className="md:col-span-2"><Label>Kısa görüşme özeti *</Label><Textarea value={activityForm.summary} onChange={(e) => setActivityForm({ ...activityForm, summary: e.target.value })} placeholder="Görüşülen konu, müşterinin ihtiyacı ve sonraki adımı yazın..." /></div></div><DialogFooter><Button variant="outline" onClick={() => { setActivityOpen(false); setTaskToComplete(null); }}>Vazgeç</Button><Button onClick={() => void saveActivity()} disabled={submitting || activityForm.summary.trim().length < 3 || (["not_reached","positive","follow_up","quote_requested"].includes(activityForm.outcome) && !activityForm.next_action_at)}>Kaydet</Button></DialogFooter></DialogContent></Dialog>

      <Dialog open={offerOpen} onOpenChange={setOfferOpen}>
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
          <DialogHeader><DialogTitle>Taşımacılık Teklifi Oluştur</DialogTitle></DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2"><Label>Teklif konusu *</Label><Input value={offerForm.subject} onChange={(e) => setOfferForm({ ...offerForm, subject: e.target.value })} /></div>
            <div><Label>Yükleme yeri</Label><Input value={offerForm.pickup_location} onChange={(e) => setOfferForm({ ...offerForm, pickup_location: e.target.value })} placeholder={quoteDetail?.loading_point || "İl / ilçe"} /></div>
            <div><Label>Teslim yeri</Label><Input value={offerForm.delivery_location} onChange={(e) => setOfferForm({ ...offerForm, delivery_location: e.target.value })} placeholder={quoteDetail?.delivery_point || "İl / ilçe"} /></div>
            <div><Label>Hizmet türü</Label><Input value={offerForm.service_type} onChange={(e) => setOfferForm({ ...offerForm, service_type: e.target.value })} /></div>
            <div><Label>Araç türü</Label><Input value={offerForm.vehicle_type} onChange={(e) => setOfferForm({ ...offerForm, vehicle_type: e.target.value })} placeholder="Tenteli, kamyonet, frigo..." /></div>
            <div><Label>Operasyon tedarikçisi</Label><select value={offerForm.supplier_id} onChange={(e) => setOfferForm({ ...offerForm, supplier_id: e.target.value, estimated_delivery_date: "", transit_schedule_snapshot: null })} className="mt-1 w-full rounded-md border px-3 py-2"><option value="">Tedarikçi seçilmedi</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.customer_code ? `${supplier.customer_code} - ` : ""}{supplier.company || supplier.name}</option>)}</select></div>
            <div><Label>Alım / planlama tarihi</Label><Input type="date" value={offerForm.collection_date} onChange={(e) => setOfferForm({ ...offerForm, collection_date: e.target.value, estimated_delivery_date: "", transit_schedule_snapshot: null })} /></div>
            <div className="md:col-span-2"><Label>Teslim ilçesi</Label><Input value={offerForm.destination_district} onChange={(e) => setOfferForm({ ...offerForm, destination_district: e.target.value })} placeholder="İlçe" /></div>
            <GpslineDeliveryEstimator
              supplierName={suppliers.find((supplier) => supplier.id === offerForm.supplier_id)?.company || suppliers.find((supplier) => supplier.id === offerForm.supplier_id)?.name}
              collectionDate={offerForm.collection_date}
              initialOrigin={offerForm.pickup_location || quoteDetail?.loading_point}
              initialDestination={offerForm.delivery_location || quoteDetail?.delivery_point}
              initialDistrict={offerForm.destination_district}
              initialTotalDesiKg={offerForm.weight_kg}
              initialPalletCount={offerForm.pallet_count}
              onApply={(value, price) => setOfferForm({
                ...offerForm,
                estimated_delivery_date: value.estimated_delivery_date,
                destination_district: value.destination_district,
                weight_kg: String(price.entered_total_desi_kg),
                pallet_count: String(price.pallet_count),
                cost_amount: String(price.cost_amount),
                currency: price.currency,
                transit_schedule_snapshot: { ...value, pricing: price } as unknown as Record<string, unknown>,
                items: offerForm.items.map((item, index) => index === 0 ? {
                  ...item,
                  description: "GPSLine parsiyel taşıma hizmeti",
                  quantity: 1,
                  unit: "sefer",
                  unit_price: price.recommended_sale_amount,
                } : item),
              })}
            />
            {offerForm.estimated_delivery_date && <div className="md:col-span-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">Teklife kaydedilecek tahmini teslim tarihi: {new Date(`${offerForm.estimated_delivery_date}T00:00:00`).toLocaleDateString("tr-TR")}</div>}
            <div className="md:col-span-2"><Label>Yük açıklaması</Label><Input value={offerForm.cargo_description} onChange={(e) => setOfferForm({ ...offerForm, cargo_description: e.target.value })} /></div>
            <div><Label>Ağırlık / toplam desi-kg</Label><Input type="number" min="0" value={offerForm.weight_kg} onChange={(e) => setOfferForm({ ...offerForm, weight_kg: e.target.value })} /></div>
            <div><Label>Palet adedi</Label><Input type="number" min="0" value={offerForm.pallet_count} onChange={(e) => setOfferForm({ ...offerForm, pallet_count: e.target.value })} /></div>
            <div className="md:col-span-2 space-y-3 rounded-xl border p-4">
              <div className="flex items-center justify-between"><div><Label>Fiyat kalemleri *</Label><p className="text-xs text-slate-500">Navlun, yakıt, köprü veya ek hizmetleri ayrı girin.</p></div><Button type="button" size="sm" variant="outline" onClick={() => setOfferForm({ ...offerForm, items: [...offerForm.items, { description: "Ek hizmet", quantity: 1, unit: "adet", unit_price: 0, tax_rate: Number(offerForm.vat_rate || 20) }] })}><Plus className="mr-1 h-4 w-4" />Kalem</Button></div>
              {offerForm.items.map((line, index) => <div key={index} className="grid gap-2 md:grid-cols-[2fr_0.7fr_0.8fr_1fr_auto]"><Input value={line.description} onChange={(e) => setOfferForm({ ...offerForm, items: offerForm.items.map((item, i) => i === index ? { ...item, description: e.target.value } : item) })} placeholder="Hizmet açıklaması" /><Input type="number" min="0.001" step="0.001" value={line.quantity} onChange={(e) => setOfferForm({ ...offerForm, items: offerForm.items.map((item, i) => i === index ? { ...item, quantity: Number(e.target.value) } : item) })} /><Input value={line.unit} onChange={(e) => setOfferForm({ ...offerForm, items: offerForm.items.map((item, i) => i === index ? { ...item, unit: e.target.value } : item) })} /><Input type="number" min="0" step="0.01" value={line.unit_price} onChange={(e) => setOfferForm({ ...offerForm, items: offerForm.items.map((item, i) => i === index ? { ...item, unit_price: Number(e.target.value) } : item) })} /><Button type="button" variant="ghost" disabled={offerForm.items.length === 1} onClick={() => setOfferForm({ ...offerForm, items: offerForm.items.filter((_, i) => i !== index) })}>×</Button></div>)}
              <p className="text-right font-bold text-[#10213e]">Toplam: {money(offerForm.items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0), 0), offerForm.currency)}</p>
            </div>
            <div><Label>Para birimi</Label><select value={offerForm.currency} onChange={(e) => setOfferForm({ ...offerForm, currency: e.target.value })} className="mt-1 w-full rounded-md border px-3 py-2">{["TRY","USD","EUR","GBP"].map((item) => <option key={item}>{item}</option>)}</select></div>
            <div><Label>Maliyet ({offerForm.currency})</Label><Input type="number" min="0" step="0.01" value={offerForm.cost_amount} onChange={(e) => setOfferForm({ ...offerForm, cost_amount: e.target.value })} /></div>
            {offerForm.currency !== "TRY" && <div><Label>Kur (TL)</Label><Input type="number" min="0.000001" step="0.000001" value={offerForm.exchange_rate} onChange={(e) => setOfferForm({ ...offerForm, exchange_rate: e.target.value })} /></div>}
            <div><Label>KDV oranı (%)</Label><Input type="number" min="0" max="100" value={offerForm.vat_rate} onChange={(e) => setOfferForm({ ...offerForm, vat_rate: e.target.value, items: offerForm.items.map((item) => ({ ...item, tax_rate: Number(e.target.value) })) })} /></div>
            <div><Label>Ödeme koşulu</Label><Input value={offerForm.payment_terms} onChange={(e) => setOfferForm({ ...offerForm, payment_terms: e.target.value })} placeholder="Fatura tarihinden itibaren 30 gün" /></div>
            <div><Label>Incoterm</Label><Input value={offerForm.incoterm} onChange={(e) => setOfferForm({ ...offerForm, incoterm: e.target.value })} placeholder="Uluslararası taşımalarda" /></div>
            <div><Label>Durum</Label><select value={offerForm.status} onChange={(e) => setOfferForm({ ...offerForm, status: e.target.value as CrmOffer["status"] })} className="mt-1 w-full rounded-md border px-3 py-2"><option value="draft">Taslak</option><option value="sent">Kaydet ve gönder</option></select></div>
            <div><Label>Geçerlilik tarihi</Label><Input type="date" value={offerForm.valid_until} onChange={(e) => setOfferForm({ ...offerForm, valid_until: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Not ve kapsam dışı hizmetler</Label><Textarea value={offerForm.notes} onChange={(e) => setOfferForm({ ...offerForm, notes: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOfferOpen(false)}>Vazgeç</Button><Button className="bg-[#e96d25] hover:bg-[#d95e1d]" onClick={() => void saveOffer()} disabled={submitting || !offerForm.items.length || offerForm.items.some((item) => !item.description.trim() || Number(item.quantity) <= 0 || Number(item.unit_price) < 0) || (offerForm.currency !== "TRY" && Number(offerForm.exchange_rate) <= 0)}>Teklifi Kaydet</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={prospectOpen} onOpenChange={setProspectOpen}><DialogContent><DialogHeader><DialogTitle>Yeni Potansiyel Müşteri</DialogTitle></DialogHeader><div className="grid gap-4 md:grid-cols-2"><div><Label>Firma adı *</Label><Input value={prospectForm.company_name} onChange={(e) => setProspectForm({ ...prospectForm, company_name: e.target.value })} /></div><div><Label>İlgili kişi</Label><Input value={prospectForm.contact_name} onChange={(e) => setProspectForm({ ...prospectForm, contact_name: e.target.value })} /></div><div><Label>Telefon</Label><Input value={prospectForm.phone} onChange={(e) => setProspectForm({ ...prospectForm, phone: e.target.value })} /></div><div><Label>E-posta</Label><Input type="email" value={prospectForm.email} onChange={(e) => setProspectForm({ ...prospectForm, email: e.target.value })} /></div><div><Label>Satış temsilcisi</Label><select value={prospectForm.assigned_to} onChange={(e) => setProspectForm({ ...prospectForm, assigned_to: e.target.value })} className="mt-1 w-full rounded-md border px-3 py-2"><option value="">Otomatik / kendim</option>{representatives.map((rep) => <option key={rep.user_id} value={rep.user_id}>{rep.full_name}</option>)}</select></div><div><Label>İlk takip tarihi</Label><Input type="datetime-local" value={prospectForm.next_action_at} onChange={(e) => setProspectForm({ ...prospectForm, next_action_at: e.target.value })} /></div><div className="md:col-span-2"><Label>Not</Label><Textarea value={prospectForm.notes} onChange={(e) => setProspectForm({ ...prospectForm, notes: e.target.value })} /></div></div><DialogFooter><Button variant="outline" onClick={() => setProspectOpen(false)}>Vazgeç</Button><Button onClick={() => void saveProspect()} disabled={submitting || !prospectForm.company_name.trim()}><Target className="mr-2 h-4 w-4" />Tanıtım Listesine Ekle</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
