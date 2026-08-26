import React from "react"
import Head from "next/head"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, Search, Package } from "lucide-react"

export default function NotFound() {
  return (
    <>
      <Head>
        <title>404 - Sayfa Bulunamadı | Rex Lojistik</title>
        <meta name="description" content="Aradığınız sayfa bulunamadı. Rex Lojistik ana sayfasına dönün." />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="icon" type="image/png" href="/rex-favicon.png?v=1" />
      </Head>
      
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full text-center space-y-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img 
              src="/rex-logo.png" 
              alt="Rex Lojistik" 
              className="h-16 w-auto"
            />
          </div>

          {/* Error Message */}
          <div className="space-y-4">
            <h1 className="text-8xl font-bold text-[#D84315] mb-4">404</h1>
            <h2 className="text-3xl font-semibold text-slate-900 mb-2">
              Sayfa Bulunamadı
            </h2>
            <p className="text-lg text-slate-600 max-w-md mx-auto">
              Aradığınız sayfa taşınmış, silinmiş veya hiç var olmamış olabilir.
            </p>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mt-12">
            <Link href="/" className="group">
              <div className="p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-slate-200">
                <Home className="h-8 w-8 text-[#D84315] mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-slate-900 mb-1">Ana Sayfa</h3>
                <p className="text-sm text-slate-600">Rex Lojistik'e dönün</p>
              </div>
            </Link>

            <Link href="/#hizmetler" className="group">
              <div className="p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-slate-200">
                <Package className="h-8 w-8 text-[#D84315] mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-slate-900 mb-1">Hizmetlerimiz</h3>
                <p className="text-sm text-slate-600">Lojistik çözümlerimiz</p>
              </div>
            </Link>

            <Link href="/#kargo-takip" className="group">
              <div className="p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-slate-200">
                <Search className="h-8 w-8 text-[#D84315] mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-slate-900 mb-1">Kargo Takip</h3>
                <p className="text-sm text-slate-600">Gönderinizi takip edin</p>
              </div>
            </Link>
          </div>

          {/* CTA Button */}
          <div className="pt-8">
            <Button asChild size="lg" className="bg-[#D84315] hover:bg-[#BF360C] text-white px-8 py-6 text-lg">
              <Link href="/">
                Ana Sayfaya Dön
              </Link>
            </Button>
          </div>

          {/* Footer Note */}
          <p className="text-sm text-slate-500 pt-8">
            Yardıma mı ihtiyacınız var?{" "}
            <a href="mailto:info@rexlojistik.com" className="text-[#D84315] hover:underline">
              Bize ulaşın
            </a>
          </p>
        </div>
      </main>
    </>
  )
}
