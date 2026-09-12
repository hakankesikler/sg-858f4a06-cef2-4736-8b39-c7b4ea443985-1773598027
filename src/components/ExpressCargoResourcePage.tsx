"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Box, ChevronRight, Globe2, MessageCircle, PackageCheck } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { marketingPages, type MarketingPageData } from "@/content/marketing-pages";
import { buildResourcePageStructuredData, SITE_URL } from "@/lib/structured-data";

type ExpressCargoResourcePageProps = {
  page: MarketingPageData;
  readingTime?: string;
  faq?: Array<{ question: string; answer: string }>;
  children: ReactNode;
};

const expressLinks = [
  ["/express-kargo", "Uluslararası express kargo"],
  ["/yurtdisindan-turkiyeye-express-kargo", "Yurt dışından Türkiye'ye"],
  ["/turkiyeden-yurtdisina-express-kargo", "Türkiye'den yurt dışına"],
  ["/express-kargo-hacimsel-agirlik-hesaplama", "Hacimsel ağırlık hesaplama"],
  ["/yurtdisi-kargo-gonderim-rehberi", "Gönderim rehberi"],
];

export function ExpressCargoResourcePage({ page, readingTime = "6 dakika", faq, children }: ExpressCargoResourcePageProps) {
  const canonicalUrl = `${SITE_URL}/${page.slug}`;

  return (
    <>
      <SEO
        title={page.seoTitle}
        description={page.seoDescription}
        keywords={page.keywords}
        url={canonicalUrl}
        structuredData={buildResourcePageStructuredData({
          page,
          parentName: "Express Kargo",
          parentPath: "/express-kargo",
          dateModified: "2026-09-12",
        })}
      />
      <div className="min-h-screen bg-white">
        <Header />
        <main className="pt-[74px] sm:pt-[94px]">
          <section className="relative isolate overflow-hidden bg-[#071225] text-white">
            <div className="absolute -right-28 -top-40 -z-20 h-[34rem] w-[34rem] rounded-full bg-orange-500/20 blur-3xl" />
            <div className="absolute -bottom-44 left-1/4 -z-20 h-[30rem] w-[30rem] rounded-full bg-blue-600/20 blur-3xl" />
            <div className="absolute inset-0 -z-10 bg-[linear-gradient(120deg,rgba(7,18,37,.99),rgba(18,42,80,.94),rgba(7,18,37,.97))]" />
            <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pb-20 lg:px-8">
              <nav aria-label="Sayfa yolu" className="mb-8 flex flex-wrap items-center gap-2 text-sm text-slate-300">
                <Link href="/" className="transition-colors hover:text-orange-400">Ana Sayfa</Link>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
                <Link href="/express-kargo" className="transition-colors hover:text-orange-400">Express Kargo</Link>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
                <span aria-current="page" className="text-white">{page.title}</span>
              </nav>

              <div className="grid items-end gap-10 lg:grid-cols-[1fr_340px]">
                <div className="max-w-4xl">
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-400/40 bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-300">
                    <BookOpen className="h-4 w-4" aria-hidden="true" /> {page.eyebrow}
                  </div>
                  <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">{page.title}</h1>
                  <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200 sm:text-xl">{page.lead}</p>
                  <div className="mt-7 grid max-w-3xl gap-3 sm:grid-cols-3">
                    {["Türkiye'den dünyaya", "Dünyadan Türkiye'ye", "Tek muhatapla takip"].map((item, index) => (
                      <div key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white">
                        {index === 2 ? <PackageCheck className="h-5 w-5 flex-none text-orange-400" /> : <Globe2 className="h-5 w-5 flex-none text-orange-400" />}
                        {item}
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-300">
                    <span>Güncelleme: 12 Eylül 2026</span><span aria-hidden="true">•</span><span>{readingTime} okuma</span>
                  </div>
                </div>

                <aside className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <p className="flex items-center gap-2 font-bold text-white"><Box className="h-5 w-5 text-orange-400" /> Express kargo bilgi merkezi</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">Göndeririz. Getiririz. Takip ederiz. Teklifiniz, gönderinize uyan servis planıdır.</p>
                  <nav aria-label="Express kargo rehberleri" className="mt-4 grid gap-2 text-sm">
                    {expressLinks.map(([href, label]) => (
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
                <h2 className="mt-2 text-3xl font-bold text-slate-950">Express gönderi için kısa cevaplar</h2>
                <div className="mt-8 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white px-5 shadow-sm sm:px-7">
                  {faq.map((item) => (
                    <details key={item.question} className="group py-5">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-slate-900">
                        {item.question}<span className="text-2xl font-light text-orange-500 transition-transform group-open:rotate-45" aria-hidden="true">+</span>
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
                  <p className="font-semibold text-orange-600">Gönderinizi netleştirin</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-950">İlgili express kargo sayfaları</h2>
                  <p className="mt-2 max-w-2xl text-slate-600">Adres, içerik, ölçü, ağırlık ve teslim hedefini paylaşın; uygun servisleri süre ve toplam kapsamıyla karşılaştıralım.</p>
                </div>
              </div>
              <div className="mt-7 grid gap-4 md:grid-cols-3">
                {page.related.map((slug) => {
                  const relatedPage = marketingPages[slug];
                  if (!relatedPage) return null;
                  return (
                    <Link key={slug} href={`/${slug}`} className="group flex min-h-28 items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:border-orange-300 hover:text-orange-600 hover:shadow-lg">
                      {relatedPage.title}<ArrowRight className="h-5 w-5 flex-none transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </Link>
                  );
                })}
              </div>
              <a href="https://wa.me/905434010755" target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 font-semibold text-green-700 hover:text-green-800">
                <MessageCircle className="h-5 w-5" aria-hidden="true" /> Paket bilgilerinizi WhatsApp'tan paylaşın
              </a>
            </div>
          </section>

        </main>
        <Footer />
      </div>
    </>
  );
}
