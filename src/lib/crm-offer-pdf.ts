import jsPDF from "jspdf";
import autoTable, { type UserOptions } from "jspdf-autotable";
import assets from "./crm-offer-pdf-assets.json";
import type { DeliverableCrmOffer, OfferRecipient } from "./crm-offer-delivery";

const NAVY: [number, number, number] = [23, 55, 99];
const ORANGE: [number, number, number] = [243, 112, 33];
const SLATE: [number, number, number] = [51, 65, 85];
const BORDER: [number, number, number] = [203, 213, 225];
const money = (amount: number, currency: string) => new Intl.NumberFormat("tr-TR", {
  style: "currency", currency, minimumFractionDigits: 2,
}).format(amount);
const value = (input: unknown) => input == null || input === "" ? "Belirtilmedi" : String(input);

// Static imports keep the logo and Unicode fonts inside the server bundle,
// including Vercel functions, without filesystem paths or network requests.
export function buildCrmOfferPdf(offer: DeliverableCrmOffer, recipient: OfferRecipient) {
  const doc = new jsPDF({ unit: "mm", format: "a4", putOnlyUsedFonts: true, compress: true });
  doc.addFileToVFS("NotoSans-Regular.ttf", assets.regular);
  doc.addFileToVFS("NotoSans-Bold.ttf", assets.bold);
  doc.addFont("NotoSans-Regular.ttf", "NotoSans", "normal");
  doc.addFont("NotoSans-Bold.ttf", "NotoSans", "bold");
  doc.setFont("NotoSans", "normal");

  const letterhead = () => {
    doc.setFillColor(...ORANGE); doc.rect(0, 0, 71.4, 2, "F");
    doc.setFillColor(...NAVY); doc.rect(71.4, 0, 138.6, 2, "F");
    doc.addImage(`data:image/png;base64,${assets.logo}`, "PNG", 14, -6, 48, 48, undefined, "FAST");
    doc.setFont("NotoSans", "bold"); doc.setTextColor(...NAVY); doc.setFontSize(15);
    doc.text("HİZMET TEKLİFİ / OFFER", 196, 15, { align: "right" });
    doc.setFontSize(8); doc.setTextColor(...ORANGE);
    // Wrap unusually long identifiers within the right-hand header column.
    const identifierLines: string[] = doc.splitTextToSize(offer.offer_no, 120);
    doc.text(identifierLines.length > 2 ? [identifierLines[0], `${identifierLines[1].slice(0, -3)}...`] : identifierLines,
      196, 22, { align: "right" });
    doc.setFont("NotoSans", "normal"); doc.setTextColor(...SLATE);
    doc.text(`Versiyon / Version: ${offer.version_no}  |  Revizyon / Revision: ${offer.revision_no ?? 0}`, 196, 35, { align: "right" });
    doc.setFont("NotoSans", "bold"); doc.setTextColor(...NAVY); doc.setFontSize(9.2);
    doc.text("REX LOJİSTİK TAŞIMACILIK DEPOLAMA DANIŞMANLIK LİMİTED ŞİRKETİ", 14, 49);
    doc.setFont("NotoSans", "normal"); doc.setTextColor(...SLATE); doc.setFontSize(8.2);
    doc.text("Folkart Towers A Kule No:47/B K:26 D:2601", 14, 56);
    doc.text("Adalet Mahallesi Manas Bulvarı, Bayraklı, 35530, İzmir", 14, 62);
    doc.text("+90 (232) 229 0014  |  +90 (543) 401 0755  |  info@rexlojistik.com  |  www.rexlojistik.com", 14, 68);
    doc.setDrawColor(...BORDER); doc.setLineWidth(0.2); doc.line(14, 76, 196, 76);
  };
  let cursor = 82;
  const table = (options: UserOptions) => {
    // Reserve room for a heading and at least one row before starting a section.
    if (cursor > 246) { doc.addPage(); cursor = 82; }
    autoTable(doc, {
      startY: cursor, theme: "grid", tableWidth: 182,
      margin: { left: 14, right: 14, top: 82, bottom: 24 },
      styles: { font: "NotoSans", fontSize: 8, cellPadding: 3, textColor: SLATE,
        fillColor: [255, 255, 255], valign: "top", lineColor: BORDER,
        lineWidth: 0.2, overflow: "linebreak" },
      headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7 },
      rowPageBreak: "avoid", showHead: "everyPage",
      ...options,
    });
    cursor = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 7;
  };
  table({
    head: [["TEKLİF BİLGİLERİ / OFFER DETAILS", "MÜŞTERİ VE ROTA / CUSTOMER & ROUTE"]],
    body: [[
      [`Teklif / Offer: ${offer.offer_no} / V${offer.version_no}`,
        `Konu / Subject: ${value(offer.subject)}`,
        `Teklif tutarı / Offer amount: ${money(offer.amount, offer.currency)}`,
        `Geçerlilik / Valid until: ${offer.valid_until ? new Date(`${offer.valid_until}T12:00:00`).toLocaleDateString("tr-TR") : "Belirtilmedi"}`,
        `KDV / VAT: ${offer.vat_rate == null ? "Kalem bazında / Per item" : `%${offer.vat_rate}`}`].join("\n"),
      [`Firma / Company: ${value(recipient.company_name)}`,
        `Yetkili / Contact: ${value(recipient.contact_name)}`,
        `E-posta / Email: ${value(recipient.email)}`,
        `Çıkış / Origin: ${value(offer.pickup_location)}`,
        `Varış / Destination: ${value(offer.delivery_location)}`].join("\n"),
    ]], columnStyles: { 0: { cellWidth: 82 }, 1: { cellWidth: 100 } },
  });
  table({
    head: [["HİZMET VE YÜK / SERVICE & CARGO", "ÖDEME VE KOŞULLAR / PAYMENT & TERMS"]],
    headStyles: { fillColor: ORANGE, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7 },
    body: [[
      [`Hizmet / Service: ${value(offer.service_type)}`, `Araç / Vehicle: ${value(offer.vehicle_type)}`,
        `Yük / Cargo: ${value(offer.cargo_description)}`,
        `Ağırlık / Weight: ${offer.weight_kg ?? 0} kg  |  Palet / Pallets: ${offer.pallet_count ?? 0}`].join("\n"),
      [`Ödeme / Payment: ${value(offer.payment_terms)}`, `Teslim şekli / Incoterm: ${value(offer.incoterm)}`].join("\n"),
    ]], columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 82 } },
  });
  if (offer.crm_offer_items?.length) {
    table({ head: [[{ content: "FİYAT KALEMLERİ / PRICE ITEMS", colSpan: 6 }],
      ["#", "AÇIKLAMA / DESCRIPTION", "MİKTAR / QTY", "BİRİM FİYAT / UNIT PRICE", "KDV / VAT", "TUTAR / AMOUNT"]],
      body: offer.crm_offer_items.map((item, index) => [String(index + 1), item.description,
        `${item.quantity} ${item.unit}`, money(item.unit_price, offer.currency), `%${item.tax_rate}`,
        money(item.quantity * item.unit_price, offer.currency)]),
      columnStyles: { 0: { cellWidth: 8 }, 1: { cellWidth: 58 }, 2: { cellWidth: 25 },
        3: { cellWidth: 34, halign: "right" }, 4: { cellWidth: 20, halign: "right" },
        5: { cellWidth: 37, halign: "right" } },
    });
  }
  // The stored offer amount remains authoritative; do not recompute its VAT basis.
  table({ body: [["TEKLİF TUTARI / OFFER AMOUNT", money(offer.amount, offer.currency)]],
    styles: { font: "NotoSans", fontStyle: "bold", fontSize: 10, cellPadding: 4,
      textColor: NAVY, fillColor: [241, 245, 249], lineColor: BORDER, lineWidth: 0.2 },
    columnStyles: { 0: { cellWidth: 130 }, 1: { cellWidth: 52, halign: "right" } },
  });
  if (offer.notes) table({
    head: [["AÇIKLAMA / NOTES"]], body: [[offer.notes]],
    headStyles: { fillColor: ORANGE, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7 },
  });
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page); letterhead();
    doc.setDrawColor(...NAVY); doc.setLineWidth(0.5); doc.line(14, 281, 196, 281);
    doc.setFont("NotoSans", "normal"); doc.setTextColor(...SLATE); doc.setFontSize(6.5);
    doc.text("TİO Yetki Belgesi: İZM.U-NET.TİO.35.6323  |  VKN: 7342549288", 14, 286);
    doc.text(`Sayfa / Page ${page} / ${pages}`, 196, 286, { align: "right" });
    doc.setFontSize(5.7);
    doc.text("Bu belge hizmet teklifidir; fatura veya taşıma belgesi yerine geçmez. / This is a service offer, not an invoice or waybill.",
      105, 290, { align: "center", maxWidth: 182 });
  }
  return Buffer.from(doc.output("arraybuffer"));
}
