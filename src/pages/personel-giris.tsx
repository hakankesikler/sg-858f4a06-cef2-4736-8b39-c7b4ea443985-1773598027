import { useState } from "react";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Lock, User, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PersonelGiris() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Simulated login - Replace with real authentication
    setTimeout(() => {
      setIsLoading(false);
      if (email === "demo@rexlojistik.com" && password === "demo123") {
        alert("Giriş başarılı! (Demo mode)");
        // Redirect to dashboard would go here
      } else {
        setError("E-posta veya şifre hatalı. Lütfen tekrar deneyin.");
      }
    }, 1500);
  };

  return (
    <>
      <SEO 
        title="Personel Girişi | Rex Lojistik"
        description="Rex Lojistik personel portal girişi. Çalışanlar için özel erişim alanı."
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

        <div className="w-full max-w-md relative z-10">
          {/* Back to Home Link */}
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-orange-500 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Ana Sayfaya Dön
          </Link>

          <Card className="shadow-2xl border-0">
            <CardHeader className="space-y-3 text-center pb-8">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-orange-500 rounded-2xl flex items-center justify-center mb-2">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
                Personel Girişi
              </CardTitle>
              <CardDescription className="text-base">
                Rex Lojistik Personel Portalı
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Input */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    E-posta Adresi
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="ornek@rexlojistik.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-11 h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Şifre
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-11 pr-11 h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-gray-600">Beni Hatırla</span>
                  </label>
                  <button
                    type="button"
                    className="text-orange-500 hover:text-orange-600 font-medium transition-colors"
                  >
                    Şifremi Unuttum
                  </button>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white font-semibold text-base shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Giriş Yapılıyor...
                    </div>
                  ) : (
                    "Giriş Yap"
                  )}
                </Button>
              </form>

              {/* Demo Credentials Info */}
              <div className="pt-6 border-t border-gray-100">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <p className="text-xs text-blue-900 font-semibold mb-2">
                    Demo Giriş Bilgileri:
                  </p>
                  <p className="text-xs text-blue-700">
                    E-posta: <code className="bg-white px-2 py-1 rounded">demo@rexlojistik.com</code>
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Şifre: <code className="bg-white px-2 py-1 rounded">demo123</code>
                  </p>
                </div>
              </div>

              {/* Help Text */}
              <p className="text-center text-xs text-gray-500">
                Giriş yaparken sorun mu yaşıyorsunuz?{" "}
                <a href="tel:+905434010755" className="text-orange-500 hover:text-orange-600 font-medium">
                  IT Destek: 0543 401 07 55
                </a>
              </p>
            </CardContent>
          </Card>

          {/* Footer Note */}
          <p className="text-center text-xs text-gray-500 mt-6">
            © 2026 Rex Lojistik. Tüm hakları saklıdır.
          </p>
        </div>
      </div>

      <style jsx>{`
        .bg-grid-pattern {
          background-image: 
            linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
    </>
  );
}