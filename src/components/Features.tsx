import { CheckCircle2, Shield, Award, MapPin, Globe2, Route, Warehouse, Truck } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "1.000.000 € FFL Sorumluluk Teminatı",
    description: "Taşıma organizasyonundan doğan sorumluluklarımız, poliçe şartları ve limitleri kapsamında 1.000.000 €'ya kadar FFL sigorta teminatı altındadır.",
  },
  {
    icon: MapPin,
    title: "1 Paletten Başlayan Parsiyel Taşıma",
    description: "1 paletten başlayan parsiyel yükler için Türkiye'nin 81 iline ve ilçelere taşıma çözümleri.",
  },
  {
    icon: Truck,
    title: "Adresten Adrese Organizasyon",
    description: "Yükün gönderici adresinden alınmasından alıcı adresine teslimine kadar taşıma sürecinin organizasyonu.",
  },
  {
    icon: Globe2,
    title: "Yurtiçi ve Uluslararası Çözümler",
    description: "Karayolu, hava kargo, denizyolu ve express gönderi ihtiyaçlarına uygun taşıma seçenekleri.",
  },
  {
    icon: Route,
    title: "Yüke Uygun Taşıma Planlaması",
    description: "Palet sayısı, ölçü, ağırlık, güzergâh ve teslimat noktasına göre uygun taşıma modelinin planlanması.",
  },
  {
    icon: Warehouse,
    title: "Depolama ve Operasyon Çözümleri",
    description: "Depolama, stok takibi, elleçleme ve sevkiyata hazırlık ihtiyaçlarına yönelik operasyon çözümleri.",
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
              20+ yıllık sektör deneyiminin üzerine kurulan REX Lojistik, 2022 yılından bu yana müşteri memnuniyeti odaklı yaklaşımı ve kaliteli hizmet anlayışıyla güvenilir bir lojistik iş ortağıdır.
            </p>

            <div className="space-y-6">
              {features.map((feature, index) => (
                <div key={index} className="flex gap-4 group">
                  <div className="bg-blue-100 p-3 rounded-lg h-fit group-hover:bg-blue-200 transition-all duration-300 group-hover:scale-105">
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
            <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-2xl p-8 text-white shadow-2xl">
              <h3 className="font-heading font-bold text-3xl mb-2 text-white">
                Kurumsal Değerlerimiz
              </h3>
              <div className="w-24 h-1 bg-orange-500 rounded-full mb-8"></div>
              
              <div className="space-y-6 mb-8">
                {companyValues.map((value, index) => (
                  <div key={index} className="flex gap-4 group">
                    <div className="bg-orange-500 p-3 rounded-lg h-fit group-hover:bg-orange-600 transition-all duration-300">
                      <value.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-heading font-semibold text-xl mb-2 text-white">
                        {value.title}
                      </h4>
                      <p className="text-blue-50 leading-relaxed">
                        {value.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/30">
                <div className="group">
                  <div className="text-5xl font-heading font-bold text-white mb-1">2022</div>
                  <div className="text-sm text-blue-100 font-medium">Kuruluş Yılı</div>
                  <div className="mt-2 h-1 w-0 group-hover:w-full bg-orange-500 rounded-full transition-all duration-500"></div>
                </div>
                <div className="group">
                  <div className="text-5xl font-heading font-bold text-orange-500 mb-1">81 İl</div>
                  <div className="text-sm text-blue-100 font-medium">Yurtiçi Teslimat Kapsamı</div>
                  <div className="mt-2 h-1 w-0 group-hover:w-full bg-orange-500 rounded-full transition-all duration-500"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
