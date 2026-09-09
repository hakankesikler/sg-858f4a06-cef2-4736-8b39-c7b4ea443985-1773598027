import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface WaybillRouteStop {
  stop_key?: string;
  stop_type: "pickup" | "delivery";
  sequence_no: number;
  company_name: string;
  address_line?: string | null;
  district?: string | null;
  city: string;
  contact_name?: string | null;
  contact_phone?: string | null;
  instructions?: string | null;
}

export interface WaybillCargoItem {
  adet: number;
  cinsi: string;
  kg_ds: number;
  route_description?: string | null;
  pickup_stop_key?: string | null;
  delivery_stop_key?: string | null;
  pickup_stop?: { company_name?: string | null; district?: string | null; city?: string | null } | null;
  delivery_stop?: { company_name?: string | null; district?: string | null; city?: string | null } | null;
}

export interface WaybillData {
  shipment_code: string;
  logo_data_url?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
  pickup_date?: string | null;
  estimated_delivery_date?: string | null;
  customer_name?: string | null;
  customer?: { name?: string | null } | null;
  sender_name?: string | null;
  origin?: string | null;
  receiver?: string | null;
  receiver_district?: string | null;
  destination?: string | null;
  driver?: { full_name?: string | null; phone_1?: string | null } | null;
  vehicle?: { cekici_plakasi?: string | null; dorse_plakasi?: string | null; arac_tipi?: string | null } | null;
  cargo_items?: WaybillCargoItem[] | null;
  shipment_cargo_items?: WaybillCargoItem[] | null;
  route_stops?: WaybillRouteStop[] | null;
  toplam_kg_ds?: number | null;
  adet?: number | null;
  cinsi?: string | null;
  kg_ds?: number | null;
}

type AutoTableDocument = jsPDF & { lastAutoTable?: { finalY: number } };

const NAVY: [number, number, number] = [23, 55, 99];
const ORANGE: [number, number, number] = [243, 112, 33];
const SLATE: [number, number, number] = [51, 65, 85];
const LIGHT: [number, number, number] = [241, 245, 249];

const pdfText = (value: unknown, fallback = "-") => {
  const result = value == null || value === "" ? fallback : String(value);
  return result.replace(/[ÇĞİÖŞÜçğıöşü]/g, (letter) => ({
    Ç: "C", Ğ: "G", İ: "I", Ö: "O", Ş: "S", Ü: "U",
    ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u",
  })[letter] || letter);
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
};

const formatWeight = (value: number) => `${new Intl.NumberFormat("tr-TR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
}).format(value)} kg/ds`;

const loadImage = (src: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.onload = () => resolve(image);
  image.onerror = reject;
  image.src = src;
});

const imageFormat = (source: string) => source.startsWith("data:image/png") ? "PNG" : "JPEG";

const stopLabel = (stop?: WaybillRouteStop | null) => {
  if (!stop) return "-";
  return [stop.company_name, [stop.district, stop.city].filter(Boolean).join(" / ")]
    .filter(Boolean)
    .join(" - ");
};

const drawLetterhead = async (doc: jsPDF, shipment: WaybillData) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(...ORANGE);
  doc.rect(0, 0, pageWidth * 0.34, 2, "F");
  doc.setFillColor(...NAVY);
  doc.rect(pageWidth * 0.34, 0, pageWidth * 0.66, 2, "F");

  try {
    if (shipment.logo_data_url) {
      doc.addImage(shipment.logo_data_url, imageFormat(shipment.logo_data_url), 14, -6, 48, 48, undefined, "FAST");
    } else {
      const logo = await loadImage("/rex_logo_gu_ncel.png");
      doc.addImage(logo, "PNG", 14, -6, 48, 48, undefined, "FAST");
    }
  } catch {
    doc.setDrawColor(...NAVY);
    doc.roundedRect(14, -6, 48, 48, 2, 2);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(...NAVY);
    doc.text("REX", 38, 24, { align: "center" });
  }

  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text("REX LOJISTIK TASIMACILIK DEPOLAMA DANISMANLIK LIMITED SIRKETI", 14, 49);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.2);
  doc.setTextColor(...SLATE);
  doc.text("Folkart Towers A Kule No:47/B K:26 D:2601", 14, 56);
  doc.text("Adalet Mahallesi Manas Bulvari, Bayrakli, 35530, Izmir", 14, 62);
  doc.text("+90 (232) 229 0014  |  +90 (543) 401 0755  |  info@rexlojistik.com  |  www.rexlojistik.com", 14, 68);

  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("TASIMA BELGESI / WAYBILL", pageWidth - 14, 15, { align: "right" });
  doc.setFontSize(8);
  doc.setTextColor(...ORANGE);
  doc.text(pdfText(shipment.shipment_code), pageWidth - 14, 22, { align: "right" });
  doc.setTextColor(...SLATE);
  doc.setFont("helvetica", "normal");
  doc.text(`Takip No / Tracking No: ${pdfText(shipment.tracking_number)}`, pageWidth - 14, 27, { align: "right" });
  doc.setDrawColor(203, 213, 225);
  doc.line(14, 76, pageWidth - 14, 76);
};

const addFooter = (doc: jsPDF, pageNumber: number, pageCount: number) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.5);
  doc.line(14, pageHeight - 16, pageWidth - 14, pageHeight - 16);
  doc.setTextColor(...SLATE);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.text("TIO Yetki Belgesi: IZM.U-NET.TIO.35.6323  |  VKN: 7342549288", 14, pageHeight - 11);
  doc.text(`Sayfa / Page ${pageNumber} / ${pageCount}`, pageWidth - 14, pageHeight - 11, { align: "right" });
  doc.setFontSize(5.7);
  doc.text(
    "Bu belge operasyon bilgilendirme amaclidir; mali belge veya sevk irsaliyesi yerine gecmez. / This document is for operational information only; it is not a fiscal document or delivery note.",
    pageWidth / 2,
    pageHeight - 7,
    { align: "center", maxWidth: pageWidth - 28 },
  );
};

export const buildWaybillPdf = async (shipment: WaybillData) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" }) as AutoTableDocument;
  const pageWidth = doc.internal.pageSize.getWidth();
  await drawLetterhead(doc, shipment);

  autoTable(doc, {
    startY: 82,
    head: [["BELGE BILGILERI / DOCUMENT DETAILS", "MUSTERI VE ROTA / CUSTOMER & ROUTE"]],
    body: [[
      pdfText([
        `Sevkiyat / Shipment: ${shipment.shipment_code}`,
        `Yukleme / Pickup: ${formatDate(shipment.pickup_date)}`,
        `Tahmini teslim / Estimated delivery: ${formatDate(shipment.estimated_delivery_date)}`,
      ].join("\n")),
      pdfText([
        `Musteri / Customer: ${shipment.customer_name || shipment.customer?.name || "-"}`,
        `Cikis / Origin: ${shipment.origin || "-"}`,
        `Varis / Destination: ${shipment.destination || "-"}`,
      ].join("\n")),
    ]],
    theme: "grid",
    headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7.2 },
    styles: { fontSize: 8.5, cellPadding: 3.5, textColor: SLATE, valign: "top", lineColor: [203, 213, 225] },
    columnStyles: { 0: { cellWidth: 82 }, 1: { cellWidth: 100 } },
    margin: { left: 14, right: 14 },
  });

  const routeStops = [...(shipment.route_stops || [])].sort((a, b) => {
    if (a.stop_type !== b.stop_type) return a.stop_type === "pickup" ? -1 : 1;
    return a.sequence_no - b.sequence_no;
  });
  if (routeStops.length) {
    autoTable(doc, {
      startY: (doc.lastAutoTable?.finalY || 67) + 7,
      head: [["#", "DURAK / STOP", "FIRMA - KONUM / COMPANY - LOCATION", "YETKILI - NOT / CONTACT - NOTE"]],
      body: routeStops.map((stop) => [
        `${stop.stop_type === "pickup" ? "A" : "T"}${stop.sequence_no}`,
        stop.stop_type === "pickup" ? "ALIM / PICKUP" : "TESLIM / DELIVERY",
        pdfText([stop.company_name, stop.address_line, [stop.district, stop.city].filter(Boolean).join(" / ")].filter(Boolean).join("\n")),
        pdfText([stop.contact_name, stop.contact_phone, stop.instructions].filter(Boolean).join("\n")),
      ]),
      theme: "grid",
      headStyles: { fillColor: ORANGE, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 6.2 },
      styles: { fontSize: 7.5, cellPadding: 2.7, textColor: SLATE, valign: "top", lineColor: [203, 213, 225] },
      columnStyles: { 0: { cellWidth: 10, halign: "center" }, 1: { cellWidth: 28 }, 2: { cellWidth: 76 }, 3: { cellWidth: 68 } },
      margin: { left: 14, right: 14 },
    });
  }

  const pickupByKey = new Map(routeStops.filter((stop) => stop.stop_type === "pickup").map((stop) => [stop.stop_key, stop]));
  const deliveryByKey = new Map(routeStops.filter((stop) => stop.stop_type === "delivery").map((stop) => [stop.stop_key, stop]));
  const cargoItems = shipment.shipment_cargo_items?.length
    ? shipment.shipment_cargo_items
    : shipment.cargo_items?.length
      ? shipment.cargo_items
      : [{ adet: Number(shipment.adet || 0), cinsi: shipment.cinsi || "-", kg_ds: Number(shipment.kg_ds || 0) }];

  autoTable(doc, {
    startY: (doc.lastAutoTable?.finalY || 67) + 7,
    head: [["#", "YUK - ACIKLAMA / CARGO - DESCRIPTION", "ALIM / PICKUP", "TESLIM / DELIVERY", "ADET / QTY", "KG/DS", "TOPLAM / TOTAL"]],
    body: cargoItems.map((item, index) => {
      const pickup = item.pickup_stop || pickupByKey.get(item.pickup_stop_key || "");
      const delivery = item.delivery_stop || deliveryByKey.get(item.delivery_stop_key || "");
      return [
        index + 1,
        pdfText([item.cinsi, item.route_description].filter(Boolean).join("\n")),
        pdfText(item.pickup_stop ? [item.pickup_stop.company_name, item.pickup_stop.district, item.pickup_stop.city].filter(Boolean).join(" - ") : stopLabel(pickup as WaybillRouteStop)),
        pdfText(item.delivery_stop ? [item.delivery_stop.company_name, item.delivery_stop.district, item.delivery_stop.city].filter(Boolean).join(" - ") : stopLabel(delivery as WaybillRouteStop)),
        Number(item.adet || 0),
        formatWeight(Number(item.kg_ds || 0)),
        formatWeight(Number(item.adet || 0) * Number(item.kg_ds || 0)),
      ];
    }),
    foot: [["", "", "", "", "", "TOPLAM / TOTAL", formatWeight(Number(shipment.toplam_kg_ds || cargoItems.reduce((sum, item) => sum + Number(item.adet || 0) * Number(item.kg_ds || 0), 0)))]],
    theme: "grid",
    headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 5.7 },
    footStyles: { fillColor: LIGHT, textColor: NAVY, fontStyle: "bold", fontSize: 7.5 },
    styles: { fontSize: 7, cellPadding: 2.4, textColor: SLATE, valign: "top", lineColor: [203, 213, 225], overflow: "linebreak" },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 44 },
      2: { cellWidth: 35 },
      3: { cellWidth: 35 },
      4: { cellWidth: 14, halign: "right" },
      5: { cellWidth: 21, halign: "right" },
      6: { cellWidth: 25, halign: "right" },
    },
    margin: { left: 14, right: 14, bottom: 22 },
  });

  let cursorY = (doc.lastAutoTable?.finalY || 150) + 7;
  if (cursorY > 238) {
    doc.addPage();
    await drawLetterhead(doc, shipment);
    cursorY = 82;
  }

  autoTable(doc, {
    startY: cursorY,
    head: [["TASIYICI BILGILERI / CARRIER DETAILS", "CANLI TAKIP / LIVE TRACKING"]],
    body: [[
      pdfText([
        `Surucu / Driver: ${shipment.driver?.full_name || "Atama bekliyor / Assignment pending"}`,
        `Telefon / Phone: ${shipment.driver?.phone_1 || "-"}`,
        `Cekici / Tractor: ${shipment.vehicle?.cekici_plakasi || "Atama bekliyor / Assignment pending"}`,
        `Dorse / Trailer: ${shipment.vehicle?.dorse_plakasi || "-"}`,
      ].join("\n")),
      pdfText([shipment.tracking_number, shipment.tracking_url].filter(Boolean).join("\n"), "Takip bilgisi bekleniyor / Tracking pending"),
    ]],
    theme: "grid",
    headStyles: { fillColor: ORANGE, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 6.5 },
    styles: { fontSize: 7.5, cellPadding: 3, textColor: SLATE, valign: "top", lineColor: [203, 213, 225] },
    columnStyles: { 0: { cellWidth: 91 }, 1: { cellWidth: 91 } },
    margin: { left: 14, right: 14 },
  });

  cursorY = (doc.lastAutoTable?.finalY || cursorY) + 8;
  if (cursorY > 250) {
    doc.addPage();
    await drawLetterhead(doc, shipment);
    cursorY = 82;
  }

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  const signatureWidth = (pageWidth - 36) / 2;
  doc.roundedRect(14, cursorY, signatureWidth, 25, 2, 2);
  doc.roundedRect(22 + signatureWidth, cursorY, signatureWidth, 25, 2, 2);
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("TESLIM EDEN / DELIVERED BY", 18, cursorY + 6);
  doc.text("TESLIM ALAN / RECEIVED BY", 26 + signatureWidth, cursorY + 6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...SLATE);
  doc.setFontSize(7);
  doc.text("Ad Soyad - Imza / Name - Signature:", 18, cursorY + 14);
  doc.text("Ad Soyad - Imza / Name - Signature:", 26 + signatureWidth, cursorY + 14);
  doc.line(42, cursorY + 15, 14 + signatureWidth - 4, cursorY + 15);
  doc.line(50 + signatureWidth, cursorY + 15, pageWidth - 18, cursorY + 15);

  const pageCount = doc.getNumberOfPages();
  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    doc.setPage(pageNumber);
    addFooter(doc, pageNumber, pageCount);
  }
  return doc;
};

export const generateWaybill = async (shipment: WaybillData) => {
  const doc = await buildWaybillPdf(shipment);
  doc.save(`REX_Waybill_${shipment.shipment_code}.pdf`);
};
