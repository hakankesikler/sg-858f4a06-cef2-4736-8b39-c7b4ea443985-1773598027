import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { crmService } from "@/services/crmService";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CariFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CariForm({ isOpen, onClose, onSuccess }: CariFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("bilgi");
  const [cariTuru, setCariTuru] = useState<"gercek" | "tuzel">("gercek");
  
  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    account_type: "",
  });

  // Vade states
  const [vadeGunuVar, setVadeGunuVar] = useState(false);
  const [vadeGunuSayisi, setVadeGunuSayisi] = useState("");

  // İskonto states
  const [sabitIskontoVar, setSabitIskontoVar] = useState(false);
  const [sabitIskontoYuzde, setSabitIskontoYuzde] = useState("");

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await crmService.createCustomer({
        name: formData.name || "Yeni Cari",
        email: formData.email || "info@cari.com",
        phone: formData.phone,
        account_type: formData.account_type || "musteri",
        status: "Aktif"
      } as any);

      toast({
        title: "Başarılı",
        description: "Cari başarıyla oluşturuldu",
      });

      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error("Error creating customer:", error);
      toast({
        title: "Hata",
        description: "Cari oluşturulurken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      account_type: "",
    });
    setActiveTab("bilgi");
    setCariTuru("gercek");
    setVadeGunuVar(false);
    setVadeGunuSayisi("");
    setSabitIskontoVar(false);
    setSabitIskontoYuzde("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[90vw] lg:max-w-[1400px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni Genel Cari</DialogTitle>
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
                    <Label>Cari Adı</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder=""
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cari Soyadı</Label>
                    <Input placeholder="" />
                  </div>
                  <div className="space-y-2">
                    <Label>Cari Tipi</Label>
                    <Select
                      value={formData.account_type}
                      onValueChange={(value) => setFormData({ ...formData, account_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="musteri">Müşteri</SelectItem>
                        <SelectItem value="tedarikci">Tedarikçi</SelectItem>
                        <SelectItem value="personel">Personel</SelectItem>
                        <SelectItem value="ortak">Ortak</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Cari Kısa Adı</Label>
                    <Input placeholder="" />
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
                    <Input placeholder="" />
                  </div>
                  <div className="space-y-2">
                    <Label>T.C. Kimlik No</Label>
                    <Input 
                      placeholder="" 
                      maxLength={11}
                      pattern="[1-9][0-9]{10}"
                      title="11 haneli TC Kimlik No (ilk rakam 0 olamaz)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Vergi Dairesi</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kadikoy">Kadıköy</SelectItem>
                        <SelectItem value="besiktas">Beşiktaş</SelectItem>
                        <SelectItem value="sisli">Şişli</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Mersis No</Label>
                    <Input placeholder="" />
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
                    <Label>Firma Ünvanı</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Şirket ünvanını giriniz"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cari Tipi</Label>
                    <Select
                      value={formData.account_type}
                      onValueChange={(value) => setFormData({ ...formData, account_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="musteri">Müşteri</SelectItem>
                        <SelectItem value="tedarikci">Tedarikçi</SelectItem>
                        <SelectItem value="personel">Personel</SelectItem>
                        <SelectItem value="ortak">Ortak</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Cari Kısa Adı</Label>
                    <Input placeholder="" />
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
                    <Input placeholder="" />
                  </div>
                  <div className="space-y-2">
                    <Label>Vergi Numarası</Label>
                    <Input 
                      placeholder="" 
                      maxLength={10}
                      pattern="[0-9]{10}"
                      title="10 haneli Vergi Numarası"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Vergi Dairesi</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kadikoy">Kadıköy</SelectItem>
                        <SelectItem value="besiktas">Beşiktaş</SelectItem>
                        <SelectItem value="sisli">Şişli</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Mersis No</Label>
                    <Input placeholder="" />
                  </div>
                </div>
              </>
            )}

            {/* İletişim Bilgileri */}
            <div className="space-y-4 mt-6">
              <h3 className="text-lg font-semibold border-b pb-2">İletişim Bilgileri</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Telefon No</Label>
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
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>E-Posta</Label>
                  <Input 
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder=""
                  />
                </div>
                <div className="space-y-2">
                  <Label>Web Sitesi</Label>
                  <Input placeholder="" />
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
              
              {/* Adres Row 1 */}
              <div className="flex gap-4 items-start">
                <div className="space-y-2" style={{ width: '150px' }}>
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
                    className="w-full min-h-[80px] px-3 py-2 border rounded-md resize-none"
                    placeholder=""
                  />
                </div>
                <div className="space-y-2" style={{ width: '150px' }}>
                  <Label>İl</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="istanbul">İstanbul</SelectItem>
                      <SelectItem value="ankara">Ankara</SelectItem>
                      <SelectItem value="izmir">İzmir</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2" style={{ width: '150px' }}>
                  <Label>İlçe</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kadikoy">Kadıköy</SelectItem>
                      <SelectItem value="besiktas">Beşiktaş</SelectItem>
                      <SelectItem value="sisli">Şişli</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="invisible">Sil</Label>
                  <Button variant="destructive" size="sm" className="h-10">Sil</Button>
                </div>
              </div>

              {/* Adres Row 2 */}
              <div className="flex gap-4">
                <div className="space-y-2" style={{ width: '150px' }}>
                  <Label>Posta Kodu</Label>
                  <Input placeholder="" />
                </div>
              </div>

              <Button variant="outline" size="sm" className="gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Adres Ekle
              </Button>
            </div>
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
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="sabitIskonto"
                        checked={!sabitIskontoVar}
                        onChange={() => {
                          setSabitIskontoVar(false);
                          setSabitIskontoYuzde("");
                        }}
                        className="w-4 h-4"
                      />
                      <span>Yok</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="sabitIskonto"
                        checked={sabitIskontoVar}
                        onChange={() => setSabitIskontoVar(true)}
                        className="w-4 h-4"
                      />
                      <span>Var</span>
                    </label>
                  </div>
                </div>
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
                  <Input type="text" placeholder="0,00" />
                </div>
                <div className="space-y-2">
                  <Label>Para Birimi *</Label>
                  <Select>
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
                  <Select>
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
                  <Select>
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