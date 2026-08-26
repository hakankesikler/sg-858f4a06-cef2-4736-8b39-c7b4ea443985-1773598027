import { SEO } from "@/components/SEO";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Services } from "@/components/Services";
import { TrackingSection } from "@/components/TrackingSection";
import { Features } from "@/components/Features";
import { CTA } from "@/components/CTA";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <SEO
        title="Rex Lojistik - Türkiye'nin Güvenilir Lojistik Partneri | 0543 401 07 55"
        description="Rex Lojistik ile kara, hava ve deniz taşımacılığı hizmetleri. Depolama, dağıtım ve uluslararası kargo çözümleri. 7/24 müşteri desteği, hızlı ve güvenli teslimat. İletişim: 0543 401 07 55"
        image="/og-image.png"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Organization",
          "@id": "https://www.rexlojistik.com/#organization",
          name: "REX Lojistik",
          legalName: "REX Lojistik Taşımacılık Depolama Danışmanlık Limited Şirketi",
          url: "https://www.rexlojistik.com",
          logo: "https://www.rexlojistik.com/rex.png?v=2",
          email: "info@rexlojistik.com",
          telephone: "+90 543 401 07 55",
        }}
      />
      <div className="min-h-screen">
        <Header />
        <main>
          <Hero />
          <Services />
          <TrackingSection />
          <Features />
          <CTA />
        </main>
        <Footer />
      </div>
    </>
  );
}
