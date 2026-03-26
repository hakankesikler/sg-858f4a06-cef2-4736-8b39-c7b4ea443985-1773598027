import { SEO } from "@/components/SEO";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FileText, Shield, AlertCircle, Scale, Globe, Lock, Edit, Phone } from "lucide-react";

export default function KullanimKosullari() {
  return (
    <>
      <SEO 
        title="Kullanım Koşulları | REX Lojistik"
        description="REX Lojistik web sitesi kullanım koşulları, hizmet şartları ve yasal uyarılar."
      />
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary via-blue-700 to-blue-900 text-white py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-6">
                <FileText className="w-10 h-10" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Kullanım Koşulları
              </h1>
              <p className="text-xl text-blue-100">
                REX LOJİSTİK TAŞIMACILIK DEPOLAMA DANIŞMANLIK LİMİTED ŞİRKETİ
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto space-y-12">

            {/* 1. Giriş */}
            <section className="bg-white rounded-2xl shadow-lg p-8 border-l-4 border-primary">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">1. Giriş</h2>
                </div>
              </div>
              <div className="prose prose-blue max-w-none text-gray-700 leading-relaxed">
                <p>
                  Bu web sitesini ("Site") ziyaret eden tüm kullanıcılar, aşağıda belirtilen kullanım koşullarını kabul etmiş sayılır. 
                  Site, <strong>REX LOJİSTİK TAŞIMACILIK DEPOLAMA DANIŞMANLIK LİMİTED ŞİRKETİ</strong> ("Şirket") tarafından yönetilmekte 
                  olup, bu koşullar üzerinde değişiklik yapma hakkı saklıdır.
                </p>
              </div>
            </section>

            {/* 2. Hizmet Tanımı */}
            <section className="bg-white rounded-2xl shadow-lg p-8 border-l-4 border-blue-500">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">2. Hizmet Tanımı</h2>
                </div>
              </div>
              <div className="space-y-4 text-gray-700">
                <p>
                  Site üzerinden sunulan bilgiler; lojistik, taşımacılık, depolama, parsiyel/komple taşıma, 
                  uluslararası nakliye ve benzeri hizmetlere ilişkin <strong>genel bilgilendirme amaçlıdır</strong>.
                </p>
                <p className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                  Site üzerinden yapılan hiçbir açıklama, Şirket ile kullanıcı arasında bağlayıcı bir teklif niteliği taşımaz.
                </p>
              </div>
            </section>

            {/* 3. Kullanım Şartları */}
            <section className="bg-white rounded-2xl shadow-lg p-8 border-l-4 border-accent">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-accent to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">3. Kullanım Şartları</h2>
                </div>
              </div>
              <div className="space-y-4 text-gray-700">
                <p className="font-semibold">Siteyi kullanırken aşağıdaki kurallara uyulması zorunludur:</p>
                <div className="grid gap-4">
                  <div className="flex gap-3 items-start bg-red-50 p-4 rounded-lg">
                    <span className="text-red-600 font-bold flex-shrink-0">✗</span>
                    <span>Yanıltıcı, yanlış veya eksik bilgi paylaşmamak</span>
                  </div>
                  <div className="flex gap-3 items-start bg-red-50 p-4 rounded-lg">
                    <span className="text-red-600 font-bold flex-shrink-0">✗</span>
                    <span>Siteye zarar verecek herhangi bir teknik girişimde bulunmamak</span>
                  </div>
                  <div className="flex gap-3 items-start bg-red-50 p-4 rounded-lg">
                    <span className="text-red-600 font-bold flex-shrink-0">✗</span>
                    <span>Site içeriğini hukuka aykırı amaçlarla kullanmamak</span>
                  </div>
                  <div className="flex gap-3 items-start bg-red-50 p-4 rounded-lg">
                    <span className="text-red-600 font-bold flex-shrink-0">✗</span>
                    <span>Başkalarının kişisel verilerini izinsiz paylaşmamak</span>
                  </div>
                  <div className="flex gap-3 items-start bg-red-50 p-4 rounded-lg">
                    <span className="text-red-600 font-bold flex-shrink-0">✗</span>
                    <span>Otomatik veri toplama araçları (bot, crawler vb.) kullanmamak</span>
                  </div>
                </div>
                <p className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg mt-4">
                  <strong>Uyarı:</strong> Şirket, bu kurallara aykırı davranan kullanıcıların erişimini engelleme hakkına sahiptir.
                </p>
              </div>
            </section>

            {/* 4. Fikri Mülkiyet Hakları */}
            <section className="bg-white rounded-2xl shadow-lg p-8 border-l-4 border-purple-500">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">4. Fikri Mülkiyet Hakları</h2>
                </div>
              </div>
              <div className="space-y-4 text-gray-700">
                <p>
                  Sitede yer alan tüm içerikler (metin, görsel, logo, tasarım, marka, yazılım vb.) <strong>REX Lojistik'e aittir</strong> veya lisanslıdır.
                </p>
                <div className="bg-purple-50 rounded-xl p-6 space-y-3">
                  <p className="font-semibold text-purple-900">Bu içerikler:</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      <span>İzinsiz kopyalanamaz</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      <span>Çoğaltılamaz</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      <span>Yayınlanamaz</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      <span>Ticari amaçla kullanılamaz</span>
                    </div>
                  </div>
                </div>
                <p className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                  <strong>Önemli:</strong> Aksi durumlar hukuki ve cezai sorumluluk doğurur.
                </p>
              </div>
            </section>

            {/* 5. Kullanıcı Tarafından Paylaşılan Bilgiler */}
            <section className="bg-white rounded-2xl shadow-lg p-8 border-l-4 border-green-500">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Edit className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">5. Kullanıcı Tarafından Paylaşılan Bilgiler</h2>
                </div>
              </div>
              <div className="space-y-4 text-gray-700">
                <p>
                  Site üzerindeki iletişim ve teklif formlarına girilen bilgiler, <strong>kullanıcının kendi sorumluluğundadır</strong>.
                </p>
                <div className="bg-green-50 rounded-lg p-4 space-y-2">
                  <p>✓ Kullanıcı, paylaştığı bilgilerin doğru ve güncel olduğunu kabul eder.</p>
                </div>
                <p>
                  Yanlış bilgi paylaşımından doğabilecek gecikme, yanlış yönlendirme veya hizmet aksaklıklarından Şirket sorumlu tutulamaz.
                </p>
              </div>
            </section>

            {/* 6. Üçüncü Taraf Bağlantıları */}
            <section className="bg-white rounded-2xl shadow-lg p-8 border-l-4 border-indigo-500">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">6. Üçüncü Taraf Bağlantıları</h2>
                </div>
              </div>
              <div className="space-y-4 text-gray-700">
                <p>
                  Sitede üçüncü taraf web sitelerine yönlendiren bağlantılar bulunabilir.
                </p>
                <p className="bg-indigo-50 border-l-4 border-indigo-400 p-4 rounded-r-lg">
                  Bu sitelerin içeriklerinden veya güvenlik uygulamalarından <strong>Şirket sorumlu değildir</strong>.
                </p>
              </div>
            </section>

            {/* 7. Sorumluluğun Sınırlandırılması */}
            <section className="bg-white rounded-2xl shadow-lg p-8 border-l-4 border-red-500">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">7. Sorumluluğun Sınırlandırılması</h2>
                </div>
              </div>
              <div className="space-y-4 text-gray-700">
                <p className="font-semibold">Şirket:</p>
                <div className="space-y-3">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p>• Sitede yer alan bilgilerin doğruluğunu garanti etmez</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p>• Siteye erişimin kesintisiz olacağını taahhüt etmez</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p>• Teknik arızalar, bakım çalışmaları veya üçüncü taraf kaynaklı sorunlardan sorumlu tutulamaz</p>
                  </div>
                </div>
                <p className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg mt-4">
                  <strong>Kullanıcı, siteyi kendi sorumluluğunda kullanır.</strong>
                </p>
              </div>
            </section>

            {/* 8. Kişisel Verilerin Korunması */}
            <section className="bg-white rounded-2xl shadow-lg p-8 border-l-4 border-blue-600">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">8. Kişisel Verilerin Korunması</h2>
                </div>
              </div>
              <div className="space-y-4 text-gray-700">
                <p>
                  Kişisel verilerin işlenmesine ilişkin tüm detaylar <strong>KVKK Aydınlatma Metni</strong> ve <strong>Gizlilik Politikası</strong>'nda açıklanmıştır.
                </p>
                <p className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                  Siteyi kullanan herkes bu metinleri okuduğunu ve kabul ettiğini beyan eder.
                </p>
              </div>
            </section>

            {/* 9. Değişiklik Hakkı */}
            <section className="bg-white rounded-2xl shadow-lg p-8 border-l-4 border-orange-500">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Edit className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">9. Değişiklik Hakkı</h2>
                </div>
              </div>
              <div className="space-y-4 text-gray-700">
                <p>
                  Şirket, kullanım koşullarını <strong>dilediği zaman güncelleme hakkını</strong> saklı tutar.
                </p>
                <p className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg">
                  Güncellenen koşullar, sitede yayımlandığı andan itibaren geçerlidir.
                </p>
              </div>
            </section>

            {/* 10. Uygulanacak Hukuk ve Yetki */}
            <section className="bg-white rounded-2xl shadow-lg p-8 border-l-4 border-gray-700">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Scale className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">10. Uygulanacak Hukuk ve Yetki</h2>
                </div>
              </div>
              <div className="space-y-4 text-gray-700">
                <div className="bg-gray-50 p-6 rounded-xl space-y-3">
                  <p className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-gray-700 rounded-full"></span>
                    <span>Bu kullanım koşulları <strong>Türkiye Cumhuriyeti kanunlarına</strong> tabidir.</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-gray-700 rounded-full"></span>
                    <span>Taraflar arasında doğabilecek uyuşmazlıklarda <strong>İzmir Mahkemeleri ve İcra Daireleri</strong> yetkilidir.</span>
                  </p>
                </div>
              </div>
            </section>

            {/* 11. İletişim */}
            <section className="bg-gradient-to-br from-primary via-blue-700 to-blue-900 text-white rounded-2xl shadow-2xl p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">11. İletişim</h2>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-xl font-semibold">REX LOJİSTİK TAŞIMACILIK DEPOLAMA DANIŞMANLIK LİMİTED ŞİRKETİ</p>
                <div className="space-y-2 text-blue-100">
                  <p>📍 Folkart Towers A Kule No:47/B K:26 D:2601</p>
                  <p className="ml-6">Adalet Mahallesi Manas Bulvarı, Bayraklı, 35530, İzmir</p>
                  <p>📞 +90 (232) 218-2483</p>
                  <p>📱 +90 (543) 401-0755</p>
                  <p>✉️ info@rexlojistik.com</p>
                </div>
              </div>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}