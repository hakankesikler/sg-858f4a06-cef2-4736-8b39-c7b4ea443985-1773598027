import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 bg-gradient-to-br from-[#0a0e1a] via-[#0F172A] to-[#1e293b] overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-white space-y-6">
            <h1 className="font-heading font-bold text-5xl lg:text-6xl leading-tight text-balance">
              Lojistikte
              <span className="block gradient-text text-transparent bg-clip-text bg-gradient-to-r from-accent to-yellow-300">
                Güvenilir Çözüm Ortağınız
              </span>
            </h1>
            
            <p className="text-lg text-blue-100 max-w-xl">
              20+ yıllık sektör tecrübesiyle 2022'den bu yana Türkiye ve dünya genelinde profesyonel lojistik hizmetleri sunuyoruz. Yüklerinizi güvenle, zamanında ve eksiksiz teslim ediyoruz.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link href="#teklif">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-white font-medium group">
                  Teklif Alın
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#hizmetler">
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  Hizmetlerimiz
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
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/80 via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}