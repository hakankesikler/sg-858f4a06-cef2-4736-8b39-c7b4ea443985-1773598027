import Link from "next/link";
import { ArrowRight, CheckCircle2, FileCheck2, MapPin, PackageCheck } from "lucide-react";
import { ExpressCargoResourcePage } from "@/components/ExpressCargoResourcePage";
import { marketingPages } from "@/content/marketing-pages";

const faq = [
  { question: "Yurt dışı kargo teklifi için hangi bilgiler gerekir?", answer: "Çıkış ve varış ülke/posta kodu, koli adedi, her kolinin dış ölçüsü ve brüt ağırlığı, açık ürün tanımı, miktar, değer ve hazır olma tarihi gerekir." },
  { question: "İçerik tanımına yalnızca 'numune' yazmak yeterli mi?", answer: "Genellikle yeterli değildir. Malzemenin ne olduğu, kullanım amacı ve mümkünse ürün kodu açıkça yazılmalıdır." },
  { question: "Bataryalı veya sıvı ürün gönderilebilir mi?", answer: "Ürün, paketleme, ülke ve taşıyıcı kabul kurallarına bağlıdır. Rezervasyon öncesinde ürün içeriği ve teknik bilgiler mutlaka paylaşılmalıdır." },
  { question: "Süre ne zaman kesinleşir?", answer: "Adres, ürün kabulü, servis kapsamı ve paketin hazır olma tarihi doğrulandıktan sonra planlanan transit süre paylaşılır. Resmi süreçler veya olağan dışı operasyon koşulları süreyi etkileyebilir." },
];

const checklist = [
  { icon: MapPin, title: "Adres ve iletişim", items: ["Gönderici ve alıcı tam unvanı", "Açık adres, ülke ve posta kodu", "Yetkili kişi, telefon ve e-posta"] },
  { icon: PackageCheck, title: "Paket bilgileri", items: ["Koli adedi ve ambalaj türü", "Her kolinin dış ölçüleri", "Her kolinin gerçek brüt ağırlığı"] },
  { icon: FileCheck2, title: "İçerik ve belge", items: ["Açık ve anlaşılır ürün tanımı", "Miktar, birim değer ve toplam değer", "Gönderi türüne uygun fatura veya proforma"] },
];

export default function YurtdisiKargoGonderimRehberiPage() {
  const page = marketingPages["yurtdisi-kargo-gonderim-rehberi"];

  return (
    <ExpressCargoResourcePage page={page} readingTime="7 dakika" faq={faq}>
      <div className="space-y-14">
        <section>
          <p className="font-semibold text-orange-600">Hızlı başlayan gönderi, doğru bilgiyle başlar</p>
          <h2 className="mt-2 max-w-3xl text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">Tekliften önce üç bilgi grubunu hazırlayın</h2>
          <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-600">Eksik adres, yaklaşık ölçü veya belirsiz ürün tanımı ilk bakışta zaman kazandırıyor gibi görünür; ancak servis seçimini ve fiyat doğruluğunu zayıflatır. Aşağıdaki kısa liste hem Türkiye'den çıkış hem de yurt dışından Türkiye'ye alım için ortak başlangıçtır.</p>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {checklist.map(({ icon: Icon, title, items }) => (
              <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-700"><Icon className="h-6 w-6" aria-hidden="true" /></div>
                <h3 className="mt-5 text-xl font-bold text-slate-950">{title}</h3>
                <ul className="mt-4 space-y-3">
                  {items.map((item) => <li key={item} className="flex gap-3 text-slate-600"><CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-green-600" aria-hidden="true" />{item}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl bg-slate-950 p-7 text-white sm:p-8">
            <p className="font-semibold text-orange-400">Türkiye'den dünyaya</p>
            <h2 className="mt-2 text-2xl font-bold">Paket hazırsa rota kapınızdan başlar</h2>
            <p className="mt-4 leading-7 text-slate-300">Türkiye genelindeki uygun çıkış adresinden alım, uluslararası servis ve son adres teslimi birlikte planlanır. En hızlı görünen değil, teslim hedefinize ve toplam maliyete uyan seçenek öne çıkar.</p>
            <Link href="/turkiyeden-yurtdisina-express-kargo" className="mt-5 inline-flex items-center gap-2 font-bold text-orange-300 hover:text-white">Yurt dışına gönderimi inceleyin <ArrowRight className="h-5 w-5" /></Link>
          </article>
          <article className="rounded-2xl bg-orange-500 p-7 text-white sm:p-8">
            <p className="font-semibold text-orange-50">Dünyadan Türkiye'ye</p>
            <h2 className="mt-2 text-2xl font-bold">Tedarikçinizden alımı siz başlatın</h2>
            <p className="mt-4 leading-7 text-orange-50">Göndericinin adresi, iletişim kişisi ve hazır olma bilgisi yeterliyse uygun ülkedeki adresten alım seçeneği değerlendirilebilir. Farklı ülkeler, tek operasyon muhatabı.</p>
            <Link href="/yurtdisindan-turkiyeye-express-kargo" className="mt-5 inline-flex items-center gap-2 font-bold text-white hover:text-slate-950">Yurt dışından alımı inceleyin <ArrowRight className="h-5 w-5" /></Link>
          </article>
        </section>

        <section className="rounded-3xl border border-blue-200 bg-blue-50 p-6 sm:p-9">
          <p className="font-semibold text-blue-700">Taşıyıcı değil, uygun servis seçilir</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-950">Teklifinizde şu dört sorunun cevabı görünmeli</h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            {["Adresten alım kapsamda mı?", "Planlanan transit süre nedir?", "Uzak bölge veya ek hizmet var mı?", "Vergi ve diğer varış masrafları kime ait?"].map((item, index) => (
              <div key={item} className="flex gap-3 rounded-xl bg-white p-4 font-semibold text-slate-800"><span className="text-orange-600">0{index + 1}</span>{item}</div>
            ))}
          </div>
          <p className="mt-6 leading-7 text-slate-700">REX Lojistik'in işi bu cevapları tek tabloda görünür kılmaktır. Açık kapsam, karar verirken hız kadar güven de kazandırır.</p>
        </section>
      </div>
    </ExpressCargoResourcePage>
  );
}
