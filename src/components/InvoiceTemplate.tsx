import React from "react";
import Image from "next/image";
import { ExternalLink, Printer } from "lucide-react";

interface InvoiceItem {
  productCode?: string;
  description: string;
  lineDescription?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountAmount: number;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
}

interface InvoiceBankAccount {
  label?: string;
  account_holder?: string;
  bank_name?: string;
  branch_name?: string;
  iban?: string;
  swift_code?: string;
  currency?: string;
}

export interface InvoiceTemplateData {
  invoiceNo: string;
  tysReference?: string;
  invoiceDate: string;
  dueDate?: string;
  scenario: string;
  invoiceType: string;
  documentKind: "e_invoice" | "e_archive";
  customizationNo: string;
  createdAt: string;
  ettn?: string;
  customerName: string;
  customerAddress?: string;
  customerDistrict?: string;
  customerCity?: string;
  customerPhone?: string;
  customerWebsite?: string;
  customerEmail?: string;
  customerTaxOffice?: string;
  customerTaxNumber?: string;
  customerTaxLabel?: string;
  items: InvoiceItem[];
  subtotal: number;
  discountAmount: number;
  vatAmount: number;
  grandTotal: number;
  currency: string;
  notes?: string;
  paymentMethod?: string;
  bankAccounts: InvoiceBankAccount[];
  qrImage?: string;
  officialPdfUrl?: string;
  isOfficial: boolean;
}

interface InvoiceTemplateProps {
  data: InvoiceTemplateData;
}

const DEFAULT_NOTES = `Taşıma İşleri Organizatörlüğü Belge No: İZM.U-NET.TİO.35.6323
Taşımalarınız REX Lojistik güvencesinde ve sigortalıdır.
Faturaya ilişkin itirazların yasal süre içinde yazılı olarak bildirilmesi gerekir.`;

const formatCurrency = (amount: number, currency: string) => `${new Intl.NumberFormat("tr-TR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(amount)} ${currency}`;

const safeDate = (value?: string, includeTime = false) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("tr-TR", includeTime
    ? { dateStyle: "short", timeStyle: "medium" }
    : { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
};

export function InvoiceTemplate({ data }: InvoiceTemplateProps) {
  const documentLabel = data.documentKind === "e_archive" ? "e-Arşiv Fatura" : "e-Fatura";
  const vatBreakdown = Array.from(data.items.reduce((rates, item) => {
    const current = rates.get(item.vatRate) || { base: 0, amount: 0 };
    rates.set(item.vatRate, {
      base: current.base + item.subtotal,
      amount: current.amount + item.vatAmount,
    });
    return rates;
  }, new Map<number, { base: number; amount: number }>()).entries()).sort(([a], [b]) => a - b);
  const customerLocation = [data.customerDistrict, data.customerCity].filter(Boolean).join(" / ");

  return (
    <>
      <article
        id="invoice-template"
        className="invoice-print-page mx-auto min-w-[720px] max-w-[210mm] bg-white p-5 text-[10px] leading-[1.35] text-slate-800 shadow-sm sm:p-8"
      >
        {!data.isOfficial ? (
          <div className="invoice-draft-banner mb-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-center text-[9px] font-bold tracking-wide text-amber-900">
            REX TYS TASLAK ÖNİZLEME · RESMÎ E-BELGE DEĞİLDİR
          </div>
        ) : null}
        <div className="mb-4 h-1 rounded-full bg-[linear-gradient(90deg,#f37021_0_34%,#173763_34%_100%)]" />

        <header className="grid grid-cols-[1.35fr_.7fr_.7fr] items-start gap-4 border-b-2 border-slate-300 pb-4">
          <section>
            <h1 className="text-[12px] font-bold leading-snug text-[#14213d]">
              REX LOJİSTİK TAŞIMACILIK DEPOLAMA<br />DANIŞMANLIK LİMİTED ŞİRKETİ
            </h1>
            <div className="mt-2 space-y-0.5 text-[9px] text-slate-600">
              <p>Folkart Towers A Kule No:47/B K:26 D:2601</p>
              <p>Adalet Mahallesi Manas Bulvarı 35530 Bayraklı / İzmir</p>
              <p>Tel: +90 (543) 401 07 55 · www.rexlojistik.com</p>
              <p>e-Posta: info@rexlojistik.com</p>
              <p><strong>Vergi Dairesi:</strong> Karşıyaka · <strong>VKN:</strong> 7342549288</p>
              <p><strong>MERSİS No:</strong> 0734259288000001</p>
            </div>
          </section>

          <section className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-red-600 text-lg font-extrabold text-red-600">GİB</div>
            <p className="mt-1 text-[12px] font-extrabold text-[#173763]">{documentLabel}</p>
            <p className="mt-0.5 font-semibold text-[#f37021]">{data.invoiceType}</p>
            <div className="mt-2 w-full border border-slate-500 px-2 py-1.5 text-[7px] leading-tight text-slate-600">
              REX LOJİSTİK<br />ELEKTRONİK BELGE
            </div>
          </section>

          <section className="flex flex-col items-end">
            {data.qrImage ? (
              <Image src={data.qrImage} alt="Fatura karekodu" width={104} height={104} unoptimized className="h-[104px] w-[104px] object-contain" />
            ) : (
              <div className="flex h-[104px] w-[104px] flex-col items-center justify-center border border-dashed border-slate-400 p-2 text-center text-[7px] text-slate-500">
                <strong className="text-[9px] text-slate-700">GİB KAREKOD</strong>
                <span className="mt-1 break-all">{data.ettn || (data.isOfficial ? "Karekod resmî KolayBi PDF’sindedir." : "Resmîleştirme sonrasında KolayBi belgesinde oluşur.")}</span>
              </div>
            )}
            <Image src="/rex-logo-circle.png" alt="REX Lojistik" width={112} height={112} className="mt-2 h-20 w-20 rounded-full object-contain" />
          </section>
        </header>

        <section className="mt-4 grid grid-cols-[1.15fr_.85fr] gap-5">
          <div>
            <p className="font-bold text-[#173763]">SAYIN</p>
            <p className="mt-1 text-[12px] font-bold uppercase text-slate-900">{data.customerName}</p>
            <div className="mt-2 space-y-0.5 text-[9px] text-slate-600">
              {data.customerAddress ? <p>{data.customerAddress}</p> : null}
              {customerLocation ? <p>{customerLocation}</p> : null}
              {data.customerPhone ? <p>Tel: {data.customerPhone}</p> : null}
              {data.customerWebsite ? <p>Web: {data.customerWebsite}</p> : null}
              {data.customerEmail ? <p>e-Posta: {data.customerEmail}</p> : null}
              {data.customerTaxOffice ? <p>Vergi Dairesi: {data.customerTaxOffice}</p> : null}
              {data.customerTaxNumber ? <p>{data.customerTaxLabel || "VKN/TCKN"}: {data.customerTaxNumber}</p> : null}
              <p className="mt-2 break-all"><strong>ETTN:</strong> {data.ettn || "Belge henüz resmîleştirilmedi"}</p>
            </div>
          </div>

          <table className="w-full border-collapse border border-slate-300 text-[9px]">
            <tbody>
              {[
                ["Tarih", safeDate(data.invoiceDate)],
                ["Fatura No", data.invoiceNo],
                ["Özelleştirme No", data.customizationNo],
                ["Senaryo", data.scenario],
                ["Fatura Tipi", data.invoiceType],
                ["Oluşma Zamanı", safeDate(data.createdAt, true)],
                ...(data.tysReference ? [["REX TYS Taslak No", data.tysReference]] : []),
              ].map(([label, value]) => (
                <tr key={label} className="border-b border-slate-300 last:border-b-0">
                  <th className="w-[44%] bg-slate-50 px-2 py-1.5 text-left font-semibold">{label}</th>
                  <td className="break-all px-2 py-1.5">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-5 overflow-hidden rounded-md border border-slate-300">
          <table className="w-full table-fixed border-collapse text-[8px]">
            <thead className="bg-[#173763] text-white">
              <tr>
                <th className="w-[4%] px-1 py-2 text-center">#</th>
                <th className="w-[29%] px-1 py-2 text-left">Mal / Hizmet</th>
                <th className="w-[9%] px-1 py-2 text-right">Miktar</th>
                <th className="w-[14%] px-1 py-2 text-right">Birim Fiyat</th>
                <th className="w-[11%] px-1 py-2 text-right">İndirim</th>
                <th className="w-[8%] px-1 py-2 text-right">KDV %</th>
                <th className="w-[12%] px-1 py-2 text-right">KDV</th>
                <th className="w-[13%] px-1 py-2 text-right">Tutar</th>
              </tr>
            </thead>
            <tbody>
              {data.items.length ? data.items.map((item, index) => (
                <tr key={`${item.productCode || item.description}-${index}`} className="border-b border-slate-200 even:bg-slate-50 last:border-b-0">
                  <td className="px-1 py-2 text-center align-top">{index + 1}</td>
                  <td className="px-1 py-2 align-top">
                    <p className="font-semibold text-[#173763]">{item.description}</p>
                    {item.productCode ? <p className="mt-0.5 text-[7px] text-slate-500">Kod: {item.productCode}</p> : null}
                    {item.lineDescription ? <p className="mt-0.5 whitespace-pre-line text-[7px] text-slate-500">{item.lineDescription}</p> : null}
                  </td>
                  <td className="px-1 py-2 text-right align-top">{item.quantity} {item.unit}</td>
                  <td className="px-1 py-2 text-right align-top">{formatCurrency(item.unitPrice, data.currency)}</td>
                  <td className="px-1 py-2 text-right align-top">{formatCurrency(item.discountAmount, data.currency)}</td>
                  <td className="px-1 py-2 text-right align-top">%{item.vatRate}</td>
                  <td className="px-1 py-2 text-right align-top">{formatCurrency(item.vatAmount, data.currency)}</td>
                  <td className="px-1 py-2 text-right align-top font-semibold">{formatCurrency(item.subtotal, data.currency)}</td>
                </tr>
              )) : (
                <tr><td colSpan={8} className="px-3 py-8 text-center text-slate-500">Fatura kalemleri bulunamadı.</td></tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="invoice-summary mt-4 grid grid-cols-[1.15fr_.85fr] items-start gap-4">
          <div className="space-y-3">
            {vatBreakdown.length ? (
              <div className="rounded-md border border-slate-300 p-3">
                <p className="mb-2 font-bold text-[#173763]">Vergi Özeti</p>
                <table className="w-full border-collapse text-[8px]">
                  <thead className="bg-slate-100"><tr><th className="p-1 text-left">Vergi</th><th className="p-1 text-right">Matrah</th><th className="p-1 text-right">Oran</th><th className="p-1 text-right">Tutar</th></tr></thead>
                  <tbody>{vatBreakdown.map(([rate, totals]) => (
                    <tr key={rate} className="border-t border-slate-200"><td className="p-1">KDV</td><td className="p-1 text-right">{formatCurrency(totals.base, data.currency)}</td><td className="p-1 text-right">%{rate}</td><td className="p-1 text-right">{formatCurrency(totals.amount, data.currency)}</td></tr>
                  ))}</tbody>
                </table>
              </div>
            ) : null}

            <div className="rounded-md border border-slate-300 p-3">
              <p className="mb-1 font-bold text-[#173763]">Açıklamalar ve Notlar</p>
              <p className="whitespace-pre-line text-[8px] leading-relaxed text-slate-600">{data.notes || DEFAULT_NOTES}</p>
              {data.bankAccounts.map((account, index) => (
                <div key={account.iban || index} className="mt-2 border-t border-slate-200 pt-2 text-[8px] text-slate-600">
                  <strong>{account.label || "Banka Hesabı"}</strong><br />
                  {[account.account_holder, account.bank_name, account.branch_name].filter(Boolean).join(" · ")}<br />
                  {account.iban ? <>IBAN: {account.iban}</> : null}
                  {account.swift_code ? <> · SWIFT: {account.swift_code}</> : null}
                  {account.currency ? <> · {account.currency}</> : null}
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-md border border-slate-300 text-[9px]">
            {[
              ["Mal / Hizmet Toplamı", data.subtotal],
              ...(data.discountAmount ? [["Toplam İndirim", data.discountAmount] as [string, number]] : []),
              ["KDV Hariç Toplam", data.subtotal],
              ["Hesaplanan KDV", data.vatAmount],
              ["Vergiler Dahil Toplam", data.grandTotal],
            ].map(([label, amount]) => (
              <div key={label} className="flex justify-between gap-3 border-b border-slate-200 px-3 py-2 last:border-b-0">
                <span>{label}</span><strong>{formatCurrency(amount as number, data.currency)}</strong>
              </div>
            ))}
            <div className="flex justify-between gap-3 bg-[#173763] px-3 py-2.5 text-[11px] font-bold text-white">
              <span>Ödenecek Tutar</span><span>{formatCurrency(data.grandTotal, data.currency)}</span>
            </div>
            {data.dueDate ? <div className="border-t border-slate-200 bg-slate-50 px-3 py-2 text-slate-600">Son ödeme: <strong>{safeDate(data.dueDate)}</strong></div> : null}
            {data.paymentMethod ? <div className="border-t border-slate-200 bg-slate-50 px-3 py-2 text-slate-600">Ödeme yöntemi: <strong>{data.paymentMethod}</strong></div> : null}
          </div>
        </section>

        {data.documentKind === "e_archive" ? (
          <p className="invoice-archive-note mt-3 rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-[8px] font-semibold text-orange-900">
            Bu belge e-Arşiv izni kapsamında elektronik ortamda düzenlenmiş ve iletilmiştir. Teslim şekli: Elektronik.
          </p>
        ) : null}

        <footer className="invoice-footer mt-4 grid grid-cols-[1fr_auto] gap-4 border-t-2 border-[#173763] pt-2 text-[7px] leading-relaxed text-slate-500">
          <p><strong className="text-[#173763]">REX LOJİSTİK TAŞIMACILIK DEPOLAMA DANIŞMANLIK LİMİTED ŞİRKETİ</strong><br />TİO Yetki Belgesi: İZM.U-NET.TİO.35.6323 · www.rexlojistik.com · info@rexlojistik.com</p>
          <p className="max-w-64 text-right">Bu fatura elektronik ortamda oluşturulmuştur.<br />Doğrulama: {data.ettn || "Resmî ETTN bekleniyor"}</p>
        </footer>

        <div className="invoice-actions mt-5 flex flex-wrap justify-end gap-3">
          {data.officialPdfUrl ? (
            <a href={data.officialPdfUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50">
              <ExternalLink className="h-4 w-4" /> Resmî PDF’yi Aç
            </a>
          ) : null}
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-md bg-[#173763] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#244a80]">
            <Printer className="h-4 w-4" /> Yazdır
          </button>
        </div>
      </article>

      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 0; }
          body * { visibility: hidden !important; }
          #invoice-template, #invoice-template * { visibility: visible !important; }
          #invoice-template {
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            width: 210mm !important;
            max-width: none !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 8mm !important;
            box-shadow: none !important;
          }
          #invoice-template table, .invoice-summary, .invoice-archive-note, .invoice-footer {
            break-inside: avoid;
          }
          .invoice-actions { display: none !important; }
        }
      `}</style>
    </>
  );
}
