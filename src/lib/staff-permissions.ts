import type { AppRole, PortalModule } from "@/lib/access-control";

export type PermissionLevel = "none" | "view" | "manage";
export type PermissionOverrideLevel = "inherit" | PermissionLevel;

export const permissionCatalog = [
  { key: "crm.customers", group: "Satış ve CRM", label: "Cari ve müşteriler", description: "Müşteri/tedarikçi kartları ve iletişim bilgileri" },
  { key: "crm.portal_invites", group: "Satış ve CRM", label: "Müşteri portalı", description: "Kurumsal müşteri portalı erişim bağlantıları" },
  { key: "sales.work_orders", group: "Satış ve CRM", label: "Teklif ve iş kayıtları", description: "Yeni iş kaydı, onay ve red işleyişi" },
  { key: "operations.shipments", group: "Operasyon", label: "Sevkiyatlar", description: "Sevkiyat görüntüleme, oluşturma ve düzenleme" },
  { key: "operations.assignments", group: "Operasyon", label: "Sürücü ve araç", description: "Sürücü/araç kayıtları ve sevkiyat ataması" },
  { key: "operations.delivery", group: "Operasyon", label: "Teslim evrakları", description: "Teslim belgesi görüntüleme, yükleme ve tamamlama" },
  { key: "operations.exceptions", group: "Operasyon", label: "İstisna yönetimi", description: "Gecikme, hasar, eksik teslimat ve iade kayıtları" },
  { key: "operations.uetds", group: "Operasyon", label: "U-ETDS", description: "U-ETDS hazırlık, gönderim ve durum ekranları" },
  { key: "accounting.sales", group: "Muhasebe", label: "Satış faturaları", description: "Satış faturası görüntüleme ve faturalandırma" },
  { key: "accounting.purchase", group: "Muhasebe", label: "Alış faturaları", description: "Alış faturası yükleme, eşleştirme ve kontrol" },
  { key: "accounting.accounts", group: "Muhasebe", label: "Hesap ve ödemeler", description: "Tahsilat, ödeme, cari hareket ve finans hesapları" },
  { key: "accounting.expenses", group: "Muhasebe", label: "Giderler", description: "Gider kayıtları ve masraf yönetimi" },
  { key: "reports.sales", group: "Raporlar", label: "Satış raporları", description: "Cari ve satış raporlarını görüntüleme/dışa aktarma" },
  { key: "reports.operations", group: "Raporlar", label: "Operasyon raporları", description: "Sevkiyat ve teslimat raporları" },
  { key: "reports.accounting", group: "Raporlar", label: "Finans raporları", description: "Fatura, ödeme ve kârlılık raporları" },
  { key: "analytics.web", group: "Raporlar", label: "Web Analitik", description: "Site ziyaretçi ve trafik istatistikleri" },
] as const;

export type PermissionKey = (typeof permissionCatalog)[number]["key"];
export type PermissionMap = Record<PermissionKey, PermissionLevel>;
export type PermissionOverrides = Partial<Record<PermissionKey, PermissionLevel>>;

const nonePermissions = Object.fromEntries(permissionCatalog.map((item) => [item.key, "none"])) as PermissionMap;

const roleDefaults: Record<AppRole, PermissionOverrides> = {
  admin: Object.fromEntries(permissionCatalog.map((item) => [item.key, "manage"])) as PermissionOverrides,
  sales: {
    "crm.customers": "manage", "crm.portal_invites": "manage", "sales.work_orders": "manage",
    "reports.sales": "view",
  },
  operations: {
    "crm.customers": "view", "sales.work_orders": "manage", "operations.shipments": "manage",
    "operations.assignments": "manage", "operations.delivery": "manage", "operations.exceptions": "manage",
    "operations.uetds": "manage", "reports.operations": "view", "analytics.web": "view",
  },
  accounting: {
    "crm.customers": "view", "accounting.sales": "manage", "accounting.purchase": "manage",
    "accounting.accounts": "manage", "accounting.expenses": "manage", "reports.accounting": "view",
  },
  hr: {}, viewer: {}, demo: {},
};

export function resolvePermissions(role: AppRole, overrides: PermissionOverrides = {}): PermissionMap {
  return { ...nonePermissions, ...roleDefaults[role], ...overrides };
}

export function basePermissionLevel(role: AppRole, key: PermissionKey): PermissionLevel {
  return roleDefaults[role]?.[key] || "none";
}

export function hasPermission(permissions: PermissionMap, key: PermissionKey, required: "view" | "manage" = "view") {
  const level = permissions[key] || "none";
  return required === "view" ? level === "view" || level === "manage" : level === "manage";
}

export function canAccessModuleWithPermissions(role: AppRole, permissions: PermissionMap, module: PortalModule) {
  if (role === "admin") return true;
  if (module === "dashboard") return true;
  if (module === "crm") return hasPermission(permissions, "crm.customers") || hasPermission(permissions, "crm.portal_invites");
  if (module === "logistics") return ["sales.work_orders", "operations.shipments", "operations.assignments", "operations.delivery", "operations.exceptions", "operations.uetds"].some((key) => hasPermission(permissions, key as PermissionKey));
  if (module === "accounting") return ["accounting.sales", "accounting.purchase", "accounting.accounts", "accounting.expenses"].some((key) => hasPermission(permissions, key as PermissionKey));
  if (module === "analytics") return hasPermission(permissions, "analytics.web");
  if (module === "reports") return ["reports.sales", "reports.operations", "reports.accounting"].some((key) => hasPermission(permissions, key as PermissionKey));
  if (module === "hr") return role === "hr";
  return false;
}
