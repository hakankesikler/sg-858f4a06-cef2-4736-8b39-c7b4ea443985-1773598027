"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const TRAILER_WIDTH_M = 2.4;
const TRAILER_LENGTH_M = 13.6;
const ASSUMED_USABLE_HEIGHT_CM = 280;

type LoadRow = {
  id: number;
  quantity: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  stackable: boolean;
};

function parsePositive(value: string) {
  const normalized = value.replace(",", ".");
  const number = Number(normalized);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

export default function LdmHesaplama() {
  const [loads, setLoads] = useState<LoadRow[]>([{ id: 1, quantity: "1", lengthCm: "120", widthCm: "80", heightCm: "100", stackable: false }]);

  const result = useMemo(() => {
    const rows = loads.map((load) => {
      const qty = Math.max(1, Math.floor(parsePositive(load.quantity) || 1));
      const length = parsePositive(load.lengthCm) / 100;
      const width = parsePositive(load.widthCm) / 100;
      const heightCm = parsePositive(load.heightCm);
      const stackLevels = load.stackable && heightCm > 0 ? Math.max(1, Math.floor(ASSUMED_USABLE_HEIGHT_CM / heightCm)) : 1;
      const floorPositions = Math.ceil(qty / stackLevels);
      const area = floorPositions * length * width;
      return { ...load, qty, heightCm, stackLevels, floorPositions, area, ldm: area / TRAILER_WIDTH_M };
    });
    const area = rows.reduce((sum, row) => sum + row.area, 0);
    const ldm = rows.reduce((sum, row) => sum + row.ldm, 0);
    return { rows, area, ldm, trailerShare: (ldm / TRAILER_LENGTH_M) * 100 };
  }, [loads]);

  const valid = result.area > 0;

  const updateTextField = (id: number, field: "quantity" | "lengthCm" | "widthCm" | "heightCm", value: string) => {
    setLoads((current) => current.map((load) => load.id === id ? { ...load, [field]: value } : load));
  };

  const updateStackable = (id: number, value: boolean) => {
    setLoads((current) => current.map((load) => load.id === id ? { ...load, stackable: value } : load));
  };

  const addLoad = () => setLoads((current) => [...current, { id: Date.now(), quantity: "1", lengthCm: "", widthCm: "", heightCm: "", stackable: false }]);
  const removeLoad = (id: number) => setLoads((current) => current.length === 1 ? current : current.filter((load) => load.id !== id));

  const openQuote = () => {
    const rows = result.rows
      .filter((row) => row.area > 0)
      .map((row) => `${row.qty} adet ${row.lengthCm} × ${row.widthCm} × ${row.heightCm || "?"} cm, ${row.stackable ? `istiflenebilir / ${row.stackLevels} kat` : "istiflenemez"} (${row.ldm.toFixed(2)} LDM)`)
      .join("; ");
    const detail = valid ? `LDM hesabı: ${rows}. Toplam yaklaşık ${result.ldm.toFixed(2)} LDM.` : "LDM hesaplama sayfasından teklif talebi.";
    window.dispatchEvent(new CustomEvent("rex:open-quote-form", { detail: { specialRequirements: detail } }));
  };

  return (
    <>
      <SEO
        title="LDM Hesaplama | Palet ve Yükleme Metresi | REX Lojistik"
        description="Palet ölçüsü ve adediyle LDM (lademetre) hesaplayın. Ücretsiz yükleme metresi hesaplayıcısı, istifleme seçenekleri ve örneklerle yükünüzün taban alanını bulun."
        url="https://www.rexlojistik.com/ldm-hesaplama"
      />
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="pt-28 sm:pt-32">
          <section className="border-b border-slate-200 bg-white">
            <div className="container mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-orange-600">REX Lojistik Hesaplama Araçları</p>
              <h1 className="max-w-4xl text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">LDM Hesaplama – Yükleme Metresi Hesaplayıcı</h1>
              <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-600">Farklı ölçülerdeki yüklerinizi ekleyin; istiflenebilir yüklerde 2,80 m kullanılabilir iç yükseklik varsayımıyla toplam LDM değerini hesaplayın.</p>
            </div>
          </section>
          <section className="container mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_.95fr]">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-slate-950">Yük bilgilerini girin</h2>
                <div className="mt-6 space-y-4">
                  {result.rows.map((row, index) => (
                    <div key={row.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="font-bold text-slate-800">Yük {index + 1}</p>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-slate-500">{row.area > 0 ? row.ldm.toFixed(2) : "—"} LDM</span>
                          {loads.length > 1 && <button type="button" onClick={() => removeLoad(row.id)} aria-label={`Yük ${index + 1} satırını sil`} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>}
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <label className="block text-sm font-semibold text-slate-700">Adet<input value={row.quantity} onChange={(e) => updateTextField(row.id, "quantity", e.target.value)} type="number" min="1" className="mt-2 h-12 w-full rounded-lg border border-slate-300 bg-white px-4" /></label>
                        <label className="block text-sm font-semibold text-slate-700">Uzunluk (cm)<input value={row.lengthCm} onChange={(e) => updateTextField(row.id, "lengthCm", e.target.value)} type="number" min="1" className="mt-2 h-12 w-full rounded-lg border border-slate-300 bg-white px-4" /></label>
                        <label className="block text-sm font-semibold text-slate-700">Genişlik (cm)<input value={row.widthCm} onChange={(e) => updateTextField(row.id, "widthCm", e.target.value)} type="number" min="1" className="mt-2 h-12 w-full rounded-lg border border-slate-300 bg-white px-4" /></label>
                        <label className="block text-sm font-semibold text-slate-700">Yükseklik (cm)<input value={row.heightCm} onChange={(e) => updateTextField(row.id, "heightCm", e.target.value)} type="number" min="1" className="mt-2 h-12 w-full rounded-lg border border-slate-300 bg-white px-4" /></label>
                      </div>
                      <label className="mt-4 flex min-h-11 flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                        <input type="checkbox" checked={row.stackable} onChange={(e) => updateStackable(row.id, e.target.checked)} className="h-5 w-5 accent-orange-600" />
                        İstiflenebilir
                        {row.stackable && row.heightCm > 0 && <span className="ml-auto text-slate-500">2,80 m varsayımıyla en fazla {row.stackLevels} kat</span>}
                      </label>
                    </div>
                  ))}
                  <button type="button" onClick={addLoad} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-orange-300 bg-orange-50 px-4 py-2 font-bold text-orange-800"><Plus className="h-4 w-4" /> Yük Ekle</button>
                </div>
                <p className="mt-5 text-sm leading-relaxed text-slate-500">Temel formül: tabanda gereken pozisyon × uzunluk × genişlik ÷ 2,40 m. İstiflenebilir yüklerde 2,80 m kullanılabilir iç yükseklik varsayımı kullanılır.</p>
              </div>
              <div className="rounded-2xl bg-slate-950 p-6 text-white sm:p-8" aria-live="polite">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-400">Hesaplama sonucu</p>
                <div className="mt-4 text-5xl font-black">{valid ? result.ldm.toFixed(2) : "—"} <span className="text-2xl text-slate-300">LDM</span></div>
                <div className="mt-7 grid grid-cols-2 gap-4 border-t border-white/15 pt-6">
                  <div><p className="text-sm text-slate-400">Toplam taban alanı</p><p className="mt-1 text-xl font-bold">{valid ? result.area.toFixed(2) : "—"} m²</p></div>
                  <div><p className="text-sm text-slate-400">13,6 m araç tabanı</p><p className="mt-1 text-xl font-bold">~%{valid ? result.trailerShare.toFixed(1) : "—"}</p></div>
                </div>
                <button type="button" onClick={openQuote} className="mt-7 min-h-12 w-full rounded-lg bg-orange-500 px-5 py-3 font-bold text-white">Bu Yük İçin Fiyat Al</button>
              </div>
            </div>
          </section>
          <section className="border-y border-slate-200 bg-white">
            <div className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
              <h2 className="text-3xl font-bold text-slate-950">LDM nedir?</h2>
              <p className="mt-4 leading-7 text-slate-600">LDM (Loading Meter), Türkçede yükleme metresi veya lademetre olarak kullanılan bir taban alanı ölçüsüdür. Bu hesapta 1 LDM, 2,40 m genişliğinde ve 1 m uzunluğunda bir alanı, yani 2,40 m² taban alanını ifade eder. Paletli yüklerin parsiyel veya komple karayolu taşımacılığında kapladığı yeri ön değerlendirmek için kullanılır.</p>
              <h2 className="mt-10 text-2xl font-bold text-slate-950">LDM nasıl hesaplanır?</h2>
              <p className="mt-4 leading-7 text-slate-600">İstiflenemeyen aynı ölçüdeki yüklerde formül: adet × uzunluk (m) × genişlik (m) ÷ 2,40. Santimetreyle girilen ölçüler hesaplayıcıda metreye çevrilir. Farklı ölçülerdeki yükleri ayrı satırlara ekleyerek sonuçlarını toplayabilirsiniz; palet dışına taşan ambalaj varsa yükün gerçek dış ölçülerini kullanın.</p>
              <div className="mt-5 overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <caption className="mb-3 text-left font-semibold">İstiflenemeyen yükler için örnek LDM hesapları</caption>
                  <thead className="bg-slate-100"><tr><th scope="col" className="p-3">Yük</th><th scope="col" className="p-3">Hesap</th><th scope="col" className="p-3">Sonuç</th></tr></thead>
                  <tbody>
                    <tr className="border-b border-slate-200"><th scope="row" className="p-3">1 adet 120 × 80 cm palet</th><td className="p-3">1 × 1,20 × 0,80 ÷ 2,40</td><td className="p-3">0,40 LDM</td></tr>
                    <tr className="border-b border-slate-200"><th scope="row" className="p-3">5 adet 120 × 80 cm palet</th><td className="p-3">5 × 1,20 × 0,80 ÷ 2,40</td><td className="p-3">2,00 LDM</td></tr>
                    <tr><th scope="row" className="p-3">1 adet 120 × 100 cm palet</th><td className="p-3">1 × 1,20 × 1,00 ÷ 2,40</td><td className="p-3">0,50 LDM</td></tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-500">Bu sonuçlar alan esaslı yaklaşık değerlerdir. Gerçek yerleşimde boşluklar, yükün şekli, sabitleme, araç ölçüleri ve ağırlık sınırları etkili olur. Sonuç, yükün araca fiziksel olarak sığacağını veya taşıma ücretini tek başına belirlemez.</p>
              <h2 className="mt-10 text-2xl font-bold text-slate-950">İstiflenebilir yük LDM'yi nasıl etkiler?</h2>
              <p className="mt-4 leading-7 text-slate-600">Yük fiziksel olarak güvenle istiflenebiliyorsa aynı taban pozisyonunda birden fazla parça taşınabilir. Araç bu hesapta 2,80 m kullanılabilir iç yükseklik varsayımıyla değerlendirilir. Gerçek kullanılabilir yükseklik dorse tipine göre değişebilir; ağırlık, ambalaj dayanımı ve yük emniyeti ayrıca kontrol edilmelidir.</p>
              <p className="mt-4 leading-7 text-slate-600">Örneğin 5 adet 120 × 80 × 100 cm yük için bu araç iki kat istif varsayar: tabanda 3 pozisyon gerekir ve sonuç 1,20 LDM olur. Bu bir hesaplama varsayımıdır; yükseklik uygun olsa bile yükün güvenle istiflenebildiği ayrıca doğrulanmalıdır. <Link href="/bilgi-merkezi/palet-istifleme-kosullari" className="font-semibold text-orange-700 underline underline-offset-4">Palet istifleme koşulları</Link> rehberi bu değerlendirmeye yardımcı olur.</p>
              <h2 className="mt-10 text-2xl font-bold text-slate-950">LDM ile CBM arasındaki fark nedir?</h2>
              <p className="mt-4 leading-7 text-slate-600">LDM tabanda kaplanan alanı, CBM ise uzunluk × genişlik × yükseklik hesabıyla metreküp cinsinden hacmi gösterir. Aynı taban ölçülerindeki iki yükün yüksekliği değişirse hacimleri değişir; istiflenemeyen yüklerde alan esaslı LDM aynı kalır. Hacmi ayrıca görmek için <Link href="/cbm-hesaplama" className="font-semibold text-orange-700 underline underline-offset-4">CBM Hesaplama</Link> aracını kullanabilirsiniz.</p>
              <h2 className="mt-10 text-2xl font-bold text-slate-950">Bir tıra kaç palet yüklenir?</h2>
              <p className="mt-4 leading-7 text-slate-600">Hesaplayıcıdaki 13,6 m karşılaştırması bir referanstır. Palet sayısı; ölçülere, yerleşim yönüne, istifleme imkanına ve taşıma kapasitesine bağlıdır. <Link href="/bilgi-merkezi/tira-kac-palet-yuklenir" className="font-semibold text-orange-700 underline underline-offset-4">Tıra kaç palet yüklenir?</Link> rehberindeki yerleşim örneklerini inceleyebilirsiniz. Teklif için adet, dış ölçü ve brüt ağırlık bilgilerini birlikte paylaşın.</p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link href="/yurtici-parsiyel-tasimacilik" className="font-semibold text-orange-700 underline underline-offset-4">Yurtiçi Parsiyel Taşımacılık</Link>
                <Link href="/uluslararasi-karayolu-parsiyel-tasimacilik" className="font-semibold text-orange-700 underline underline-offset-4">Uluslararası Karayolu Parsiyel</Link>
                <Link href="/komple-tasimacilik" className="font-semibold text-orange-700 underline underline-offset-4">Komple Taşımacılık</Link>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}