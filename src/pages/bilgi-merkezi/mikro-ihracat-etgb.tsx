import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { microExportGuide, microExportSteps, microExportFaq } from "@/content/micro-export-guide";
import { SITE_URL } from "@/lib/structured-data";

const canonical = `${SITE_URL}${microExportGuide.path}`;
const linkClass = "font-semibold text-orange-700 underline underline-offset-4";
const H2 = ({children}:{children:React.ReactNode}) => <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">{children}</h2>;

export default function MicroExportGuidePage() {
  return <>
    <SEO title={microExportGuide.seoTitle} description={microExportGuide.description} url={canonical}
      keywords={["mikro ihracat","ETGB nedir","BGB nedir","mikro ihracat limiti","mikro ihracat gerekli belgeler"]}
      structuredData={{"@context":"https://schema.org","@graph":[
        {"@type":"Article",headline:microExportGuide.title,description:microExportGuide.description,url:canonical,inLanguage:"tr-TR",datePublished:microExportGuide.date,dateModified:microExportGuide.updatedDate,author:{"@type":"Organization","@id":`${SITE_URL}/#organization`},publisher:{"@id":`${SITE_URL}/#organization`}},
        {"@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"Ana Sayfa",item:`${SITE_URL}/`},{"@type":"ListItem",position:2,name:"Bilgi Merkezi",item:`${SITE_URL}/bilgi-merkezi`},{"@type":"ListItem",position:3,name:microExportGuide.title,item:canonical}]},
        {"@type":"FAQPage",mainEntity:microExportFaq.map(x=>({"@type":"Question",name:x.question,acceptedAnswer:{"@type":"Answer",text:x.answer}}))}
      ]}} />
    <Header />
    <main className="bg-white pt-[74px] sm:pt-[94px]">
      <article>
        <header className="bg-slate-950 px-4 py-14 text-white">
          <div className="mx-auto max-w-5xl">
            <nav className="text-sm text-slate-300"><Link href="/">Ana Sayfa</Link> / <Link href="/bilgi-merkezi">Bilgi Merkezi</Link> / Mikro İhracat</nav>
            <p className="mt-9 text-sm font-bold uppercase tracking-widest text-orange-400">Dış ticaret ve express kargo rehberi</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight sm:text-5xl">{microExportGuide.title}</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">{microExportGuide.summary}</p>
          </div>
        </header>
        <div className="mx-auto max-w-4xl space-y-12 px-4 py-12 text-base leading-8 text-slate-700 sm:px-6 sm:text-lg">
          <section className="space-y-5"><H2>Mikro ihracat nedir?</H2>
            <p><strong>Mikro ihracat</strong>, belirlenen ağırlık ve kıymet sınırları içindeki ticari ihracat gönderilerinin basitleştirilmiş gümrük beyanı kapsamında yurt dışına gönderilebildiği modeldir.</p>
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-6"><strong>Güncel temel sınırlar:</strong> Gönderinin <strong>brüt ağırlığı 300 kg'ı</strong> ve <strong>kıymeti 15.000 Avro'yu</strong> aşmamalıdır. Her iki koşul birlikte değerlendirilir; ürünün mevzuat açısından uygunluğu ayrıca kontrol edilir.</div>
          </section>
          <section className="space-y-5 border-t pt-10"><H2>ETGB nedir? BGB nedir?</H2>
            <p><strong>ETGB</strong>, Elektronik Ticaret Gümrük Beyannamesi ifadesinin kısaltmasıdır ve hâlâ yaygın biçimde kullanılır. Güncel resmi terminolojide <strong>Basitleştirilmiş Gümrük Beyannamesi (BGB)</strong> ifadesi kullanılmaktadır.</p>
            <p>Uygun hızlı kargo gönderilerinde beyan işlemleri yetkilendirilmiş hızlı kargo operatörü veya posta idaresi tarafından gönderici adına yürütülebilir.</p>
          </section>
          <section className="space-y-5 border-t pt-10"><H2>Mikro ihracat nasıl yapılır?</H2>
            <ol className="space-y-5">{microExportSteps.map((s,i)=><li key={s.title} className="rounded-2xl bg-slate-50 p-6"><h3 className="text-xl font-bold text-slate-950">{i+1}. {s.title}</h3><p className="mt-2">{s.text}</p></li>)}</ol>
          </section>
          <section className="space-y-5 border-t pt-10"><H2>Hangi bilgiler ve belgeler gerekir?</H2>
            <p>Ürün, ülke ve operatöre göre ek belge istenebilir. Temel olarak ticari fatura, gönderici ve alıcı bilgileri, açık ürün tanımı, miktar, değer ve para birimi, brüt/net ağırlık, koli ölçüleri, GTİP ve menşe bilgisi hazırlanır. Ürün veya ülkeye göre izin ve sertifika gerekebilir.</p>
            <p>GTİP ve vergi numarası gibi beyan bilgilerinin doğru olması önemlidir.</p>
          </section>
          <section className="space-y-5 border-t pt-10"><H2>Mikro ihracat faturası nasıl hazırlanır?</H2>
            <p>Faturada ürün yalnızca “ürün”, “yedek parça” veya “numune” gibi genel ifadelerle değil, ticari niteliğini açıklayan doğru bir tanımla belirtilmelidir. Alıcı-satıcı bilgileri, miktar, değer ve para birimi tutarlı olmalıdır.</p>
            <div className="rounded-xl bg-slate-50 p-5"><p><strong>Zayıf:</strong> Spare Part</p><p><strong>Daha açıklayıcı:</strong> Automotive metal mounting bracket</p></div>
            <p>Vergisel belge düzeni işletmeye göre değişebileceğinden mali müşavirinizden güncel değerlendirme alınması önerilir.</p>
          </section>
          <section className="space-y-5 border-t pt-10"><H2>Mikro ihracat ile standart ihracat arasındaki fark</H2>
            <div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[560px] text-left text-sm"><thead className="bg-slate-950 text-white"><tr><th className="p-4">Özellik</th><th className="p-4">Mikro İhracat / BGB</th><th className="p-4">Standart İhracat</th></tr></thead><tbody>
              <tr className="border-t"><th className="p-4">Sınır</th><td className="p-4">Belirli ağırlık ve kıymet limitleri</td><td className="p-4">BGB limitlerine bağlı değil</td></tr>
              <tr className="border-t"><th className="p-4">Beyan</th><td className="p-4">BGB</td><td className="p-4">Standart ihracat beyannamesi</td></tr>
              <tr className="border-t"><th className="p-4">Süreç</th><td className="p-4">Yetkili operatör üzerinden yürütülebilir</td><td className="p-4">Standart gümrük prosedürü</td></tr>
              <tr className="border-t"><th className="p-4">Lojistik</th><td className="p-4">Hızlı kargo/posta kapsamında</td><td className="p-4">Kara, hava, deniz vb.</td></tr>
            </tbody></table></div>
          </section>
          <section className="space-y-5 border-t pt-10"><H2>Hangi gönderiler uygun olmayabilir?</H2>
            <p>300 kg veya 15.000 Avro sınırlarından birini aşan gönderiler mikro ihracat kapsamına girmez. Ayrıca ürünün niteliğine göre izin, kontrol, sertifika veya farklı gümrük prosedürleri gerekebilir. Ürün cinsi, GTİP, değer, ağırlık, varış ülkesi ve kullanım amacı birlikte değerlendirilmelidir.</p>
          </section>
          <section className="space-y-5 border-t pt-10"><H2>Mikro ihracatta KDV iadesi</H2>
            <p>Gerekli koşullar sağlandığında vergi iadesi süreçlerinden yararlanılması mümkün olabilir. GTİP ve vergi numarası gibi bilgilerin doğruluğu önemlidir. Bu rehber mali veya vergisel danışmanlık yerine geçmez; güncel uygulama için mali müşavirinizden değerlendirme alın.</p>
          </section>
          <section className="space-y-5 border-t pt-10"><H2>2026'da öne çıkan güncellemeler</H2>
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6"><h3 className="font-bold text-slate-950">Havayolu transit süreçleri</h3><p className="mt-2">18 Ağustos 2026 itibarıyla BGB kapsamındaki mikro ihracat kargolarının Türkiye içindeki havalimanları arasında ana aktarma havalimanına sevk sürecini kolaylaştıran düzenleme duyuruldu.</p><h3 className="mt-5 font-bold text-slate-950">AB gönderilerinde elektronik A.TR</h3><p className="mt-2">BGB kapsamında AB'ye ihraç edilen ve 150 Avro'yu aşmayan uygun eşya için kolaylaştırılmış elektronik A.TR sistemi 2026'da kullanıma sunuldu. Gönderi özelindeki uygunluk ayrıca kontrol edilmelidir.</p></div>
          </section>
          <section className="space-y-5 border-t pt-10"><H2>Mikro ihracat ve express kargo</H2>
            <p>REX Lojistik, uygun gönderilerde <Link href="/express-kargo" className={linkClass}>uluslararası express kargo</Link> ve <Link href="/turkiyeden-yurtdisina-express-kargo" className={linkClass}>Türkiye'den yurt dışına express gönderim</Link> organizasyonunu planlar. Alternatif taşıma modeli gereken yükler için <Link href="/hava-kargo" className={linkClass}>hava kargo</Link> da değerlendirilebilir.</p>
            <div className="rounded-2xl bg-slate-950 p-7 text-white"><h3 className="text-2xl font-bold">Mikro ihracat gönderiniz mi var?</h3><p className="mt-3 text-slate-300">Ürün, koli ölçüsü, ağırlık, değer ve varış ülkesini paylaşın. Uygun uluslararası express taşıma seçeneğini değerlendirelim.</p><Link href="/express-kargo" className="mt-5 inline-flex rounded-lg bg-orange-500 px-5 py-3 font-bold text-white">Mikro İhracat / Express Teklifi Al</Link></div>
          </section>
          <section className="space-y-5 border-t pt-10"><H2>Sık sorulan sorular</H2>
            <div className="space-y-4">{microExportFaq.map(x=><details key={x.question} className="rounded-xl border p-5"><summary className="cursor-pointer font-bold text-slate-950">{x.question}</summary><p className="mt-3">{x.answer}</p></details>)}</div>
          </section>
          <section className="space-y-4 border-t pt-10 text-sm text-slate-600"><h2 className="text-xl font-bold text-slate-950">Resmî kaynaklar ve güncellik notu</h2>
            <p>Gümrük ve dış ticaret mevzuatı değişebilir. Bu içerik bilgilendirme amaçlıdır; gönderi özelinde güncel mevzuat, ürün kısıtları, vergi uygulamaları ve yetkili operatör koşulları kontrol edilmelidir.</p>
            <ul className="list-disc pl-5"><li>T.C. Ticaret Bakanlığı Gümrük Rehberi – ETGB/BGB ve hızlı kargo işlemleri</li><li>T.C. Ticaret Bakanlığı – 2026 mikro ihracat havayolu transit düzenlemesi</li><li>T.C. Ticaret Bakanlığı – BGB kapsamında AB'ye ihracatta elektronik A.TR duyurusu</li></ul>
          </section>
        </div>
      </article>
    </main>
    <Footer />
  </>;
}
