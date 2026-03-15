import { CheckCircle2, Clock, Shield, Users, Award, Headphones, MapPin } from "lucide-react";

const features = [
  {
    icon: Clock,
    title: "Zamanında Teslimat",
    description: "Profesyonel ekibimizle tüm gönderileriniz belirlenen sürede eksiksiz teslim edilir.",
  },
  {
    icon: Shield,
    title: "Güvenli Taşımacılık",
    description: "Yükleriniz tam kapsamlı sigorta güvencesi altında ve profesyonel ekibimizle taşınır.",
  },
  {
    icon: MapPin,
    title: "1 Paletten Başlayan Teslimat",
    description: "Türkiye'nin 81 ili ve tüm ilçelerine minimum 1 palet ile esnek teslimat imkanı.",
  },
  {
    icon: MapPin,
    title: "81 İlde Depolama",
    description: "Türkiye'nin her ilinde gümrüksüz depolama ve stok yönetimi hizmetleri.",
  },
  {
    icon: Users,
    title: "Uzman Kadro",
    description: "Deneyimli ve sertifikalı lojistik uzmanlarımızla kesintisiz hizmet.",
  },
  {
    icon: Headphones,
    title: "7/24 Müşteri Desteği",
    description: "Her zaman yanınızdayız. Tüm sorularınız için kesintisiz destek hizmeti.",
  },
];

const companyValues = [
  {
    icon: Award,
    title: "Kalite Politikamız",
    description: "Müşteri memnuniyeti odaklı, kaliteli hizmet anlayışıyla modern lojistik çözümleri sunuyoruz.",
  },
  {
    icon: CheckCircle2,
    title: "Vizyonumuz",
    description: "Türkiye ve dünya pazarında güçlü konumumuzu sürdürerek, sektörün dinamik ve güvenilir kuruluşu olmak.",
  },
];

export function Features() {
  return (
    <section id="hakkimizda" className="py-20">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h2 className="font-heading font-bold text-4xl text-navy mb-6">
              Neden REX Lojistik?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              20+ yıllık sektör deneyimi ile 2022 yılında kurulan REX Lojistik, müşteri memnuniyeti odaklı yaklaşımı ve kaliteli hizmet anlayışıyla güvenilir bir lojistik iş ortağıdır.
            </p>

            <div className="space-y-6">
              {features.map((feature, index) => (
                <div key={index} className="flex gap-4 group">
                  <div className="bg-gradient-to-br from-blue-light to-blue-light/50 p-3 rounded-lg h-fit group-hover:shadow-md transition-all duration-300 group-hover:scale-105">
                    <feature.icon className="w-6 h-6 text-navy" />
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
            <div className="absolute -inset-1 bg-gradient-to-r from-logo-orange/30 to-blue-500/30 rounded-2xl blur-xl"></div>
            <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 rounded-2xl p-8 text-white shadow-2xl border border-white/10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-logo-orange/20 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/20 rounded-full blur-3xl"></div>
              
              <h3 className="font-heading font-bold text-2xl mb-6 relative">
                Kurumsal Değerlerimiz
                <div className="absolute -bottom-2 left-0 w-20 h-1 bg-logo-orange rounded-full"></div>
              </h3>
              
              <div className="space-y-6 mb-8 relative">
                {companyValues.map((value, index) => (
                  <div key={index} className="flex gap-4 group">
                    <div className="bg-logo-orange/40 backdrop-blur-sm p-3 rounded-lg h-fit group-hover:bg-logo-orange/60 transition-all duration-300 border border-logo-orange/30">
                      <value.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-heading font-semibold text-lg mb-2 text-white">{value.title}</h4>
                      <p className="text-blue-50 text-sm leading-relaxed">{value.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/20 relative">
                <div className="group">
                  <div className="text-4xl font-heading font-bold text-blue-300">2022</div>
                  <div className="text-sm text-blue-100 font-medium">Kuruluş Yılı</div>
                  <div className="mt-2 h-1 w-0 group-hover:w-full bg-logo-orange rounded-full transition-all duration-500"></div>
                </div>
                <div className="group">
                  <div className="text-4xl font-heading font-bold text-logo-orange">81</div>
                  <div className="text-sm text-blue-100 font-medium">İlde Depolama</div>
                  <div className="mt-2 h-1 w-0 group-hover:w-full bg-logo-orange rounded-full transition-all duration-500"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}