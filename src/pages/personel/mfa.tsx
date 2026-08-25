import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { KeyRound, Loader2, ShieldCheck, Smartphone } from "lucide-react";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserRole } from "@/lib/access-control";
import { getMfaState, recordSecurityEvent, safePortalRedirect } from "@/lib/security";
import { useToast } from "@/hooks/use-toast";

type Screen = "checking" | "enroll" | "verify" | "ready";

export default function StaffMfaPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [screen, setScreen] = useState<Screen>("checking");
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [working, setWorking] = useState(false);

  const redirect = safePortalRedirect(router.query.redirect);

  useEffect(() => {
    if (!router.isReady) return;
    let active = true;
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return router.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
      const role = await getCurrentUserRole(sessionData.session.user.id);
      if (!role) {
        await supabase.auth.signOut();
        return router.replace("/login");
      }
      try {
        const state = await getMfaState();
        if (!active) return;
        if (state.currentLevel === "aal2") {
          setScreen("ready");
        } else if (state.verifiedFactors[0]) {
          setFactorId(state.verifiedFactors[0].id);
          setScreen("verify");
        } else {
          setScreen("enroll");
        }
      } catch {
        toast({ title: "Güvenlik kontrolü yapılamadı", description: "Lütfen yeniden giriş yapın.", variant: "destructive" });
        await supabase.auth.signOut();
        await router.replace("/login");
      }
    };
    void load();
    return () => { active = false; };
  }, [router.isReady, redirect]);

  const beginEnrollment = async () => {
    setWorking(true);
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      for (const factor of factors?.totp || []) {
        if (factor.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: factor.id });
      }
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "REX Portal" });
      if (error || !data) throw error || new Error("MFA başlatılamadı");
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setScreen("verify");
    } catch {
      toast({ title: "Kurulum başlatılamadı", description: "Authenticator kurulumunu tekrar deneyin.", variant: "destructive" });
    } finally {
      setWorking(false);
    }
  };

  const verifyCode = async () => {
    if (!factorId || !/^\d{6}$/.test(code)) {
      return toast({ title: "Altı haneli kodu girin", variant: "destructive" });
    }
    setWorking(true);
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError || !challenge) throw challengeError || new Error("Doğrulama başlatılamadı");
      const { error: verifyError } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code });
      if (verifyError) throw verifyError;
      await recordSecurityEvent(qrCode ? "mfa_enrolled" : "mfa_verified", qrCode ? "Authenticator uygulaması etkinleştirildi." : "İki aşamalı giriş doğrulandı.");
      await recordSecurityEvent("login_success", "Personel portalına MFA doğrulamasıyla giriş yapıldı.", { aal: "aal2" });
      toast({ title: "Güvenli giriş tamamlandı" });
      await router.replace(redirect);
    } catch {
      setCode("");
      toast({ title: "Kod doğrulanamadı", description: "Authenticator uygulamasındaki güncel kodu tekrar girin.", variant: "destructive" });
    } finally {
      setWorking(false);
    }
  };

  return (
    <>
      <SEO title="Güvenli Giriş - REX Portal" description="REX Portal iki aşamalı doğrulama ekranı." noIndex />
      <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-7 sm:p-9 rounded-3xl">
          <div className="flex justify-center mb-5"><Image src="/rex.png" alt="REX Lojistik" width={138} height={64} className="h-14 w-auto object-contain" /></div>
          <div className="text-center mb-7">
            <span className="inline-flex rounded-full bg-blue-100 p-3 text-blue-700"><ShieldCheck className="w-7 h-7" /></span>
            <h1 className="text-2xl font-bold mt-3">İki Aşamalı Doğrulama</h1>
            <p className="text-sm text-slate-600 mt-2">Hesabınızı şifrenize ek olarak telefonunuzdaki tek kullanımlık kodla koruyun.</p>
          </div>

          {screen === "checking" && <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}

          {screen === "enroll" && <div className="space-y-5">
            <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-700 space-y-2">
              <p className="font-semibold flex items-center gap-2"><Smartphone className="w-4 h-4" />Microsoft veya Google Authenticator kullanabilirsiniz.</p>
              <p>Kurulumu başlattığınızda ekrandaki QR kodunu telefonunuzla tarayın.</p>
            </div>
            <Button className="w-full" onClick={() => void beginEnrollment()} disabled={working}>{working ? "Başlatılıyor..." : "Authenticator Kurulumunu Başlat"}</Button>
          </div>}

          {screen === "verify" && <div className="space-y-5">
            {qrCode && <div className="text-center space-y-3">
              <img src={qrCode} alt="REX Portal Authenticator QR kodu" className="w-48 h-48 mx-auto rounded-xl border bg-white p-2" />
              <p className="text-xs text-slate-500">QR kodu tarayamıyorsanız kurulum anahtarı:</p>
              <code className="block break-all rounded-lg bg-slate-100 p-2 text-xs">{secret}</code>
            </div>}
            {!qrCode && <p className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">Authenticator uygulamanızdaki güncel altı haneli kodu girin.</p>}
            <div>
              <label htmlFor="mfa-code" className="text-sm font-medium">Doğrulama kodu</label>
              <div className="relative mt-1.5"><KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><Input id="mfa-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} className="pl-10 text-center tracking-[0.35em] text-lg" /></div>
            </div>
            <Button className="w-full" onClick={() => void verifyCode()} disabled={working || code.length !== 6}>{working ? "Doğrulanıyor..." : "Doğrula ve Devam Et"}</Button>
          </div>}

          {screen === "ready" && <div className="space-y-4 text-center"><p className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-900">Bu oturum iki aşamalı olarak doğrulandı.</p><Button className="w-full" onClick={() => void router.replace(redirect)}>Portala Devam Et</Button></div>}
        </Card>
      </main>
    </>
  );
}
