import { DomesticPartialPlanner } from "@/components/DomesticPartialPlanner";
import { MarketingPage } from "@/components/MarketingPage";
import { marketingPages } from "@/content/marketing-pages";

export default function IzmirBursaParsiyelTasimacilikPage() {
  return (
    <MarketingPage page={marketingPages["izmir-bursa-parsiyel-tasimacilik"]} childrenPlacement="after-sections">
      <DomesticPartialPlanner
        defaultSenderCity="İzmir"
        defaultReceiverCity="Bursa"
        eyebrow="İzmir–Bursa parsiyel teklif hazırlama"
        heading="Sanayi ve ticari yük bilgilerinizi tek özette paylaşın"
        description="İzmir'deki açık yükleme adresini, Bursa'daki açık teslimat adresini, palet veya koli adedini, ölçüleri, toplam ağırlığı, istiflenebilirliği ve hazır olma tarihini girin. Farklı yük gruplarını ayrı kalem olarak ekleyebilirsiniz."
        sectionId="izmir-bursa-parsiyel-teklif"
        submitLabel="Yük Bilgilerini Gönder – Teklif Al"
        whatsappIntro="Merhaba, İzmir–Bursa parsiyel taşıma teklifi rica ederim."
        routeSummaryLabel="İzmir → Bursa rota planı"
      />
    </MarketingPage>
  );
}
