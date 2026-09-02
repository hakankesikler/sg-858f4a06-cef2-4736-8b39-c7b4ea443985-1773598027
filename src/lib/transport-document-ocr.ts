export type TransportDocumentType = "driver_license" | "vehicle_registration";

export type DriverLicenseFields = {
  full_name?: string;
  tc_no?: string;
  license_classes?: string[];
  expiry_date?: string;
};

export type VehicleRegistrationFields = {
  plate?: string;
  owner_name?: string;
  registration_no?: string;
  vehicle_type?: "panelvan" | "kamyonet" | "kamyon" | "tir";
  body_type?: "kapali" | "acik" | "tenteli" | "frigo";
  capacity_kg?: number;
};

export type TransportDocumentFields = DriverLicenseFields & VehicleRegistrationFields;

function upperTr(value: string) {
  return value.toLocaleUpperCase("tr-TR");
}

function cleanLine(value: string) {
  return value.replace(/[|]+/g, " ").replace(/\s+/g, " ").trim();
}

function normalizedLines(rawText: string) {
  return rawText.split(/\r?\n/).map(cleanLine).filter(Boolean);
}

function valueAfterLabel(lines: string[], labels: RegExp[]) {
  for (let index = 0; index < lines.length; index += 1) {
    const normalized = upperTr(lines[index]);
    for (const label of labels) {
      if (!label.test(normalized)) continue;
      const inline = cleanLine(normalized.replace(label, "").replace(/^\s*[:.\-]\s*/, ""));
      if (inline.length > 1) return inline;
      const next = cleanLine(lines[index + 1] || "");
      if (next.length > 1) return upperTr(next);
    }
  }
  return undefined;
}

function valueAfterFieldNumber(lines: string[], field: string) {
  const pattern = new RegExp(`^\\s*${field.replace(".", "\\.")}[.)]?\\s*[:.-]?\\s*`, "i");
  for (let index = 0; index < lines.length; index += 1) {
    if (!pattern.test(lines[index])) continue;
    const inline = cleanLine(lines[index].replace(pattern, ""));
    if (inline.length > 1) return upperTr(inline);
    const next = cleanLine(lines[index + 1] || "");
    if (next.length > 1) return upperTr(next);
  }
  return undefined;
}

function isoDate(value?: string) {
  const match = value?.match(/\b(\d{1,2})[./-](\d{1,2})[./-](\d{4})\b/);
  if (!match) return undefined;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 2000 || year > 2100) return undefined;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isValidTurkishId(value: string) {
  if (!/^\d{11}$/.test(value) || value[0] === "0") return false;
  const digits = value.split("").map(Number);
  const odd = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const even = digits[1] + digits[3] + digits[5] + digits[7];
  return ((odd * 7 - even) % 10 + 10) % 10 === digits[9]
    && digits.slice(0, 10).reduce((sum, digit) => sum + digit, 0) % 10 === digits[10];
}

function titleCaseName(value?: string) {
  if (!value) return undefined;
  const cleaned = value
    .replace(/\b(T\.C\.?|TC|KİMLİK|KIMLIK|NO|NUMARASI|ADI|SOYADI|SURNAME|NAME)\b/gi, " ")
    .replace(/[^A-ZÇĞİÖŞÜ\s'-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length < 2 || cleaned.length > 100) return undefined;
  return cleaned.toLocaleLowerCase("tr-TR").replace(/(^|[\s'-])\p{L}/gu, (letter) => letter.toLocaleUpperCase("tr-TR"));
}

function parseDriverLicense(rawText: string): DriverLicenseFields {
  const lines = normalizedLines(rawText);
  const normalized = upperTr(lines.join("\n"));
  const ids = normalized.match(/\b\d{11}\b/g) || [];
  const tcNo = ids.find(isValidTurkishId);
  const surname = valueAfterLabel(lines, [/^(?:1[.)]?\s*)?(?:SOYADI|SURNAME)\b/]) || valueAfterFieldNumber(lines, "1");
  const givenName = valueAfterLabel(lines, [/^(?:2[.)]?\s*)?(?:ADI|NAME|GIVEN NAMES?)\b/]) || valueAfterFieldNumber(lines, "2");
  const combinedName = valueAfterLabel(lines, [/(?:ADI\s*SOYADI|AD[İI]\s+VE\s+SOYADI)\b/]);
  const fullName = titleCaseName(combinedName || [givenName, surname].filter(Boolean).join(" "));
  const expiryDate = isoDate(valueAfterLabel(lines, [/(?:4B[.)]?\s*)?(?:GEÇERLİLİK|GECERLILIK|SON\s+GEÇERLİLİK|EXPIRY|EXPIRES?)\b/]) || valueAfterFieldNumber(lines, "4b"));
  const classSource = valueAfterLabel(lines, [/(?:9[.)]?\s*)?(?:SINIFI|SINIFLARI|CATEGORIES|CLASS(?:ES)?)\b/]) || valueAfterFieldNumber(lines, "9");
  const classMatches = upperTr(classSource || "").match(/\b(?:A1|A2|A|B1|BE|B|C1E|C1|CE|C|D1E|D1|DE|D|M|F|G)\b/g) || [];
  const licenseClasses = [...new Set(classMatches)];
  return {
    ...(fullName ? { full_name: fullName } : {}),
    ...(tcNo ? { tc_no: tcNo } : {}),
    ...(licenseClasses.length ? { license_classes: licenseClasses } : {}),
    ...(expiryDate ? { expiry_date: expiryDate } : {}),
  };
}

function formattedPlate(value: string) {
  const compact = upperTr(value).replace(/[^0-9A-ZÇĞİÖŞÜ]/g, "");
  const match = compact.match(/^(\d{2})([A-ZÇĞİÖŞÜ]{1,3})(\d{2,4})$/);
  return match ? `${match[1]} ${match[2]} ${match[3]}` : undefined;
}

function parseVehicleRegistration(rawText: string): VehicleRegistrationFields {
  const lines = normalizedLines(rawText);
  const normalized = upperTr(lines.join("\n"));
  const plateSource = valueAfterLabel(lines, [/(?:PLAKA|PLAKA\s+NO|REGISTRATION\s+NUMBER)\b/]);
  const plateCandidate = plateSource?.match(/\b\d{2}\s*[A-ZÇĞİÖŞÜ]{1,3}\s*\d{2,4}\b/)?.[0]
    || normalized.match(/\b\d{2}\s*[A-ZÇĞİÖŞÜ]{1,3}\s*\d{2,4}\b/)?.[0];
  const plate = plateCandidate ? formattedPlate(plateCandidate) : undefined;
  const ownerName = titleCaseName(valueAfterLabel(lines, [/(?:ARAÇ\s+SAHİBİ|ARAC\s+SAHIBI|SAHİBİNİN\s+ADI\s+SOYADI|SAHIBININ\s+ADI\s+SOYADI|ADI\s+SOYADI|AD[İI]\s+VE\s+SOYADI|OWNER)(?=\s|:|$)/]));
  const registrationValue = valueAfterLabel(lines, [/(?:TESCİL\s+BELGE\s+SERİ\s+NO|TESCIL\s+BELGE\s+SERI\s+NO|RUHSAT\s+NO|BELGE\s+SERİ\s+NO)\b/]);
  const registrationNo = registrationValue?.replace(/[^A-Z0-9]/gi, "").slice(0, 30);

  let vehicleType: VehicleRegistrationFields["vehicle_type"];
  if (/(ÇEKİCİ|CEKICI|TIR)/.test(normalized)) vehicleType = "tir";
  else if (/\bKAMYONET\b/.test(normalized)) vehicleType = "kamyonet";
  else if (/\bKAMYON\b/.test(normalized)) vehicleType = "kamyon";
  else if (/\b(PANELVAN|PANEL VAN)\b/.test(normalized)) vehicleType = "panelvan";

  let bodyType: VehicleRegistrationFields["body_type"];
  if (/(FRİGO|FRIGO|FRİGORİFİK|FRIGORIFIK)/.test(normalized)) bodyType = "frigo";
  else if (/TENTELİ/.test(normalized)) bodyType = "tenteli";
  else if (/KAPALI/.test(normalized)) bodyType = "kapali";
  else if (/AÇIK(?:\s|$|[:.,])/.test(normalized)) bodyType = "acik";

  const capacitySource = valueAfterLabel(lines, [/(?:İSTİAP\s+HADDİ|ISTIAP\s+HADDI|YÜK\s+KAPASİTESİ|YUK\s+KAPASITESI)(?=\s|:|$)/]);
  const capacityMatch = capacitySource?.replace(/[.,](?=\d{3}\b)/g, "").match(/\b\d{3,6}\b/);
  const capacityKg = capacityMatch ? Number(capacityMatch[0]) : undefined;
  return {
    ...(plate ? { plate } : {}),
    ...(ownerName ? { owner_name: ownerName } : {}),
    ...(registrationNo ? { registration_no: registrationNo } : {}),
    ...(vehicleType ? { vehicle_type: vehicleType } : {}),
    ...(bodyType ? { body_type: bodyType } : {}),
    ...(capacityKg && capacityKg > 0 ? { capacity_kg: capacityKg } : {}),
  };
}

export function parseTransportDocument(documentType: TransportDocumentType, rawText: string) {
  return documentType === "driver_license" ? parseDriverLicense(rawText) : parseVehicleRegistration(rawText);
}

export function missingTransportDocumentFields(documentType: TransportDocumentType, fields: TransportDocumentFields) {
  if (documentType === "driver_license") {
    return [!fields.full_name && "ad soyad", !fields.tc_no && "T.C. kimlik numarası", !fields.license_classes?.length && "ehliyet sınıfı", !fields.expiry_date && "geçerlilik tarihi"].filter(Boolean) as string[];
  }
  return [!fields.plate && "plaka", !fields.owner_name && "ruhsat sahibi", !fields.registration_no && "ruhsat numarası"].filter(Boolean) as string[];
}
