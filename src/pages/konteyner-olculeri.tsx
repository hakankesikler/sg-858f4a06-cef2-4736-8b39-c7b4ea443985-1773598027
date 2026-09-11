import Link from "next/link";
import { AlertTriangle, ArrowRight, Box, Snowflake, StretchHorizontal } from "lucide-react";
import { SeaFreightResourcePage } from "@/components/SeaFreightResourcePage";
import { marketingPages } from "@/content/marketing-pages";

const containers = [
  { type: "20' DC", inner: "5,90 × 2,35 × 2,39 m", door: "2,34 × 2,28 m", volume: "Yaklaşık 33 m³", use: "Ağır veya daha düşük hacimli genel yükler" },
  { type: "40' DC", inner: "12,03 × 2,35 × 2,39 m", door: "2,34 × 2,28 m", volume: "Yaklaşık 67 m³", use: "Standart yüksekliğe sahip hacimli genel yükler" },
  { type: "40' HC", inner: "12,03 × 2,35 × 2,69 m", door: "2,34 × 2,58 m", volume: "Yaklaşık 76 m³", use: "Hafif fakat yüksek hacimli yükler" },
];

const specialEquipment = [
  { icon: Snowflake, title: "Reefer", text: "Isı kontrollü ürünler için soğutma sistemli konteyner." },
  { icon: StretchHorizontal, title: "Open Top", text: "Standart kapıdan yüklenemeyen yüksek yükler için üstten yükleme seçeneği." },
  { icon: Box, title: "Flat Rack", text: "Gabari dışı, ağır veya yandan yüklenmesi gereken ekipmanlar için platform tipi çözüm." },
];

const faq = [
  { question: "20'lik konteyner kaç metreküptür?", answer: "Standart 20 DC konteynerin nominal iç hacmi yaklaşık 33 m³'tür. Kullanılabilir hacim; ambalaj, palet, yük şekli ve kapı açıklığı nedeniyle daha düşük olabilir." },
  { question: "40 DC ile 40 HC arasındaki fark nedir?", answer: "Taban ölçüleri benzerdir; 40 HC yaklaşık 30 cm daha yüksek iç alan sunar. Bu nedenle hafif fakat hacimli yüklerde daha fazla kapasite sağlayabilir." },
  { question: "Tablodaki ölçüler rezervasyon için yeterli mi?", answer: "Hayır. Tablodaki değerler ön planlama içindir. Tahsis edilen konteynerin üretici ve taşıyıcı bilgileri ile CSC plakası rezervasyon ve yükleme öncesinde kontrol edilmelidir." },
  { question: "Bir konteynere kaç palet sığar?", answer: "Palet ölçüsü, istif yönü, yükseklik, taşma payı ve konteyner iç ölçüsü sonucu değiştirir. Kesin plan için palet yerleşimi yük bazında hazırlanmalıdır." },
];

export default function KonteynerOlculeriPage() {
  const page = marketingPages["konteyner-olculeri"];

  return (
    <SeaFreightResourcePage page={page} readingTime="6 dakika" faq={faq}>
      <div className="space-y-14">
        <section aria-labelledby="dimensions-heading">
          <div className="max-w-3xl">
            <p className="font-semibold text-orange-600">Standart kuru yük ekipmanları</p>
            <h2 id="dimensions-heading" className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">20 DC, 40 DC ve 40 HC karşılaştırması</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">Aşağıdaki yaklaşık ölçüler, ihtiyacınızdan büyük ekipman için ödeme yapma veya yetersiz ekipman nedeniyle zaman kaybetme riskini azaltan ilk karşılaştırmayı sunar.</p>
          </div>

          <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
            <table className="min-w-[920px] w-full border-collapse text-left">
              <thead className="bg-slate-950 text-white">
                <tr>
                  <th className="px-5 py-4 text-sm font-semibold">Konteyner</th>
                  <th className="px-5 py-4 text-sm font-semibold">İç ölçü (U × G × Y)</th>
                  <th className="px-5 py-4 text-sm font-semibold">Kapı açıklığı (G × Y)</th>
                  <th className="px-5 py-4 text-sm font-semibold">İç hacim</th>
                  <th className="px-5 py-4 text-sm font-semibold">Genel kullanım</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {containers.map((container) => (
                  <tr key={container.type} className="align-top even:bg-slate-50/70">
                    <th scope="row" className="whitespace-nowrap px-5 py-4 text-lg font-bold text-orange-700">{container.type}</th>
                    <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-800">{container.inner}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">{container.door}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">{container.volume}</td>
                    <td className="px-5 py-4 leading-7 text-slate-600">{container.use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-none text-amber-700" aria-hidden="true" />
            <p><strong>Önemli:</strong> Nominal hacim, yükün tamamının pratikte kullanılabileceği anlamına gelmez. Kapı açıklığı, palet yerleşimi, ambalaj boşlukları, ağırlık dağılımı ve geçerli kara yolu sınırları ayrıca kontrol edilmelidir.</p>
          </div>
        </section>

        <section className="rounded-3xl bg-slate-950 p-6 text-white sm:p-9">
          <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="font-semibold text-orange-400">Standart dışı ihtiyaçlar</p>
              <h2 className="mt-2 text-3xl font-bold">Özel konteyner türleri</h2>
              <p className="mt-4 text-base leading-7 text-slate-300">Ürün sıcaklığı, ölçüleri ve yükleme yöntemi standart kuru yük konteynerinden farklı ekipman gerektirebilir.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {specialEquipment.map(({ icon: Icon, title, text }) => (
                <article key={title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <Icon className="h-7 w-7 text-orange-400" aria-hidden="true" />
                  <h3 className="mt-4 text-xl font-bold">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <p className="font-semibold text-orange-600">Yük planlaması</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-950">Ölçü tablosundan sonra CBM hesabı</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">Koli ve palet ölçülerini hesaplayarak yükünüze en yakın kapasiteyi belirleyebilirsiniz. Net hacim bilgisi, doğru ekipmanla daha dengeli maliyet ve daha akıcı bir yükleme planı kurulmasını kolaylaştırır.</p>
          </div>
          <Link href="/cbm-hesaplama" className="group flex items-center justify-between rounded-2xl border border-orange-200 bg-orange-50 p-6 text-lg font-bold text-orange-800 transition hover:border-orange-400 hover:shadow-lg">
            Ücretsiz CBM hesaplama aracını kullanın
            <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </section>
      </div>
    </SeaFreightResourcePage>
  );
}
