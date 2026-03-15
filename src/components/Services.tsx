import { Package, Plane, Ship, Warehouse, Globe, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const services = [
  {
    icon: Package,
    title: "Kara Taşımacılığı",
    description: "Türkiye geneli ve yurt dışına güvenli, hızlı kara yolu taşımacılığı hizmeti.",
  },
  {
    icon: Plane,
    title: "Hava Kargo",
    description: "Acil ve değerli kargolarınız için öncelikli hava yolu taşımacılığı.",
  },
  {
    icon: Ship,
    title: "Deniz Taşımacılığı",
    description: "Konteyner ve dökme yük taşımacılığında uygun maliyetli çözümler.",
  },
  {
    icon: Warehouse,
    title: "Depolama Hizmeti",
    description: "Modern depolarımızda güvenli saklama ve stok yönetimi.",
  },
  {
    icon: Globe,
    title: "Uluslararası Lojistik",
    description: "150+ ülkeye gümrüklü ve gümrüksüz teslimat hizmetleri.",
  },
  {
    icon: Shield,
    title: "Sigortalı Taşıma",
    description: "Tüm yükleriniz tam kapsamlı sigorta güvencesi altında.",
  },
];

export function Services() {
  return (
    <section id="hizmetler" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-heading font-bold text-4xl text-navy mb-4">
            Kapsamlı Lojistik Çözümler
          </h2>
          <p className="text-muted-foreground text-lg">
            İhtiyaçlarınıza özel tasarlanmış, güvenilir ve profesyonel lojistik hizmetlerimiz
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <Card key={index} className="border-2 hover:border-primary hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="bg-gradient-accent p-3 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                  <service.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-heading font-semibold text-xl text-navy mb-2">
                  {service.title}
                </h3>
                <p className="text-muted-foreground">
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