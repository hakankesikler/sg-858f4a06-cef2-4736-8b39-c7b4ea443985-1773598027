"use client";

import { useState } from "react";
import { CheckCircle2, Circle, ClipboardCheck, MessageCircle, ShieldCheck } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type ServicePlannerVariant =
  | "complete"
  | "international-road"
  | "air"
  | "air-door"
  | "air-pickup"
  | "sea"
  | "sea-lcl"
  | "sea-fcl"
  | "express-import"
  | "express-export"
  | "storage";

type PlannerField = {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "number" | "date" | "select" | "textarea";
  options?: string[];
  required?: boolean;
  wide?: boolean;
};

type PlannerConfig = {
  eyebrow: string;
  title: string;
  description: string;
  serviceLabel: string;
  buttonLabel: string;
  note: string;
  fields: PlannerField[];
  defaults?: Record<string, string>;
};

const commonCargoFields: PlannerField[] = [
  { key: "cargo", label: "Yük / ürün açıklaması", placeholder: "Örn. Ambalajlı makine parçası", required: true, wide: true },
  { key: "packaging", label: "Adet ve ambalaj", placeholder: "Örn. 4 Euro palet" },
  { key: "weight", label: "Toplam brüt ağırlık (kg)", placeholder: "Örn. 1850", type: "number", required: true },
];

const airCargoFields: PlannerField[] = [
  { key: "cargo", label: "Ürün açıklaması", placeholder: "Örn. Otomotiv yedek parçası", required: true, wide: true },
  { key: "packages", label: "Koli / palet adedi", placeholder: "Örn. 3", type: "number" },
  { key: "dimensions", label: "Her parça için ölçüler (cm)", placeholder: "Örn. 120 × 80 × 95" },
  { key: "weight", label: "Toplam brüt ağırlık (kg)", placeholder: "Örn. 420", type: "number", required: true },
  { key: "special", label: "Özel ürün durumu", type: "select", options: ["Standart yük", "Batarya / bataryalı ürün", "Sıvı ürün", "Gıda", "Kozmetik", "Medikal ürün", "Diğer özel ürün"] },
  { key: "readyDate", label: "Yük hazır olma tarihi", type: "date" },
];

const plannerConfigs: Record<ServicePlannerVariant, PlannerConfig> = {
  complete: {
    eyebrow: "Yurtiçi komple araç teklif özeti",
    title: "Tam kamyon veya tır yükünüz için uygun aracı planlayalım",
    description: "Rota, yük ve tarih bilgilerini tamamlayın; operasyon ekibimiz kamyon veya tır seçimini, kapasiteyi ve teklif kapsamını birlikte değerlendirsin.",
    serviceLabel: "yurtiçi komple taşımacılık",
    buttonLabel: "Yurtiçi komple taşıma teklifini gönder",
    note: "Kesin araç tipi, fiyat ve süre; yükleme koşulları ile güncel kapasite teyidinden sonra paylaşılır.",
    fields: [
      { key: "origin", label: "Alım ili / ilçesi", placeholder: "Örn. Manisa / Yunusemre", required: true },
      { key: "destination", label: "Teslim ili / ilçesi", placeholder: "Örn. Ankara / Sincan", required: true },
      ...commonCargoFields,
      { key: "vehicle", label: "Araç tercihi", type: "select", options: ["Operasyon ekibi önersin", "Panelvan", "Kamyonet", "Kamyon", "Tır", "Tenteli", "Kapalı kasa", "Frigo"] },
      { key: "readyDate", label: "Yük hazır olma tarihi", type: "date" },
      { key: "note", label: "Yükleme / teslimat notu", placeholder: "Rampa, vinç, randevu veya saat bilgisi", type: "textarea", wide: true },
    ],
  },
  "international-road": {
    eyebrow: "Uluslararası karayolu teklif özeti",
    title: "Avrupa hattınızı WhatsApp teklifine dönüştürün",
    description: "Çıkış ve varış noktasıyla birlikte yükün kapasite ihtiyacını paylaşın; komple veya parsiyel seçenekler aynı kapsamda değerlendirilsin.",
    serviceLabel: "uluslararası karayolu taşımacılığı",
    buttonLabel: "Karayolu teklifini gönder",
    note: "Gümrük, teslim şekli ve sınır geçiş koşulları teklif öncesinde operasyon ekibi tarafından teyit edilir.",
    defaults: { direction: "Türkiye → Avrupa" },
    fields: [
      { key: "direction", label: "Taşıma yönü", type: "select", options: ["Türkiye → Avrupa", "Avrupa → Türkiye", "Avrupa içi"] },
      { key: "origin", label: "Alım ülkesi / şehir / posta kodu", placeholder: "Örn. Türkiye, İzmir 35630", required: true },
      { key: "destination", label: "Teslim ülkesi / şehir / posta kodu", placeholder: "Örn. Almanya, Stuttgart 70173", required: true },
      ...commonCargoFields,
      { key: "model", label: "Taşıma modeli", type: "select", options: ["Operasyon ekibi önersin", "Komple araç", "Parsiyel", "Minivan express"] },
      { key: "stackable", label: "İstif durumu", type: "select", options: ["Bilinmiyor", "İstiflenebilir", "İstiflenemez"] },
      { key: "readyDate", label: "Yük hazır olma tarihi", type: "date" },
      { key: "customs", label: "Gümrük / teslim şekli notu", placeholder: "Örn. EXW, ihracat gümrüğü İzmir", type: "textarea", wide: true },
    ],
  },
  air: {
    eyebrow: "Hava kargo teklif özeti",
    title: "Hava kargo rotanızı ve yükünüzü tek mesajda iletin",
    description: "Türkiye'nin her yerinden alım, uçuş ve son teslim bağlantısı için gerekli temel bilgileri düzenli bir WhatsApp özetine dönüştürün.",
    serviceLabel: "uluslararası hava kargo",
    buttonLabel: "Hava kargo teklifini gönder",
    note: "Ürün kabulü, ücretlendirilebilir ağırlık, uçuş ve kara bağlantısı teklif aşamasında doğrulanır.",
    defaults: { direction: "Türkiye → Yurt dışı", service: "Operasyon ekibi önersin", special: "Standart yük" },
    fields: [
      { key: "direction", label: "Taşıma yönü", type: "select", options: ["Türkiye → Yurt dışı", "Yurt dışı → Türkiye", "Üçüncü ülke"] },
      { key: "origin", label: "Alım ili / ülke / posta kodu", placeholder: "Örn. Manisa / Türkiye", required: true },
      { key: "destination", label: "Teslim ülkesi / şehir / posta kodu", placeholder: "Örn. Frankfurt 60311 / Almanya", required: true },
      ...airCargoFields,
      { key: "service", label: "Teslim kapsamı", type: "select", options: ["Operasyon ekibi önersin", "Havalimanından havalimanına", "Kapıdan kapıya", "Kapıdan havalimanına", "Havalimanından kapıya"] },
    ],
  },
  "air-door": {
    eyebrow: "Kapıdan kapıya hava kargo",
    title: "İki adres arasındaki hava kargo planını hazırlayın",
    description: "Alım ve teslim adreslerini, paket ölçülerini ve ürün bilgisini paylaşın; kara bağlantıları dahil teklif kapsamı netleşsin.",
    serviceLabel: "kapıdan kapıya hava kargo",
    buttonLabel: "Kapıdan kapıya teklifi gönder",
    note: "Adres kapsamı, gümrük süreçleri ve özel ürün kabulü rezervasyon öncesinde teyit edilir.",
    defaults: { direction: "Türkiye → Yurt dışı", special: "Standart yük" },
    fields: [
      { key: "direction", label: "Taşıma yönü", type: "select", options: ["Türkiye → Yurt dışı", "Yurt dışı → Türkiye"] },
      { key: "origin", label: "Gönderici açık adresi / posta kodu", placeholder: "İl, ilçe, ülke ve posta kodu", required: true },
      { key: "destination", label: "Alıcı açık adresi / posta kodu", placeholder: "Şehir, ülke ve posta kodu", required: true },
      ...airCargoFields,
      { key: "customs", label: "Teslim şekli / gümrük notu", placeholder: "Varsa Incoterms veya müşavir bilgisi", type: "textarea", wide: true },
    ],
  },
  "air-pickup": {
    eyebrow: "Türkiye geneli hava kargo alımı",
    title: "Yükünüz hangi şehirdeyse hava kargo planı oradan başlasın",
    description: "İzmir ve Manisa başta olmak üzere Türkiye'nin 81 ilinden alım adresini ve yurt dışı teslim noktasını tek mesajda paylaşın.",
    serviceLabel: "Türkiye genelinden adresten alımlı hava kargo",
    buttonLabel: "Adresten alım teklifini gönder",
    note: "Alım günü ve bağlantı havalimanı; adres, yük ve güncel uçuş planına göre belirlenir.",
    defaults: { special: "Standart yük" },
    fields: [
      { key: "origin", label: "Alım ili / ilçesi / posta kodu", placeholder: "Örn. Kemalpaşa / İzmir 35730", required: true },
      { key: "destination", label: "Varış ülkesi / şehir / posta kodu", placeholder: "Örn. Paris 75008 / Fransa", required: true },
      ...airCargoFields,
      { key: "pickupNote", label: "Alım adresi ve çalışma saati", placeholder: "Açık adres, yetkili ve uygun alım saati", type: "textarea", wide: true },
    ],
  },
  sea: {
    eyebrow: "Denizyolu teklif özeti",
    title: "LCL veya FCL denizyolu ihtiyacınızı birlikte netleştirelim",
    description: "Rota, yük ve teslim şeklini girin; parsiyel konteyner ile komple konteyner seçenekleri aynı bilgi setiyle değerlendirilsin.",
    serviceLabel: "uluslararası denizyolu taşımacılığı",
    buttonLabel: "Denizyolu teklifini gönder",
    note: "Hat, liman, serbest süre ve yerel masraf kapsamı rezervasyon öncesinde açıkça teyit edilir.",
    defaults: { direction: "Türkiye → Yurt dışı", model: "Operasyon ekibi önersin" },
    fields: [
      { key: "direction", label: "Taşıma yönü", type: "select", options: ["Türkiye → Yurt dışı", "Yurt dışı → Türkiye", "Üçüncü ülke"] },
      { key: "origin", label: "Çıkış adresi / limanı", placeholder: "Örn. İzmir / Aliağa", required: true },
      { key: "destination", label: "Varış adresi / limanı", placeholder: "Örn. Hamburg / Almanya", required: true },
      ...commonCargoFields,
      { key: "model", label: "Yükleme modeli", type: "select", options: ["Operasyon ekibi önersin", "LCL / parsiyel konteyner", "FCL / komple konteyner"] },
      { key: "capacity", label: "Hacim veya konteyner ihtiyacı", placeholder: "Örn. 8,5 m³ veya 1 × 40 HC" },
      { key: "readyDate", label: "Yük hazır olma tarihi", type: "date" },
      { key: "terms", label: "Incoterms / kapı-liman kapsamı", placeholder: "Örn. EXW, FOB, CFR veya kapıdan kapıya", type: "textarea", wide: true },
    ],
  },
  "sea-lcl": {
    eyebrow: "LCL parsiyel denizyolu teklif özeti",
    title: "Parsiyel denizyolu yükünüzün hacim ve rota özetini hazırlayın",
    description: "Koli veya palet bazındaki yükünüzü, toplam hacmi ve teslim kapsamını paylaşın; konsolidasyon seçeneği doğru verilerle araştırılsın.",
    serviceLabel: "LCL denizyolu parsiyel taşımacılığı",
    buttonLabel: "LCL teklifini gönder",
    note: "Ücretlendirilebilir hacim, istif durumu, liman masrafları ve konsolidasyon programı teklif aşamasında teyit edilir.",
    defaults: { direction: "Türkiye → Yurt dışı", stackable: "Bilinmiyor" },
    fields: [
      { key: "direction", label: "Taşıma yönü", type: "select", options: ["Türkiye → Yurt dışı", "Yurt dışı → Türkiye"] },
      { key: "origin", label: "Alım adresi / çıkış limanı", placeholder: "İl, ülke veya liman", required: true },
      { key: "destination", label: "Teslim adresi / varış limanı", placeholder: "Şehir, ülke veya liman", required: true },
      ...commonCargoFields,
      { key: "dimensions", label: "Palet / koli ölçüleri", placeholder: "Örn. 3 adet 120 × 80 × 110 cm" },
      { key: "volume", label: "Toplam hacim (m³)", placeholder: "Örn. 3,17", type: "number" },
      { key: "stackable", label: "İstif durumu", type: "select", options: ["Bilinmiyor", "İstiflenebilir", "İstiflenemez"] },
      { key: "readyDate", label: "Yük hazır olma tarihi", type: "date" },
      { key: "terms", label: "Incoterms / özel not", placeholder: "Örn. EXW ve adresten alım gerekli", type: "textarea", wide: true },
    ],
  },
  "sea-fcl": {
    eyebrow: "FCL konteyner teklif özeti",
    title: "Konteyner tipini, rotayı ve yükleme kapsamını paylaşın",
    description: "Konteyner adedi ve tipiyle birlikte yükün ağırlığını, çıkış-varış noktasını ve teslim şeklini WhatsApp özetine dönüştürün.",
    serviceLabel: "FCL komple konteyner taşımacılığı",
    buttonLabel: "Konteyner teklifini gönder",
    note: "Konteyner uygunluğu, taşıma hattı, serbest süre ve liman masrafları rezervasyon öncesinde teyit edilir.",
    defaults: { direction: "Türkiye → Yurt dışı", container: "40 HC", loading: "Fabrika yüklemeli" },
    fields: [
      { key: "direction", label: "Taşıma yönü", type: "select", options: ["Türkiye → Yurt dışı", "Yurt dışı → Türkiye", "Üçüncü ülke"] },
      { key: "origin", label: "Yükleme adresi / çıkış limanı", placeholder: "İl, ülke veya liman", required: true },
      { key: "destination", label: "Teslim adresi / varış limanı", placeholder: "Şehir, ülke veya liman", required: true },
      { key: "cargo", label: "Yük / ürün açıklaması", placeholder: "Örn. Ambalajlı makine ekipmanı", required: true, wide: true },
      { key: "container", label: "Konteyner tipi", type: "select", options: ["20 DC", "40 DC", "40 HC", "20 OT", "40 OT", "20 FR", "40 FR", "Reefer", "Operasyon ekibi önersin"] },
      { key: "count", label: "Konteyner adedi", placeholder: "Örn. 1", type: "number" },
      { key: "weight", label: "Konteyner başına brüt ağırlık (kg)", placeholder: "Örn. 18500", type: "number", required: true },
      { key: "loading", label: "Yükleme şekli", type: "select", options: ["Fabrika yüklemeli", "Liman / depo yüklemeli", "Operasyon ekibi önersin"] },
      { key: "readyDate", label: "Yük hazır olma tarihi", type: "date" },
      { key: "terms", label: "Incoterms / özel ekipman notu", placeholder: "Örn. FOB, SOC/COC veya ağır yük bilgisi", type: "textarea", wide: true },
    ],
  },
  "express-import": {
    eyebrow: "Express ithalat teklif özeti",
    title: "Yurt dışındaki tedarikçinizden Türkiye'ye alım talebi oluşturun",
    description: "Tedarikçi adresi, paket ölçüsü ve Türkiye teslim noktasını paylaşın; uygun global express servisleri aynı bilgilerle karşılaştırılsın.",
    serviceLabel: "yurt dışından Türkiye'ye express kargo",
    buttonLabel: "Express ithalat teklifini gönder",
    note: "Ürün kabulü, vergi ve resmi ithalat koşulları rezervasyon öncesinde ayrıca değerlendirilir.",
    defaults: { special: "Standart yük" },
    fields: [
      { key: "origin", label: "Çıkış ülkesi / şehir / posta kodu", placeholder: "Örn. Almanya, Stuttgart 70173", required: true },
      { key: "supplier", label: "Tedarikçi alım adresi / yetkilisi", placeholder: "Firma, açık adres ve telefon", required: true },
      { key: "destination", label: "Türkiye teslim ili / ilçesi", placeholder: "Örn. İzmir / Bayraklı", required: true },
      ...airCargoFields,
      { key: "value", label: "Ürün değeri / para birimi", placeholder: "Örn. 750 EUR" },
    ],
  },
  "express-export": {
    eyebrow: "Express ihracat teklif özeti",
    title: "Türkiye'den yurt dışına paket gönderinizi hazırlayın",
    description: "Türkiye alım adresini, varış posta kodunu ve paket ölçülerini paylaşın; hız ve toplam maliyet önceliğinize uygun servis araştırılsın.",
    serviceLabel: "Türkiye'den yurt dışına express kargo",
    buttonLabel: "Express ihracat teklifini gönder",
    note: "Kesin kabul ve süre; ürün, değer, evrak, posta kodu ve güncel servis kapasitesine göre teyit edilir.",
    defaults: { preference: "Dengeli süre ve maliyet", special: "Standart yük" },
    fields: [
      { key: "origin", label: "Türkiye alım ili / ilçesi / posta kodu", placeholder: "Örn. Yunusemre / Manisa 45030", required: true },
      { key: "destination", label: "Varış ülkesi / şehir / posta kodu", placeholder: "Örn. Münih 80331 / Almanya", required: true },
      ...airCargoFields,
      { key: "value", label: "Ürün değeri / para birimi", placeholder: "Örn. 500 EUR" },
      { key: "preference", label: "Teklif önceliği", type: "select", options: ["Dengeli süre ve maliyet", "En hızlı uygun servis", "Maliyet öncelikli servis"] },
    ],
  },
  storage: {
    eyebrow: "Depolama ihtiyaç özeti",
    title: "Depolama ve dağıtım ihtiyacınızı WhatsApp'ta net anlatın",
    description: "Ürün, alan, süre ve aylık hareket bilgilerini paylaşın; depolama ile sevkiyat operasyonu birlikte planlansın.",
    serviceLabel: "depolama, elleçleme ve dağıtım",
    buttonLabel: "Depolama teklifini gönder",
    note: "Uygun depo modeli ve fiyat; ürün niteliği, gerçek kapasite, hareket sıklığı ve hizmet kapsamı teyidinden sonra paylaşılır.",
    defaults: { location: "İzmir / Manisa", unit: "Palet", duration: "Sürekli" },
    fields: [
      { key: "location", label: "Tercih edilen bölge", placeholder: "Örn. İzmir / Manisa", required: true },
      { key: "product", label: "Ürün ve ambalaj türü", placeholder: "Örn. Kolili yedek parça", required: true },
      { key: "unit", label: "Kapasite birimi", type: "select", options: ["Palet", "Koli", "Metrekare", "Metreküp", "Operasyon ekibi önersin"] },
      { key: "capacity", label: "Yaklaşık kapasite", placeholder: "Örn. 80 palet", required: true },
      { key: "duration", label: "Depolama süresi", type: "select", options: ["Sürekli", "1 aydan kısa", "1–3 ay", "3–6 ay", "6 aydan uzun", "Proje bazlı"] },
      { key: "movement", label: "Aylık giriş / çıkış", placeholder: "Örn. 40 palet giriş, 35 palet çıkış" },
      { key: "services", label: "Ek hizmetler", placeholder: "Sayım, etiketleme, paketleme, sipariş hazırlama", type: "textarea", wide: true },
      { key: "distribution", label: "Dağıtım ihtiyacı", placeholder: "Şehirler, teslimat sıklığı ve ortalama sipariş", type: "textarea", wide: true },
    ],
  },
};

const selectClassName = "flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100";

export function ServiceWhatsAppPlanner({ variant }: { variant: ServicePlannerVariant }) {
  const config = plannerConfigs[variant];
  const [values, setValues] = useState<Record<string, string>>(() => ({
    ...Object.fromEntries(
      config.fields
        .filter((field) => field.type === "select" && field.options?.length)
        .map((field) => [field.key, field.options?.[0] ?? ""]),
    ),
    ...config.defaults,
  }));
  const requiredFields = config.fields.filter((field) => field.required);
  const completedCount = requiredFields.filter((field) => values[field.key]?.trim()).length;
  const isReady = completedCount === requiredFields.length;
  const completion = Math.round((completedCount / requiredFields.length) * 100);
  const missingLabels = requiredFields.filter((field) => !values[field.key]?.trim()).map((field) => field.label);

  const updateValue = (key: string, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const message = [
    `Merhaba REX Lojistik, ${config.serviceLabel} için teklif rica ediyorum.`,
    "",
    ...config.fields
      .filter((field) => values[field.key]?.trim())
      .map((field) => `${field.label}: ${values[field.key].trim()}`),
    "",
    "Uygun operasyonu, tahmini süreyi ve toplam fiyat kapsamını paylaşabilir misiniz?",
  ].join("\n");

  const whatsappUrl = `https://wa.me/905434010755?text=${encodeURIComponent(message)}`;

  return (
    <section aria-labelledby={`${variant}-whatsapp-planner-heading`} className="border-y border-slate-200 bg-slate-50 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="p-5 sm:p-8">
            <p className="font-semibold text-orange-600">{config.eyebrow}</p>
            <h2 id={`${variant}-whatsapp-planner-heading`} className="mt-2 max-w-3xl text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">{config.title}</h2>
            <p className="mt-4 max-w-3xl leading-7 text-slate-600">{config.description}</p>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {config.fields.map((field) => {
                const id = `${variant}-${field.key}`;
                const value = values[field.key] ?? "";
                return (
                  <div key={field.key} className={field.wide ? "sm:col-span-2" : undefined}>
                    <Label htmlFor={id}>{field.label}{field.required ? " *" : ""}</Label>
                    {field.type === "select" ? (
                      <select id={id} value={value} onChange={(event) => updateValue(field.key, event.target.value)} className={`${selectClassName} mt-2`}>
                        {field.options?.map((option) => <option key={option}>{option}</option>)}
                      </select>
                    ) : field.type === "textarea" ? (
                      <Textarea id={id} value={value} onChange={(event) => updateValue(field.key, event.target.value)} placeholder={field.placeholder} rows={3} className="mt-2" />
                    ) : (
                      <Input
                        id={id}
                        type={field.type === "number" || field.type === "date" ? field.type : "text"}
                        min={field.type === "number" ? "0" : undefined}
                        step={field.type === "number" ? "0.01" : undefined}
                        inputMode={field.type === "number" ? "decimal" : undefined}
                        value={value}
                        onChange={(event) => updateValue(field.key, event.target.value)}
                        placeholder={field.placeholder}
                        className="mt-2 h-11"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <aside aria-live="polite" className="bg-slate-950 p-5 text-white sm:p-8">
            <div className="flex items-center gap-3 text-orange-400">
              <ClipboardCheck className="h-6 w-6" aria-hidden="true" />
              <p className="font-semibold">Teklif hazırlık durumu</p>
            </div>
            <div className="mt-4 flex items-end justify-between gap-4">
              <p className="text-4xl font-bold">%{completion}</p>
              <p className="pb-1 text-sm text-slate-300">{completedCount}/{requiredFields.length} temel bilgi hazır</p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
              <div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${completion}%` }} />
            </div>

            <ul className="mt-6 space-y-2.5 text-sm">
              {requiredFields.map((field) => {
                const complete = Boolean(values[field.key]?.trim());
                return (
                  <li key={field.key} className={`flex items-center gap-2 ${complete ? "text-slate-200" : "text-slate-400"}`}>
                    {complete ? <CheckCircle2 className="h-4 w-4 flex-none text-green-400" aria-hidden="true" /> : <Circle className="h-4 w-4 flex-none" aria-hidden="true" />}
                    {field.label}
                  </li>
                );
              })}
            </ul>

            <div className="mt-7 rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="flex items-center gap-2 font-bold text-white"><ShieldCheck className="h-5 w-5 text-orange-400" /> Doğru kapsam, daha hızlı teklif</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{config.note}</p>
            </div>

            <a
              href={isReady ? whatsappUrl : undefined}
              target="_blank"
              rel="noreferrer"
              aria-disabled={!isReady}
              tabIndex={isReady ? undefined : -1}
              className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 font-bold text-white transition focus:outline-none focus:ring-2 focus:ring-green-300 ${isReady ? "bg-green-600 hover:bg-green-700" : "pointer-events-none bg-slate-600 text-slate-300"}`}
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" /> {config.buttonLabel}
            </a>
            {!isReady ? <p className="mt-3 text-xs leading-5 text-slate-400">WhatsApp özeti için: {missingLabels.join(", ")}.</p> : null}
          </aside>
        </div>
      </div>
    </section>
  );
}
