import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { crmService } from "@/services/crmService";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { VergiDairesiSelect } from "@/components/VergiDairesiSelect";
import { IlIlceSelect } from "@/components/IlIlceSelect";

interface CariFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editMode?: boolean;
  initialData?: any;
}

export function CariForm({ isOpen, onClose, onSuccess, editMode = false, initialData }: CariFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("bilgi");
  const [cariTuru, setCariTuru] = useState<"gercek" | "tuzel">("gercek");
  
  // Form states
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    company_name: "",
    tc_no: "",
    vergi_no: "",
    tax_office: "",
    mersis: "",
    ticaret_sicil_no: "",
    short_name: "",
    tags: "",
    phone: "",
    fax: "",
    email: "",
    website: "",
    address: "",
    branch_address: "",
    invoice_email: "",
    city: "",
    district: "",
    postal_code: "",
    account_type: "musteri",
    supplier_category: "",
    authorized_person_name: "",
    authorized_person_phone: "",
    authorized_person_email: "",
    work_area: "",
    specialty: [] as string[],
    payment_method: "",
    payment_day: "",
    bank_name: "",
    iban: "",
    account_holder: "",
    tutar: "",
    address_type: "",
    vade_gunu: "",
    para_birimi: "TRY",
    durumu: "",
    proje: ""
  });

  // Vade states
  const [vadeGunuVar, setVadeGunuVar] = useState(false);
  const [vadeGunuSayisi, setVadeGunuSayisi] = useState("");

  // İskonto states
  const [sabitIskontoVar, setSabitIskontoVar] = useState(false);
  const [sabitIskontoYuzde, setSabitIskontoYuzde] = useState("");

  // Populate form when editing
  useEffect(() => {
    if (editMode && initialData && isOpen) {
      console.log("=== POPULATING FORM FOR EDIT ===", initialData);
      
      // Determine cari türü from data
      const isGercek = !!initialData.tc_no;
      setCariTuru(isGercek ? "gercek" : "tuzel");
      
      // Split name for gerçek kişi
      const nameParts = initialData.name?.split(" ") || [];
      const surname = isGercek && nameParts.length > 1 ? nameParts.pop() : "";
      const firstName = isGercek ? nameParts.join(" ") : "";
      
      setFormData({
        name: firstName || "",
        surname: surname || "",
        company_name: !isGercek ? initialData.name : "",
        tc_no: initialData.tc_no || "",
        vergi_no: initialData.vergi_no || "",
        tax_office: initialData.tax_office || "",
        mersis: initialData.mersis || "",
        ticaret_sicil_no: initialData.ticaret_sicil_no || "",
        short_name: initialData.short_name || "",
        tags: initialData.tags || "",
        phone: initialData.phone || "",
        fax: initialData.fax || "",
        email: initialData.email || "",
        website: initialData.website || "",
        address: initialData.address || "",
        branch_address: initialData.branch_address || "",
        invoice_email: initialData.invoice_email || "",
        city: initialData.city || "",
        district: initialData.district || "",
        postal_code: initialData.postal_code || "",
        account_type: initialData.account_type || "musteri",
        supplier_category: initialData.supplier_category || "",
        authorized_person_name: initialData.authorized_person_name || "",
        authorized_person_phone: initialData.authorized_person_phone || "",
        authorized_person_email: initialData.authorized_person_email || "",
        work_area: initialData.work_area || "",
        specialty: Array.isArray(initialData.specialty) ? initialData.specialty : [],
        payment_method: initialData.payment_method || "",
        payment_day: initialData.payment_day?.toString() || "",
        bank_name: initialData.bank_name || "",
        iban: initialData.iban || "",
        account_holder: initialData.account_holder || "",
        tutar: "",
        address_type: "",
        vade_gunu: initialData.vade_gunu?.toString() || "",
        para_birimi: "TRY",
        durumu: "",
        proje: ""
      });
      
      setVadeGunuVar(!!initialData.vade_gunu);
      setVadeGunuSayisi(initialData.vade_gunu?.toString() || "");
      setSabitIskontoVar(!!initialData.sabit_iskonto);
      setSabitIskontoYuzde(initialData.sabit_iskonto?.toString() || "");
    } else if (!isOpen) {
      // Reset form when closing
      resetForm();
    }
  }, [editMode, initialData, isOpen]);

  const resetForm = () => {
    setFormData({
      name: "",
      surname: "",
      company_name: "",
      tc_no: "",
      vergi_no: "",
      tax_office: "",
      mersis: "",
      ticaret_sicil_no: "",
      short_name: "",
      tags: "",
      phone: "",
      fax: "",
      email: "",
      website: "",
      address: "",
      branch_address: "",
      invoice_email: "",
      city: "",
      district: "",
      postal_code: "",
      account_type: "musteri",
      supplier_category: "",
      authorized_person_name: "",
      authorized_person_phone: "",
      authorized_person_email: "",
      work_area: "",
      specialty: [],
      payment_method: "",
      payment_day: "",
      bank_name: "",
      iban: "",
      account_holder: "",
      tutar: "",
      address_type: "",
      vade_gunu: "",
      para_birimi: "TRY",
      durumu: "",
      proje: ""
    });
    setVadeGunuVar(false);
    setVadeGunuSayisi("");
    setSabitIskontoVar(false);
    setSabitIskontoYuzde("");
    setCariTuru("tuzel");
  };

  const handleSubmit = async () => {
    // Validasyon
    if (cariTuru === "gercek") {
      if (!formData.name.trim()) {
        toast({ title: "Hata", description: "Lütfen cari adını giriniz", variant: "destructive" });
        return;
      }
      if (!formData.surname?.trim()) {
        toast({ title: "Hata", description: "Lütfen cari soyadını giriniz", variant: "destructive" });
        return;
      }
      if (!formData.tc_no || formData.tc_no.length !== 11) {
        toast({ title: "Hata", description: "Lütfen geçerli bir TC Kimlik No giriniz (11 hane)", variant: "destructive" });
        return;
      }
      if (formData.tc_no[0] === "0") {
        toast({ title: "Hata", description: "TC Kimlik No'nun ilk rakamı 0 olamaz", variant: "destructive" });
        return;
      }
    } else {
      if (!formData.company_name?.trim()) {
        toast({ title: "Hata", description: "Lütfen firma ünvanını giriniz", variant: "destructive" });
        return;
      }
      if (!formData.vergi_no || formData.vergi_no.length !== 10) {
        toast({ title: "Hata", description: "Lütfen geçerli bir Vergi No giriniz (10 hane)", variant: "destructive" });
        return;
      }
    }

    if (!formData.account_type) {
      toast({ title: "Hata", description: "Lütfen cari tipini seçiniz", variant: "destructive" });
      return;
    }

    if (!formData.phone?.trim()) {
      toast({ title: "Hata", description: "Lütfen telefon numarası giriniz", variant: "destructive" });
      return;
    }

    if (!formData.email?.trim()) {
      toast({ title: "Hata", description: "Lütfen e-posta adresi giriniz", variant: "destructive" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({ title: "Hata", description: "Lütfen geçerli bir e-posta adresi giriniz", variant: "destructive" });
      return;
    }

    // Vade Günü validasyonu
    if (vadeGunuVar && vadeGunuSayisi) {
      const vade = parseInt(vadeGunuSayisi);
      if (vade < 1 || vade > 999) {
        toast({ title: "Hata", description: "Vade günü 1-999 arasında olmalıdır", variant: "destructive" });
        return;
      }
    }

    // Sabit İskonto validasyonu
    if (sabitIskontoVar && sabitIskontoYuzde) {
      const iskonto = parseFloat(sabitIskontoYuzde);
      if (iskonto < 0 || iskonto > 100) {
        toast({ title: "Hata", description: "Sabit iskonto 0-100 arasında olmalıdır", variant: "destructive" });
        return;
      }
    }

    // Tutar validasyonu
    if (formData.tutar) {
      const tutar = parseFloat(formData.tutar);
      if (tutar < 0) {
        toast({ title: "Hata", description: "Tutar negatif olamaz", variant: "destructive" });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const submitData = {
        name: cariTuru === "gercek" 
          ? `${formData.name} ${formData.surname}`.trim() 
          : formData.company_name,
        email: formData.email,
        phone: formData.phone,
        account_type: formData.account_type,
        supplier_category: formData.account_type === "tedarikci" ? (formData.supplier_category || null) : null,
        status: "Aktif",
        tc_no: cariTuru === "gercek" ? formData.tc_no : null,
        vergi_no: cariTuru === "tuzel" ? formData.vergi_no : null,
        tax_office: formData.tax_office || null,
        mersis: formData.mersis || null,
        ticaret_sicil_no: formData.ticaret_sicil_no || null,
        short_name: formData.short_name || null,
        tags: formData.tags || null,
        website: formData.website || null,
        fax: formData.fax || null,
        address: formData.address || null,
        branch_address: formData.branch_address || null,
        invoice_email: formData.invoice_email || null,
        city: formData.city || null,
        district: formData.district || null,
        postal_code: formData.postal_code || null,
        vade_gunu: vadeGunuVar && vadeGunuSayisi ? parseInt(vadeGunuSayisi) : null,
        sabit_iskonto: sabitIskontoVar && sabitIskontoYuzde ? parseFloat(sabitIskontoYuzde) : null,
        // Nakliyeci specific fields
        authorized_person_name: formData.authorized_person_name || null,
        authorized_person_phone: formData.authorized_person_phone || null,
        authorized_person_email: formData.authorized_person_email || null,
        work_area: formData.work_area || null,
        specialty: formData.specialty.length > 0 ? formData.specialty : null,
        payment_method: formData.payment_method || null,
        payment_day: formData.payment_day ? parseInt(formData.payment_day) : null,
        bank_name: formData.bank_name || null,
        iban: formData.iban || null,
        account_holder: formData.account_holder || null
      };

      console.log("=== CARİ FORM SUBMIT ===");
      console.log("Mode:", editMode ? "UPDATE" : "CREATE");
      console.log("Submit Data:", submitData);

      if (editMode && initialData?.id) {
        // Update existing customer
        await crmService.updateCustomer(initialData.id, submitData as any);
        toast({
          title: "Başarılı",
          description: "Cari hesap başarıyla güncellendi",
        });
      } else {
        // Create new customer
        await crmService.createCustomer(submitData as any);
        toast({
          title: "Başarılı",
          description: "Cari hesap başarıyla oluşturuldu",
        });
      }

      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error("Error saving customer:", error);
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "Cari kaydedilirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editMode ? "Cari Düzenle" : "Yeni Cari Oluştur"}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="bilgi" className="w-full">
          <TabsList className="w-full rounded-none border-b">
            <TabsTrigger 
              value="bilgi" 
              className="flex-1 data-[state=active]:bg-green-100 data-[state=active]:text-green-700 data-[state=active]:border-b-2 data-[state=active]:border-green-600"
            >
              ✓ Cari Bilgileri
            </TabsTrigger>
            <TabsTrigger 
              value="detay"
              className="flex-1 data-[state=active]:bg-green-100 data-[state=active]:text-green-700 data-[state=active]:border-b-2 data-[state=active]:border-green-600"
            >
              ▶ Cari Detay Bilgileri
            </TabsTrigger>
          </TabsList>

          {/* Cari Bilgileri Tab */}
          <TabsContent value="bilgi" className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Cari Türü */}
            <div className="space-y-2">
              <Label>Cari Türü</Label>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="cariTuru"
                    checked={cariTuru === "gercek"}
                    onChange={() => setCariTuru("gercek")}
                    className="w-4 h-4"
                  />
                  <span>Gerçek/Şahıs Şirketi</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="cariTuru"
                    checked={cariTuru === "tuzel"}
                    onChange={() => setCariTuru("tuzel")}
                    className="w-4 h-4"
                  />
                  <span>Tüzel Kişi</span>
                </label>
              </div>
            </div>

            {cariTuru === "gercek" ? (
              <>
                {/* Gerçek/Şahıs Şirketi Formu */}
                {/* Row 1: Cari Kodu, Adı, Soyadı, Tipi, Kısa Adı, İşlem Tarihi */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div className="space-y-2">
                    <Label>Cari Kodu</Label>
                    <Input value="CAR001295" disabled className="bg-gray-50" />
                  </div>
                  <div className="space-y-2">
                    <Label>Cari Adı *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder=""
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cari Soyadı *</Label>
                    <Input 
                      placeholder=""
                      value={formData.surname}
                      onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cari Tipi <span className="text-red-500">*</span></Label>
                    <select
                      value={formData.account_type}
                      onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="musteri">Müşteri</option>
                      <option value="tedarikci">Tedarikçi</option>
                      <option value="personel">Personel</option>
                      <option value="ortak">Ortak</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Cari Kısa Adı</Label>
                    <Input 
                      placeholder=""
                      value={formData.short_name}
                      onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>İşlem Tarihi</Label>
                    <Input type="date" defaultValue="2026-04-12" />
                  </div>
                </div>

                {/* Row 2: Etiketler, TC Kimlik, Vergi Dairesi, Mersis No */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Etiketler</Label>
                    <Input 
                      placeholder=""
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>T.C. Kimlik No *</Label>
                    <Input 
                      placeholder="" 
                      maxLength={11}
                      pattern="[1-9][0-9]{10}"
                      title="11 haneli TC Kimlik No (ilk rakam 0 olamaz)"
                      value={formData.tc_no}
                      onChange={(e) => setFormData({ ...formData, tc_no: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Vergi Dairesi</Label>
                    <VergiDairesiSelect
                      value={formData.tax_office}
                      onChange={(value) => setFormData(prev => ({ ...prev, tax_office: value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mersis No</Label>
                    <Input 
                      placeholder=""
                      value={formData.mersis}
                      onChange={(e) => setFormData({ ...formData, mersis: e.target.value })}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Tüzel Kişi Formu */}
                {/* Row 1: Cari Kodu, Firma Ünvanı (col-span-2), Tipi, Kısa Adı, İşlem Tarihi */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div className="space-y-2">
                    <Label>Cari Kodu</Label>
                    <Input value="CAR001295" disabled className="bg-gray-50" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Firma Ünvanı *</Label>
                    <Input
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      placeholder="Şirket ünvanını giriniz"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cari Tipi <span className="text-red-500">*</span></Label>
                    <select
                      value={formData.account_type}
                      onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="musteri">Müşteri</option>
                      <option value="tedarikci">Tedarikçi</option>
                      <option value="personel">Personel</option>
                      <option value="ortak">Ortak</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Cari Kısa Adı</Label>
                    <Input 
                      placeholder=""
                      value={formData.short_name}
                      onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>İşlem Tarihi</Label>
                    <Input type="date" defaultValue="2026-04-12" />
                  </div>
                </div>

                {/* Row 2: Etiketler, Vergi Numarası, Vergi Dairesi, Mersis No */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Etiketler</Label>
                    <Input 
                      placeholder=""
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Vergi Numarası *</Label>
                    <Input 
                      placeholder="" 
                      maxLength={10}
                      pattern="[0-9]{10}"
                      title="10 haneli Vergi Numarası"
                      value={formData.vergi_no}
                      onChange={(e) => setFormData({ ...formData, vergi_no: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Vergi Dairesi</Label>
                    <VergiDairesiSelect
                      value={formData.tax_office}
                      onChange={(value) => setFormData(prev => ({ ...prev, tax_office: value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mersis No</Label>
                    <Input 
                      placeholder=""
                      value={formData.mersis}
                      onChange={(e) => setFormData({ ...formData, mersis: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}

            {/* İletişim Bilgileri */}
            <div className="space-y-4 mt-6">
              <h3 className="text-lg font-semibold border-b pb-2">İletişim Bilgileri</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Telefon No *</Label>
                  <div className="flex gap-2">
                    <Select defaultValue="+90">
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="+90">🇹🇷</SelectItem>
                        <SelectItem value="+1">🇺🇸</SelectItem>
                        <SelectItem value="+44">🇬🇧</SelectItem>
                        <SelectItem value="+49">🇩🇪</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input 
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="0501 234 5678"
                      className="flex-1"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>E-Posta *</Label>
                  <Input 
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder=""
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Web Sitesi</Label>
                  <Input 
                    placeholder=""
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Faks No</Label>
                  <div className="flex gap-2">
                    <Select defaultValue="+90">
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="+90">🇹🇷</SelectItem>
                        <SelectItem value="+1">🇺🇸</SelectItem>
                        <SelectItem value="+44">🇬🇧</SelectItem>
                        <SelectItem value="+49">🇩🇪</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input 
                      placeholder="0501 234 5678"
                      className="flex-1"
                      value={formData.fax}
                      onChange={(e) => setFormData({ ...formData, fax: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Adres Bilgileri */}
            <div className="space-y-4 mt-6">
              <h3 className="text-lg font-semibold border-b pb-2">Adres Bilgileri</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Yurt Dışı Adresi</span>
                </label>
              </div>
              
              {/* Adres Row 1: Adres Tipi | Adres (max width) | Sil */}
              <div className="flex gap-4 items-start">
                <div className="space-y-2 w-40">
                  <Label>Adres Tipi</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fatura">Fatura Adresi</SelectItem>
                      <SelectItem value="teslimat">Teslimat Adresi</SelectItem>
                      <SelectItem value="merkez">Merkez Adresi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 flex-1">
                  <Label>Adres</Label>
                  <textarea 
                    className="w-full min-h-[120px] px-3 py-2 border rounded-md resize-none"
                    placeholder=""
                  />
                </div>
                <div className="space-y-2">
                  <Label className="invisible">Sil</Label>
                  <Button variant="destructive" size="sm" className="h-10 px-6">Sil</Button>
                </div>
              </div>

              {/* Adres Row 2: Posta Kodu | İl | İlçe */}
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Posta Kodu</Label>
                    <Input 
                      placeholder=""
                      value={formData.postal_code}
                      onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    />
                  </div>
                </div>
                <IlIlceSelect
                  ilValue={formData.city || ""}
                  ilceValue={formData.district || ""}
                  onIlChange={(value) => setFormData({ ...formData, city: value })}
                  onIlceChange={(value) => setFormData({ ...formData, district: value })}
                />
              </div>

              <Button variant="outline" size="sm" className="gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Adres Ekle
              </Button>
            </div>

            {/* Nakliyeci Specific Fields */}
            {formData.account_type === "tedarikci" && formData.supplier_category === "nakliyeci" && (
              <>
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4">Nakliyeciye Özel Bilgiler</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Ticaret Sicil No */}
                    <div className="space-y-2">
                      <Label>Ticaret Sicil No</Label>
                      <Input
                        type="text"
                        value={formData.ticaret_sicil_no}
                        onChange={(e) => setFormData({ ...formData, ticaret_sicil_no: e.target.value })}
                        placeholder="Ticaret sicil numarası"
                      />
                    </div>

                    {/* Fatura E-posta */}
                    <div className="space-y-2">
                      <Label>Fatura / E-Fatura E-posta</Label>
                      <Input
                        type="email"
                        value={formData.invoice_email}
                        onChange={(e) => setFormData({ ...formData, invoice_email: e.target.value })}
                        placeholder="fatura@firma.com"
                      />
                    </div>

                    {/* Şube Adresi */}
                    <div className="space-y-2 md:col-span-2">
                      <Label>Şube Adresi (varsa)</Label>
                      <Input
                        type="text"
                        value={formData.branch_address}
                        onChange={(e) => setFormData({ ...formData, branch_address: e.target.value })}
                        placeholder="Şube adresi"
                      />
                    </div>
                  </div>
                </div>

                {/* Yetkili Bilgileri */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4">Yetkili Bilgileri</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Yetkili Adı Soyadı</Label>
                      <Input
                        type="text"
                        value={formData.authorized_person_name}
                        onChange={(e) => setFormData({ ...formData, authorized_person_name: e.target.value })}
                        placeholder="Ad Soyad"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Yetkili Telefonu</Label>
                      <Input
                        type="tel"
                        value={formData.authorized_person_phone}
                        onChange={(e) => setFormData({ ...formData, authorized_person_phone: e.target.value })}
                        placeholder="0555 555 55 55"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Yetkili E-posta</Label>
                      <Input
                        type="email"
                        value={formData.authorized_person_email}
                        onChange={(e) => setFormData({ ...formData, authorized_person_email: e.target.value })}
                        placeholder="yetkili@firma.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Operasyonel Bilgiler */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4">Operasyonel Bilgiler</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Çalışma Bölgesi */}
                    <div className="space-y-2">
                      <Label>Çalışma Bölgesi</Label>
                      <select
                        value={formData.work_area}
                        onChange={(e) => setFormData({ ...formData, work_area: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="">Seçiniz</option>
                        <option value="turkiye_geneli">Türkiye Geneli</option>
                        <option value="bolgesel">Bölgesel</option>
                      </select>
                    </div>

                    {/* Ödeme Şekli */}
                    <div className="space-y-2">
                      <Label>Ödeme Şekli</Label>
                      <select
                        value={formData.payment_method}
                        onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="">Seçiniz</option>
                        <option value="nakit">Nakit</option>
                        <option value="havale">Havale</option>
                        <option value="vadeli">Vadeli</option>
                      </select>
                    </div>

                    {/* Ödeme Günü */}
                    <div className="space-y-2">
                      <Label>Ödeme Günü</Label>
                      <select
                        value={formData.payment_day}
                        onChange={(e) => setFormData({ ...formData, payment_day: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="">Seçiniz</option>
                        <option value="7">7 Gün</option>
                        <option value="15">15 Gün</option>
                        <option value="30">30 Gün</option>
                        <option value="45">45 Gün</option>
                        <option value="60">60 Gün</option>
                      </select>
                    </div>

                    {/* Uzmanlık - Multiple checkbox */}
                    <div className="space-y-2">
                      <Label>Uzmanlık</Label>
                      <div className="space-y-2 border rounded-md p-3">
                        {["parsiyel", "komple", "frigo", "agir_yuk", "diger"].map((spec) => (
                          <label key={spec} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formData.specialty.includes(spec)}
                              onChange={(e) => {
                                const newSpecialty = e.target.checked
                                  ? [...formData.specialty, spec]
                                  : formData.specialty.filter(s => s !== spec);
                                setFormData({ ...formData, specialty: newSpecialty });
                              }}
                              className="rounded"
                            />
                            <span className="capitalize">
                              {spec === "agir_yuk" ? "Ağır Yük" : 
                               spec === "diger" ? "Diğer" : spec}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Banka Bilgileri */}
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-4">Banka Bilgileri</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Banka Adı</Label>
                      <Input
                        type="text"
                        value={formData.bank_name}
                        onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                        placeholder="Banka adı"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Hesap Sahibi</Label>
                      <Input
                        type="text"
                        value={formData.account_holder}
                        onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
                        placeholder="Hesap sahibi adı"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>IBAN</Label>
                      <Input
                        type="text"
                        value={formData.iban}
                        onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                        placeholder="TR00 0000 0000 0000 0000 0000 00"
                        maxLength={32}
                      />
                    </div>
                  </div>
                </div>

                {/* Sürücü ve Araç bilgileri için not */}
                <div className="border-t pt-6 mt-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Not:</strong> Sürücü ve araç bilgileri cari kaydedildikten sonra cari detay sayfasından eklenebilir.
                    </p>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* Cari Detay Bilgileri Tab */}
          <TabsContent value="detay" className="flex-1 overflow-y-auto p-6 space-y-6">
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
                </div>
                {vadeGunuVar && (
                  <div className="mt-2">
                    <Select value={vadeGunuSayisi} onValueChange={setVadeGunuSayisi}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="7 Gün Vade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 Gün Vade</SelectItem>
                        <SelectItem value="15">15 Gün Vade</SelectItem>
                        <SelectItem value="30">30 Gün Vade</SelectItem>
                        <SelectItem value="45">45 Gün Vade</SelectItem>
                        <SelectItem value="60">60 Gün Vade</SelectItem>
                        <SelectItem value="90">90 Gün Vade</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            {/* Diğer Bilgiler - Sabit İskonto */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Diğer Bilgiler</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Input 
                    type="number" 
                    placeholder="0,00"
                    min="0"
                    step="0.01"
                    value={formData.tutar}
                    onChange={(e) => setFormData({ ...formData, tutar: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Para Birimi *</Label>
                  <Select
                    value={formData.para_birimi}
                    onValueChange={(value) => setFormData({ ...formData, para_birimi: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="TRY" />
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
                  <Label>Durumu</Label>
                  <Select
                    value={formData.durumu}
                    onValueChange={(value) => setFormData({ ...formData, durumu: value })}
                  >
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
                  <Select
                    value={formData.proje}
                    onValueChange={(value) => setFormData({ ...formData, proje: value })}
                  >
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>İşlem Tarihi</Label>
                  <Input type="date" defaultValue="2026-04-10" />
                </div>
                <div className="space-y-2">
                  <Label>Vade Tarihi Var Mı?</Label>
                  <div className="flex items-center gap-4 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="vadeTarihi" className="w-4 h-4" defaultChecked />
                      <span>Yok</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="vadeTarihi" className="w-4 h-4" />
                      <span>Var</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-gray-500">
                <svg className="inline w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Ayarlar sayfasından Proje Takip seçeneğini kapatabilirsiniz.
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
        </Tabs>

        {/* Footer Buttons */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-between gap-3 bg-gray-50">
          {activeTab === "bilgi" ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab("detay")}
              >
                Cari Detay Bilgileri
              </Button>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleClose}
                >
                  Vazgeç
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab("bilgi")}
              >
                Geri
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}