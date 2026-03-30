import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LayoutDashboard, 
  Users, 
  Building, 
  Handshake,
  FileText,
  TrendingUp,
  DollarSign,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Plus,
  CreditCard,
  Package,
  Wallet,
  Activity,
  FolderKanban,
  Receipt,
  ShoppingCart
} from "lucide-react";
import { accountingService } from "@/services/accountingService";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export function AccountingModule() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [cariSubTab, setCariSubTab] = useState("customers");
  const [stats, setStats] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [customerAccounts, setCustomerAccounts] = useState<any[]>([]);
  const [employeeAccounts, setEmployeeAccounts] = useState<any[]>([]);
  const [partnerAccounts, setPartnerAccounts] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const dashboardStats = await accountingService.getDashboardStats();
      setStats(dashboardStats);
    } catch (error) {
      console.error("Error loading dashboard:", error);
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

  const loadPayments = async () => {
    try {
      const data = await accountingService.getPayments();
      setPayments(data);
    } catch (error) {
      console.error("Error loading payments:", error);
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

  const loadAccounts = async () => {
    try {
      const data = await accountingService.getFinancialAccounts();
      setAccounts(data);
    } catch (error) {
      console.error("Error loading accounts:", error);
    }
  };

  const loadTransactions = async () => {
    try {
      const data = await accountingService.getTransactions();
      setTransactions(data);
    } catch (error) {
      console.error("Error loading transactions:", error);
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

  const loadCustomerAccounts = async () => {
    try {
      const data = await accountingService.getCustomerAccounts();
      setCustomerAccounts(data);
    } catch (error) {
      console.error("Error loading customer accounts:", error);
    }
  };

  const loadEmployeeAccounts = async () => {
    try {
      const data = await accountingService.getEmployeeAccounts();
      setEmployeeAccounts(data);
    } catch (error) {
      console.error("Error loading employee accounts:", error);
    }
  };

  const loadPartnerAccounts = async () => {
    try {
      const data = await accountingService.getPartnerAccounts();
      setPartnerAccounts(data);
    } catch (error) {
      console.error("Error loading partner accounts:", error);
    }
  };

  useEffect(() => {
    switch (activeTab) {
      case "invoices":
        loadInvoices();
        break;
      case "payments":
        loadPayments();
        break;
      case "purchases":
        loadPurchases();
        break;
      case "expenses":
        loadExpenses();
        break;
      case "products":
        loadProducts();
        break;
      case "accounts":
        loadAccounts();
        break;
      case "transactions":
        loadTransactions();
        break;
      case "projects":
        loadProjects();
        break;
      case "cariler":
        loadCustomerAccounts();
        break;
      case "employees":
        loadEmployeeAccounts();
        break;
      case "partners":
        loadPartnerAccounts();
        break;
    }
  }, [activeTab]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Muhasebe</h1>
          <p className="text-muted-foreground mt-1">
            Finansal yönetim ve raporlama
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 lg:grid-cols-9 gap-1">
          <TabsTrigger value="dashboard">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Panel
          </TabsTrigger>
          <TabsTrigger value="cariler">
            <Users className="h-4 w-4 mr-2" />
            Cariler
          </TabsTrigger>
          <TabsTrigger value="invoices">
            <FileText className="h-4 w-4 mr-2" />
            Faturalar
          </TabsTrigger>
          <TabsTrigger value="payments">
            <CreditCard className="h-4 w-4 mr-2" />
            Ödemeler
          </TabsTrigger>
          <TabsTrigger value="purchases">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Satın Almalar
          </TabsTrigger>
          <TabsTrigger value="expenses">
            <Receipt className="h-4 w-4 mr-2" />
            Giderler
          </TabsTrigger>
          <TabsTrigger value="products">
            <Package className="h-4 w-4 mr-2" />
            Ürün/Hizmet
          </TabsTrigger>
          <TabsTrigger value="accounts">
            <Wallet className="h-4 w-4 mr-2" />
            Mali Hesaplar
          </TabsTrigger>
          <TabsTrigger value="transactions">
            <Activity className="h-4 w-4 mr-2" />
            İşlemler
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Satış Hasılatı</p>
                  <h3 className="text-2xl font-bold mt-2">
                    ₺{stats?.salesRevenue?.toLocaleString() || "0"}
                  </h3>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Satın Alma Maliyeti</p>
                  <h3 className="text-2xl font-bold mt-2">
                    ₺{stats?.purchaseCosts?.toLocaleString() || "0"}
                  </h3>
                </div>
                <DollarSign className="h-8 w-8 text-red-600" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Gider Maliyeti</p>
                  <h3 className="text-2xl font-bold mt-2">
                    ₺{stats?.expenseCosts?.toLocaleString() || "0"}
                  </h3>
                </div>
                <Receipt className="h-8 w-8 text-orange-600" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Net Kar</p>
                  <h3 className="text-2xl font-bold mt-2">
                    ₺{stats?.totalProfit?.toLocaleString() || "0"}
                  </h3>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Aktif Projeler</p>
                  <h3 className="text-2xl font-bold mt-2">{stats?.activeProjects || 0}</h3>
                </div>
                <FolderKanban className="h-8 w-8 text-purple-600" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Bekleyen Faturalar</p>
                  <h3 className="text-2xl font-bold mt-2">{stats?.pendingInvoices || 0}</h3>
                </div>
                <FileText className="h-8 w-8 text-yellow-600" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Gecikmiş Faturalar</p>
                  <h3 className="text-2xl font-bold mt-2">{stats?.overdueInvoices || 0}</h3>
                </div>
                <Calendar className="h-8 w-8 text-red-600" />
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cariler" className="space-y-4">
          <Tabs value={cariSubTab} onValueChange={setCariSubTab} className="space-y-4">
            <TabsList className="grid grid-cols-2 lg:grid-cols-4 gap-1">
              <TabsTrigger value="customers">
                <Users className="h-4 w-4 mr-2" />
                Müşteri Cari
              </TabsTrigger>
              <TabsTrigger value="suppliers">
                <Building className="h-4 w-4 mr-2" />
                Tedarikçi Cari
              </TabsTrigger>
              <TabsTrigger value="employees">
                <Users className="h-4 w-4 mr-2" />
                Personel Cari
              </TabsTrigger>
              <TabsTrigger value="partners">
                <Handshake className="h-4 w-4 mr-2" />
                Ortaklar Cari
              </TabsTrigger>
            </TabsList>

            <TabsContent value="customers">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Müşteri Cari Hesapları</h3>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Müşteri
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Müşteri Adı</TableHead>
                      <TableHead>Şirket</TableHead>
                      <TableHead>E-posta</TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead>Bakiye</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerAccounts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          Henüz müşteri cari hesabı eklenmemiş
                        </TableCell>
                      </TableRow>
                    ) : (
                      customerAccounts.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell>{account.name}</TableCell>
                          <TableCell>{account.company || "-"}</TableCell>
                          <TableCell>{account.email || "-"}</TableCell>
                          <TableCell>{account.phone || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={account.balance > 0 ? "default" : "secondary"}>
                              ₺{account.balance?.toLocaleString() || "0"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="suppliers">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Tedarikçi Cari Hesapları</h3>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Tedarikçi
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  Tedarikçi cari hesapları burada görüntülenecek...
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="employees">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Personel Cari Hesapları</h3>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Personel
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Personel</TableHead>
                      <TableHead>Pozisyon</TableHead>
                      <TableHead>Maaş</TableHead>
                      <TableHead>Avans Bakiyesi</TableHead>
                      <TableHead>Toplam Bakiye</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeeAccounts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          Henüz personel cari hesabı eklenmemiş
                        </TableCell>
                      </TableRow>
                    ) : (
                      employeeAccounts.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell>
                            {account.employees?.first_name} {account.employees?.last_name}
                          </TableCell>
                          <TableCell>{account.employees?.position || "-"}</TableCell>
                          <TableCell>₺{account.salary?.toLocaleString() || "0"}</TableCell>
                          <TableCell>₺{account.advance_balance?.toLocaleString() || "0"}</TableCell>
                          <TableCell>
                            <Badge variant={account.balance >= 0 ? "default" : "destructive"}>
                              ₺{account.balance?.toLocaleString() || "0"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="partners">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Ortak Cari Hesapları</h3>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Ortak
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ortak Adı</TableHead>
                      <TableHead>Hisse Oranı</TableHead>
                      <TableHead>Sermaye Katkısı</TableHead>
                      <TableHead>Bakiye</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partnerAccounts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          Henüz ortak cari hesabı eklenmemiş
                        </TableCell>
                      </TableRow>
                    ) : (
                      partnerAccounts.map((account) => (
                        <TableRow key={account.id}>
                          <TableCell>{account.partner_name}</TableCell>
                          <TableCell>%{account.share_percentage}</TableCell>
                          <TableCell>₺{account.capital_contribution?.toLocaleString() || "0"}</TableCell>
                          <TableCell>
                            <Badge variant={account.balance >= 0 ? "default" : "destructive"}>
                              ₺{account.balance?.toLocaleString() || "0"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="invoices">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Satış Faturaları</h3>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Fatura
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fatura No</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Tutar</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Henüz fatura eklenmemiş
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>{invoice.invoice_no}</TableCell>
                      <TableCell>{invoice.customers?.name || "-"}</TableCell>
                      <TableCell>{new Date(invoice.invoice_date).toLocaleDateString("tr-TR")}</TableCell>
                      <TableCell>₺{(Number(invoice.amount) + Number(invoice.tax)).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            invoice.status === "Ödendi"
                              ? "default"
                              : invoice.status === "Gecikmiş"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Ödemeler</h3>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Ödeme
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ödeme No</TableHead>
                  <TableHead>Fatura</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Tutar</TableHead>
                  <TableHead>Ödeme Yöntemi</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Henüz ödeme kaydı eklenmemiş
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{payment.payment_no}</TableCell>
                      <TableCell>{payment.invoices?.invoice_no || "-"}</TableCell>
                      <TableCell>{new Date(payment.payment_date).toLocaleDateString("tr-TR")}</TableCell>
                      <TableCell>₺{payment.amount?.toLocaleString()}</TableCell>
                      <TableCell>{payment.payment_method}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="purchases">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Satın Almalar</h3>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Satın Alma
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Satın Alma No</TableHead>
                  <TableHead>Tedarikçi</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Tutar</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Henüz satın alma kaydı eklenmemiş
                    </TableCell>
                  </TableRow>
                ) : (
                  purchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell>{purchase.purchase_no}</TableCell>
                      <TableCell>{purchase.customers?.name || "-"}</TableCell>
                      <TableCell>{new Date(purchase.purchase_date).toLocaleDateString("tr-TR")}</TableCell>
                      <TableCell>₺{(Number(purchase.subtotal) + Number(purchase.tax)).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={purchase.status === "Tamamlandı" ? "default" : "secondary"}>
                          {purchase.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Giderler</h3>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Gider
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Tutar</TableHead>
                  <TableHead>Ödeme Yöntemi</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Henüz gider kaydı eklenmemiş
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>{new Date(expense.expense_date).toLocaleDateString("tr-TR")}</TableCell>
                      <TableCell>₺{(Number(expense.amount) + Number(expense.tax)).toLocaleString()}</TableCell>
                      <TableCell>{expense.payment_method}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Ürün ve Hizmetler</h3>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Ürün/Hizmet
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ürün/Hizmet Adı</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Birim Fiyat</TableHead>
                  <TableHead>KDV %</TableHead>
                  <TableHead>Birim</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Henüz ürün/hizmet eklenmemiş
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>
                        <Badge variant={product.type === "Ürün" ? "default" : "secondary"}>
                          {product.type}
                        </Badge>
                      </TableCell>
                      <TableCell>₺{product.unit_price?.toLocaleString()}</TableCell>
                      <TableCell>%{product.tax_rate}</TableCell>
                      <TableCell>{product.unit}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="accounts">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Mali Hesaplar</h3>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Hesap
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hesap Adı</TableHead>
                  <TableHead>Hesap Tipi</TableHead>
                  <TableHead>Para Birimi</TableHead>
                  <TableHead>Bakiye</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Henüz mali hesap eklenmemiş
                    </TableCell>
                  </TableRow>
                ) : (
                  accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>{account.account_name}</TableCell>
                      <TableCell>{account.account_type}</TableCell>
                      <TableCell>{account.currency}</TableCell>
                      <TableCell>
                        <Badge variant={account.balance >= 0 ? "default" : "destructive"}>
                          {account.currency === "TRY" ? "₺" : account.currency}
                          {account.balance?.toLocaleString()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Mali İşlemler</h3>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Yeni İşlem
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Hesap</TableHead>
                  <TableHead>İşlem Tipi</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead>Tutar</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Henüz mali işlem eklenmemiş
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{new Date(transaction.transaction_date).toLocaleDateString("tr-TR")}</TableCell>
                      <TableCell>{transaction.financial_accounts?.account_name || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={transaction.transaction_type === "Gelir" ? "default" : "destructive"}>
                          {transaction.transaction_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>₺{transaction.amount?.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}