import Link from "next/link";
import { Mail, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-navy text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Logo ve Açıklama */}
          <div className="space-y-3">
            <img 
              src="/2.png" 
              alt="Rex Lojistik" 
              className="h-48 w-auto object-contain mb-4 -mt-4"
            />
            <p className="text-sm text-white max-w-sm leading-relaxed -mt-2">
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

          {/* İletişim */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">İletişim</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">Merkez Ofis - İzmir</h4>
                  <p className="text-sm text-white leading-relaxed">
                    Folkart Towers A Kule No:47/B K:26 D:2601<br />
                    Adalet Mahallesi Manas Bulvarı<br />
                    Bayraklı, 35530, İzmir
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                    <a href="tel:+902322290014" className="text-sm text-white hover:text-primary transition-colors">
                      +90 (232) 229 0014
                    </a>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">Manisa Ofisi</h4>
                  <p className="text-sm text-white leading-relaxed">
                    Rainbow Life Avm, Muradiye, Manolya Sokak No:228/1<br />
                    A Blok no:28<br />
                    45140 Yunusemre/Manisa
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                    <a href="tel:+902362300013" className="text-sm text-white hover:text-primary transition-colors">
                      +90 (236) 230 0013
                    </a>
                  </div>
                </div>
              </div>

              <div className="space-y-2 border-t border-white/10 pt-4">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                  <a href="tel:+905434010755" className="text-sm text-white hover:text-primary transition-colors">
                    +90 (543) 401 0755
                  </a>
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
    </footer>
  );
}