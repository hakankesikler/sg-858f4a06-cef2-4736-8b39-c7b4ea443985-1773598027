import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { lclGuide } from "@/content/lcl-guide";
import { microExportGuide } from "@/content/micro-export-guide";
import { SITE_URL } from "@/lib/structured-data";

export default function BilgiMerkeziPage() {
  return <>
    <SEO title="Bilgi Merkezi | Lojistik ve Taşıma Rehberleri | REX Lojistik" description="Taşıma seçeneklerini anlamak, yük bilgilerini hazırlamak ve teklifleri karşılaştırmak için REX Lojistik rehberlerini inceleyin." url={`${SITE_URL}/bilgi-merkezi`} structuredData={{ "@context": "https://schema.org", "@type": "CollectionPage", name: "Bilgi Merkezi", url: `${SITE_URL}/bilgi-merkezi`, inLanguage: "tr-TR", mainEntity: { "@type": "ItemList", itemListElement: [{ "@type": "ListItem", position: 1, url: `${SITE_URL}${lclGuide.path}`, name: lclGuide.title }, { "@type": "ListItem", position: 2, url: `${SITE_URL}${microExportGuide.path}`, name: microExportGuide.title }] } }} />
    <Header />
    <main className="min-h-[70vh] bg-slate-50 px-4 pb-20 pt-32 sm:px-6 sm:pt-40">
      <div className="mx-auto max-w-5xl">
        <nav aria-label="İçerik yolu" className="text-sm text-slate-500"><Link href="/" className="hover:underline">Ana Sayfa</Link> / <span aria-current="page">Bilgi Merkezi</span></nav>
        <p className="mt-10 text-sm font-bold uppercase tracking-widest text-orange-700">REX Lojistik rehberleri</p>
        <h1 className="mt-3 text-4xl font-bold text-slate-950 sm:text-5xl">Bilgi Merkezi</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">Taşıma seçeneklerini anlayın, yük bilgilerinizi hazırlayın ve teklifleri aynı kapsamda karşılaştırın.</p>
        <article className="mt-10 max-w-3xl rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
          <p className="text-sm font-semibold text-orange-700">Denizyolu · LCL rehberi</p>
          <h2 className="mt-3 text-2xl font-bold leading-tight text-slate-950 sm:text-3xl"><Link href={lclGuide.path} className="hover:text-orange-700">{lclGuide.title}</Link></h2>
          <p className="mt-4 leading-7 text-slate-600">{lclGuide.summary}</p>
          <Link href={lclGuide.path} className="mt-6 inline-flex font-bold text-orange-700 underline underline-offset-4">Rehberi oku →</Link>
        </article>
        <article className="mt-6 max-w-3xl rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
          <p className="text-sm font-semibold text-orange-700">Dış ticaret · Mikro ihracat rehberi</p>
          <h2 className="mt-3 text-2xl font-bold leading-tight text-slate-950 sm:text-3xl"><Link href={microExportGuide.path} className="hover:text-orange-700">{microExportGuide.title}</Link></h2>
          <p className="mt-4 leading-7 text-slate-600">{microExportGuide.summary}</p>
          <Link href={microExportGuide.path} className="mt-6 inline-flex font-bold text-orange-700 underline underline-offset-4">Rehberi oku →</Link>
        </article>
      </div>
    </main>
    <Footer />
  </>;
}
