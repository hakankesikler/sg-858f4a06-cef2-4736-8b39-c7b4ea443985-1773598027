import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CariForm } from "@/components/CariForm";
import { IsGirisForm } from "@/components/IsGirisForm";
import { CRMWorkspace } from "@/components/modules/CRMWorkspace";
import { LogisticsModule } from "@/components/modules/LogisticsModule";
import { AccountingModule } from "@/components/modules/AccountingModule";
import { HRModule } from "@/components/modules/HRModule";
import { AnalyticsModule } from "@/components/modules/AnalyticsModule";
import { ReportsModule } from "@/components/modules/ReportsModule";
import { IntegrationsModule } from "@/components/modules/IntegrationsModule";
import { SettingsModule } from "@/components/modules/SettingsModule";
import { supabase } from "@/integrations/supabase/client";
import { AppRole, PortalModule, canAccessModule, getCurrentUserAccess, roleLabels } from "@/lib/access-control";
import { hasPermission, type PermissionMap } from "@/lib/staff-permissions";
import { useToast } from "@/hooks/use-toast";
import { useStaffSessionSecurity } from "@/hooks/use-staff-session-security";
import { clearStaffSessionClock, getMfaState, roleRequiresMfa } from "@/lib/security";
import {
  Activity as ActivityIcon,
  BarChart3,
  CheckCircle2,
  Clock,
  DollarSign,
  LayoutDashboard,
  LogOut,
  Menu,
  Network,
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
  { id: "integrations" as const, name: "Entegrasyon Merkezi", icon: Network },
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
  useStaffSessionSecurity(Boolean(role));

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

      try {
        const mfa = await getMfaState();
        const needsMfa = roleRequiresMfa(currentAccess.role) || mfa.nextLevel === "aal2";
        if (needsMfa && mfa.currentLevel !== "aal2") {
          const redirect = typeof window === "undefined"
            ? "/personel/profil"
            : `${window.location.pathname}${window.location.search}`;
          await router.replace(`/personel/mfa?redirect=${encodeURIComponent(redirect)}`);
          return;
        }
      } catch {
        if (roleRequiresMfa(currentAccess.role)) {
          await supabase.auth.signOut();
          clearStaffSessionClock();
          toast({ title: "Güvenlik doğrulaması yapılamadı", description: "Lütfen yeniden giriş yapın.", variant: "destructive" });
          await router.replace("/login");
          return;
        }
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
    clearStaffSessionClock();
    toast({ title: "Çıkış yapıldı", description: "Oturumunuz güvenli şekilde kapatıldı." });
    await router.replace("/login");
  };

  if (loading || !role || !permissions) {
    return (
      <div className="min-h-screen bg-[#f5f7fb] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#e96d25] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-medium text-[#173f73]">Yetkiniz kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Kullanıcı";
  const canManageCustomers = hasPermission(permissions, "crm.customers", "manage");
  const canManageWorkOrders = hasPermission(permissions, "sales.work_orders", "manage");

  const renderDashboard = () => (
    <div className="space-y-7">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(120deg,#10213e_0%,#173f73_68%,#22568d_100%)] p-6 text-white shadow-[0_18px_50px_rgba(16,33,62,0.22)] md:p-9">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border-[28px] border-orange-400/20" />
        <div className="absolute bottom-0 right-24 h-28 w-28 translate-y-1/2 rounded-full bg-orange-400/10 blur-xl" />
        <div className="relative max-w-3xl">
          <div className="mb-5 h-1.5 w-20 rounded-full bg-[#f47b31]" />
          <h1 className="mb-2 break-words text-3xl font-bold tracking-tight md:text-4xl">Hoş geldiniz, {displayName}</h1>
          <p className="text-lg text-blue-100">Günün operasyon akışı, bekleyen işler ve sevkiyat performansı burada.</p>
        </div>
        <div className="relative mt-5 flex flex-wrap items-center gap-3">
          <Badge className="border border-orange-300/30 bg-[#e96d25] px-4 py-2 text-sm text-white hover:bg-[#d95e1d]">{roleLabels[role]}</Badge>
          <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-blue-50">📅 {new Date().toLocaleDateString("tr-TR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
        </div>
      </div>

      {role === "demo" && (
        <Card className="p-4 border-blue-200 bg-blue-50 text-blue-900">
          Bu hesap güvenli demo görünümündedir. Müşteri, sürücü, personel ve finans verilerine erişemez.
        </Card>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="group border-slate-200 border-t-4 border-t-emerald-500 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-5 w-5" /></div>
          <p className="text-sm font-semibold text-slate-600">Teslim Edilen Sevkiyat</p>
          <p className="mt-2 text-3xl font-bold text-[#10213e]">{stats.deliveredShipments}</p>
          <p className="mt-1 text-xs text-emerald-600">Başarıyla tamamlanan toplam</p>
        </Card>
        <Card className="group border-slate-200 border-t-4 border-t-[#2d69a5] bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#2d69a5]"><Truck className="h-5 w-5" /></div>
          <p className="text-sm font-semibold text-slate-600">Aktif Sevkiyat</p>
          <p className="mt-2 text-3xl font-bold text-[#10213e]">{stats.activeShipments}</p>
          <p className="mt-1 text-xs text-[#2d69a5]">Taşıması devam eden işler</p>
        </Card>
        <Card className="group border-slate-200 border-t-4 border-t-[#e96d25] bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-[#e96d25]"><Clock className="h-5 w-5" /></div>
          <p className="text-sm font-semibold text-slate-600">Bekleyen Sevkiyat</p>
          <p className="mt-2 text-3xl font-bold text-[#10213e]">{stats.pendingShipments}</p>
          <p className="mt-1 text-xs text-[#d85f1c]">Operasyon işlemi bekliyor</p>
        </Card>
        <Card className="group border-slate-200 border-t-4 border-t-cyan-500 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600"><BarChart3 className="h-5 w-5" /></div>
          <p className="text-sm font-semibold text-slate-600">Teslim Başarı Oranı</p>
          <p className="mt-2 text-3xl font-bold text-[#10213e]">%{stats.successRate}</p>
          <p className="mt-1 text-xs text-cyan-700">{stats.totalShipments} sevkiyat üzerinden</p>
        </Card>
      </div>

      {(canManageCustomers || canManageWorkOrders) && (
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm md:p-6">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div><p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-[#e96d25]">Günlük çalışma alanı</p><h2 className="text-2xl font-bold text-[#10213e]">Hızlı İşlemler</h2></div>
            <span className="hidden text-sm text-slate-500 sm:block">Sık kullanılan işlemlere tek adımda ulaşın</span>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {canManageCustomers && <Card className="border-blue-100 bg-gradient-to-br from-white to-blue-50/70 p-6 shadow-none">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#173f73] text-white"><Users className="h-5 w-5" /></div>
              <h3 className="mb-2 text-lg font-semibold text-[#10213e]">Yeni Cari Ekle</h3>
              <p className="mb-5 text-sm text-slate-600">Müşteri veya tedarikçi kaydı oluşturun.</p>
              <Button className="w-full bg-[#173f73] hover:bg-[#102f58]" onClick={() => setIsCariFormOpen(true)}><Plus className="w-4 h-4 mr-2" />Cari Formu Aç</Button>
            </Card>}
            {canManageWorkOrders && <Card className="border-orange-100 bg-gradient-to-br from-white to-orange-50/80 p-6 shadow-none">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e96d25] text-white"><Package className="h-5 w-5" /></div>
              <h3 className="mb-2 text-lg font-semibold text-[#10213e]">Yeni İş Girişi</h3>
              <p className="mb-5 text-sm text-slate-600">Yeni sevkiyat kaydı oluşturun.</p>
              <Button className="w-full bg-[#e96d25] hover:bg-[#d95e1d]" onClick={() => setIsIsGirisFormOpen(true)}><Package className="w-4 h-4 mr-2" />İş Giriş Formu Aç</Button>
            </Card>}
          </div>
        </div>
      )}
    </div>
  );

  const renderModuleContent = () => {
    if (!canAccessModule(role, activeModule, permissions)) return renderDashboard();
    switch (activeModule) {
      case "crm": return <CRMWorkspace permissions={permissions} />;
      case "logistics": return <LogisticsModule />;
      case "accounting": return <AccountingModule permissions={permissions} />;
      case "hr": return <HRModule />;
      case "analytics": return <AnalyticsModule />;
      case "reports": return <ReportsModule />;
      case "integrations": return <IntegrationsModule permissions={permissions} />;
      case "settings": return <SettingsModule />;
      default: return renderDashboard();
    }
  };

  return (
    <>
      <SEO title="Rex Portal - Dashboard" description="Rex Lojistik güvenli personel yönetim paneli" />
      <SidebarProvider defaultOpen={false}>
        <div className="rex-portal-canvas flex min-h-screen w-full bg-[#f5f7fb]">
          <aside className={`fixed lg:sticky top-0 left-0 z-40 h-screen bg-[linear-gradient(180deg,#10213e_0%,#0b1830_100%)] text-white shadow-[12px_0_36px_rgba(16,33,62,0.16)] transform transition-all duration-300 overflow-hidden group flex flex-col border-t-4 border-[#e96d25] ${sidebarOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0 w-72 lg:w-[80px] lg:hover:w-72"}`}>
            <div className="p-4 lg:p-5 border-b border-white/10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="relative w-14 h-10 min-w-10 overflow-hidden rounded-xl bg-white shadow-[0_6px_16px_rgba(0,0,0,0.18)] ring-1 ring-white/20">
                    <img src="/rex-logo-header.png" alt="Rex Lojistik" className="absolute left-0 top-1/2 h-auto w-20 max-w-none -translate-y-1/2" />
                  </div>
                  <span className={`text-xl font-bold tracking-tight whitespace-nowrap ${sidebarOpen ? "opacity-100" : "lg:opacity-0 lg:group-hover:opacity-100"}`}>Rex Portal</span>
                </div>
                <button aria-label="Menüyü kapat" onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 hover:bg-slate-800 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              <div className={`pb-2 ${sidebarOpen ? "opacity-100" : "lg:opacity-0 lg:h-0 lg:group-hover:opacity-100 lg:group-hover:h-auto overflow-hidden"}`}>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 min-w-10 bg-[#e96d25] rounded-xl flex items-center justify-center font-bold shadow-lg shadow-orange-950/20">{user?.email?.[0]?.toUpperCase() || "R"}</div>
                  <div className="whitespace-nowrap overflow-hidden"><h3 className="font-semibold">{displayName}</h3><p className="text-sm text-blue-200/70">{roleLabels[role]}</p></div>
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
                      <button onClick={() => void handleModuleClick(module.id)} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${isActive ? "bg-gradient-to-r from-[#e96d25] to-[#f08a45] text-white shadow-lg shadow-orange-950/20" : "text-blue-100/75 hover:bg-white/10 hover:text-white"}`} title={module.name}>
                        <Icon className="min-w-5 w-5 h-5" /><span className={`font-medium text-sm whitespace-nowrap ${sidebarOpen ? "opacity-100" : "lg:opacity-0 lg:group-hover:opacity-100"}`}>{module.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className="p-3 border-t border-white/10">
              <button onClick={() => void handleLogout()} className="w-full flex items-center gap-3 px-3 py-3 text-blue-100/70 hover:bg-white/10 hover:text-white rounded-xl transition-colors">
                <LogOut className="min-w-5 w-5 h-5" /><span className={`font-medium text-sm whitespace-nowrap ${sidebarOpen ? "opacity-100" : "lg:opacity-0 lg:group-hover:opacity-100"}`}>Çıkış Yap</span>
              </button>
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <div className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur border-b-2 border-[#e96d25]/70 px-4 py-3 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3"><div className="relative w-12 h-8 overflow-hidden rounded-lg bg-white border"><img src="/rex-logo-header.png" alt="Rex Lojistik" className="absolute left-0 top-1/2 h-auto w-[4.5rem] max-w-none -translate-y-1/2" /></div><span className="font-bold text-lg">Rex Portal</span></div>
              <div className="flex items-center gap-2">
                <Button onClick={() => void handleLogout()} variant="outline" size="sm"><LogOut className="w-4 h-4 mr-1" />Çıkış</Button>
                <button aria-label="Menüyü aç" onClick={() => setSidebarOpen((value) => !value)} className="p-2 hover:bg-gray-100 rounded-lg">{sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button>
              </div>
            </div>
            <div className="mx-auto max-w-[1680px] p-4 md:p-6 lg:p-8">{renderModuleContent()}</div>
          </main>
          {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
        </div>
      </SidebarProvider>

      {canManageCustomers && <CariForm isOpen={isCariFormOpen} onClose={() => setIsCariFormOpen(false)} />}
      {canManageWorkOrders && <IsGirisForm isOpen={isIsGirisFormOpen} onClose={() => setIsIsGirisFormOpen(false)} />}
    </>
  );
}
