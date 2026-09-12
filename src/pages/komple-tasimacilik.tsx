import { MarketingPage } from "@/components/MarketingPage";
import { ServiceWhatsAppPlanner } from "@/components/ServiceWhatsAppPlanner";
import { marketingPages } from "@/content/marketing-pages";

export default function KompleTasimacilikPage() {
  return (
    <MarketingPage page={marketingPages["komple-tasimacilik"]}>
      <ServiceWhatsAppPlanner variant="complete" />
    </MarketingPage>
  );
}
