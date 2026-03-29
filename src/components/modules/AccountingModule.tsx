import { useState, useEffect } from "react";
import { FileText, DollarSign, TrendingUp, TrendingDown, Clock, CheckCircle2, AlertCircle, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { accountingService } from "@/services/accountingService";

export function AccountingModule() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalRevenue: 0, paid: 0, pending: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [invoiceData, statsData] = await Promise.all([
        accountingService.getInvoices(),
        accountingService.getFinancialStats()
      ]);
      setInvoices(invoiceData);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading accounting data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      "Ödendi": { color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
      "Bekliyor": { color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
      "Gecikmiş": { color: "bg-red-100 text-red-700 border-red-200", icon: AlertCircle }
    };
    return configs[status as keyof typeof configs] || configs["Bekliyor"];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Finansal veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Muhasebe</h2>
          <p className="text-gray-600 mt-1">Fatura ve ödeme yönetimi</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Yeni Fatura
          </Button>
          <Button variant="outline">
            <DollarSign className="w-4 h-4 mr-2" />
            Ödeme Kaydet
          </Button>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Toplam Gelir</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">₺{stats.totalRevenue.toLocaleString('tr-TR')}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-600" />
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Ödenen</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.paid}</p>
            </div>
            <CheckCircle2 className="w-10 h-10 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Bekleyen</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pending}</p>
            </div>
            <Clock className="w-10 h-10 text-yellow-600" />
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Gecikmiş</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.overdue}</p>
            </div>
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fatura No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Müşteri</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tutar</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vergi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Toplam</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşlemler</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => {
                const statusConfig = getStatusConfig(invoice.status);
                const StatusIcon = statusConfig.icon;
                const total = Number(invoice.amount) + Number(invoice.tax);

                return (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="font-medium text-gray-900">{invoice.invoice_no}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-900">{invoice.customers?.company || invoice.customers?.name || "N/A"}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      ₺{Number(invoice.amount).toLocaleString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      ₺{Number(invoice.tax).toLocaleString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                      ₺{total.toLocaleString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={statusConfig.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {invoice.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('tr-TR') : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button variant="ghost" size="sm">Detay</Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}