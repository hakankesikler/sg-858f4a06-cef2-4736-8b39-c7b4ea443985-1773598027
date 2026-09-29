import type { GetStaticPaths, GetStaticProps } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { loadingGuides, type LoadingGuide } from "@/content/loading-guides";
import { SITE_URL } from "@/lib/structured-data";

export const getStaticPaths: GetStaticPaths = async () => ({ paths:loadingGuides.map((guide) => ({params:{slug:guide.slug}})),fallback:false });
export const getStaticProps: GetStaticProps<{guide:LoadingGuide}> = async ({params}) => {
  const guide = loadingGuides.find((item) => item.slug === params?.slug);
  return guide ? {props:{guide}} : {notFound:true};
};
export default function LoadingGuidePage({guide}:{guide:LoadingGuide}) {
  const canonical = `${SITE_URL}/bilgi-merkezi/${guide.slug}`;
  return <><SEO title={`${guide.title} | REX Lojistik`} description={guide.summary} url={canonical} structuredData={{"@context":"https://schema.org","@graph":[{"@type":"Article",headline:guide.title,description:guide.summary,url:canonical,inLanguage:"tr-TR",publisher:{"@id":`${SITE_URL}/#organization`}},{"@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"Ana Sayfa",item:`${SITE_URL}/`},{"@type":"ListItem",position:2,name:"Bilgi Merkezi",item:`${SITE_URL}/bilgi-merkezi`},{"@type":"ListItem",position:3,name:guide.title,item:canonical}]}]}} /><Header /><main className="min-h-screen bg-white pt-[74px] sm:pt-[94px]"><header className="bg-slate-950 px-4 py-12 text-white sm:px-6 sm:py-16"><div className="mx-auto max-w-4xl"><nav aria-label="İçerik yolu" className="text-sm text-slate-300"><Link href="/">Ana Sayfa</Link> / <Link href="/bilgi-merkezi">Bilgi Merkezi</Link> / <span aria-current="page">{guide.title}</span></nav><p className="mt-8 text-sm font-bold uppercase tracking-widest text-orange-400">Yükleme planlama rehberi</p><h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">{guide.title}</h1><p className="mt-5 text-lg leading-8 text-slate-200">{guide.intro}</p></div></header><article className="mx-auto max-w-4xl space-y-10 px-4 py-12 sm:px-6">{guide.sections.map((section) => <section key={section.title}><h2 className="text-2xl font-bold text-slate-950">{section.title}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph} className="mt-4 text-base leading-8 text-slate-700">{paragraph}</p>)}</section>)}<div className="rounded-2xl border border-orange-200 bg-orange-50 p-6"><h2 className="text-xl font-bold text-slate-950">Örneği gerçek yerleşimde görün</h2><p className="mt-2 text-sm leading-6 text-slate-700">Örnek değerler yalnızca öğreticidir; kendi paletlerinizi dış ölçü ve brüt ağırlıklarıyla girin.</p><Link href={`/yukleme-planlayici?ornek=${guide.example}`} className="mt-4 inline-flex rounded-lg bg-orange-600 px-5 py-3 font-semibold text-white hover:bg-orange-700">{guide.exampleLabel} →</Link></div><div className="flex flex-wrap gap-5 border-t border-slate-200 pt-8 text-sm font-semibold"><Link href={guide.related} className="text-orange-700 underline">İlgili REX sayfası</Link><Link href="/komple-tasimacilik" className="text-orange-700 underline">Komple taşımacılık</Link><Link href="/denizyolu-konteyner-tasimaciligi" className="text-orange-700 underline">FCL taşımacılık</Link></div></article></main><Footer /></>;
}
