import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import {
  CalendarDays, CheckCircle2, Clipboard, Download, ExternalLink, FileDown,
  FileText, LogOut, PackageSearch, RotateCcw, Search, Truck,
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { downloadCsv } from "@/lib/csv";
import { downloadCustomerWaybill } from "@/lib/customer-waybill";
import { openPrivateDocument } from "@/lib/private-storage";
import {
  customerPortalService,
  type CustomerPortalProfile,
  type CustomerShipment,
} from "@/services/customerPortalService";

const statusMap: Record<string, { label: string; className: string }> = {
  atama_bekliyor: { label: "Atama Bekliyor", className: "bg-amber-100 text-amber-800 border-amber-200" },
  beklemede: { label: "Planlandı", className: "bg-slate-100 text-slate-700 border-slate-200" },
  tasima_basladi: { label: "Taşıma Başladı", className: "bg-blue-100 text-blue-800 border-blue-200" },
  yolda: { label: "Yolda", className: "bg-blue-100 text-blue-800 border-blue-200" },
  teslim_edildi: { label: "Teslim Edildi", className: "bg-green-100 text-green-800 border-green-200" },
  iptal: { label: "İptal", className: "bg-red-100 text-red-800 border-red-200" },
};

const normalize = (value: unknown) => String(value || "").toLocaleLowerCase("tr-TR");
const formatDate = (value: string | null) => value ? new Date(value).toLocaleDateString("tr-TR") : "-";
const formatWeight = (value: number | null) => value == null ? "-" : `${Number(value).toLocaleString("tr-TR")} kg`;

export default function CustomerShipmentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CustomerPortalProfile | null>(null);
  const [shipments, setShipments] = useState<CustomerShipment[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [shipmentQuery, setShipmentQuery] = useState("");
  const [receiverQuery, setReceiverQuery] = useState("");
  const [routeQuery, setRouteQuery] = useState("");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        await router.replace("/musteri-giris");
        return;
      }
      try {
        const [account, items] = await Promise.all([
          customerPortalService.getProfile(),
          customerPortalService.getShipments(),
        ]);
        if (!account) throw new Error("Müşteri portalı erişiminiz bulunmuyor.");
        if (active) {
          setProfile(account);
          setShipments(items || []);
          setLoading(false);
        }
      } catch (error: any) {
        await supabase.auth.signOut();
        toast({ title: "Erişim sağlanamadı", description: error?.message || "Hesabınızı kontrol edin.", variant: "destructive" });
        await router.replace("/musteri-giris");
      }
    };
    void load();
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => shipments.filter((shipment) => {
    const shipmentDate = shipment.pickup_date?.slice(0, 10) || "";
    if (startDate && shipmentDate < startDate) return false;
    if (endDate && shipmentDate > endDate) return false;
    if (status !== "all" && shipment.status !== status) return false;
    if (shipmentQuery && !normalize(`${shipment.shipment_code} ${shipment.tracking_number}`).includes(normalize(shipmentQuery))) return false;
    if (receiverQuery && !normalize(`${shipment.receiver} ${shipment.receiver_district}`).includes(normalize(receiverQuery))) return false;
    if (routeQuery && !normalize(`${shipment.origin} ${shipment.destination}`).includes(normalize(routeQuery))) return false;
    return true;
  }), [shipments, startDate, endDate, shipmentQuery, receiverQuery, routeQuery, status]);

  const deliveredCount = shipments.filter((shipment) => shipment.status === "teslim_edildi" || shipment.status === "Teslim Edildi").length;
  const activeCount = shipments.filter((shipment) => ["tasima_basladi", "yolda"].includes(shipment.status || "")).length;

  const resetFilters = () => {
    setStartDate(""); setEndDate(""); setShipmentQuery(""); setReceiverQuery(""); setRouteQuery(""); setStatus("all");
  };

  const trackingUrl = (shipment: CustomerShipment) => `${window.location.origin}/takip/${shipment.tracking_number}`;
  const copyTracking = async (shipment: CustomerShipment) => {
    await navigator.clipboard.writeText(trackingUrl(shipment));
    toast({ title: "Takip bağlantısı kopyalandı", description: "Müşterinizle veya alıcınızla paylaşabilirsiniz." });
  };

  const downloadList = () => {
    try {
      downloadCsv(`REX_Sevkiyatlar_${new Date().toISOString().slice(0, 10)}.csv`, filtered.map((shipment) => ({
        "Sevkiyat No": shipment.shipment_code,
        "Takip No": shipment.tracking_number,
        "Durum": statusMap[shipment.status || ""]?.label || shipment.status || "-",
        "Sevk Tarihi": formatDate(shipment.pickup_date),
        "Tahmini Teslim": formatDate(shipment.estimated_delivery_date),
        "Teslim Tarihi": formatDate(shipment.delivery_date || shipment.actual_delivery_date),
        "Gönderici": shipment.sender_name || "-",
        "Alıcı": shipment.receiver || "-",
        "Çıkış": shipment.origin || "-",
        "Varış": shipment.destination || "-",
        "Ağırlık": formatWeight(shipment.toplam_kg_ds),
        "Teslim Alan": shipment.delivered_to || "-",
      })));
    } catch (error: any) {
      toast({ title: "Liste indirilemedi", description: error?.message, variant: "destructive" });
    }
  };

  const downloadSelectedWaybills = async () => {
    if (!profile) return;
    const rows = selected.length ? filtered.filter((item) => selected.includes(item.id)) : filtered;
    if (!rows.length) {
      toast({ title: "Sevkiyat seçin", description: "İrsaliyesi indirilecek en az bir sevkiyat bulunmalı." });
      return;
    }
    for (const shipment of rows) await downloadCustomerWaybill(shipment, profile);
    toast({ title: `${rows.length} irsaliye hazırlandı` });
  };

  const openProof = async (shipment: CustomerShipment) => {
    if (!shipment.delivery_proof_url) return;
    try { await openPrivateDocument(shipment.delivery_proof_url, "shipment-documents"); }
    catch { toast({ title: "Teslim evrakı açılamadı", description: "Belge henüz yüklenmemiş veya arşivde bulunamıyor.", variant: "destructive" }); }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    await router.replace("/musteri-giris");
  };

  if (loading || !profile) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="text-center"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" /><p className="mt-4 text-slate-600">Kurumsal hesabınız açılıyor...</p></div></div>;
  }

  return (
    <>
      <SEO title={`Sevkiyatlar | ${profile.name}`} description="Kurumsal sevkiyat takip ekranı." noIndex />
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <Image src="/rex.png" alt="REX Lojistik" width={122} height={56} priority className="h-12 w-auto object-contain" />
              <div className="hidden sm:block border-l pl-4 min-w-0"><p className="text-xs uppercase tracking-wider text-blue-600 font-semibold">Kurumsal Müşteri Portalı</p><p className="font-bold text-slate-900 truncate">{profile.name}</p></div>
            </div>
            <Button variant="outline" onClick={logout}><LogOut className="h-4 w-4 mr-2" />Çıkış</Button>
          </div>
        </header>

        <main className="max-w-[1600px] mx-auto p-4 sm:p-6 space-y-6">
          <div className="rounded-2xl bg-gradient-to-r from-blue-700 to-blue-500 text-white p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-lg">
            <div><p className="text-blue-100 text-sm">{profile.customer_code || "REX Müşteri"}</p><h1 className="text-2xl sm:text-3xl font-bold mt-1">Sevkiyat Listesi</h1><p className="text-blue-100 mt-2">Güncel taşıma durumlarını izleyin, takip bağlantısı paylaşın ve irsaliyelerinizi indirin.</p></div>
            <div className="grid grid-cols-3 gap-3 min-w-fit">
              <div className="bg-white/15 rounded-xl px-4 py-3 text-center"><p className="text-2xl font-bold">{shipments.length}</p><p className="text-xs text-blue-100">Toplam</p></div>
              <div className="bg-white/15 rounded-xl px-4 py-3 text-center"><p className="text-2xl font-bold">{activeCount}</p><p className="text-xs text-blue-100">Yolda</p></div>
              <div className="bg-white/15 rounded-xl px-4 py-3 text-center"><p className="text-2xl font-bold">{deliveredCount}</p><p className="text-xs text-blue-100">Teslim</p></div>
            </div>
          </div>

          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-5"><PackageSearch className="h-5 w-5 text-blue-600" /><h2 className="font-bold text-lg">Sevkiyat Sorgulama</h2></div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div><label className="text-sm font-medium text-slate-700">Başlangıç Tarihi</label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1" /></div>
              <div><label className="text-sm font-medium text-slate-700">Bitiş Tarihi</label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1" /></div>
              <div><label className="text-sm font-medium text-slate-700">Sevkiyat / Takip No</label><Input value={shipmentQuery} onChange={(e) => setShipmentQuery(e.target.value)} placeholder="REX-..." className="mt-1" /></div>
              <div><label className="text-sm font-medium text-slate-700">Alıcı</label><Input value={receiverQuery} onChange={(e) => setReceiverQuery(e.target.value)} placeholder="Firma veya kişi" className="mt-1" /></div>
              <div><label className="text-sm font-medium text-slate-700">Güzergâh</label><Input value={routeQuery} onChange={(e) => setRouteQuery(e.target.value)} placeholder="Çıkış / varış" className="mt-1" /></div>
              <div><label className="text-sm font-medium text-slate-700">Durum</label><select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="all">Tümü</option><option value="atama_bekliyor">Atama Bekliyor</option><option value="beklemede">Planlandı</option><option value="tasima_basladi">Taşıma Başladı</option><option value="yolda">Yolda</option><option value="teslim_edildi">Teslim Edildi</option><option value="iptal">İptal</option></select></div>
            </div>
            <div className="flex flex-wrap gap-3 mt-5 pt-5 border-t">
              <Button className="bg-blue-600 hover:bg-blue-700"><Search className="h-4 w-4 mr-2" />{filtered.length} Sonuç</Button>
              <Button variant="outline" onClick={resetFilters}><RotateCcw className="h-4 w-4 mr-2" />Temizle</Button>
              <Button variant="outline" onClick={downloadList} disabled={!filtered.length}><FileDown className="h-4 w-4 mr-2" />Excel / CSV İndir</Button>
              <Button variant="outline" onClick={downloadSelectedWaybills} disabled={!filtered.length}><FileText className="h-4 w-4 mr-2" />{selected.length ? `Seçili İrsaliyeler (${selected.length})` : "İrsaliyeleri İndir"}</Button>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between"><div><h2 className="font-bold text-lg">Sipariş ve Sevkiyatlar</h2><p className="text-sm text-slate-500">{filtered.length} kayıt gösteriliyor</p></div><Truck className="h-7 w-7 text-blue-600" /></div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1350px] text-sm">
                <thead className="bg-slate-100 text-slate-700"><tr>
                  <th className="p-3 text-center"><input type="checkbox" checked={filtered.length > 0 && selected.length === filtered.length} onChange={(e) => setSelected(e.target.checked ? filtered.map((item) => item.id) : [])} aria-label="Tümünü seç" /></th>
                  <th className="p-3 text-left">Sevkiyat No</th><th className="p-3 text-left">Takip No</th><th className="p-3 text-left">Durum</th><th className="p-3 text-left">Sevk Tarihi</th><th className="p-3 text-left">Gönderici</th><th className="p-3 text-left">Alıcı</th><th className="p-3 text-left">Güzergâh</th><th className="p-3 text-right">Ağırlık</th><th className="p-3 text-left">Tahmini Teslim</th><th className="p-3 text-left">Teslim</th><th className="p-3 text-center">Belgeler</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-200">
                  {filtered.map((shipment) => {
                    const appearance = statusMap[shipment.status || ""] || { label: shipment.status || "Belirsiz", className: "bg-slate-100 text-slate-700" };
                    return <tr key={shipment.id} className="hover:bg-blue-50/50">
                      <td className="p-3 text-center"><input type="checkbox" checked={selected.includes(shipment.id)} onChange={(e) => setSelected((items) => e.target.checked ? [...items, shipment.id] : items.filter((id) => id !== shipment.id))} aria-label={`${shipment.shipment_code} seç`} /></td>
                      <td className="p-3 font-semibold text-slate-900">{shipment.shipment_code}</td>
                      <td className="p-3"><button onClick={() => copyTracking(shipment)} className="inline-flex items-center gap-1.5 font-mono text-xs text-blue-700 hover:underline" title="Takip bağlantısını kopyala">{shipment.tracking_number}<Clipboard className="h-3.5 w-3.5" /></button></td>
                      <td className="p-3"><Badge variant="outline" className={appearance.className}>{appearance.label}</Badge></td>
                      <td className="p-3"><span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-slate-400" />{formatDate(shipment.pickup_date)}</span></td>
                      <td className="p-3 max-w-[180px]"><p className="font-medium truncate">{shipment.sender_name || "-"}</p><p className="text-xs text-slate-500">{shipment.origin || "-"}</p></td>
                      <td className="p-3 max-w-[190px]"><p className="font-medium truncate">{shipment.receiver || "-"}</p><p className="text-xs text-slate-500">{shipment.receiver_district || "-"}</p></td>
                      <td className="p-3"><span>{shipment.origin || "-"}</span><span className="mx-2 text-blue-500">→</span><span>{shipment.destination || "-"}</span></td>
                      <td className="p-3 text-right font-medium">{formatWeight(shipment.toplam_kg_ds)}</td>
                      <td className="p-3">{formatDate(shipment.estimated_delivery_date)}</td>
                      <td className="p-3">{shipment.delivery_date || shipment.actual_delivery_date ? <span className="inline-flex items-center gap-1 text-green-700"><CheckCircle2 className="h-4 w-4" />{formatDate(shipment.delivery_date || shipment.actual_delivery_date)}</span> : "-"}</td>
                      <td className="p-3"><div className="flex justify-center gap-1">
                        <button onClick={() => downloadCustomerWaybill(shipment, profile)} className="p-2 rounded-lg text-blue-700 hover:bg-blue-100" title="İrsaliye indir"><Download className="h-4 w-4" /></button>
                        <button onClick={() => window.open(trackingUrl(shipment), "_blank", "noopener,noreferrer")} className="p-2 rounded-lg text-slate-700 hover:bg-slate-100" title="Canlı takip"><ExternalLink className="h-4 w-4" /></button>
                        {shipment.delivery_proof_url && <button onClick={() => void openProof(shipment)} className="p-2 rounded-lg text-green-700 hover:bg-green-100" title="Teslim evrakını görüntüle"><FileText className="h-4 w-4" /></button>}
                      </div></td>
                    </tr>;
                  })}
                </tbody>
              </table>
              {!filtered.length && <div className="py-16 text-center text-slate-500"><PackageSearch className="h-10 w-10 mx-auto mb-3 opacity-40" /><p>Filtrelere uygun sevkiyat bulunamadı.</p></div>}
            </div>
          </Card>
        </main>
      </div>
    </>
  );
}
