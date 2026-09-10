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

const safeDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const optionalParts = (parts: Array<string | undefined>) => parts.filter(Boolean).join(" · ");

function PartyCard({ title, name, children }: { title: string; name: string; children: React.ReactNode }) {
  return (
    <section className="invoice-xslt-party-card">
      <div className="invoice-xslt-kicker">{title}</div>
      <div className="invoice-xslt-party-name">{name}</div>
      <div className="invoice-xslt-party-lines">{children}</div>
    </section>
  );
}

export function InvoiceTemplate({ data }: InvoiceTemplateProps) {
  const documentLabel = data.documentKind === "e_archive" ? "e-Arşiv Fatura" : "e-Fatura";
  const vatBreakdown = Array.from(data.items.reduce((rates, item) => {
    const current = rates.get(item.vatRate) || { base: 0, amount: 0 };
    rates.set(item.vatRate, { base: current.base + item.subtotal, amount: current.amount + item.vatAmount });
    return rates;
  }, new Map<number, { base: number; amount: number }>()).entries()).sort(([a], [b]) => a - b);
  const customerLocation = [data.customerDistrict, data.customerCity].filter(Boolean).join(" / ");
  const hasPaymentDetails = Boolean(data.paymentMethod || data.dueDate || data.bankAccounts.length);

  return (
    <>
      <article id="invoice-template" className="invoice-xslt-page">
        {!data.isOfficial ? (
          <div className="invoice-xslt-draft-banner">REX TYS TASLAK ÖNİZLEME · RESMÎ E-BELGE DEĞİLDİR</div>
        ) : null}
        <div className="invoice-xslt-brand-line" />

        <header className="invoice-xslt-header">
          <Image src="/rex-logo-full.jpg" alt="REX Lojistik" width={475} height={259} priority className="invoice-xslt-rex-logo" />
          <div className="invoice-xslt-gib-block">
            <div className="invoice-xslt-gib-logo">GİB</div>
            <div className="invoice-xslt-doc-type">{documentLabel}</div>
            <div className="invoice-xslt-doc-subtype">{data.invoiceType}</div>
          </div>
          <div className="invoice-xslt-qr-box">
            {data.qrImage ? (
              <Image src={data.qrImage} alt="Fatura karekodu" width={76} height={76} unoptimized className="invoice-xslt-qr" />
            ) : (
              <div className="invoice-xslt-qr invoice-xslt-qr-fallback">
                {data.ettn || (data.isOfficial ? "Karekod resmî e-belgededir." : "Resmîleştirme sonrasında e-belgede oluşur.")}
              </div>
            )}
            <div className="invoice-xslt-qr-caption">GİB KAREKOD</div>
          </div>
        </header>

        <section className="invoice-xslt-meta">
          {[
            ["Fatura No", data.invoiceNo],
            ["Düzenleme Tarihi", safeDate(data.invoiceDate)],
            ["Senaryo", data.scenario],
            ["Para Birimi", data.currency],
            ["ETTN", data.ettn || "Resmîleştirme sonrasında oluşur"],
            ["Son Ödeme", safeDate(data.dueDate)],
            ["Özelleştirme", data.customizationNo],
            ["Belge Tipi", data.invoiceType],
          ].map(([label, value]) => (
            <div key={label} className="invoice-xslt-meta-item">
              <div className="invoice-xslt-meta-label">{label}</div>
              <div className="invoice-xslt-meta-value">{value}</div>
            </div>
          ))}
        </section>

        <div className="invoice-xslt-parties">
          <PartyCard title="Hizmet Sağlayıcı" name="REX LOJİSTİK TAŞIMACILIK DEPOLAMA DANIŞMANLIK LİMİTED ŞİRKETİ">
            <div>Folkart Towers A Kule No:47/B K:26 D:2601</div>
            <div>Adalet Mahallesi Manas Bulvarı 35530 Bayraklı / İzmir</div>
            <div><b>Vergi Dairesi:</b> Karşıyaka</div>
            <div><b>VKN:</b> 7342549288</div>
            <div><b>MERSİS No:</b> 0734259288000001</div>
            <div><b>Telefon:</b> +90 (543) 401 07 55</div>
            <div><b>E-posta:</b> info@rexlojistik.com</div>
          </PartyCard>
          <PartyCard title="Sayın / Müşteri" name={data.customerName}>
            {data.customerAddress ? <div>{data.customerAddress}</div> : null}
            {customerLocation ? <div>{customerLocation}</div> : null}
            {data.customerTaxOffice ? <div><b>Vergi Dairesi:</b> {data.customerTaxOffice}</div> : null}
            {data.customerTaxNumber ? <div><b>{data.customerTaxLabel || "VKN/TCKN"}:</b> {data.customerTaxNumber}</div> : null}
            {data.customerPhone ? <div><b>Telefon:</b> {data.customerPhone}</div> : null}
            {data.customerWebsite ? <div><b>Web:</b> {data.customerWebsite}</div> : null}
            {data.customerEmail ? <div><b>E-posta:</b> {data.customerEmail}</div> : null}
          </PartyCard>
        </div>

        {data.tysReference ? (
          <section className="invoice-xslt-operation">
            <div className="invoice-xslt-kicker">REX TYS · Taşıma ve operasyon bilgileri</div>
            <div className="invoice-xslt-operation-grid">
              <div><div className="invoice-xslt-operation-label">REX TYS Taslak No</div><div className="invoice-xslt-operation-value">{data.tysReference}</div></div>
            </div>
          </section>
        ) : null}

        <section className="invoice-xslt-lines">
          <table>
            <colgroup>
              <col style={{ width: "4%" }} /><col style={{ width: "31%" }} /><col style={{ width: "9%" }} />
              <col style={{ width: "14%" }} /><col style={{ width: "10%" }} /><col style={{ width: "7%" }} />
              <col style={{ width: "12%" }} /><col style={{ width: "13%" }} />
            </colgroup>
            <thead><tr>
              <th className="invoice-xslt-center">#</th><th>Hizmet / Açıklama</th><th className="invoice-xslt-num">Miktar</th>
              <th className="invoice-xslt-num">Birim Fiyat</th><th className="invoice-xslt-num">İndirim</th><th className="invoice-xslt-num">KDV %</th>
              <th className="invoice-xslt-num">KDV</th><th className="invoice-xslt-num">Tutar</th>
            </tr></thead>
            <tbody>
              {data.items.length ? data.items.map((item, index) => (
                <tr key={`${item.productCode || item.description}-${index}`}>
                  <td className="invoice-xslt-center">{index + 1}</td>
                  <td>
                    <div className="invoice-xslt-item-name">{item.description}</div>
                    {item.lineDescription ? <div className="invoice-xslt-item-desc">{item.lineDescription}</div> : null}
                    {item.productCode ? <div className="invoice-xslt-item-desc">Kod: {item.productCode}</div> : null}
                  </td>
                  <td className="invoice-xslt-num">{item.quantity} {item.unit}</td>
                  <td className="invoice-xslt-num">{formatCurrency(item.unitPrice, data.currency)}</td>
                  <td className="invoice-xslt-num">{formatCurrency(item.discountAmount, data.currency)}</td>
                  <td className="invoice-xslt-num">% {item.vatRate}</td>
                  <td className="invoice-xslt-num">{formatCurrency(item.vatAmount, data.currency)}</td>
                  <td className="invoice-xslt-num invoice-xslt-strong">{formatCurrency(item.subtotal, data.currency)}</td>
                </tr>
              )) : <tr><td colSpan={8} className="invoice-xslt-empty">Fatura kalemleri bulunamadı.</td></tr>}
            </tbody>
          </table>
        </section>

        <section className="invoice-xslt-summary">
          <div>
            {vatBreakdown.length ? (
              <div className="invoice-xslt-info-card">
                <div className="invoice-xslt-info-title">Vergi Özeti</div>
                <table className="invoice-xslt-tax-table">
                  <thead><tr><th>Vergi</th><th className="invoice-xslt-num">Matrah</th><th className="invoice-xslt-num">Oran</th><th className="invoice-xslt-num">Tutar</th></tr></thead>
                  <tbody>{vatBreakdown.map(([rate, totals]) => (
                    <tr key={rate}><td>KDV</td><td className="invoice-xslt-num">{formatCurrency(totals.base, data.currency)}</td><td className="invoice-xslt-num">% {rate}</td><td className="invoice-xslt-num">{formatCurrency(totals.amount, data.currency)}</td></tr>
                  ))}</tbody>
                </table>
              </div>
            ) : null}
            {hasPaymentDetails ? (
              <div className="invoice-xslt-info-card">
                <div className="invoice-xslt-info-title">Ödeme Bilgileri</div>
                <div className="invoice-xslt-party-lines">
                  {data.paymentMethod ? <div><b>Ödeme Yöntemi:</b> {data.paymentMethod}</div> : null}
                  {data.dueDate ? <div><b>Vade:</b> {safeDate(data.dueDate)}</div> : null}
                  {data.bankAccounts.map((account, index) => (
                    <div key={account.iban || index} className="invoice-xslt-bank-account">
                      <b>{account.label || "Banka Hesabı"}</b>
                      {optionalParts([account.account_holder, account.bank_name, account.branch_name]) ? <><br />{optionalParts([account.account_holder, account.bank_name, account.branch_name])}</> : null}
                      {account.iban ? <><br />IBAN: {account.iban}</> : null}
                      {account.swift_code ? <> · SWIFT: {account.swift_code}</> : null}
                      {account.currency ? <> · {account.currency}</> : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="invoice-xslt-info-card">
              <div className="invoice-xslt-info-title">Açıklama, Notlar ve Banka Bilgileri</div>
              <div className="invoice-xslt-notes">{data.notes || DEFAULT_NOTES}</div>
            </div>
          </div>
          <div className="invoice-xslt-totals">
            {[
              ["Mal / Hizmet Toplamı", data.subtotal],
              ...(data.discountAmount ? [["Toplam İndirim", data.discountAmount] as [string, number]] : []),
              ["KDV Hariç Toplam", data.subtotal],
              ["Hesaplanan KDV", data.vatAmount],
              ["Vergiler Dahil Toplam", data.grandTotal],
            ].map(([label, amount]) => <div key={label} className="invoice-xslt-total-row"><span>{label}</span><strong>{formatCurrency(amount as number, data.currency)}</strong></div>)}
            <div className="invoice-xslt-total-row invoice-xslt-grand"><span>Ödenecek Tutar</span><strong>{formatCurrency(data.grandTotal, data.currency)}</strong></div>
          </div>
        </section>

        {data.documentKind === "e_archive" ? <p className="invoice-xslt-archive-note">Bu belge e-Arşiv Fatura kapsamında elektronik ortamda düzenlenmiş ve iletilmiştir. Teslim şekli: Elektronik.</p> : null}

        <footer className="invoice-xslt-footer">
          <div><strong>REX LOJİSTİK TAŞIMACILIK DEPOLAMA DANIŞMANLIK LİMİTED ŞİRKETİ</strong><br />TİO Yetki Belgesi: İZM.U-NET.TİO.35.6323 · www.rexlojistik.com · info@rexlojistik.com</div>
          <div className="invoice-xslt-electronic">Bu fatura elektronik ortamda oluşturulmuştur.<br />Doğrulama bilgisi: {data.ettn || "Resmî ETTN bekleniyor"}</div>
        </footer>

        <div className="invoice-actions invoice-xslt-actions">
          {data.officialPdfUrl ? <a href={data.officialPdfUrl} target="_blank" rel="noreferrer"><ExternalLink /> Resmî PDF’yi Aç</a> : null}
          <button type="button" onClick={() => window.print()}><Printer /> Yazdır</button>
        </div>
      </article>

      <style jsx global>{`
        .invoice-xslt-page{width:100%;max-width:210mm;min-width:720px;margin:0 auto;padding:9mm;color:#15213d;background:#fff;font:10.5px Arial,Helvetica,sans-serif;box-shadow:0 1px 3px rgb(15 23 42 / 8%)}
        .invoice-xslt-page *{box-sizing:border-box}.invoice-xslt-draft-banner{margin-bottom:10px;border:1px solid #f4c869;border-radius:8px;padding:8px 10px;background:#fffaf0;color:#7d421a;text-align:center;font-size:8.5px;font-weight:800;letter-spacing:.55px}
        .invoice-xslt-brand-line{height:4px;margin-bottom:12px;border-radius:3px;background:linear-gradient(90deg,#f37021 0 34%,#173763 34% 100%)}
        .invoice-xslt-header{display:grid;grid-template-columns:1.15fr .9fr .8fr;align-items:center;gap:14px;min-height:94px}.invoice-xslt-rex-logo{width:178px;height:auto;max-height:82px;object-fit:contain;object-position:left center}
        .invoice-xslt-gib-block{text-align:center}.invoice-xslt-gib-logo{display:flex;width:49px;height:49px;margin:0 auto 4px;align-items:center;justify-content:center;border:2px solid #cf3d34;border-radius:999px;color:#cf3d34;font-size:15px;font-weight:800}
        .invoice-xslt-doc-type{color:#173763;font-size:17px;font-weight:800;letter-spacing:.2px}.invoice-xslt-doc-subtype{margin-top:3px;color:#f37021;font-size:10px;font-weight:700;text-transform:uppercase}
        .invoice-xslt-qr-box{justify-self:end;width:92px;text-align:center}.invoice-xslt-qr{display:block;width:76px;height:76px;margin:0 auto;object-fit:contain}.invoice-xslt-qr-fallback{display:flex;align-items:center;justify-content:center;border:1px dashed #a8b3c4;border-radius:8px;padding:8px 5px;color:#53617a;font-size:7px;overflow-wrap:anywhere}
        .invoice-xslt-qr-caption{margin-top:3px;color:#6a7588;font-size:7px;font-weight:700;letter-spacing:.35px;text-transform:uppercase}.invoice-xslt-meta{display:grid;grid-template-columns:repeat(4,1fr);margin:11px 0;overflow:hidden;border:1px solid #dbe2ec;border-radius:10px}
        .invoice-xslt-meta-item{min-height:46px;padding:8px 10px;border-right:1px solid #e7ecf2;border-bottom:1px solid #e7ecf2}.invoice-xslt-meta-item:nth-child(4n){border-right:0}.invoice-xslt-meta-item:nth-last-child(-n+4){border-bottom:0}
        .invoice-xslt-meta-label{color:#6a7588;font-size:8px;font-weight:700;letter-spacing:.5px;text-transform:uppercase}.invoice-xslt-meta-value{margin-top:4px;color:#14213d;font-weight:700;overflow-wrap:anywhere}
        .invoice-xslt-parties{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0}.invoice-xslt-party-card{min-height:126px;border:1px solid #dbe2ec;border-radius:10px;padding:11px 13px}.invoice-xslt-kicker{margin-bottom:5px;color:#f37021;font-size:8.5px;font-weight:800;letter-spacing:.7px;text-transform:uppercase}
        .invoice-xslt-party-name{margin-bottom:7px;color:#173763;font-size:12.5px;font-weight:800}.invoice-xslt-party-lines{color:#38455c;line-height:1.55}.invoice-xslt-operation{margin:10px 0;border-left:4px solid #f37021;border-radius:0 9px 9px 0;padding:10px 12px;background:#f7f9fc}
        .invoice-xslt-operation-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px 15px;margin-top:7px}.invoice-xslt-operation-label{color:#6a7588;font-size:8px;font-weight:700;text-transform:uppercase}.invoice-xslt-operation-value{margin-top:3px;font-weight:700;overflow-wrap:anywhere}
        .invoice-xslt-page table{width:100%;border-collapse:collapse}.invoice-xslt-lines{margin-top:10px;overflow:hidden;border:1px solid #dbe2ec;border-radius:9px}.invoice-xslt-lines table{table-layout:fixed}.invoice-xslt-page th{padding:7px 5px;background:#173763;color:#fff;font-size:8px;letter-spacing:.35px;text-align:left;text-transform:uppercase}
        .invoice-xslt-page td{padding:7px 5px;border-bottom:1px solid #e7ecf2;vertical-align:top}.invoice-xslt-page tbody tr:nth-child(even){background:#fafbfd}.invoice-xslt-lines th{padding:7px 3px;font-size:7.2px}.invoice-xslt-lines td{padding:7px 3px}.invoice-xslt-lines td.invoice-xslt-num{font-size:7.4px;letter-spacing:-.12px}
        .invoice-xslt-num{text-align:right!important;white-space:nowrap}.invoice-xslt-center{text-align:center!important}.invoice-xslt-strong{font-weight:700}.invoice-xslt-item-name{color:#173763;font-weight:700}.invoice-xslt-item-desc{margin-top:3px;color:#697489;font-size:8.5px;line-height:1.35;white-space:pre-line}.invoice-xslt-empty{padding:24px!important;color:#697489;text-align:center}
        .invoice-xslt-summary{display:grid;grid-template-columns:1.15fr .85fr;align-items:start;gap:12px;margin-top:11px}.invoice-xslt-info-card{margin-bottom:9px;border:1px solid #dbe2ec;border-radius:9px;padding:10px 12px}.invoice-xslt-info-title{margin-bottom:7px;color:#173763;font-size:10px;font-weight:800}.invoice-xslt-notes{color:#455168;line-height:1.5;white-space:pre-line;overflow-wrap:anywhere}
        .invoice-xslt-tax-table th{background:#eef2f7;color:#263650}.invoice-xslt-tax-table td{padding:5px 4px;font-size:8.5px}.invoice-xslt-bank-account{margin-top:7px;padding-top:7px;border-top:1px solid #e7ecf2}.invoice-xslt-totals{overflow:hidden;border:1px solid #dbe2ec;border-radius:9px}.invoice-xslt-total-row{display:flex;justify-content:space-between;gap:12px;padding:7px 11px;border-bottom:1px solid #e7ecf2}
        .invoice-xslt-total-row:last-child{border-bottom:0}.invoice-xslt-total-row strong{color:#173763}.invoice-xslt-grand{padding:10px 11px;background:#173763;color:#fff;font-size:12px;font-weight:800}.invoice-xslt-grand strong{color:#fff}.invoice-xslt-archive-note{margin-top:9px;border:1px solid #fed8bd;border-radius:8px;padding:8px 10px;background:#fff7f0;color:#9b451b;font-weight:700}
        .invoice-xslt-footer{display:grid;grid-template-columns:1fr auto;gap:12px;margin-top:12px;border-top:2px solid #173763;padding-top:8px;color:#5e697d;font-size:8.5px;line-height:1.5}.invoice-xslt-footer strong{color:#173763}.invoice-xslt-electronic{text-align:right}.invoice-xslt-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:12px;margin-top:18px}
        .invoice-xslt-actions a,.invoice-xslt-actions button{display:inline-flex;align-items:center;gap:8px;border:1px solid #cbd5e1;border-radius:7px;padding:8px 14px;background:#fff;color:#334155;font-size:13px;font-weight:600}.invoice-xslt-actions button{border-color:#173763;background:#173763;color:#fff}.invoice-xslt-actions svg{width:16px;height:16px}
        @page { size: A4; margin: 0; }
        @media print{body *{visibility:hidden!important}#invoice-template,#invoice-template *{visibility:visible!important}#invoice-template{position:absolute!important;inset:0 auto auto 0!important;width:210mm!important;max-width:none!important;min-width:0!important;min-height:0!important;margin:0!important;padding:9mm!important;box-shadow:none!important}.invoice-xslt-lines,.invoice-xslt-summary,.invoice-xslt-info-card,.invoice-xslt-totals,.invoice-xslt-archive-note,.invoice-xslt-footer{break-inside: avoid}.invoice-actions{display:none!important}}
      `}</style>
    </>
  );
}
