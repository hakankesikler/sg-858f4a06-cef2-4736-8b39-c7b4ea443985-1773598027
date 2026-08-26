import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const publicDir = path.resolve("public");

async function optimizePng(fileName, width) {
  const filePath = path.join(publicDir, fileName);
  const input = await fs.readFile(filePath);
  const output = await sharp(input)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .png({ compressionLevel: 9, adaptiveFiltering: true, effort: 10 })
    .toBuffer();
  await fs.writeFile(filePath, output);
}

await Promise.all([
  optimizePng("rex.png", 800),
  optimizePng("rexlogo.png", 700),
  optimizePng("rex-favicon-rex.png", 256),
]);

const logo = await sharp(path.join(publicDir, "rex.png"))
  .resize({ width: 470, height: 315, fit: "contain" })
  .png()
  .toBuffer();

const socialCard = Buffer.from(`
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0b1730"/>
      <stop offset="1" stop-color="#172554"/>
    </linearGradient>
    <linearGradient id="orange" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#f97316"/>
      <stop offset="1" stop-color="#ea580c"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <path d="M780 0H1200V210L990 125Z" fill="#1e3a8a" opacity=".45"/>
  <path d="M0 565L1200 475V630H0Z" fill="url(#orange)"/>
  <rect x="64" y="95" width="500" height="360" rx="30" fill="#fff"/>
  <text x="625" y="177" fill="#fdba74" font-family="Arial, sans-serif" font-size="28" font-weight="700" letter-spacing="3">REX LOJİSTİK</text>
  <text x="625" y="245" fill="#fff" font-family="Arial, sans-serif" font-size="48" font-weight="700">Türkiye Geneli</text>
  <text x="625" y="305" fill="#fff" font-family="Arial, sans-serif" font-size="48" font-weight="700">Lojistik Çözümleri</text>
  <text x="625" y="365" fill="#cbd5e1" font-family="Arial, sans-serif" font-size="25">Parsiyel • Komple • Hava • Deniz</text>
  <text x="625" y="414" fill="#cbd5e1" font-family="Arial, sans-serif" font-size="25">Express Kargo • Depolama</text>
  <text x="64" y="577" fill="#fff" font-family="Arial, sans-serif" font-size="26" font-weight="700">www.rexlojistik.com</text>
</svg>`);

const ogImage = await sharp(socialCard)
  .composite([{ input: logo, left: 79, top: 118 }])
  .png({ compressionLevel: 9, adaptiveFiltering: true, effort: 10, palette: true })
  .toBuffer();
await fs.writeFile(path.join(publicDir, "og-image.png"), ogImage);

console.log("Public images optimized and social card rebuilt at 1200x630.");
