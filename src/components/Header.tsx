"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, Phone } from "lucide-react";
import Image from "next/image";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? "bg-white/95 backdrop-blur-md border-b border-border shadow-lg" 
          : "bg-white/95 backdrop-blur-sm border-b border-border"
      }`}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-8">
          <Link href="/" className="flex items-center transition-transform hover:scale-105 flex-shrink-0">
            <Image 
              src="/rex-lojistik-logo-new.png" 
              alt="REX Lojistik Logo" 
              width={120} 
              height={120}
              className={`transition-all duration-300 ${
                isScrolled ? "w-24 h-24" : "w-[120px] h-[120px]"
              }`}
              priority
            />
          </Link>

          <nav className="hidden md:flex items-center gap-8 flex-1 justify-center">
            <Link href="#hizmetler" className="text-sm font-medium text-slate-text hover:text-navy transition-colors">
              Hizmetlerimiz
            </Link>
            <Link href="#hakkimizda" className="text-sm font-medium text-slate-text hover:text-navy transition-colors">
              Hakkımızda
            </Link>
            <Link href="#referanslar" className="text-sm font-medium text-slate-text hover:text-navy transition-colors">
              Referanslar
            </Link>
            <Link href="#iletisim" className="text-sm font-medium text-slate-text hover:text-navy transition-colors">
              İletişim
            </Link>
          </nav>

          <div className="flex items-center gap-4 flex-shrink-0">
            <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2 border-slate-text/20 text-navy hover:border-navy">
              <Phone className="w-4 h-4" />
              <span>+90 543 401 07 55</span>
            </Button>
            <Link href="#teklif">
              <Button size="sm" className="bg-logo-orange hover:bg-logo-orange/90 text-white shadow-lg shadow-logo-orange/20">
                Teklif Al
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}