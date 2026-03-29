import { User, Bell, Shield, Database, Globe, Palette } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function SettingsModule() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Ayarlar</h1>
        <p className="text-gray-600 mt-1">Profil ve sistem ayarlarınızı yönetin</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Menu */}
        <div className="space-y-2">
          <Card className="p-4 bg-blue-50 border-blue-200">
            <button className="flex items-center gap-3 w-full p-2 text-left">
              <User className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-900">Profil Bilgileri</span>
            </button>
          </Card>
          <Card className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
            <button className="flex items-center gap-3 w-full p-2 text-left">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">Bildirimler</span>
            </button>
          </Card>
          <Card className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
            <button className="flex items-center gap-3 w-full p-2 text-left">
              <Shield className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">Güvenlik</span>
            </button>
          </Card>
          <Card className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
            <button className="flex items-center gap-3 w-full p-2 text-left">
              <Palette className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">Görünüm</span>
            </button>
          </Card>
          <Card className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
            <button className="flex items-center gap-3 w-full p-2 text-left">
              <Database className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">Veri Yönetimi</span>
            </button>
          </Card>
          <Card className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
            <button className="flex items-center gap-3 w-full p-2 text-left">
              <Globe className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">Dil & Bölge</span>
            </button>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Settings */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <User className="w-6 h-6 text-blue-600" />
              Profil Bilgileri
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Ad</Label>
                  <Input id="firstName" defaultValue="Ahmet" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="lastName">Soyad</Label>
                  <Input id="lastName" defaultValue="Yılmaz" className="mt-1" />
                </div>
              </div>
              <div>
                <Label htmlFor="email">E-posta</Label>
                <Input id="email" type="email" defaultValue="ahmet@rexlojistik.com" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="phone">Telefon</Label>
                <Input id="phone" defaultValue="+90 532 555 0101" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="position">Pozisyon</Label>
                <Input id="position" defaultValue="Operasyon Müdürü" className="mt-1" />
              </div>
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                Değişiklikleri Kaydet
              </Button>
            </div>
          </Card>

          {/* Notification Settings */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Bell className="w-6 h-6 text-blue-600" />
              Bildirim Tercihleri
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">E-posta Bildirimleri</p>
                  <p className="text-sm text-gray-600">Önemli güncellemeler için e-posta al</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">SMS Bildirimleri</p>
                  <p className="text-sm text-gray-600">Acil durumlar için SMS al</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Push Bildirimleri</p>
                  <p className="text-sm text-gray-600">Tarayıcı bildirimleri</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Haftalık Rapor</p>
                  <p className="text-sm text-gray-600">Her Pazartesi özet rapor al</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </Card>

          {/* Security Settings */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-600" />
              Güvenlik
            </h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Mevcut Şifre</Label>
                <Input id="currentPassword" type="password" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="newPassword">Yeni Şifre</Label>
                <Input id="newPassword" type="password" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</Label>
                <Input id="confirmPassword" type="password" className="mt-1" />
              </div>
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                Şifreyi Güncelle
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}