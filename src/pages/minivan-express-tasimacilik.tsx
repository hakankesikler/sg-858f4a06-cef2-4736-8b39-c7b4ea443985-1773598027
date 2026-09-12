import { MarketingPage } from "@/components/MarketingPage";
import { MinivanExpressPlanner } from "@/components/MinivanExpressPlanner";
import { marketingPages } from "@/content/marketing-pages";

export default function MinivanExpressTasimacilikPage() {
  return (
    <MarketingPage page={marketingPages["minivan-express-tasimacilik"]}>
      <MinivanExpressPlanner />
    </MarketingPage>
  );
}
