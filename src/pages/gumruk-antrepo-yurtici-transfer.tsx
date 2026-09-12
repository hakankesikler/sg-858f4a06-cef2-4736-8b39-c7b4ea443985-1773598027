import { MarketingPage } from "@/components/MarketingPage";
import { RapidTransferPlanner } from "@/components/RapidTransferPlanner";
import { marketingPages } from "@/content/marketing-pages";

export default function GumrukAntrepoYurticiTransferPage() {
  return (
    <MarketingPage page={marketingPages["gumruk-antrepo-yurtici-transfer"]}>
      <RapidTransferPlanner variant="customs" />
    </MarketingPage>
  );
}
