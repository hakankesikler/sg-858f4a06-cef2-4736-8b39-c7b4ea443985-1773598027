import { MarketingPage } from "@/components/MarketingPage";
import { ExpressQuotePlanner } from "@/components/ExpressQuotePlanner";
import { marketingPages } from "@/content/marketing-pages";

export default function ExpressKargoPage() {
  return (
    <MarketingPage page={{
        ...marketingPages["express-kargo"],
        seoTitle: "Uluslararası Express Kargo | Yurtdışı Kargo | REX",
        seoDescription: "Türkiye'den 220'den fazla ülke ve bölgeye uluslararası express kargo çözümleri. Adresten alım, ithalat ve ihracat gönderileri için hızlı teklif alın.",
      }}>
      <ExpressQuotePlanner />
    </MarketingPage>
  );
}
