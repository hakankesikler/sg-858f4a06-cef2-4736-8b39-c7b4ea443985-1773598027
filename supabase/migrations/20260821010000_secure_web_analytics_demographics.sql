BEGIN;

ALTER TABLE public.website_visits
  ADD COLUMN IF NOT EXISTS language text,
  ADD COLUMN IF NOT EXISTS timezone text;

-- Previously the hash fragment could contain Supabase access tokens. Analytics
-- only needs a route, never a query string or fragment, so clean historical data.
UPDATE public.website_visits
SET page_url = left(
      coalesce(nullif(split_part(split_part(coalesce(page_url, '/'), '?', 1), '#', 1), ''), '/'),
      500
    ),
    referrer = CASE
      WHEN nullif(trim(coalesce(referrer, '')), '') IS NULL THEN NULL
      ELSE left(split_part(split_part(referrer, '?', 1), '#', 1), 500)
    END
WHERE page_url LIKE '%?%'
   OR page_url LIKE '%#%'
   OR referrer LIKE '%?%'
   OR referrer LIKE '%#%';

-- The browser no longer writes analytics directly. Geographic headers are
-- accepted only from the trusted server route using the service role.
REVOKE ALL ON FUNCTION public.rex_record_visit(uuid,text,text,text,text,text)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.rex_record_visit_secure(
  p_visitor_id uuid,
  p_page_url text,
  p_page_title text DEFAULT NULL,
  p_referrer text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_device_type text DEFAULT 'desktop',
  p_country text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_region text DEFAULT NULL,
  p_browser text DEFAULT NULL,
  p_os text DEFAULT NULL,
  p_screen_resolution text DEFAULT NULL,
  p_language text DEFAULT NULL,
  p_timezone text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  normalized_url text := left(
    coalesce(nullif(split_part(split_part(coalesce(p_page_url, '/'), '?', 1), '#', 1), ''), '/'),
    500
  );
  normalized_referrer text := CASE
    WHEN nullif(trim(coalesce(p_referrer, '')), '') IS NULL THEN NULL
    ELSE left(split_part(split_part(p_referrer, '?', 1), '#', 1), 500)
  END;
  new_visitor boolean;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Web analitik kaydı yalnızca güvenilir sunucu üzerinden yapılabilir';
  END IF;

  IF p_visitor_id IS NULL OR p_device_type NOT IN ('desktop','mobile','tablet') THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.website_visits
    WHERE visitor_id = p_visitor_id
      AND page_url = normalized_url
      AND visited_at > now() - interval '5 seconds'
  ) THEN
    RETURN;
  END IF;

  new_visitor := NOT EXISTS (
    SELECT 1 FROM public.website_visits WHERE visitor_id = p_visitor_id
  );

  INSERT INTO public.website_visits (
    visitor_id,
    page_url,
    page_title,
    referrer,
    user_agent,
    device_type,
    country,
    city,
    region,
    browser,
    os,
    screen_resolution,
    language,
    timezone,
    is_new_visitor,
    ip_address
  ) VALUES (
    p_visitor_id,
    normalized_url,
    left(coalesce(p_page_title, ''), 300),
    normalized_referrer,
    left(coalesce(p_user_agent, ''), 500),
    p_device_type,
    nullif(left(upper(trim(coalesce(p_country, ''))), 10), ''),
    nullif(left(trim(coalesce(p_city, '')), 120), ''),
    nullif(left(trim(coalesce(p_region, '')), 120), ''),
    nullif(left(trim(coalesce(p_browser, '')), 80), ''),
    nullif(left(trim(coalesce(p_os, '')), 80), ''),
    nullif(left(trim(coalesce(p_screen_resolution, '')), 30), ''),
    nullif(left(trim(coalesce(p_language, '')), 35), ''),
    nullif(left(trim(coalesce(p_timezone, '')), 80), ''),
    new_visitor,
    NULL
  );
END;
$$;

REVOKE ALL ON FUNCTION public.rex_record_visit_secure(
  uuid,text,text,text,text,text,text,text,text,text,text,text,text,text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rex_record_visit_secure(
  uuid,text,text,text,text,text,text,text,text,text,text,text,text,text
) TO service_role;

CREATE INDEX IF NOT EXISTS website_visits_city_idx
  ON public.website_visits(city) WHERE city IS NOT NULL;
CREATE INDEX IF NOT EXISTS website_visits_browser_idx
  ON public.website_visits(browser) WHERE browser IS NOT NULL;
CREATE INDEX IF NOT EXISTS website_visits_os_idx
  ON public.website_visits(os) WHERE os IS NOT NULL;

COMMIT;
