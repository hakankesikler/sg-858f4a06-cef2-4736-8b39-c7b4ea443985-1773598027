import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";
import { accountingService } from "@/services/accountingService";
import { crmService } from "@/services/crmService";
import { PurchaseInvoiceForm } from "@/components/PurchaseInvoiceForm";
import { ExpenseForm } from "@/components/ExpenseForm";
import {
  Wallet,
  Building2,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Pencil,
  Trash2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  FileText,
  RefreshCw,
  Package,
  UserCircle,
  Users,
  Edit,
  ChevronDown,
  Info,
} from "lucide-react";

export function AccountingModule() {
  const [activeMainTab, setActiveMainTab] = useState("panel");
  const [activeTab, setActiveTab] = useState("musteri");
  const [customers, setCustomers] = useState<any[]>([]);
  const [salesInvoices, setSalesInvoices] = useState<any[]>([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [cashAccounts, setCashAccounts] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCity, setFilterCity] = useState<string>("all");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [cariTuru, setCariTuru] = useState("gercek");
  const [isAddBankDialogOpen, setIsAddBankDialogOpen] = useState(false);
  const [isAddInvoiceDialogOpen, setIsAddInvoiceDialogOpen] = useState(false);
  const [isAddPurchaseInvoiceDialogOpen, setIsAddPurchaseInvoiceDialogOpen] = useState(false);
  const [isAddExpenseDialogOpen, setIsAddExpenseDialogOpen] = useState(false);
  const [formData, setFormData] = useState<any>({
    account_type: "musteri",
    person_type: "individual",
    name: "",
    email: "",
    phone: "",
    tax_number: "",
    tax_office: "",
    address: "",
    city: "",
    company: "",
  });
  const [vadeGunuVar, setVadeGunuVar] = useState(false);
  const [vadeGunuSayisi, setVadeGunuSayisi] = useState("");
  const [sabitIskontoVar, setSabitIskontoVar] = useState(false);
  const [sabitIskontoYuzde, setSabitIskontoYuzde] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (activeMainTab === "cari-hesaplar") {
      loadCustomers();
    } else if (activeMainTab === "satis") {
      loadSalesInvoices();
    } else if (activeMainTab === "alis") {
      loadPurchaseInvoices();
    } else if (activeMainTab === "giderler") {
      loadExpenses();
    }
  }, [activeMainTab, activeTab]);

  const loadCustomers = async () => {
    try {
      const data = await crmService.getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error("Error loading customers:", error);
      toast({
        title: "Hata",
        description: "Cari hesaplar yüklenirken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  const loadSalesInvoices = async () => {
    try {
      const data = await accountingService.getSalesInvoices();
      setSalesInvoices(data);
    } catch (error) {
      console.error("Error loading sales invoices:", error);
    }
  };

  const loadPurchaseInvoices = async () => {
    try {
      const data = await accountingService.getPurchases();
      setPurchaseInvoices(data);
    } catch (error) {
      console.error("Error loading purchase invoices:", error);
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
    setIsAddDialogOpen(true);
  };

  const handleAddCustomer = async () => {
    // Zorunlu alan kontrolleri
    if (!formData.name) {
      toast({
        title: "Hata",
        description: "Lütfen cari adını giriniz",
        variant: "destructive",
      });
      return;
    }

    if (!formData.account_type) {
      toast({
        title: "Hata",
        description: "Lütfen cari tipini seçiniz",
        variant: "destructive",
      });
      return;
    }

    // TC Kimlik No / Vergi No kontrolü
    if (cariTuru === "gercek" && !formData.tc_no) {
      toast({
        title: "Hata",
        description: "Lütfen TC Kimlik No giriniz",
        variant: "destructive",
      });
      return;
    }

    if (cariTuru === "tuzel" && !formData.tax_number) {
      toast({
        title: "Hata",
        description: "Lütfen Vergi No giriniz",
        variant: "destructive",
      });
      return;
    }

    if (!formData.phone) {
      toast({
        title: "Hata",
        description: "Lütfen telefon numarası giriniz",
        variant: "destructive",
      });
      return;
    }

    if (!formData.email) {
      toast({
        title: "Hata",
        description: "Lütfen e-posta adresi giriniz",
        variant: "destructive",
      });
      return;
    }

    // E-posta formatı kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Hata",
        description: "Lütfen geçerli bir e-posta adresi giriniz",
        variant: "destructive",
      });
      return;
    }

    // Vade günü kontrolü
    if (vadeGunuVar && (!vadeGunuSayisi || parseInt(vadeGunuSayisi) < 1 || parseInt(vadeGunuSayisi) > 999)) {
      toast({
        title: "Hata",
        description: "Vade günü 1-999 arasında olmalıdır",
        variant: "destructive",
      });
      return;
    }

    // Sabit iskonto kontrolü
    if (sabitIskontoVar && (!sabitIskontoYuzde || parseFloat(sabitIskontoYuzde) < 0 || parseFloat(sabitIskontoYuzde) > 100)) {
      toast({
        title: "Hata",
        description: "Sabit iskonto 0-100 arasında olmalıdır",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const customerData = {
        ...formData,
        vade_gunu: vadeGunuVar ? parseInt(vadeGunuSayisi) : null,
        sabit_iskonto: sabitIskontoVar ? parseFloat(sabitIskontoYuzde) : null,
      };

      await crmService.createCustomer(customerData as any);
      toast({
        title: "Başarılı",
        description: "Cari hesap başarıyla oluşturuldu",
      });
      setIsAddDialogOpen(false);
      setFormData({
        account_type: "musteri",
        person_type: "individual",
        name: "",
        email: "",
        phone: "",
        tax_number: "",
        tax_office: "",
        address: "",
        city: "",
        company: "",
      });
      setVadeGunuVar(false);
      setVadeGunuSayisi("");
      setSabitIskontoVar(false);
      setSabitIskontoYuzde("");
      loadCustomers();
    } catch (error) {
      console.error("Error creating customer:", error);
      toast({
        title: "Hata",
        description: "Cari hesap oluşturulurken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm("Bu cari hesabı silmek istediğinizden emin misiniz?")) {
      return;
    }

    try {
      await crmService.deleteCustomer(id);
      toast({
        title: "Başarılı",
        description: "Cari hesap silindi",
      });
      loadCustomers();
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast({
        title: "Hata",
        description: "Cari hesap silinirken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  const handleExportExcel = () => {
    const filteredCustomers = getFilteredCustomersList();
    
    const csvContent = [
      ["Kod", "Unvan", "Cari Tipi", "Telefon", "Email", "Durum", "VKN/TCKN", "Yerel Bakiye"].join(","),
      ...filteredCustomers.map(customer => [
        customer.customer_code || "",
        customer.company || customer.name || "",
        customer.account_type || "",
        customer.phone || "",
        customer.email || "",
        customer.status || "",
        customer.tax_number || "",
        "₺0,00"
      ].join(","))
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `cari-hesaplar-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    toast({
      title: "Başarılı",
      description: `${filteredCustomers.length} kayıt Excel'e aktarıldı`,
    });
  };

  const getFilteredCustomersList = () => {
    return customers.filter(customer => {
      const matchesType = customer.account_type === activeTab;
      const matchesSearch = !searchTerm || 
        (customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         customer.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         customer.email?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = filterStatus === "all" || customer.status === filterStatus;
      const matchesCity = filterCity === "all" || customer.city === filterCity;

      return matchesType && matchesSearch && matchesStatus && matchesCity;
    });
  };

  const filteredCustomers = getFilteredCustomersList();
  const uniqueCities = Array.from(new Set(customers.map(c => c.city).filter(Boolean)));

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case "musteri": return <Building2 className="w-4 h-4 text-blue-600" />;
      case "tedarikci": return <Package className="w-4 h-4 text-purple-600" />;
      case "personel": return <UserCircle className="w-4 h-4 text-green-600" />;
      case "ortak": return <Users className="w-4 h-4 text-orange-600" />;
      default: return null;
    }
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case "musteri": return "Müşteri";
      case "tedarikci": return "Tedarikçi";
      case "personel": return "Personel";
      case "ortak": return "Ortak";
      default: return type;
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCustomers(filteredCustomers.map(c => c.id));
    } else {
      setSelectedCustomers([]);
    }
  };

  const handleSelectCustomer = (customerId: string, checked: boolean) => {
    if (checked) {
      setSelectedCustomers([...selectedCustomers, customerId]);
    } else {
      setSelectedCustomers(selectedCustomers.filter(id => id !== customerId));
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Muhasebe</h2>
          <p className="text-gray-500">Finansal işlemlerinizi yönetin</p>
        </div>
      </div>

      <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-gray-100">
          <TabsTrigger value="panel">Panel</TabsTrigger>
          <TabsTrigger value="satis">Satış</TabsTrigger>
          <TabsTrigger value="alis">Alış</TabsTrigger>
          <TabsTrigger value="cari-hesaplar">Cari Hesaplar</TabsTrigger>
          <TabsTrigger value="giderler">Giderler</TabsTrigger>
          <TabsTrigger value="hesaplar">Hesaplar</TabsTrigger>
        </TabsList>

        {/* Panel Tab */}
        <TabsContent value="panel" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Toplam Satış</p>
                  <h3 className="text-2xl font-bold">₺0</h3>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Toplam Alış</p>
                  <h3 className="text-2xl font-bold">₺0</h3>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Toplam Gider</p>
                  <h3 className="text-2xl font-bold">₺0</h3>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Net Kar/Zarar</p>
                  <h3 className="text-2xl font-bold">₺0</h3>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Satış Tab */}
        <TabsContent value="satis" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">Toplam Satış Faturası</p>
                  <h3 className="text-2xl font-bold">{salesInvoices.length}</h3>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">Toplam Tutar</p>
                  <h3 className="text-2xl font-bold">
                    ₺{salesInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0).toFixed(2)}
                  </h3>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Satış Faturaları</h3>
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
                  {salesInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                        Henüz satış faturası bulunmuyor
                      </TableCell>
                    </TableRow>
                  ) : (
                    salesInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>{invoice.invoice_number}</TableCell>
                        <TableCell>{invoice.customer_name}</TableCell>
                        <TableCell>{new Date(invoice.invoice_date).toLocaleDateString("tr-TR")}</TableCell>
                        <TableCell>₺{invoice.total_amount?.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={invoice.status === "paid" ? "default" : "secondary"}>
                            {invoice.status === "paid" ? "Ödendi" : "Beklemede"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Alış Tab */}
        <TabsContent value="alis" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">Toplam Alış Faturası</p>
                  <h3 className="text-2xl font-bold">{purchaseInvoices.length}</h3>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">Toplam Tutar</p>
                  <h3 className="text-2xl font-bold">
                    ₺{purchaseInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0).toFixed(2)}
                  </h3>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Alış Faturaları</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fatura No</TableHead>
                    <TableHead>Tedarikçi</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Tutar</TableHead>
                    <TableHead>Durum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                        Henüz alış faturası bulunmuyor
                      </TableCell>
                    </TableRow>
                  ) : (
                    purchaseInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>{invoice.invoice_number}</TableCell>
                        <TableCell>{invoice.supplier_name}</TableCell>
                        <TableCell>{new Date(invoice.invoice_date).toLocaleDateString("tr-TR")}</TableCell>
                        <TableCell>₺{invoice.total_amount?.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={invoice.status === "paid" ? "default" : "secondary"}>
                            {invoice.status === "paid" ? "Ödendi" : "Beklemede"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Purchase Invoice Dialog */}
          <Dialog open={isAddPurchaseInvoiceDialogOpen} onOpenChange={setIsAddPurchaseInvoiceDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Yeni Alış Faturası</DialogTitle>
              </DialogHeader>
              <PurchaseInvoiceForm onClose={() => setIsAddPurchaseInvoiceDialogOpen(false)} onSave={() => setIsAddPurchaseInvoiceDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Cari Hesaplar Tab */}
        <TabsContent value="cari-hesaplar" className="space-y-6">
          <Card>
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-1">Genel Cari Hesapları</h3>
                <p className="text-sm text-gray-500">Müşteri, tedarikçi, personel ve ortak cari hesaplarını yönetin</p>
              </div>

              {/* Filtre Paneli */}
              {isFilterOpen && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Durum</Label>
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
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
                      <Select value={filterCity} onValueChange={setFilterCity}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tüm Şehirler</SelectItem>
                          {uniqueCities.map(city => (
                            <SelectItem key={city} value={city}>{city}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Başlangıç Tarihi</Label>
                      <Input
                        type="date"
                        value={filterStartDate}
                        onChange={(e) => setFilterStartDate(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Bitiş Tarihi</Label>
                      <Input
                        type="date"
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Toplu Seçim Butonu */}
              {selectedCustomers.length > 0 && (
                <div className="mb-4">
                  <Button variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                    Toplu Seç ({selectedCustomers.length})
                  </Button>
                </div>
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

                <TabsList className="grid w-full grid-cols-4 mb-4">
                  <TabsTrigger value="musteri" className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Müşteri Cari
                  </TabsTrigger>
                  <TabsTrigger value="tedarikci" className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Tedarikçi Cari
                  </TabsTrigger>
                  <TabsTrigger value="personel" className="flex items-center gap-2">
                    <UserCircle className="w-4 h-4" />
                    Personel Cari
                  </TabsTrigger>
                  <TabsTrigger value="ortak" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Ortak Cari
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox 
                            checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Kod</TableHead>
                        <TableHead>Unvan</TableHead>
                        <TableHead>Cari Tipi</TableHead>
                        <TableHead>Telefon Numarası</TableHead>
                        <TableHead>Etiketler</TableHead>
                        <TableHead>VKN/TCKN</TableHead>
                        <TableHead>Yerel Bakiye</TableHead>
                        <TableHead>İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                            {searchTerm ? "Arama kriterlerine uygun kayıt bulunamadı" : "Henüz cari kaydı bulunmuyor"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCustomers.map((customer) => (
                          <TableRow key={customer.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedCustomers.includes(customer.id)}
                                onCheckedChange={(checked) => handleSelectCustomer(customer.id, checked as boolean)}
                              />
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {customer.customer_code || "N/A"}
                            </TableCell>
                            <TableCell className="font-medium">
                              {customer.company || customer.name}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getAccountTypeIcon(customer.account_type)}
                                <span className="text-sm">{getAccountTypeLabel(customer.account_type)}</span>
                              </div>
                            </TableCell>
                            <TableCell>{customer.phone || "-"}</TableCell>
                            <TableCell>
                              <Badge variant={customer.status === "Aktif" ? "default" : "secondary"}>
                                {customer.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {customer.tax_number || "-"}
                            </TableCell>
                            <TableCell className="font-semibold text-right">₺0,00</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedCustomer(customer);
                                    setIsViewDialogOpen(true);
                                  }}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedCustomer(customer);
                                    setFormData({
                                      name: customer.name || "",
                                      company: customer.company || "",
                                      email: customer.email || "",
                                      phone: customer.phone || "",
                                      address: customer.address || "",
                                      city: customer.city || "",
                                      tax_number: customer.tax_number || "",
                                      tax_office: customer.tax_office || "",
                                      status: customer.status || "Potansiyel",
                                      notes: customer.notes || "",
                                      account_type: customer.account_type || activeTab
                                    });
                                    setIsEditDialogOpen(true);
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteCustomer(customer.id)}
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>

                  <div className="text-sm text-gray-500 mt-4">
                    Toplam {filteredCustomers.length} kayıt listelenmektedir.
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </Card>
        </TabsContent>

        {/* Giderler Tab */}
        <TabsContent value="giderler" className="space-y-6">
          <Card>
            <div className="p-6">
              <Tabs defaultValue="genel-giderler" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="genel-giderler">Genel Giderler</TabsTrigger>
                  <TabsTrigger value="gider-tipleri">Genel Gider Tipleri</TabsTrigger>
                  <TabsTrigger value="tekrarli-giderler">Tekrarlı Genel Giderler</TabsTrigger>
                </TabsList>

                <TabsContent value="genel-giderler" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Toplam Gider</p>
                          <h3 className="text-2xl font-bold">{expenses.length}</h3>
                        </div>
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                          <Trash2 className="w-6 h-6 text-red-600" />
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Toplam Tutar</p>
                          <h3 className="text-2xl font-bold">
                            ₺{expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0).toFixed(2)}
                          </h3>
                        </div>
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-orange-600" />
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Bu Ay</p>
                          <h3 className="text-2xl font-bold">
                            ₺{expenses.filter(e => {
                              const date = new Date(e.expense_date);
                              const now = new Date();
                              return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                            }).reduce((sum, exp) => sum + (exp.amount || 0), 0).toFixed(2)}
                          </h3>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Bu Yıl</p>
                          <h3 className="text-2xl font-bold">
                            ₺{expenses.filter(e => {
                              const date = new Date(e.expense_date);
                              const now = new Date();
                              return date.getFullYear() === now.getFullYear();
                            }).reduce((sum, exp) => sum + (exp.amount || 0), 0).toFixed(2)}
                          </h3>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <Users className="w-6 h-6 text-green-600" />
                        </div>
                      </div>
                    </Card>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Gider Listesi</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tarih</TableHead>
                          <TableHead>Açıklama</TableHead>
                          <TableHead>Kategori</TableHead>
                          <TableHead>Tutar</TableHead>
                          <TableHead>Durum</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expenses.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                              Henüz gider kaydı bulunmuyor
                            </TableCell>
                          </TableRow>
                        ) : (
                          expenses.map((expense) => (
                            <TableRow key={expense.id}>
                              <TableCell>{new Date(expense.expense_date).toLocaleDateString("tr-TR")}</TableCell>
                              <TableCell>{expense.description}</TableCell>
                              <TableCell>{expense.category}</TableCell>
                              <TableCell>₺{expense.amount?.toFixed(2)}</TableCell>
                              <TableCell>
                                <Badge variant={expense.status === "paid" ? "default" : "secondary"}>
                                  {expense.status === "paid" ? "Ödendi" : "Beklemede"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="gider-tipleri" className="space-y-6">
                  <div className="text-center py-8 text-gray-500">
                    Gider tipleri yönetimi yakında eklenecek
                  </div>
                </TabsContent>

                <TabsContent value="tekrarli-giderler" className="space-y-6">
                  <div className="text-center py-8 text-gray-500">
                    Tekrarlı gider yönetimi yakında eklenecek
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </Card>
        </TabsContent>

        {/* Hesaplar Tab */}
        <TabsContent value="hesaplar" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Hesap Hareketleri</h3>
            <div className="text-center py-8 text-gray-500">
              Hesap hareketleri yakında eklenecek
            </div>
          </Card>
        </TabsContent>

        {/* Satış Faturası Tab */}
        <TabsContent value="satis-faturasi" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-blue-600">Satış Faturaları</h2>
              <p className="text-sm text-gray-500 mt-1">Müşteri satış faturalarını yönetin</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  // Reload data
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Yenile
              </Button>
              <Button onClick={() => setIsAddInvoiceDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Yeni Fatura
              </Button>
            </div>
          </div>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Satış Faturaları</h3>
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
                  {salesInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                        Henüz satış faturası bulunmuyor
                      </TableCell>
                    </TableRow>
                  ) : (
                    salesInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>{invoice.invoice_number}</TableCell>
                        <TableCell>{invoice.customer_name}</TableCell>
                        <TableCell>{new Date(invoice.invoice_date).toLocaleDateString("tr-TR")}</TableCell>
                        <TableCell>₺{invoice.total_amount?.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={invoice.status === "paid" ? "default" : "secondary"}>
                            {invoice.status === "paid" ? "Ödendi" : "Beklemede"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Alış Faturası Tab */}
        <TabsContent value="alis-faturasi" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-blue-600">Alış Faturaları</h2>
              <p className="text-sm text-gray-500 mt-1">Tedarikçi alış faturalarını yönetin</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  // Reload data
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Yenile
              </Button>
              <Button onClick={() => setIsAddPurchaseInvoiceDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Yeni Alış Faturası
              </Button>
            </div>
          </div>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Alış Faturaları</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fatura No</TableHead>
                    <TableHead>Tedarikçi</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Tutar</TableHead>
                    <TableHead>Durum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                        Henüz alış faturası bulunmuyor
                      </TableCell>
                    </TableRow>
                  ) : (
                    purchaseInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>{invoice.invoice_number}</TableCell>
                        <TableCell>{invoice.supplier_name}</TableCell>
                        <TableCell>{new Date(invoice.invoice_date).toLocaleDateString("tr-TR")}</TableCell>
                        <TableCell>₺{invoice.total_amount?.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={invoice.status === "paid" ? "default" : "secondary"}>
                            {invoice.status === "paid" ? "Ödendi" : "Beklemede"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Purchase Invoice Dialog */}
          <Dialog open={isAddPurchaseInvoiceDialogOpen} onOpenChange={setIsAddPurchaseInvoiceDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Yeni Alış Faturası</DialogTitle>
              </DialogHeader>
              <PurchaseInvoiceForm onClose={() => setIsAddPurchaseInvoiceDialogOpen(false)} onSave={() => setIsAddPurchaseInvoiceDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Genel Giderler Tab */}
        <TabsContent value="genel-giderler" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-blue-600">Genel Giderler</h2>
              <p className="text-sm text-gray-500 mt-1">İşletme giderlerini kaydedin</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  // Reload data
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Yenile
              </Button>
              <Button onClick={() => setIsAddExpenseDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Yeni Gider
              </Button>
            </div>
          </div>

          <Card>
            <div className="p-6">
              <div className="text-center py-8 text-gray-500">
                Gider listesi yükleniyor...
              </div>
            </div>
          </Card>

          {/* Expense Dialog */}
          <Dialog open={isAddExpenseDialogOpen} onOpenChange={setIsAddExpenseDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Yeni Gider Kaydı</DialogTitle>
              </DialogHeader>
              <ExpenseForm onClose={() => setIsAddExpenseDialogOpen(false)} onSave={() => setIsAddExpenseDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>

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
                      <Label>Vergi Dairesi</Label>
                      <Select
                        value={formData.tax_office}
                        onValueChange={(value) => setFormData({ ...formData, tax_office: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Vergi dairesi seçiniz" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          <SelectItem value="19 Mayıs Vergi Dairesi">19 Mayıs Vergi Dairesi</SelectItem>
                          <SelectItem value="Acıpayam Vergi Dairesi">Acıpayam Vergi Dairesi</SelectItem>
                          <SelectItem value="Adapazarı Vergi Dairesi">Adapazarı Vergi Dairesi</SelectItem>
                          <SelectItem value="Adıyaman Vergi Dairesi">Adıyaman Vergi Dairesi</SelectItem>
                          <SelectItem value="Afyonkarahisar Vergi Dairesi">Afyonkarahisar Vergi Dairesi</SelectItem>
                          <SelectItem value="Ağrı Vergi Dairesi">Ağrı Vergi Dairesi</SelectItem>
                          <SelectItem value="Akçaabat Vergi Dairesi">Akçaabat Vergi Dairesi</SelectItem>
                          <SelectItem value="Akdağmadeni Vergi Dairesi">Akdağmadeni Vergi Dairesi</SelectItem>
                          <SelectItem value="Akhisar Vergi Dairesi">Akhisar Vergi Dairesi</SelectItem>
                          <SelectItem value="Aksaray Vergi Dairesi">Aksaray Vergi Dairesi</SelectItem>
                          <SelectItem value="Akşehir Vergi Dairesi">Akşehir Vergi Dairesi</SelectItem>
                          <SelectItem value="Akyazı Vergi Dairesi">Akyazı Vergi Dairesi</SelectItem>
                          <SelectItem value="Alanya Vergi Dairesi">Alanya Vergi Dairesi</SelectItem>
                          <SelectItem value="Alaşehir Vergi Dairesi">Alaşehir Vergi Dairesi</SelectItem>
                          <SelectItem value="Almus Vergi Dairesi">Almus Vergi Dairesi</SelectItem>
                          <SelectItem value="Altınova Vergi Dairesi">Altınova Vergi Dairesi</SelectItem>
                          <SelectItem value="Amasya Vergi Dairesi">Amasya Vergi Dairesi</SelectItem>
                          <SelectItem value="Anamur Vergi Dairesi">Anamur Vergi Dairesi</SelectItem>
                          <SelectItem value="Antakya Vergi Dairesi">Antakya Vergi Dairesi</SelectItem>
                          <SelectItem value="Ardeşen Vergi Dairesi">Ardeşen Vergi Dairesi</SelectItem>
                          <SelectItem value="Avanos Vergi Dairesi">Avanos Vergi Dairesi</SelectItem>
                          <SelectItem value="Ayvalık Vergi Dairesi">Ayvalık Vergi Dairesi</SelectItem>
                          <SelectItem value="Babaeski Vergi Dairesi">Babaeski Vergi Dairesi</SelectItem>
                          <SelectItem value="Bafra Vergi Dairesi">Bafra Vergi Dairesi</SelectItem>
                          <SelectItem value="Bağlar Vergi Dairesi">Bağlar Vergi Dairesi</SelectItem>
                          <SelectItem value="Banaz Vergi Dairesi">Banaz Vergi Dairesi</SelectItem>
                          <SelectItem value="Bandırma Vergi Dairesi">Bandırma Vergi Dairesi</SelectItem>
                          <SelectItem value="Battalgazi Vergi Dairesi">Battalgazi Vergi Dairesi</SelectItem>
                          <SelectItem value="Besni Vergi Dairesi">Besni Vergi Dairesi</SelectItem>
                          <SelectItem value="Biga Vergi Dairesi">Biga Vergi Dairesi</SelectItem>
                          <SelectItem value="Bilecik Vergi Dairesi">Bilecik Vergi Dairesi</SelectItem>
                          <SelectItem value="Bingöl Vergi Dairesi">Bingöl Vergi Dairesi</SelectItem>
                          <SelectItem value="Bitlis Vergi Dairesi">Bitlis Vergi Dairesi</SelectItem>
                          <SelectItem value="Bodrum Vergi Dairesi">Bodrum Vergi Dairesi</SelectItem>
                          <SelectItem value="Bolu Vergi Dairesi">Bolu Vergi Dairesi</SelectItem>
                          <SelectItem value="Bolvadin Vergi Dairesi">Bolvadin Vergi Dairesi</SelectItem>
                          <SelectItem value="Bor Vergi Dairesi">Bor Vergi Dairesi</SelectItem>
                          <SelectItem value="Boyabat Vergi Dairesi">Boyabat Vergi Dairesi</SelectItem>
                          <SelectItem value="Bozüyük Vergi Dairesi">Bozüyük Vergi Dairesi</SelectItem>
                          <SelectItem value="Bucak Vergi Dairesi">Bucak Vergi Dairesi</SelectItem>
                          <SelectItem value="Bulancak Vergi Dairesi">Bulancak Vergi Dairesi</SelectItem>
                          <SelectItem value="Bulanık Vergi Dairesi">Bulanık Vergi Dairesi</SelectItem>
                          <SelectItem value="Burdur Vergi Dairesi">Burdur Vergi Dairesi</SelectItem>
                          <SelectItem value="Ceyhan Vergi Dairesi">Ceyhan Vergi Dairesi</SelectItem>
                          <SelectItem value="Çan Vergi Dairesi">Çan Vergi Dairesi</SelectItem>
                          <SelectItem value="Çanakkale Vergi Dairesi">Çanakkale Vergi Dairesi</SelectItem>
                          <SelectItem value="Çankaya Vergi Dairesi">Çankaya Vergi Dairesi</SelectItem>
                          <SelectItem value="Çankırı Vergi Dairesi">Çankırı Vergi Dairesi</SelectItem>
                          <SelectItem value="Çarşamba Vergi Dairesi">Çarşamba Vergi Dairesi</SelectItem>
                          <SelectItem value="Çaycuma Vergi Dairesi">Çaycuma Vergi Dairesi</SelectItem>
                          <SelectItem value="Çayeli Vergi Dairesi">Çayeli Vergi Dairesi</SelectItem>
                          <SelectItem value="Çekerek Vergi Dairesi">Çekerek Vergi Dairesi</SelectItem>
                          <SelectItem value="Çiftlikköy Vergi Dairesi">Çiftlikköy Vergi Dairesi</SelectItem>
                          <SelectItem value="Çivril Vergi Dairesi">Çivril Vergi Dairesi</SelectItem>
                          <SelectItem value="Çorum Vergi Dairesi">Çorum Vergi Dairesi</SelectItem>
                          <SelectItem value="Çukurova Vergi Dairesi">Çukurova Vergi Dairesi</SelectItem>
                          <SelectItem value="Derince Vergi Dairesi">Derince Vergi Dairesi</SelectItem>
                          <SelectItem value="Develi Vergi Dairesi">Develi Vergi Dairesi</SelectItem>
                          <SelectItem value="Devrek Vergi Dairesi">Devrek Vergi Dairesi</SelectItem>
                          <SelectItem value="Dinar Vergi Dairesi">Dinar Vergi Dairesi</SelectItem>
                          <SelectItem value="Doğanşehir Vergi Dairesi">Doğanşehir Vergi Dairesi</SelectItem>
                          <SelectItem value="Doğubayazıt Vergi Dairesi">Doğubayazıt Vergi Dairesi</SelectItem>
                          <SelectItem value="Dörtyol Vergi Dairesi">Dörtyol Vergi Dairesi</SelectItem>
                          <SelectItem value="Durağan Vergi Dairesi">Durağan Vergi Dairesi</SelectItem>
                          <SelectItem value="Düzce Vergi Dairesi">Düzce Vergi Dairesi</SelectItem>
                          <SelectItem value="Düziçi Vergi Dairesi">Düziçi Vergi Dairesi</SelectItem>
                          <SelectItem value="Edirne Vergi Dairesi">Edirne Vergi Dairesi</SelectItem>
                          <SelectItem value="Edremit Vergi Dairesi">Edremit Vergi Dairesi</SelectItem>
                          <SelectItem value="Efeler Vergi Dairesi">Efeler Vergi Dairesi</SelectItem>
                          <SelectItem value="Elazığ Vergi Dairesi">Elazığ Vergi Dairesi</SelectItem>
                          <SelectItem value="Erbaa Vergi Dairesi">Erbaa Vergi Dairesi</SelectItem>
                          <SelectItem value="Erciş Vergi Dairesi">Erciş Vergi Dairesi</SelectItem>
                          <SelectItem value="Erdemli Vergi Dairesi">Erdemli Vergi Dairesi</SelectItem>
                          <SelectItem value="Ereğli Vergi Dairesi">Ereğli Vergi Dairesi</SelectItem>
                          <SelectItem value="Erzin Vergi Dairesi">Erzin Vergi Dairesi</SelectItem>
                          <SelectItem value="Erzincan Vergi Dairesi">Erzincan Vergi Dairesi</SelectItem>
                          <SelectItem value="Eşme Vergi Dairesi">Eşme Vergi Dairesi</SelectItem>
                          <SelectItem value="Etimesgut Vergi Dairesi">Etimesgut Vergi Dairesi</SelectItem>
                          <SelectItem value="Fatsa Vergi Dairesi">Fatsa Vergi Dairesi</SelectItem>
                          <SelectItem value="Fethiye Vergi Dairesi">Fethiye Vergi Dairesi</SelectItem>
                          <SelectItem value="Gebze Vergi Dairesi">Gebze Vergi Dairesi</SelectItem>
                          <SelectItem value="Gediz Vergi Dairesi">Gediz Vergi Dairesi</SelectItem>
                          <SelectItem value="Gemlik Vergi Dairesi">Gemlik Vergi Dairesi</SelectItem>
                          <SelectItem value="Gerede Vergi Dairesi">Gerede Vergi Dairesi</SelectItem>
                          <SelectItem value="Giresun Vergi Dairesi">Giresun Vergi Dairesi</SelectItem>
                          <SelectItem value="Gölbaşı Vergi Dairesi">Gölbaşı Vergi Dairesi</SelectItem>
                          <SelectItem value="Gölcük Vergi Dairesi">Gölcük Vergi Dairesi</SelectItem>
                          <SelectItem value="Gümüşhane Vergi Dairesi">Gümüşhane Vergi Dairesi</SelectItem>
                          <SelectItem value="Hakkari Vergi Dairesi">Hakkari Vergi Dairesi</SelectItem>
                          <SelectItem value="Havza Vergi Dairesi">Havza Vergi Dairesi</SelectItem>
                          <SelectItem value="Hendek Vergi Dairesi">Hendek Vergi Dairesi</SelectItem>
                          <SelectItem value="Isparta Vergi Dairesi">Isparta Vergi Dairesi</SelectItem>
                          <SelectItem value="İmamoğlu Vergi Dairesi">İmamoğlu Vergi Dairesi</SelectItem>
                          <SelectItem value="İnegöl Vergi Dairesi">İnegöl Vergi Dairesi</SelectItem>
                          <SelectItem value="İskenderun Vergi Dairesi">İskenderun Vergi Dairesi</SelectItem>
                          <SelectItem value="Kadirli Vergi Dairesi">Kadirli Vergi Dairesi</SelectItem>
                          <SelectItem value="Kağızman Vergi Dairesi">Kağızman Vergi Dairesi</SelectItem>
                          <SelectItem value="Kahta Vergi Dairesi">Kahta Vergi Dairesi</SelectItem>
                          <SelectItem value="Kaman Vergi Dairesi">Kaman Vergi Dairesi</SelectItem>
                          <SelectItem value="Karaman Vergi Dairesi">Karaman Vergi Dairesi</SelectItem>
                          <SelectItem value="Karataş Vergi Dairesi">Karataş Vergi Dairesi</SelectItem>
                          <SelectItem value="Karatay Vergi Dairesi">Karatay Vergi Dairesi</SelectItem>
                          <SelectItem value="Karesi Vergi Dairesi">Karesi Vergi Dairesi</SelectItem>
                          <SelectItem value="Kars Vergi Dairesi">Kars Vergi Dairesi</SelectItem>
                          <SelectItem value="Kastamonu Vergi Dairesi">Kastamonu Vergi Dairesi</SelectItem>
                          <SelectItem value="Kayapınar Vergi Dairesi">Kayapınar Vergi Dairesi</SelectItem>
                          <SelectItem value="Kayseri Vergi Dairesi">Kayseri Vergi Dairesi</SelectItem>
                          <SelectItem value="Keçiören Vergi Dairesi">Keçiören Vergi Dairesi</SelectItem>
                          <SelectItem value="Kelkit Vergi Dairesi">Kelkit Vergi Dairesi</SelectItem>
                          <SelectItem value="Kepez Vergi Dairesi">Kepez Vergi Dairesi</SelectItem>
                          <SelectItem value="Keskin Vergi Dairesi">Keskin Vergi Dairesi</SelectItem>
                          <SelectItem value="Keşan Vergi Dairesi">Keşan Vergi Dairesi</SelectItem>
                          <SelectItem value="Kırıkkale Vergi Dairesi">Kırıkkale Vergi Dairesi</SelectItem>
                          <SelectItem value="Kırklareli Vergi Dairesi">Kırklareli Vergi Dairesi</SelectItem>
                          <SelectItem value="Kırşehir Vergi Dairesi">Kırşehir Vergi Dairesi</SelectItem>
                          <SelectItem value="Kızıltepe Vergi Dairesi">Kızıltepe Vergi Dairesi</SelectItem>
                          <SelectItem value="Kocaeli Vergi Dairesi">Kocaeli Vergi Dairesi</SelectItem>
                          <SelectItem value="Kocasinan Vergi Dairesi">Kocasinan Vergi Dairesi</SelectItem>
                          <SelectItem value="Konya Vergi Dairesi">Konya Vergi Dairesi</SelectItem>
                          <SelectItem value="Konyaaltı Vergi Dairesi">Konyaaltı Vergi Dairesi</SelectItem>
                          <SelectItem value="Kozan Vergi Dairesi">Kozan Vergi Dairesi</SelectItem>
                          <SelectItem value="Körfez Vergi Dairesi">Körfez Vergi Dairesi</SelectItem>
                          <SelectItem value="Kula Vergi Dairesi">Kula Vergi Dairesi</SelectItem>
                          <SelectItem value="Kulu Vergi Dairesi">Kulu Vergi Dairesi</SelectItem>
                          <SelectItem value="Kumluca Vergi Dairesi">Kumluca Vergi Dairesi</SelectItem>
                          <SelectItem value="Kurtalan Vergi Dairesi">Kurtalan Vergi Dairesi</SelectItem>
                          <SelectItem value="Kuşadası Vergi Dairesi">Kuşadası Vergi Dairesi</SelectItem>
                          <SelectItem value="Kütahya Vergi Dairesi">Kütahya Vergi Dairesi</SelectItem>
                          <SelectItem value="Lüleburgaz Vergi Dairesi">Lüleburgaz Vergi Dairesi</SelectItem>
                          <SelectItem value="Malatya Vergi Dairesi">Malatya Vergi Dairesi</SelectItem>
                          <SelectItem value="Mamak Vergi Dairesi">Mamak Vergi Dairesi</SelectItem>
                          <SelectItem value="Manavgat Vergi Dairesi">Manavgat Vergi Dairesi</SelectItem>
                          <SelectItem value="Manisa Vergi Dairesi">Manisa Vergi Dairesi</SelectItem>
                          <SelectItem value="Mardin Vergi Dairesi">Mardin Vergi Dairesi</SelectItem>
                          <SelectItem value="Marmaris Vergi Dairesi">Marmaris Vergi Dairesi</SelectItem>
                          <SelectItem value="Mazıdağı Vergi Dairesi">Mazıdağı Vergi Dairesi</SelectItem>
                          <SelectItem value="Melikgazi Vergi Dairesi">Melikgazi Vergi Dairesi</SelectItem>
                          <SelectItem value="Meram Vergi Dairesi">Meram Vergi Dairesi</SelectItem>
                          <SelectItem value="Merkezefendi Vergi Dairesi">Merkezefendi Vergi Dairesi</SelectItem>
                          <SelectItem value="Mersin Vergi Dairesi">Mersin Vergi Dairesi</SelectItem>
                          <SelectItem value="Merzifon Vergi Dairesi">Merzifon Vergi Dairesi</SelectItem>
                          <SelectItem value="Midyat Vergi Dairesi">Midyat Vergi Dairesi</SelectItem>
                          <SelectItem value="Milas Vergi Dairesi">Milas Vergi Dairesi</SelectItem>
                          <SelectItem value="Mudanya Vergi Dairesi">Mudanya Vergi Dairesi</SelectItem>
                          <SelectItem value="Muğla Vergi Dairesi">Muğla Vergi Dairesi</SelectItem>
                          <SelectItem value="Muratpaşa Vergi Dairesi">Muratpaşa Vergi Dairesi</SelectItem>
                          <SelectItem value="Muş Vergi Dairesi">Muş Vergi Dairesi</SelectItem>
                          <SelectItem value="Mut Vergi Dairesi">Mut Vergi Dairesi</SelectItem>
                          <SelectItem value="Nazımiye Vergi Dairesi">Nazımiye Vergi Dairesi</SelectItem>
                          <SelectItem value="Nazilli Vergi Dairesi">Nazilli Vergi Dairesi</SelectItem>
                          <SelectItem value="Nevşehir Vergi Dairesi">Nevşehir Vergi Dairesi</SelectItem>
                          <SelectItem value="Niğde Vergi Dairesi">Niğde Vergi Dairesi</SelectItem>
                          <SelectItem value="Niksar Vergi Dairesi">Niksar Vergi Dairesi</SelectItem>
                          <SelectItem value="Nilüfer Vergi Dairesi">Nilüfer Vergi Dairesi</SelectItem>
                          <SelectItem value="Nizip Vergi Dairesi">Nizip Vergi Dairesi</SelectItem>
                          <SelectItem value="Odunpazarı Vergi Dairesi">Odunpazarı Vergi Dairesi</SelectItem>
                          <SelectItem value="Of Vergi Dairesi">Of Vergi Dairesi</SelectItem>
                          <SelectItem value="Ordu Vergi Dairesi">Ordu Vergi Dairesi</SelectItem>
                          <SelectItem value="Ortaköy Vergi Dairesi">Ortaköy Vergi Dairesi</SelectItem>
                          <SelectItem value="Osmangazi Vergi Dairesi">Osmangazi Vergi Dairesi</SelectItem>
                          <SelectItem value="Osmaniye Vergi Dairesi">Osmaniye Vergi Dairesi</SelectItem>
                          <SelectItem value="Ostim Vergi Dairesi">Ostim Vergi Dairesi</SelectItem>
                          <SelectItem value="Ovacık Vergi Dairesi">Ovacık Vergi Dairesi</SelectItem>
                          <SelectItem value="Özalp Vergi Dairesi">Özalp Vergi Dairesi</SelectItem>
                          <SelectItem value="Palandöken Vergi Dairesi">Palandöken Vergi Dairesi</SelectItem>
                          <SelectItem value="Pamukkale Vergi Dairesi">Pamukkale Vergi Dairesi</SelectItem>
                          <SelectItem value="Pamukova Vergi Dairesi">Pamukova Vergi Dairesi</SelectItem>
                          <SelectItem value="Patnos Vergi Dairesi">Patnos Vergi Dairesi</SelectItem>
                          <SelectItem value="Payas Vergi Dairesi">Payas Vergi Dairesi</SelectItem>
                          <SelectItem value="Pervari Vergi Dairesi">Pervari Vergi Dairesi</SelectItem>
                          <SelectItem value="Pozantı Vergi Dairesi">Pozantı Vergi Dairesi</SelectItem>
                          <SelectItem value="Pursaklar Vergi Dairesi">Pursaklar Vergi Dairesi</SelectItem>
                          <SelectItem value="Rize Vergi Dairesi">Rize Vergi Dairesi</SelectItem>
                          <SelectItem value="Saimbeyli Vergi Dairesi">Saimbeyli Vergi Dairesi</SelectItem>
                          <SelectItem value="Sakarya Vergi Dairesi">Sakarya Vergi Dairesi</SelectItem>
                          <SelectItem value="Salihli Vergi Dairesi">Salihli Vergi Dairesi</SelectItem>
                          <SelectItem value="Samsun Vergi Dairesi">Samsun Vergi Dairesi</SelectItem>
                          <SelectItem value="Sandıklı Vergi Dairesi">Sandıklı Vergi Dairesi</SelectItem>
                          <SelectItem value="Sarıkamış Vergi Dairesi">Sarıkamış Vergi Dairesi</SelectItem>
                          <SelectItem value="Selçuklu Vergi Dairesi">Selçuklu Vergi Dairesi</SelectItem>
                          <SelectItem value="Serdivan Vergi Dairesi">Serdivan Vergi Dairesi</SelectItem>
                          <SelectItem value="Serik Vergi Dairesi">Serik Vergi Dairesi</SelectItem>
                          <SelectItem value="Seyhan Vergi Dairesi">Seyhan Vergi Dairesi</SelectItem>
                          <SelectItem value="Siirt Vergi Dairesi">Siirt Vergi Dairesi</SelectItem>
                          <SelectItem value="Silifke Vergi Dairesi">Silifke Vergi Dairesi</SelectItem>
                          <SelectItem value="Simav Vergi Dairesi">Simav Vergi Dairesi</SelectItem>
                          <SelectItem value="Sincan Vergi Dairesi">Sincan Vergi Dairesi</SelectItem>
                          <SelectItem value="Sinop Vergi Dairesi">Sinop Vergi Dairesi</SelectItem>
                          <SelectItem value="Sivas Vergi Dairesi">Sivas Vergi Dairesi</SelectItem>
                          <SelectItem value="Soma Vergi Dairesi">Soma Vergi Dairesi</SelectItem>
                          <SelectItem value="Sorgun Vergi Dairesi">Sorgun Vergi Dairesi</SelectItem>
                          <SelectItem value="Söke Vergi Dairesi">Söke Vergi Dairesi</SelectItem>
                          <SelectItem value="Suluova Vergi Dairesi">Suluova Vergi Dairesi</SelectItem>
                          <SelectItem value="Sungurlu Vergi Dairesi">Sungurlu Vergi Dairesi</SelectItem>
                          <SelectItem value="Suşehri Vergi Dairesi">Suşehri Vergi Dairesi</SelectItem>
                          <SelectItem value="Şahinbey Vergi Dairesi">Şahinbey Vergi Dairesi</SelectItem>
                          <SelectItem value="Şarkışla Vergi Dairesi">Şarkışla Vergi Dairesi</SelectItem>
                          <SelectItem value="Şehitkamil Vergi Dairesi">Şehitkamil Vergi Dairesi</SelectItem>
                          <SelectItem value="Tarsus Vergi Dairesi">Tarsus Vergi Dairesi</SelectItem>
                          <SelectItem value="Taşköprü Vergi Dairesi">Taşköprü Vergi Dairesi</SelectItem>
                          <SelectItem value="Tatvan Vergi Dairesi">Tatvan Vergi Dairesi</SelectItem>
                          <SelectItem value="Tavşanlı Vergi Dairesi">Tavşanlı Vergi Dairesi</SelectItem>
                          <SelectItem value="Tepebaşı Vergi Dairesi">Tepebaşı Vergi Dairesi</SelectItem>
                          <SelectItem value="Tokat Vergi Dairesi">Tokat Vergi Dairesi</SelectItem>
                          <SelectItem value="Tosya Vergi Dairesi">Tosya Vergi Dairesi</SelectItem>
                          <SelectItem value="Trabzon Vergi Dairesi">Trabzon Vergi Dairesi</SelectItem>
                          <SelectItem value="Tufanbeyli Vergi Dairesi">Tufanbeyli Vergi Dairesi</SelectItem>
                          <SelectItem value="Tunceli Vergi Dairesi">Tunceli Vergi Dairesi</SelectItem>
                          <SelectItem value="Turgutlu Vergi Dairesi">Turgutlu Vergi Dairesi</SelectItem>
                          <SelectItem value="Turhal Vergi Dairesi">Turhal Vergi Dairesi</SelectItem>
                          <SelectItem value="Ulubey Vergi Dairesi">Ulubey Vergi Dairesi</SelectItem>
                          <SelectItem value="Ulus Vergi Dairesi">Ulus Vergi Dairesi</SelectItem>
                          <SelectItem value="Uşak Vergi Dairesi">Uşak Vergi Dairesi</SelectItem>
                          <SelectItem value="Ünye Vergi Dairesi">Ünye Vergi Dairesi</SelectItem>
                          <SelectItem value="Ürgüp Vergi Dairesi">Ürgüp Vergi Dairesi</SelectItem>
                          <SelectItem value="Vakfıkebir Vergi Dairesi">Vakfıkebir Vergi Dairesi</SelectItem>
                          <SelectItem value="Van Vergi Dairesi">Van Vergi Dairesi</SelectItem>
                          <SelectItem value="Varto Vergi Dairesi">Varto Vergi Dairesi</SelectItem>
                          <SelectItem value="Vezirköprü Vergi Dairesi">Vezirköprü Vergi Dairesi</SelectItem>
                          <SelectItem value="Yakutiye Vergi Dairesi">Yakutiye Vergi Dairesi</SelectItem>
                          <SelectItem value="Yalova Vergi Dairesi">Yalova Vergi Dairesi</SelectItem>
                          <SelectItem value="Yalvaç Vergi Dairesi">Yalvaç Vergi Dairesi</SelectItem>
                          <SelectItem value="Yatağan Vergi Dairesi">Yatağan Vergi Dairesi</SelectItem>
                          <SelectItem value="Yenimahalle Vergi Dairesi">Yenimahalle Vergi Dairesi</SelectItem>
                          <SelectItem value="Yenişehir Vergi Dairesi">Yenişehir Vergi Dairesi</SelectItem>
                          <SelectItem value="Yeşilyurt Vergi Dairesi">Yeşilyurt Vergi Dairesi</SelectItem>
                          <SelectItem value="Yıldırım Vergi Dairesi">Yıldırım Vergi Dairesi</SelectItem>
                          <SelectItem value="Yozgat Vergi Dairesi">Yozgat Vergi Dairesi</SelectItem>
                          <SelectItem value="Yüksekova Vergi Dairesi">Yüksekova Vergi Dairesi</SelectItem>
                          <SelectItem value="Yüreğir Vergi Dairesi">Yüreğir Vergi Dairesi</SelectItem>
                          <SelectItem value="Zara Vergi Dairesi">Zara Vergi Dairesi</SelectItem>
                          <SelectItem value="Zonguldak Vergi Dairesi">Zonguldak Vergi Dairesi</SelectItem>
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
                      <Label>Vergi No *</Label>
                      <Input 
                        value={formData.tax_number}
                        onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                        placeholder="Vergi numarası"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Telefon *</Label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="Telefon"
                        type="tel"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Vergi Dairesi</Label>
                      <Select
                        value={formData.tax_office}
                        onValueChange={(value) => setFormData({ ...formData, tax_office: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Vergi dairesi seçiniz" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          <SelectItem value="19 Mayıs Vergi Dairesi">19 Mayıs Vergi Dairesi</SelectItem>
                          <SelectItem value="Acıpayam Vergi Dairesi">Acıpayam Vergi Dairesi</SelectItem>
                          <SelectItem value="Adapazarı Vergi Dairesi">Adapazarı Vergi Dairesi</SelectItem>
                          <SelectItem value="Adıyaman Vergi Dairesi">Adıyaman Vergi Dairesi</SelectItem>
                          <SelectItem value="Afyonkarahisar Vergi Dairesi">Afyonkarahisar Vergi Dairesi</SelectItem>
                          <SelectItem value="Ağrı Vergi Dairesi">Ağrı Vergi Dairesi</SelectItem>
                          <SelectItem value="Akçaabat Vergi Dairesi">Akçaabat Vergi Dairesi</SelectItem>
                          <SelectItem value="Akdağmadeni Vergi Dairesi">Akdağmadeni Vergi Dairesi</SelectItem>
                          <SelectItem value="Akhisar Vergi Dairesi">Akhisar Vergi Dairesi</SelectItem>
                          <SelectItem value="Aksaray Vergi Dairesi">Aksaray Vergi Dairesi</SelectItem>
                          <SelectItem value="Akşehir Vergi Dairesi">Akşehir Vergi Dairesi</SelectItem>
                          <SelectItem value="Akyazı Vergi Dairesi">Akyazı Vergi Dairesi</SelectItem>
                          <SelectItem value="Alanya Vergi Dairesi">Alanya Vergi Dairesi</SelectItem>
                          <SelectItem value="Alaşehir Vergi Dairesi">Alaşehir Vergi Dairesi</SelectItem>
                          <SelectItem value="Almus Vergi Dairesi">Almus Vergi Dairesi</SelectItem>
                          <SelectItem value="Altınova Vergi Dairesi">Altınova Vergi Dairesi</SelectItem>
                          <SelectItem value="Amasya Vergi Dairesi">Amasya Vergi Dairesi</SelectItem>
                          <SelectItem value="Anamur Vergi Dairesi">Anamur Vergi Dairesi</SelectItem>
                          <SelectItem value="Antakya Vergi Dairesi">Antakya Vergi Dairesi</SelectItem>
                          <SelectItem value="Ardeşen Vergi Dairesi">Ardeşen Vergi Dairesi</SelectItem>
                          <SelectItem value="Avanos Vergi Dairesi">Avanos Vergi Dairesi</SelectItem>
                          <SelectItem value="Ayvalık Vergi Dairesi">Ayvalık Vergi Dairesi</SelectItem>
                          <SelectItem value="Babaeski Vergi Dairesi">Babaeski Vergi Dairesi</SelectItem>
                          <SelectItem value="Bafra Vergi Dairesi">Bafra Vergi Dairesi</SelectItem>
                          <SelectItem value="Bağlar Vergi Dairesi">Bağlar Vergi Dairesi</SelectItem>
                          <SelectItem value="Banaz Vergi Dairesi">Banaz Vergi Dairesi</SelectItem>
                          <SelectItem value="Bandırma Vergi Dairesi">Bandırma Vergi Dairesi</SelectItem>
                          <SelectItem value="Battalgazi Vergi Dairesi">Battalgazi Vergi Dairesi</SelectItem>
                          <SelectItem value="Besni Vergi Dairesi">Besni Vergi Dairesi</SelectItem>
                          <SelectItem value="Biga Vergi Dairesi">Biga Vergi Dairesi</SelectItem>
                          <SelectItem value="Bilecik Vergi Dairesi">Bilecik Vergi Dairesi</SelectItem>
                          <SelectItem value="Bingöl Vergi Dairesi">Bingöl Vergi Dairesi</SelectItem>
                          <SelectItem value="Bitlis Vergi Dairesi">Bitlis Vergi Dairesi</SelectItem>
                          <SelectItem value="Bodrum Vergi Dairesi">Bodrum Vergi Dairesi</SelectItem>
                          <SelectItem value="Bolu Vergi Dairesi">Bolu Vergi Dairesi</SelectItem>
                          <SelectItem value="Bolvadin Vergi Dairesi">Bolvadin Vergi Dairesi</SelectItem>
                          <SelectItem value="Bor Vergi Dairesi">Bor Vergi Dairesi</SelectItem>
                          <SelectItem value="Boyabat Vergi Dairesi">Boyabat Vergi Dairesi</SelectItem>
                          <SelectItem value="Bozüyük Vergi Dairesi">Bozüyük Vergi Dairesi</SelectItem>
                          <SelectItem value="Bucak Vergi Dairesi">Bucak Vergi Dairesi</SelectItem>
                          <SelectItem value="Bulancak Vergi Dairesi">Bulancak Vergi Dairesi</SelectItem>
                          <SelectItem value="Bulanık Vergi Dairesi">Bulanık Vergi Dairesi</SelectItem>
                          <SelectItem value="Burdur Vergi Dairesi">Burdur Vergi Dairesi</SelectItem>
                          <SelectItem value="Ceyhan Vergi Dairesi">Ceyhan Vergi Dairesi</SelectItem>
                          <SelectItem value="Çan Vergi Dairesi">Çan Vergi Dairesi</SelectItem>
                          <SelectItem value="Çanakkale Vergi Dairesi">Çanakkale Vergi Dairesi</SelectItem>
                          <SelectItem value="Çankaya Vergi Dairesi">Çankaya Vergi Dairesi</SelectItem>
                          <SelectItem value="Çankırı Vergi Dairesi">Çankırı Vergi Dairesi</SelectItem>
                          <SelectItem value="Çarşamba Vergi Dairesi">Çarşamba Vergi Dairesi</SelectItem>
                          <SelectItem value="Çaycuma Vergi Dairesi">Çaycuma Vergi Dairesi</SelectItem>
                          <SelectItem value="Çayeli Vergi Dairesi">Çayeli Vergi Dairesi</SelectItem>
                          <SelectItem value="Çekerek Vergi Dairesi">Çekerek Vergi Dairesi</SelectItem>
                          <SelectItem value="Çiftlikköy Vergi Dairesi">Çiftlikköy Vergi Dairesi</SelectItem>
                          <SelectItem value="Çivril Vergi Dairesi">Çivril Vergi Dairesi</SelectItem>
                          <SelectItem value="Çorum Vergi Dairesi">Çorum Vergi Dairesi</SelectItem>
                          <SelectItem value="Çukurova Vergi Dairesi">Çukurova Vergi Dairesi</SelectItem>
                          <SelectItem value="Derince Vergi Dairesi">Derince Vergi Dairesi</SelectItem>
                          <SelectItem value="Develi Vergi Dairesi">Develi Vergi Dairesi</SelectItem>
                          <SelectItem value="Devrek Vergi Dairesi">Devrek Vergi Dairesi</SelectItem>
                          <SelectItem value="Dinar Vergi Dairesi">Dinar Vergi Dairesi</SelectItem>
                          <SelectItem value="Doğanşehir Vergi Dairesi">Doğanşehir Vergi Dairesi</SelectItem>
                          <SelectItem value="Doğubayazıt Vergi Dairesi">Doğubayazıt Vergi Dairesi</SelectItem>
                          <SelectItem value="Dörtyol Vergi Dairesi">Dörtyol Vergi Dairesi</SelectItem>
                          <SelectItem value="Durağan Vergi Dairesi">Durağan Vergi Dairesi</SelectItem>
                          <SelectItem value="Düzce Vergi Dairesi">Düzce Vergi Dairesi</SelectItem>
                          <SelectItem value="Düziçi Vergi Dairesi">Düziçi Vergi Dairesi</SelectItem>
                          <SelectItem value="Edirne Vergi Dairesi">Edirne Vergi Dairesi</SelectItem>
                          <SelectItem value="Edremit Vergi Dairesi">Edremit Vergi Dairesi</SelectItem>
                          <SelectItem value="Efeler Vergi Dairesi">Efeler Vergi Dairesi</SelectItem>
                          <SelectItem value="Elazığ Vergi Dairesi">Elazığ Vergi Dairesi</SelectItem>
                          <SelectItem value="Erbaa Vergi Dairesi">Erbaa Vergi Dairesi</SelectItem>
                          <SelectItem value="Erciş Vergi Dairesi">Erciş Vergi Dairesi</SelectItem>
                          <SelectItem value="Erdemli Vergi Dairesi">Erdemli Vergi Dairesi</SelectItem>
                          <SelectItem value="Ereğli Vergi Dairesi">Ereğli Vergi Dairesi</SelectItem>
                          <SelectItem value="Erzin Vergi Dairesi">Erzin Vergi Dairesi</SelectItem>
                          <SelectItem value="Erzincan Vergi Dairesi">Erzincan Vergi Dairesi</SelectItem>
                          <SelectItem value="Eşme Vergi Dairesi">Eşme Vergi Dairesi</SelectItem>
                          <SelectItem value="Etimesgut Vergi Dairesi">Etimesgut Vergi Dairesi</SelectItem>
                          <SelectItem value="Fatsa Vergi Dairesi">Fatsa Vergi Dairesi</SelectItem>
                          <SelectItem value="Fethiye Vergi Dairesi">Fethiye Vergi Dairesi</SelectItem>
                          <SelectItem value="Gebze Vergi Dairesi">Gebze Vergi Dairesi</SelectItem>
                          <SelectItem value="Gediz Vergi Dairesi">Gediz Vergi Dairesi</SelectItem>
                          <SelectItem value="Gemlik Vergi Dairesi">Gemlik Vergi Dairesi</SelectItem>
                          <SelectItem value="Gerede Vergi Dairesi">Gerede Vergi Dairesi</SelectItem>
                          <SelectItem value="Giresun Vergi Dairesi">Giresun Vergi Dairesi</SelectItem>
                          <SelectItem value="Gölbaşı Vergi Dairesi">Gölbaşı Vergi Dairesi</SelectItem>
                          <SelectItem value="Gölcük Vergi Dairesi">Gölcük Vergi Dairesi</SelectItem>
                          <SelectItem value="Gümüşhane Vergi Dairesi">Gümüşhane Vergi Dairesi</SelectItem>
                          <SelectItem value="Hakkari Vergi Dairesi">Hakkari Vergi Dairesi</SelectItem>
                          <SelectItem value="Havza Vergi Dairesi">Havza Vergi Dairesi</SelectItem>
                          <SelectItem value="Hendek Vergi Dairesi">Hendek Vergi Dairesi</SelectItem>
                          <SelectItem value="Isparta Vergi Dairesi">Isparta Vergi Dairesi</SelectItem>
                          <SelectItem value="İmamoğlu Vergi Dairesi">İmamoğlu Vergi Dairesi</SelectItem>
                          <SelectItem value="İnegöl Vergi Dairesi">İnegöl Vergi Dairesi</SelectItem>
                          <SelectItem value="İskenderun Vergi Dairesi">İskenderun Vergi Dairesi</SelectItem>
                          <SelectItem value="Kadirli Vergi Dairesi">Kadirli Vergi Dairesi</SelectItem>
                          <SelectItem value="Kağızman Vergi Dairesi">Kağızman Vergi Dairesi</SelectItem>
                          <SelectItem value="Kahta Vergi Dairesi">Kahta Vergi Dairesi</SelectItem>
                          <SelectItem value="Kaman Vergi Dairesi">Kaman Vergi Dairesi</SelectItem>
                          <SelectItem value="Karaman Vergi Dairesi">Karaman Vergi Dairesi</SelectItem>
                          <SelectItem value="Karataş Vergi Dairesi">Karataş Vergi Dairesi</SelectItem>
                          <SelectItem value="Karatay Vergi Dairesi">Karatay Vergi Dairesi</SelectItem>
                          <SelectItem value="Karesi Vergi Dairesi">Karesi Vergi Dairesi</SelectItem>
                          <SelectItem value="Kars Vergi Dairesi">Kars Vergi Dairesi</SelectItem>
                          <SelectItem value="Kastamonu Vergi Dairesi">Kastamonu Vergi Dairesi</SelectItem>
                          <SelectItem value="Kayapınar Vergi Dairesi">Kayapınar Vergi Dairesi</SelectItem>
                          <SelectItem value="Kayseri Vergi Dairesi">Kayseri Vergi Dairesi</SelectItem>
                          <SelectItem value="Keçiören Vergi Dairesi">Keçiören Vergi Dairesi</SelectItem>
                          <SelectItem value="Kelkit Vergi Dairesi">Kelkit Vergi Dairesi</SelectItem>
                          <SelectItem value="Kepez Vergi Dairesi">Kepez Vergi Dairesi</SelectItem>
                          <SelectItem value="Keskin Vergi Dairesi">Keskin Vergi Dairesi</SelectItem>
                          <SelectItem value="Keşan Vergi Dairesi">Keşan Vergi Dairesi</SelectItem>
                          <SelectItem value="Kırıkkale Vergi Dairesi">Kırıkkale Vergi Dairesi</SelectItem>
                          <SelectItem value="Kırklareli Vergi Dairesi">Kırklareli Vergi Dairesi</SelectItem>
                          <SelectItem value="Kırşehir Vergi Dairesi">Kırşehir Vergi Dairesi</SelectItem>
                          <SelectItem value="Kızıltepe Vergi Dairesi">Kızıltepe Vergi Dairesi</SelectItem>
                          <SelectItem value="Kocaeli Vergi Dairesi">Kocaeli Vergi Dairesi</SelectItem>
                          <SelectItem value="Kocasinan Vergi Dairesi">Kocasinan Vergi Dairesi</SelectItem>
                          <SelectItem value="Konya Vergi Dairesi">Konya Vergi Dairesi</SelectItem>
                          <SelectItem value="Konyaaltı Vergi Dairesi">Konyaaltı Vergi Dairesi</SelectItem>
                          <SelectItem value="Kozan Vergi Dairesi">Kozan Vergi Dairesi</SelectItem>
                          <SelectItem value="Körfez Vergi Dairesi">Körfez Vergi Dairesi</SelectItem>
                          <SelectItem value="Kula Vergi Dairesi">Kula Vergi Dairesi</SelectItem>
                          <SelectItem value="Kulu Vergi Dairesi">Kulu Vergi Dairesi</SelectItem>
                          <SelectItem value="Kumluca Vergi Dairesi">Kumluca Vergi Dairesi</SelectItem>
                          <SelectItem value="Kurtalan Vergi Dairesi">Kurtalan Vergi Dairesi</SelectItem>
                          <SelectItem value="Kuşadası Vergi Dairesi">Kuşadası Vergi Dairesi</SelectItem>
                          <SelectItem value="Kütahya Vergi Dairesi">Kütahya Vergi Dairesi</SelectItem>
                          <SelectItem value="Lüleburgaz Vergi Dairesi">Lüleburgaz Vergi Dairesi</SelectItem>
                          <SelectItem value="Malatya Vergi Dairesi">Malatya Vergi Dairesi</SelectItem>
                          <SelectItem value="Mamak Vergi Dairesi">Mamak Vergi Dairesi</SelectItem>
                          <SelectItem value="Manavgat Vergi Dairesi">Manavgat Vergi Dairesi</SelectItem>
                          <SelectItem value="Manisa Vergi Dairesi">Manisa Vergi Dairesi</SelectItem>
                          <SelectItem value="Mardin Vergi Dairesi">Mardin Vergi Dairesi</SelectItem>
                          <SelectItem value="Marmaris Vergi Dairesi">Marmaris Vergi Dairesi</SelectItem>
                          <SelectItem value="Mazıdağı Vergi Dairesi">Mazıdağı Vergi Dairesi</SelectItem>
                          <SelectItem value="Melikgazi Vergi Dairesi">Melikgazi Vergi Dairesi</SelectItem>
                          <SelectItem value="Meram Vergi Dairesi">Meram Vergi Dairesi</SelectItem>
                          <SelectItem value="Merkezefendi Vergi Dairesi">Merkezefendi Vergi Dairesi</SelectItem>
                          <SelectItem value="Mersin Vergi Dairesi">Mersin Vergi Dairesi</SelectItem>
                          <SelectItem value="Merzifon Vergi Dairesi">Merzifon Vergi Dairesi</SelectItem>
                          <SelectItem value="Midyat Vergi Dairesi">Midyat Vergi Dairesi</SelectItem>
                          <SelectItem value="Milas Vergi Dairesi">Milas Vergi Dairesi</SelectItem>
                          <SelectItem value="Mudanya Vergi Dairesi">Mudanya Vergi Dairesi</SelectItem>
                          <SelectItem value="Muğla Vergi Dairesi">Muğla Vergi Dairesi</SelectItem>
                          <SelectItem value="Muratpaşa Vergi Dairesi">Muratpaşa Vergi Dairesi</SelectItem>
                          <SelectItem value="Muş Vergi Dairesi">Muş Vergi Dairesi</SelectItem>
                          <SelectItem value="Mut Vergi Dairesi">Mut Vergi Dairesi</SelectItem>
                          <SelectItem value="Nazımiye Vergi Dairesi">Nazımiye Vergi Dairesi</SelectItem>
                          <SelectItem value="Nazilli Vergi Dairesi">Nazilli Vergi Dairesi</SelectItem>
                          <SelectItem value="Nevşehir Vergi Dairesi">Nevşehir Vergi Dairesi</SelectItem>
                          <SelectItem value="Niğde Vergi Dairesi">Niğde Vergi Dairesi</SelectItem>
                          <SelectItem value="Niksar Vergi Dairesi">Niksar Vergi Dairesi</SelectItem>
                          <SelectItem value="Nilüfer Vergi Dairesi">Nilüfer Vergi Dairesi</SelectItem>
                          <SelectItem value="Nizip Vergi Dairesi">Nizip Vergi Dairesi</SelectItem>
                          <SelectItem value="Odunpazarı Vergi Dairesi">Odunpazarı Vergi Dairesi</SelectItem>
                          <SelectItem value="Of Vergi Dairesi">Of Vergi Dairesi</SelectItem>
                          <SelectItem value="Ordu Vergi Dairesi">Ordu Vergi Dairesi</SelectItem>
                          <SelectItem value="Ortaköy Vergi Dairesi">Ortaköy Vergi Dairesi</SelectItem>
                          <SelectItem value="Osmangazi Vergi Dairesi">Osmangazi Vergi Dairesi</SelectItem>
                          <SelectItem value="Osmaniye Vergi Dairesi">Osmaniye Vergi Dairesi</SelectItem>
                          <SelectItem value="Ostim Vergi Dairesi">Ostim Vergi Dairesi</SelectItem>
                          <SelectItem value="Ovacık Vergi Dairesi">Ovacık Vergi Dairesi</SelectItem>
                          <SelectItem value="Özalp Vergi Dairesi">Özalp Vergi Dairesi</SelectItem>
                          <SelectItem value="Palandöken Vergi Dairesi">Palandöken Vergi Dairesi</SelectItem>
                          <SelectItem value="Pamukkale Vergi Dairesi">Pamukkale Vergi Dairesi</SelectItem>
                          <SelectItem value="Pamukova Vergi Dairesi">Pamukova Vergi Dairesi</SelectItem>
                          <SelectItem value="Patnos Vergi Dairesi">Patnos Vergi Dairesi</SelectItem>
                          <SelectItem value="Payas Vergi Dairesi">Payas Vergi Dairesi</SelectItem>
                          <SelectItem value="Pervari Vergi Dairesi">Pervari Vergi Dairesi</SelectItem>
                          <SelectItem value="Pozantı Vergi Dairesi">Pozantı Vergi Dairesi</SelectItem>
                          <SelectItem value="Pursaklar Vergi Dairesi">Pursaklar Vergi Dairesi</SelectItem>
                          <SelectItem value="Rize Vergi Dairesi">Rize Vergi Dairesi</SelectItem>
                          <SelectItem value="Saimbeyli Vergi Dairesi">Saimbeyli Vergi Dairesi</SelectItem>
                          <SelectItem value="Sakarya Vergi Dairesi">Sakarya Vergi Dairesi</SelectItem>
                          <SelectItem value="Salihli Vergi Dairesi">Salihli Vergi Dairesi</SelectItem>
                          <SelectItem value="Samsun Vergi Dairesi">Samsun Vergi Dairesi</SelectItem>
                          <SelectItem value="Sandıklı Vergi Dairesi">Sandıklı Vergi Dairesi</SelectItem>
                          <SelectItem value="Sarıkamış Vergi Dairesi">Sarıkamış Vergi Dairesi</SelectItem>
                          <SelectItem value="Selçuklu Vergi Dairesi">Selçuklu Vergi Dairesi</SelectItem>
                          <SelectItem value="Serdivan Vergi Dairesi">Serdivan Vergi Dairesi</SelectItem>
                          <SelectItem value="Serik Vergi Dairesi">Serik Vergi Dairesi</SelectItem>
                          <SelectItem value="Seyhan Vergi Dairesi">Seyhan Vergi Dairesi</SelectItem>
                          <SelectItem value="Siirt Vergi Dairesi">Siirt Vergi Dairesi</SelectItem>
                          <SelectItem value="Silifke Vergi Dairesi">Silifke Vergi Dairesi</SelectItem>
                          <SelectItem value="Simav Vergi Dairesi">Simav Vergi Dairesi</SelectItem>
                          <SelectItem value="Sincan Vergi Dairesi">Sincan Vergi Dairesi</SelectItem>
                          <SelectItem value="Sinop Vergi Dairesi">Sinop Vergi Dairesi</SelectItem>
                          <SelectItem value="Sivas Vergi Dairesi">Sivas Vergi Dairesi</SelectItem>
                          <SelectItem value="Soma Vergi Dairesi">Soma Vergi Dairesi</SelectItem>
                          <SelectItem value="Sorgun Vergi Dairesi">Sorgun Vergi Dairesi</SelectItem>
                          <SelectItem value="Söke Vergi Dairesi">Söke Vergi Dairesi</SelectItem>
                          <SelectItem value="Suluova Vergi Dairesi">Suluova Vergi Dairesi</SelectItem>
                          <SelectItem value="Sungurlu Vergi Dairesi">Sungurlu Vergi Dairesi</SelectItem>
                          <SelectItem value="Suşehri Vergi Dairesi">Suşehri Vergi Dairesi</SelectItem>
                          <SelectItem value="Şahinbey Vergi Dairesi">Şahinbey Vergi Dairesi</SelectItem>
                          <SelectItem value="Şarkışla Vergi Dairesi">Şarkışla Vergi Dairesi</SelectItem>
                          <SelectItem value="Şehitkamil Vergi Dairesi">Şehitkamil Vergi Dairesi</SelectItem>
                          <SelectItem value="Tarsus Vergi Dairesi">Tarsus Vergi Dairesi</SelectItem>
                          <SelectItem value="Taşköprü Vergi Dairesi">Taşköprü Vergi Dairesi</SelectItem>
                          <SelectItem value="Tatvan Vergi Dairesi">Tatvan Vergi Dairesi</SelectItem>
                          <SelectItem value="Tavşanlı Vergi Dairesi">Tavşanlı Vergi Dairesi</SelectItem>
                          <SelectItem value="Tepebaşı Vergi Dairesi">Tepebaşı Vergi Dairesi</SelectItem>
                          <SelectItem value="Tokat Vergi Dairesi">Tokat Vergi Dairesi</SelectItem>
                          <SelectItem value="Tosya Vergi Dairesi">Tosya Vergi Dairesi</SelectItem>
                          <SelectItem value="Trabzon Vergi Dairesi">Trabzon Vergi Dairesi</SelectItem>
                          <SelectItem value="Tufanbeyli Vergi Dairesi">Tufanbeyli Vergi Dairesi</SelectItem>
                          <SelectItem value="Tunceli Vergi Dairesi">Tunceli Vergi Dairesi</SelectItem>
                          <SelectItem value="Turgutlu Vergi Dairesi">Turgutlu Vergi Dairesi</SelectItem>
                          <SelectItem value="Turhal Vergi Dairesi">Turhal Vergi Dairesi</SelectItem>
                          <SelectItem value="Ulubey Vergi Dairesi">Ulubey Vergi Dairesi</SelectItem>
                          <SelectItem value="Ulus Vergi Dairesi">Ulus Vergi Dairesi</SelectItem>
                          <SelectItem value="Uşak Vergi Dairesi">Uşak Vergi Dairesi</SelectItem>
                          <SelectItem value="Ünye Vergi Dairesi">Ünye Vergi Dairesi</SelectItem>
                          <SelectItem value="Ürgüp Vergi Dairesi">Ürgüp Vergi Dairesi</SelectItem>
                          <SelectItem value="Vakfıkebir Vergi Dairesi">Vakfıkebir Vergi Dairesi</SelectItem>
                          <SelectItem value="Van Vergi Dairesi">Van Vergi Dairesi</SelectItem>
                          <SelectItem value="Varto Vergi Dairesi">Varto Vergi Dairesi</SelectItem>
                          <SelectItem value="Vezirköprü Vergi Dairesi">Vezirköprü Vergi Dairesi</SelectItem>
                          <SelectItem value="Yakutiye Vergi Dairesi">Yakutiye Vergi Dairesi</SelectItem>
                          <SelectItem value="Yalova Vergi Dairesi">Yalova Vergi Dairesi</SelectItem>
                          <SelectItem value="Yalvaç Vergi Dairesi">Yalvaç Vergi Dairesi</SelectItem>
                          <SelectItem value="Yatağan Vergi Dairesi">Yatağan Vergi Dairesi</SelectItem>
                          <SelectItem value="Yenimahalle Vergi Dairesi">Yenimahalle Vergi Dairesi</SelectItem>
                          <SelectItem value="Yenişehir Vergi Dairesi">Yenişehir Vergi Dairesi</SelectItem>
                          <SelectItem value="Yeşilyurt Vergi Dairesi">Yeşilyurt Vergi Dairesi</SelectItem>
                          <SelectItem value="Yıldırım Vergi Dairesi">Yıldırım Vergi Dairesi</SelectItem>
                          <SelectItem value="Yozgat Vergi Dairesi">Yozgat Vergi Dairesi</SelectItem>
                          <SelectItem value="Yüksekova Vergi Dairesi">Yüksekova Vergi Dairesi</SelectItem>
                          <SelectItem value="Yüreğir Vergi Dairesi">Yüreğir Vergi Dairesi</SelectItem>
                          <SelectItem value="Zara Vergi Dairesi">Zara Vergi Dairesi</SelectItem>
                          <SelectItem value="Zonguldak Vergi Dairesi">Zonguldak Vergi Dairesi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label>Mersis No</Label>
                      <Input placeholder="Mersis numarası" />
                    </div>
                  </div>
                </>
              )}

              {/* İletişim Bilgileri */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4 text-blue-600">İletişim Bilgileri</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Telefon No</Label>
                    <div className="flex gap-2">
                      <div className="w-16 flex items-center justify-center border rounded px-2 bg-gray-50">
                        <span className="text-xl">🇹🇷</span>
                        <ChevronDown className="w-3 h-3 ml-1" />
                      </div>
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="0501 234 5678"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>E-Posta *</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="ornek@email.com"
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
            </TabsContent>

            {/* Cari Detay Bilgileri Tab */}
            <TabsContent value="detay" className="space-y-6">
              {/* Vade Bilgileri */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-blue-600">Vade Bilgileri</h3>
                <div className="space-y-2">
                  <Label className="text-blue-500 font-normal">Vade Günü</Label>
                  <div className="flex gap-4 items-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="vadeGunu"
                        value="yok"
                        checked={!vadeGunuVar}
                        onChange={() => {
                          setVadeGunuVar(false);
                          setVadeGunuSayisi("");
                        }}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">Yok</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="vadeGunu"
                        value="var"
                        checked={vadeGunuVar}
                        onChange={() => setVadeGunuVar(true)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">Var</span>
                    </label>
                    
                    {vadeGunuVar && (
                      <div className="flex items-center gap-2 ml-4">
                        <Input
                          type="number"
                          value={vadeGunuSayisi}
                          onChange={(e) => setVadeGunuSayisi(e.target.value)}
                          placeholder="Gün sayısı"
                          className="w-32"
                          min="1"
                          max="999"
                          step="1"
                          required={vadeGunuVar}
                        />
                        <span className="text-gray-600 text-sm">gün</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 border-dashed my-4"></div>

              {/* Sabit İskonto */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-blue-600">Sabit İskonto</h3>
                <div className="space-y-2">
                  <Label className="text-blue-500 font-normal">Sabit İskonto</Label>
                  <div className="flex gap-4 items-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="sabitIskonto"
                        value="yok"
                        checked={!sabitIskontoVar}
                        onChange={() => {
                          setSabitIskontoVar(false);
                          setSabitIskontoYuzde("");
                        }}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">Yok</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="sabitIskonto"
                        value="var"
                        checked={sabitIskontoVar}
                        onChange={() => setSabitIskontoVar(true)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">Var</span>
                    </label>
                    
                    {sabitIskontoVar && (
                      <div className="flex items-center gap-0">
                        <Input
                          type="number"
                          value={sabitIskontoVar ? sabitIskontoYuzde : ""}
                          onChange={(e) => setSabitIskontoYuzde(e.target.value)}
                          placeholder=""
                          disabled={!sabitIskontoVar}
                          className="rounded-r-none border-r-0"
                          min="0"
                          max="100"
                          step="0.01"
                          required={sabitIskontoVar}
                        />
                        <div className="flex items-center justify-center bg-gray-100 border border-l-0 border-gray-300 px-3 h-10 rounded-r-md text-gray-600">
                          %
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 border-dashed my-4"></div>

              {/* Açılış Bakiyesi */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-blue-600">Açılış Bakiyesi</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <Label className="text-blue-500 font-normal">Tutar</Label>
                    <Input 
                      type="number" 
                      defaultValue="0.00" 
                      step="0.01"
                      min="0"
                      className="text-right font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-blue-500 font-normal">Para Birimi *</Label>
                    <Select defaultValue="TRY">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TRY">TRY</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-blue-500 font-normal">Durumu</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder=" " />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="borc">Borç</SelectItem>
                        <SelectItem value="alacak">Alacak</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-blue-500 font-normal">Proje</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder=" " />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="proje1">Proje 1</SelectItem>
                        <SelectItem value="proje2">Proje 2</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <Info className="w-3 h-3" /> Ayarlar sayfasından Proje Takip seçeneğini kapatabilirsiniz.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
                  <div className="space-y-2">
                    <Label className="text-blue-500 font-normal">İşlem Tarihi</Label>
                    <Input type="date" defaultValue="2026-04-10" />
                  </div>
                </div>
                
                <div className="space-y-2 mt-4">
                  <Label className="text-blue-500 font-normal">Vade Tarihi Var Mı?</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="vadeTarihiSecim"
                        value="yok"
                        defaultChecked
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">Yok</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="vadeTarihiSecim"
                        value="var"
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-gray-700">Var</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 border-dashed my-4"></div>

              {/* Borç Alacak Bilgileri */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-blue-600">Borç Alacak Bilgileri</h3>
                <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50 font-normal">
                  <Plus className="w-4 h-4 mr-2" />
                  Borç Alacak Ekle
                </Button>
              </div>

              <div className="border-t border-gray-100 border-dashed my-4"></div>

              {/* Banka Bilgileri */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-blue-600">Banka Bilgileri</h3>
                <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50 font-normal">
                  <Plus className="w-4 h-4 mr-2" />
                  Banka Ekle
                </Button>
              </div>

              <div className="border-t border-gray-100 border-dashed my-4"></div>

              {/* Yetkili İletişim Bilgileri */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-blue-600">Yetkili İletişim Bilgileri</h3>
                <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50 font-normal">
                  <Plus className="w-4 h-4 mr-2" />
                  Yetkili Ekle
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex justify-end gap-2 mt-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              className="bg-red-500 text-white hover:bg-red-600 hover:text-white border-0"
            >
              Vazgeç
            </Button>
            <div className="flex">
              <Button
                onClick={handleAddCustomer}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white rounded-r-none"
              >
                {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white rounded-l-none border-l border-green-700 px-2"
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}