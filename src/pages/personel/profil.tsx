import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CariForm } from "@/components/CariForm";
import { IsGirisForm } from "@/components/IsGirisForm";
import { CRMModule } from "@/components/modules/CRMModule";
import { LogisticsModule } from "@/components/modules/LogisticsModule";
import { AccountingModule } from "@/components/modules/AccountingModule";
import { HRModule } from "@/components/modules/HRModule";
import { AnalyticsModule } from "@/components/modules/AnalyticsModule";
import { ReportsModule } from "@/components/modules/ReportsModule";
import { SettingsModule } from "@/components/modules/SettingsModule";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard,
  Users,
  Truck,
  DollarSign,
  UserCircle,
  Activity,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  BarChart,
  Clock,
  Award,
  Plus,
  Package,
  Activity as ActivityIcon,
  CheckCircle2
} from "lucide-react";

export default function PersonelProfil() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeModule, setActiveModule] = useState<"dashboard" | "crm" | "logistics" | "accounting" | "hr" | "reports" | "settings" | "analytics">("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCariFormOpen, setIsCariFormOpen] = useState(false);
  const [isIsGirisFormOpen, setIsIsGirisFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/login?redirect=/personel/profil");
        return;
      }

      setUser(session.user);
      setLoading(false);

      // Check if there's a module query parameter
      const moduleParam = router.query.module as string;
      if (moduleParam && ["dashboard", "crm", "logistics", "accounting", "hr", "reports", "settings", "analytics"].includes(moduleParam)) {
        setActiveModule(moduleParam as any);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push("/login?redirect=/personel/profil");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Çıkış Yapıldı",
      description: "Başarıyla çıkış yaptınız.",
    });
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  const modules = [
    { id: "dashboard", name: "Dashboard", icon: LayoutDashboard, color: "from-blue-500 to-blue-600" },
    { id: "crm", name: "CRM", icon: Users, color: "from-purple-500 to-purple-600" },
    { id: "logistics", name: "Lojistik Yönetimi", icon: Truck, color: "from-orange-500 to-orange-600" },
    { id: "accounting", name: "Muhasebe", icon: DollarSign, color: "from-green-500 to-green-600" },
    { id: "hr", name: "İnsan Kaynakları", icon: UserCircle, color: "from-indigo-500 to-indigo-600" },
    { id: "analytics", name: "Web Analitik", icon: ActivityIcon, color: "from-cyan-500 to-cyan-600" },
    { id: "reports", name: "Raporlama", icon: BarChart3, color: "from-pink-500 to-pink-600" },
    { id: "settings", name: "Ayarlar", icon: Settings, color: "from-gray-500 to-gray-600" }
  ];

  const handleModuleClick = (moduleId: typeof activeModule) => {
    setActiveModule(moduleId);
    setSidebarOpen(false);
  };

  const renderModuleContent = () => {
    switch (activeModule) {
      case "crm":
        return <CRMModule />;
      case "logistics":
        return <LogisticsModule />;
      case "accounting":
        return <AccountingModule />;
      case "hr":
        return <HRModule />;
      case "analytics":
        return <AnalyticsModule />;
      case "reports":
        return <ReportsModule />;
      case "settings":
        return <SettingsModule />;
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Hoş Geldiniz, Ahmet Yılmaz</h1>
            <p className="text-blue-100 text-lg">Bugün nasılsınız? İşlerinizi kolayca yönetmek için modülleri kullanabilirsiniz.</p>
            <div className="flex flex-wrap items-center gap-4 mt-4">
              <Badge className="bg-white/20 text-white hover:bg-white/30 px-4 py-2 text-sm">
                Lojistik Operasyonları
              </Badge>
              <span className="text-blue-200 text-sm">📅 {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Tamamlanan Görevler</p>
              <p className="text-3xl font-bold text-green-900 mt-2">142</p>
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Bu ay
              </p>
            </div>
            <div className="w-14 h-14 bg-green-600 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Aktif Projeler</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">8</p>
              <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                <BarChart className="w-3 h-3" />
                Devam ediyor
              </p>
            </div>
            <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center">
              <BarChart className="w-7 h-7 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700 font-medium">Bekleyen Görevler</p>
              <p className="text-3xl font-bold text-orange-900 mt-2">12</p>
              <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Öncelikli
              </p>
            </div>
            <div className="w-14 h-14 bg-orange-600 rounded-xl flex items-center justify-center">
              <Clock className="w-7 h-7 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium">Başarı Oranı</p>
              <p className="text-3xl font-bold text-purple-900 mt-2">94%</p>
              <p className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                <Award className="w-3 h-3" />
                Mükemmel
              </p>
            </div>
            <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center">
              <Award className="w-7 h-7 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">🚀 Hızlı İşlemler</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cari Ekle Card */}
          <Card 
            className="p-6 hover:shadow-xl transition-all cursor-pointer group border-2 border-blue-200 hover:border-blue-500"
            onClick={() => setIsCariFormOpen(true)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-lg">
                <Plus className="w-7 h-7" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors mb-2">
              Yeni Cari Ekle
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Müşteri veya tedarikçi kaydı oluşturun
            </p>
            <Button 
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              onClick={(e) => {
                e.stopPropagation();
                setIsCariFormOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Cari Formu Aç
            </Button>
          </Card>

          {/* İş Giriş Card */}
          <Card 
            className="p-6 hover:shadow-xl transition-all cursor-pointer group border-2 border-green-200 hover:border-green-500"
            onClick={() => setIsIsGirisFormOpen(true)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-lg">
                <Package className="w-7 h-7" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 group-hover:text-green-600 transition-colors mb-2">
              Yeni İş Girişi
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Sevkiyat kaydı oluşturun
            </p>
            <Button 
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
              onClick={(e) => {
                e.stopPropagation();
                setIsIsGirisFormOpen(true);
              }}
            >
              <Package className="w-4 h-4 mr-2" />
              İş Giriş Formu Aç
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <SEO 
        title="Rex Portal - Dashboard"
        description="Rex Lojistik personel yönetim paneli"
      />

      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <aside className={`
          fixed lg:sticky top-0 left-0 z-40 h-screen
          w-72 bg-slate-900 text-white shadow-2xl
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          {/* Sidebar Header */}
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  RL
                </div>
                <span className="text-xl font-bold">Rex Portal</span>
              </div>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Profile */}
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {user?.email?.[0]?.toUpperCase() || "A"}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{user?.email?.split("@")[0] || "Kullanıcı"}</h3>
                  <p className="text-sm text-gray-400">Operasyon Müdürü</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4 flex-1 overflow-y-auto">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3">
              Modüller
            </p>
            <ul className="space-y-1">
              {modules.map((module) => {
                const Icon = module.icon;
                const isActive = activeModule === module.id;
                return (
                  <li key={module.id}>
                    <button
                      onClick={() => handleModuleClick(module.id as typeof activeModule)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-lg
                        transition-all duration-200 group
                        ${isActive 
                          ? 'bg-blue-600 text-white shadow-lg' 
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }
                      `}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                      <span className="font-medium text-sm">{module.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-slate-800">
            <Link href="/" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-all duration-200">
              <LogOut className="w-5 h-5" />
              <span className="font-medium text-sm">Çıkış Yap</span>
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Mobile Header */}
          <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                RL
              </div>
              <span className="font-bold text-lg text-gray-900">Rex Portal</span>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Search className="w-5 h-5 text-gray-600" />
              </button>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Çıkış Yap</span>
              </Button>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-4 md:p-6 lg:p-8">
            {renderModuleContent()}
          </div>
        </main>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>

      {/* Modals */}
      <CariForm 
        isOpen={isCariFormOpen}
        onClose={() => setIsCariFormOpen(false)}
      />

      <IsGirisForm 
        isOpen={isIsGirisFormOpen}
        onClose={() => setIsIsGirisFormOpen(false)}
      />
    </>
  );
}