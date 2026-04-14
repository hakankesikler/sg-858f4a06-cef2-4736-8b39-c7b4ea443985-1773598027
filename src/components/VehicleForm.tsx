import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { vehicleService, Vehicle } from "@/services/vehicleService";

interface VehicleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editMode?: boolean;
  initialData?: Vehicle;
}

export function VehicleForm({ isOpen, onClose, onSuccess, editMode = false, initialData }: VehicleFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vehicleCode, setVehicleCode] = useState("VHC-000001");
  const [kaskoBitisTarihi, setKaskoBitisTarihi] = useState("");
  const [trafikSigortasiBitisTarihi, setTrafikSigortasiBitisTarihi] = useState("");
  const [ruhsatFile, setRuhsatFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    arac_tipi: "",
    cekici_plakasi: "",
    dorse_plakasi: "",
    kasa_tipi: "",
    tasima_kapasitesi_kg: "",
    yetki_belgesi: "",
    ruhsat_sahibi_adi_soyadi: "",
    ruhsat_no: "",
    status: "Aktif"
  });

  useEffect(() => {
    if (editMode && initialData && isOpen) {
      console.log("Loading vehicle data for edit:", initialData);
      setVehicleCode(initialData.vehicle_code || "VHC-000001");
      setFormData({
        arac_tipi: initialData.arac_tipi || "",
        cekici_plakasi: initialData.cekici_plakasi || "",
        dorse_plakasi: initialData.dorse_plakasi || "",
        kasa_tipi: initialData.kasa_tipi || "",
        tasima_kapasitesi_kg: initialData.tasima_kapasitesi_kg?.toString() || "",
        yetki_belgesi: initialData.yetki_belgesi || "",
        ruhsat_sahibi_adi_soyadi: initialData.ruhsat_sahibi_adi_soyadi || "",
        ruhsat_no: initialData.ruhsat_no || "",
        status: initialData.status || "Aktif"
      });
      if (initialData.kasko_bitis_tarihi) {
        const dateValue = initialData.kasko_bitis_tarihi;
        setKaskoBitisTarihi(dateValue.includes('T') ? dateValue.split('T')[0] : dateValue);
      } else {
        setKaskoBitisTarihi("");
      }
      if (initialData.trafik_sigortasi_bitis_tarihi) {
        const dateValue = initialData.trafik_sigortasi_bitis_tarihi;
        setTrafikSigortasiBitisTarihi(dateValue.includes('T') ? dateValue.split('T')[0] : dateValue);
      } else {
        setTrafikSigortasiBitisTarihi("");
      }
    } else if (!editMode && isOpen) {
      resetForm();
      loadNextVehicleCode();
    }
  }, [editMode, initialData, isOpen]);

  const loadNextVehicleCode = async () => {
    try {
      const nextCode = await vehicleService.getNextVehicleCode();
      setVehicleCode(nextCode);
    } catch (error) {
      console.error("Error loading next vehicle code:", error);
      setVehicleCode("VHC-000001");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setRuhsatFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.arac_tipi || !formData.cekici_plakasi || !formData.kasa_tipi) {
      toast({
        title: "Hata",
        description: "Lütfen zorunlu alanları doldurun",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const submitData = {
        vehicle_code: vehicleCode,
        arac_tipi: formData.arac_tipi,
        cekici_plakasi: formData.cekici_plakasi,
        dorse_plakasi: formData.dorse_plakasi || null,
        kasa_tipi: formData.kasa_tipi,
        tasima_kapasitesi_kg: formData.tasima_kapasitesi_kg ? parseInt(formData.tasima_kapasitesi_kg) : null,
        kasko_bitis_tarihi: kaskoBitisTarihi || null,
        trafik_sigortasi_bitis_tarihi: trafikSigortasiBitisTarihi || null,
        yetki_belgesi: formData.yetki_belgesi || null,
        ruhsat_sahibi_adi_soyadi: formData.ruhsat_sahibi_adi_soyadi || null,
        ruhsat_no: formData.ruhsat_no || null,
        status: formData.status
      };

      let vehicleId: string;

      if (editMode && initialData) {
        const updated = await vehicleService.updateVehicle(initialData.id!, submitData);
        vehicleId = updated.id;
        toast({
          title: "Başarılı",
          description: "Araç başarıyla güncellendi",
        });
      } else {
        const created = await vehicleService.createVehicle(submitData);
        vehicleId = created.id;
        toast({
          title: "Başarılı",
          description: "Araç başarıyla oluşturuldu",
        });
      }

      // Upload file if exists
      if (ruhsatFile) {
        try {
          await vehicleService.uploadRuhsatFile(ruhsatFile, vehicleId);
        } catch (error) {
          console.error("Error uploading file:", error);
          toast({
            title: "Uyarı",
            description: "Araç kaydedildi ancak dosya yüklenirken hata oluştu",
            variant: "destructive",
          });
        }
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error("Submit error:", error);
      toast({
        title: "Hata",
        description: error?.message || "Araç kaydedilirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      arac_tipi: "",
      cekici_plakasi: "",
      dorse_plakasi: "",
      kasa_tipi: "",
      tasima_kapasitesi_kg: "",
      yetki_belgesi: "",
      ruhsat_sahibi_adi_soyadi: "",
      ruhsat_no: "",
      status: "Aktif"
    });
    setKaskoBitisTarihi("");
    setTrafikSigortasiBitisTarihi("");
    setRuhsatFile(null);
    setVehicleCode("VHC-000001");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editMode ? "Araç Düzenle" : "Yeni Araç Oluştur"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Araç Kodu */}
          <div className="space-y-2">
            <Label>Araç Kodu</Label>
            <Input value={vehicleCode} disabled className="bg-gray-50" />
          </div>

          {/* Araç Tipi */}
          <div className="space-y-2">
            <Label>Araç Tipi *</Label>
            <Select value={formData.arac_tipi} onValueChange={(value) => setFormData({ ...formData, arac_tipi: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Araç tipi seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="panelvan">Panelvan</SelectItem>
                <SelectItem value="kamyonet">Kamyonet</SelectItem>
                <SelectItem value="kamyon">Kamyon</SelectItem>
                <SelectItem value="tir">Tır</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Plakalar */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Çekici Plakası *</Label>
              <Input
                value={formData.cekici_plakasi}
                onChange={(e) => setFormData({ ...formData, cekici_plakasi: e.target.value })}
                placeholder="34 ABC 123"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Dorse Plakası</Label>
              <Input
                value={formData.dorse_plakasi}
                onChange={(e) => setFormData({ ...formData, dorse_plakasi: e.target.value })}
                placeholder="34 XYZ 456"
              />
            </div>
          </div>

          {/* Kasa Tipi ve Kapasite */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Kasa Tipi *</Label>
              <Select value={formData.kasa_tipi} onValueChange={(value) => setFormData({ ...formData, kasa_tipi: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Kasa tipi seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kapali">Kapalı</SelectItem>
                  <SelectItem value="acik">Açık</SelectItem>
                  <SelectItem value="tenteli">Tenteli</SelectItem>
                  <SelectItem value="frigo">Frigo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Taşıma Kapasitesi (kg)</Label>
              <Input
                type="number"
                value={formData.tasima_kapasitesi_kg}
                onChange={(e) => setFormData({ ...formData, tasima_kapasitesi_kg: e.target.value })}
                placeholder="24000"
              />
            </div>
          </div>

          {/* Sigorta Tarihleri */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Kasko Bitiş Tarihi</Label>
              <Input
                type="date"
                value={kaskoBitisTarihi}
                onChange={(e) => setKaskoBitisTarihi(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label>Trafik Sigortası Bitiş Tarihi</Label>
              <Input
                type="date"
                value={trafikSigortasiBitisTarihi}
                onChange={(e) => setTrafikSigortasiBitisTarihi(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Yetki Belgesi */}
          <div className="space-y-2">
            <Label>Yetki Belgesi (K1/K2)</Label>
            <Input
              value={formData.yetki_belgesi}
              onChange={(e) => setFormData({ ...formData, yetki_belgesi: e.target.value })}
              placeholder="K1, K2 veya K1/K2"
            />
          </div>

          {/* Ruhsat Bilgileri */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ruhsat Sahibi Adı Soyadı</Label>
              <Input
                value={formData.ruhsat_sahibi_adi_soyadi}
                onChange={(e) => setFormData({ ...formData, ruhsat_sahibi_adi_soyadi: e.target.value })}
                placeholder="Ahmet Yılmaz"
              />
            </div>
            <div className="space-y-2">
              <Label>Ruhsat No</Label>
              <Input
                value={formData.ruhsat_no}
                onChange={(e) => setFormData({ ...formData, ruhsat_no: e.target.value })}
                placeholder="ABC123456"
              />
            </div>
          </div>

          {/* Ruhsat Dosyası */}
          <div className="space-y-2">
            <Label>Ruhsat Dosyası</Label>
            
            {/* Show existing file if available */}
            {editMode && initialData?.ruhsat_dosyasi_url && !ruhsatFile && (
              <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700">Mevcut dosya:</span>
                  <a
                    href={initialData.ruhsat_dosyasi_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                  >
                    📎 Dosyayı Görüntüle
                  </a>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="flex-1"
              />
              {ruhsatFile && (
                <span className="text-sm text-gray-600">{ruhsatFile.name}</span>
              )}
            </div>
            <p className="text-xs text-gray-500">PDF, JPG veya PNG formatında yükleyebilirsiniz</p>
          </div>

          {/* Durum */}
          <div className="space-y-2">
            <Label>Durum</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Aktif">Aktif</SelectItem>
                <SelectItem value="Pasif">Pasif</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Kaydediliyor..." : editMode ? "Güncelle" : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}