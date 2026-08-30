import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const templatePath = path.join(currentDir, 'rex-tys-kolaybi-fatura.xslt.in');
const outputPath = path.join(currentDir, 'rex-tys-kolaybi-fatura.xslt');
const assetsDir = path.join(currentDir, 'assets');

const encode = (name) => fs.readFileSync(path.join(assetsDir, name)).toString('base64');
const rendered = fs.readFileSync(templatePath, 'utf8')
  .replace('__REX_LOGO_BASE64__', encode('rex-website-logo.jpg'))
  .replace('__GIB_LOGO_BASE64__', encode('gib-logo.jpg'));

if (rendered.includes('__REX_LOGO_BASE64__') || rendered.includes('__GIB_LOGO_BASE64__')) {
  throw new Error('XSLT logo yer tutucuları tamamlanamadı.');
}

fs.writeFileSync(outputPath, rendered, 'utf8');
console.log(outputPath);
