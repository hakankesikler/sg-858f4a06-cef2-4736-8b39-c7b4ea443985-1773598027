import writeExcelFile, { type Cell, type SheetData } from "write-excel-file/browser";

const safeSheetName = (value: string) => value.replace(/[\\/?*\[\]:]/g, " ").trim().slice(0, 31) || "Rapor";

const safeFileName = (value: string) => {
  const base = value.replace(/\.(csv|xls|xlsx)$/i, "");
  return `${base || "rex-rapor"}.xlsx`;
};

const cellText = (value: unknown) => {
  if (value == null) return "";
  if (value instanceof Date) return value.toLocaleDateString("tr-TR");
  return String(value);
};

const toCell = (value: unknown): Cell => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return { value, type: Date, format: "dd/mm/yyyy" };
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return { value, type: Number, format: "#,##0.00" };
  }
  if (typeof value === "boolean") return { value, type: Boolean };
  return { value: cellText(value), type: String, format: "@" };
};

export async function downloadExcel(
  fileName: string,
  rows: Record<string, unknown>[],
  sheetName = "Rapor",
) {
  if (rows.length === 0) throw new Error("İndirilecek kayıt bulunamadı");

  const headers = Object.keys(rows[0]);
  const sheetData: SheetData = [
    headers.map((header) => ({
      value: header,
      type: String,
      format: "@",
      fontWeight: "bold",
      textColor: "#FFFFFF",
      backgroundColor: "#173F73",
      align: "center",
    })),
    ...rows.map((row) => headers.map((header) => toCell(row[header]))),
  ];
  const columns = headers.map((header) => ({
    width: Math.min(42, Math.max(12, header.length + 2, ...rows.slice(0, 200).map((row) => cellText(row[header]).length + 2))),
  }));

  await writeExcelFile(sheetData, { sheet: safeSheetName(sheetName), columns }).toFile(safeFileName(fileName));
}

export async function readExcelObjects(file: File): Promise<Record<string, unknown>[]> {
  if (file.size > 8 * 1024 * 1024) throw new Error("Excel dosyası 8 MB'den büyük olamaz");
  if (!file.name.toLowerCase().endsWith(".xlsx")) throw new Error("Yalnızca XLSX Excel dosyası yükleyebilirsiniz");

  const { readSheet } = await import("read-excel-file/browser");
  const table = await readSheet(file, { dateFormat: "dd.mm.yyyy" }) as unknown[][];
  const [headerRow, ...dataRows] = table;
  if (!headerRow?.length) return [];
  const headers = headerRow.map((cell) => String(cell ?? "").trim());
  return dataRows
    .filter((row) => row.some((cell) => String(cell ?? "").trim()))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])));
}
