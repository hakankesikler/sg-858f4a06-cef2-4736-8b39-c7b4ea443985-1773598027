import { useState, useEffect } from "react";
import { X, Package, User, MapPin, Truck, DollarSign, Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { crmService, type Customer } from "@/services/crmService";
import { transportJobService } from "@/services/transportJobService";

interface IsGirisFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  // Temel Bilgiler
  tarih: string;
  teklifNo: string;
  satici: string;
  faturaNo: string;
  tedarikiciFaturaNo: string;
  
  // Müşteri/Tedarikçi (Cari Karttan)
  musteri: string;
  tedarikci: string;
  
  // Gönderici Bilgileri
  gonderici: string;
  gondericiAdres: string;
  gondericiPostaKodu: string;
  gondericiIlce: string;
  gondericiIl: string;
  
  // Alıcı Bilgileri
  alici: string;
  aliciAdres: string;
  aliciPostaKodu: string;
  aliciIlce: string;
  aliciIl: string;
  adet: string;
  
  // Ürün/Hizmet Bilgileri
  cinsi: string;
  kgds: string;
  toplamKgds: string;
  satisBirim: string;
  satisTutar: string;
  maliyet: string;
}

const initialFormData: FormData = {
  tarih: new Date().toISOString().split("T")[0],
  teklifNo: "",
  satici: "",
  faturaNo: "",
  tedarikiciFaturaNo: "",
  musteri: "",
  tedarikci: "",
  gonderici: "",
  gondericiAdres: "",
  gondericiPostaKodu: "",
  gondericiIlce: "",
  gondericiIl: "",
  alici: "",
  aliciAdres: "",
  aliciPostaKodu: "",
  aliciIlce: "",
  aliciIl: "",
  adet: "",
  cinsi: "",
  kgds: "",
  toplamKgds: "",
  satisBirim: "",
  satisTutar: "",
  maliyet: ""
};

const cinsiOptions = [
  "Dosya",
  "Paket",
  "Koli",
  "Palet",
  "Parça",
  "1 Kapak",
  "Yarım Kamyon",
  "2 Kapak",
  "Kamyon",
  "Kırkayak",
  "Tır"
];

export function IsGirisForm({ isOpen, onClose, onSuccess }: IsGirisFormProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [activeTab, setActiveTab] = useState("temel");
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) return;
    crmService.getCustomers().then(setCustomers).catch((error) => toast({
      title: "Cari listesi yüklenemedi",
      description: error?.message,
      variant: "destructive",
    }));
  }, [isOpen, toast]);

  // Toplam KG/DS otomatik hesaplama
  useEffect(() => {
    if (formData.adet && formData.kgds) {
      const adet = parseFloat(formData.adet) || 0;
      const kgds = parseFloat(formData.kgds) || 0;
      const toplam = (adet * kgds).toFixed(2);
      setFormData(prev => ({ ...prev, toplamKgds: toplam }));
    }
  }, [formData.adet, formData.kgds]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    // Zorunlu alanlar
    if (!formData.tarih) newErrors.tarih = "Tarih zorunludur";
    if (!formData.musteri) newErrors.musteri = "Müşteri seçimi zorunludur";
    if (!formData.gonderici) newErrors.gonderici = "Gönderici zorunludur";
    if (!formData.alici) newErrors.alici = "Alıcı zorunludur";
    if (!formData.cinsi) newErrors.cinsi = "Cinsi seçimi zorunludur";
    if (!(Number(formData.adet) > 0)) newErrors.adet = "Adet sıfırdan büyük olmalıdır";
    if (!(Number(formData.kgds) > 0)) newErrors.kgds = "Ağırlık sıfırdan büyük olmalıdır";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      await transportJobService.create({
        job_date: formData.tarih,
        quote_no: formData.teklifNo,
        seller: formData.satici,
        customer_id: formData.musteri,
        supplier_id: formData.tedarikci || null,
        sender_name: formData.gonderici,
        sender_address: formData.gondericiAdres,
        sender_postal_code: formData.gondericiPostaKodu,
        sender_district: formData.gondericiIlce,
        sender_city: formData.gondericiIl,
        receiver_name: formData.alici,
        receiver_address: formData.aliciAdres,
        receiver_postal_code: formData.aliciPostaKodu,
        receiver_district: formData.aliciIlce,
        receiver_city: formData.aliciIl,
        quantity: Number(formData.adet),
        cargo_type: formData.cinsi,
        unit_weight: Number(formData.kgds),
        total_weight: Number(formData.toplamKgds),
        sales_unit_price: Number(formData.satisBirim || 0),
        sales_total: Number(formData.satisTutar || 0),
        cost: Number(formData.maliyet || 0),
        currency: "TRY",
      });
      window.dispatchEvent(new Event("rex:transport-jobs-changed"));
      toast({ title: "İş kaydı oluşturuldu", description: "Onay bekleyen iş emirlerine eklendi." });
      setFormData(initialFormData);
      setActiveTab("temel");
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast({ title: "İş kaydı oluşturulamadı", description: error?.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData(initialFormData);
    setErrors({});
    setActiveTab("temel");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">İş Giriş Formu</h2>
              <p className="text-sm text-blue-100">Yeni iş kaydı oluştur</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className="text-white hover:bg-white/20 rounded-lg"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="temel" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Temel Bilgiler
                </TabsTrigger>
                <TabsTrigger value="gonderici" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Gönderici
                </TabsTrigger>
                <TabsTrigger value="alici" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Alıcı
                </TabsTrigger>
                <TabsTrigger value="urun" className="flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Ürün/Hizmet
                </TabsTrigger>
              </TabsList>

              {/* Temel Bilgiler Tab */}
              <TabsContent value="temel" className="space-y-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Tarih */}
                      <div className="space-y-2">
                        <Label htmlFor="tarih" className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          Tarih <Badge variant="destructive" className="ml-1">Zorunlu</Badge>
                        </Label>
                        <Input
                          id="tarih"
                          type="date"
                          value={formData.tarih}
                          onChange={(e) => handleInputChange("tarih", e.target.value)}
                          className={errors.tarih ? "border-red-500" : ""}
                        />
                        {errors.tarih && <p className="text-sm text-red-500">{errors.tarih}</p>}
                      </div>

                      {/* Teklif No */}
                      <div className="space-y-2">
                        <Label htmlFor="teklifNo">Teklif No</Label>
                        <Input
                          id="teklifNo"
                          value={formData.teklifNo}
                          onChange={(e) => handleInputChange("teklifNo", e.target.value)}
                          placeholder="Teklif numarası giriniz"
                        />
                      </div>

                      {/* Satıcı */}
                      <div className="space-y-2">
                        <Label htmlFor="satici">Satıcı</Label>
                        <Input
                          id="satici"
                          value={formData.satici}
                          onChange={(e) => handleInputChange("satici", e.target.value)}
                          placeholder="Satıcı adı giriniz"
                        />
                      </div>

                      {/* Fatura No */}
                      <div className="space-y-2">
                        <Label htmlFor="faturaNo">Fatura No</Label>
                        <Input
                          id="faturaNo"
                          value={formData.faturaNo}
                          onChange={(e) => handleInputChange("faturaNo", e.target.value)}
                          placeholder="Fatura numarası giriniz"
                        />
                      </div>

                      {/* Tedarikçi Fatura No */}
                      <div className="space-y-2">
                        <Label htmlFor="tedarikiciFaturaNo">Tedarikçi Fatura No</Label>
                        <Input
                          id="tedarikiciFaturaNo"
                          value={formData.tedarikiciFaturaNo}
                          onChange={(e) => handleInputChange("tedarikiciFaturaNo", e.target.value)}
                          placeholder="Tedarikçi fatura numarası"
                        />
                      </div>

                      {/* Müşteri (Cari Kart) */}
                      <div className="space-y-2">
                        <Label htmlFor="musteri" className="flex items-center gap-2">
                          <User className="w-4 h-4 text-green-600" />
                          Müşteri (Cari Kart)
                        </Label>
                        <Select value={formData.musteri} onValueChange={(value) => handleInputChange("musteri", value)}>
                          <SelectTrigger className={errors.musteri ? "border-red-500" : "bg-green-50"}><SelectValue placeholder="Müşteri seçin" /></SelectTrigger>
                          <SelectContent>{customers.map((customer) => customer.id && <SelectItem key={customer.id} value={customer.id}>{customer.customer_code} - {customer.name}</SelectItem>)}</SelectContent>
                        </Select>
                        {errors.musteri && <p className="text-sm text-red-500">{errors.musteri}</p>}
                        <p className="text-xs text-slate-500">Cari kart sisteminden otomatik çekilir</p>
                      </div>

                      {/* Tedarikçi (Cari Kart) */}
                      <div className="space-y-2">
                        <Label htmlFor="tedarikci" className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-purple-600" />
                          Tedarikçi (Cari Kart)
                        </Label>
                        <Select value={formData.tedarikci} onValueChange={(value) => handleInputChange("tedarikci", value)}>
                          <SelectTrigger className="bg-purple-50"><SelectValue placeholder="Tedarikçi seçin (isteğe bağlı)" /></SelectTrigger>
                          <SelectContent>{customers.filter((customer) => customer.account_type === "tedarikci").map((customer) => customer.id && <SelectItem key={customer.id} value={customer.id}>{customer.customer_code} - {customer.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <p className="text-xs text-slate-500">Cari kart sisteminden otomatik çekilir</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Gönderici Tab */}
              <TabsContent value="gonderici" className="space-y-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Gönderici */}
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="gonderici" className="flex items-center gap-2">
                          <User className="w-4 h-4 text-blue-600" />
                          Gönderici <Badge variant="destructive" className="ml-1">Zorunlu</Badge>
                        </Label>
                        <Input
                          id="gonderici"
                          value={formData.gonderici}
                          onChange={(e) => handleInputChange("gonderici", e.target.value)}
                          placeholder="Gönderici adı giriniz"
                          className={errors.gonderici ? "border-red-500" : ""}
                        />
                        {errors.gonderici && <p className="text-sm text-red-500">{errors.gonderici}</p>}
                      </div>

                      {/* Gönderici Adres */}
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="gondericiAdres">Adres</Label>
                        <Input
                          id="gondericiAdres"
                          value={formData.gondericiAdres}
                          onChange={(e) => handleInputChange("gondericiAdres", e.target.value)}
                          placeholder="Gönderici adresi giriniz"
                        />
                      </div>

                      {/* Posta Kodu */}
                      <div className="space-y-2">
                        <Label htmlFor="gondericiPostaKodu">Posta Kodu</Label>
                        <Input
                          id="gondericiPostaKodu"
                          value={formData.gondericiPostaKodu}
                          onChange={(e) => handleInputChange("gondericiPostaKodu", e.target.value)}
                          placeholder="Posta kodu"
                        />
                      </div>

                      {/* Gönderici İlçe */}
                      <div className="space-y-2">
                        <Label htmlFor="gondericiIlce">Gönderici İlçe</Label>
                        <Input
                          id="gondericiIlce"
                          value={formData.gondericiIlce}
                          onChange={(e) => handleInputChange("gondericiIlce", e.target.value)}
                          placeholder="İlçe"
                        />
                      </div>

                      {/* Gönderici İl */}
                      <div className="space-y-2">
                        <Label htmlFor="gondericiIl">Gönderici İl</Label>
                        <Input
                          id="gondericiIl"
                          value={formData.gondericiIl}
                          onChange={(e) => handleInputChange("gondericiIl", e.target.value)}
                          placeholder="İl"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Alıcı Tab */}
              <TabsContent value="alici" className="space-y-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Alıcı */}
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="alici" className="flex items-center gap-2">
                          <User className="w-4 h-4 text-green-600" />
                          Alıcı <Badge variant="destructive" className="ml-1">Zorunlu</Badge>
                        </Label>
                        <Input
                          id="alici"
                          value={formData.alici}
                          onChange={(e) => handleInputChange("alici", e.target.value)}
                          placeholder="Alıcı adı giriniz"
                          className={errors.alici ? "border-red-500" : ""}
                        />
                        {errors.alici && <p className="text-sm text-red-500">{errors.alici}</p>}
                      </div>

                      {/* Alıcı Adres */}
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="aliciAdres">Adres</Label>
                        <Input
                          id="aliciAdres"
                          value={formData.aliciAdres}
                          onChange={(e) => handleInputChange("aliciAdres", e.target.value)}
                          placeholder="Alıcı adresi giriniz"
                        />
                      </div>

                      {/* Posta Kodu */}
                      <div className="space-y-2">
                        <Label htmlFor="aliciPostaKodu">Posta Kodu</Label>
                        <Input
                          id="aliciPostaKodu"
                          value={formData.aliciPostaKodu}
                          onChange={(e) => handleInputChange("aliciPostaKodu", e.target.value)}
                          placeholder="Posta kodu"
                        />
                      </div>

                      {/* Alıcı İlçe */}
                      <div className="space-y-2">
                        <Label htmlFor="aliciIlce">Alıcı İlçe</Label>
                        <Input
                          id="aliciIlce"
                          value={formData.aliciIlce}
                          onChange={(e) => handleInputChange("aliciIlce", e.target.value)}
                          placeholder="İlçe"
                        />
                      </div>

                      {/* Alıcı İl */}
                      <div className="space-y-2">
                        <Label htmlFor="aliciIl">Alıcı İl</Label>
                        <Input
                          id="aliciIl"
                          value={formData.aliciIl}
                          onChange={(e) => handleInputChange("aliciIl", e.target.value)}
                          placeholder="İl"
                        />
                      </div>

                      {/* Adet */}
                      <div className="space-y-2">
                        <Label htmlFor="adet">Adet</Label>
                        <Input
                          id="adet"
                          type="number"
                          step="0.01"
                          value={formData.adet}
                          onChange={(e) => handleInputChange("adet", e.target.value)}
                          placeholder="Adet giriniz"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Ürün/Hizmet Tab */}
              <TabsContent value="urun" className="space-y-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Cinsi */}
                      <div className="space-y-2">
                        <Label htmlFor="cinsi" className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-orange-600" />
                          Cinsi <Badge variant="destructive" className="ml-1">Zorunlu</Badge>
                        </Label>
                        <Select
                          value={formData.cinsi}
                          onValueChange={(value) => handleInputChange("cinsi", value)}
                        >
                          <SelectTrigger className={errors.cinsi ? "border-red-500" : ""}>
                            <SelectValue placeholder="Ürün cinsi seçiniz" />
                          </SelectTrigger>
                          <SelectContent>
                            {cinsiOptions.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.cinsi && <p className="text-sm text-red-500">{errors.cinsi}</p>}
                      </div>

                      {/* KG/DS */}
                      <div className="space-y-2">
                        <Label htmlFor="kgds">KG/DS</Label>
                        <Input
                          id="kgds"
                          type="number"
                          step="0.01"
                          value={formData.kgds}
                          onChange={(e) => handleInputChange("kgds", e.target.value)}
                          placeholder="KG/DS giriniz"
                        />
                      </div>

                      {/* Toplam KG/DS (Otomatik) */}
                      <div className="space-y-2">
                        <Label htmlFor="toplamKgds" className="flex items-center gap-2">
                          Toplam KG/DS
                          <Badge variant="secondary" className="text-xs">Otomatik</Badge>
                        </Label>
                        <Input
                          id="toplamKgds"
                          value={formData.toplamKgds}
                          readOnly
                          className="bg-slate-50"
                          placeholder="Otomatik hesaplanacak"
                        />
                        <p className="text-xs text-slate-500">Adet × KG/DS = Toplam</p>
                      </div>

                      {/* Satış Birim */}
                      <div className="space-y-2">
                        <Label htmlFor="satisBirim" className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          Satış Birim
                        </Label>
                        <Input
                          id="satisBirim"
                          type="number"
                          step="0.01"
                          value={formData.satisBirim}
                          onChange={(e) => handleInputChange("satisBirim", e.target.value)}
                          placeholder="Birim satış fiyatı"
                        />
                      </div>

                      {/* Satış Tutar */}
                      <div className="space-y-2">
                        <Label htmlFor="satisTutar" className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-blue-600" />
                          Satış Tutar
                        </Label>
                        <Input
                          id="satisTutar"
                          type="number"
                          step="0.01"
                          value={formData.satisTutar}
                          onChange={(e) => handleInputChange("satisTutar", e.target.value)}
                          placeholder="Toplam satış tutarı"
                        />
                      </div>

                      {/* Maliyet */}
                      <div className="space-y-2">
                        <Label htmlFor="maliyet" className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-red-600" />
                          Maliyet
                        </Label>
                        <Input
                          id="maliyet"
                          type="number"
                          step="0.01"
                          value={formData.maliyet}
                          onChange={(e) => handleInputChange("maliyet", e.target.value)}
                          placeholder="Maliyet tutarı"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Footer Buttons */}
          <div className="border-t bg-slate-50 px-6 py-4 flex items-center justify-between gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="px-6"
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Package className="w-4 h-4 mr-2" />
              {isSubmitting ? "Kaydediliyor..." : "İş Girişini Kaydet"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
