import Link from "next/link";
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import Image from "next/image";

export function Footer() {
  return (
    <footer id="iletisim" className="bg-navy text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div className="space-y-4">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-white rounded-full scale-90"></div>
              <img 
                src="/rex-lojistik-logo-new.png" 
                alt="Rex Lojistik" 
                className="h-44 w-44 object-contain relative z-10"
              />
            </div>
            <p className="text-gray-400 max-w-xs">
              2002 yılından bu yana sektör tecrübesi ile 2022'de kurulan REX Lojistik, güvenilir ve profesyonel lojistik çözümleri sunuyor.
            </p>
          </div>

          <div>
            <h3 className="font-heading font-semibold text-lg mb-4">Hizmetlerimiz</h3>
            <ul className="space-y-2 text-sm text-blue-200">
              <li><Link href="#" className="hover:text-accent transition-colors">Hava Yolu Taşımacılığı</Link></li>
              <li><Link href="#" className="hover:text-accent transition-colors">Deniz Yolu Taşımacılığı</Link></li>
              <li><Link href="#" className="hover:text-accent transition-colors">Kara Yolu Taşımacılığı</Link></li>
              <li><Link href="#" className="hover:text-accent transition-colors">Depolama Hizmetleri</Link></li>
              <li><Link href="#" className="hover:text-accent transition-colors">Paketleme ve Elleçleme</Link></li>
              <li><Link href="#" className="hover:text-accent transition-colors">Uluslararası Taşımacılık</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Kurumsal</h3>
            <ul className="space-y-3">
              <li>
                <a href="#hakkimizda" className="text-gray-300 hover:text-orange-400 transition-colors">
                  Hakkımızda
                </a>
              </li>
              <li>
                <a href="#hizmetler" className="text-gray-300 hover:text-orange-400 transition-colors">
                  Hizmetlerimiz
                </a>
              </li>
              <li>
                <Link href="/personel-giris" className="text-gray-300 hover:text-orange-400 transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Personel Girişi
                </Link>
              </li>
              <li>
                <a href="#iletisim" className="text-gray-300 hover:text-orange-400 transition-colors">
                  İletişim
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-heading font-semibold text-lg mb-4">İletişim</h3>
            <ul className="space-y-3 text-sm text-blue-200">
              <li className="flex items-start space-x-2">
                <MapPin className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-white mb-1">Merkez Ofis - İzmir</p>
                  <p>Folkart Towers A Kule No:47/B K:26 D:2601<br />
                  Adalet Mahallesi Manas Bulvarı<br />
                  Bayraklı / İzmir, 35530</p>
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-white mb-1">Manisa Ofisi</p>
                  <p>Muradiye Mahallesi 42 Sokak 3/C<br />
                  Yunusemre, 45140<br />
                  Manisa, Türkiye</p>
                </div>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-5 w-5 text-accent flex-shrink-0" />
                <div>
                  <a href="tel:+902322182483" className="hover:text-accent transition-colors block">
                    +90 232 218 24 83
                  </a>
                  <a href="tel:+905434010755" className="hover:text-accent transition-colors block">
                    +90 543 401 07 55
                  </a>
                </div>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-accent flex-shrink-0" />
                <a href="mailto:info@rexlojistik.com" className="hover:text-accent transition-colors">
                  info@rexlojistik.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-blue-200">
          <p>© 2026 REX Lojistik. Tüm hakları saklıdır.</p>
          <div className="flex gap-6">
            <Link href="/gizlilik-politikasi" className="hover:text-accent transition-colors">Gizlilik Politikası</Link>
            <Link href="/kullanim-kosullari" className="hover:text-accent transition-colors">Kullanım Koşulları</Link>
            <Link href="/kvkk-aydinlatma-metni" className="hover:text-accent transition-colors">KVKK</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}