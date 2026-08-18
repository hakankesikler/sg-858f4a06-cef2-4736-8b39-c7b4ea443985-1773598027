import { useRouter } from "next/router";
import { IsGirisForm } from "@/components/IsGirisForm";
import { SEO } from "@/components/SEO";

export default function IsGirisPage() {
  const router = useRouter();
  const close = () => void router.push("/personel/profil?module=logistics");

  return (
    <>
      <SEO title="Yeni İş Girişi | REX Portal" description="Yeni taşıma işi oluştur" />
      <main className="min-h-screen bg-slate-100" />
      <IsGirisForm isOpen onClose={close} />
    </>
  );
}
