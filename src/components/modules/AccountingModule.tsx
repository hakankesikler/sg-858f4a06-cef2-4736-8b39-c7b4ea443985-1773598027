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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Download,
  Eye,
  TrendingUp,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  Info,
  CheckSquare,
  Mail,
  Upload,
  Receipt,
  Building2,
  Briefcase,
  UserCircle2,
  ChevronDown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { accountingService } from "@/services/accountingService";
import { crmService } from "@/services/crmService";

type Invoice = {
  id: string;
  invoice_no: string;
  customer_id: string;
  total: number;
  status: string;
  created_at: string;
  due_date?: string;
};

type Customer = {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  address?: string;
  city?: string;
  tax_number?: string;
  tax_office?: string;
  status: string;
  notes?: string;
  account_type?: string;
  created_at: string;
};

interface ExpenseCategory {
  id: string;
  name: string;
  types: Array<{ id: string; name: string }>;
}

export function AccountingModule() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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

  // CRM-specific states
  const [activeTab, setActiveTab] = useState("musteri");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    tax_number: "",
    tax_office: "",
    status: "Potansiyel" as const,
    notes: "",
    account_type: "musteri"
  });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [detailCustomer, setDetailCustomer] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    city: "all",
    dateFrom: "",
    dateTo: ""
  });
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cariTuru, setCariTuru] = useState("gercek");
  const [vadeGunuVar, setVadeGunuVar] = useState(false);
  const [vadeGunuSayisi, setVadeGunuSayisi] = useState("");
  const [sabitIskontoVar, setSabitIskontoVar] = useState(false);
  const [sabitIskontoYuzde, setSabitIskontoYuzde] = useState("");

  const loadData = async () => {
    try {
      const data = await crmService.getCustomers();
      setCustomers(data as any);
    } catch (error) {
      console.error("Cari hesaplar yüklenirken hata:", error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddDialog = () => {
    setFormData({
      name: "",
      company: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      tax_number: "",
      tax_office: "",
      status: "Potansiyel",
      notes: "",
      account_type: activeTab
    });
    setCariTuru("gercek");
    setVadeGunuVar(false);
    setVadeGunuSayisi("");
    setSabitIskontoVar(false);
    setSabitIskontoYuzde("");
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (customer: any) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      company: customer.company || "",
      email: customer.email,
      phone: customer.phone || "",
      address: customer.address || "",
      city: customer.city || "",
      tax_number: customer.tax_number || "",
      tax_office: customer.tax_office || "",
      status: customer.status,
      notes: customer.notes || "",
      account_type: customer.account_type || "musteri"
    });
    setIsEditDialogOpen(true);
  };

  const handleAddCustomer = async () => {
    // Zorunlu alan kontrolleri
    if (!formData.name) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Lütfen cari adını giriniz!",
      });
      return;
    }

    if (!formData.account_type) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Lütfen cari tipini seçiniz!",
      });
      return;
    }

    if (!formData.phone) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Lütfen telefon numarası giriniz!",
      });
      return;
    }

    if (!formData.email) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Lütfen e-posta adresi giriniz!",
      });
      return;
    }

    // E-posta format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Lütfen geçerli bir e-posta adresi giriniz!",
      });
      return;
    }

    // Vade Günü kontrolü (1-999 arası)
    if (vadeGunuVar && vadeGunuSayisi) {
      const vadeGunu = parseInt(vadeGunuSayisi);
      if (vadeGunu < 1 || vadeGunu > 999) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Vade günü 1-999 arasında olmalıdır!",
        });
        return;
      }
    }

    // Sabit İskonto kontrolü (0-100 arası)
    if (sabitIskontoVar && sabitIskontoYuzde) {
      const iskonto = parseFloat(sabitIskontoYuzde);
      if (iskonto < 0 || iskonto > 100) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Sabit iskonto 0-100 arasında olmalıdır!",
        });
        return;
      }
    }

    try {
      setIsSubmitting(true);
      
      const dataToSubmit = { ...formData };
      
      if (vadeGunuVar && vadeGunuSayisi) {
        (dataToSubmit as any).payment_term_days = parseInt(vadeGunuSayisi);
      }
      if (sabitIskontoVar && sabitIskontoYuzde) {
        (dataToSubmit as any).discount_rate = parseFloat(sabitIskontoYuzde);
      }

      await crmService.createCustomer(dataToSubmit);
      setIsAddDialogOpen(false);
      await loadData();
      toast({
        title: "Başarılı",
        description: "Cari hesap başarıyla oluşturuldu!",
      });
    } catch (error) {
      console.error("Error creating customer:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Cari hesap oluşturulurken bir hata oluştu!",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCustomer = async () => {
    if (!formData.name || !formData.email) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Lütfen en az isim ve email giriniz!",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await crmService.updateCustomer(editingCustomer.id, formData);
      setIsEditDialogOpen(false);
      await loadData();
      toast({
        title: "Başarılı",
        description: "Cari başarıyla güncellendi!",
      });
    } catch (error) {
      console.error("Error updating customer:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Cari güncellenirken hata oluştu!",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCustomer = async () => {
    try {
      setIsSubmitting(true);
      await crmService.deleteCustomer(deletingCustomer.id);
      setIsDeleteDialogOpen(false);
      await loadData();
      toast({
        title: "Başarılı",
        description: "Cari başarıyla silindi!",
      });
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Cari silinirken hata oluştu!",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDetailDialog = async (customer: any) => {
    setDetailCustomer(customer);
    setIsDetailDialogOpen(true);
    setLoadingDetail(true);
    
    try {
      const detailedData = await crmService.getCustomerById(customer.id);
      setDetailCustomer(detailedData);
    } catch (error) {
      console.error("Error loading customer details:", error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleExportExcel = () => {
    const csvContent = [
      ["Kod", "Unvan", "Cari Tipi", "Email", "Telefon", "Şehir", "VKN/TCKN", "Durum"].join(","),
      ...filteredCustomers.map(c => [
        c.id.substring(0, 8),
        c.company || c.name,
        getAccountTypeLabel(c.account_type || "musteri"),
        c.email,
        c.phone || "",
        c.city || "",
        c.tax_number || "",
        c.status
      ].join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `cari_listesi_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast({
      title: "Başarılı",
      description: "Excel dosyası indirildi!",
    });
  };

  const toggleCustomerSelection = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(filteredCustomers.map(c => c.id));
    }
  };

  const getAccountTypeLabel = (type: string) => {
    const types = {
      musteri: "Müşteri",
      tedarikci: "Tedarikçi",
      personel: "Personel",
      ortak: "Ortak"
    };
    return types[type as keyof typeof types] || "Müşteri";
  };

  const getAccountTypeIcon = (type: string) => {
    const icons = {
      musteri: Building2,
      tedarikci: Briefcase,
      personel: UserCircle2,
      ortak: UserCircle2
    };
    return icons[type as keyof typeof icons] || Building2;
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      "Aktif": "bg-green-100 text-green-700 border-green-200",
      "Potansiyel": "bg-blue-100 text-blue-700 border-blue-200",
      "Eski Müşteri": "bg-gray-100 text-gray-700 border-gray-200"
    };
    return configs[status as keyof typeof configs] || configs["Potansiyel"];
  };

  // Apply filters
  let filteredCustomers = customers.filter(customer => {
    const accountType = customer.account_type || "musteri";
    if (accountType !== activeTab) return false;

    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      customer.name?.toLowerCase().includes(searchLower) ||
      customer.company?.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.phone?.includes(searchTerm) ||
      customer.city?.toLowerCase().includes(searchLower) ||
      customer.tax_number?.includes(searchTerm);

    return matchesSearch;
  });

  if (filters.status !== "all") {
    filteredCustomers = filteredCustomers.filter(c => c.status === filters.status);
  }

  if (filters.city !== "all") {
    filteredCustomers = filteredCustomers.filter(c => c.city === filters.city);
  }

  if (filters.dateFrom) {
    filteredCustomers = filteredCustomers.filter(c => 
      new Date(c.created_at) >= new Date(filters.dateFrom)
    );
  }

  if (filters.dateTo) {
    filteredCustomers = filteredCustomers.filter(c => 
      new Date(c.created_at) <= new Date(filters.dateTo)
    );
  }

  // Category handlers
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

  const handleEditType = (categoryId: string, typeId: string, typeName: string) => {
    setCurrentTypeForEdit({ categoryId, typeId, typeName });
    setEditedTypeName(typeName);
    setEditTypeModal(true);
  };

  return (
    <div className="p-6 space-y-6">
      <Tabs defaultValue="panel" className="w-full">
        <TabsList>
          <TabsTrigger value="panel">Panel</TabsTrigger>
          <TabsTrigger value="sales">Satış</TabsTrigger>
          <TabsTrigger value="purchase">Alış</TabsTrigger>
          <TabsTrigger value="cari">Cari Hesaplar</TabsTrigger>
          <TabsTrigger value="expenses">Giderler</TabsTrigger>
          <TabsTrigger value="accounts">Hesaplar</TabsTrigger>
        </TabsList>

        {/* Panel - Dashboard */}
        <TabsContent value="panel" className="space-y-4">
          <h2 className="text-2xl font-bold">Muhasebe Paneli</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Toplam Satış</h3>
              <p className="text-3xl font-bold text-green-600">₺0</p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Toplam Alış</h3>
              <p className="text-3xl font-bold text-red-600">₺0</p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Kar/Zarar</h3>
              <p className="text-3xl font-bold">₺0</p>
            </Card>
          </div>
        </TabsContent>

        {/* Satış Faturaları */}
        <TabsContent value="sales" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

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

          <Card className="p-8">
            <div className="text-center space-y-4">
              <p className="text-gray-500">0 adet kayıt listelenmektedir.</p>
            </div>
          </Card>

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

          <Card>
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
          </Card>
        </TabsContent>

        {/* Alış Faturaları */}
        <TabsContent value="purchase" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="border-b border-gray-200 pb-2">
            <h2 className="text-2xl font-semibold border-b-4 border-blue-500 inline-block pb-2">
              Alış Faturaları
            </h2>
          </div>

          <div>
            <Button variant="default" className="bg-blue-500 hover:bg-blue-600">
              Detaylı Arama
            </Button>
          </div>

          <div className="text-sm text-gray-600 italic">
            1000 adet kayıt listelenmektedir. Daha fazlası için detaylı arama yapabilirsiniz.
          </div>

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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Ara"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <Card>
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
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                    Toplam 0 kayıt gösteriliyor
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Cari Hesaplar - EXACTLY THE SAME AS CRM */}
        <TabsContent value="cari" className="space-y-4">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Genel Cari Hesapları</h2>
                <p className="text-gray-600 mt-1">Müşteri, tedarikçi, personel ve ortak cari hesaplarını yönetin</p>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button 
                variant="outline"
                onClick={() => setIsAdvancedSearchOpen(!isAdvancedSearchOpen)}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Detaylı Arama
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
              
              {selectedCustomers.length > 0 && (
                <Button 
                  variant="outline"
                  onClick={toggleSelectAll}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  Toplu Seç ({selectedCustomers.length})
                </Button>
              )}
            </div>

            {isAdvancedSearchOpen && (
              <Card className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Durum</Label>
                    <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tümü</SelectItem>
                        <SelectItem value="Aktif">Aktif</SelectItem>
                        <SelectItem value="Potansiyel">Potansiyel</SelectItem>
                        <SelectItem value="Eski Müşteri">Eski Müşteri</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Şehir</Label>
                    <Select value={filters.city} onValueChange={(value) => setFilters({...filters, city: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tüm Şehirler</SelectItem>
                        {cities.map(city => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tarih Aralığı</Label>
                    <div className="flex gap-2">
                      <Input 
                        type="date" 
                        value={filters.dateFrom}
                        onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                        className="w-full"
                      />
                      <Input 
                        type="date" 
                        value={filters.dateTo}
                        onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex gap-2">
                  <Button 
                    onClick={openAddDialog}
                    className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded"
                  >
                    Cari Oluştur
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      toast({
                        title: "Bilgi",
                        description: "İçe aktarma özelliği yakında eklenecek",
                      });
                    }}
                    className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded"
                  >
                    İçe Aktar
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      handleExportExcel();
                    }}
                    className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded"
                  >
                    Dışarıya Aktar
                  </Button>
                </div>
                
                <Button 
                  variant="outline"
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="ml-auto"
                >
                  <Filter className="w-4 h-4" />
                </Button>

                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Ara"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <div className="flex gap-2">
                  <Button
                    variant={activeTab === "musteri" ? "default" : "ghost"}
                    onClick={() => setActiveTab("musteri")}
                    className="flex items-center gap-2"
                  >
                    <Building2 className="w-4 h-4" />
                    Müşteri Cari
                  </Button>
                  <Button
                    variant={activeTab === "tedarikci" ? "default" : "ghost"}
                    onClick={() => setActiveTab("tedarikci")}
                    className="flex items-center gap-2"
                  >
                    <Briefcase className="w-4 h-4" />
                    Tedarikçi Cari
                  </Button>
                  <Button
                    variant={activeTab === "personel" ? "default" : "ghost"}
                    onClick={() => setActiveTab("personel")}
                    className="flex items-center gap-2"
                  >
                    <UserCircle2 className="w-4 h-4" />
                    Personel Cari
                  </Button>
                  <Button
                    variant={activeTab === "ortak" ? "default" : "ghost"}
                    onClick={() => setActiveTab("ortak")}
                    className="flex items-center gap-2"
                  >
                    <UserCircle2 className="w-4 h-4" />
                    Ortak Cari
                  </Button>
                </div>
              </div>

              <TabsContent value={activeTab} className="mt-0">
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                            onCheckedChange={toggleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Kod</TableHead>
                        <TableHead>Unvan</TableHead>
                        <TableHead>Cari Tipi</TableHead>
                        <TableHead>Telefon Numarası</TableHead>
                        <TableHead>Etiketler</TableHead>
                        <TableHead>VKN/TCKN</TableHead>
                        <TableHead>Yerel Bakiye</TableHead>
                        <TableHead className="text-right">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-12 text-gray-500">
                            <div className="flex flex-col items-center gap-2">
                              <Search className="w-12 h-12 opacity-50" />
                              <p>Kayıt bulunamadı</p>
                              <Button onClick={openAddDialog} className="mt-2">
                                <Plus className="w-4 h-4 mr-2" />
                                Yeni {getAccountTypeLabel(activeTab)} Ekle
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCustomers.map((customer) => {
                          const AccountIcon = getAccountTypeIcon(customer.account_type || "musteri");
                          return (
                            <TableRow key={customer.id} className="hover:bg-gray-50">
                              <TableCell>
                                <Checkbox
                                  checked={selectedCustomers.includes(customer.id)}
                                  onCheckedChange={() => toggleCustomerSelection(customer.id)}
                                />
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
                                  <AccountIcon className="w-4 h-4 text-gray-600" />
                                  <span>{getAccountTypeLabel(customer.account_type || "musteri")}</span>
                                </div>
                              </TableCell>
                              <TableCell>{customer.phone || "-"}</TableCell>
                              <TableCell>
                                <Badge className={getStatusBadge(customer.status)}>
                                  {customer.status}
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
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => openDetailDialog(customer)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => openEditDialog(customer)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                      setDeletingCustomer(customer);
                                      setIsDeleteDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </Card>

                {filteredCustomers.length > 0 && (
                  <div className="mt-4 text-sm text-gray-600">
                    Toplam {filteredCustomers.length} kayıt listelenmektedir.
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>

        {/* Giderler */}
        <TabsContent value="expenses" className="space-y-4">
          <Tabs defaultValue="expenses">
            <TabsList>
              <TabsTrigger value="expenses">Genel Giderler</TabsTrigger>
              <TabsTrigger value="types">Genel Gider Tipleri</TabsTrigger>
              <TabsTrigger value="recurring">Tekrarlı Genel Giderler</TabsTrigger>
            </TabsList>

            <TabsContent value="expenses" className="space-y-6">
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

              <div className="text-sm text-gray-600">
                7 adet kayıt listelenmektedir.
              </div>

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

              <Card>
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
              </Card>
            </TabsContent>

            <TabsContent value="types" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Genel Gider Tipleri</h2>
                <Button onClick={() => setAddCategoryModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Kategori Ekle
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {expenseCategories.map((category) => (
                  <Card key={category.id} className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">{category.name}</h3>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setCurrentCategory(category);
                              setEditedCategoryName(category.name);
                              setEditCategoryModal(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
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
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                          setCurrentCategoryForType(category);
                          setAddTypeModal(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Yeni Tip Ekle
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Hesaplar */}
        <TabsContent value="accounts" className="space-y-4">
          <h2 className="text-2xl font-bold">Hesap Hareketleri</h2>
          <Card className="p-6">
            <p className="text-gray-500">Hesap hareketleri yakında eklenecek...</p>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <Dialog open={editCategoryModal} onOpenChange={setEditCategoryModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kategoriyi Düzenle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Kategori Adı</Label>
              <Input
                value={editedCategoryName}
                onChange={(e) => setEditedCategoryName(e.target.value)}
                placeholder="Kategori adını girin"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCategoryModal(false)}>İptal</Button>
            <Button variant="destructive" onClick={handleDeleteCategory}>Sil</Button>
            <Button onClick={handleUpdateCategory}>Güncelle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addTypeModal} onOpenChange={setAddTypeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Gider Tipi Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Gider Tipi Adı</Label>
              <Input
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="Gider tipi adını girin"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddTypeModal(false)}>İptal</Button>
            <Button onClick={handleSaveNewType}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editTypeModal} onOpenChange={setEditTypeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gider Tipini Düzenle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Gider Tipi Adı</Label>
              <Input
                value={editedTypeName}
                onChange={(e) => setEditedTypeName(e.target.value)}
                placeholder="Gider tipi adını girin"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTypeModal(false)}>İptal</Button>
            <Button variant="destructive" onClick={handleDeleteType}>Sil</Button>
            <Button onClick={handleUpdateType}>Güncelle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addCategoryModal} onOpenChange={setAddCategoryModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Kategori Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Kategori Adı</Label>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Kategori adını girin"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCategoryModal(false)}>İptal</Button>
            <Button onClick={handleSaveNewCategory}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Customer Dialog - Comprehensive Form */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Cari Ekle</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="bilgiler" className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="bilgiler" className="bg-green-100 data-[state=active]:bg-green-500 data-[state=active]:text-white">
                ▶ Cari Bilgileri
              </TabsTrigger>
              <TabsTrigger value="detay" className="bg-gray-100 data-[state=active]:bg-green-500 data-[state=active]:text-white">
                ▶ Cari Detay Bilgileri
              </TabsTrigger>
            </TabsList>

            {/* Cari Bilgileri Tab */}
            <TabsContent value="bilgiler" className="space-y-6">
              {/* Cari Türü */}
              <div className="space-y-2">
                <Label>Cari Türü</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="cariTuru"
                      value="gercek"
                      checked={cariTuru === "gercek"}
                      onChange={(e) => setCariTuru(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span>Gerçek/Şahıs Şirketi</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="cariTuru"
                      value="tuzel"
                      checked={cariTuru === "tuzel"}
                      onChange={(e) => setCariTuru(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span>Tüzel</span>
                  </label>
                </div>
              </div>

              {/* Cari Bilgileri - GERÇEK/ŞAHIS */}
              {cariTuru === "gercek" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Cari Kodu</Label>
                      <Input value="CAR001294" disabled className="bg-gray-50" />
                    </div>
                    <div className="space-y-2">
                      <Label>Cari Adı *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ad Soyad"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cari Soyadı *</Label>
                      <Input placeholder="Cari soyadı" />
                    </div>
                    <div className="space-y-2">
                      <Label>Cari Tipi *</Label>
                      <Select
                        value={formData.account_type}
                        onValueChange={(value) => setFormData({ ...formData, account_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="musteri">Müşteri</SelectItem>
                          <SelectItem value="tedarikci">Tedarikçi</SelectItem>
                          <SelectItem value="personel">Personel</SelectItem>
                          <SelectItem value="ortak">Ortak</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Cari Kısa Adı</Label>
                      <Input placeholder="Kısa ad" />
                    </div>
                    <div className="space-y-2">
                      <Label>İşlem Tarihi</Label>
                      <Input type="date" defaultValue="2026-04-09" />
                    </div>
                    <div className="space-y-2">
                      <Label>Etiketler</Label>
                      <Input placeholder="Etiket ekle" />
                    </div>
                    <div className="space-y-2">
                      <Label>T.C. Kimlik No</Label>
                      <Input placeholder="TC Kimlik No" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>İşlem Tarihi</Label>
                      <Input type="date" defaultValue="2026-04-09" />
                    </div>
                    <div className="space-y-2">
                      <Label>Para Birimi *</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TRY">TRY (₺)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              {/* Cari Bilgileri - TÜZEL */}
              {cariTuru === "tuzel" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Cari Kodu</Label>
                      <Input value="CAR001294" disabled className="bg-gray-50" />
                    </div>
                    <div className="space-y-2">
                      <Label>Cari Adı *</Label>
                      <Input
                        value={formData.company || formData.name}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          name: e.target.value,
                          company: e.target.value 
                        })}
                        placeholder="Şirket adı"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cari Tipi *</Label>
                      <Select
                        value={formData.account_type}
                        onValueChange={(value) => setFormData({ ...formData, account_type: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="musteri">Müşteri</SelectItem>
                          <SelectItem value="tedarikci">Tedarikçi</SelectItem>
                          <SelectItem value="personel">Personel</SelectItem>
                          <SelectItem value="ortak">Ortak</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Cari Kısa Adı</Label>
                      <Input placeholder="Kısa ad" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>İşlem Tarihi</Label>
                      <Input type="date" defaultValue="2026-04-09" />
                    </div>
                    <div className="space-y-2">
                      <Label>Etiketler</Label>
                      <Input placeholder="Etiket ekle" />
                    </div>
                    <div className="space-y-2">
                      <Label>İşlem Tarihi</Label>
                      <Input type="date" defaultValue="2026-04-09" />
                    </div>
                    <div className="space-y-2">
                      <Label>Para Birimi *</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TRY">TRY (₺)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>İşlem Tarihi</Label>
                      <Input type="date" defaultValue="2026-04-09" />
                    </div>
                    <div className="space-y-2">
                      <Label>Para Birimi *</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TRY">TRY (₺)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              {/* İletişim Bilgileri */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4 text-blue-600">İletişim Bilgileri</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Telefon *</Label>
                    <Input 
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Telefon numarası"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>E-posta *</Label>
                    <Input 
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="E-posta adresi"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Web Sitesi</Label>
                    <Input placeholder="www.ornek.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Faks No</Label>
                    <div className="flex gap-2">
                      <div className="w-16 flex items-center justify-center border rounded px-2 bg-gray-50">
                        <span className="text-xl">🇹🇷</span>
                        <ChevronDown className="w-3 h-3 ml-1" />
                      </div>
                      <Input placeholder="0501 234 5678" className="flex-1" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Adres Bilgileri */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4 text-blue-600">Adres Bilgileri</h3>
                
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Checkbox id="yurtdisi" />
                    <Label htmlFor="yurtdisi" className="cursor-pointer">Yurt Dışı Adresi</Label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Adres Tipi</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fatura">Fatura Adresi</SelectItem>
                          <SelectItem value="sevkiyat">Sevkiyat Adresi</SelectItem>
                          <SelectItem value="iade">İade Adresi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-3">
                      <Label>Adres</Label>
                      <textarea
                        className="w-full min-h-[100px] p-2 border rounded-md"
                        placeholder="Adres bilgisi giriniz..."
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>İl</Label>
                      <Select
                        value={formData.city}
                        onValueChange={(value) => setFormData({ ...formData, city: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="İl seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Istanbul">İstanbul</SelectItem>
                          <SelectItem value="Ankara">Ankara</SelectItem>
                          <SelectItem value="Izmir">İzmir</SelectItem>
                          <SelectItem value="Bursa">Bursa</SelectItem>
                          <SelectItem value="Antalya">Antalya</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>İlçe</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="İlçe seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kadikoy">Kadıköy</SelectItem>
                          <SelectItem value="besiktas">Beşiktaş</SelectItem>
                          <SelectItem value="uskudar">Üsküdar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Posta Kodu</Label>
                      <Input placeholder="34000" />
                    </div>
                    <div className="flex items-end">
                      <Button variant="destructive" className="w-full">
                        Sil
                      </Button>
                    </div>
                  </div>
                </div>

                <Button variant="outline" className="mt-4 text-blue-600 border-blue-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Adres Ekle
                </Button>
              </div>

              {/* Vade Bilgileri */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Vade Bilgileri</h3>
                <div className="space-y-2">
                  <Label>Vade Günü</Label>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="vadeGunu"
                        checked={!vadeGunuVar}
                        onChange={() => {
                          setVadeGunuVar(false);
                          setVadeGunuSayisi("");
                        }}
                        className="w-4 h-4"
                      />
                      <span>Yok</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="vadeGunu"
                        checked={vadeGunuVar}
                        onChange={() => setVadeGunuVar(true)}
                        className="w-4 h-4"
                      />
                      <span>Var</span>
                    </label>
                    {vadeGunuVar && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={vadeGunuSayisi}
                          onChange={(e) => setVadeGunuSayisi(e.target.value)}
                          placeholder="Gün sayısı"
                          className="w-32"
                          min="1"
                          max="999"
                          step="1"
                        />
                        <span className="text-sm text-gray-600">gün</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sabit İskonto */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Sabit İskonto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Sabit İskonto</Label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="sabitIskonto"
                          checked={!sabitIskontoVar}
                          onChange={() => {
                            setSabitIskontoVar(false);
                            setSabitIskontoYuzde("");
                          }}
                          className="w-4 h-4"
                        />
                        <span>Yok</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="sabitIskonto"
                          checked={sabitIskontoVar}
                          onChange={() => setSabitIskontoVar(true)}
                          className="w-4 h-4"
                        />
                        <span>Var</span>
                      </label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Sabit İskonto</Label>
                    <div className="flex">
                      <Input
                        type="number"
                        value={sabitIskontoYuzde}
                        onChange={(e) => setSabitIskontoYuzde(e.target.value)}
                        disabled={!sabitIskontoVar}
                        placeholder="İskonto oranı"
                        className="rounded-r-none border-r-0"
                        min="0"
                        max="100"
                        step="0.01"
                      />
                      <span className="inline-flex items-center px-3 text-sm bg-gray-50 border border-l-0 border-gray-300 rounded-r-md">
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Açılış Bakiyesi */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Açılış Bakiyesi</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Tutar</Label>
                    <Input type="number" placeholder="0.00" step="0.01" />
                  </div>
                  <div className="space-y-2">
                    <Label>Para Birimi *</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TRY">TRY (₺)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Durumu</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="borc">Borç</SelectItem>
                        <SelectItem value="alacak">Alacak</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Proje</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="proje1">Proje 1</SelectItem>
                        <SelectItem value="proje2">Proje 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>İşlem Tarihi</Label>
                    <Input type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label>Vade Tarihi Var Mı?</Label>
                    <div className="flex items-center gap-4 pt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="vadeTarihi" className="w-4 h-4" />
                        <span>Yok</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="vadeTarihi" className="w-4 h-4" />
                        <span>Var</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Borç Alacak Bilgileri */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-lg font-semibold">Borç Alacak Bilgileri</h3>
                  <Button variant="outline" size="sm">
                    + Borç Alacak Ekle
                  </Button>
                </div>
                <p className="text-sm text-gray-500">Henüz borç alacak bilgisi eklenmedi.</p>
              </div>

              {/* Banka Bilgileri */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-lg font-semibold">Banka Bilgileri</h3>
                  <Button variant="outline" size="sm">
                    + Banka Ekle
                  </Button>
                </div>
                <p className="text-sm text-gray-500">Henüz banka bilgisi eklenmedi.</p>
              </div>

              {/* Yetkili İletişim Bilgileri */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-lg font-semibold">Yetkili İletişim Bilgileri</h3>
                  <Button variant="outline" size="sm">
                    + Yetkili Ekle
                  </Button>
                </div>
                <p className="text-sm text-gray-500">Henüz yetkili bilgisi eklenmedi.</p>
              </div>
            </TabsContent>

            {/* Cari Detay Bilgileri Tab */}
            <TabsContent value="detay" className="space-y-6">
              <div className="p-8 text-center text-gray-500">
                <p>Cari detay bilgileri bölümü</p>
                <p className="text-sm mt-2">Ek bilgiler burada görüntülenecek</p>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex justify-between gap-2">
            <Button
              type="button"
              variant="destructive"
              onClick={() => setIsAddDialogOpen(false)}
            >
              Vazgeç
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              onClick={handleAddCustomer}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}