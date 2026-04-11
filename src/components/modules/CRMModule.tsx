import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Building2,
  Users,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  Plus,
  Search,
  Filter,
  Download,
  Pencil,
  Trash2,
  Eye,
  RefreshCw,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { crmService } from "@/services/crmService";
import { useToast } from "@/components/ui/use-toast";

export function CRMModule() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, potential: 0, old: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("musteri");
  
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
    tax_number: "",
    tax_office: "",
    status: "Potansiyel" as const,
    notes: "",
    account_type: "musteri"
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
  const { toast } = useToast();

  useEffect(() => {
    loadCustomers();
    loadLeads();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await crmService.getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error("Error loading customers:", error);
    }
  };

  const loadLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error("Error loading leads:", error);
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
    if (!formData.name || !formData.email) {
      alert("Lütfen en az isim ve email giriniz!");
      return;
    }

    try {
      setIsSubmitting(true);
      await crmService.createCustomer(formData);
      setIsAddDialogOpen(false);
      await loadCustomers();
      alert("✅ Cari başarıyla eklendi!");
    } catch (error) {
      console.error("Error creating customer:", error);
      alert("❌ Cari eklenirken hata oluştu!");
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
      await loadCustomers();
      alert("✅ Cari başarıyla güncellendi!");
    } catch (error) {
      console.error("Error updating customer:", error);
      alert("❌ Cari güncellenirken hata oluştu!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCustomer = async () => {
    try {
      setIsSubmitting(true);
      await crmService.deleteCustomer(deletingCustomer.id);
      setIsDeleteDialogOpen(false);
      await loadCustomers();
      alert("✅ Cari başarıyla silindi!");
    } catch (error) {
      console.error("Error deleting customer:", error);
      alert("❌ Cari silinirken hata oluştu!");
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
    alert("✅ Excel dosyası indirildi!");
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
    return icons[type as keyof typeof icons] || Building2;
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
    <div className="space-y-6">
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
      <Tabs defaultValue="leads" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-2">
          <TabsTrigger value="leads">
            <UserPlus className="w-4 h-4 mr-2" />
            Potansiyel Müşteriler
          </TabsTrigger>
          <TabsTrigger value="musteriler">
            <Users className="w-4 h-4 mr-2" />
            Müşteriler
          </TabsTrigger>
        </TabsList>

        {/* Potansiyel Müşteriler (Leads) Tab */}
        <TabsContent value="leads" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-blue-600">Potansiyel Müşteriler</h2>
              <p className="text-sm text-gray-500 mt-1">Website teklif formundan gelen talepler</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadLeads}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Yenile
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-6">
              {leads.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Henüz potansiyel müşteri kaydı bulunmamaktadır
                </div>
              ) : (
                <div className="space-y-4">
                  {leads.map((lead) => (
                    <div
                      key={lead.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-blue-600">
                            {lead.company_name}
                          </h3>
                          <p className="text-sm text-gray-600">{lead.contact_name}</p>
                        </div>
                        <div className="flex gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              lead.status === "yeni"
                                ? "bg-blue-100 text-blue-700"
                                : lead.status === "inceleniyor"
                                ? "bg-yellow-100 text-yellow-700"
                                : lead.status === "teklif_verildi"
                                ? "bg-purple-100 text-purple-700"
                                : lead.status === "kazanildi"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {lead.status === "yeni"
                              ? "🆕 Yeni"
                              : lead.status === "inceleniyor"
                              ? "🔍 İnceleniyor"
                              : lead.status === "teklif_verildi"
                              ? "📋 Teklif Verildi"
                              : lead.status === "kazanildi"
                              ? "✅ Kazanıldı"
                              : "❌ Kaybedildi"}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              lead.priority === "acil"
                                ? "bg-red-100 text-red-700"
                                : lead.priority === "yüksek"
                                ? "bg-orange-100 text-orange-700"
                                : lead.priority === "normal"
                                ? "bg-gray-100 text-gray-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {lead.priority === "acil"
                              ? "🔥 Acil"
                              : lead.priority === "yüksek"
                              ? "⚡ Yüksek"
                              : lead.priority === "normal"
                              ? "📌 Normal"
                              : "📍 Düşük"}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-500">Telefon</p>
                          <p className="text-sm font-medium">{lead.phone}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">E-posta</p>
                          <p className="text-sm font-medium">{lead.email}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Hizmet</p>
                          <p className="text-sm font-medium">
                            {lead.service_type === "kara"
                              ? "🚛 Kara Yolu"
                              : lead.service_type === "deniz"
                              ? "🚢 Deniz Yolu"
                              : lead.service_type === "hava"
                              ? "✈️ Hava Yolu"
                              : lead.service_type === "depolama"
                              ? "📦 Depolama"
                              : "🌍 Uluslararası"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Talep Tarihi</p>
                          <p className="text-sm font-medium">
                            {new Date(lead.created_at).toLocaleDateString("tr-TR")}
                          </p>
                        </div>
                      </div>

                      {(lead.origin || lead.destination) && (
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          {lead.origin && (
                            <div>
                              <p className="text-xs text-gray-500">Nereden</p>
                              <p className="text-sm font-medium">{lead.origin}</p>
                            </div>
                          )}
                          {lead.destination && (
                            <div>
                              <p className="text-xs text-gray-500">Nereye</p>
                              <p className="text-sm font-medium">{lead.destination}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {lead.message && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-1">Mesaj</p>
                          <p className="text-sm bg-gray-50 p-2 rounded">{lead.message}</p>
                        </div>
                      )}

                      <div className="flex gap-2 mt-3 pt-3 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            // Durumu güncelle
                            supabase
                              .from("leads")
                              .update({ status: "inceleniyor" })
                              .eq("id", lead.id)
                              .then(() => loadLeads());
                          }}
                        >
                          İncele
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            // Durumu güncelle
                            supabase
                              .from("leads")
                              .update({ status: "teklif_verildi" })
                              .eq("id", lead.id)
                              .then(() => loadLeads());
                          }}
                        >
                          Teklif Ver
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            // Durumu güncelle
                            supabase
                              .from("leads")
                              .update({
                                status: "kazanildi",
                                converted_to_customer: true,
                                converted_at: new Date().toISOString(),
                              })
                              .eq("id", lead.id)
                              .then(() => {
                                loadLeads();
                                toast({
                                  title: "Başarılı",
                                  description: "Lead müşteriye dönüştürüldü",
                                });
                              });
                          }}
                        >
                          Müşteriye Dönüştür
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Müşteriler Tab */}
        <TabsContent value="musteriler" className="mt-0">
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
              Toplam {filteredCustomers.length} kayıt listelenmektedir. Daha fazlası için detaylı arama yapabilirsiniz.
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Customer Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Yeni {getAccountTypeLabel(activeTab)} Ekle</DialogTitle>
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
              <Label htmlFor="company">Şirket/Unvan</Label>
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
              <Label htmlFor="tax_number">VKN/TCKN</Label>
              <Input
                id="tax_number"
                value={formData.tax_number}
                onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                placeholder="1234567890"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax_office">Vergi Dairesi</Label>
              <Input
                id="tax_office"
                value={formData.tax_office}
                onChange={(e) => setFormData({ ...formData, tax_office: e.target.value })}
                placeholder="Kadıköy"
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
                placeholder="Cari hakkında notlar..."
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
              {isSubmitting ? "Ekleniyor..." : "Cari Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Cari Düzenle</DialogTitle>
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
              <Label htmlFor="edit-company">Şirket/Unvan</Label>
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
              <Label htmlFor="edit-tax_number">VKN/TCKN</Label>
              <Input
                id="edit-tax_number"
                value={formData.tax_number}
                onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-tax_office">Vergi Dairesi</Label>
              <Input
                id="edit-tax_office"
                value={formData.tax_office}
                onChange={(e) => setFormData({ ...formData, tax_office: e.target.value })}
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
                <h3 className="font-bold text-lg mb-4">Cari Bilgileri</h3>
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
                  {detailCustomer.tax_number && (
                    <div>
                      <p className="text-gray-600">VKN/TCKN</p>
                      <p className="font-semibold">{detailCustomer.tax_number}</p>
                    </div>
                  )}
                  {detailCustomer.tax_office && (
                    <div>
                      <p className="text-gray-600">Vergi Dairesi</p>
                      <p className="font-semibold">{detailCustomer.tax_office}</p>
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
                    <Badge className={getStatusBadge(detailCustomer.status)}>
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
                            {new Date(invoice.created_at).toLocaleDateString("tr-TR")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₺{Number(invoice.amount).toLocaleString("tr-TR")}</p>
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
    </div>
  );
}