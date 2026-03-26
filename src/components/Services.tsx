"use client";

import { Plane, Ship, Truck, Warehouse, Globe, Box, MapPin, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Service {
  icon: typeof Truck;
  title: string;
  description: string;
  featured?: boolean;
  badge?: string;
}

const services: Service[] = [
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
    badge: "Türkiye Geneli",
  },
  {
    icon: Plane,
    title: "Hava Yolu Taşımacılığı",
    description: "Acil ve değerli kargolarınız için hızlı ve güvenilir hava yolu taşımacılığı hizmetleri.",
  },
  {
    icon: Globe,
    title: "Uluslararası Taşımacılık",
    description: "Dünya genelinde kapsamlı lojistik ağımızla güvenilir uluslararası taşımacılık.",
  },
  {
    icon: Package,
    title: "Express Kargo Hizmeti",
    description: "Dünya çapında güvenilir express kargo iş ortaklarımızla dünyanın ulaşılabilir her ülkesine hızlı dosya, paket ve kargo teslimatı.",
  },
  {
    icon: Ship,
    title: "Deniz Yolu Taşımacılığı",
    description: "FCL ve LCL konteyner taşımacılığı, dökme yük ve deniz yolu kargo çözümleri.",
  },
  {
    icon: Warehouse,
    title: "Depolama Hizmetleri",
    description: "Türkiye'nin 81 ilinde depolama ve stok yönetimi hizmetleri.",
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
        <div className="text-center max-w-2xl mx-auto mb-12 bg-white p-8 rounded-2xl shadow-xl border border-border/50">
          <h2 className="font-heading font-bold text-4xl text-navy mb-4">
            Hizmetlerimiz
          </h2>
          <p className="text-foreground text-lg leading-relaxed">
            REX Lojistik olarak geniş hizmet yelpazemizle tüm lojistik ihtiyaçlarınıza profesyonel çözümler sunuyoruz
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card
              key={index}
              className={cn(
                "group hover:shadow-xl transition-all duration-300 border-2",
                service.featured
                  ? "border-orange-500 bg-white"
                  : "border-gray-200 hover:border-orange-300 bg-white"
              )}
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-4 bg-orange-500 rounded-2xl text-white group-hover:scale-110 transition-transform duration-300">
                    <service.icon className="w-8 h-8" />
                  </div>
                  {service.featured && (
                    <span className="px-3 py-1 bg-orange-500 text-white text-sm font-semibold rounded-full">
                      {service.badge}
                    </span>
                  )}
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                  {service.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <p className="text-muted-foreground leading-relaxed">
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