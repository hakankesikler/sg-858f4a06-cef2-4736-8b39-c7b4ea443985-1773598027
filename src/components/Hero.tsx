import { Button } from "@/components/ui/button";
import { Truck, Clock, MapPin, ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 bg-gradient-hero overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-64 h-64 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-white space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm">
              <Clock className="w-4 h-4" />
              <span>7/24 Kesintisiz Hizmet</span>
            </div>
            
            <h1 className="font-heading font-bold text-5xl lg:text-6xl leading-tight">
              Lojistikte Yeni Nesil
              <span className="block gradient-text text-transparent bg-clip-text bg-gradient-to-r from-accent to-yellow-300">
                Çözüm Ortağınız
              </span>
            </h1>
            
            <p className="text-lg text-blue-100 max-w-xl">
              Küresel ağımız ve teknoloji odaklı yaklaşımımızla kargolarınızı güvenle, zamanında ve eksiksiz teslim ediyoruz.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-white">
                Ücretsiz Keşif <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Hizmetlerimiz
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-8">
              <div>
                <div className="text-3xl font-heading font-bold">150+</div>
                <div className="text-sm text-blue-200">Ülkeye Teslimat</div>
              </div>
              <div>
                <div className="text-3xl font-heading font-bold">50K+</div>
                <div className="text-sm text-blue-200">Mutlu Müşteri</div>
              </div>
              <div>
                <div className="text-3xl font-heading font-bold">99.8%</div>
                <div className="text-sm text-blue-200">Başarı Oranı</div>
              </div>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative animate-float">
              <div className="absolute inset-0 bg-gradient-accent opacity-20 blur-3xl rounded-full" />
              <div className="relative bg-white/10 backdrop-blur-sm p-8 rounded-2xl border border-white/20">
                <Truck className="w-full h-64 text-white" strokeWidth={1} />
              </div>
            </div>
            
            <div className="absolute -bottom-4 -left-4 bg-white p-4 rounded-xl shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="bg-green-500 p-2 rounded-lg">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-navy">Anlık Takip</div>
                  <div className="text-xs text-muted-foreground">GPS İle Konumlandırma</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}