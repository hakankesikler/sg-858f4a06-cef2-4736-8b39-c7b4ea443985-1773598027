import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-navy text-white py-12">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          <div className="space-y-4">
            <img 
              src="/2.png" 
              alt="Rex Lojistik" 
              className="h-44 w-auto object-contain"
            />
            <p className="text-white max-w-sm">
              2002 yılından bu yana sektör tecrübesi ile 2022'de kurulan REX Lojistik, güvenilir ve profesyonel lojistik çözümleri sunuyor.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-white mb-4 uppercase tracking-wider">Hizmetlerimiz</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-white hover:text-primary transition-colors">Kara Yolu Taşımacılığı</a></li>
              <li><a href="#" className="text-white hover:text-primary transition-colors">Depolama Hizmetleri</a></li>
              <li><a href="#" className="text-white hover:text-primary transition-colors">Dağıtım Lojistiği</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-white mb-4 uppercase tracking-wider">Şubelerimiz</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-white mb-2">Merkez Ofis</h4>
                <p className="text-white leading-relaxed">
                  Şenyurt, 3080. Sk. No:16,<br />
                  45400 Turgutlu/Manisa
                </p>
              </div>
              <div>
                <h4 className="font-bold text-white mb-2">Manisa Şubesi</h4>
                <p className="text-white leading-relaxed">
                  Rainbow Life Avm, Muradiye,<br />
                  Manolya Sokak No:228/1<br />
                  A Blok no:28,<br />
                  45140 Yunusemre/Manisa
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-white mb-4 uppercase tracking-wider">İletişim</h3>
            <ul className="space-y-3">
              <li className="text-white">+90 236 314 03 70</li>
              <li>
                <a href="mailto:info@rexlojistik.com" className="text-white hover:text-primary transition-colors">
                  info@rexlojistik.com
                </a>
              </li>
              <li className="text-white">Turgutlu / Manisa</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-white mb-4 uppercase tracking-wider">Kurumsal</h3>
            <ul className="space-y-2">
              <li><Link href="/#" className="text-white hover:text-primary transition-colors">Hakkımızda</Link></li>
              <li><Link href="/#" className="text-white hover:text-primary transition-colors">Hizmetlerimiz</Link></li>
              <li><Link href="/login" className="text-white hover:text-primary transition-colors">Rex Portal</Link></li>
              <li><Link href="/#" className="text-white hover:text-primary transition-colors">İletişim</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white text-sm">
              © 2026 REX Lojistik. Tüm hakları saklıdır.
            </p>
            <div className="flex gap-6 text-sm">
              <Link href="/gizlilik-politikasi" className="text-white hover:text-primary transition-colors">Gizlilik Politikası</Link>
              <Link href="/kullanim-kosullari" className="text-white hover:text-primary transition-colors">Kullanım Koşulları</Link>
              <Link href="/kvkk-aydinlatma-metni" className="text-white hover:text-primary transition-colors">KVKK</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}