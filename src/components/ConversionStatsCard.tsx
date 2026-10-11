import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type CountRow = { event_name: string; source_category: string; event_count: number };
const events = [
  ["quote_open", "Teklif formunu açma"],
  ["whatsapp_click", "Doğrudan WhatsApp tıklaması"],
  ["quote_whatsapp_click", "Teklif formundan WhatsApp'a geçiş"],
] as const;

export function ConversionStatsCard({ days }: { days: number }) {
  const [rows, setRows] = useState<CountRow[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    const db = supabase as unknown as SupabaseClient;
    void Promise.resolve(db.rpc("rex_conversion_counts", { p_days: days })).then(({ data, error }) => {
      if (cancelled) return;
      if (error) { setStatus("error"); return; }
      setRows((data || []) as CountRow[]);
      setStatus("ready");
    }).catch(() => { if (!cancelled) setStatus("error"); });
    return () => { cancelled = true; };
  }, [days, refresh]);
  return (
    <Card>
      <CardHeader>
        <CardTitle>İzmir Parsiyel — Teklif ve WhatsApp</CardTitle>
        <CardDescription>Son {days} günün tıklamaları. Ölçüm 11 Ekim 2026'da başladı.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === "loading" ? <p>Yükleniyor...</p> : status === "error" ? (
          <p role="alert">Rapor alınamadı. Web analitik yetkinizi kontrol edin.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {events.map(([event, label]) => {
              const total = rows.filter(row => row.event_name === event).reduce((sum, row) => sum + Number(row.event_count), 0);
              const google = rows.filter(row => row.event_name === event && row.source_category === "google_referral").reduce((sum, row) => sum + Number(row.event_count), 0);
              return <div key={event} className="rounded-lg border p-4"><p className="text-sm">{label}</p><p className="text-2xl font-bold">{total.toLocaleString("tr-TR")}</p><p className="text-xs text-muted-foreground">Google yönlendirmesi: {google.toLocaleString("tr-TR")}</p></div>;
            })}
          </div>
        )}
        <p className="text-xs text-muted-foreground">Bu sayılar tıklamayı gösterir; gönderilmiş mesaj veya tamamlanmış teklif değildir. Google yönlendirmesi reklam ve organik trafiği ayırmaz. Form bilgileri kaydedilmez.</p>
        <button type="button" className="text-sm underline" onClick={() => setRefresh(value => value + 1)} disabled={status === "loading"}>Raporu yenile</button>
      </CardContent>
    </Card>
  );
}
