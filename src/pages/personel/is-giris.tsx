import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Package, User, MapPin, Truck, DollarSign, Calendar, FileText, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEO } from "@/components/SEO";

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

export default function IsGiris() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [activeTab, setActiveTab] = useState("temel");
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

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
    if (!formData.gonderici) newErrors.gonderici = "Gönderici zorunludur";
    if (!formData.alici) newErrors.alici = "Alıcı zorunludur";
    if (!formData.cinsi) newErrors.cinsi = "Cinsi seçimi zorunludur";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    console.log("İş Giriş Formu Verileri:", formData);
    alert("İş girişi başarıyla kaydedildi!");
    
    // Reset form
    setFormData(initialFormData);
    setActiveTab("temel");
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setErrors({});
    setActiveTab("temel");
  };

  return (
    <>
      <SEO
        title="İş Giriş Formu - Rex Lojistik"
        description="Yeni sevkiyat kaydı oluşturun"
      />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Link href="/personel/profil">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Geri Dön
                  </Button>
                </Link>
                <div className="h-8 w-px bg-slate-200" />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-slate-900">İş Giriş Formu</h1>
                    <p className="text-sm text-slate-600">Yeni sevkiyat kaydı</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <form onSubmit={handleSubmit}>
            <Card className="shadow-xl border-0">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <CardTitle className="text-2xl flex items-center gap-3">
                  <Package className="w-7 h-7" />
                  Sevkiyat Bilgileri
                </CardTitle>
              </CardHeader>

              <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-4 mb-8">
                    <TabsTrigger value="temel" className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span className="hidden sm:inline">Temel Bilgiler</span>
                      <span className="sm:hidden">Temel</span>
                    </TabsTrigger>
                    <TabsTrigger value="gonderici" className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span className="hidden sm:inline">Gönderici</span>
                      <span className="sm:hidden">Gönderen</span>
                    </TabsTrigger>
                    <TabsTrigger value="alici" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span className="hidden sm:inline">Alıcı</span>
                      <span className="sm:hidden">Alan</span>
                    </TabsTrigger>
                    <TabsTrigger value="urun" className="flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      <span className="hidden sm:inline">Ürün/Hizmet</span>
                      <span className="sm:hidden">Ürün</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Temel Bilgiler Tab */}
                  <TabsContent value="temel" className="space-y-6">
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
                        <Input
                          id="musteri"
                          value={formData.musteri}
                          onChange={(e) => handleInputChange("musteri", e.target.value)}
                          placeholder="Cari kart girişinden gelir"
                          className="bg-green-50"
                        />
                        <p className="text-xs text-slate-500">Cari kart sisteminden otomatik çekilir</p>
                      </div>

                      {/* Tedarikçi (Cari Kart) */}
                      <div className="space-y-2">
                        <Label htmlFor="tedarikci" className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-purple-600" />
                          Tedarikçi (Cari Kart)
                        </Label>
                        <Input
                          id="tedarikci"
                          value={formData.tedarikci}
                          onChange={(e) => handleInputChange("tedarikci", e.target.value)}
                          placeholder="Cari kart girişinden gelir"
                          className="bg-purple-50"
                        />
                        <p className="text-xs text-slate-500">Cari kart sisteminden otomatik çekilir</p>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Gönderici Tab */}
                  <TabsContent value="gonderici" className="space-y-6">
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
                        <Label htmlFor="gondericiIlce">İlçe</Label>
                        <Input
                          id="gondericiIlce"
                          value={formData.gondericiIlce}
                          onChange={(e) => handleInputChange("gondericiIlce", e.target.value)}
                          placeholder="İlçe"
                        />
                      </div>

                      {/* Gönderici İl */}
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="gondericiIl">İl</Label>
                        <Input
                          id="gondericiIl"
                          value={formData.gondericiIl}
                          onChange={(e) => handleInputChange("gondericiIl", e.target.value)}
                          placeholder="İl"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Alıcı Tab */}
                  <TabsContent value="alici" className="space-y-6">
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
                        <Label htmlFor="aliciIlce">İlçe</Label>
                        <Input
                          id="aliciIlce"
                          value={formData.aliciIlce}
                          onChange={(e) => handleInputChange("aliciIlce", e.target.value)}
                          placeholder="İlçe"
                        />
                      </div>

                      {/* Alıcı İl */}
                      <div className="space-y-2">
                        <Label htmlFor="aliciIl">İl</Label>
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
                  </TabsContent>

                  {/* Ürün/Hizmet Tab */}
                  <TabsContent value="urun" className="space-y-6">
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
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Footer Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-lg border">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                className="w-full sm:w-auto px-8"
              >
                Formu Temizle
              </Button>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Link href="/personel/profil" className="w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full px-8"
                  >
                    İptal
                  </Button>
                </Link>
                <Button
                  type="submit"
                  className="w-full sm:w-auto px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  İş Girişini Kaydet
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}