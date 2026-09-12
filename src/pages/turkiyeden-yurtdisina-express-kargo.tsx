import { MarketingPage } from "@/components/MarketingPage";
import { ServiceWhatsAppPlanner } from "@/components/ServiceWhatsAppPlanner";
import { marketingPages } from "@/content/marketing-pages";

export default function TurkiyedenYurtdisinaExpressKargoPage() {
  return (
    <MarketingPage page={marketingPages["turkiyeden-yurtdisina-express-kargo"]}>
      <ServiceWhatsAppPlanner variant="express-export" />
    </MarketingPage>
  );
}
