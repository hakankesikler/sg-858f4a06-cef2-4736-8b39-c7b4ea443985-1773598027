"use client";

import { Plane, Ship, Truck, Warehouse, Globe, Box, MapPin, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Service {
  icon: typeof Truck;
  title: string;
  description: string;
  href: string;
  featured?: boolean;
  badge?: string;
}

const services: Service[] = [
  {
    icon: Truck,
    title: "Kara Yolu Taşımacılığı",
    description: "Türkiye ve Avrupa genelinde kapıdan kapıya kara yolu taşımacılığı hizmetleri.",
    href: "/komple-tasimacilik",
  },
  {
    icon: MapPin,
    title: "Türkiye Geneli Dağıtım",
    description: "81 ile ve tüm ilçelere 1 palet minimum miktar ile esnek ve hızlı teslimat hizmeti.",
    href: "/yurtici-parsiyel-tasimacilik",
    featured: true,
    badge: "Türkiye Geneli",
  },
  {
    icon: Plane,
    title: "Hava Yolu Taşımacılığı",
    description: "Acil ve değerli kargolarınız için hızlı ve güvenilir hava yolu taşımacılığı hizmetleri.",
    href: "/hava-kargo",
  },
  {
    icon: Globe,
    title: "Uluslararası Taşımacılık",
    description: "Dünya genelinde kapsamlı lojistik ağımızla güvenilir uluslararası taşımacılık.",
    href: "/uluslararasi-karayolu-tasimaciligi",
  },
  {
    icon: Package,
    title: "Express Kargo Hizmeti",
    description: "Dünya çapında güvenilir express kargo iş ortaklarımızla dünyanın ulaşılabilir her ülkesine hızlı dosya, paket ve kargo teslimatı.",
    href: "/express-kargo",
  },
  {
    icon: Ship,
    title: "Deniz Yolu Taşımacılığı",
    description: "FCL ve LCL konteyner taşımacılığı, dökme yük ve deniz yolu kargo çözümleri.",
    href: "/denizyolu-tasimaciligi",
  },
  {
    icon: Warehouse,
    title: "Depolama Hizmetleri",
    description: "Esnek depolama, stok takibi ve dağıtıma bağlı operasyon çözümleri.",
    href: "/depolama",
  },
  {
    icon: Box,
    title: "Paketleme ve Elleçleme",
    description: "Profesyonel paketleme, etiketleme ve yük elleçleme hizmetleri.",
    href: "/depolama",
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
            <Link key={`${service.href}-${index}`} href={service.href} className="block h-full" aria-label={`${service.title} detaylarını inceleyin`}>
            <Card
              className={cn(
                "group h-full hover:shadow-xl transition-all duration-300 border-2",
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
                <span className="inline-flex items-center font-semibold text-orange-600 group-hover:text-orange-700">
                  Detayları inceleyin <span className="ml-2" aria-hidden="true">→</span>
                </span>
              </CardContent>
            </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
