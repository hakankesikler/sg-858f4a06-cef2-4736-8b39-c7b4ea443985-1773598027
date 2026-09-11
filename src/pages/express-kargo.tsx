import { MarketingPage } from "@/components/MarketingPage";
import { ExpressQuotePlanner } from "@/components/ExpressQuotePlanner";
import { marketingPages } from "@/content/marketing-pages";

export default function ExpressKargoPage() {
  return (
    <MarketingPage page={marketingPages["express-kargo"]}>
      <ExpressQuotePlanner />
    </MarketingPage>
  );
}
