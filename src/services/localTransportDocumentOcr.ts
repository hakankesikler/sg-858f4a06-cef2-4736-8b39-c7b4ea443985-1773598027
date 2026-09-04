import { missingTransportDocumentFields, parseTransportDocument, type TransportDocumentFields, type TransportDocumentType } from "@/lib/transport-document-ocr";

export type LocalTransportDocumentOcrResult = {
  fields: TransportDocumentFields;
  confidence: number | null;
  extractedFieldCount: number;
  warnings: string[];
  provider: "tesseract-local";
};

const OCR_TIMEOUT_MS = 90_000;

function progressFromTesseract(status: string, progress?: number) {
  if (status === "loading tesseract core") return progress ? 0.2 : 0.05;
  if (status === "initializing tesseract") return progress ? 0.3 : 0.22;
  if (status === "loading language traineddata") return progress ? 0.45 : 0.32;
  if (status === "initializing api") return progress ? 0.55 : 0.47;
  if (status === "recognizing text") return 0.55 + Math.max(0, Math.min(1, progress || 0)) * 0.44;
  return 0.02;
}

async function renderPdfPages(file: File) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = "/ocr/pdf.worker.min.mjs";
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages: Blob[] = [];
  for (let pageNumber = 1; pageNumber <= Math.min(pdf.numPages, 2); pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("PDF sayfası hazırlanamadı.");
    await page.render({ canvas, canvasContext: context, viewport }).promise;
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 0.95));
    if (blob) pages.push(blob);
  }
  await pdf.cleanup();
  if (!pages.length) throw new Error("PDF sayfaları okunamadı.");
  return pages;
}

export async function extractTransportDocumentLocally(
  file: File,
  documentType: TransportDocumentType,
  onProgress?: (progress: number) => void,
): Promise<LocalTransportDocumentOcrResult> {
  if (typeof window === "undefined") throw new Error("Belge okuma yalnızca tarayıcıda çalışır.");
  onProgress?.(0.02);
  const images: Array<File | Blob> = file.type === "application/pdf" ? await renderPdfPages(file) : [file];
  const { createWorker } = await import("tesseract.js");
  let worker: Awaited<ReturnType<typeof createWorker>> | null = null;
  let cancelled = false;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const operation = (async () => {
    worker = await createWorker("tur", 1, {
      workerPath: "/ocr/worker.min.js",
      corePath: "/ocr",
      langPath: "/ocr",
      workerBlobURL: false,
      logger: (message) => onProgress?.(progressFromTesseract(message.status, message.progress)),
    });
    if (cancelled) throw new Error("Belge okuma süresi doldu. Lütfen dosyayı yeniden seçin.");

    const texts: string[] = [];
    const confidences: number[] = [];
    for (let index = 0; index < images.length; index += 1) {
      const result = await worker.recognize(images[index]);
      texts.push(result.data.text || "");
      if (Number.isFinite(result.data.confidence)) confidences.push(result.data.confidence);
    }
    const fields = parseTransportDocument(documentType, texts.join("\n"));
    if (!Object.keys(fields).length) {
      throw new Error("Belgeden güvenilir bilgi okunamadı. Belgeyi düz, aydınlık ve yazılar net görünecek şekilde yeniden yükleyin.");
    }
    const confidence = confidences.length ? confidences.reduce((sum, item) => sum + item, 0) / confidences.length : null;
    const missing = missingTransportDocumentFields(documentType, fields);
    const warnings = [
      ...(confidence !== null && confidence < 80 ? ["Okuma güveni düşük; tüm alanları dikkatle kontrol edin."] : []),
      ...(missing.length ? [`Okunamayan alanlar: ${missing.join(", ")}.`] : []),
    ];
    onProgress?.(1);
    return { fields, confidence, extractedFieldCount: Object.keys(fields).length, warnings, provider: "tesseract-local" } as LocalTransportDocumentOcrResult;
  })();

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      cancelled = true;
      reject(new Error("Belge 90 saniye içinde okunamadı. Lütfen daha net bir JPG veya PNG dosyasıyla yeniden deneyin."));
    }, OCR_TIMEOUT_MS);
  });

  try {
    return await Promise.race([operation, timeout]);
  } finally {
    cancelled = true;
    if (timeoutId) clearTimeout(timeoutId);
    if (worker) await worker.terminate().catch(() => undefined);
  }
}
