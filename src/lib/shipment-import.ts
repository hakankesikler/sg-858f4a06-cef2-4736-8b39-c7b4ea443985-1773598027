import { parseCsv } from "@/lib/csv";

export type ShipmentImportPayload = {
  external_order_id: string;
  sender_name: string;
  origin: string;
  receiver: string;
  receiver_district: string;
  destination: string;
  pickup_date: string;
  estimated_delivery_date: string;
  quantity: number | null;
  cargo_type: string;
  unit_weight: number | null;
  unit_price: number;
  currency: string;
};

export type ShipmentImportPreviewRow = {
  rowNumber: number;
  payload: ShipmentImportPayload;
  errors: string[];
};

const aliases: Record<keyof ShipmentImportPayload, string[]> = {
  external_order_id: ["Müşteri Referans No", "Müşteri Sipariş No", "Sipariş No", "Referans No", "External Order ID"],
  sender_name: ["Gönderici Adı", "Gönderici", "Sender"],
  origin: ["Çıkış İli", "Gönderici İl", "Çıkış Yeri", "Origin"],
  receiver: ["Alıcı Adı", "Alıcı", "Receiver"],
  receiver_district: ["Alıcı İlçe", "Varış İlçe", "Receiver District"],
  destination: ["Varış İli", "Alıcı İl", "Varış Yeri", "Destination"],
  pickup_date: ["Yükleme Tarihi", "Talep Tarihi", "Pickup Date"],
  estimated_delivery_date: ["Tahmini Teslim Tarihi", "Termin Tarihi", "Estimated Delivery Date"],
  quantity: ["Adet", "Koli Adedi", "Palet Adedi", "Quantity"],
  cargo_type: ["Yük Cinsi", "Ürün", "Açıklama", "Cargo Type"],
  unit_weight: ["Birim Kg/Desi", "Kg/Desi", "Birim Ağırlık", "Unit Weight"],
  unit_price: ["Birim Fiyat", "Satış Birim Fiyat", "Unit Price"],
  currency: ["Para Birimi", "Döviz", "Currency"],
};

const normalizeHeader = (value: unknown) => String(value ?? "")
  .trim()
  .toLocaleLowerCase("tr-TR")
  .replace(/[İIıi]/g, "i")
  .replace(/ş/g, "s")
  .replace(/ğ/g, "g")
  .replace(/ü/g, "u")
  .replace(/ö/g, "o")
  .replace(/ç/g, "c")
  .replace(/[^a-z0-9]/g, "");

const findValue = (row: Record<string, unknown>, field: keyof ShipmentImportPayload) => {
  const entries = Object.entries(row);
  const accepted = aliases[field].map(normalizeHeader);
  const match = entries.find(([header]) => accepted.includes(normalizeHeader(header)));
  return match?.[1] ?? "";
};

const parseNumber = (value: unknown): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const raw = String(value ?? "").trim().replace(/\s/g, "");
  if (!raw) return null;
  const normalized = raw.includes(",")
    ? raw.replace(/\./g, "").replace(",", ".")
    : raw;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const excelSerialToDate = (serial: number) => {
  const utc = Math.round((serial - 25569) * 86400 * 1000);
  const date = new Date(utc);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

const parseDate = (value: unknown): string => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === "number") return excelSerialToDate(value);
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const tr = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (tr) return `${tr[3]}-${tr[2].padStart(2, "0")}-${tr[1].padStart(2, "0")}`;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
};

const tableToObjects = (table: unknown[][]): Record<string, unknown>[] => {
  const [headerRow, ...dataRows] = table;
  if (!headerRow?.length) return [];
  const headers = headerRow.map((cell) => String(cell ?? "").trim());
  return dataRows
    .filter((row) => row.some((cell) => String(cell ?? "").trim()))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])));
};

export async function readShipmentImportFile(file: File): Promise<{ rows: Record<string, unknown>[]; hash: string }> {
  if (file.size > 8 * 1024 * 1024) throw new Error("Dosya 8 MB'den büyük olamaz");
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !["csv", "xlsx"].includes(extension)) throw new Error("Yalnızca CSV veya XLSX dosyası yükleyebilirsiniz");
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  const hash = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  if (extension === "csv") {
    const text = new TextDecoder("utf-8").decode(buffer);
    return { rows: parseCsv(text), hash };
  }
  const { readSheet } = await import("read-excel-file/browser");
  const table = await readSheet(file, { dateFormat: "dd.mm.yyyy" });
  return { rows: tableToObjects(table as unknown[][]), hash };
}

export function validateShipmentImportRows(rows: Record<string, unknown>[]): ShipmentImportPreviewRow[] {
  if (rows.length === 0) throw new Error("Dosyada veri satırı bulunamadı");
  if (rows.length > 1000) throw new Error("Bir dosyada en fazla 1000 sevkiyat olabilir");
  const references = new Map<string, number>();
  return rows.map((row, index) => {
    const quantity = parseNumber(findValue(row, "quantity"));
    const unitWeight = parseNumber(findValue(row, "unit_weight"));
    const unitPrice = parseNumber(findValue(row, "unit_price")) ?? 0;
    const pickupDate = parseDate(findValue(row, "pickup_date"));
    const estimatedDeliveryDate = parseDate(findValue(row, "estimated_delivery_date"));
    const payload: ShipmentImportPayload = {
      external_order_id: String(findValue(row, "external_order_id") ?? "").trim(),
      sender_name: String(findValue(row, "sender_name") ?? "").trim(),
      origin: String(findValue(row, "origin") ?? "").trim(),
      receiver: String(findValue(row, "receiver") ?? "").trim(),
      receiver_district: String(findValue(row, "receiver_district") ?? "").trim(),
      destination: String(findValue(row, "destination") ?? "").trim(),
      pickup_date: pickupDate,
      estimated_delivery_date: estimatedDeliveryDate,
      quantity,
      cargo_type: String(findValue(row, "cargo_type") ?? "").trim(),
      unit_weight: unitWeight,
      unit_price: unitPrice,
      currency: String(findValue(row, "currency") || "TRY").trim().toUpperCase(),
    };
    const errors: string[] = [];
    if (!payload.external_order_id) errors.push("Müşteri referansı zorunlu");
    if (!payload.sender_name) errors.push("Gönderici zorunlu");
    if (!payload.origin) errors.push("Çıkış ili zorunlu");
    if (!payload.receiver) errors.push("Alıcı zorunlu");
    if (!payload.destination) errors.push("Varış ili zorunlu");
    if (!payload.pickup_date) errors.push("Yükleme tarihi geçersiz");
    if (!payload.cargo_type) errors.push("Yük cinsi zorunlu");
    if (!Number.isInteger(quantity) || Number(quantity) <= 0) errors.push("Adet pozitif tam sayı olmalı");
    if (unitWeight == null || unitWeight <= 0) errors.push("Birim kg/desi pozitif olmalı");
    if (unitPrice < 0) errors.push("Birim fiyat negatif olamaz");
    if (!/^[A-Z]{3}$/.test(payload.currency)) errors.push("Para birimi TRY, USD veya EUR biçiminde olmalı");
    if (estimatedDeliveryDate && pickupDate && estimatedDeliveryDate < pickupDate) errors.push("Teslim tarihi yükleme tarihinden önce olamaz");
    const normalizedReference = payload.external_order_id.toLocaleLowerCase("tr-TR");
    if (normalizedReference) {
      const firstRow = references.get(normalizedReference);
      if (firstRow) errors.push(`Aynı dosyada mükerrer referans (ilk satır ${firstRow})`);
      else references.set(normalizedReference, index + 2);
    }
    return { rowNumber: index + 2, payload, errors };
  });
}

export const shipmentImportTemplate = [{
  "Müşteri Referans No": "MUSTERI-0001",
  "Gönderici Adı": "Örnek Gönderici A.Ş.",
  "Çıkış İli": "İzmir",
  "Alıcı Adı": "Örnek Alıcı Ltd. Şti.",
  "Alıcı İlçe": "Nilüfer",
  "Varış İli": "Bursa",
  "Yükleme Tarihi": new Date().toISOString().slice(0, 10),
  "Tahmini Teslim Tarihi": "",
  "Adet": 1,
  "Yük Cinsi": "Paletli ürün",
  "Birim Kg/Desi": 250,
  "Birim Fiyat": 0,
  "Para Birimi": "TRY",
}];
