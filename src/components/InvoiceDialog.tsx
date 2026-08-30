import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { X, Plus, Trash2, Loader2 } from "lucide-react";
import { invoiceIntegrationService, type InvoiceDocumentType } from "@/services/invoiceIntegrationService";
import {
  invoicePresentationService,
  type InvoiceBankAccount,
  type InvoiceCategory,
  type InvoiceNoteTemplate,
} from "@/services/invoicePresentationService";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  subtotal: number;
  vatAmount: number;
  total: number;
  withholdingCode?: string;
  withholdingValue?: number;
  exemptionCode?: string;
}

interface InvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedCustomer?: any;
  shipment?: any;
  onSuccess?: () => void;
}

const defaultNotes = `Taşıma İşleri Organizatörlüğü Belge No: İZM.U-NET.TİO.35.6323
Hizmetin kapsamı fatura kaleminde ve ilgili iş referansında belirtilmiştir.`;

const categoryLabels: Record<InvoiceCategory, string> = {
  domestic_transport: "Yurtiçi taşıma",
  international_transport: "Uluslararası taşıma",
  exempt_transport: "KDV istisnalı taşıma",
  withholding_transport: "Tevkifatlı taşıma",
  other: "Diğer hizmet",
};

const inferCategory = (shipment?: any): InvoiceCategory => {
  const text = [shipment?.service_type, shipment?.transport_type, shipment?.origin_country, shipment?.destination_country, shipment?.description]
    .filter(Boolean).join(" ").toLocaleLowerCase("tr-TR");
  if (text.includes("uluslararası") || text.includes("international") || text.includes("ihracat") || text.includes("ithalat")) return "international_transport";
  return "domestic_transport";
};

const renderTemplate = (value: string, shipment?: any) => {
  const replacements: Record<string, string> = {
    shipment_code: shipment?.shipment_code || shipment?.tracking_number || "Sevkiyat",
    origin: shipment?.origin || shipment?.pickup_address || "Çıkış noktası",
    destination: shipment?.destination || shipment?.delivery_address || "Varış noktası",
    tracking_number: shipment?.tracking_number || shipment?.shipment_code || "-",
    service_type: shipment?.service_type || shipment?.transport_type || "Taşıma",
  };
  return Object.entries(replacements).reduce(
    (result, [key, replacement]) => result.replace(new RegExp(`{{${key}}}`, "g"), replacement),
    value,
  );
};

export function InvoiceDialog({ isOpen, onClose, preSelectedCustomer, shipment, onSuccess }: InvoiceDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>(preSelectedCustomer?.id || "");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [currency, setCurrency] = useState("TRY");
  const [paymentStatus, setPaymentStatus] = useState("Bekliyor");
  const [documentType, setDocumentType] = useState<InvoiceDocumentType>("e_archive");
  const [documentScenario, setDocumentScenario] = useState<"EARSIVFATURA" | "TEMELFATURA" | "TICARIFATURA" | "KAMU">("EARSIVFATURA");
  const [exchangeRate, setExchangeRate] = useState("1");
  const [notes, setNotes] = useState(defaultNotes);
  const [invoiceCategory, setInvoiceCategory] = useState<InvoiceCategory>("domestic_transport");
  const [noteTemplates, setNoteTemplates] = useState<InvoiceNoteTemplate[]>([]);
  const [noteTemplateId, setNoteTemplateId] = useState("");
  const [bankAccounts, setBankAccounts] = useState<InvoiceBankAccount[]>([]);
  const [selectedBankAccountIds, setSelectedBankAccountIds] = useState<string[]>([]);
  const [includeBankDetails, setIncludeBankDetails] = useState(true);
  
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: "1",
      description: "Taşıma Hizmeti",
      quantity: 1,
      unitPrice: 0,
      vatRate: 20,
      subtotal: 0,
      vatAmount: 0,
      total: 0,
    },
  ]);

  const applyNoteTemplate = (template: InvoiceNoteTemplate) => {
    setInvoiceCategory(template.category);
    setNoteTemplateId(template.id);
    setNotes(renderTemplate(template.notes, shipment));
    setItems((current) => current.map((item, index) => index === 0 ? calculateItemTotals({
      ...item,
      description: renderTemplate(template.line_description_template, shipment),
      vatRate: Number(template.default_vat_rate),
      exemptionCode: template.default_exemption_code || item.exemptionCode || "",
    }) : item));
  };

  const loadPresentationOptions = async () => {
    try {
      const [templates, accounts] = await Promise.all([
        invoicePresentationService.getTemplates(),
        invoicePresentationService.getBankAccounts(),
      ]);
      setNoteTemplates(templates);
      setBankAccounts(accounts);
      setSelectedBankAccountIds(accounts.filter((account) => account.is_default).map((account) => account.id));
      setIncludeBankDetails(accounts.length > 0);
      const initialCategory = inferCategory(shipment);
      setInvoiceCategory(initialCategory);
      const initialTemplate = templates.find((template) => template.category === initialCategory && template.is_default)
        || templates.find((template) => template.category === initialCategory)
        || templates[0];
      if (initialTemplate) applyNoteTemplate(initialTemplate);
    } catch (error: any) {
      toast({ title: "Fatura açıklama ayarları yüklenemedi", description: error.message, variant: "destructive" });
    }
  };

  // Load customers for manual invoice mode
  useEffect(() => {
    if (isOpen && !shipment) {
      loadCustomers();
    }
    
    // If shipment exists, set customer automatically
    if (shipment?.customer_id) {
      setSelectedCustomer(shipment.customer_id);
      const unitPrice = Number(shipment.satis_tutar || 0);
      const vatRate = 20;
      setCurrency(shipment.currency || "TRY");
      setItems([{
        id: "1",
        description: `${shipment.shipment_code || ""} taşıma hizmeti (${shipment.origin || ""} → ${shipment.destination || ""})`.trim(),
        quantity: 1,
        unitPrice,
        vatRate,
        subtotal: unitPrice,
        vatAmount: unitPrice * vatRate / 100,
        total: unitPrice * (1 + vatRate / 100),
      }]);
    }
  }, [isOpen, shipment]);

  useEffect(() => {
    if (isOpen) void loadPresentationOptions();
  }, [isOpen]);

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, company")
        .order("company");

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error("Error loading customers:", error);
      toast({
        title: "Hata",
        description: "Müşteriler yüklenirken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  const calculateItemTotals = (item: Partial<InvoiceItem>): InvoiceItem => {
    const quantity = item.quantity || 0;
    const unitPrice = item.unitPrice || 0;
    const vatRate = item.vatRate || 0;
    
    const subtotal = quantity * unitPrice;
    const vatAmount = (subtotal * vatRate) / 100;
    const total = subtotal + vatAmount;
    
    return {
      ...item,
      id: item.id || Date.now().toString(),
      description: item.description || "",
      quantity,
      unitPrice,
      vatRate,
      subtotal,
      vatAmount,
      total,
      withholdingCode: item.withholdingCode || "",
      withholdingValue: item.withholdingValue || 0,
      exemptionCode: item.exemptionCode || "",
    };
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = calculateItemTotals({
      ...newItems[index],
      [field]: value,
    });
    setItems(newItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        description: "",
        quantity: 1,
        unitPrice: 0,
        vatRate: 20,
        subtotal: 0,
        vatAmount: 0,
        total: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const totals = items.reduce(
    (acc, item) => ({
      subtotal: acc.subtotal + item.subtotal,
      vat: acc.vat + item.vatAmount,
      grandTotal: acc.grandTotal + item.total,
    }),
    { subtotal: 0, vat: 0, grandTotal: 0 }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate customer selection
    if (!selectedCustomer && !shipment) {
      toast({
        title: "Uyarı",
        description: "Lütfen bir müşteri seçin",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const invoice = await invoiceIntegrationService.createDraft({
        customerId: shipment?.customer_id || selectedCustomer,
        shipmentIds: shipment?.id ? [shipment.id] : [],
        invoiceDate,
        dueDate,
        currency,
        paymentStatus,
        notes,
        documentType,
        documentScenario,
        exchangeRate: currency === "TRY" ? 1 : Number(exchangeRate),
        idempotencyKey: crypto.randomUUID(),
        invoiceCategory,
        noteTemplateId: noteTemplateId || null,
        bankAccountIds: includeBankDetails ? selectedBankAccountIds : [],
        includeBankDetails: includeBankDetails && selectedBankAccountIds.length > 0,
        items: items.map((item) => ({
          productCode: "HIZMET",
          description: item.description,
          quantity: item.quantity,
          unit: "Adet",
          unitPrice: item.unitPrice,
          vatRate: item.vatRate,
          withholdingCode: item.withholdingCode || null,
          withholdingValue: item.withholdingValue || null,
          withholdingType: item.withholdingCode ? "PERCENTAGE" : null,
          exemptionCode: item.exemptionCode || null,
        })),
      });

      let syncMessage = "KolayBi gönderim kuyruğuna alındı.";
      try {
        const sync = await invoiceIntegrationService.send(invoice.id);
        syncMessage = sync.status === "official"
          ? `Resmî e-belge oluşturuldu${sync.invoiceNo ? `: ${sync.invoiceNo}` : "."}`
          : "KolayBi'ye gönderildi; resmileştirme bekleniyor.";
      } catch (syncError: any) {
        syncMessage = `Taslak korundu; gönderim tamamlanamadı: ${syncError.message}`;
      }

      toast({ title: "Fatura taslağı oluşturuldu", description: `${invoice.invoice_no}. ${syncMessage}` });

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error: any) {
      console.error("Error creating invoice:", error);
      toast({
        title: "Hata",
        description: error.message || "Fatura oluşturulurken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Satış Faturası Oluştur</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* TEMEL BİLGİLER */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-lg">Temel Bilgiler</h3>
            
            <div className="grid grid-cols-3 gap-4">
              {/* CUSTOMER SELECTION */}
              {!shipment && (
                <div className="space-y-2">
                  <Label htmlFor="customer" className="text-sm font-semibold">
                    Müşteri *
                  </Label>
                  <Select
                    value={selectedCustomer}
                    onValueChange={setSelectedCustomer}
                    disabled={!!preSelectedCustomer}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Müşteri seçin..." />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.company || customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* INVOICE DATE */}
              <div className="space-y-2">
                <Label htmlFor="invoiceDate" className="text-sm font-semibold">
                  Fatura Tarihi *
                </Label>
                <Input
                  type="date"
                  id="invoiceDate"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  required
                />
              </div>

              {/* DUE DATE */}
              <div className="space-y-2">
                <Label htmlFor="dueDate" className="text-sm font-semibold">
                  Vade Tarihi *
                </Label>
                <Input
                  type="date"
                  id="dueDate"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>

              {/* CURRENCY */}
              <div className="space-y-2">
                <Label htmlFor="currency" className="text-sm font-semibold">
                  Para Birimi
                </Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRY">TRY</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {currency !== "TRY" && (
                <div className="space-y-2">
                  <Label htmlFor="exchangeRate" className="text-sm font-semibold">Döviz Kuru *</Label>
                  <Input
                    id="exchangeRate"
                    type="number"
                    min="0.000001"
                    step="0.000001"
                    value={exchangeRate}
                    onChange={(event) => setExchangeRate(event.target.value)}
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-semibold">E-Belge Türü</Label>
                <Select
                  value={documentType}
                  onValueChange={(value: InvoiceDocumentType) => {
                    setDocumentType(value);
                    setDocumentScenario(value === "e_archive" ? "EARSIVFATURA" : "TEMELFATURA");
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="e_archive">E-Arşiv</SelectItem>
                    <SelectItem value="e_invoice">E-Fatura</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Belge Senaryosu</Label>
                <Select value={documentScenario} onValueChange={(value: typeof documentScenario) => setDocumentScenario(value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {documentType === "e_archive" ? (
                      <SelectItem value="EARSIVFATURA">E-Arşiv Fatura</SelectItem>
                    ) : (
                      <>
                        <SelectItem value="TEMELFATURA">Temel Fatura</SelectItem>
                        <SelectItem value="TICARIFATURA">Ticari Fatura</SelectItem>
                        <SelectItem value="KAMU">Kamu</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* PAYMENT STATUS */}
              <div className="space-y-2">
                <Label htmlFor="paymentStatus" className="text-sm font-semibold">
                  Ödeme Durumu
                </Label>
                <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bekliyor">Bekliyor</SelectItem>
                    <SelectItem value="Ödendi">Ödendi</SelectItem>
                    <SelectItem value="Kısmi Ödendi">Kısmi Ödendi</SelectItem>
                    <SelectItem value="Gecikmiş">Gecikmiş</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* FATURA AÇIKLAMA VE BANKA KURALLARI */}
          <div className="space-y-4 rounded-lg border border-orange-200 bg-orange-50/40 p-4">
            <div>
              <h3 className="font-semibold text-lg">Fatura Açıklaması ve Banka Bilgileri</h3>
              <p className="text-sm text-slate-600">Fatura türü değiştiğinde kalem açıklaması ve notlar birlikte yenilenir. Son metni aşağıda ayrıca düzenleyebilirsiniz.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Fatura açıklama türü</Label>
                <Select value={invoiceCategory} onValueChange={(value: InvoiceCategory) => {
                  setInvoiceCategory(value);
                  const template = noteTemplates.find((row) => row.category === value && row.is_default)
                    || noteTemplates.find((row) => row.category === value);
                  if (template) applyNoteTemplate(template);
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(categoryLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Not şablonu</Label>
                <Select value={noteTemplateId} onValueChange={(value) => {
                  const template = noteTemplates.find((row) => row.id === value);
                  if (template) applyNoteTemplate(template);
                }}>
                  <SelectTrigger><SelectValue placeholder="Şablon seçin" /></SelectTrigger>
                  <SelectContent>{noteTemplates.filter((row) => row.category === invoiceCategory).map((row) => <SelectItem key={row.id} value={row.id}>{row.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="rounded-lg border bg-white p-3">
              <label className="flex items-center gap-2 font-medium">
                <Checkbox checked={includeBankDetails} onCheckedChange={(checked) => setIncludeBankDetails(checked === true)} />
                Banka bilgilerini faturada göster
              </label>
              {includeBankDetails && <div className="mt-3 grid gap-2 md:grid-cols-2">
                {bankAccounts.length === 0 ? <p className="text-sm text-amber-700">Aktif fatura banka hesabı bulunmuyor. KolayBi Entegre Ofis → Finans bölümünden ekleyebilirsiniz.</p> : bankAccounts.map((account) => {
                  const checked = selectedBankAccountIds.includes(account.id);
                  return <label key={account.id} className="flex items-start gap-2 rounded-md border p-2 text-sm">
                    <Checkbox checked={checked} onCheckedChange={(value) => setSelectedBankAccountIds((current) => value === true ? [...new Set([...current, account.id])] : current.filter((id) => id !== account.id))} />
                    <span><strong>{account.label}</strong><br/><span className="text-slate-500">{account.bank_name} · {account.iban} · {account.currency}</span></span>
                  </label>;
                })}
              </div>}
            </div>
          </div>

          {/* ÜRÜN/HİZMET KALEMLERİ */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Ürün/Hizmet Bilgileri</h3>
              <Button type="button" onClick={addItem} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Kalem Ekle
              </Button>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={item.id} className="space-y-2 rounded-lg border bg-white p-3">
                  <div className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4">
                    <Label className="text-xs">Ürün/Hizmet Adı</Label>
                    <Input
                      placeholder="Açıklama..."
                      value={item.description}
                      onChange={(e) => handleItemChange(index, "description", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Miktar</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, "quantity", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Birim Fiyat</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, "unitPrice", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-1">
                    <Label className="text-xs">KDV %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={item.vatRate}
                      onChange={(e) => handleItemChange(index, "vatRate", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Toplam</Label>
                    <Input
                      type="text"
                      value={item.total.toFixed(2)}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                  <div className="col-span-1 flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                    {item.vatRate === 0 && (
                      <div>
                        <Label className="text-xs">KDV İstisna Kodu *</Label>
                        <Input
                          value={item.exemptionCode || ""}
                          onChange={(event) => handleItemChange(index, "exemptionCode", event.target.value)}
                          placeholder="GİB istisna kodu"
                        />
                      </div>
                    )}
                    <div>
                      <Label className="text-xs">Tevkifat Kodu</Label>
                      <Input
                        value={item.withholdingCode || ""}
                        onChange={(event) => handleItemChange(index, "withholdingCode", event.target.value)}
                        placeholder="İsteğe bağlı GİB kodu"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Tevkifat Oranı (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={item.withholdingValue || ""}
                        onChange={(event) => handleItemChange(index, "withholdingValue", Number(event.target.value) || 0)}
                        placeholder="Örn. 50"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ÖZET */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-right">
              <div></div>
              <div></div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Ara Toplam:</span>
                  <span>{totals.subtotal.toFixed(2)} {currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Toplam KDV:</span>
                  <span>{totals.vat.toFixed(2)} {currency}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Genel Toplam:</span>
                  <span>{totals.grandTotal.toFixed(2)} {currency}</span>
                </div>
              </div>
            </div>
          </div>

          {/* NOTES */}
          <div className="space-y-2">
            <Label htmlFor="notes">Açıklama / Notlar</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              className="font-mono text-xs"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                "Faturayı Kaydet"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
