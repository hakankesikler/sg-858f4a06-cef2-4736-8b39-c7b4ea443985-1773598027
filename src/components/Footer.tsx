import Link from "next/link";
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-navy text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <Link href="/" className="inline-block mb-4">
              <div className="bg-white rounded-full p-2 inline-block">
                <Image 
                  src="/rex-logo-original.png" 
                  alt="REX Lojistik Logo" 
                  width={80} 
                  height={80}
                  className="h-16 w-auto"
                />
              </div>
            </Link>
            <p className="text-blue-200 text-sm mb-4">
              2003 yılından bu yana güvenilir, hızlı ve profesyonel uluslararası lojistik çözümleri.
            </p>
            <div className="flex gap-3">
              <a href="#" className="bg-white/10 hover:bg-accent p-2 rounded-lg transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="bg-white/10 hover:bg-accent p-2 rounded-lg transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="bg-white/10 hover:bg-accent p-2 rounded-lg transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="bg-white/10 hover:bg-accent p-2 rounded-lg transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-heading font-semibold text-lg mb-4">Hizmetlerimiz</h3>
            <ul className="space-y-2 text-sm text-blue-200">
              <li><Link href="#" className="hover:text-accent transition-colors">Hava Yolu Taşımacılığı</Link></li>
              <li><Link href="#" className="hover:text-accent transition-colors">Deniz Yolu Taşımacılığı</Link></li>
              <li><Link href="#" className="hover:text-accent transition-colors">Kara Yolu Taşımacılığı</Link></li>
              <li><Link href="#" className="hover:text-accent transition-colors">Gümrükleme Hizmetleri</Link></li>
              <li><Link href="#" className="hover:text-accent transition-colors">Depolama ve Antrepo</Link></li>
              <li><Link href="#" className="hover:text-accent transition-colors">Sigorta Hizmetleri</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-heading font-semibold text-lg mb-4">Kurumsal</h3>
            <ul className="space-y-2 text-sm text-blue-200">
              <li><Link href="#hakkimizda" className="hover:text-accent transition-colors">Hakkımızda</Link></li>
              <li><Link href="#" className="hover:text-accent transition-colors">Kalite Politikamız</Link></li>
              <li><Link href="#" className="hover:text-accent transition-colors">Vizyonumuz</Link></li>
              <li><Link href="#referanslar" className="hover:text-accent transition-colors">Referanslarımız</Link></li>
              <li><Link href="#iletisim" className="hover:text-accent transition-colors">İletişim</Link></li>
              <li><Link href="#" className="hover:text-accent transition-colors">Kariyer</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-heading font-semibold text-lg mb-4">İletişim</h3>
            <ul className="space-y-3 text-sm text-blue-200">
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>+90 216 504 23 96</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>info@rexlojistik.com</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Küçükbakkalköy Mah. Kayışdağı Cad.<br />No: 110/5 Ataşehir / İstanbul</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-blue-200">
          <p>© 2026 REX Lojistik. Tüm hakları saklıdır.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-accent transition-colors">Gizlilik Politikası</Link>
            <Link href="#" className="hover:text-accent transition-colors">Kullanım Koşulları</Link>
            <Link href="#" className="hover:text-accent transition-colors">KVKK</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}