import { SEO } from "@/components/SEO";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function GizlilikPolitikasi() {
  return (
    <>
      <SEO
        title="Gizlilik Politikası | REX Lojistik"
        description="REX Lojistik Taşımacılık Depolama Danışmanlık Limited Şirketi gizlilik politikası ve kişisel verilerin korunması hakkında bilgiler."
      />
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-background to-muted/20 pt-24 pb-16">
        <div className="container max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Gizlilik Politikası
          </h1>
          <p className="text-center text-muted-foreground mb-12">
            REX LOJİSTİK TAŞIMACILIK DEPOLAMA DANIŞMANLIK LİMİTED ŞİRKETİ
          </p>

          <div className="bg-card rounded-2xl shadow-lg p-8 md:p-12 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                📌 1. Giriş
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Bu Gizlilik Politikası, REX LOJİSTİK TAŞIMACILIK DEPOLAMA DANIŞMANLIK LİMİTED ŞİRKETİ ("Şirket") tarafından işletilen www.rexlojistik.com web sitesi ve tüm dijital iletişim kanalları üzerinden elde edilen kişisel verilerin işlenmesine ilişkin esasları açıklamaktadır. Amacımız, ziyaretçilerimizin ve müşterilerimizin kişisel verilerini güvenli, şeffaf ve KVKK'ya uygun şekilde korumaktır.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                📌 2. Toplanan Kişisel Veriler
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Web sitemizi ziyaret ettiğinizde veya iletişim/teklif formlarını doldurduğunuzda aşağıdaki veri kategorileri işlenebilir:
              </p>
              
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">2.1. Kimlik Bilgileri</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Ad, soyad</li>
                    <li>Firma adı</li>
                  </ul>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">2.2. İletişim Bilgileri</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Telefon numarası</li>
                    <li>E-posta adresi</li>
                    <li>Adres bilgisi</li>
                  </ul>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">2.3. İşlem ve Hizmet Bilgileri</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Gönderi detayları</li>
                    <li>Yük ölçüleri ve ağırlıkları</li>
                    <li>Hizmet türü (kara, hava, deniz, parsiyel vb.)</li>
                    <li>Teklif talepleri</li>
                  </ul>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">2.4. Teknik Veriler</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>IP adresi</li>
                    <li>Çerez verileri</li>
                    <li>Tarayıcı ve cihaz bilgileri</li>
                    <li>Trafik ve kullanım verileri</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                📌 3. Kişisel Verilerin İşlenme Amaçları
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Toplanan kişisel veriler aşağıdaki amaçlarla işlenmektedir:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Hizmet taleplerinin alınması ve teklif oluşturulması</li>
                <li>Lojistik operasyonlarının planlanması ve yürütülmesi</li>
                <li>Müşteri ilişkileri yönetimi</li>
                <li>Yasal yükümlülüklerin yerine getirilmesi</li>
                <li>Web sitesi deneyiminin iyileştirilmesi</li>
                <li>Güvenlik ve doğrulama süreçleri</li>
                <li>Pazarlama ve bilgilendirme faaliyetleri (onay verilmişse)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                📌 4. Kişisel Verilerin Aktarılması
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Kişisel verileriniz, yalnızca aşağıdaki durumlarda üçüncü taraflarla paylaşılabilir:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Yurt içi ve yurt dışı lojistik iş ortakları</li>
                <li>Gümrük, taşıma ve depolama hizmet sağlayıcıları</li>
                <li>Yasal zorunluluklar kapsamında kamu kurumları</li>
                <li>Bilgi teknolojileri altyapı sağlayıcıları</li>
                <li>Yetkili danışmanlık firmaları</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Veri aktarımı her zaman KVKK'nın 8. ve 9. maddelerine uygun şekilde yapılır.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                📌 5. Veri Saklama Süreleri
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Kişisel verileriniz:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mt-3 mb-3">
                <li>İlgili mevzuatta belirtilen süreler boyunca,</li>
                <li>Mevzuatta süre belirtilmemişse işleme amacının gerektirdiği süre boyunca</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                saklanır. Süre sonunda veriler güvenli şekilde silinir, yok edilir veya anonim hale getirilir.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                📌 6. Çerez (Cookie) Kullanımı
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Web sitemizde kullanıcı deneyimini geliştirmek, trafik analizi yapmak ve hizmetlerimizi optimize etmek amacıyla çerezler kullanılmaktadır. Çerez tercihlerinizi tarayıcı ayarlarınızdan yönetebilirsiniz.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                📌 7. Veri Güvenliği
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                REX Lojistik olarak kişisel verilerinizi korumak için:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>SSL sertifikası</li>
                <li>Güvenlik duvarları</li>
                <li>Erişim kontrol sistemleri</li>
                <li>Düzenli güvenlik testleri</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                gibi teknik ve idari tedbirleri uygulamaktayız.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                📌 8. KVKK Kapsamındaki Haklarınız
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                <li>İşlenmişse buna ilişkin bilgi talep etme</li>
                <li>İşleme amacını öğrenme</li>
                <li>Verilerin aktarıldığı üçüncü kişileri bilme</li>
                <li>Verilerin düzeltilmesini veya silinmesini talep etme</li>
                <li>İşlemenin sınırlandırılmasını isteme</li>
                <li>İşlemeye itiraz etme</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Bu haklarınızı kullanmak için bize <a href="mailto:info@rexlojistik.com" className="text-primary hover:underline">info@rexlojistik.com</a> adresinden ulaşabilirsiniz.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                📌 9. Politika Değişiklikleri
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Bu Gizlilik Politikası, gerektiğinde güncellenebilir. Güncellemeler web sitemizde yayımlandığı tarihte yürürlüğe girer.
              </p>
            </section>

            <section className="bg-primary/5 rounded-lg p-6 border-l-4 border-primary">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                📌 10. İletişim
              </h2>
              <div className="space-y-2 text-muted-foreground">
                <p className="font-semibold text-foreground">REX LOJİSTİK TAŞIMACILIK DEPOLAMA DANIŞMANLIK LİMİTED ŞİRKETİ</p>
                <p>Folkart Towers A Kule No:47/B K:26 D:2601</p>
                <p>Adalet Mahallesi Manas Bulvarı, Bayraklı, 35530, İzmir</p>
                <p className="mt-3">
                  <strong>Telefon:</strong> <a href="tel:+902322182483" className="text-primary hover:underline">+90 (232) 218-2483</a>
                </p>
                <p>
                  <strong>Mobil:</strong> <a href="tel:+905434010755" className="text-primary hover:underline">+90 (543) 401-0755</a>
                </p>
                <p>
                  <strong>E-posta:</strong> <a href="mailto:info@rexlojistik.com" className="text-primary hover:underline">info@rexlojistik.com</a>
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}