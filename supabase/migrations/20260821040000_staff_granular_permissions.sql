BEGIN;

CREATE TABLE IF NOT EXISTS public.staff_permission_overrides (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_key text NOT NULL CHECK (permission_key IN (
    'crm.customers','crm.portal_invites','sales.work_orders',
    'operations.shipments','operations.assignments','operations.delivery',
    'operations.exceptions','operations.uetds','accounting.sales',
    'accounting.purchase','accounting.accounts','accounting.expenses',
    'reports.sales','reports.operations','reports.accounting','analytics.web'
  )),
  access_level text NOT NULL CHECK (access_level IN ('none','view','manage')),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, permission_key)
);

ALTER TABLE public.staff_permission_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rex_staff_permission_overrides_select ON public.staff_permission_overrides;
CREATE POLICY rex_staff_permission_overrides_select ON public.staff_permission_overrides
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.rex_is_owner_admin());

DROP POLICY IF EXISTS rex_staff_permission_overrides_owner_manage ON public.staff_permission_overrides;
CREATE POLICY rex_staff_permission_overrides_owner_manage ON public.staff_permission_overrides
  FOR ALL TO authenticated
  USING (public.rex_is_owner_admin())
  WITH CHECK (public.rex_is_owner_admin());

ALTER TABLE public.staff_access_events
  DROP CONSTRAINT IF EXISTS staff_access_events_event_type_check;
ALTER TABLE public.staff_access_events
  ADD CONSTRAINT staff_access_events_event_type_check
  CHECK (event_type IN ('created','role_changed','activated','deactivated','permissions_changed'));

CREATE OR REPLACE FUNCTION public.rex_base_permission_level(p_role text, p_key text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_role = 'admin' THEN 'manage'
    WHEN p_role = 'sales' AND p_key IN ('crm.customers','crm.portal_invites','sales.work_orders') THEN 'manage'
    WHEN p_role = 'sales' AND p_key = 'reports.sales' THEN 'view'
    WHEN p_role = 'operations' AND p_key IN (
      'sales.work_orders','operations.shipments','operations.assignments',
      'operations.delivery','operations.exceptions','operations.uetds'
    ) THEN 'manage'
    WHEN p_role = 'operations' AND p_key IN ('crm.customers','reports.operations','analytics.web') THEN 'view'
    WHEN p_role = 'accounting' AND p_key IN (
      'accounting.sales','accounting.purchase','accounting.accounts','accounting.expenses'
    ) THEN 'manage'
    WHEN p_role = 'accounting' AND p_key IN ('crm.customers','reports.accounting') THEN 'view'
    ELSE 'none'
  END;
$$;

CREATE OR REPLACE FUNCTION public.rex_permission_level(p_key text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT CASE
    WHEN r.user_id IS NULL OR NOT r.active THEN 'none'
    ELSE coalesce(o.access_level, public.rex_base_permission_level(r.role, p_key))
  END
  FROM (SELECT auth.uid() AS current_user_id) u
  LEFT JOIN public.app_user_roles r ON r.user_id = u.current_user_id
  LEFT JOIN public.staff_permission_overrides o
    ON o.user_id = r.user_id AND o.permission_key = p_key;
$$;

CREATE OR REPLACE FUNCTION public.rex_has_permission(p_key text, p_required text DEFAULT 'view')
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT CASE public.rex_permission_level(p_key)
    WHEN 'manage' THEN true
    WHEN 'view' THEN p_required = 'view'
    ELSE false
  END;
$$;

REVOKE ALL ON FUNCTION public.rex_base_permission_level(text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rex_permission_level(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rex_has_permission(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rex_base_permission_level(text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_permission_level(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_has_permission(text,text) TO authenticated;

-- Legacy RPC role guards remain compatible with cross-department permissions.
-- Exact table permissions below still decide which records may be read or changed.
CREATE OR REPLACE FUNCTION public.rex_has_role(required_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.app_user_roles r
    WHERE r.user_id = auth.uid() AND r.active = true AND (
      r.role = ANY(required_roles)
      OR ('sales' = ANY(required_roles) AND (
        public.rex_has_permission('crm.customers','manage') OR
        public.rex_has_permission('crm.portal_invites','manage') OR
        public.rex_has_permission('sales.work_orders','manage')
      ))
      OR ('operations' = ANY(required_roles) AND (
        public.rex_has_permission('operations.shipments','manage') OR
        public.rex_has_permission('operations.assignments','manage') OR
        public.rex_has_permission('operations.delivery','manage') OR
        public.rex_has_permission('operations.exceptions','manage') OR
        public.rex_has_permission('operations.uetds','manage')
      ))
      OR ('accounting' = ANY(required_roles) AND (
        public.rex_has_permission('accounting.sales','manage') OR
        public.rex_has_permission('accounting.purchase','manage') OR
        public.rex_has_permission('accounting.accounts','manage') OR
        public.rex_has_permission('accounting.expenses','manage')
      ))
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.rex_require_permission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.rex_has_permission(TG_ARGV[0], 'manage') THEN
    RAISE EXCEPTION 'Bu işlem için kişisel yetkiniz bulunmuyor';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.rex_require_permission() FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.rex_create_customer_portal_invite(
  p_customer_id uuid,
  p_email text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_customer public.customers%ROWTYPE;
  v_email text := lower(trim(coalesce(p_email, '')));
  v_token text := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  v_expires_at timestamptz := now() + interval '72 hours';
BEGIN
  IF NOT public.rex_has_permission('crm.portal_invites', 'manage') THEN
    RAISE EXCEPTION 'Müşteri portalı daveti oluşturma yetkiniz bulunmuyor';
  END IF;
  SELECT * INTO v_customer FROM public.customers WHERE id = p_customer_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Müşteri bulunamadı'; END IF;
  IF coalesce(v_customer.account_type, 'musteri') <> 'musteri' THEN
    RAISE EXCEPTION 'Müşteri portalı yalnızca müşteri carileri için açılabilir';
  END IF;
  IF v_email = '' OR v_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
    RAISE EXCEPTION 'Geçerli bir e-posta adresi girin';
  END IF;
  UPDATE public.customer_portal_invites
  SET expires_at = now(), used_at = coalesce(used_at, now())
  WHERE customer_id = p_customer_id AND lower(email) = v_email AND used_at IS NULL;
  INSERT INTO public.customer_portal_invites(customer_id, email, token, expires_at, created_by)
  VALUES (p_customer_id, v_email, v_token, v_expires_at, auth.uid());
  RETURN jsonb_build_object(
    'customer_id', p_customer_id,
    'customer_name', v_customer.name,
    'email', v_email,
    'token', v_token,
    'expires_at', v_expires_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.rex_create_customer_portal_invite(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rex_create_customer_portal_invite(uuid,text) TO authenticated;

-- Replace permissive business policies while retaining restrictive owner,
-- completed-shipment and no-delete guards from earlier migrations.
DO $$
DECLARE
  item text;
  table_name text;
  permission_key text;
  report_key text;
  policy_record record;
BEGIN
  FOREACH item IN ARRAY ARRAY[
    'customers|crm.customers|reports.sales',
    'cari_cards|crm.customers|reports.sales',
    'customer_bank_accounts|crm.customers|',
    'leads|sales.work_orders|reports.sales',
    'transport_jobs|sales.work_orders|reports.sales',
    'shipments|operations.shipments|reports.operations',
    'shipment_cargo_items|operations.shipments|reports.operations',
    'shipment_revision_requests|operations.shipments|reports.operations',
    'shipment_events|operations.shipments|reports.operations',
    'drivers|operations.assignments|reports.operations',
    'vehicles|operations.assignments|reports.operations',
    'customer_drivers|operations.assignments|reports.operations',
    'customer_vehicles|operations.assignments|reports.operations',
    'warehouses|operations.assignments|reports.operations',
    'delivery_document_settings|operations.delivery|reports.operations',
    'delivery_documents|operations.delivery|reports.operations',
    'delivery_document_events|operations.delivery|reports.operations',
    'shipment_exceptions|operations.exceptions|reports.operations',
    'shipment_exception_events|operations.exceptions|reports.operations',
    'uetds_settings|operations.uetds|reports.operations',
    'shipment_uetds_details|operations.uetds|reports.operations',
    'uetds_journeys|operations.uetds|reports.operations',
    'uetds_journey_loads|operations.uetds|reports.operations',
    'uetds_attempts|operations.uetds|reports.operations',
    'sales_invoices|accounting.sales|reports.accounting',
    'sales_invoice_items|accounting.sales|reports.accounting',
    'invoice_customer_mappings|accounting.sales|reports.accounting',
    'invoice_product_mappings|accounting.sales|reports.accounting',
    'invoice_sync_jobs|accounting.sales|reports.accounting',
    'supplier_invoice_issuers|accounting.purchase|reports.accounting',
    'incoming_purchase_invoices|accounting.purchase|reports.accounting',
    'purchase_invoice_allocations|accounting.purchase|reports.accounting',
    'purchase_invoice_events|accounting.purchase|reports.accounting',
    'purchases|accounting.purchase|reports.accounting',
    'purchase_items|accounting.purchase|reports.accounting',
    'customer_payments|accounting.accounts|reports.accounting',
    'financial_accounts|accounting.accounts|reports.accounting',
    'account_transactions|accounting.accounts|reports.accounting',
    'transactions|accounting.accounts|reports.accounting',
    'payments|accounting.accounts|reports.accounting',
    'partner_accounts|accounting.accounts|reports.accounting',
    'invoices|accounting.accounts|reports.accounting',
    'expenses|accounting.expenses|reports.accounting',
    'website_visits|analytics.web|analytics.web',
    'daily_analytics|analytics.web|analytics.web',
    'popular_pages|analytics.web|analytics.web',
    'traffic_sources|analytics.web|analytics.web'
  ] LOOP
    table_name := split_part(item, '|', 1);
    permission_key := split_part(item, '|', 2);
    report_key := split_part(item, '|', 3);
    IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
      FOR policy_record IN
        SELECT policyname FROM pg_policies
        WHERE schemaname = 'public' AND tablename = table_name AND permissive = 'PERMISSIVE'
      LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_record.policyname, table_name);
      END LOOP;
      EXECUTE format(
        'CREATE POLICY rex_permission_select ON public.%I FOR SELECT TO authenticated USING (public.rex_has_permission(%L,''view'') OR public.rex_has_permission(%L,''view''))',
        table_name, permission_key, report_key
      );
      IF permission_key <> 'analytics.web' AND table_name NOT IN ('shipment_events','delivery_document_events','shipment_exception_events','purchase_invoice_events') THEN
        EXECUTE format(
          'CREATE POLICY rex_permission_write ON public.%I FOR ALL TO authenticated USING (public.rex_has_permission(%L,''manage'')) WITH CHECK (public.rex_has_permission(%L,''manage''))',
          table_name, permission_key, permission_key
        );
        EXECUTE format('DROP TRIGGER IF EXISTS rex_granular_permission_guard ON public.%I', table_name);
        EXECUTE format(
          'CREATE TRIGGER rex_granular_permission_guard BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.rex_require_permission(%L)',
          table_name, permission_key
        );
      END IF;
    END IF;
  END LOOP;
END $$;

-- Delivery and exception files follow the same individual permission rules.
DROP POLICY IF EXISTS rex_documents_select ON storage.objects;
DROP POLICY IF EXISTS rex_documents_insert ON storage.objects;
DROP POLICY IF EXISTS rex_documents_update ON storage.objects;
DROP POLICY IF EXISTS rex_documents_delete ON storage.objects;
DROP POLICY IF EXISTS rex_purchase_invoice_documents_select ON storage.objects;
DROP POLICY IF EXISTS rex_purchase_invoice_documents_insert ON storage.objects;
DROP POLICY IF EXISTS rex_shipment_exception_documents_select ON storage.objects;
DROP POLICY IF EXISTS rex_shipment_exception_documents_insert ON storage.objects;
CREATE POLICY rex_documents_select ON storage.objects FOR SELECT TO authenticated USING (
  (bucket_id IN ('driver-documents','vehicle-documents') AND public.rex_has_permission('operations.assignments','view'))
  OR (bucket_id = 'shipment-documents' AND public.rex_has_permission('operations.delivery','view'))
  OR (bucket_id = 'shipment-exception-documents' AND public.rex_has_permission('operations.exceptions','view'))
  OR (bucket_id = 'purchase-invoice-documents' AND public.rex_has_permission('accounting.purchase','view'))
);
CREATE POLICY rex_documents_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  (bucket_id IN ('driver-documents','vehicle-documents') AND public.rex_has_permission('operations.assignments','manage'))
  OR (bucket_id = 'shipment-documents'
      AND public.rex_has_permission('operations.delivery','manage')
      AND (storage.foldername(name))[1] = 'delivery-documents'
      AND (storage.foldername(name))[2] = auth.uid()::text)
  OR (bucket_id = 'shipment-exception-documents'
      AND public.rex_has_permission('operations.exceptions','manage')
      AND (storage.foldername(name))[1] = 'exceptions')
  OR (bucket_id = 'purchase-invoice-documents'
      AND public.rex_has_permission('accounting.purchase','manage')
      AND (storage.foldername(name))[1] = auth.uid()::text)
);
CREATE POLICY rex_documents_update ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('driver-documents','vehicle-documents')
    AND public.rex_has_permission('operations.assignments','manage')
  )
  WITH CHECK (
    bucket_id IN ('driver-documents','vehicle-documents')
    AND public.rex_has_permission('operations.assignments','manage')
  );
CREATE POLICY rex_documents_delete ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id IN ('driver-documents','vehicle-documents')
  AND public.rex_has_permission('operations.assignments','manage')
);

COMMIT;
