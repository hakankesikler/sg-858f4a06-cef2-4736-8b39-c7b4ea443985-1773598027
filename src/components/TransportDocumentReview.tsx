import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type Props = {
  id: string;
  status: "idle" | "reading" | "success" | "error";
  confidence: number | null;
  extractedFieldCount: number;
  progress?: number;
  warning?: string;
  confirmed: boolean;
  onConfirmedChange: (confirmed: boolean) => void;
};

export function TransportDocumentReview({ id, status, confidence, extractedFieldCount, progress, warning, confirmed, onConfirmedChange }: Props) {
  if (status === "idle") return null;
  return (
    <div className="space-y-3 rounded-xl border border-orange-200 bg-orange-50/60 p-4">
      {status === "reading" && (
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
          Belge bu cihazda okunuyor{progress ? ` · %${Math.round(progress * 100)}` : ""}…
        </div>
      )}
      {status === "success" && (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-950">
          <CheckCircle2 className="h-4 w-4 text-emerald-700" />
          <AlertTitle>Belge bilgileri forma aktarıldı</AlertTitle>
          <AlertDescription>
            {extractedFieldCount} alan bulundu{confidence !== null ? ` · Okuma güveni %${Math.round(confidence)}` : ""}.
            {warning ? ` ${warning}` : " Alanları belgeyle karşılaştırıp gerekiyorsa düzeltin."}
          </AlertDescription>
        </Alert>
      )}
      {status === "error" && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Otomatik okuma tamamlanamadı</AlertTitle>
          <AlertDescription>{warning || "Bilgileri elle girip belgeyle karşılaştırabilirsiniz."}</AlertDescription>
        </Alert>
      )}
      {status !== "reading" && (
        <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3">
          <Checkbox id={id} checked={confirmed} onCheckedChange={(checked) => onConfirmedChange(checked === true)} aria-describedby={`${id}-help`} />
          <div className="space-y-1">
            <Label htmlFor={id} className="cursor-pointer font-semibold text-slate-900">
              Belgedeki bilgileri kontrol ettim ve doğruluğunu onaylıyorum.
            </Label>
            <p id={`${id}-help`} className="flex items-center gap-1 text-xs text-slate-600">
              <ShieldCheck className="h-3.5 w-3.5" /> Otomatik okuma hata yapabilir; kayıt öncesinde kullanıcı kontrolü zorunludur.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
