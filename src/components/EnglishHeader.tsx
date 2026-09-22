"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EnglishQuoteForm } from "@/components/EnglishQuoteForm";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const navigationLinks = [
  { href: "/en/#services", label: "Services" },
  { href: "/ldm-hesaplama", label: "Tools" },
  { href: "/en/#tracking", label: "Shipment Tracking" },
  { href: "/bilgi-merkezi", label: "Knowledge Centre" },
  { href: "/en/about", label: "About Us" },
  { href: "/en/contact", label: "Contact" },
];

export function EnglishHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quoteFormOpen, setQuoteFormOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);
  const openQuoteForm = () => {
    setQuoteFormOpen(true);
    closeMobileMenu();
  };

  useEffect(() => {
    const openEnglishQuoteForm = () => setQuoteFormOpen(true);
    window.addEventListener("rex:open-english-quote-form", openEnglishQuoteForm);
    return () => window.removeEventListener("rex:open-english-quote-form", openEnglishQuoteForm);
  }, []);

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="w-full px-4 sm:px-6">
          <div className="flex items-center justify-between gap-4 py-2">
            <Link href="/en" aria-label="REX Logistics home" className="flex-shrink-0">
              <Image src="/rex.png" alt="REX Logistics" width={180} height={77} priority className="h-[57px] w-auto object-contain sm:h-[77px]" />
            </Link>
            <nav aria-label="Primary navigation" className="hidden items-center gap-3 whitespace-nowrap text-sm xl:flex xl:gap-4 2xl:gap-6 2xl:text-base">
              {navigationLinks.map((link) => <Link key={link.href} href={link.href} className="font-medium text-gray-700 transition-colors hover:text-orange-500">{link.label}</Link>)}
              <Link href="/musteri-giris" className="flex items-center gap-2 font-semibold text-blue-600 transition-colors hover:text-blue-700"><svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>Customer Portal</Link>
            </nav>
            <div className="hidden items-center gap-4 xl:flex">
              <LanguageSwitcher locale="en" />
              <a href="tel:+905434010755" className="hidden items-center gap-2 whitespace-nowrap text-gray-700 transition-colors hover:text-orange-500 2xl:flex"><svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg><span className="font-semibold">0543 401 07 55</span></a>
              <Button size="lg" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700" onClick={openQuoteForm}>Get a Quote</Button>
            </div>
            <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-gray-700 transition-colors hover:text-orange-500 xl:hidden" aria-label="Open menu"><svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg></button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && <div className="fixed inset-0 z-50 bg-black/50 xl:hidden" onClick={closeMobileMenu} />}
      <div className={`fixed bottom-0 right-0 top-0 z-50 w-80 max-w-[85vw] transform bg-white transition-transform duration-300 ease-in-out xl:hidden ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-gray-200 p-4"><Link href="/en" onClick={closeMobileMenu} aria-label="REX Logistics home"><Image src="/rex.png" alt="REX Logistics" width={94} height={40} className="h-10 w-auto object-contain" /></Link><div className="flex items-center gap-2"><LanguageSwitcher locale="en" /><button onClick={closeMobileMenu} className="p-2 text-gray-700 hover:text-orange-500" aria-label="Close menu"><X className="h-6 w-6" /></button></div></div>
          <nav aria-label="Mobile navigation" className="flex-1 overflow-y-auto p-5"><p className="px-4 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Explore REX Logistics</p><ul className="space-y-1">{navigationLinks.map((link) => <li key={link.href}><Link href={link.href} onClick={closeMobileMenu} className="block rounded-lg px-4 py-3 font-medium text-gray-700 hover:bg-gray-100 hover:text-orange-500">{link.label}</Link></li>)}<li><Link href="/musteri-giris" onClick={closeMobileMenu} className="flex items-center gap-2 rounded-lg px-4 py-3 font-semibold text-blue-600 hover:bg-blue-50 hover:text-blue-700">Customer Portal</Link></li></ul></nav>
          <div className="space-y-4 border-t border-gray-200 p-6"><a href="tel:+905434010755" className="block text-center font-semibold text-slate-700">0543 401 07 55</a><Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700" size="lg" onClick={openQuoteForm}>Get a Quote</Button></div>
        </div>
      </div>
      <Dialog open={quoteFormOpen} onOpenChange={setQuoteFormOpen}><DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto border-slate-800 bg-slate-900 p-6"><DialogHeader><DialogTitle className="mb-4 text-2xl font-bold text-white">Get a Quote</DialogTitle></DialogHeader><EnglishQuoteForm variant="modal" /></DialogContent></Dialog>
    </>
  );
}
