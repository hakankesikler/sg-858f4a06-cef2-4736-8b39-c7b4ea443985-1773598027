import { Plane, Ship, Truck, Warehouse, Globe, Box, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const services = [
  {
    icon: Truck,
    title: "Kara Yolu Taşımacılığı",
    description: "Türkiye ve Avrupa genelinde kapıdan kapıya kara yolu taşımacılığı hizmetleri.",
  },
  {
    icon: MapPin,
    title: "Türkiye Geneli Dağıtım",
    description: "81 ile ve tüm ilçelere 1 palet minimum miktar ile esnek ve hızlı teslimat hizmeti.",
    featured: true,
  },
  {
    icon: Plane,
    title: "Hava Yolu Taşımacılığı",
    description: "Acil ve değerli kargolarınız için hızlı ve güvenilir hava yolu taşımacılığı hizmetleri.",
  },
  {
    icon: Ship,
    title: "Deniz Yolu Taşımacılığı",
    description: "FCL ve LCL konteyner taşımacılığı, dökme yük ve deniz yolu kargo çözümleri.",
  },
  {
    icon: Globe,
    title: "Uluslararası Taşımacılık",
    description: "Dünya genelinde kapsamlı lojistik ağımızla güvenilir uluslararası taşımacılık.",
  },
  {
    icon: Warehouse,
    title: "Depolama Hizmetleri",
    description: "Türkiye'nin 81 ilinde gümrüksüz depolama ve stok yönetimi hizmetleri.",
  },
  {
    icon: Box,
    title: "Paketleme ve Elleçleme",
    description: "Profesyonel paketleme, etiketleme ve yük elleçleme hizmetleri.",
  },
];

export function Services() {
  return (
    <section id="hizmetler" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-heading font-bold text-4xl text-navy mb-4">
            Hizmetlerimiz
          </h2>
          <p className="text-muted-foreground text-lg">
            REX Lojistik olarak geniş hizmet yelpazemizle tüm lojistik ihtiyaçlarınıza profesyonel çözümler sunuyoruz
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <Card 
              key={index} 
              className={`border-2 hover:border-primary hover:shadow-xl transition-all duration-300 group ${
                service.featured ? 'ring-2 ring-primary/20 bg-primary/5' : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="bg-gradient-accent p-3 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                  <service.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-heading font-semibold text-lg text-navy mb-2">
                  {service.title}
                  {service.featured && (
                    <span className="ml-2 text-xs bg-primary text-white px-2 py-1 rounded-full">
                      Türkiye Geneli
                    </span>
                  )}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {service.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}