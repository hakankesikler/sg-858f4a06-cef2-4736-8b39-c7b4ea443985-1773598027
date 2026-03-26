import { useState } from "react";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { CariForm } from "@/components/CariForm";
import { ArrowLeft } from "lucide-react";

export default function CariEklePage() {
  const [showCariForm, setShowCariForm] = useState(true);

  return (
    <>
      <SEO
        title="Yeni Cari Ekle - Rex Lojistik"
        description="Yeni cari hesabı ekleyin"
      />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link
                href="/"
                className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">RL</span>
                </div>
                <span className="text-xl font-bold text-gray-900">Rex Lojistik</span>
              </Link>

              <Link
                href="/personel/profil"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Geri Dön</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Yeni Cari Ekle</h1>
            <p className="text-gray-600">
              Yeni müşteri veya tedarikçi bilgilerini ekleyin
            </p>
          </div>

          {/* Info Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Cari Türüne Göre Gerekli Bilgiler
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>
                    • <strong>Gerçek/Şahıs Şirketi:</strong> T.C. Kimlik No (11 haneli) zorunludur
                  </li>
                  <li>
                    • <strong>Tüzel Kişi:</strong> Vergi No (10 haneli) zorunludur
                  </li>
                  <li>• Tüm formlarda Cari Adı, Soyadı ve Cari Tipi zorunludur</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Open Form Button */}
          <div className="flex justify-center">
            <button
              onClick={() => setShowCariForm(true)}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              📋 Cari Formu Aç
            </button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Otomatik Validasyon</h3>
              <p className="text-sm text-gray-600">
                T.C. Kimlik No ve Vergi No otomatik kontrol edilir
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Dinamik Alanlar</h3>
              <p className="text-sm text-gray-600">
                Cari türüne göre ilgili alanlar gösterilir
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Gerçek Zamanlı Kontrol</h3>
              <p className="text-sm text-gray-600">
                Her alan doldurulurken anlık hata kontrolü yapılır
              </p>
            </div>
          </div>
        </main>
      </div>

      <CariForm
        isOpen={showCariForm}
        onClose={() => {
          setShowCariForm(false);
          // Form kapandığında tekrar açma butonu göster
        }}
      />
    </>
  );
}