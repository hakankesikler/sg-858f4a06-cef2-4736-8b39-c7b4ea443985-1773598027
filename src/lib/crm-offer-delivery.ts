import jsPDF from "jspdf";
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
};

export type OfferRecipient = {
  company_name: string;
  contact_name: string | null;
  email: string;
};

const escapeHtml = (value: unknown) => String(value ?? "")
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;").replaceAll("'", "&#039;");

const trToPdf = (value: unknown) => String(value ?? "")
  .replaceAll("Ç", "C").replaceAll("Ğ", "G").replaceAll("İ", "I")
  .replaceAll("Ö", "O").replaceAll("Ş", "S").replaceAll("Ü", "U")
  .replaceAll("ç", "c").replaceAll("ğ", "g").replaceAll("ı", "i")
  .replaceAll("ö", "o").replaceAll("ş", "s").replaceAll("ü", "u");

const amountText = (amount: number, currency: string) => new Intl.NumberFormat("tr-TR", {
  style: "currency", currency, minimumFractionDigits: 2,
}).format(amount);

export function createCrmOfferPdf(offer: DeliverableCrmOffer, recipient: OfferRecipient) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setFillColor(16, 33, 62);
  doc.rect(0, 0, 210, 35, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text("REX LOJISTIK", 18, 17);
  doc.setFontSize(10);
  doc.text("Tasima ve Lojistik Hizmet Teklifi", 18, 25);

  doc.setTextColor(16, 33, 62);
  doc.setFontSize(15);
  doc.text(trToPdf(offer.subject), 18, 52);
  doc.setFontSize(10);
  const rows = [
    ["Teklif No", `${offer.offer_no} / V${offer.version_no}`],
    ["Firma", trToPdf(recipient.company_name)],
    ["Yetkili", trToPdf(recipient.contact_name || "-")],
    ["Teklif Tutari", trToPdf(amountText(offer.amount, offer.currency))],
    ["Gecerlilik", offer.valid_until ? new Date(`${offer.valid_until}T12:00:00`).toLocaleDateString("tr-TR") : "Belirtilmedi"],
  ];
  let y = 65;
  for (const [label, value] of rows) {
    doc.setFont("helvetica", "bold"); doc.text(label, 18, y);
    doc.setFont("helvetica", "normal"); doc.text(value, 65, y);
    doc.setDrawColor(225, 231, 239); doc.line(18, y + 3, 192, y + 3); y += 12;
  }
  if (offer.notes) {
    doc.setFont("helvetica", "bold"); doc.text("Aciklama", 18, y + 4);
    doc.setFont("helvetica", "normal");
    doc.text(doc.splitTextToSize(trToPdf(offer.notes), 174), 18, y + 12);
  }
  doc.setFontSize(9); doc.setTextColor(90, 103, 123);
  doc.text("REX Lojistik Tasimacilik Depolama Danismanlik Limited Sirketi", 18, 275);
  doc.text("info@rexlojistik.com  |  +90 (543) 401 07 55  |  www.rexlojistik.com", 18, 282);
  return Buffer.from(doc.output("arraybuffer"));
}

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
    html: `<div style="font-family:Arial,sans-serif;color:#10213e;max-width:640px;margin:auto"><div style="background:#10213e;padding:24px;color:#fff"><h1 style="margin:0">REX Lojistik</h1><p style="margin:8px 0 0">Taşıma ve lojistik hizmet teklifi</p></div><div style="padding:28px;border:1px solid #e2e8f0"><p>Sayın ${escapeHtml(recipient.contact_name || recipient.company_name)},</p><p><strong>${escapeHtml(offer.subject)}</strong> başlıklı teklifimizi bilgilerinize sunarız.</p><table style="width:100%;border-collapse:collapse;margin:22px 0"><tr><td style="padding:10px;border-bottom:1px solid #eee">Teklif no</td><td style="padding:10px;border-bottom:1px solid #eee"><strong>${escapeHtml(offer.offer_no)} / V${offer.version_no}</strong></td></tr><tr><td style="padding:10px;border-bottom:1px solid #eee">Teklif tutarı</td><td style="padding:10px;border-bottom:1px solid #eee"><strong>${escapeHtml(price)}</strong></td></tr><tr><td style="padding:10px;border-bottom:1px solid #eee">Geçerlilik</td><td style="padding:10px;border-bottom:1px solid #eee">${escapeHtml(validUntil)}</td></tr></table><p>Teklif belgesi PDF olarak ektedir. Sorularınız için bu e-postayı yanıtlayabilirsiniz.</p><p style="margin-top:28px">Saygılarımızla,<br><strong>REX Lojistik</strong><br>+90 (543) 401 07 55</p></div></div>`,
    attachments: [{ filename: `${offer.offer_no}-V${offer.version_no}.pdf`, content: pdf, contentType: "application/pdf" }],
    headers: { "X-Entity-Ref-ID": `${offer.id}-v${offer.version_no}` },
  }, { idempotencyKey: `crm-offer-${offer.id}-v${offer.version_no}` });
  if (result.error) throw new Error(result.error.message || "Teklif e-postası teslim edilemedi");
  return result.data?.id || "";
}
