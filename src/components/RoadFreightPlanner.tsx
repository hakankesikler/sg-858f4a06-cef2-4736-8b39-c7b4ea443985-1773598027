"use client";

import { useState } from "react";
import { CheckCircle2, Circle, ClipboardCheck, MessageCircle, Route, Scale, Timer, Truck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const fieldClassName = "h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200";

const volumeOptions = [
  { value: "1-5", label: "1–5 palet / düşük hacim", model: "Parsiyel / grupaj", reason: "Kullanılan kapasiteye odaklanan konsolide seçenek önce incelenir." },
  { value: "6-15", label: "6–15 palet / orta hacim", model: "LTL parsiyel", reason: "Palet alanı ve toplam kilogram birlikte değerlendirilir." },
  { value: "16-26", label: "16–26 palet / yüksek hacim", model: "LTL–FTL karşılaştırması", reason: "Parsiyel kapasite ile araca özel maliyet aynı kapsamda karşılaştırılır." },
  { value: "full", label: "Komple araca yakın veya tam yük", model: "Komple araç / FTL", reason: "Kapasite ve teslim programı araca özel planlanır." },
] as const;

const laneOptions = ["Almanya", "Benelüks", "Fransa", "İtalya", "Orta Avrupa", "Balkanlar", "Diğer Avrupa hattı"];

export function RoadFreightPlanner() {
  const [direction, setDirection] = useState("Türkiye → Avrupa");
  const [lane, setLane] = useState("Almanya");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [description, setDescription] = useState("");
  const [volume, setVolume] = useState<(typeof volumeOptions)[number]["value"]>("1-5");
  const [weight, setWeight] = useState("");
  const [readyDate, setReadyDate] = useState("");
  const [stackable, setStackable] = useState("Bilinmiyor");
  const [priority, setPriority] = useState("Planlı / standart");

  const selectedVolume = volumeOptions.find((option) => option.value === volume) ?? volumeOptions[0];
  const requiredDetails = [
    { label: "Alım şehri / posta kodu", complete: origin.trim().length > 1 },
    { label: "Teslim şehri / posta kodu", complete: destination.trim().length > 1 },
    { label: "Ürün ve ambalaj tanımı", complete: description.trim().length > 2 },
    { label: "Toplam brüt ağırlık", complete: Number(weight.replace(",", ".")) > 0 },
    { label: "Yükün hazır olma tarihi", complete: Boolean(readyDate) },
    { label: "İstiflenebilirlik bilgisi", complete: stackable !== "Bilinmiyor" },
  ];

  const completedCount = requiredDetails.filter((item) => item.complete).length;
  const completion = Math.round((completedCount / requiredDetails.length) * 100);
  const suggestedModel = priority === "Zaman kritik"
    ? `${selectedVolume.model} + zaman hassas alternatif`
    : selectedVolume.model;

  const whatsappText = [
    "Merhaba, uluslararası karayolu parsiyel taşıma teklifi rica ederim.",
    `Yön: ${direction}`,
    `Hat: ${lane}`,
    `Alım: ${origin || "Belirtilecek"}`,
    `Teslim: ${destination || "Belirtilecek"}`,
    `Yük: ${description || "Belirtilecek"}`,
    `Hacim: ${selectedVolume.label}`,
    `Toplam brüt ağırlık: ${weight ? `${weight} kg` : "Belirtilecek"}`,
    `Hazır olma tarihi: ${readyDate || "Belirtilecek"}`,
    `İstiflenebilir: ${stackable}`,
    `Öncelik: ${priority}`,
  ].join("\n");

  return (
    <section aria-labelledby="road-planner-heading" className="bg-slate-50 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-semibold text-orange-600">Rota ve yük uygunluk ön kontrolü</p>
          <h2 id="road-planner-heading" className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">Yükünüzü anlatmadan önce teklifinizi hazırlayın</h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">Birkaç bilgiyle olası taşıma modelini görün, eksik bilgileri tamamlayın ve aynı özeti operasyon ekibimize iletin.</p>
        </div>

        <div className="mt-10 grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="p-5 sm:p-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="road-direction">Taşıma yönü</Label>
                <select id="road-direction" value={direction} onChange={(event) => setDirection(event.target.value)} className={fieldClassName}>
                  <option>Türkiye → Avrupa</option>
                  <option>Avrupa → Türkiye</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="road-lane">Ana hat</Label>
                <select id="road-lane" value={lane} onChange={(event) => setLane(event.target.value)} className={fieldClassName}>
                  {laneOptions.map((option) => <option key={option}>{option}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="road-origin">Alım şehri / posta kodu</Label>
                <Input id="road-origin" value={origin} onChange={(event) => setOrigin(event.target.value)} placeholder="Örn. Manisa 45030" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="road-destination">Teslim şehri / posta kodu</Label>
                <Input id="road-destination" value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="Örn. Stuttgart 70173" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="road-description">Ürün ve ambalaj</Label>
                <Input id="road-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Örn. Makine parçası, 3 Euro palet" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="road-volume">Yaklaşık yük hacmi</Label>
                <select id="road-volume" value={volume} onChange={(event) => setVolume(event.target.value as typeof volume)} className={fieldClassName}>
                  {volumeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="road-weight">Toplam brüt ağırlık (kg)</Label>
                <Input id="road-weight" type="number" min="0" step="0.1" inputMode="decimal" value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="Örn. 1850" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="road-ready-date">Yük hazır olma tarihi</Label>
                <Input id="road-ready-date" type="date" value={readyDate} onChange={(event) => setReadyDate(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="road-stackable">Paletler istiflenebilir mi?</Label>
                <select id="road-stackable" value={stackable} onChange={(event) => setStackable(event.target.value)} className={fieldClassName}>
                  <option>Bilinmiyor</option>
                  <option>Evet</option>
                  <option>Hayır</option>
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="road-priority">Teslim önceliği</Label>
                <select id="road-priority" value={priority} onChange={(event) => setPriority(event.target.value)} className={fieldClassName}>
                  <option>Planlı / standart</option>
                  <option>Zaman kritik</option>
                  <option>Maliyet öncelikli / esnek tarih</option>
                </select>
              </div>
            </div>
          </div>

          <aside aria-live="polite" className="bg-slate-950 p-5 text-white sm:p-8">
            <div className="flex items-center gap-3 text-orange-400">
              <ClipboardCheck className="h-6 w-6" aria-hidden="true" />
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
              <p className="flex items-center gap-2 text-sm font-semibold text-orange-300"><Truck className="h-4 w-4" /> Ön değerlendirme</p>
              <p className="mt-2 text-xl font-bold">{suggestedModel}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{selectedVolume.reason}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-300">
                <span className="flex items-center gap-1.5"><Route className="h-4 w-4 text-orange-400" /> Kapıdan kapıya rota</span>
                <span className="flex items-center gap-1.5"><Scale className="h-4 w-4 text-orange-400" /> Alan + kg kontrolü</span>
                <span className="flex items-center gap-1.5"><Timer className="h-4 w-4 text-orange-400" /> Süre–maliyet dengesi</span>
              </div>
            </div>

            <a href={`https://wa.me/905434010755?text=${encodeURIComponent(whatsappText)}`} target="_blank" rel="noreferrer" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3.5 font-bold text-white transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300">
              <MessageCircle className="h-5 w-5" aria-hidden="true" /> Özeti WhatsApp ile gönder
            </a>
            <p className="mt-3 text-xs leading-5 text-slate-400">Bu araç fiyat veya kesin transit süre üretmez. Nihai model, hat ve kapasite teyidinden sonra belirlenir.</p>
          </aside>
        </div>
      </div>
    </section>
  );
}
