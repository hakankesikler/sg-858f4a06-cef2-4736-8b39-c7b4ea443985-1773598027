import { DomesticPartialPlanner } from "@/components/DomesticPartialPlanner";
import { MarketingPage } from "@/components/MarketingPage";
import { marketingPages } from "@/content/marketing-pages";

export default function IzmirIstanbulParsiyelTasimacilikPage() {
  return (
    <MarketingPage page={marketingPages["izmir-istanbul-parsiyel-tasimacilik"]} childrenPlacement="after-sections">
      <DomesticPartialPlanner
        defaultSenderCity="İzmir"
        defaultReceiverCity="İstanbul"
        eyebrow="İzmir–İstanbul parsiyel teklif hazırlama"
        heading="Rota ve yük bilgilerini tek özette paylaşın"
        description="İzmir'deki açık yükleme adresini, İstanbul'daki açık teslimat adresini, palet veya koli adedini, ölçüleri, toplam ağırlığı, istiflenebilirliği ve hazır olma tarihini girin. Farklı yük gruplarını ayrı kalem olarak ekleyebilirsiniz."
        sectionId="izmir-istanbul-parsiyel-teklif"
        submitLabel="Yük Bilgilerini Gönder – Teklif Al"
        whatsappIntro="Merhaba, İzmir–İstanbul parsiyel taşıma teklifi rica ederim."
        routeSummaryLabel="İzmir → İstanbul rota planı"
      />
    </MarketingPage>
  );
}
