import Link from "next/link";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { SEO } from "@/components/SEO";
import { EnglishFooter } from "@/components/EnglishFooter";
import { EnglishHeader } from "@/components/EnglishHeader";
import type { EnglishPublicPage } from "@/content/english-public-pages";

const SITE_URL = "https://www.rexlojistik.com";
const serviceLinks = [
  { href: "/en/domestic-part-load-transport", label: "Domestic part loads" },
  { href: "/en/full-truckload-transport", label: "Full truckload" },
  { href: "/en/international-road-freight", label: "International road freight" },
  { href: "/en/air-freight", label: "Air freight" },
  { href: "/en/express-courier", label: "Express courier" },
  { href: "/en/sea-freight", label: "Sea freight" },
];

export function EnglishPublicPage({ page }: { page: EnglishPublicPage }) {
  const canonical = `${SITE_URL}/en/${page.slug}`;
  const structuredData = { "@context": "https://schema.org", "@graph": [
    { "@type": "WebPage", "@id": canonical, url: canonical, name: page.title, description: page.description, isPartOf: { "@id": `${SITE_URL}/#website` }, about: { "@id": `${canonical}#service` } },
    { "@type": "Service", "@id": `${canonical}#service`, name: page.title, url: canonical, description: page.lead, provider: { "@id": `${SITE_URL}/#organization` } },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/en` }, { "@type": "ListItem", position: 2, name: page.title, item: canonical }] },
  ] };
  return <><SEO title={page.seoTitle} description={page.description} url={canonical} language="en" alternates={{ tr: `${SITE_URL}${page.turkishPath}`, en: canonical }} structuredData={structuredData} /><EnglishHeader /><main>
    <section className="bg-gradient-to-br from-slate-950 via-slate-800 to-slate-900 px-4 py-16 text-white sm:px-6 sm:py-24 lg:px-8"><div className="mx-auto max-w-5xl"><nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-300"><Link href="/en" className="hover:text-white">Home</Link> <span className="px-2">/</span> {page.title}</nav><p className="text-sm font-bold uppercase tracking-[0.22em] text-orange-300">REX Logistics</p><h1 className="mt-3 max-w-4xl text-4xl font-bold leading-tight sm:text-5xl">{page.title}</h1><p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-200">{page.lead}</p><div className="mt-8 flex flex-wrap gap-4"><Link href="/en/#quote" className="rounded-md bg-orange-500 px-6 py-3 font-bold hover:bg-orange-600">Get a quote</Link><a href="https://wa.me/905434010755" className="inline-flex items-center gap-2 rounded-md border border-white/30 px-6 py-3 font-semibold hover:bg-white/10"><MessageCircle className="h-5 w-5" />Ask on WhatsApp</a></div></div></section>
    <section className="px-4 py-12 sm:px-6 lg:px-8"><div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">{page.highlights.map((item) => <div key={item.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><CheckCircle2 className="mb-4 h-6 w-6 text-orange-500" /><h2 className="text-xl font-bold text-slate-900">{item.title}</h2><p className="mt-2 leading-relaxed text-slate-600">{item.text}</p></div>)}</div></section>
    <section className="bg-slate-50 px-4 py-12 sm:px-6 lg:px-8"><div className="mx-auto max-w-4xl space-y-12">{page.sections.map((section) => <article key={section.title}><h2 className="text-3xl font-bold text-slate-900">{section.title}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph} className="mt-4 text-lg leading-relaxed text-slate-700">{paragraph}</p>)}</article>)}</div></section>
    <section className="px-4 py-14 sm:px-6 lg:px-8"><div className="mx-auto max-w-4xl"><h2 className="text-3xl font-bold text-slate-900">Frequently asked questions</h2><div className="mt-7 space-y-3">{page.faqs.map((faq) => <details key={faq.question} className="rounded-xl border border-slate-200 bg-white p-5"><summary className="cursor-pointer font-semibold text-slate-900">{faq.question}</summary><p className="mt-3 leading-relaxed text-slate-600">{faq.answer}</p></details>)}</div></div></section>
    <section className="bg-orange-50 px-4 py-12 sm:px-6 lg:px-8"><div className="mx-auto max-w-5xl"><h2 className="text-2xl font-bold text-slate-900">Explore related logistics solutions</h2><div className="mt-5 flex flex-wrap gap-3">{serviceLinks.filter((link) => link.href !== `/en/${page.slug}`).map((link) => <Link key={link.href} href={link.href} className="rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-800 hover:border-orange-400">{link.label}</Link>)}</div></div></section>
    <section className="bg-slate-900 px-4 py-14 text-white sm:px-6 lg:px-8"><div className="mx-auto max-w-5xl"><h2 className="text-3xl font-bold">Discuss your shipment with us</h2><p className="mt-3 max-w-2xl text-slate-300">Share your cargo, address and timing details so we can assess an appropriate transport option.</p><Link href="/en/#quote" className="mt-6 inline-block rounded-md bg-orange-500 px-6 py-3 font-bold hover:bg-orange-600">Get a quote</Link></div></section>
  </main><EnglishFooter /></>;
}
