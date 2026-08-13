import Link from "next/link";
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import Image from "next/image";

export function Footer() {
  return (
    <footer id="iletisim" className="bg-navy text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div className="space-y-4">
            <img 
              src="/2.png" 
              alt="Rex Lojistik" 
              className="h-44 w-auto object-contain"
            />
            <p className="text-sm text-gray-400 max-w-sm">
              2002 yılından bu yana sektör tecrübesi ile 2022'de kurulan REX Lojistik, güvenilir ve profesyonel lojistik çözümleri sunuyor.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Hizmetlerimiz</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-gray-400 hover:text-primary transition-colors">Kara Yolu Taşımacılığı</a></li>
              <li><a href="#" className="text-sm text-gray-400 hover:text-primary transition-colors">Depolama Hizmetleri</a></li>
              <li><a href="#" className="text-sm text-gray-400 hover:text-primary transition-colors">Dağıtım Lojistiği</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Şubelerimiz</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-white mb-2">Merkez Ofis</h4>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Şenyurt, 3080. Sk. No:16,<br />
                  45400 Turgutlu/Manisa
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white mb-2">Manisa Şubesi</h4>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Rainbow Life Avm, Muradiye,<br />
                  Manolya Sokak No:228/1<br />
                  A Blok no:28,<br />
                  45140 Yunusemre/Manisa
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">İletişim</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                <span>+90 236 314 03 70</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                <a href="mailto:info@rexlojistik.com" className="hover:text-primary transition-colors">
                  info@rexlojistik.com
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                <span>Turgutlu / Manisa</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mb-12">
          <div className="max-w-xs">
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Kurumsal</h3>
            <ul className="space-y-2">
              <li>
                <a href="#hakkimizda" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Hakkımızda
                </a>
              </li>
              <li>
                <a href="#hizmetler" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Hizmetlerimiz
                </a>
              </li>
              <li>
                <Link href="/rexgen" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Rex Portal
                </Link>
              </li>
              <li>
                <a href="#iletisim" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  İletişim
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
          <p>© 2026 REX Lojistik. Tüm hakları saklıdır.</p>
          <div className="flex gap-6">
            <Link href="/gizlilik-politikasi" className="hover:text-primary transition-colors">Gizlilik Politikası</Link>
            <Link href="/kullanim-kosullari" className="hover:text-primary transition-colors">Kullanım Koşulları</Link>
            <Link href="/kvkk-aydinlatma-metni" className="hover:text-primary transition-colors">KVKK</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}