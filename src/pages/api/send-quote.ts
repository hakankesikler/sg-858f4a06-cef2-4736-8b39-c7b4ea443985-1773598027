import type { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";

type ResponseData = {
  success: boolean;
  message: string;
};

const resend = new Resend(process.env.RESEND_API_KEY);

function formatEmailText(data: any): string {
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

  const cargosText = data.cargos.map((cargo: any, index: number) => `
📦 Yük #${index + 1}
  En: ${cargo.width} cm
  Boy: ${cargo.length} cm
  Yükseklik: ${cargo.height} cm
  Ağırlık: ${cargo.weight} kg
  Adet: ${cargo.quantity}
`).join('\n');

  return `
🚚 YENİ TEKLİF TALEBİ
REX Lojistik - Teklif Formu

============================================
👤 KİŞİSEL BİLGİLER
============================================
Ad Soyad: ${data.fullName}
Firma İsmi: ${data.companyName}
E-posta: ${data.email}
Telefon: ${data.phone}

============================================
📦 HİZMET BİLGİLERİ
============================================
Hizmet Türü: ${serviceTypeLabel}
Taşıma Türü: ${transportModeLabels[data.transportMode] || data.transportMode}
${data.transportDetail ? `Detay: ${transportDetailLabels[data.transportDetail] || data.transportDetail}` : ""}

============================================
📍 GÖNDEREN BİLGİLERİ
============================================
Ülke: ${data.senderCountry}
İl / İlçe: ${data.senderCity} / ${data.senderDistrict}
Posta Kodu: ${data.senderPostalCode}
Adres: ${data.senderAddress}

============================================
🎯 ALICI BİLGİLERİ
============================================
Ülke: ${data.receiverCountry}
İl / İlçe: ${data.receiverCity} / ${data.receiverDistrict}
Posta Kodu: ${data.receiverPostalCode}
Adres: ${data.receiverAddress}

============================================
📏 YÜK ÖZELLİKLERİ (${data.cargos.length} Adet Yük)
============================================
${cargosText}

============================================
Bu e-posta REX Lojistik web sitesi teklif formundan otomatik olarak gönderilmiştir.
Tarih: ${new Date().toLocaleString("tr-TR")}
============================================
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

    const emailText = formatEmailText(formData);

    const { data, error } = await resend.emails.send({
      from: "REX Lojistik <onboarding@resend.dev>",
      to: ["hakankesikler@gmail.com"],
      replyTo: formData.email,
      subject: `Yeni Teklif Talebi - ${formData.companyName}`,
      text: emailText,
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