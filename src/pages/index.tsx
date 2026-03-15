import { SEO } from "@/components/SEO";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Services } from "@/components/Services";
import { TrackingSection } from "@/components/TrackingSection";
import { Features } from "@/components/Features";
import { Testimonials } from "@/components/Testimonials";
import { CTA } from "@/components/CTA";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <SEO
        title="LogisticPro - Profesyonel Lojistik Çözümleri | Kargo Takip ve Taşımacılık"
        description="Kara, hava ve deniz taşımacılığı ile depolama hizmetleri. 150+ ülkeye güvenli ve hızlı teslimat. 7/24 müşteri desteği ve anlık kargo takibi. ISO sertifikalı lojistik hizmetleri."
        image="/og-image.png"
      />
      <div className="min-h-screen">
        <Header />
        <main>
          <Hero />
          <Services />
          <TrackingSection />
          <Features />
          <Testimonials />
          <CTA />
        </main>
        <Footer />
      </div>
    </>
  );
}