import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, Phone } from "lucide-react";
import Image from "next/image";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image 
              src="/rex-logo-original.png" 
              alt="REX Lojistik Logo" 
              width={100} 
              height={100}
              className="h-16 w-auto"
              priority
            />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="#hizmetler" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Hizmetlerimiz
            </Link>
            <Link href="#hakkimizda" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Hakkımızda
            </Link>
            <Link href="#referanslar" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Referanslar
            </Link>
            <Link href="#iletisim" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              İletişim
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>+90 216 504 23 96</span>
            </Button>
            <Button size="sm" className="bg-gradient-accent hover:opacity-90">
              Teklif Al
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}