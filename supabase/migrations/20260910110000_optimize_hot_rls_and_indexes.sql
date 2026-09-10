BEGIN;

-- First performance-hardening package for the busiest operational paths.
-- Keep the scope deliberately narrow: optimize the 15 policies reported by
-- Supabase, remove overlapping permissive paths on the six hottest tables,
-- and index only foreign keys / sort paths already used by the application.

-- ---------------------------------------------------------------------------
-- RLS initialization plans
-- ---------------------------------------------------------------------------
-- Wrapping auth helpers in scalar subqueries lets PostgreSQL evaluate them
-- once per statement instead of once per candidate row. Authorization logic
-- remains unchanged.

ALTER POLICY rex_roles_select ON public.app_user_roles
  USING (
    user_id = (SELECT auth.uid())
    OR public.rex_has_role(ARRAY['admin'])
  );

ALTER POLICY rex_crm_activities_insert ON public.crm_activities
  WITH CHECK (
    public.rex_has_permission('crm.sales_pipeline', 'manage')
    AND created_by = (SELECT auth.uid())
    AND public.rex_crm_can_access_opportunity(opportunity_id)
  );

ALTER POLICY rex_crm_import_batches_select ON public.crm_import_batches
  USING (
    created_by = (SELECT auth.uid())
    OR public.rex_is_owner_admin()
  );

ALTER POLICY rex_crm_notifications_self_select ON public.crm_notifications
  USING (recipient_id = (SELECT auth.uid()));

ALTER POLICY rex_crm_notifications_self_update ON public.crm_notifications
  USING (recipient_id = (SELECT auth.uid()))
  WITH CHECK (recipient_id = (SELECT auth.uid()));

ALTER POLICY rex_crm_opportunities_insert ON public.crm_opportunities
  WITH CHECK (
    public.rex_has_permission('crm.sales_pipeline', 'manage')
    AND (
      assigned_to IS NULL
      OR assigned_to = (SELECT auth.uid())
      OR public.rex_is_owner_admin()
      OR EXISTS (
        SELECT 1
        FROM public.app_user_roles me
        WHERE me.user_id = (SELECT auth.uid())
          AND me.active = true
          AND me.role = 'admin'
      )
      OR (
        public.rex_has_permission('crm.team_pipeline', 'manage')
        AND EXISTS (
          SELECT 1
          FROM public.app_user_roles member
          WHERE member.user_id = crm_opportunities.assigned_to
            AND member.manager_id = (SELECT auth.uid())
        )
      )
    )
  );

ALTER POLICY customer_portal_user_self_select ON public.customer_portal_users
  USING (
    user_id = (SELECT auth.uid())
    AND active = true
  );

ALTER POLICY logistics_non_working_days_read ON public.logistics_non_working_days
  USING (
    (
      public.rex_has_role(ARRAY['admin'])
      AND lower(coalesce((SELECT auth.jwt()) ->> 'email', '')) = 'info@rexlojistik.com'
    )
    OR public.rex_has_permission('crm.sales_pipeline', 'view')
    OR public.rex_has_permission('operations.shipments', 'view')
  );

ALTER POLICY rex_profiles_select ON public.profiles
  USING (
    id = (SELECT auth.uid())
    OR public.rex_has_role(ARRAY['admin'])
  );

ALTER POLICY rex_profiles_update ON public.profiles
  USING (
    id = (SELECT auth.uid())
    OR public.rex_has_role(ARRAY['admin'])
  )
  WITH CHECK (
    id = (SELECT auth.uid())
    OR public.rex_has_role(ARRAY['admin'])
  );

ALTER POLICY rex_settings_own ON public.settings
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

ALTER POLICY rex_staff_permission_overrides_select ON public.staff_permission_overrides
  USING (
    user_id = (SELECT auth.uid())
    OR public.rex_is_owner_admin()
  );

ALTER POLICY rex_staff_security_events_select ON public.staff_security_events
  USING (
    user_id = (SELECT auth.uid())
    OR public.rex_is_owner_admin()
  );

ALTER POLICY supplier_price_tariffs_read ON public.supplier_price_tariffs
  USING (
    (
      public.rex_has_role(ARRAY['admin'])
      AND lower(coalesce((SELECT auth.jwt()) ->> 'email', '')) = 'info@rexlojistik.com'
    )
    OR public.rex_has_permission('crm.sales_pipeline', 'view')
    OR public.rex_has_permission('operations.shipments', 'view')
  );

ALTER POLICY supplier_transit_schedules_read ON public.supplier_transit_schedules
  USING (
    (
      public.rex_has_role(ARRAY['admin'])
      AND lower(coalesce((SELECT auth.jwt()) ->> 'email', '')) = 'info@rexlojistik.com'
    )
    OR public.rex_has_permission('crm.sales_pipeline', 'view')
    OR public.rex_has_permission('operations.shipments', 'view')
  );

-- ---------------------------------------------------------------------------
-- Remove overlapping permissive policies from hot tables
-- ---------------------------------------------------------------------------

-- Financial movements: keep the existing read policy and replace FOR ALL
-- with operation-specific write policies so it no longer participates in
-- SELECT evaluation.
DROP POLICY IF EXISTS rex_permission_write ON public.transactions;
DROP POLICY IF EXISTS rex_permission_insert ON public.transactions;
DROP POLICY IF EXISTS rex_permission_update ON public.transactions;
DROP POLICY IF EXISTS rex_permission_delete ON public.transactions;

CREATE POLICY rex_permission_insert ON public.transactions
  FOR INSERT TO authenticated
  WITH CHECK (public.rex_has_permission('accounting.accounts', 'manage'));
CREATE POLICY rex_permission_update ON public.transactions
  FOR UPDATE TO authenticated
  USING (public.rex_has_permission('accounting.accounts', 'manage'))
  WITH CHECK (public.rex_has_permission('accounting.accounts', 'manage'));
CREATE POLICY rex_permission_delete ON public.transactions
  FOR DELETE TO authenticated
  USING (public.rex_has_permission('accounting.accounts', 'manage'));

DROP POLICY IF EXISTS rex_permission_write ON public.account_transactions;
DROP POLICY IF EXISTS rex_permission_insert ON public.account_transactions;
DROP POLICY IF EXISTS rex_permission_update ON public.account_transactions;
DROP POLICY IF EXISTS rex_permission_delete ON public.account_transactions;

CREATE POLICY rex_permission_insert ON public.account_transactions
  FOR INSERT TO authenticated
  WITH CHECK (public.rex_has_permission('accounting.accounts', 'manage'));
CREATE POLICY rex_permission_update ON public.account_transactions
  FOR UPDATE TO authenticated
  USING (public.rex_has_permission('accounting.accounts', 'manage'))
  WITH CHECK (public.rex_has_permission('accounting.accounts', 'manage'));
CREATE POLICY rex_permission_delete ON public.account_transactions
  FOR DELETE TO authenticated
  USING (public.rex_has_permission('accounting.accounts', 'manage'));

-- Incoming invoices retain the existing read policy and accounting permission.
DROP POLICY IF EXISTS rex_permission_write ON public.incoming_purchase_invoices;
DROP POLICY IF EXISTS rex_permission_insert ON public.incoming_purchase_invoices;
DROP POLICY IF EXISTS rex_permission_update ON public.incoming_purchase_invoices;
DROP POLICY IF EXISTS rex_permission_delete ON public.incoming_purchase_invoices;

CREATE POLICY rex_permission_insert ON public.incoming_purchase_invoices
  FOR INSERT TO authenticated
  WITH CHECK (public.rex_has_permission('accounting.purchase', 'manage'));
CREATE POLICY rex_permission_update ON public.incoming_purchase_invoices
  FOR UPDATE TO authenticated
  USING (public.rex_has_permission('accounting.purchase', 'manage'))
  WITH CHECK (public.rex_has_permission('accounting.purchase', 'manage'));
CREATE POLICY rex_permission_delete ON public.incoming_purchase_invoices
  FOR DELETE TO authenticated
  USING (public.rex_has_permission('accounting.purchase', 'manage'));

-- Customer cards use archive/merge workflows. The broad FOR ALL policy had
-- made the archived_at insert guard ineffective and exposed direct DELETE.
DROP POLICY IF EXISTS rex_permission_write ON public.customers;
DROP POLICY IF EXISTS rex_customers_select ON public.customers;
DROP POLICY IF EXISTS rex_customers_no_direct_delete ON public.customers;
CREATE POLICY rex_customers_no_direct_delete ON public.customers
  FOR DELETE TO authenticated
  USING (false);

-- Sales invoices are cancelled/refunded through reviewed RPCs. Preserve
-- direct insert/update for accounting staff but keep direct DELETE blocked.
DROP POLICY IF EXISTS rex_permission_write ON public.sales_invoices;
DROP POLICY IF EXISTS rex_permission_insert ON public.sales_invoices;
DROP POLICY IF EXISTS rex_permission_update ON public.sales_invoices;

CREATE POLICY rex_permission_insert ON public.sales_invoices
  FOR INSERT TO authenticated
  WITH CHECK (public.rex_has_permission('accounting.sales', 'manage'));
CREATE POLICY rex_permission_update ON public.sales_invoices
  FOR UPDATE TO authenticated
  USING (public.rex_has_permission('accounting.sales', 'manage'))
  WITH CHECK (public.rex_has_permission('accounting.sales', 'manage'));

-- Shipments are created/edited by operations. A completed shipment can only
-- be changed by the existing owner-approved SECURITY DEFINER workflow, and
-- direct DELETE remains blocked in favour of the reviewed delete/cancel RPCs.
DROP POLICY IF EXISTS rex_permission_write ON public.shipments;
DROP POLICY IF EXISTS rex_permission_insert ON public.shipments;
DROP POLICY IF EXISTS rex_permission_update ON public.shipments;
DROP POLICY IF EXISTS rex_completed_shipment_update_guard ON public.shipments;

CREATE POLICY rex_permission_insert ON public.shipments
  FOR INSERT TO authenticated
  WITH CHECK (public.rex_has_permission('operations.shipments', 'manage'));
CREATE POLICY rex_permission_update ON public.shipments
  FOR UPDATE TO authenticated
  USING (
    public.rex_has_permission('operations.shipments', 'manage')
    AND status <> ALL (ARRAY['teslim_edildi', 'Teslim Edildi'])
  )
  WITH CHECK (public.rex_has_permission('operations.shipments', 'manage'));

-- ---------------------------------------------------------------------------
-- Query-path and foreign-key indexes
-- ---------------------------------------------------------------------------

-- Customer directory: the application filters active cards, then sorts by
-- created_at and id for deterministic pagination. Replace the former partial
-- single-column index instead of retaining two overlapping indexes.
DROP INDEX IF EXISTS public.customers_active_created_idx;
CREATE INDEX customers_active_created_idx
  ON public.customers (created_at DESC, id ASC)
  WHERE archived_at IS NULL;

-- Finance workspace and relation lookups.
CREATE INDEX IF NOT EXISTS transactions_transaction_date_idx
  ON public.transactions (transaction_date DESC);
CREATE INDEX IF NOT EXISTS transactions_account_date_idx
  ON public.transactions (account_id, transaction_date DESC)
  WHERE account_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS transactions_related_invoice_id_idx
  ON public.transactions (related_invoice_id)
  WHERE related_invoice_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS transactions_related_purchase_id_idx
  ON public.transactions (related_purchase_id)
  WHERE related_purchase_id IS NOT NULL;

-- Incoming purchase invoice filters, sorting and supplier matching.
CREATE INDEX IF NOT EXISTS incoming_purchase_invoices_payment_date_idx
  ON public.incoming_purchase_invoices (payment_status, invoice_date DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS incoming_purchase_invoices_operational_supplier_idx
  ON public.incoming_purchase_invoices (operational_supplier_id, invoice_date DESC)
  WHERE operational_supplier_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS incoming_purchase_invoices_legacy_purchase_idx
  ON public.incoming_purchase_invoices (legacy_purchase_id)
  WHERE legacy_purchase_id IS NOT NULL;

-- Core shipment joins and the list ordering used by the logistics screens.
CREATE INDEX IF NOT EXISTS shipments_created_at_idx
  ON public.shipments (created_at DESC);
CREATE INDEX IF NOT EXISTS shipments_customer_created_idx
  ON public.shipments (customer_id, created_at DESC)
  WHERE customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS shipments_supplier_pickup_idx
  ON public.shipments (supplier_id, pickup_date DESC)
  WHERE supplier_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS shipments_driver_id_idx
  ON public.shipments (driver_id)
  WHERE driver_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS shipments_vehicle_id_idx
  ON public.shipments (vehicle_id)
  WHERE vehicle_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Migration invariants
-- ---------------------------------------------------------------------------

DO $verification$
DECLARE
  v_all_policy_count integer;
  v_duplicate_hot_paths integer;
  v_missing_indexes integer;
BEGIN
  SELECT count(*)
    INTO v_all_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = ANY (ARRAY[
      'transactions', 'account_transactions', 'incoming_purchase_invoices',
      'customers', 'sales_invoices', 'shipments'
    ])
    AND policyname = 'rex_permission_write'
    AND cmd = 'ALL';

  IF v_all_policy_count <> 0 THEN
    RAISE EXCEPTION 'Performance verification failed: % broad hot-table write policies remain', v_all_policy_count;
  END IF;

  SELECT count(*)
    INTO v_duplicate_hot_paths
  FROM (
    SELECT tablename, role_name, action_name
    FROM pg_policies p
    CROSS JOIN LATERAL unnest(p.roles) AS role_name
    CROSS JOIN LATERAL unnest(
      CASE p.cmd
        WHEN 'ALL' THEN ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE']
        ELSE ARRAY[p.cmd]
      END
    ) AS action_name
    WHERE p.schemaname = 'public'
      AND p.permissive = 'PERMISSIVE'
      AND p.tablename = ANY (ARRAY[
        'transactions', 'account_transactions', 'incoming_purchase_invoices',
        'customers', 'sales_invoices', 'shipments'
      ])
    GROUP BY tablename, role_name, action_name
    HAVING count(*) > 1
  ) duplicates;

  IF v_duplicate_hot_paths <> 0 THEN
    RAISE EXCEPTION 'Performance verification failed: % duplicate permissive hot-table paths remain', v_duplicate_hot_paths;
  END IF;

  SELECT count(*)
    INTO v_missing_indexes
  FROM unnest(ARRAY[
    'public.customers_active_created_idx',
    'public.transactions_transaction_date_idx',
    'public.transactions_account_date_idx',
    'public.transactions_related_invoice_id_idx',
    'public.transactions_related_purchase_id_idx',
    'public.incoming_purchase_invoices_payment_date_idx',
    'public.incoming_purchase_invoices_operational_supplier_idx',
    'public.incoming_purchase_invoices_legacy_purchase_idx',
    'public.shipments_created_at_idx',
    'public.shipments_customer_created_idx',
    'public.shipments_supplier_pickup_idx',
    'public.shipments_driver_id_idx',
    'public.shipments_vehicle_id_idx'
  ]::text[]) AS required_index
  WHERE to_regclass(required_index) IS NULL;

  IF v_missing_indexes <> 0 THEN
    RAISE EXCEPTION 'Performance verification failed: % required indexes are missing', v_missing_indexes;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('customers', 'sales_invoices', 'shipments')
      AND cmd = 'DELETE'
      AND coalesce(qual, '') <> 'false'
  ) THEN
    RAISE EXCEPTION 'Security verification failed: a protected business table permits direct DELETE';
  END IF;
END
$verification$;

COMMIT;
