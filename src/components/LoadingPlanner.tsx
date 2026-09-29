"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { ArrowRight, Download, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingPlan3D } from "@/components/LoadingPlan3D";
import { compareEquipment, type PalletGroup, type PlannerMode } from "@/lib/loading-planner";
import type { QuotePrefill } from "@/components/QuoteForm";

const exampleRows: Record<string, PalletGroup[]> = {
  konteyner: [{ id:"example-1", name:"Euro palet", reference:"SIP-01", description:"Ambalajlı ticari yük", widthCm:80, lengthCm:120, heightCm:110, quantity:11, grossKg:450, stackable:false, maxLayers:null, maxTopKg:null, stackScope:"same", allowRotate:true }],
  tir: [{ id:"example-1", name:"Euro palet", reference:"SIP-02", description:"Paletli ticari yük", widthCm:80, lengthCm:120, heightCm:115, quantity:24, grossKg:600, stackable:false, maxLayers:null, maxTopKg:null, stackScope:"same", allowRotate:true }],
  istif: [{ id:"example-1", name:"İstiflenebilir palet", reference:"SIP-03", description:"Dayanımı teyit edilmiş yük", widthCm:80, lengthCm:120, heightCm:100, quantity:12, grossKg:300, stackable:true, maxLayers:2, maxTopKg:350, stackScope:"same", allowRotate:true }],
  "packing-list": [{ id:"example-1", name:"Ürün paleti", reference:"PO-248", description:"Kutulanmış ürün grubu", widthCm:100, lengthCm:120, heightCm:130, quantity:5, grossKg:520, stackable:false, maxLayers:null, maxTopKg:null, stackScope:"same", allowRotate:true }],
};
const EMPTY: PalletGroup = { id:"new-1", name:"", reference:"", description:"", widthCm:80, lengthCm:120, heightCm:100, quantity:1, grossKg:500, stackable:false, maxLayers:null, maxTopKg:null, stackScope:"same", allowRotate:true };
const format = (value: number, digits = 0) => new Intl.NumberFormat("tr-TR", { maximumFractionDigits:digits }).format(value);
const optionText = "block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800";

function csvCell(value: string | number) {
  const text = String(value).replaceAll('"', '""');
  return `"${/^[=+\-@]/.test(text) ? "'" : ""}${text}"`;
}

export function LoadingPlanner() {
  const router = useRouter();
  const [mode, setMode] = useState<PlannerMode>("FCL");
  const [groups, setGroups] = useState<PalletGroup[]>(exampleRows.konteyner);
  const [calculated, setCalculated] = useState<ReturnType<typeof compareEquipment> | null>(null);
  const [equipmentId, setEquipmentId] = useState("20dc");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady) return;
    const example = typeof router.query.ornek === "string" ? router.query.ornek : "";
    if (!exampleRows[example]) return;
    setGroups(exampleRows[example].map((group) => ({ ...group })));
    setMode(example === "tir" ? "FTL" : "FCL");
    setCalculated(null);
  }, [router.isReady, router.query.ornek]);

  const selectedPlan = useMemo(() => calculated?.plans.find((plan) => plan.equipment.id === equipmentId) ?? calculated?.recommended ?? null, [calculated,equipmentId]);
  const selectedPallet = selectedPlan?.placed.find((item) => item.pallet.id === selectedId);
  const update = <K extends keyof PalletGroup>(id: string, key: K, value: PalletGroup[K]) => {
    setGroups((current) => current.map((group) => group.id === id ? { ...group, [key]:value } : group));
    setCalculated(null);
  };
  const updateNumber = (id: string, key: "widthCm"|"lengthCm"|"heightCm"|"quantity"|"grossKg"|"maxLayers"|"maxTopKg", value: string) => {
    update(id,key,(value.trim() === "" ? null : Number(value.replace(",","."))) as never);
  };
  const addGroup = () => { setGroups((current) => [...current,{ ...EMPTY,id:globalThis.crypto?.randomUUID?.() ?? String(Date.now()), name:`Grup ${current.length+1}` }]); setCalculated(null); };
  const removeGroup = (id: string) => { setGroups((current) => current.filter((group) => group.id !== id)); setCalculated(null); };
  const calculate = () => {
    const result = compareEquipment(groups,mode);
    setCalculated(result);
    setEquipmentId(result.recommended?.equipment.id ?? (mode === "FCL" ? "20dc" : "profi"));
    setSelectedId(result.recommended?.placed[0]?.pallet.id ?? null);
  };
  const reset = () => { setGroups([{...EMPTY}]); setCalculated(null); };
  const openQuote = () => {
    if (!selectedPlan || !calculated || calculated.errors.length) return;
    const summary = [
      `3D yükleme planı · ${mode} · ${selectedPlan.equipment.label} · ${selectedPlan.placed.length}/${calculated.pallets.length} palet yerleşti.`,
      ...groups.map((g) => `${g.name.slice(0,35)} / ${g.reference.slice(0,25)}: ${g.quantity} palet, ${g.widthCm}×${g.lengthCm}×${g.heightCm} cm, ${g.grossKg} kg/palet; ${g.stackable ? `${g.maxLayers} kat, üst yük ${g.maxTopKg} kg, ${g.stackScope === "same" ? "aynı grup" : "karışık grup"}` : "istif yok"}; ${g.allowRotate ? "tabanda 90° döner" : "dönmez"}. ${g.description.slice(0,55)}`),
      selectedPlan.outside.length ? `Dışarıda: ${selectedPlan.outside.map((p) => p.id).join(",")}` : "Tüm paletler bu ön yerleşimde konumlandı.",
      "Ekipman, kapı/yan açıklık, yasal ağırlık, aks ve emniyet yükleme öncesi teyit edilmelidir.",
    ].join("\n");
    if (summary.length > 1900 || groups.length > 20) { alert("Teklif formu not sınırına ulaşıldı. Daha az grup veya daha kısa açıklama ile yeniden deneyin."); return; }
    const prefill: QuotePrefill = {
      cargos: groups.map((g) => ({width:String(g.widthCm),length:String(g.lengthCm),height:String(g.heightCm),weight:String(g.grossKg),quantity:String(g.quantity)})),
      serviceType: mode === "FCL" ? "international" : "domestic", transportMode: mode === "FCL" ? "sea" : "road",
      transportDetail: mode === "FCL" ? (selectedPlan.equipment.id === "20dc" ? "container-20" : "container-40") : "tir",
      specialRequirements: summary,
    };
    window.dispatchEvent(new CustomEvent("rex:open-quote-form", { detail: prefill }));
  };
  const downloadPlan = () => {
    if (!selectedPlan) return;
    const header = ["Palet", "Grup", "Sipariş ref.", "Açıklama", "En cm", "Boy cm", "Yükseklik cm", "Brüt kg", "X cm", "Y cm", "Z cm", "Kat", "90° dönüş", "Durum"];
    const rows = [header, ...selectedPlan.placed.map((p) => [p.pallet.id,p.pallet.group.name,p.pallet.group.reference,p.pallet.group.description,p.widthCm,p.lengthCm,p.heightCm,p.pallet.group.grossKg,p.x,p.y,p.z,p.layer,p.rotated ? "Evet":"Hayır","Yerleşti"]), ...selectedPlan.outside.map((p) => [p.id,p.group.name,p.group.reference,p.group.description,p.group.widthCm,p.group.lengthCm,p.group.heightCm,p.group.grossKg,"","","","","","Dışarıda"])];
    const blob = new Blob(["\uFEFF",rows.map((row) => row.map(csvCell).join(";")).join("\r\n")], {type:"text/csv;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = `rex-yukleme-plani-${selectedPlan.equipment.id}.csv`; link.click();
    URL.revokeObjectURL(url);
  };

  return <div className="space-y-8">
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><h2 className="text-2xl font-bold text-slate-950">Palet grupları</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Dış ölçüler, palet/ambalaj/taşma dahil ölçülmeli. Brüt kg paleti de içerir. Bilinmeyen istif koşullarında istifi kapalı bırakın.</p></div>
        <div className="flex rounded-xl bg-slate-100 p-1" role="group" aria-label="Planlama modu">
          {(["FCL","FTL"] as PlannerMode[]).map((value) => <button key={value} type="button" onClick={() => {setMode(value);setCalculated(null);}} className={`rounded-lg px-5 py-2 text-sm font-bold ${mode === value ? "bg-slate-950 text-white shadow":"text-slate-600"}`}>{value}</button>)}
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-500">FCL: 20′ / 40′ / 40′ HC konteyner · FTL: standart / mega tenteli dorse örnekleri</p>
      <div className="mt-6 space-y-5">
        {groups.map((group,index) => <div key={group.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-2"><h3 className="font-bold text-slate-950">Grup {index+1}</h3><Button type="button" size="sm" variant="ghost" onClick={() => removeGroup(group.id)} aria-label={`${index+1}. grubu sil`}><Trash2 className="h-4 w-4" /></Button></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div><Label htmlFor={`${group.id}-name`}>Grup adı *</Label><Input id={`${group.id}-name`} value={group.name} maxLength={50} onChange={(e) => update(group.id,"name",e.target.value)} className="mt-1 bg-white" /></div>
            <div><Label htmlFor={`${group.id}-ref`}>Sipariş / grup referansı</Label><Input id={`${group.id}-ref`} value={group.reference} maxLength={40} onChange={(e) => update(group.id,"reference",e.target.value)} className="mt-1 bg-white" /></div>
            <div className="sm:col-span-2"><Label htmlFor={`${group.id}-description`}>Packing list açıklaması (isteğe bağlı)</Label><Input id={`${group.id}-description`} value={group.description} maxLength={100} onChange={(e) => update(group.id,"description",e.target.value)} className="mt-1 bg-white" /></div>
            {([ ["widthCm","Dış en (cm)"], ["lengthCm","Dış boy (cm)"], ["heightCm","Dış yükseklik (cm)"], ["quantity","Palet adedi"], ["grossKg","Palet başına brüt kg"] ] as const).map(([key,label]) => <div key={key}><Label htmlFor={`${group.id}-${key}`}>{label} *</Label><Input id={`${group.id}-${key}`} type="number" min={key === "quantity" ? 1 : .01} step={key === "quantity" ? 1 : "any"} value={group[key] ?? ""} onChange={(e) => updateNumber(group.id,key,e.target.value)} className="mt-1 bg-white" /></div>)}
            <div className="flex items-center gap-3 pt-5"><input id={`${group.id}-stack`} type="checkbox" checked={group.stackable} onChange={(e) => update(group.id,"stackable",e.target.checked)} className="h-5 w-5 accent-orange-600" /><Label htmlFor={`${group.id}-stack`}>İstiflenebilir</Label></div>
            <div className="flex items-center gap-3 pt-5"><input id={`${group.id}-rotate`} type="checkbox" checked={group.allowRotate} onChange={(e) => update(group.id,"allowRotate",e.target.checked)} className="h-5 w-5 accent-orange-600" /><Label htmlFor={`${group.id}-rotate`}>Tabanda 90° dönebilir</Label></div>
            {group.stackable && <>
              <div><Label htmlFor={`${group.id}-layers`}>Azami kat *</Label><Input id={`${group.id}-layers`} type="number" min="2" step="1" value={group.maxLayers ?? ""} onChange={(e) => updateNumber(group.id,"maxLayers",e.target.value)} className="mt-1 bg-white" /></div>
              <div><Label htmlFor={`${group.id}-top`}>Üzerine konabilecek azami kg *</Label><Input id={`${group.id}-top`} type="number" min="0" step="any" value={group.maxTopKg ?? ""} onChange={(e) => updateNumber(group.id,"maxTopKg",e.target.value)} className="mt-1 bg-white" /></div>
              <div><Label htmlFor={`${group.id}-scope`}>Üzerine hangi grup konabilir?</Label><select id={`${group.id}-scope`} value={group.stackScope} onChange={(e) => update(group.id,"stackScope",e.target.value as "same"|"mixed")} className={`${optionText} mt-1`}><option value="same">Yalnızca aynı grup</option><option value="mixed">Başka grup da olabilir</option></select></div>
            </>}
          </div>
        </div>)}
      </div>
      <div className="mt-6 flex flex-wrap gap-3"><Button type="button" variant="outline" onClick={addGroup}><Plus className="mr-2 h-4 w-4" />Grup ekle</Button><Button type="button" variant="outline" onClick={reset}><RotateCcw className="mr-2 h-4 w-4" />Temizle</Button><Button type="button" onClick={calculate} className="bg-orange-600 hover:bg-orange-700">Yerleşimi hesapla <ArrowRight className="ml-2 h-4 w-4" /></Button></div>
      {calculated?.errors.length ? <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{calculated.errors.map((error) => <p key={error}>{error}</p>)}</div> : null}
    </section>

    {calculated && !calculated.errors.length && selectedPlan && <section aria-label="Yükleme planı sonuçları" className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="flex flex-wrap justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-wide text-orange-600">Ön planlama sonucu</p><h2 className="mt-1 text-2xl font-bold text-slate-950">{calculated.recommended?.equipment.label}</h2><p className="mt-2 max-w-3xl text-sm text-slate-600">{calculated.recommended?.outside.length === 0 ? "Bu sezgisel yerleşimde tüm paletler, tanımlı ekipman sırasındaki ilk uygun seçeneğe yerleşti." : `En çok paleti yerleştiren ekipman ön seçimi. ${calculated.recommended?.outside.length} palet dışarıda kaldı; bu kesin “sığmaz” kararı değildir.`}</p></div><Button type="button" onClick={openQuote} className="bg-orange-600 hover:bg-orange-700">Bu yük için teklif al</Button></div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">{calculated.plans.map((plan) => <button key={plan.equipment.id} type="button" onClick={() => {setEquipmentId(plan.equipment.id);setSelectedId(plan.placed[0]?.pallet.id ?? null);}} className={`rounded-xl border p-4 text-left transition ${selectedPlan.equipment.id === plan.equipment.id ? "border-orange-500 bg-orange-50":"border-slate-200 hover:border-orange-300"}`}><strong className="block text-slate-950">{plan.equipment.label}</strong><span className="mt-1 block text-sm text-slate-600">{plan.placed.length} yerleşti · {plan.outside.length} dışarıda</span></button>)}</div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[
          ["Toplam yük",`${format(selectedPlan.totalWeightKg)} kg`],["Yerleşen / dışarıda",`${selectedPlan.placed.length} / ${selectedPlan.outside.length}`],["Taban kullanımı",`${format(selectedPlan.floorUsedM2,2)} m² · %${format(selectedPlan.floorUsePercent,1)}`],["Hacim kullanımı",`%${format(selectedPlan.volumeUsePercent,1)}`],
        ].map(([label,value]) => <div key={label} className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">{label}</p><strong className="mt-1 block text-lg text-slate-950">{value}</strong></div>)}</div>
        <p className="mt-4 text-sm text-slate-600">Yerleşen ağırlık: {format(selectedPlan.loadedWeightKg)} kg / örnek ekipmanın teknik sınırı: {format(selectedPlan.equipment.payloadKg)} kg. Gerçek araç/rota izinleri ayrıca teyit edilmelidir.</p>
        <p className="mt-2 text-sm text-slate-600">Örnek iç ölçüler (boy × en × yükseklik): {selectedPlan.equipment.lengthCm} × {selectedPlan.equipment.widthCm} × {selectedPlan.equipment.heightCm} cm. {selectedPlan.equipment.loadingAccess}: {selectedPlan.equipment.openingWidthCm} × {selectedPlan.equipment.openingHeightCm} cm. Fiilî ekipmanın ölçüleri yükleme öncesi teyit edilmelidir.</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.55fr_.85fr]"><LoadingPlan3D plan={selectedPlan} selectedId={selectedId} onSelect={setSelectedId} /><div className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="text-lg font-bold text-slate-950">Seçilen palet</h3>{selectedPallet ? <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">{[["Numara",selectedPallet.pallet.id],["Grup",selectedPallet.pallet.group.name],["Ölçü",`${selectedPallet.widthCm} × ${selectedPallet.lengthCm} × ${selectedPallet.heightCm} cm`],["Brüt",`${format(selectedPallet.pallet.group.grossKg)} kg`],["İstif katı",selectedPallet.layer],["Konum",`${selectedPallet.x}, ${selectedPallet.y}, ${selectedPallet.z} cm`]].map(([key,value]) => <div key={key}><dt className="text-slate-500">{key}</dt><dd className="font-semibold text-slate-950">{value}</dd></div>)}</dl> : <p className="mt-4 text-sm text-slate-500">3D plandan veya listeden bir palet seçin.</p>}<p className="mt-5 text-xs leading-5 text-slate-500">Çizim, hesap motorundaki x/y/z ve dönüş verilerini kullanır; dekoratif kapasite temsili değildir.</p></div></div>
      <div className="grid gap-6 lg:grid-cols-2"><div className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="text-lg font-bold text-slate-950">Kurallar ve açık noktalar</h3><ul className="mt-3 list-inside list-disc space-y-2 text-sm leading-6 text-slate-700">{selectedPlan.issues.length ? selectedPlan.issues.map((issue) => <li key={issue}>{issue}</li>) : <li>Girilen ölçü, istif ve örnek ekipman sınırlarında ihlal tespit edilmedi.</li>}<li>Aks yükü, zemin noktasal yükü, bağlama/ yük emniyeti ve fiilî kapı erişimi doğrulanmadı.</li><li>{selectedPlan.equipment.note}</li></ul><a href={selectedPlan.equipment.source} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm font-semibold text-orange-700 underline">Ekipman teknik kaynağı ↗</a></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="text-lg font-bold text-slate-950">Dışarıda kalan paletler</h3><p className="mt-3 text-sm text-slate-600">{selectedPlan.outside.length ? selectedPlan.outside.map((p) => `${p.id} (${p.group.name})`).join(", ") : "Yok. Bu ön yerleşimde tüm paletlere konum bulundu."}</p><p className="mt-4 text-xs leading-5 text-slate-500">Çoklu ekipmana otomatik bölme bu sürümde yapılmaz. Başka ekipman veya elle planlama için teklif isteyin.</p></div></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-lg font-bold text-slate-950">Numaralı palet listesi ve yükleme planı</h3><p className="mt-1 text-sm text-slate-600">Konumlar cm cinsinden; x: en, y: boy, z: yükseklik. Önce alt kat yüklenir.</p></div><Button type="button" variant="outline" onClick={downloadPlan}><Download className="mr-2 h-4 w-4" />CSV indir</Button></div><div className="mt-5 max-h-80 overflow-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="sticky top-0 bg-slate-100 text-slate-700"><tr><th className="p-3">Palet</th><th className="p-3">Grup / ref.</th><th className="p-3">Ölçü</th><th className="p-3">Kat</th><th className="p-3">Konum x/y/z</th></tr></thead><tbody>{[...selectedPlan.placed].sort((a,b) => a.layer-b.layer || b.y-a.y || a.x-b.x).map((p) => <tr key={p.pallet.id} onClick={() => setSelectedId(p.pallet.id)} className={`cursor-pointer border-b border-slate-100 ${selectedId === p.pallet.id ? "bg-orange-50":""}`}><th className="p-3">{p.pallet.id}</th><td className="p-3">{p.pallet.group.name} <span className="text-slate-500">{p.pallet.group.reference}</span></td><td className="p-3">{p.widthCm}×{p.lengthCm}×{p.heightCm}</td><td className="p-3">{p.layer}</td><td className="p-3">{p.x}/{p.y}/{p.z}</td></tr>)}</tbody></table></div></div>
    </section>}
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950"><strong>Ön planlama sınırı:</strong> Sonuç bir rezervasyon, kesin sığma garantisi veya yük emniyeti planı değildir. Ekipman seri ölçüleri değişebilir. Yükleme yönü, zemin/aks dağılımı, kapı manevrası, istif güvenliği ve güzergâhın yasal ağırlık sınırları operasyon öncesinde doğrulanmalıdır. Maliyet verisi kullanılmadığı için en ucuz seçenek belirlenmez. Hesap verileri hesaplama sırasında yalnızca bu tarayıcıda tutulur; URL’ye eklenmez.</section>
  </div>;
}
