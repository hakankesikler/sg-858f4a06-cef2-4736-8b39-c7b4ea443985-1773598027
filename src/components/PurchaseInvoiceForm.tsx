import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2, Save, X } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface InvoiceItem {
  id: string;
  productCode: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  taxRate: number;
  discountAmount: number;
}

interface PurchaseInvoiceFormProps {
  onClose?: () => void;
  onSave?: (data: any) => void;
}

export function PurchaseInvoiceForm({ onClose, onSave }: PurchaseInvoiceFormProps) {
  const [invoiceDate, setInvoiceDate] = useState<Date>(new Date());
  const [dueDate, setDueDate] = useState<Date>(new Date());
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: "1",
      productCode: "",
      description: "",
      quantity: 1,
      unit: "Adet",
      unitPrice: 0,
      taxRate: 20,
      discountAmount: 0
    }
  ]);

  // Form states
  const [invoiceNo, setInvoiceNo] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierTaxId, setSupplierTaxId] = useState("");
  const [supplierTaxOffice, setSupplierTaxOffice] = useState("");
  const [supplierAddress, setSupplierAddress] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [supplierEmail, setSupplierEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Havale");
  const [paymentStatus, setPaymentStatus] = useState("Bekliyor");
  const [generalDiscount, setGeneralDiscount] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [notes, setNotes] = useState("");

  const addItem = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        productCode: "",
        description: "",
        quantity: 1,
        unit: "Adet",
        unitPrice: 0,
        taxRate: 20,
        discountAmount: 0
      }
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const calculateItemTotal = (item: InvoiceItem) => {
    const subtotal = item.quantity * item.unitPrice;
    const taxAmount = (subtotal * item.taxRate) / 100;
    const total = subtotal + taxAmount - item.discountAmount;
    return {
      subtotal,
      taxAmount,
      total
    };
  };

  const calculateGrandTotal = () => {
    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    items.forEach(item => {
      const itemCalc = calculateItemTotal(item);
      subtotal += itemCalc.subtotal;
      totalTax += itemCalc.taxAmount;
      totalDiscount += item.discountAmount;
    });

    const grandTotal = subtotal + totalTax - generalDiscount - totalDiscount + shippingCost;

    return {
      subtotal,
      totalTax,
      totalDiscount,
      grandTotal
    };
  };

  const totals = calculateGrandTotal();

  const handleSave = () => {
    const formData = {
      invoiceNo,
      invoiceDate,
      dueDate,
      supplierName,
      supplierTaxId,
      supplierTaxOffice,
      supplierAddress,
      supplierPhone,
      supplierEmail,
      paymentMethod,
      paymentStatus,
      generalDiscount,
      shippingCost,
      notes,
      items,
      ...totals
    };

    onSave?.(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto p-4">
      <Card className="w-full max-w-7xl bg-white my-8">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Yeni Alış Faturası</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Fatura Bilgileri ve Tedarikçi Bilgileri */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fatura Bilgileri */}
            <Card className="p-6 bg-blue-50 border-blue-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Fatura Bilgileri</h3>
              <div className="space-y-4">
                <div>
                  <Label>Fatura No *</Label>
                  <Input 
                    placeholder="AL-2024-001" 
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Fatura Tarihi *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(invoiceDate, "dd.MM.yyyy", { locale: tr })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={invoiceDate}
                          onSelect={(date) => date && setInvoiceDate(date)}
                          locale={tr}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label>Vade Tarihi *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(dueDate, "dd.MM.yyyy", { locale: tr })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dueDate}
                          onSelect={(date) => date && setDueDate(date)}
                          locale={tr}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Ödeme Yöntemi</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Nakit">Nakit</SelectItem>
                        <SelectItem value="Kredi Kartı">Kredi Kartı</SelectItem>
                        <SelectItem value="Havale">Havale/EFT</SelectItem>
                        <SelectItem value="Çek">Çek</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Durum</Label>
                    <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bekliyor">Bekliyor</SelectItem>
                        <SelectItem value="Ödendi">Ödendi</SelectItem>
                        <SelectItem value="Gecikmiş">Gecikmiş</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </Card>

            {/* Tedarikçi Bilgileri */}
            <Card className="p-6 bg-red-50 border-red-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Tedarikçi Bilgileri</h3>
              <div className="space-y-4">
                <div>
                  <Label>Tedarikçi Adı / Ünvan *</Label>
                  <Input 
                    placeholder="ABC Tedarik A.Ş." 
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>VKN / TCKN *</Label>
                    <Input 
                      placeholder="1234567890" 
                      value={supplierTaxId}
                      onChange={(e) => setSupplierTaxId(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Vergi Dairesi</Label>
                    <Input 
                      placeholder="Kadıköy" 
                      value={supplierTaxOffice}
                      onChange={(e) => setSupplierTaxOffice(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label>Adres</Label>
                  <Textarea 
                    placeholder="Tedarikçi adresi..."
                    rows={2}
                    value={supplierAddress}
                    onChange={(e) => setSupplierAddress(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Telefon</Label>
                    <Input 
                      placeholder="0532 XXX XX XX" 
                      value={supplierPhone}
                      onChange={(e) => setSupplierPhone(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>E-posta</Label>
                    <Input 
                      type="email"
                      placeholder="tedarikci@firma.com" 
                      value={supplierEmail}
                      onChange={(e) => setSupplierEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Fatura Kalemleri */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Fatura Kalemleri</h3>
              <Button onClick={addItem} size="sm" className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Satır Ekle
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-700 uppercase w-32">
                      Ürün/Hizmet Kodu
                    </th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Açıklama *
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-700 uppercase w-24">
                      Miktar *
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-700 uppercase w-24">
                      Birim
                    </th>
                    <th className="px-2 py-3 text-right text-xs font-medium text-gray-700 uppercase w-32">
                      Birim Fiyat *
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-700 uppercase w-24">
                      KDV %
                    </th>
                    <th className="px-2 py-3 text-right text-xs font-medium text-gray-700 uppercase w-32">
                      KDV Tutarı
                    </th>
                    <th className="px-2 py-3 text-right text-xs font-medium text-gray-700 uppercase w-32">
                      İskonto
                    </th>
                    <th className="px-2 py-3 text-right text-xs font-medium text-gray-700 uppercase w-32">
                      Toplam
                    </th>
                    <th className="px-2 py-3 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item, index) => {
                    const itemTotal = calculateItemTotal(item);
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-2 py-3">
                          <Input
                            placeholder="URN-001"
                            value={item.productCode}
                            onChange={(e) => updateItem(item.id, "productCode", e.target.value)}
                            className="text-sm"
                          />
                        </td>
                        <td className="px-2 py-3">
                          <Input
                            placeholder="Ürün/Hizmet açıklaması"
                            value={item.description}
                            onChange={(e) => updateItem(item.id, "description", e.target.value)}
                            className="text-sm"
                          />
                        </td>
                        <td className="px-2 py-3">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                            className="text-sm text-center"
                          />
                        </td>
                        <td className="px-2 py-3">
                          <Select 
                            value={item.unit} 
                            onValueChange={(value) => updateItem(item.id, "unit", value)}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Adet">Adet</SelectItem>
                              <SelectItem value="Kg">Kg</SelectItem>
                              <SelectItem value="Lt">Lt</SelectItem>
                              <SelectItem value="M">M</SelectItem>
                              <SelectItem value="M²">M²</SelectItem>
                              <SelectItem value="M³">M³</SelectItem>
                              <SelectItem value="Saat">Saat</SelectItem>
                              <SelectItem value="Gün">Gün</SelectItem>
                              <SelectItem value="Kutu">Kutu</SelectItem>
                              <SelectItem value="Paket">Paket</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-2 py-3">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                            className="text-sm text-right"
                          />
                        </td>
                        <td className="px-2 py-3">
                          <Select 
                            value={item.taxRate.toString()} 
                            onValueChange={(value) => updateItem(item.id, "taxRate", parseFloat(value))}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">%0</SelectItem>
                              <SelectItem value="1">%1</SelectItem>
                              <SelectItem value="10">%10</SelectItem>
                              <SelectItem value="20">%20</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-2 py-3 text-right text-sm text-gray-900">
                          ₺{itemTotal.taxAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-2 py-3">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.discountAmount}
                            onChange={(e) => updateItem(item.id, "discountAmount", parseFloat(e.target.value) || 0)}
                            className="text-sm text-right"
                          />
                        </td>
                        <td className="px-2 py-3 text-right font-bold text-gray-900">
                          ₺{itemTotal.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-2 py-3 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            disabled={items.length === 1}
                            className="hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Toplam Hesaplamalar ve Notlar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Notlar */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Notlar ve Ek Bilgiler</h3>
              <div className="space-y-4">
                <div>
                  <Label>Fatura Notu</Label>
                  <Textarea 
                    placeholder="Fatura ile ilgili notlarınızı buraya yazabilirsiniz..."
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Genel İskonto (₺)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={generalDiscount}
                      onChange={(e) => setGeneralDiscount(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>Kargo/Nakliye Ücreti (₺)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={shippingCost}
                      onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Toplam Hesaplamalar */}
            <Card className="p-6 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Fatura Özeti</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-300">
                  <span className="text-sm text-gray-600">Ara Toplam:</span>
                  <span className="text-lg font-medium text-gray-900">
                    ₺{totals.subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-300">
                  <span className="text-sm text-gray-600">Toplam KDV:</span>
                  <span className="text-lg font-medium text-gray-900">
                    ₺{totals.totalTax.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {totals.totalDiscount > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-300">
                    <span className="text-sm text-gray-600">Satır İskontoları:</span>
                    <span className="text-lg font-medium text-red-600">
                      -₺{totals.totalDiscount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {generalDiscount > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-300">
                    <span className="text-sm text-gray-600">Genel İskonto:</span>
                    <span className="text-lg font-medium text-red-600">
                      -₺{generalDiscount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {shippingCost > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-300">
                    <span className="text-sm text-gray-600">Kargo/Nakliye:</span>
                    <span className="text-lg font-medium text-green-600">
                      +₺{shippingCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center py-3 border-t-2 border-gray-400">
                  <span className="text-lg font-bold text-gray-900">GENEL TOPLAM:</span>
                  <span className="text-2xl font-bold text-red-600">
                    ₺{totals.grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              İptal
            </Button>
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4 mr-2" />
              Faturayı Kaydet
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}