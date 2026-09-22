"use client";

import { Plane, Ship, Truck, Warehouse, Globe, Box, MapPin, Package } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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

const turkishServices: Service[] = [
  {
    icon: Truck,
    title: "Yurtiçi Komple Taşımacılık",
    description: "Türkiye genelinde komple araç gerektiren ticari ve sanayi yükleri için adresten adrese taşıma çözümleri.",
    href: "/komple-tasimacilik",
  },
  {
    icon: MapPin,
    title: "Yurtiçi Parsiyel Taşımacılık",
    description: "1 paletten başlayan parsiyel yüklerde Türkiye'nin 81 iline ve ilçelere adresten adrese taşıma çözümleri.",
    href: "/yurtici-parsiyel-tasimacilik",
    featured: true,
    badge: "Türkiye Geneli",
  },
  {
    icon: Plane,
    title: "Hava Kargo",
    description: "Uluslararası gönderiler için yükün ölçüsü, ağırlığı, çıkış ve varış noktasına uygun hava kargo çözümleri.",
    href: "/hava-kargo",
  },
  {
    icon: Globe,
    title: "Uluslararası Karayolu Taşımacılığı",
    description: "Türkiye ile Avrupa arasında parsiyel ve komple yükler için planlı, adresten adrese karayolu taşıma çözümleri.",
    href: "/uluslararasi-karayolu-tasimaciligi",
  },
  {
    icon: Package,
    title: "Uluslararası Express Kargo",
    description: "220'den fazla ülke ve bölgeye uluslararası express gönderim ve yurtdışından Türkiye'ye adresten alım çözümleri.",
    href: "/express-kargo",
  },
  {
    icon: Ship,
    title: "Denizyolu Taşımacılığı",
    description: "Uluslararası yüklerde LCL parsiyel ve FCL komple konteyner taşımacılığı çözümleri.",
    href: "/denizyolu-tasimaciligi",
  },
  {
    icon: Warehouse,
    title: "Depolama Hizmetleri",
    description: "Yüklerin depolanması, stok takibi, elleçlenmesi ve sevkiyata hazırlanmasına yönelik esnek lojistik çözümleri.",
    href: "/depolama",
  },
  {
    icon: Box,
    title: "Paketleme ve Elleçleme",
    description: "Yüklerin paketlenmesi, etiketlenmesi, paletlenmesi ve sevkiyata hazırlanmasına yönelik operasyon çözümleri.",
    href: "/depolama",
  },
];

const englishServices: Service[] = [
  { icon: Truck, title: "Domestic Full Truckload Transport", description: "Door-to-door transport solutions for commercial and industrial loads that require a full vehicle across Türkiye.", href: "/en/full-truckload-transport" },
  { icon: MapPin, title: "Domestic Part-Load Transport", description: "Door-to-door transport solutions from one pallet to all 81 provinces and their districts across Türkiye.", href: "/en/domestic-part-load-transport", featured: true, badge: "Across Türkiye" },
  { icon: Plane, title: "Air Freight", description: "Air freight solutions for international shipments, planned around cargo dimensions, weight, origin and destination.", href: "/en/air-freight" },
  { icon: Globe, title: "International Road Freight", description: "Planned, door-to-door road freight solutions for part and full loads between Türkiye and Europe.", href: "/en/international-road-freight" },
  { icon: Package, title: "International Express Courier", description: "International express shipping to more than 220 countries and regions, with collection options from abroad to Türkiye.", href: "/en/express-courier" },
  { icon: Ship, title: "Sea Freight", description: "LCL part-load and FCL full-container transport solutions for international cargo.", href: "/en/sea-freight" },
  { icon: Warehouse, title: "Warehousing Services", description: "Flexible logistics solutions for storage, stock tracking, handling and preparing cargo for dispatch.", href: "/en/warehousing-services" },
  { icon: Box, title: "Packing and Handling", description: "Operational solutions for packing, labelling, palletising and preparing cargo for dispatch.", href: "/en/packing-and-handling" },
];

export function Services({ locale = "tr" }: { locale?: "tr" | "en" }) {
  const english = locale === "en";
  const services = english ? englishServices : turkishServices;
  return (
    <section
      id={english ? "services" : "hizmetler"}
      className="relative overflow-hidden border-t border-slate-100 bg-gradient-to-b from-white via-slate-50/70 to-white py-14 sm:py-20 lg:py-24"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-14">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-orange-600 sm:text-sm">
            {english ? "Logistics Solutions" : "Lojistik Çözümleri"}
          </p>
          <h2 className="font-heading text-3xl font-bold text-navy sm:text-4xl lg:text-5xl">
            {english ? "Our Services" : "Hizmetlerimiz"}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            {english ? "We plan logistics solutions for domestic and international transport needs from one point of contact." : "Yurtiçi ve uluslararası taşımacılık ihtiyaçlarınıza uygun lojistik çözümlerini tek noktadan planlıyoruz."}
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <Link
              key={`${service.href}-${index}`}
              href={service.href}
              className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-4"
              aria-label={english ? `Explore ${service.title}` : `${service.title} detaylarını inceleyin`}
            >
              <Card
                className={cn(
                  "relative flex min-h-[304px] h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-[0_12px_35px_rgba(15,23,42,0.06)] transition-[transform,box-shadow,border-color] duration-300 motion-reduce:transition-none motion-safe:hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(15,23,42,0.11)]",
                  service.featured
                    ? "border-orange-300"
                    : "border-slate-200 hover:border-orange-200"
                )}
              >
                <div
                  className={cn(
                    "absolute inset-x-0 top-0 h-1",
                    service.featured ? "bg-orange-500" : "bg-navy"
                  )}
                  aria-hidden="true"
                />
                <CardHeader className="pb-3 pt-7">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                        service.featured
                          ? "bg-orange-500 text-white"
                          : "bg-navy text-orange-400"
                      )}
                    >
                      <service.icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    {service.featured && (
                      <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 ring-1 ring-inset ring-orange-200">
                        {service.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold leading-snug text-slate-900 transition-colors duration-200 group-hover:text-orange-700 sm:text-2xl">
                    {service.title}
                  </h3>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col px-6 pb-7 pt-0">
                  <p className="flex-1 leading-relaxed text-slate-600">
                    {service.description}
                  </p>
                  <span className="mt-6 inline-flex items-center text-sm font-semibold text-orange-600 transition-colors duration-200 group-hover:text-orange-700">
                    {english ? "Explore Service" : "Detayları İncele"} <span className="ml-2" aria-hidden="true">→</span>
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
