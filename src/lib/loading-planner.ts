// Nominal equipment samples for preliminary planning. Confirm the allocated unit before loading.
export type PlannerMode = "FCL" | "FTL";
export type Equipment = {
  id: string; mode: PlannerMode; label: string;
  lengthCm: number; widthCm: number; heightCm: number;
  openingWidthCm: number; openingHeightCm: number;
  payloadKg: number; loadingAccess: string; source: string; note: string;
};

const CONTAINER_SOURCE = "https://www.hapag-lloyd.com/content/dam/website/downloads/press_and_media/publications/15211_Container_Specification_engl_Gesamt_web.pdf";
const TRAILER_SOURCE = "https://www.krone-trailer.com/fileadmin/media/downloads/EN/Pritschensattelauflieger/Betriebsanleitungen/Profi_Liner/505369471_06_BA_ProfiLiner_MegaLiner_en.pdf";

export const EQUIPMENT: Equipment[] = [
  { id: "20dc", mode: "FCL", label: "20′ kuru yük", lengthCm: 589.8, widthCm: 235, heightCm: 239.2, openingWidthCm: 233.7, openingHeightCm: 226.1, payloadKg: 28180, loadingAccess: "Arka kapı", source: CONTAINER_SOURCE, note: "Hapag-Lloyd teknik föyündeki örnek seri için ihtiyatlı nominal ölçü ve taşıma sınırı." },
  { id: "40dc", mode: "FCL", label: "40′ kuru yük", lengthCm: 1202.9, widthCm: 235, heightCm: 239.2, openingWidthCm: 233.7, openingHeightCm: 226.1, payloadKg: 26700, loadingAccess: "Arka kapı", source: CONTAINER_SOURCE, note: "Hapag-Lloyd teknik föyündeki örnek seri için ihtiyatlı nominal ölçü ve taşıma sınırı." },
  { id: "40hc", mode: "FCL", label: "40′ High Cube", lengthCm: 1203.2, widthCm: 234.2, heightCm: 270, openingWidthCm: 233.7, openingHeightCm: 256.5, payloadKg: 28200, loadingAccess: "Arka kapı", source: CONTAINER_SOURCE, note: "Hapag-Lloyd teknik föyündeki örnek seri için ihtiyatlı nominal ölçü ve taşıma sınırı." },
  { id: "profi", mode: "FTL", label: "Standart tenteli dorse", lengthCm: 1362, widthCm: 248, heightCm: 260, openingWidthCm: 248, openingHeightCm: 260, payloadKg: 33060, loadingAccess: "Yandan yükleme açıklığı varsayımı", source: TRAILER_SOURCE, note: "Krone Profi Liner temel araç modeli. Teknik taşıma kapasitesi, rota yasal taşıma izni değildir; arka kapı açıklığı doğrulanmadı." },
  { id: "mega", mode: "FTL", label: "Mega tenteli dorse", lengthCm: 1362, widthCm: 248, heightCm: 259.5, openingWidthCm: 248, openingHeightCm: 259.5, payloadKg: 32650, loadingAccess: "Yandan yükleme açıklığı varsayımı", source: TRAILER_SOURCE, note: "Krone Mega Liner temel araç modeli için asgari yan yükleme yüksekliği. Teknik taşıma kapasitesi, rota yasal taşıma izni değildir; arka kapı açıklığı doğrulanmadı." },
];

export type PalletGroup = {
  id: string; name: string; reference: string; description: string;
  widthCm: number; lengthCm: number; heightCm: number; quantity: number; grossKg: number;
  stackable: boolean; maxLayers: number | null; maxTopKg: number | null;
  stackScope: "same" | "mixed"; allowRotate: boolean;
};
export type Pallet = { id: string; number: number; group: PalletGroup };
export type Placement = {
  pallet: Pallet; x: number; y: number; z: number;
  widthCm: number; lengthCm: number; heightCm: number; rotated: boolean; layer: number;
  stackId: string;
};
export type Plan = {
  equipment: Equipment; placed: Placement[]; outside: Pallet[]; issues: string[];
  totalWeightKg: number; loadedWeightKg: number; floorUsedM2: number;
  floorUsePercent: number; volumeUsePercent: number;
};

const positive = (value: number) => Number.isFinite(value) && value > 0;
export function validateGroups(groups: PalletGroup[]): string[] {
  const errors: string[] = [];
  if (!groups.length) errors.push("En az bir palet grubu girin.");
  if (groups.length > 20) errors.push("Teklif formuyla uyum için ilk sürümde en fazla 20 palet grubu hesaplanabilir.");
  let count = 0;
  groups.forEach((group, index) => {
    const row = `${index + 1}. grup`;
    if (!group.name.trim()) errors.push(`${row}: grup adı girin.`);
    if (![group.widthCm, group.lengthCm, group.heightCm, group.grossKg].every(positive)) errors.push(`${row}: dış ölçü ve brüt ağırlık sıfırdan büyük olmalı.`);
    if (!Number.isInteger(group.quantity) || group.quantity < 1) errors.push(`${row}: adet pozitif tam sayı olmalı.`);
    if (group.stackable && ((group.maxLayers !== null && (!Number.isInteger(group.maxLayers) || group.maxLayers < 2)) ||
      (group.maxTopKg !== null && (!Number.isFinite(group.maxTopKg) || group.maxTopKg < 0)))) {
      errors.push(`${row}: girilen istif sınırları geçersiz.`);
    }
    count += group.quantity;
  });
  if (count > 250) errors.push("İlk sürümde en fazla 250 palet hesaplanabilir.");
  return errors;
}

export function expandPallets(groups: PalletGroup[]): Pallet[] {
  let number = 0;
  return groups.flatMap((group) => Array.from({ length: group.quantity }, () => {
    number += 1;
    return { id: `P${String(number).padStart(3, "0")}`, number, group };
  }));
}

type Stack = { id: string; items: Placement[]; x: number; y: number; widthCm: number; lengthCm: number };
function orientations(pallet: Pallet) {
  const { widthCm, lengthCm, allowRotate } = pallet.group;
  return widthCm === lengthCm || !allowRotate
    ? [{ widthCm, lengthCm, rotated: false }]
    : [{ widthCm, lengthCm, rotated: false }, { widthCm: lengthCm, lengthCm: widthCm, rotated: true }];
}

function chooseStack(pallet: Pallet, stacks: Stack[], equipment: Equipment) {
  if (!pallet.group.stackable || pallet.group.maxLayers === null || pallet.group.maxTopKg === null) return null;
  for (const stack of stacks) {
    const lower = stack.items[stack.items.length - 1];
    const bottom = stack.items[0];
    if (!lower.pallet.group.stackable || stack.items.length >= (bottom.pallet.group.maxLayers ?? 1)) continue;
    if (stack.items.some((item) => item.pallet.group.stackScope === "same" && item.pallet.group.id !== pallet.group.id)) continue;
    if (pallet.group.stackScope === "same" && stack.items.some((item) => item.pallet.group.id !== pallet.group.id)) continue;
    const z = lower.z + lower.heightCm;
    if (z + pallet.group.heightCm > equipment.heightCm) continue;
    if (stack.items.some((item, i) => {
      const aboveKg = stack.items.slice(i + 1).reduce((total, upper) => total + upper.pallet.group.grossKg, pallet.group.grossKg);
      return aboveKg > (item.pallet.group.maxTopKg ?? -1) || stack.items.length + 1 > (item.pallet.group.maxLayers ?? 1);
    })) continue;
    for (const orientation of orientations(pallet)) {
      if (orientation.widthCm <= lower.widthCm && orientation.lengthCm <= lower.lengthCm && orientation.widthCm <= equipment.openingWidthCm) return { stack, orientation, z };
    }
  }
  return null;
}

export function calculatePlan(pallets: Pallet[], equipment: Equipment): Plan {
  const stacks: Stack[] = [];
  const placed: Placement[] = [];
  const outside: Pallet[] = [];
  const issues = new Set<string>();
  if (pallets.some((p) => p.group.stackable && (p.group.maxLayers === null || p.group.maxTopKg === null))) issues.add("İstif sınırı eksik olan gruplar güvenlik için istiflenmedi.");
  let loadedWeightKg = 0;
  // Larger footprints are positioned first; this is a deterministic packing heuristic, not a proof of optimality.
  const sorted = [...pallets].sort((a, b) => (b.group.widthCm * b.group.lengthCm - a.group.widthCm * a.group.lengthCm) || a.number - b.number);
  for (const pallet of sorted) {
    const group = pallet.group;
    const possible = orientations(pallet);
    const doorFits = possible.some((o) => o.widthCm <= equipment.openingWidthCm && group.heightCm <= equipment.openingHeightCm);
    if (!doorFits) { outside.push(pallet); issues.add(`${pallet.id}: yükleme açıklığından geçiş bu varsayımla doğrulanamadı.`); continue; }
    if (loadedWeightKg + group.grossKg > equipment.payloadKg) { outside.push(pallet); issues.add("Nominal teknik taşıma sınırı aşılıyor."); continue; }
    const stackChoice = chooseStack(pallet, stacks, equipment);
    if (stackChoice) {
      const { stack, orientation, z } = stackChoice;
      const item: Placement = { pallet, x: stack.x, y: stack.y, z, ...orientation, heightCm: group.heightCm, layer: stack.items.length + 1, stackId: stack.id };
      stack.items.push(item); placed.push(item); loadedWeightKg += group.grossKg; continue;
    }
    const candidates = [{ x: 0, y: 0 }, ...stacks.flatMap((s) => [{ x: s.x + s.widthCm, y: s.y }, { x: s.x, y: s.y + s.lengthCm }])];
    candidates.sort((a, b) => a.y - b.y || a.x - b.x);
    let floor: { x: number; y: number; widthCm: number; lengthCm: number; rotated: boolean } | null = null;
    for (const candidate of candidates) {
      for (const orientation of possible) {
        if (orientation.widthCm > equipment.widthCm || orientation.widthCm > equipment.openingWidthCm || orientation.lengthCm > equipment.lengthCm || group.heightCm > equipment.heightCm) continue;
        if (candidate.x + orientation.widthCm > equipment.widthCm || candidate.y + orientation.lengthCm > equipment.lengthCm) continue;
        if (stacks.some((s) => candidate.x < s.x + s.widthCm && candidate.x + orientation.widthCm > s.x && candidate.y < s.y + s.lengthCm && candidate.y + orientation.lengthCm > s.y)) continue;
        floor = { ...candidate, ...orientation }; break;
      }
      if (floor) break;
    }
    if (!floor) { outside.push(pallet); issues.add("Bazı paletler için bu sezgisel yerleşimde konum bulunamadı; bu kesin sığmaz sonucu değildir."); continue; }
    const item: Placement = { pallet, ...floor, z: 0, heightCm: group.heightCm, layer: 1, stackId: pallet.id };
    stacks.push({ id: pallet.id, items: [item], x: floor.x, y: floor.y, widthCm: floor.widthCm, lengthCm: floor.lengthCm });
    placed.push(item); loadedWeightKg += group.grossKg;
  }
  const floorCm2 = stacks.reduce((sum, stack) => sum + stack.widthCm * stack.lengthCm, 0);
  const volumeCm3 = placed.reduce((sum, item) => sum + item.widthCm * item.lengthCm * item.heightCm, 0);
  return { equipment, placed: placed.sort((a, b) => a.pallet.number - b.pallet.number), outside,
    issues: [...issues], totalWeightKg: pallets.reduce((sum, p) => sum + p.group.grossKg, 0), loadedWeightKg,
    floorUsedM2: floorCm2 / 10000,
    floorUsePercent: floorCm2 / (equipment.widthCm * equipment.lengthCm) * 100,
    volumeUsePercent: volumeCm3 / (equipment.widthCm * equipment.lengthCm * equipment.heightCm) * 100 };
}

export function compareEquipment(groups: PalletGroup[], mode: PlannerMode) {
  const errors = validateGroups(groups);
  if (errors.length) return { errors, pallets: [] as Pallet[], plans: [] as Plan[], recommended: null as Plan | null };
  const pallets = expandPallets(groups);
  const plans = EQUIPMENT.filter((item) => item.mode === mode).map((item) => calculatePlan(pallets, item));
  const recommended = [...plans].sort((a, b) => (a.outside.length - b.outside.length) || plans.indexOf(a) - plans.indexOf(b))[0] ?? null;
  return { errors, pallets, plans, recommended };
}
