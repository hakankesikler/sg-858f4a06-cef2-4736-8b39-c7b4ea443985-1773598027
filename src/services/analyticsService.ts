import { supabase } from "@/integrations/supabase/client";

export type VisitStats = any;
export type DailyStats = any;
export type ReferrerStats = any;

interface VisitorInfo {
  page_url: string;
  page_title?: string;
  referrer?: string;
}

function sanitizePageUrl(value: string): string {
  const route = (value || "/").split(/[?#]/, 1)[0];
  return route.startsWith("/") ? route.slice(0, 500) || "/" : "/";
}

function sanitizeReferrer(value: string): string {
  if (!value) return "";
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`.slice(0, 500);
  } catch {
    return "";
  }
}

// Generate or get visitor ID
function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') {
    return '00000000-0000-0000-0000-000000000000'; // Fallback for SSR
  }
  
  let visitorId = localStorage.getItem('rex_visitor_id');
  if (!visitorId) {
    // Generate UUID v4
    visitorId = crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    localStorage.setItem('rex_visitor_id', visitorId);
  }
  return visitorId;
}

// Track through the same-origin server route so geographic headers cannot be spoofed.
export async function trackPageVisit(visitorInfo: VisitorInfo) {
  try {
    const visitorId = getOrCreateVisitorId();
    const response = await fetch("/api/analytics/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        visitorId,
        pageUrl: sanitizePageUrl(visitorInfo.page_url),
        pageTitle: (visitorInfo.page_title || document.title).slice(0, 300),
        referrer: sanitizeReferrer(visitorInfo.referrer || document.referrer),
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    });
    if (!response.ok) console.error("Error tracking visit:", response.status);
  } catch (error) {
    console.error("Error in trackPageVisit:", error);
    // Even if everything fails, don't throw - just log
  }
}

// Get real-time active visitors (last 5 minutes)
export async function getActiveVisitors() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("website_visits")
    .select("id")
    .gte("visited_at", fiveMinutesAgo);

  if (error) {
    console.error("Error fetching active visitors:", error);
    return 0;
  }

  return data?.length || 0;
}

// Get daily statistics for a date range
export async function getDailyStats(startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from("daily_visit_stats" as any)
    .select("*")
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true });

  if (error) {
    console.error("Error fetching daily stats:", error);
    return [];
  }

  return data || [];
}

// Get top pages
export async function getTopPages(limit: number = 10, days: number = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("website_visits")
    .select("page_url, page_title")
    .gte("visited_at", startDate);

  if (error) {
    console.error("Error fetching top pages:", error);
    return [];
  }

  // Count page visits
  const pageCounts = (data || []).reduce((acc: Record<string, { url: string; title: string; count: number }>, visit) => {
    const key = (visit.page_url || "/").split(/[?#]/)[0];
    if (!acc[key]) {
      acc[key] = { url: key, title: visit.page_title || "", count: 0 };
    }
    acc[key].count++;
    return acc;
  }, {});

  return Object.values(pageCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// Get top referrers
export async function getTopReferrers(limit: number = 10) {
  const { data, error } = await supabase
    .from("referrer_stats" as any)
    .select("*")
    .order("visit_count", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching top referrers:", error);
    return [];
  }

  return data || [];
}

// Get device statistics
export async function getDeviceStats(days: number = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("website_visits")
    .select("device_type")
    .gte("visited_at", startDate);

  if (error) {
    console.error("Error fetching device stats:", error);
    return { desktop: 0, mobile: 0, tablet: 0 };
  }

  const stats = (data || []).reduce((acc: Record<string, number>, visit) => {
    const device = visit.device_type || "desktop";
    acc[device] = (acc[device] || 0) + 1;
    return acc;
  }, {});

  return {
    desktop: stats.desktop || 0,
    mobile: stats.mobile || 0,
    tablet: stats.tablet || 0,
  };
}

// Get location statistics
export async function getLocationStats(days: number = 30, limit: number = 10) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("website_visits")
    .select("country, city, region")
    .gte("visited_at", startDate)
    .not("country", "is", null);

  if (error) {
    console.error("Error fetching location stats:", error);
    return [];
  }

  // Count by location
  const locationCounts = (data || []).reduce((acc: Record<string, { country: string; city: string; region: string; count: number }>, visit) => {
    const key = `${visit.country}-${visit.region}-${visit.city}`;
    if (!acc[key]) {
      acc[key] = { country: visit.country || "", city: visit.city || "", region: visit.region || "", count: 0 };
    }
    acc[key].count++;
    return acc;
  }, {});

  return Object.values(locationCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// Get total visits count
export async function getTotalVisits(days?: number) {
  let query = supabase.from("website_visits").select("id", { count: "exact", head: true });

  if (days) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte("visited_at", startDate);
  }

  const { count, error } = await query;

  if (error) {
    console.error("Error fetching total visits:", error);
    return 0;
  }

  return count || 0;
}

// Get unique visitors count
export async function getUniqueVisitors(days: number = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("website_visits")
    .select("visitor_id")
    .gte("visited_at", startDate)
    .not("visitor_id", "is", null);

  if (error) {
    console.error("Error fetching unique visitors:", error);
    return 0;
  }

  const uniqueVisitors = new Set((data || []).map(v => v.visitor_id));
  return uniqueVisitors.size;
}

async function getBreakdown(
  column: "browser" | "os" | "language",
  days: number,
  limit: number,
) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("website_visits")
    .select(column)
    .gte("visited_at", startDate)
    .not(column, "is", null);

  if (error) {
    console.error(`Error fetching ${column} stats:`, error);
    return [];
  }

  const counts = (data || []).reduce((acc: Record<string, number>, visit: Record<string, unknown>) => {
    const value = typeof visit[column] === "string" && visit[column] ? visit[column] : "Bilinmiyor";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export const getBrowserStats = (days = 30, limit = 8) => getBreakdown("browser", days, limit);
export const getOsStats = (days = 30, limit = 8) => getBreakdown("os", days, limit);
export const getLanguageStats = (days = 30, limit = 8) => getBreakdown("language", days, limit);
