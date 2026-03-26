"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Phone, Menu, X } from "lucide-react";
import Link from "next/link";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <img 
                src="/rex-lojistik-logo-new.png" 
                alt="Rex Lojistik Logo" 
                className="h-20 w-auto"
              />
            </Link>

            {/* Navigation - Hidden on mobile */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="#hizmetler" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
                Hizmetlerimiz
              </Link>
              <Link href="#hakkimizda" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
                Hakkımızda
              </Link>
              <Link href="#referanslar" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
                Referanslar
              </Link>
              <Link href="#iletisim" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
                İletişim
              </Link>
            </nav>

            {/* CTA Buttons - Desktop */}
            <div className="hidden md:flex items-center space-x-4">
              <a
                href="tel:+905434010755"
                className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors"
              >
                <Phone className="h-4 w-4" />
                <span>+90 543 401 07 55</span>
              </a>
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-white">
                Teklif Al
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 text-gray-700 hover:text-primary transition-colors"
              aria-label="Menüyü aç"
            >
              <Menu className="h-6 w-6" />
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
          <div className="p-6 border-t border-gray-200 space-y-4">
            <a
              href="tel:+905434010755"
              className="flex items-center justify-center space-x-2 w-full py-3 text-base font-medium text-gray-700 hover:text-primary transition-colors border border-gray-200 rounded-lg"
            >
              <Phone className="h-5 w-5" />
              <span>+90 543 401 07 55</span>
            </a>
            <Button 
              size="lg" 
              className="w-full bg-primary hover:bg-primary/90 text-white"
              onClick={closeMobileMenu}
            >
              Teklif Al
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}