import { MarketingPage } from "@/components/MarketingPage";
import { ServiceWhatsAppPlanner } from "@/components/ServiceWhatsAppPlanner";
import { marketingPages } from "@/content/marketing-pages";

export default function UluslararasiKarayoluTasimaciligiPage() {
  return (
    <MarketingPage page={{
      ...marketingPages["uluslararasi-karayolu-tasimaciligi"],
      seoTitle: "Uluslararası Karayolu Taşımacılığı | Türkiye–Avrupa | REX",
      seoDescription: "Türkiye ile Avrupa arasında çift yönlü uluslararası karayolu taşımacılığı. Ticari yükler için adresten adrese taşıma ve uygun araç planı; REX'ten teklif alın.",
    }}>
      <ServiceWhatsAppPlanner variant="international-road" />
    </MarketingPage>
  );
}
