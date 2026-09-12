import { MarketingPage } from "@/components/MarketingPage";
import { ServiceWhatsAppPlanner } from "@/components/ServiceWhatsAppPlanner";
import { marketingPages } from "@/content/marketing-pages";

export default function DepolamaPage() {
  return (
    <MarketingPage page={marketingPages["depolama"]}>
      <ServiceWhatsAppPlanner variant="storage" />
    </MarketingPage>
  );
}
