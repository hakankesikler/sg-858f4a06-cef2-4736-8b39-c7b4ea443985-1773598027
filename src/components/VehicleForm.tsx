import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { vehicleService, Vehicle } from "@/services/vehicleService";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Upload } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

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
  const [kaskoBitisTarihi, setKaskoBitisTarihi] = useState<Date>();
  const [trafikSigortasiBitisTarihi, setTrafikSigortasiBitisTarihi] = useState<Date>();
  const [ruhsatFile, setRuhsatFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    arac_tipi: "kamyonet",
    cekici_plakasi: "",
    dorse_plakasi: "",
    kasa_tipi: "kapali",
    tasima_kapasitesi_kg: "",
    yetki_belgesi: "",
  });

  useEffect(() => {
    if (editMode && initialData && isOpen) {
      setVehicleCode(initialData.vehicle_code || "VHC-000001");
      setFormData({
        arac_tipi: initialData.arac_tipi || "kamyonet",
        cekici_plakasi: initialData.cekici_plakasi || "",
        dorse_plakasi: initialData.dorse_plakasi || "",
        kasa_tipi: initialData.kasa_tipi || "kapali",
        tasima_kapasitesi_kg: initialData.tasima_kapasitesi_kg?.toString() || "",
        yetki_belgesi: initialData.yetki_belgesi || "",
      });
      if (initialData.kasko_bitis_tarihi) {
        setKaskoBitisTarihi(new Date(initialData.kasko_bitis_tarihi));
      }
      if (initialData.trafik_sigortasi_bitis_tarihi) {
        setTrafikSigortasiBitisTarihi(new Date(initialData.trafik_sigortasi_bitis_tarihi));
      }
    } else if (isOpen && !editMode) {
      loadNextVehicleCode();
    } else if (!isOpen) {
      resetForm();
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
    
    if (!formData.cekici_plakasi) {
      toast({
        title: "Hata",
        description: "Lütfen çekici plakasını girin",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      let ruhsatUrl = initialData?.ruhsat_dosyasi_url;
      
      if (ruhsatFile) {
        const tempId = editMode && initialData ? initialData.id : crypto.randomUUID();
        ruhsatUrl = await vehicleService.uploadRuhsatFile(ruhsatFile, tempId!);
      }

      const submitData: Vehicle = {
        vehicle_code: vehicleCode,
        arac_tipi: formData.arac_tipi,
        cekici_plakasi: formData.cekici_plakasi,
        dorse_plakasi: formData.dorse_plakasi || undefined,
        kasa_tipi: formData.kasa_tipi,
        tasima_kapasitesi_kg: formData.tasima_kapasitesi_kg ? parseInt(formData.tasima_kapasitesi_kg) : undefined,
        kasko_bitis_tarihi: kaskoBitisTarihi ? format(kaskoBitisTarihi, "yyyy-MM-dd") : undefined,
        trafik_sigortasi_bitis_tarihi: trafikSigortasiBitisTarihi ? format(trafikSigortasiBitisTarihi, "yyyy-MM-dd") : undefined,
        yetki_belgesi: formData.yetki_belgesi || undefined,
        ruhsat_dosyasi_url: ruhsatUrl,
        status: "Aktif"
      };

      if (editMode && initialData) {
        await vehicleService.updateVehicle(initialData.id!, submitData);
        toast({
          title: "Başarılı",
          description: "Araç başarıyla güncellendi",
        });
      } else {
        await vehicleService.createVehicle(submitData);
        toast({
          title: "Başarılı",
          description: "Araç başarıyla oluşturuldu",
        });
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
      arac_tipi: "kamyonet",
      cekici_plakasi: "",
      dorse_plakasi: "",
      kasa_tipi: "kapali",
      tasima_kapasitesi_kg: "",
      yetki_belgesi: "",
    });
    setKaskoBitisTarihi(undefined);
    setTrafikSigortasiBitisTarihi(undefined);
    setRuhsatFile(null);
    setVehicleCode("VHC-000001");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editMode ? "Araç Düzenle" : "Yeni Araç Ekle"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Araç Kodu, Araç Tipi */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Araç Kodu</Label>
              <Input value={vehicleCode} disabled className="bg-gray-50" />
            </div>
            <div className="space-y-2">
              <Label>Araç Tipi *</Label>
              <Select value={formData.arac_tipi} onValueChange={(value) => setFormData({ ...formData, arac_tipi: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="panelvan">Panelvan</SelectItem>
                  <SelectItem value="kamyonet">Kamyonet</SelectItem>
                  <SelectItem value="kamyon">Kamyon</SelectItem>
                  <SelectItem value="tir">Tır</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Çekici & Dorse Plakası */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Çekici Plakası *</Label>
              <Input
                value={formData.cekici_plakasi}
                onChange={(e) => setFormData({ ...formData, cekici_plakasi: e.target.value.toUpperCase() })}
                placeholder="34 ABC 123"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Dorse Plakası</Label>
              <Input
                value={formData.dorse_plakasi}
                onChange={(e) => setFormData({ ...formData, dorse_plakasi: e.target.value.toUpperCase() })}
                placeholder="34 XYZ 456"
              />
            </div>
          </div>

          {/* Row 3: Kasa Tipi & Taşıma Kapasitesi */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Kasa Tipi *</Label>
              <Select value={formData.kasa_tipi} onValueChange={(value) => setFormData({ ...formData, kasa_tipi: value })}>
                <SelectTrigger>
                  <SelectValue />
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
                placeholder="15000"
              />
            </div>
          </div>

          {/* Row 4: Kasko & Trafik Sigortası Bitiş Tarihleri */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Kasko Bitiş Tarihi</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {kaskoBitisTarihi ? format(kaskoBitisTarihi, "PPP", { locale: tr }) : "Tarih seçin"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={kaskoBitisTarihi}
                    onSelect={setKaskoBitisTarihi}
                    locale={tr}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Trafik Sigortası Bitiş Tarihi</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {trafikSigortasiBitisTarihi ? format(trafikSigortasiBitisTarihi, "PPP", { locale: tr }) : "Tarih seçin"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={trafikSigortasiBitisTarihi}
                    onSelect={setTrafikSigortasiBitisTarihi}
                    locale={tr}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Row 5: Yetki Belgesi */}
          <div className="space-y-2">
            <Label>Yetki Belgesi (K1/K2)</Label>
            <Input
              value={formData.yetki_belgesi}
              onChange={(e) => setFormData({ ...formData, yetki_belgesi: e.target.value })}
              placeholder="K1 veya K2"
            />
          </div>

          {/* Row 6: Ruhsat Dosyası */}
          <div className="space-y-2">
            <Label>Ruhsat Dosyası</Label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="flex-1"
              />
              <Upload className="h-4 w-4 text-gray-400" />
            </div>
            {ruhsatFile && (
              <p className="text-sm text-gray-600">Seçili: {ruhsatFile.name}</p>
            )}
            {initialData?.ruhsat_dosyasi_url && !ruhsatFile && (
              <a 
                href={initialData.ruhsat_dosyasi_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                Mevcut dosyayı görüntüle
              </a>
            )}
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