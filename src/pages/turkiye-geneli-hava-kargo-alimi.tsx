import { MarketingPage } from "@/components/MarketingPage";
import { ServiceWhatsAppPlanner } from "@/components/ServiceWhatsAppPlanner";
import { marketingPages } from "@/content/marketing-pages";

export default function TurkiyeGeneliHavaKargoAlimiPage() {
  return (
    <MarketingPage page={marketingPages["turkiye-geneli-hava-kargo-alimi"]}>
      <ServiceWhatsAppPlanner variant="air-pickup" />
    </MarketingPage>
  );
}
