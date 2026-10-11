export const CONVERSION_PAGE = "/izmir-parsiyel-tasimacilik";
export const CONVERSION_EVENTS = ["quote_open", "whatsapp_click", "quote_whatsapp_click"] as const;
export const CONVERSION_SOURCES = ["google_referral", "bing_referral", "other_referral", "direct_or_unknown"] as const;
export type ConversionEvent = typeof CONVERSION_EVENTS[number];
export type ConversionSource = typeof CONVERSION_SOURCES[number];
export type ConversionPayload = { eventId: string; page: typeof CONVERSION_PAGE; event: ConversionEvent; source: ConversionSource };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseConversionPayload(value: unknown): ConversionPayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  if (Object.keys(body).some(key => !["eventId", "page", "event", "source"].includes(key))) return null;
  if (typeof body.eventId !== "string" || !UUID.test(body.eventId) || body.page !== CONVERSION_PAGE) return null;
  if (!CONVERSION_EVENTS.includes(body.event as ConversionEvent) || !CONVERSION_SOURCES.includes(body.source as ConversionSource)) return null;
  return { eventId: body.eventId, page: CONVERSION_PAGE, event: body.event as ConversionEvent, source: body.source as ConversionSource };
}

export function referralSource(referrer: string): ConversionSource {
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (/^(www\.)?google\.(com|com\.tr|co\.uk|de|fr)$/.test(host)) return "google_referral";
    if (host === "bing.com" || host === "www.bing.com") return "bing_referral";
    if (host === "rexlojistik.com" || host === "www.rexlojistik.com") return "direct_or_unknown";
    return "other_referral";
  } catch { return "direct_or_unknown"; }
}
