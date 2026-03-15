import type { NextApiRequest, NextApiResponse } from "next";

type ResponseData = {
  success: boolean;
  message: string;
};

function formatEmailContent(data: any): string {
  const serviceTypeLabel = data.serviceType === "domestic" ? "Yurt İçi" : "Uluslararası";
  
  const transportModeLabels: Record<string, string> = {
    road: "Karayolu",
    air: "Havayolu",
    sea: "Denizyolu",
  };

  const transportDetailLabels: Record<string, string> = {
    pallet: "Palet",
    "one-cover": "1 Kapak",
    "half-truck": "Yarım Kamyon",
    "full-truck": "Tam Kamyon",
    kirkayak: "Kırkayak",
    tir: "Tır",
    other: "Diğer",
    file: "Dosya",
    package: "Paket",
    box: "Koli",
    "container-20": "20 cc Konteyner",
    "container-40": "40 cc Konteyner",
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0F172A; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
    .section { margin-bottom: 20px; background: white; padding: 15px; border-radius: 6px; }
    .section-title { color: #0F172A; font-size: 18px; font-weight: bold; margin-bottom: 10px; border-bottom: 2px solid #F97316; padding-bottom: 5px; }
    .info-row { display: flex; margin-bottom: 8px; }
    .info-label { font-weight: bold; min-width: 150px; color: #64748B; }
    .info-value { color: #0F172A; }
    .cargo-specs { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚚 Yeni Teklif Talebi</h1>
      <p>REX Lojistik - Teklif Formu</p>
    </div>
    
    <div class="content">
      <div class="section">
        <div class="section-title">👤 Kişisel Bilgiler</div>
        <div class="info-row">
          <span class="info-label">Ad Soyad:</span>
          <span class="info-value">${data.fullName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Firma İsmi:</span>
          <span class="info-value">${data.companyName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">E-posta:</span>
          <span class="info-value">${data.email}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Telefon:</span>
          <span class="info-value">${data.phone}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">📦 Hizmet Bilgileri</div>
        <div class="info-row">
          <span class="info-label">Hizmet Türü:</span>
          <span class="info-value">${serviceTypeLabel}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Taşıma Türü:</span>
          <span class="info-value">${transportModeLabels[data.transportMode] || data.transportMode}</span>
        </div>
        ${data.transportDetail ? `
        <div class="info-row">
          <span class="info-label">Detay:</span>
          <span class="info-value">${transportDetailLabels[data.transportDetail] || data.transportDetail}</span>
        </div>
        ` : ""}
      </div>

      <div class="section">
        <div class="section-title">📍 Gönderen Bilgileri</div>
        <div class="info-row">
          <span class="info-label">Ülke:</span>
          <span class="info-value">${data.senderCountry}</span>
        </div>
        <div class="info-row">
          <span class="info-label">İl / İlçe:</span>
          <span class="info-value">${data.senderCity} / ${data.senderDistrict}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Posta Kodu:</span>
          <span class="info-value">${data.senderPostalCode}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Adres:</span>
          <span class="info-value">${data.senderAddress}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">🎯 Alıcı Bilgileri</div>
        <div class="info-row">
          <span class="info-label">Ülke:</span>
          <span class="info-value">${data.receiverCountry}</span>
        </div>
        <div class="info-row">
          <span class="info-label">İl / İlçe:</span>
          <span class="info-value">${data.receiverCity} / ${data.receiverDistrict}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Posta Kodu:</span>
          <span class="info-value">${data.receiverPostalCode}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Adres:</span>
          <span class="info-value">${data.receiverAddress}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">📏 Yük Özellikleri</div>
        <div class="cargo-specs">
          <div class="info-row">
            <span class="info-label">En:</span>
            <span class="info-value">${data.cargoWidth} cm</span>
          </div>
          <div class="info-row">
            <span class="info-label">Boy:</span>
            <span class="info-value">${data.cargoLength} cm</span>
          </div>
          <div class="info-row">
            <span class="info-label">Yükseklik:</span>
            <span class="info-value">${data.cargoHeight} cm</span>
          </div>
          <div class="info-row">
            <span class="info-label">Ağırlık:</span>
            <span class="info-value">${data.cargoWeight} kg</span>
          </div>
          <div class="info-row">
            <span class="info-label">Adet:</span>
            <span class="info-value">${data.cargoQuantity}</span>
          </div>
        </div>
      </div>

      <div style="text-align: center; margin-top: 20px; color: #64748B; font-size: 12px;">
        <p>Bu e-posta REX Lojistik web sitesi teklif formundan otomatik olarak gönderilmiştir.</p>
        <p>Tarih: ${new Date().toLocaleString("tr-TR")}</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const formData = req.body;

    // Format email content
    const emailHtml = formatEmailContent(formData);

    // Send email using a service (example with Resend, SendGrid, or native fetch to email API)
    // For now, we'll use a simple implementation that works with most email services
    
    const emailData = {
      to: "info@rexlojistik.com",
      subject: `Yeni Teklif Talebi - ${formData.companyName}`,
      html: emailHtml,
      from: "noreply@rexlojistik.com",
      replyTo: formData.email,
    };

    // Example with Resend (you'll need to install: npm i resend)
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send(emailData);

    // For development/testing, log the email content
    console.log("=== EMAIL TO SEND ===");
    console.log("To:", emailData.to);
    console.log("Subject:", emailData.subject);
    console.log("From:", emailData.from);
    console.log("Reply-To:", emailData.replyTo);
    console.log("\nForm Data:", JSON.stringify(formData, null, 2));
    console.log("====================");

    // TODO: Implement actual email sending here
    // You can use: Resend, SendGrid, NodeMailer, AWS SES, etc.
    // For now, returning success for testing
    
    return res.status(200).json({
      success: true,
      message: "Teklif talebiniz başarıyla alındı",
    });

  } catch (error) {
    console.error("Error processing quote request:", error);
    return res.status(500).json({
      success: false,
      message: "Form gönderilirken bir hata oluştu",
    });
  }
}