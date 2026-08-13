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
                  <h4 className="text-sm font-semibold text-white mb-2">Merkez Ofis - İzmir</h4>
                  <p className="text-sm text-white leading-relaxed mb-2">
                    Folkart Towers Adalet Mah.<br />
                    Manas Bulvarı No:39 Kat:33 D:3305<br />
                    Bayraklı / İzmir
                  </p>
                  <div className="flex items-start gap-2">
                    <Phone className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <a href="tel:+902322290014" className="text-sm text-white hover:text-primary transition-colors">
                      +90 (232) 229 0014
                    </a>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">Manisa Ofisi</h4>
                  <p className="text-sm text-white leading-relaxed mb-2">
                    Rainbow Life Avm, Muradiye,<br />
                    Manolya Sokak No:228/1<br />
                    A Blok no:28,<br />
                    45140 Yunusemre/Manisa
                  </p>
                  <div className="flex items-start gap-2">
                    <Phone className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <a href="tel:+902362300013" className="text-sm text-white hover:text-primary transition-colors">
                      +90 (236) 230 0013
                    </a>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Phone className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <a href="tel:+905434010755" className="text-sm text-white hover:text-primary transition-colors">
                      +90 (543) 401 0755
                    </a>
                  </div>
                  <div className="flex items-start gap-2">
                    <Mail className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
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