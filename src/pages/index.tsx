import { SEO } from "@/components/SEO";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Services } from "@/components/Services";
import { Features } from "@/components/Features";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <SEO
        title="LogisticPro - Profesyonel Lojistik Çözümleri"
        description="Kara, hava ve deniz taşımacılığı ile depolama hizmetleri. 150+ ülkeye güvenli ve hızlı teslimat. 7/24 müşteri desteği ve anlık kargo takibi."
        image="/og-image.png"
      />
      <div className="min-h-screen">
        <Header />
        <main>
          <Hero />
          <Services />
          <Features />
        </main>
        <Footer />
      </div>
    </>
  );
}