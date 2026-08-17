import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Hata",
        description: "Lütfen tüm alanları doldurun",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // Kayıt işlemi
        console.log("📝 Sign up attempt:", email);
        
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
        });

        console.log("📊 Sign up response:", { data, error });

        if (error) {
          console.error("❌ Sign up error:", error);
          toast({
            title: "Kayıt Başarısız",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Hesap Oluşturuldu",
          description: "Giriş yapabilirsiniz!",
        });
        setIsSignUp(false);
        
      } else {
        // Giriş işlemi
        console.log("🔐 Login attempt:", email);
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        console.log("📊 Login response:", { data, error });

        if (error) {
          console.error("❌ Login error:", error);
          
          let errorMessage = "Giriş yapılamadı";
          
          if (error.message.includes("Invalid login credentials")) {
            errorMessage = "E-posta veya şifre hatalı";
          } else if (error.message.includes("Email not confirmed")) {
            errorMessage = "E-posta adresiniz doğrulanmamış. Lütfen e-postanızdaki doğrulama linkine tıklayın.";
          } else if (error.message.includes("Invalid")) {
            errorMessage = "Geçersiz giriş bilgileri";
          } else {
            errorMessage = error.message;
          }
          
          toast({
            title: "Giriş Başarısız",
            description: errorMessage,
            variant: "destructive",
          });
          return;
        }

        if (data?.session) {
          console.log("✅ Login successful! Session:", data.session.user.email);
          
          if (rememberMe) {
            localStorage.setItem("rememberMe", "true");
          }

          toast({
            title: "Giriş Başarılı",
            description: "Hoş geldiniz!",
          });

          const redirectUrl = router.query.redirect as string || "/personel/profil";
          console.log("🔄 Redirecting to:", redirectUrl);
          router.push(redirectUrl);
        } else {
          console.warn("⚠️ No session returned");
          toast({
            title: "Hata",
            description: "Oturum oluşturulamadı. Lütfen tekrar deneyin.",
            variant: "destructive",
          });
        }
      }
    } catch (err: any) {
      console.error("💥 Unexpected error:", err);
      toast({
        title: "Beklenmeyen Hata",
        description: err.message || "Bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Giriş Yap - Rex Portal"
        description="Rex Portal'a giriş yapın ve tüm modüllere erişim sağlayın."
      />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg mb-4">
              <span className="text-white font-bold text-3xl">RL</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Rex Portal</h1>
            <p className="text-gray-600">Lojistik Yönetim Sistemi</p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-center mb-6">
                <Image
                  src="/rex-logo.png"
                  alt="Rex Lojistik"
                  width={180}
                  height={60}
                  priority
                />
              </div>
              <CardTitle className="text-2xl text-center">
                {isSignUp ? "Hesap Oluştur" : "REX Portal Giriş"}
              </CardTitle>
              <CardDescription className="text-center">
                {isSignUp 
                  ? "Yeni hesap oluşturmak için bilgilerinizi girin"
                  : "Devam etmek için lütfen giriş yapın"}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Input */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    E-posta
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      placeholder="ornek@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Şifre
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={loading}
                    />
                    <span className="ml-2 text-sm text-gray-600">Beni Hatırla</span>
                  </label>
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    disabled={loading}
                  >
                    Şifremi Unuttum
                  </button>
                </div>

                {/* Login Button */}
                <Button
                  type="submit"
                  className="w-full bg-[#E94E1B] hover:bg-[#d4451a]"
                  disabled={loading}
                >
                  {loading 
                    ? (isSignUp ? "Hesap oluşturuluyor..." : "Giriş yapılıyor...") 
                    : (isSignUp ? "Hesap Oluştur" : "Giriş Yap")}
                </Button>

                <div className="text-center text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                    }}
                    className="text-[#E94E1B] hover:underline"
                  >
                    {isSignUp 
                      ? "Zaten hesabınız var mı? Giriş yapın" 
                      : "Hesabınız yok mu? Kayıt olun"}
                  </button>
                </div>
              </form>
            </CardContent>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-gray-500">
            © 2026 Rex Lojistik. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </>
  );
}