import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, X, Plus, Trash2, Receipt, DollarSign } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ExpenseFormProps {
  onClose: () => void;
  onSave: (data: any) => void;
}

interface ExpenseItem {
  id: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  unit_price: number;
  vat_rate: number;
  vat_amount: number;
  discount: number;
  total: number;
}

export function ExpenseForm({ onClose, onSave }: ExpenseFormProps) {
  const [formData, setFormData] = useState({
    expense_no: `GD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    expense_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    payment_method: "Havale",
    status: "Bekliyor",
    supplier_name: "",
    supplier_tax_id: "",
    supplier_tax_office: "",
    supplier_address: "",
    supplier_phone: "",
    supplier_email: "",
    notes: "",
    general_discount: 0,
    shipping_cost: 0,
  });

  const [items, setItems] = useState<ExpenseItem[]>([
    {
      id: crypto.randomUUID(),
      description: "",
      category: "Genel Gider",
      quantity: 1,
      unit: "Adet",
      unit_price: 0,
      vat_rate: 20,
      vat_amount: 0,
      discount: 0,
      total: 0,
    },
  ]);

  const categories = [
    "Genel Gider",
    "Kira",
    "Elektrik",
    "Su",
    "Doğalgaz",
    "Telefon",
    "İnternet",
    "Kırtasiye",
    "Temizlik",
    "Yemek",
    "Ulaşım",
    "Yakıt",
    "Bakım-Onarım",
    "Sigorta",
    "Vergi",
    "Personel Giderleri",
    "Pazarlama",
    "Reklam",
    "Danışmanlık",
    "Hukuki Giderler",
    "Banka Masrafları",
    "Diğer",
  ];

  const units = [
    "Adet",
    "Kg",
    "Lt",
    "M",
    "M²",
    "M³",
    "Saat",
    "Gün",
    "Ay",
    "Yıl",
    "Kutu",
    "Paket",
  ];

  const calculateItemTotal = (item: ExpenseItem) => {
    const subtotal = item.quantity * item.unit_price;
    const vatAmount = (subtotal * item.vat_rate) / 100;
    const total = subtotal + vatAmount - item.discount;
    return {
      subtotal,
      vatAmount,
      total: Math.max(0, total),
    };
  };

  const updateItem = (id: string, field: keyof ExpenseItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        const calc = calculateItemTotal(updatedItem);
        return {
          ...updatedItem,
          vat_amount: calc.vatAmount,
          total: calc.total,
        };
      }
      return item;
    }));
  };

  const addItem = () => {
    setItems([...items, {
      id: crypto.randomUUID(),
      description: "",
      category: "Genel Gider",
      quantity: 1,
      unit: "Adet",
      unit_price: 0,
      vat_rate: 20,
      vat_amount: 0,
      discount: 0,
      total: 0,
    }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const calculateSummary = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const totalVat = items.reduce((sum, item) => sum + item.vat_amount, 0);
    const totalItemDiscount = items.reduce((sum, item) => sum + item.discount, 0);
    const generalDiscount = Number(formData.general_discount) || 0;
    const shippingCost = Number(formData.shipping_cost) || 0;
    const grandTotal = subtotal + totalVat - totalItemDiscount - generalDiscount + shippingCost;

    return {
      subtotal,
      totalVat,
      totalItemDiscount,
      generalDiscount,
      shippingCost,
      grandTotal: Math.max(0, grandTotal),
    };
  };

  const summary = calculateSummary();

  const handleSave = () => {
    const expenseData = {
      ...formData,
      items,
      summary,
    };
    onSave(expenseData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-7xl bg-white my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Receipt className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Yeni Genel Gider</h2>
              <p className="text-sm text-gray-500">Gider bilgilerini eksiksiz doldurun</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Gider & Tedarikçi Bilgileri - 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gider Bilgileri - Orange Card */}
            <Card className="p-6 bg-orange-50 border-orange-200 space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-orange-600" />
                Gider Bilgileri
              </h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="expense_no">Gider No *</Label>
                  <Input
                    id="expense_no"
                    value={formData.expense_no}
                    onChange={(e) => setFormData({ ...formData, expense_no: e.target.value })}
                    className="bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expense_date">Gider Tarihi *</Label>
                    <div className="relative">
                      <Input
                        id="expense_date"
                        type="date"
                        value={formData.expense_date}
                        onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                        className="bg-white"
                      />
                      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="due_date">Vade Tarihi *</Label>
                    <div className="relative">
                      <Input
                        id="due_date"
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                        className="bg-white"
                      />
                      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="payment_method">Ödeme Yöntemi</Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                  >
                    <SelectTrigger className="bg-white">
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
                  <Label htmlFor="status">Durum</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className="bg-white">
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
            </Card>

            {/* Tedarikçi/Cari Bilgileri - Purple Card */}
            <Card className="p-6 bg-purple-50 border-purple-200 space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-purple-600" />
                Tedarikçi/Cari Bilgileri
              </h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="supplier_name">Tedarikçi Adı/Ünvan *</Label>
                  <Input
                    id="supplier_name"
                    placeholder="Firma veya şahıs adı"
                    value={formData.supplier_name}
                    onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                    className="bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="supplier_tax_id">VKN/TCKN</Label>
                    <Input
                      id="supplier_tax_id"
                      placeholder="1234567890"
                      value={formData.supplier_tax_id}
                      onChange={(e) => setFormData({ ...formData, supplier_tax_id: e.target.value })}
                      className="bg-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="supplier_tax_office">Vergi Dairesi</Label>
                    <Input
                      id="supplier_tax_office"
                      placeholder="Kadıköy"
                      value={formData.supplier_tax_office}
                      onChange={(e) => setFormData({ ...formData, supplier_tax_office: e.target.value })}
                      className="bg-white"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="supplier_address">Adres</Label>
                  <Textarea
                    id="supplier_address"
                    placeholder="Tam adres..."
                    value={formData.supplier_address}
                    onChange={(e) => setFormData({ ...formData, supplier_address: e.target.value })}
                    className="bg-white resize-none"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="supplier_phone">Telefon</Label>
                    <Input
                      id="supplier_phone"
                      placeholder="0216 XXX XX XX"
                      value={formData.supplier_phone}
                      onChange={(e) => setFormData({ ...formData, supplier_phone: e.target.value })}
                      className="bg-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="supplier_email">E-posta</Label>
                    <Input
                      id="supplier_email"
                      type="email"
                      placeholder="info@firma.com"
                      value={formData.supplier_email}
                      onChange={(e) => setFormData({ ...formData, supplier_email: e.target.value })}
                      className="bg-white"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Gider Kalemleri */}
          <Card className="overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Gider Kalemleri</h3>
              <Button
                onClick={addItem}
                size="sm"
                className="bg-green-600 hover:bg-green-700 gap-2"
              >
                <Plus className="w-4 h-4" />
                Satır Ekle
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">
                      Kategori *
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Açıklama *
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">
                      Miktar
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">
                      Birim
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-32">
                      Birim Fiyat (₺)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">
                      KDV %
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-32">
                      KDV Tutarı
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-32">
                      İskonto (₺)
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-32">
                      Toplam
                    </th>
                    <th className="px-4 py-3 w-12"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <Select
                          value={item.category}
                          onValueChange={(value) => updateItem(item.id, 'category', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          placeholder="Detaylı açıklama..."
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          className="text-center"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={item.unit}
                          onValueChange={(value) => updateItem(item.id, 'unit', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {units.map((unit) => (
                              <SelectItem key={unit} value={unit}>
                                {unit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="text-right"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={item.vat_rate.toString()}
                          onValueChange={(value) => updateItem(item.id, 'vat_rate', parseFloat(value))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0%</SelectItem>
                            <SelectItem value="1">1%</SelectItem>
                            <SelectItem value="10">10%</SelectItem>
                            <SelectItem value="20">20%</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900">
                        ₺{item.vat_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.discount}
                          onChange={(e) => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                          className="text-right"
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        ₺{item.total.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
                          className="hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Alt Bilgiler ve Özet - 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Notlar ve Ekstra Giderler */}
            <div className="space-y-4">
              <Card className="p-6">
                <Label htmlFor="notes">Notlar</Label>
                <Textarea
                  id="notes"
                  placeholder="Ek bilgiler, açıklamalar..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="resize-none"
                />
              </Card>

              <Card className="p-6 space-y-4">
                <div>
                  <Label htmlFor="general_discount">Genel İskonto (₺)</Label>
                  <Input
                    id="general_discount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.general_discount}
                    onChange={(e) => setFormData({ ...formData, general_discount: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="shipping_cost">Kargo/Nakliye Ücreti (₺)</Label>
                  <Input
                    id="shipping_cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.shipping_cost}
                    onChange={(e) => setFormData({ ...formData, shipping_cost: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
              </Card>
            </div>

            {/* Gider Özeti */}
            <Card className="p-6 bg-gray-50 border-gray-300">
              <h3 className="font-semibold text-gray-900 mb-4">Gider Özeti</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Ara Toplam:</span>
                  <span className="font-medium text-gray-900">
                    ₺{summary.subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Toplam KDV:</span>
                  <span className="font-medium text-gray-900">
                    ₺{summary.totalVat.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                {summary.totalItemDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Satır İskontoları:</span>
                    <span className="font-medium text-red-600">
                      -₺{summary.totalItemDiscount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {summary.generalDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Genel İskonto:</span>
                    <span className="font-medium text-red-600">
                      -₺{summary.generalDiscount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {summary.shippingCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Kargo/Nakliye:</span>
                    <span className="font-medium text-green-600">
                      +₺{summary.shippingCost.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="pt-3 border-t border-gray-300">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">GENEL TOPLAM:</span>
                    <span className="text-2xl font-bold text-orange-600">
                      ₺{summary.grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <Button
            variant="outline"
            onClick={onClose}
            className="gap-2"
          >
            <X className="w-4 h-4" />
            İptal
          </Button>
          <Button
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-700 gap-2"
          >
            <Receipt className="w-4 h-4" />
            Gideri Kaydet
          </Button>
        </div>
      </Card>
    </div>
  );
}