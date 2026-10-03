import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { pathToFileURL } = require('node:url');

require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(
  fs.readFileSync(filename, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText, filename);
const { createCrmOfferPdf } = require('../src/lib/crm-offer-delivery.ts');
const offer = { id: 'pdf-test', offer_no: 'REX-TEKLIF-SMOKE', version_no: 2, revision_no: 1,
  subject: 'İstanbul Ankara Taşıma Teklifi', amount: 12000, currency: 'TRY',
  valid_until: '2026-10-15', notes: 'Teklif açıklaması: ücret ve ödeme koşulları görüşülmüştür.',
  pickup_location: 'İstanbul', delivery_location: 'Ankara', service_type: 'Parsiyel', vehicle_type: 'Tır',
  cargo_description: 'Palet tekstil', weight_kg: 1550, pallet_count: 5, payment_terms: '30 gün',
  incoterm: 'DAP', vat_rate: 20,
  crm_offer_items: [{ description: 'Taşıma hizmeti', quantity: 1, unit: 'Sefer', unit_price: 10000, tax_rate: 20 }],
};
const recipient = { company_name: 'Örnek Müşteri', contact_name: 'Çağrı Şahin', email: 'pdf-test@example.invalid' };
const compact = text => text.replace(/\s+/g, '');

async function inspect(bytes, name) {
  const pdfjs = await import(pathToFileURL(require.resolve('pdfjs-dist/legacy/build/pdf.mjs')));
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(bytes), useSystemFonts: true }).promise;
  let text = '';
  for (let number = 1; number <= pdf.numPages; number++) {
    const page = await pdf.getPage(number);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(' ');
    text += pageText + '\n';
    assert.ok(pageText.includes(`Sayfa / Page ${number} / ${pdf.numPages}`));
    assert.ok(pageText.includes('HİZMET TEKLİFİ / OFFER'));
    assert.ok(pageText.includes('info@rexlojistik.com'));
    for (const item of content.items.filter(item => item.str.trim())) {
      const [,,,, x, y] = item.transform;
      assert.ok(x >= 39 && x + item.width <= 558, `${name}: horizontal overflow: ${item.str}`);
      assert.ok(y > 10 && y < 825, `${name}: vertical overflow: ${item.str}`);
      // Content cannot enter the repeated letterhead or footer; those have fixed text.
      if (!/HİZMET TEKLİFİ|REX-TEKLIF|Versiyon \/ Version|REX LOJİSTİK|Folkart|Adalet Mahallesi|229 0014|TİO Yetki|Sayfa \/ Page|Bu belge/.test(item.str)) {
        assert.ok(y <= 612 && y >= 65, `${name}: reserved area collision: ${item.str}`);
      }
    }
  }
  assert.ok(!text.includes('º') && !text.includes('�'));
  assert.ok(!text.includes('DELIVERED BY') && !text.includes('LIVE TRACKING'));
  if (process.env.PDF_OUTPUT_DIR) {
    fs.mkdirSync(process.env.PDF_OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(path.join(process.env.PDF_OUTPUT_DIR, name + '.pdf'), bytes);
    fs.writeFileSync(path.join(process.env.PDF_OUTPUT_DIR, name + '.txt'), text);
  }
  return { text, pages: pdf.numPages };
}

test('offer PDF preserves business data and genuine lira glyphs in both font weights', async () => {
  const result = await inspect(createCrmOfferPdf(offer, recipient), 'crm-offer');
  assert.equal(result.pages, 1);
  for (const expected of ['REX-TEKLIF-SMOKE', offer.subject, recipient.company_name,
    recipient.contact_name, '₺12.000,00', '₺10.000,00', '15.10.2026', 'İstanbul', 'Ankara',
    'Parsiyel', 'Tır', 'Palet tekstil', '1550 kg', '5', '30 gün', 'DAP', '%20',
    'Taşıma hizmeti', offer.notes, 'FİYAT KALEMLERİ / PRICE ITEMS']) {
    assert.ok(compact(result.text).includes(compact(expected)), `Missing ${expected}`);
  }
  assert.ok((result.text.match(/₺/g) || []).length >= 4);
  const { jsPDF } = require('jspdf');
  const assets = require('../src/lib/crm-offer-pdf-assets.json');
  for (const weight of ['regular', 'bold']) {
    const doc = new jsPDF(); doc.addFileToVFS('font.ttf', assets[weight]);
    doc.addFont('font.ttf', 'test', 'normal'); doc.setFont('test');
    assert.ok(doc.getFont().metadata.characterToGlyph(0x20ba) > 0, `${weight} lacks lira glyph`);
  }
});

test('long price rows and notes paginate without losing final content', async () => {
  const long = { ...offer, subject: offer.subject.repeat(12),
    crm_offer_items: Array.from({ length: 42 }, (_, i) => ({ description: `Kalem ${i + 1}: ` + 'Şehirler arası taşıma ve yükleme hizmeti '.repeat(5),
      quantity: i + 1, unit: 'Sefer', unit_price: 1000.25, tax_rate: 20 })),
    notes: ('Uzun açıklama: yükleme, teslim ve ödeme şartları.\n').repeat(100) + 'SON NOT: ₺ ve Türkçe karakterler',
  };
  const result = await inspect(createCrmOfferPdf(long, recipient), 'crm-offer-long');
  assert.ok(result.pages >= 4);
  for (let i = 1; i <= 42; i++) assert.ok(result.text.includes(`Kalem ${i}:`));
  assert.ok(result.text.includes('SON NOT: ₺ ve Türkçe karakterler'));
});

test('minimal offer and other currency keep authoritative amount', async () => {
  const result = await inspect(createCrmOfferPdf({ id: 'minimal', offer_no: offer.offer_no, version_no: 1,
    subject: 'Sıfır tutarlı teklif', amount: 0, currency: 'EUR', valid_until: null, notes: null }, recipient), 'crm-offer-minimal');
  assert.ok(compact(result.text).includes('€0,00'));
  assert.ok(result.text.includes('Belirtilmedi'));
});
