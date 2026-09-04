import { missingTransportDocumentFields, parseTransportDocument, type TransportDocumentFields, type TransportDocumentType } from "@/lib/transport-document-ocr";

export type LocalTransportDocumentOcrResult = {
  fields: TransportDocumentFields;
  confidence: number | null;
  extractedFieldCount: number;
  warnings: string[];
  provider: "tesseract-local";
};

const OCR_TIMEOUT_MS = 90_000;

function progressFromTesseract(status: string, progress?: number, recognitionProgress = progress || 0) {
  if (status === "loading tesseract core") return progress ? 0.2 : 0.05;
  if (status === "initializing tesseract") return progress ? 0.3 : 0.22;
  if (status === "loading language traineddata") return progress ? 0.45 : 0.32;
  if (status === "initializing api") return progress ? 0.55 : 0.47;
  if (status === "recognizing text") return 0.55 + Math.max(0, Math.min(1, recognitionProgress)) * 0.44;
  return 0.02;
}

async function canvasBlob(canvas: HTMLCanvasElement) {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 0.95));
  if (!blob) throw new Error("Belge görüntüsü hazırlanamadı.");
  return blob;
}

async function rotateImage(file: File, angle: 90 | -90) {
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.height;
    canvas.height = bitmap.width;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Belge görüntüsü hazırlanamadı.");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.filter = "grayscale(1) contrast(1.15)";
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate(angle * Math.PI / 180);
    context.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
    return await canvasBlob(canvas);
  } finally {
    bitmap.close();
  }
}

async function imageCandidateGroups(file: File, documentType: TransportDocumentType) {
  if (file.type === "application/pdf") return [await renderPdfPages(file)];
  if (documentType !== "driver_license") return [[file]];
  const bitmap = await createImageBitmap(file);
  const isPortrait = bitmap.height > bitmap.width * 1.1;
  bitmap.close();
  if (!isPortrait) return [[file]];
  return [[await rotateImage(file, -90)], [await rotateImage(file, 90)]];
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
  const candidateGroups = await imageCandidateGroups(file, documentType);
  const candidateImageCount = candidateGroups.reduce((sum, group) => sum + group.length, 0);
  const { createWorker } = await import("tesseract.js");
  let worker: Awaited<ReturnType<typeof createWorker>> | null = null;
  let cancelled = false;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let completedImages = 0;

  const operation = (async () => {
    worker = await createWorker("tur", 1, {
      workerPath: "/ocr/worker.min.js",
      // The non-SIMD LSTM core is slower than auto-detection but avoids
      // browser-specific relaxed-SIMD initialization stalls.
      corePath: "/ocr/tesseract-core-lstm.wasm.js",
      langPath: "/ocr",
      workerBlobURL: false,
      logger: (message) => {
        const recognitionProgress = (completedImages + (message.progress || 0)) / Math.max(candidateImageCount, 1);
        onProgress?.(progressFromTesseract(message.status, message.progress, recognitionProgress));
      },
    });
    if (cancelled) throw new Error("Belge okuma süresi doldu. Lütfen dosyayı yeniden seçin.");

    let bestFields: TransportDocumentFields = {};
    let bestConfidence: number | null = null;
    let bestScore = -1;
    for (const group of candidateGroups) {
      const texts: string[] = [];
      const confidences: number[] = [];
      for (const image of group) {
        const result = await worker.recognize(image);
        completedImages += 1;
        texts.push(result.data.text || "");
        if (Number.isFinite(result.data.confidence)) confidences.push(result.data.confidence);
      }
      const fields = parseTransportDocument(documentType, texts.join("\n"));
      const confidence = confidences.length ? confidences.reduce((sum, item) => sum + item, 0) / confidences.length : null;
      const score = Object.keys(fields).length * 1000 + (confidence || 0);
      if (score > bestScore) {
        bestFields = fields;
        bestConfidence = confidence;
        bestScore = score;
      }
      if (documentType === "driver_license" && Object.keys(fields).length >= 3) break;
    }
    if (!Object.keys(bestFields).length) {
      throw new Error("Belgeden güvenilir bilgi okunamadı. Belgeyi düz, aydınlık ve yazılar net görünecek şekilde yeniden yükleyin.");
    }
    const missing = missingTransportDocumentFields(documentType, bestFields);
    const warnings = [
      ...(bestConfidence !== null && bestConfidence < 80 ? ["Okuma güveni düşük; tüm alanları dikkatle kontrol edin."] : []),
      ...(missing.length ? [`Okunamayan alanlar: ${missing.join(", ")}.`] : []),
    ];
    onProgress?.(1);
    return { fields: bestFields, confidence: bestConfidence, extractedFieldCount: Object.keys(bestFields).length, warnings, provider: "tesseract-local" } as LocalTransportDocumentOcrResult;
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
