import { useState } from "react";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CariForm } from "@/components/CariForm";
import { IsGirisForm } from "@/components/IsGirisForm";
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
  Plus,
  Package,
  Users,
  Truck,
  Calculator,
  Briefcase,
  LineChart,
  LogOut,
  Menu,
  X
} from "lucide-react";

export default function PersonelProfil() {
  const [activeTab, setActiveTab] = useState<"genel" | "aktiviteler" | "hizli-erisim">("genel");
  const [isCariFormOpen, setIsCariFormOpen] = useState(false);
  const [isIsGirisFormOpen, setIsIsGirisFormOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
  ];

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3, href: "/personel/profil", active: true },
    { id: "crm", label: "CRM", icon: Users, href: "#crm" },
    { id: "lojistik", label: "Lojistik Yönetimi", icon: Truck, href: "#lojistik" },
    { id: "muhasebe", label: "Muhasebe", icon: Calculator, href: "#muhasebe" },
    { id: "ik", label: "İnsan Kaynakları", icon: Briefcase, href: "#ik" },
    { id: "raporlama", label: "Raporlama", icon: LineChart, href: "#raporlama" },
    { id: "ayarlar", label: "Ayarlar", icon: Settings, href: "#ayarlar" },
  ];

  return (
    <>
      <SEO 
        title="Personel Portal - Rex Lojistik"
        description="Rex Lojistik personel yönetim portali"
      />

      <div className="flex min-h-screen bg-gray-50">
        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`fixed md:sticky top-0 left-0 z-50 h-screen w-72 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between p-6 border-b border-slate-800">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">RL</span>
              </div>
              <span className="text-xl font-bold text-white tracking-wide">Rex Portal</span>
            </Link>
            <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 border-b border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
              AY
            </div>
            <div>
              <p className="font-medium text-white">{user.name}</p>
              <p className="text-sm text-slate-400">{user.title}</p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-3 mt-2">Modüller</div>
            
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link 
                  key={item.id} 
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                    item.active 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-800">
            <Link 
              href="/personel-giris" 
              className="flex items-center gap-3 px-3 py-3 text-slate-300 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Çıkış Yap</span>
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Mobile Header */}
          <header className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-30 px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">RL</span>
              </div>
              <span className="text-lg font-bold text-gray-900">Rex Portal</span>
            </div>
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <Menu className="w-6 h-6" />
            </button>
          </header>

          {/* Profile Header Background */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 text-white py-12 px-6 lg:px-10">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold mb-2">Hoş Geldiniz, {user.name}</h1>
                <p className="text-lg text-white/90 mb-4">Bugün nasılsınız? İşlerinizi kolayca yönetmek için modülleri kullanabilirsiniz.</p>
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    {user.department}
                  </Badge>
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date().toLocaleDateString('tr-TR')}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 lg:px-10 py-8 flex-1">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index} className="p-6 border-none shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 bg-${stat.color}-100 text-${stat.color}-600 rounded-xl flex items-center justify-center`}>
                        <Icon className="w-6 h-6" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                    <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  </Card>
                );
              })}
            </div>

            {/* Tabs */}
            <div className="mb-6 border-b border-gray-200">
              <div className="flex gap-4 overflow-x-auto no-scrollbar">
                {[
                  { id: "genel", label: "📋 Genel Bilgiler" },
                  { id: "hizli-erisim", label: "🚀 Hızlı İşlemler" },
                  { id: "aktiviteler", label: "📊 Son Aktiviteler" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`px-6 py-4 font-medium whitespace-nowrap transition-colors border-b-2 ${
                      activeTab === tab.id
                        ? "text-blue-600 border-blue-600"
                        : "text-gray-500 hover:text-gray-800 border-transparent"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === "genel" && (
              <Card className="p-6 lg:p-8 border-none shadow-sm">
                <h2 className="text-xl font-bold text-gray-800 mb-8 flex items-center gap-2">
                  <User className="w-6 h-6 text-blue-600" /> 
                  Kişisel Bilgiler
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <User className="w-4 h-4" /> Ad Soyad
                    </p>
                    <p className="font-semibold text-gray-900 text-lg">{user.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <Mail className="w-4 h-4" /> E-posta
                    </p>
                    <p className="font-semibold text-gray-900 text-lg">{user.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <Phone className="w-4 h-4" /> Telefon
                    </p>
                    <p className="font-semibold text-gray-900 text-lg">{user.phone}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> Lokasyon
                    </p>
                    <p className="font-semibold text-gray-900 text-lg">{user.location}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> İşe Başlama Tarihi
                    </p>
                    <p className="font-semibold text-gray-900 text-lg">{user.joinDate}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <Badge className="w-4 h-4" /> Personel No
                    </p>
                    <p className="font-semibold text-gray-900 text-lg">{user.employeeId}</p>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === "aktiviteler" && (
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <Card key={index} className="p-5 border-none shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        activity.type === "success" ? "bg-green-100 text-green-600" :
                        activity.type === "info" ? "bg-blue-100 text-blue-600" :
                        "bg-purple-100 text-purple-600"
                      }`}>
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-1">
                          <h3 className="font-bold text-gray-900 truncate">{activity.title}</h3>
                          <span className="text-xs font-medium text-gray-500 whitespace-nowrap bg-gray-100 px-2 py-1 rounded-full">{activity.time}</span>
                        </div>
                        <p className="text-sm text-gray-600">{activity.description}</p>
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
                  className="p-6 hover:shadow-lg transition-all cursor-pointer group border-2 border-transparent hover:border-blue-500 bg-white"
                  onClick={() => setIsCariFormOpen(true)}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                      <Plus className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Yeni Cari Ekle
                    </h3>
                    <p className="text-sm text-gray-500">
                      Müşteri veya tedarikçi kaydı oluştur
                    </p>
                  </div>
                </Card>

                {/* Yeni İş Giriş Kartı */}
                <Card 
                  className="p-6 hover:shadow-lg transition-all cursor-pointer group border-2 border-transparent hover:border-green-500 bg-white"
                  onClick={() => setIsIsGirisFormOpen(true)}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 text-green-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-green-600 group-hover:text-white transition-all duration-300">
                      <Package className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Yeni İş Girişi
                    </h3>
                    <p className="text-sm text-gray-500">
                      Yeni bir sevkiyat kaydı oluştur
                    </p>
                  </div>
                </Card>

                {/* Diğer Hızlı Erişim Kartları */}
                {quickLinks.map((link, index) => {
                  const Icon = link.icon;
                  return (
                    <Card 
                      key={index}
                      className="p-6 hover:shadow-md transition-all cursor-pointer group border border-gray-100"
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className={`w-14 h-14 bg-gray-50 text-gray-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:text-blue-600 transition-all duration-300`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mb-1">
                          {link.title}
                        </h3>
                        <p className="text-sm text-gray-500">{link.description}</p>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Cari Form Modal */}
      <CariForm 
        isOpen={isCariFormOpen}
        onClose={() => setIsCariFormOpen(false)}
      />

      {/* İş Giriş Form Modal */}
      <IsGirisForm 
        isOpen={isIsGirisFormOpen}
        onClose={() => setIsIsGirisFormOpen(false)}
      />
    </>
  );
}