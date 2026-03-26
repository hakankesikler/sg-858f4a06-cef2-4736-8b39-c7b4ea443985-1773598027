import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin } from "lucide-react";
import Image from "next/image";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      {/* Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="container mx-auto px-4 pt-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            {/* Delivery Badge */}
            <div className="inline-block animate-badge-slide-in">
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

            <div className="space-y-6">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 leading-tight">
                <span className="text-white">Lojistikte</span>
                <br />
                <span className="text-accent">Güvenilir Çözüm Ortağınız</span>
              </h1>

              <p className="text-xl md:text-2xl text-accent font-semibold mb-6">
                Güvenilir Çözüm Ortağınız
              </p>

              <p className="text-lg text-slate-300 max-w-xl leading-relaxed">
                Türkiye'nin her noktasına hızlı, güvenli ve uygun fiyatlı lojistik çözümleri sunuyoruz.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-gradient-primary hover:opacity-90 text-white group">
                  Hemen Teklif Al
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button size="lg" variant="outline" className="border-2" asChild>
                  <a href="tel:+905434010755">
                    Bizi Arayın
                  </a>
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-slate-700/50">
              <div>
                <div className="text-3xl font-bold text-primary mb-1">15+</div>
                <div className="text-sm text-slate-400">Yıllık Deneyim</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-1">50K+</div>
                <div className="text-sm text-slate-400">Mutlu Müşteri</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-1">81</div>
                <div className="text-sm text-slate-400">İl Kapsama</div>
              </div>
            </div>
          </div>

          {/* Right Content - Image */}
          <div className="relative hidden lg:block">
            <div className="relative z-10">
              <Image
                src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070"
                alt="Lojistik Hizmetleri"
                width={600}
                height={600}
                className="rounded-2xl shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}