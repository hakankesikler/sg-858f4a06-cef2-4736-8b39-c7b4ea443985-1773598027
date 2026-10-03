import { buildCrmOfferPdf } from "./crm-offer-pdf";
import { Resend } from "resend";

export type DeliverableCrmOffer = {
  id: string;
  offer_no: string;
  version_no: number;
  subject: string;
  amount: number;
  currency: string;
  valid_until: string | null;
  notes: string | null;
  pickup_location?: string | null;
  delivery_location?: string | null;
  service_type?: string | null;
  vehicle_type?: string | null;
  cargo_description?: string | null;
  weight_kg?: number | null;
  pallet_count?: number | null;
  vat_rate?: number | null;
  payment_terms?: string | null;
  incoterm?: string | null;
  revision_no?: number | null;
  crm_offer_items?: Array<{ description: string; quantity: number; unit: string; unit_price: number; tax_rate: number }>;
};

export type OfferRecipient = {
  company_name: string;
  contact_name: string | null;
  email: string;
};

const escapeHtml = (value: unknown) => String(value ?? "")
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;").replaceAll("'", "&#039;");

const amountText = (amount: number, currency: string) => new Intl.NumberFormat("tr-TR", {
  style: "currency", currency, minimumFractionDigits: 2,
}).format(amount);

export const createCrmOfferPdf = buildCrmOfferPdf;

export async function sendCrmOfferEmail(offer: DeliverableCrmOffer, recipient: OfferRecipient) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("E-posta servisi yapılandırılmamış");
  const resend = new Resend(apiKey);
  const from = process.env.QUOTE_FROM_EMAIL || "REX Lojistik <onboarding@resend.dev>";
  const price = amountText(offer.amount, offer.currency);
  const validUntil = offer.valid_until ? new Date(`${offer.valid_until}T12:00:00`).toLocaleDateString("tr-TR") : "Belirtilmedi";
  const pdf = createCrmOfferPdf(offer, recipient);
  const result = await resend.emails.send({
    from,
    to: [recipient.email],
    replyTo: "info@rexlojistik.com",
    subject: `REX Lojistik Teklifi - ${offer.offer_no}`,
    text: `Sayın ${recipient.contact_name || recipient.company_name},\n\n${offer.subject} başlıklı ${offer.offer_no} numaralı teklifimiz ektedir.\nTeklif tutarı: ${price}\nGeçerlilik: ${validUntil}\n\nREX Lojistik`,
    html: `<div style="font-family:Arial,sans-serif;color:#10213e;max-width:640px;margin:auto"><div style="background:#10213e;padding:24px;color:#fff"><h1 style="margin:0">REX Lojistik</h1><p style="margin:8px 0 0">Taşıma ve lojistik hizmet teklifi</p></div><div style="padding:28px;border:1px solid #e2e8f0"><p>Sayın ${escapeHtml(recipient.contact_name || recipient.company_name)},</p><p><strong>${escapeHtml(offer.subject)}</strong> başlıklı teklifimizi bilgilerinize sunarız.</p><table style="width:100%;border-collapse:collapse;margin:22px 0"><tr><td style="padding:10px;border-bottom:1px solid #eee">Teklif no</td><td style="padding:10px;border-bottom:1px solid #eee"><strong>${escapeHtml(offer.offer_no)} / V${offer.version_no}</strong></td></tr><tr><td style="padding:10px;border-bottom:1px solid #eee">Güzergâh</td><td style="padding:10px;border-bottom:1px solid #eee">${escapeHtml([offer.pickup_location, offer.delivery_location].filter(Boolean).join(" → ") || "Belirtilmedi")}</td></tr><tr><td style="padding:10px;border-bottom:1px solid #eee">Teklif tutarı</td><td style="padding:10px;border-bottom:1px solid #eee"><strong>${escapeHtml(price)}</strong></td></tr><tr><td style="padding:10px;border-bottom:1px solid #eee">Geçerlilik</td><td style="padding:10px;border-bottom:1px solid #eee">${escapeHtml(validUntil)}</td></tr></table><p>Teklif belgesi PDF olarak ektedir. Sorularınız için bu e-postayı yanıtlayabilirsiniz.</p><p style="margin-top:28px">Saygılarımızla,<br><strong>REX Lojistik</strong><br>+90 (543) 401 07 55</p></div></div>`,
    attachments: [{ filename: `${offer.offer_no}-V${offer.version_no}.pdf`, content: pdf, contentType: "application/pdf" }],
    headers: { "X-Entity-Ref-ID": `${offer.id}-v${offer.version_no}` },
  }, { idempotencyKey: `crm-offer-${offer.id}-v${offer.version_no}` });
  if (result.error) throw new Error(result.error.message || "Teklif e-postası teslim edilemedi");
  return result.data?.id || "";
}
