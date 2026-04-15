import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageSquare, Mail, X } from "lucide-react";

interface ShipmentNotificationDialogProps {
  open: boolean;
  onClose: () => void;
  shipmentData: {
    shipment_code: string;
    driver_name: string;
    driver_tc: string;
    driver_phone: string;
    vehicle_plate: string;
    trailer_plate: string;
    origin: string;
    destination: string;
    customer_phone?: string;
    customer_email?: string;
  };
}

export function ShipmentNotificationDialog({
  open,
  onClose,
  shipmentData
}: ShipmentNotificationDialogProps) {
  
  const formatWhatsAppMessage = () => {
    const message = `
🚚 *REX LOJİSTİK*
Sevkiyat Bilgileri

━━━━━━━━━━━━━━━━━━━
📦 *SEVKIYAT*
Kod: ${shipmentData.shipment_code}
Tarih: ${new Date().toLocaleDateString("tr-TR")}

━━━━━━━━━━━━━━━━━━━
👤 *SÜRÜCÜ BİLGİLERİ*
İsim Soyad: ${shipmentData.driver_name}
T.C. Kimlik: ${shipmentData.driver_tc}
Telefon: ${shipmentData.driver_phone}

━━━━━━━━━━━━━━━━━━━
🚛 *ARAÇ BİLGİLERİ*
Çekici Plaka: ${shipmentData.vehicle_plate}
Dorse Plaka: ${shipmentData.trailer_plate}

━━━━━━━━━━━━━━━━━━━
📍 *ROTA BİLGİLERİ*
Nereden: ${shipmentData.origin}
Nereye: ${shipmentData.destination}

━━━━━━━━━━━━━━━━━━━
İyi günler dileriz.
*Rex Lojistik*
    `.trim();
    
    return encodeURIComponent(message);
  };

  const formatEmailBody = () => {
    const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 16px; font-weight: bold; color: #667eea; margin-bottom: 10px; border-bottom: 2px solid #667eea; padding-bottom: 5px; }
    .info-row { display: flex; margin-bottom: 8px; }
    .info-label { font-weight: bold; width: 150px; }
    .info-value { flex: 1; }
    .footer { background: #333; color: white; padding: 15px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚚 REX LOJİSTİK</h1>
      <p>Sevkiyat Bilgilendirme</p>
    </div>
    
    <div class="content">
      <div class="section">
        <div class="section-title">📦 SEVKIYAT BİLGİLERİ</div>
        <div class="info-row">
          <div class="info-label">Sevkiyat Kodu:</div>
          <div class="info-value">${shipmentData.shipment_code}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Tarih:</div>
          <div class="info-value">${new Date().toLocaleDateString("tr-TR")}</div>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">👤 SÜRÜCÜ BİLGİLERİ</div>
        <div class="info-row">
          <div class="info-label">İsim Soyad:</div>
          <div class="info-value">${shipmentData.driver_name}</div>
        </div>
        <div class="info-row">
          <div class="info-label">T.C. Kimlik:</div>
          <div class="info-value">${shipmentData.driver_tc}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Telefon:</div>
          <div class="info-value">${shipmentData.driver_phone}</div>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">🚛 ARAÇ BİLGİLERİ</div>
        <div class="info-row">
          <div class="info-label">Çekici Plaka:</div>
          <div class="info-value">${shipmentData.vehicle_plate}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Dorse Plaka:</div>
          <div class="info-value">${shipmentData.trailer_plate}</div>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">📍 ROTA BİLGİLERİ</div>
        <div class="info-row">
          <div class="info-label">Nereden:</div>
          <div class="info-value">${shipmentData.origin}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Nereye:</div>
          <div class="info-value">${shipmentData.destination}</div>
        </div>
      </div>
    </div>
    
    <div class="footer">
      <p><strong>Rex Lojistik</strong></p>
      <p>Bu e-posta otomatik olarak oluşturulmuştur.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
    
    return encodeURIComponent(emailBody);
  };

  const handleWhatsApp = () => {
    if (!shipmentData.customer_phone) {
      alert("Müşteri telefon numarası bulunamadı!");
      return;
    }
    
    const message = formatWhatsAppMessage();
    const phone = shipmentData.customer_phone.replace(/\D/g, ""); // Sadece rakamları al
    const whatsappUrl = `https://wa.me/${phone}?text=${message}`;
    
    window.open(whatsappUrl, "_blank");
    onClose();
  };

  const handleEmail = () => {
    if (!shipmentData.customer_email) {
      alert("Müşteri e-posta adresi bulunamadı!");
      return;
    }
    
    const subject = encodeURIComponent(`REX LOJİSTİK - Sevkiyat Bilgileri (${shipmentData.shipment_code})`);
    const body = formatEmailBody();
    const mailtoUrl = `mailto:${shipmentData.customer_email}?subject=${subject}&body=${body}`;
    
    window.location.href = mailtoUrl;
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">✅</span>
            Sevkiyat Başarıyla Kaydedildi!
          </DialogTitle>
          <DialogDescription>
            Sürücü ve araç bilgilerini müşteriye göndermek ister misiniz?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={handleWhatsApp}
              className="h-20 flex flex-col gap-2"
              variant="outline"
            >
              <MessageSquare className="h-6 w-6 text-green-600" />
              <span>WhatsApp</span>
            </Button>
            
            <Button
              onClick={handleEmail}
              className="h-20 flex flex-col gap-2"
              variant="outline"
            >
              <Mail className="h-6 w-6 text-blue-600" />
              <span>E-posta</span>
            </Button>
          </div>
          
          <div className="text-sm text-gray-500 text-center">
            Mesaj içeriği otomatik olarak hazırlanacaktır
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Şimdi Değil
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}