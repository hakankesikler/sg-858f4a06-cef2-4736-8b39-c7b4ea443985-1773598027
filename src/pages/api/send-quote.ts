import type { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";

type ResponseData = {
  success: boolean;
  message: string;
};

const resend = new Resend(process.env.RESEND_API_KEY);

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

  const cargosHtml = data.cargos.map((cargo: any, index: number) => `
    <div style="background: #f8f9fa; padding: 12px; border-radius: 6px; margin-bottom: 10px;">
      <div style="font-weight: bold; color: #F97316; margin-bottom: 8px;">📦 Yük #${index + 1}</div>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
        <div style="display: flex; margin-bottom: 8px;">
          <span style="font-weight: bold; min-width: 150px; color: #64748B;">En:</span>
          <span style="color: #0F172A;">${cargo.width} cm</span>
        </div>
        <div style="display: flex; margin-bottom: 8px;">
          <span style="font-weight: bold; min-width: 150px; color: #64748B;">Boy:</span>
          <span style="color: #0F172A;">${cargo.length} cm</span>
        </div>
        <div style="display: flex; margin-bottom: 8px;">
          <span style="font-weight: bold; min-width: 150px; color: #64748B;">Yükseklik:</span>
          <span style="color: #0F172A;">${cargo.height} cm</span>
        </div>
        <div style="display: flex; margin-bottom: 8px;">
          <span style="font-weight: bold; min-width: 150px; color: #64748B;">Ağırlık:</span>
          <span style="color: #0F172A;">${cargo.weight} kg</span>
        </div>
        <div style="display: flex; margin-bottom: 8px;">
          <span style="font-weight: bold; min-width: 150px; color: #64748B;">Adet:</span>
          <span style="color: #0F172A;">${cargo.quantity}</span>
        </div>
      </div>
    </div>
  `).join('');

  return `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: #0F172A; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="margin: 0; font-size: 24px;">🚚 Yeni Teklif Talebi</h1>
      <p style="margin: 10px 0 0 0; font-size: 14px;">REX Lojistik - Teklif Formu</p>
    </div>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px;">
      <div style="margin-bottom: 20px; background: white; padding: 15px; border-radius: 6px;">
        <div style="color: #0F172A; font-size: 18px; font-weight: bold; margin-bottom: 10px; border-bottom: 2px solid #F97316; padding-bottom: 5px;">👤 Kişisel Bilgiler</div>
        <div style="display: flex; margin-bottom: 8px;">
          <span style="font-weight: bold; min-width: 150px; color: #64748B;">Ad Soyad:</span>
          <span style="color: #0F172A;">${data.fullName}</span>
        </div>
        <div style="display: flex; margin-bottom: 8px;">
          <span style="font-weight: bold; min-width: 150px; color: #64748B;">Firma İsmi:</span>
          <span style="color: #0F172A;">${data.companyName}</span>
        </div>
        <div style="display: flex; margin-bottom: 8px;">
          <span style="font-weight: bold; min-width: 150px; color: #64748B;">E-posta:</span>
          <span style="color: #0F172A;">${data.email}</span>
        </div>
        <div style="display: flex; margin-bottom: 8px;">
          <span style="font-weight: bold; min-width: 150px; color: #64748B;">Telefon:</span>
          <span style="color: #0F172A;">${data.phone}</span>
        </div>
      </div>

      <div style="margin-bottom: 20px; background: white; padding: 15px; border-radius: 6px;">
        <div style="color: #0F172A; font-size: 18px; font-weight: bold; margin-bottom: 10px; border-bottom: 2px solid #F97316; padding-bottom: 5px;">📦 Hizmet Bilgileri</div>
        <div style="display: flex; margin-bottom: 8px;">
          <span style="font-weight: bold; min-width: 150px; color: #64748B;">Hizmet Türü:</span>
          <span style="color: #0F172A;">${serviceTypeLabel}</span>
        </div>
        <div style="display: flex; margin-bottom: 8px;">
          <span style="font-weight: bold; min-width: 150px; color: #64748B;">Taşıma Türü:</span>
          <span style="color: #0F172A;">${transportModeLabels[data.transportMode] || data.transportMode}</span>
        </div>
        ${data.transportDetail ? `
        <div style="display: flex; margin-bottom: 8px;">
          <span style="font-weight: bold; min-width: 150px; color: #64748B;">Detay:</span>
          <span style="color: #0F172A;">${transportDetailLabels[data.transportDetail] || data.transportDetail}</span>
        </div>
        ` : ""}
      </div>

      <div style="margin-bottom: 20px; background: white; padding: 15px; border-radius: 6px;">
        <div style="color: #0F172A; font-size: 18px; font-weight: bold; margin-bottom: 10px; border-bottom: 2px solid #F97316; padding-bottom: 5px;">📍 Gönderen Bilgileri</div>
        <div style="display: flex; margin-bottom: 8px;">
          <span style="font-weight: bold; min-width: 150px; color: #64748B;">Ülke:</span>
          <span style="color: #0F172A;">${data.senderCountry}</span>
        </div>
        <div style="display: flex; margin-bottom: 8px;">
          <span style="font-weight: bold; min-width: 150px; color: #64748B;">İl / İlçe:</span>
          <span style="color: #0F172A;">${data.senderCity} / ${data.senderDistrict}</span>
        </div>
        <div style="display: flex; margin-bottom: 8px;">
          <span style="font-weight: bold; min-width: 150px; color: #64748B;">Posta Kodu:</span>
          <span style="color: #0F172A;">${data.senderPostalCode}</span>
        </div>
        <div style="display: flex; margin-bottom: 8px;">
          <span style="font-weight: bold; min-width: 150px; color: #64748B;">Adres:</span>
          <span style="color: #0F172A;">${data.senderAddress}</span>
        </div>
      </div>

      <div style="margin-bottom: 20px; background: white; padding: 15px; border-radius: 6px;">
        <div style="color: #0F172A; font-size: 18px; font-weight: bold; margin-bottom: 10px; border-bottom: 2px solid #F97316; padding-bottom: 5px;">🎯 Alıcı Bilgileri</div>
        <div style="display: flex; margin-bottom: 8px;">
          <span style="font-weight: bold; min-width: 150px; color: #64748B;">Ülke:</span>
          <span style="color: #0F172A;">${data.receiverCountry}</span>
        </div>
        <div style="display: flex; margin-bottom: 8px;">
          <span style="font-weight: bold; min-width: 150px; color: #64748B;">İl / İlçe:</span>
          <span style="color: #0F172A;">${data.receiverCity} / ${data.receiverDistrict}</span>
        </div>
        <div style="display: flex; margin-bottom: 8px;">
          <span style="font-weight: bold; min-width: 150px; color: #64748B;">Posta Kodu:</span>
          <span style="color: #0F172A;">${data.receiverPostalCode}</span>
        </div>
        <div style="display: flex; margin-bottom: 8px;">
          <span style="font-weight: bold; min-width: 150px; color: #64748B;">Adres:</span>
          <span style="color: #0F172A;">${data.receiverAddress}</span>
        </div>
      </div>

      <div style="margin-bottom: 20px; background: white; padding: 15px; border-radius: 6px;">
        <div style="color: #0F172A; font-size: 18px; font-weight: bold; margin-bottom: 10px; border-bottom: 2px solid #F97316; padding-bottom: 5px;">📏 Yük Özellikleri (${data.cargos.length} Adet Yük)</div>
        ${cargosHtml}
      </div>

      <div style="text-align: center; margin-top: 20px; color: #64748B; font-size: 12px;">
        <p style="margin: 5px 0;">Bu e-posta REX Lojistik web sitesi teklif formundan otomatik olarak gönderilmiştir.</p>
        <p style="margin: 5px 0;">Tarih: ${new Date().toLocaleString("tr-TR")}</p>
      </div>
    </div>
  </div>
</div>
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

    if (!formData.cargos || !Array.isArray(formData.cargos) || formData.cargos.length === 0) {
      return res.status(400).json({
        success: false,
        message: "En az bir yük bilgisi girilmelidir",
      });
    }

    const emailHtml = formatEmailContent(formData);

    const { data, error } = await resend.emails.send({
      from: "REX Lojistik <onboarding@resend.dev>",
      to: ["info@rexlojistik.com"],
      replyTo: formData.email,
      subject: `Yeni Teklif Talebi - ${formData.companyName}`,
      html: emailHtml,
    });

    if (error) {
      console.error("Resend API Error:", error);
      return res.status(400).json({
        success: false,
        message: "E-posta gönderilemedi. Lütfen tekrar deneyin.",
      });
    }

    console.log("✅ Email sent successfully:", data);

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