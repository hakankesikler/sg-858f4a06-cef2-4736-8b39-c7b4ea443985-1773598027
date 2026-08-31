import { useEffect, useMemo, useState } from "react";
import { Calculator, CalendarClock, CheckCircle2, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  findGpslineOption,
  gpslineTransitService,
  isGpslineSupplier,
  type GpslineDeliveryEstimate,
  type GpslinePriceEstimate,
  type GpslineRouteOptions,
} from "@/services/gpslineTransitService";

type Props = {
  supplierName?: string | null;
  collectionDate?: string;
  initialOrigin?: string | null;
  initialDestination?: string | null;
  initialDistrict?: string | null;
  initialTotalDesiKg?: number | string | null;
  initialPalletCount?: number | string | null;
  onApply?: (estimate: GpslineDeliveryEstimate, price: GpslinePriceEstimate) => void;
};

const emptyOptions: GpslineRouteOptions = { origins: [], destinations: [], districts: [] };
const formatDate = (value: string) => new Intl.DateTimeFormat("tr-TR", {
  weekday: "long", day: "2-digit", month: "long", year: "numeric", timeZone: "UTC",
}).format(new Date(`${value}T00:00:00Z`));
const money = (value: number, currency = "TRY") => new Intl.NumberFormat("tr-TR", {
  style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2,
}).format(value);

export function GpslineDeliveryEstimator({ supplierName, collectionDate, initialOrigin, initialDestination, initialDistrict, initialTotalDesiKg, initialPalletCount, onApply }: Props) {
  const enabled = useMemo(() => isGpslineSupplier(supplierName), [supplierName]);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [district, setDistrict] = useState("");
  const [date, setDate] = useState(collectionDate || "");
  const [totalDesiKg, setTotalDesiKg] = useState(initialTotalDesiKg ? String(initialTotalDesiKg) : "");
  const [palletCount, setPalletCount] = useState(initialPalletCount ? String(initialPalletCount) : "");
  const [options, setOptions] = useState<GpslineRouteOptions>(emptyOptions);
  const [estimate, setEstimate] = useState<GpslineDeliveryEstimate | null>(null);
  const [price, setPrice] = useState<GpslinePriceEstimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { setDate(collectionDate || ""); }, [collectionDate]);
  useEffect(() => { setTotalDesiKg(initialTotalDesiKg ? String(initialTotalDesiKg) : ""); setPrice(null); }, [initialTotalDesiKg]);
  useEffect(() => { setPalletCount(initialPalletCount ? String(initialPalletCount) : ""); setPrice(null); }, [initialPalletCount]);
  useEffect(() => {
    if (!enabled) {
      setOrigin(""); setDestination(""); setDistrict(""); setEstimate(null); setPrice(null); setError("");
      return;
    }
    let active = true;
    gpslineTransitService.getOptions().then((value) => {
      if (!active) return;
      setOptions(value);
      setOrigin((current) => current || findGpslineOption(initialOrigin, value.origins));
      setDestination((current) => current || findGpslineOption(initialDestination, value.destinations));
    }).catch((reason) => active && setError(reason?.message || "GPSLine termin seçenekleri alınamadı."));
    return () => { active = false; };
  }, [enabled, initialOrigin, initialDestination]);

  useEffect(() => {
    if (!enabled || !origin) return;
    let active = true;
    gpslineTransitService.getOptions(origin, destination || null).then((value) => {
      if (!active) return;
      setOptions(value);
      if (destination && !value.destinations.includes(destination)) { setDestination(""); setDistrict(""); }
      else if (destination) setDistrict((current) => current || findGpslineOption(initialDistrict, value.districts));
    }).catch((reason) => active && setError(reason?.message || "GPSLine rota seçenekleri alınamadı."));
    return () => { active = false; };
  }, [enabled, origin, destination, initialDistrict]);

  if (!enabled) return null;

  const calculate = async () => {
    if (!origin || !destination || !district || !date) {
      setError("Çıkış bölgesi, varış bölgesi, ilçe ve alım tarihini seçin.");
      return;
    }
    const total = Number(totalDesiKg);
    const pallets = Number(palletCount);
    if (!Number.isFinite(total) || total <= 0 || !Number.isInteger(pallets) || pallets <= 0) {
      setError("Palet adedi ile toplam desi/kg değerini doğru girin.");
      return;
    }
    if (total > pallets * 250) {
      setError("Her palet en fazla 250 desi/kg olabilir. Palet adedini veya toplam desiyi kontrol edin.");
      return;
    }
    setLoading(true); setError(""); setEstimate(null); setPrice(null);
    try {
      const [deliveryResult, priceResult] = await Promise.all([
        gpslineTransitService.estimate({ origin, destination, district, collectionDate: date }),
        gpslineTransitService.calculatePrice({ origin, destination, totalDesiKg: total, palletCount: pallets }),
      ]);
      setEstimate(deliveryResult);
      setPrice(priceResult);
    } catch (reason: any) {
      setError(reason?.message || "GPSLine termin ve maliyet hesabı yapılamadı.");
    } finally { setLoading(false); }
  };

  return (
    <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-orange-50 p-4 md:col-span-full">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="flex items-center gap-2 font-semibold text-[#10213e]"><CalendarClock className="h-5 w-5 text-[#e96d25]" />GPSLine Termin ve Fiyat Hesabı</p><p className="mt-1 text-xs text-slate-600">Termin takvimi ile toplu desi/kg maliyeti aynı güzergâh üzerinden hesaplanır.</p></div>
        <div className="flex flex-wrap gap-2"><span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">Termin · 02.07.2026</span><span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-800">Maliyet · 31.08.2026</span></div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <div><Label>Çıkış bölgesi *</Label><Select value={origin} onValueChange={(value) => { setOrigin(value); setDestination(""); setDistrict(""); setEstimate(null); setPrice(null); }}><SelectTrigger><SelectValue placeholder="Çıkış seçin" /></SelectTrigger><SelectContent>{options.origins.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Varış bölgesi *</Label><Select value={destination} onValueChange={(value) => { setDestination(value); setDistrict(""); setEstimate(null); setPrice(null); }} disabled={!origin}><SelectTrigger><SelectValue placeholder="Varış seçin" /></SelectTrigger><SelectContent>{options.destinations.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Teslim ilçesi *</Label><Select value={district} onValueChange={(value) => { setDistrict(value); setEstimate(null); setPrice(null); }} disabled={!destination}><SelectTrigger><SelectValue placeholder="İlçe seçin" /></SelectTrigger><SelectContent>{options.districts.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Alım / planlama tarihi *</Label><Input type="date" value={date} onChange={(event) => { setDate(event.target.value); setEstimate(null); }} /></div>
        <div><Label>Palet adedi *</Label><Input type="number" min="1" step="1" value={palletCount} onChange={(event) => { setPalletCount(event.target.value); setPrice(null); }} placeholder="Örn. 2" /></div>
        <div><Label>Toplam desi/kg *</Label><Input type="number" min="1" step="0.01" value={totalDesiKg} onChange={(event) => { setTotalDesiKg(event.target.value); setPrice(null); }} placeholder="Örn. 250" /></div>
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-xs text-orange-900 md:col-span-2"><strong>Toplu desi kuralı:</strong> 2 × 125 = 250 desi/kg kabul edilir. Toplam 250’nin altındaysa maliyet 250 üzerinden hesaplanır; her palet en fazla 250 olabilir.</div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3"><Button type="button" onClick={() => void calculate()} disabled={loading}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calculator className="mr-2 h-4 w-4" />}Termin ve Maliyeti Hesapla</Button>{error && <p className="text-sm font-medium text-red-600">{error}</p>}</div>
      {estimate && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-5 w-5" />Tahmini teslim: {formatDate(estimate.estimated_delivery_date)}</p><p className="mt-1 text-xs">Planlanan çıkış: {formatDate(estimate.planned_departure_date)} · Rota: {estimate.transit_business_days} iş günü · İlçe servisi: {estimate.delivery_weekday_names.join(", ")}</p></div>{onApply && price && <Button type="button" size="sm" variant="outline" onClick={() => onApply(estimate, price)}>Tarihi ve Fiyatı Uygula</Button>}</div>
        {estimate.adjusted_for_service_day && <p className="mt-2 text-xs font-medium text-amber-700">Rota süresi {formatDate(estimate.base_route_date)} tarihinde doluyor; ilçenin servis gününe göre teslim tarihi ileri alındı.</p>}
        {estimate.note && <p className="mt-2 rounded-lg bg-white/70 p-2 text-xs"><strong>GPSLine notu:</strong> {estimate.note}</p>}
        <p className="mt-2 text-[11px] text-slate-600">{estimate.disclaimer}</p>
      </div>}
      {price && <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-[#10213e]">
        <div className="flex items-center gap-2 font-semibold"><MapPin className="h-5 w-5 text-[#e96d25]" />{price.origin_zone} → {price.destination_region}</div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-white p-3"><p className="text-xs text-slate-500">Faturalanan desi/kg</p><p className="text-lg font-bold">{price.chargeable_desi_kg.toLocaleString("tr-TR")}</p></div>
          <div className="rounded-lg bg-white p-3"><p className="text-xs text-slate-500">GPSLine maliyeti</p><p className="text-lg font-bold">{money(price.cost_amount, price.currency)}</p><p className="text-[11px] text-slate-500">{money(price.cost_per_desi_kg, price.currency)} / desi</p></div>
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-3"><p className="text-xs text-orange-700">Önerilen minimum satış</p><p className="text-lg font-bold text-orange-800">{money(price.recommended_sale_amount, price.currency)}</p><p className="text-[11px] text-orange-700">Maliyete %{Math.round(price.markup_rate * 100)} eklenmiştir</p></div>
          <div className="rounded-lg bg-white p-3"><p className="text-xs text-slate-500">Öngörülen brüt kazanç</p><p className="text-lg font-bold text-emerald-700">{money(price.gross_profit_amount, price.currency)}</p><p className="text-[11px] text-slate-500">Satış fiyatı üzerinden marj %{(price.sales_margin_rate * 100).toFixed(1)}</p></div>
        </div>
        {price.minimum_charge_applied && <p className="mt-3 rounded-lg bg-amber-100 px-3 py-2 text-xs font-medium text-amber-900">Girilen toplam {price.entered_total_desi_kg.toLocaleString("tr-TR")} desi/kg olduğu için 250 minimum fiyatı uygulandı.</p>}
        <p className="mt-2 text-[11px] text-slate-600">{price.pricing_note}</p>
      </div>}
    </div>
  );
}
