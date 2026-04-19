import React from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface InvoiceItem {
  description: string;
  lineDescription: string;
  quantity: number;
  unitPrice: number;
  total: number;
  vatRate: number;
  vatAmount: number;
}

interface InvoiceData {
  invoiceNo: string;
  invoiceDate: string;
  scenario: string;
  invoiceType: string;
  createdAt: string;
  ettn?: string;
  customerName: string;
  customerPhone?: string;
  customerWebsite?: string;
  customerEmail?: string;
  customerTaxOffice?: string;
  customerTaxNumber?: string;
  items: InvoiceItem[];
  subtotal: number;
  vatBase: number;
  vatAmount: number;
  grandTotal: number;
  currency: string;
  notes?: string;
}

interface InvoiceTemplateProps {
  data: InvoiceData;
}

export function InvoiceTemplate({ data }: InvoiceTemplateProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd.MM.yyyy", { locale: tr });
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), "dd.MM.yyyy HH:mm:ss", { locale: tr });
  };

  return (
    <div className="bg-white p-8 max-w-[210mm] mx-auto" id="invoice-template">
      {/* HEADER */}
      <div className="grid grid-cols-3 gap-4 mb-8 pb-6 border-b-2 border-gray-300">
        {/* Left - Company Info */}
        <div className="text-sm space-y-1">
          <h1 className="font-bold text-base mb-2">
            REX LOJİSTİK TAŞIMACILIK DEPOLAMA
            <br />
            DANIŞMANLIK LİMİTED ŞİRKET
          </h1>
          <p>Folkart Towers A Kule No:47/B K:26 D:2601</p>
          <p>Adalet Mahallesi Manas Bulvarı 35530</p>
          <p>Bayraklı / İzmir / Türkiye</p>
          <p>Tel: +905434010755</p>
          <p>Web: www.rexlojistik.com</p>
          <p>e-Posta: info@rexlojistik.com</p>
          <p className="font-semibold mt-2">Vergi Dairesi: KARŞIYAKA VERGİ DAİRESİ</p>
          <p>VKN: 7342549288</p>
          <p>MERSİS No: 0734259288000001</p>
        </div>

        {/* Center - e-Fatura Badge & Stamp */}
        <div className="flex flex-col items-center justify-start space-y-4">
          <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-3xl">e</span>
          </div>
          <div className="text-center text-xs">
            <p className="font-semibold">e-Fatura</p>
          </div>
          <div className="border-2 border-gray-800 p-2 text-xs text-center max-w-[180px]">
            <p className="font-bold">REX LOJİSTİK TAŞIMACILIK DEPOLAMA</p>
            <p className="font-bold">DANIŞMANLIK LİMİTED ŞİRKET</p>
            <p className="mt-1">Folkart Towers A Kule No:47/B K:26 D:2601</p>
            <p>Adalet Mahallesi Manas Bulvarı 35530</p>
            <p>Bayraklı / İzmir / Türkiye</p>
            <p className="mt-1 font-semibold">Karşıyaka VD:7342549288</p>
          </div>
        </div>

        {/* Right - QR Code & Logo */}
        <div className="flex flex-col items-end space-y-4">
          <div className="w-32 h-32 bg-gray-200 flex items-center justify-center text-xs text-gray-500">
            QR KOD
          </div>
          <div className="w-40 h-40 bg-[#1e3a8a] rounded-full flex items-center justify-center">
            <div className="text-white text-center">
              <div className="text-2xl font-bold tracking-wider">REX LOJİSTİK</div>
              <div className="grid grid-cols-2 gap-1 mt-2 text-xs">
                <span>✈️</span>
                <span>🚢</span>
                <span>🚛</span>
                <span>👷</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CUSTOMER INFO & INVOICE DETAILS */}
      <div className="grid grid-cols-2 gap-8 mb-6">
        {/* Left - Customer Info */}
        <div className="space-y-1 text-sm">
          <h2 className="font-bold text-base mb-2">SAYIN</h2>
          <p className="font-semibold text-lg">{data.customerName}</p>
          {data.customerPhone && <p>Tel: {data.customerPhone}</p>}
          {data.customerWebsite && <p>Web Sitesi: {data.customerWebsite}</p>}
          {data.customerEmail && <p>e-Posta: {data.customerEmail}</p>}
          {data.customerTaxOffice && <p>Vergi Dairesi: {data.customerTaxOffice}</p>}
          {data.customerTaxNumber && <p>VKN: {data.customerTaxNumber}</p>}
          {data.ettn && <p className="mt-2">ETTN: {data.ettn}</p>}
        </div>

        {/* Right - Invoice Details Table */}
        <div>
          <table className="w-full border border-gray-300 text-sm">
            <tbody>
              <tr className="border-b border-gray-300">
                <td className="p-2 font-semibold bg-gray-50 w-1/2">Tarih:</td>
                <td className="p-2">{formatDate(data.invoiceDate)}</td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="p-2 font-semibold bg-gray-50">Fatura No:</td>
                <td className="p-2">{data.invoiceNo}</td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="p-2 font-semibold bg-gray-50">Özelleştirme No:</td>
                <td className="p-2">-</td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="p-2 font-semibold bg-gray-50">Senaryo:</td>
                <td className="p-2">{data.scenario}</td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="p-2 font-semibold bg-gray-50">Fatura Tipi:</td>
                <td className="p-2">{data.invoiceType}</td>
              </tr>
              <tr>
                <td className="p-2 font-semibold bg-gray-50">Oluşma Zamanı:</td>
                <td className="p-2">{formatDateTime(data.createdAt)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ITEMS TABLE */}
      <div className="mb-6">
        <table className="w-full border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              <th className="p-2 text-left border-r border-gray-300 w-12">Sıra No</th>
              <th className="p-2 text-left border-r border-gray-300">Mal Hizmet</th>
              <th className="p-2 text-left border-r border-gray-300">Satır Açıklaması</th>
              <th className="p-2 text-right border-r border-gray-300 w-20">Miktar</th>
              <th className="p-2 text-right border-r border-gray-300 w-24">Birim Fiyat</th>
              <th className="p-2 text-right border-r border-gray-300 w-28">Mal Hizmet Tutarı</th>
              <th className="p-2 text-right border-r border-gray-300 w-20">KDV Oranı</th>
              <th className="p-2 text-right w-28">KDV Tutarı</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, index) => (
              <tr key={index} className="border-b border-gray-300">
                <td className="p-2 text-center border-r border-gray-300">{index + 1}</td>
                <td className="p-2 border-r border-gray-300">{item.description}</td>
                <td className="p-2 border-r border-gray-300">{item.lineDescription}</td>
                <td className="p-2 text-right border-r border-gray-300">{item.quantity}</td>
                <td className="p-2 text-right border-r border-gray-300">
                  {formatCurrency(item.unitPrice)} {data.currency}
                </td>
                <td className="p-2 text-right border-r border-gray-300">
                  {formatCurrency(item.total)} {data.currency}
                </td>
                <td className="p-2 text-right border-r border-gray-300">%{item.vatRate}</td>
                <td className="p-2 text-right">
                  {formatCurrency(item.vatAmount)} {data.currency}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SUMMARY */}
      <div className="flex justify-end mb-8">
        <div className="w-80">
          <table className="w-full border border-gray-300 text-sm">
            <tbody>
              <tr className="border-b border-gray-300">
                <td className="p-2 font-semibold bg-gray-50">Mal Hizmet Toplam Tutarı:</td>
                <td className="p-2 text-right">
                  {formatCurrency(data.subtotal)} {data.currency}
                </td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="p-2 font-semibold bg-gray-50">KDV Matrahı (%20):</td>
                <td className="p-2 text-right">
                  {formatCurrency(data.vatBase)} {data.currency}
                </td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="p-2 font-semibold bg-gray-50">Vergi Hariç Tutar:</td>
                <td className="p-2 text-right">
                  {formatCurrency(data.vatBase)} {data.currency}
                </td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="p-2 font-semibold bg-gray-50">Hesaplanan KDV (%20):</td>
                <td className="p-2 text-right">
                  {formatCurrency(data.vatAmount)} {data.currency}
                </td>
              </tr>
              <tr className="border-b border-gray-300">
                <td className="p-2 font-semibold bg-gray-50">Vergiler Dahil Toplam Tutar:</td>
                <td className="p-2 text-right">
                  {formatCurrency(data.grandTotal)} {data.currency}
                </td>
              </tr>
              <tr>
                <td className="p-2 font-bold bg-blue-900 text-white">Ödenecek Tutar:</td>
                <td className="p-2 text-right font-bold bg-blue-900 text-white">
                  {formatCurrency(data.grandTotal)} {data.currency}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTER NOTES */}
      <div className="text-xs space-y-1 border-t pt-4">
        <p>
          * * Taşıma İşleri Organizatörlüğü Belge Numarası : İZM.U-NET.TİO.35.6323
        </p>
        <p>
          * * Taşımalarınız Rex Lojistik güvencesinde ve sigortalıdır.
        </p>
        <p>* * İrsaliye yerine geçmektedir.</p>
        <p>
          * * Faturaya 8 gün içerisinde itiraz edilmezse kabul edilmiş sayılır.
        </p>
        <p>
          * * BU FATURA MUHTEVİYATI ALT YÜKLEMECİLER İLE YAPILDIĞINDAN DOLAYI, KDV G.U.T
          (I/C-2.1.3.11.2.) KANUN GEREĞİ TEVKİFAT UYGULANMAMIŞTIR
        </p>
        <p>* * Banka Bilgilerimiz :</p>
        <p>* * REX LOJİSTİK TAŞIMACILIK DEPOLAMA DANIŞMANLIK LİMİTED ŞİRKETİ</p>
        <p>* * TR24 0001 5001 5800 7355 9235 06</p>
        <p>* Yalınızca,</p>
        <p>* Sicil Numarası: 240976, İşletme Merkezi: İzmir</p>
      </div>

      {/* PRINT/DOWNLOAD BUTTONS */}
      <div className="mt-8 flex gap-4 justify-end print:hidden">
        <button
          onClick={() => window.print()}
          className="px-6 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors"
        >
          🖨️ Yazdır
        </button>
      </div>
    </div>
  );
}