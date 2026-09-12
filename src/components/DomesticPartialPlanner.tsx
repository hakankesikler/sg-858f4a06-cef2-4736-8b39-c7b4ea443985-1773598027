"use client";

import { useRef, useState } from "react";
import {
  CheckCircle2,
  Circle,
  Gauge,
  MapPin,
  MessageCircle,
  PackageCheck,
  Plus,
  Ruler,
  Scale,
  Trash2,
  Truck,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoadItem = {
  id: number;
  quantity: string;
  kind: string;
  weight: string;
  length: string;
  width: string;
  height: string;
  stackability: string;
};

const REFERENCE_TRAILER_WIDTH_METERS = 2.4;
const REFERENCE_STACK_HEIGHT_CM = 240;

const emptyLoad = (id: number): LoadItem => ({
  id,
  quantity: "",
  kind: "",
  weight: "",
  length: "",
  width: "",
  height: "",
  stackability: "",
});

function parsePositiveNumber(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function isLoadComplete(item: LoadItem) {
  return (
    parsePositiveNumber(item.quantity) > 0 &&
    item.kind.trim().length > 1 &&
    parsePositiveNumber(item.weight) > 0 &&
    parsePositiveNumber(item.length) > 0 &&
    parsePositiveNumber(item.width) > 0 &&
    parsePositiveNumber(item.height) > 0 &&
    Boolean(item.stackability)
  );
}

function displayValue(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits }).format(value);
}

function estimateLoadMeters(item: LoadItem) {
  const quantity = Math.ceil(parsePositiveNumber(item.quantity));
  const lengthMeters = parsePositiveNumber(item.length) / 100;
  const widthMeters = parsePositiveNumber(item.width) / 100;
  const heightCm = parsePositiveNumber(item.height);

  if (!quantity || !lengthMeters || !widthMeters || !heightCm || !item.stackability) return 0;

  const stackLayers = item.stackability === "İstiflenebilir"
    ? Math.max(1, Math.floor(REFERENCE_STACK_HEIGHT_CM / heightCm))
    : 1;
  const requiredFloorPlaces = Math.ceil(quantity / stackLayers);

  return (requiredFloorPlaces * lengthMeters * widthMeters) / REFERENCE_TRAILER_WIDTH_METERS;
}

export function DomesticPartialPlanner() {
  const [senderCity, setSenderCity] = useState("");
  const [senderDistrict, setSenderDistrict] = useState("");
  const [receiverCity, setReceiverCity] = useState("");
  const [receiverDistrict, setReceiverDistrict] = useState("");
  const [readyDate, setReadyDate] = useState("");
  const [note, setNote] = useState("");
  const [loads, setLoads] = useState<LoadItem[]>([emptyLoad(1)]);
  const nextLoadId = useRef(2);

  const updateLoad = (id: number, field: keyof Omit<LoadItem, "id">, value: string) => {
    setLoads((current) => current.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const addLoad = () => {
    const id = nextLoadId.current;
    nextLoadId.current += 1;
    setLoads((current) => [...current, emptyLoad(id)]);
  };

  const removeLoad = (id: number) => {
    setLoads((current) => current.filter((item) => item.id !== id));
  };

  const completeLoads = loads.filter(isLoadComplete);
  const totalQuantity = completeLoads.reduce((sum, item) => sum + parsePositiveNumber(item.quantity), 0);
  const totalWeight = completeLoads.reduce((sum, item) => sum + parsePositiveNumber(item.weight), 0);
  const totalVolume = completeLoads.reduce(
    (sum, item) =>
      sum +
      (parsePositiveNumber(item.quantity) *
        parsePositiveNumber(item.length) *
        parsePositiveNumber(item.width) *
        parsePositiveNumber(item.height)) /
        1_000_000,
    0,
  );
  const totalLoadMeters = completeLoads.reduce((sum, item) => sum + estimateLoadMeters(item), 0);

  const requiredDetails = [
    { label: "Gönderici il", complete: senderCity.trim().length > 1 },
    { label: "Gönderici ilçe", complete: senderDistrict.trim().length > 1 },
    { label: "Alıcı il", complete: receiverCity.trim().length > 1 },
    { label: "Alıcı ilçe", complete: receiverDistrict.trim().length > 1 },
    { label: "En az bir eksiksiz yük kalemi", complete: completeLoads.length > 0 },
  ];
  const completedCount = requiredDetails.filter((item) => item.complete).length;
  const completion = Math.round((completedCount / requiredDetails.length) * 100);

  const loadLines = loads.map((item, index) => {
    const dimensions = item.length && item.width && item.height
      ? `${item.length} × ${item.width} × ${item.height} cm`
      : "Ölçüler belirtilecek";
    const loadMeters = estimateLoadMeters(item);
    const loadMeterText = loadMeters > 0 ? `~${displayValue(loadMeters, 2)} LDM` : "Yer hesabı bekleniyor";
    return `${index + 1}. ${item.quantity || "?"} adet ${item.kind || "yük"} | ${item.weight ? `${item.weight} kg` : "Ağırlık belirtilecek"} | ${dimensions} | ${item.stackability || "İstif durumu belirtilecek"} | ${loadMeterText}`;
  });

  const whatsappText = [
    "Merhaba, yurtiçi parsiyel taşıma teklifi rica ederim.",
    `Gönderici: ${senderDistrict || "İlçe belirtilecek"} / ${senderCity || "İl belirtilecek"}`,
    `Alıcı: ${receiverDistrict || "İlçe belirtilecek"} / ${receiverCity || "İl belirtilecek"}`,
    `Yük hazır olma tarihi: ${readyDate || "Belirtilecek"}`,
    "",
    "Yük kalemleri:",
    ...loadLines,
    "",
    `Toplam: ${totalQuantity > 0 ? `${displayValue(totalQuantity)} adet` : "Adet hesaplanmadı"} | ${totalWeight > 0 ? `${displayValue(totalWeight)} kg` : "Ağırlık hesaplanmadı"} | ${totalVolume > 0 ? `${displayValue(totalVolume, 3)} m³` : "Hacim hesaplanmadı"} | ${totalLoadMeters > 0 ? `~${displayValue(totalLoadMeters, 2)} LDM tahmini yer` : "Yer ihtiyacı hesaplanmadı"}`,
    `Not: ${note || "Yok"}`,
  ].join("\n");

  return (
    <section aria-labelledby="domestic-partial-planner-heading" className="bg-slate-50 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-semibold text-orange-600">Yurtiçi parsiyel teklif hazırlama</p>
          <h2 id="domestic-partial-planner-heading" className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">
            Farklı yüklerinizi tek formda iletin
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            Gönderici ve alıcı konumlarını girin; ölçüsü veya ağırlığı farklı her yük grubunu ayrı kalem olarak ekleyin. Form, operasyon ekibimize gönderebileceğiniz düzenli bir WhatsApp özeti hazırlar.
          </p>
        </div>

        <div className="mt-10 grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 lg:grid-cols-[1.45fr_0.75fr]">
          <div className="p-5 sm:p-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <fieldset className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 sm:col-span-2">
                <legend className="px-2 font-bold text-slate-950">Gönderici</legend>
                <div className="space-y-2">
                  <Label htmlFor="partial-sender-city">İl</Label>
                  <Input id="partial-sender-city" value={senderCity} onChange={(event) => setSenderCity(event.target.value)} placeholder="Örn. İzmir" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partial-sender-district">İlçe</Label>
                  <Input id="partial-sender-district" value={senderDistrict} onChange={(event) => setSenderDistrict(event.target.value)} placeholder="Örn. Bornova" />
                </div>
              </fieldset>

              <fieldset className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 sm:col-span-2">
                <legend className="px-2 font-bold text-slate-950">Alıcı</legend>
                <div className="space-y-2">
                  <Label htmlFor="partial-receiver-city">İl</Label>
                  <Input id="partial-receiver-city" value={receiverCity} onChange={(event) => setReceiverCity(event.target.value)} placeholder="Örn. Ankara" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partial-receiver-district">İlçe</Label>
                  <Input id="partial-receiver-district" value={receiverDistrict} onChange={(event) => setReceiverDistrict(event.target.value)} placeholder="Örn. Sincan" />
                </div>
              </fieldset>
            </div>

            <div className="mt-7 flex flex-col gap-3 border-t border-slate-200 pt-7 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-950">Yük bilgileri</h3>
                <p className="mt-1 text-sm text-slate-600">Farklı ölçü veya ağırlıktaki yükleri ayrı satır olarak ekleyin.</p>
              </div>
              <button type="button" onClick={addLoad} className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-300 bg-orange-50 px-4 py-2.5 font-semibold text-orange-700 transition hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-300">
                <Plus className="h-4 w-4" aria-hidden="true" /> Yük Ekle
              </button>
            </div>

            <div className="mt-5 space-y-5">
              {loads.map((item, index) => (
                <fieldset key={item.id} className="rounded-2xl border border-slate-200 p-4 sm:p-5">
                  <legend className="px-2 font-bold text-slate-900">{index + 1}. yük kalemi</legend>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor={`partial-load-${item.id}-quantity`}>Adet</Label>
                      <Input id={`partial-load-${item.id}-quantity`} type="number" min="1" step="1" inputMode="numeric" value={item.quantity} onChange={(event) => updateLoad(item.id, "quantity", event.target.value)} placeholder="Örn. 2" />
                    </div>
                    <div className="space-y-2 sm:col-span-1 xl:col-span-2">
                      <Label htmlFor={`partial-load-${item.id}-kind`}>Cinsi / ambalajı</Label>
                      <Input id={`partial-load-${item.id}-kind`} value={item.kind} onChange={(event) => updateLoad(item.id, "kind", event.target.value)} placeholder="Örn. Euro palet, koli, makine" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`partial-load-${item.id}-weight`}>Toplam ağırlık (kg)</Label>
                      <Input id={`partial-load-${item.id}-weight`} type="number" min="0" step="0.1" inputMode="decimal" value={item.weight} onChange={(event) => updateLoad(item.id, "weight", event.target.value)} placeholder="Örn. 450" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`partial-load-${item.id}-length`}>Boy (cm)</Label>
                      <Input id={`partial-load-${item.id}-length`} type="number" min="0" step="0.1" inputMode="decimal" value={item.length} onChange={(event) => updateLoad(item.id, "length", event.target.value)} placeholder="Örn. 120" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`partial-load-${item.id}-width`}>En (cm)</Label>
                      <Input id={`partial-load-${item.id}-width`} type="number" min="0" step="0.1" inputMode="decimal" value={item.width} onChange={(event) => updateLoad(item.id, "width", event.target.value)} placeholder="Örn. 80" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`partial-load-${item.id}-height`}>Yükseklik (cm)</Label>
                      <Input id={`partial-load-${item.id}-height`} type="number" min="0" step="0.1" inputMode="decimal" value={item.height} onChange={(event) => updateLoad(item.id, "height", event.target.value)} placeholder="Örn. 150" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`partial-load-${item.id}-stackability`}>İstif durumu</Label>
                      <select
                        id={`partial-load-${item.id}-stackability`}
                        value={item.stackability}
                        onChange={(event) => updateLoad(item.id, "stackability", event.target.value)}
                        className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                      >
                        <option value="">Seçiniz</option>
                        <option value="İstiflenebilir">İstiflenebilir</option>
                        <option value="İstiflenemez">İstiflenemez</option>
                      </select>
                    </div>
                    {loads.length > 1 && (
                      <div className="flex items-end sm:col-span-1">
                        <button type="button" onClick={() => removeLoad(item.id)} aria-label={`${index + 1}. yük kalemini sil`} className="inline-flex h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200">
                          <Trash2 className="h-4 w-4" aria-hidden="true" /> Yükü kaldır
                        </button>
                      </div>
                    )}
                  </div>
                </fieldset>
              ))}
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="partial-ready-date">Yük hazır olma tarihi</Label>
                <Input id="partial-ready-date" type="date" value={readyDate} onChange={(event) => setReadyDate(event.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="partial-note">Ek bilgi / teslimat notu</Label>
                <textarea id="partial-note" value={note} onChange={(event) => setNote(event.target.value)} rows={3} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200" placeholder="Kat bilgisi, randevu, forklift ihtiyacı veya özel teslimat notu" />
              </div>
            </div>
          </div>

          <aside aria-live="polite" className="bg-slate-950 p-5 text-white sm:p-8">
            <div className="flex items-center gap-3 text-orange-400">
              <Gauge className="h-6 w-6" aria-hidden="true" />
              <p className="font-semibold">Teklif hazırlık durumu</p>
            </div>
            <div className="mt-4 flex items-end justify-between gap-4">
              <p className="text-4xl font-bold">%{completion}</p>
              <p className="pb-1 text-sm text-slate-300">{completedCount}/{requiredDetails.length} bilgi hazır</p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
              <div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${completion}%` }} />
            </div>

            <ul className="mt-6 space-y-2.5 text-sm">
              {requiredDetails.map((item) => (
                <li key={item.label} className={`flex items-center gap-2 ${item.complete ? "text-slate-200" : "text-slate-400"}`}>
                  {item.complete ? <CheckCircle2 className="h-4 w-4 flex-none text-green-400" aria-hidden="true" /> : <Circle className="h-4 w-4 flex-none" aria-hidden="true" />}
                  {item.label}
                </li>
              ))}
            </ul>

            <div className="mt-7 rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-orange-300"><PackageCheck className="h-4 w-4" /> Yük özeti</p>
              <p className="mt-2 text-xl font-bold">{completeLoads.length > 0 ? `${completeLoads.length} yük kalemi hazır` : "Yük bilgileri bekleniyor"}</p>
              <div className="mt-5 grid gap-3 text-sm text-slate-300">
                <span className="flex items-center gap-2"><PackageCheck className="h-4 w-4 flex-none text-orange-400" /> {displayValue(totalQuantity)} toplam adet</span>
                <span className="flex items-center gap-2"><Scale className="h-4 w-4 flex-none text-orange-400" /> {displayValue(totalWeight)} kg toplam ağırlık</span>
                <span className="flex items-center gap-2"><Truck className="h-4 w-4 flex-none text-orange-400" /> {displayValue(totalVolume, 3)} m³ yaklaşık hacim</span>
                <span className="flex items-center gap-2"><Ruler className="h-4 w-4 flex-none text-orange-400" /> {displayValue(totalLoadMeters, 2)} LDM tahmini araç yeri</span>
                <span className="flex items-center gap-2"><MapPin className="h-4 w-4 flex-none text-orange-400" /> Türkiye geneli rota planı</span>
              </div>
            </div>

            <a href={`https://wa.me/905434010755?text=${encodeURIComponent(whatsappText)}`} target="_blank" rel="noreferrer" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3.5 font-bold text-white transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300">
              <MessageCircle className="h-5 w-5" aria-hidden="true" /> Parsiyel teklifini WhatsApp’tan gönder
            </a>
            <p className="mt-3 text-xs leading-5 text-slate-400">
              Fiziksel hacim dış ölçü ve adetten hesaplanır. Tahmini araç yeri; 2,40 m araç genişliği ve istiflenebilir yüklerde 240 cm referans iç yükseklik kullanılarak LDM cinsinden hesaplanır. Yük dayanımı, araç tipi ve gerçek yerleşim teyidi sonucu değiştirebilir.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
