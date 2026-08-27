import { useState } from "react";
import { Building2, TrendingUp } from "lucide-react";
import { CRMModule } from "@/components/modules/CRMModule";
import { SalesCRMModule } from "@/components/modules/SalesCRMModule";
import { hasPermission, type PermissionMap } from "@/lib/staff-permissions";

export function CRMWorkspace({ permissions }: { permissions: PermissionMap }) {
  const hasSalesPipeline = hasPermission(permissions, "crm.sales_pipeline");
  const hasCustomers = hasPermission(permissions, "crm.customers") || hasPermission(permissions, "crm.portal_invites");
  const [section, setSection] = useState<"sales" | "accounts">(hasSalesPipeline ? "sales" : "accounts");

  return <div className="p-4 md:p-6">
    {hasSalesPipeline && hasCustomers && <div className="mb-6 inline-flex rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
      <button onClick={() => setSection("sales")} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${section === "sales" ? "bg-[#173f73] text-white shadow" : "text-slate-600 hover:bg-slate-50"}`}><TrendingUp className="h-4 w-4" />Satış CRM</button>
      <button onClick={() => setSection("accounts")} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${section === "accounts" ? "bg-[#173f73] text-white shadow" : "text-slate-600 hover:bg-slate-50"}`}><Building2 className="h-4 w-4" />Cari Hesaplar</button>
    </div>}
    {section === "sales" && hasSalesPipeline ? <SalesCRMModule permissions={permissions} /> : <div className="-m-4 md:-m-6"><CRMModule permissions={permissions} /></div>}
  </div>;
}
