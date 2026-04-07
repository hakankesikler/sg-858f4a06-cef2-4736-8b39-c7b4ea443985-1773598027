import { SEO } from "@/components/SEO";
import AccountingModule from "@/components/modules/AccountingModule";

export default function RexPortal() {
  return (
    <>
      <SEO
        title="Muhasebe ve Finans - Rex Lojistik"
        description="Finansal yönetim ve raporlama sistemi"
      />

      <div className="min-h-screen bg-gray-50">
        <AccountingModule />
      </div>
    </>
  );
}