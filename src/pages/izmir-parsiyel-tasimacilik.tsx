import { DomesticPartialPlanner } from "@/components/DomesticPartialPlanner";
import { MarketingPage } from "@/components/MarketingPage";
import { marketingPages } from "@/content/marketing-pages";

export default function IzmirParsiyelTasimacilikPage() {
  return (
    <MarketingPage page={marketingPages["izmir-parsiyel-tasimacilik"]} childrenPlacement="after-sections">
      <DomesticPartialPlanner
        defaultSenderCity="İzmir"
        eyebrow="İzmir parsiyel teklif hazırlama"
        heading="Yük bilgilerinizi paylaşın, taşıma planınızı oluşturalım"
        description="Yükleme ve teslimat adreslerini eksiksiz girin; farklı ölçü veya ağırlıktaki her palet ya da koli grubunu ayrı yük kalemi olarak ekleyin. Hazırlanan özeti WhatsApp üzerinden REX Lojistik operasyon ekibine iletin."
        sectionId="izmir-parsiyel-teklif"
        submitLabel="Yük Bilgilerini Gönder – Teklif Al"
        whatsappIntro="Merhaba, İzmir çıkışlı parsiyel taşıma teklifi rica ederim."
      />
    </MarketingPage>
  );
}
