import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { Lock, Mail } from "lucide-react";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { customerPortalService } from "@/services/customerPortalService";

export default function CustomerRegistrationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const token = typeof router.query.token === "string" ? router.query.token : "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailConfirmation, setEmailConfirmation] = useState(false);

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    if (password.length < 8 || password !== confirmPassword) {
      toast({ title: "Şifreyi kontrol edin", description: "Şifre en az 8 karakter olmalı ve iki alan eşleşmelidir.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/musteri-giris`,
          data: { rex_customer_invite_token: token },
        },
      });
      if (error) throw error;

      if (data.session) {
        const profile = await customerPortalService.getProfile();
        if (!profile) await customerPortalService.claimInvite(token);
        toast({ title: "Hesabınız hazır", description: "Müşteri portalına yönlendiriliyorsunuz." });
        await router.replace("/musteri/sevkiyatlar");
      } else {
        setEmailConfirmation(true);
      }
    } catch (error: any) {
      toast({ title: "Hesap oluşturulamadı", description: error?.message || "Davet bağlantısını ve e-posta adresini kontrol edin.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Müşteri Hesabı Oluştur | REX Lojistik" description="REX Lojistik müşteri portalı güvenli hesap oluşturma." noIndex />
      <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl p-7 sm:p-9">
            <div className="flex justify-center mb-5"><Image src="/rex.png" alt="REX Lojistik" width={150} height={70} className="h-16 w-auto object-contain" /></div>
            <h1 className="text-2xl font-bold text-slate-900 text-center">Kurumsal Hesabınızı Oluşturun</h1>
            <p className="text-sm text-slate-500 text-center mt-2 mb-7">Bu hesapla yalnızca şirketinize ait sevkiyatları görebilirsiniz.</p>

            {!router.isReady ? <p className="text-center">Bağlantı kontrol ediliyor...</p> : !token ? (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-800">Bu davet bağlantısı eksik veya geçersiz. REX Lojistik yetkilinizden yeni bağlantı isteyin.</div>
            ) : emailConfirmation ? (
              <div className="space-y-5 text-center">
                <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-800">Hesabınız oluşturuldu. E-posta adresinize gönderilen doğrulama bağlantısına tıklayın, ardından giriş yapın.</div>
                <Link href={`/musteri-giris?claim=${encodeURIComponent(token)}`} className="inline-flex text-blue-600 font-semibold hover:underline">Müşteri girişine git</Link>
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label htmlFor="register-email" className="block text-sm font-medium text-slate-700 mb-1.5">Davet edilen e-posta</label>
                  <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" /><Input id="register-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-11" required /></div>
                </div>
                <div>
                  <label htmlFor="register-password" className="block text-sm font-medium text-slate-700 mb-1.5">Şifre</label>
                  <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" /><Input id="register-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 h-11" minLength={8} required /></div>
                </div>
                <div><label htmlFor="register-confirm" className="block text-sm font-medium text-slate-700 mb-1.5">Şifre Tekrar</label><Input id="register-confirm" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-11" minLength={8} required /></div>
                <Button type="submit" disabled={loading} className="w-full h-11 bg-blue-600 hover:bg-blue-700">{loading ? "Hesap oluşturuluyor..." : "Hesabımı Oluştur"}</Button>
              </form>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
