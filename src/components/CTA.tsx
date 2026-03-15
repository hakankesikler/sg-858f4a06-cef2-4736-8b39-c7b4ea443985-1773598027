import { QuoteForm } from "@/components/QuoteForm";

export function CTA() {
  return (
    <section id="teklif" className="py-20 bg-gradient-hero">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center text-white mb-12">
            <h2 className="font-heading font-bold text-4xl mb-4">
              Lojistik Çözümleriniz İçin Hemen İletişime Geçin
            </h2>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto">
              REX Lojistik ile güvenli, hızlı ve ekonomik taşımacılık hizmetinden yararlanın. Detaylı teklif formumuzu doldurun, size özel fiyat teklifi alalım.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <QuoteForm />
          </div>

          <div className="flex flex-wrap justify-center gap-8 pt-12 mt-12 border-t border-white/20">
            <div className="text-center text-white">
              <div className="text-3xl font-heading font-bold mb-1">7/24</div>
              <div className="text-sm text-blue-200">Müşteri Desteği</div>
            </div>
            <div className="text-center text-white">
              <div className="text-3xl font-heading font-bold mb-1">20+</div>
              <div className="text-sm text-blue-200">Yıllık Tecrübe</div>
            </div>
            <div className="text-center text-white">
              <div className="text-3xl font-heading font-bold mb-1">100%</div>
              <div className="text-sm text-blue-200">Müşteri Memnuniyeti</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}