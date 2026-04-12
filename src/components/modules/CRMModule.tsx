import { useState, useEffect } from "react";
import { Search, Plus, Phone, Mail, MapPin, Calendar, TrendingUp, Filter, ExternalLink, Eye, Edit, Trash2, Download, Send, Upload, ChevronDown, Building2, Users, UserCircle2, Briefcase } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { crmService } from "@/services/crmService";
import { CariForm } from "@/components/CariForm";

export function CRMModule() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, potential: 0, old: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("musteri");
  
  // States
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Detail Dialog State
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [detailCustomer, setDetailCustomer] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Edit Dialog State
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  
  // Delete Dialog State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState<any>(null);
  
  // Filter States
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    city: "all",
    dateFrom: "",
    dateTo: ""
  });
  const [cities, setCities] = useState<string[]>([]);
  
  // Bulk Selection State
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
    loadCities();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [customerData, statsData] = await Promise.all([
        crmService.getCustomers(),
        crmService.getCustomerStats()
      ]);
      setCustomers(customerData);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading CRM data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCities = async () => {
    const cityList = await crmService.getCities();
    setCities(cityList);
  };

  const handleDeleteCustomer = async () => {
    if (!deletingCustomer) return;

    try {
      setIsSubmitting(true);
      await crmService.deleteCustomer(deletingCustomer.id);
      toast({
        title: "Başarılı",
        description: "Cari başarıyla silindi",
      });
      setIsDeleteDialogOpen(false);
      setDeletingCustomer(null);
      loadData();
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast({
        title: "Hata",
        description: "Cari silinirken bir hata oluştu",
        variant: "destructive",
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
        c.tax_number || c.vergi_no || c.tc_no || "",
        c.status
      ].join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `cari_listesi_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast({ title: "Başarılı", description: "Excel dosyası indirildi" });
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
      ortak: Users
    };
    const IconComponent = icons[type as keyof typeof icons] || Building2;
    return <IconComponent className="h-4 w-4" />;
  };

  // Apply filters
  let filteredCustomers = customers.filter(customer => {
    // Tab filter
    const accountType = customer.account_type || "musteri";
    if (accountType !== activeTab) return false;

    // Search filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      customer.name?.toLowerCase().includes(searchLower) ||
      customer.company?.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.phone?.includes(searchTerm) ||
      customer.city?.toLowerCase().includes(searchLower) ||
      customer.tax_number?.includes(searchTerm) ||
      customer.vergi_no?.includes(searchTerm) ||
      customer.tc_no?.includes(searchTerm);

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

  const getStatusBadge = (status: string) => {
    const configs = {
      "Aktif": "bg-green-100 text-green-700 border-green-200",
      "Potansiyel": "bg-blue-100 text-blue-700 border-blue-200",
      "Eski Müşteri": "bg-gray-100 text-gray-700 border-gray-200"
    };
    return configs[status as keyof typeof configs] || configs["Potansiyel"];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cari verileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Genel Cari Hesapları</h2>
          <p className="text-gray-600 mt-1">Müşteri, tedarikçi, personel ve ortak cari hesaplarını yönetin</p>
        </div>
      </div>

      {/* Action Buttons */}
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

      {/* Advanced Search Panel */}
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center gap-2 mb-4">
          <TabsList className="bg-transparent p-0 h-auto space-x-2">
            <TabsTrigger 
              value="musteri"
              onClick={(e) => {
                e.preventDefault();
                setIsFormOpen(true);
              }}
              className="bg-green-600 text-white data-[state=active]:bg-green-700 px-4 py-2 rounded"
            >
              Cari Oluştur
            </TabsTrigger>
            <TabsTrigger 
              value="import"
              className="bg-blue-600 text-white data-[state=inactive]:bg-blue-500 px-4 py-2 rounded"
              onClick={(e) => {
                e.preventDefault();
                alert("İçe aktarma özelliği yakında eklenecek");
              }}
            >
              İçe Aktar
            </TabsTrigger>
            <TabsTrigger 
              value="export"
              className="bg-blue-600 text-white data-[state=inactive]:bg-blue-500 px-4 py-2 rounded"
              onClick={(e) => {
                e.preventDefault();
                handleExportExcel();
              }}
            >
              Dışarıya Aktar
            </TabsTrigger>
          </TabsList>
          
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

        {/* Tab Content Filters */}
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
              <Users className="w-4 h-4" />
              Ortak Cari
            </Button>
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-0">
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="w-12 px-6 py-3">
                      <input type="checkbox" className="rounded" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kod</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ünvan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cari Tipi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefon Numarası</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Etiketler</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">VKN/TCKN</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input type="checkbox" className="rounded" />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {customer.id.substring(0, 8)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{customer.company || customer.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-sm text-gray-700">
                          {getAccountTypeIcon(customer.account_type || "musteri")}
                          {getAccountTypeLabel(customer.account_type || "musteri")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{customer.phone}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded ${getStatusBadge(customer.status)}`}>
                          {customer.status || "Aktif"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {customer.vergi_no || customer.tc_no || customer.tax_number || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => openDetailDialog(customer)}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Görüntüle"
                          >
                            <Eye className="h-4 w-4 text-gray-600" />
                          </button>
                          <button 
                            onClick={() => {
                              setEditingCustomer(customer);
                              setIsEditDialogOpen(true);
                            }}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Düzenle"
                          >
                            <Edit className="h-4 w-4 text-gray-600" />
                          </button>
                          <button 
                            onClick={() => {
                              setDeletingCustomer(customer);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Sil"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {filteredCustomers.length > 0 && (
            <div className="mt-4 text-sm text-gray-600">
              Toplam {filteredCustomers.length} kayıt listelenmektedir. Daha fazlası için detaylı arama yapabilirsiniz.
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add CariForm for creating new customers */}
      <CariForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={loadData}
      />

      {/* View Detail Modal */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cari Detayları</DialogTitle>
          </DialogHeader>
          {loadingDetail ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : detailCustomer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Ünvan/Ad Soyad</Label>
                  <p className="font-medium">{detailCustomer.company || detailCustomer.name}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Cari Tipi</Label>
                  <p className="font-medium">
                    {getAccountTypeLabel(detailCustomer.account_type || "musteri")}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Email</Label>
                  <p className="font-medium">{detailCustomer.email}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Telefon</Label>
                  <p className="font-medium">{detailCustomer.phone}</p>
                </div>
                {detailCustomer.vergi_no && (
                  <div>
                    <Label className="text-gray-500">Vergi No</Label>
                    <p className="font-medium">{detailCustomer.vergi_no}</p>
                  </div>
                )}
                {detailCustomer.tc_no && (
                  <div>
                    <Label className="text-gray-500">TC No</Label>
                    <p className="font-medium">{detailCustomer.tc_no}</p>
                  </div>
                )}
                {detailCustomer.tax_office && (
                  <div>
                    <Label className="text-gray-500">Vergi Dairesi</Label>
                    <p className="font-medium">{detailCustomer.tax_office}</p>
                  </div>
                )}
                {detailCustomer.city && (
                  <div>
                    <Label className="text-gray-500">İl</Label>
                    <p className="font-medium">{detailCustomer.city}</p>
                  </div>
                )}
                {detailCustomer.district && (
                  <div>
                    <Label className="text-gray-500">İlçe</Label>
                    <p className="font-medium">{detailCustomer.district}</p>
                  </div>
                )}
                {detailCustomer.address && (
                  <div className="col-span-2">
                    <Label className="text-gray-500">Adres</Label>
                    <p className="font-medium">{detailCustomer.address}</p>
                  </div>
                )}
                {detailCustomer.notes && (
                  <div className="col-span-2">
                    <Label className="text-gray-500">Notlar</Label>
                    <p className="font-medium">{detailCustomer.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cari Düzenle</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">
            Düzenleme özelliği detaylı Cari Formu üzerinden yakında eklenecek.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Kapat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cari Sil</DialogTitle>
            <DialogDescription>
              <strong>{deletingCustomer?.company || deletingCustomer?.name}</strong> cari kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isSubmitting}
            >
              İptal
            </Button>
            <Button
              onClick={handleDeleteCustomer}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? "Siliniyor..." : "Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}