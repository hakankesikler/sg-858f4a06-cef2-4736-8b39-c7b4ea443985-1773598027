import { useState } from "react";
import { FileText, DollarSign, TrendingUp, TrendingDown, Calendar, Search, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function AccountingModule() {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock fatura verileri
  const invoices = [
    {
      id: "INV-2026-0325",
      customer: "Anadolu Lojistik A.Ş.",
      amount: 45000,
      status: "Ödendi",
      dueDate: "2026-03-25",
      paidDate: "2026-03-23",
      type: "Gelir"
    },
    {
      id: "INV-2026-0326",
      customer: "Ege Taşımacılık Ltd.",
      amount: 32500,
      status: "Bekliyor",
      dueDate: "2026-04-05",
      paidDate: null,
      type: "Gelir"
    },
    {
      id: "INV-2026-0327",
      customer: "Shell Türkiye (Yakıt)",
      amount: 18000,
      status: "Ödendi",
      dueDate: "2026-03-28",
      paidDate: "2026-03-27",
      type: "Gider"
    },
    {
      id: "INV-2026-0328",
      customer: "Akdeniz Gıda San.",
      amount: 67800,
      status: "Gecikmiş",
      dueDate: "2026-03-20",
      paidDate: null,
      type: "Gelir"
    }
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      "Ödendi": "bg-green-100 text-green-700 border-green-200",
      "Bekliyor": "bg-orange-100 text-orange-700 border-orange-200",
      "Gecikmiş": "bg-red-100 text-red-700 border-red-200"
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const totalIncome = invoices.filter(inv => inv.type === "Gelir" && inv.status === "Ödendi").reduce((sum, inv) => sum + inv.amount, 0);
  const totalExpense = invoices.filter(inv => inv.type === "Gider" && inv.status === "Ödendi").reduce((sum, inv) => sum + inv.amount, 0);
  const pending = invoices.filter(inv => inv.status === "Bekliyor").reduce((sum, inv) => sum + inv.amount, 0);
  const overdue = invoices.filter(inv => inv.status === "Gecikmiş").reduce((sum, inv) => sum + inv.amount, 0);

  const filteredInvoices = invoices.filter(inv =>
    inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Muhasebe</h1>
          <p className="text-gray-600 mt-1">Faturalar, ödemeler ve finansal raporlar</p>
        </div>
        <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800">
          <FileText className="w-4 h-4 mr-2" />
          Yeni Fatura
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Toplam Gelir</p>
              <p className="text-3xl font-bold text-green-900 mt-2">₺{totalIncome.toLocaleString()}</p>
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                ↑ 12% bu ay
              </p>
            </div>
            <div className="w-14 h-14 bg-green-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 font-medium">Toplam Gider</p>
              <p className="text-3xl font-bold text-red-900 mt-2">₺{totalExpense.toLocaleString()}</p>
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <TrendingDown className="w-3 h-3" />
                ↓ 5% bu ay
              </p>
            </div>
            <div className="w-14 h-14 bg-red-600 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-7 h-7 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700 font-medium">Bekleyen</p>
              <p className="text-3xl font-bold text-orange-900 mt-2">₺{pending.toLocaleString()}</p>
              <p className="text-xs text-orange-600 mt-1">Tahsil edilecek</p>
            </div>
            <div className="w-14 h-14 bg-orange-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-7 h-7 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium">Net Kar</p>
              <p className="text-3xl font-bold text-purple-900 mt-2">₺{(totalIncome - totalExpense).toLocaleString()}</p>
              <p className="text-xs text-purple-600 mt-1">Bu ay</p>
            </div>
            <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-7 h-7 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Actions */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Fatura ara (ID, müşteri)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filtrele
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Dışa Aktar
          </Button>
        </div>
      </Card>

      {/* Invoices Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Fatura No</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Müşteri/Tedarikçi</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Tutar</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Tür</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Vade Tarihi</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Durum</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">{invoice.id}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-900">{invoice.customer}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className={`font-bold ${invoice.type === "Gelir" ? "text-green-600" : "text-red-600"}`}>
                      {invoice.type === "Gelir" ? "+" : "-"}₺{invoice.amount.toLocaleString()}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={invoice.type === "Gelir" ? "default" : "secondary"}>
                      {invoice.type}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {invoice.dueDate}
                    </div>
                    {invoice.paidDate && (
                      <p className="text-xs text-gray-500 mt-1">Ödendi: {invoice.paidDate}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={getStatusColor(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">Görüntüle</Button>
                      <Button size="sm" variant="outline">İndir</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}