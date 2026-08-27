import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TurnstileWidget, turnstileSiteKey } from "@/components/security/TurnstileWidget";
import { Eye, EyeOff, Mail, Lock, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserRole } from "@/lib/access-control";
import {
  getMfaState,
  passwordPolicyError,
  recordSecurityEvent,
  roleRequiresMfa,
  safePortalRedirect,
  startStaffSessionClock,
} from "@/lib/security";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoverySessionReady, setRecoverySessionReady] = useState(false);
  const [recoveryMfaRequired, setRecoveryMfaRequired] = useState(false);
  const [recoveryMfaFactorId, setRecoveryMfaFactorId] = useState("");
  const [recoveryMfaCode, setRecoveryMfaCode] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const recoveryPreparationRef = useRef("");

  useEffect(() => {
    if (!router.isReady) return;

    let active = true;
    const prepareRecoverySession = async () => {
      const tokenHash = typeof router.query.token_hash === "string" ? router.query.token_hash : "";
      const recoveryCode = typeof router.query.code === "string" ? router.query.code : "";
      const recoveryType = typeof router.query.type === "string" ? router.query.type : "";
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const hashType = hash.get("type") || "";
      const accessToken = hash.get("access_token") || "";
      const refreshToken = hash.get("refresh_token") || "";

      if (hash.get("error_code") === "otp_expired") {
        toast({
          title: "Bağlantının süresi dolmuş",
          description: "Gelen kutunuzdaki en yeni bağlantıyı kullanın veya yeni bir şifre yenileme bağlantısı isteyin.",
          variant: "destructive",
        });
        window.history.replaceState({}, "", "/login");
        return;
      }

      const hasTokenHash = Boolean(tokenHash && recoveryType === "recovery");
      const hasPkceCode = Boolean(recoveryCode && (!recoveryType || recoveryType === "recovery"));
      const hasImplicitTokens = Boolean(accessToken && refreshToken && (!hashType || hashType === "recovery"));
      if (!hasTokenHash && !hasPkceCode && !hasImplicitTokens) return;

      const recoveryCredential = hasTokenHash
        ? `token:${tokenHash}`
        : hasPkceCode
          ? `code:${recoveryCode}`
          : `implicit:${accessToken}`;
      if (recoveryPreparationRef.current === recoveryCredential) return;
      recoveryPreparationRef.current = recoveryCredential;

      setRecoveryMode(true);
      setRecoverySessionReady(false);
      setRecoveryMfaRequired(false);
      setRecoveryMfaFactorId("");
      setRecoveryMfaCode("");
      setPassword("");
      setConfirmPassword("");

      // Bağlantıda açık bir kurtarma bilgisi varsa önce onu doğrula. Tarayıcıda
      // kalan eski bir oturumun yeni şifre bağlantısının önüne geçmesine izin verme.
      let recoverySession = null;
      if (hasTokenHash) {
        const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
        if (!error) recoverySession = data.session;
      } else if (hasPkceCode) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(recoveryCode);
        if (!error) recoverySession = data.session;
      } else if (hasImplicitTokens) {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (!error) recoverySession = data.session;
      }

      if (!active) return;
      window.history.replaceState({}, "", "/login");

      if (!recoverySession) {
        recoveryPreparationRef.current = "";
        setRecoveryMode(false);
        toast({
          title: "Bağlantı geçersiz",
          description: "Bu bağlantı kullanılmış veya geçersiz. Lütfen yeni bir şifre yenileme bağlantısı isteyin.",
          variant: "destructive",
        });
        return;
      }

      try {
        const mfa = await getMfaState();
        if (!active) return;
        if (mfa.nextLevel === "aal2" && mfa.currentLevel !== "aal2") {
          const factor = mfa.verifiedFactors[0];
          if (!factor) throw new Error("Doğrulanmış Authenticator bulunamadı");
          setRecoveryMfaFactorId(factor.id);
          setRecoveryMfaRequired(true);
        }
        setRecoverySessionReady(true);
      } catch {
        if (!active) return;
        setRecoveryMode(false);
        toast({
          title: "Güvenlik doğrulaması hazırlanamadı",
          description: "Hesabın iki aşamalı doğrulama bilgisi okunamadı. Lütfen yeniden deneyin.",
          variant: "destructive",
        });
      }
    };

    void prepareRecoverySession();
    return () => { active = false; };
  }, [router.isReady, router.query.code, router.query.token_hash, router.query.type, toast]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryMode(true);
        setPassword("");
        setConfirmPassword("");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      toast({ title: "Eksik bilgi", description: "E-posta ve şifrenizi girin.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
        options: turnstileSiteKey ? { captchaToken } : undefined,
      });

      if (error || !data.session) {
        toast({ title: "Giriş başarısız", description: "E-posta veya şifre hatalı.", variant: "destructive" });
        return;
      }

      const role = await getCurrentUserRole(data.session.user.id);
      if (!role) {
        await supabase.auth.signOut();
        toast({
          title: "Erişim yetkiniz yok",
          description: "Portal erişimi için yöneticinizin hesabınıza rol tanımlaması gerekiyor.",
          variant: "destructive",
        });
        return;
      }

      if (data.session.user.user_metadata?.must_change_password === true) {
        startStaffSessionClock();
        toast({ title: "Şifre değişikliği gerekli", description: "İlk girişinizde geçici şifrenizi yenilemelisiniz." });
        await router.push("/personel/sifre-olustur");
        return;
      }

      const redirect = safePortalRedirect(router.query.redirect);
      const mfa = await getMfaState();
      const needsMfa = roleRequiresMfa(role) || mfa.nextLevel === "aal2";
      if (needsMfa && mfa.currentLevel !== "aal2") {
        startStaffSessionClock();
        await router.push(`/personel/mfa?redirect=${encodeURIComponent(redirect)}`);
        return;
      }

      startStaffSessionClock();
      await recordSecurityEvent("login_success", "Personel portalına giriş yapıldı.", { aal: mfa.currentLevel });
      toast({ title: "Giriş başarılı", description: "REX TYS'ye hoş geldiniz." });
      await router.push(redirect);
    } catch {
      toast({ title: "Giriş başarısız", description: "Lütfen daha sonra tekrar deneyin.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      toast({ title: "E-posta gerekli", description: "Önce e-posta adresinizi yazın." });
      return;
    }
    if (turnstileSiteKey && !captchaToken) {
      toast({ title: "Güvenlik doğrulaması gerekli", description: "Önce güvenlik doğrulamasını tamamlayın." });
      return;
    }

    setResetting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/login`,
      captchaToken: turnstileSiteKey ? captchaToken : undefined,
    });
    setResetting(false);

    if (error) {
      toast({ title: "İşlem tamamlanamadı", description: "Güvenlik doğrulamasını yenileyip tekrar deneyin.", variant: "destructive" });
      return;
    }

    toast({ title: "Bağlantı gönderildi", description: "Şifre yenileme bağlantısı e-posta adresinize gönderildi." });
  };

  const handleUpdatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    const policyError = passwordPolicyError(password);
    if (policyError) {
      toast({ title: "Şifre yeterince güçlü değil", description: policyError, variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Şifreler eşleşmiyor", description: "İki alana aynı şifreyi yazın.", variant: "destructive" });
      return;
    }

    setLoading(true);
    const recoverySession = recoverySessionReady
      ? (await supabase.auth.getSession()).data.session
      : null;

    if (!recoverySession) {
      setRecoveryMode(false);
      setLoading(false);
      toast({
        title: "Bağlantı geçersiz",
        description: "Güvenli şifre yenileme oturumu kurulamadı. Lütfen yeni bir bağlantı isteyin ve yalnızca en son gelen e-postayı kullanın.",
        variant: "destructive",
      });
      return;
    }

    if (recoveryMfaRequired) {
      if (!recoveryMfaFactorId || !/^\d{6}$/.test(recoveryMfaCode)) {
        setLoading(false);
        toast({ title: "Altı haneli kodu girin", description: "Microsoft Authenticator uygulamasındaki güncel kodu yazın.", variant: "destructive" });
        return;
      }
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: recoveryMfaFactorId });
      if (challengeError || !challenge) {
        setLoading(false);
        toast({ title: "Doğrulama başlatılamadı", description: "Authenticator kodunu yenileyip tekrar deneyin.", variant: "destructive" });
        return;
      }
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: recoveryMfaFactorId,
        challengeId: challenge.id,
        code: recoveryMfaCode,
      });
      if (verifyError) {
        setRecoveryMfaCode("");
        setLoading(false);
        toast({ title: "Kod doğrulanamadı", description: "Microsoft Authenticator uygulamasındaki yeni altı haneli kodu deneyin.", variant: "destructive" });
        return;
      }
      setRecoveryMfaRequired(false);
    }

    const { data: verifiedUser, error: verifiedUserError } = await supabase.auth.getUser();
    if (verifiedUserError || !verifiedUser.user) {
      setLoading(false);
      toast({
        title: "Güvenli oturum doğrulanamadı",
        description: "Lütfen yeni bir şifre yenileme bağlantısı isteyin ve yalnızca en son gelen bağlantıyı açın.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      const message = error.message.toLocaleLowerCase("tr-TR");
      const description = error.code === "same_password" || message.includes("different from the old password")
        ? "Yeni şifreniz önceki şifrenizden farklı olmalıdır."
        : error.code === "weak_password" || message.includes("weak")
          ? "Şifreniz en az bir büyük harf, bir küçük harf ve bir rakam içermelidir."
          : error.code === "insufficient_aal" || message.includes("aal2")
            ? "Şifreyi değiştirmek için Microsoft Authenticator kodunu yeniden doğrulayın."
          : message.includes("session") || message.includes("jwt")
            ? "Güvenli oturum sona ermiş. Lütfen yeni bir şifre yenileme bağlantısı isteyin."
            : "Şifre kaydedilemedi. Lütfen farklı bir şifre deneyin veya yeni bağlantı isteyin.";
      setLoading(false);
      toast({ title: "Şifre güncellenemedi", description, variant: "destructive" });
      return;
    }

    await recordSecurityEvent("password_changed", "Personel şifresi yenileme bağlantısıyla değiştirildi.");
    await supabase.auth.signOut();
    setRecoverySessionReady(false);
    setRecoveryMfaRequired(false);
    setRecoveryMfaFactorId("");
    setRecoveryMfaCode("");
    setRecoveryMode(false);
    setPassword("");
    setConfirmPassword("");
    setLoading(false);
    toast({ title: "Şifre oluşturuldu", description: "Yeni şifrenizle giriş yapabilirsiniz." });
    await router.replace("/login");
  };

  return (
    <>
      <SEO title="REX TYS Giriş | Taşıma Yönetim Sistemi" description="REX Lojistik yetkili personel taşıma yönetim sistemi girişi." noIndex />
      <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center px-4 py-8">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="relative w-full max-w-md">
          <Link href="/" className="flex justify-center mb-6" aria-label="REX Lojistik ana sayfası">
            <div className="bg-white rounded-2xl px-6 py-3 shadow-xl ring-1 ring-white/20">
              <Image src="/rex.png" alt="REX Lojistik" width={170} height={78} priority className="h-16 w-auto object-contain" />
            </div>
          </Link>

          <section className="bg-white rounded-3xl shadow-2xl border border-white/60 p-7 sm:p-9">
            <div className="flex justify-center mb-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-orange-700">
                <ShieldCheck className="h-4 w-4" /> Yetkili Personel
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center">
              {recoveryMode ? "Yeni Şifre Oluştur" : "Taşıma Yönetim Sistemi"}
            </h1>
            <p className="text-sm text-slate-500 text-center mt-2 mb-7">
              {recoveryMode
                ? "Hesabınız için en az 6 karakterli, önceki şifrenizden farklı bir şifre belirleyin."
                : "REX TYS'ye güvenli giriş yapın."}
            </p>

            <div className="space-y-6">
              {recoveryMode ? (
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div>
                    <label htmlFor="new-password" className="block text-sm font-medium text-slate-700 mb-1.5">Yeni Şifre</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input id="new-password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="pl-10 pr-10 h-11" disabled={loading} />
                      <button type="button" aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"} onClick={() => setShowPassword((value) => !value)} className="absolute inset-y-0 right-0 px-3 flex items-center" disabled={loading}>
                        {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700 mb-1.5">Yeni Şifre Tekrar</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input id="confirm-password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="pl-10 h-11" disabled={loading} />
                    </div>
                  </div>
                  {recoveryMfaRequired && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
                      <p className="text-sm text-blue-900">Hesabınız iki aşamalı doğrulamayla korunuyor. Microsoft Authenticator uygulamasındaki güncel altı haneli kodu girin.</p>
                      <div>
                        <label htmlFor="recovery-mfa-code" className="block text-sm font-medium text-slate-700 mb-1.5">Authenticator Kodu</label>
                        <Input
                          id="recovery-mfa-code"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={6}
                          value={recoveryMfaCode}
                          onChange={(event) => setRecoveryMfaCode(event.target.value.replace(/\D/g, ""))}
                          className="h-11 text-center text-lg tracking-[0.35em]"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  )}
                  <Button type="submit" className="w-full h-11 bg-orange-600 hover:bg-orange-700 shadow-md" disabled={loading || !recoverySessionReady}>
                    {!recoverySessionReady ? "Güvenli bağlantı doğrulanıyor..." : loading ? "Kaydediliyor..." : "Şifreyi Kaydet"}
                  </Button>
                </form>
              ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">E-posta</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input id="email" type="email" autoComplete="email" placeholder="ornek@email.com" value={email} onChange={(event) => setEmail(event.target.value)} className="pl-10 h-11" disabled={loading} />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">Şifre</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} className="pl-10 pr-10 h-11" disabled={loading} />
                    <button type="button" aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"} onClick={() => setShowPassword((value) => !value)} className="absolute inset-y-0 right-0 px-3 flex items-center" disabled={loading}>
                      {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <button type="button" onClick={handlePasswordReset} className="text-sm text-blue-600 hover:text-blue-700 font-semibold" disabled={loading || resetting}>
                    {resetting ? "Gönderiliyor..." : "Şifremi unuttum"}
                  </button>
                </div>

                <TurnstileWidget onToken={setCaptchaToken} />

                <Button type="submit" className="w-full h-11 bg-orange-600 hover:bg-orange-700 shadow-md" disabled={loading || Boolean(turnstileSiteKey && !captchaToken)}>
                  {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
                </Button>
              </form>
              )}
            </div>
          </section>

          <div className="mt-5 text-center text-sm text-slate-300 space-y-1">
            <p>Bu alan yalnızca REX Lojistik yetkili personeli içindir.</p>
            <p>© 2026 REX Lojistik. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </main>
    </>
  );
}
