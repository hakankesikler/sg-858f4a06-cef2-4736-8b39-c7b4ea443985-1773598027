import { useEffect, useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  findGpslineOption,
  gpslineTransitService,
  isGpslineSupplier,
  type GpslineDeliveryEstimate,
  type GpslineRouteOptions,
} from "@/services/gpslineTransitService";

type Props = {
  supplierName?: string | null;
  collectionDate?: string;
  initialOrigin?: string | null;
  initialDestination?: string | null;
  initialDistrict?: string | null;
  onApply?: (estimate: GpslineDeliveryEstimate) => void;
};

const emptyOptions: GpslineRouteOptions = { origins: [], destinations: [], districts: [] };
const formatDate = (value: string) => new Intl.DateTimeFormat("tr-TR", {
  weekday: "long", day: "2-digit", month: "long", year: "numeric", timeZone: "UTC",
}).format(new Date(`${value}T00:00:00Z`));

export function GpslineDeliveryEstimator({ supplierName, collectionDate, initialOrigin, initialDestination, initialDistrict, onApply }: Props) {
  const enabled = useMemo(() => isGpslineSupplier(supplierName), [supplierName]);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [district, setDistrict] = useState("");
  const [date, setDate] = useState(collectionDate || "");
  const [options, setOptions] = useState<GpslineRouteOptions>(emptyOptions);
  const [estimate, setEstimate] = useState<GpslineDeliveryEstimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { setDate(collectionDate || ""); }, [collectionDate]);
  useEffect(() => {
    if (!enabled) {
      setOrigin(""); setDestination(""); setDistrict(""); setEstimate(null); setError("");
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
    setLoading(true); setError(""); setEstimate(null);
    try {
      setEstimate(await gpslineTransitService.estimate({ origin, destination, district, collectionDate: date }));
    } catch (reason: any) {
      setError(reason?.message || "Tahmini teslim tarihi hesaplanamadı.");
    } finally { setLoading(false); }
  };

  return (
    <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-orange-50 p-4 md:col-span-full">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="flex items-center gap-2 font-semibold text-[#10213e]"><CalendarClock className="h-5 w-5 text-[#e96d25]" />GPSLine Tahmini Teslim</p><p className="mt-1 text-xs text-slate-600">Kabul günü hariç rota iş günü ve ilçe servis takvimi birlikte uygulanır.</p></div>
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">GPS-LS-007 · 02.07.2026</span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <div><Label>Çıkış bölgesi *</Label><Select value={origin} onValueChange={(value) => { setOrigin(value); setDestination(""); setDistrict(""); setEstimate(null); }}><SelectTrigger><SelectValue placeholder="Çıkış seçin" /></SelectTrigger><SelectContent>{options.origins.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Varış bölgesi *</Label><Select value={destination} onValueChange={(value) => { setDestination(value); setDistrict(""); setEstimate(null); }} disabled={!origin}><SelectTrigger><SelectValue placeholder="Varış seçin" /></SelectTrigger><SelectContent>{options.destinations.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Teslim ilçesi *</Label><Select value={district} onValueChange={(value) => { setDistrict(value); setEstimate(null); }} disabled={!destination}><SelectTrigger><SelectValue placeholder="İlçe seçin" /></SelectTrigger><SelectContent>{options.districts.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Alım / planlama tarihi *</Label><Input type="date" value={date} onChange={(event) => { setDate(event.target.value); setEstimate(null); }} /></div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3"><Button type="button" onClick={() => void calculate()} disabled={loading}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}Teslim Tarihini Hesapla</Button>{error && <p className="text-sm font-medium text-red-600">{error}</p>}</div>
      {estimate && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-5 w-5" />Tahmini teslim: {formatDate(estimate.estimated_delivery_date)}</p><p className="mt-1 text-xs">Planlanan çıkış: {formatDate(estimate.planned_departure_date)} · Rota: {estimate.transit_business_days} iş günü · İlçe servisi: {estimate.delivery_weekday_names.join(", ")}</p></div>{onApply && <Button type="button" size="sm" variant="outline" onClick={() => onApply(estimate)}>Bu Tarihi Uygula</Button>}</div>
        {estimate.adjusted_for_service_day && <p className="mt-2 text-xs font-medium text-amber-700">Rota süresi {formatDate(estimate.base_route_date)} tarihinde doluyor; ilçenin servis gününe göre teslim tarihi ileri alındı.</p>}
        {estimate.note && <p className="mt-2 rounded-lg bg-white/70 p-2 text-xs"><strong>GPSLine notu:</strong> {estimate.note}</p>}
        <p className="mt-2 text-[11px] text-slate-600">{estimate.disclaimer}</p>
      </div>}
    </div>
  );
}
