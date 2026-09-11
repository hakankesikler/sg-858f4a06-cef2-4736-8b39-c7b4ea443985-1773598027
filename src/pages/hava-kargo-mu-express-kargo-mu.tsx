import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { AirCargoResourcePage } from "@/components/AirCargoResourcePage";
import { marketingPages } from "@/content/marketing-pages";

const comparisonRows = [
  { criterion: "Gönderi profili", air: "Paletli, yüksek ağırlıklı veya proje bazlı ticari yüklerde esnektir.", express: "Dosya, numune ve daha küçük paketlerde pratik bir standart ağ sunar." },
  { criterion: "Servis yapısı", air: "Uçuş ile çıkış-varış kara hizmetleri ihtiyaca göre ayrı planlanır.", express: "Alım, ana taşıma ve teslim çoğunlukla tek paket servis olarak ilerler." },
  { criterion: "Fiyatlandırma", air: "Rota, kapasite, gerçek/hacimsel ağırlık ve yer hizmetleri birlikte etkiler.", express: "Paket tarifesi, bölge, ücretlendirilebilir ağırlık ve ek servisler etkiler." },
  { criterion: "Operasyon esnekliği", air: "Direkt/aktarmalı uçuş ve farklı havalimanı bağlantıları karşılaştırılabilir.", express: "Taşıyıcının tanımlı servis, ürün kabul ve dağıtım ağı esas alınır." },
  { criterion: "Takip ve evrak", air: "Hava taşıma senedi ve operasyon aşamaları yük bazında yönetilir.", express: "Tek takip numarasıyla standart hareket akışı izlenir." },
  { criterion: "Ne zaman öne çıkar?", air: "Yük büyüdüğünde, paletli olduğunda veya özel rota planı gerektiğinde.", express: "Gönderi küçük, standart kabul koşullarına uygun ve kapı teslim öncelikli olduğunda." },
];

const checklist = [
  "Her kolinin dış ölçüsü ve gerçek ağırlığı",
  "Ürün tanımı, kullanım amacı ve beyan değeri",
  "Tam çıkış ve varış posta kodları",
  "Gönderinin hazır olacağı tarih ve saat",
  "Hedef teslim tarihi ve özel kabul gereksinimleri",
];

const faq = [
  { question: "Express kargo her zaman daha hızlı mıdır?", answer: "Hayır. Servis kapsaması, alım saati, uçuş bağlantısı ve varış bölgesi sonucu değiştirir. İki seçenek aynı adresler ve aynı teslim hedefiyle karşılaştırılmalıdır." },
  { question: "Kaç kilogramdan sonra hava kargo seçilmelidir?", answer: "Her hat için tek bir kilogram sınırı yoktur. Ölçü, ürün, rota, kapı hizmeti ve güncel kapasite fiyat dengesini değiştirebilir." },
  { question: "Paletli yük express kargoya verilebilir mi?", answer: "Bazı servislerde mümkün olabilir; fakat ölçü, ağırlık ve kabul sınırları taşıyıcıya göre değişir. Paletli yüklerde genel hava kargo seçeneği de mutlaka karşılaştırılmalıdır." },
  { question: "En doğru karşılaştırma için ne göndermeliyim?", answer: "Koli/palet bazında ölçü ve ağırlık, ürün tanımı, tam adresler, hazır olma zamanı ve teslim hedefini paylaşmanız gerekir." },
];

export default function HavaKargoMuExpressKargoMuPage() {
  const page = marketingPages["hava-kargo-mu-express-kargo-mu"];

  return (
    <AirCargoResourcePage page={page} readingTime="7 dakika" faq={faq}>
      <div className="space-y-14">
        <section aria-labelledby="air-express-comparison">
          <div className="max-w-3xl">
            <p className="font-semibold text-orange-600">Hızlı karşılaştırma</p>
            <h2 id="air-express-comparison" className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">Aynı uçak ağı, farklı operasyon modeli</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">İki servis de gönderiyi hava bağlantısıyla taşıyabilir; fark, yükün kabulünden son teslimine kadar operasyonun ne kadar standart veya ihtiyaca özel kurgulandığıdır. REX, yalnızca hızlı görüneni değil, teslim hedefini makul toplam maliyetle karşılayan seçeneği arar.</p>
          </div>

          <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
            <table className="w-full min-w-[800px] border-collapse text-left">
              <thead className="bg-slate-950 text-white">
                <tr>
                  <th className="px-5 py-4 text-sm font-semibold">Karar ölçütü</th>
                  <th className="px-5 py-4 text-sm font-semibold">Genel hava kargo</th>
                  <th className="px-5 py-4 text-sm font-semibold">Express kargo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {comparisonRows.map((row) => (
                  <tr key={row.criterion} className="align-top even:bg-slate-50/70">
                    <th scope="row" className="px-5 py-4 font-semibold text-slate-950">{row.criterion}</th>
                    <td className="px-5 py-4 leading-7 text-slate-600">{row.air}</td>
                    <td className="px-5 py-4 leading-7 text-slate-600">{row.express}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl bg-slate-950 p-6 text-white sm:p-9 lg:grid-cols-[1.4fr_0.8fr] lg:items-center">
          <div>
            <p className="font-semibold text-orange-400">Önce ücretlendirilebilir ağırlığı görün</p>
            <h2 className="mt-2 text-3xl font-bold">Gerçek kilo tek başına yeterli değildir</h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">Koli ölçüleriniz fiyatı doğrudan etkileyebilir. Ölçü ve ağırlığı hesaplayarak hava kargo ile express seçeneğini aynı veriyle karşılaştırın.</p>
          </div>
          <Link href="/hava-kargo-hacimsel-agirlik-hesaplama" className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3.5 font-semibold text-white transition hover:bg-orange-600">
            Hesaplama aracını aç <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </section>

        <section className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="font-semibold text-orange-600">Teklif kontrolü</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-950">İki seçeneği eşit şartlarda karşılaştırın</h2>
            <p className="mt-4 leading-7 text-slate-600">Eksik ölçü veya yalnızca şehir bilgisi, ucuz görünen ama uygulanamayan sonuç üretebilir.</p>
          </div>
          <ul className="grid gap-3">
            {checklist.map((item) => (
              <li key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 p-5 text-base leading-7 text-slate-700">
                <CheckCircle2 className="mt-1 h-5 w-5 flex-none text-blue-700" aria-hidden="true" />{item}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AirCargoResourcePage>
  );
}
