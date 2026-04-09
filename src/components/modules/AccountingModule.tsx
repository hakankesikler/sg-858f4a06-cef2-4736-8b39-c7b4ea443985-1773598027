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
  CreditCard,
  Package,
  Users,
  ShoppingCart,
  FileText,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Info,
  CheckSquare,
  Mail,
  Upload,
  Receipt
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
  types: Array<{ id: string; name: string }>;
}

interface ExpenseType {
  id: string;
  name: string;
}

export function AccountingModule() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Geri Yüklenen State'ler
  const [statusFilter, setStatusFilter] = useState("all");
  const [cariTab, setCariTab] = useState("genel");
  const [salesInvoices, setSalesInvoices] = useState<Invoice[]>([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState<Invoice[]>([]);
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
  const [currentTypeForEdit, setCurrentTypeForEdit] = useState<{ 
    categoryId: string; 
    typeId: string; 
    typeName: string; 
  } | null>(null);
  const [editedTypeName, setEditedTypeName] = useState("");

  // Add New Category Modal State
  const [addCategoryModal, setAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Expense Categories State
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);

  // Veri yükleme
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load expense categories with types from database
      const categories = await accountingService.getExpenseCategories();
      
      // Transform database format to component format with type safety
      const transformedCategories: ExpenseCategory[] = (categories || []).map((cat: any) => ({
        id: cat?.id || '',
        name: cat?.name || '',
        types: Array.isArray(cat?.expense_types) 
          ? cat.expense_types.map((type: any) => ({
              id: type?.id || '',
              name: type?.name || ''
            }))
          : []
      }));
      
      setExpenseCategories(transformedCategories);
      
      // Load other data
      setSalesInvoices([]);
      setPurchaseInvoices([]);
      setCustomers([]);
    } catch (error) {
      console.error("Veri yükleme hatası:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Veriler yüklenirken bir hata oluştu",
      });
      
      // Fallback to mock data if database fails
      setExpenseCategories([
        {
          id: "1",
          name: "Kategoriyle Genel Gider Tipleri",
          types: [{ id: "t1", name: "Yiyecek" }]
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Open Edit Category Modal
  const handleEditCategory = (category: ExpenseCategory) => {
    setCurrentCategory(category);
    setEditedCategoryName(category.name);
    setEditCategoryModal(true);
  };

  // Update Category Name
  const handleUpdateCategory = async () => {
    if (!currentCategory || !editedCategoryName.trim()) {
      toast({
        title: "Hata",
        description: "Kategori adı boş olamaz",
        variant: "destructive",
      });
      return;
    }

    try {
      await accountingService.updateExpenseCategory(currentCategory.id, editedCategoryName.trim());
      
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
    } catch (error) {
      console.error("Kategori güncelleme hatası:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Kategori güncellenirken bir hata oluştu",
      });
    }
  };

  // Delete Category
  const handleDeleteCategory = async () => {
    if (!currentCategory) return;

    try {
      await accountingService.deleteExpenseCategory(currentCategory.id);
      
      setExpenseCategories(prev => prev.filter(cat => cat.id !== currentCategory.id));

      toast({
        title: "Başarılı",
        description: "Kategori silindi",
      });

      setEditCategoryModal(false);
      setCurrentCategory(null);
      setEditedCategoryName("");
    } catch (error) {
      console.error("Kategori silme hatası:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Kategori silinirken bir hata oluştu",
      });
    }
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
  const handleSaveNewType = async () => {
    if (!currentCategoryForType || !newTypeName.trim()) {
      toast({
        title: "Hata",
        description: "Genel gider adı boş olamaz",
        variant: "destructive",
      });
      return;
    }

    try {
      const newType = await accountingService.createExpenseType(
        currentCategoryForType.id,
        newTypeName.trim()
      );
      
      setExpenseCategories(prev => 
        prev.map(cat => 
          cat.id === currentCategoryForType.id 
            ? { ...cat, types: [...cat.types, { id: newType.id, name: newType.name }] }
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
    } catch (error) {
      console.error("Gider tipi ekleme hatası:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Gider tipi eklenirken bir hata oluştu",
      });
    }
  };

  // Update Type Name
  const handleUpdateType = async () => {
    if (!currentTypeForEdit || !editedTypeName.trim()) {
      toast({
        title: "Hata",
        description: "Gider tipi adı boş olamaz",
        variant: "destructive",
      });
      return;
    }

    try {
      await accountingService.updateExpenseType(
        currentTypeForEdit.typeId,
        editedTypeName.trim()
      );
      
      setExpenseCategories(prev => 
        prev.map(cat => 
          cat.id === currentTypeForEdit.categoryId 
            ? { 
                ...cat, 
                types: cat.types.map(type => 
                  type.id === currentTypeForEdit.typeId 
                    ? { ...type, name: editedTypeName.trim() }
                    : type
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
    } catch (error) {
      console.error("Gider tipi güncelleme hatası:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Gider tipi güncellenirken bir hata oluştu",
      });
    }
  };

  // Delete Type
  const handleDeleteType = async () => {
    if (!currentTypeForEdit) return;

    try {
      await accountingService.deleteExpenseType(currentTypeForEdit.typeId);
      
      setExpenseCategories(prev => 
        prev.map(cat => 
          cat.id === currentTypeForEdit.categoryId 
            ? { 
                ...cat, 
                types: cat.types.filter(type => type.id !== currentTypeForEdit.typeId) 
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
    } catch (error) {
      console.error("Gider tipi silme hatası:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Gider tipi silinirken bir hata oluştu",
      });
    }
  };

  // Close Add Type Modal
  const handleCloseAddTypeModal = () => {
    setAddTypeModal(false);
    setCurrentCategoryForType(null);
    setNewTypeName("");
  };

  // Open Edit Type Modal
  const handleEditType = (categoryId: string, typeId: string, typeName: string) => {
    setCurrentTypeForEdit({ categoryId, typeId, typeName });
    setEditedTypeName(typeName);
    setEditTypeModal(true);
  };

  // Close Edit Type Modal
  const handleCloseEditTypeModal = () => {
    setEditTypeModal(false);
    setCurrentTypeForEdit(null);
    setEditedTypeName("");
  };

  // Open Add Category Modal
  const handleAddCategory = () => {
    setNewCategoryName("");
    setAddCategoryModal(true);
  };

  // Save New Category
  const handleSaveNewCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Hata",
        description: "Kategori adı boş olamaz",
        variant: "destructive",
      });
      return;
    }

    try {
      const newCategory = await accountingService.createExpenseCategory(newCategoryName.trim());
      
      setExpenseCategories(prev => [...prev, {
        id: newCategory.id,
        name: newCategory.name,
        types: []
      }]);

      toast({
        title: "Başarılı",
        description: "Yeni kategori eklendi",
      });

      setAddCategoryModal(false);
      setNewCategoryName("");
    } catch (error) {
      console.error("Kategori ekleme hatası:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Kategori eklenirken bir hata oluştu",
      });
    }
  };

  // Close Add Category Modal
  const handleCloseAddCategoryModal = () => {
    setAddCategoryModal(false);
    setNewCategoryName("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Muhasebe</h2>
      </div>

      <Tabs defaultValue="panel" className="space-y-4">
        <TabsList>
          <TabsTrigger value="panel">Panel</TabsTrigger>
          <TabsTrigger value="sales">Satış</TabsTrigger>
          <TabsTrigger value="purchase">Alış</TabsTrigger>
          <TabsTrigger value="expenses">Giderler</TabsTrigger>
          <TabsTrigger value="cari">Cari Hesaplar</TabsTrigger>
          <TabsTrigger value="reports">Raporlar</TabsTrigger>
        </TabsList>

        {/* Panel */}
        <TabsContent value="panel">
          <Card className="p-6">
            <p className="text-gray-500">Panel içeriği yakında eklenecek...</p>
          </Card>
        </TabsContent>

        {/* Satış Faturaları */}
        <TabsContent value="sales" className="space-y-4">
          {/* İstatistik Kartları */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 border-l-4 border-l-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Toplam Ciro</p>
                  <p className="text-2xl font-bold text-green-600">₺0</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </Card>

            <Card className="p-4 border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Aylık Ciro</p>
                  <p className="text-2xl font-bold text-blue-600">₺0</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </Card>

            <Card className="p-4 border-l-4 border-l-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Ödenen Faturalar</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </Card>

            <Card className="p-4 border-l-4 border-l-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Bekleyen</p>
                  <p className="text-2xl font-bold text-orange-600">0</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </Card>
          </div>

          {/* Satış Faturaları Başlık */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Satış Faturaları</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Search className="mr-2 h-4 w-4" />
                Detaylı Arama
              </Button>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Boş Liste Mesajı */}
          <Card className="p-8">
            <div className="text-center space-y-4">
              <p className="text-gray-500">0 adet kayıt listelenmektedir. Daha fazlası için detaylı arama yapabilirsiniz.</p>
            </div>
          </Card>

          {/* Aksiyon Butonları */}
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm">
              <CheckSquare className="mr-2 h-4 w-4" />
              Toplu Seç
            </Button>

            <div className="flex items-center gap-2">
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="mr-2 h-4 w-4" />
                Satış Faturası Oluştur
              </Button>
              <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Alış İade Faturası Oluştur
              </Button>
              <Button variant="outline">
                <Mail className="mr-2 h-4 w-4" />
                e-Fatura Gelen Kutusu
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                İçe Aktar
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Dışarıya Aktar
              </Button>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Fatura Tablosu */}
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input type="checkbox" className="rounded" />
                    </TableHead>
                    <TableHead>E-Fatura Durumu</TableHead>
                    <TableHead>Belge Tipi</TableHead>
                    <TableHead>Cari Bilgisi</TableHead>
                    <TableHead>Proje</TableHead>
                    <TableHead>Etiketler</TableHead>
                    <TableHead>Seri No</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Düzenlenme Tarihi</TableHead>
                    <TableHead>Vade Tarihi</TableHead>
                    <TableHead>Fatura Tutarı</TableHead>
                    <TableHead>Takip Tutarı</TableHead>
                    <TableHead>Bakiye</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8 text-gray-500">
                      Toplam 0 kayıt gösteriliyor
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Sayfalama */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Toplam 0 kayıt gösteriliyor
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                Önceki
              </Button>
              <Button variant="default" size="sm">
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
        </TabsContent>

        {/* Alış Faturaları */}
        <TabsContent value="purchase" className="space-y-4">
          {/* Alış Faturaları Başlık */}
          <div className="border-b border-gray-200 pb-2">
            <h2 className="text-2xl font-semibold border-b-4 border-blue-500 inline-block pb-2">
              Alış Faturaları
            </h2>
          </div>

          {/* Detaylı Arama Butonu */}
          <div>
            <Button variant="default" className="bg-blue-500 hover:bg-blue-600">
              Detaylı Arama
            </Button>
          </div>

          {/* Kayıt Sayısı Mesajı */}
          <div className="text-sm text-gray-600 italic">
            1000 adet kayıt listelenmektedir. Daha fazlası için detaylı arama yapabilirsiniz.
          </div>

          {/* Aksiyon Butonları */}
          <div className="flex items-center justify-between">
            <Button variant="default" className="bg-blue-500 hover:bg-blue-600">
              <Info className="mr-2 h-4 w-4" />
              Toplu Seç
            </Button>

            <div className="flex items-center gap-2">
              <Button className="bg-green-600 hover:bg-green-700">
                Alış Faturası Oluştur
              </Button>
              <Button className="bg-green-600 hover:bg-green-700">
                Satış İade Faturası Oluştur
              </Button>
              <Button variant="default" className="bg-blue-500 hover:bg-blue-600">
                e-Fatura Gelen Kutusu
              </Button>
              <Button variant="outline">
                İçe Aktar
              </Button>
              <Button variant="outline">
                Dışarıya Aktar
              </Button>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              <div className="relative w-48">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Ara"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Fatura Tablosu */}
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>e-Fatura Durumu</TableHead>
                    <TableHead>Belge Tipi</TableHead>
                    <TableHead>Cari Bilgisi</TableHead>
                    <TableHead>Proje</TableHead>
                    <TableHead>Etiketler</TableHead>
                    <TableHead>Seri No</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Düzenlenme Tarihi</TableHead>
                    <TableHead>Vade Tarihi</TableHead>
                    <TableHead>Fatura Tutarı</TableHead>
                    <TableHead>Bakiye</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                        Alış faturası bulunamadı. Yeni fatura eklemek için yukarıdaki butona tıklayın.
                      </TableCell>
                    </TableRow>
                  ) : (
                    purchaseInvoices
                      .filter((invoice) => {
                        const matchesSearch = invoice.invoice_no
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase());
                        const matchesStatus =
                          statusFilter === "all" || invoice.status === statusFilter;
                        return matchesSearch && matchesStatus;
                      })
                      .map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell>-</TableCell>
                          <TableCell>Alış Faturası</TableCell>
                          <TableCell>{invoice.customer_id}</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell className="font-medium">
                            {invoice.invoice_no}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                invoice.status === "paid"
                                  ? "default"
                                  : invoice.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {invoice.status === "paid"
                                ? "Ödendi"
                                : invoice.status === "pending"
                                ? "Beklemede"
                                : "Gecikmiş"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(invoice.created_at).toLocaleDateString("tr-TR")}
                          </TableCell>
                          <TableCell>
                            {invoice.due_date
                              ? new Date(invoice.due_date).toLocaleDateString("tr-TR")
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {new Intl.NumberFormat("tr-TR", {
                              style: "currency",
                              currency: "TRY",
                            }).format(invoice.total)}
                          </TableCell>
                          <TableCell>
                            {new Intl.NumberFormat("tr-TR", {
                              style: "currency",
                              currency: "TRY",
                            }).format(invoice.total)}
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
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
            <TabsContent value="general-expenses" className="space-y-6">
              {/* İstatistik Kartları */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 border-l-4 border-l-orange-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Toplam Gider</p>
                      <p className="text-2xl font-bold text-orange-600">₺40.200</p>
                    </div>
                    <Receipt className="h-8 w-8 text-orange-500" />
                  </div>
                </Card>

                <Card className="p-4 border-l-4 border-l-orange-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Bu Ay</p>
                      <p className="text-2xl font-bold text-orange-600">₺0</p>
                    </div>
                    <Calendar className="h-8 w-8 text-orange-500" />
                  </div>
                </Card>

                <Card className="p-4 border-l-4 border-l-yellow-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Bekleyen Ödemeler</p>
                      <p className="text-2xl font-bold">1</p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-500" />
                  </div>
                </Card>

                <Card className="p-4 border-l-4 border-l-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Ödenen Giderler</p>
                      <p className="text-2xl font-bold">6</p>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>
                </Card>
              </div>

              {/* Genel Giderler Başlık */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Genel Giderler</h2>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Search className="mr-2 h-4 w-4" />
                    Detaylı Arama
                  </Button>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Kayıt Sayısı Mesajı */}
              <div className="text-sm text-gray-600">
                7 adet kayıt listelenmektedir. Daha fazlası için detaylı arama yapabilirsiniz.
              </div>

              {/* Aksiyon Butonları */}
              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm">
                  <CheckSquare className="mr-2 h-4 w-4" />
                  Toplu Seç
                </Button>

                <div className="flex items-center gap-2">
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Genel Gider Oluştur
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    İçe Aktar
                  </Button>
                  <Button variant="outline" size="sm">
                    <Upload className="mr-2 h-4 w-4" />
                    Dışarıya Aktar
                  </Button>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Giderler Tablosu */}
              <Card>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <input type="checkbox" className="rounded" />
                        </TableHead>
                        <TableHead>Cari Bilgisi</TableHead>
                        <TableHead>Etiketler</TableHead>
                        <TableHead>Gider Tipi</TableHead>
                        <TableHead>Seri No</TableHead>
                        <TableHead>Proje</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead>Düzenlenme Tarihi</TableHead>
                        <TableHead>Son Ödeme Tarihi</TableHead>
                        <TableHead>Genel İskonto</TableHead>
                        <TableHead>Fatura Tutarı</TableHead>
                        <TableHead>Takip Tutarı</TableHead>
                        <TableHead>Bakiye</TableHead>
                        <TableHead>İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={14} className="text-center py-8 text-gray-500">
                          Toplam 7 kayıt gösteriliyor
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </Card>

              {/* Sayfalama */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Toplam 7 kayıt gösteriliyor
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled>
                    Önceki
                  </Button>
                  <Button variant="default" size="sm">
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
            </TabsContent>

            {/* Genel Gider Tipleri Alt Sekmesi */}
            <TabsContent value="expense-types" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {expenseCategories.map((category) => (
                  <Card key={category.id} className="p-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">{category.name}</h3>
                      <div className="space-y-2">
                        {Array.isArray(category.types) && category.types.map((type) => (
                          <div key={type?.id || Math.random()} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                            <span className="text-sm">{type?.name || ''}</span>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (type?.id && type?.name) {
                                  handleEditType(category.id, type.id, type.name);
                                }
                              }}
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

                {/* Yeni Kategori Ekle Kartı */}
                <Card 
                  className="p-6 border-2 border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50/50 cursor-pointer transition-all"
                  onClick={handleAddCategory}
                >
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-8">
                    <Plus className="h-16 w-16 text-blue-400" />
                    <p className="text-xl font-semibold text-blue-600">Yeni Kategori Ekle</p>
                  </div>
                </Card>

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

        {/* Cari Hesaplar */}
        <TabsContent value="cari" className="space-y-4">
          <Tabs value={cariTab} onValueChange={setCariTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="genel">Genel</TabsTrigger>
              <TabsTrigger value="musteriler">Müşteriler</TabsTrigger>
              <TabsTrigger value="tedarikciler">Tedarikçiler</TabsTrigger>
              <TabsTrigger value="ortaklar">Ortaklar</TabsTrigger>
            </TabsList>

            {/* Genel Cari Hesaplar */}
            <TabsContent value="genel" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Cari ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Hesap Tipi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      <SelectItem value="customer">Müşteri</SelectItem>
                      <SelectItem value="supplier">Tedarikçi</SelectItem>
                      <SelectItem value="partner">Ortak</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Cari Hesap
                </Button>
              </div>

              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cari Adı</TableHead>
                      <TableHead>Hesap Tipi</TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead>Bakiye</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          Cari hesap bulunamadı. Yeni cari hesap eklemek için yukarıdaki butona tıklayın.
                        </TableCell>
                      </TableRow>
                    ) : (
                      customers
                        .filter((customer) =>
                          customer.name.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((customer) => (
                          <TableRow key={customer.id}>
                            <TableCell className="font-medium">
                              {customer.name}
                              {customer.company && (
                                <span className="block text-sm text-gray-500">
                                  {customer.company}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {customer.account_type === "customer"
                                  ? "Müşteri"
                                  : "Tedarikçi"}
                              </Badge>
                            </TableCell>
                            <TableCell>{customer.phone || "-"}</TableCell>
                            <TableCell>
                              {new Intl.NumberFormat("tr-TR", {
                                style: "currency",
                                currency: "TRY",
                              }).format(0)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  customer.status === "active"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {customer.status === "active" ? "Aktif" : "Pasif"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
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

            {/* Müşteriler */}
            <TabsContent value="musteriler" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Müşteri ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Müşteri
                </Button>
              </div>

              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Müşteri Adı</TableHead>
                      <TableHead>Şirket</TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead>Vergi No</TableHead>
                      <TableHead>Bakiye</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.filter((c) => c.account_type === "customer").length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          Müşteri bulunamadı. Yeni müşteri eklemek için yukarıdaki butona tıklayın.
                        </TableCell>
                      </TableRow>
                    ) : (
                      customers
                        .filter((c) => c.account_type === "customer")
                        .filter((customer) =>
                          customer.name.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((customer) => (
                          <TableRow key={customer.id}>
                            <TableCell className="font-medium">{customer.name}</TableCell>
                            <TableCell>{customer.company || "-"}</TableCell>
                            <TableCell>{customer.phone || "-"}</TableCell>
                            <TableCell>{customer.tax_number || "-"}</TableCell>
                            <TableCell>
                              {new Intl.NumberFormat("tr-TR", {
                                style: "currency",
                                currency: "TRY",
                              }).format(0)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
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

            {/* Tedarikçiler */}
            <TabsContent value="tedarikciler" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Tedarikçi ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Tedarikçi
                </Button>
              </div>

              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tedarikçi Adı</TableHead>
                      <TableHead>Şirket</TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead>Vergi No</TableHead>
                      <TableHead>Bakiye</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.filter((c) => c.account_type === "supplier").length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          Tedarikçi bulunamadı. Yeni tedarikçi eklemek için yukarıdaki butona tıklayın.
                        </TableCell>
                      </TableRow>
                    ) : (
                      customers
                        .filter((c) => c.account_type === "supplier")
                        .filter((customer) =>
                          customer.name.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((customer) => (
                          <TableRow key={customer.id}>
                            <TableCell className="font-medium">{customer.name}</TableCell>
                            <TableCell>{customer.company || "-"}</TableCell>
                            <TableCell>{customer.phone || "-"}</TableCell>
                            <TableCell>{customer.tax_number || "-"}</TableCell>
                            <TableCell>
                              {new Intl.NumberFormat("tr-TR", {
                                style: "currency",
                                currency: "TRY",
                              }).format(0)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
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

            {/* Ortaklar */}
            <TabsContent value="ortaklar" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Ortak ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Ortak
                </Button>
              </div>

              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ortak Adı</TableHead>
                      <TableHead>Ortak Tipi</TableHead>
                      <TableHead>Hesap Kodu</TableHead>
                      <TableHead>Hisse Oranı</TableHead>
                      <TableHead>Sermaye</TableHead>
                      <TableHead>Bakiye</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        Ortak hesabı bulunamadı. Yeni ortak eklemek için yukarıdaki butona tıklayın.
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Raporlar */}
        <TabsContent value="reports">
          <Card className="p-6">
            <p className="text-gray-500">Raporlar yakında eklenecek...</p>
          </Card>
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

      {/* Edit Type Modal */}
      <Dialog open={editTypeModal} onOpenChange={setEditTypeModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              Gider Tipi Düzenle
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-type-name">
                Gider Tipi Adı <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-type-name"
                value={editedTypeName}
                onChange={(e) => setEditedTypeName(e.target.value)}
                placeholder="Gider tipi adı"
                className="w-full"
              />
            </div>
          </div>

          <DialogFooter className="flex justify-center gap-3 sm:justify-center">
            <Button
              variant="outline"
              onClick={handleCloseEditTypeModal}
              className="border-red-500 text-red-500 hover:bg-red-50"
            >
              Kapat
            </Button>
            <Button
              onClick={handleUpdateType}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Kaydet
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteType}
              className="bg-red-600 hover:bg-red-700"
            >
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Category Modal */}
      <Dialog open={addCategoryModal} onOpenChange={setAddCategoryModal}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              Yeni Kategori Ekle
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-category-name" className="text-blue-600">
                Kategori Adı <span className="text-blue-600">*</span>
              </Label>
              <Input
                id="new-category-name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Yeni kategori adı girin"
                className="w-full"
              />
            </div>
          </div>

          <DialogFooter className="flex justify-center gap-3 sm:justify-center">
            <Button
              variant="outline"
              onClick={handleCloseAddCategoryModal}
              className="border-red-500 text-red-500 hover:bg-red-50 px-8"
            >
              Kapat
            </Button>
            <Button
              onClick={handleSaveNewCategory}
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