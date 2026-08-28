import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const config = { api: { bodyParser: false } };

const header = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] || "" : value || "";
async function rawBody(req: NextApiRequest) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Desteklenmeyen işlem." });
  const apiKey = process.env.RESEND_API_KEY;
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!apiKey || !webhookSecret || !url || !serviceKey) return res.status(503).json({ error: "Webhook yapılandırılmamış." });
  try {
    const payload = await rawBody(req);
    const resend = new Resend(apiKey);
    const event = resend.webhooks.verify({
      payload,
      headers: { id: header(req.headers["svix-id"]), timestamp: header(req.headers["svix-timestamp"]), signature: header(req.headers["svix-signature"]) },
      webhookSecret,
    }) as { type: string; created_at: string; data: { email_id?: string } };
    if (!event.data?.email_id) return res.status(200).json({ received: true, ignored: true });
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error } = await admin.rpc("rex_crm_record_email_event" as never, {
      p_event_id: header(req.headers["svix-id"]), p_provider_id: event.data.email_id, p_type: event.type,
      p_event_at: event.created_at, p_payload: event,
    } as never);
    if (error) throw error;
    return res.status(200).json({ received: true });
  } catch {
    return res.status(400).json({ error: "Geçersiz webhook imzası veya olay verisi." });
  }
}
