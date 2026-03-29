import { useState, useEffect } from "react";
import { Search, Plus, Phone, Mail, MapPin, Calendar, TrendingUp, Filter, ExternalLink, Edit, Trash2, Eye, Download, Send, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { crmService } from "@/services/crmService";

export function CRMModule() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, potential: 0, old: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Add/Edit Dialog States
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
    status: "Potansiyel" as const,
    notes: ""
  });
  
  // Delete Dialog State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState<any>(null);
  
  // Detail Dialog State
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [detailCustomer, setDetailCustomer] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  // Filter States
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    city: "all",
    dateFrom: "",
    dateTo: ""
  });
  const [cities, setCities] = useState<string[]>([]);
  
  // Bulk Email State
  const [isBulkEmailOpen, setIsBulkEmailOpen] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  
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

  const openAddDialog = () => {
    setFormData({
      name: "",
      company: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      status: "Potansiyel",
      notes: ""
    });
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
      status: customer.status,
      notes: customer.notes || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleAddCustomer = async () => {
    if (!formData.name || !formData.email) {
      alert("Lütfen en az isim ve email giriniz!");
      return;
    }

    try {
      setIsSubmitting(true);
      await crmService.createCustomer(formData);
      setIsAddDialogOpen(false);
      await loadData();
      alert("✅ Müşteri başarıyla eklendi!");
    } catch (error) {
      console.error("Error creating customer:", error);
      alert("❌ Müşteri eklenirken hata oluştu!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCustomer = async () => {
    if (!formData.name || !formData.email) {
      alert("Lütfen en az isim ve email giriniz!");
      return;
    }

    try {
      setIsSubmitting(true);
      await crmService.updateCustomer(editingCustomer.id, formData);
      setIsEditDialogOpen(false);
      await loadData();
      alert("✅ Müşteri başarıyla güncellendi!");
    } catch (error) {
      console.error("Error updating customer:", error);
      alert("❌ Müşteri güncellenirken hata oluştu!");
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
      alert("✅ Müşteri başarıyla silindi!");
    } catch (error) {
      console.error("Error deleting customer:", error);
      alert("❌ Müşteri silinirken hata oluştu!");
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
      ["Ad Soyad", "Şirket", "Email", "Telefon", "Şehir", "Durum", "Son İletişim"].join(","),
      ...filteredCustomers.map(c => [
        c.name,
        c.company || "",
        c.email,
        c.phone || "",
        c.city || "",
        c.status,
        c.last_contact ? new Date(c.last_contact).toLocaleDateString('tr-TR') : ""
      ].join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `musteri_listesi_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    alert("✅ Excel dosyası indirildi!");
  };

  const handleBulkEmail = () => {
    if (selectedCustomers.length === 0) {
      alert("Lütfen en az bir müşteri seçin!");
      return;
    }
    setIsBulkEmailOpen(true);
  };

  const sendBulkEmail = () => {
    if (!emailSubject || !emailBody) {
      alert("Lütfen konu ve mesaj giriniz!");
      return;
    }

    const selectedCustomerData = customers.filter(c => selectedCustomers.includes(c.id));
    const emails = selectedCustomerData.map(c => c.email).join(", ");
    
    alert(`📧 Toplu email gönderiliyor...\n\nAlıcılar: ${emails}\n\nKonu: ${emailSubject}\n\nBu özellik backend entegrasyonu ile aktif hale gelecektir.`);
    setIsBulkEmailOpen(false);
    setSelectedCustomers([]);
    setEmailSubject("");
    setEmailBody("");
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

  // Apply filters
  let filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm) ||
    customer.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const getStatusConfig = (status: string) => {
    const configs = {
      "Aktif": { color: "bg-green-100 text-green-700 border-green-200", icon: TrendingUp },
      "Potansiyel": { color: "bg-blue-100 text-blue-700 border-blue-200", icon: Calendar },
      "Eski Müşteri": { color: "bg-gray-100 text-gray-700 border-gray-200", icon: Calendar }
    };
    return configs[status as keyof typeof configs] || configs["Potansiyel"];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Müşteri verileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">CRM - Müşteri Yönetimi</h2>
          <p className="text-gray-600 mt-1">Müşteri ilişkileri ve cari kartlarını yönetin</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={handleExportExcel}
          >
            <Download className="w-4 h-4 mr-2" />
            Excel İndir
          </Button>
          <Button 
            className="bg-purple-600 hover:bg-purple-700"
            onClick={openAddDialog}
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni Müşteri
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Toplam Müşteri</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-purple-600" />
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Aktif</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.active}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-600" />
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Potansiyel</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.potential}</p>
            </div>
            <Calendar className="w-10 h-10 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-gray-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Eski Müşteri</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.old}</p>
            </div>
            <Calendar className="w-10 h-10 text-gray-600" />
          </div>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Müşteri ara (isim, şirket, email, telefon, şehir)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button 
            variant="outline"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtrele
          </Button>
          {selectedCustomers.length > 0 && (
            <Button 
              variant="outline"
              onClick={handleBulkEmail}
            >
              <Send className="w-4 h-4 mr-2" />
              Toplu Email ({selectedCustomers.length})
            </Button>
          )}
        </div>

        {/* Advanced Filters */}
        {isFilterOpen && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
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
              <Label>Başlangıç Tarihi</Label>
              <Input 
                type="date" 
                value={filters.dateFrom}
                onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Bitiş Tarihi</Label>
              <Input 
                type="date" 
                value={filters.dateTo}
                onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Select All */}
      {filteredCustomers.length > 0 && (
        <div className="flex items-center gap-2 px-2">
          <Checkbox
            checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
            onCheckedChange={toggleSelectAll}
          />
          <span className="text-sm text-gray-600">Tümünü Seç ({filteredCustomers.length} müşteri)</span>
        </div>
      )}

      {/* Customer List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((customer) => {
          const statusConfig = getStatusConfig(customer.status);
          const StatusIcon = statusConfig.icon;

          return (
            <Card key={customer.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 flex-1">
                    <Checkbox
                      checked={selectedCustomers.includes(customer.id)}
                      onCheckedChange={() => toggleCustomerSelection(customer.id)}
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900">{customer.company || customer.name}</h3>
                      {customer.company && <p className="text-gray-600 text-sm">{customer.name}</p>}
                    </div>
                  </div>
                  <Badge className={statusConfig.color}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {customer.status}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                  {customer.city && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{customer.city}</span>
                    </div>
                  )}
                  {customer.last_contact && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Son: {new Date(customer.last_contact).toLocaleDateString('tr-TR')}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => openDetailDialog(customer)}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Detay
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => openEditDialog(customer)}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Düzenle
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setDeletingCustomer(customer);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-3 h-3 text-red-600" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredCustomers.length === 0 && (
        <Card className="p-12">
          <div className="text-center text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Arama kriterlerine uygun müşteri bulunamadı.</p>
          </div>
        </Card>
      )}

      {/* Add Customer Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Yeni Müşteri Ekle</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Ad Soyad *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ahmet Yılmaz"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Şirket</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="ABC Lojistik A.Ş."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="ahmet@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0532 123 45 67"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Şehir</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="İstanbul"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Durum</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aktif">Aktif</SelectItem>
                  <SelectItem value="Potansiyel">Potansiyel</SelectItem>
                  <SelectItem value="Eski Müşteri">Eski Müşteri</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Adres</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Büyükdere Cad. No:123 Şişli"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notlar</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Müşteri hakkında notlar..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              disabled={isSubmitting}
            >
              İptal
            </Button>
            <Button
              onClick={handleAddCustomer}
              disabled={isSubmitting}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? "Ekleniyor..." : "Müşteri Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Müşteri Düzenle</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Ad Soyad *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-company">Şirket</Label>
              <Input
                id="edit-company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">Telefon</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-city">Şehir</Label>
              <Input
                id="edit-city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Durum</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aktif">Aktif</SelectItem>
                  <SelectItem value="Potansiyel">Potansiyel</SelectItem>
                  <SelectItem value="Eski Müşteri">Eski Müşteri</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-address">Adres</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-notes">Notlar</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSubmitting}
            >
              İptal
            </Button>
            <Button
              onClick={handleUpdateCustomer}
              disabled={isSubmitting}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? "Güncelleniyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Müşteriyi Sil</DialogTitle>
            <DialogDescription>
              <strong>{deletingCustomer?.company || deletingCustomer?.name}</strong> müşterisini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
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

      {/* Customer Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {detailCustomer?.company || detailCustomer?.name}
            </DialogTitle>
          </DialogHeader>

          {loadingDetail ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : detailCustomer && (
            <div className="space-y-6">
              {/* Customer Info */}
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4">Müşteri Bilgileri</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Ad Soyad</p>
                    <p className="font-semibold">{detailCustomer.name}</p>
                  </div>
                  {detailCustomer.company && (
                    <div>
                      <p className="text-gray-600">Şirket</p>
                      <p className="font-semibold">{detailCustomer.company}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-600">Email</p>
                    <p className="font-semibold">{detailCustomer.email}</p>
                  </div>
                  {detailCustomer.phone && (
                    <div>
                      <p className="text-gray-600">Telefon</p>
                      <p className="font-semibold">{detailCustomer.phone}</p>
                    </div>
                  )}
                  {detailCustomer.city && (
                    <div>
                      <p className="text-gray-600">Şehir</p>
                      <p className="font-semibold">{detailCustomer.city}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-600">Durum</p>
                    <Badge className={getStatusConfig(detailCustomer.status).color}>
                      {detailCustomer.status}
                    </Badge>
                  </div>
                </div>
              </Card>

              {/* Shipments */}
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4">Sevkiyatlar ({detailCustomer.shipments?.length || 0})</h3>
                {detailCustomer.shipments?.length > 0 ? (
                  <div className="space-y-2">
                    {detailCustomer.shipments.slice(0, 5).map((shipment: any) => (
                      <div key={shipment.id} className="flex justify-between items-center py-2 border-b">
                        <div>
                          <p className="font-semibold">{shipment.tracking_no}</p>
                          <p className="text-sm text-gray-600">{shipment.origin} → {shipment.destination}</p>
                        </div>
                        <Badge>{shipment.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Henüz sevkiyat kaydı yok.</p>
                )}
              </Card>

              {/* Invoices */}
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4">Faturalar ({detailCustomer.invoices?.length || 0})</h3>
                {detailCustomer.invoices?.length > 0 ? (
                  <div className="space-y-2">
                    {detailCustomer.invoices.slice(0, 5).map((invoice: any) => (
                      <div key={invoice.id} className="flex justify-between items-center py-2 border-b">
                        <div>
                          <p className="font-semibold">{invoice.invoice_no}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(invoice.created_at).toLocaleDateString('tr-TR')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₺{Number(invoice.amount).toLocaleString('tr-TR')}</p>
                          <Badge>{invoice.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Henüz fatura kaydı yok.</p>
                )}
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Email Dialog */}
      <Dialog open={isBulkEmailOpen} onOpenChange={setIsBulkEmailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Toplu Email Gönder ({selectedCustomers.length} müşteri)
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email-subject">Konu</Label>
              <Input
                id="email-subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Email konusu..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-body">Mesaj</Label>
              <Textarea
                id="email-body"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Email içeriği..."
                rows={8}
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Alıcılar:</strong> {customers.filter(c => selectedCustomers.includes(c.id)).map(c => c.email).join(", ")}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsBulkEmailOpen(false)}
            >
              İptal
            </Button>
            <Button
              onClick={sendBulkEmail}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Send className="w-4 h-4 mr-2" />
              Gönder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}