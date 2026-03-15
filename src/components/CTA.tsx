import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Mail } from "lucide-react";

export function CTA() {
  return (
    <section className="py-20 bg-gradient-hero">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="font-heading font-bold text-4xl mb-4">
            Lojistik Operasyonlarınızı Optimize Edin
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Ücretsiz danışmanlık için iletişime geçin. Uzman ekibimiz size özel lojistik çözümler sunmaya hazır.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto mb-8">
            <div className="relative flex-1 w-full">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="E-posta adresiniz"
                className="pl-10 h-12 bg-white/95 border-0"
              />
            </div>
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-white h-12 px-8">
              Teklif Al <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-8 pt-8 border-t border-white/20">
            <div className="text-center">
              <div className="text-3xl font-heading font-bold mb-1">24/7</div>
              <div className="text-sm text-blue-200">Müşteri Desteği</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-heading font-bold mb-1">150+</div>
              <div className="text-sm text-blue-200">Ülkeye Teslimat</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-heading font-bold mb-1">99.8%</div>
              <div className="text-sm text-blue-200">Müşteri Memnuniyeti</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}