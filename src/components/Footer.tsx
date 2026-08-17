import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[#1a1f2e] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
          {/* Logo ve Açıklama */}
          <div>
            <div className="h-[28px] flex items-center mb-16 pt-6">
              <img src="/rex-logo-new.png" alt="Rex Lojistik" className="w-full max-w-[270px] h-auto" />
            </div>
            <p className="text-sm text-white">
              2002 yılından bu yana sektör tecrübesi ile 2022&apos;de kurulan REX Lojistik, güvenilir ve profesyonel lojistik çözümleri sunuyor.
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
              <li>
                <Link href="/" className="hover:text-white/80 transition-colors">
                  Hakkımızda
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-white/80 transition-colors">
                  Hizmetlerimiz
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white/80 transition-colors">
                  Rex Portal
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-white/80 transition-colors">
                  İletişim
                </Link>
              </li>
            </ul>
          </div>

          {/* Merkez Ofis - İzmir */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Merkez Ofis - İzmir</h3>
            <div className="space-y-2 text-sm">
              <p>Folkart Towers A Kule No:47/B<br />K:26 D:2601</p>
              <p>Adalet Mahallesi, Manas Bulvarı<br />Bayraklı, 35630, İzmir</p>
              <p className="pt-2">+90 (232) 229 0014</p>
              <p>+90 (543) 401 0755</p>
            </div>
          </div>

          {/* Manisa Ofis */}
          <div>
            <h3 className="font-semibold text-white mb-4">Manisa Ofis</h3>
            <div className="space-y-2 text-sm">
              <p className="text-white">Rainbow Life AVM</p>
              <p className="text-white">Muradiye Mahallesi, Manolya Sokak No: 228/1</p>
              <p className="text-white">A Blok No: 28 Yunusemre, 45140, Manisa</p>
              <p className="text-white pt-2">+90 (236) 230 00 13</p>
              <p className="text-white">+90 (543) 401 0755</p>
            </div>
          </div>
        </div>

        {/* Alt Bölüm */}
        <div className="border-t border-white/10 mt-8 pt-8 text-sm text-center">
          <p className="mb-2">&copy; 2026 Rex Lojistik. Tüm hakları saklıdır.</p>
          <p className="mb-3">
            <a href="mailto:info@rexlojistik.com" className="text-white hover:text-white/80 transition-colors">
              info@rexlojistik.com
            </a>
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/gizlilik-politikasi" className="text-white/80 hover:text-white transition-colors">
              Gizlilik Politikası
            </Link>
            <Link href="/kullanim-kosullari" className="text-white/80 hover:text-white transition-colors">
              Kullanım Koşulları
            </Link>
            <Link href="/kvkk-aydinlatma-metni" className="text-white/80 hover:text-white transition-colors">
              KVKK
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}