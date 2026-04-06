-- Website Analytics Tables
CREATE TABLE IF NOT EXISTS website_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Visitor Info
  visitor_id text NOT NULL, -- Cookie-based unique visitor ID
  ip_address text,
  user_agent text,
  
  -- Location Data
  country text,
  city text,
  region text,
  
  -- Visit Details
  page_url text NOT NULL,
  page_title text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  
  -- Device Info
  device_type text, -- Desktop, Mobile, Tablet
  browser text,
  os text,
  screen_resolution text,
  
  -- Session Info
  session_id text,
  is_new_visitor boolean DEFAULT true,
  session_duration integer, -- in seconds
  
  -- Engagement
  scroll_depth integer, -- percentage
  time_on_page integer, -- in seconds
  clicks_count integer DEFAULT 0,
  
  visited_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Daily Analytics Summary
CREATE TABLE IF NOT EXISTS daily_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  
  -- Visitor Metrics
  total_visits integer DEFAULT 0,
  unique_visitors integer DEFAULT 0,
  new_visitors integer DEFAULT 0,
  returning_visitors integer DEFAULT 0,
  
  -- Engagement Metrics
  avg_session_duration numeric(10,2) DEFAULT 0,
  avg_pages_per_session numeric(5,2) DEFAULT 0,
  bounce_rate numeric(5,2) DEFAULT 0,
  
  -- Traffic Sources
  direct_traffic integer DEFAULT 0,
  organic_traffic integer DEFAULT 0,
  social_traffic integer DEFAULT 0,
  referral_traffic integer DEFAULT 0,
  
  -- Device Breakdown
  desktop_visits integer DEFAULT 0,
  mobile_visits integer DEFAULT 0,
  tablet_visits integer DEFAULT 0,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Popular Pages Tracking
CREATE TABLE IF NOT EXISTS popular_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_url text NOT NULL,
  page_title text,
  
  -- Metrics
  total_views integer DEFAULT 0,
  unique_views integer DEFAULT 0,
  avg_time_on_page numeric(10,2) DEFAULT 0,
  
  last_updated timestamp with time zone DEFAULT now(),
  UNIQUE(page_url)
);

-- Traffic Sources Summary
CREATE TABLE IF NOT EXISTS traffic_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name text NOT NULL,
  source_type text NOT NULL, -- 'Direct', 'Organic', 'Social', 'Referral', 'Email', 'Campaign'
  
  -- Metrics
  total_visits integer DEFAULT 0,
  unique_visitors integer DEFAULT 0,
  
  last_updated timestamp with time zone DEFAULT now(),
  UNIQUE(source_name, source_type)
);

-- RLS Policies for Analytics Tables
ALTER TABLE website_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE popular_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_sources ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all analytics
CREATE POLICY "auth_view_visits" ON website_visits FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_view_daily" ON daily_analytics FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_view_pages" ON popular_pages FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_view_sources" ON traffic_sources FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow public insert for tracking (no auth required)
CREATE POLICY "public_insert_visits" ON website_visits FOR INSERT WITH CHECK (true);

-- Allow authenticated users to manage analytics data
CREATE POLICY "auth_insert_daily" ON daily_analytics FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_daily" ON daily_analytics FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth_insert_pages" ON popular_pages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_pages" ON popular_pages FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth_insert_sources" ON traffic_sources FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_sources" ON traffic_sources FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Indexes for Performance
CREATE INDEX idx_visits_date ON website_visits(visited_at DESC);
CREATE INDEX idx_visits_visitor ON website_visits(visitor_id);
CREATE INDEX idx_visits_page ON website_visits(page_url);
CREATE INDEX idx_visits_country ON website_visits(country);
CREATE INDEX idx_daily_date ON daily_analytics(date DESC);

-- Function to update daily analytics
CREATE OR REPLACE FUNCTION update_daily_analytics()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO daily_analytics (
    date,
    total_visits,
    unique_visitors,
    new_visitors,
    returning_visitors,
    avg_session_duration,
    direct_traffic,
    organic_traffic,
    social_traffic,
    referral_traffic,
    desktop_visits,
    mobile_visits,
    tablet_visits
  )
  SELECT
    CURRENT_DATE,
    COUNT(*),
    COUNT(DISTINCT visitor_id),
    COUNT(*) FILTER (WHERE is_new_visitor = true),
    COUNT(*) FILTER (WHERE is_new_visitor = false),
    AVG(COALESCE(session_duration, 0)),
    COUNT(*) FILTER (WHERE referrer IS NULL OR referrer = ''),
    COUNT(*) FILTER (WHERE referrer LIKE '%google%' OR referrer LIKE '%bing%'),
    COUNT(*) FILTER (WHERE referrer LIKE '%facebook%' OR referrer LIKE '%twitter%' OR referrer LIKE '%instagram%'),
    COUNT(*) FILTER (WHERE referrer IS NOT NULL AND referrer != '' AND referrer NOT LIKE '%google%' AND referrer NOT LIKE '%bing%' AND referrer NOT LIKE '%facebook%' AND referrer NOT LIKE '%twitter%'),
    COUNT(*) FILTER (WHERE device_type = 'Desktop'),
    COUNT(*) FILTER (WHERE device_type = 'Mobile'),
    COUNT(*) FILTER (WHERE device_type = 'Tablet')
  FROM website_visits
  WHERE DATE(visited_at) = CURRENT_DATE
  ON CONFLICT (date) DO UPDATE SET
    total_visits = EXCLUDED.total_visits,
    unique_visitors = EXCLUDED.unique_visitors,
    new_visitors = EXCLUDED.new_visitors,
    returning_visitors = EXCLUDED.returning_visitors,
    avg_session_duration = EXCLUDED.avg_session_duration,
    direct_traffic = EXCLUDED.direct_traffic,
    organic_traffic = EXCLUDED.organic_traffic,
    social_traffic = EXCLUDED.social_traffic,
    referral_traffic = EXCLUDED.referral_traffic,
    desktop_visits = EXCLUDED.desktop_visits,
    mobile_visits = EXCLUDED.mobile_visits,
    tablet_visits = EXCLUDED.tablet_visits,
    updated_at = now();
END;
$$;