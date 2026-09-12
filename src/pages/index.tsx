import { SEO } from "@/components/SEO";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Services } from "@/components/Services";
import { TrackingSection } from "@/components/TrackingSection";
import { Features } from "@/components/Features";
import { Footer } from "@/components/Footer";
import { buildHomeStructuredData } from "@/lib/structured-data";

export default function Home() {
  return (
    <>
      <SEO
        title="REX Lojistik | Parsiyel, Komple ve Uluslararası Taşımacılık"
        description="REX Lojistik; yurtiçi parsiyel ve komple taşımacılık, uluslararası karayolu, hava kargo, denizyolu ve express lojistik çözümleri sunar. 1 paletten komple araca, Türkiye geneli ve uluslararası taşımacılık için hızlı teklif alın."
        image="/og-image.png"
        url="https://www.rexlojistik.com/"
        structuredData={buildHomeStructuredData({
          name: "REX Lojistik | Parsiyel, Komple ve Uluslararası Taşımacılık",
          description: "REX Lojistik; yurtiçi parsiyel ve komple taşımacılık, uluslararası karayolu, hava kargo, denizyolu ve express lojistik çözümleri sunar. 1 paletten komple araca, Türkiye geneli ve uluslararası taşımacılık için hızlı teklif alın.",
        })}
      />
      <div className="min-h-screen">
        <Header />
        <main>
          <Hero />
          <Services />
          <TrackingSection />
          <Features />
        </main>
        <Footer />
      </div>
    </>
  );
}
