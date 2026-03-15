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
        title="REX Lojistik - Kara, Hava ve Deniz Taşımacılığı | Gümrükleme ve Depolama Hizmetleri"
        description="REX Lojistik olarak parsiyel yük taşımacılığı, komple araç kiralama, hava ve deniz taşımacılığı, gümrükleme ve depolama hizmetleri sunuyoruz. Türkiye ve Avrupa'ya güvenli teslimat. 0532 717 34 34"
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