import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, MessageCircle } from "lucide-react";

export function Hero() {
  const handleWhatsApp = () => {
    window.open("https://wa.me/905434010755", "_blank");
  };

  const handleQuoteClick = () => {
    const event = new CustomEvent("openQuoteForm");
    window.dispatchEvent(event);
  };

  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden pt-20 sm:pt-24">
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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-8">
        <div className="max-w-3xl">
          {/* Delivery Badge - Mobile Optimized */}
          <div className="inline-block animate-badge-slide-in mb-6 sm:mb-8 max-w-full">
            <div className="relative group">
              {/* Glow effect backdrop */}
              <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-2xl sm:rounded-[40px] blur-xl opacity-75 group-hover:opacity-100 transition-opacity animate-badge-glow" />
              
              {/* Main badge */}
              <div className="relative flex items-center gap-2 sm:gap-4 px-4 py-3 sm:px-8 sm:py-4 bg-gradient-to-br from-amber-900/40 via-orange-900/30 to-amber-900/40 backdrop-blur-sm rounded-2xl sm:rounded-[40px] border border-orange-500/30 shadow-2xl group-hover:scale-105 transition-transform duration-300">
                {/* Icon container */}
                <div className="flex-shrink-0 w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                  <MapPin className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                
                {/* Text - Responsive */}
                <span className="text-sm sm:text-base md:text-lg font-semibold text-white">
                  <span className="hidden sm:inline">81 İle ve İlçelerine 1 Paletten Başlayan Teslimat</span>
                  <span className="sm:hidden">81 İle 1 Palet Teslimat</span>
                </span>
              </div>
            </div>
          </div>

          {/* Main Heading - Mobile Optimized */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 sm:mb-8 leading-tight">
            <span className="text-white">Lojistikte</span>
            <br />
            <span className="text-accent">Güvenilir Çözüm</span>
          </h1>

          {/* CTA Buttons - Mobile First */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8 sm:mb-12">
            <Button 
              size="lg" 
              className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-8 py-6 text-lg shadow-xl hover:shadow-2xl transition-all"
              onClick={handleQuoteClick}
            >
              Hemen Teklif Al
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <Button 
              size="lg"
              variant="outline"
              className="w-full sm:w-auto bg-white/10 border-2 border-white/30 hover:bg-white/20 text-white font-semibold px-8 py-6 text-lg backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all"
              onClick={handleWhatsApp}
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              WhatsApp İletişim
            </Button>
          </div>

          {/* Stats - Compact on Mobile */}
          <div className="grid grid-cols-3 gap-4 sm:gap-6 max-w-3xl">
            <div className="text-center sm:text-left">
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-1 sm:mb-2">20+</div>
              <div className="text-xs sm:text-sm md:text-base text-white/90">Yıl Deneyim</div>
            </div>
            <div className="text-center sm:text-left">
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-1 sm:mb-2">50K+</div>
              <div className="text-xs sm:text-sm md:text-base text-white/90">Müşteri</div>
            </div>
            <div className="text-center sm:text-left">
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-1 sm:mb-2">81</div>
              <div className="text-xs sm:text-sm md:text-base text-white/90">İl Kapsama</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}