import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { SeaFreightResourcePage } from "@/components/SeaFreightResourcePage";
import { marketingPages } from "@/content/marketing-pages";

const comparisonRows = [
  { criterion: "Kapasite kullanımı", lcl: "Konteyner alanı farklı göndericilerle paylaşılır.", fcl: "Konteyner tek göndericiye tahsis edilir." },
  { criterion: "Uygun yük profili", lcl: "Daha düşük hacimli, paletli veya kolili ticari yükler.", fcl: "Yüksek hacimli, düzenli veya ayrı taşınması tercih edilen yükler." },
  { criterion: "Maliyet yapısı", lcl: "Hacim/ağırlık ve konsolidasyon hizmetleri etkili olur.", fcl: "Konteyner, rota, ekipman ve yerel masraflar etkili olur." },
  { criterion: "Elleçleme", lcl: "Konsolidasyon ve ayrıştırma nedeniyle daha fazla temas olabilir.", fcl: "Yük genellikle aynı konteyner içinde varışa ilerler." },
  { criterion: "Transit planı", lcl: "Düzenli konsolidasyon kapanışları arasından teslim hedefine uygun program seçilir.", fcl: "Gemi hareketi ve ekipman temini birlikte planlanarak doğrudan akış hedeflenir." },
  { criterion: "Maliyet avantajı", lcl: "Düşük hacimde kullanılmayan konteyner kapasitesinin maliyetini azaltabilir.", fcl: "Hacim yükseldikçe birim yük başına toplam maliyet avantajı sağlayabilir." },
];

const questions = [
  "Toplam yük hacminiz ve brüt ağırlığınız nedir?",
  "Yük başka gönderilerle aynı konteynerde taşınmaya uygun mu?",
  "Konsolidasyon programı teslim tarihinizi karşılıyor mu?",
  "Çıkış ve varış yerel masrafları iki seçenekte nasıl değişiyor?",
  "Yük hassas, kırılabilir veya özel elleçleme gerektiriyor mu?",
];

const faq = [
  { question: "Kaç CBM'den sonra FCL seçilmelidir?", answer: "Her hat için geçerli tek bir CBM sınırı yoktur. Navlun, yerel masraflar, ağırlık, ekipman bulunabilirliği ve teslim programı değiştiği için belirli bir hacimden sonra iki seçenek aynı kapsamla teklif edilerek karşılaştırılmalıdır." },
  { question: "LCL her zaman daha ekonomik midir?", answer: "Hayır. Düşük hacimlerde avantajlı olabilir; hacim ve yerel hizmetler arttıkça toplam LCL maliyeti FCL seviyesine yaklaşabilir." },
  { question: "FCL için konteyner tamamen dolmalı mı?", answer: "Hayır. FCL, konteynerin tek göndericiye tahsis edildiğini ifade eder. Konteynerin tamamen dolu olması zorunlu değildir." },
  { question: "Karşılaştırma için hangi bilgiler gerekir?", answer: "Koli veya palet ölçüleri, adet, brüt ağırlık, ürün tanımı, çıkış-varış adresleri, hazır olma tarihi ve teslim beklentisi gerekir." },
];

export default function LclMiFclMiPage() {
  const page = marketingPages["lcl-mi-fcl-mi"];

  return (
    <SeaFreightResourcePage page={page} readingTime="7 dakika" faq={faq}>
      <div className="space-y-14">
        <section aria-labelledby="comparison-heading">
          <div className="max-w-3xl">
            <p className="font-semibold text-orange-600">Hızlı karşılaştırma</p>
            <h2 id="comparison-heading" className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">Aynı yük için iki farklı taşıma modeli</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">Doğru seçim yalnızca toplam CBM'ye bakılarak yapılmaz. REX Lojistik, kullanılmayan kapasiteyi ve gereksiz beklemeyi azaltmak için yükün niteliğini, hareket programını ve tüm yerel masrafları aynı kapsamda değerlendirir.</p>
          </div>

          <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
            <table className="min-w-[760px] w-full border-collapse text-left">
              <thead className="bg-slate-950 text-white">
                <tr>
                  <th className="px-5 py-4 text-sm font-semibold">Karar ölçütü</th>
                  <th className="px-5 py-4 text-sm font-semibold">LCL · Parsiyel</th>
                  <th className="px-5 py-4 text-sm font-semibold">FCL · Komple konteyner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {comparisonRows.map((row) => (
                  <tr key={row.criterion} className="align-top even:bg-slate-50/70">
                    <th scope="row" className="px-5 py-4 font-semibold text-slate-950">{row.criterion}</th>
                    <td className="px-5 py-4 leading-7 text-slate-600">{row.lcl}</td>
                    <td className="px-5 py-4 leading-7 text-slate-600">{row.fcl}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl bg-slate-950 p-6 text-white sm:p-9 lg:grid-cols-[1.4fr_0.8fr] lg:items-center">
          <div>
            <p className="font-semibold text-orange-400">İlk adım: hacmi hesaplayın</p>
            <h2 className="mt-2 text-3xl font-bold">Yükünüz kaç CBM?</h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">Koli ve paletlerinizi ayrı satırlar halinde girin; uygun fiyat ve transit süre seçeneklerini daha hızlı karşılaştırabilmemiz için gerekli hacim bilgisini hazırlayın.</p>
          </div>
          <Link href="/cbm-hesaplama" className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3.5 font-semibold text-white transition hover:bg-orange-600">
            CBM hesaplama aracını aç <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </section>

        <section className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="font-semibold text-orange-600">Karar kontrolü</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-950">Teklif istemeden önce 5 soru</h2>
          </div>
          <ol className="grid gap-3">
            {questions.map((question, index) => (
              <li key={question} className="flex items-start gap-4 rounded-2xl border border-slate-200 p-5 text-base leading-7 text-slate-700">
                <span className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-full bg-orange-100 font-bold text-orange-700">{index + 1}</span>
                <span>{question}</span>
              </li>
            ))}
          </ol>
        </section>

        <aside className="rounded-2xl border border-blue-200 bg-blue-50 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-slate-950">Sağlıklı karşılaştırmanın kuralı</h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-700">En düşük görünen navlun değil, teslim hedefini karşılayan en uygun toplam çözüm esas alınır.</p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {["Aynı çıkış ve varış noktaları", "Aynı teslim şekli ve hizmet kapsamı", "Tüm çıkış-varış yerel masrafları", "Tahmini transit ve bekleme süreleri"].map((item) => (
              <li key={item} className="flex items-start gap-3 text-base leading-7 text-slate-700"><CheckCircle2 className="mt-1 h-5 w-5 flex-none text-blue-700" aria-hidden="true" />{item}</li>
            ))}
          </ul>
        </aside>
      </div>
    </SeaFreightResourcePage>
  );
}
