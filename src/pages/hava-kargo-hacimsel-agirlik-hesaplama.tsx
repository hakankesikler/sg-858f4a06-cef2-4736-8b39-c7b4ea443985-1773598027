import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Calculator, Plus, Trash2 } from "lucide-react";
import { AirCargoResourcePage } from "@/components/AirCargoResourcePage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { marketingPages } from "@/content/marketing-pages";

type ParcelRow = {
  id: number;
  description: string;
  quantity: string;
  length: string;
  width: string;
  height: string;
  unitWeight: string;
};

const emptyRow = (id: number): ParcelRow => ({
  id,
  description: "",
  quantity: "1",
  length: "",
  width: "",
  height: "",
  unitWeight: "",
});

const parseValue = (value: string) => {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const formatNumber = (value: number, digits = 2) => new Intl.NumberFormat("tr-TR", {
  minimumFractionDigits: digits,
  maximumFractionDigits: digits,
}).format(value);

const faq = [
  { question: "Hava kargo hacimsel ağırlığı nasıl hesaplanır?", answer: "Yaygın planlama hesabında santimetre cinsinden boy × en × yükseklik × adet sonucu 6.000'e bölünür. Taşıyıcı ve servis kuralları farklı bir bölen uygulayabilir." },
  { question: "Gerçek ağırlık mı hacimsel ağırlık mı kullanılır?", answer: "Genellikle iki değerden yüksek olan ücretlendirilebilir ağırlık olarak değerlendirilir. Nihai kabul ve fiyatlandırma havayolu ile hizmet koşullarına bağlıdır." },
  { question: "Palet ölçüsü hesaba dahil edilmeli mi?", answer: "Evet. Taşıma sırasında kaplanan en dış boy, en ve yükseklik ile palet dahil toplam brüt ağırlık kullanılmalıdır." },
  { question: "Bu sonuç kesin hava kargo fiyatını verir mi?", answer: "Hayır. Rota, ürün, uçuş kapasitesi, hazır olma tarihi, kapı bağlantıları ve ek hizmetler bilinmeden kesin fiyat oluşmaz." },
];

export default function HavaKargoHacimselAgirlikHesaplamaPage() {
  const page = marketingPages["hava-kargo-hacimsel-agirlik-hesaplama"];
  const [rows, setRows] = useState<ParcelRow[]>([emptyRow(1)]);
  const [nextId, setNextId] = useState(2);

  const totals = useMemo(() => rows.reduce((total, row) => {
    const quantity = parseValue(row.quantity);
    const volumeCm3 = parseValue(row.length) * parseValue(row.width) * parseValue(row.height) * quantity;
    const actualWeight = parseValue(row.unitWeight) * quantity;
    return {
      volumeM3: total.volumeM3 + (volumeCm3 / 1_000_000),
      volumetricWeight: total.volumetricWeight + (volumeCm3 / 6_000),
      actualWeight: total.actualWeight + actualWeight,
    };
  }, { volumeM3: 0, volumetricWeight: 0, actualWeight: 0 }), [rows]);

  const chargeableWeight = Math.max(totals.actualWeight, totals.volumetricWeight);

  const updateRow = (id: number, field: keyof Omit<ParcelRow, "id">, value: string) => {
    setRows((current) => current.map((row) => row.id === id ? { ...row, [field]: value } : row));
  };

  const addRow = () => {
    setRows((current) => [...current, emptyRow(nextId)]);
    setNextId((current) => current + 1);
  };

  const removeRow = (id: number) => {
    setRows((current) => current.length === 1 ? current : current.filter((row) => row.id !== id));
  };

  return (
    <AirCargoResourcePage page={page} readingTime="4 dakika" faq={faq}>
      <div className="space-y-14">
        <section aria-labelledby="air-calculator-heading" className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-5 sm:flex-row sm:items-center sm:px-7">
            <div>
              <p className="flex items-center gap-2 font-semibold text-orange-600"><Calculator className="h-5 w-5" aria-hidden="true" /> Ücretsiz planlama aracı</p>
              <h2 id="air-calculator-heading" className="mt-1 text-2xl font-bold text-slate-950">Koli ve paletlerinizi ayrı ayrı girin</h2>
            </div>
            <Button type="button" onClick={addRow} className="gap-2 bg-slate-950 hover:bg-orange-600"><Plus className="h-4 w-4" /> Yük satırı ekle</Button>
          </div>

          <div className="space-y-5 p-5 sm:p-7">
            {rows.map((row, index) => {
              const quantity = parseValue(row.quantity);
              const rowVolumeWeight = (parseValue(row.length) * parseValue(row.width) * parseValue(row.height) * quantity) / 6_000;
              return (
                <fieldset key={row.id} className="rounded-2xl border border-slate-200 p-4 sm:p-5">
                  <legend className="px-2 font-bold text-slate-900">Paket {index + 1}</legend>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-7">
                    <div className="space-y-2 sm:col-span-2 lg:col-span-2">
                      <Label htmlFor={`air-description-${row.id}`}>Yük açıklaması</Label>
                      <Input id={`air-description-${row.id}`} value={row.description} onChange={(event) => updateRow(row.id, "description", event.target.value)} placeholder="Örn. Makine yedek parçası" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`air-quantity-${row.id}`}>Adet</Label>
                      <Input id={`air-quantity-${row.id}`} type="number" inputMode="decimal" min="1" step="1" value={row.quantity} onChange={(event) => updateRow(row.id, "quantity", event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`air-length-${row.id}`}>Boy (cm)</Label>
                      <Input id={`air-length-${row.id}`} type="number" inputMode="decimal" min="0" step="0.1" value={row.length} onChange={(event) => updateRow(row.id, "length", event.target.value)} placeholder="60" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`air-width-${row.id}`}>En (cm)</Label>
                      <Input id={`air-width-${row.id}`} type="number" inputMode="decimal" min="0" step="0.1" value={row.width} onChange={(event) => updateRow(row.id, "width", event.target.value)} placeholder="40" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`air-height-${row.id}`}>Yükseklik (cm)</Label>
                      <Input id={`air-height-${row.id}`} type="number" inputMode="decimal" min="0" step="0.1" value={row.height} onChange={(event) => updateRow(row.id, "height", event.target.value)} placeholder="40" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`air-weight-${row.id}`}>Birim brüt kg</Label>
                      <Input id={`air-weight-${row.id}`} type="number" inputMode="decimal" min="0" step="0.1" value={row.unitWeight} onChange={(event) => updateRow(row.id, "unitWeight", event.target.value)} placeholder="12" />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <p className="text-sm text-slate-600">Satır hacimsel ağırlığı: <strong className="text-slate-950">{formatNumber(rowVolumeWeight)} kg</strong></p>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeRow(row.id)} disabled={rows.length === 1} className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700">
                      <Trash2 className="h-4 w-4" /> Satırı sil
                    </Button>
                  </div>
                </fieldset>
              );
            })}
          </div>

          <div aria-live="polite" className="grid gap-px bg-slate-200 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-slate-950 p-6 text-white">
              <p className="text-sm font-medium text-slate-300">Toplam hacim</p>
              <p className="mt-2 text-3xl font-bold">{formatNumber(totals.volumeM3, 3)} <span className="text-lg">m³</span></p>
            </div>
            <div className="bg-slate-950 p-6 text-white">
              <p className="text-sm font-medium text-slate-300">Gerçek ağırlık</p>
              <p className="mt-2 text-3xl font-bold">{formatNumber(totals.actualWeight)} <span className="text-lg">kg</span></p>
            </div>
            <div className="bg-slate-950 p-6 text-white">
              <p className="text-sm font-medium text-slate-300">Hacimsel ağırlık</p>
              <p className="mt-2 text-3xl font-bold">{formatNumber(totals.volumetricWeight)} <span className="text-lg">kg</span></p>
            </div>
            <div className="bg-orange-500 p-6 text-white">
              <p className="text-sm font-semibold text-orange-50">Yaklaşık ücretlendirilebilir</p>
              <p className="mt-2 text-3xl font-bold">{formatNumber(chargeableWeight)} <span className="text-lg">kg</span></p>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 p-6 sm:p-8">
            <p className="font-semibold text-orange-600">Yaygın planlama formülü</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">Hacimsel ağırlık nasıl hesaplanır?</h2>
            <div className="mt-5 rounded-xl bg-slate-950 p-5 text-center font-mono text-base font-semibold text-white sm:text-lg">
              Boy × En × Yükseklik × Adet ÷ 6.000
            </div>
            <p className="mt-4 text-base leading-7 text-slate-600">Ölçüler santimetre girilir. 6.000 böleni yaygın bir planlama referansıdır; havayolu, ürün veya servis farklı bir hacim faktörü uygulayabilir.</p>
          </section>

          <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6 sm:p-8">
            <p className="font-semibold text-blue-700">Sonuç teklif değildir</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">Doğru veri, daha isabetli rota</h2>
            <p className="mt-4 text-base leading-7 text-slate-700">Ücretlendirilebilir kilo; rota, kapasite, ürün kabulü ve kapı hizmetleriyle birlikte değerlendirilir. Türkiye'nin hangi ilinde olursanız olun tam adresi paylaşın; uygun alım ve uçuş planını aynı kapsamda hazırlayalım.</p>
            <Link href="/turkiye-geneli-hava-kargo-alimi" className="mt-5 inline-flex items-center gap-2 font-bold text-blue-800 hover:text-orange-700">Türkiye geneli alım modelini inceleyin <ArrowRight className="h-5 w-5" /></Link>
          </section>
        </div>
      </div>
    </AirCargoResourcePage>
  );
}
