import { CheckCircle2, Clock, Shield, Users, Award, Headphones } from "lucide-react";

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
              2022 yılından bu yana lojistik sektöründe faaliyet gösteren REX Lojistik, müşteri memnuniyeti odaklı yaklaşımı ve kaliteli hizmet anlayışıyla sektörde güvenilir bir iş ortağıdır.
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
              <h3 className="font-heading font-bold text-2xl mb-6">Kurumsal Değerlerimiz</h3>
              
              <div className="space-y-6 mb-8">
                {companyValues.map((value, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg h-fit">
                      <value.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-heading font-semibold text-lg mb-2">{value.title}</h4>
                      <p className="text-blue-100 text-sm">{value.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/20">
                <div>
                  <div className="text-3xl font-heading font-bold">2022</div>
                  <div className="text-sm text-blue-200">Kuruluş Yılı</div>
                </div>
                <div>
                  <div className="text-3xl font-heading font-bold">2+</div>
                  <div className="text-sm text-blue-200">Yıllık Deneyim</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}