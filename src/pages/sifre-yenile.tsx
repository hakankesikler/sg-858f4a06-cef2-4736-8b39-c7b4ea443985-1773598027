import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function PasswordRecoveryGatePage() {
  const router = useRouter();
  const [recoveryToken, setRecoveryToken] = useState("");
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    const tokenHash = typeof router.query.token_hash === "string" ? router.query.token_hash : "";
    const type = typeof router.query.type === "string" ? router.query.type : "";
    const valid = Boolean(tokenHash && type === "recovery");
    setRecoveryToken(valid ? tokenHash : "");
    setInvalid(!valid);
  }, [router.isReady, router.query.token_hash, router.query.type]);

  const continueToPasswordSetup = async () => {
    if (!recoveryToken) return;
    await router.push(`/login?token_hash=${encodeURIComponent(recoveryToken)}&type=recovery`);
  };

  return (
    <>
      <SEO
        title="Güvenli Şifre Yenileme | REX TYS"
        description="REX Lojistik yetkili personel güvenli şifre yenileme adımı."
        noIndex
      />
      <main className="min-h-screen bg-gradient-to-br from-[#0b1530] via-[#17244b] to-[#222236] flex items-center justify-center p-4">
        <div className="w-full max-w-xl text-center">
          <div className="mx-auto mb-7 flex h-24 w-40 items-center justify-center rounded-3xl border border-white/20 bg-white shadow-2xl">
            <Image src="/rex-logo.png" alt="REX Lojistik" width={130} height={72} priority className="h-auto w-[130px]" />
          </div>

          <Card className="border-slate-200 bg-white p-7 text-left shadow-2xl md:p-10">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-[#d85f26]">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold text-slate-950 md:text-3xl">Güvenli şifre yenileme</h1>

            {invalid ? (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
                Bu bağlantı eksik veya geçersiz. Lütfen size gönderilen en yeni şifre yenileme e-postasını açın.
              </div>
            ) : (
              <>
                <p className="mt-3 leading-7 text-slate-600">
                  Şifre oluşturma sayfasına geçmek için aşağıdaki düğmeye basın. Güvenlik kodunuz yalnızca bu işlemden sonra kullanılacaktır.
                </p>
                <Button
                  type="button"
                  className="mt-7 h-12 w-full bg-[#d85f26] text-base hover:bg-[#bd4f1d]"
                  onClick={() => void continueToPasswordSetup()}
                >
                  Şifre Yenilemeye Devam Et <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </>
            )}
          </Card>

          <p className="mt-6 text-sm text-slate-300">Bu alan yalnızca REX Lojistik yetkili personeli içindir.</p>
        </div>
      </main>
    </>
  );
}
