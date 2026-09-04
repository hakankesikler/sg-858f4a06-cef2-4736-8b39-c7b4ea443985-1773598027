import { copyFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const tesseractRequire = createRequire(require.resolve("tesseract.js/package.json"));
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const destination = join(root, "public", "ocr");
await mkdir(destination, { recursive: true });
const language = require("@tesseract.js-data/tur");
const coreAssets = [
  "tesseract-core.wasm.js",
  "tesseract-core-lstm.wasm.js",
  "tesseract-core-simd.wasm.js",
  "tesseract-core-simd-lstm.wasm.js",
  "tesseract-core-relaxedsimd.wasm.js",
  "tesseract-core-relaxedsimd-lstm.wasm.js",
];
const assets = [
  [require.resolve("tesseract.js/dist/worker.min.js"), "worker.min.js"],
  ...coreAssets.map((name) => [tesseractRequire.resolve(`tesseract.js-core/${name}`), name]),
  [join(language.langPath, "tur.traineddata.gz"), "tur.traineddata.gz"],
  [require.resolve("pdfjs-dist/legacy/build/pdf.worker.min.mjs"), "pdf.worker.min.mjs"],
];
await Promise.all(assets.map(([source, name]) => copyFile(source, join(destination, name))));
