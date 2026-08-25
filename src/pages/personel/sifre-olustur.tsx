import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { CheckCircle2, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { clearStaffSessionClock, passwordPolicyError, recordSecurityEvent } from "@/lib/security";

export default function StaffPasswordSetupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setReady(Boolean(data.session));
      setChecking(false);
    };
    void check();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setReady(Boolean(session));
      setChecking(false);
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const policyError = passwordPolicyError(password);
    if (policyError) return toast({ title: "Şifre yeterince güçlü değil", description: policyError, variant: "destructive" });
    if (password !== confirmation) return toast({ title: "Şifreler eşleşmiyor", variant: "destructive" });
    try {
      setSaving(true);
      const { data: current } = await supabase.auth.getUser();
      const { error } = await supabase.auth.updateUser({
        password,
        data: { ...(current.user?.user_metadata || {}), must_change_password: false },
      });
      if (error) throw error;
      await recordSecurityEvent("password_changed", "Personel ilk girişinde geçici şifresini değiştirdi.");
      await supabase.auth.signOut();
      clearStaffSessionClock();
      toast({ title: "Şifreniz oluşturuldu", description: "Artık personel portalına giriş yapabilirsiniz." });
      await router.replace("/login");
    } catch (error: any) {
      toast({ title: "Şifre kaydedilemedi", description: error.message || "Davet bağlantısının süresi dolmuş olabilir.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SEO title="Personel Hesabı Oluştur - REX Portal" description="REX Lojistik güvenli personel hesabı kurulumu" noIndex />
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg p-7 md:p-9 shadow-2xl border-slate-200">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-5"><LockKeyhole className="w-7 h-7" /></div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-950">Personel hesabınızı oluşturun</h1>
          <p className="text-slate-600 mt-2">Davetiniz doğrulandıktan sonra yalnızca size ait güçlü bir şifre belirleyin.</p>

          {checking ? <div className="py-12 text-center text-slate-500">Davet bağlantısı doğrulanıyor...</div> : !ready ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
              Bu davet bağlantısı geçersiz veya süresi dolmuş. Yöneticinizden yeni davet istemelisiniz.
            </div>
          ) : (
            <form className="space-y-5 mt-7" onSubmit={submit}>
              <div><Label htmlFor="password">Yeni Şifre</Label><div className="relative"><Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" className="pr-11" /><button type="button" aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button></div></div>
              <div><Label htmlFor="confirmation">Yeni Şifre Tekrarı</Label><Input id="confirmation" type={showPassword ? "text" : "password"} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" /></div>
              <div className="rounded-xl bg-slate-50 border p-4 text-sm text-slate-600 space-y-1"><p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" />En az 12 karakter</p><p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" />Büyük harf, küçük harf ve rakam</p><p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" />Başka hesaplarda kullanmadığınız bir şifre</p></div>
              <Button type="submit" className="w-full h-11" disabled={saving}>{saving ? "Kaydediliyor..." : "Şifremi Oluştur"}</Button>
            </form>
          )}
        </Card>
      </main>
    </>
  );
}
