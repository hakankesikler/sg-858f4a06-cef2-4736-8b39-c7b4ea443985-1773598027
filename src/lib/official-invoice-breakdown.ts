import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import "pdfjs-dist/legacy/build/pdf.worker.mjs";

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function parseTurkishMoney(value: string): number | null {
  const compact = value.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const parsed = Number(compact);
  return Number.isFinite(parsed) ? roundMoney(parsed) : null;
}

function normalizeInvoiceText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u0131İ]/g, (letter) => letter === "\u0131" ? "i" : "I")
    .replace(/\s+/g, " ")
    .trim();
}

const pdfMoneyPattern = "([0-9]{1,3}(?:[.\\s][0-9]{3})*(?:,[0-9]{1,2})|[0-9]+(?:,[0-9]{1,2})?)\\s*(?:TL|TRY|₺)";

function pdfLabeledMoney(text: string, label: string, all = false): number[] {
  const escapedLabel = normalizeInvoiceText(label).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const expression = new RegExp(`${escapedLabel}(?:\\s*\\([^)]*\\))?\\s*${pdfMoneyPattern}`, "gi");
  const values: number[] = [];
  let match: RegExpExecArray | null;
  while ((match = expression.exec(text)) !== null) {
    const parsed = parseTurkishMoney(match[1]);
    if (parsed !== null) values.push(parsed);
    if (!all) break;
  }
  return values;
}

export function parseOfficialInvoicePdfText(rawText: string) {
  const text = normalizeInvoiceText(rawText);
  const payableTotal = pdfLabeledMoney(text, "Odenecek Tutar")[0] ?? null;
  const taxInclusiveTotal = pdfLabeledMoney(text, "Vergiler Dahil Toplam Tutar")[0] ?? null;
  const vatValues = pdfLabeledMoney(text, "Hesaplanan KDV", true);
  const vatTotal = vatValues.length
    ? roundMoney(vatValues.reduce((sum, value) => sum + value, 0))
    : null;
  const taxBaseValues = pdfLabeledMoney(text, "KDV Matrahi", true);
  let netTotal = taxBaseValues.length
    ? roundMoney(taxBaseValues.reduce((sum, value) => sum + value, 0))
    : null;
  if (netTotal === null) {
    const goodsTotal = pdfLabeledMoney(text, "Mal Hizmet Toplam Tutari")[0] ?? null;
    const discountTotal = pdfLabeledMoney(text, "Toplam Iskonto")[0] ?? 0;
    if (goodsTotal !== null) netTotal = roundMoney(goodsTotal - discountTotal);
  }
  const resolvedVatTotal = vatTotal ?? (
    netTotal !== null && taxInclusiveTotal !== null
      ? roundMoney(Math.max(0, taxInclusiveTotal - netTotal))
      : null
  );
  if (netTotal === null || resolvedVatTotal === null || payableTotal === null || netTotal <= 0 || payableTotal <= 0) return null;
  const withholdingTotal = roundMoney(netTotal + resolvedVatTotal - payableTotal);
  if (withholdingTotal < 0 || Math.abs(roundMoney(netTotal + resolvedVatTotal - withholdingTotal) - payableTotal) > 0.02) return null;
  return {
    subtotal: netTotal,
    total_vat: resolvedVatTotal,
    withholding_total: withholdingTotal,
    grand_total: payableTotal,
    tax_breakdown_source: "official_pdf",
  };
}

export function decodeOfficialPdf(body: string): Uint8Array | null {
  let parsed: any = null;
  try { parsed = JSON.parse(body); } catch { return null; }
  const encodedValue = parsed?.data?.src ?? parsed?.src;
  const encoded = typeof encodedValue === "string"
    ? encodedValue.replace(/^data:application\/pdf;base64,/i, "")
    : "";
  if (!encoded || encoded.length > 16_000_000) return null;
  try {
    const buffer = Buffer.from(encoded, "base64");
    return buffer.subarray(0, 4).toString("ascii") === "%PDF" ? new Uint8Array(buffer) : null;
  } catch {
    return null;
  }
}

export async function parseOfficialInvoicePdf(data: Uint8Array) {
  const loadingTask = getDocument({
    data,
    isEvalSupported: false,
    useSystemFonts: false,
    useWasm: false,
  } as unknown as Parameters<typeof getDocument>[0]);
  const pdf = await loadingTask.promise;
  try {
    if (pdf.numPages < 1 || pdf.numPages > 20) return null;
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items
        .map((item: any) => typeof item?.str === "string" ? item.str : "")
        .filter(Boolean)
        .join(" "));
    }
    return parseOfficialInvoicePdfText(pages.join("\n"));
  } finally {
    await loadingTask.destroy();
  }
}
