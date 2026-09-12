"use client";

import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Clock3, MessageCircle, ShieldCheck, Warehouse } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PlannerVariant = "customs" | "weekend";

const fieldClassName = "mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100";

export function RapidTransferPlanner({ variant }: { variant: PlannerVariant }) {
  const isWeekend = variant === "weekend";
  const [pickup, setPickup] = useState(isWeekend ? "İstanbul" : "Ambarlı Limanı / çevre antrepo");
  const [destination, setDestination] = useState(isWeekend ? "İzmir" : "İzmir");
  const [load, setLoad] = useState("");
  const [readyAt, setReadyAt] = useState("");
  const [deadline, setDeadline] = useState("");
  const [contactConfirmed, setContactConfirmed] = useState(false);

  const result = useMemo(() => {
    const missing = [
      !pickup && "alım noktası",
      !destination && "teslim noktası",
      !load && "yük bilgisi",
      !readyAt && "hazır olma zamanı",
      !deadline && "teslim hedefi",
      !contactConfirmed && "adreslerin çalışma/kabul teyidi",
    ].filter(Boolean) as string[];

    return {
      missing,
      title: missing.length === 0 ? "Hızlı operasyon ön kontrolü tamam" : `${missing.length} bilgi daha gerekli`,
      text: missing.length === 0
        ? "Bilgileri operasyon ekibine iletin; araç, saha ve gerçekçi teslim süresi birlikte teyit edilsin."
        : `Planı netleştirmek için ${missing.join(", ")} bilgisini tamamlayın.`,
    };
  }, [contactConfirmed, deadline, destination, load, pickup, readyAt]);

  const message = [
    `Merhaba, ${isWeekend ? "hafta sonu acil nakliye" : "antrepo/liman çıkışlı yurtiçi transfer"} teklifi rica ederim.`,
    `Alım: ${pickup || "Belirtilmedi"}`,
    `Teslim: ${destination || "Belirtilmedi"}`,
    `Yük: ${load || "Belirtilmedi"}`,
    `Hazır olma: ${readyAt || "Belirtilmedi"}`,
    `En geç teslim: ${deadline || "Belirtilmedi"}`,
    `Alım ve teslim noktası teyidi: ${contactConfirmed ? "Yapıldı" : "Bekliyor"}`,
  ].join("\n");

  const whatsappUrl = `https://wa.me/905434010755?text=${encodeURIComponent(message)}`;

  return (
    <section aria-labelledby="rapid-transfer-planner-heading" className="bg-slate-50 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="font-semibold text-orange-600">5 bilgide operasyon ön kontrolü</p>
            <h2 id="rapid-transfer-planner-heading" className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">
              {isWeekend ? "Cumartesi teslim hedefinizi birlikte kontrol edelim" : "Sahadan varış adresine transfer planını hazırlayın"}
            </h2>
            <p className="mt-4 max-w-3xl leading-7 text-slate-600">
              Sabit süre veya fiyat vaadi vermeden önce yükün gerçekten hazır olduğunu, iki adresin çalışma saatlerini ve uygun araç kapasitesini doğrularız.
            </p>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor={`${variant}-pickup`}>Alım noktası</Label>
                {isWeekend ? (
                  <Input id={`${variant}-pickup`} className="mt-2 h-11" value={pickup} onChange={(event) => setPickup(event.target.value)} placeholder="Örn. Esenyurt / İstanbul" />
                ) : (
                  <select id={`${variant}-pickup`} value={pickup} onChange={(event) => setPickup(event.target.value)} className={fieldClassName}>
                    <option>Ambarlı Limanı / çevre antrepo</option>
                    <option>Muratbey–Çatalca / Hadımköy antrepo</option>
                    <option>Erenköy bağlantılı antrepo</option>
                    <option>Beylikdüzü–Esenyurt–Büyükçekmece depo</option>
                    <option>İstanbul Havalimanı / AHL Kargo sahası</option>
                    <option>Diğer İstanbul depo veya limanı</option>
                  </select>
                )}
              </div>
              <div>
                <Label htmlFor={`${variant}-destination`}>Teslim noktası</Label>
                <Input id={`${variant}-destination`} className="mt-2 h-11" value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="İl / ilçe / açık adres" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor={`${variant}-load`}>Yük bilgisi</Label>
                <Input id={`${variant}-load`} className="mt-2 h-11" value={load} onChange={(event) => setLoad(event.target.value)} placeholder="Örn. 3 Euro palet, 1.150 kg, istiflenemez makine parçası" />
              </div>
              <div>
                <Label htmlFor={`${variant}-ready`}>Yük ne zaman hazır?</Label>
                <Input id={`${variant}-ready`} type="datetime-local" className="mt-2 h-11" value={readyAt} onChange={(event) => setReadyAt(event.target.value)} />
              </div>
              <div>
                <Label htmlFor={`${variant}-deadline`}>En geç teslim hedefi</Label>
                <Input id={`${variant}-deadline`} type="datetime-local" className="mt-2 h-11" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
              </div>
            </div>

            <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              <input type="checkbox" checked={contactConfirmed} onChange={(event) => setContactConfirmed(event.target.checked)} className="mt-1 h-4 w-4 accent-orange-500" />
              <span>Alım ve teslim noktalarının belirtilen saatlerde açık olduğunu veya yetkililerden teyit alabileceğimi biliyorum.</span>
            </label>

            <div aria-live="polite" className={`mt-6 rounded-2xl border p-5 ${result.missing.length === 0 ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
              <div className="flex items-start gap-3">
                {result.missing.length === 0 ? <CheckCircle2 className="mt-0.5 h-6 w-6 flex-none text-emerald-600" /> : <Clock3 className="mt-0.5 h-6 w-6 flex-none text-amber-600" />}
                <div>
                  <h3 className="font-bold text-slate-950">{result.title}</h3>
                  <p className="mt-1 leading-6 text-slate-700">{result.text}</p>
                </div>
              </div>
            </div>

            <a href={whatsappUrl} target="_blank" rel="noreferrer" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3.5 font-semibold text-white transition hover:bg-orange-600 sm:w-auto">
              <MessageCircle className="h-5 w-5" /> Operasyon özetini WhatsApp’tan gönder <ArrowRight className="h-5 w-5" />
            </a>
          </div>

          <aside className="space-y-5">
            <div className="rounded-3xl bg-slate-950 p-7 text-white">
              <Warehouse className="h-9 w-9 text-orange-400" />
              <h2 className="mt-5 text-2xl font-bold">Araçtan önce bilgi sahaya girer</h2>
              <p className="mt-3 leading-7 text-slate-300">Açık adres, referans, çalışma saati ve yükleme koşulu teyit edilmeden yola çıkan araç hız değil bekleme üretir.</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-7">
              <ShieldCheck className="h-9 w-9 text-emerald-600" />
              <h2 className="mt-5 text-2xl font-bold text-slate-950">Yetki sınırı açık</h2>
              <p className="mt-3 leading-7 text-slate-600">REX taşıma ve teslimat koordinasyonunu yönetir. Gümrükleme, teslim emri ve resmî işlemler yetkili müşaviriniz ve ilgili taraflarca tamamlanır.</p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
