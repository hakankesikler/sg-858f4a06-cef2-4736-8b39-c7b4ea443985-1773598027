import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Upload } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { driverService, Driver } from "@/services/driverService";
import { cn } from "@/lib/utils";

interface DriverFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editMode?: boolean;
  initialData?: Driver;
}

export function DriverForm({ isOpen, onClose, onSuccess, editMode = false, initialData }: DriverFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [driverCode, setDriverCode] = useState("DRV-000001");
  const [ehliyetGecerlilikTarihi, setEhliyetGecerlilikTarihi] = useState<Date>();
  const [ehliyetFile, setEhliyetFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    full_name: "",
    tc_no: "",
    phone_1: "",
    phone_2: "",
    src_belge_no: "",
    psikoteknik_belge_no: "",
    ehliyet_sinifi: "",
    status: "Aktif"
  });

  useEffect(() => {
    if (isOpen && !editMode) {
      loadNextDriverCode();
      resetForm();
    }
  }, [isOpen, editMode]);

  useEffect(() => {
    if (editMode && initialData && isOpen) {
      setDriverCode(initialData.driver_code || "DRV-000001");
      setFormData({
        full_name: initialData.full_name || "",
        tc_no: initialData.tc_no || "",
        phone_1: initialData.phone_1 || "",
        phone_2: initialData.phone_2 || "",
        src_belge_no: initialData.src_belge_no || "",
        psikoteknik_belge_no: initialData.psikoteknik_belge_no || "",
        ehliyet_sinifi: initialData.ehliyet_sinifi || "",
        status: initialData.status || "Aktif"
      });
      if (initialData.ehliyet_gecerlilik_tarihi) {
        setEhliyetGecerlilikTarihi(new Date(initialData.ehliyet_gecerlilik_tarihi));
      }
    }
  }, [editMode, initialData, isOpen]);

  const loadNextDriverCode = async () => {
    try {
      const nextCode = await driverService.getNextDriverCode();
      setDriverCode(nextCode);
    } catch (error) {
      console.error("Error loading next driver code:", error);
      setDriverCode("DRV-000001");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setEhliyetFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.tc_no || !formData.phone_1) {
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
        driver_code: driverCode,
        full_name: formData.full_name,
        tc_no: formData.tc_no,
        phone_1: formData.phone_1,
        phone_2: formData.phone_2 || null,
        src_belge_no: formData.src_belge_no || null,
        psikoteknik_belge_no: formData.psikoteknik_belge_no || null,
        ehliyet_sinifi: formData.ehliyet_sinifi || null,
        ehliyet_gecerlilik_tarihi: ehliyetGecerlilikTarihi ? format(ehliyetGecerlilikTarihi, "yyyy-MM-dd") : null,
        status: formData.status
      };

      let driverId: string;
      
      if (editMode && initialData) {
        const updated = await driverService.updateDriver(initialData.id!, submitData);
        driverId = updated.id;
        toast({
          title: "Başarılı",
          description: "Sürücü başarıyla güncellendi",
        });
      } else {
        const created = await driverService.createDriver(submitData);
        driverId = created.id;
        toast({
          title: "Başarılı",
          description: "Sürücü başarıyla oluşturuldu",
        });
      }

      // Upload file if exists
      if (ehliyetFile) {
        try {
          await driverService.uploadDriverDocument(driverId, ehliyetFile);
        } catch (error) {
          console.error("Error uploading file:", error);
          toast({
            title: "Uyarı",
            description: "Sürücü kaydedildi ancak dosya yüklenirken hata oluştu",
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
        description: error?.message || "Sürücü kaydedilirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: "",
      tc_no: "",
      phone_1: "",
      phone_2: "",
      src_belge_no: "",
      psikoteknik_belge_no: "",
      ehliyet_sinifi: "",
      status: "Aktif"
    });
    setEhliyetGecerlilikTarihi(undefined);
    setEhliyetFile(null);
    setDriverCode("DRV-000001");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editMode ? "Sürücü Düzenle" : "Yeni Sürücü Oluştur"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sürücü Kodu */}
          <div className="space-y-2">
            <Label>Sürücü Kodu</Label>
            <Input value={driverCode} disabled className="bg-gray-50" />
          </div>

          {/* Temel Bilgiler */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ad Soyad *</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Ahmet Yılmaz"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>T.C. Kimlik No *</Label>
              <Input
                value={formData.tc_no}
                onChange={(e) => setFormData({ ...formData, tc_no: e.target.value })}
                placeholder="12345678901"
                maxLength={11}
                required
              />
            </div>
          </div>

          {/* İletişim Bilgileri */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Telefon 1 *</Label>
              <Input
                value={formData.phone_1}
                onChange={(e) => setFormData({ ...formData, phone_1: e.target.value })}
                placeholder="0532 123 4567"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Telefon 2</Label>
              <Input
                value={formData.phone_2}
                onChange={(e) => setFormData({ ...formData, phone_2: e.target.value })}
                placeholder="0532 987 6543"
              />
            </div>
          </div>

          {/* Belgeler */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>SRC Belge No</Label>
              <Input
                value={formData.src_belge_no}
                onChange={(e) => setFormData({ ...formData, src_belge_no: e.target.value })}
                placeholder="SRC123456"
              />
            </div>
            <div className="space-y-2">
              <Label>Psikoteknik Belge No</Label>
              <Input
                value={formData.psikoteknik_belge_no}
                onChange={(e) => setFormData({ ...formData, psikoteknik_belge_no: e.target.value })}
                placeholder="PSK123456"
              />
            </div>
          </div>

          {/* Ehliyet Bilgileri */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ehliyet Sınıfı</Label>
              <Select value={formData.ehliyet_sinifi} onValueChange={(value) => setFormData({ ...formData, ehliyet_sinifi: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Ehliyet sınıfı seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                  <SelectItem value="CE">CE</SelectItem>
                  <SelectItem value="D">D</SelectItem>
                  <SelectItem value="DE">DE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ehliyet Geçerlilik Tarihi</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !ehliyetGecerlilikTarihi && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {ehliyetGecerlilikTarihi ? format(ehliyetGecerlilikTarihi, "PPP", { locale: tr }) : "Tarih seçin"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={ehliyetGecerlilikTarihi}
                    onSelect={setEhliyetGecerlilikTarihi}
                    locale={tr}
                    captionLayout="dropdown-buttons"
                    fromYear={2020}
                    toYear={2035}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Ehliyet Dosyası */}
          <div className="space-y-2">
            <Label>Ehliyet Dosyası</Label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="flex-1"
              />
              {ehliyetFile && (
                <span className="text-sm text-gray-600">{ehliyetFile.name}</span>
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