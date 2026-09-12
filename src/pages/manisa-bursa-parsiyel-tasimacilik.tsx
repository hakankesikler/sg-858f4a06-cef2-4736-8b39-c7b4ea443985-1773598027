import { DomesticPartialPlanner } from "@/components/DomesticPartialPlanner";
import { MarketingPage } from "@/components/MarketingPage";
import { marketingPages } from "@/content/marketing-pages";

export default function ManisaBursaParsiyelTasimacilikPage() {
  return (
    <MarketingPage page={marketingPages["manisa-bursa-parsiyel-tasimacilik"]} childrenPlacement="after-sections">
      <DomesticPartialPlanner
        defaultSenderCity="Manisa"
        defaultReceiverCity="Bursa"
        eyebrow="Manisa–Bursa parsiyel teklif hazırlama"
        heading="Sanayi ve ticari yük bilgilerinizi tek özette paylaşın"
        description="Manisa'daki açık yükleme adresini, Bursa'daki açık teslimat adresini, palet veya koli adedini, ölçüleri, toplam ağırlığı, istiflenebilirliği ve hazır olma tarihini girin. Farklı yük gruplarını ayrı kalem olarak ekleyebilirsiniz."
        sectionId="manisa-bursa-parsiyel-teklif"
        submitLabel="Yük Bilgilerini Gönder – Teklif Al"
        whatsappIntro="Merhaba, Manisa–Bursa parsiyel taşıma teklifi rica ederim."
        routeSummaryLabel="Manisa → Bursa rota planı"
      />
    </MarketingPage>
  );
}
