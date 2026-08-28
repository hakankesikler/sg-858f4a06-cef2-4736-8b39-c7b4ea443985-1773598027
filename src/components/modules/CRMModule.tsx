import { useState, useEffect, useMemo } from "react";
import { Search, Plus, Building2, Eye, Edit, Archive, Users, Filter, CreditCard, KeyRound, Copy, ExternalLink, Trash2, GitMerge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { downloadExcel, readExcelObjects } from "@/lib/excel";
import { customerPortalService } from "@/services/customerPortalService";
import { hasPermission, type PermissionMap } from "@/lib/staff-permissions";

// Helper function to normalize Turkish characters for search
const normalizeTurkish = (str: string): string => {
  const normalized = str
    .replace(/İ/g, 'i')  // FIXED: İ (capital Turkish i) -> i (lowercase)
    .replace(/ı/g, 'i')  // ı (lowercase Turkish i) -> i
    .replace(/I/g, 'i')  // I (English capital i) -> i
    .replace(/Ş/g, 's')
    .replace(/ş/g, 's')
    .replace(/Ğ/g, 'g')
    .replace(/ğ/g, 'g')
    .replace(/Ü/g, 'u')
    .replace(/ü/g, 'u')
    .replace(/Ö/g, 'o')
    .replace(/ö/g, 'o')
    .replace(/Ç/g, 'c')
    .replace(/ç/g, 'c')
    .toLowerCase();
  
  return normalized;
};

const PAGE_SIZE = 50;

export function CRMModule({ permissions }: { permissions: PermissionMap }) {
  const { toast } = useToast();
  const canManageCustomers = hasPermission(permissions, "crm.customers", "manage");
  const canManagePortalInvites = hasPermission(permissions, "crm.portal_invites", "manage");
  const canExport = hasPermission(permissions, "crm.exports", "view");
  const canMerge = hasPermission(permissions, "crm.settings", "manage");
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("musteri");
  const [supplierSubCategory, setSupplierSubCategory] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // View/Edit/Delete states
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [archiveReason, setArchiveReason] = useState("");
  const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false);
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [mergeReason, setMergeReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteCustomer, setInviteCustomer] = useState<any>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  
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
  
  // Import state
  const [isImporting, setIsImporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await crmService.getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error("Error loading customers:", error);
      toast({
        title: "Hata",
        description: "Müşteriler yüklenirken bir hata oluştu",
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

  const openPortalInvite = (customer: any) => {
    setInviteCustomer(customer);
    setInviteEmail(customer.authorized_person_email || customer.email || customer.invoice_email || "");
    setInviteLink("");
    setIsInviteDialogOpen(true);
  };

  const createPortalInvite = async () => {
    if (!inviteCustomer || !inviteEmail.trim()) {
      toast({ title: "E-posta gerekli", description: "Müşterinin giriş yapacağı e-posta adresini yazın.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const invite = await customerPortalService.createInvite(inviteCustomer.id, inviteEmail.trim());
      setInviteLink(`${window.location.origin}/musteri-kayit?token=${encodeURIComponent(invite.token)}`);
      toast({ title: "Müşteri portalı daveti hazır", description: "Bağlantı 72 saat boyunca ve tek kullanım için geçerlidir." });
    } catch (error: any) {
      toast({ title: "Davet oluşturulamadı", description: error?.message || "Bu işlem için yönetici yetkisi gerekir.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyInviteLink = async () => {
    await navigator.clipboard.writeText(inviteLink);
    toast({ title: "Davet bağlantısı kopyalandı" });
  };

  const filteredCustomers = useMemo(() => {
    let filtered = customers;

    // Filter by main account type
    if (filterType === "musteri") {
      filtered = filtered.filter(c => c.account_type === "musteri" || !c.account_type);
    } else if (filterType !== "all") {
      filtered = filtered.filter(c => c.account_type === filterType);
    }

    // Filter by supplier sub-category if in tedarikci tab
    if (filterType === "tedarikci" && supplierSubCategory !== "all") {
      filtered = filtered.filter(c => c.supplier_category === supplierSubCategory);
    }

    // Filter by search term with Turkish character normalization
    if (searchTerm) {
      const search = normalizeTurkish(searchTerm);
      filtered = filtered.filter(c => {
        const nameNorm = normalizeTurkish(c.name || '');
        const emailNorm = normalizeTurkish(c.email || '');
        const phoneNorm = normalizeTurkish(c.phone || '');
        const codeNorm = normalizeTurkish(c.customer_code || '');
        
        return nameNorm.includes(search) || emailNorm.includes(search) || phoneNorm.includes(search) || codeNorm.includes(search);
      });
    }
    return filtered;
  }, [customers, filterType, supplierSubCategory, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, supplierSubCategory, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE));
  const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Download Cari Excel template
  const downloadCariTemplate = async () => {
    try {
      const templateData = [
        {
          "Cari Adı": "Örn: Medbar Tıbbi Malzemeler A.Ş",
          "Cari Tipi": "müşteri (veya: tedarikçi, personel, ortak)",
          "Kişi Tipi": "tüzel (veya: gerçek)",
          "Vergi No": "1234567890 (Tüzel kişiler için)",
          "TC No": "12345678901 (Gerçek kişiler için)",
          "Vergi Dairesi": "Örn: Konak Vergi Dairesi",
          "İl": "Örn: İzmir",
          "İlçe": "Örn: Bornova",
          "Adres": "Örn: Atatürk Caddesi No:123",
          "Telefon": "Örn: 0232 123 45 67",
          "E-posta": "Örn: info@medbar.com",
        },
      ];

      await downloadExcel("Cari_Sablonu.xlsx", templateData, "Cari Şablonu");

      toast({
        title: "Başarılı",
        description: "Cari şablonu indirildi",
      });
    } catch (error) {
      console.error("Template download error:", error);
      toast({
        title: "Hata",
        description: "Şablon indirilirken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  const exportCustomers = async () => {
    try {
      await downloadExcel(`Cari_Listesi_${new Date().toISOString().slice(0, 10)}.xlsx`, filteredCustomers.map((customer) => ({
        "Cari Kodu": customer.customer_code || "",
        "Cari Adı": customer.name || "",
        "Cari Tipi": customer.account_type || "",
        "Vergi No": customer.vergi_no || customer.tax_number || "",
        "TC No": customer.tc_no || "",
        "Vergi Dairesi": customer.tax_office || "",
        "İl": customer.city || "",
        "İlçe": customer.district || "",
        "Telefon": customer.phone || "",
        "E-posta": customer.email || "",
        "Durum": customer.status || "",
      })), "Cari Listesi");
      toast({ title: "Başarılı", description: `${filteredCustomers.length} cari Excel olarak indirildi` });
    } catch (error: any) {
      toast({ title: "Excel oluşturulamadı", description: error?.message || "Dışarı aktarma başarısız", variant: "destructive" });
    }
  };

  // Handle Cari Excel import
  const handleCariImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    try {
      if (file.size > 2 * 1024 * 1024) {
        throw new Error("Excel dosyası 2 MB'den büyük olamaz");
      }
      const jsonData = await readExcelObjects(file);
      const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
      const contentHash = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");

      if (jsonData.length > 1000) throw new Error("Tek seferde en fazla 1000 cari aktarılabilir");
      const importRows = jsonData.map((row: any, index) => {
        const accountTypeRaw = String(row["Cari Tipi"] || "müşteri").toLocaleLowerCase("tr-TR");
        const account_type = accountTypeRaw.includes("tedarik") ? "tedarikci" : accountTypeRaw.includes("personel") ? "personel" : accountTypeRaw.includes("ortak") ? "ortak" : "musteri";
        const corporate = String(row["Kişi Tipi"] || "tüzel").toLocaleLowerCase("tr-TR").includes("tüzel");
        const name = String(row["Cari Adı"] || "").trim();
        if (name.length < 2) throw new Error(`Satır ${index + 2}: Cari adı zorunludur`);
        return {
          name, account_type, vergi_no: corporate ? String(row["Vergi No"] || "").trim() || null : null,
          tc_no: corporate ? null : String(row["TC No"] || "").trim() || null,
          tax_office: String(row["Vergi Dairesi"] || "").trim() || null, city: String(row["İl"] || "").trim() || null,
          district: String(row["İlçe"] || "").trim() || null, address: String(row["Adres"] || "").trim() || null,
          phone: String(row["Telefon"] || "").trim() || null, email: String(row["E-posta"] || "").trim().toLowerCase() || null,
        };
      });
      const taxNumbers = importRows.map((row) => row.vergi_no).filter(Boolean);
      if (new Set(taxNumbers).size !== taxNumbers.length) throw new Error("Excel dosyasında aynı vergi numarası birden fazla kez bulunuyor");
      const result = await crmService.bulkImportCustomers(file.name, contentHash, importRows);
      toast({ title: result.already_processed ? "Dosya daha önce aktarılmış" : "İçe Aktarma Tamamlandı", description: `${result.row_count} cari atomik ve denetimli olarak işlendi.` });
      await loadCustomers();
    } catch (error) {
      console.error("Excel import error:", error);
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "Excel dosyası okunurken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const handleEditCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (customer: any) => {
    setSelectedCustomer(customer);
    setArchiveReason("");
    setIsDeleteDialogOpen(true);
  };

  const mergeCustomer = async () => {
    if (!selectedCustomer || !mergeTargetId || mergeReason.trim().length < 10) return;
    setIsSubmitting(true);
    try {
      await crmService.mergeCustomers(selectedCustomer.id, mergeTargetId, mergeReason.trim());
      toast({ title: "Cari kayıtları birleştirildi", description: "Bağlı işler hedef cariye aktarıldı; kaynak kayıt denetim iziyle arşivlendi." });
      setIsMergeDialogOpen(false); setIsDetailDialogOpen(false); setMergeTargetId(""); setMergeReason("");
      await loadCustomers();
    } catch (error: any) {
      toast({ title: "Cari birleştirilemedi", description: error?.message || "İşlem geri alındı.", variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCustomer) return;

    try {
      setIsSubmitting(true);
      await crmService.archiveCustomer(selectedCustomer.id, archiveReason);
      toast({
        title: "Başarılı",
        description: "Cari arşivlendi; geçmiş işlem ve belgeler korundu.",
      });
      setIsDeleteDialogOpen(false);
      setSelectedCustomer(null);
      loadCustomers();
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "Cari arşivlenirken bir hata oluştu",
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
        {canManageCustomers && <Button onClick={() => setIsFormOpen(true)} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Cari Oluştur
        </Button>}
        <Button onClick={() => void downloadCariTemplate()} variant="outline">
          Excel Şablonu İndir
        </Button>
        {canManageCustomers && <Button
          variant="outline"
          onClick={() => document.getElementById("cari-import-input")?.click()}
          disabled={isImporting}
        >
          {isImporting ? "Yükleniyor..." : "Excel'den Cari Yükle"}
        </Button>}
        <input
          id="cari-import-input"
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={handleCariImport}
          style={{ display: "none" }}
        />
        {canExport && <Button variant="outline" onClick={() => void exportCustomers()}>Excel'e Aktar</Button>}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        <button
          onClick={() => {
            setFilterType("musteri");
            setSupplierSubCategory("all");
          }}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
            filterType === "musteri"
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
      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full min-w-[900px]">
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
            {paginatedCustomers.map((customer) => {
              const vknValue = customer.vergi_no || customer.tc_no || "-";
              return (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input type="checkbox" className="rounded" />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {customer.customer_code || customer.id}
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
                      {canManageCustomers && <button
                        type="button"
                        onClick={() => handleEditCustomer(customer)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title="Düzenle"
                      >
                        <Edit className="h-4 w-4 text-gray-600" />
                      </button>}
                      {canManageCustomers && <button
                        type="button"
                        onClick={() => handleDeleteClick(customer)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title="Arşivle"
                      >
                        <Archive className="h-4 w-4 text-amber-600" />
                      </button>}
                      {canManagePortalInvites && (customer.account_type === "musteri" || !customer.account_type) && (
                        <button
                          type="button"
                          onClick={() => openPortalInvite(customer)}
                          className="p-1 hover:bg-blue-50 rounded transition-colors"
                          title="Müşteri portalı daveti oluştur"
                        >
                          <KeyRound className="h-4 w-4 text-blue-600" />
                        </button>
                      )}
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
        {filteredCustomers.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t px-4 py-3 bg-white">
            <span className="text-sm text-gray-600">{filteredCustomers.length} kayıttan {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, filteredCustomers.length)} arası</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}>Önceki</Button>
              <span className="text-sm">{currentPage} / {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages}>Sonraki</Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Form Dialog */}
      <CariForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={loadCustomers}
      />

      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Kurumsal Müşteri Portalı Daveti</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-900">
              <strong>{inviteCustomer?.name}</strong> kullanıcısı yalnızca kendi şirketine ait sevkiyatları ve teslim evraklarını görebilir.
            </div>
            <div>
              <Label htmlFor="portal-invite-email">Giriş yapacak kişinin e-posta adresi</Label>
              <Input id="portal-invite-email" type="email" value={inviteEmail} onChange={(event) => { setInviteEmail(event.target.value); setInviteLink(""); }} className="mt-1" placeholder="musteri@firma.com" disabled={Boolean(inviteLink)} />
            </div>
            {inviteLink && (
              <div className="space-y-2">
                <Label>Tek kullanımlık hesap açma bağlantısı</Label>
                <div className="flex gap-2"><Input value={inviteLink} readOnly className="font-mono text-xs" /><Button type="button" variant="outline" onClick={copyInviteLink}><Copy className="h-4 w-4" /></Button></div>
                <p className="text-xs text-slate-500">Bağlantı 72 saat geçerlidir. Müşteri bağlantıyı açıp kendi şifresini belirler.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>Kapat</Button>
            {!inviteLink ? <Button onClick={createPortalInvite} disabled={isSubmitting}>{isSubmitting ? "Hazırlanıyor..." : "Davet Bağlantısı Oluştur"}</Button> : <Button onClick={() => window.open(inviteLink, "_blank", "noopener,noreferrer")}><ExternalLink className="h-4 w-4 mr-2" />Bağlantıyı Aç</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                    <p className="font-medium">{selectedCustomer.email || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Telefon</Label>
                    <p className="font-medium">{selectedCustomer.phone || "-"}</p>
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
          {selectedCustomer && canMerge && <DialogFooter><Button variant="outline" className="text-violet-700" onClick={() => { setMergeTargetId(""); setMergeReason(""); setIsMergeDialogOpen(true); }}><GitMerge className="mr-2 h-4 w-4" />Mükerrer Cariyle Birleştir</Button></DialogFooter>}
        </DialogContent>
      </Dialog>

      <Dialog open={isMergeDialogOpen} onOpenChange={setIsMergeDialogOpen}><DialogContent><DialogHeader><DialogTitle>Mükerrer Cari Kayıtlarını Birleştir</DialogTitle></DialogHeader><div className="space-y-4"><div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><strong>{selectedCustomer?.name}</strong> kaynak kayıt olarak arşivlenecek; tüm bağlı işlemler seçtiğiniz hedef cariye aktarılacaktır. İşlem denetim kaydına yazılır.</div><div><Label>Korunacak hedef cari *</Label><select value={mergeTargetId} onChange={(e) => setMergeTargetId(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2"><option value="">Hedef cari seçin</option>{customers.filter((customer) => customer.id !== selectedCustomer?.id && customer.account_type === selectedCustomer?.account_type).map((customer) => <option key={customer.id} value={customer.id}>{customer.name} · {customer.vergi_no || customer.tc_no || customer.customer_code}</option>)}</select></div><div><Label>Birleştirme nedeni * (en az 10 karakter)</Label><Textarea value={mergeReason} onChange={(e) => setMergeReason(e.target.value)} placeholder="Aynı firmaya ait mükerrer kayıt olduğu doğrulandı..." /></div></div><DialogFooter><Button variant="outline" onClick={() => setIsMergeDialogOpen(false)}>Vazgeç</Button><Button onClick={() => void mergeCustomer()} disabled={isSubmitting || !mergeTargetId || mergeReason.trim().length < 10}>Birleştir</Button></DialogFooter></DialogContent></Dialog>

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

      {/* Archive Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cariyi Arşivle</DialogTitle>
          </DialogHeader>
          <p className="text-sm">
            <strong>{selectedCustomer?.name}</strong> isimli cari aktif listeden kaldırılacak.
            Sevkiyat, fatura ve denetim geçmişi silinmeyecektir.
          </p>
          <div className="space-y-2">
            <Label htmlFor="archive-reason">Arşivleme nedeni *</Label>
            <Textarea id="archive-reason" value={archiveReason} onChange={(event) => setArchiveReason(event.target.value)} placeholder="En az 10 karakterle arşivleme nedenini yazın" />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isSubmitting}
            >
              İptal
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700"
              onClick={handleDeleteConfirm}
              disabled={isSubmitting || archiveReason.trim().length < 10}
            >
              {isSubmitting ? "Arşivleniyor..." : "Arşivle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
