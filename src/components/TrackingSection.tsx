import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Copy, FileCheck2, Loader2, MapPin, Package, Search, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getPrivateDocumentSignedUrl } from "@/lib/private-storage";
import { publicTrackingService, type PublicTrackingResult } from "@/services/publicTrackingService";

interface TrackingSectionProps {
  initialTrackingNumber?: string;
  autoSearch?: boolean;
}

const completedStatuses = ["teslim_edildi", "Teslim Edildi"];

function statusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    atama_bekliyor: "Sürücü Ataması Bekliyor",
    beklemede: "Taşımaya Hazır",
    hazirlaniyor: "Hazırlanıyor",
    hazırlanıyor: "Hazırlanıyor",
    yolda: "Yolda",
    teslim_edildi: "Teslim Edildi",
    "Teslim Edildi": "Teslim Edildi",
    iptal: "İptal Edildi",
    "İptal": "İptal Edildi",
  };
  return labels[status || ""] || status || "Kayıt Alındı";
}

function formatDate(value?: string | null, includeTime = false) {
  if (!value) return "Bekleniyor";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Bekleniyor";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

function statusRank(status?: string | null) {
  if (completedStatuses.includes(status || "")) return 3;
  if (status === "yolda" || status === "Yolda") return 2;
  if (["beklemede", "hazirlaniyor", "hazırlanıyor", "Hazırlanıyor"].includes(status || "")) return 1;
  return 0;
}

export function TrackingSection({ initialTrackingNumber = "", autoSearch = false }: TrackingSectionProps) {
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber);
  const [result, setResult] = useState<PublicTrackingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [documentError, setDocumentError] = useState("");
  const [documentLoading, setDocumentLoading] = useState(false);
  const { toast } = useToast();

  const lookup = useCallback(async (number: string, silent = false) => {
    const normalized = publicTrackingService.normalize(number);
    if (!normalized) {
      setError("Takip numaranızı yazın.");
      return;
    }

    if (!silent) setLoading(true);
    setError("");
    try {
      const shipment = await publicTrackingService.track(normalized);
      setResult(shipment);
      setSearched(true);
      if (!shipment) setError("Bu takip numarasıyla eşleşen gönderi bulunamadı.");
    } catch (lookupError: any) {
      if (!silent) {
        setError(lookupError?.message || "Takip bilgileri şu anda alınamıyor.");
        setResult(null);
        setSearched(true);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!autoSearch || !initialTrackingNumber) return;
    setTrackingNumber(initialTrackingNumber);
    void lookup(initialTrackingNumber);
  }, [autoSearch, initialTrackingNumber, lookup]);

  useEffect(() => {
    if (!result?.tracking_number || completedStatuses.includes(result.status) || ["iptal", "İptal"].includes(result.status)) return;
    const timer = window.setInterval(() => void lookup(result.tracking_number, true), 30000);
    return () => window.clearInterval(timer);
  }, [lookup, result?.status, result?.tracking_number]);

  const stages = useMemo(() => {
    const events = result?.events || [];
    const eventDate = (statuses: string[]) => events.find((event) => statuses.includes(event.new_status || ""))?.event_at;
    return [
      { label: "Kayıt Alındı", date: result?.created_at, icon: Package },
      { label: "Taşımaya Hazır", date: eventDate(["beklemede", "hazirlaniyor", "hazırlanıyor", "Hazırlanıyor"]), icon: CheckCircle },
      { label: "Yolda", date: eventDate(["yolda", "Yolda"]), icon: Truck },
      { label: "Teslim Edildi", date: result?.delivery_date || eventDate(completedStatuses), icon: MapPin },
    ];
  }, [result]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void lookup(trackingNumber);
  };

  const copyTrackingLink = async () => {
    if (!result?.tracking_number) return;
    const url = `${window.location.origin}/takip/${encodeURIComponent(result.tracking_number)}`;
    await navigator.clipboard.writeText(url);
    toast({ title: "Bağlantı kopyalandı", description: "Takip bağlantısını müşterinizle paylaşabilirsiniz." });
  };

  const openDeliveryProof = async () => {
    if (!result?.delivery_proof_url) return;
    setDocumentLoading(true);
    setDocumentError("");
    try {
      const signedUrl = await getPrivateDocumentSignedUrl(result.delivery_proof_url, "shipment-documents");
      window.location.assign(signedUrl);
    } catch (documentError: any) {
      setDocumentError("Bu eski teslim evrakının fiziksel dosyası bulunamadı. REX Lojistik ile iletişime geçebilirsiniz.");
    } finally {
      setDocumentLoading(false);
    }
  };

  const currentRank = statusRank(result?.status);
  const cancelled = ["iptal", "İptal"].includes(result?.status || "");

  return (
    <section id="takip" className="py-20 bg-slate-50/60 scroll-mt-24">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-heading font-bold text-4xl text-navy mb-4">Gönderinizi Takip Edin</h2>
            <p className="text-muted-foreground text-lg">
              Paylaşılan REX takip numarasıyla sevkiyatınızın güncel durumunu görüntüleyin.
            </p>
          </div>

          <Card className="border-2 shadow-xl">
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Takip numaranızı girin (REX-...)"
                    value={trackingNumber}
                    onChange={(event) => setTrackingNumber(event.target.value.toUpperCase())}
                    className="pl-10 h-12 font-mono"
                    autoComplete="off"
                  />
                </div>
                <Button type="submit" size="lg" className="bg-gradient-accent hover:opacity-90 h-12 px-8" disabled={loading}>
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sorgula"}
                </Button>
              </form>

              {error && <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

              {result && (
                <div className="mt-8 space-y-6">
                  <div className="flex flex-col gap-4 rounded-xl border bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500">Takip Numarası</p>
                      <p className="mt-1 font-mono text-lg font-bold text-navy">{result.tracking_number}</p>
                      <p className="mt-1 text-sm text-slate-500">Sevkiyat: {result.shipment_code}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`rounded-full px-3 py-1.5 text-sm font-semibold ${cancelled ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-800"}`}>
                        {statusLabel(result.status)}
                      </span>
                      <Button type="button" variant="outline" size="sm" onClick={() => void copyTrackingLink()}>
                        <Copy className="mr-2 h-4 w-4" /> Bağlantıyı Kopyala
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4 rounded-xl bg-slate-900 p-5 text-white sm:grid-cols-2">
                    <div><p className="text-xs text-slate-400">Çıkış</p><p className="mt-1 font-semibold">{result.origin || "—"}</p></div>
                    <div><p className="text-xs text-slate-400">Varış</p><p className="mt-1 font-semibold">{result.destination || "—"}</p></div>
                    <div><p className="text-xs text-slate-400">Yükleme Tarihi</p><p className="mt-1 font-semibold">{formatDate(result.pickup_date)}</p></div>
                    <div><p className="text-xs text-slate-400">Tahmini Teslim</p><p className="mt-1 font-semibold">{formatDate(result.estimated_delivery_date)}</p></div>
                  </div>

                  {!cancelled && (
                    <div className="rounded-xl border bg-secondary/20 p-5 sm:p-6">
                      <div className="grid gap-6 md:grid-cols-4">
                        {stages.map((stage, index) => {
                          const active = index <= currentRank;
                          const Icon = stage.icon;
                          return <div key={stage.label} className="relative flex flex-col items-center text-center">
                            {index < stages.length - 1 && <div className={`absolute left-[60%] right-[-40%] top-6 hidden h-0.5 md:block ${index < currentRank ? "bg-orange-500" : "bg-slate-200"}`} />}
                            <div className={`relative z-10 rounded-full p-3 ${active ? "bg-orange-500 text-white" : "bg-slate-200 text-slate-500"}`}><Icon className="h-6 w-6" /></div>
                            <p className={`mt-2 text-sm font-semibold ${active ? "text-navy" : "text-slate-500"}`}>{stage.label}</p>
                            <p className="mt-1 text-xs text-slate-500">{active ? formatDate(stage.date, true) : "Bekleniyor"}</p>
                          </div>;
                        })}
                      </div>
                    </div>
                  )}

                  {completedStatuses.includes(result.status) && (
                    <div className="rounded-xl border border-green-200 bg-green-50 p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-green-900">Teslimat tamamlandı</p>
                          <p className="mt-1 text-sm text-green-800">
                            Teslim tarihi: {formatDate(result.delivery_date)}{result.delivered_to ? ` · Teslim alan: ${result.delivered_to}` : ""}
                          </p>
                        </div>
                        {result.delivery_proof_url && (
                          <Button type="button" onClick={() => void openDeliveryProof()} className="bg-green-700 hover:bg-green-800" disabled={documentLoading}>
                            {documentLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileCheck2 className="mr-2 h-4 w-4" />}
                            Teslim Evrakını Görüntüle
                          </Button>
                        )}
                      </div>
                      {documentError && <p className="mt-3 text-sm text-red-700">{documentError}</p>}
                    </div>
                  )}

                  <p className="text-center text-xs text-slate-500">
                    Bilgiler sevkiyat sistemiyle canlı bağlantılıdır. Son güncelleme: {formatDate(result.updated_at, true)}
                  </p>
                </div>
              )}

              {!searched && !result && (
                <div className="mt-6 text-center text-sm text-muted-foreground">
                  <p>Takip numaranızı bulamıyor musunuz? <a href="tel:+905434010755" className="text-primary hover:underline">0543 401 07 55</a> numaralı hattan bize ulaşabilirsiniz.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
