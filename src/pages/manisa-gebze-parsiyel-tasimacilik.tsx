import { DomesticPartialPlanner } from "@/components/DomesticPartialPlanner";
import { MarketingPage } from "@/components/MarketingPage";
import { marketingPages } from "@/content/marketing-pages";

export default function ManisaGebzeParsiyelTasimacilikPage() {
  return (
    <MarketingPage page={marketingPages["manisa-gebze-parsiyel-tasimacilik"]} childrenPlacement="after-sections">
      <DomesticPartialPlanner
        defaultSenderCity="Manisa"
        defaultReceiverCity="Kocaeli"
        defaultReceiverDistrict="Gebze"
        eyebrow="Manisa–Gebze parsiyel teklif hazırlama"
        heading="Sanayi ve ticari yük bilgilerini tek özette paylaşın"
        description="Manisa'daki açık yükleme adresini, Gebze'deki açık teslimat adresini, palet veya koli adedini, ölçüleri, toplam ağırlığı, istiflenebilirliği ve hazır olma tarihini girin. Farklı yük gruplarını ayrı kalem olarak ekleyebilirsiniz."
        sectionId="manisa-gebze-parsiyel-teklif"
        submitLabel="Yük Bilgilerini Gönder – Teklif Al"
        whatsappIntro="Merhaba, Manisa–Gebze parsiyel taşıma teklifi rica ederim."
        routeSummaryLabel="Manisa → Gebze rota planı"
      />
    </MarketingPage>
  );
}
