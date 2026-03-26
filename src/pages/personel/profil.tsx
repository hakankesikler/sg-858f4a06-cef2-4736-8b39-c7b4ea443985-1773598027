import { useState } from "react";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CariForm } from "@/components/CariForm";

export default function PersonelProfil() {
  const [activeTab, setActiveTab] = useState<"genel" | "aktiviteler" | "hizli-erisim">("genel");
  const [showCariForm, setShowCariForm] = useState(false);

  // Mock user data
  const userData = {
    name: "Ahmet Yılmaz",
    email: "demo@rexlojistik.com",
    position: "Operasyon Müdürü",
    department: "Lojistik Operasyonları",
    employeeId: "REX-2024-001",
    phone: "+90 543 401 07 55",
    joinDate: "15 Ocak 2024",
    avatar: "https://ui-avatars.com/api/?name=Ahmet+Yilmaz&background=f97316&color=fff&size=200"
  };

  const stats = [
    { label: "Tamamlanan Görevler", value: "142", icon: "✓", color: "text-green-600 bg-green-50" },
    { label: "Aktif Projeler", value: "8", icon: "📊", color: "text-blue-600 bg-blue-50" },
    { label: "Bekleyen Görevler", value: "12", icon: "⏳", color: "text-orange-600 bg-orange-50" },
    { label: "Performans Skoru", value: "94%", icon: "⭐", color: "text-purple-600 bg-purple-50" }
  ];

  const recentActivities = [
    { id: 1, action: "Sevkiyat #4523 tamamlandı", time: "2 saat önce", status: "success" },
    { id: 2, action: "Gümrük belgesi onaylandı", time: "5 saat önce", status: "success" },
    { id: 3, action: "Yeni müşteri kaydı oluşturuldu", time: "1 gün önce", status: "info" },
    { id: 4, action: "Aylık rapor yüklendi", time: "2 gün önce", status: "info" },
    { id: 5, action: "Araç bakım planı güncellendi", time: "3 gün önce", status: "warning" }
  ];

  const quickLinks = [
    { title: "Görevlerim", icon: "📋", href: "/personel/gorevler", count: 12 },
    { title: "Belgelerim", icon: "📄", href: "/personel/belgeler", count: 45 },
    { title: "Raporlar", icon: "📊", href: "/personel/raporlar", count: 8 },
    { title: "Mesajlar", icon: "💬", href: "/personel/mesajlar", count: 3 },
    { title: "Takvim", icon: "📅", href: "/personel/takvim", count: 0 },
    { title: "Ayarlar", icon: "⚙️", href: "/personel/ayarlar", count: 0 }
  ];

  const handleLogout = () => {
    // In real app, this would clear session/tokens
    window.location.href = "/personel-giris";
  };

  return (
    <>
      <SEO 
        title="Personel Profili - Rex Lojistik"
        description="Rex Lojistik personel profil sayfası"
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-orange-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40 backdrop-blur-sm bg-white/95">
          <div className="container mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3">
                <img 
                  src="/rex-lojistik-logo-new.png" 
                  alt="Rex Lojistik" 
                  className="h-12 w-12 object-contain"
                />
                <span className="text-xl font-bold text-gray-800">Rex Lojistik</span>
              </Link>

              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Çıkış
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 sm:px-6 py-8">
          {/* Profile Header */}
          <Card className="p-6 sm:p-8 mb-8 bg-gradient-to-r from-blue-600 to-orange-500 text-white">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative">
                <img 
                  src={userData.avatar}
                  alt={userData.name}
                  className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
                />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white"></div>
              </div>

              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-3xl font-bold mb-1">{userData.name}</h1>
                <p className="text-blue-100 text-lg mb-3">{userData.position}</p>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <Badge className="bg-white/20 text-white border-white/30">
                    {userData.department}
                  </Badge>
                  <Badge className="bg-white/20 text-white border-white/30">
                    {userData.employeeId}
                  </Badge>
                </div>
              </div>

              <div className="hidden sm:flex flex-col gap-2 text-right">
                <div className="flex items-center gap-2 justify-end">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm">{userData.email}</span>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-sm">{userData.phone}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center text-2xl`}>
                    {stat.icon}
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-800 mb-1">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </Card>
            ))}
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <div className="flex gap-4 overflow-x-auto">
              {["genel", "aktiviteler", "hizli-erisim"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab
                      ? "text-orange-600 border-b-2 border-orange-600"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  {tab === "genel" && "Genel Bilgiler"}
                  {tab === "aktiviteler" && "Son Aktiviteler"}
                  {tab === "hizli-erisim" && "Hızlı Erişim"}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "genel" && (
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Kişisel Bilgiler</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">Ad Soyad</label>
                  <p className="text-gray-800 font-medium">{userData.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">Pozisyon</label>
                  <p className="text-gray-800 font-medium">{userData.position}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">Departman</label>
                  <p className="text-gray-800 font-medium">{userData.department}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">Personel No</label>
                  <p className="text-gray-800 font-medium">{userData.employeeId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">E-posta</label>
                  <p className="text-gray-800 font-medium">{userData.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">Telefon</label>
                  <p className="text-gray-800 font-medium">{userData.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">İşe Başlama</label>
                  <p className="text-gray-800 font-medium">{userData.joinDate}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">Durum</label>
                  <Badge className="bg-green-100 text-green-700">Aktif</Badge>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "aktiviteler" && (
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Son Aktiviteler</h2>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div 
                    key={activity.id}
                    className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.status === "success" ? "bg-green-500" :
                      activity.status === "warning" ? "bg-yellow-500" :
                      "bg-blue-500"
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-gray-800 font-medium">{activity.action}</p>
                      <p className="text-sm text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === "hizli-erisim" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                onClick={() => setShowCariForm(true)}
                className="bg-white rounded-xl p-6 border border-gray-200 hover:border-green-500 hover:shadow-lg transition-all group text-left h-full"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    +
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 group-hover:text-green-600 transition-colors">
                  Yeni Cari Ekle
                </h3>
                <p className="text-sm text-gray-500 mt-1">Müşteri/tedarikçi kaydı oluştur</p>
              </button>

              {quickLinks.map((link, index) => (
                <Card 
                  key={index}
                  className="p-6 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-4xl">{link.icon}</div>
                    {link.count > 0 && (
                      <Badge className="bg-orange-100 text-orange-700">
                        {link.count}
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 group-hover:text-orange-600 transition-colors">
                    {link.title}
                  </h3>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Cari Form Modal */}
      <CariForm isOpen={showCariForm} onClose={() => setShowCariForm(false)} />
    </>
  );
}