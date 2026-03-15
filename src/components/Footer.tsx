import Link from "next/link";
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import Image from "next/image";

export function Footer() {
  return (
    <footer id="iletisim" className="bg-navy text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <Link href="/" className="inline-block mb-4">
              <div className="bg-white rounded-full p-2 inline-block">
                <Image 
                  src="/rex-lojistik-logo-new.png" 
                  alt="REX Lojistik Logo" 
                  width={80} 
                  height={80}
                  className="h-16 w-auto"
                />
              </div>
            </Link>
            <p className="text-blue-200 text-sm mb-4">
              2002 yılından bu yana sektör tecrübesi ile 2022'de kurulan REX Lojistik, güvenilir ve profesyonel lojistik çözümleri sunuyor.
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
              <li><Link href="#" className="hover:text-accent transition-colors">Depolama Hizmetleri</Link></li>
              <li><Link href="#" className="hover:text-accent transition-colors">Paketleme ve Elleçleme</Link></li>
              <li><Link href="#" className="hover:text-accent transition-colors">Uluslararası Taşımacılık</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-heading font-semibold text-lg mb-4">Kurumsal</h3>
            <ul className="space-y-2 text-sm text-blue-200">
              <li><Link href="#hizmetler" className="hover:text-accent transition-colors">Hizmetlerimiz</Link></li>
              <li><Link href="#ozellikler" className="hover:text-accent transition-colors">Neden Biz?</Link></li>
              <li><Link href="#referanslar" className="hover:text-accent transition-colors">Referanslarımız</Link></li>
              <li><Link href="#teklif" className="hover:text-accent transition-colors">Teklif Al</Link></li>
              <li><Link href="#iletisim" className="hover:text-accent transition-colors">İletişim</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-heading font-semibold text-lg mb-4">İletişim</h3>
            <div className="space-y-4 text-sm text-blue-200">
              <div>
                <h4 className="font-semibold text-white mb-2">Merkez Ofis - İzmir</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Folkart Towers A Kule No:47/B K:26 D:2601<br />Adalet Mahallesi Manas Bulvarı<br />Bayraklı / İzmir, 35530</span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">Manisa Ofisi</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Muradiye Mahallesi 42 Sokak 3/C<br />Yunusemre, 45140<br />Manisa, Türkiye</span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">Telefon</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>+90 232 218 24 83</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>+90 543 401 07 55</span>
                  </li>
                </ul>
              </div>
            </div>
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