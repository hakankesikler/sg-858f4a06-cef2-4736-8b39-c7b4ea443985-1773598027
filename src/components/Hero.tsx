import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { getImageProps } from "next/image";

const HERO_ALT = "REX Lojistik yurtiçi ve uluslararası taşımacılık çözümleri";

export function Hero() {
  const handleQuoteRequest = () => {
    window.dispatchEvent(new Event("rex:open-quote-form"));
  };

  const { props: desktopImageProps } = getImageProps({
    src: "/rex-homepage-hero-desktop.webp",
    alt: HERO_ALT,
    width: 1983,
    height: 793,
    quality: 84,
    sizes: "100vw",
  });
  const { props: mobileImageProps } = getImageProps({
    src: "/rex-homepage-hero-mobile.webp",
    alt: HERO_ALT,
    width: 900,
    height: 1599,
    quality: 82,
    sizes: "100vw",
  });

  return (
    <section className="relative isolate flex min-h-[700px] items-center overflow-hidden pt-20 sm:min-h-[660px] sm:pt-24 lg:min-h-[640px] 2xl:min-h-[calc(40vw+6rem)]">
      <picture className="absolute inset-x-0 bottom-0 top-20 -z-20 sm:top-24">
        <source media="(max-width: 639px)" srcSet={mobileImageProps.srcSet} sizes="100vw" />
        <img
          {...desktopImageProps}
          alt={HERO_ALT}
          fetchPriority="high"
          className="h-full w-full object-cover object-top"
        />
      </picture>

      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-950/90 via-slate-950/65 to-slate-950/35 sm:bg-gradient-to-r sm:from-white/95 sm:via-white/[0.78] sm:to-transparent"
      />

      <div className="container relative z-10 mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-[590px] text-white sm:text-slate-950">
          <p className="mb-2 text-sm font-extrabold uppercase tracking-[0.22em] text-orange-400 sm:text-orange-600">
            REX Lojistik
          </p>

          <h1 className="mb-4 text-base font-semibold leading-snug text-white/90 sm:text-lg sm:text-slate-800">
            Yurtiçi ve Uluslararası Lojistik Çözümleri
          </h1>

          <p className="text-[2.75rem] font-black leading-[1.02] tracking-[-0.035em] text-white drop-shadow-sm sm:text-6xl sm:text-slate-950 lg:text-7xl">
            Yükünüz Varsa,
            <br />
            <span className="text-orange-400 sm:text-orange-600">Bir Yolu Var.</span>
          </p>

          <p className="mt-5 max-w-xl text-base font-medium leading-relaxed text-white/95 sm:mt-6 sm:text-lg sm:text-slate-800 lg:text-xl">
            Yurtiçi ve uluslararası taşımacılıkta, 1 paletten komple araca kadar yükünüze uygun lojistik çözümü planlıyoruz.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:gap-4">
            <Button
              size="lg"
              className="min-h-12 w-full bg-gradient-to-r from-orange-500 to-orange-600 px-7 text-base font-bold text-white shadow-xl transition-all hover:from-orange-600 hover:to-orange-700 hover:shadow-2xl sm:w-auto sm:text-lg"
              onClick={handleQuoteRequest}
            >
              Hızlı Teklif Al
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="min-h-12 w-full border-2 border-white/60 bg-slate-950/45 px-7 text-base font-bold text-white shadow-xl backdrop-blur-sm transition-all hover:bg-slate-950/60 hover:text-white sm:w-auto sm:border-slate-900/25 sm:bg-white/75 sm:text-lg sm:text-slate-950 sm:hover:bg-white sm:hover:text-slate-950"
            >
              <a href="https://wa.me/905434010755" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-5 w-5" aria-hidden="true" />
                WhatsApp&apos;tan Sor
              </a>
            </Button>
          </div>

          <ul className="mt-6 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-white/30 pt-5 text-sm font-semibold text-white/95 sm:mt-8 sm:flex sm:flex-wrap sm:gap-x-3 sm:border-slate-900/15 sm:text-slate-800">
            {[
              "Adresten Alım",
              "Adrese Teslim",
              "Türkiye Geneli",
              "Uluslararası Taşıma",
            ].map((benefit) => (
              <li key={benefit} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 flex-none rounded-full bg-orange-500" aria-hidden="true" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
