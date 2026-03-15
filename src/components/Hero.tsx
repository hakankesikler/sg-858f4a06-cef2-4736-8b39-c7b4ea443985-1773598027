import { Button } from "@/components/ui/button";
import { Clock, MapPin, ArrowRight, Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 bg-gradient-to-br from-[#0a0e1a] via-[#0F172A] to-[#1e293b] overflow-hidden">
      

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-white space-y-6">
            <div className="flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm">
                <Clock className="w-4 h-4" />
                <span>Güvenilir ve Hızlı Teslimat</span>
              </div>
              
              <div className="inline-flex items-center gap-2 bg-accent/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm">
                <MapPin className="w-4 h-4" />
                <span>81 İle ve İlçelerine 1 Paletten Başlayan Teslimat</span>
              </div>
            </div>
            
            <h1 className="font-heading font-bold text-5xl lg:text-6xl leading-tight text-balance">
              Lojistikte
              <span className="block gradient-text text-transparent bg-clip-text bg-gradient-to-r from-accent to-yellow-300">
                Güvenilir Çözüm Ortağınız
              </span>
            </h1>
            
            <div className="bg-white p-5 rounded-xl shadow-2xl border border-border/50">
              <p className="text-lg text-blue-100 max-w-xl">
                20+ yıllık sektör tecrübesiyle 2022'den bu yana Türkiye ve dünya genelinde profesyonel lojistik hizmetleri sunuyoruz. Yüklerinizi güvenle, zamanında ve eksiksiz teslim ediyoruz.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link href="#teklif">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-white font-medium">
                  İletişime Geçin
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10">
              <div>
                <div className="text-3xl font-heading font-bold text-white">20+</div>
                <div className="text-sm text-blue-200">Yıllık Sektör Tecrübesi</div>
              </div>
              <div>
                <div className="text-3xl font-heading font-bold text-white">240</div>
                <div className="text-sm text-blue-200">Ülkeye Teslimat</div>
              </div>
              <div>
                <div className="text-3xl font-heading font-bold text-white">%99.9</div>
                <div className="text-sm text-blue-200">Müşteri Memnuniyeti</div>
              </div>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative animate-float">
              <div className="absolute inset-0 bg-gradient-accent opacity-20 blur-3xl rounded-full" />
              <div className="relative overflow-hidden rounded-2xl border-4 border-white/10 shadow-2xl">
                <Image 
                  src="https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?q=80&w=1200&auto=format&fit=crop" 
                  alt="Modern Lojistik Operasyonu" 
                  width={600}
                  height={400}
                  className="w-full h-[500px] object-cover"
                  priority
                />
                {/* Overlay gradient for depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/80 via-transparent to-transparent" />
              </div>
            </div>
            
            {/* Floating Info Card */}
            <div className="absolute -bottom-6 -left-6 bg-white p-5 rounded-xl shadow-2xl border border-border/50 animate-bounce" style={{ animationDuration: '3s' }}>
              <div className="flex items-center gap-4">
                <div className="bg-accent/10 p-3 rounded-lg">
                  <Package className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <div className="text-sm font-bold text-navy">Anlık Takip</div>
                  <div className="text-xs text-muted-foreground font-medium">Güvenli ve Hızlı Teslimat</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}