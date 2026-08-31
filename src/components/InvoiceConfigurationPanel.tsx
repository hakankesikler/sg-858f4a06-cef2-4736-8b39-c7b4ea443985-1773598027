import React, { useEffect, useState } from "react";
import { Landmark, Loader2, NotebookPen, Pencil, Plus, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  invoicePresentationService,
  type InvoiceBankAccount,
  type InvoiceCategory,
  type InvoiceNoteTemplate,
} from "@/services/invoicePresentationService";

const categoryLabels: Record<InvoiceCategory, string> = {
  domestic_transport: "Yurtiçi taşıma",
  international_transport: "Uluslararası taşıma",
  exempt_transport: "KDV istisnalı taşıma",
  withholding_transport: "Tevkifatlı taşıma",
  other: "Diğer hizmet",
};

const emptyBank = {
  label: "", account_holder: "", bank_name: "", branch_name: "", account_no: "",
  iban: "", swift_code: "", currency: "TRY", is_default: false, is_active: true, display_order: 100, notes: "",
};

const emptyTemplate = {
  name: "", code: "", category: "domestic_transport" as InvoiceCategory,
  line_description_template: "{{shipment_code}} numaralı {{origin}} → {{destination}} taşıma hizmeti.",
  notes: "", kolaybi_document_type: "SATIS", default_vat_rate: 20,
  default_exemption_code: "", is_default: false, is_active: true, display_order: 100,
};

export function InvoiceConfigurationPanel({ canManage }: { canManage: boolean }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<InvoiceNoteTemplate[]>([]);
  const [banks, setBanks] = useState<InvoiceBankAccount[]>([]);
  const [bankForm, setBankForm] = useState<any>(emptyBank);
  const [templateForm, setTemplateForm] = useState<any>(emptyTemplate);

  const load = async () => {
    setLoading(true);
    try {
      const [templateRows, bankRows] = await Promise.all([
        invoicePresentationService.getTemplates(true),
        invoicePresentationService.getBankAccounts(true),
      ]);
      setTemplates(templateRows);
      setBanks(bankRows);
    } catch (error: any) {
      toast({ title: "Fatura ayarları yüklenemedi", description: error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const saveBank = async () => {
    if (!bankForm.label.trim() || !bankForm.account_holder.trim() || !bankForm.bank_name.trim() || !bankForm.iban.trim()) {
      toast({ title: "Eksik banka bilgisi", description: "Etiket, hesap sahibi, banka ve IBAN zorunludur.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await invoicePresentationService.saveBankAccount(bankForm);
      setBankForm(emptyBank);
      await load();
      toast({ title: "Banka hesabı kaydedildi", description: "Yeni faturalarda seçilebilir." });
    } catch (error: any) {
      toast({ title: "Banka hesabı kaydedilemedi", description: error.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const saveTemplate = async () => {
    if (!templateForm.name.trim() || !templateForm.line_description_template.trim() || !templateForm.notes.trim()) {
      toast({ title: "Eksik şablon bilgisi", description: "Ad, kalem açıklaması ve fatura notu zorunludur.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await invoicePresentationService.saveTemplate(templateForm);
      setTemplateForm(emptyTemplate);
      await load();
      toast({ title: "Fatura not şablonu kaydedildi", description: "Fatura oluştururken kullanılabilir." });
    } catch (error: any) {
      toast({ title: "Şablon kaydedilemedi", description: error.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center gap-2 py-8 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Fatura ayarları yükleniyor...</div>;

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card>
        <CardHeader><div className="flex items-center gap-2"><NotebookPen className="h-5 w-5 text-orange-600"/><CardTitle>Fatura açıklama şablonları</CardTitle></div><CardDescription>Fatura türü değiştiğinde kalem açıklaması ve notlar birlikte değişir.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {templates.map((row) => <div key={row.id} className={`rounded-lg border p-3 ${row.is_active ? "bg-white" : "bg-slate-50 opacity-60"}`}><div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{row.name}</p><Badge variant="outline">{categoryLabels[row.category]}</Badge>{row.is_default && <Badge className="bg-blue-700">Varsayılan</Badge>}</div><p className="mt-2 line-clamp-2 text-xs text-slate-500">{row.notes}</p></div>{canManage && <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setTemplateForm({ ...row, default_exemption_code: row.default_exemption_code || "" })}><Pencil className="h-3.5 w-3.5"/></Button><Switch checked={row.is_active} onCheckedChange={async (checked) => { await invoicePresentationService.setTemplateActive(row.id, checked); await load(); }}/></div>}</div></div>)}
          </div>
          {canManage && <div className="space-y-3 rounded-xl border border-orange-200 bg-orange-50/40 p-4">
            <div className="flex items-center gap-2 font-semibold"><Plus className="h-4 w-4"/>{templateForm.id ? "Şablonu düzenle" : "Yeni şablon"}</div>
            <div className="grid gap-3 md:grid-cols-2"><div><Label>Şablon adı *</Label><Input value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}/></div><div><Label>Fatura türü *</Label><Select value={templateForm.category} onValueChange={(value: InvoiceCategory) => setTemplateForm({ ...templateForm, category: value, kolaybi_document_type: value === "exempt_transport" ? "ISTISNA" : value === "withholding_transport" ? "TEVKIFAT" : "SATIS", default_vat_rate: value === "exempt_transport" ? 0 : 20 })}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{Object.entries(categoryLabels).map(([value,label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div></div>
            <div><Label>Kalem açıklama şablonu *</Label><Textarea rows={2} value={templateForm.line_description_template} onChange={(e) => setTemplateForm({ ...templateForm, line_description_template: e.target.value })}/><p className="mt-1 text-xs text-slate-500">Kullanılabilir alanlar: {"{{shipment_code}}"}, {"{{origin}}"}, {"{{destination}}"}, {"{{tracking_number}}"}, {"{{service_type}}"}, {"{{awb_number}}"}, {"{{express_carrier}}"}, {"{{package_type}}"}</p></div>
            <div><Label>Fatura notları *</Label><Textarea rows={5} value={templateForm.notes} onChange={(e) => setTemplateForm({ ...templateForm, notes: e.target.value })}/></div>
            <div className="grid gap-3 md:grid-cols-3"><div><Label>KolayBi belge tipi</Label><Input value={templateForm.kolaybi_document_type} disabled/></div><div><Label>Varsayılan KDV %</Label><Input type="number" min="0" max="100" value={templateForm.default_vat_rate} onChange={(e) => setTemplateForm({ ...templateForm, default_vat_rate: Number(e.target.value) })}/></div><label className="flex items-end gap-2 pb-2 text-sm"><Switch checked={templateForm.is_default} onCheckedChange={(checked) => setTemplateForm({ ...templateForm, is_default: checked })}/>Bu türün varsayılanı</label></div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setTemplateForm(emptyTemplate)}>Temizle</Button><Button onClick={() => void saveTemplate()} disabled={saving}><Save className="mr-2 h-4 w-4"/>Kaydet</Button></div>
          </div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><div className="flex items-center gap-2"><Landmark className="h-5 w-5 text-blue-700"/><CardTitle>Faturada gösterilecek banka hesapları</CardTitle></div><CardDescription>Hesapları ekleyin, pasife alın veya her faturada ayrı ayrı seçin.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">{banks.map((row) => <div key={row.id} className={`rounded-lg border p-3 ${row.is_active ? "bg-white" : "bg-slate-50 opacity-60"}`}><div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{row.label}</p><Badge variant="outline">{row.currency}</Badge>{row.is_default && <Badge className="bg-blue-700">Varsayılan</Badge>}</div><p className="mt-1 text-sm">{row.bank_name} · {row.iban}</p><p className="mt-1 text-xs text-slate-500">{row.account_holder}</p></div>{canManage && <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setBankForm({ ...row, branch_name: row.branch_name || "", account_no: row.account_no || "", swift_code: row.swift_code || "", notes: row.notes || "" })}><Pencil className="h-3.5 w-3.5"/></Button><Switch checked={row.is_active} onCheckedChange={async (checked) => { await invoicePresentationService.setBankAccountActive(row.id, checked); await load(); }}/></div>}</div></div>)}</div>
          {canManage && <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/40 p-4">
            <div className="flex items-center gap-2 font-semibold"><Plus className="h-4 w-4"/>{bankForm.id ? "Banka hesabını düzenle" : "Yeni banka hesabı"}</div>
            <div className="grid gap-3 md:grid-cols-2"><div><Label>Hesap etiketi *</Label><Input value={bankForm.label} onChange={(e) => setBankForm({ ...bankForm, label: e.target.value })} placeholder="Ana TL Hesabı"/></div><div><Label>Banka *</Label><Input value={bankForm.bank_name} onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })}/></div><div className="md:col-span-2"><Label>Hesap sahibi *</Label><Input value={bankForm.account_holder} onChange={(e) => setBankForm({ ...bankForm, account_holder: e.target.value })}/></div><div className="md:col-span-2"><Label>IBAN *</Label><Input value={bankForm.iban} onChange={(e) => setBankForm({ ...bankForm, iban: e.target.value })}/></div><div><Label>Şube</Label><Input value={bankForm.branch_name} onChange={(e) => setBankForm({ ...bankForm, branch_name: e.target.value })}/></div><div><Label>SWIFT</Label><Input value={bankForm.swift_code} onChange={(e) => setBankForm({ ...bankForm, swift_code: e.target.value })}/></div><div><Label>Para birimi</Label><Select value={bankForm.currency} onValueChange={(value) => setBankForm({ ...bankForm, currency: value })}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{["TRY","USD","EUR","GBP"].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div><label className="flex items-end gap-2 pb-2 text-sm"><Switch checked={bankForm.is_default} onCheckedChange={(checked) => setBankForm({ ...bankForm, is_default: checked })}/>Varsayılan seçili gelsin</label></div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setBankForm(emptyBank)}>Temizle</Button><Button onClick={() => void saveBank()} disabled={saving}><Save className="mr-2 h-4 w-4"/>Kaydet</Button></div>
          </div>}
        </CardContent>
      </Card>
    </div>
  );
}
