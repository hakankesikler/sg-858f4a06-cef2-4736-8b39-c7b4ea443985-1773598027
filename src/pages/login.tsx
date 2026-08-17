import { useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserRole } from "@/lib/access-control";
import { useToast } from "@/hooks/use-toast";

function safeRedirect(value: unknown) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/personel/profil";
}

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

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

      toast({ title: "Giriş başarılı", description: "Rex Portal'a hoş geldiniz." });
      await router.push(safeRedirect(router.query.redirect));
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

    setResetting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/login`,
    });
    setResetting(false);

    if (error) {
      toast({ title: "İşlem tamamlanamadı", description: "Lütfen e-posta adresinizi kontrol edin.", variant: "destructive" });
      return;
    }

    toast({ title: "Bağlantı gönderildi", description: "Şifre yenileme bağlantısı e-posta adresinize gönderildi." });
  };

  return (
    <>
      <SEO title="Giriş Yap - Rex Portal" description="Rex Lojistik yetkili personel portalı." />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg mb-4">
              <span className="text-white font-bold text-3xl">RL</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Rex Portal</h1>
            <p className="text-gray-600">Lojistik Yönetim Sistemi</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-center mb-6">
                <Image src="/rex-logo.png" alt="Rex Lojistik" width={180} height={60} priority />
              </div>
              <CardTitle className="text-2xl text-center">REX Portal Giriş</CardTitle>
              <CardDescription className="text-center">Yalnızca yetkili personel giriş yapabilir</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">E-posta</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input id="email" type="email" autoComplete="email" placeholder="ornek@email.com" value={email} onChange={(event) => setEmail(event.target.value)} className="pl-10" disabled={loading} />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Şifre</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} className="pl-10 pr-10" disabled={loading} />
                    <button type="button" aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"} onClick={() => setShowPassword((value) => !value)} className="absolute inset-y-0 right-0 px-3 flex items-center" disabled={loading}>
                      {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <button type="button" onClick={handlePasswordReset} className="text-sm text-blue-600 hover:text-blue-700 font-medium" disabled={loading || resetting}>
                    {resetting ? "Gönderiliyor..." : "Şifremi unuttum"}
                  </button>
                </div>

                <Button type="submit" className="w-full bg-[#E94E1B] hover:bg-[#d4451a]" disabled={loading}>
                  {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
                </Button>
              </form>
            </CardContent>
          </div>

          <p className="mt-8 text-center text-sm text-gray-500">© 2026 Rex Lojistik. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </>
  );
}
