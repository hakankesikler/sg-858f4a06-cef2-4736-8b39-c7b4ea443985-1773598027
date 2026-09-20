"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const TRAILER_WIDTH_M = 2.4;
const TRAILER_LENGTH_M = 13.6;

function parsePositive(value: string) {
  const normalized = value.replace(",", ".");
  const number = Number(normalized);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

export default function LdmHesaplama() {
  const [quantity, setQuantity] = useState("1");
  const [lengthCm, setLengthCm] = useState("120");
  const [widthCm, setWidthCm] = useState("80");

  const result = useMemo(() => {
    const qty = Math.max(1, Math.floor(parsePositive(quantity) || 1));
    const length = parsePositive(lengthCm) / 100;
    const width = parsePositive(widthCm) / 100;
    const area = qty * length * width;
    const ldm = area / TRAILER_WIDTH_M;
    const trailerShare = (ldm / TRAILER_LENGTH_M) * 100;
    return { qty, area, ldm, trailerShare };
  }, [quantity, lengthCm, widthCm]);

  const valid = result.area > 0;

  const openQuote = () => {
    const detail = valid
      ? `LDM hesabı: ${result.qty} adet, ${lengthCm} × ${widthCm} cm, yaklaşık ${result.ldm.toFixed(2)} LDM.`
      : "LDM hesaplama sayfasından teklif talebi.";
    window.dispatchEvent(new CustomEvent("rex:open-quote-form", { detail: { specialRequirements: detail } }));
  };

  return (
    <>
      <SEO
        title="LDM Hesaplama | Yükleme Metresi Hesaplayıcı | REX Lojistik"
        description="Ücretsiz LDM hesaplama aracıyla yükünüzün araç tabanında kapladığı yükleme metresini hesaplayın. Adet, uzunluk ve genişlik girerek yaklaşık LDM sonucunu görün."
        url="https://www.rexlojistik.com/ldm-hesaplama"
      />
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="pt-28 sm:pt-32">
          <section className="border-b border-slate-200 bg-white">
            <div className="container mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-orange-600">REX Lojistik Hesaplama Araçları</p>
              <h1 className="max-w-4xl text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">LDM Hesaplama – Yükleme Metresi Hesaplayıcı</h1>
              <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-600">
                Yükünüzün araç tabanında yaklaşık kaç yükleme metresi kapladığını hesaplayın. İlk sürüm, yüklerin yan yana boşluksuz yerleştirildiği ve standart 2,40 m araç iç genişliği varsayımıyla çalışır.
              </p>
            </div>
          </section>

          <section className="container mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_.95fr]">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-slate-950">Yük bilgilerini girin</h2>
                <div className="mt-6 grid gap-5 sm:grid-cols-3">
                  <label className="block text-sm font-semibold text-slate-700">
                    Adet
                    <input value={quantity} onChange={(e) => setQuantity(e.target.value)} inputMode="numeric" min="1" type="number" className="mt-2 h-12 w-full rounded-lg border border-slate-300 px-4 text-base focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100" />
                  </label>
                  <label className="block text-sm font-semibold text-slate-700">
                    Uzunluk (cm)
                    <input value={lengthCm} onChange={(e) => setLengthCm(e.target.value)} inputMode="decimal" min="1" type="number" className="mt-2 h-12 w-full rounded-lg border border-slate-300 px-4 text-base focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100" />
                  </label>
                  <label className="block text-sm font-semibold text-slate-700">
                    Genişlik (cm)
                    <input value={widthCm} onChange={(e) => setWidthCm(e.target.value)} inputMode="decimal" min="1" type="number" className="mt-2 h-12 w-full rounded-lg border border-slate-300 px-4 text-base focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100" />
                  </label>
                </div>
                <p className="mt-5 text-sm leading-relaxed text-slate-500">Formül: Adet × Uzunluk (m) × Genişlik (m) ÷ 2,40 m. Sonuç planlama amaçlı yaklaşık değerdir.</p>
              </div>

              <div className="rounded-2xl bg-slate-950 p-6 text-white sm:p-8" aria-live="polite">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-orange-400">Hesaplama sonucu</p>
                <div className="mt-4 text-5xl font-black">{valid ? result.ldm.toFixed(2) : "—"} <span className="text-2xl text-slate-300">LDM</span></div>
                <div className="mt-7 grid grid-cols-2 gap-4 border-t border-white/15 pt-6">
                  <div><p className="text-sm text-slate-400">Toplam taban alanı</p><p className="mt-1 text-xl font-bold">{valid ? result.area.toFixed(2) : "—"} m²</p></div>
                  <div><p className="text-sm text-slate-400">13,6 m araç tabanı</p><p className="mt-1 text-xl font-bold">~%{valid ? result.trailerShare.toFixed(1) : "—"}</p></div>
                </div>
                <button type="button" onClick={openQuote} className="mt-7 min-h-12 w-full rounded-lg bg-orange-500 px-5 py-3 font-bold text-white transition hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-300">
                  Bu Yük İçin Fiyat Al
                </button>
              </div>
            </div>
          </section>

          <section className="border-y border-slate-200 bg-white">
            <div className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
              <h2 className="text-3xl font-bold text-slate-950">LDM nedir?</h2>
              <p className="mt-4 leading-7 text-slate-600">LDM (loading meter / yükleme metresi), özellikle parsiyel karayolu taşımalarında bir yükün araç tabanında kapladığı alanı uzunluk cinsinden ifade etmek için kullanılan pratik bir ölçüdür. Standart hesapta araç iç genişliği 2,40 metre kabul edilir.</p>

              <h2 className="mt-10 text-2xl font-bold text-slate-950">LDM nasıl hesaplanır?</h2>
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5 font-semibold text-slate-800">LDM = Adet × Uzunluk (m) × Genişlik (m) ÷ 2,40</div>
              <p className="mt-4 leading-7 text-slate-600">Örneğin 2 adet 120 × 100 cm yük için toplam taban alanı 2,40 m² olur. 2,40 ÷ 2,40 = 1,00 LDM sonucuna ulaşılır.</p>

              <h2 className="mt-10 text-2xl font-bold text-slate-950">LDM navlun fiyatı mıdır?</h2>
              <p className="mt-4 leading-7 text-slate-600">Hayır. LDM, yükün araç tabanında kapladığı alanı anlamaya yardımcı olur. Taşıma fiyatı; toplam ağırlık, istiflenebilirlik, güzergâh, yükleme ve teslimat koşulları, araç gereksinimi ve operasyon detaylarından da etkilenir.</p>

              <h2 className="mt-10 text-2xl font-bold text-slate-950">Sonucu nasıl kullanmalısınız?</h2>
              <p className="mt-4 leading-7 text-slate-600">Hesaplanan LDM değeri, yükünüzün parsiyel veya daha yüksek araç kapasitesi gerektiren bir taşıma planına uygunluğunu değerlendirmede yardımcı bir veridir. Kesin planlama için ölçü ve ağırlık bilgilerinin birlikte değerlendirilmesi gerekir.</p>

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
