import { MarketingPage } from "@/components/MarketingPage";
import { ServiceWhatsAppPlanner } from "@/components/ServiceWhatsAppPlanner";
import { marketingPages } from "@/content/marketing-pages";

export default function KapidanKapiyaHavaKargoPage() {
  return (
    <MarketingPage page={marketingPages["kapidan-kapiya-hava-kargo"]}>
      <ServiceWhatsAppPlanner variant="air-door" />
    </MarketingPage>
  );
}
