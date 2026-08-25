"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  Globe2,
  Mail,
  MessageCircle,
  Phone,
  Plane,
  Route,
  Ship,
  Truck,
  Warehouse,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CTA } from "@/components/CTA";
import { SEO } from "@/components/SEO";
import { marketingPages, type MarketingIcon, type MarketingPageData } from "@/content/marketing-pages";

const siteUrl = "https://www.rexlojistik.com";

const icons: Record<MarketingIcon, LucideIcon> = {
  truck: Truck,
  route: Route,
  globe: Globe2,
  plane: Plane,
  ship: Ship,
  zap: Zap,
  warehouse: Warehouse,
  building: Building2,
  contact: Phone,
};

function getStructuredData(page: MarketingPageData) {
  const url = `${siteUrl}/${page.slug}`;
  const organization = {
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: "REX Lojistik",
    legalName: "REX Lojistik Taşımacılık Depolama Danışmanlık Limited Şirketi",
    url: siteUrl,
    logo: `${siteUrl}/rex.png?v=2`,
    email: "info@rexlojistik.com",
    telephone: "+90 543 401 07 55",
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: siteUrl },
      { "@type": "ListItem", position: 2, name: page.title, item: url },
    ],
  };

  if (page.kind === "service") {
    return [
      breadcrumb,
      {
        "@context": "https://schema.org",
        "@type": "Service",
        name: page.title,
        description: page.seoDescription,
        url,
        provider: organization,
        areaServed: { "@type": "Country", name: "Türkiye" },
        serviceType: page.title,
      },
    ];
  }

  if (page.kind === "contact") {
    return [
      breadcrumb,
      {
        "@context": "https://schema.org",
        ...organization,
        contactPoint: {
          "@type": "ContactPoint",
          telephone: "+90 543 401 07 55",
          contactType: "customer service",
          availableLanguage: "Turkish",
        },
        address: [
          {
            "@type": "PostalAddress",
            streetAddress: "Adalet Mahallesi Manas Bulvarı Folkart Towers A Kule No:47/B K:26 D:2601",
            addressLocality: "Bayraklı",
            addressRegion: "İzmir",
            postalCode: "35630",
            addressCountry: "TR",
          },
          {
            "@type": "PostalAddress",
            streetAddress: "Muradiye Mahallesi Manolya Sokak No:228/1 A Blok No:28",
            addressLocality: "Yunusemre",
            addressRegion: "Manisa",
            postalCode: "45140",
            addressCountry: "TR",
          },
        ],
      },
    ];
  }

  return [
    breadcrumb,
    {
      "@context": "https://schema.org",
      ...organization,
      description: page.seoDescription,
      foundingDate: "2022",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Bayraklı",
        addressRegion: "İzmir",
        addressCountry: "TR",
      },
    },
  ];
}

export function MarketingPage({ page }: { page: MarketingPageData }) {
  const Icon = icons[page.icon];
  const canonicalUrl = `${siteUrl}/${page.slug}`;
  const openQuoteForm = () => window.dispatchEvent(new Event("openQuoteForm"));

  return (
    <>
      <SEO
        title={page.seoTitle}
        description={page.seoDescription}
        keywords={page.keywords}
        url={canonicalUrl}
        structuredData={getStructuredData(page)}
      />
      <div className="min-h-screen bg-white">
        <Header />
        <main className="pt-[74px] sm:pt-[94px]">
          <section className="relative isolate overflow-hidden bg-slate-950 text-white">
            <div
              className="absolute inset-0 -z-20 bg-cover bg-center opacity-30"
              style={{ backgroundImage: "url('/hero-warehouse.jpg')" }}
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950 via-slate-950/95 to-blue-950/75" />
            <div className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 sm:pb-24 lg:px-8">
              <nav aria-label="Sayfa yolu" className="mb-10 flex items-center gap-2 text-sm text-slate-300">
                <Link href="/" className="transition-colors hover:text-orange-400">Ana Sayfa</Link>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
                <span aria-current="page" className="text-white">{page.title}</span>
              </nav>
              <div className="max-w-4xl">
                <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-orange-400/40 bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-300">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {page.eyebrow}
                </div>
                <h1 className="max-w-4xl text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">{page.title}</h1>
                <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200 sm:text-xl">{page.lead}</p>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={openQuoteForm}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3.5 font-semibold text-white shadow-lg shadow-orange-950/30 transition hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-300"
                  >
                    Teklif Al <ArrowRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <a
                    href="https://wa.me/905434010755"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 font-semibold text-white transition hover:bg-white/20"
                  >
                    <MessageCircle className="h-5 w-5" aria-hidden="true" /> WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </section>

          <section aria-label="Öne çıkan bilgiler" className="relative z-10 -mt-8 px-4 sm:px-6">
            <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
              {page.highlights.map((item) => (
                <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5">
                  <h2 className="text-xl font-bold text-slate-900">{item.title}</h2>
                  <p className="mt-2 leading-7 text-slate-600">{item.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="py-16 sm:py-24">
            <div className="mx-auto max-w-5xl space-y-16 px-4 sm:px-6">
              {page.sections.map((section, sectionIndex) => (
                <article key={section.title} className="grid gap-7 lg:grid-cols-[0.85fr_1.65fr]">
                  <div>
                    <span className="text-sm font-bold uppercase tracking-[0.18em] text-orange-600">{String(sectionIndex + 1).padStart(2, "0")}</span>
                    <h2 className="mt-3 text-3xl font-bold leading-tight text-slate-950">{section.title}</h2>
                  </div>
                  <div className="space-y-5 text-lg leading-8 text-slate-600">
                    {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                    {section.bullets && (
                      <ul className="grid gap-3 pt-2 sm:grid-cols-2">
                        {section.bullets.map((bullet) => (
                          <li key={bullet} className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-base text-slate-800">
                            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-orange-500" aria-hidden="true" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>

          {page.steps && (
            <section className="bg-slate-950 py-16 text-white sm:py-20">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl">
                  <p className="font-semibold text-orange-400">Operasyon akışı</p>
                  <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Gönderiniz nasıl ilerler?</h2>
                </div>
                <ol className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                  {page.steps.map((step, index) => (
                    <li key={step.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 font-bold">{index + 1}</span>
                      <h3 className="mt-5 text-xl font-bold">{step.title}</h3>
                      <p className="mt-3 leading-7 text-slate-300">{step.text}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </section>
          )}

          <section className="py-16 sm:py-24">
            <div className="mx-auto max-w-4xl px-4 sm:px-6">
              <div className="text-center">
                <p className="font-semibold text-orange-600">Sık sorulan sorular</p>
                <h2 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">Merak edilenler</h2>
              </div>
              <div className="mt-10 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white px-5 shadow-sm sm:px-7">
                {page.faq.map((item) => (
                  <details key={item.question} className="group py-5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900">
                      {item.question}
                      <span className="text-2xl font-light text-orange-500 transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                    </summary>
                    <p className="pr-10 pt-3 leading-7 text-slate-600">{item.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          <section className="border-y border-slate-200 bg-slate-50 py-14">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-bold text-slate-950">İlgili sayfalar</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {page.related.map((slug) => {
                  const relatedPage = marketingPages[slug];
                  return (
                    <Link key={slug} href={`/${slug}`} className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 font-semibold text-slate-800 transition hover:border-orange-300 hover:text-orange-600 hover:shadow-md">
                      {relatedPage.title}
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </Link>
                  );
                })}
              </div>
              {page.kind === "contact" && (
                <div className="mt-8 flex flex-wrap gap-4 text-slate-700">
                  <a href="tel:+905434010755" className="inline-flex items-center gap-2 font-semibold hover:text-orange-600"><Phone className="h-5 w-5" />0543 401 07 55</a>
                  <a href="mailto:info@rexlojistik.com" className="inline-flex items-center gap-2 font-semibold hover:text-orange-600"><Mail className="h-5 w-5" />info@rexlojistik.com</a>
                </div>
              )}
            </div>
          </section>

          <CTA />
        </main>
        <Footer />
      </div>
    </>
  );
}
