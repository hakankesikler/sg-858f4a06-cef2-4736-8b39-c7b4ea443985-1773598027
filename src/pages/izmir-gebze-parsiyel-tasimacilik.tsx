import { DomesticPartialPlanner } from "@/components/DomesticPartialPlanner";
import { MarketingPage } from "@/components/MarketingPage";
import { marketingPages } from "@/content/marketing-pages";

export default function IzmirGebzeParsiyelTasimacilikPage() {
  return (
    <MarketingPage page={marketingPages["izmir-gebze-parsiyel-tasimacilik"]} childrenPlacement="after-sections">
      <DomesticPartialPlanner
        defaultSenderCity="İzmir"
        defaultReceiverCity="Kocaeli"
        defaultReceiverDistrict="Gebze"
        eyebrow="İzmir–Gebze parsiyel teklif hazırlama"
        heading="Sanayi ve ticari yük bilgilerinizi tek özette paylaşın"
        description="İzmir'deki açık yükleme adresini, Gebze'deki açık teslimat adresini, palet veya koli adedini, ölçüleri, toplam ağırlığı, istiflenebilirliği ve hazır olma tarihini girin. Farklı yük gruplarını ayrı kalem olarak ekleyebilirsiniz."
        sectionId="izmir-gebze-parsiyel-teklif"
        submitLabel="Yük Bilgilerini Gönder – Teklif Al"
        whatsappIntro="Merhaba, İzmir–Gebze parsiyel taşıma teklifi rica ederim."
        routeSummaryLabel="İzmir → Gebze rota planı"
      />
    </MarketingPage>
  );
}
