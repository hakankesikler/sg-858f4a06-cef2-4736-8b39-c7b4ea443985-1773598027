import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Download,
  Eye,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Calendar,
  Users,
  BarChart3,
  AlertCircle,
  LayoutGrid,
  ShoppingCart,
  ShoppingBag,
  CreditCard,
  Filter,
  Mail,
  Upload,
  Building,
  Handshake,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { accountingService } from "@/services/accountingService";

interface Invoice {
  id: string;
  invoice_no: string;
  customer_id: string;
  status: string;
  total: number;
  created_at: string;
  due_date?: string;
}

interface Expense {
  id: string;
  amount: number;
  tax: number;
}

interface Transaction {
  id: string;
}

interface Customer {
  id: string;
  name: string;
  company?: string;
  account_type: string;
  phone?: string;
  status?: string;
  tax_number?: string;
}

interface ExpenseCategory {
  id: string;
  name: string;
  types: string[];
}

export function AccountingModule() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const setLoading = setIsLoading;
  const [activeTab, setActiveTab] = useState("panel");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cariTab, setCariTab] = useState("genel");
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Category Edit Modal State
  const [editCategoryModal, setEditCategoryModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<ExpenseCategory | null>(null);
  const [editedCategoryName, setEditedCategoryName] = useState("");

  // Add New Type Modal State
  const [addTypeModal, setAddTypeModal] = useState(false);
  const [currentCategoryForType, setCurrentCategoryForType] = useState<ExpenseCategory | null>(null);
  const [newTypeName, setNewTypeName] = useState("");

  // Edit Type Modal State
  const [editTypeModal, setEditTypeModal] = useState(false);
  const [currentTypeForEdit, setCurrentTypeForEdit] = useState<{ categoryId: string; typeName: string; typeIndex: number } | null>(null);
  const [editedTypeName, setEditedTypeName] = useState("");

  // Expense Categories State
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([
    {
      id: "1",
      name: "Kategoriyle Genel Gider Tipleri",
      types: ["Yiyecek"]
    },
    {
      id: "2",
      name: "Araç Bakım Durumu",
      types: ["Araç Temizliği Bakım Giderleri", "Araç Düzensel Giderleri"]
    },
    {
      id: "3",
      name: "Yaşam",
      types: ["Freight Forwarding Yaşam"]
    },
    {
      id: "4",
      name: "Taşıma Faturaları",
      types: ["FULL TRUCK YÜKUMA", "Parsiyel Taşıma"]
    },
    {
      id: "5",
      name: "Kurumsal Giderler",
      types: ["İş Takibi Güvenlik/Danışmanlık Masrafı", "Freight Forwarding Sigortas", "Taşıma Diğer Giderleri", "Broker Giderleri", "Elektrik"]
    },
    {
      id: "6",
      name: "Finansal",
      types: ["Vakıfbank Yan Aziz Dijital Kredi", "Vakıfbank Yan Envar Saravas Kredi", "Vakıfbank Diğer Kredisi", "KFT", "Masrafı"]
    },
    {
      id: "7",
      name: "Denizden",
      types: ["Debiyo", "CMA Belgesi", "Dönenem", "Terminiz"]
    },
    {
      id: "8",
      name: "Ulaşım/Konuklama",
      types: ["Toplantı Yatanmış", "Kolaylıklar", "Araç Kiralama", "Dinmiyel Ovum", "Taleb"]
    },
    {
      id: "9",
      name: "Temel Giderler",
      types: ["Kargo Ödemeleri", "Kasa", "Yemsal Harcamalar", "Muhasebe/Mali Müşavir", "Sponsor Gideri"]
    },
    {
      id: "10",
      name: "Vergi",
      types: ["Mezuniyet Teknoloji", "Gerçek Üstünde Kararne Soğu Vergisi", "Kurumlar Vergisi", "ÖTV", "Stopaj"]
    },
    {
      id: "11",
      name: "Diğer",
      types: ["Dizüner Freezer", "Müşteriye Bedelini Taşıma Yenr Organizasyon", "Maskes", "Kargo", "Reklam/Tanıtım"]
    }
  ]);

  // Open Edit Category Modal
  const handleEditCategory = (category: ExpenseCategory) => {
    setCurrentCategory(category);
    setEditedCategoryName(category.name);
    setEditCategoryModal(true);
  };

  // Update Category Name
  const handleUpdateCategory = () => {
    if (!currentCategory || !editedCategoryName.trim()) {
      toast({
        title: "Hata",
        description: "Kategori adı boş olamaz",
        variant: "destructive",
      });
      return;
    }

    setExpenseCategories(prev => 
      prev.map(cat => 
        cat.id === currentCategory.id 
          ? { ...cat, name: editedCategoryName.trim() }
          : cat
      )
    );

    toast({
      title: "Başarılı",
      description: "Kategori güncellendi",
    });

    setEditCategoryModal(false);
    setCurrentCategory(null);
    setEditedCategoryName("");
  };

  // Delete Category
  const handleDeleteCategory = () => {
    if (!currentCategory) return;

    setExpenseCategories(prev => prev.filter(cat => cat.id !== currentCategory.id));

    toast({
      title: "Başarılı",
      description: "Kategori silindi",
    });

    setEditCategoryModal(false);
    setCurrentCategory(null);
    setEditedCategoryName("");
  };

  // Close Modal
  const handleCloseModal = () => {
    setEditCategoryModal(false);
    setCurrentCategory(null);
    setEditedCategoryName("");
  };

  // Open Add Type Modal
  const handleAddType = (category: ExpenseCategory) => {
    setCurrentCategoryForType(category);
    setNewTypeName("");
    setAddTypeModal(true);
  };

  // Save New Type
  const handleSaveNewType = () => {
    if (!currentCategoryForType || !newTypeName.trim()) {
      toast({
        title: "Hata",
        description: "Genel gider adı boş olamaz",
        variant: "destructive",
      });
      return;
    }

    setExpenseCategories(prev => 
      prev.map(cat => 
        cat.id === currentCategoryForType.id 
          ? { ...cat, types: [...cat.types, newTypeName.trim()] }
          : cat
      )
    );

    toast({
      title: "Başarılı",
      description: "Yeni gider tipi eklendi",
    });

    setAddTypeModal(false);
    setCurrentCategoryForType(null);
    setNewTypeName("");
  };

  // Close Add Type Modal
  const handleCloseAddTypeModal = () => {
    setAddTypeModal(false);
    setCurrentCategoryForType(null);
    setNewTypeName("");
  };

  // Open Edit Type Modal
  const handleEditType = (categoryId: string, typeName: string, typeIndex: number) => {
    setCurrentTypeForEdit({ categoryId, typeName, typeIndex });
    setEditedTypeName(typeName);
    setEditTypeModal(true);
  };

  // Update Type Name
  const handleUpdateType = () => {
    if (!currentTypeForEdit || !editedTypeName.trim()) {
      toast({
        title: "Hata",
        description: "Gider tipi adı boş olamaz",
        variant: "destructive",
      });
      return;
    }

    setExpenseCategories(prev => 
      prev.map(cat => 
        cat.id === currentTypeForEdit.categoryId 
          ? { 
              ...cat, 
              types: cat.types.map((type, idx) => 
                idx === currentTypeForEdit.typeIndex ? editedTypeName.trim() : type
              ) 
            }
          : cat
      )
    );

    toast({
      title: "Başarılı",
      description: "Gider tipi güncellendi",
    });

    setEditTypeModal(false);
    setCurrentTypeForEdit(null);
    setEditedTypeName("");
  };

  // Delete Type
  const handleDeleteType = () => {
    if (!currentTypeForEdit) return;

    setExpenseCategories(prev => 
      prev.map(cat => 
        cat.id === currentTypeForEdit.categoryId 
          ? { 
              ...cat, 
              types: cat.types.filter((_, idx) => idx !== currentTypeForEdit.typeIndex) 
            }
          : cat
      )
    );

    toast({
      title: "Başarılı",
      description: "Gider tipi silindi",
    });

    setEditTypeModal(false);
    setCurrentTypeForEdit(null);
    setEditedTypeName("");
  };

  // Close Edit Type Modal
  const handleCloseEditTypeModal = () => {
    setEditTypeModal(false);
    setCurrentTypeForEdit(null);
    setEditedTypeName("");
  };

  // Veri state'leri
  const [salesInvoices, setSalesInvoices] = useState<Invoice[]>([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState<Invoice[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
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
      // Mock data to ensure UI renders without backend dependencies breaking
      setSalesInvoices([]);
      setPurchaseInvoices([]);
      setPurchases([]);
      setExpenses([]);
      setTransactions([]);
      setCustomers([]);
      calculateStats([]);
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
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
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
          </Card>
        </TabsContent>

        {/* Giderler */}
        <TabsContent value="expenses" className="space-y-4">
          <Tabs defaultValue="general-expenses" className="space-y-4">
            <TabsList>
              <TabsTrigger value="general-expenses">Genel Giderler</TabsTrigger>
              <TabsTrigger value="expense-types">Genel Gider Tipleri</TabsTrigger>
              <TabsTrigger value="recurring-expenses">Tekrarlı Genel Giderler</TabsTrigger>
            </TabsList>

            {/* Genel Giderler Alt Sekmesi */}
            <TabsContent value="general-expenses" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Gider ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      <SelectItem value="operational">Operasyonel</SelectItem>
                      <SelectItem value="administrative">İdari</SelectItem>
                      <SelectItem value="financial">Finansal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Gider Ekle
                </Button>
              </div>

              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Açıklama</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Tutar</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        Gider kaydı bulunamadı. Yeni gider eklemek için yukarıdaki butona tıklayın.
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            {/* Genel Gider Tipleri Alt Sekmesi */}
            <TabsContent value="expense-types" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {expenseCategories.map((category) => (
                  <Card key={category.id} className="p-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">{category.name}</h3>
                      <div className="space-y-2">
                        {category.types.map((type, index) => (
                          <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                            <span className="text-sm">{type}</span>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditType(category.id, type, index)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => handleEditCategory(category)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Kategoriyi Düzenle
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => handleAddType(category)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Yeni Tip Ekle
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}

              </div>
            </TabsContent>

            {/* Tekrarlı Genel Giderler Alt Sekmesi */}
            <TabsContent value="recurring-expenses" className="space-y-4">
              <Card className="p-6">
                <p className="text-center text-gray-500">Tekrarlı genel giderler yakında eklenecek...</p>
              </Card>
            </TabsContent>

          </Tabs>
        </TabsContent>

        {/* Ürün/Hizmet */}
        <TabsContent value="products" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Ürün ve Hizmetler</h3>
            <p className="text-muted-foreground">Yakında eklenecek...</p>
          </Card>
        </TabsContent>

        {/* Cari Hesaplar - Ana Tab İçinde Alt Sekmeler */}
        <TabsContent value="customers" className="space-y-4">
          <Tabs value={cariTab} onValueChange={setCariTab} className="space-y-4">
            <TabsList className="flex flex-wrap h-auto">
              <TabsTrigger value="genel" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Genel Cari
              </TabsTrigger>
              <TabsTrigger value="musteri" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Müşteri Cari
              </TabsTrigger>
              <TabsTrigger value="tedarikci" className="flex items-center gap-2">
                <Handshake className="h-4 w-4" />
                Tedarikçi Cari
              </TabsTrigger>
              <TabsTrigger value="personel" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Personel Cari
              </TabsTrigger>
              <TabsTrigger value="ortak" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Ortak Cari
              </TabsTrigger>
            </TabsList>

            {/* Genel Cari Alt Sekmesi */}
            <TabsContent value="genel" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold">Genel Cari Hesapları</h2>
                  <div className="h-1 w-12 bg-primary mt-2"></div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="bg-blue-50">
                    <Search className="h-4 w-4 mr-2" />
                    Detaylı Arama
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground italic">
                  1000 adet kayıt listelenmektedir. Daha fazlası için detaylı arama yapabilirsiniz.
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" className="bg-blue-50">
                    <Info className="h-4 w-4 mr-2" />
                    Toplu Seç
                  </Button>
                  <Button className="bg-green-600 hover:bg-green-700">
                    Cari Oluştur
                  </Button>
                  <Button variant="outline" className="bg-blue-600 text-white hover:bg-blue-700">
                    <Upload className="h-4 w-4 mr-2" />
                    İçe Aktar
                  </Button>
                  <Button variant="outline" className="bg-blue-600 text-white hover:bg-blue-700">
                    <Download className="h-4 w-4" />
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
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Card>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">
                            <input type="checkbox" className="rounded" />
                          </TableHead>
                          <TableHead className="w-[100px]">Kod</TableHead>
                          <TableHead className="w-[200px]">Unvan</TableHead>
                          <TableHead className="w-[120px]">Cari Tipi</TableHead>
                          <TableHead className="w-[140px]">Telefon Numarası</TableHead>
                          <TableHead className="w-[120px]">Etiketler</TableHead>
                          <TableHead className="w-[140px]">VKN/TCKN</TableHead>
                          <TableHead className="w-[120px]">Yerel Bakiye</TableHead>
                          <TableHead className="w-[100px] text-right">İşlemler</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                              <div className="flex flex-col items-center gap-2">
                                <Users className="h-12 w-12 opacity-20" />
                                <p>Henüz cari hesap kaydı bulunmamaktadır</p>
                                <Button variant="outline" size="sm">
                                  İlk Cari Hesabınızı Oluşturun
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          customers
                            .filter(c => {
                              if (!searchTerm) return true;
                              const search = searchTerm.toLowerCase();
                              return (
                                c.name?.toLowerCase().includes(search) ||
                                c.company?.toLowerCase().includes(search) ||
                                c.phone?.includes(search) ||
                                c.tax_number?.includes(search)
                              );
                            })
                            .map((customer) => (
                              <TableRow key={customer.id}>
                                <TableCell>
                                  <input type="checkbox" className="rounded" />
                                </TableCell>
                                <TableCell className="font-mono text-sm text-gray-600">
                                  {customer.id.substring(0, 8)}
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p className="font-semibold">{customer.company || customer.name}</p>
                                    {customer.company && <p className="text-sm text-gray-600">{customer.name}</p>}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Building className="w-4 h-4 text-gray-600" />
                                    <span className="text-sm">
                                      {customer.account_type === "musteri" && "Müşteri"}
                                      {customer.account_type === "tedarikci" && "Tedarikçi"}
                                      {customer.account_type === "personel" && "Personel"}
                                      {customer.account_type === "ortak" && "Ortak"}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm">{customer.phone || "-"}</span>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="bg-blue-50">
                                    {customer.status || "Aktif"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-mono text-sm">
                                  {customer.tax_number || "-"}
                                </TableCell>
                                <TableCell className="text-right font-semibold">
                                  ₺0,00
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

                {customers.length > 0 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Toplam {customers.length} kayıt gösteriliyor
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

            {/* Müşteri Cari Alt Sekmesi */}
            <TabsContent value="musteri" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold">Müşteri Cari Hesapları</h2>
                  <div className="h-1 w-12 bg-primary mt-2"></div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="bg-blue-50">
                    <Search className="h-4 w-4 mr-2" />
                    Detaylı Arama
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground italic">
                  {customers.filter(c => c.account_type === "musteri").length} adet kayıt listelenmektedir.
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" className="bg-blue-50">
                    <Info className="h-4 w-4 mr-2" />
                    Toplu Seç
                  </Button>
                  <Button className="bg-green-600 hover:bg-green-700">
                    Müşteri Oluştur
                  </Button>
                  <Button variant="outline" className="bg-blue-600 text-white hover:bg-blue-700">
                    <Upload className="h-4 w-4 mr-2" />
                    İçe Aktar
                  </Button>
                  <Button variant="outline" className="bg-blue-600 text-white hover:bg-blue-700">
                    <Download className="h-4 w-4" />
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
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Card>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">
                            <input type="checkbox" className="rounded" />
                          </TableHead>
                          <TableHead className="w-[100px]">Kod</TableHead>
                          <TableHead className="w-[200px]">Unvan</TableHead>
                          <TableHead className="w-[120px]">Cari Tipi</TableHead>
                          <TableHead className="w-[140px]">Telefon Numarası</TableHead>
                          <TableHead className="w-[120px]">Etiketler</TableHead>
                          <TableHead className="w-[140px]">VKN/TCKN</TableHead>
                          <TableHead className="w-[120px]">Yerel Bakiye</TableHead>
                          <TableHead className="w-[100px] text-right">İşlemler</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customers.filter(c => c.account_type === "musteri").length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                              <div className="flex flex-col items-center gap-2">
                                <Building className="h-12 w-12 opacity-20" />
                                <p>Henüz müşteri cari kaydı bulunmamaktadır</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          customers
                            .filter(c => c.account_type === "musteri")
                            .filter(c => {
                              if (!searchTerm) return true;
                              const search = searchTerm.toLowerCase();
                              return (
                                c.name?.toLowerCase().includes(search) ||
                                c.company?.toLowerCase().includes(search) ||
                                c.phone?.includes(search) ||
                                c.tax_number?.includes(search)
                              );
                            })
                            .map((customer) => (
                              <TableRow key={customer.id}>
                                <TableCell>
                                  <input type="checkbox" className="rounded" />
                                </TableCell>
                                <TableCell className="font-mono text-sm text-gray-600">
                                  {customer.id.substring(0, 8)}
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p className="font-semibold">{customer.company || customer.name}</p>
                                    {customer.company && <p className="text-sm text-gray-600">{customer.name}</p>}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Building className="w-4 h-4 text-gray-600" />
                                    <span className="text-sm">Müşteri</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm">{customer.phone || "-"}</span>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="bg-blue-50">
                                    {customer.status || "Aktif"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-mono text-sm">
                                  {customer.tax_number || "-"}
                                </TableCell>
                                <TableCell className="text-right font-semibold">
                                  ₺0,00
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

                {customers.filter(c => c.account_type === "musteri").length > 0 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Toplam {customers.filter(c => c.account_type === "musteri").length} kayıt gösteriliyor
                    </p>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">Önceki</Button>
                      <Button variant="default" size="sm">1</Button>
                      <Button variant="outline" size="sm">Sonraki</Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Tedarikçi Cari Alt Sekmesi */}
            <TabsContent value="tedarikci" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold">Tedarikçi Cari Hesapları</h2>
                  <div className="h-1 w-12 bg-primary mt-2"></div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="bg-blue-50">
                    <Search className="h-4 w-4 mr-2" />
                    Detaylı Arama
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground italic">
                  {customers.filter(c => c.account_type === "tedarikci").length} adet kayıt listelenmektedir.
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" className="bg-blue-50">
                    <Info className="h-4 w-4 mr-2" />
                    Toplu Seç
                  </Button>
                  <Button className="bg-green-600 hover:bg-green-700">
                    Tedarikçi Oluştur
                  </Button>
                  <Button variant="outline" className="bg-blue-600 text-white hover:bg-blue-700">
                    <Upload className="h-4 w-4 mr-2" />
                    İçe Aktar
                  </Button>
                  <Button variant="outline" className="bg-blue-600 text-white hover:bg-blue-700">
                    <Download className="h-4 w-4" />
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
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Card>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">
                            <input type="checkbox" className="rounded" />
                          </TableHead>
                          <TableHead className="w-[100px]">Kod</TableHead>
                          <TableHead className="w-[200px]">Unvan</TableHead>
                          <TableHead className="w-[120px]">Cari Tipi</TableHead>
                          <TableHead className="w-[140px]">Telefon Numarası</TableHead>
                          <TableHead className="w-[120px]">Etiketler</TableHead>
                          <TableHead className="w-[140px]">VKN/TCKN</TableHead>
                          <TableHead className="w-[120px]">Yerel Bakiye</TableHead>
                          <TableHead className="w-[100px] text-right">İşlemler</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customers.filter(c => c.account_type === "tedarikci").length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                              <div className="flex flex-col items-center gap-2">
                                <Handshake className="h-12 w-12 opacity-20" />
                                <p>Henüz tedarikçi cari kaydı bulunmamaktadır</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          customers
                            .filter(c => c.account_type === "tedarikci")
                            .filter(c => {
                              if (!searchTerm) return true;
                              const search = searchTerm.toLowerCase();
                              return (
                                c.name?.toLowerCase().includes(search) ||
                                c.company?.toLowerCase().includes(search) ||
                                c.phone?.includes(search) ||
                                c.tax_number?.includes(search)
                              );
                            })
                            .map((customer) => (
                              <TableRow key={customer.id}>
                                <TableCell>
                                  <input type="checkbox" className="rounded" />
                                </TableCell>
                                <TableCell className="font-mono text-sm text-gray-600">
                                  {customer.id.substring(0, 8)}
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p className="font-semibold">{customer.company || customer.name}</p>
                                    {customer.company && <p className="text-sm text-gray-600">{customer.name}</p>}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Handshake className="w-4 h-4 text-gray-600" />
                                    <span className="text-sm">Tedarikçi</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm">{customer.phone || "-"}</span>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="bg-blue-50">
                                    {customer.status || "Aktif"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-mono text-sm">
                                  {customer.tax_number || "-"}
                                </TableCell>
                                <TableCell className="text-right font-semibold">
                                  ₺0,00
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

                {customers.filter(c => c.account_type === "tedarikci").length > 0 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Toplam {customers.filter(c => c.account_type === "tedarikci").length} kayıt gösteriliyor
                    </p>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">Önceki</Button>
                      <Button variant="default" size="sm">1</Button>
                      <Button variant="outline" size="sm">Sonraki</Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Personel Cari Alt Sekmesi */}
            <TabsContent value="personel" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold">Personel Cari Hesapları</h2>
                  <div className="h-1 w-12 bg-primary mt-2"></div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="bg-blue-50">
                    <Search className="h-4 w-4 mr-2" />
                    Detaylı Arama
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground italic">
                  {customers.filter(c => c.account_type === "personel").length} adet kayıt listelenmektedir.
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" className="bg-blue-50">
                    <Info className="h-4 w-4 mr-2" />
                    Toplu Seç
                  </Button>
                  <Button className="bg-green-600 hover:bg-green-700">
                    Personel Oluştur
                  </Button>
                  <Button variant="outline" className="bg-blue-600 text-white hover:bg-blue-700">
                    <Upload className="h-4 w-4 mr-2" />
                    İçe Aktar
                  </Button>
                  <Button variant="outline" className="bg-blue-600 text-white hover:bg-blue-700">
                    <Download className="h-4 w-4" />
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
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Card>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">
                            <input type="checkbox" className="rounded" />
                          </TableHead>
                          <TableHead className="w-[100px]">Kod</TableHead>
                          <TableHead className="w-[200px]">Unvan</TableHead>
                          <TableHead className="w-[120px]">Cari Tipi</TableHead>
                          <TableHead className="w-[140px]">Telefon Numarası</TableHead>
                          <TableHead className="w-[120px]">Etiketler</TableHead>
                          <TableHead className="w-[140px]">VKN/TCKN</TableHead>
                          <TableHead className="w-[120px]">Yerel Bakiye</TableHead>
                          <TableHead className="w-[100px] text-right">İşlemler</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customers.filter(c => c.account_type === "personel").length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                              <div className="flex flex-col items-center gap-2">
                                <Users className="h-12 w-12 opacity-20" />
                                <p>Henüz personel cari kaydı bulunmamaktadır</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          customers
                            .filter(c => c.account_type === "personel")
                            .filter(c => {
                              if (!searchTerm) return true;
                              const search = searchTerm.toLowerCase();
                              return (
                                c.name?.toLowerCase().includes(search) ||
                                c.company?.toLowerCase().includes(search) ||
                                c.phone?.includes(search) ||
                                c.tax_number?.includes(search)
                              );
                            })
                            .map((customer) => (
                              <TableRow key={customer.id}>
                                <TableCell>
                                  <input type="checkbox" className="rounded" />
                                </TableCell>
                                <TableCell className="font-mono text-sm text-gray-600">
                                  {customer.id.substring(0, 8)}
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p className="font-semibold">{customer.company || customer.name}</p>
                                    {customer.company && <p className="text-sm text-gray-600">{customer.name}</p>}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-gray-600" />
                                    <span className="text-sm">Personel</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm">{customer.phone || "-"}</span>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="bg-blue-50">
                                    {customer.status || "Aktif"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-mono text-sm">
                                  {customer.tax_number || "-"}
                                </TableCell>
                                <TableCell className="text-right font-semibold">
                                  ₺0,00
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

                {customers.filter(c => c.account_type === "personel").length > 0 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Toplam {customers.filter(c => c.account_type === "personel").length} kayıt gösteriliyor
                    </p>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">Önceki</Button>
                      <Button variant="default" size="sm">1</Button>
                      <Button variant="outline" size="sm">Sonraki</Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Ortak Cari Alt Sekmesi */}
            <TabsContent value="ortak" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold">Ortak Cari Hesapları</h2>
                  <div className="h-1 w-12 bg-primary mt-2"></div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="bg-blue-50">
                    <Search className="h-4 w-4 mr-2" />
                    Detaylı Arama
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground italic">
                  {customers.filter(c => c.account_type === "ortak").length} adet kayıt listelenmektedir.
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" className="bg-blue-50">
                    <Info className="h-4 w-4 mr-2" />
                    Toplu Seç
                  </Button>
                  <Button className="bg-green-600 hover:bg-green-700">
                    Ortak Oluştur
                  </Button>
                  <Button variant="outline" className="bg-blue-600 text-white hover:bg-blue-700">
                    <Upload className="h-4 w-4 mr-2" />
                    İçe Aktar
                  </Button>
                  <Button variant="outline" className="bg-blue-600 text-white hover:bg-blue-700">
                    <Download className="h-4 w-4" />
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
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Card>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">
                            <input type="checkbox" className="rounded" />
                          </TableHead>
                          <TableHead className="w-[100px]">Kod</TableHead>
                          <TableHead className="w-[200px]">Unvan</TableHead>
                          <TableHead className="w-[120px]">Cari Tipi</TableHead>
                          <TableHead className="w-[140px]">Telefon Numarası</TableHead>
                          <TableHead className="w-[120px]">Etiketler</TableHead>
                          <TableHead className="w-[140px]">VKN/TCKN</TableHead>
                          <TableHead className="w-[120px]">Yerel Bakiye</TableHead>
                          <TableHead className="w-[100px] text-right">İşlemler</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customers.filter(c => c.account_type === "ortak").length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                              <div className="flex flex-col items-center gap-2">
                                <Users className="h-12 w-12 opacity-20" />
                                <p>Henüz ortak cari kaydı bulunmamaktadır</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          customers
                            .filter(c => c.account_type === "ortak")
                            .filter(c => {
                              if (!searchTerm) return true;
                              const search = searchTerm.toLowerCase();
                              return (
                                c.name?.toLowerCase().includes(search) ||
                                c.company?.toLowerCase().includes(search) ||
                                c.phone?.includes(search) ||
                                c.tax_number?.includes(search)
                              );
                            })
                            .map((customer) => (
                              <TableRow key={customer.id}>
                                <TableCell>
                                  <input type="checkbox" className="rounded" />
                                </TableCell>
                                <TableCell className="font-mono text-sm text-gray-600">
                                  {customer.id.substring(0, 8)}
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p className="font-semibold">{customer.company || customer.name}</p>
                                    {customer.company && <p className="text-sm text-gray-600">{customer.name}</p>}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-gray-600" />
                                    <span className="text-sm">Ortak</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm">{customer.phone || "-"}</span>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="bg-blue-50">
                                    {customer.status || "Aktif"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-mono text-sm">
                                  {customer.tax_number || "-"}
                                </TableCell>
                                <TableCell className="text-right font-semibold">
                                  ₺0,00
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

                {customers.filter(c => c.account_type === "ortak").length > 0 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Toplam {customers.filter(c => c.account_type === "ortak").length} kayıt gösteriliyor
                    </p>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">Önceki</Button>
                      <Button variant="default" size="sm">1</Button>
                      <Button variant="outline" size="sm">Sonraki</Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
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

      {/* Category Edit Modal */}
      <Dialog open={editCategoryModal} onOpenChange={setEditCategoryModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              Kategori Düzenle
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">
                Ad <span className="text-red-500">*</span>
              </Label>
              <Input
                id="category-name"
                value={editedCategoryName}
                onChange={(e) => setEditedCategoryName(e.target.value)}
                placeholder="Kategori adı"
                className="w-full"
              />
            </div>
          </div>

          <DialogFooter className="flex justify-center gap-3 sm:justify-center">
            <Button
              variant="outline"
              onClick={handleCloseModal}
              className="border-red-500 text-red-500 hover:bg-red-50"
            >
              Kapat
            </Button>
            <Button
              onClick={handleUpdateCategory}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Güncelle
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCategory}
              className="bg-red-600 hover:bg-red-700"
            >
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Type Modal */}
      <Dialog open={addTypeModal} onOpenChange={setAddTypeModal}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              Yeni Genel Gider Tipi
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type-name" className="text-blue-600">
                Genel Gider Adı <span className="text-blue-600">*</span>
              </Label>
              <Input
                id="type-name"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="Gider tipi adı girin"
                className="w-full"
              />
            </div>
          </div>

          <DialogFooter className="flex justify-center gap-3 sm:justify-center">
            <Button
              variant="outline"
              onClick={handleCloseAddTypeModal}
              className="border-red-500 text-red-500 hover:bg-red-50 px-8"
            >
              Kapat
            </Button>
            <Button
              onClick={handleSaveNewType}
              className="bg-green-600 hover:bg-green-700 text-white px-8"
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}