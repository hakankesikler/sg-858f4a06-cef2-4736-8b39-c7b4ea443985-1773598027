import Link from "next/link";
import { Mail, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-navy text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12 items-start">
          {/* Logo ve Açıklama */}
          <div className="flex flex-col">
            <img 
              src="/2.png" 
              alt="Rex Lojistik" 
              className="h-48 w-auto object-contain -mt-6"
            />
            <p className="text-sm text-white max-w-sm leading-relaxed -mt-10">
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
          <div>
            <h3 className="text-lg font-semibold mb-4">İletişim</h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium">Merkez Ofis - İzmir</p>
                <p>Folkart Towers A Kule No:47/B<br />K:26 D:2601</p>
                <p>Adalet Mahallesi, Manas Bulvarı<br />Bayraklı, 35630, İzmir</p>
                <p className="pt-2">+90 (232) 229 0014</p>
                <p>+90 (543) 401 0765</p>
              </div>
              
              <div className="pt-2">
                <p className="font-medium">Manisa Ofis</p>
                <p>Rainbow Life AVM</p>
                <p>Muradiye Mahallesi, Manolya Sokak No: 228/1</p>
                <p>A Blok No: 28 Yunusemre, 45140, Manisa</p>
                <p className="pt-2">+90 (236) 230 00 13</p>
              </div>
              
              <a href="mailto:info@rexlojistik.com" className="text-white hover:text-white/80 transition-colors block pt-2">
                info@rexlojistik.com
              </a>
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