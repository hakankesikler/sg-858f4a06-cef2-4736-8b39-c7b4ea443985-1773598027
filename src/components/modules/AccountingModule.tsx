import { useState, useEffect } from "react";
import { 
  LayoutDashboard, ShoppingCart, ShoppingBag, Receipt, Package, 
  Users, Wallet, FolderOpen, BarChart3, Plus, FileText, 
  DollarSign, TrendingUp, TrendingDown, UserCheck, Handshake, 
  Briefcase, PieChart, Building, CheckCircle, Clock, XCircle, Calendar 
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { accountingService } from "@/services/accountingService";

export function AccountingModule() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  
  // Stats
  const [stats, setStats] = useState<any>({});
  const [dashboardStats, setDashboardStats] = useState<any>({});
  
  // Data states
  const [invoices, setInvoices] = useState<any[]>([]);
  const [salesInvoices, setSalesInvoices] = useState<any[]>([]);
  const [salesInvoiceStats, setSalesInvoiceStats] = useState<any>({});
  const [purchases, setPurchases] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [financialAccounts, setFinancialAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  
  // Cari accounts
  const [customerAccounts, setCustomerAccounts] = useState<any[]>([]);
  const [cariStats, setCariStats] = useState<any>({});
  const [employeeAccounts, setEmployeeAccounts] = useState<any[]>([]);
  const [employeeStats, setEmployeeStats] = useState<any>({});
  const [partnerAccounts, setPartnerAccounts] = useState<any[]>([]);
  const [partnerStats, setPartnerStats] = useState<any>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [
        statsData,
        dashboardData,
        invoiceData,
        salesInvoiceData,
        salesStatsData,
        purchaseData,
        expenseData,
        productData,
        customerData,
        cariStatsData,
        accountData,
        transactionData,
        projectData,
        employeeData,
        employeeStatsData,
        partnerData,
        partnerStatsData
      ] = await Promise.all([
        accountingService.getFinancialStats(),
        accountingService.getDashboardStats(),
        accountingService.getInvoices(),
        accountingService.getSalesInvoices(),
        accountingService.getSalesInvoiceStats(),
        accountingService.getPurchases(),
        accountingService.getExpenses(),
        accountingService.getProducts(),
        accountingService.getCustomerAccounts(),
        accountingService.getCustomerAccountStats(),
        accountingService.getFinancialAccounts(),
        accountingService.getTransactions(),
        accountingService.getProjects(),
        accountingService.getEmployeeAccounts(),
        accountingService.getEmployeeAccountStats(),
        accountingService.getPartnerAccounts(),
        accountingService.getPartnerAccountStats()
      ]);

      setStats(statsData);
      setDashboardStats(dashboardData);
      setInvoices(invoiceData);
      setSalesInvoices(salesInvoiceData);
      setSalesInvoiceStats(salesStatsData);
      setPurchases(purchaseData);
      setExpenses(expenseData);
      setProducts(productData);
      setProjects(projectData);
      setFinancialAccounts(accountData);
      setTransactions(transactionData);
      setCustomerAccounts(customerData);
      setCariStats(cariStatsData);
      setEmployeeAccounts(employeeData);
      setEmployeeStats(employeeStatsData);
      setPartnerAccounts(partnerData);
      setPartnerStats(partnerStatsData);
    } catch (error) {
      console.error("Error loading accounting data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: any }> = {
      "Ödendi": { color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle },
      "Tamamlandı": { color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle },
      "Bekliyor": { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock },
      "Planlama": { color: "bg-blue-100 text-blue-800 border-blue-200", icon: Clock },
      "Devam Ediyor": { color: "bg-blue-100 text-blue-800 border-blue-200", icon: Clock },
      "Gecikmiş": { color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
      "İptal": { color: "bg-gray-100 text-gray-800 border-gray-200", icon: XCircle }
    };
    return config[status] || { color: "bg-gray-100 text-gray-800", icon: Clock };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Muhasebe ve Finans</h1>
        <p className="text-gray-600 mt-2">Finansal yönetim ve raporlama sistemi</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 lg:grid-cols-9 gap-1">
          <TabsTrigger value="dashboard">
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Panel
          </TabsTrigger>
          <TabsTrigger value="satis">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Satış
          </TabsTrigger>
          <TabsTrigger value="satin-alma">
            <ShoppingBag className="w-4 h-4 mr-2" />
            Satın Alma
          </TabsTrigger>
          <TabsTrigger value="giderler">
            <Receipt className="w-4 h-4 mr-2" />
            Giderler
          </TabsTrigger>
          <TabsTrigger value="urunler">
            <Package className="w-4 h-4 mr-2" />
            Ürün/Hizmet
          </TabsTrigger>
          <TabsTrigger value="cari">
            <Users className="w-4 h-4 mr-2" />
            Cari Hesaplar
          </TabsTrigger>
          <TabsTrigger value="finans">
            <Wallet className="w-4 h-4 mr-2" />
            Finans
          </TabsTrigger>
          <TabsTrigger value="projeler">
            <FolderOpen className="w-4 h-4 mr-2" />
            Projeler
          </TabsTrigger>
          <TabsTrigger value="raporlar">
            <BarChart3 className="w-4 h-4 mr-2" />
            Raporlar
          </TabsTrigger>
        </TabsList>

        {/* Dashboard */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6 border-l-4 border-l-green-500">
              <p className="text-sm text-gray-600 mb-2">Satış Geliri</p>
              <p className="text-3xl font-bold text-green-600">
                ₺{(dashboardStats.salesRevenue || 0).toLocaleString('tr-TR')}
              </p>
            </Card>
            <Card className="p-6 border-l-4 border-l-red-500">
              <p className="text-sm text-gray-600 mb-2">Alım Maliyeti</p>
              <p className="text-3xl font-bold text-red-600">
                ₺{(dashboardStats.purchaseCosts || 0).toLocaleString('tr-TR')}
              </p>
            </Card>
            <Card className="p-6 border-l-4 border-l-orange-500">
              <p className="text-sm text-gray-600 mb-2">Giderler</p>
              <p className="text-3xl font-bold text-orange-600">
                ₺{(dashboardStats.expenseCosts || 0).toLocaleString('tr-TR')}
              </p>
            </Card>
            <Card className="p-6 border-l-4 border-l-blue-500">
              <p className="text-sm text-gray-600 mb-2">Net Kar</p>
              <p className="text-3xl font-bold text-blue-600">
                ₺{(dashboardStats.totalProfit || 0).toLocaleString('tr-TR')}
              </p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <p className="text-sm text-gray-600 mb-2">Aktif Projeler</p>
              <p className="text-2xl font-bold">{dashboardStats.activeProjects || 0}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-gray-600 mb-2">Bekleyen Faturalar</p>
              <p className="text-2xl font-bold">{dashboardStats.pendingInvoices || 0}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-gray-600 mb-2">Gecikmiş Faturalar</p>
              <p className="text-2xl font-bold text-red-600">{dashboardStats.overdueInvoices || 0}</p>
            </Card>
          </div>
        </TabsContent>

        {/* Cari Hesaplar with 3 Sub-tabs */}
        <TabsContent value="cari" className="space-y-6">
          <Tabs defaultValue="genel" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="genel" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Genel Cariler
              </TabsTrigger>
              <TabsTrigger value="personel" className="flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Personel Carileri
              </TabsTrigger>
              <TabsTrigger value="ortaklar" className="flex items-center gap-2">
                <Handshake className="w-4 h-4" />
                Ortaklar Carileri
              </TabsTrigger>
            </TabsList>

            {/* Genel Cariler */}
            <TabsContent value="genel" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-6 border-l-4 border-l-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Toplam Alacak</p>
                      <p className="text-2xl font-bold text-green-600">
                        ₺{(cariStats.totalReceivables || 0).toLocaleString('tr-TR')}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                </Card>
                <Card className="p-6 border-l-4 border-l-red-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Toplam Borç</p>
                      <p className="text-2xl font-bold text-red-600">
                        ₺{(cariStats.totalPayables || 0).toLocaleString('tr-TR')}
                      </p>
                    </div>
                    <TrendingDown className="w-8 h-8 text-red-500" />
                  </div>
                </Card>
                <Card className="p-6 border-l-4 border-l-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Net Pozisyon</p>
                      <p className={`text-2xl font-bold ${(cariStats.netPosition || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₺{Math.abs(cariStats.netPosition || 0).toLocaleString('tr-TR')}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-blue-500" />
                  </div>
                </Card>
                <Card className="p-6 border-l-4 border-l-purple-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Cari Sayısı</p>
                      <p className="text-2xl font-bold">{cariStats.accountCount || 0}</p>
                    </div>
                    <Users className="w-8 h-8 text-purple-500" />
                  </div>
                </Card>
              </div>

              <Card>
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">Müşteri ve Tedarikçi Hesapları</h3>
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Yeni Cari
                    </Button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cari Adı</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tip</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bakiye</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İletişim</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {customerAccounts.map((account) => {
                        const balance = Number(account.balance) || 0;
                        return (
                          <tr key={account.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="font-medium text-gray-900">{account.company || account.name}</div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant="outline">{account.account_type || "Müşteri"}</Badge>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`font-bold ${balance < 0 ? 'text-green-600' : balance > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                {balance < 0 ? '-' : balance > 0 ? '+' : ''}₺{Math.abs(balance).toLocaleString('tr-TR')}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">{account.email || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>

            {/* Personel Carileri */}
            <TabsContent value="personel" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-6 border-l-4 border-l-orange-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Şirkete Borç</p>
                      <p className="text-2xl font-bold text-orange-600">
                        ₺{(employeeStats.totalOwed || 0).toLocaleString('tr-TR')}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-orange-500" />
                  </div>
                </Card>
                <Card className="p-6 border-l-4 border-l-yellow-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Toplam Avans</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        ₺{(employeeStats.totalAdvances || 0).toLocaleString('tr-TR')}
                      </p>
                    </div>
                    <Wallet className="w-8 h-8 text-yellow-500" />
                  </div>
                </Card>
                <Card className="p-6 border-l-4 border-l-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Aylık Maaş</p>
                      <p className="text-2xl font-bold text-blue-600">
                        ₺{(employeeStats.monthlySalaryBudget || 0).toLocaleString('tr-TR')}
                      </p>
                    </div>
                    <Briefcase className="w-8 h-8 text-blue-500" />
                  </div>
                </Card>
                <Card className="p-6 border-l-4 border-l-purple-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Personel</p>
                      <p className="text-2xl font-bold">{employeeStats.accountCount || 0}</p>
                    </div>
                    <UserCheck className="w-8 h-8 text-purple-500" />
                  </div>
                </Card>
              </div>

              <Card>
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">Personel Cari Hesapları</h3>
                    <Button className="bg-orange-600 hover:bg-orange-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Yeni Hesap
                    </Button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Personel</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hesap Kodu</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Maaş</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avans</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bakiye</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {employeeAccounts.map((account) => {
                        const balance = Number(account.balance) || 0;
                        return (
                          <tr key={account.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="font-medium text-gray-900">
                                {account.employees?.first_name} {account.employees?.last_name}
                              </div>
                              <div className="text-sm text-gray-500">{account.employees?.position}</div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant="outline">{account.account_code}</Badge>
                            </td>
                            <td className="px-6 py-4">₺{(account.salary || 0).toLocaleString('tr-TR')}</td>
                            <td className="px-6 py-4 text-yellow-600">
                              ₺{(account.advance_balance || 0).toLocaleString('tr-TR')}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`font-bold ${balance < 0 ? 'text-green-600' : balance > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                {balance < 0 ? '-' : balance > 0 ? '+' : ''}₺{Math.abs(balance).toLocaleString('tr-TR')}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>

            {/* Ortaklar Carileri */}
            <TabsContent value="ortaklar" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-6 border-l-4 border-l-indigo-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Toplam Sermaye</p>
                      <p className="text-2xl font-bold text-indigo-600">
                        ₺{(partnerStats.totalCapital || 0).toLocaleString('tr-TR')}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-indigo-500" />
                  </div>
                </Card>
                <Card className="p-6 border-l-4 border-l-cyan-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Net Bakiye</p>
                      <p className={`text-2xl font-bold ${(partnerStats.totalBalance || 0) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ₺{Math.abs(partnerStats.totalBalance || 0).toLocaleString('tr-TR')}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-cyan-500" />
                  </div>
                </Card>
                <Card className="p-6 border-l-4 border-l-pink-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Toplam Pay</p>
                      <p className="text-2xl font-bold text-pink-600">{(partnerStats.totalShares || 0).toFixed(1)}%</p>
                    </div>
                    <PieChart className="w-8 h-8 text-pink-500" />
                  </div>
                </Card>
                <Card className="p-6 border-l-4 border-l-teal-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Ortak Sayısı</p>
                      <p className="text-2xl font-bold">{partnerStats.partnerCount || 0}</p>
                    </div>
                    <Handshake className="w-8 h-8 text-teal-500" />
                  </div>
                </Card>
              </div>

              <Card>
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">Ortak Cari Hesapları</h3>
                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Yeni Ortak
                    </Button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ortak Adı</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tip</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pay %</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sermaye</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bakiye</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {partnerAccounts.map((partner) => {
                        const balance = Number(partner.balance) || 0;
                        return (
                          <tr key={partner.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="font-medium text-gray-900">{partner.partner_name}</div>
                              <div className="text-sm text-gray-500">{partner.account_code}</div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                                {partner.partner_type}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-bold text-pink-600">{(partner.share_percentage || 0).toFixed(1)}%</span>
                            </td>
                            <td className="px-6 py-4 font-bold text-indigo-600">
                              ₺{(partner.capital_contribution || 0).toLocaleString('tr-TR')}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`font-bold ${balance < 0 ? 'text-green-600' : balance > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                {balance < 0 ? '-' : balance > 0 ? '+' : ''}₺{Math.abs(balance).toLocaleString('tr-TR')}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Satış Yönetimi Tab */}
        <TabsContent value="satis" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6 border-l-4 border-l-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Toplam Ciro</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₺{salesInvoiceStats.totalRevenue?.toLocaleString('tr-TR') || 0}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Aylık Ciro</p>
                  <p className="text-2xl font-bold text-blue-600">
                    ₺{salesInvoiceStats.monthlyRevenue?.toLocaleString('tr-TR') || 0}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-l-emerald-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ödenen Faturalar</p>
                  <p className="text-2xl font-bold text-gray-900">{salesInvoiceStats.paidInvoices || 0}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-l-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Bekleyen</p>
                  <p className="text-2xl font-bold text-orange-600">{salesInvoiceStats.pendingInvoices || 0}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
            </Card>
          </div>

          {/* Invoices Table */}
          <Card className="overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Satış Faturaları</h3>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni Fatura
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              {salesInvoices.map((invoice) => {
                const statusConfig = getStatusBadge(invoice.payment_status);
                const StatusIcon = statusConfig.icon;

                return (
                  <div key={invoice.id} className="border-b border-gray-200 last:border-b-0">
                    {/* Invoice Header */}
                    <div className="bg-gray-50 px-6 py-4 grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-2">
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="font-bold text-gray-900">{invoice.invoice_no}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(invoice.invoice_date).toLocaleDateString('tr-TR')}
                        </div>
                      </div>

                      <div className="col-span-3">
                        <div className="font-medium text-gray-900">
                          {invoice.customers?.company || invoice.customers?.name}
                        </div>
                        <div className="text-sm text-gray-500">{invoice.customers?.tax_id}</div>
                      </div>

                      <div className="col-span-2 text-right">
                        <div className="text-sm text-gray-600">Ara Toplam</div>
                        <div className="font-medium text-gray-900">
                          ₺{Number(invoice.subtotal).toLocaleString('tr-TR')}
                        </div>
                      </div>

                      <div className="col-span-2 text-right">
                        <div className="text-sm text-gray-600">KDV</div>
                        <div className="font-medium text-gray-900">
                          ₺{Number(invoice.total_tax).toLocaleString('tr-TR')}
                        </div>
                      </div>

                      <div className="col-span-2 text-right">
                        <div className="text-sm text-gray-600">Genel Toplam</div>
                        <div className="font-bold text-lg text-green-600">
                          ₺{Number(invoice.grand_total).toLocaleString('tr-TR')}
                        </div>
                      </div>

                      <div className="col-span-1 flex justify-end">
                        <Badge className={statusConfig.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {invoice.payment_status}
                        </Badge>
                      </div>
                    </div>

                    {/* Invoice Items */}
                    {invoice.sales_invoice_items && invoice.sales_invoice_items.length > 0 && (
                      <div className="px-6 py-3 bg-white">
                        <table className="min-w-full">
                          <thead>
                            <tr className="text-xs text-gray-500 border-b">
                              <th className="py-2 text-left">Ürün/Hizmet Kodu</th>
                              <th className="py-2 text-left">Açıklama</th>
                              <th className="py-2 text-center">Miktar</th>
                              <th className="py-2 text-center">Birim</th>
                              <th className="py-2 text-right">Birim Fiyat</th>
                              <th className="py-2 text-right">KDV %</th>
                              <th className="py-2 text-right">İskonto</th>
                              <th className="py-2 text-right">Toplam</th>
                            </tr>
                          </thead>
                          <tbody>
                            {invoice.sales_invoice_items.map((item: any) => (
                              <tr key={item.id} className="text-sm border-b last:border-b-0">
                                <td className="py-2 text-gray-900 font-mono">{item.product_code}</td>
                                <td className="py-2 text-gray-700">{item.description}</td>
                                <td className="py-2 text-center text-gray-900">{item.quantity}</td>
                                <td className="py-2 text-center text-gray-600">{item.unit}</td>
                                <td className="py-2 text-right text-gray-900">
                                  ₺{Number(item.unit_price).toLocaleString('tr-TR')}
                                </td>
                                <td className="py-2 text-right text-gray-600">{item.tax_rate}%</td>
                                <td className="py-2 text-right text-red-600">
                                  {item.discount_amount > 0 ? `-₺${Number(item.discount_amount).toLocaleString('tr-TR')}` : '-'}
                                </td>
                                <td className="py-2 text-right font-bold text-gray-900">
                                  ₺{Number(item.total).toLocaleString('tr-TR')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {/* Invoice Footer Info */}
                        {(invoice.shipping_cost > 0 || invoice.general_discount > 0 || invoice.notes) && (
                          <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-4">
                            <div>
                              {invoice.notes && (
                                <div className="text-sm">
                                  <span className="font-medium text-gray-700">Not:</span>
                                  <p className="text-gray-600 mt-1">{invoice.notes}</p>
                                </div>
                              )}
                            </div>
                            <div className="text-right space-y-1 text-sm">
                              {invoice.general_discount > 0 && (
                                <div className="flex justify-end gap-2">
                                  <span className="text-gray-600">Genel İskonto:</span>
                                  <span className="font-medium text-red-600">
                                    -₺{Number(invoice.general_discount).toLocaleString('tr-TR')}
                                  </span>
                                </div>
                              )}
                              {invoice.shipping_cost > 0 && (
                                <div className="flex justify-end gap-2">
                                  <span className="text-gray-600">Kargo Ücreti:</span>
                                  <span className="font-medium text-gray-900">
                                    +₺{Number(invoice.shipping_cost).toLocaleString('tr-TR')}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-end gap-2 pt-2 border-t">
                                <span className="text-gray-600">Vade:</span>
                                <span className="font-medium text-gray-900">
                                  {new Date(invoice.due_date).toLocaleDateString('tr-TR')}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="satin-alma">
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Satın Alma Yönetimi</h3>
            <p className="text-gray-600">Alış faturaları ve tedarikçi yönetimi.</p>
          </Card>
        </TabsContent>

        <TabsContent value="giderler">
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Genel Giderler</h3>
            <p className="text-gray-600">Gider kayıtları ve kategori yönetimi.</p>
          </Card>
        </TabsContent>

        <TabsContent value="urunler">
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Ürün ve Hizmetler</h3>
            <p className="text-gray-600">Ürün/hizmet kataloğu ve fiyatlandırma.</p>
          </Card>
        </TabsContent>

        <TabsContent value="finans">
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Finans (Kasa/Banka)</h3>
            <p className="text-gray-600">Finansal hesaplar ve işlemler.</p>
          </Card>
        </TabsContent>

        <TabsContent value="projeler">
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Proje Yönetimi</h3>
            <p className="text-gray-600">Proje takibi ve maliyet analizi.</p>
          </Card>
        </TabsContent>

        <TabsContent value="raporlar">
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Finansal Raporlar</h3>
            <p className="text-gray-600">Detaylı finansal raporlar ve analizler.</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}