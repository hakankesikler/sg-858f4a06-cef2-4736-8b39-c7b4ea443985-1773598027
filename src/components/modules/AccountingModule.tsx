import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  FileText,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Calendar,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  LayoutGrid,
  ShoppingCart,
  ShoppingBag,
  CreditCard,
  Users,
  BarChart3,
  Mail,
  Upload,
  X,
  Trash,
  Save,
  Info,
  Building,
  Handshake,
  LayoutDashboard,
  Receipt,
  Package,
  Wallet,
  Activity,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { accountingService } from "@/services/accountingService";
import type { Database } from "@/integrations/supabase/types";

type Invoice = Database["public"]["Tables"]["invoices"]["Row"];
type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
type Expense = Database["public"]["Tables"]["expenses"]["Row"];

export function AccountingModule() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("panel");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  
  // Veri state'leri
  const [salesInvoices, setSalesInvoices] = useState<Invoice[]>([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // İstatistik verileri
  const [stats, setStats] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
  });

  // Veri yükleme
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sales, purchases, expenseData, transactionData] = await Promise.all([
        accountingService.getInvoices(),
        accountingService.getInvoices(),
        accountingService.getExpenses(),
        accountingService.getTransactions(),
      ]);

      setSalesInvoices(sales || []);
      setPurchaseInvoices(purchases || []);
      setExpenses(expenseData || []);
      setTransactions(transactionData || []);

      // İstatistikleri hesapla
      calculateStats(sales || []);
    } catch (error) {
      console.error("Veri yükleme hatası:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Veriler yüklenirken bir hata oluştu",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (invoices: Invoice[]) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const total = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const monthly = invoices
      .filter((inv) => {
        const invDate = new Date(inv.created_at);
        return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
      })
      .reduce((sum, inv) => sum + (inv.total || 0), 0);

    const paid = invoices.filter((inv) => inv.status === "paid").length;
    const pending = invoices.filter((inv) => inv.status === "pending").length;

    setStats({
      totalRevenue: total,
      monthlyRevenue: monthly,
      paidInvoices: paid,
      pendingInvoices: pending,
    });
  };

  const filteredSalesInvoices = salesInvoices.filter((invoice) => {
    if (searchTerm && !invoice.invoice_no?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (statusFilter !== "all" && invoice.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const filteredPurchaseInvoices = purchaseInvoices.filter((invoice) => {
    if (searchTerm && !invoice.invoice_no?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (statusFilter !== "all" && invoice.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500">Ödendi</Badge>;
      case "pending":
        return <Badge variant="secondary">Bekliyor</Badge>;
      case "overdue":
        return <Badge variant="destructive">Gecikmiş</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Muhasebe ve Finans</h2>
          <p className="text-muted-foreground">
            Finansal yönetim ve raporlama sistemi
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="panel" className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            Panel
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Satış
          </TabsTrigger>
          <TabsTrigger value="purchase" className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            Alış
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Giderler
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Ürün/Hizmet
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Cari Hesaplar
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Raporlar
          </TabsTrigger>
        </TabsList>

        {/* Panel - Genel Bakış */}
        <TabsContent value="panel" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Toplam Ciro</p>
                  <h3 className="text-2xl font-bold">₺{stats.totalRevenue.toLocaleString('tr-TR')}</h3>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aylık Ciro</p>
                  <h3 className="text-2xl font-bold">₺{stats.monthlyRevenue.toLocaleString('tr-TR')}</h3>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ödenen Faturalar</p>
                  <h3 className="text-2xl font-bold">{stats.paidInvoices}</h3>
                </div>
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600">✓</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Bekleyen</p>
                  <h3 className="text-2xl font-bold">{stats.pendingInvoices}</h3>
                </div>
                <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Son Faturalar</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fatura No</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Tutar</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesInvoices.slice(0, 5).map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_no}</TableCell>
                    <TableCell>{invoice.customer_id}</TableCell>
                    <TableCell>{new Date(invoice.created_at).toLocaleDateString('tr-TR')}</TableCell>
                    <TableCell>₺{invoice.total?.toLocaleString('tr-TR')}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status || 'pending')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Satış Faturaları */}
        <TabsContent value="sales" className="space-y-4">
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Toplu Seç
                </Button>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtre
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Satış Faturası Oluştur
                </Button>
                <Button variant="outline">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Alış İade Faturası Oluştur
                </Button>
                <Button variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  e-Fatura Gelen Kutusu
                </Button>
                <Button variant="outline" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Detaylı Arama"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="relative flex-1">
                <Input placeholder="Ara..." />
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              0 adet kayıt listelenmektedir. Daha fazlası için detaylı arama yapabilirsiniz.
            </p>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input type="checkbox" />
                  </TableHead>
                  <TableHead>E-FATURA DURUMU</TableHead>
                  <TableHead>BELGE TİPİ</TableHead>
                  <TableHead>CARİ BİLGİSİ</TableHead>
                  <TableHead>PROJE</TableHead>
                  <TableHead>ETİKETLER</TableHead>
                  <TableHead>SERİ NO</TableHead>
                  <TableHead>DURUM</TableHead>
                  <TableHead>DÜZENLEME TARİHİ</TableHead>
                  <TableHead>VADE TARİHİ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSalesInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                      Toplam 0 kayıt gösteriliyor
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSalesInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <input type="checkbox" />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">E-Fatura</Badge>
                      </TableCell>
                      <TableCell>Satış Faturası</TableCell>
                      <TableCell>{invoice.customer_id}</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell className="font-medium">{invoice.invoice_no}</TableCell>
                      <TableCell>{getStatusBadge(invoice.status || 'pending')}</TableCell>
                      <TableCell>{new Date(invoice.created_at).toLocaleDateString('tr-TR')}</TableCell>
                      <TableCell>{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('tr-TR') : '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Toplam {filteredSalesInvoices.length} kayıt gösteriliyor
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">Önceki</Button>
                <Button variant="default" size="sm">1</Button>
                <Button variant="outline" size="sm">2</Button>
                <Button variant="outline" size="sm">3</Button>
                <Button variant="outline" size="sm">Sonraki</Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Alış Faturaları */}
        <TabsContent value="purchase" className="space-y-4">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Alış Faturaları</h3>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Alış Faturası
              </Button>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Fatura ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Durum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="paid">Ödendi</SelectItem>
                  <SelectItem value="pending">Bekliyor</SelectItem>
                  <SelectItem value="overdue">Gecikmiş</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fatura No</TableHead>
                  <TableHead>Tedarikçi</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Vade Tarihi</TableHead>
                  <TableHead>Tutar</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchaseInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Alış faturası bulunamadı
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPurchaseInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_no}</TableCell>
                      <TableCell>{invoice.customer_id}</TableCell>
                      <TableCell>{new Date(invoice.created_at).toLocaleDateString('tr-TR')}</TableCell>
                      <TableCell>{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('tr-TR') : '-'}</TableCell>
                      <TableCell>₺{invoice.total?.toLocaleString('tr-TR')}</TableCell>
                      <TableCell>{getStatusBadge(invoice.status || 'pending')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Giderler */}
        <TabsContent value="expenses" className="space-y-4">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Giderler</h3>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Gider
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Tutar</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Gider kaydı bulunamadı
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{new Date(expense.created_at).toLocaleDateString('tr-TR')}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell>₺{expense.amount?.toLocaleString('tr-TR')}</TableCell>
                      <TableCell>{getStatusBadge(expense.status || 'pending')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Ürün/Hizmet */}
        <TabsContent value="products" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Ürün ve Hizmetler</h3>
            <p className="text-muted-foreground">Yakında eklenecek...</p>
          </Card>
        </TabsContent>

        {/* Cari Hesaplar */}
        <TabsContent value="customers" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Cari Hesaplar</h3>
            <p className="text-muted-foreground">Yakında eklenecek...</p>
          </Card>
        </TabsContent>

        {/* Raporlar */}
        <TabsContent value="reports" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Finansal Raporlar</h3>
            <p className="text-muted-foreground">Yakında eklenecek...</p>
          </Card>
        </TabsContent>

        <TabsContent value="purchases" className="space-y-4">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">Alış Faturaları</h2>
              <div className="h-1 w-12 bg-primary mt-2"></div>
            </div>

            {/* Üst Butonlar */}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="bg-blue-50">
                <Search className="h-4 w-4 mr-2" />
                Detaylı Arama
              </Button>
              <Button variant="outline">
                <Info className="h-4 w-4 mr-2" />
                Toplu Seç
              </Button>
            </div>

            {/* Bilgi Mesajı */}
            <p className="text-sm text-muted-foreground italic">
              1000 adet kayıt listelenmektedir. Daha fazlası için detaylı arama yapabilirsiniz.
            </p>

            {/* Ana Butonlar */}
            <div className="flex flex-wrap items-center gap-2">
              <Button className="bg-green-600 hover:bg-green-700">
                Alış Faturası Oluştur
              </Button>
              <Button variant="outline">
                Satış İade Faturası Oluştur
              </Button>
              <Button variant="outline" className="bg-blue-50">
                e-Fatura Gelen Kutusu
              </Button>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                İçe Aktar
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Dışarıya Aktar
              </Button>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
              </Button>
              <div className="ml-auto flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Ara"
                    className="pl-9 w-64"
                  />
                </div>
              </div>
            </div>

            {/* Alış Faturası Tablosu */}
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">e-Fatura Durumu</TableHead>
                      <TableHead className="w-[120px]">Belge Tipi</TableHead>
                      <TableHead className="w-[180px]">Cari Bilgisi</TableHead>
                      <TableHead className="w-[120px]">Proje</TableHead>
                      <TableHead className="w-[100px]">Etiketler</TableHead>
                      <TableHead className="w-[100px]">Seri No</TableHead>
                      <TableHead className="w-[100px]">Durum</TableHead>
                      <TableHead className="w-[120px]">Düzenlenme Tarihi</TableHead>
                      <TableHead className="w-[120px]">Vade Tarihi</TableHead>
                      <TableHead className="w-[120px]">Fatura Tutarı</TableHead>
                      <TableHead className="w-[120px]">Takip Tutarı</TableHead>
                      <TableHead className="w-[140px]">Onaylanma Bekleyen Tutar</TableHead>
                      <TableHead className="w-[100px]">Bakiye</TableHead>
                      <TableHead className="w-[100px] text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={14} className="text-center py-12 text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <ShoppingBag className="h-12 w-12 opacity-20" />
                            <p>Henüz alış faturası kaydı bulunmamaktadır</p>
                            <Button variant="outline" size="sm">
                              İlk Alış Faturanızı Oluşturun
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      purchases.map((purchase) => (
                        <TableRow key={purchase.id}>
                          <TableCell>
                            <Badge variant="outline" className="bg-blue-50">
                              e-Fatura
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">Alış Faturası</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">
                                {purchase.supplier_accounts?.name || "-"}
                              </span>
                              {purchase.supplier_accounts?.company && (
                                <span className="text-xs text-muted-foreground">
                                  {purchase.supplier_accounts.company}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">-</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">-</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-sm">{purchase.invoice_no}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              purchase.status === "Onaylandı" ? "default" :
                              purchase.status === "Beklemede" ? "secondary" : 
                              purchase.status === "Reddedildi" ? "destructive" : "outline"
                            }>
                              {purchase.status || "Beklemede"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {new Date(purchase.purchase_date || purchase.created_at).toLocaleDateString('tr-TR')}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {purchase.due_date ? new Date(purchase.due_date).toLocaleDateString('tr-TR') : "-"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-sm">
                              ₺{(purchase.total || 0).toLocaleString('tr-TR')}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              ₺{(purchase.total || 0).toLocaleString('tr-TR')}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              ₺{(purchase.pending_approval || 0).toLocaleString('tr-TR')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={purchase.status === "Ödendi" ? "default" : "secondary"}>
                              ₺{(purchase.balance || purchase.total || 0).toLocaleString('tr-TR')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {/* Sayfalama */}
            {purchases.length > 0 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Toplam {purchases.length} kayıt gösteriliyor
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">Önceki</Button>
                  <Button variant="default" size="sm">1</Button>
                  <Button variant="outline" size="sm">2</Button>
                  <Button variant="outline" size="sm">3</Button>
                  <Button variant="outline" size="sm">Sonraki</Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}