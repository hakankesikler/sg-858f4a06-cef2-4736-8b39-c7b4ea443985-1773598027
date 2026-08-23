import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
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
import { AppRole, PortalModule, canAccessModule, getCurrentUserAccess, roleLabels } from "@/lib/access-control";
import { hasPermission, type PermissionMap } from "@/lib/staff-permissions";
import { useToast } from "@/hooks/use-toast";
import {
  Activity as ActivityIcon,
  BarChart3,
  CheckCircle2,
  Clock,
  DollarSign,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Plus,
  Settings,
  Truck,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";

type DashboardStats = {
  totalShipments: number;
  deliveredShipments: number;
  activeShipments: number;
  pendingShipments: number;
  successRate: number;
};

const emptyStats: DashboardStats = {
  totalShipments: 0,
  deliveredShipments: 0,
  activeShipments: 0,
  pendingShipments: 0,
  successRate: 0,
};

const moduleDefinitions = [
  { id: "dashboard" as const, name: "Dashboard", icon: LayoutDashboard },
  { id: "crm" as const, name: "CRM", icon: Users },
  { id: "logistics" as const, name: "Lojistik Yönetimi", icon: Truck },
  { id: "accounting" as const, name: "Muhasebe", icon: DollarSign },
  { id: "hr" as const, name: "İnsan Kaynakları", icon: UserCircle },
  { id: "analytics" as const, name: "Web Analitik", icon: ActivityIcon },
  { id: "reports" as const, name: "Raporlama", icon: BarChart3 },
  { id: "settings" as const, name: "Ayarlar", icon: Settings },
];

export default function PersonelProfil() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeModule, setActiveModule] = useState<PortalModule>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCariFormOpen, setIsCariFormOpen] = useState(false);
  const [isIsGirisFormOpen, setIsIsGirisFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [permissions, setPermissions] = useState<PermissionMap | null>(null);
  const [stats, setStats] = useState<DashboardStats>(emptyStats);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        await router.replace("/login?redirect=/personel/profil");
        return;
      }

      const currentAccess = await getCurrentUserAccess(session.user.id);
      if (!currentAccess) {
        await supabase.auth.signOut();
        toast({ title: "Erişim reddedildi", description: "Bu hesabın portal yetkisi bulunmuyor.", variant: "destructive" });
        await router.replace("/login");
        return;
      }

      if (!mounted) return;
      setUser(session.user);
      setRole(currentAccess.role);
      setPermissions(currentAccess.permissions);

      const requestedModule = typeof router.query.module === "string" ? router.query.module as PortalModule : "dashboard";
      if (canAccessModule(currentAccess.role, requestedModule, currentAccess.permissions)) {
        setActiveModule(requestedModule);
      } else {
        setActiveModule("dashboard");
        await router.replace({ pathname: "/personel/profil", query: { module: "dashboard" } }, undefined, { shallow: true });
      }
      setLoading(false);
    };

    if (router.isReady) void checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) void router.replace("/login");
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router.isReady, router.query.module]);

  useEffect(() => {
    if (!role) return;
    const loadStats = async () => {
      const { data, error } = await supabase.rpc("rex_dashboard_stats" as any);
      if (!error && data) setStats(data as unknown as DashboardStats);
    };
    void loadStats();
  }, [role]);

  const modules = useMemo(
    () => role && permissions ? moduleDefinitions.filter((module) => canAccessModule(role, module.id, permissions)) : [],
    [role, permissions],
  );

  const handleModuleClick = async (moduleId: PortalModule) => {
    if (!role || !permissions || !canAccessModule(role, moduleId, permissions)) return;
    setActiveModule(moduleId);
    setSidebarOpen(false);
    await router.replace({ pathname: "/personel/profil", query: { module: moduleId } }, undefined, { shallow: true });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Çıkış yapıldı", description: "Oturumunuz güvenli şekilde kapatıldı." });
    await router.replace("/login");
  };

  if (loading || !role || !permissions) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Yetkiniz kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Kullanıcı";
  const canManageCustomers = hasPermission(permissions, "crm.customers", "manage");
  const canManageWorkOrders = hasPermission(permissions, "sales.work_orders", "manage");

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 rounded-2xl p-6 md:p-8 text-white shadow-xl overflow-hidden">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 break-words">Hoş geldiniz, {displayName}</h1>
        <p className="text-blue-100 text-lg">Güncel operasyon özetiniz aşağıdadır.</p>
        <div className="flex flex-wrap items-center gap-4 mt-4">
          <Badge className="bg-white/20 text-white hover:bg-white/30 px-4 py-2 text-sm">{roleLabels[role]}</Badge>
          <span className="text-blue-200 text-sm">📅 {new Date().toLocaleDateString("tr-TR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
        </div>
      </div>

      {role === "demo" && (
        <Card className="p-4 border-blue-200 bg-blue-50 text-blue-900">
          Bu hesap güvenli demo görünümündedir. Müşteri, sürücü, personel ve finans verilerine erişemez.
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-green-50 border-green-200">
          <p className="text-sm text-green-700 font-medium">Teslim Edilen Sevkiyat</p>
          <p className="text-3xl font-bold text-green-900 mt-2">{stats.deliveredShipments}</p>
          <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Toplam</p>
        </Card>
        <Card className="p-6 bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-700 font-medium">Aktif Sevkiyat</p>
          <p className="text-3xl font-bold text-blue-900 mt-2">{stats.activeShipments}</p>
          <p className="text-xs text-blue-600 mt-1 flex items-center gap-1"><Truck className="w-3 h-3" /> Devam ediyor</p>
        </Card>
        <Card className="p-6 bg-orange-50 border-orange-200">
          <p className="text-sm text-orange-700 font-medium">Bekleyen Sevkiyat</p>
          <p className="text-3xl font-bold text-orange-900 mt-2">{stats.pendingShipments}</p>
          <p className="text-xs text-orange-600 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" /> İşlem bekliyor</p>
        </Card>
        <Card className="p-6 bg-purple-50 border-purple-200">
          <p className="text-sm text-purple-700 font-medium">Teslim Başarı Oranı</p>
          <p className="text-3xl font-bold text-purple-900 mt-2">%{stats.successRate}</p>
          <p className="text-xs text-purple-600 mt-1">{stats.totalShipments} sevkiyat üzerinden</p>
        </Card>
      </div>

      {(canManageCustomers || canManageWorkOrders) && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Hızlı İşlemler</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {canManageCustomers && <Card className="p-6 border-2 border-blue-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Yeni Cari Ekle</h3>
              <p className="text-sm text-gray-600 mb-4">Müşteri veya tedarikçi kaydı oluşturun.</p>
              <Button className="w-full" onClick={() => setIsCariFormOpen(true)}><Plus className="w-4 h-4 mr-2" />Cari Formu Aç</Button>
            </Card>}
            {canManageWorkOrders && <Card className="p-6 border-2 border-green-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Yeni İş Girişi</h3>
              <p className="text-sm text-gray-600 mb-4">Yeni sevkiyat kaydı oluşturun.</p>
              <Button className="w-full bg-green-700 hover:bg-green-800" onClick={() => setIsIsGirisFormOpen(true)}><Package className="w-4 h-4 mr-2" />İş Giriş Formu Aç</Button>
            </Card>}
          </div>
        </div>
      )}
    </div>
  );

  const renderModuleContent = () => {
    if (!canAccessModule(role, activeModule, permissions)) return renderDashboard();
    switch (activeModule) {
      case "crm": return <CRMModule permissions={permissions} />;
      case "logistics": return <LogisticsModule />;
      case "accounting": return <AccountingModule permissions={permissions} />;
      case "hr": return <HRModule />;
      case "analytics": return <AnalyticsModule />;
      case "reports": return <ReportsModule />;
      case "settings": return <SettingsModule />;
      default: return renderDashboard();
    }
  };

  return (
    <>
      <SEO title="Rex Portal - Dashboard" description="Rex Lojistik güvenli personel yönetim paneli" />
      <SidebarProvider defaultOpen={false}>
        <div className="flex min-h-screen w-full">
          <aside className={`fixed lg:sticky top-0 left-0 z-40 h-screen bg-slate-900 text-white shadow-2xl transform transition-all duration-300 overflow-hidden group flex flex-col ${sidebarOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0 w-72 lg:w-[80px] lg:hover:w-72"}`}>
            <div className="p-4 lg:p-5 border-b border-slate-800">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="relative w-14 h-10 min-w-10 overflow-hidden rounded-lg bg-white shadow-sm">
                    <img src="/rex-logo-header.png" alt="Rex Lojistik" className="absolute left-0 top-1/2 h-auto w-20 max-w-none -translate-y-1/2" />
                  </div>
                  <span className={`text-xl font-bold whitespace-nowrap ${sidebarOpen ? "opacity-100" : "lg:opacity-0 lg:group-hover:opacity-100"}`}>Rex Portal</span>
                </div>
                <button aria-label="Menüyü kapat" onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 hover:bg-slate-800 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              <div className={`pb-2 ${sidebarOpen ? "opacity-100" : "lg:opacity-0 lg:h-0 lg:group-hover:opacity-100 lg:group-hover:h-auto overflow-hidden"}`}>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 min-w-10 bg-blue-500 rounded-full flex items-center justify-center font-bold">{user?.email?.[0]?.toUpperCase() || "R"}</div>
                  <div className="whitespace-nowrap overflow-hidden"><h3 className="font-semibold">{displayName}</h3><p className="text-sm text-gray-400">{roleLabels[role]}</p></div>
                </div>
              </div>
            </div>
            <nav className="p-3 flex-1 overflow-y-auto overflow-x-hidden" aria-label="Portal modülleri">
              <ul className="space-y-1">
                {modules.map((module) => {
                  const Icon = module.icon;
                  const isActive = activeModule === module.id;
                  return (
                    <li key={module.id}>
                      <button onClick={() => void handleModuleClick(module.id)} className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg ${isActive ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`} title={module.name}>
                        <Icon className="min-w-5 w-5 h-5" /><span className={`font-medium text-sm whitespace-nowrap ${sidebarOpen ? "opacity-100" : "lg:opacity-0 lg:group-hover:opacity-100"}`}>{module.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className="p-3 border-t border-slate-800">
              <button onClick={() => void handleLogout()} className="w-full flex items-center gap-3 px-3 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg">
                <LogOut className="min-w-5 w-5 h-5" /><span className={`font-medium text-sm whitespace-nowrap ${sidebarOpen ? "opacity-100" : "lg:opacity-0 lg:group-hover:opacity-100"}`}>Çıkış Yap</span>
              </button>
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3"><div className="relative w-12 h-8 overflow-hidden rounded-lg bg-white border"><img src="/rex-logo-header.png" alt="Rex Lojistik" className="absolute left-0 top-1/2 h-auto w-[4.5rem] max-w-none -translate-y-1/2" /></div><span className="font-bold text-lg">Rex Portal</span></div>
              <div className="flex items-center gap-2">
                <Button onClick={() => void handleLogout()} variant="outline" size="sm"><LogOut className="w-4 h-4 mr-1" />Çıkış</Button>
                <button aria-label="Menüyü aç" onClick={() => setSidebarOpen((value) => !value)} className="p-2 hover:bg-gray-100 rounded-lg">{sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button>
              </div>
            </div>
            <div className="p-4 md:p-6 lg:p-8">{renderModuleContent()}</div>
          </main>
          {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
        </div>
      </SidebarProvider>

      {canManageCustomers && <CariForm isOpen={isCariFormOpen} onClose={() => setIsCariFormOpen(false)} />}
      {canManageWorkOrders && <IsGirisForm isOpen={isIsGirisFormOpen} onClose={() => setIsIsGirisFormOpen(false)} />}
    </>
  );
}
