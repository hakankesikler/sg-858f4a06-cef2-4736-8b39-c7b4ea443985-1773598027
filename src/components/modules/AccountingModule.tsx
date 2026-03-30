import { useState, useEffect } from "react";
import { 
  LayoutDashboard, ShoppingCart, ShoppingBag, Receipt, Package, 
  Users, Wallet, FolderOpen, BarChart3, Plus, FileText, 
  DollarSign, TrendingUp, TrendingDown, UserCheck, Handshake, 
  Briefcase, PieChart, Building, CheckCircle, Clock, XCircle, Calendar,
  Search, ArrowUpDown, CheckCircle2, Mail, Download, Filter, FolderKanban,
  Eye, Edit, Trash2
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { accountingService } from "@/services/accountingService";
import { PurchaseInvoiceForm } from "@/components/PurchaseInvoiceForm";
import { ExpenseForm } from "@/components/ExpenseForm";

export function AccountingModule() {
  const [activeTab, setActiveTab] = useState("panel");
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
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
        purchaseData,
        expenseData,
        productData,
        customerData,
        cariStatsData,
        salesInvoiceData,
        salesStatsData,
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
        accountingService.getPurchases(),
        accountingService.getExpenses(),
        accountingService.getProducts(),
        accountingService.getCustomerAccounts(),
        accountingService.getCustomerAccountStats(),
        accountingService.getSalesInvoices(),
        accountingService.getSalesInvoiceStats(),
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
      setPurchases(purchaseData);
      setExpenses(expenseData);
      setProducts(productData);
      setCustomerAccounts(customerData);
      setCariStats(cariStatsData);
      setSalesInvoices(salesInvoiceData);
      setSalesInvoiceStats(salesStatsData);
      setFinancialAccounts(accountData);
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
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-6 border-l-4 border-l-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Toplam Alacak</p>
                      <p className="text-2xl font-bold text-green-600">
                        ₺{customers.general?.filter((c: any) => Number(c.balance || 0) > 0).reduce((sum: number, c: any) => sum + Number(c.balance || 0), 0).toLocaleString('tr-TR') || 0}
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
                        ₺{Math.abs(customers.general?.filter((c: any) => Number(c.balance || 0) < 0).reduce((sum: number, c: any) => sum + Number(c.balance || 0), 0)).toLocaleString('tr-TR') || 0}
                      </p>
                    </div>
                    <TrendingDown className="w-8 h-8 text-red-500" />
                  </div>
                </Card>

                <Card className="p-6 border-l-4 border-l-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Net Pozisyon</p>
                      <p className="text-2xl font-bold text-blue-600">
                        ₺{customers.general?.reduce((sum: number, c: any) => sum + Number(c.balance || 0), 0).toLocaleString('tr-TR') || 0}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-blue-500" />
                  </div>
                </Card>

                <Card className="p-6 border-l-4 border-l-purple-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Cari Sayısı</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {customers.general?.length || 0}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-purple-500" />
                  </div>
                </Card>
              </div>

              {/* Main Content Card */}
              <Card className="overflow-hidden">
                {/* Header with Actions */}
                <div className="p-6 border-b border-gray-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">Müşteri ve Tedarikçi Hesapları</h3>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Search className="w-4 h-4" />
                        Detaylı Arama
                        <ArrowUpDown className="w-3 h-3" />
                      </Button>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input 
                          placeholder="Ara..." 
                          className="pl-9 w-64"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Info Text */}
                  <p className="text-sm text-gray-600">
                    {customers.general?.length || 0} adet kayıt listelenmektedir. Daha fazlası için detaylı arama yapabilirsiniz.
                  </p>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Toplu Seç
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Button className="bg-green-600 hover:bg-green-700 gap-2">
                        <Plus className="w-4 h-4" />
                        Cari Oluştur
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Download className="w-4 h-4" />
                        İçe Aktar
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Download className="w-4 h-4 rotate-180" />
                        Dışarıya Aktar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Filter className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Advanced Customer Table - EXACTLY 8 COLUMNS */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3 text-left w-12">
                          <input type="checkbox" className="rounded border-gray-300" />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                          <div className="flex items-center gap-1">
                            Kod
                            <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                          <div className="flex items-center gap-1">
                            Ünvan
                            <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                          <div className="flex items-center gap-1">
                            Cari Tipi
                            <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                          <div className="flex items-center gap-1">
                            Telefon Numarası
                            <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Etiketler
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                          <div className="flex items-center gap-1">
                            VKN/TCKN
                            <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                          <div className="flex items-center justify-end gap-1">
                            Yerel Bakiye
                            <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {customers.general?.map((customer: any) => {
                        const balance = Number(customer.balance || 0);
                        const customerType = customer.customer_type || "Müşteri";
                        
                        return (
                          <tr key={customer.id} className="hover:bg-gray-50">
                            {/* Checkbox */}
                            <td className="px-3 py-4 whitespace-nowrap">
                              <input type="checkbox" className="rounded border-gray-300" />
                            </td>

                            {/* Kod */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="font-mono text-sm text-gray-900">
                                {customer.customer_code || `CR-${customer.id.substring(0, 6)}`}
                              </span>
                            </td>

                            {/* Ünvan */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Building className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                                <div className="min-w-0">
                                  <div className="font-medium text-gray-900 truncate">
                                    {customer.company_name || customer.full_name || "İsimsiz"}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Cari Tipi */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant="outline" className={
                                customerType === "Müşteri" 
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : customerType === "Tedarikçi"
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : "bg-purple-50 text-purple-700 border-purple-200"
                              }>
                                {customerType === "Müşteri" && <Users className="w-3 h-3 mr-1" />}
                                {customerType === "Tedarikçi" && <ShoppingCart className="w-3 h-3 mr-1" />}
                                {customerType === "Her İkisi" && <Handshake className="w-3 h-3 mr-1" />}
                                {customerType}
                              </Badge>
                            </td>

                            {/* Telefon Numarası */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {customer.phone || "-"}
                            </td>

                            {/* Etiketler */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                {customer.tags?.map((tag: string, idx: number) => (
                                  <Badge 
                                    key={idx}
                                    variant="outline" 
                                    className="text-xs bg-green-50 text-green-700 border-green-200"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                                {(!customer.tags || customer.tags.length === 0) && (
                                  <span className="text-sm text-gray-400">-</span>
                                )}
                              </div>
                            </td>

                            {/* VKN/TCKN */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="font-mono text-sm text-gray-900">
                                {customer.tax_number || customer.id_number || "-"}
                              </span>
                            </td>

                            {/* Yerel Bakiye */}
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className={`font-bold text-base ${
                                balance > 0 
                                  ? 'text-green-600'  // Alacak (müşteri bize borçlu)
                                  : balance < 0
                                  ? 'text-red-600'    // Borç (biz müşteriye borçluyuz)
                                  : 'text-gray-600'   // Dengeli
                              }`}>
                                ₺{Math.abs(balance).toLocaleString('tr-TR')}
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {/* Empty State */}
                      {(!customers.general || customers.general.length === 0) && (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center">
                            <Users className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">Henüz cari kaydı yok</h3>
                            <p className="mt-1 text-sm text-gray-500">
                              Başlamak için yeni bir cari oluşturun.
                            </p>
                            <div className="mt-6">
                              <Button className="bg-green-600 hover:bg-green-700 gap-2">
                                <Plus className="w-4 h-4" />
                                Cari Oluştur
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Footer */}
                {customers.general && customers.general.length > 0 && (
                  <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Toplam {customers.general.length} kayıt gösteriliyor
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" disabled>
                        Önceki
                      </Button>
                      <Button variant="outline" size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                        1
                      </Button>
                      <Button variant="outline" size="sm">
                        2
                      </Button>
                      <Button variant="outline" size="sm">
                        3
                      </Button>
                      <Button variant="outline" size="sm">
                        Sonraki
                      </Button>
                    </div>
                  </div>
                )}
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

          {/* Advanced Invoice List */}
          <Card className="overflow-hidden">
            {/* Header with Actions */}
            <div className="p-6 border-b border-gray-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Satış Faturaları</h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Search className="w-4 h-4" />
                    Detaylı Arama
                    <ArrowUpDown className="w-3 h-3" />
                  </Button>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                      placeholder="Ara..." 
                      className="pl-9 w-64"
                    />
                  </div>
                </div>
              </div>

              {/* Info Text */}
              <p className="text-sm text-gray-600">
                {salesInvoices.length} adet kayıt listelenmektedir. Daha fazlası için detaylı arama yapabilirsiniz.
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Toplu Seç
                  </Button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button 
                    className="bg-green-600 hover:bg-green-700 gap-2"
                    onClick={() => setShowPurchaseForm(true)}
                  >
                    <Plus className="w-4 h-4" />
                    Satış Faturası Oluştur
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    Alış İade Faturası Oluştur
                  </Button>
                  <Button variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 gap-2">
                    <Mail className="w-4 h-4" />
                    e-Fatura Gelen Kutusu
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    İçe Aktar
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4 rotate-180" />
                    Dışarıya Aktar
                  </Button>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Advanced Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-1">
                        e-Fatura Durumu
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-1">
                        Belge Tipi
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-1">
                        Cari Bilgisi
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-1">
                        Proje
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Etiketler
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-1">
                        Seri No
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-1">
                        Durum
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-1">
                        Düzenlenme Tarihi
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-1">
                        Vade Tarihi
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center justify-end gap-1">
                        Fatura Tutarı
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center justify-end gap-1">
                        Takip Tutarı
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center justify-end gap-1">
                        Bakiye
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {salesInvoices.map((invoice) => {
                    const statusConfig = getStatusBadge(invoice.payment_status);
                    const StatusIcon = statusConfig.icon;
                    const balance = Number(invoice.grand_total) - (invoice.payment_date ? Number(invoice.grand_total) : 0);

                    return (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-3 py-4">
                          <input type="checkbox" className="rounded border-gray-300" />
                        </td>
                        
                        {/* e-Fatura Durumu */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {invoice.e_invoice_uuid ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Gönderildi
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                              <XCircle className="w-3 h-3 mr-1" />
                              Gönderilmedi
                            </Badge>
                          )}
                        </td>

                        {/* Belge Tipi */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            <FileText className="w-3 h-3 mr-1" />
                            Satış Faturası
                          </Badge>
                        </td>

                        {/* Cari Bilgisi */}
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <Building className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="font-medium text-gray-900 truncate">
                                {invoice.customers?.company || invoice.customers?.name}
                              </div>
                              <div className="text-sm text-gray-500 truncate">{invoice.customers?.tax_id}</div>
                            </div>
                          </div>
                        </td>

                        {/* Proje */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <FolderKanban className="w-4 h-4 text-gray-400" />
                        </td>

                        {/* Etiketler */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            {invoice.notes && (
                              <Badge variant="outline" className="text-xs">
                                Not var
                              </Badge>
                            )}
                          </div>
                        </td>

                        {/* Seri No */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FileText className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="font-mono text-sm text-gray-900">{invoice.invoice_no}</span>
                          </div>
                        </td>

                        {/* Durum */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={statusConfig.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {invoice.payment_status}
                          </Badge>
                        </td>

                        {/* Düzenlenme Tarihi */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(invoice.invoice_date).toLocaleDateString('tr-TR')}
                        </td>

                        {/* Vade Tarihi */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm">
                            <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                            <span className={`${
                              new Date(invoice.due_date) < new Date() && invoice.payment_status !== "Ödendi"
                                ? "text-red-600 font-medium"
                                : "text-gray-900"
                            }`}>
                              {new Date(invoice.due_date).toLocaleDateString('tr-TR')}
                            </span>
                          </div>
                        </td>

                        {/* Fatura Tutarı */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="font-bold text-gray-900">
                            ₺{Number(invoice.grand_total).toLocaleString('tr-TR')}
                          </div>
                        </td>

                        {/* Takip Tutarı */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm text-gray-900">
                            ₺{Number(invoice.grand_total).toLocaleString('tr-TR')}
                          </div>
                        </td>

                        {/* Bakiye */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className={`font-bold ${
                            balance > 0 ? 'text-orange-600' : 'text-green-600'
                          }`}>
                            ₺{Math.abs(balance).toLocaleString('tr-TR')}
                          </div>
                        </td>

                        {/* İşlemler */}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="hover:bg-blue-50">
                              <Eye className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button variant="ghost" size="sm" className="hover:bg-green-50">
                              <Edit className="w-4 h-4 text-green-600" />
                            </Button>
                            <Button variant="ghost" size="sm" className="hover:bg-red-50">
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Toplam {salesInvoices.length} kayıt gösteriliyor
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  Önceki
                </Button>
                <Button variant="outline" size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                  1
                </Button>
                <Button variant="outline" size="sm">
                  2
                </Button>
                <Button variant="outline" size="sm">
                  3
                </Button>
                <Button variant="outline" size="sm">
                  Sonraki
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Alım Yönetimi (Satınalma) Tab */}
        <TabsContent value="satin-alma" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6 border-l-4 border-l-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Toplam Alım</p>
                  <p className="text-2xl font-bold text-red-600">₺{dashboardStats.totalPurchases?.toLocaleString('tr-TR') || 0}</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-red-500" />
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-l-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Bekleyen Ödemeler</p>
                  <p className="text-2xl font-bold text-orange-600">
                    ₺{purchases.filter(p => p.status === "Bekliyor").reduce((sum, p) => sum + Number(p.subtotal) + Number(p.tax), 0).toLocaleString('tr-TR') || 0}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-l-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ödenen Alımlar</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {purchases.filter(p => p.status === "Ödendi").length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Toplam Fatura</p>
                  <p className="text-2xl font-bold text-gray-900">{purchases.length}</p>
                </div>
                <Receipt className="w-8 h-8 text-blue-500" />
              </div>
            </Card>
          </div>

          {/* Advanced Purchase Invoice List */}
          <Card className="overflow-hidden">
            {/* Header with Actions */}
            <div className="p-6 border-b border-gray-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Alış Faturaları</h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Search className="w-4 h-4" />
                    Detaylı Arama
                    <ArrowUpDown className="w-3 h-3" />
                  </Button>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                      placeholder="Ara..." 
                      className="pl-9 w-64"
                    />
                  </div>
                </div>
              </div>

              {/* Info Text */}
              <p className="text-sm text-gray-600">
                {purchases.length} adet kayıt listelenmektedir. Daha fazlası için detaylı arama yapabilirsiniz.
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Toplu Seç
                  </Button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button 
                    className="bg-green-600 hover:bg-green-700 gap-2"
                    onClick={() => setShowExpenseForm(true)}
                  >
                    <Plus className="w-4 h-4" />
                    Genel Gider Oluştur
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    Satış İade Faturası Oluştur
                  </Button>
                  <Button variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 gap-2">
                    <Mail className="w-4 h-4" />
                    e-Fatura Gelen Kutusu
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    İçe Aktar
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4 rotate-180" />
                    Dışarıya Aktar
                  </Button>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Advanced Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-1">
                        e-Fatura Durumu
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-1">
                        Belge Tipi
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-1">
                        Cari Bilgisi
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-1">
                        Proje
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Etiketler
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-1">
                        Seri No
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-1">
                        Durum
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-1">
                        Düzenlenme Tarihi
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-1">
                        Vade Tarihi
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center justify-end gap-1">
                        Fatura Tutarı
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center justify-end gap-1">
                        Takip Tutarı
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center justify-end gap-1">
                        Onaylanma Bekleyen
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center justify-end gap-1">
                        Bakiye
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {purchases.map((purchase) => {
                    const statusConfig = getStatusBadge(purchase.status);
                    const StatusIcon = statusConfig.icon;
                    const totalAmount = Number(purchase.subtotal) + Number(purchase.tax);
                    const balance = purchase.status === "Ödendi" ? 0 : totalAmount;
                    const pendingApproval = purchase.status === "Bekliyor" ? totalAmount : 0;

                    return (
                      <tr key={purchase.id} className="hover:bg-gray-50">
                        <td className="px-3 py-4">
                          <input type="checkbox" className="rounded border-gray-300" />
                        </td>
                        
                        {/* e-Fatura Durumu */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {Math.random() > 0.5 ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Gönderildi
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                              <XCircle className="w-3 h-3 mr-1" />
                              Gönderilmedi
                            </Badge>
                          )}
                        </td>

                        {/* Belge Tipi */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            <ShoppingCart className="w-3 h-3 mr-1" />
                            Alış Faturası
                          </Badge>
                        </td>

                        {/* Cari Bilgisi (Tedarikçi) */}
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <Building className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="font-medium text-gray-900 truncate">
                                {purchase.supplier_name || "Tedarikçi"}
                              </div>
                              <div className="text-sm text-gray-500 truncate">
                                {purchase.supplier_tax_id || "-"}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Proje */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <FolderKanban className="w-4 h-4 text-gray-400" />
                        </td>

                        {/* Etiketler */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            {purchase.notes && (
                              <Badge variant="outline" className="text-xs">
                                Not var
                              </Badge>
                            )}
                          </div>
                        </td>

                        {/* Seri No */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FileText className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="font-mono text-sm text-gray-900">
                              {purchase.purchase_order_no || `AL-${purchase.id.substring(0, 8)}`}
                            </span>
                          </div>
                        </td>

                        {/* Durum */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={statusConfig.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {purchase.status}
                          </Badge>
                        </td>

                        {/* Düzenlenme Tarihi */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(purchase.purchase_date).toLocaleDateString('tr-TR')}
                        </td>

                        {/* Vade Tarihi */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm">
                            <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                            <span className={`${
                              purchase.delivery_date && new Date(purchase.delivery_date) < new Date() && purchase.status !== "Ödendi"
                                ? "text-red-600 font-medium"
                                : "text-gray-900"
                            }`}>
                              {purchase.delivery_date 
                                ? new Date(purchase.delivery_date).toLocaleDateString('tr-TR')
                                : "-"
                              }
                            </span>
                          </div>
                        </td>

                        {/* Fatura Tutarı */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="font-bold text-gray-900">
                            ₺{totalAmount.toLocaleString('tr-TR')}
                          </div>
                        </td>

                        {/* Takip Tutarı */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm text-gray-900">
                            ₺{totalAmount.toLocaleString('tr-TR')}
                          </div>
                        </td>

                        {/* Onaylanma Bekleyen Tutar */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className={`font-medium ${
                            pendingApproval > 0 ? 'text-orange-600' : 'text-gray-400'
                          }`}>
                            ₺{pendingApproval.toLocaleString('tr-TR')}
                          </div>
                        </td>

                        {/* Bakiye */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className={`font-bold ${
                            balance > 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            ₺{Math.abs(balance).toLocaleString('tr-TR')}
                          </div>
                        </td>

                        {/* İşlemler */}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="hover:bg-blue-50">
                              <Eye className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button variant="ghost" size="sm" className="hover:bg-green-50">
                              <Edit className="w-4 h-4 text-green-600" />
                            </Button>
                            <Button variant="ghost" size="sm" className="hover:bg-red-50">
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Toplam {purchases.length} kayıt gösteriliyor
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  Önceki
                </Button>
                <Button variant="outline" size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                  1
                </Button>
                <Button variant="outline" size="sm">
                  2
                </Button>
                <Button variant="outline" size="sm">
                  3
                </Button>
                <Button variant="outline" size="sm">
                  Sonraki
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Giderler Tab */}
        <TabsContent value="giderler" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6 border-l-4 border-l-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Toplam Gider</p>
                  <p className="text-2xl font-bold text-orange-600">
                    ₺{expenses.reduce((sum, exp) => sum + Number(exp.amount), 0).toLocaleString('tr-TR') || 0}
                  </p>
                </div>
                <Receipt className="w-8 h-8 text-orange-500" />
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-l-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Bu Ay</p>
                  <p className="text-2xl font-bold text-red-600">
                    ₺{expenses.filter(exp => {
                      const expDate = new Date(exp.expense_date);
                      const now = new Date();
                      return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
                    }).reduce((sum, exp) => sum + Number(exp.amount), 0).toLocaleString('tr-TR') || 0}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-red-500" />
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-l-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Bekleyen Ödemeler</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {expenses.filter(exp => exp.status === "Bekliyor").length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-l-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ödenen Giderler</p>
                  <p className="text-2xl font-bold text-green-600">
                    {expenses.filter(exp => exp.status === "Ödendi").length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </Card>
          </div>

          {/* Advanced Expense List */}
          <Card className="overflow-hidden">
            {/* Header with Actions */}
            <div className="p-6 border-b border-gray-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Genel Giderler</h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Search className="w-4 h-4" />
                    Detaylı Arama
                    <ArrowUpDown className="w-3 h-3" />
                  </Button>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                      placeholder="Ara..." 
                      className="pl-9 w-64"
                    />
                  </div>
                </div>
              </div>

              {/* Info Text */}
              <p className="text-sm text-gray-600">
                {expenses.length} adet kayıt listelenmektedir. Daha fazlası için detaylı arama yapabilirsiniz.
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Toplu Seç
                  </Button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button className="bg-green-600 hover:bg-green-700 gap-2">
                    <Plus className="w-4 h-4" />
                    Genel Gider Oluştur
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    İçe Aktar
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4 rotate-180" />
                    Dışarıya Aktar
                  </Button>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Advanced Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-1">
                        Cari Bilgisi
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Etiketler
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-1">
                        Gider Tipi
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-1">
                        Seri No
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-1">
                        Proje
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-1">
                        Durum
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-1">
                        Düzenlenme Tarihi
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-1">
                        Son Ödeme Tarihi
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center justify-end gap-1">
                        Genel İskonto
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center justify-end gap-1">
                        Fatura Tutarı
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center justify-end gap-1">
                        Bakiye
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expenses.map((expense) => {
                    const statusConfig = getStatusBadge(expense.status);
                    const StatusIcon = statusConfig.icon;
                    const balance = expense.status === "Ödendi" ? 0 : Number(expense.amount);

                    return (
                      <tr key={expense.id} className="hover:bg-gray-50">
                        <td className="px-3 py-4">
                          <input type="checkbox" className="rounded border-gray-300" />
                        </td>

                        {/* Cari Bilgisi */}
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <Building className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="font-medium text-gray-900 truncate">
                                {expense.supplier_name || "Genel Gider"}
                              </div>
                              <div className="text-sm text-gray-500 truncate">
                                {expense.category || "-"}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Etiketler */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            {expense.category && (
                              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                {expense.category}
                              </Badge>
                            )}
                          </div>
                        </td>

                        {/* Gider Tipi */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            <Receipt className="w-3 h-3 mr-1" />
                            {expense.expense_type || "Genel Gider"}
                          </Badge>
                        </td>

                        {/* Seri No */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FileText className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="font-mono text-sm text-gray-900">
                              {expense.invoice_no || `GD-${expense.id.substring(0, 8)}`}
                            </span>
                          </div>
                        </td>

                        {/* Proje */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <FolderKanban className="w-4 h-4 text-gray-400" />
                        </td>

                        {/* Durum */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={statusConfig.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {expense.status}
                          </Badge>
                        </td>

                        {/* Düzenlenme Tarihi */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(expense.expense_date).toLocaleDateString('tr-TR')}
                        </td>

                        {/* Son Ödeme Tarihi */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm">
                            <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                            <span className={`${
                              expense.due_date && new Date(expense.due_date) < new Date() && expense.status !== "Ödendi"
                                ? "text-red-600 font-medium"
                                : "text-gray-900"
                            }`}>
                              {expense.due_date 
                                ? new Date(expense.due_date).toLocaleDateString('tr-TR')
                                : "-"
                              }
                            </span>
                          </div>
                        </td>

                        {/* Genel İskonto */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm text-red-600">
                            {expense.discount ? `-₺${Number(expense.discount).toLocaleString('tr-TR')}` : "-"}
                          </div>
                        </td>

                        {/* Fatura Tutarı */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="font-bold text-gray-900">
                            ₺{Number(expense.amount).toLocaleString('tr-TR')}
                          </div>
                        </td>

                        {/* Bakiye */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className={`font-bold ${
                            balance > 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            ₺{Math.abs(balance).toLocaleString('tr-TR')}
                          </div>
                        </td>

                        {/* İşlemler */}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="hover:bg-blue-50">
                              <Eye className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button variant="ghost" size="sm" className="hover:bg-green-50">
                              <Edit className="w-4 h-4 text-green-600" />
                            </Button>
                            <Button variant="ghost" size="sm" className="hover:bg-red-50">
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Toplam {expenses.length} kayıt gösteriliyor
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  Önceki
                </Button>
                <Button variant="outline" size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                  1
                </Button>
                <Button variant="outline" size="sm">
                  2
                </Button>
                <Button variant="outline" size="sm">
                  3
                </Button>
                <Button variant="outline" size="sm">
                  Sonraki
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Alım Yönetimi (Satınalma) Tab */}
        <TabsContent value="satin-alma" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6 border-l-4 border-l-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Toplam Alım</p>
                  <p className="text-2xl font-bold text-red-600">₺{dashboardStats.totalPurchases?.toLocaleString('tr-TR') || 0}</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-red-500" />
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-l-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Bekleyen Ödemeler</p>
                  <p className="text-2xl font-bold text-orange-600">
                    ₺{purchases.filter(p => p.status === "Bekliyor").reduce((sum, p) => sum + Number(p.subtotal) + Number(p.tax), 0).toLocaleString('tr-TR') || 0}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-l-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ödenen Alımlar</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {purchases.filter(p => p.status === "Ödendi").length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Toplam Fatura</p>
                  <p className="text-2xl font-bold text-gray-900">{purchases.length}</p>
                </div>
                <Receipt className="w-8 h-8 text-blue-500" />
              </div>
            </Card>
          </div>

          {/* Advanced Purchase Invoice List */}
          <Card className="overflow-hidden">
            {/* Header with Actions */}
            <div className="p-6 border-b border-gray-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Alış Faturaları</h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Search className="w-4 h-4" />
                    Detaylı Arama
                    <ArrowUpDown className="w-3 h-3" />
                  </Button>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                      placeholder="Ara..." 
                      className="pl-9 w-64"
                    />
                  </div>
                </div>
              </div>

              {/* Info Text */}
              <p className="text-sm text-gray-600">
                {purchases.length} adet kayıt listelenmektedir. Daha fazlası için detaylı arama yapabilirsiniz.
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Toplu Seç
                  </Button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button 
                    className="bg-green-600 hover:bg-green-700 gap-2"
                    onClick={() => setShowPurchaseForm(true)}
                  >
                    <Plus className="w-4 h-4" />
                    Alış Faturası Oluştur
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    Satış İade Faturası Oluştur
                  </Button>
                  <Button variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 gap-2">
                    <Mail className="w-4 h-4" />
                    e-Fatura Gelen Kutusu
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    İçe Aktar
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4 rotate-180" />
                    Dışarıya Aktar
                  </Button>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Advanced Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-1">
                        e-Fatura Durumu
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-1">
                        Belge Tipi
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-1">
                        Cari Bilgisi
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-1">
                        Proje
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Etiketler
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-1">
                        Seri No
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-1">
                        Durum
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-1">
                        Düzenlenme Tarihi
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-1">
                        Vade Tarihi
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center justify-end gap-1">
                        Fatura Tutarı
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center justify-end gap-1">
                        Takip Tutarı
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center justify-end gap-1">
                        Onaylanma Bekleyen
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center justify-end gap-1">
                        Bakiye
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {purchases.map((purchase) => {
                    const statusConfig = getStatusBadge(purchase.status);
                    const StatusIcon = statusConfig.icon;
                    const totalAmount = Number(purchase.subtotal) + Number(purchase.tax);
                    const balance = purchase.status === "Ödendi" ? 0 : totalAmount;
                    const pendingApproval = purchase.status === "Bekliyor" ? totalAmount : 0;

                    return (
                      <tr key={purchase.id} className="hover:bg-gray-50">
                        <td className="px-3 py-4">
                          <input type="checkbox" className="rounded border-gray-300" />
                        </td>
                        
                        {/* e-Fatura Durumu */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {Math.random() > 0.5 ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Gönderildi
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                              <XCircle className="w-3 h-3 mr-1" />
                              Gönderilmedi
                            </Badge>
                          )}
                        </td>

                        {/* Belge Tipi */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            <ShoppingCart className="w-3 h-3 mr-1" />
                            Alış Faturası
                          </Badge>
                        </td>

                        {/* Cari Bilgisi (Tedarikçi) */}
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <Building className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="font-medium text-gray-900 truncate">
                                {purchase.supplier_name || "Tedarikçi"}
                              </div>
                              <div className="text-sm text-gray-500 truncate">
                                {purchase.supplier_tax_id || "-"}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Proje */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <FolderKanban className="w-4 h-4 text-gray-400" />
                        </td>

                        {/* Etiketler */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            {purchase.notes && (
                              <Badge variant="outline" className="text-xs">
                                Not var
                              </Badge>
                            )}
                          </div>
                        </td>

                        {/* Seri No */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FileText className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="font-mono text-sm text-gray-900">
                              {purchase.purchase_order_no || `AL-${purchase.id.substring(0, 8)}`}
                            </span>
                          </div>
                        </td>

                        {/* Durum */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={statusConfig.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {purchase.status}
                          </Badge>
                        </td>

                        {/* Düzenlenme Tarihi */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(purchase.purchase_date).toLocaleDateString('tr-TR')}
                        </td>

                        {/* Vade Tarihi */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm">
                            <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                            <span className={`${
                              purchase.delivery_date && new Date(purchase.delivery_date) < new Date() && purchase.status !== "Ödendi"
                                ? "text-red-600 font-medium"
                                : "text-gray-900"
                            }`}>
                              {purchase.delivery_date 
                                ? new Date(purchase.delivery_date).toLocaleDateString('tr-TR')
                                : "-"
                              }
                            </span>
                          </div>
                        </td>

                        {/* Fatura Tutarı */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="font-bold text-gray-900">
                            ₺{totalAmount.toLocaleString('tr-TR')}
                          </div>
                        </td>

                        {/* Takip Tutarı */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm text-gray-900">
                            ₺{totalAmount.toLocaleString('tr-TR')}
                          </div>
                        </td>

                        {/* Onaylanma Bekleyen Tutar */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className={`font-medium ${
                            pendingApproval > 0 ? 'text-orange-600' : 'text-gray-400'
                          }`}>
                            ₺{pendingApproval.toLocaleString('tr-TR')}
                          </div>
                        </td>

                        {/* Bakiye */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className={`font-bold ${
                            balance > 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            ₺{Math.abs(balance).toLocaleString('tr-TR')}
                          </div>
                        </td>

                        {/* İşlemler */}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="hover:bg-blue-50">
                              <Eye className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button variant="ghost" size="sm" className="hover:bg-green-50">
                              <Edit className="w-4 h-4 text-green-600" />
                            </Button>
                            <Button variant="ghost" size="sm" className="hover:bg-red-50">
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Toplam {purchases.length} kayıt gösteriliyor
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  Önceki
                </Button>
                <Button variant="outline" size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                  1
                </Button>
                <Button variant="outline" size="sm">
                  2
                </Button>
                <Button variant="outline" size="sm">
                  3
                </Button>
                <Button variant="outline" size="sm">
                  Sonraki
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Alım Yönetimi (Satınalma) Tab */}
        <TabsContent value="satin-alma" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6 border-l-4 border-l-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Toplam Alım</p>
                  <p className="text-2xl font-bold text-red-600">₺{dashboardStats.totalPurchases?.toLocaleString('tr-TR') || 0}</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-red-500" />
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-l-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Bekleyen Ödemeler</p>
                  <p className="text-2xl font-bold text-orange-600">
                    ₺{purchases.filter(p => p.status === "Bekliyor").reduce((sum, p) => sum + Number(p.subtotal) + Number(p.tax), 0).toLocaleString('tr-TR') || 0}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-l-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ödenen Alımlar</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {purchases.filter(p => p.status === "Ödendi").length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Toplam Fatura</p>
                  <p className="text-2xl font-bold text-gray-900">{purchases.length}</p>
                </div>
                <Receipt className="w-8 h-8 text-blue-500" />
              </div>
            </Card>
          </div>

          {/* Advanced Purchase Invoice List */}
          <Card className="overflow-hidden">
            {/* Header with Actions */}
            <div className="p-6 border-b border-gray-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Alış Faturaları</h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Search className="w-4 h-4" />
                    Detaylı Arama
                    <ArrowUpDown className="w-3 h-3" />
                  </Button>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input 
                      placeholder="Ara..." 
                      className="pl-9 w-64"
                    />
                  </div>
                </div>
              </div>

              {/* Info Text */}
              <p className="text-sm text-gray-600">
                {purchases.length} adet kayıt listelenmektedir. Daha fazlası için detaylı arama yapabilirsiniz.
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Toplu Seç
                  </Button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button 
                    className="bg-green-600 hover:bg-green-700 gap-2"
                    onClick={() => setShowPurchaseForm(true)}
                  >
                    <Plus className="w-4 h-4" />
                    Alış Faturası Oluştur
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    Satış İade Faturası Oluştur
                  </Button>
                  <Button variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 gap-2">
                    <Mail className="w-4 h-4" />
                    e-Fatura Gelen Kutusu
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    İçe Aktar
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4 rotate-180" />
                    Dışarıya Aktar
                  </Button>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Advanced Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-1">
                        e-Fatura Durumu
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-1">
                        Belge Tipi
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-1">
                        Cari Bilgisi
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-1">
                        Proje
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Etiketler
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-1">
                        Seri No
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-1">
                        Durum
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-1">
                        Düzenlenme Tarihi
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center gap-1">
                        Vade Tarihi
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center justify-end gap-1">
                        Fatura Tutarı
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center justify-end gap-1">
                        Takip Tutarı
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center justify-end gap-1">
                        Onaylanma Bekleyen
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100">
                      <div className="flex items-center justify-end gap-1">
                        Bakiye
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {purchases.map((purchase) => {
                    const statusConfig = getStatusBadge(purchase.status);
                    const StatusIcon = statusConfig.icon;
                    const totalAmount = Number(purchase.subtotal) + Number(purchase.tax);
                    const balance = purchase.status === "Ödendi" ? 0 : totalAmount;
                    const pendingApproval = purchase.status === "Bekliyor" ? totalAmount : 0;

                    return (
                      <tr key={purchase.id} className="hover:bg-gray-50">
                        <td className="px-3 py-4">
                          <input type="checkbox" className="rounded border-gray-300" />
                        </td>
                        
                        {/* e-Fatura Durumu */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {Math.random() > 0.5 ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Gönderildi
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                              <XCircle className="w-3 h-3 mr-1" />
                              Gönderilmedi
                            </Badge>
                          )}
                        </td>

                        {/* Belge Tipi */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            <ShoppingCart className="w-3 h-3 mr-1" />
                            Alış Faturası
                          </Badge>
                        </td>

                        {/* Cari Bilgisi (Tedarikçi) */}
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <Building className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="font-medium text-gray-900 truncate">
                                {purchase.supplier_name || "Tedarikçi"}
                              </div>
                              <div className="text-sm text-gray-500 truncate">
                                {purchase.supplier_tax_id || "-"}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Proje */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <FolderKanban className="w-4 h-4 text-gray-400" />
                        </td>

                        {/* Etiketler */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            {purchase.notes && (
                              <Badge variant="outline" className="text-xs">
                                Not var
                              </Badge>
                            )}
                          </div>
                        </td>

                        {/* Seri No */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FileText className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="font-mono text-sm text-gray-900">
                              {purchase.purchase_order_no || `AL-${purchase.id.substring(0, 8)}`}
                            </span>
                          </div>
                        </td>

                        {/* Durum */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={statusConfig.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {purchase.status}
                          </Badge>
                        </td>

                        {/* Düzenlenme Tarihi */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(purchase.purchase_date).toLocaleDateString('tr-TR')}
                        </td>

                        {/* Vade Tarihi */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm">
                            <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                            <span className={`${
                              purchase.delivery_date && new Date(purchase.delivery_date) < new Date() && purchase.status !== "Ödendi"
                                ? "text-red-600 font-medium"
                                : "text-gray-900"
                            }`}>
                              {purchase.delivery_date 
                                ? new Date(purchase.delivery_date).toLocaleDateString('tr-TR')
                                : "-"
                              }
                            </span>
                          </div>
                        </td>

                        {/* Fatura Tutarı */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="font-bold text-gray-900">
                            ₺{totalAmount.toLocaleString('tr-TR')}
                          </div>
                        </td>

                        {/* Takip Tutarı */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm text-gray-900">
                            ₺{totalAmount.toLocaleString('tr-TR')}
                          </div>
                        </td>

                        {/* Onaylanma Bekleyen Tutar */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className={`font-medium ${
                            pendingApproval > 0 ? 'text-orange-600' : 'text-gray-400'
                          }`}>
                            ₺{pendingApproval.toLocaleString('tr-TR')}
                          </div>
                        </td>

                        {/* Bakiye */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className={`font-bold ${
                            balance > 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            ₺{Math.abs(balance).toLocaleString('tr-TR')}
                          </div>
                        </td>

                        {/* İşlemler */}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="hover:bg-blue-50">
                              <Eye className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button variant="ghost" size="sm" className="hover:bg-green-50">
                              <Edit className="w-4 h-4 text-green-600" />
                            </Button>
                            <Button variant="ghost" size="sm" className="hover:bg-red-50">
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Toplam {purchases.length} kayıt gösteriliyor
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  Önceki
                </Button>
                <Button variant="outline" size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                  1
                </Button>
                <Button variant="outline" size="sm">
                  2
                </Button>
                <Button variant="outline" size="sm">
                  3
                </Button>
                <Button variant="outline" size="sm">
                  Sonraki
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Ürün ve Hizmetler Tab */}
        <TabsContent value="urunler">
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Ürün ve Hizmetler</h3>
            <p className="text-gray-600">Ürün/hizmet kataloğu ve fiyatlandırma.</p>
          </Card>
        </TabsContent>

        {/* Finans Tab */}
        <TabsContent value="finans">
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Finans (Kasa/Banka)</h3>
            <p className="text-gray-600">Finansal hesaplar ve işlemler.</p>
          </Card>
        </TabsContent>

        {/* Projeler Tab */}
        <TabsContent value="projeler">
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Proje Yönetimi</h3>
            <p className="text-gray-600">Proje takibi ve maliyet analizi.</p>
          </Card>
        </TabsContent>

        {/* Raporlar Tab */}
        <TabsContent value="raporlar">
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Finansal Raporlar</h3>
            <p className="text-gray-600">Detaylı finansal raporlar ve analizler.</p>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Purchase Invoice Form Modal */}
      {showPurchaseForm && (
        <PurchaseInvoiceForm
          onClose={() => setShowPurchaseForm(false)}
          onSave={(data) => {
            console.log("Purchase invoice data:", data);
            // TODO: Save to database
            setShowPurchaseForm(false);
            loadData();
          }}
        />
      )}

      {/* Expense Form Modal */}
      {showExpenseForm && (
        <ExpenseForm
          onClose={() => setShowExpenseForm(false)}
          onSave={(data) => {
            console.log("Expense data:", data);
            // TODO: Save to database
            setShowExpenseForm(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}