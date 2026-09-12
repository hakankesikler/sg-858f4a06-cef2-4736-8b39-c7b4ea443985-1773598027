"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuoteForm } from "@/components/QuoteForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type ServiceLink = {
  href: string;
  label: string;
  children?: readonly ServiceLink[];
};

const serviceLinks: readonly ServiceLink[] = [
  { href: "/yurtici-parsiyel-tasimacilik", label: "Yurtiçi Parsiyel Taşımacılık" },
  { href: "/gumruk-antrepo-yurtici-transfer", label: "Antrepo ve Liman Transferi" },
  { href: "/hafta-sonu-acil-nakliye", label: "Hafta Sonu Acil Nakliye" },
  { href: "/komple-tasimacilik", label: "Komple Taşımacılık" },
  { href: "/uluslararasi-karayolu-tasimaciligi", label: "Uluslararası Karayolu" },
  { href: "/uluslararasi-karayolu-parsiyel-tasimacilik", label: "Uluslararası Karayolu Parsiyel" },
  { href: "/minivan-express-tasimacilik", label: "Minivan Express Taşımacılık" },
  { href: "/hava-kargo", label: "Hava Kargo Taşımacılığı" },
  { href: "/kapidan-kapiya-hava-kargo", label: "Kapıdan Kapıya Hava Kargo" },
  { href: "/turkiye-geneli-hava-kargo-alimi", label: "Türkiye Geneli Hava Kargo Alımı" },
  {
    href: "/denizyolu-tasimaciligi",
    label: "Denizyolu Taşımacılığı",
    children: [
      { href: "/denizyolu-parsiyel-tasimacilik", label: "Denizyolu Parsiyel (LCL)" },
      { href: "/denizyolu-konteyner-tasimaciligi", label: "Konteyner Taşımacılığı (FCL)" },
    ],
  },
  { href: "/express-kargo", label: "Uluslararası Express Kargo" },
  { href: "/yurtdisindan-turkiyeye-express-kargo", label: "Yurt Dışından Türkiye'ye Express" },
  { href: "/turkiyeden-yurtdisina-express-kargo", label: "Türkiye'den Yurt Dışına Express" },
  { href: "/depolama", label: "Depolama Hizmetleri" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMobileService, setExpandedMobileService] = useState<string | null>(null);
  const [quoteFormOpen, setQuoteFormOpen] = useState(false);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setExpandedMobileService(null);
  };
  const openQuoteForm = () => {
    setQuoteFormOpen(true);
    closeMobileMenu();
  };

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="w-full px-4 sm:px-6">
          <div className="flex items-center justify-between gap-4 py-2">
            <Link href="/" aria-label="REX Lojistik ana sayfa" className="flex-shrink-0">
              <Image src="/rex.png" alt="REX Lojistik" width={180} height={77} priority className="h-[57px] w-auto object-contain sm:h-[77px]" />
            </Link>

            <nav aria-label="Ana menü" className="hidden items-center gap-5 lg:flex lg:gap-8">
              <div className="group relative">
                <Link href="/#hizmetler" className="flex items-center gap-1 py-7 font-medium text-gray-700 transition-colors hover:text-orange-500">
                  Hizmetler <ChevronDown className="h-4 w-4" aria-hidden="true" />
                </Link>
                <div className="invisible absolute left-0 top-full grid w-[680px] -translate-y-2 grid-cols-2 rounded-2xl border border-slate-200 bg-white p-2 opacity-0 shadow-2xl transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                  {serviceLinks.map((item) => item.children ? (
                    <div key={item.href} className="col-span-2 grid grid-cols-3 gap-1 rounded-xl border border-orange-100 bg-orange-50/60 p-1">
                      <Link href={item.href} className="flex items-center justify-between rounded-lg px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-white hover:text-orange-600">
                        {item.label}
                        <ChevronDown className="h-4 w-4 -rotate-90 text-orange-500" aria-hidden="true" />
                      </Link>
                      {item.children.map((child) => (
                        <Link key={child.href} href={child.href} className="block rounded-lg bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:text-orange-600 hover:shadow-sm">
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <Link key={item.href} href={item.href} className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-orange-50 hover:text-orange-600">
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
              <Link href="/#takip" className="font-medium text-gray-700 transition-colors hover:text-orange-500">Kargo Takip</Link>
              <Link href="/hakkimizda" className="font-medium text-gray-700 transition-colors hover:text-orange-500">Hakkımızda</Link>
              <Link href="/iletisim" className="font-medium text-gray-700 transition-colors hover:text-orange-500">İletişim</Link>
              <Link href="/musteri-giris" className="flex items-center gap-2 font-semibold text-blue-600 transition-colors hover:text-blue-700">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Müşteri Portalı
              </Link>
            </nav>

            <div className="hidden items-center gap-4 lg:flex">
              <a href="tel:+905434010755" className="hidden items-center gap-2 text-gray-700 transition-colors hover:text-orange-500 xl:flex">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="font-semibold">0543 401 07 55</span>
              </a>
              <Button size="lg" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700" onClick={openQuoteForm}>Teklif Al</Button>
            </div>

            <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-gray-700 transition-colors hover:text-orange-500 lg:hidden" aria-label="Menüyü aç">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && <div className="fixed inset-0 z-50 bg-black/50 lg:hidden" onClick={closeMobileMenu} />}

      <div className={`fixed bottom-0 right-0 top-0 z-50 w-80 max-w-[85vw] transform bg-white transition-transform duration-300 ease-in-out lg:hidden ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-gray-200 p-4">
            <Link href="/" onClick={closeMobileMenu} aria-label="REX Lojistik ana sayfa"><Image src="/rex.png" alt="REX Lojistik" width={94} height={40} className="h-10 w-auto object-contain" /></Link>
            <button onClick={closeMobileMenu} className="p-2 text-gray-700 hover:text-orange-500" aria-label="Menüyü kapat"><X className="h-6 w-6" /></button>
          </div>

          <nav aria-label="Mobil menü" className="flex-1 overflow-y-auto p-5">
            <p className="px-4 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Hizmetler</p>
            <ul className="space-y-1">
              {serviceLinks.map((item) => item.children ? (
                <li key={item.href} className="rounded-xl border border-orange-100 bg-orange-50/50">
                  <div className="flex items-center">
                    <Link href={item.href} onClick={closeMobileMenu} className="min-w-0 flex-1 rounded-l-xl px-4 py-2.5 text-sm font-semibold text-gray-800 transition-colors hover:bg-orange-50 hover:text-orange-600">
                      {item.label}
                    </Link>
                    <button
                      type="button"
                      aria-expanded={expandedMobileService === item.href}
                      aria-label={`${item.label} alt menüsünü ${expandedMobileService === item.href ? "kapat" : "aç"}`}
                      onClick={() => setExpandedMobileService((current) => current === item.href ? null : item.href)}
                      className="rounded-r-xl p-3 text-orange-600 transition hover:bg-orange-100"
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform ${expandedMobileService === item.href ? "rotate-180" : ""}`} aria-hidden="true" />
                    </button>
                  </div>
                  {expandedMobileService === item.href && (
                    <ul className="space-y-1 border-t border-orange-100 p-2">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link href={child.href} onClick={closeMobileMenu} className="block rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:text-orange-600">
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ) : (
                <li key={item.href}><Link href={item.href} onClick={closeMobileMenu} className="block rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-orange-50 hover:text-orange-600">{item.label}</Link></li>
              ))}
            </ul>
            <div className="my-4 border-t border-slate-200" />
            <ul className="space-y-1">
              <li><Link href="/#takip" onClick={closeMobileMenu} className="block rounded-lg px-4 py-3 font-medium text-gray-700 hover:bg-gray-100 hover:text-orange-500">Kargo Takip</Link></li>
              <li><Link href="/hakkimizda" onClick={closeMobileMenu} className="block rounded-lg px-4 py-3 font-medium text-gray-700 hover:bg-gray-100 hover:text-orange-500">Hakkımızda</Link></li>
              <li><Link href="/iletisim" onClick={closeMobileMenu} className="block rounded-lg px-4 py-3 font-medium text-gray-700 hover:bg-gray-100 hover:text-orange-500">İletişim</Link></li>
              <li><Link href="/musteri-giris" onClick={closeMobileMenu} className="flex items-center gap-2 rounded-lg px-4 py-3 font-semibold text-blue-600 hover:bg-blue-50 hover:text-blue-700">Müşteri Portalı</Link></li>
            </ul>
          </nav>

          <div className="space-y-4 border-t border-gray-200 p-6">
            <a href="tel:+905434010755" className="block text-center font-semibold text-slate-700">0543 401 07 55</a>
            <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700" size="lg" onClick={openQuoteForm}>Teklif Al</Button>
          </div>
        </div>
      </div>

      <Dialog open={quoteFormOpen} onOpenChange={setQuoteFormOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto border-slate-800 bg-slate-900 p-6">
          <DialogHeader><DialogTitle className="mb-4 text-2xl font-bold text-white">Teklif Al</DialogTitle></DialogHeader>
          <QuoteForm />
        </DialogContent>
      </Dialog>
    </>
  );
}
