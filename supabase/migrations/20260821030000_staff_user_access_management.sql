BEGIN;

ALTER TABLE public.app_user_roles
  DROP CONSTRAINT IF EXISTS app_user_roles_role_check;
ALTER TABLE public.app_user_roles
  ADD CONSTRAINT app_user_roles_role_check
  CHECK (role IN ('admin','sales','operations','accounting','hr','viewer','demo'));

CREATE TABLE IF NOT EXISTS public.staff_access_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_email text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('created','role_changed','activated','deactivated')),
  old_role text,
  new_role text,
  old_active boolean,
  new_active boolean,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_access_events ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.rex_is_owner_admin()
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
      AND role = 'admin'
      AND lower(email) = 'info@rexlojistik.com'
  );
$$;

REVOKE ALL ON FUNCTION public.rex_is_owner_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rex_is_owner_admin() TO authenticated;

DROP POLICY IF EXISTS "rex_roles_admin_manage" ON public.app_user_roles;
DROP POLICY IF EXISTS "rex_roles_owner_manage" ON public.app_user_roles;
CREATE POLICY "rex_roles_owner_manage" ON public.app_user_roles
  FOR ALL TO authenticated
  USING (public.rex_is_owner_admin())
  WITH CHECK (public.rex_is_owner_admin());

DROP POLICY IF EXISTS "rex_staff_access_events_select" ON public.staff_access_events;
CREATE POLICY "rex_staff_access_events_select" ON public.staff_access_events
  FOR SELECT TO authenticated
  USING (public.rex_is_owner_admin());

-- Sales staff can work only with CRM/cari records. Existing operations and
-- accounting rules remain unchanged and financial/transport tables stay closed.
DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['customers','cari_cards','customer_bank_accounts','customer_payments','leads'] LOOP
    IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
      EXECUTE format('DROP POLICY IF EXISTS rex_sales_select ON public.%I', table_name);
      EXECUTE format('DROP POLICY IF EXISTS rex_sales_write ON public.%I', table_name);
      EXECUTE format('CREATE POLICY rex_sales_select ON public.%I FOR SELECT TO authenticated USING (public.rex_has_role(ARRAY[''sales'']))', table_name);
      EXECUTE format('CREATE POLICY rex_sales_write ON public.%I FOR ALL TO authenticated USING (public.rex_has_role(ARRAY[''sales''])) WITH CHECK (public.rex_has_role(ARRAY[''sales'']))', table_name);
    END IF;
  END LOOP;
END $$;

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

COMMIT;
