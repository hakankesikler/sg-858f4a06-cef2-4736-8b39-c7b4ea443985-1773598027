import { MarketingPage } from "@/components/MarketingPage";
import { ServiceWhatsAppPlanner } from "@/components/ServiceWhatsAppPlanner";
import { marketingPages } from "@/content/marketing-pages";

export default function DenizyoluKonteynerTasimaciligiPage() {
  return (
    <MarketingPage page={marketingPages["denizyolu-konteyner-tasimaciligi"]}>
      <ServiceWhatsAppPlanner variant="sea-fcl" />
    </MarketingPage>
  );
}
