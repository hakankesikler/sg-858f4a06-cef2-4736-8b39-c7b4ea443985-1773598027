import { Resend } from "resend";

export type StoredQuoteRequest = {
  id: string;
  full_name: string;
  company_name: string;
  email: string | null;
  phone: string | null;
  service_type: "domestic" | "international";
  transport_mode: "road" | "air" | "sea";
  transport_detail: string | null;
  loading_point: string;
  delivery_point: string;
  cargos: Array<{ width: string | number; length: string | number; height: string | number; weight: string | number; quantity: string | number }>;
  special_requirements: string | null;
  commercial_consent: boolean;
  consent_recorded_at: string;
  privacy_notice_version: string;
};

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
  "container-20": "20' Konteyner",
  "container-40": "40' Konteyner",
};

export function formatQuoteEmail(data: StoredQuoteRequest): string {
  const cargosText = data.cargos.map((cargo, index) => `
Yük #${index + 1}
  En: ${cargo.width} cm
  Boy: ${cargo.length} cm
  Yükseklik: ${cargo.height} cm
  Ağırlık: ${cargo.weight} kg
  Adet: ${cargo.quantity}
`).join("\n");

  return `YENİ TEKLİF TALEBİ
REX Lojistik - Teklif Formu

KİŞİSEL BİLGİLER
Ad Soyad: ${data.full_name}
Firma İsmi: ${data.company_name}
E-posta: ${data.email || "Belirtilmedi"}
Telefon: ${data.phone || "Belirtilmedi"}

HİZMET BİLGİLERİ
Hizmet Türü: ${data.service_type === "domestic" ? "Yurt İçi" : "Uluslararası"}
Taşıma Türü: ${transportModeLabels[data.transport_mode] || data.transport_mode}
${data.transport_detail ? `Detay: ${transportDetailLabels[data.transport_detail] || data.transport_detail}` : ""}

GÜZERGÂH
Yükleme Noktası: ${data.loading_point}
Teslimat Noktası: ${data.delivery_point}

YÜK ÖZELLİKLERİ (${data.cargos.length} Adet Yük)
${cargosText}

EK NOTLAR
${data.special_requirements || "Belirtilmedi"}

AYDINLATMA VE İLETİŞİM TERCİHLERİ
KVKK Aydınlatma Kaydı: Alındı
Ticari Elektronik İleti İzni: ${data.commercial_consent ? "Verildi" : "Verilmedi"}
Kayıt Zamanı: ${data.consent_recorded_at}
Aydınlatma Metni Sürümü: ${data.privacy_notice_version}

Talep Kimliği: ${data.id}
Bu e-posta REX Lojistik web sitesi teklif formundan otomatik olarak gönderilmiştir.`;
}

export async function sendQuoteEmail(data: StoredQuoteRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("E-posta servisi yapılandırılmamış");

  const resend = new Resend(apiKey);
  const from = process.env.QUOTE_FROM_EMAIL || "REX Lojistik <onboarding@resend.dev>";
  const to = process.env.QUOTE_RECIPIENT_EMAIL || "info@rexlojistik.com";
  const result = await resend.emails.send({
    from,
    to: [to],
    ...(data.email ? { replyTo: data.email } : {}),
    subject: `Yeni Teklif Talebi - ${data.company_name}`,
    text: formatQuoteEmail(data),
    headers: { "X-Entity-Ref-ID": data.id },
  });

  if (result.error) throw new Error(result.error.message || "E-posta teslim edilemedi");
  return result.data?.id || "";
}
