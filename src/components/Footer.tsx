import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[#1a1f2e] text-white">
      <div className="max-w-7xl mx-auto px-4 pt-14 sm:px-6 sm:pt-16 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
          {/* Logo ve Açıklama */}
          <div>
            <div className="h-[28px] flex items-center mb-16 pt-6">
              <img src="/rexlogo.png" alt="Rex Lojistik" className="w-full max-w-[270px] h-auto" />
            </div>
            <p className="text-sm text-white">
              2002 yılından bu yana sektör tecrübesi ile 2022&apos;de kurulan REX Lojistik, güvenilir ve profesyonel lojistik çözümleri sunuyor.
            </p>
          </div>

          {/* Hizmetlerimiz */}
          <div>
            <h3 className="text-lg font-semibold mb-4">HİZMETLERİMİZ</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/yurtici-parsiyel-tasimacilik" className="hover:text-orange-300 transition-colors">Yurtiçi Parsiyel</Link></li>
              <li><Link href="/komple-tasimacilik" className="hover:text-orange-300 transition-colors">Komple Taşımacılık</Link></li>
              <li><Link href="/uluslararasi-karayolu-tasimaciligi" className="hover:text-orange-300 transition-colors">Uluslararası Karayolu</Link></li>
              <li><Link href="/hava-kargo" className="hover:text-orange-300 transition-colors">Hava Kargo</Link></li>
              <li><Link href="/denizyolu-tasimaciligi" className="hover:text-orange-300 transition-colors">Denizyolu Taşımacılığı</Link></li>
              <li><Link href="/express-kargo" className="hover:text-orange-300 transition-colors">Express Kargo</Link></li>
              <li><Link href="/depolama" className="hover:text-orange-300 transition-colors">Depolama Hizmetleri</Link></li>
            </ul>
          </div>

          {/* Kurumsal */}
          <div>
            <h3 className="text-lg font-semibold mb-4">KURUMSAL</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/hakkimizda" className="hover:text-white/80 transition-colors">
                  Hakkımızda
                </Link>
              </li>
              <li>
                <Link href="/#hizmetler" className="hover:text-white/80 transition-colors">
                  Hizmetlerimiz
                </Link>
              </li>
              <li>
                <Link href="/musteri-giris" className="hover:text-white/80 transition-colors">
                  Müşteri Portalı
                </Link>
              </li>
              <li>
                <Link href="/iletisim" className="hover:text-white/80 transition-colors">
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
