import { useEffect, useState } from "react";
import { BarChart3, Download, Package, Users, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { AppRole, getCurrentUserRole } from "@/lib/access-control";
import { useToast } from "@/hooks/use-toast";

type ReportSummary = {
  totalShipments: number;
  deliveredShipments: number;
  successRate: number;
  customers: number;
  sales: number;
  purchases: number;
};

const initialSummary: ReportSummary = {
  totalShipments: 0,
  deliveredShipments: 0,
  successRate: 0,
  customers: 0,
  sales: 0,
  purchases: 0,
};

function csvValue(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function downloadCsv(fileName: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return false;
  const headers = Object.keys(rows[0]);
  const content = [headers.map(csvValue).join(","), ...rows.map((row) => headers.map((header) => csvValue(row[header])).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
  return true;
}

export function ReportsModule() {
  const { toast } = useToast();
  const [role, setRole] = useState<AppRole | null>(null);
  const [summary, setSummary] = useState(initialSummary);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const currentRole = await getCurrentUserRole(user.id);
      setRole(currentRole);

      const { data: dashboard } = await supabase.rpc("rex_dashboard_stats" as any);
      const next = { ...initialSummary, ...(dashboard as any || {}) };

      if (currentRole && ["admin", "sales", "operations", "accounting"].includes(currentRole)) {
        const { count } = await supabase.from("customers").select("id", { count: "exact", head: true });
        next.customers = count || 0;
      }

      if (currentRole === "admin" || currentRole === "accounting") {
        const [{ data: sales }, { data: purchases }] = await Promise.all([
          supabase.from("sales_invoices").select("grand_total"),
          supabase.from("purchases").select("total"),
        ]);
        next.sales = (sales || []).reduce((total, row) => total + Number(row.grand_total || 0), 0);
        next.purchases = (purchases || []).reduce((total, row) => total + Number(row.total || 0), 0);
      }

      setSummary(next);
      setLoading(false);
    };
    void load();
  }, []);

  const exportReport = async (type: "shipments" | "customers" | "finance") => {
    let rows: Record<string, unknown>[] = [];
    let fileName = "rex_rapor.csv";

    if (type === "shipments") {
      const { data, error } = await supabase.from("shipments").select("shipment_code,pickup_date,sender_name,receiver,sender_ii,receiver_district,receiver_ii,status,delivery_date").order("pickup_date", { ascending: false });
      if (error) return toast({ title: "Yetki gerekli", description: "Sevkiyat raporu için operasyon yetkisi gerekiyor.", variant: "destructive" });
      rows = data || [];
      fileName = "sevkiyat_raporu.csv";
    } else if (type === "customers") {
      const { data, error } = await supabase.from("customers").select("customer_code,name,account_type,city,status").order("name");
      if (error) return toast({ title: "Yetki gerekli", description: "Cari raporu için CRM yetkisi gerekiyor.", variant: "destructive" });
      rows = data || [];
      fileName = "cari_raporu.csv";
    } else {
      const { data, error } = await supabase.from("sales_invoices").select("invoice_no,invoice_date,grand_total,currency,payment_status").order("invoice_date", { ascending: false });
      if (error) return toast({ title: "Yetki gerekli", description: "Finans raporu için muhasebe yetkisi gerekiyor.", variant: "destructive" });
      rows = data || [];
      fileName = "finans_raporu.csv";
    }

    if (!downloadCsv(fileName, rows)) {
      toast({ title: "Kayıt bulunamadı", description: "Bu rapor için dışarı aktarılacak kayıt yok." });
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Raporlar hazırlanıyor...</div>;

  const canLogistics = role === "admin" || role === "operations";
  const canFinance = role === "admin" || role === "accounting";
  const canCustomers = canLogistics || canFinance || role === "sales";

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold text-gray-900">Raporlama & Analitik</h1><p className="text-gray-600 mt-1">Canlı veritabanından oluşturulan güncel raporlar</p></div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6"><Package className="w-6 h-6 text-blue-600 mb-3" /><p className="text-sm text-gray-600">Toplam Sevkiyat</p><p className="text-3xl font-bold">{summary.totalShipments}</p></Card>
        <Card className="p-6"><BarChart3 className="w-6 h-6 text-green-600 mb-3" /><p className="text-sm text-gray-600">Teslim Başarı Oranı</p><p className="text-3xl font-bold">%{summary.successRate}</p></Card>
        <Card className="p-6"><Users className="w-6 h-6 text-purple-600 mb-3" /><p className="text-sm text-gray-600">Toplam Cari</p><p className="text-3xl font-bold">{summary.customers}</p></Card>
        <Card className="p-6"><Wallet className="w-6 h-6 text-orange-600 mb-3" /><p className="text-sm text-gray-600">Net Satış - Alış</p><p className="text-2xl font-bold">{(summary.sales - summary.purchases).toLocaleString("tr-TR")} ₺</p></Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Dışarı Aktarılabilir Raporlar</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {canLogistics && <Button variant="outline" onClick={() => void exportReport("shipments")}><Download className="w-4 h-4 mr-2" />Sevkiyat Raporu</Button>}
          {canCustomers && <Button variant="outline" onClick={() => void exportReport("customers")}><Download className="w-4 h-4 mr-2" />Cari Raporu</Button>}
          {canFinance && <Button variant="outline" onClick={() => void exportReport("finance")}><Download className="w-4 h-4 mr-2" />Finans Raporu</Button>}
        </div>
      </Card>
    </div>
  );
}
