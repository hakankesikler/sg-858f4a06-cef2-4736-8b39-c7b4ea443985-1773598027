import { MarketingPage } from "@/components/MarketingPage";
import { ServiceWhatsAppPlanner } from "@/components/ServiceWhatsAppPlanner";
import { marketingPages } from "@/content/marketing-pages";
import Link from "next/link";

export default function KompleTasimacilikPage() {
  return (
    <MarketingPage page={marketingPages["komple-tasimacilik"]}>
      <ServiceWhatsAppPlanner variant="complete" />
      <div className="mx-auto max-w-6xl px-4 pb-12 sm:px-6"><Link href="/yukleme-planlayici" className="block rounded-2xl border border-orange-200 bg-orange-50 p-6 font-semibold text-orange-800 hover:border-orange-400">Komple araç için paletlerinizi 3D yükleme planlayıcıda önceden yerleştirin →</Link></div>
    </MarketingPage>
  );
}
