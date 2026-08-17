import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "operations" | "accounting" | "hr" | "viewer" | "demo";
export type PortalModule = "dashboard" | "crm" | "logistics" | "accounting" | "hr" | "analytics" | "reports" | "settings";

export const roleLabels: Record<AppRole, string> = {
  admin: "Yönetici",
  operations: "Operasyon",
  accounting: "Muhasebe",
  hr: "İnsan Kaynakları",
  viewer: "Rapor Kullanıcısı",
  demo: "Kısıtlı Demo",
};

const roleModules: Record<AppRole, PortalModule[]> = {
  admin: ["dashboard", "crm", "logistics", "accounting", "hr", "analytics", "reports", "settings"],
  operations: ["dashboard", "crm", "logistics", "analytics", "reports"],
  accounting: ["dashboard", "crm", "accounting", "reports"],
  hr: ["dashboard", "hr"],
  viewer: ["dashboard"],
  demo: ["dashboard"],
};

export function canAccessModule(role: AppRole, module: PortalModule) {
  return roleModules[role].includes(module);
}

export function canEditOperations(role: AppRole) {
  return role === "admin" || role === "operations";
}

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
