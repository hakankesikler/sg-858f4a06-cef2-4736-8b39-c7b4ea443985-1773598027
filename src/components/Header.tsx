import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export function Header() {
  return (
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

          {/* CTA Buttons */}
          <div className="flex items-center space-x-4">
            <a
              href="tel:+905434010755"
              className="hidden sm:flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors"
            >
              <Phone className="h-4 w-4" />
              <span>+90 543 401 07 55</span>
            </a>
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white">
              Teklif Al
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}