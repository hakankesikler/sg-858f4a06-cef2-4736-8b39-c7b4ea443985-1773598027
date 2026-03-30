import { useState, useEffect } from "react";
import { Building2, User, Bell, Shield, Palette, Globe, Save, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export function SettingsModule() {
  const [activeTab, setActiveTab] = useState("company");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Company Settings
  const [companySettings, setCompanySettings] = useState({
    id: "",
    company_name: "REX LOJİSTİK TAŞIMACILIK DEPOLAMA DANIŞMANLIK LİMİTED ŞİRKET",
    sector: "",
    company_type: "Tüzel",
    phone: "+90 543 401 0755",
    email: "info@rexlojistik.com",
    website: "www.rexlojistik.com",
    country: "TR",
    city: "Bayraklı/İzmir",
    address: "Folkart Towers A Kule No:47/B K:26 D:2601 Adalet Mahallesi Manas Bulvarı",
    tax_id: "7342549288",
    tax_office: "KARSIYAKA VERGİ DAİRESİ",
    mersis_code: "0734259288000001",
    e_invoice_provider: "KolayBi E-Faturam",
    e_invoice_status: "Tanımlı",
    document_type: "Fatura",
    operating_center: "İzmir",
    registration_number: "240976",
    currency: "TRY",
    auto_offsetting: false
  });

  useEffect(() => {
    loadCompanySettings();
  }, []);

  const loadCompanySettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading company settings:", error);
        return;
      }

      if (data) {
        setCompanySettings(data);
      }
    } catch (error) {
      console.error("Error loading company settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveCompanySettings = async () => {
    try {
      setSaving(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("❌ Lütfen giriş yapın!");
        return;
      }

      const settingsData = {
        ...companySettings,
        user_id: user.id,
        updated_at: new Date().toISOString()
      };

      let result;
      if (companySettings.id) {
        // Update existing
        result = await supabase
          .from("company_settings")
          .update(settingsData)
          .eq("id", companySettings.id)
          .select()
          .single();
      } else {
        // Insert new
        result = await supabase
          .from("company_settings")
          .insert([settingsData])
          .select()
          .single();
      }

      if (result.error) {
        console.error("Error saving company settings:", result.error);
        alert("❌ Ayarlar kaydedilirken hata oluştu!");
        return;
      }

      if (result.data) {
        setCompanySettings(result.data);
      }

      alert("✅ Şirket bilgileri başarıyla kaydedildi!");
    } catch (error) {
      console.error("Error saving company settings:", error);
      alert("❌ Ayarlar kaydedilirken hata oluştu!");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Ayarlar</h2>
        <p className="text-gray-600 mt-1">Sistem ve şirket ayarlarınızı yönetin</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Şirket
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Bildirimler
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Güvenlik
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Görünüm
          </TabsTrigger>
          <TabsTrigger value="regional" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Bölgesel
          </TabsTrigger>
        </TabsList>

        {/* Company Settings Tab */}
        <TabsContent value="company">
          <Card className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Şirket Bilgileri</h3>
                  <p className="text-sm text-gray-600">Şirketinizin temel bilgilerini düzenleyin</p>
                </div>
                <Button onClick={saveCompanySettings} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </Button>
              </div>

              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Temel Bilgiler
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="company_name">Şirket Adı *</Label>
                    <Input
                      id="company_name"
                      value={companySettings.company_name}
                      onChange={(e) => setCompanySettings({ ...companySettings, company_name: e.target.value })}
                      placeholder="REX LOJİSTİK..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="sector">Sektör</Label>
                    <Input
                      id="sector"
                      value={companySettings.sector || ""}
                      onChange={(e) => setCompanySettings({ ...companySettings, sector: e.target.value })}
                      placeholder="Lojistik ve Taşımacılık"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company_type">Şirket Tipi</Label>
                    <Select
                      value={companySettings.company_type}
                      onValueChange={(value) => setCompanySettings({ ...companySettings, company_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tüzel">Tüzel</SelectItem>
                        <SelectItem value="Şahıs">Şahıs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  İletişim Bilgileri
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      value={companySettings.phone}
                      onChange={(e) => setCompanySettings({ ...companySettings, phone: e.target.value })}
                      placeholder="+90 543 401 0755"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-posta</Label>
                    <Input
                      id="email"
                      type="email"
                      value={companySettings.email}
                      onChange={(e) => setCompanySettings({ ...companySettings, email: e.target.value })}
                      placeholder="info@rexlojistik.com"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={companySettings.website}
                      onChange={(e) => setCompanySettings({ ...companySettings, website: e.target.value })}
                      placeholder="www.rexlojistik.com"
                    />
                  </div>
                </div>
              </div>

              {/* Address Info */}
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium text-gray-900">Adres Bilgileri</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="country">Ülke</Label>
                    <Input
                      id="country"
                      value={companySettings.country}
                      onChange={(e) => setCompanySettings({ ...companySettings, country: e.target.value })}
                      placeholder="TR"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">Şehir</Label>
                    <Input
                      id="city"
                      value={companySettings.city}
                      onChange={(e) => setCompanySettings({ ...companySettings, city: e.target.value })}
                      placeholder="Bayraklı/İzmir"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="address">Adres</Label>
                    <Textarea
                      id="address"
                      value={companySettings.address}
                      onChange={(e) => setCompanySettings({ ...companySettings, address: e.target.value })}
                      placeholder="Folkart Towers A Kule No:47/B..."
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* Tax Info */}
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium text-gray-900">Vergi Bilgileri</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tax_id">VKN/TCKN</Label>
                    <Input
                      id="tax_id"
                      value={companySettings.tax_id}
                      onChange={(e) => setCompanySettings({ ...companySettings, tax_id: e.target.value })}
                      placeholder="7342549288"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tax_office">Vergi Dairesi</Label>
                    <Input
                      id="tax_office"
                      value={companySettings.tax_office}
                      onChange={(e) => setCompanySettings({ ...companySettings, tax_office: e.target.value })}
                      placeholder="KARSIYAKA VERGİ DAİRESİ"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="mersis_code">MERSİS Kodu</Label>
                    <Input
                      id="mersis_code"
                      value={companySettings.mersis_code}
                      onChange={(e) => setCompanySettings({ ...companySettings, mersis_code: e.target.value })}
                      placeholder="0734259288000001"
                    />
                  </div>
                </div>
              </div>

              {/* E-Invoice Info */}
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium text-gray-900">E-Fatura Bilgileri</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="e_invoice_provider">E-Fatura Sağlayıcısı</Label>
                    <Input
                      id="e_invoice_provider"
                      value={companySettings.e_invoice_provider}
                      onChange={(e) => setCompanySettings({ ...companySettings, e_invoice_provider: e.target.value })}
                      placeholder="KolayBi E-Faturam"
                    />
                  </div>
                  <div>
                    <Label htmlFor="e_invoice_status">E-Fatura Durumu</Label>
                    <Input
                      id="e_invoice_status"
                      value={companySettings.e_invoice_status}
                      onChange={(e) => setCompanySettings({ ...companySettings, e_invoice_status: e.target.value })}
                      placeholder="Tanımlı"
                    />
                  </div>
                  <div>
                    <Label htmlFor="document_type">Kullanılan Belge Türü</Label>
                    <Input
                      id="document_type"
                      value={companySettings.document_type}
                      onChange={(e) => setCompanySettings({ ...companySettings, document_type: e.target.value })}
                      placeholder="Fatura"
                    />
                  </div>
                  <div>
                    <Label htmlFor="operating_center">İşletme Merkezi</Label>
                    <Input
                      id="operating_center"
                      value={companySettings.operating_center}
                      onChange={(e) => setCompanySettings({ ...companySettings, operating_center: e.target.value })}
                      placeholder="İzmir"
                    />
                  </div>
                  <div>
                    <Label htmlFor="registration_number">Sicil Numarası</Label>
                    <Input
                      id="registration_number"
                      value={companySettings.registration_number}
                      onChange={(e) => setCompanySettings({ ...companySettings, registration_number: e.target.value })}
                      placeholder="240976"
                    />
                  </div>
                </div>
              </div>

              {/* Financial Settings */}
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium text-gray-900">Finansal Ayarlar</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="currency">Para Birimi</Label>
                    <Select
                      value={companySettings.currency}
                      onValueChange={(value) => setCompanySettings({ ...companySettings, currency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TRY">TRY - Türk Lirası</SelectItem>
                        <SelectItem value="USD">USD - Amerikan Doları</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - İngiliz Sterlini</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between space-x-2 pt-6">
                    <Label htmlFor="auto_offsetting" className="cursor-pointer">
                      Otomatik Mahsuplaşma
                    </Label>
                    <Switch
                      id="auto_offsetting"
                      checked={companySettings.auto_offsetting}
                      onCheckedChange={(checked) => setCompanySettings({ ...companySettings, auto_offsetting: checked })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Other Tabs (Placeholder) */}
        <TabsContent value="profile">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Kullanıcı Profili</h3>
            <p className="text-gray-600">Kullanıcı profil ayarları yakında eklenecek...</p>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bildirim Ayarları</h3>
            <p className="text-gray-600">Bildirim ayarları yakında eklenecek...</p>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Güvenlik Ayarları</h3>
            <p className="text-gray-600">Güvenlik ayarları yakında eklenecek...</p>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Görünüm Ayarları</h3>
            <p className="text-gray-600">Tema ve görünüm ayarları yakında eklenecek...</p>
          </Card>
        </TabsContent>

        <TabsContent value="regional">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bölgesel Ayarlar</h3>
            <p className="text-gray-600">Dil ve zaman dilimi ayarları yakında eklenecek...</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}