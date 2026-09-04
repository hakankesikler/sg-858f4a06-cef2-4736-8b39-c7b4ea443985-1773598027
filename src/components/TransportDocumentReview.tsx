import { ShieldCheck } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type Props = {
  id: string;
  confirmed: boolean;
  onConfirmedChange: (confirmed: boolean) => void;
};

export function TransportDocumentReview({ id, confirmed, onConfirmedChange }: Props) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50/60 p-4">
      <Checkbox id={id} checked={confirmed} onCheckedChange={(checked) => onConfirmedChange(checked === true)} aria-describedby={`${id}-help`} />
      <div className="space-y-1">
        <Label htmlFor={id} className="cursor-pointer font-semibold text-slate-900">
          Belgedeki bilgileri kontrol ettim ve doğruluğunu onaylıyorum.
        </Label>
        <div id={`${id}-help`} className="flex items-center gap-1 text-xs text-slate-600">
          <ShieldCheck className="h-3.5 w-3.5" /> Bilgileri belgeye bakarak girin; kayıt öncesinde kullanıcı kontrolü zorunludur.
        </div>
      </div>
    </div>
  );
}
