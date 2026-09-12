"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Calculator,
  CheckCircle2,
  FileCheck2,
  Gauge,
  MessageCircle,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Direction = "export" | "import";
type Preference = "economy" | "balanced" | "speed";
type ProductType = "standard" | "battery" | "liquid" | "food" | "cosmetic" | "medicine";

const productOptions: Array<{ value: ProductType; label: string }> = [
  { value: "standard", label: "Standart ticari ürün / numune" },
  { value: "battery", label: "Batarya veya bataryalı ürün" },
  { value: "liquid", label: "Sıvı ürün" },
  { value: "food", label: "Gıda" },
  { value: "cosmetic", label: "Kozmetik" },
  { value: "medicine", label: "İlaç / medikal ürün" },
];

const preferenceOptions: Array<{
  value: Preference;
  title: string;
  eyebrow: string;
  description: string;
  icon: typeof Gauge;
}> = [
  {
    value: "economy",
    title: "Ekonomik plan",
    eyebrow: "Maliyet öncelikli",
    description: "Teslim hedefini koruyan daha ekonomik servis seçenekleri araştırılır.",
    icon: Calculator,
  },
  {
    value: "balanced",
    title: "Dengeli plan",
    eyebrow: "REX önerisi",
    description: "Toplam maliyet, kapsama ve planlanan transit süre birlikte değerlendirilir.",
    icon: Gauge,
  },
  {
    value: "speed",
    title: "Öncelikli plan",
    eyebrow: "Süre öncelikli",
    description: "Uygun rotadaki en erken hareket ve teslim alternatifleri araştırılır.",
    icon: Zap,
  },
];

const routePages = [
  { href: "/almanyaya-express-kargo", label: "Almanya'ya express kargo", direction: "Türkiye → Almanya" },
  { href: "/amerikaya-express-kargo", label: "Amerika'ya express kargo", direction: "Türkiye → ABD" },
  { href: "/ingiltereye-express-kargo", label: "İngiltere'ye express kargo", direction: "Türkiye → Birleşik Krallık" },
  { href: "/cinden-turkiyeye-express-kargo", label: "Çin'den express ithalat", direction: "Çin → Türkiye" },
];

function numberValue(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function formatWeight(value: number) {
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(value);
}

export function ExpressQuotePlanner() {
  const [direction, setDirection] = useState<Direction>("export");
  const [preference, setPreference] = useState<Preference>("balanced");
  const [originCountry, setOriginCountry] = useState("Türkiye");
  const [originPostalCode, setOriginPostalCode] = useState("");
  const [destinationCountry, setDestinationCountry] = useState("Almanya");
  const [destinationPostalCode, setDestinationPostalCode] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [unitWeight, setUnitWeight] = useState("");
  const [productType, setProductType] = useState<ProductType>("standard");
  const [description, setDescription] = useState("");

  const calculation = useMemo(() => {
    const packageCount = Math.max(1, numberValue(quantity));
    const actualWeight = numberValue(unitWeight) * packageCount;
    const volumetricWeight = (
      numberValue(length) * numberValue(width) * numberValue(height) * packageCount
    ) / 5_000;

    return {
      packageCount,
      actualWeight,
      volumetricWeight,
      chargeableWeight: Math.max(actualWeight, volumetricWeight),
    };
  }, [height, length, quantity, unitWeight, width]);

  const selectedPreference = preferenceOptions.find((item) => item.value === preference) ?? preferenceOptions[1];
  const selectedProduct = productOptions.find((item) => item.value === productType) ?? productOptions[0];
  const needsAcceptanceCheck = productType !== "standard";
  const hasCalculation = calculation.chargeableWeight > 0;

  const handleDirection = (value: Direction) => {
    setDirection(value);
    if (value === "export") {
      setOriginCountry("Türkiye");
      if (destinationCountry === "Türkiye") setDestinationCountry("Almanya");
      return;
    }
    setDestinationCountry("Türkiye");
    if (originCountry === "Türkiye") setOriginCountry("Almanya");
  };

  const whatsappText = [
    "Merhaba REX Lojistik, uluslararası express gönderim için teklif rica ediyorum.",
    "",
    `Yön: ${direction === "export" ? "Türkiye'den yurt dışına" : "Yurt dışından Türkiye'ye"}`,
    `Rota: ${originCountry}${originPostalCode ? ` (${originPostalCode})` : ""} → ${destinationCountry}${destinationPostalCode ? ` (${destinationPostalCode})` : ""}`,
    `Tercih: ${selectedPreference.title}`,
    `Paket: ${formatWeight(calculation.packageCount)} adet`,
    `Ölçü: ${length || "-"} × ${width || "-"} × ${height || "-"} cm`,
    `Birim gerçek ağırlık: ${unitWeight || "-"} kg`,
    `Yaklaşık ücretlendirilebilir ağırlık: ${formatWeight(calculation.chargeableWeight)} kg`,
    `Ürün grubu: ${selectedProduct.label}`,
    description.trim() ? `İçerik: ${description.trim()}` : "",
    "",
    "Uygun servis, planlanan transit süre ve toplam kapsamı paylaşabilir misiniz?",
  ].filter(Boolean).join("\n");

  const whatsappHref = `https://wa.me/905434010755?text=${encodeURIComponent(whatsappText)}`;

  return (
    <section id="express-teklif-planlayici" aria-labelledby="planner-heading" className="border-y border-slate-200 bg-slate-50 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="flex items-center gap-2 font-semibold text-orange-600"><Sparkles className="h-5 w-5" aria-hidden="true" /> Akıllı express ön analiz</p>
            <h2 id="planner-heading" className="mt-3 max-w-3xl text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">Gönderinizi anlatın, doğru teklif talebini birlikte hazırlayalım</h2>
          </div>
          <p className="max-w-2xl text-lg leading-8 text-slate-600">Bu araç kesin fiyat veya teslim taahhüdü vermez. Rota, paket ve ürün bilgilerinizi düzenleyerek REX operasyon ekibinin ekonomik, hızlı ve dengeli servis seçeneklerini daha isabetli karşılaştırmasını sağlar.</p>
        </div>

        <div className="mt-10 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-8 p-5 sm:p-8">
              <fieldset>
                <legend className="text-lg font-bold text-slate-950">1. Gönderi yönü</legend>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {([
                    ["export", "Türkiye'den yurt dışına", "İhracat / giden gönderi"],
                    ["import", "Yurt dışından Türkiye'ye", "İthalat / adresten alım"],
                  ] as const).map(([value, title, subtitle]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleDirection(value)}
                      aria-pressed={direction === value}
                      className={`rounded-2xl border p-4 text-left transition ${direction === value ? "border-orange-500 bg-orange-50 ring-2 ring-orange-100" : "border-slate-200 hover:border-slate-400"}`}
                    >
                      <span className="block font-bold text-slate-950">{title}</span>
                      <span className="mt-1 block text-sm text-slate-600">{subtitle}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-lg font-bold text-slate-950">2. Rota ve posta kodları</legend>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="express-origin-country">Çıkış ülkesi</Label>
                    <Input id="express-origin-country" value={originCountry} onChange={(event) => setOriginCountry(event.target.value)} placeholder="Türkiye" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="express-origin-postal">Çıkış posta kodu</Label>
                    <Input id="express-origin-postal" value={originPostalCode} onChange={(event) => setOriginPostalCode(event.target.value)} placeholder="Örn. 35630" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="express-destination-country">Varış ülkesi</Label>
                    <Input id="express-destination-country" value={destinationCountry} onChange={(event) => setDestinationCountry(event.target.value)} placeholder="Almanya" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="express-destination-postal">Varış posta kodu</Label>
                    <Input id="express-destination-postal" value={destinationPostalCode} onChange={(event) => setDestinationPostalCode(event.target.value)} placeholder="Örn. 60311" />
                  </div>
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-lg font-bold text-slate-950">3. Paket bilgileri</legend>
                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  {([
                    ["express-quantity", "Adet", quantity, setQuantity, "1"],
                    ["express-length", "Boy (cm)", length, setLength, "40"],
                    ["express-width", "En (cm)", width, setWidth, "30"],
                    ["express-height", "Yükseklik (cm)", height, setHeight, "25"],
                    ["express-unit-weight", "Birim kg", unitWeight, setUnitWeight, "4"],
                  ] as const).map(([id, label, value, setter, placeholder]) => (
                    <div key={id} className="space-y-2">
                      <Label htmlFor={id}>{label}</Label>
                      <Input id={id} type="number" min="0" step="0.1" inputMode="decimal" value={value} onChange={(event) => setter(event.target.value)} placeholder={placeholder} />
                    </div>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-lg font-bold text-slate-950">4. Ürün ve kabul ön kontrolü</legend>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="express-product-type">Ürün grubu</Label>
                    <select
                      id="express-product-type"
                      value={productType}
                      onChange={(event) => setProductType(event.target.value as ProductType)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {productOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="express-description">Açık ürün tanımı</Label>
                    <Textarea id="express-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder="Örn. Çelik makine yedek parçası, ticari numune" />
                  </div>
                </div>
              </fieldset>
            </div>

            <aside className="border-t border-slate-200 bg-slate-950 p-5 text-white sm:p-8 lg:border-l lg:border-t-0">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-400">Gönderi özeti</p>
              <div aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-400">Rota</p>
                  <p className="mt-1 font-bold">{originCountry || "Çıkış"} → {destinationCountry || "Varış"}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-400">Gerçek / hacimsel ağırlık</p>
                  <p className="mt-1 font-bold">{formatWeight(calculation.actualWeight)} / {formatWeight(calculation.volumetricWeight)} kg</p>
                </div>
                <div className="rounded-2xl border border-orange-400/40 bg-orange-500/10 p-4">
                  <p className="text-sm text-orange-200">Yaklaşık ücretlendirilebilir</p>
                  <p className="mt-1 text-2xl font-bold">{formatWeight(calculation.chargeableWeight)} kg</p>
                </div>
              </div>

              <div className={`mt-5 rounded-2xl border p-4 ${needsAcceptanceCheck ? "border-amber-400/40 bg-amber-400/10" : "border-emerald-400/40 bg-emerald-400/10"}`}>
                <p className="flex items-center gap-2 font-bold">
                  {needsAcceptanceCheck ? <ShieldCheck className="h-5 w-5 text-amber-300" /> : <PackageCheck className="h-5 w-5 text-emerald-300" />}
                  {needsAcceptanceCheck ? "Ön kabul kontrolü gerekli" : "Standart ön değerlendirme"}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{needsAcceptanceCheck ? "Ürün içeriği, teknik belge, paketleme ve hat kuralları rezervasyon öncesinde teyit edilmelidir." : "Kesin kabul; açık ürün tanımı, değer, rota ve seçilen servise göre doğrulanır."}</p>
              </div>

              <div className="mt-6">
                <p className="font-bold">Hazırlanması gerekenler</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {(direction === "export"
                    ? ["Gönderici ve alıcı tam adresi", "Ticari fatura veya uygun proforma", "Ürün tanımı, miktarı ve değeri"]
                    : ["Tedarikçi alım adresi ve yetkilisi", "Tedarikçi faturası / ürün değeri", "Türkiye teslim adresi ve alıcı bilgisi"]
                  ).map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-orange-400" />{item}</li>)}
                </ul>
              </div>
            </aside>
          </div>

          <div className="border-t border-slate-200 bg-slate-50 p-5 sm:p-8">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="font-semibold text-orange-600">5. Teklif önceliğiniz</p>
                <h3 className="mt-1 text-2xl font-bold text-slate-950">Sizin için neyi öne alalım?</h3>
              </div>
              <p className="max-w-xl text-sm leading-6 text-slate-600">Aşağıdaki seçenekler fiyat veya süre garantisi değildir; operasyon ekibinin araştıracağı servis önceliğini belirler.</p>
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {preferenceOptions.map(({ value, title, eyebrow, description: optionDescription, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPreference(value)}
                  aria-pressed={preference === value}
                  className={`relative rounded-2xl border p-5 text-left transition ${preference === value ? "border-orange-500 bg-white ring-2 ring-orange-100 shadow-lg" : "border-slate-200 bg-white hover:border-slate-400"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <Icon className={`h-6 w-6 ${preference === value ? "text-orange-600" : "text-slate-500"}`} aria-hidden="true" />
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${value === "balanced" ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-600"}`}>{eyebrow}</span>
                  </div>
                  <p className="mt-4 text-lg font-bold text-slate-950">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{optionDescription}</p>
                </button>
              ))}
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href={hasCalculation ? whatsappHref : undefined}
                target="_blank"
                rel="noreferrer"
                aria-disabled={!hasCalculation}
                tabIndex={hasCalculation ? undefined : -1}
                className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 py-3 font-bold text-white transition ${hasCalculation ? "bg-green-600 hover:bg-green-700" : "pointer-events-none bg-slate-400"}`}
              >
                <MessageCircle className="h-5 w-5" aria-hidden="true" /> Özeti WhatsApp'tan gönder
              </a>
            </div>
            {!hasCalculation ? <p className="mt-3 text-sm text-slate-500">WhatsApp özeti için paket ölçülerini ve ağırlığını girin.</p> : null}
          </div>
        </div>

        <div className="mt-12">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="flex items-center gap-2 font-semibold text-orange-600"><BadgeCheck className="h-5 w-5" /> Sık kullanılan rotalar</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-950">Ülkeye özel express kargo rehberleri</h2>
            </div>
            <Link href="/yurtdisi-kargo-gonderim-rehberi" className="inline-flex items-center gap-2 font-bold text-slate-800 hover:text-orange-600"><FileCheck2 className="h-5 w-5" /> Genel gönderim rehberi</Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {routePages.map((item) => (
              <Link key={item.href} href={item.href} className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:border-orange-300 hover:shadow-xl">
                <p className="text-sm font-semibold text-orange-600">{item.direction}</p>
                <p className="mt-2 font-bold text-slate-950 group-hover:text-orange-600">{item.label}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-600">Rehberi aç <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
