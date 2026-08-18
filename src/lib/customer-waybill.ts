import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { CustomerPortalProfile, CustomerShipment } from "@/services/customerPortalService";

const text = (value: unknown) => value == null || value === "" ? "-" : String(value);
const date = (value: string | null) => value ? new Date(value).toLocaleDateString("tr-TR") : "-";

const loadImage = (src: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = reject;
  image.src = src;
});

export async function downloadCustomerWaybill(shipment: CustomerShipment, profile: CustomerPortalProfile) {
  const doc = new jsPDF();
  const width = doc.internal.pageSize.getWidth();
  const blue: [number, number, number] = [24, 87, 160];
  const orange: [number, number, number] = [233, 78, 27];
  const dark: [number, number, number] = [31, 41, 55];

  doc.setFillColor(...blue);
  doc.rect(0, 0, width, 38, "F");
  try {
    const logo = await loadImage("/rex.png?v=2");
    doc.addImage(logo, "PNG", 14, 5, 34, 27);
  } catch {
    // The document remains usable if the browser cannot load the logo.
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("SEVK IRSALIYESI", width - 14, 17, { align: "right" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Takip No: ${shipment.tracking_number}`, width - 14, 26, { align: "right" });

  doc.setTextColor(...dark);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Irsaliye / Sevkiyat No: ${shipment.shipment_code}`, 14, 49);
  doc.setFont("helvetica", "normal");
  doc.text(`Sevk Tarihi: ${date(shipment.pickup_date)}`, width - 14, 49, { align: "right" });

  autoTable(doc, {
    startY: 57,
    head: [["MUSTERI", "GONDERICI", "ALICI"]],
    body: [[
      text(profile.name),
      `${text(shipment.sender_name)}\n${text(shipment.origin)}`,
      `${text(shipment.receiver)}\n${text(shipment.destination)} / ${text(shipment.receiver_district)}`,
    ]],
    theme: "grid",
    headStyles: { fillColor: blue, textColor: [255, 255, 255], fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 4, valign: "top" },
  });

  const cargo = shipment.cargo_items?.length
    ? shipment.cargo_items
    : [{ adet: shipment.adet || 0, cinsi: shipment.cinsi || "-", kg_ds: shipment.kg_ds || 0, sira_no: 1 }];

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 10,
    head: [["ADET", "YUK CINSI", "KG / DS", "TOPLAM"]],
    body: cargo.map((item) => [
      text(item.adet),
      text(item.cinsi),
      `${Number(item.kg_ds || 0).toLocaleString("tr-TR")} kg`,
      `${Number(item.adet * item.kg_ds || 0).toLocaleString("tr-TR")} kg`,
    ]),
    foot: [["", "", "TOPLAM", `${Number(shipment.toplam_kg_ds || 0).toLocaleString("tr-TR")} kg`]],
    theme: "grid",
    headStyles: { fillColor: orange, textColor: [255, 255, 255], fontStyle: "bold" },
    footStyles: { fillColor: [241, 245, 249], textColor: dark, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 4 },
  });

  const y = (doc as any).lastAutoTable.finalY + 12;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, y, width - 28, 25, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.text("TESLIM BILGISI", 19, y + 8);
  doc.setFont("helvetica", "normal");
  doc.text(`Durum: ${text(shipment.status)}`, 19, y + 16);
  doc.text(`Teslim Tarihi: ${date(shipment.delivery_date || shipment.actual_delivery_date)}`, 80, y + 16);
  doc.text(`Teslim Alan: ${text(shipment.delivered_to)}`, 140, y + 16);

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Bu belge REX Lojistik kurumsal musteri portalindan elektronik olarak uretilmistir.", width / 2, 286, { align: "center" });
  doc.save(`Irsaliye_${shipment.shipment_code}.pdf`);
}
