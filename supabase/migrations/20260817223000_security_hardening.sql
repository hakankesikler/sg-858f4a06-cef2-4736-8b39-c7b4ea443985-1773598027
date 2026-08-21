-- Rex Portal security hardening
-- Keeps existing business data intact and replaces permissive policies with role-based access.

CREATE TABLE IF NOT EXISTS public.app_user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'sales', 'operations', 'accounting', 'hr', 'viewer', 'demo')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_user_roles ENABLE ROW LEVEL SECURITY;

INSERT INTO public.app_user_roles (user_id, email, role, active)
SELECT id, email, 'admin', true
FROM auth.users
WHERE lower(email) IN ('info@rexlojistik.com', 'admin@rexlojistik.com')
ON CONFLICT (user_id) DO UPDATE
SET email = EXCLUDED.email, role = EXCLUDED.role, active = true, updated_at = now();

INSERT INTO public.app_user_roles (user_id, email, role, active)
SELECT id, email, 'demo', true
FROM auth.users
WHERE lower(email) = 'demo@rexlojistik.com'
ON CONFLICT (user_id) DO UPDATE
SET email = EXCLUDED.email, role = EXCLUDED.role, active = true, updated_at = now();

CREATE OR REPLACE FUNCTION public.rex_has_role(required_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.app_user_roles
    WHERE user_id = auth.uid()
      AND active = true
      AND role = ANY(required_roles)
  );
$$;

REVOKE ALL ON FUNCTION public.rex_has_role(text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rex_has_role(text[]) TO authenticated;

DROP POLICY IF EXISTS "rex_roles_select" ON public.app_user_roles;
DROP POLICY IF EXISTS "rex_roles_admin_manage" ON public.app_user_roles;
CREATE POLICY "rex_roles_select" ON public.app_user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.rex_has_role(ARRAY['admin']));
CREATE POLICY "rex_roles_admin_manage" ON public.app_user_roles
  FOR ALL TO authenticated
  USING (public.rex_has_role(ARRAY['admin']))
  WITH CHECK (public.rex_has_role(ARRAY['admin']));

-- Remove every earlier policy from business tables before installing the access matrix.
DO $$
DECLARE
  table_name text;
  policy_record record;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'account_transactions','cari_cards','company_settings','customer_bank_accounts',
    'customer_drivers','customer_payments','customer_vehicles','customers',
    'daily_analytics','drivers','employee_accounts','employees','expenses',
    'financial_accounts','invoices','leads','leaves','partner_accounts','payments',
    'payroll','popular_pages','products_services','project_costs','projects',
    'purchase_items','purchases','sales_invoice_items','sales_invoices','settings',
    'shipment_cargo_items','shipments','traffic_sources','transactions','vehicles',
    'warehouses','website_visits'
  ] LOOP
    IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
      FOR policy_record IN
        SELECT policyname FROM pg_policies
        WHERE schemaname = 'public' AND tablename = table_name
      LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_record.policyname, table_name);
      END LOOP;
    END IF;
  END LOOP;
END $$;

DO $$
DECLARE
  table_name text;
BEGIN
  -- CRM: sales, operations and accounting staff need customer/cari records.
  FOREACH table_name IN ARRAY ARRAY['customers','cari_cards','customer_bank_accounts','customer_payments','leads'] LOOP
    IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
      EXECUTE format('CREATE POLICY rex_select ON public.%I FOR SELECT TO authenticated USING (public.rex_has_role(ARRAY[''admin'',''sales'',''operations'',''accounting'']))', table_name);
      EXECUTE format('CREATE POLICY rex_write ON public.%I FOR ALL TO authenticated USING (public.rex_has_role(ARRAY[''admin'',''sales'',''operations'',''accounting''])) WITH CHECK (public.rex_has_role(ARRAY[''admin'',''sales'',''operations'',''accounting'']))', table_name);
    END IF;
  END LOOP;

  -- Logistics.
  FOREACH table_name IN ARRAY ARRAY['customer_drivers','customer_vehicles','drivers','shipment_cargo_items','shipments','vehicles','warehouses'] LOOP
    IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
      EXECUTE format('CREATE POLICY rex_select ON public.%I FOR SELECT TO authenticated USING (public.rex_has_role(ARRAY[''admin'',''operations'']))', table_name);
      EXECUTE format('CREATE POLICY rex_write ON public.%I FOR ALL TO authenticated USING (public.rex_has_role(ARRAY[''admin'',''operations''])) WITH CHECK (public.rex_has_role(ARRAY[''admin'',''operations'']))', table_name);
    END IF;
  END LOOP;

  -- Accounting and finance.
  FOREACH table_name IN ARRAY ARRAY['account_transactions','employee_accounts','expenses','financial_accounts','invoices','partner_accounts','payments','purchase_items','purchases','sales_invoice_items','sales_invoices','transactions'] LOOP
    IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
      EXECUTE format('CREATE POLICY rex_select ON public.%I FOR SELECT TO authenticated USING (public.rex_has_role(ARRAY[''admin'',''accounting'']))', table_name);
      EXECUTE format('CREATE POLICY rex_write ON public.%I FOR ALL TO authenticated USING (public.rex_has_role(ARRAY[''admin'',''accounting''])) WITH CHECK (public.rex_has_role(ARRAY[''admin'',''accounting'']))', table_name);
    END IF;
  END LOOP;

  -- Human resources.
  FOREACH table_name IN ARRAY ARRAY['employees','leaves','payroll'] LOOP
    IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
      EXECUTE format('CREATE POLICY rex_select ON public.%I FOR SELECT TO authenticated USING (public.rex_has_role(ARRAY[''admin'',''hr'']))', table_name);
      EXECUTE format('CREATE POLICY rex_write ON public.%I FOR ALL TO authenticated USING (public.rex_has_role(ARRAY[''admin'',''hr''])) WITH CHECK (public.rex_has_role(ARRAY[''admin'',''hr'']))', table_name);
    END IF;
  END LOOP;

  -- Shared operations/finance planning.
  FOREACH table_name IN ARRAY ARRAY['products_services','project_costs','projects'] LOOP
    IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
      EXECUTE format('CREATE POLICY rex_select ON public.%I FOR SELECT TO authenticated USING (public.rex_has_role(ARRAY[''admin'',''operations'',''accounting'']))', table_name);
      EXECUTE format('CREATE POLICY rex_write ON public.%I FOR ALL TO authenticated USING (public.rex_has_role(ARRAY[''admin'',''operations'',''accounting''])) WITH CHECK (public.rex_has_role(ARRAY[''admin'',''operations'',''accounting'']))', table_name);
    END IF;
  END LOOP;

  -- Analytics can be viewed by staff, but only admins may alter aggregates.
  FOREACH table_name IN ARRAY ARRAY['website_visits','daily_analytics','popular_pages','traffic_sources'] LOOP
    IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
      EXECUTE format('CREATE POLICY rex_select ON public.%I FOR SELECT TO authenticated USING (public.rex_has_role(ARRAY[''admin'',''operations'',''viewer'']))', table_name);
      EXECUTE format('CREATE POLICY rex_write ON public.%I FOR ALL TO authenticated USING (public.rex_has_role(ARRAY[''admin''])) WITH CHECK (public.rex_has_role(ARRAY[''admin'']))', table_name);
    END IF;
  END LOOP;
END $$;

-- Personal settings stay private; company settings are admin-only.
CREATE POLICY "rex_settings_own" ON public.settings
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "rex_company_settings_admin" ON public.company_settings
  FOR ALL TO authenticated
  USING (public.rex_has_role(ARRAY['admin']))
  WITH CHECK (public.rex_has_role(ARRAY['admin']));

-- Anonymous traffic collection goes through a constrained RPC instead of direct table writes.
CREATE OR REPLACE FUNCTION public.rex_record_visit(
  p_visitor_id uuid,
  p_page_url text,
  p_page_title text DEFAULT NULL,
  p_referrer text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_device_type text DEFAULT 'desktop'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  normalized_url text := left(split_part(coalesce(p_page_url, '/'), '?', 1), 500);
BEGIN
  IF p_visitor_id IS NULL OR p_device_type NOT IN ('desktop','mobile','tablet') THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.website_visits
    WHERE visitor_id = p_visitor_id
      AND page_url = normalized_url
      AND visited_at > now() - interval '5 seconds'
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.website_visits (
    visitor_id, page_url, page_title, referrer, user_agent, device_type
  ) VALUES (
    p_visitor_id,
    normalized_url,
    left(coalesce(p_page_title, ''), 300),
    left(coalesce(p_referrer, ''), 500),
    left(coalesce(p_user_agent, ''), 500),
    p_device_type
  );
END;
$$;

REVOKE ALL ON FUNCTION public.rex_record_visit(uuid,text,text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rex_record_visit(uuid,text,text,text,text,text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.rex_dashboard_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT CASE
    WHEN public.rex_has_role(ARRAY['admin','sales','operations','accounting','hr','viewer','demo']) THEN
      jsonb_build_object(
        'totalShipments', (SELECT count(*) FROM public.shipments),
        'deliveredShipments', (SELECT count(*) FROM public.shipments WHERE status = 'teslim_edildi'),
        'activeShipments', (SELECT count(*) FROM public.shipments WHERE status IS DISTINCT FROM 'teslim_edildi'),
        'pendingShipments', (SELECT count(*) FROM public.shipments WHERE status IN ('beklemede','hazirlaniyor','hazırlanıyor')),
        'successRate', CASE
          WHEN (SELECT count(*) FROM public.shipments) = 0 THEN 0
          ELSE round(100.0 * (SELECT count(*) FROM public.shipments WHERE status = 'teslim_edildi') / (SELECT count(*) FROM public.shipments))
        END
      )
    ELSE '{}'::jsonb
  END;
$$;

REVOKE ALL ON FUNCTION public.rex_dashboard_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rex_dashboard_stats() TO authenticated;

-- Internal documents are no longer public. Existing objects remain untouched.
UPDATE storage.buckets
SET public = false
WHERE id IN ('driver-documents','vehicle-documents','shipment-documents');

DROP POLICY IF EXISTS "Public Access Driver Docs" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert Driver Docs" ON storage.objects;
DROP POLICY IF EXISTS "Public Access Vehicle Docs" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert Vehicle Docs" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
DROP POLICY IF EXISTS "rex_documents_select" ON storage.objects;
DROP POLICY IF EXISTS "rex_documents_insert" ON storage.objects;
DROP POLICY IF EXISTS "rex_documents_update" ON storage.objects;
DROP POLICY IF EXISTS "rex_documents_delete" ON storage.objects;

CREATE POLICY "rex_documents_select" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id IN ('driver-documents','vehicle-documents','shipment-documents')
  AND public.rex_has_role(ARRAY['admin','operations'])
);
CREATE POLICY "rex_documents_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id IN ('driver-documents','vehicle-documents','shipment-documents')
  AND public.rex_has_role(ARRAY['admin','operations'])
);
CREATE POLICY "rex_documents_update" ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id IN ('driver-documents','vehicle-documents','shipment-documents')
  AND public.rex_has_role(ARRAY['admin','operations'])
)
WITH CHECK (
  bucket_id IN ('driver-documents','vehicle-documents','shipment-documents')
  AND public.rex_has_role(ARRAY['admin','operations'])
);
CREATE POLICY "rex_documents_delete" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id IN ('driver-documents','vehicle-documents','shipment-documents')
  AND public.rex_has_role(ARRAY['admin','operations'])
);
