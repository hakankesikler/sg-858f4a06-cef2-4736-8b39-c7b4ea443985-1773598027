import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { customerPortalService } from "@/services/customerPortalService";

export default function CustomerLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryMode(true);
        setPassword("");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error || !data.session) throw new Error("E-posta veya şifre hatalı.");

      const claim = typeof router.query.claim === "string" ? router.query.claim : "";
      if (claim) {
        try { await customerPortalService.claimInvite(claim); } catch { /* It may already be claimed by the signup trigger. */ }
      }

      const profile = await customerPortalService.getProfile();
      if (!profile) {
        await supabase.auth.signOut();
        throw new Error("Bu hesabın müşteri portalı erişimi bulunmuyor.");
      }
      toast({ title: "Giriş başarılı", description: `${profile.name} müşteri portalına hoş geldiniz.` });
      await router.replace("/musteri/sevkiyatlar");
    } catch (error: any) {
      toast({ title: "Giriş yapılamadı", description: error?.message || "Bilgilerinizi kontrol edin.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email.trim()) {
      toast({ title: "E-posta gerekli", description: "Önce hesabınıza ait e-posta adresini yazın." });
      return;
    }
    setResetting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/musteri-giris`,
    });
    setResetting(false);
    toast(error
      ? { title: "Bağlantı gönderilemedi", description: "E-posta adresinizi kontrol edin.", variant: "destructive" }
      : { title: "Şifre bağlantısı gönderildi", description: "E-posta kutunuzu kontrol edin." });
  };

  const handlePasswordUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8 || password !== confirmPassword) {
      toast({ title: "Şifreyi kontrol edin", description: "Şifre en az 8 karakter olmalı ve iki alan eşleşmelidir.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: "Şifre güncellenemedi", description: "Bağlantının süresi dolmuş olabilir.", variant: "destructive" });
      return;
    }
    setRecoveryMode(false);
    toast({ title: "Şifreniz yenilendi" });
    await router.replace("/musteri/sevkiyatlar");
  };

  return (
    <>
      <SEO title="Müşteri Girişi | REX Lojistik" description="REX Lojistik kurumsal müşteri sevkiyat takip portalı." noIndex />
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Link href="/" className="flex justify-center mb-6" aria-label="Ana sayfa">
            <div className="bg-white rounded-2xl p-3 shadow-xl">
              <Image src="/rex.png" alt="REX Lojistik" width={150} height={70} priority className="h-16 w-auto object-contain" />
            </div>
          </Link>
          <section className="bg-white rounded-3xl shadow-2xl p-7 sm:p-9">
            <p className="text-sm font-semibold text-blue-600 text-center uppercase tracking-wider">Kurumsal Müşteri Portalı</p>
            <h1 className="text-2xl font-bold text-slate-900 text-center mt-2">{recoveryMode ? "Yeni Şifre Oluştur" : "Sevkiyatlarınızı Takip Edin"}</h1>
            <p className="text-sm text-slate-500 text-center mt-2 mb-7">{recoveryMode ? "Hesabınız için güvenli bir şifre belirleyin." : "Size tanımlanan e-posta ve şifreyle giriş yapın."}</p>

            <form onSubmit={recoveryMode ? handlePasswordUpdate : handleLogin} className="space-y-4">
              {!recoveryMode && (
                <div>
                  <label htmlFor="customer-email" className="block text-sm font-medium text-slate-700 mb-1.5">E-posta</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input id="customer-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-11" required />
                  </div>
                </div>
              )}
              <div>
                <label htmlFor="customer-password" className="block text-sm font-medium text-slate-700 mb-1.5">{recoveryMode ? "Yeni Şifre" : "Şifre"}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input id="customer-password" type={showPassword ? "text" : "password"} autoComplete={recoveryMode ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 h-11" required />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" aria-label="Şifreyi göster veya gizle">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              {recoveryMode && (
                <div>
                  <label htmlFor="customer-confirm-password" className="block text-sm font-medium text-slate-700 mb-1.5">Yeni Şifre Tekrar</label>
                  <Input id="customer-confirm-password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-11" required />
                </div>
              )}
              {!recoveryMode && (
                <div className="text-right">
                  <button type="button" onClick={handleReset} disabled={resetting} className="text-sm font-medium text-blue-600 hover:text-blue-700">{resetting ? "Gönderiliyor..." : "Şifremi unuttum"}</button>
                </div>
              )}
              <Button type="submit" disabled={loading} className="w-full h-11 bg-blue-600 hover:bg-blue-700">{loading ? "İşlem yapılıyor..." : recoveryMode ? "Şifreyi Kaydet" : "Giriş Yap"}</Button>
            </form>
          </section>
          <p className="text-center text-sm text-slate-300 mt-5">Hesabınız yoksa REX Lojistik yetkilinizden davet bağlantısı isteyin.</p>
        </div>
      </main>
    </>
  );
}
