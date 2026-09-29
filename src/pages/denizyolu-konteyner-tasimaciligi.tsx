import { MarketingPage } from "@/components/MarketingPage";
import { ServiceWhatsAppPlanner } from "@/components/ServiceWhatsAppPlanner";
import { marketingPages } from "@/content/marketing-pages";
import Link from "next/link";

export default function DenizyoluKonteynerTasimaciligiPage() {
  return (
    <MarketingPage page={marketingPages["denizyolu-konteyner-tasimaciligi"]}>
      <ServiceWhatsAppPlanner variant="sea-fcl" />
      <div className="mx-auto max-w-6xl px-4 pb-12 sm:px-6"><Link href="/yukleme-planlayici" className="block rounded-2xl border border-orange-200 bg-orange-50 p-6 font-semibold text-orange-800 hover:border-orange-400">20′ ve 40′ konteynerde palet yerleşimini 3D planlayıcıyla karşılaştırın →</Link></div>
    </MarketingPage>
  );
}
