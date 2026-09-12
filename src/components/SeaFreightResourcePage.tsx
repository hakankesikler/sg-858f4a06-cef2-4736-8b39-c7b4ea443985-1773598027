"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, ChevronRight, MessageCircle, Ship } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { marketingPages, type MarketingPageData } from "@/content/marketing-pages";

const siteUrl = "https://www.rexlojistik.com";

type SeaFreightResourcePageProps = {
  page: MarketingPageData;
  readingTime?: string;
  faq?: Array<{ question: string; answer: string }>;
  children: ReactNode;
};

function getStructuredData(page: MarketingPageData, faq: SeaFreightResourcePageProps["faq"]) {
  const url = `${siteUrl}/${page.slug}`;
  const schemas: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Denizyolu Taşımacılığı", item: `${siteUrl}/denizyolu-tasimaciligi` },
        { "@type": "ListItem", position: 3, name: page.title, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: page.title,
      description: page.seoDescription,
      url,
      inLanguage: "tr-TR",
      dateModified: "2026-09-12",
      author: { "@type": "Organization", name: "REX Lojistik", url: siteUrl },
      publisher: {
        "@type": "Organization",
        name: "REX Lojistik",
        logo: { "@type": "ImageObject", url: `${siteUrl}/rex.png?v=2` },
      },
    },
  ];

  if (faq?.length) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    });
  }

  return schemas;
}

export function SeaFreightResourcePage({ page, readingTime = "6 dakika", faq, children }: SeaFreightResourcePageProps) {
  const canonicalUrl = `${siteUrl}/${page.slug}`;

  return (
    <>
      <SEO
        title={page.seoTitle}
        description={page.seoDescription}
        keywords={page.keywords}
        url={canonicalUrl}
        structuredData={getStructuredData(page, faq)}
      />
      <div className="min-h-screen bg-white">
        <Header />
        <main className="pt-[74px] sm:pt-[94px]">
          <section className="relative isolate overflow-hidden bg-slate-950 text-white">
            <div className="absolute inset-0 -z-20 bg-[url('/hero-warehouse.jpg')] bg-cover bg-center opacity-20" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-950 via-blue-950/95 to-slate-900/90" />
            <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pb-20 lg:px-8">
              <nav aria-label="Sayfa yolu" className="mb-8 flex flex-wrap items-center gap-2 text-sm text-slate-300">
                <Link href="/" className="transition-colors hover:text-orange-400">Ana Sayfa</Link>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
                <Link href="/denizyolu-tasimaciligi" className="transition-colors hover:text-orange-400">Denizyolu</Link>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
                <span aria-current="page" className="text-white">{page.title}</span>
              </nav>

              <div className="grid items-end gap-10 lg:grid-cols-[1fr_320px]">
                <div className="max-w-4xl">
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-400/40 bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-300">
                    <BookOpen className="h-4 w-4" aria-hidden="true" /> {page.eyebrow}
                  </div>
                  <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">{page.title}</h1>
                  <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200 sm:text-xl">{page.lead}</p>
                  <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-300">
                    <span>Güncelleme: 12 Eylül 2026</span>
                    <span aria-hidden="true">•</span>
                    <span>{readingTime} okuma</span>
                  </div>
                </div>

                <aside className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <p className="flex items-center gap-2 font-bold text-white"><Ship className="h-5 w-5 text-orange-400" /> Denizyolu bilgi merkezi</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">Doğru taşıma modelini seçin; maliyet ve transit süreyi aynı planda değerlendirin.</p>
                  <nav aria-label="Denizyolu rehberleri" className="mt-4 grid gap-2 text-sm">
                    {[
                      ["/denizyolu-parsiyel-tasimacilik", "LCL parsiyel taşıma"],
                      ["/denizyolu-konteyner-tasimaciligi", "FCL konteyner taşıma"],
                      ["/lcl-mi-fcl-mi", "LCL–FCL karşılaştırması"],
                      ["/konteyner-olculeri", "Konteyner ölçüleri"],
                      ["/cbm-hesaplama", "CBM hesaplama"],
                    ].map(([href, label]) => (
                      <Link key={href} href={href} className={`rounded-lg px-3 py-2.5 transition ${href === `/${page.slug}` ? "bg-orange-500 font-semibold text-white" : "bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white"}`}>
                        {label}
                      </Link>
                    ))}
                  </nav>
                </aside>
              </div>
            </div>
          </section>

          <section className="py-12 sm:py-16">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">{children}</div>
          </section>

          {faq?.length ? (
            <section className="border-y border-slate-200 bg-slate-50 py-14 sm:py-16">
              <div className="mx-auto max-w-4xl px-4 sm:px-6">
                <p className="font-semibold text-orange-600">Sık sorulan sorular</p>
                <h2 className="mt-2 text-3xl font-bold text-slate-950">Kısa cevaplarla denizyolu rehberi</h2>
                <div className="mt-8 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white px-5 shadow-sm sm:px-7">
                  {faq.map((item) => (
                    <details key={item.question} className="group py-5">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-slate-900">
                        {item.question}
                        <span className="text-2xl font-light text-orange-500 transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                      </summary>
                      <p className="max-w-3xl pr-8 pt-3 text-base leading-7 text-slate-600">{item.answer}</p>
                    </details>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          <section className="border-b border-slate-200 py-14">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                <div>
                  <p className="font-semibold text-orange-600">Okumaya devam edin</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-950">İlgili denizyolu sayfaları</h2>
                  <p className="mt-2 max-w-2xl text-slate-600">Yük bilgilerinizi tamamladığınızda alternatifleri toplam maliyet ve tahmini transit süreleriyle birlikte sunalım.</p>
                </div>
              </div>
              <div className="mt-7 grid gap-4 md:grid-cols-3">
                {page.related.map((slug) => {
                  const relatedPage = marketingPages[slug];
                  if (!relatedPage) return null;
                  return (
                    <Link key={slug} href={`/${slug}`} className="group flex min-h-28 items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:border-orange-300 hover:text-orange-600 hover:shadow-lg">
                      {relatedPage.title}
                      <ArrowRight className="h-5 w-5 flex-none transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </Link>
                  );
                })}
              </div>
              <a href="https://wa.me/905434010755" target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 font-semibold text-green-700 hover:text-green-800">
                <MessageCircle className="h-5 w-5" aria-hidden="true" /> Yük bilgilerinizi WhatsApp'tan paylaşın
              </a>
            </div>
          </section>

        </main>
        <Footer />
      </div>
    </>
  );
}
