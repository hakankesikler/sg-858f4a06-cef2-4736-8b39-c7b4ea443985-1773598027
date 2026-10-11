import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { parseConversionPayload } from "@/lib/conversion-payload";

export const config = { api: { bodyParser: { sizeLimit: "1kb" } } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).end(); }
  try {
    if (typeof req.headers.origin !== "string" || new URL(req.headers.origin).host !== req.headers.host) return res.status(403).end();
  } catch { return res.status(403).end(); }
  const body = parseConversionPayload(req.body);
  if (!body) return res.status(400).end();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return res.status(503).end();
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await db.from("website_conversion_events").upsert({ id: body.eventId, page_path: body.page, event_name: body.event, source_category: body.source }, { onConflict: "id", ignoreDuplicates: true });
  if (error) { console.error("Conversion recording failed", error.code); return res.status(503).end(); }
  return res.status(204).end();
}
