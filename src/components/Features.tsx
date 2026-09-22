import { CheckCircle2, Shield, Award, MapPin, Globe2, Route, Warehouse, Truck } from "lucide-react";

const turkishFeatures = [
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

const turkishCompanyValues = [
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

const englishFeatures = [
  { icon: Shield, title: "€1,000,000 FFL Liability Cover", description: "Our responsibilities arising from transport organisation are covered by FFL insurance up to €1,000,000, subject to policy terms and limits." },
  { icon: MapPin, title: "Part-Load Transport from One Pallet", description: "Transport solutions for part loads from one pallet to all 81 provinces and their districts across Türkiye." },
  { icon: Truck, title: "Door-to-Door Coordination", description: "Organising the transport process from collection at the consignor's address through delivery at the consignee's address." },
  { icon: Globe2, title: "Domestic and International Solutions", description: "Transport options for road, air freight, sea freight and express shipment needs." },
  { icon: Route, title: "Transport Planning Around Your Cargo", description: "Planning an appropriate transport model around pallet count, dimensions, weight, route and delivery point." },
  { icon: Warehouse, title: "Warehousing and Operational Solutions", description: "Operational solutions for storage, stock tracking, handling and dispatch preparation needs." },
];

const englishCompanyValues = [
  { icon: Award, title: "Our Quality Policy", description: "We provide modern logistics solutions with a quality-focused approach centred on customer satisfaction." },
  { icon: CheckCircle2, title: "Our Vision", description: "To maintain a strong position in Türkiye and global markets as a dynamic and reliable organisation in the sector." },
];

export function Features({ locale = "tr" }: { locale?: "tr" | "en" }) {
  const english = locale === "en";
  const features = english ? englishFeatures : turkishFeatures;
  const companyValues = english ? englishCompanyValues : turkishCompanyValues;
  return (
    <section id={english ? "about" : "hakkimizda"} className="py-20">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h2 className="font-heading font-bold text-4xl text-navy mb-6">
              {english ? "Why REX Logistics?" : "Neden REX Lojistik?"}
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              {english ? "Founded in 2022 on its founder's logistics experience since 2002, REX Logistics brings operational experience together with today’s domestic and international freight needs." : "Kurucusunun 2002 yılından bu yana edindiği 20+ yıllık sektör deneyimi üzerine 2022 yılında kurulan REX Lojistik; operasyonel tecrübeyi günümüzün yurtiçi ve uluslararası lojistik ihtiyaçlarıyla bir araya getirir."}
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
                {english ? "Our Corporate Values" : "Kurumsal Değerlerimiz"}
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
                  <div className="text-sm text-blue-100 font-medium">{english ? "Founded" : "Kuruluş Yılı"}</div>
                  <div className="mt-2 h-1 w-0 group-hover:w-full bg-orange-500 rounded-full transition-all duration-500"></div>
                </div>
                <div className="group">
                  <div className="text-5xl font-heading font-bold text-orange-500 mb-1">{english ? "81 Provinces" : "81 İl"}</div>
                  <div className="text-sm text-blue-100 font-medium">{english ? "Domestic Delivery Coverage" : "Yurtiçi Teslimat Kapsamı"}</div>
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
