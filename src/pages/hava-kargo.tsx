import { MarketingPage } from "@/components/MarketingPage";
import { ServiceWhatsAppPlanner } from "@/components/ServiceWhatsAppPlanner";
import { marketingPages } from "@/content/marketing-pages";

export default function HavaKargoPage() {
  return (
    <MarketingPage page={marketingPages["hava-kargo"]}>
      <ServiceWhatsAppPlanner variant="air" />
    </MarketingPage>
  );
}
