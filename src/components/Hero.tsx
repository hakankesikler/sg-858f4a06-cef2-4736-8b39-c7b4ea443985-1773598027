import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin } from "lucide-react";
import Image from "next/image";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/hero-warehouse.jpg" 
          alt="Lojistik Depo" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/85 to-slate-900/70"></div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl">
          {/* Delivery Badge */}
          <div className="inline-block animate-badge-slide-in mb-8">
            <div className="relative group">
              {/* Glow effect backdrop */}
              <div className="absolute -inset-4 bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-[40px] blur-xl opacity-75 group-hover:opacity-100 transition-opacity animate-badge-glow" />
              
              {/* Pulse ring effect */}
              <div className="absolute -inset-2 bg-gradient-to-r from-orange-500/30 to-orange-600/30 rounded-[40px] blur-md opacity-50 animate-pulse" />
              
              {/* Main badge */}
              <div className="relative flex items-center gap-4 px-8 py-4 bg-gradient-to-br from-amber-900/40 via-orange-900/30 to-amber-900/40 backdrop-blur-sm rounded-[40px] border border-orange-500/30 shadow-2xl group-hover:scale-105 transition-transform duration-300 animate-badge-float">
                {/* Icon container */}
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                
                {/* Text */}
                <span className="text-base md:text-lg font-semibold text-white whitespace-nowrap">
                  81 İle ve İlçelerine 1 Paletten Başlayan Teslimat
                </span>
              </div>
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-12 leading-tight">
            <span className="text-white">Lojistikte</span>
            <br />
            <span className="text-accent">Güvenilir Çözüm Ortağınız</span>
          </h1>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl">
            <div className="p-6">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">20+</div>
              <div className="text-white/90">Yıllık Deneyim</div>
            </div>
            <div className="p-6">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">50K+</div>
              <div className="text-white/90">Mutlu Müşteri</div>
            </div>
            <div className="p-6">
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">81</div>
              <div className="text-white/90">İl Kapsama</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}