import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface CariFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CariForm({ isOpen, onClose }: CariFormProps) {
  const [cariTur, setCariTur] = useState<"gercek" | "tuzel">("gercek");
  const [yurtDisiAdresi, setYurtDisiAdresi] = useState(false);
  const [activeSection, setActiveSection] = useState<"bilgiler" | "detay">("bilgiler");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Yeni Genel Cari</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveSection("bilgiler")}
            className={`flex-1 px-6 py-4 text-left font-semibold transition-colors ${
              activeSection === "bilgiler"
                ? "bg-green-100 text-green-800 border-b-2 border-green-600"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            ▶ Cari Bilgileri
          </button>
          <button
            onClick={() => setActiveSection("detay")}
            className={`flex-1 px-6 py-4 text-left font-semibold transition-colors ${
              activeSection === "detay"
                ? "bg-green-100 text-green-800 border-b-2 border-green-600"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            ▶ Cari Detay Bilgileri
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {activeSection === "bilgiler" && (
            <div className="space-y-8">
              {/* Cari Türü */}
              <div>
                <Label className="text-sm font-semibold text-blue-600 mb-3 block">Cari Türü</Label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="cariTur"
                      checked={cariTur === "gercek"}
                      onChange={() => setCariTur("gercek")}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700">Gerçek/Şahıs Şirketi</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="cariTur"
                      checked={cariTur === "tuzel"}
                      onChange={() => setCariTur("tuzel")}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-700">Tüzel</span>
                  </label>
                </div>
              </div>

              {/* Cari Bilgileri */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="cariKodu">Cari Kodu</Label>
                  <Input id="cariKodu" defaultValue="CAR001273" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="cariAdi">
                    Cari Adı <span className="text-red-500">*</span>
                  </Label>
                  <Input id="cariAdi" required className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="cariSoyadi">
                    Cari Soyadı <span className="text-red-500">*</span>
                  </Label>
                  <Input id="cariSoyadi" required className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="cariTipi">
                    Cari Tipi <span className="text-red-500">*</span>
                  </Label>
                  <Select>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="musteri">Müşteri</SelectItem>
                      <SelectItem value="tedarikci">Tedarikçi</SelectItem>
                      <SelectItem value="her-ikisi">Her İkisi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="cariKisaAdi">Cari Kısa Adı</Label>
                  <Input id="cariKisaAdi" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="islemTarihi">İşlem Tarihi</Label>
                  <Input id="islemTarihi" type="date" defaultValue="2026-03-26" className="mt-1" />
                </div>
              </div>

              {/* Additional Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="etiketler">Etiketler</Label>
                  <Input id="etiketler" placeholder="Etiket ekle..." className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="tcKimlik">T.C. Kimlik No</Label>
                  <Input id="tcKimlik" placeholder="___________" maxLength={11} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="vergiDairesi">Vergi Dairesi</Label>
                  <Select>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kadikoy">Kadıköy VD</SelectItem>
                      <SelectItem value="uskudar">Üsküdar VD</SelectItem>
                      <SelectItem value="besiktas">Beşiktaş VD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="mersisNo">Mersis No</Label>
                  <Input id="mersisNo" className="mt-1" />
                </div>
              </div>

              {/* İletişim Bilgileri */}
              <div>
                <h3 className="text-lg font-semibold text-blue-600 mb-4">İletişim Bilgileri</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="telefon">Telefon No</Label>
                    <div className="flex gap-2 mt-1">
                      <div className="w-20 flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                        <span className="text-xl">🇹🇷</span>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      <Input id="telefon" placeholder="0501 234 5678" className="flex-1" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">E-Posta</Label>
                    <Input id="email" type="email" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="website">Web Sitesi</Label>
                    <Input id="website" type="url" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="faks">Faks No</Label>
                    <div className="flex gap-2 mt-1">
                      <div className="w-20 flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                        <span className="text-xl">🇹🇷</span>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      <Input id="faks" placeholder="0501 234 5678" className="flex-1" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Adres Bilgileri */}
              <div>
                <h3 className="text-lg font-semibold text-blue-600 mb-4">Adres Bilgileri</h3>
                
                <div className="mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={yurtDisiAdresi}
                      onChange={(e) => setYurtDisiAdresi(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-gray-700">Yurt Dışı Adresi</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="adresTipi">Adres Tipi</Label>
                      <Select>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="is">İş Adresi</SelectItem>
                          <SelectItem value="ev">Ev Adresi</SelectItem>
                          <SelectItem value="fatura">Fatura Adresi</SelectItem>
                          <SelectItem value="sevkiyat">Sevkiyat Adresi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-3">
                      <Label htmlFor="adres">Adres</Label>
                      <Textarea id="adres" rows={3} className="mt-1 resize-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="il">İl</Label>
                      <Select>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="istanbul">İstanbul</SelectItem>
                          <SelectItem value="ankara">Ankara</SelectItem>
                          <SelectItem value="izmir">İzmir</SelectItem>
                          <SelectItem value="bursa">Bursa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="ilce">İlçe</Label>
                      <Select>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kadikoy">Kadıköy</SelectItem>
                          <SelectItem value="besiktas">Beşiktaş</SelectItem>
                          <SelectItem value="sisli">Şişli</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="postaKodu">Posta Kodu</Label>
                      <Input id="postaKodu" className="mt-1" />
                    </div>
                    <div className="flex items-end">
                      <Button variant="outline" className="w-full border-red-500 text-red-600 hover:bg-red-50">
                        Sil
                      </Button>
                    </div>
                  </div>
                </div>

                <Button variant="outline" className="mt-4">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Adres Ekle
                </Button>
              </div>
            </div>
          )}

          {activeSection === "detay" && (
            <div className="space-y-6">
              <p className="text-gray-500 text-center py-12">
                Cari detay bilgileri bu bölümde görüntülenecektir.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200 bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
            Kaydet
          </Button>
        </div>
      </div>
    </div>
  );
}