import { SEO } from "@/components/SEO";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Shield, FileText, Users, Database, Lock, AlertCircle, UserCheck, Calendar } from "lucide-react";

export default function KVKKAydinlatmaMetni() {
  return (
    <>
      <SEO 
        title="KVKK Aydınlatma Metni - REX Lojistik"
        description="REX Lojistik Kişisel Verilerin Korunması ve İşlenmesi Aydınlatma Metni. KVKK kapsamında haklarınız ve veri işleme süreçlerimiz."
      />
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4 py-12 md:py-20">
          {/* Hero Section */}
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-2xl mb-6 shadow-lg">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
              KVKK Aydınlatma Metni
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Kişisel Verilerin Korunması ve İşlenmesi Aydınlatma Metni
            </p>
            <div className="mt-6 text-sm text-gray-500">
              REX LOJİSTİK TAŞIMACILIK DEPOLAMA DANIŞMANLIK LİMİTED ŞİRKETİ
            </div>
          </div>

          <div className="max-w-5xl mx-auto">
            {/* 1. Veri Sorumlusu */}
            <section className="mb-10 bg-white rounded-2xl p-8 shadow-lg border border-blue-100">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-primary mb-2">1. Veri Sorumlusu</h2>
                  <p className="text-gray-600">
                    6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında, kişisel verileriniz 
                    <strong> REX LOJİSTİK TAŞIMACILIK DEPOLAMA DANIŞMANLIK LİMİTED ŞİRKETİ</strong> tarafından veri sorumlusu sıfatıyla işlenmektedir.
                  </p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-semibold text-primary mb-2">📍 Adres:</p>
                    <p className="text-gray-700">
                      Folkart Towers A Kule No:47/B K:26 D:2601<br />
                      Adalet Mahallesi Manas Bulvarı<br />
                      Bayraklı, 35530, İzmir
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-primary mb-2">📞 İletişim:</p>
                    <p className="text-gray-700">
                      Tel: +90 (232) 218-2483<br />
                      Mobil: +90 (543) 401-0755<br />
                      E-posta: info@rexlojistik.com
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. İşlenme Amaçları */}
            <section className="mb-10 bg-white rounded-2xl p-8 shadow-lg border border-blue-100">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-primary mb-4">2. Kişisel Verilerin Hangi Amaçlarla İşlendiği</h2>
                  
                  <div className="space-y-6">
                    <div className="border-l-4 border-accent pl-4">
                      <h3 className="font-semibold text-lg text-primary mb-2">2.1. Hizmet Sunumu ve Operasyon Yönetimi</h3>
                      <ul className="space-y-2 text-gray-600">
                        <li className="flex items-start gap-2">
                          <span className="text-accent mt-1">•</span>
                          <span>Teklif taleplerinin alınması</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-accent mt-1">•</span>
                          <span>Nakliye, depolama, parsiyel/komple taşıma, uluslararası lojistik süreçlerinin yürütülmesi</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-accent mt-1">•</span>
                          <span>Gönderi planlama, yükleme, teslimat ve operasyon takibi</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-accent mt-1">•</span>
                          <span>Müşteri ilişkileri yönetimi</span>
                        </li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-blue-400 pl-4">
                      <h3 className="font-semibold text-lg text-primary mb-2">2.2. İletişim ve Destek Süreçleri</h3>
                      <ul className="space-y-2 text-gray-600">
                        <li className="flex items-start gap-2">
                          <span className="text-blue-400 mt-1">•</span>
                          <span>Müşteri taleplerine dönüş yapılması</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-400 mt-1">•</span>
                          <span>Operasyon bilgilendirmeleri</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-400 mt-1">•</span>
                          <span>Fatura, sözleşme ve resmi evrak süreçleri</span>
                        </li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-green-400 pl-4">
                      <h3 className="font-semibold text-lg text-primary mb-2">2.3. Yasal Yükümlülükler</h3>
                      <ul className="space-y-2 text-gray-600">
                        <li className="flex items-start gap-2">
                          <span className="text-green-400 mt-1">•</span>
                          <span>Vergi, gümrük ve taşımacılık mevzuatına uyum</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-400 mt-1">•</span>
                          <span>Yetkili kurum ve kuruluşlara bilgi verilmesi</span>
                        </li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-purple-400 pl-4">
                      <h3 className="font-semibold text-lg text-primary mb-2">2.4. Web Sitesi ve Dijital Güvenlik</h3>
                      <ul className="space-y-2 text-gray-600">
                        <li className="flex items-start gap-2">
                          <span className="text-purple-400 mt-1">•</span>
                          <span>Trafik ölçümü ve kullanıcı deneyiminin iyileştirilmesi</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-400 mt-1">•</span>
                          <span>Güvenlik ve doğrulama işlemleri</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-400 mt-1">•</span>
                          <span>Çerez yönetimi</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. Veri Kategorileri */}
            <section className="mb-10 bg-white rounded-2xl p-8 shadow-lg border border-blue-100">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-primary mb-4">3. İşlenen Kişisel Veri Kategorileri</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <h3 className="font-semibold text-primary mb-2">Kimlik Bilgisi</h3>
                      <p className="text-sm text-gray-600">Ad, soyad, firma adı</p>
                    </div>
                    <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
                      <h3 className="font-semibold text-primary mb-2">İletişim Bilgisi</h3>
                      <p className="text-sm text-gray-600">Telefon, e-posta, adres</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                      <h3 className="font-semibold text-primary mb-2">Hizmet Bilgisi</h3>
                      <p className="text-sm text-gray-600">Yük detayları, ölçüler, ağırlık, teslimat bilgileri</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                      <h3 className="font-semibold text-primary mb-2">Finansal Bilgi</h3>
                      <p className="text-sm text-gray-600">Fatura bilgileri</p>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                      <h3 className="font-semibold text-primary mb-2">Teknik Veri</h3>
                      <p className="text-sm text-gray-600">IP adresi, çerez verileri, cihaz bilgileri</p>
                    </div>
                    <div className="bg-cyan-50 rounded-xl p-4 border border-cyan-200">
                      <h3 className="font-semibold text-primary mb-2">Müşteri İşlem Bilgisi</h3>
                      <p className="text-sm text-gray-600">Teklif talepleri, operasyon kayıtları</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. Toplama Yöntemleri */}
            <section className="mb-10 bg-white rounded-2xl p-8 shadow-lg border border-blue-100">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-primary mb-4">4. Kişisel Verilerin Toplanma Yöntemleri</h2>
                  <p className="text-gray-600 mb-4">Kişisel verileriniz aşağıdaki yollarla otomatik veya otomatik olmayan şekilde toplanmaktadır:</p>
                  <div className="grid md:grid-cols-2 gap-3">
                    {[
                      "Web sitesi formları",
                      "Telefon, e-posta ve WhatsApp iletişimi",
                      "Sözleşmeler ve resmi evraklar",
                      "Operasyon süreçleri",
                      "Çerezler ve dijital analiz araçları"
                    ].map((method, index) => (
                      <div key={index} className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
                        <div className="w-2 h-2 bg-accent rounded-full flex-shrink-0"></div>
                        <span className="text-gray-700">{method}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* 5. Aktarım */}
            <section className="mb-10 bg-white rounded-2xl p-8 shadow-lg border border-blue-100">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-primary mb-4">5. Kişisel Verilerin Aktarıldığı Taraflar</h2>
                  <p className="text-gray-600 mb-4">Kişisel verileriniz, KVKK'nın 8. ve 9. maddelerine uygun olarak aşağıdaki taraflarla paylaşılabilir:</p>
                  <div className="space-y-2">
                    {[
                      "Yurt içi ve yurt dışı lojistik iş ortakları",
                      "Depolama, dağıtım ve taşıma hizmet sağlayıcıları",
                      "Gümrük müşavirlikleri",
                      "Mali müşavirlik ve hukuk danışmanları",
                      "Bilgi teknolojileri altyapı sağlayıcıları",
                      "Yetkili kamu kurumları"
                    ].map((party, index) => (
                      <div key={index} className="flex items-start gap-3 text-gray-600">
                        <span className="text-accent mt-1">✓</span>
                        <span>{party}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* 6. Saklama Süresi */}
            <section className="mb-10 bg-white rounded-2xl p-8 shadow-lg border border-blue-100">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-primary mb-4">6. Kişisel Verilerin Saklanma Süresi</h2>
                  <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-6 border border-cyan-200">
                    <p className="text-gray-700 mb-3">Kişisel verileriniz:</p>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-500 mt-1">•</span>
                        <span>İlgili mevzuatta belirtilen süre boyunca</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-500 mt-1">•</span>
                        <span>Mevzuatta süre yoksa işleme amacının gerektirdiği süre boyunca</span>
                      </li>
                    </ul>
                    <p className="text-gray-700 mt-3">
                      saklanır. Süre sonunda veriler güvenli şekilde <strong>silinir</strong>, <strong>yok edilir</strong> veya <strong>anonim hale getirilir</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 7. Haklarınız */}
            <section className="mb-10 bg-white rounded-2xl p-8 shadow-lg border border-blue-100">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-primary mb-4">7. KVKK Kapsamındaki Haklarınız</h2>
                  <p className="text-gray-600 mb-4">KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      "Kişisel verilerinizin işlenip işlenmediğini öğrenme",
                      "İşlenmişse buna ilişkin bilgi talep etme",
                      "İşleme amacını öğrenme",
                      "Verilerin aktarıldığı üçüncü kişileri bilme",
                      "Verilerin düzeltilmesini veya silinmesini talep etme",
                      "İşlemenin sınırlandırılmasını isteme",
                      "İşlemeye itiraz etme",
                      "Zarara uğramanız hâlinde tazminat talep etme"
                    ].map((right, index) => (
                      <div key={index} className="flex items-start gap-3 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-3 border border-red-100">
                        <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-2"></div>
                        <span className="text-gray-700">{right}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl p-6">
                    <p className="font-semibold mb-2">📧 Başvuru İçin:</p>
                    <p className="text-blue-100">
                      Bu haklarınızı kullanmak için <strong className="text-white">info@rexlojistik.com</strong> adresine yazılı olarak başvurabilirsiniz.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 8. Değişiklikler */}
            <section className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-8 shadow-lg text-white">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3">8. Aydınlatma Metnindeki Değişiklikler</h2>
                  <p className="text-blue-100">
                    Bu metin, gerektiğinde güncellenebilir. Güncellemeler web sitemizde yayımlandığı tarihte yürürlüğe girer.
                  </p>
                </div>
              </div>
            </section>

            {/* İletişim Kutusu */}
            <div className="mt-10 bg-gradient-to-r from-accent to-orange-500 rounded-2xl p-8 shadow-lg text-white">
              <h3 className="text-2xl font-bold mb-4">📞 İletişim Bilgileri</h3>
              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <div>
                  <p className="font-semibold mb-2 text-orange-100">REX LOJİSTİK TAŞIMACILIK DEPOLAMA DANIŞMANLIK LİMİTED ŞİRKETİ</p>
                  <p className="text-orange-100">
                    Folkart Towers A Kule No:47/B K:26 D:2601<br />
                    Adalet Mahallesi Manas Bulvarı<br />
                    Bayraklı, 35530, İzmir
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-2 text-orange-100">İletişim:</p>
                  <p className="text-orange-100">
                    Tel: +90 (232) 218-2483<br />
                    Mobil: +90 (543) 401-0755<br />
                    E-posta: info@rexlojistik.com
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}