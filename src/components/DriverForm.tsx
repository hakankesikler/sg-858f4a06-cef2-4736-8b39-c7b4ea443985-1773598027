import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { driverService, Driver } from "@/services/driverService";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Upload } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

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
  });

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
      });
      if (initialData.ehliyet_gecerlilik_tarihi) {
        setEhliyetGecerlilikTarihi(new Date(initialData.ehliyet_gecerlilik_tarihi));
      }
    } else if (isOpen && !editMode) {
      loadNextDriverCode();
    } else if (!isOpen) {
      resetForm();
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
      
      let ehliyetUrl = initialData?.ehliyet_dosyasi_url;
      
      if (ehliyetFile) {
        const tempId = editMode && initialData ? initialData.id : crypto.randomUUID();
        ehliyetUrl = await driverService.uploadEhliyetFile(ehliyetFile, tempId!);
      }

      const submitData: Driver = {
        driver_code: driverCode,
        full_name: formData.full_name,
        tc_no: formData.tc_no,
        phone_1: formData.phone_1,
        phone_2: formData.phone_2 || undefined,
        src_belge_no: formData.src_belge_no || undefined,
        psikoteknik_belge_no: formData.psikoteknik_belge_no || undefined,
        ehliyet_sinifi: formData.ehliyet_sinifi || undefined,
        ehliyet_gecerlilik_tarihi: ehliyetGecerlilikTarihi ? format(ehliyetGecerlilikTarihi, "yyyy-MM-dd") : undefined,
        ehliyet_dosyasi_url: ehliyetUrl,
        status: "Aktif"
      };

      if (editMode && initialData) {
        await driverService.updateDriver(initialData.id!, submitData);
        toast({
          title: "Başarılı",
          description: "Sürücü başarıyla güncellendi",
        });
      } else {
        await driverService.createDriver(submitData);
        toast({
          title: "Başarılı",
          description: "Sürücü başarıyla oluşturuldu",
        });
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
    });
    setEhliyetGecerlilikTarihi(undefined);
    setEhliyetFile(null);
    setDriverCode("DRV-000001");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editMode ? "Sürücü Düzenle" : "Yeni Sürücü Ekle"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Sürücü Kodu, Ad Soyad */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sürücü Kodu</Label>
              <Input value={driverCode} disabled className="bg-gray-50" />
            </div>
            <div className="space-y-2">
              <Label>Ad Soyad *</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Row 2: TC Kimlik No */}
          <div className="space-y-2">
            <Label>T.C. Kimlik No *</Label>
            <Input
              value={formData.tc_no}
              onChange={(e) => setFormData({ ...formData, tc_no: e.target.value })}
              maxLength={11}
              required
            />
          </div>

          {/* Row 3: Telefon 1 & 2 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Telefon 1 *</Label>
              <Input
                value={formData.phone_1}
                onChange={(e) => setFormData({ ...formData, phone_1: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Telefon 2</Label>
              <Input
                value={formData.phone_2}
                onChange={(e) => setFormData({ ...formData, phone_2: e.target.value })}
              />
            </div>
          </div>

          {/* Row 4: SRC & Psikoteknik */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>SRC Belge No</Label>
              <Input
                value={formData.src_belge_no}
                onChange={(e) => setFormData({ ...formData, src_belge_no: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Psikoteknik Belge No</Label>
              <Input
                value={formData.psikoteknik_belge_no}
                onChange={(e) => setFormData({ ...formData, psikoteknik_belge_no: e.target.value })}
              />
            </div>
          </div>

          {/* Row 5: Ehliyet Sınıfı & Geçerlilik */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ehliyet Sınıfı</Label>
              <Input
                value={formData.ehliyet_sinifi}
                onChange={(e) => setFormData({ ...formData, ehliyet_sinifi: e.target.value })}
                placeholder="Örn: B, C, CE"
              />
            </div>
            <div className="space-y-2">
              <Label>Ehliyet Geçerlilik Tarihi</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {ehliyetGecerlilikTarihi ? format(ehliyetGecerlilikTarihi, "PPP", { locale: tr }) : "Tarih seçin"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={ehliyetGecerlilikTarihi}
                    onSelect={setEhliyetGecerlilikTarihi}
                    locale={tr}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Row 6: Ehliyet Dosyası */}
          <div className="space-y-2">
            <Label>Ehliyet Dosyası</Label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="flex-1"
              />
              <Upload className="h-4 w-4 text-gray-400" />
            </div>
            {ehliyetFile && (
              <p className="text-sm text-gray-600">Seçili: {ehliyetFile.name}</p>
            )}
            {initialData?.ehliyet_dosyasi_url && !ehliyetFile && (
              <a 
                href={initialData.ehliyet_dosyasi_url} 
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