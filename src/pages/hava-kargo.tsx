import { MarketingPage } from "@/components/MarketingPage";
import { ServiceWhatsAppPlanner } from "@/components/ServiceWhatsAppPlanner";
import { marketingPages } from "@/content/marketing-pages";

export default function HavaKargoPage() {
  return (
    <MarketingPage page={{
      ...marketingPages["hava-kargo"],
      seoTitle: "Hava Kargo Taşımacılığı | Ticari Yükler | REX",
      seoDescription: "Ticari yükler için hava kargo taşımacılığı. Uygun adresten alım, direkt ve aktarmalı uçuş seçenekleri ve varış teslim planı için REX Lojistik'ten teklif alın.",
    }}>
      <ServiceWhatsAppPlanner variant="air" />
    </MarketingPage>
  );
}
