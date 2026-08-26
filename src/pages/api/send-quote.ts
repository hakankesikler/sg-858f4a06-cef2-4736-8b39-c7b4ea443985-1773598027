import type { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";

type ResponseData = {
  success: boolean;
  message: string;
};

const resend = new Resend(process.env.RESEND_API_KEY);
const PRIVACY_NOTICE_VERSION = "2026-08-26";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 3;
const requestLog = new Map<string, number[]>();

function requestIp(req: NextApiRequest) {
  const forwarded = req.headers["x-forwarded-for"];
  return (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0])?.trim() || req.socket.remoteAddress || "unknown";
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const recent = (requestLog.get(ip) || []).filter((timestamp) => now - timestamp < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) return true;
  recent.push(now);
  requestLog.set(ip, recent);
  return false;
}

function validText(value: unknown, maxLength: number) {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}

function validPositiveNumber(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return false;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0;
}

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
E-posta: ${data.email || "Belirtilmedi"}
Telefon: ${data.phone || "Belirtilmedi"}

============================================
📦 HİZMET BİLGİLERİ
============================================
Hizmet Türü: ${serviceTypeLabel}
Taşıma Türü: ${transportModeLabels[data.transportMode] || data.transportMode}
${data.transportDetail ? `Detay: ${transportDetailLabels[data.transportDetail] || data.transportDetail}` : ""}

============================================
📍 GÜZERGÂH
============================================
Yükleme Noktası: ${data.loadingPoint}
Teslimat Noktası: ${data.deliveryPoint}

============================================
📏 YÜK ÖZELLİKLERİ (${data.cargos.length} Adet Yük)
============================================
${cargosText}

============================================
📝 EK NOTLAR
============================================
${data.specialRequirements || "Belirtilmedi"}

============================================
🔐 AYDINLATMA VE İLETİŞİM TERCİHLERİ
============================================
KVKK Aydınlatma Kaydı: Alındı
Ticari Elektronik İleti İzni: ${data.commercialConsent === true ? "Verildi" : "Verilmedi"}
Kayıt Zamanı: ${data.consentRecordedAt}
Aydınlatma Metni Sürümü: ${data.privacyNoticeVersion}

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

    const origin = req.headers.origin;
    if (origin && !/^https:\/\/(www\.)?rexlojistik\.com$/i.test(origin)) {
      return res.status(403).json({ success: false, message: "İstek reddedildi" });
    }

    if (isRateLimited(requestIp(req))) {
      return res.status(429).json({ success: false, message: "Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin." });
    }

    const emailProvided = validText(formData?.email, 200);
    const phoneProvided = validText(formData?.phone, 40);
    const emailValid = !formData?.email || (emailProvided && /^\S+@\S+\.\S+$/.test(formData.email));
    const phoneValid = !formData?.phone || (phoneProvided && formData.phone.replace(/\D/g, "").length >= 10);

    if (
      !validText(formData?.fullName, 120) ||
      !validText(formData?.companyName, 160) ||
      (!emailProvided && !phoneProvided) ||
      !emailValid ||
      !phoneValid ||
      !["domestic", "international"].includes(formData?.serviceType) ||
      !["road", "air", "sea"].includes(formData?.transportMode) ||
      !validText(formData?.loadingPoint, 200) ||
      !validText(formData?.deliveryPoint, 200) ||
      formData?.kvkkAcknowledged !== true ||
      (formData?.commercialConsent !== undefined && typeof formData.commercialConsent !== "boolean") ||
      (formData?.specialRequirements && (typeof formData.specialRequirements !== "string" || formData.specialRequirements.length > 2000))
    ) {
      return res.status(400).json({ success: false, message: "Form bilgileri geçersiz" });
    }

    if (!Array.isArray(formData.cargos) || formData.cargos.length === 0 || formData.cargos.length > 20) {
      return res.status(400).json({
        success: false,
        message: "En az bir yük bilgisi girilmelidir",
      });
    }

    if (formData.cargos.some((cargo: any) => (
      !validPositiveNumber(cargo?.width) ||
      !validPositiveNumber(cargo?.length) ||
      !validPositiveNumber(cargo?.height) ||
      !validPositiveNumber(cargo?.weight) ||
      !validPositiveNumber(cargo?.quantity)
    ))) {
      return res.status(400).json({ success: false, message: "Yük bilgileri geçersiz" });
    }

    const emailText = formatEmailText({
      ...formData,
      commercialConsent: formData.commercialConsent === true,
      consentRecordedAt: new Date().toISOString(),
      privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
    });

    const { data, error } = await resend.emails.send({
      from: "REX Lojistik <onboarding@resend.dev>",
      to: ["hakankesikler@gmail.com"],
      ...(emailProvided ? { replyTo: formData.email.trim() } : {}),
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
