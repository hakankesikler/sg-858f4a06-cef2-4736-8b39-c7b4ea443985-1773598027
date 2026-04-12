import { useState, useEffect, useMemo } from "react";
import { Search, Plus, Building2, Eye, Edit, Trash2, Users, Filter, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { crmService } from "@/services/crmService";
import { CariForm } from "@/components/CariForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { bankAccountService, type BankAccount } from "@/services/bankAccountService";

export function CRMModule() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [supplierSubCategory, setSupplierSubCategory] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // View/Edit/Delete states
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Bank account states
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isBankFormOpen, setIsBankFormOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);
  const [bankFormData, setBankFormData] = useState({
    bank_name: "",
    iban: "",
    account_holder: "",
    account_number: "",
    branch_name: "",
    branch_code: "",
    swift_code: "",
    currency: "TRY",
    is_default: false,
    notes: ""
  });
  
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await crmService.getCustomers();
      console.log("=== LOADED CUSTOMERS ===");
      console.log("Total:", data.length);
      data.forEach(c => {
        console.log(`${c.name}: vergi_no=${c.vergi_no}, tc_no=${c.tc_no}`);
      });
      setCustomers(data);
    } catch (error) {
      console.error("Error loading customers:", error);
      toast({
        title: "Hata",
        description: "Cari verileri yüklenirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBankAccounts = async (customerId: string) => {
    try {
      const accounts = await bankAccountService.getBankAccounts(customerId);
      setBankAccounts(accounts);
    } catch (error) {
      console.error("Error loading bank accounts:", error);
    }
  };

  const handleSaveBankAccount = async () => {
    if (!selectedCustomer) return;

    try {
      setIsSubmitting(true);
      const accountData = {
        ...bankFormData,
        customer_id: selectedCustomer.id
      };

      if (editingBank?.id) {
        await bankAccountService.updateBankAccount(editingBank.id, accountData);
        toast({ title: "Başarılı", description: "Banka hesabı güncellendi" });
      } else {
        await bankAccountService.createBankAccount(accountData);
        toast({ title: "Başarılı", description: "Banka hesabı eklendi" });
      }

      await loadBankAccounts(selectedCustomer.id);
      setIsBankFormOpen(false);
      setEditingBank(null);
      setBankFormData({
        bank_name: "",
        iban: "",
        account_holder: "",
        account_number: "",
        branch_name: "",
        branch_code: "",
        swift_code: "",
        currency: "TRY",
        is_default: false,
        notes: ""
      });
    } catch (error) {
      console.error("Error saving bank account:", error);
      toast({ title: "Hata", description: "Banka hesabı kaydedilemedi", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBankAccount = async (id: string) => {
    if (!confirm("Bu banka hesabını silmek istediğinizden emin misiniz?")) return;

    try {
      await bankAccountService.deleteBankAccount(id);
      toast({ title: "Başarılı", description: "Banka hesabı silindi" });
      if (selectedCustomer) {
        await loadBankAccounts(selectedCustomer.id);
      }
    } catch (error) {
      console.error("Error deleting bank account:", error);
      toast({ title: "Hata", description: "Banka hesabı silinemedi", variant: "destructive" });
    }
  };

  const openDetailDialog = (customer: any) => {
    setSelectedCustomer(customer);
    setIsDetailDialogOpen(true);
    loadBankAccounts(customer.id);
  };

  const filteredCustomers = useMemo(() => {
    let filtered = customers;

    // Filter by main account type
    if (filterType !== "all") {
      filtered = filtered.filter(c => c.account_type === filterType);
    }

    // Filter by supplier sub-category if in tedarikci tab
    if (filterType === "tedarikci" && supplierSubCategory !== "all") {
      filtered = filtered.filter(c => c.supplier_category === supplierSubCategory);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    console.log("=== FILTERED CUSTOMERS ===");
    console.log("Filter Type:", filterType);
    console.log("Supplier Sub-Category:", supplierSubCategory);
    console.log("Filtered Count:", filtered.length);

    return filtered;
  }, [customers, filterType, supplierSubCategory, searchTerm]);

  const handleEditCustomer = (customer: any) => {
    console.log("=== EDIT CUSTOMER CLICKED ===", customer);
    setSelectedCustomer(customer);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (customer: any) => {
    console.log("=== DELETE CUSTOMER CLICKED ===", customer);
    setSelectedCustomer(customer);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCustomer) return;

    try {
      setIsSubmitting(true);
      await crmService.deleteCustomer(selectedCustomer.id);
      toast({
        title: "Başarılı",
        description: "Cari başarıyla silindi",
      });
      setIsDeleteDialogOpen(false);
      setSelectedCustomer(null);
      loadCustomers();
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

  if (loading) {
    return <div className="p-6">Yükleniyor...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Genel Cari Hesapları</h1>
        <p className="text-gray-600 mt-1">
          Müşteri, tedarikçi, personel ve ortak cari hesaplarını yönetin
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-4">
        <Button onClick={() => setIsFormOpen(true)} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Cari Oluştur
        </Button>
        <Button variant="outline">İçe Aktar</Button>
        <Button variant="outline">Dışarıya Aktar</Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        <button
          onClick={() => {
            setFilterType("all");
            setSupplierSubCategory("all");
          }}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
            filterType === "all"
              ? "bg-gray-900 text-white shadow-lg"
              : "bg-white text-gray-700 hover:bg-gray-50 border"
          }`}
        >
          <Building2 className="h-5 w-5" />
          Müşteri Cari
        </button>
        <button
          onClick={() => {
            setFilterType("tedarikci");
            setSupplierSubCategory("all");
          }}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
            filterType === "tedarikci"
              ? "bg-gray-900 text-white shadow-lg"
              : "bg-white text-gray-700 hover:bg-gray-50 border"
          }`}
        >
          <Building2 className="h-5 w-5" />
          Tedarikçi Cari
        </button>
        <button
          onClick={() => {
            setFilterType("personel");
            setSupplierSubCategory("all");
          }}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
            filterType === "personel"
              ? "bg-gray-900 text-white shadow-lg"
              : "bg-white text-gray-700 hover:bg-gray-50 border"
          }`}
        >
          <Users className="h-5 w-5" />
          Personel Cari
        </button>
        <button
          onClick={() => {
            setFilterType("ortak");
            setSupplierSubCategory("all");
          }}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
            filterType === "ortak"
              ? "bg-gray-900 text-white shadow-lg"
              : "bg-white text-gray-700 hover:bg-gray-50 border"
          }`}
        >
          <Users className="h-5 w-5" />
          Ortak Cari
        </button>
      </div>

      {/* Supplier Sub-Category Tabs */}
      {filterType === "tedarikci" && (
        <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2 border-b">
          <button
            onClick={() => setSupplierSubCategory("all")}
            className={`px-4 py-2 rounded-t-lg font-medium transition-all whitespace-nowrap ${
              supplierSubCategory === "all"
                ? "bg-blue-50 text-blue-700 border-b-2 border-blue-700"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Tümü
          </button>
          <button
            onClick={() => setSupplierSubCategory("nakliyeci")}
            className={`px-4 py-2 rounded-t-lg font-medium transition-all whitespace-nowrap ${
              supplierSubCategory === "nakliyeci"
                ? "bg-blue-50 text-blue-700 border-b-2 border-blue-700"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Nakliyeci
          </button>
          <button
            onClick={() => setSupplierSubCategory("forwarder")}
            className={`px-4 py-2 rounded-t-lg font-medium transition-all whitespace-nowrap ${
              supplierSubCategory === "forwarder"
                ? "bg-blue-50 text-blue-700 border-b-2 border-blue-700"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Forwarder / Acente
          </button>
          <button
            onClick={() => setSupplierSubCategory("diger")}
            className={`px-4 py-2 rounded-t-lg font-medium transition-all whitespace-nowrap ${
              supplierSubCategory === "diger"
                ? "bg-blue-50 text-blue-700 border-b-2 border-blue-700"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Diğer Tedarikçiler
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="ml-auto flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Ara"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="w-12 px-6 py-3">
                <input type="checkbox" className="rounded" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Kod
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Ünvan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Cari Tipi
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Telefon Numarası
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Etiketler
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                VKN/TCKN
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredCustomers.map((customer) => {
              const vknValue = customer.vergi_no || customer.tc_no || "-";
              console.log(`Rendering row for ${customer.name}: VKN=${vknValue}`);
              
              return (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input type="checkbox" className="rounded" />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {customer.id.substring(0, 8)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 text-sm text-gray-700">
                      <Building2 className="h-4 w-4" />
                      {customer.account_type === "musteri"
                        ? "Müşteri"
                        : customer.account_type === "tedarikci"
                        ? "Tedarikçi"
                        : customer.account_type === "personel"
                        ? "Personel"
                        : customer.account_type === "ortak"
                        ? "Ortak"
                        : "Müşteri"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{customer.phone}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                      {customer.status || "Aktif"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                    {vknValue}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openDetailDialog(customer)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title="Görüntüle"
                      >
                        <Eye className="h-4 w-4 text-gray-600" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditCustomer(customer)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title="Düzenle"
                      >
                        <Edit className="h-4 w-4 text-gray-600" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(customer)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredCustomers.length === 0 && (
          <div className="p-8 text-center text-gray-500">Cari kaydı bulunamadı</div>
        )}
      </div>

      {/* Create Form Dialog */}
      <CariForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={loadCustomers}
      />

      {/* View Customer Dialog with Bank Accounts Tab */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cari Detayları</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Genel Bilgiler</TabsTrigger>
                <TabsTrigger value="bank">Banka Hesapları</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500">Ünvan</Label>
                    <p className="font-medium">{selectedCustomer.name}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Cari Tipi</Label>
                    <p className="font-medium">
                      {selectedCustomer.account_type === "musteri" ? "Müşteri" : 
                       selectedCustomer.account_type === "tedarikci" ? "Tedarikçi" :
                       selectedCustomer.account_type === "personel" ? "Personel" :
                       selectedCustomer.account_type === "ortak" ? "Ortak" : "Müşteri"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Email</Label>
                    <p className="font-medium">{selectedCustomer.email}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Telefon</Label>
                    <p className="font-medium">{selectedCustomer.phone}</p>
                  </div>
                  {selectedCustomer.vergi_no && (
                    <div>
                      <Label className="text-gray-500">Vergi No</Label>
                      <p className="font-medium">{selectedCustomer.vergi_no}</p>
                    </div>
                  )}
                  {selectedCustomer.tc_no && (
                    <div>
                      <Label className="text-gray-500">TC No</Label>
                      <p className="font-medium">{selectedCustomer.tc_no}</p>
                    </div>
                  )}
                  {selectedCustomer.tax_office && (
                    <div>
                      <Label className="text-gray-500">Vergi Dairesi</Label>
                      <p className="font-medium">{selectedCustomer.tax_office}</p>
                    </div>
                  )}
                  {selectedCustomer.city && (
                    <div>
                      <Label className="text-gray-500">İl</Label>
                      <p className="font-medium">{selectedCustomer.city}</p>
                    </div>
                  )}
                  {selectedCustomer.district && (
                    <div>
                      <Label className="text-gray-500">İlçe</Label>
                      <p className="font-medium">{selectedCustomer.district}</p>
                    </div>
                  )}
                  {selectedCustomer.address && (
                    <div className="col-span-2">
                      <Label className="text-gray-500">Adres</Label>
                      <p className="font-medium">{selectedCustomer.address}</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="bank" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Banka Hesapları</h3>
                  <Button
                    onClick={() => {
                      setIsBankFormOpen(true);
                      setEditingBank(null);
                    }}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Banka Hesabı Ekle
                  </Button>
                </div>

                {bankAccounts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Henüz banka hesabı eklenmemiş</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bankAccounts.map((account) => (
                      <div key={account.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{account.bank_name}</h4>
                              {account.is_default && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">
                                  Varsayılan
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>Hesap Sahibi:</strong> {account.account_holder}
                            </p>
                            <p className="text-sm text-gray-600 font-mono">
                              <strong>IBAN:</strong> {account.iban}
                            </p>
                            {account.swift_code && (
                              <p className="text-sm text-gray-600 mt-1">
                                <strong>SWIFT:</strong> {account.swift_code}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingBank(account);
                                setBankFormData({
                                  bank_name: account.bank_name,
                                  iban: account.iban,
                                  account_holder: account.account_holder,
                                  account_number: account.account_number || "",
                                  branch_name: account.branch_name || "",
                                  branch_code: account.branch_code || "",
                                  swift_code: account.swift_code || "",
                                  currency: account.currency || "TRY",
                                  is_default: account.is_default || false,
                                  notes: account.notes || ""
                                });
                                setIsBankFormOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => account.id && handleDeleteBankAccount(account.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Bank Account Form Dialog */}
      <Dialog open={isBankFormOpen} onOpenChange={setIsBankFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingBank ? "Banka Hesabını Düzenle" : "Yeni Banka Hesabı Ekle"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Banka Adı *</Label>
              <Input
                value={bankFormData.bank_name}
                onChange={(e) => setBankFormData({ ...bankFormData, bank_name: e.target.value })}
                placeholder="Örn: Ziraat Bankası"
              />
            </div>
            <div className="space-y-2">
              <Label>Hesap Sahibi *</Label>
              <Input
                value={bankFormData.account_holder}
                onChange={(e) => setBankFormData({ ...bankFormData, account_holder: e.target.value })}
                placeholder="Ad Soyad / Firma Ünvanı"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>IBAN *</Label>
              <Input
                value={bankFormData.iban}
                onChange={(e) => setBankFormData({ ...bankFormData, iban: e.target.value })}
                placeholder="TR00 0000 0000 0000 0000 0000 00"
                maxLength={32}
              />
            </div>
            <div className="space-y-2">
              <Label>Hesap No</Label>
              <Input
                value={bankFormData.account_number}
                onChange={(e) => setBankFormData({ ...bankFormData, account_number: e.target.value })}
                placeholder="Hesap numarası"
              />
            </div>
            <div className="space-y-2">
              <Label>Şube Adı</Label>
              <Input
                value={bankFormData.branch_name}
                onChange={(e) => setBankFormData({ ...bankFormData, branch_name: e.target.value })}
                placeholder="Şube adı"
              />
            </div>
            <div className="space-y-2">
              <Label>Şube Kodu</Label>
              <Input
                value={bankFormData.branch_code}
                onChange={(e) => setBankFormData({ ...bankFormData, branch_code: e.target.value })}
                placeholder="Şube kodu"
              />
            </div>
            <div className="space-y-2">
              <Label>SWIFT Kodu</Label>
              <Input
                value={bankFormData.swift_code}
                onChange={(e) => setBankFormData({ ...bankFormData, swift_code: e.target.value })}
                placeholder="SWIFT kodu"
              />
            </div>
            <div className="space-y-2">
              <Label>Para Birimi</Label>
              <select
                value={bankFormData.currency}
                onChange={(e) => setBankFormData({ ...bankFormData, currency: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="TRY">TRY - Türk Lirası</option>
                <option value="USD">USD - Amerikan Doları</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - İngiliz Sterlini</option>
              </select>
            </div>
            <div className="space-y-2 col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={bankFormData.is_default}
                  onChange={(e) => setBankFormData({ ...bankFormData, is_default: e.target.checked })}
                  className="rounded"
                />
                <span>Varsayılan hesap olarak ayarla</span>
              </label>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Notlar</Label>
              <Input
                value={bankFormData.notes}
                onChange={(e) => setBankFormData({ ...bankFormData, notes: e.target.value })}
                placeholder="Ek notlar"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBankFormOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSaveBankAccount} disabled={isSubmitting}>
              {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog - Now using CariForm */}
      <CariForm
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setSelectedCustomer(null);
        }}
        onSuccess={loadCustomers}
        editMode={true}
        initialData={selectedCustomer}
      />

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cariyi Sil</DialogTitle>
          </DialogHeader>
          <p className="text-sm">
            <strong>{selectedCustomer?.name}</strong> isimli cariyi silmek istediğinizden emin
            misiniz? Bu işlem geri alınamaz.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isSubmitting}
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Siliniyor..." : "Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}