import { MarketingPage } from "@/components/MarketingPage";
import { ServiceWhatsAppPlanner } from "@/components/ServiceWhatsAppPlanner";
import { marketingPages } from "@/content/marketing-pages";

export default function YurtdisindanTurkiyeyeExpressKargoPage() {
  return (
    <MarketingPage page={marketingPages["yurtdisindan-turkiyeye-express-kargo"]}>
      <ServiceWhatsAppPlanner variant="express-import" />
    </MarketingPage>
  );
}
