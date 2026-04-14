import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { shipmentService } from "@/services/shipmentService";
import { Upload, FileText } from "lucide-react";

interface DeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipmentId: string;
  shipmentCode: string;
  onSuccess: () => void;
}

export function DeliveryModal({ isOpen, onClose, shipmentId, shipmentCode, onSuccess }: DeliveryModalProps) {
  const { toast } = useToast();
  const [deliveredTo, setDeliveredTo] = useState("");
  const [deliveryFile, setDeliveryFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Delivery date with today as default
  const today = new Date().toISOString().split('T')[0];
  const [deliveryDate, setDeliveryDate] = useState(today);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Hata",
          description: "Sadece JPG, PNG veya PDF dosyası yükleyebilirsiniz",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Hata",
          description: "Dosya boyutu 5MB'dan küçük olmalıdır",
          variant: "destructive",
        });
        return;
      }
      
      setDeliveryFile(file);
    }
  };

  const uploadDeliveryProof = async (): Promise<string | null> => {
    if (!deliveryFile) return null;

    try {
      const fileExt = deliveryFile.name.split('.').pop();
      const fileName = `${shipmentCode}_${Date.now()}.${fileExt}`;
      const filePath = `delivery-proofs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('shipment-documents')
        .upload(filePath, deliveryFile);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('shipment-documents')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading delivery proof:", error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!deliveredTo.trim()) {
      toast({
        title: "Uyarı",
        description: "Lütfen teslim alan kişinin adını girin",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Upload delivery proof if provided
      let deliveryProofUrl = null;
      if (deliveryFile) {
        deliveryProofUrl = await uploadDeliveryProof();
      }

      // Update shipment status to "teslim_edildi"
      await shipmentService.updateShipment(shipmentId, {
        status: "teslim_edildi",
        delivered_to: deliveredTo,
        delivery_proof_url: deliveryProofUrl,
        actual_delivery_date: new Date().toISOString(),
        delivery_date: deliveryDate
      });

      toast({
        title: "Başarılı",
        description: "Sevkiyat teslim edildi olarak işaretlendi",
      });

      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error("Delivery error:", error);
      toast({
        title: "Hata",
        description: error?.message || "Teslim işlemi sırasında bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setDeliveredTo("");
    setDeliveryFile(null);
    const today = new Date().toISOString().split('T')[0];
    setDeliveryDate(today);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Sevkiyat Teslim Et</DialogTitle>
          <p className="text-sm text-gray-500">
            Sevkiyat Kodu: <span className="font-semibold">{shipmentCode}</span>
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="delivered-to">Teslim Alan Kişi *</Label>
            <Input
              id="delivered-to"
              value={deliveredTo}
              onChange={(e) => setDeliveredTo(e.target.value)}
              placeholder="Örn: Ahmet Yılmaz"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery-date">Teslim Tarihi *</Label>
            <Input
              id="delivery-date"
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery-proof">Teslim Evrakı (İsteğe Bağlı)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="delivery-proof"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('delivery-proof')?.click()}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {deliveryFile ? deliveryFile.name : "Dosya Seç (JPG, PNG, PDF)"}
              </Button>
            </div>
            {deliveryFile && (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {(deliveryFile.size / 1024).toFixed(2)} KB
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            İptal
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "İşleniyor..." : "Teslim Et"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}