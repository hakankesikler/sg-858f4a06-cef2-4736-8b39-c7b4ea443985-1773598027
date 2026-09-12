import { MarketingPage } from "@/components/MarketingPage";
import { RapidTransferPlanner } from "@/components/RapidTransferPlanner";
import { marketingPages } from "@/content/marketing-pages";

export default function HaftaSonuAcilNakliyePage() {
  return (
    <MarketingPage page={marketingPages["hafta-sonu-acil-nakliye"]}>
      <RapidTransferPlanner variant="weekend" />
    </MarketingPage>
  );
}
