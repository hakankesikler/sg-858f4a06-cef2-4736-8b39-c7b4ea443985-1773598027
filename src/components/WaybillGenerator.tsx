import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface WaybillData {
  shipment_code: string;
  pickup_date: string;
  sender_name: string;
  origin: string;
  receiver: string;
  receiver_district: string;
  destination: string;
  driver?: {
    full_name: string;
  };
  vehicle?: {
    cekici_plakasi: string;
  };
  cargo_items?: Array<{
    adet: number;
    cinsi: string;
    kg_ds: number;
  }>;
  toplam_kg_ds?: number;
}

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

export const generateWaybill = async (shipment: WaybillData) => {
  const doc = new jsPDF();
  
  // Page dimensions
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Colors
  const primaryColor: [number, number, number] = [41, 128, 185]; // Professional blue
  const darkColor: [number, number, number] = [44, 62, 80];
  const lightGray: [number, number, number] = [236, 240, 241];
  
  // Header background
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, "F");
  
  // Load and add logo
  try {
    const logo = await loadImage("/rex-logo-circle.png");
    doc.addImage(logo, "PNG", 15, 5, 30, 30);
  } catch (error) {
    console.warn("Logo could not be loaded:", error);
  }
  
  // Company name (next to logo)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("REX LOJİSTİK", 50, 20);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("SEVK İRSALİYESİ", 50, 30);
  
  // Reset text color
  doc.setTextColor(...darkColor);
  
  // Shipment info box
  let yPos = 50;
  
  doc.setFillColor(...lightGray);
  doc.rect(15, yPos, pageWidth - 30, 20, "F");
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`İrsaliye No: ${shipment.shipment_code}`, 20, yPos + 8);
  doc.text(
    `Tarih: ${format(new Date(shipment.pickup_date), "dd MMMM yyyy", { locale: tr })}`,
    pageWidth - 20,
    yPos + 8,
    { align: "right" }
  );
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `Düzenlenme: ${format(new Date(), "dd.MM.yyyy HH:mm", { locale: tr })}`,
    pageWidth - 20,
    yPos + 15,
    { align: "right" }
  );
  
  // Sender and Receiver boxes
  yPos = 80;
  const boxWidth = (pageWidth - 45) / 2;
  
  // Sender box
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.rect(15, yPos, boxWidth, 35);
  
  doc.setFillColor(...primaryColor);
  doc.rect(15, yPos, boxWidth, 8, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("GÖNDERİCİ", 20, yPos + 5);
  
  doc.setTextColor(...darkColor);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(shipment.sender_name || "-", 20, yPos + 15);
  doc.text(shipment.origin || "-", 20, yPos + 22);
  
  // Receiver box
  doc.setDrawColor(...primaryColor);
  doc.rect(25 + boxWidth, yPos, boxWidth, 35);
  
  doc.setFillColor(...primaryColor);
  doc.rect(25 + boxWidth, yPos, boxWidth, 8, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("ALICI", 30 + boxWidth, yPos + 5);
  
  doc.setTextColor(...darkColor);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(shipment.receiver || "-", 30 + boxWidth, yPos + 15);
  doc.text(
    `${shipment.destination || "-"} / ${shipment.receiver_district || "-"}`,
    30 + boxWidth,
    yPos + 22
  );
  
  // Transport info
  yPos = 125;
  
  doc.setFillColor(...lightGray);
  doc.rect(15, yPos, pageWidth - 30, 20, "F");
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("TAŞIYICI BİLGİLERİ", 20, yPos + 8);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `Sürücü: ${shipment.driver?.full_name || "-"}`,
    20,
    yPos + 15
  );
  doc.text(
    `Araç Plakası: ${shipment.vehicle?.cekici_plakasi || "-"}`,
    pageWidth / 2 + 10,
    yPos + 15
  );
  
  // Cargo details table
  yPos = 155;
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("YÜK DETAYLARI", 20, yPos);
  
  const cargoData = shipment.cargo_items?.map((item) => [
    item.adet.toString(),
    item.cinsi,
    `${item.kg_ds} kg`,
    `${(item.adet * item.kg_ds).toFixed(2)} kg`,
  ]) || [];
  
  autoTable(doc, {
    startY: yPos + 5,
    head: [["Adet", "Cinsi", "KG/DS (Birim)", "Toplam KG"]],
    body: cargoData,
    foot: [["", "", "TOPLAM:", `${shipment.toplam_kg_ds?.toFixed(2) || 0} kg`]],
    theme: "grid",
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    footStyles: {
      fillColor: lightGray,
      textColor: darkColor,
      fontStyle: "bold",
      fontSize: 9,
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 30 },
      1: { halign: "left" },
      2: { halign: "center", cellWidth: 35 },
      3: { halign: "right", cellWidth: 35 },
    },
  });
  
  // Signature section
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  
  doc.setDrawColor(...darkColor);
  doc.setLineWidth(0.3);
  
  // Delivery signature
  doc.rect(15, finalY, boxWidth, 30);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("TESLİM EDEN", 20, finalY + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Ad Soyad: ____________________", 20, finalY + 18);
  doc.text("İmza: ____________________", 20, finalY + 25);
  
  // Receiver signature
  doc.rect(25 + boxWidth, finalY, boxWidth, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("TESLİM ALAN", 30 + boxWidth, finalY + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Ad Soyad: ____________________", 30 + boxWidth, finalY + 18);
  doc.text("İmza: ____________________", 30 + boxWidth, finalY + 25);
  
  // Footer
  doc.setFontSize(7);
  doc.setTextColor(128, 128, 128);
  doc.text(
    "Bu belge elektronik ortamda oluşturulmuştur. Geçerlilik için ıslak imza gerekmektedir.",
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" }
  );
  
  // QR Code placeholder (optional - can be implemented with qrcode library)
  doc.setDrawColor(128, 128, 128);
  doc.rect(pageWidth - 35, pageHeight - 40, 25, 25);
  doc.setFontSize(6);
  doc.text("QR KOD", pageWidth - 22.5, pageHeight - 12, { align: "center" });
  
  // Save PDF
  doc.save(`Irsaliye_${shipment.shipment_code}.pdf`);
};