import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Copy, ExternalLink, FileText, Loader2, MapPin, Package, Search, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { publicTrackingService, type PublicTrackingResult } from "@/services/publicTrackingService";

interface TrackingSectionProps {
  initialTrackingNumber?: string;
  autoSearch?: boolean;
  locale?: "tr" | "en";
}

const completedStatuses = ["teslim_edildi", "Teslim Edildi"];

function statusLabel(status?: string | null, locale: "tr" | "en" = "tr") {
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
  const englishLabels: Record<string, string> = {
    atama_bekliyor: "Waiting for Driver Assignment", beklemede: "Ready for Transport", hazirlaniyor: "Preparing", hazırlanıyor: "Preparing", yolda: "In Transit", teslim_edildi: "Delivered", "Teslim Edildi": "Delivered", iptal: "Cancelled", "İptal": "Cancelled",
  };
  return (locale === "en" ? englishLabels : labels)[status || ""] || status || (locale === "en" ? "Shipment Registered" : "Kayıt Alındı");
}

function formatDate(value?: string | null, includeTime = false, locale: "tr" | "en" = "tr") {
  if (!value) return locale === "en" ? "Pending" : "Bekleniyor";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return locale === "en" ? "Pending" : "Bekleniyor";
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "tr-TR", {
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

function expressStatusRank(status?: string | null) {
  const normalized = (status || "").toLocaleUpperCase("tr-TR");
  if (normalized.includes("TESLİM")) return 5;
  if (normalized.includes("DAĞITIMDA")) return 4;
  if (normalized.includes("DAĞITIM MERKEZ")) return 3;
  if (normalized.includes("GÜMRÜK")) return 2;
  if (normalized.includes("ÇIKIŞ")) return 1;
  return 0;
}

export function TrackingSection({ initialTrackingNumber = "", autoSearch = false, locale = "tr" }: TrackingSectionProps) {
  const english = locale === "en";
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber);
  const [result, setResult] = useState<PublicTrackingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [expiredDeliveryDocumentDeadline, setExpiredDeliveryDocumentDeadline] = useState<string | null>(null);
  const { toast } = useToast();

  const lookup = useCallback(async (number: string, silent = false) => {
    const normalized = publicTrackingService.normalize(number);
    if (!normalized) {
      setError(english ? "Enter your tracking number." : "Takip numaranızı yazın.");
      return;
    }

    if (!silent) setLoading(true);
    setError("");
    try {
      const shipment = await publicTrackingService.track(normalized);
      setResult(shipment);
      setSearched(true);
      if (!shipment) setError(english ? "No shipment matched this tracking number." : "Bu takip numarasıyla eşleşen gönderi bulunamadı.");
    } catch (lookupError: any) {
      if (!silent) {
        setError(lookupError?.message || (english ? "Tracking information is temporarily unavailable." : "Takip bilgileri şu anda alınamıyor."));
        setResult(null);
        setSearched(true);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [english]);

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

  const deliveryDocumentDeadline = result?.delivery_document_available_until || null;
  useEffect(() => {
    if (!deliveryDocumentDeadline) return;
    const remaining = new Date(deliveryDocumentDeadline).getTime() - Date.now();
    if (!Number.isFinite(remaining) || remaining <= 0) return;
    const timer = window.setTimeout(
      () => setExpiredDeliveryDocumentDeadline(deliveryDocumentDeadline),
      Math.min(remaining + 250, 2_147_483_647),
    );
    return () => window.clearTimeout(timer);
  }, [deliveryDocumentDeadline]);

  const stages = useMemo(() => {
    const events = result?.events || [];
    const eventDate = (statuses: string[]) => events.find((event) => statuses.includes(event.new_status || ""))?.event_at;
    if (result?.service_mode === "international_express") {
      const carrierDate = result.carrier_last_synced_at || result.updated_at;
      return [
        { label: english ? "Shipment Created" : "Gönderi Oluşturuldu", date: result.created_at, icon: Package },
        { label: english ? "At Origin" : "Çıkış Noktasında", date: carrierDate, icon: CheckCircle },
        { label: english ? "At Customs" : "Gümrükte", date: carrierDate, icon: Package },
        { label: english ? "At Distribution Centre" : "Dağıtım Merkezinde", date: carrierDate, icon: Truck },
        { label: english ? "Out for Delivery" : "Dağıtımda", date: carrierDate, icon: Truck },
        { label: english ? "Delivered" : "Teslim Edildi", date: result.delivery_date || carrierDate, icon: MapPin },
      ];
    }
    return [
      { label: english ? "Shipment Registered" : "Kayıt Alındı", date: result?.created_at, icon: Package },
      { label: english ? "Ready for Transport" : "Taşımaya Hazır", date: eventDate(["beklemede", "hazirlaniyor", "hazırlanıyor", "Hazırlanıyor"]), icon: CheckCircle },
      { label: english ? "In Transit" : "Yolda", date: eventDate(["yolda", "Yolda"]), icon: Truck },
      { label: english ? "Delivered" : "Teslim Edildi", date: result?.delivery_date || eventDate(completedStatuses), icon: MapPin },
    ];
  }, [english, result]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void lookup(trackingNumber);
  };

  const copyTrackingLink = async () => {
    if (!result?.tracking_number) return;
    const url = `${window.location.origin}/takip/${encodeURIComponent(result.tracking_number)}`;
    await navigator.clipboard.writeText(url);
    toast({ title: english ? "Link copied" : "Bağlantı kopyalandı", description: english ? "You can share the tracking link with your customer." : "Takip bağlantısını müşterinizle paylaşabilirsiniz." });
  };

  const currentRank = result?.service_mode === "international_express"
    ? expressStatusRank(result.carrier_status || result.status)
    : statusRank(result?.status);
  const cancelled = ["iptal", "İptal"].includes(result?.status || "");
  const deliveryDocumentAvailable = Boolean(
    deliveryDocumentDeadline &&
    expiredDeliveryDocumentDeadline !== deliveryDocumentDeadline &&
    new Date(deliveryDocumentDeadline).getTime() > Date.now(),
  );

  return (
    <section id={english ? "tracking" : "takip"} className="py-20 bg-slate-50/60 scroll-mt-24">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-heading font-bold text-4xl text-navy mb-4">{english ? "Track Your Shipment" : "Gönderinizi Takip Edin"}</h2>
            <p className="text-muted-foreground text-lg">
              {english ? "Use your REX tracking number or the AWB number of a supported carrier to view the current status of your shipment." : "REX takip numaranız veya desteklenen taşıyıcılara ait AWB numaranızla gönderinizin güncel durumunu görüntüleyin."}
            </p>
          </div>

          <Card className="border-2 shadow-xl">
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={english ? "Enter REX tracking number or AWB" : "REX takip numarası veya AWB girin"}
                    value={trackingNumber}
                    onChange={(event) => setTrackingNumber(event.target.value.toUpperCase())}
                    className="pl-10 h-12 font-mono"
                    autoComplete="off"
                  />
                </div>
                <Button type="submit" size="lg" className="bg-gradient-accent hover:opacity-90 h-12 px-8" disabled={loading}>
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : english ? "Track" : "Sorgula"}
                </Button>
              </form>

              <p className="mt-4 text-center text-sm leading-relaxed text-muted-foreground">
                {english ? "Supported carriers: FedEx • UPS • DHL • TNT • Aramex" : "Desteklenen taşıyıcılar: FedEx • UPS • DHL • TNT • Aramex"}
              </p>

              {error && <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

              {result && (
                <div className="mt-8 space-y-6">
                  <div className="flex flex-col gap-4 rounded-xl border bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500">{english ? "Tracking Number" : "Takip Numarası"}</p>
                      <p className="mt-1 font-mono text-lg font-bold text-navy">{result.tracking_number}</p>
                      <p className="mt-1 text-sm text-slate-500">{english ? "Shipment" : "Sevkiyat"}: {result.shipment_code}</p>
                      {result.service_mode === "international_express" && (
                        <div className="mt-3 space-y-1 text-sm text-slate-600">
                          <p><span className="font-semibold">{english ? "Carrier" : "Taşıyıcı"}:</span> {result.express_carrier || (english ? "Awaiting assignment" : "Atama bekliyor")}</p>
                          {result.awb_number && <p><span className="font-semibold">AWB:</span> <span className="font-mono">{result.awb_number}</span></p>}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`rounded-full px-3 py-1.5 text-sm font-semibold ${cancelled ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-800"}`}>
                        {statusLabel(result.status, locale)}
                      </span>
                      <Button type="button" variant="outline" size="sm" onClick={() => void copyTrackingLink()}>
                        <Copy className="mr-2 h-4 w-4" /> {english ? "Copy Link" : "Bağlantıyı Kopyala"}
                      </Button>
                      {result.carrier_tracking_url && (
                        <Button type="button" variant="outline" size="sm" asChild>
                          <a href={result.carrier_tracking_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" /> {english ? "Live Carrier Tracking" : "Taşıyıcıda Canlı Takip"}
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 rounded-xl bg-slate-900 p-5 text-white sm:grid-cols-2">
                    <div><p className="text-xs text-slate-400">{english ? "Sender" : "Gönderici"}</p><p className="mt-1 font-semibold">{result.sender_masked || "—"}</p></div>
                    <div><p className="text-xs text-slate-400">{english ? "Receiver" : "Alıcı"}</p><p className="mt-1 font-semibold">{result.receiver_masked || "—"}</p></div>
                    <div><p className="text-xs text-slate-400">{english ? "Origin" : "Çıkış"}</p><p className="mt-1 font-semibold">{result.origin || "—"}</p></div>
                    <div><p className="text-xs text-slate-400">{english ? "Destination" : "Varış"}</p><p className="mt-1 font-semibold">{result.destination || "—"}</p></div>
                    <div><p className="text-xs text-slate-400">{english ? "Collection Date" : "Yükleme Tarihi"}</p><p className="mt-1 font-semibold">{formatDate(result.pickup_date, false, locale)}</p></div>
                    <div><p className="text-xs text-slate-400">{english ? "Estimated Delivery" : "Tahmini Teslim"}</p><p className="mt-1 font-semibold">{formatDate(result.estimated_delivery_date, false, locale)}</p></div>
                    {result.service_mode === "international_express" && <>
                      <div><p className="text-xs text-slate-400">Gönderi Türü</p><p className="mt-1 font-semibold">{result.package_type === "document" ? "Dosya" : "Paket"}</p></div>
                      <div><p className="text-xs text-slate-400">Ülke Rotası</p><p className="mt-1 font-semibold">{result.origin_country_code || "—"} → {result.destination_country_code || "—"}</p></div>
                    </>}
                  </div>

                  {result.service_mode === "international_express" && result.carrier_status && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-900">
                      <p className="font-semibold">Taşıyıcı durumu: {result.carrier_status}</p>
                      {result.carrier_status_description && <p className="mt-1">{result.carrier_status_description}</p>}
                      <p className="mt-2 text-xs text-blue-700">Son taşıyıcı güncellemesi: {formatDate(result.carrier_last_synced_at, true)}</p>
                    </div>
                  )}

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
                            <p className="mt-1 text-xs text-slate-500">{active ? formatDate(stage.date, true, locale) : english ? "Pending" : "Bekleniyor"}</p>
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
                            Teslim tarihi: {formatDate(result.delivery_date)}
                          </p>
                          {result.delivered_to_masked && (
                            <p className="mt-1 text-sm text-green-800">Teslim alan: {result.delivered_to_masked}</p>
                          )}
                        </div>
                        {deliveryDocumentAvailable && (
                          <Button type="button" className="bg-green-700 hover:bg-green-800" asChild>
                            <a
                              href={`/api/tracking/delivery-document?tracking=${encodeURIComponent(result.tracking_number)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <FileText className="mr-2 h-4 w-4" /> Teslim Evrakını Görüntüle
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  <p className="text-center text-xs text-slate-500">
                    Bilgiler sevkiyat sistemiyle canlı bağlantılıdır. Son güncelleme: {formatDate(result.updated_at, true)}
                  </p>
                </div>
              )}

              {!searched && !result && (
                <div className="mt-6 text-center text-sm text-muted-foreground">
                  <p>{english ? "Can’t find your tracking number?" : "Takip numaranızı bulamıyor musunuz?"} <a href="tel:+905434010755" className="text-primary hover:underline">0543 401 07 55</a> {english ? "can help." : "numaralı hattan bize ulaşabilirsiniz."}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
