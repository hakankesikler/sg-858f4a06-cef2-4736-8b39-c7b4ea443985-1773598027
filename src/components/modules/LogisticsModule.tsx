import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Edit, Trash2, Truck, FileText, Upload, ChevronDown } from "lucide-react";
import { logisticsService } from "@/services/logisticsService";

export function LogisticsModule() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [carriers, setCarriers] = useState<any[]>([]);
  const [isAddCarrierDialogOpen, setIsAddCarrierDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("shipments");
  const [firmaTuru, setFirmaTuru] = useState("gercek");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<any>({
    firma_adi: "",
    firma_turu: "gercek",
    vergi_dairesi: "",
    vergi_no: "",
    mersis_no: "",
    ticaret_sicil_no: "",
    merkez_adres: "",
    sube_adres: "",
    firma_telefon: "",
    firma_email: "",
    fatura_email: "",
    yetkili_ad_soyad: "",
    yetkili_telefon: "",
    yetkili_email: "",
    surucu_ad_soyad: "",
    surucu_tc: "",
    surucu_telefon1: "",
    surucu_telefon2: "",
    src_belge_no: "",
    psikoteknik_belge_no: "",
    ehliyet_sinifi: "",
    ehliyet_gecerlilik: "",
    arac_tipi: "",
    cekici_plaka: "",
    dorse_plaka: "",
    kasa_tipi: "",
    tasima_kapasitesi: "",
    kasko_bitis: "",
    trafik_sigorta_bitis: "",
    yetki_belgesi: "",
    calisma_bolgesi: "",
    uzmanlik: "",
    odeme_sekli: "",
    odeme_gunu: "",
    banka_adi: "",
    iban: "",
    hesap_sahibi: "",
    vergi_uyum: "evet",
  });

  const { toast } = useToast();

  useEffect(() => {
    loadShipments();
    loadCarriers();
  }, []);

  const loadShipments = async () => {
    try {
      const data = await logisticsService.getShipments();
      setShipments(data);
    } catch (error) {
      console.error("Error loading shipments:", error);
    }
  };

  const loadCarriers = async () => {
    try {
      const data = await logisticsService.getCarriers();
      setCarriers(data);
    } catch (error) {
      console.error("Error loading carriers:", error);
    }
  };

  const handleAddCarrier = async () => {
    // Zorunlu alan kontrolleri
    if (!formData.firma_adi) {
      toast({
        title: "Hata",
        description: "Lütfen firma adını giriniz",
        variant: "destructive",
      });
      return;
    }

    if (!formData.firma_telefon) {
      toast({
        title: "Hata",
        description: "Lütfen firma telefonu giriniz",
        variant: "destructive",
      });
      return;
    }

    if (!formData.firma_email) {
      toast({
        title: "Hata",
        description: "Lütfen firma e-posta giriniz",
        variant: "destructive",
      });
      return;
    }

    // E-posta formatı kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.firma_email)) {
      toast({
        title: "Hata",
        description: "Lütfen geçerli bir e-posta adresi giriniz",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await logisticsService.createCarrier(formData);
      toast({
        title: "Başarılı",
        description: "Nakliyeci başarıyla oluşturuldu",
      });
      setIsAddCarrierDialogOpen(false);
      setFormData({
        firma_adi: "",
        firma_turu: "gercek",
        vergi_dairesi: "",
        vergi_no: "",
        mersis_no: "",
        ticaret_sicil_no: "",
        merkez_adres: "",
        sube_adres: "",
        firma_telefon: "",
        firma_email: "",
        fatura_email: "",
        yetkili_ad_soyad: "",
        yetkili_telefon: "",
        yetkili_email: "",
        surucu_ad_soyad: "",
        surucu_tc: "",
        surucu_telefon1: "",
        surucu_telefon2: "",
        src_belge_no: "",
        psikoteknik_belge_no: "",
        ehliyet_sinifi: "",
        ehliyet_gecerlilik: "",
        arac_tipi: "",
        cekici_plaka: "",
        dorse_plaka: "",
        kasa_tipi: "",
        tasima_kapasitesi: "",
        kasko_bitis: "",
        trafik_sigorta_bitis: "",
        yetki_belgesi: "",
        calisma_bolgesi: "",
        uzmanlik: "",
        odeme_sekli: "",
        odeme_gunu: "",
        banka_adi: "",
        iban: "",
        hesap_sahibi: "",
        vergi_uyum: "evet",
      });
      loadCarriers();
    } catch (error) {
      console.error("Error creating carrier:", error);
      toast({
        title: "Hata",
        description: "Nakliyeci oluşturulurken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCarriers = carriers.filter(carrier =>
    carrier.firma_adi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    carrier.vergi_no?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Lojistik Yönetimi</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="shipments">Sevkiyatlar</TabsTrigger>
          <TabsTrigger value="carriers">Nakliyeciler</TabsTrigger>
        </TabsList>

        {/* Sevkiyatlar Tab */}
        <TabsContent value="shipments">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Sevkiyat ara..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni Sevkiyat
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sevkiyat No</TableHead>
                    <TableHead>Müşteri</TableHead>
                    <TableHead>Çıkış</TableHead>
                    <TableHead>Varış</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        Henüz sevkiyat bulunmamaktadır
                      </TableCell>
                    </TableRow>
                  ) : (
                    shipments.map((shipment) => (
                      <TableRow key={shipment.id}>
                        <TableCell>{shipment.shipment_number}</TableCell>
                        <TableCell>{shipment.customer_name}</TableCell>
                        <TableCell>{shipment.origin}</TableCell>
                        <TableCell>{shipment.destination}</TableCell>
                        <TableCell>{new Date(shipment.date).toLocaleDateString("tr-TR")}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                            {shipment.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Nakliyeciler Tab */}
        <TabsContent value="carriers">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Nakliyeci ara..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => setIsAddCarrierDialogOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nakliyeci Tanımla
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Firma Adı</TableHead>
                    <TableHead>Vergi No</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>E-posta</TableHead>
                    <TableHead>Çalışma Bölgesi</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCarriers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Henüz nakliyeci bulunmamaktadır
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCarriers.map((carrier) => (
                      <TableRow key={carrier.id}>
                        <TableCell className="font-medium">{carrier.firma_adi}</TableCell>
                        <TableCell>{carrier.vergi_no}</TableCell>
                        <TableCell>{carrier.firma_telefon}</TableCell>
                        <TableCell>{carrier.firma_email}</TableCell>
                        <TableCell>{carrier.calisma_bolgesi}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Nakliyeci Tanımlama Dialog */}
      <Dialog open={isAddCarrierDialogOpen} onOpenChange={setIsAddCarrierDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Truck className="w-6 h-6 text-blue-600" />
              Nakliyeci Tanımlama Formu
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="firma" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="firma">Firma</TabsTrigger>
              <TabsTrigger value="yetkili">Yetkili</TabsTrigger>
              <TabsTrigger value="surucu">Sürücü</TabsTrigger>
              <TabsTrigger value="arac">Araç</TabsTrigger>
              <TabsTrigger value="operasyonel">Operasyonel</TabsTrigger>
              <TabsTrigger value="banka">Banka</TabsTrigger>
            </TabsList>

            {/* Firma Bilgileri Tab */}
            <TabsContent value="firma" className="space-y-6 mt-6">
              <Card className="p-6 bg-gray-50">
                <h3 className="text-lg font-semibold mb-4 text-blue-600">Firma Bilgileri</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label>Firma Adı *</Label>
                    <Input
                      value={formData.firma_adi}
                      onChange={(e) => setFormData({ ...formData, firma_adi: e.target.value })}
                      placeholder="Firma adı"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Firma Türü *</Label>
                    <div className="flex gap-4 items-center h-10">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="firmaTuru"
                          value="gercek"
                          checked={firmaTuru === "gercek"}
                          onChange={() => {
                            setFirmaTuru("gercek");
                            setFormData({ ...formData, firma_turu: "gercek" });
                          }}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span>Gerçek Kişi</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="firmaTuru"
                          value="tuzel"
                          checked={firmaTuru === "tuzel"}
                          onChange={() => {
                            setFirmaTuru("tuzel");
                            setFormData({ ...formData, firma_turu: "tuzel" });
                          }}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span>Tüzel Kişi</span>
                      </label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Vergi Dairesi</Label>
                    <Input
                      value={formData.vergi_dairesi}
                      onChange={(e) => setFormData({ ...formData, vergi_dairesi: e.target.value })}
                      placeholder="Vergi dairesi"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label>Vergi No</Label>
                    <Input
                      value={formData.vergi_no}
                      onChange={(e) => setFormData({ ...formData, vergi_no: e.target.value })}
                      placeholder="Vergi numarası"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mersis No</Label>
                    <Input
                      value={formData.mersis_no}
                      onChange={(e) => setFormData({ ...formData, mersis_no: e.target.value })}
                      placeholder="Mersis numarası"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ticaret Sicil No</Label>
                    <Input
                      value={formData.ticaret_sicil_no}
                      onChange={(e) => setFormData({ ...formData, ticaret_sicil_no: e.target.value })}
                      placeholder="Ticaret sicil no"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label>Merkez Adres</Label>
                    <textarea
                      className="w-full min-h-[80px] p-2 border rounded-md"
                      value={formData.merkez_adres}
                      onChange={(e) => setFormData({ ...formData, merkez_adres: e.target.value })}
                      placeholder="Merkez adres bilgisi"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Şube Adresi (varsa)</Label>
                    <textarea
                      className="w-full min-h-[80px] p-2 border rounded-md"
                      value={formData.sube_adres}
                      onChange={(e) => setFormData({ ...formData, sube_adres: e.target.value })}
                      placeholder="Şube adres bilgisi"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Firma Telefonu *</Label>
                    <Input
                      value={formData.firma_telefon}
                      onChange={(e) => setFormData({ ...formData, firma_telefon: e.target.value })}
                      placeholder="0555 123 45 67"
                      type="tel"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Firma E-posta *</Label>
                    <Input
                      value={formData.firma_email}
                      onChange={(e) => setFormData({ ...formData, firma_email: e.target.value })}
                      placeholder="firma@mail.com"
                      type="email"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fatura / E-Fatura E-posta</Label>
                    <Input
                      value={formData.fatura_email}
                      onChange={(e) => setFormData({ ...formData, fatura_email: e.target.value })}
                      placeholder="fatura@mail.com"
                      type="email"
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Yetkili Bilgileri Tab */}
            <TabsContent value="yetkili" className="space-y-6 mt-6">
              <Card className="p-6 bg-gray-50">
                <h3 className="text-lg font-semibold mb-4 text-blue-600">Yetkili Bilgileri</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Yetkili Adı Soyadı</Label>
                    <Input
                      value={formData.yetkili_ad_soyad}
                      onChange={(e) => setFormData({ ...formData, yetkili_ad_soyad: e.target.value })}
                      placeholder="Ad Soyad"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Yetkili Telefonu</Label>
                    <Input
                      value={formData.yetkili_telefon}
                      onChange={(e) => setFormData({ ...formData, yetkili_telefon: e.target.value })}
                      placeholder="0555 123 45 67"
                      type="tel"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Yetkili E-posta</Label>
                    <Input
                      value={formData.yetkili_email}
                      onChange={(e) => setFormData({ ...formData, yetkili_email: e.target.value })}
                      placeholder="yetkili@mail.com"
                      type="email"
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Sürücü Bilgileri Tab */}
            <TabsContent value="surucu" className="space-y-6 mt-6">
              <Card className="p-6 bg-gray-50">
                <h3 className="text-lg font-semibold mb-4 text-blue-600">Sürücü Bilgileri</h3>
                <p className="text-sm text-gray-600 mb-4">Her araç için ayrı doldurulur</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label>Sürücü Adı Soyadı</Label>
                    <Input
                      value={formData.surucu_ad_soyad}
                      onChange={(e) => setFormData({ ...formData, surucu_ad_soyad: e.target.value })}
                      placeholder="Ad Soyad"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>T.C. Kimlik No</Label>
                    <Input
                      value={formData.surucu_tc}
                      onChange={(e) => setFormData({ ...formData, surucu_tc: e.target.value })}
                      placeholder="12345678901"
                      maxLength={11}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label>Telefon 1</Label>
                    <Input
                      value={formData.surucu_telefon1}
                      onChange={(e) => setFormData({ ...formData, surucu_telefon1: e.target.value })}
                      placeholder="0555 123 45 67"
                      type="tel"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefon 2</Label>
                    <Input
                      value={formData.surucu_telefon2}
                      onChange={(e) => setFormData({ ...formData, surucu_telefon2: e.target.value })}
                      placeholder="0555 123 45 67"
                      type="tel"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label>SRC Belge No</Label>
                    <Input
                      value={formData.src_belge_no}
                      onChange={(e) => setFormData({ ...formData, src_belge_no: e.target.value })}
                      placeholder="SRC belge no"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Psikoteknik Belge No</Label>
                    <Input
                      value={formData.psikoteknik_belge_no}
                      onChange={(e) => setFormData({ ...formData, psikoteknik_belge_no: e.target.value })}
                      placeholder="Psikoteknik no"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ehliyet Sınıfı</Label>
                    <Select
                      value={formData.ehliyet_sinifi}
                      onValueChange={(value) => setFormData({ ...formData, ehliyet_sinifi: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="B">B</SelectItem>
                        <SelectItem value="C">C</SelectItem>
                        <SelectItem value="D">D</SelectItem>
                        <SelectItem value="E">E</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ehliyet Geçerlilik Tarihi</Label>
                    <Input
                      value={formData.ehliyet_gecerlilik}
                      onChange={(e) => setFormData({ ...formData, ehliyet_gecerlilik: e.target.value })}
                      type="date"
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Araç Bilgileri Tab */}
            <TabsContent value="arac" className="space-y-6 mt-6">
              <Card className="p-6 bg-gray-50">
                <h3 className="text-lg font-semibold mb-4 text-blue-600">Araç Bilgileri</h3>
                <p className="text-sm text-gray-600 mb-4">Her araç için ayrı kart açılır</p>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label>Araç Tipi</Label>
                    <Select
                      value={formData.arac_tipi}
                      onValueChange={(value) => setFormData({ ...formData, arac_tipi: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="panelvan">Panelvan</SelectItem>
                        <SelectItem value="kamyonet">Kamyonet</SelectItem>
                        <SelectItem value="kamyon">Kamyon</SelectItem>
                        <SelectItem value="tir">Tır</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Çekici Plakası</Label>
                    <Input
                      value={formData.cekici_plaka}
                      onChange={(e) => setFormData({ ...formData, cekici_plaka: e.target.value })}
                      placeholder="34 ABC 123"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Dorse Plakası (varsa)</Label>
                    <Input
                      value={formData.dorse_plaka}
                      onChange={(e) => setFormData({ ...formData, dorse_plaka: e.target.value })}
                      placeholder="34 XYZ 456"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Kasa Tipi</Label>
                    <Select
                      value={formData.kasa_tipi}
                      onValueChange={(value) => setFormData({ ...formData, kasa_tipi: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kapali">Kapalı</SelectItem>
                        <SelectItem value="acik">Açık</SelectItem>
                        <SelectItem value="tenteli">Tenteli</SelectItem>
                        <SelectItem value="frigo">Frigo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label>Taşıma Kapasitesi (kg)</Label>
                    <Input
                      value={formData.tasima_kapasitesi}
                      onChange={(e) => setFormData({ ...formData, tasima_kapasitesi: e.target.value })}
                      placeholder="1000"
                      type="number"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Kasko Bitiş Tarihi</Label>
                    <Input
                      value={formData.kasko_bitis}
                      onChange={(e) => setFormData({ ...formData, kasko_bitis: e.target.value })}
                      type="date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Trafik Sigortası Bitiş Tarihi</Label>
                    <Input
                      value={formData.trafik_sigorta_bitis}
                      onChange={(e) => setFormData({ ...formData, trafik_sigorta_bitis: e.target.value })}
                      type="date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Yetki Belgesi (K1/K2)</Label>
                    <Select
                      value={formData.yetki_belgesi}
                      onValueChange={(value) => setFormData({ ...formData, yetki_belgesi: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="K1">K1</SelectItem>
                        <SelectItem value="K2">K2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Ruhsat Dosyası (yükleme alanı)
                  </Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">Dosya seçmek için tıklayın veya sürükleyin</p>
                    <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (Max 5MB)</p>
                    <Input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Operasyonel Bilgiler Tab */}
            <TabsContent value="operasyonel" className="space-y-6 mt-6">
              <Card className="p-6 bg-gray-50">
                <h3 className="text-lg font-semibold mb-4 text-blue-600">Operasyonel Bilgiler</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label>Çalışma Bölgesi</Label>
                    <Select
                      value={formData.calisma_bolgesi}
                      onValueChange={(value) => setFormData({ ...formData, calisma_bolgesi: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="turkiye_geneli">Türkiye Geneli</SelectItem>
                        <SelectItem value="bolgesel">Bölgesel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Uzmanlık</Label>
                    <Select
                      value={formData.uzmanlik}
                      onValueChange={(value) => setFormData({ ...formData, uzmanlik: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="parsiyel">Parsiyel</SelectItem>
                        <SelectItem value="komple">Komple</SelectItem>
                        <SelectItem value="frigo">Frigo</SelectItem>
                        <SelectItem value="agir_yuk">Ağır Yük</SelectItem>
                        <SelectItem value="diger">Diğer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ödeme Şekli</Label>
                    <Select
                      value={formData.odeme_sekli}
                      onValueChange={(value) => setFormData({ ...formData, odeme_sekli: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nakit">Nakit</SelectItem>
                        <SelectItem value="havale">Havale</SelectItem>
                        <SelectItem value="vadeli">Vadeli</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ödeme Günü</Label>
                    <Select
                      value={formData.odeme_gunu}
                      onValueChange={(value) => setFormData({ ...formData, odeme_gunu: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 Gün</SelectItem>
                        <SelectItem value="15">15 Gün</SelectItem>
                        <SelectItem value="30">30 Gün</SelectItem>
                        <SelectItem value="diger">Diğer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Banka Bilgileri Tab */}
            <TabsContent value="banka" className="space-y-6 mt-6">
              <Card className="p-6 bg-gray-50">
                <h3 className="text-lg font-semibold mb-4 text-blue-600">Banka Bilgileri</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label>Banka Adı</Label>
                    <Input
                      value={formData.banka_adi}
                      onChange={(e) => setFormData({ ...formData, banka_adi: e.target.value })}
                      placeholder="Banka adı"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>IBAN</Label>
                    <Input
                      value={formData.iban}
                      onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                      placeholder="TR00 0000 0000 0000 0000 0000 00"
                      maxLength={32}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hesap Sahibi</Label>
                    <Input
                      value={formData.hesap_sahibi}
                      onChange={(e) => setFormData({ ...formData, hesap_sahibi: e.target.value })}
                      placeholder="Ad Soyad / Firma Adı"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Vergi Ünvanı ile Uyum</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="vergiUyum"
                        value="evet"
                        checked={formData.vergi_uyum === "evet"}
                        onChange={() => setFormData({ ...formData, vergi_uyum: "evet" })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span>Evet</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="vergiUyum"
                        value="hayir"
                        checked={formData.vergi_uyum === "hayir"}
                        onChange={() => setFormData({ ...formData, vergi_uyum: "hayir" })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span>Hayır</span>
                    </label>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex justify-end gap-2 mt-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsAddCarrierDialogOpen(false)}
              className="bg-red-500 text-white hover:bg-red-600 hover:text-white border-0"
            >
              Vazgeç
            </Button>
            <div className="flex">
              <Button
                onClick={handleAddCarrier}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white rounded-r-none"
              >
                {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white rounded-l-none border-l border-green-700 px-2"
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}