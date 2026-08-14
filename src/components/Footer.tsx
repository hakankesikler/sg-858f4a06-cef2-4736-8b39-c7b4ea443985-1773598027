import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[#1a1f2e] text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
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

          {/* Hizmetlerimiz */}
          <div>
            <h3 className="text-lg font-semibold mb-4">HİZMETLERİMİZ</h3>
            <ul className="space-y-2 text-sm">
              <li>Hava Yolu Taşımacılığı</li>
              <li>Deniz Yolu Taşımacılığı</li>
              <li>Kara Yolu Taşımacılığı</li>
              <li>Depolama Hizmetleri</li>
              <li>Paketleme ve Elleçleme</li>
              <li>Uluslararası Taşımacılık</li>
            </ul>
          </div>

          {/* Kurumsal */}
          <div>
            <h3 className="text-lg font-semibold mb-4">KURUMSAL</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/hakkimizda" className="hover:text-white/80 transition-colors">Hakkımızda</Link></li>
              <li><Link href="/hizmetlerimiz" className="hover:text-white/80 transition-colors">Hizmetlerimiz</Link></li>
              <li><Link href="/rex-portal" className="hover:text-white/80 transition-colors">Rex Portal</Link></li>
              <li><Link href="/iletisim" className="hover:text-white/80 transition-colors">İletişim</Link></li>
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

        {/* Alt Bölüm */}
        <div className="border-t border-white/10 pt-8 text-center text-sm text-white/60">
          <p className="mb-2">© 2026 REX Lojistik. Tüm hakları saklıdır.</p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/gizlilik-politikasi" className="hover:text-white transition-colors">
              Gizlilik Politikası
            </Link>
            <Link href="/kullanim-kosullari" className="hover:text-white transition-colors">
              Kullanım Koşulları
            </Link>
            <Link href="/kvkk-aydinlatma-metni" className="hover:text-white transition-colors">
              KVKK
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}