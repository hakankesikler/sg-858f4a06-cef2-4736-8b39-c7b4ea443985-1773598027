"use client";

import { useState } from "react";
import { Plane, Ship, Truck, Warehouse, Globe, Box, MapPin, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ServiceCategory = "all" | "domestic" | "international" | "additional";

interface Service {
  icon: typeof Truck;
  title: string;
  description: string;
  featured?: boolean;
  category: ServiceCategory;
  badge?: string;
}

const services: Service[] = [
  {
    icon: Truck,
    title: "Kara Yolu Taşımacılığı",
    description: "Türkiye ve Avrupa genelinde kapıdan kapıya kara yolu taşımacılığı hizmetleri.",
    category: "domestic",
  },
  {
    icon: MapPin,
    title: "Türkiye Geneli Dağıtım",
    description: "81 ile ve tüm ilçelere 1 palet minimum miktar ile esnek ve hızlı teslimat hizmeti.",
    featured: true,
    badge: "Türkiye Geneli",
    category: "domestic",
  },
  {
    icon: Plane,
    title: "Hava Yolu Taşımacılığı",
    description: "Acil ve değerli kargolarınız için hızlı ve güvenilir hava yolu taşımacılığı hizmetleri.",
    category: "international",
  },
  {
    icon: Globe,
    title: "Uluslararası Taşımacılık",
    description: "Dünya genelinde kapsamlı lojistik ağımızla güvenilir uluslararası taşımacılık.",
    category: "international",
  },
  {
    icon: Package,
    title: "Express Kargo Hizmeti",
    description: "Dünya çapında güvenilir express kargo iş ortaklarımızla dünyanın ulaşılabilir her ülkesine hızlı dosya, paket ve kargo teslimatı.",
    category: "international",
  },
  {
    icon: Ship,
    title: "Deniz Yolu Taşımacılığı",
    description: "FCL ve LCL konteyner taşımacılığı, dökme yük ve deniz yolu kargo çözümleri.",
    category: "international",
  },
  {
    icon: Warehouse,
    title: "Depolama Hizmetleri",
    description: "Türkiye'nin 81 ilinde gümrüksüz depolama ve stok yönetimi hizmetleri.",
    category: "domestic",
  },
  {
    icon: Box,
    title: "Paketleme ve Elleçleme",
    description: "Profesyonel paketleme, etiketleme ve yük elleçleme hizmetleri.",
    category: "additional",
  },
];

const categories = [
  { id: "all" as ServiceCategory, label: "Tüm Hizmetler" },
  { id: "domestic" as ServiceCategory, label: "Yurt İçi" },
  { id: "international" as ServiceCategory, label: "Yurt Dışı" },
  { id: "additional" as ServiceCategory, label: "Ek Hizmetler" },
];

export function Services() {
  const [activeCategory, setActiveCategory] = useState<ServiceCategory>("all");

  const filteredServices = activeCategory === "all" 
    ? services 
    : services.filter(service => service.category === activeCategory);

  return (
    <section id="hizmetler" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-heading font-bold text-4xl text-navy mb-4">
            Hizmetlerimiz
          </h2>
          <p className="text-muted-foreground text-lg">
            REX Lojistik olarak geniş hizmet yelpazemizle tüm lojistik ihtiyaçlarınıza profesyonel çözümler sunuyoruz
          </p>
        </div>

        {/* Category Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? "default" : "outline"}
              onClick={() => setActiveCategory(category.id)}
              className={`transition-all duration-300 ${
                activeCategory === category.id 
                  ? "shadow-lg scale-105" 
                  : "hover:scale-105"
              }`}
            >
              {category.label}
            </Button>
          ))}
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

        {/* Service Count Info */}
        <div className="text-center mt-8">
          <p className="text-muted-foreground text-sm">
            {filteredServices.length} hizmet gösteriliyor
            {activeCategory !== "all" && ` (${categories.find(c => c.id === activeCategory)?.label})`}
          </p>
        </div>
      </div>
    </section>
  );
}