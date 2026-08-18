-- Complete two legacy tables that existed in the managed source project but
-- were missing from the checked-in migration history.

CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  company_name text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  service_type text NOT NULL,
  origin text,
  destination text,
  cargo_type text,
  weight text,
  volume text,
  package_count text,
  pickup_date date,
  delivery_date date,
  special_requirements text,
  message text,
  status text DEFAULT 'yeni',
  assigned_to uuid,
  priority text DEFAULT 'normal',
  source text DEFAULT 'website',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  converted_to_customer boolean DEFAULT false,
  converted_at timestamptz,
  notes text
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rex_select ON public.leads;
DROP POLICY IF EXISTS rex_write ON public.leads;
CREATE POLICY rex_select ON public.leads
  FOR SELECT TO authenticated
  USING (public.rex_has_role(ARRAY['admin','operations','accounting']));
CREATE POLICY rex_write ON public.leads
  FOR ALL TO authenticated
  USING (public.rex_has_role(ARRAY['admin','operations','accounting']))
  WITH CHECK (public.rex_has_role(ARRAY['admin','operations','accounting']));

DROP POLICY IF EXISTS rex_profiles_select ON public.profiles;
DROP POLICY IF EXISTS rex_profiles_update ON public.profiles;
CREATE POLICY rex_profiles_select ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.rex_has_role(ARRAY['admin']));
CREATE POLICY rex_profiles_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.rex_has_role(ARRAY['admin']))
  WITH CHECK (id = auth.uid() OR public.rex_has_role(ARRAY['admin']));
