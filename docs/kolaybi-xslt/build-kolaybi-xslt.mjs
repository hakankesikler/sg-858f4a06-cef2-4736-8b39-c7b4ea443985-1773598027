import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const templatePath = path.join(currentDir, 'rex-tys-kolaybi-fatura.xslt.in');
const assetsDir = path.join(currentDir, 'assets');
const variants = [
  {
    outputName: 'rex-tys-kolaybi-e-fatura.xslt',
    documentTypeLabel: 'e-Fatura',
    archiveNote: '',
  },
  {
    outputName: 'rex-tys-kolaybi-e-arsiv.xslt',
    documentTypeLabel: 'e-Arşiv Fatura',
    archiveNote: '<div class="archive-note">Bu belge e-Arşiv Fatura kapsamında elektronik ortamda düzenlenmiş ve iletilmiştir.</div>',
  },
];

const encode = (name) => fs.readFileSync(path.join(assetsDir, name)).toString('base64');
const sharedTemplate = fs.readFileSync(templatePath, 'utf8')
  .replace('__REX_LOGO_BASE64__', encode('rex-website-logo.jpg'))
  .replace('__GIB_LOGO_BASE64__', encode('gib-logo.jpg'));

if (sharedTemplate.includes('__REX_LOGO_BASE64__') || sharedTemplate.includes('__GIB_LOGO_BASE64__')) {
  throw new Error('XSLT logo yer tutucuları tamamlanamadı.');
}

for (const variant of variants) {
  const rendered = sharedTemplate
    .replace('__DOCUMENT_TYPE_LABEL__', variant.documentTypeLabel)
    .replace('__ARCHIVE_NOTE__', variant.archiveNote);

  if (rendered.includes('__DOCUMENT_TYPE_LABEL__') || rendered.includes('__ARCHIVE_NOTE__')) {
    throw new Error(`${variant.outputName} belge türü yer tutucuları tamamlanamadı.`);
  }

  const outputPath = path.join(currentDir, variant.outputName);
  fs.writeFileSync(outputPath, rendered, 'utf8');
  console.log(outputPath);
}
