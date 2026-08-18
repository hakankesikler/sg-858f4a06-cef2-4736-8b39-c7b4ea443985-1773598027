import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TrackingSection } from "@/components/TrackingSection";

export default function PublicTrackingPage() {
  const router = useRouter();
  const value = router.query.trackingNumber;
  const trackingNumber = typeof value === "string" ? value : "";

  return (
    <>
      <SEO
        title="Gönderi Takip | REX Lojistik"
        description="REX Lojistik sevkiyatınızın güncel durumunu güvenli takip numaranızla görüntüleyin."
        noIndex
      />
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="pt-20">
          <TrackingSection
            initialTrackingNumber={trackingNumber}
            autoSearch={router.isReady && Boolean(trackingNumber)}
          />
        </main>
        <Footer />
      </div>
    </>
  );
}
