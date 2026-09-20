import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { lclGuide, loadingSteps, comparisonRows, lclFaq } from "@/content/lcl-guide";
import { SITE_URL } from "@/lib/structured-data";

const contents = [
  ["lcl-nedir", "LCL nedir?"], ["yukleme-sureci", "Yükleme süreci"],
  ["lcl-fcl-farki", "LCL ve FCL farkı"], ["fiyat-hesabi", "Fiyat ve W/M hesabı"],
  ["ne-zaman", "Ne zaman tercih edilir?"], ["uygun-olmayan-yukler", "Uygun olmayabilecek yükler"],
  ["istiflenebilirlik", "İstiflenebilirlik"], ["transit-suresi", "Transit süresi"],
  ["teklif-bilgileri", "Teklif bilgileri"], ["sik-sorulan-sorular", "Sık sorulan sorular"],
];
const linkClass = "font-semibold text-orange-700 underline decoration-orange-300 underline-offset-4 hover:text-orange-600";
const sectionClass = "scroll-mt-32 space-y-5 border-t border-slate-200 pt-10";
const headingClass = "text-2xl font-bold leading-tight text-slate-950 sm:text-3xl";
const canonical = `${SITE_URL}${lclGuide.path}`;

export default function LclGuidePage() {
  return (
    <>
      <SEO title={lclGuide.seoTitle} description={lclGuide.description} url={canonical}
        keywords={["LCL nedir", "LCL yükleme", "LCL FCL farkı", "CBM", "W/M"]}
        structuredData={{ "@context": "https://schema.org", "@graph": [
          { "@type": "Article", "@id": `${canonical}#article`, headline: lclGuide.title, description: lclGuide.description, url: canonical, inLanguage: "tr-TR", datePublished: lclGuide.date, dateModified: lclGuide.date, mainEntityOfPage: canonical, author: { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: "REX Lojistik", url: SITE_URL }, publisher: { "@id": `${SITE_URL}/#organization` } },
          { "@type": "BreadcrumbList", itemListElement: [
            { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: `${SITE_URL}/` },
            { "@type": "ListItem", position: 2, name: "Bilgi Merkezi", item: `${SITE_URL}/bilgi-merkezi` },
            { "@type": "ListItem", position: 3, name: lclGuide.title, item: canonical },
          ] },
        ] }} />
      <Header />
      <main className="bg-white pt-[74px] sm:pt-[94px]">
        <article>
          <header className="bg-slate-950 px-4 py-12 text-white sm:px-6 sm:py-16">
            <div className="mx-auto max-w-5xl">
              <nav aria-label="İçerik yolu" className="flex flex-wrap gap-2 text-sm text-slate-300">
                <Link href="/" className="hover:text-white">Ana Sayfa</Link><span aria-hidden="true">/</span>
                <Link href="/bilgi-merkezi" className="hover:text-white">Bilgi Merkezi</Link><span aria-hidden="true">/</span><span aria-current="page">LCL Rehberi</span>
              </nav>
              <p className="mt-9 text-sm font-bold uppercase tracking-widest text-orange-400">Denizyolu rehberi</p>
              <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight sm:text-5xl">{lclGuide.title}</h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">{lclGuide.summary}</p>
              <p className="mt-6 text-sm text-slate-400">REX Lojistik · <time dateTime={lclGuide.date}>20 Eylül 2026</time></p>
            </div>
          </header>
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:py-14">
            <aside>
              <nav aria-label="Bu rehberde" className="rounded-2xl border border-slate-200 bg-slate-50 p-5 lg:sticky lg:top-28">
                <p className="mb-4 font-bold text-slate-950">Bu rehberde</p>
                <ul className="space-y-3 text-sm leading-6 text-slate-600">{contents.map(([id, label]) => <li key={id}><a href={`#${id}`} className="hover:text-orange-700 hover:underline">{label}</a></li>)}</ul>
              </nav>
            </aside>
            <div className="min-w-0 space-y-12 text-base leading-8 text-slate-700 sm:text-lg">
              <section id="lcl-nedir" className="scroll-mt-32 space-y-5">
                <h2 className={headingClass}>LCL nedir?</h2>
                <p><strong>LCL (Less than Container Load)</strong>, bir konteynerin farklı göndericilere ait yüklerle paylaşıldığı parsiyel denizyolu taşıma modelidir. Yükünüz konteynerin tamamını doldurmadığında, uygun diğer gönderilerle aynı konteynerde taşınabilir.</p>
                <p>LCL yalnızca “az miktarda yük” anlamına gelmez. Gönderilerin depoda birleştirilmesi, konteynere yerleştirilmesi ve varışta ayrıştırılması da bu modelin parçasıdır. Bu nedenle seçim yapılırken hacim kadar ambalaj, yük uyumu ve teslim takvimi de değerlendirilir.</p>
                <p>Taşıma seçeneklerinin genel kapsamı için <Link href="/denizyolu-tasimaciligi" className={linkClass}>denizyolu taşımacılığı</Link>, hizmet ve teklif hazırlığı için <Link href="/denizyolu-parsiyel-tasimacilik" className={linkClass}>denizyolu parsiyel taşımacılık</Link> sayfalarını inceleyebilirsiniz.</p>
              </section>
              <section id="yukleme-sureci" className={sectionClass}>
                <h2 className={headingClass}>LCL yükleme nasıl yapılır?</h2>
                <p>LCL yükleme süreci, yükün konsolidasyon noktasına kabulünden varıştaki teslim bağlantısına kadar birbirini izleyen aşamalardan oluşur. Kesin akış, hat ve hizmet kapsamına göre değişir.</p>
                <ol className="space-y-6">{loadingSteps.map((step, i) => <li key={step.title} className="rounded-2xl bg-slate-50 p-5 sm:p-6"><h3 className="text-xl font-bold text-slate-950"><span className="mr-2 text-orange-700">{i + 1}.</span>{step.title}</h3><p className="mt-3">{step.text}</p></li>)}</ol>
              </section>
              <section id="lcl-fcl-farki" className={sectionClass}>
                <h2 className={headingClass}>LCL ve FCL arasındaki fark nedir?</h2>
                <p>FCL (Full Container Load), konteynerin tek göndericinin kullanımına ayrılmasıdır. LCL'de kapasite paylaşılır. Konteynerin fiziksel olarak dolu olması FCL için zorunlu değildir.</p>
                <div role="region" aria-label="LCL ve FCL karşılaştırması" tabIndex={0} className="overflow-x-auto rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <table className="w-full min-w-[560px] border-collapse text-left text-sm leading-6">
                    <caption className="bg-slate-50 p-4 text-left font-semibold text-slate-900">LCL ve FCL: kapasite, maliyet ve süreç karşılaştırması</caption>
                    <thead className="bg-slate-950 text-white"><tr><th scope="col" className="p-4">Kriter</th><th scope="col" className="p-4">LCL · Parsiyel</th><th scope="col" className="p-4">FCL · Komple konteyner</th></tr></thead>
                    <tbody>{comparisonRows.map(([label, lcl, fcl]) => <tr key={label} className="border-t border-slate-200 align-top"><th scope="row" className="p-4 font-semibold text-slate-950">{label}</th><td className="p-4">{lcl}</td><td className="p-4">{fcl}</td></tr>)}</tbody>
                  </table>
                </div>
                <p>FCL alternatifini <Link href="/denizyolu-konteyner-tasimaciligi" className={linkClass}>denizyolu konteyner taşımacılığı</Link> sayfasında inceleyin. Ekipman seçimi için <Link href="/konteyner-olculeri" className={linkClass}>konteyner ölçüleri</Link> yardımcı olur; nominal hacim, yükün tamamının fiilen sığacağını garanti etmez.</p>
              </section>
              <section id="fiyat-hesabi" className={sectionClass}>
                <h2 className={headingClass}>LCL fiyatı nasıl hesaplanır?</h2>
                <p>LCL maliyetinde rota, yük özellikleri ve hizmet kapsamıyla birlikte hacim ve ağırlık değerlendirilir. <strong>W/M (Weight or Measurement)</strong>, ağırlık veya hacim esaslarından ücretlendirmeye daha yüksek değer üretenin kullanılmasıdır. Ana navlunda yaygın yaklaşım, CBM cinsinden hacim ile metrik ton cinsinden brüt ağırlığı karşılaştırmaktır.</p>
                <h3 className="text-xl font-bold text-slate-950">CBM ve brüt ağırlık hesabı</h3>
                <p>CBM, metreküp (m³) cinsinden hacimdir. Aynı ölçüdeki ambalajlar için metre cinsinden boy × en × yükseklik × adet kullanılır. Farklı ölçülerdeki kalemler ayrı hesaplanıp toplanır. Ölçüler palet ve ambalaj dahil dış ölçüler; brüt ağırlık ise ambalaj dahil ağırlık olmalıdır.</p>
                <div className="rounded-2xl border border-orange-200 bg-orange-50 p-6">
                  <h3 className="font-bold text-slate-950">Örnek hesap · fiyat teklifi değildir</h3>
                  <p className="mt-3">Her biri 1,20 × 0,80 × 1,00 m olan 3 paletin toplam hacmi <strong>2,88 CBM</strong> olur. Toplam brüt ağırlık 1.500 kg ise 1,50 metrik tondur. 1 m³ / 1 ton karşılaştırması kullanılan bir tarifede esas değer 2,88 W/M olur. Aynı hacimde ağırlık 3.600 kg olsaydı 3,60 W/M esas alınırdı.</p>
                  <p className="mt-3 text-base">Bu değer yalnızca ilgili tarife kaleminin hesap temelidir. Minimum ücret, yuvarlama, yoğunluk oranı ve yük kabul koşulları teklifte teyit edilir; tüm masraflar aynı W/M kuralıyla hesaplanmaz.</p>
                </div>
                <p>Ölçülerden hacim bulmak için <Link href="/cbm-hesaplama" className={linkClass}>CBM hesaplama</Link> aracını kullanabilirsiniz. Hacim sonucu tek başına navlun fiyatı veya kesin rezervasyon anlamına gelmez.</p>
                <h3 className="text-xl font-bold text-slate-950">Toplam maliyete hangi kalemler eklenebilir?</h3>
                <ul className="list-disc space-y-2 pl-6"><li>Çıkışta alım ve kara transferi, CFS kabulü, konsolidasyon ve yükleme.</li><li>Ana denizyolu navlunu ve tarifede belirtilen ek ücretler.</li><li>Varış terminali, dekonsolidasyon, depo elleçleme ve teslim işlemleri.</li><li>Son kara taşıması, özel elleçleme ve kapsamına göre evrak giderleri.</li><li>Beklemeye bağlı depolama/ardiye, sigorta ve ilgili resmi giderler gibi ayrıca değerlendirilen kalemler.</li></ul>
                <p>Teklifleri aynı çıkış-varış noktaları ve teslim kapsamıyla karşılaştırın. Para birimi, geçerlilik süresi, dahil/hariç masraflar ve masrafları hangi tarafın karşılayacağı açık olmalıdır. Vergiler ve gümrük müşavirliği gibi kalemlerin navluna kendiliğinden dahil olduğu varsayılmamalıdır.</p>
              </section>
              <section id="ne-zaman" className={sectionClass}>
                <h2 className={headingClass}>LCL ne zaman tercih edilir?</h2>
                <p>Konteyner dolduracak miktarı beklemeden daha küçük partiler göndermek istediğinizde LCL değerlendirilebilir. Stokları parça parça yenileyen, teslim planı konsolidasyon programına uyabilen ve denizyoluna uygun ambalaj kullanan gönderiler bu modele adaydır.</p>
                <p>Ancak “şu CBM'nin altında her zaman LCL” şeklinde evrensel bir eşik yoktur. Hacim büyüdükçe veya yerel masraflar yükseldikçe FCL toplamda daha uygun olabilir. Karar, aynı kapsamda hazırlanmış iki teklif üzerinden verilmelidir.</p>
              </section>
              <section id="uygun-olmayan-yukler" className={sectionClass}>
                <h2 className={headingClass}>Hangi yüklerde uygun olmayabilir?</h2>
                <p>Çok acil teslim gerektiren, ek elleçlemeye dayanamayan veya standart konteyner/depo ekipmanıyla güvenli taşınamayan yükler için başka seçenekler gerekebilir.</p>
                <ul className="list-disc space-y-2 pl-6"><li>Sıcaklık kontrollü, çabuk bozulabilen veya özel ortam gerektiren ürünler.</li><li>Tehlikeli madde niteliği taşıyan, sızıntı, koku ya da diğer yüklerle uyumsuzluk riski olan ürünler.</li><li>Ağır tek parça, uzun veya ölçü dışı yükler; yetersiz ambalajlı ve çok kırılgan ürünler.</li><li>Paylaşımlı konteyner ve çok aşamalı elleçleme yerine özel taşıma gerektiren değerli veya hassas yükler.</li></ul>
                <p>Bunlar tüm LCL servisleri için mutlak yasak anlamına gelmez. Ürünün kabulü, hat ve taşıyıcı koşulları ile gerekli belge ve ekipman değerlendirmesine bağlıdır. Özel yük özellikleri rezervasyon öncesinde açıkça bildirilmelidir.</p>
              </section>
              <section id="istiflenebilirlik" className={sectionClass}>
                <h2 className={headingClass}>İstiflenebilirlik neden önemlidir?</h2>
                <p>İstiflenebilirlik, ambalajlı yükün üzerine başka yük konulup konulamayacağını ve hangi sınırlar içinde konulabileceğini belirtir. Paletli olması tek başına istiflenebilir olduğu anlamına gelmez. Ambalaj dayanımı, ürün hassasiyeti, izin verilen üst yük ve yön bilgisi birlikte değerlendirilir.</p>
                <p>İstiflenemeyen yük konteyner içinde ilave kullanılmayan alan yaratabilir. Bu durum kabulü, yerleşimi ve ücretlendirmeyi etkileyebilir. “Üstüne yük konulamaz” bilgisiyle birlikte varsa istif katı ve üst yük sınırını paylaşın; sonradan bildirilen koşullar teklifin değişmesine yol açabilir.</p>
              </section>
              <section id="transit-suresi" className={sectionClass}>
                <h2 className={headingClass}>LCL transit süresi nasıl değerlendirilir?</h2>
                <p>Gemi transit süresi ile kapıdan kapıya teslim süresi aynı değildir. Toplam takvim; alım, CFS son kabulü, konsolidasyon, gemi bekleme ve seyri, varsa aktarma, varışta ayrıştırma, resmi işlemler ve son teslim bağlantısını kapsar.</p>
                <p>Son kabul tarihini kaçırmak bir sonraki çıkışın beklenmesine neden olabilir. Liman yoğunluğu, sefer değişiklikleri ve evrak eksikleri de süreyi uzatabilir. Teklifte tahminin limandan limana mı, depodan depoya mı, kapıdan kapıya mı verildiğini sorun. Rota ve program teyidi olmadan kesin gün vaadi verilmesi doğru değildir.</p>
              </section>
              <section id="teklif-bilgileri" className={sectionClass}>
                <h2 className={headingClass}>LCL teklifi için gerekli bilgiler</h2>
                <ul className="list-disc space-y-2 pl-6"><li>Çıkış ve varış ülkesi, şehir, posta kodu ve istenen alım/teslim noktaları.</li><li>Ürün tanımı, varsa GTİP/HS kodu ve özel taşıma gereksinimleri.</li><li>Her koli/paletin adedi, ambalaj dahil boy × en × yükseklik ölçüleri ve brüt ağırlığı.</li><li>Ambalaj türü, istiflenebilirlik ve varsa elleçleme/üst yük sınırları.</li><li>Yükün hazır olma tarihi ve hedef teslim aralığı.</li><li>Kararlaştırılan teslim şekli (Incoterms) ve adlandırılmış yer; talep edilen taşıma kapsamı.</li><li>Gerekiyorsa ambalaj fotoğrafı, paketleme listesi ve özel yük belgeleri.</li></ul>
                <p>Eksik ölçü veya tahmini ağırlıkla alınan fiyatlar kesinleşmeden önce yeniden değerlendirilebilir. Çıkış ve varış yerel masraflarının, sigortanın ve resmi giderlerin teklifte nasıl ele alındığını kontrol edin.</p>
              </section>
              <section id="sik-sorulan-sorular" className={sectionClass}>
                <h2 className={headingClass}>LCL hakkında sık sorulan sorular</h2>
                <div className="divide-y divide-slate-200">{lclFaq.map(item => <details key={item.question} className="py-5"><summary className="cursor-pointer font-semibold text-slate-950">{item.question}</summary><p className="mt-3">{item.answer}</p></details>)}</div>
              </section>
              <section className="rounded-2xl bg-slate-950 p-7 text-white sm:p-9" aria-labelledby="lcl-teklif">
                <h2 id="lcl-teklif" className="text-2xl font-bold sm:text-3xl">Yükünüz LCL mi FCL mi olmalı?</h2>
                <p className="mt-4 text-slate-300">Ölçü, brüt ağırlık, istiflenebilirlik, rota ve hazır olma tarihini paylaşın. Uygun taşıma seçeneğini toplam maliyet ve teslim planıyla birlikte değerlendirelim.</p>
                <Link href="/denizyolu-tasimaciligi#sea-whatsapp-planner-heading" className="mt-6 inline-flex rounded-xl bg-orange-600 px-6 py-3 font-bold text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-300">Denizyolu Teklifi Al</Link>
              </section>
              <section className="border-t border-slate-200 pt-6 text-sm leading-6 text-slate-500" aria-label="Kaynaklar">
                <p>Genel kavramlar için kaynaklar: <a href="https://www.dhl.com/us-en/home/global-forwarding/freight-forwarding-education-center/the-cost-drivers-of-lcl-rates.html" className="underline">DHL · LCL maliyet bileşenleri</a> ve <a href="https://www.dhlfreight.com/nl-en/home/global-forwarding/freight-forwarding-education-center/all-you-need-to-know-about-lcl.html" className="underline">DHL · LCL süreç rehberi</a>. Örnek hesap açıklama amaçlıdır; REX tarifesi veya taşıma taahhüdü değildir.</p>
              </section>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
