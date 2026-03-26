import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CariFormProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  cariType: "gercek" | "tuzel";
  cariKodu: string;
  cariAdi: string;
  cariSoyadi: string;
  cariTipi: string;
  cariKisaAdi: string;
  islemTarihi: string;
  etiketler: string;
  tcKimlikNo: string;
  vergiNo: string;
  vergiDairesi: string;
  mersisNo: string;
  telefonUlkeKodu: string;
  telefonNo: string;
  email: string;
  webSitesi: string;
  faksUlkeKodu: string;
  faksNo: string;
  yurtDisiAdresi: boolean;
  adresTipi: string;
  adres: string;
  il: string;
  ilce: string;
  postaKodu: string;
}

interface FormErrors {
  cariAdi?: string;
  cariSoyadi?: string;
  cariTipi?: string;
  tcKimlikNo?: string;
  vergiNo?: string;
  etiketler?: string;
  vergiDairesi?: string;
  email?: string;
  telefonNo?: string;
  webSitesi?: string;
  postaKodu?: string;
  adresTipi?: string;
  adres?: string;
  il?: string;
  ilce?: string;
}

export function CariForm({ isOpen, onClose }: CariFormProps) {
  const [activeTab, setActiveTab] = useState<"bilgiler" | "detay">("bilgiler");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<FormData>({
    cariType: "gercek",
    cariKodu: "CAR001273",
    cariAdi: "",
    cariSoyadi: "",
    cariTipi: "",
    cariKisaAdi: "",
    islemTarihi: new Date().toISOString().split("T")[0],
    etiketler: "",
    tcKimlikNo: "",
    vergiNo: "",
    vergiDairesi: "",
    mersisNo: "",
    telefonUlkeKodu: "+90",
    telefonNo: "",
    email: "",
    webSitesi: "",
    faksUlkeKodu: "+90",
    faksNo: "",
    yurtDisiAdresi: false,
    adresTipi: "",
    adres: "",
    il: "",
    ilce: "",
    postaKodu: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Cari türü değiştiğinde TC/Vergi No alanlarını temizle
  useEffect(() => {
    if (formData.cariType === "gercek") {
      // Tüzel'den Gerçek'e geçildiğinde Vergi No'yu temizle
      setFormData((prev) => ({ ...prev, vergiNo: "" }));
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.vergiNo;
        return newErrors;
      });
    } else if (formData.cariType === "tuzel") {
      // Gerçek'ten Tüzel'e geçildiğinde TC Kimlik No'yu temizle
      setFormData((prev) => ({ ...prev, tcKimlikNo: "" }));
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.tcKimlikNo;
        return newErrors;
      });
    }
  }, [formData.cariType]);

  // Validation functions
  const validateTCKimlik = (tc: string): boolean => {
    if (!tc) return true; // Optional field
    const cleaned = tc.replace(/\s/g, "");
    return /^\d{11}$/.test(cleaned);
  };

  const validateVergiNo = (vergiNo: string): boolean => {
    if (!vergiNo) return true; // Optional field
    const cleaned = vergiNo.replace(/\s/g, "");
    return /^\d{10}$/.test(cleaned);
  };

  const validateEmail = (email: string): boolean => {
    if (!email) return true; // Optional field
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true; // Optional field
    const cleaned = phone.replace(/\s/g, "");
    return /^\d{10}$/.test(cleaned);
  };

  const validateWebsite = (url: string): boolean => {
    if (!url) return true; // Optional field
    try {
      new URL(url.startsWith("http") ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  const validatePostalCode = (code: string): boolean => {
    if (!code) return true; // Optional field
    return /^\d{5}$/.test(code);
  };

  const validateField = (name: string, value: string) => {
    let error = "";

    // Zorunlu alanlar
    if (name === "cariAdi" && !value.trim()) {
      error = "Cari adı zorunludur";
    }
    if (name === "cariSoyadi" && !value.trim()) {
      error = "Cari soyadı zorunludur";
    }
    if (name === "cariTipi" && !value) {
      error = "Cari tipi seçilmelidir";
    }

    // Cari türüne göre zorunlu alanlar
    if (name === "tcKimlikNo" && formData.cariType === "gercek") {
      if (!value.trim()) {
        error = "T.C. Kimlik No zorunludur";
      } else if (value.length !== 11) {
        error = "T.C. Kimlik No 11 haneli olmalıdır";
      } else if (!/^\d+$/.test(value)) {
        error = "T.C. Kimlik No sadece rakamlardan oluşmalıdır";
      }
    }

    if (name === "vergiNo" && formData.cariType === "tuzel") {
      if (!value.trim()) {
        error = "Vergi No zorunludur";
      } else if (value.length !== 10) {
        error = "Vergi No 10 haneli olmalıdır";
      } else if (!/^\d+$/.test(value)) {
        error = "Vergi No sadece rakamlardan oluşmalıdır";
      }
    }

    return error;
  };

  // Real-time validation
  useEffect(() => {
    const newErrors: FormErrors = {};

    // Required fields
    if (touched.cariAdi && !formData.cariAdi.trim()) {
      newErrors.cariAdi = "Cari adı zorunludur";
    }

    if (touched.cariSoyadi && !formData.cariSoyadi.trim()) {
      newErrors.cariSoyadi = "Cari soyadı zorunludur";
    }

    if (touched.cariTipi && !formData.cariTipi) {
      newErrors.cariTipi = "Cari tipi seçilmelidir";
    }

    // TC Kimlik validation
    if (formData.cariType === "gercek") {
      if (touched.tcKimlikNo && !formData.tcKimlikNo) {
        newErrors.tcKimlikNo = "T.C. Kimlik No zorunludur";
      } else if (touched.tcKimlikNo && formData.tcKimlikNo && !validateTCKimlik(formData.tcKimlikNo)) {
        newErrors.tcKimlikNo = "T.C. Kimlik No 11 haneli olmalıdır";
      }
    }

    // Vergi No validation
    if (formData.cariType === "tuzel") {
      if (touched.vergiNo && !formData.vergiNo) {
        newErrors.vergiNo = "Vergi No zorunludur";
      } else if (touched.vergiNo && formData.vergiNo && !validateVergiNo(formData.vergiNo)) {
        newErrors.vergiNo = "Vergi No 10 haneli olmalıdır";
      }
    }

    // Email validation
    if (touched.email && formData.email && !validateEmail(formData.email)) {
      newErrors.email = "Geçerli bir e-posta adresi giriniz";
    }

    // Phone validation
    if (touched.telefonNo && formData.telefonNo && !validatePhone(formData.telefonNo)) {
      newErrors.telefonNo = "Telefon numarası 10 haneli olmalıdır";
    }

    // Website validation
    if (touched.webSitesi && formData.webSitesi && !validateWebsite(formData.webSitesi)) {
      newErrors.webSitesi = "Geçerli bir web sitesi adresi giriniz";
    }

    // Postal code validation
    if (touched.postaKodu && formData.postaKodu && !validatePostalCode(formData.postaKodu)) {
      newErrors.postaKodu = "Posta kodu 5 haneli olmalıdır";
    }

    setErrors(newErrors);
  }, [formData, touched]);

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const isFormValid = (): boolean => {
    // Check required fields
    if (!formData.cariAdi.trim() || !formData.cariSoyadi.trim() || !formData.cariTipi) {
      return false;
    }

    if (formData.cariType === "gercek" && (!formData.tcKimlikNo || formData.tcKimlikNo.length !== 11)) {
      return false;
    }

    if (formData.cariType === "tuzel" && (!formData.vergiNo || formData.vergiNo.length !== 10)) {
      return false;
    }

    // Check if there are any validation errors
    if (Object.keys(errors).length > 0) {
      return false;
    }

    return true;
  };

  const handleSave = () => {
    // Mark all fields as touched to show validation errors
    const allFields = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setTouched(allFields);

    if (!isFormValid()) {
      return;
    }

    // Here you would normally send data to backend
    console.log("Form data:", formData);
    alert("Cari başarıyla kaydedildi! (Demo - Backend bağlantısı gerekli)");
    onClose();
  };

  const handleClose = () => {
    // Reset form
    setFormData({
      cariType: "gercek",
      cariKodu: "CAR001273",
      cariAdi: "",
      cariSoyadi: "",
      cariTipi: "",
      cariKisaAdi: "",
      islemTarihi: new Date().toISOString().split("T")[0],
      etiketler: "",
      tcKimlikNo: "",
      vergiNo: "",
      vergiDairesi: "",
      mersisNo: "",
      telefonUlkeKodu: "+90",
      telefonNo: "",
      email: "",
      webSitesi: "",
      faksUlkeKodu: "+90",
      faksNo: "",
      yurtDisiAdresi: false,
      adresTipi: "",
      adres: "",
      il: "",
      ilce: "",
      postaKodu: "",
    });
    setTouched({});
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Yeni Genel Cari</h2>
          <button
            onClick={handleClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("bilgiler")}
            className={`flex-1 px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === "bilgiler"
                ? "bg-green-100 text-green-700 border-b-2 border-green-600"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            ▶ Cari Bilgileri
          </button>
          <button
            onClick={() => setActiveTab("detay")}
            className={`flex-1 px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === "detay"
                ? "bg-green-100 text-green-700 border-b-2 border-green-600"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            ▶ Cari Detay Bilgileri
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "bilgiler" && (
            <div className="space-y-6">
              {/* Cari Türü */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-3 block">Cari Türü</Label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="cariType"
                      checked={formData.cariType === "gercek"}
                      onChange={() => handleInputChange("cariType", "gercek")}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Gerçek/Şahıs Şirketi</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="cariType"
                      checked={formData.cariType === "tuzel"}
                      onChange={() => handleInputChange("cariType", "tuzel")}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Tüzel</span>
                  </label>
                </div>
              </div>

              {/* Row 1: Cari Kodu, Adı, Soyadı, Tipi, Kısa Adı, İşlem Tarihi */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <div>
                  <Label htmlFor="cariKodu" className="text-sm font-medium text-gray-700">
                    Cari Kodu
                  </Label>
                  <Input
                    id="cariKodu"
                    value={formData.cariKodu}
                    onChange={(e) => handleInputChange("cariKodu", e.target.value)}
                    className="mt-1"
                    disabled
                  />
                </div>

                <div>
                  <Label htmlFor="cariAdi" className="text-sm font-medium text-gray-700">
                    Cari Adı <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="cariAdi"
                    value={formData.cariAdi}
                    onChange={(e) => handleInputChange("cariAdi", e.target.value)}
                    onBlur={() => handleBlur("cariAdi")}
                    className={`mt-1 ${errors.cariAdi ? "border-red-500" : ""}`}
                    placeholder="Cari adını giriniz"
                  />
                  {errors.cariAdi && (
                    <p className="text-xs text-red-500 mt-1">{errors.cariAdi}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="cariSoyadi" className="text-sm font-medium text-gray-700">
                    Cari Soyadı <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="cariSoyadi"
                    value={formData.cariSoyadi}
                    onChange={(e) => handleInputChange("cariSoyadi", e.target.value)}
                    onBlur={() => handleBlur("cariSoyadi")}
                    className={`mt-1 ${errors.cariSoyadi ? "border-red-500" : ""}`}
                    placeholder="Cari soyadını giriniz"
                  />
                  {errors.cariSoyadi && (
                    <p className="text-xs text-red-500 mt-1">{errors.cariSoyadi}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="cariTipi" className="text-sm font-medium text-gray-700">
                    Cari Tipi <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={formData.cariTipi} 
                    onValueChange={(value) => {
                      handleInputChange("cariTipi", value);
                      handleBlur("cariTipi");
                    }}
                  >
                    <SelectTrigger className={`mt-1 ${errors.cariTipi ? "border-red-500" : ""}`}>
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="musteri">Müşteri</SelectItem>
                      <SelectItem value="tedarikci">Tedarikçi</SelectItem>
                      <SelectItem value="her-ikisi">Her İkisi</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.cariTipi && (
                    <p className="text-xs text-red-500 mt-1">{errors.cariTipi}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="cariKisaAdi" className="text-sm font-medium text-gray-700">
                    Cari Kısa Adı
                  </Label>
                  <Input
                    id="cariKisaAdi"
                    value={formData.cariKisaAdi}
                    onChange={(e) => handleInputChange("cariKisaAdi", e.target.value)}
                    className="mt-1"
                    placeholder="Kısa ad"
                  />
                </div>

                <div>
                  <Label htmlFor="islemTarihi" className="text-sm font-medium text-gray-700">
                    İşlem Tarihi
                  </Label>
                  <Input
                    id="islemTarihi"
                    type="date"
                    value={formData.islemTarihi}
                    onChange={(e) => handleInputChange("islemTarihi", e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Row 2: Etiketler, TC, Vergi Dairesi, Mersis */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="etiketler" className="text-sm font-medium text-gray-700">
                    Etiketler
                  </Label>
                  <Input
                    id="etiketler"
                    value={formData.etiketler}
                    onChange={(e) => handleInputChange("etiketler", e.target.value)}
                    onBlur={() => handleBlur("etiketler")}
                    className={`mt-1 ${errors.etiketler ? "border-red-500" : ""}`}
                    placeholder="Etiketler"
                  />
                </div>

                {/* TC Kimlik No - Sadece Gerçek Kişi için */}
                {formData.cariType === "gercek" && (
                  <div>
                    <Label htmlFor="tcKimlikNo" className="text-sm font-medium text-gray-700">
                      T.C. Kimlik No <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="tcKimlikNo"
                      value={formData.tcKimlikNo}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 11);
                        handleInputChange("tcKimlikNo", value);
                      }}
                      onBlur={() => handleBlur("tcKimlikNo")}
                      className={`mt-1 ${errors.tcKimlikNo ? "border-red-500" : ""}`}
                      placeholder="11 haneli TC kimlik"
                      maxLength={11}
                    />
                    {errors.tcKimlikNo && (
                      <p className="text-xs text-red-500 mt-1">{errors.tcKimlikNo}</p>
                    )}
                  </div>
                )}

                {/* Vergi No - Sadece Tüzel Kişi için */}
                {formData.cariType === "tuzel" && (
                  <div>
                    <Label htmlFor="vergiNo" className="text-sm font-medium text-gray-700">
                      Vergi No <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="vergiNo"
                      value={formData.vergiNo}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                        handleInputChange("vergiNo", value);
                      }}
                      onBlur={() => handleBlur("vergiNo")}
                      className={`mt-1 ${errors.vergiNo ? "border-red-500" : ""}`}
                      placeholder="10 haneli Vergi No"
                      maxLength={10}
                    />
                    {errors.vergiNo && (
                      <p className="text-xs text-red-500 mt-1">{errors.vergiNo}</p>
                    )}
                  </div>
                )}

                <div>
                  <Label htmlFor="vergiDairesi" className="text-sm font-medium text-gray-700">
                    Vergi Dairesi
                  </Label>
                  <Select value={formData.vergiDairesi} onValueChange={(value) => handleInputChange("vergiDairesi", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kadikoy">Kadıköy Vergi Dairesi</SelectItem>
                      <SelectItem value="besiktas">Beşiktaş Vergi Dairesi</SelectItem>
                      <SelectItem value="sisli">Şişli Vergi Dairesi</SelectItem>
                      <SelectItem value="uskudar">Üsküdar Vergi Dairesi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="mersisNo" className="text-sm font-medium text-gray-700">
                    Mersis No
                  </Label>
                  <Input
                    id="mersisNo"
                    value={formData.mersisNo}
                    onChange={(e) => handleInputChange("mersisNo", e.target.value)}
                    className="mt-1"
                    placeholder="Mersis numarası"
                  />
                </div>
              </div>

              {/* İletişim Bilgileri Section */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-blue-700 mb-4">İletişim Bilgileri</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="telefonNo" className="text-sm font-medium text-gray-700">
                      Telefon No
                    </Label>
                    <div className="flex gap-2 mt-1">
                      <Select value={formData.telefonUlkeKodu} onValueChange={(value) => handleInputChange("telefonUlkeKodu", value)}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="+90">🇹🇷 +90</SelectItem>
                          <SelectItem value="+1">🇺🇸 +1</SelectItem>
                          <SelectItem value="+44">🇬🇧 +44</SelectItem>
                          <SelectItem value="+49">🇩🇪 +49</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        id="telefonNo"
                        value={formData.telefonNo}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                          handleInputChange("telefonNo", value);
                        }}
                        onBlur={() => handleBlur("telefonNo")}
                        className={`flex-1 ${errors.telefonNo ? "border-red-500" : ""}`}
                        placeholder="5XX XXX XX XX"
                        maxLength={10}
                      />
                    </div>
                    {errors.telefonNo && (
                      <p className="text-xs text-red-500 mt-1">{errors.telefonNo}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      E-Posta
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      onBlur={() => handleBlur("email")}
                      className={`mt-1 ${errors.email ? "border-red-500" : ""}`}
                      placeholder="ornek@mail.com"
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="webSitesi" className="text-sm font-medium text-gray-700">
                      Web Sitesi
                    </Label>
                    <Input
                      id="webSitesi"
                      value={formData.webSitesi}
                      onChange={(e) => handleInputChange("webSitesi", e.target.value)}
                      onBlur={() => handleBlur("webSitesi")}
                      className={`mt-1 ${errors.webSitesi ? "border-red-500" : ""}`}
                      placeholder="www.ornek.com"
                    />
                    {errors.webSitesi && (
                      <p className="text-xs text-red-500 mt-1">{errors.webSitesi}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="faksNo" className="text-sm font-medium text-gray-700">
                      Faks No
                    </Label>
                    <div className="flex gap-2 mt-1">
                      <Select value={formData.faksUlkeKodu} onValueChange={(value) => handleInputChange("faksUlkeKodu", value)}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="+90">🇹🇷 +90</SelectItem>
                          <SelectItem value="+1">🇺🇸 +1</SelectItem>
                          <SelectItem value="+44">🇬🇧 +44</SelectItem>
                          <SelectItem value="+49">🇩🇪 +49</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        id="faksNo"
                        value={formData.faksNo}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                          handleInputChange("faksNo", value);
                        }}
                        className="flex-1"
                        placeholder="5XX XXX XX XX"
                        maxLength={10}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Adres Bilgileri Section */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-blue-700 mb-4">Adres Bilgileri</h3>
                
                <div className="mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.yurtDisiAdresi}
                      onChange={(e) => handleInputChange("yurtDisiAdresi", e.target.checked)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Yurt Dışı Adresi</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <Label htmlFor="adresTipi" className="text-sm font-medium text-gray-700">
                      Adres Tipi
                    </Label>
                    <Select value={formData.adresTipi} onValueChange={(value) => handleInputChange("adresTipi", value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="is">İş</SelectItem>
                        <SelectItem value="ev">Ev</SelectItem>
                        <SelectItem value="fatura">Fatura</SelectItem>
                        <SelectItem value="sevkiyat">Sevkiyat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-1 lg:col-span-3">
                    <Label htmlFor="adres" className="text-sm font-medium text-gray-700">
                      Adres
                    </Label>
                    <Textarea
                      id="adres"
                      value={formData.adres}
                      onChange={(e) => handleInputChange("adres", e.target.value)}
                      className="mt-1"
                      rows={3}
                      placeholder="Açık adres giriniz"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="il" className="text-sm font-medium text-gray-700">
                      İl
                    </Label>
                    <Select value={formData.il} onValueChange={(value) => handleInputChange("il", value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="istanbul">İstanbul</SelectItem>
                        <SelectItem value="ankara">Ankara</SelectItem>
                        <SelectItem value="izmir">İzmir</SelectItem>
                        <SelectItem value="bursa">Bursa</SelectItem>
                        <SelectItem value="antalya">Antalya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="ilce" className="text-sm font-medium text-gray-700">
                      İlçe
                    </Label>
                    <Select value={formData.ilce} onValueChange={(value) => handleInputChange("ilce", value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kadikoy">Kadıköy</SelectItem>
                        <SelectItem value="besiktas">Beşiktaş</SelectItem>
                        <SelectItem value="sisli">Şişli</SelectItem>
                        <SelectItem value="uskudar">Üsküdar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="postaKodu" className="text-sm font-medium text-gray-700">
                      Posta Kodu
                    </Label>
                    <Input
                      id="postaKodu"
                      value={formData.postaKodu}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 5);
                        handleInputChange("postaKodu", value);
                      }}
                      onBlur={() => handleBlur("postaKodu")}
                      className={`mt-1 ${errors.postaKodu ? "border-red-500" : ""}`}
                      placeholder="34XXX"
                      maxLength={5}
                    />
                    {errors.postaKodu && (
                      <p className="text-xs text-red-500 mt-1">{errors.postaKodu}</p>
                    )}
                  </div>

                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="destructive"
                      className="w-full"
                    >
                      Sil
                    </Button>
                  </div>
                </div>

                <div className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                  >
                    + Adres Ekle
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "detay" && (
            <div className="text-center py-12 text-gray-500">
              <p>Cari detay bilgileri burada görüntülenecek...</p>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3 bg-gray-50">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="px-6"
          >
            İptal
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!isFormValid()}
            className="px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Kaydet
          </Button>
        </div>
      </div>
    </div>
  );
}