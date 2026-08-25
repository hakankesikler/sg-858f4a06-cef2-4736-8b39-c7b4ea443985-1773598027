import { supabase } from "@/integrations/supabase/client";
import { canAccessModuleWithPermissions, hasPermission, PermissionMap, PermissionOverrides, resolvePermissions } from "@/lib/staff-permissions";

export type AppRole = "admin" | "sales" | "operations" | "accounting" | "hr" | "viewer" | "demo";
export type PortalModule = "dashboard" | "crm" | "logistics" | "accounting" | "hr" | "analytics" | "reports" | "integrations" | "settings";

export const roleLabels: Record<AppRole, string> = {
  admin: "Yönetici",
  sales: "Satış",
  operations: "Operasyon",
  accounting: "Muhasebe",
  hr: "İnsan Kaynakları",
  viewer: "Rapor Kullanıcısı",
  demo: "Kısıtlı Demo",
};

const roleModules: Record<AppRole, PortalModule[]> = {
  admin: ["dashboard", "crm", "logistics", "accounting", "hr", "analytics", "reports", "integrations", "settings"],
  sales: ["dashboard", "crm", "reports", "integrations"],
  operations: ["dashboard", "crm", "logistics", "analytics", "reports", "integrations"],
  accounting: ["dashboard", "crm", "accounting", "reports", "integrations"],
  hr: ["dashboard", "hr"],
  viewer: ["dashboard"],
  demo: ["dashboard"],
};

export function canAccessModule(role: AppRole, module: PortalModule, permissions?: PermissionMap) {
  if (permissions) return canAccessModuleWithPermissions(role, permissions, module);
  return roleModules[role].includes(module);
}

export function canEditOperations(role: AppRole, permissions?: PermissionMap) {
  if (permissions) return hasPermission(permissions, "operations.shipments", "manage") || hasPermission(permissions, "sales.work_orders", "manage");
  return role === "admin" || role === "operations";
}

export type CurrentUserAccess = { role: AppRole; permissions: PermissionMap };

export async function getCurrentUserRole(userId: string): Promise<AppRole | null> {
  const { data, error } = await supabase
    .from("app_user_roles" as any)
    .select("role, active")
    .eq("user_id", userId)
    .eq("active", true)
    .maybeSingle();

  if (error || !data) return null;
  return (data as unknown as { role: AppRole }).role;
}

export async function getCurrentUserAccess(userId: string): Promise<CurrentUserAccess | null> {
  const role = await getCurrentUserRole(userId);
  if (!role) return null;
  const { data } = await supabase
    .from("staff_permission_overrides" as any)
    .select("permission_key,access_level")
    .eq("user_id", userId);
  const overrides = Object.fromEntries(((data || []) as any[]).map((item) => [item.permission_key, item.access_level])) as PermissionOverrides;
  return { role, permissions: resolvePermissions(role, overrides) };
}
