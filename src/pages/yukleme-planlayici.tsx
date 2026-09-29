import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { LoadingPlanner } from "@/components/LoadingPlanner";
import { loadingGuides } from "@/content/loading-guides";
import { SITE_URL } from "@/lib/structured-data";

export default function YuklemePlanlayiciPage() {
  const canonical = `${SITE_URL}/yukleme-planlayici`;
  return <>
    <SEO title="3D Yükleme Planlayıcı | Konteyner ve Tır Palet Yerleşimi | REX Lojistik" description="Yüklü paletlerinizin dış ölçüsü, ağırlığı ve istif koşullarıyla 20′/40′ konteyner veya dorse için ön yerleşim oluşturun. 3D planı inceleyin, teklif isteyin." url={canonical} structuredData={{"@context":"https://schema.org","@graph":[{"@type":"WebPage","@id":`${canonical}#webpage`,url:canonical,name:"3D Yükleme Planlayıcı",inLanguage:"tr-TR"},{"@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"Ana Sayfa",item:`${SITE_URL}/`},{"@type":"ListItem",position:2,name:"3D Yükleme Planlayıcı",item:canonical}]}]}} />
    <Header />
    <main className="min-h-screen bg-slate-50 pt-[74px] sm:pt-[94px]">
      <header className="bg-slate-950 px-4 py-12 text-white sm:px-6 sm:py-16"><div className="mx-auto max-w-7xl"><nav aria-label="İçerik yolu" className="text-sm text-slate-300"><Link href="/" className="hover:text-white">Ana Sayfa</Link> / <span aria-current="page">3D Yükleme Planlayıcı</span></nav><p className="mt-8 text-sm font-bold uppercase tracking-widest text-orange-400">Ücretsiz ön planlama aracı</p><h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">3D Yükleme Planlayıcı</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-slate-200">Paletlerin dış ölçülerine göre gerçek taban konumlarını, istifi ve ağırlığı birlikte değerlendirin. FCL konteynerlerini veya FTL dorse seçeneklerini karşılaştırın; sonucu döndürülebilir 3D planda görün.</p><div className="mt-6 flex flex-wrap gap-4 text-sm font-semibold text-slate-300"><span>Üyelik gerektirmez</span><span>•</span><span>Ürün veritabanı gerektirmez</span><span>•</span><span>Yük listesi yayımlanmaz</span></div></div></header>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14"><LoadingPlanner /><section className="mt-14"><h2 className="text-2xl font-bold text-slate-950">Planlamayı anlamak için kısa rehberler</h2><div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{loadingGuides.map((guide) => <Link key={guide.slug} href={`/bilgi-merkezi/${guide.slug}`} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-orange-400 hover:shadow-lg"><h3 className="font-bold text-slate-950">{guide.title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{guide.summary}</p><span className="mt-4 inline-block text-sm font-semibold text-orange-700">Rehberi oku →</span></Link>)}</div></section><section className="mt-14 grid gap-4 md:grid-cols-2"><Link href="/komple-tasimacilik" className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 hover:border-orange-400"><strong>Komple araç taşımacılığı</strong><p className="mt-2 text-sm text-slate-600">FTL sevkiyatın hizmet kapsamını ve teklif sürecini inceleyin.</p></Link><Link href="/denizyolu-konteyner-tasimaciligi" className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 hover:border-orange-400"><strong>FCL konteyner taşımacılığı</strong><p className="mt-2 text-sm text-slate-600">Konteyner sevkiyatında hizmet ve planlama ayrıntılarını inceleyin.</p></Link></section></div>
    </main><Footer />
  </>;
}
