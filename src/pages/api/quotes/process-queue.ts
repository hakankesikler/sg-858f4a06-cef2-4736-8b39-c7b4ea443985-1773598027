import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { sendQuoteEmail, type StoredQuoteRequest } from "@/lib/quote-delivery";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Yalnızca GET ve POST desteklenir." });
  }

  const bearer = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : "";
  const cronSecret = process.env.CRON_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!cronSecret || bearer !== cronSecret) return res.status(401).json({ error: "Yetkisiz istek." });
  if (!supabaseUrl || !serviceKey) return res.status(503).json({ error: "Teklif teslimat servisi yapılandırılmamış." });

  const db = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const requestedLimit = Number(req.method === "POST" ? req.body?.limit : req.query.limit);
  const limit = Math.max(1, Math.min(Number.isFinite(requestedLimit) ? requestedLimit : 10, 20));
  const results: Array<{ id: string; success: boolean }> = [];

  for (let index = 0; index < limit; index += 1) {
    const { data, error } = await db.rpc("rex_claim_quote_delivery_job" as never);
    if (error) return res.status(500).json({ error: "Teklif kuyruğu okunamadı." });
    const quote = Array.isArray(data) ? data[0] as StoredQuoteRequest | undefined : undefined;
    if (!quote) break;

    try {
      const providerMessageId = await sendQuoteEmail(quote);
      await db.rpc("rex_record_quote_delivery_result" as never, {
        p_quote_request_id: quote.id,
        p_success: true,
        p_provider_message_id: providerMessageId,
        p_error: null,
      } as never);
      results.push({ id: quote.id, success: true });
    } catch (deliveryError) {
      await db.rpc("rex_record_quote_delivery_result" as never, {
        p_quote_request_id: quote.id,
        p_success: false,
        p_provider_message_id: null,
        p_error: deliveryError instanceof Error ? deliveryError.message : "Bilinmeyen teslimat hatası",
      } as never);
      results.push({ id: quote.id, success: false });
    }
  }

  return res.status(200).json({ success: true, processed: results.length, results });
}
