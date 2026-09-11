import { useId, useMemo } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  ShipmentPartyDirectoryEntry,
  ShipmentRouteStopInput,
  ShipmentRouteStopType,
} from "@/services/shipmentRouteService";

const normalizePartyName = (value: string) => value.trim().toLocaleLowerCase("tr-TR").replace(/\s+/g, " ");

interface ShipmentPartyStopCardProps {
  stopType: ShipmentRouteStopType;
  index: number;
  stop: ShipmentRouteStopInput;
  canRemove: boolean;
  validationAttempted?: boolean;
  partyDirectory: ShipmentPartyDirectoryEntry[];
  onChange: (field: keyof ShipmentRouteStopInput, value: string) => void;
  onApplyDirectoryEntry: (entry: ShipmentPartyDirectoryEntry) => void;
  onRemove: () => void;
}

export function ShipmentPartyStopCard({
  stopType,
  index,
  stop,
  canRemove,
  validationAttempted = false,
  partyDirectory,
  onChange,
  onApplyDirectoryEntry,
  onRemove,
}: ShipmentPartyStopCardProps) {
  const inputListId = useId().replace(/:/g, "");
  const identityDigits = (stop.identity_no || "").replace(/\D/g, "");
  const invalidIdentity = validationAttempted && Boolean(identityDigits) && identityDigits.length !== (stop.party_type === "individual" ? 11 : 10);
  const missingCompanyName = validationAttempted && !stop.company_name.trim();
  const missingCity = validationAttempted && !stop.city.trim();
  const exactMatches = useMemo(() => {
    const normalizedName = normalizePartyName(stop.company_name);
    if (!normalizedName) return [];
    return partyDirectory.filter((entry) => normalizePartyName(entry.company_name) === normalizedName);
  }, [partyDirectory, stop.company_name]);

  const uniqueNames = useMemo(() => {
    const names = new Map<string, string>();
    partyDirectory.forEach((entry) => {
      const normalized = normalizePartyName(entry.company_name);
      if (normalized && !names.has(normalized)) names.set(normalized, entry.company_name);
    });
    return [...names.values()];
  }, [partyDirectory]);

  const handleNameChange = (value: string) => {
    onChange("company_name", value);
    const matches = partyDirectory.filter((entry) => normalizePartyName(entry.company_name) === normalizePartyName(value));
    if (matches.length === 1) onApplyDirectoryEntry(matches[0]);
  };

  return (
    <div className="space-y-3 rounded-lg border bg-white p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">
          {index + 1}. {stopType === "pickup" ? "Alım" : "Teslim"} Noktası
        </span>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove} disabled={!canRemove} aria-label="Rota noktasını sil">
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">Taraf Türü</Label>
          <Select value={stop.party_type || "corporate"} onValueChange={(value) => onChange("party_type", value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="corporate">Kurumsal</SelectItem>
              <SelectItem value="individual">Bireysel</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{stop.party_type === "individual" ? "T.C. Kimlik No" : "Vergi No (VKN)"}</Label>
          <Input
            value={stop.identity_no || ""}
            onChange={(event) => onChange("identity_no", event.target.value.replace(/\D/g, "").slice(0, stop.party_type === "individual" ? 11 : 10))}
            inputMode="numeric"
            placeholder={stop.party_type === "individual" ? "11 hane · isteğe bağlı" : "10 hane · isteğe bağlı"}
            aria-invalid={invalidIdentity}
          />
          {invalidIdentity && <p className="text-xs font-medium text-red-600">{stop.party_type === "individual" ? "T.C. Kimlik No 11 haneli olmalıdır." : "Vergi No 10 haneli olmalıdır."}</p>}
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">Firma / Kişi Adı *</Label>
          <Input
            list={inputListId}
            value={stop.company_name}
            onChange={(event) => handleNameChange(event.target.value)}
            placeholder={stopType === "pickup" ? "Gönderici firma veya kişi" : "Alıcı firma veya kişi"}
            autoComplete="off"
            aria-invalid={missingCompanyName}
          />
          <datalist id={inputListId}>
            {uniqueNames.map((name) => <option key={name} value={name} />)}
          </datalist>
          <p className="text-[11px] text-slate-500">Kayıtlı cari ve daha önce kullanılan taraflar yazarken önerilir.</p>
          {missingCompanyName && <p className="text-xs font-medium text-red-600">Firma veya kişi adı zorunludur.</p>}
        </div>

        {exactMatches.length > 0 ? (
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs">Kayıtlı Bilgiyi / Adresi Kullan</Label>
            <Select onValueChange={(entryId) => {
              const entry = exactMatches.find((item) => item.id === entryId);
              if (entry) onApplyDirectoryEntry(entry);
            }}>
              <SelectTrigger><SelectValue placeholder="Adres ve iletişim bilgilerini otomatik doldur" /></SelectTrigger>
              <SelectContent>
                {exactMatches.map((entry) => (
                  <SelectItem key={entry.id} value={entry.id}>
                    {[entry.address_line, entry.district, entry.city].filter(Boolean).join(" · ") || "Adres kaydı yok"}
                    {entry.customer_id ? " · CARİ" : " · GEÇMİŞ SEVKİYAT"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">Açık Adres</Label>
          <Input value={stop.address_line || ""} onChange={(event) => onChange("address_line", event.target.value)} placeholder="Mahalle, cadde, bina / tesis" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">İlçe</Label>
          <Input value={stop.district || ""} onChange={(event) => onChange("district", event.target.value)} placeholder="Sancaktepe" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">İl *</Label>
          <Input value={stop.city} onChange={(event) => onChange("city", event.target.value)} placeholder="İstanbul" aria-invalid={missingCity} />
          {missingCity && <p className="text-xs font-medium text-red-600">İl bilgisi zorunludur.</p>}
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Yetkili Kişi</Label>
          <Input value={stop.contact_name || ""} onChange={(event) => onChange("contact_name", event.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Telefon</Label>
          <Input value={stop.contact_phone || ""} onChange={(event) => onChange("contact_phone", event.target.value)} inputMode="tel" autoComplete="tel" />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">Durak Notu</Label>
          <Textarea value={stop.instructions || ""} onChange={(event) => onChange("instructions", event.target.value)} placeholder="Giriş kapısı, randevu, yükleme/boşaltma talimatı..." rows={2} />
        </div>
      </div>
    </div>
  );
}
