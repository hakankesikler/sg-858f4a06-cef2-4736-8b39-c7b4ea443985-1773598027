import { supabase } from "@/integrations/supabase/client";

export type VisitStats = any;
export type DailyStats = any;
export type ReferrerStats = any;

interface VisitorInfo {
  page_url: string;
  page_title?: string;
  referrer?: string;
  user_agent?: string;
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

// Track a page visit
export async function trackPageVisit(visitorInfo: VisitorInfo) {
  try {
    const deviceType = getDeviceType(visitorInfo.user_agent || navigator.userAgent);
    const visitorId = getOrCreateVisitorId();
    
    // Get location asynchronously without blocking
    let location: { ip?: string; country?: string; city?: string } = {};
    try {
      location = await Promise.race([
        getVisitorLocation(),
        new Promise<{ ip?: string; country?: string; city?: string }>((resolve) => 
          setTimeout(() => resolve({}), 2000) // 2 second timeout
        )
      ]);
    } catch {
      // Ignore location errors
    }

    const { error } = await supabase.from("website_visits").insert({
      visitor_id: visitorId,
      page_url: visitorInfo.page_url,
      page_title: visitorInfo.page_title || document.title,
      referrer: visitorInfo.referrer || document.referrer,
      user_agent: visitorInfo.user_agent || navigator.userAgent,
      device_type: deviceType,
      ip_address: location.ip,
      country: location.country,
      city: location.city,
    } as any);

    if (error) throw error;
  } catch (error) {
    console.error("Error tracking visit:", error);
  }
}

// Get device type from user agent
function getDeviceType(userAgent: string): "desktop" | "mobile" | "tablet" {
  const ua = userAgent.toLowerCase();
  
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return "tablet";
  }
  
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return "mobile";
  }
  
  return "desktop";
}

// Get visitor location (using a free IP geolocation API)
async function getVisitorLocation(): Promise<{ ip?: string; country?: string; city?: string }> {
  try {
    const response = await fetch("https://ipapi.co/json/");
    if (!response.ok) return {};
    
    const data = await response.json();
    return {
      ip: data.ip,
      country: data.country_name,
      city: data.city,
    };
  } catch (error) {
    console.error("Error getting location:", error);
    return {};
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
    const key = visit.page_url;
    if (!acc[key]) {
      acc[key] = { url: visit.page_url, title: visit.page_title || "", count: 0 };
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
    .select("country, city")
    .gte("visited_at", startDate)
    .not("country", "is", null);

  if (error) {
    console.error("Error fetching location stats:", error);
    return [];
  }

  // Count by location
  const locationCounts = (data || []).reduce((acc: Record<string, { country: string; city: string; count: number }>, visit) => {
    const key = `${visit.country}-${visit.city}`;
    if (!acc[key]) {
      acc[key] = { country: visit.country || "", city: visit.city || "", count: 0 };
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
    .select("ip_address")
    .gte("visited_at", startDate)
    .not("ip_address", "is", null);

  if (error) {
    console.error("Error fetching unique visitors:", error);
    return 0;
  }

  const uniqueIPs = new Set((data || []).map(v => v.ip_address));
  return uniqueIPs.size;
}