"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Phone, Menu, X } from "lucide-react";
import Link from "next/link";
import { QuoteForm } from "@/components/QuoteForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quoteFormOpen, setQuoteFormOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const openQuoteForm = () => {
    setQuoteFormOpen(true);
    closeMobileMenu();
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="w-full px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
            {/* Logo */}
            <div className="flex-shrink-0">
              <img 
                src="/rex-lojistik-logo-new.png" 
                alt="Rex Lojistik" 
                className="h-12 w-12 sm:h-16 sm:w-16 object-contain"
              />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#hizmetler" className="text-gray-700 hover:text-orange-500 transition-colors font-medium">
                Hizmetler
              </a>
              <a href="#takip" className="text-gray-700 hover:text-orange-500 transition-colors font-medium">
                Kargo Takip
              </a>
              <a href="#hakkimizda" className="text-gray-700 hover:text-orange-500 transition-colors font-medium">
                Hakkımızda
              </a>
              <a href="#iletisim" className="text-gray-700 hover:text-orange-500 transition-colors font-medium">
                İletişim
              </a>
              <Link 
                href="/"
                className="text-blue-600 hover:text-blue-700 transition-colors font-semibold flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Rex Portal
              </Link>
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-4">
              <a href="tel:+905434010755" className="flex items-center gap-2 text-gray-700 hover:text-orange-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="font-semibold">0543 401 07 55</span>
              </a>
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                onClick={openQuoteForm}
              >
                Teklif Al
              </Button>
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 text-gray-700 hover:text-orange-500 transition-colors"
              aria-label="Menüyü Aç"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Menu Drawer */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-white z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <img 
              src="/rex-lojistik-logo-new.png" 
              alt="Rex Lojistik" 
              className="h-16 w-auto"
            />
            <button
              onClick={closeMobileMenu}
              className="p-2 text-gray-700 hover:text-primary transition-colors"
              aria-label="Menüyü kapat"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto p-6">
            <ul className="space-y-1">
              <li>
                <Link
                  href="#hizmetler"
                  onClick={closeMobileMenu}
                  className="block px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-primary rounded-lg transition-colors"
                >
                  Hizmetlerimiz
                </Link>
              </li>
              <li>
                <Link
                  href="#hakkimizda"
                  onClick={closeMobileMenu}
                  className="block px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-primary rounded-lg transition-colors"
                >
                  Hakkımızda
                </Link>
              </li>
              <li>
                <Link
                  href="#referanslar"
                  onClick={closeMobileMenu}
                  className="block px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-primary rounded-lg transition-colors"
                >
                  Referanslar
                </Link>
              </li>
              <li>
                <Link
                  href="#iletisim"
                  onClick={closeMobileMenu}
                  className="block px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-primary rounded-lg transition-colors"
                >
                  İletişim
                </Link>
              </li>
            </ul>
          </nav>

          {/* Contact & CTA */}
          <div className="p-6 space-y-6">
            <nav className="space-y-4">
              <a 
                href="#hizmetler" 
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-orange-500 rounded-lg transition-colors font-medium"
              >
                Hizmetler
              </a>
              <a 
                href="#takip" 
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-orange-500 rounded-lg transition-colors font-medium"
              >
                Kargo Takip
              </a>
              <a 
                href="#hakkimizda" 
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-orange-500 rounded-lg transition-colors font-medium"
              >
                Hakkımızda
              </a>
              <a 
                href="#iletisim" 
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-orange-500 rounded-lg transition-colors font-medium"
              >
                İletişim
              </a>
            </nav>

            <div className="pt-6 border-t border-gray-200 space-y-4">
              <a 
                href="tel:+905434010755" 
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-orange-500 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="font-semibold">0543 401 07 55</span>
              </a>
              
              <Button 
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                size="lg"
                onClick={openQuoteForm}
              >
                Teklif Al
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Form Modal */}
      <Dialog open={quoteFormOpen} onOpenChange={setQuoteFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-800 p-6">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-bold mb-4">Teklif Al</DialogTitle>
          </DialogHeader>
          <QuoteForm />
        </DialogContent>
      </Dialog>
    </>
  );
}