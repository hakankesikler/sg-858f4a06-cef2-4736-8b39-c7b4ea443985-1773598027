import { MarketingPage } from "@/components/MarketingPage";
import { ServiceWhatsAppPlanner } from "@/components/ServiceWhatsAppPlanner";
import { marketingPages } from "@/content/marketing-pages";

export default function UluslararasiKarayoluTasimaciligiPage() {
  return (
    <MarketingPage page={marketingPages["uluslararasi-karayolu-tasimaciligi"]}>
      <ServiceWhatsAppPlanner variant="international-road" />
    </MarketingPage>
  );
}
