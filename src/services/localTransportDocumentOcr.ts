import { missingTransportDocumentFields, parseTransportDocument, type TransportDocumentFields, type TransportDocumentType } from "@/lib/transport-document-ocr";

export type LocalTransportDocumentOcrResult = {
  fields: TransportDocumentFields;
  confidence: number | null;
  extractedFieldCount: number;
  warnings: string[];
  provider: "tesseract-local";
};

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
  const images: Array<File | Blob> = file.type === "application/pdf" ? await renderPdfPages(file) : [file];
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("tur", 1, {
    workerPath: "/ocr/worker.min.js",
    corePath: "/ocr/tesseract-core-lstm.wasm.js",
    langPath: "/ocr",
    workerBlobURL: false,
    logger: (message) => {
      if (message.status === "recognizing text" && typeof message.progress === "number") onProgress?.(message.progress);
    },
  });

  try {
    const texts: string[] = [];
    const confidences: number[] = [];
    for (let index = 0; index < images.length; index += 1) {
      const result = await worker.recognize(images[index]);
      texts.push(result.data.text || "");
      if (Number.isFinite(result.data.confidence)) confidences.push(result.data.confidence);
    }
    const fields = parseTransportDocument(documentType, texts.join("\n"));
    const confidence = confidences.length ? confidences.reduce((sum, item) => sum + item, 0) / confidences.length : null;
    const missing = missingTransportDocumentFields(documentType, fields);
    const warnings = [
      ...(confidence !== null && confidence < 80 ? ["Okuma güveni düşük; tüm alanları dikkatle kontrol edin."] : []),
      ...(missing.length ? [`Okunamayan alanlar: ${missing.join(", ")}.`] : []),
    ];
    return { fields, confidence, extractedFieldCount: Object.keys(fields).length, warnings, provider: "tesseract-local" };
  } finally {
    await worker.terminate();
  }
}
