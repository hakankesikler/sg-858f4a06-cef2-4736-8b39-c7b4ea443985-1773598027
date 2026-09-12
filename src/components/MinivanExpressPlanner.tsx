"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  Clock3,
  Gauge,
  MessageCircle,
  PackageCheck,
  Route,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const fieldClassName =
  "h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200";

const countryOptions = [
  "Almanya",
  "Benelüks",
  "Fransa",
  "İtalya",
  "Avusturya",
  "İsviçre",
  "Orta Avrupa",
  "Balkanlar",
  "İskandinavya",
  "Birleşik Krallık",
  "Diğer Avrupa ülkesi",
];

const comparisonModels = [
  { title: "Minivan Express", text: "Zaman kritik, düşük ve orta hacimli yükte; araca özel ve doğrudan karayolu planı." },
  { title: "Hava Kargo", text: "Çok hafif, kıtalar arası veya uçuş bağlantısının belirleyici olduğu gönderiler." },
  { title: "Karayolu Parsiyel", text: "Teslim tarihi esnek olan yükte, ortak kapasiteyle maliyet odağını güçlendiren plan." },
];

function parsePositiveNumber(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function MinivanExpressPlanner() {
  const [direction, setDirection] = useState("Türkiye → Avrupa");
  const [country, setCountry] = useState("Almanya");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [description, setDescription] = useState("");
  const [weight, setWeight] = useState("");
  const [volume, setVolume] = useState("");
  const [pallets, setPallets] = useState("");
  const [readyDate, setReadyDate] = useState("");
  const [priority, setPriority] = useState("Zaman kritik");

  const numericWeight = parsePositiveNumber(weight);
  const numericVolume = parsePositiveNumber(volume);
  const numericPallets = parsePositiveNumber(pallets);
  const hasCapacityData = numericWeight > 0 || numericVolume > 0 || numericPallets > 0;
  const exceedsReference = numericWeight > 1300 || numericVolume > 17 || numericPallets > 7;

  const requiredDetails = [
    { label: "Alım şehri / posta kodu", complete: origin.trim().length > 1 },
    { label: "Teslim şehri / posta kodu", complete: destination.trim().length > 1 },
    { label: "Ürün ve ambalaj tanımı", complete: description.trim().length > 2 },
    { label: "Ağırlık veya hacim bilgisi", complete: numericWeight > 0 || numericVolume > 0 },
    { label: "Yükün hazır olma tarihi", complete: Boolean(readyDate) },
  ];

  const completedCount = requiredDetails.filter((item) => item.complete).length;
  const completion = Math.round((completedCount / requiredDetails.length) * 100);

  const assessment = !hasCapacityData
    ? {
        title: "Minivan adayı — ölçü teyidi gerekli",
        text: "Ağırlık ve hacmi eklediğinizde yükün referans minivan kapasitesi içindeki durumunu göstereceğiz.",
      }
    : exceedsReference
      ? {
          title: "Alternatif araç karşılaştırılmalı",
          text: "Girilen değerlerden en az biri referans minivan kapasitesini aşıyor. Tenteli minivan, parsiyel veya daha büyük araca özel plan birlikte incelenmeli.",
        }
      : {
          title: priority === "Zaman kritik" ? "Dedike minivan için güçlü aday" : "Minivan–parsiyel karşılaştırmasına uygun",
          text: "Girilen değerler 1.300 kg, 17 m³ ve 7 Euro palet referans aralığında. Kesin uygunluk araç tipi, yük ölçüleri ve rota teyidiyle belirlenir.",
        };

  const whatsappText = [
    "Merhaba, Türkiye–Avrupa minivan express taşıma teklifi rica ederim.",
    `Yön: ${direction}`,
    `Ülke / hat: ${country}`,
    `Alım: ${origin || "Belirtilecek"}`,
    `Teslim: ${destination || "Belirtilecek"}`,
    `Yük: ${description || "Belirtilecek"}`,
    `Brüt ağırlık: ${weight ? `${weight} kg` : "Belirtilecek"}`,
    `Hacim: ${volume ? `${volume} m³` : "Belirtilecek"}`,
    `Palet: ${pallets || "Belirtilecek"}`,
    `Hazır olma tarihi: ${readyDate || "Belirtilecek"}`,
    `Öncelik: ${priority}`,
  ].join("\n");

  return (
    <section aria-labelledby="minivan-planner-heading" className="bg-slate-50 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-semibold text-orange-600">Minivan uygunluk ve teklif ön kontrolü</p>
          <h2 id="minivan-planner-heading" className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">
            Acil yükünüz için doğru aracı dakikalar içinde netleştirin
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            Rota, kapasite ve hazır olma bilgisini tamamlayın; minivanın güçlü bir aday olup olmadığını görün ve aynı özeti operasyon ekibimize iletin.
          </p>
        </div>

        <div className="mt-10 grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 lg:grid-cols-[1.35fr_0.85fr]">
          <div className="p-5 sm:p-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="minivan-direction">Taşıma yönü</Label>
                <select id="minivan-direction" value={direction} onChange={(event) => setDirection(event.target.value)} className={fieldClassName}>
                  <option>Türkiye → Avrupa</option>
                  <option>Avrupa → Türkiye</option>
                  <option>Avrupa → Avrupa</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="minivan-country">Ülke / ana hat</Label>
                <select id="minivan-country" value={country} onChange={(event) => setCountry(event.target.value)} className={fieldClassName}>
                  {countryOptions.map((option) => <option key={option}>{option}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="minivan-origin">Alım şehri / posta kodu</Label>
                <Input id="minivan-origin" value={origin} onChange={(event) => setOrigin(event.target.value)} placeholder="Örn. Manisa 45030" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minivan-destination">Teslim şehri / posta kodu</Label>
                <Input id="minivan-destination" value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="Örn. Stuttgart 70173" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="minivan-description">Ürün ve ambalaj</Label>
                <Input id="minivan-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Örn. Üretim hattı yedek parçası, 3 Euro palet" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minivan-weight">Toplam brüt ağırlık (kg)</Label>
                <Input id="minivan-weight" type="number" min="0" step="0.1" inputMode="decimal" value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="Örn. 850" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minivan-volume">Toplam hacim (m³)</Label>
                <Input id="minivan-volume" type="number" min="0" step="0.1" inputMode="decimal" value={volume} onChange={(event) => setVolume(event.target.value)} placeholder="Örn. 8,5" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minivan-pallets">Euro palet adedi</Label>
                <Input id="minivan-pallets" type="number" min="0" step="1" inputMode="numeric" value={pallets} onChange={(event) => setPallets(event.target.value)} placeholder="Örn. 4" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minivan-ready-date">Yük hazır olma tarihi</Label>
                <Input id="minivan-ready-date" type="date" value={readyDate} onChange={(event) => setReadyDate(event.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="minivan-priority">Teslim önceliği</Label>
                <select id="minivan-priority" value={priority} onChange={(event) => setPriority(event.target.value)} className={fieldClassName}>
                  <option>Zaman kritik</option>
                  <option>Planlı / standart</option>
                  <option>Maliyet öncelikli / esnek tarih</option>
                </select>
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
              <p className="flex items-center gap-2 text-sm font-semibold text-orange-300"><Truck className="h-4 w-4" /> Ön değerlendirme</p>
              <p className="mt-2 text-xl font-bold">{assessment.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{assessment.text}</p>
              <div className="mt-5 grid gap-3 text-xs text-slate-300 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <span className="flex items-center gap-2"><Route className="h-4 w-4 flex-none text-orange-400" /> Çift yönlü Avrupa hattı</span>
                <span className="flex items-center gap-2"><Clock3 className="h-4 w-4 flex-none text-orange-400" /> Zaman hedefi kontrolü</span>
                <span className="flex items-center gap-2"><PackageCheck className="h-4 w-4 flex-none text-orange-400" /> Kapasite eşleştirmesi</span>
                <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 flex-none text-orange-400" /> Doğrudan rota planı</span>
              </div>
            </div>

            <a href={`https://wa.me/905434010755?text=${encodeURIComponent(whatsappText)}`} target="_blank" rel="noreferrer" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3.5 font-bold text-white transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300">
              <MessageCircle className="h-5 w-5" aria-hidden="true" /> Minivan teklifini gönder
            </a>
            <p className="mt-3 text-xs leading-5 text-slate-400">
              Sonuç ön değerlendirmedir. Kesin araç, kapasite, rota ve tahmini transit süre operasyon teyidinden sonra paylaşılır.
            </p>
          </aside>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3" aria-label="Taşıma modeli karşılaştırması">
          {comparisonModels.map((item) => (
            <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-bold text-slate-950">{item.title}</h3>
              <p className="mt-2 leading-7 text-slate-600">{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
