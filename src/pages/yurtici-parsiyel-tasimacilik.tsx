import { MarketingPage } from "@/components/MarketingPage";
import { DomesticPartialPlanner } from "@/components/DomesticPartialPlanner";
import { marketingPages } from "@/content/marketing-pages";

export default function YurticiParsiyelTasimacilikPage() {
  return (
    <MarketingPage page={marketingPages["yurtici-parsiyel-tasimacilik"]}>
      <DomesticPartialPlanner />
    </MarketingPage>
  );
}
