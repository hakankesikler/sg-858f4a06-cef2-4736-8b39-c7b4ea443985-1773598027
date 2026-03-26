import { useState } from "react";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CariForm } from "@/components/CariForm";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  CheckCircle2,
  BarChart3,
  Clock,
  Award,
  FileText,
  MessageSquare,
  Settings,
  Plus
} from "lucide-react";

export default function PersonelProfil() {
  const [activeTab, setActiveTab] = useState<"genel" | "aktiviteler" | "hizli-erisim">("genel");
  const [showCariForm, setShowCariForm] = useState(false);

  // Mock user data
  const user = {
    name: "Ahmet Yılmaz",
    title: "Operasyon Müdürü",
    email: "demo@rexlojistik.com",
    phone: "+90 543 401 07 55",
    department: "Lojistik Operasyonları",
    employeeId: "REX-2024-001",
    joinDate: "15 Ocak 2024",
    location: "İstanbul, Türkiye",
  };

  const stats = [
    { label: "Tamamlanan Görevler", value: "142", icon: CheckCircle2, color: "green" },
    { label: "Aktif Projeler", value: "8", icon: BarChart3, color: "blue" },
    { label: "Bekleyen Görevler", value: "12", icon: Clock, color: "orange" },
    { label: "Başarı Oranı", value: "94%", icon: Award, color: "purple" },
  ];

  const recentActivities = [
    {
      title: "Sevkiyat belgesi onaylandı",
      description: "İstanbul-Ankara sevkiyatı için belge onaylandı",
      time: "2 saat önce",
      type: "success",
    },
    {
      title: "Yeni görev atandı",
      description: "Depo envanter kontrolü görevi eklendi",
      time: "5 saat önce",
      type: "info",
    },
    {
      title: "Rapor tamamlandı",
      description: "Aylık lojistik raporu hazırlandı",
      time: "1 gün önce",
      type: "success",
    },
    {
      title: "Müşteri toplantısı",
      description: "ABC Lojistik ile toplantı yapıldı",
      time: "2 gün önce",
      type: "meeting",
    },
  ];

  const quickLinks = [
    { title: "Görevlerim", description: "12 bekleyen görev", icon: FileText, color: "blue" },
    { title: "Belgelerim", description: "48 belge", icon: FileText, color: "green" },
    { title: "Raporlar", description: "Son raporları görüntüle", icon: BarChart3, color: "purple" },
    { title: "Mesajlar", description: "5 okunmamış mesaj", icon: MessageSquare, color: "orange" },
    { title: "Takvim", description: "Bugün 3 toplantı", icon: Calendar, color: "red" },
    { title: "Ayarlar", description: "Profil ayarları", icon: Settings, color: "gray" },
  ];

  return (
    <>
      <SEO 
        title="Personel Profil - Rex Lojistik"
        description="Rex Lojistik personel profil sayfası"
      />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">RL</span>
                </div>
                <span className="text-xl font-bold text-gray-900">Rex Lojistik</span>
              </Link>
              <Button variant="outline" asChild>
                <Link href="/personel-giris">
                  Çıkış
                </Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-4xl font-bold ring-4 ring-white/30">
                  AY
                </div>
                <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full ring-4 ring-white"></div>
              </div>

              {/* User Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold mb-2">{user.name}</h1>
                <p className="text-xl text-white/90 mb-4">{user.title}</p>
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    {user.department}
                  </Badge>
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    {user.employeeId}
                  </Badge>
                </div>
              </div>

              {/* Contact Info */}
              <div className="flex flex-col gap-3 text-center md:text-right">
                <div className="flex items-center gap-2 justify-center md:justify-end">
                  <Mail className="w-5 h-5" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-2 justify-center md:justify-end">
                  <Phone className="w-5 h-5" />
                  <span>{user.phone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-12 h-12 bg-${stat.color}-100 text-${stat.color}-600 rounded-lg flex items-center justify-center`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </Card>
              );
            })}
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <div className="flex gap-4 overflow-x-auto">
              {[
                { id: "genel", label: "📋 Genel Bilgiler" },
                { id: "aktiviteler", label: "📊 Son Aktiviteler" },
                { id: "hizli-erisim", label: "🚀 Hızlı Erişim" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-6 py-3 font-medium whitespace-nowrap transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? "text-orange-600 border-orange-600"
                      : "text-gray-600 hover:text-gray-800 border-transparent"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "genel" && (
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Kişisel Bilgiler</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Ad Soyad</p>
                    <p className="font-medium text-gray-900">{user.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">E-posta</p>
                    <p className="font-medium text-gray-900">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Telefon</p>
                    <p className="font-medium text-gray-900">{user.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Lokasyon</p>
                    <p className="font-medium text-gray-900">{user.location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">İşe Başlama Tarihi</p>
                    <p className="font-medium text-gray-900">{user.joinDate}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Personel No</p>
                    <p className="font-medium text-gray-900">{user.employeeId}</p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "aktiviteler" && (
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      activity.type === "success" ? "bg-green-100 text-green-600" :
                      activity.type === "info" ? "bg-blue-100 text-blue-600" :
                      "bg-purple-100 text-purple-600"
                    }`}>
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{activity.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                      <p className="text-xs text-gray-400">{activity.time}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {activeTab === "hizli-erisim" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Yeni Cari Ekle Kartı */}
              <Card 
                className="p-6 hover:shadow-lg transition-all cursor-pointer group border-2 border-green-200 hover:border-green-500"
                onClick={() => setShowCariForm(true)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-lg">
                    <Plus className="w-7 h-7" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 group-hover:text-green-600 transition-colors mb-2">
                  Yeni Cari Ekle
                </h3>
                <p className="text-sm text-gray-600">
                  Müşteri/tedarikçi kaydı oluştur
                </p>
              </Card>

              {/* Diğer Hızlı Erişim Kartları */}
              {quickLinks.map((link, index) => {
                const Icon = link.icon;
                return (
                  <Card 
                    key={index}
                    className="p-6 hover:shadow-lg transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 bg-${link.color}-100 text-${link.color}-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <Icon className="w-6 h-6" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors mb-1">
                      {link.title}
                    </h3>
                    <p className="text-sm text-gray-600">{link.description}</p>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Cari Form Modal */}
      <CariForm isOpen={showCariForm} onClose={() => setShowCariForm(false)} />
    </>
  );
}