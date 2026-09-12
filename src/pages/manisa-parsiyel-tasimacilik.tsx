import { DomesticPartialPlanner } from "@/components/DomesticPartialPlanner";
import { MarketingPage } from "@/components/MarketingPage";
import { marketingPages } from "@/content/marketing-pages";

export default function ManisaParsiyelTasimacilikPage() {
  return (
    <MarketingPage page={marketingPages["manisa-parsiyel-tasimacilik"]} childrenPlacement="after-sections">
      <DomesticPartialPlanner
        defaultSenderCity="Manisa"
        eyebrow="Manisa parsiyel teklif hazırlama"
        heading="Palet ve adres bilgileriyle hızlı teklif özeti hazırlayın"
        description="Manisa'daki açık yükleme adresini ve alıcının teslimat noktasını girin; her yük grubunun adet, ambalaj, ölçü, ağırlık ve istiflenebilirlik bilgisini ayrı ayrı belirtin. Özeti WhatsApp üzerinden REX Lojistik operasyon ekibine iletin."
        sectionId="manisa-parsiyel-teklif"
        submitLabel="Yük Bilgilerini Gönder – Teklif Al"
        whatsappIntro="Merhaba, Manisa çıkışlı parsiyel taşıma teklifi rica ederim."
      />
    </MarketingPage>
  );
}
