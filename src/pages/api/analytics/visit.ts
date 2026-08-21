import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

type VisitBody = {
  visitorId?: unknown;
  pageUrl?: unknown;
  pageTitle?: unknown;
  referrer?: unknown;
  screenResolution?: unknown;
  language?: unknown;
  timezone?: unknown;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function header(req: NextApiRequest, name: string): string {
  const value = req.headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function decodeGeo(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, " ")).slice(0, 120);
  } catch {
    return value.slice(0, 120);
  }
}

function sameOrigin(req: NextApiRequest): boolean {
  const origin = header(req, "origin") || header(req, "referer");
  const host = header(req, "host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: "4kb" } },
};

function deviceFromUserAgent(userAgent: string): "desktop" | "mobile" | "tablet" {
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) return "tablet";
  if (/mobile|android|iphone|ipod|iemobile|blackberry|opera mini/i.test(userAgent)) return "mobile";
  return "desktop";
}

function browserFromUserAgent(userAgent: string): string {
  if (/Edg\//i.test(userAgent)) return "Microsoft Edge";
  if (/OPR\//i.test(userAgent)) return "Opera";
  if (/SamsungBrowser\//i.test(userAgent)) return "Samsung Internet";
  if (/Firefox\//i.test(userAgent)) return "Firefox";
  if (/Chrome\//i.test(userAgent) || /CriOS\//i.test(userAgent)) return "Google Chrome";
  if (/Safari\//i.test(userAgent)) return "Safari";
  return "Diğer";
}

function osFromUserAgent(userAgent: string): string {
  if (/Windows NT/i.test(userAgent)) return "Windows";
  if (/Android/i.test(userAgent)) return "Android";
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "iOS / iPadOS";
  if (/Mac OS X/i.test(userAgent)) return "macOS";
  if (/CrOS/i.test(userAgent)) return "ChromeOS";
  if (/Linux/i.test(userAgent)) return "Linux";
  return "Diğer";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Yalnızca POST desteklenir." });
  if (!sameOrigin(req)) return res.status(403).json({ error: "Geçersiz istek kaynağı." });

  const body = (req.body || {}) as VisitBody;
  const visitorId = text(body.visitorId, 36);
  if (!UUID_PATTERN.test(visitorId)) return res.status(400).json({ error: "Ziyaretçi kimliği geçersiz." });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return res.status(503).json({ error: "Analitik servisi yapılandırılmamış." });

  const userAgent = text(header(req, "user-agent"), 500);
  const adminDb = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await adminDb.rpc("rex_record_visit_secure" as never, {
    p_visitor_id: visitorId,
    p_page_url: text(body.pageUrl, 500) || "/",
    p_page_title: text(body.pageTitle, 300),
    p_referrer: text(body.referrer, 500),
    p_user_agent: userAgent,
    p_device_type: deviceFromUserAgent(userAgent),
    p_country: text(header(req, "x-vercel-ip-country"), 10),
    p_city: decodeGeo(header(req, "x-vercel-ip-city")),
    p_region: decodeGeo(header(req, "x-vercel-ip-country-region")),
    p_browser: browserFromUserAgent(userAgent),
    p_os: osFromUserAgent(userAgent),
    p_screen_resolution: text(body.screenResolution, 30),
    p_language: text(body.language, 35),
    p_timezone: text(body.timezone, 80),
  } as never);

  if (error) {
    console.error("Analytics visit could not be recorded:", error.message);
    return res.status(500).json({ error: "Ziyaret kaydedilemedi." });
  }

  return res.status(204).end();
}
