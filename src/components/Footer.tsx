import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-navy text-white py-16">
      <div className="container mx-auto px-4">
        <div className="space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            <div className="space-y-4">
              <img 
                src="/2.png" 
                alt="Rex Lojistik" 
                className="h-44 w-auto object-contain"
              />
              <p className="text-sm text-white max-w-sm leading-relaxed">
                2002 yılından bu yana sektör tecrübesi ile 2022'de kurulan REX Lojistik, güvenilir ve profesyonel lojistik çözümleri sunuyor.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Hizmetlerimiz</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-white hover:text-primary transition-colors">Hava Yolu Taşımacılığı</a></li>
                <li><a href="#" className="text-sm text-white hover:text-primary transition-colors">Deniz Yolu Taşımacılığı</a></li>
                <li><a href="#" className="text-sm text-white hover:text-primary transition-colors">Kara Yolu Taşımacılığı</a></li>
                <li><a href="#" className="text-sm text-white hover:text-primary transition-colors">Depolama Hizmetleri</a></li>
                <li><a href="#" className="text-sm text-white hover:text-primary transition-colors">Paketleme ve Elleçleme</a></li>
                <li><a href="#" className="text-sm text-white hover:text-primary transition-colors">Uluslararası Taşımacılık</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Kurumsal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-white hover:text-primary transition-colors">Hakkımızda</a></li>
                <li><a href="#" className="text-sm text-white hover:text-primary transition-colors">Hizmetlerimiz</a></li>
                <li><a href="#" className="text-sm text-white hover:text-primary transition-colors">Rex Portal</a></li>
                <li><a href="#" className="text-sm text-white hover:text-primary transition-colors">İletişim</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">İletişim</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-start gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <h4 className="text-sm font-semibold text-white">Merkez Ofis - İzmir</h4>
                  </div>
                  <p className="text-sm text-white leading-relaxed ml-6">
                    Folkart Towers A Kule No:17/B K:26 D:2601<br />
                    Adalet Mahallesi Manas Bulvarı<br />
                    Bayraklı / İzmir, 35630
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">Manisa Ofisi</h4>
                  <p className="text-sm text-white leading-relaxed">
                    Rainbow Life Avm, Muradiye,<br />
                    Manolya Sokak No:228/1<br />
                    A Blok no:28,<br />
                    45140 Yunusemre/Manisa
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm text-white">+90 232 218 24 83</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm text-white">+90 543 401 07 55</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                    <a href="mailto:info@rexlojistik.com" className="text-sm text-white hover:text-primary transition-colors">
                      info@rexlojistik.com
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-white">
                © 2026 REX Lojistik. Tüm hakları saklıdır.
              </p>
              <div className="flex gap-6">
                <Link href="/gizlilik-politikasi" className="text-sm text-white hover:text-primary transition-colors">Gizlilik Politikası</Link>
                <Link href="/kullanim-kosullari" className="text-sm text-white hover:text-primary transition-colors">Kullanım Koşulları</Link>
                <Link href="/kvkk-aydinlatma-metni" className="text-sm text-white hover:text-primary transition-colors">KVKK</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}