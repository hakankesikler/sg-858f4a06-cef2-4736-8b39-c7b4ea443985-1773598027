import { Package, Plane, Ship, Warehouse, Globe, FileText, Truck, Box } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const services = [
  {
    icon: Plane,
    title: "Hava Yolu Taşımacılığı",
    description: "Acil ve değerli kargolarınız için hızlı ve güvenilir hava yolu taşımacılığı hizmetleri.",
  },
  {
    icon: Ship,
    title: "Deniz Yolu Taşımacılığı",
    description: "FCL ve LCL konteyner taşımacılığı, dökme yük ve proje kargo çözümleri.",
  },
  {
    icon: Truck,
    title: "Kara Yolu Taşımacılığı",
    description: "Türkiye ve Avrupa genelinde kapıdan kapıya kara yolu taşımacılığı hizmetleri.",
  },
  {
    icon: FileText,
    title: "Gümrükleme Hizmetleri",
    description: "İthalat ve ihracat gümrük işlemlerinizde profesyonel danışmanlık ve işlem takibi.",
  },
  {
    icon: Warehouse,
    title: "Depolama ve Antrepo",
    description: "Gümrüklü ve gümrüksüz depolama, antrepo işlemleri ve stok yönetimi hizmetleri.",
  },
  {
    icon: Box,
    title: "Paketleme ve Elleçleme",
    description: "Profesyonel paketleme, etiketleme ve yük elleçleme hizmetleri.",
  },
  {
    icon: Globe,
    title: "Uluslararası Taşımacılık",
    description: "Dünya genelinde kapsamlı lojistik ağımızla güvenilir uluslararası taşımacılık.",
  },
  {
    icon: Package,
    title: "Proje Kargo",
    description: "Ağır ve büyük boy endüstriyel ekipman taşımacılığında özel çözümler.",
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

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <Card key={index} className="border-2 hover:border-primary hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="bg-gradient-accent p-3 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                  <service.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-heading font-semibold text-lg text-navy mb-2">
                  {service.title}
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