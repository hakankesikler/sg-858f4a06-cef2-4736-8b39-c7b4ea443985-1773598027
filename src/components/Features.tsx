import { CheckCircle2, Clock, MapPin, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Clock,
    title: "Zamanında Teslimat",
    description: "Tüm gönderileriniz belirlenen sürede, eksiksiz teslim edilir.",
  },
  {
    icon: MapPin,
    title: "Anlık Takip Sistemi",
    description: "Kargolarınızın konumunu 7/24 online olarak takip edebilirsiniz.",
  },
  {
    icon: CheckCircle2,
    title: "Kalite Garantisi",
    description: "ISO sertifikalı süreçler ve profesyonel ekip ile hatasız hizmet.",
  },
  {
    icon: BarChart3,
    title: "Detaylı Raporlama",
    description: "Lojistik operasyonlarınızı detaylı raporlar ile analiz edin.",
  },
];

export function Features() {
  return (
    <section id="cozumler" className="py-20">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-heading font-bold text-4xl text-navy mb-6">
              Neden LogisticPro?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Teknoloji ve deneyimin birleştiği noktada, lojistik operasyonlarınızı optimize ediyoruz.
            </p>

            <div className="space-y-6">
              {features.map((feature, index) => (
                <div key={index} className="flex gap-4">
                  <div className="bg-blue-light p-3 rounded-lg h-fit">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg text-navy mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="bg-gradient-hero rounded-2xl p-8 text-white">
              <h3 className="font-heading font-bold text-2xl mb-6">Hemen Başlayın</h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold">1</div>
                  <span>Ücretsiz teklif alın</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold">2</div>
                  <span>Lojistik planınızı oluşturalım</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold">3</div>
                  <span>Taşımaya başlayın</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/20">
                <div>
                  <div className="text-3xl font-heading font-bold">15+</div>
                  <div className="text-sm text-blue-200">Yıl Tecrübe</div>
                </div>
                <div>
                  <div className="text-3xl font-heading font-bold">1M+</div>
                  <div className="text-sm text-blue-200">Tamamlanan Gönderi</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}