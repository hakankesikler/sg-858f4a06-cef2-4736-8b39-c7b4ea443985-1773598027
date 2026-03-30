import { useState, useEffect } from "react";
import { LayoutDashboard, ShoppingCart, ShoppingBag, Wallet, Package, Users, Building2, FolderKanban, BarChart3, Plus, TrendingUp, TrendingDown, DollarSign, FileText, Calendar, CheckCircle2, Clock, AlertCircle, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { accountingService } from "@/services/accountingService";

export function AccountingModule() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);

  // Dashboard Stats
  const [dashboardStats, setDashboardStats] = useState({
    salesRevenue: 0,
    purchaseCosts: 0,
    expenseCosts: 0,
    totalProfit: 0,
    activeProjects: 0,
    pendingInvoices: 0,
    overdueInvoices: 0
  });

  // Sales Management
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);

  // Purchase Management
  const [purchases, setPurchases] = useState<any[]>([]);
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);

  // Expense Management
  const [expenses, setExpenses] = useState<any[]>([]);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);

  // Products & Services
  const [products, setProducts] = useState<any[]>([]);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);

  // Cari Accounts
  const [cariAccounts, setCariAccounts] = useState<any[]>([]);
  const [cariStats, setCariStats] = useState({ totalReceivables: 0, totalPayables: 0, netPosition: 0, accountCount: 0 });

  // Finance
  const [financialAccounts, setFinancialAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);

  // Projects
  const [projects, setProjects] = useState<any[]>([]);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === "sales") loadInvoices();
    else if (activeTab === "purchases") loadPurchases();
    else if (activeTab === "expenses") loadExpenses();
    else if (activeTab === "products") loadProducts();
    else if (activeTab === "cari") loadCariAccounts();
    else if (activeTab === "finance") loadFinanceData();
    else if (activeTab === "projects") loadProjects();
  }, [activeTab]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const stats = await accountingService.getDashboardStats();
      setDashboardStats(stats);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadInvoices = async () => {
    try {
      const data = await accountingService.getInvoices();
      setInvoices(data);
    } catch (error) {
      console.error("Error loading invoices:", error);
    }
  };

  const loadPurchases = async () => {
    try {
      const data = await accountingService.getPurchases();
      setPurchases(data);
    } catch (error) {
      console.error("Error loading purchases:", error);
    }
  };

  const loadExpenses = async () => {
    try {
      const data = await accountingService.getExpenses();
      setExpenses(data);
    } catch (error) {
      console.error("Error loading expenses:", error);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await accountingService.getProducts();
      setProducts(data);
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const loadCariAccounts = async () => {
    try {
      const [accounts, stats] = await Promise.all([
        accountingService.getCariAccounts(),
        accountingService.getCariStats()
      ]);
      setCariAccounts(accounts);
      setCariStats(stats);
    } catch (error) {
      console.error("Error loading cari accounts:", error);
    }
  };

  const loadFinanceData = async () => {
    try {
      const [accounts, txns] = await Promise.all([
        accountingService.getFinancialAccounts(),
        accountingService.getTransactions()
      ]);
      setFinancialAccounts(accounts);
      setTransactions(txns);
    } catch (error) {
      console.error("Error loading finance data:", error);
    }
  };

  const loadProjects = async () => {
    try {
      const data = await accountingService.getProjects();
      setProjects(data);
    } catch (error) {
      console.error("Error loading projects:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: any = {
      "Ödendi": { color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
      "Bekliyor": { color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
      "Gecikmiş": { color: "bg-red-100 text-red-700 border-red-200", icon: AlertCircle },
      "İptal": { color: "bg-gray-100 text-gray-700 border-gray-200", icon: XCircle },
      "Devam Ediyor": { color: "bg-blue-100 text-blue-700 border-blue-200", icon: Clock },
      "Tamamlandı": { color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
      "Beklemede": { color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
      "Planlama": { color: "bg-purple-100 text-purple-700 border-purple-200", icon: Calendar }
    };
    return configs[status] || configs["Bekliyor"];
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
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Muhasebe ve Finans</h2>
        <p className="text-gray-600 mt-1">Finansal yönetim ve raporlama sistemi</p>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-9 w-full bg-gray-100">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden lg:inline">Güncel Durum</span>
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden lg:inline">Satış</span>
          </TabsTrigger>
          <TabsTrigger value="purchases" className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden lg:inline">Satın Alma</span>
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            <span className="hidden lg:inline">Giderler</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            <span className="hidden lg:inline">Ürünler</span>
          </TabsTrigger>
          <TabsTrigger value="cari" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden lg:inline">Cari</span>
          </TabsTrigger>
          <TabsTrigger value="finance" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden lg:inline">Finans</span>
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <FolderKanban className="w-4 h-4" />
            <span className="hidden lg:inline">Projeler</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden lg:inline">Raporlar</span>
          </TabsTrigger>
        </TabsList>

        {/* DASHBOARD */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6 border-l-4 border-l-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Satış Geliri</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">₺{dashboardStats.salesRevenue.toLocaleString('tr-TR')}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-600" />
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-l-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Alım Maliyeti</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">₺{dashboardStats.purchaseCosts.toLocaleString('tr-TR')}</p>
                </div>
                <TrendingDown className="w-10 h-10 text-red-600" />
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-l-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Giderler</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">₺{dashboardStats.expenseCosts.toLocaleString('tr-TR')}</p>
                </div>
                <Wallet className="w-10 h-10 text-orange-600" />
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Net Kar</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">₺{dashboardStats.totalProfit.toLocaleString('tr-TR')}</p>
                </div>
                <DollarSign className="w-10 h-10 text-blue-600" />
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Aktif Projeler</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{dashboardStats.activeProjects}</p>
                </div>
                <FolderKanban className="w-10 h-10 text-purple-600" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Bekleyen Faturalar</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{dashboardStats.pendingInvoices}</p>
                </div>
                <Clock className="w-10 h-10 text-yellow-600" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Gecikmiş Faturalar</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{dashboardStats.overdueInvoices}</p>
                </div>
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* SALES MANAGEMENT */}
        <TabsContent value="sales" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Satış Faturaları</h3>
            <Button onClick={() => setIsInvoiceDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Yeni Fatura
            </Button>
          </div>

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
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice) => {
                    const statusConfig = getStatusBadge(invoice.status);
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
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          {invoice.customers?.company || invoice.customers?.name || "N/A"}
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* PURCHASE MANAGEMENT */}
        <TabsContent value="purchases" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Satın Alma / Alış Faturaları</h3>
            <Button onClick={() => setIsPurchaseDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Yeni Alış Faturası
            </Button>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fatura No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tedarikçi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tutar</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vergi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Toplam</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {purchases.map((purchase) => {
                    const statusConfig = getStatusBadge(purchase.status);
                    const StatusIcon = statusConfig.icon;
                    const total = Number(purchase.amount) + Number(purchase.tax);

                    return (
                      <tr key={purchase.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FileText className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="font-medium text-gray-900">{purchase.purchase_no}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          {purchase.customers?.company || purchase.customers?.name || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          ₺{Number(purchase.amount).toLocaleString('tr-TR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          ₺{Number(purchase.tax).toLocaleString('tr-TR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                          ₺{total.toLocaleString('tr-TR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={statusConfig.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {purchase.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(purchase.purchase_date).toLocaleDateString('tr-TR')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* EXPENSE MANAGEMENT */}
        <TabsContent value="expenses" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Genel Gider Yönetimi</h3>
            <Button onClick={() => setIsExpenseDialogOpen(true)} className="bg-orange-600 hover:bg-orange-700">
              <Plus className="w-4 h-4 mr-2" />
              Yeni Gider
            </Button>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gider No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Açıklama</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tutar</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vergi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Toplam</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expenses.map((expense) => {
                    const statusConfig = getStatusBadge(expense.status);
                    const StatusIcon = statusConfig.icon;
                    const total = Number(expense.amount) + Number(expense.tax);

                    return (
                      <tr key={expense.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                          {expense.expense_no}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline">{expense.category}</Badge>
                        </td>
                        <td className="px-6 py-4 text-gray-900">
                          {expense.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          ₺{Number(expense.amount).toLocaleString('tr-TR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          ₺{Number(expense.tax).toLocaleString('tr-TR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                          ₺{total.toLocaleString('tr-TR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={statusConfig.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {expense.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(expense.expense_date).toLocaleDateString('tr-TR')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* PRODUCTS & SERVICES */}
        <TabsContent value="products" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Ürün ve Hizmetler</h3>
            <Button onClick={() => setIsProductDialogOpen(true)} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Yeni Ürün/Hizmet
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <Card key={product.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <Badge variant="outline" className="mb-2">{product.type}</Badge>
                    <h4 className="font-bold text-lg text-gray-900">{product.name}</h4>
                    <p className="text-sm text-gray-600">{product.code}</p>
                  </div>
                  <Package className="w-8 h-8 text-purple-600" />
                </div>
                
                <p className="text-sm text-gray-600 mb-4">{product.description}</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Kategori:</span>
                    <Badge>{product.category}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Birim:</span>
                    <span className="font-medium">{product.unit}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Alış:</span>
                    <span className="font-medium">₺{Number(product.cost_price).toLocaleString('tr-TR')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Satış:</span>
                    <span className="font-bold text-green-600">₺{Number(product.sale_price).toLocaleString('tr-TR')}</span>
                  </div>
                  {product.stock_quantity !== null && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Stok:</span>
                      <span className="font-medium">{product.stock_quantity} {product.unit}</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* CARI ACCOUNTS */}
        <TabsContent value="cari" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6 border-l-4 border-l-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Toplam Alacak</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">₺{cariStats.totalReceivables.toLocaleString('tr-TR')}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-600" />
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-l-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Toplam Borç</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">₺{cariStats.totalPayables.toLocaleString('tr-TR')}</p>
                </div>
                <TrendingDown className="w-10 h-10 text-red-600" />
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Net Pozisyon</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">₺{cariStats.netPosition.toLocaleString('tr-TR')}</p>
                </div>
                <DollarSign className="w-10 h-10 text-blue-600" />
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-l-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Cari Sayısı</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{cariStats.accountCount}</p>
                </div>
                <Users className="w-10 h-10 text-purple-600" />
              </div>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cari Adı</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tip</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bakiye</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kredi Limiti</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İletişim</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cariAccounts.map((cari) => (
                    <tr key={cari.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <p className="font-medium text-gray-900">{cari.customers?.company || cari.customers?.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline">{cari.account_type}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`font-semibold ${Number(cari.balance) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ₺{Number(cari.balance).toLocaleString('tr-TR')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        ₺{Number(cari.credit_limit).toLocaleString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          <p>{cari.customers?.email}</p>
                          <p>{cari.customers?.phone}</p>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* FINANCE */}
        <TabsContent value="finance" className="space-y-4">
          <h3 className="text-xl font-bold">Finans - Kasa/Banka Yönetimi</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {financialAccounts.map((account) => (
              <Card key={account.id} className="p-6 border-l-4 border-l-blue-500">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Badge variant="outline" className="mb-2">{account.account_type}</Badge>
                    <h4 className="font-bold text-lg text-gray-900">{account.account_name}</h4>
                  </div>
                  <Building2 className="w-8 h-8 text-blue-600" />
                </div>
                
                <div className="space-y-2">
                  {account.bank_name && (
                    <p className="text-sm text-gray-600">Banka: {account.bank_name}</p>
                  )}
                  {account.account_number && (
                    <p className="text-sm text-gray-600">Hesap: {account.account_number}</p>
                  )}
                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-600 mb-1">Bakiye</p>
                    <p className={`text-2xl font-bold ${Number(account.balance) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ₺{Number(account.balance).toLocaleString('tr-TR')}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-8">
            <h4 className="text-lg font-bold mb-4">Son İşlemler</h4>
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hesap</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tip</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Açıklama</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tutar</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((txn) => (
                      <tr key={txn.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(txn.transaction_date).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          {txn.financial_accounts?.account_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={txn.type === "Gelir" ? "default" : "destructive"}>
                            {txn.type}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-gray-900">
                          {txn.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`font-semibold ${txn.type === "Gelir" ? 'text-green-600' : 'text-red-600'}`}>
                            {txn.type === "Gelir" ? '+' : '-'}₺{Number(txn.amount).toLocaleString('tr-TR')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* PROJECTS */}
        <TabsContent value="projects" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Proje Yönetimi</h3>
            <Button onClick={() => setIsProjectDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Yeni Proje
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {projects.map((project) => {
              const statusConfig = getStatusBadge(project.status);
              const StatusIcon = statusConfig.icon;
              const completionRate = project.budget > 0 ? (project.total_cost / project.budget * 100).toFixed(1) : 0;

              return (
                <Card key={project.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-lg text-gray-900">{project.name}</h4>
                      <p className="text-sm text-gray-600">{project.customers?.company || project.customers?.name}</p>
                    </div>
                    <Badge className={statusConfig.color}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {project.status}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">{project.description}</p>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Bütçe:</span>
                      <span className="font-bold text-gray-900">₺{Number(project.budget).toLocaleString('tr-TR')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Harcanan:</span>
                      <span className="font-medium text-red-600">₺{Number(project.total_cost).toLocaleString('tr-TR')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Kalan:</span>
                      <span className="font-medium text-green-600">
                        ₺{(Number(project.budget) - Number(project.total_cost)).toLocaleString('tr-TR')}
                      </span>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">Tamamlanma:</span>
                        <span className="text-sm font-medium">{completionRate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(Number(completionRate), 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="pt-3 border-t grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Başlangıç</p>
                        <p className="font-medium">{new Date(project.start_date).toLocaleDateString('tr-TR')}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Bitiş</p>
                        <p className="font-medium">{new Date(project.end_date).toLocaleDateString('tr-TR')}</p>
                      </div>
                    </div>
                    {project.project_manager && (
                      <div className="pt-2">
                        <p className="text-sm text-gray-600">Proje Yöneticisi: <span className="font-medium text-gray-900">{project.project_manager}</span></p>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* REPORTS */}
        <TabsContent value="reports" className="space-y-4">
          <h3 className="text-xl font-bold">Finansal Raporlar</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <BarChart3 className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Gelir-Gider Raporu</h4>
                  <p className="text-sm text-gray-600">Aylık kar-zarar analizi</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Cari Hesap Raporu</h4>
                  <p className="text-sm text-gray-600">Borç-alacak durumu</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <DollarSign className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Nakit Akış Raporu</h4>
                  <p className="text-sm text-gray-600">Kasa/banka hareketleri</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <TrendingUp className="w-8 h-8 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Satış Analizi</h4>
                  <p className="text-sm text-gray-600">Ürün/müşteri bazlı</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 rounded-lg">
                  <TrendingDown className="w-8 h-8 text-red-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Gider Analizi</h4>
                  <p className="text-sm text-gray-600">Kategori bazlı giderler</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <FolderKanban className="w-8 h-8 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Proje Maliyet Raporu</h4>
                  <p className="text-sm text-gray-600">Proje karlılık analizi</p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}