import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Calculator, Plus, Trash2 } from "lucide-react";
import { SeaFreightResourcePage } from "@/components/SeaFreightResourcePage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { marketingPages } from "@/content/marketing-pages";

type CargoRow = {
  id: number;
  description: string;
  quantity: string;
  length: string;
  width: string;
  height: string;
  unitWeight: string;
};

const emptyRow = (id: number): CargoRow => ({
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
  { question: "CBM nasıl hesaplanır?", answer: "Santimetre cinsinden boy × en × yükseklik × adet sonucu 1.000.000'a bölünür. Sonuç metreküp, yani CBM değeridir." },
  { question: "Paletli yükte palet ölçüsü mü kullanılmalı?", answer: "Taşımada kapladığı gerçek alan kullanılmalıdır. Ürün paletten taşıyorsa veya ambalaj yüksekliği palet dahil daha fazlaysa en dış noktalar ölçülmelidir." },
  { question: "W/M değeri nedir?", answer: "LCL tarifelerinde kullanılan ölçüm göstergelerinden biridir. Bu araç yalnızca hacim ile ton karşılaştırmasını gösterir; gerçek ücretlendirme hattın ve taşıyıcının tarifesine göre değişebilir." },
  { question: "Hesaplanan CBM navlun fiyatını verir mi?", answer: "Hayır. Navlun için rota, ürün, çıkış-varış masrafları, hazır olma tarihi ve hizmet kapsamı gibi ek bilgiler gerekir." },
];

export default function CbmHesaplamaPage() {
  const page = marketingPages["cbm-hesaplama"];
  const [rows, setRows] = useState<CargoRow[]>([emptyRow(1)]);
  const [nextId, setNextId] = useState(2);

  const totals = useMemo(() => rows.reduce((total, row) => {
    const quantity = parseValue(row.quantity);
    const cbm = (parseValue(row.length) * parseValue(row.width) * parseValue(row.height) * quantity) / 1_000_000;
    const weight = parseValue(row.unitWeight) * quantity;
    return { cbm: total.cbm + cbm, weight: total.weight + weight };
  }, { cbm: 0, weight: 0 }), [rows]);

  const weightTonnes = totals.weight / 1000;
  const wm = Math.max(totals.cbm, weightTonnes);

  const updateRow = (id: number, field: keyof Omit<CargoRow, "id">, value: string) => {
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
    <SeaFreightResourcePage page={page} readingTime="3 dakika" faq={faq}>
      <div className="space-y-14">
        <section aria-labelledby="calculator-heading" className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-5 sm:flex-row sm:items-center sm:px-7">
            <div>
              <p className="flex items-center gap-2 font-semibold text-orange-600"><Calculator className="h-5 w-5" aria-hidden="true" /> Ücretsiz hesaplama</p>
              <h2 id="calculator-heading" className="mt-1 text-2xl font-bold text-slate-950">Koli ve palet ölçülerini girin</h2>
            </div>
            <Button type="button" onClick={addRow} className="gap-2 bg-slate-950 hover:bg-orange-600"><Plus className="h-4 w-4" /> Yük satırı ekle</Button>
          </div>

          <div className="space-y-5 p-5 sm:p-7">
            {rows.map((row, index) => {
              const rowCbm = (parseValue(row.length) * parseValue(row.width) * parseValue(row.height) * parseValue(row.quantity)) / 1_000_000;
              return (
                <fieldset key={row.id} className="rounded-2xl border border-slate-200 p-4 sm:p-5">
                  <legend className="px-2 font-bold text-slate-900">Yük {index + 1}</legend>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-7">
                    <div className="space-y-2 sm:col-span-2 lg:col-span-2">
                      <Label htmlFor={`description-${row.id}`}>Yük açıklaması</Label>
                      <Input id={`description-${row.id}`} value={row.description} onChange={(event) => updateRow(row.id, "description", event.target.value)} placeholder="Örn. Euro palet" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`quantity-${row.id}`}>Adet</Label>
                      <Input id={`quantity-${row.id}`} type="number" inputMode="decimal" min="1" step="1" value={row.quantity} onChange={(event) => updateRow(row.id, "quantity", event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`length-${row.id}`}>Boy (cm)</Label>
                      <Input id={`length-${row.id}`} type="number" inputMode="decimal" min="0" step="0.1" value={row.length} onChange={(event) => updateRow(row.id, "length", event.target.value)} placeholder="120" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`width-${row.id}`}>En (cm)</Label>
                      <Input id={`width-${row.id}`} type="number" inputMode="decimal" min="0" step="0.1" value={row.width} onChange={(event) => updateRow(row.id, "width", event.target.value)} placeholder="80" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`height-${row.id}`}>Yükseklik (cm)</Label>
                      <Input id={`height-${row.id}`} type="number" inputMode="decimal" min="0" step="0.1" value={row.height} onChange={(event) => updateRow(row.id, "height", event.target.value)} placeholder="100" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`weight-${row.id}`}>Birim brüt kg</Label>
                      <Input id={`weight-${row.id}`} type="number" inputMode="decimal" min="0" step="0.1" value={row.unitWeight} onChange={(event) => updateRow(row.id, "unitWeight", event.target.value)} placeholder="250" />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <p className="text-sm text-slate-600">Satır hacmi: <strong className="text-slate-950">{formatNumber(rowCbm, 3)} CBM</strong></p>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeRow(row.id)} disabled={rows.length === 1} className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700">
                      <Trash2 className="h-4 w-4" /> Satırı sil
                    </Button>
                  </div>
                </fieldset>
              );
            })}
          </div>

          <div aria-live="polite" className="grid gap-px bg-slate-200 sm:grid-cols-3">
            <div className="bg-slate-950 p-6 text-white">
              <p className="text-sm font-medium text-slate-300">Toplam hacim</p>
              <p className="mt-2 text-3xl font-bold text-orange-400">{formatNumber(totals.cbm, 3)} <span className="text-lg">CBM</span></p>
            </div>
            <div className="bg-slate-950 p-6 text-white">
              <p className="text-sm font-medium text-slate-300">Toplam brüt ağırlık</p>
              <p className="mt-2 text-3xl font-bold">{formatNumber(totals.weight)} <span className="text-lg">kg</span></p>
            </div>
            <div className="bg-slate-950 p-6 text-white">
              <p className="text-sm font-medium text-slate-300">Yaklaşık LCL W/M</p>
              <p className="mt-2 text-3xl font-bold">{formatNumber(wm, 3)} <span className="text-lg">birim</span></p>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 p-6 sm:p-8">
            <p className="font-semibold text-orange-600">Formül</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">CBM hesabı nasıl yapılır?</h2>
            <div className="mt-5 rounded-xl bg-slate-950 p-5 text-center font-mono text-base font-semibold text-white sm:text-lg">
              Boy × En × Yükseklik × Adet ÷ 1.000.000
            </div>
            <p className="mt-4 text-base leading-7 text-slate-600">Ölçüler santimetre girildiğinde sonuç metreküp olarak hesaplanır. Palet ve ambalaj dahil yükün taşıma sırasında kapladığı en dış ölçüler kullanılmalıdır.</p>
          </section>

          <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6 sm:p-8">
            <p className="font-semibold text-blue-700">Sonuç nasıl kullanılmalı?</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">Doğru ölçü, daha isabetli seçenek</h2>
            <p className="mt-4 text-base leading-7 text-slate-700">W/M sonucu tek başına navlun teklifi değildir. Ancak net hacim ve ağırlık; uygun konsolidasyon veya konteyner seçeneğini, toplam maliyeti ve tahmini transit süreyi daha hızlı karşılaştırmamızı sağlar.</p>
            <Link href="/lcl-mi-fcl-mi" className="mt-5 inline-flex items-center gap-2 font-bold text-blue-800 hover:text-orange-700">LCL ve FCL seçeneklerini karşılaştırın <ArrowRight className="h-5 w-5" /></Link>
          </section>
        </div>
      </div>
    </SeaFreightResourcePage>
  );
}
