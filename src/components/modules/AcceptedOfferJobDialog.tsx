import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { salesCrmService, type CrmOffer, type CrmOpportunity, type CrmSupplier } from "@/services/salesCrmService";

type JobDraft = {
  job_date: string;
  supplier_id: string | null;
  sender_name: string;
  sender_address: string;
  sender_district: string;
  sender_city: string;
  receiver_name: string;
  receiver_address: string;
  receiver_district: string;
  receiver_city: string;
  quantity: string;
  cargo_type: string;
  total_weight: string;
};

type Props = {
  offer: CrmOffer;
  opportunity: CrmOpportunity;
  suppliers: CrmSupplier[];
  onClose: () => void;
  onSuccess: () => Promise<void>;
};

const currency = (amount: number, code: string) => new Intl.NumberFormat("tr-TR", {
  style: "currency", currency: code,
}).format(amount);

export function AcceptedOfferJobDialog({ offer, opportunity, suppliers, onClose, onSuccess }: Props) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [draft, setDraft] = useState<JobDraft>({
    job_date: offer.collection_date || "",
    supplier_id: suppliers.some((supplier) => supplier.id === offer.supplier_id) ? offer.supplier_id : null,
    sender_name: opportunity.company_name,
    sender_address: offer.pickup_location || "",
    sender_district: "",
    sender_city: "",
    receiver_name: "",
    receiver_address: offer.delivery_location || "",
    receiver_district: offer.destination_district || "",
    receiver_city: "",
    quantity: offer.pallet_count ? String(offer.pallet_count) : "",
    cargo_type: offer.cargo_description || "",
    total_weight: offer.weight_kg ? String(offer.weight_kg) : "",
  });

  const set = (key: keyof JobDraft, value: string) => setDraft((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    const quantity = Number(draft.quantity);
    const totalWeight = Number(draft.total_weight);
    if (!Number.isSafeInteger(quantity) || quantity <= 0 || !Number.isFinite(totalWeight) || totalWeight <= 0) {
      toast({ title: "Yük bilgileri eksik", description: "Adet tam sayı, toplam ağırlık sıfırdan büyük olmalı.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await salesCrmService.createJobFromAcceptedOffer(offer.id, {
        ...draft,
        quantity,
        total_weight: totalWeight,
      });
    } catch (error: unknown) {
      toast({ title: "İş emri oluşturulamadı", description: error instanceof Error ? error.message : "Lütfen bilgileri kontrol edin.", variant: "destructive" });
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    window.dispatchEvent(new Event("rex:transport-jobs-changed"));
    toast({ title: "İş emri oluşturuldu", description: `${offer.offer_no} teklifinden oluşturulan iş emri operasyon onayını bekliyor.` });
    try {
      await onSuccess();
    } catch {
      toast({ title: "İş emri oluşturuldu, ancak ekran yenilenemedi", description: "Güncel kayıtları görmek için CRM ekranını yenileyin." });
      onClose();
    }
  };

  return <Dialog open onOpenChange={(open) => { if (!open && !submitting) onClose(); }}>
    <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
      <DialogHeader><DialogTitle>Tekliften İş Emri Oluştur</DialogTitle></DialogHeader>
      <p className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
        Kabul edilen revizyon: <strong>{offer.offer_no}</strong> · {currency(Number(offer.amount), offer.currency)}.
        Teklif tutarı ve para birimi iş emrine aynen aktarılır. Aşağıdaki operasyon bilgilerini doğrulayın.
      </p>
      <form onSubmit={(event) => void submit(event)} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label htmlFor="crm-job-date">Yükleme tarihi *</Label><Input id="crm-job-date" type="date" required value={draft.job_date} onChange={(event) => set("job_date", event.target.value)} /></div>
          <div><Label htmlFor="crm-job-supplier">Operasyon tedarikçisi</Label><select id="crm-job-supplier" value={draft.supplier_id || ""} onChange={(event) => setDraft((current) => ({ ...current, supplier_id: event.target.value || null }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="">Henüz belirlenmedi</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.company || supplier.name}</option>)}</select></div>
          <div><Label htmlFor="crm-job-sender">Gönderici *</Label><Input id="crm-job-sender" required value={draft.sender_name} onChange={(event) => set("sender_name", event.target.value)} /></div>
          <div><Label htmlFor="crm-job-receiver">Alıcı *</Label><Input id="crm-job-receiver" required value={draft.receiver_name} onChange={(event) => set("receiver_name", event.target.value)} /></div>
          <div><Label htmlFor="crm-job-pickup-address">Yükleme adresi *</Label><Input id="crm-job-pickup-address" required value={draft.sender_address} onChange={(event) => set("sender_address", event.target.value)} /></div>
          <div><Label htmlFor="crm-job-delivery-address">Teslim adresi *</Label><Input id="crm-job-delivery-address" required value={draft.receiver_address} onChange={(event) => set("receiver_address", event.target.value)} /></div>
          <div><Label htmlFor="crm-job-sender-district">Yükleme ilçesi</Label><Input id="crm-job-sender-district" value={draft.sender_district} onChange={(event) => set("sender_district", event.target.value)} /></div>
          <div><Label htmlFor="crm-job-receiver-district">Teslim ilçesi</Label><Input id="crm-job-receiver-district" value={draft.receiver_district} onChange={(event) => set("receiver_district", event.target.value)} /></div>
          <div><Label htmlFor="crm-job-sender-city">Yükleme ili *</Label><Input id="crm-job-sender-city" required value={draft.sender_city} onChange={(event) => set("sender_city", event.target.value)} /></div>
          <div><Label htmlFor="crm-job-receiver-city">Teslim ili *</Label><Input id="crm-job-receiver-city" required value={draft.receiver_city} onChange={(event) => set("receiver_city", event.target.value)} /></div>
          <div><Label htmlFor="crm-job-cargo">Yük cinsi *</Label><Input id="crm-job-cargo" required value={draft.cargo_type} onChange={(event) => set("cargo_type", event.target.value)} /></div>
          <div><Label htmlFor="crm-job-quantity">Adet *</Label><Input id="crm-job-quantity" type="number" min="1" step="1" required value={draft.quantity} onChange={(event) => set("quantity", event.target.value)} /></div>
          <div><Label htmlFor="crm-job-weight">Toplam ağırlık (kg) *</Label><Input id="crm-job-weight" type="number" min="0.001" step="any" required value={draft.total_weight} onChange={(event) => set("total_weight", event.target.value)} /></div>
        </div>
        <p className="text-xs text-slate-600">Teklifteki yükleme/teslim yerleri ayrıntılı adres olmayabilir; kaydetmeden önce gerçek adresleri ve yük bilgilerini kontrol edin. İş emri oluşunca operasyon onayını bekler; sevkiyat otomatik başlamaz.</p>
        <DialogFooter><Button type="button" variant="outline" onClick={onClose} disabled={submitting}>Vazgeç</Button><Button type="submit" disabled={submitting}>{submitting ? "Oluşturuluyor..." : "İş Emri Oluştur"}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
