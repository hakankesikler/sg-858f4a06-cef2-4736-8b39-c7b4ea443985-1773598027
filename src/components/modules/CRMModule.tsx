import { useState, useEffect } from "react";
import { Search, Plus, Building2, Eye, Edit, Trash2 } from "lucide-react";
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

export function CRMModule() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("musteri");
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // View/Edit/Delete states
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm);

    const matchesType = filterType === "all" || customer.account_type === filterType;

    return matchesSearch && matchesType;
  });

  const handleViewCustomer = (customer: any) => {
    console.log("=== VIEW CUSTOMER CLICKED ===", customer);
    setSelectedCustomer(customer);
    setIsViewDialogOpen(true);
  };

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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={() => setFilterType("musteri")}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            filterType === "musteri" ? "bg-gray-900 text-white" : "bg-white border"
          }`}
        >
          <Building2 className="h-4 w-4" />
          Müşteri Cari
        </button>
        <button
          onClick={() => setFilterType("tedarikci")}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            filterType === "tedarikci" ? "bg-gray-900 text-white" : "bg-white border"
          }`}
        >
          <Building2 className="h-4 w-4" />
          Tedarikçi Cari
        </button>
        <button
          onClick={() => setFilterType("personel")}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            filterType === "personel" ? "bg-gray-900 text-white" : "bg-white border"
          }`}
        >
          <Building2 className="h-4 w-4" />
          Personel Cari
        </button>
        <button
          onClick={() => setFilterType("ortak")}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            filterType === "ortak" ? "bg-gray-900 text-white" : "bg-white border"
          }`}
        >
          <Building2 className="h-4 w-4" />
          Ortak Cari
        </button>

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
                        onClick={() => handleViewCustomer(customer)}
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

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cari Detayları</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-500">Ünvan</Label>
                <p className="font-medium">{selectedCustomer.name}</p>
              </div>
              <div>
                <Label className="text-gray-500">Cari Tipi</Label>
                <p className="font-medium">
                  {selectedCustomer.account_type === "musteri"
                    ? "Müşteri"
                    : selectedCustomer.account_type === "tedarikci"
                    ? "Tedarikçi"
                    : selectedCustomer.account_type === "personel"
                    ? "Personel"
                    : "Ortak"}
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
          )}
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