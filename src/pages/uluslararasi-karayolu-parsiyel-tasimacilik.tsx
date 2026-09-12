import { MarketingPage } from "@/components/MarketingPage";
import { RoadFreightPlanner } from "@/components/RoadFreightPlanner";
import { marketingPages } from "@/content/marketing-pages";

export default function UluslararasiKarayoluParsiyelTasimacilikPage() {
  return (
    <MarketingPage page={marketingPages["uluslararasi-karayolu-parsiyel-tasimacilik"]}>
      <RoadFreightPlanner />
    </MarketingPage>
  );
}
