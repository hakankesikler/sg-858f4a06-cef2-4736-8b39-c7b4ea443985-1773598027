BEGIN;

-- Pin the lookup path of the eight functions reported by Supabase's security
-- advisor. These are SECURITY INVOKER utilities/triggers, but a fixed path also
-- prevents a same-named object from being resolved from a mutable schema.
ALTER FUNCTION public.update_daily_analytics()
  SET search_path = public, pg_temp;
ALTER FUNCTION public.rex_role_requires_mfa(text)
  SET search_path = public, pg_temp;
ALTER FUNCTION public.rex_integration_append_only()
  SET search_path = public, pg_temp;
ALTER FUNCTION public.rex_base_permission_level(text, text)
  SET search_path = public, pg_temp;
ALTER FUNCTION public.rex_kolaybi_events_append_only()
  SET search_path = public, pg_temp;
ALTER FUNCTION public.rex_location_key(text)
  SET search_path = public, pg_temp;
ALTER FUNCTION public.rex_prevent_expense_catalog_delete()
  SET search_path = public, pg_temp;
ALTER FUNCTION public.rex_prevent_kolaybi_finance_delete()
  SET search_path = public, pg_temp;

-- Candidate matching exposes supplier names, routes and expected costs. Keep
-- the Data API entry point for the accounting screen, but enforce the
-- application role inside the SECURITY DEFINER function itself.
CREATE OR REPLACE FUNCTION public.rex_purchase_invoice_candidates(p_invoice_id uuid)
RETURNS TABLE(
  shipment_id uuid,
  shipment_code text,
  supplier_id uuid,
  supplier_name text,
  origin text,
  destination text,
  pickup_date date,
  shipment_status text,
  expected_cost numeric,
  cost_currency text,
  score integer,
  reasons text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH inv AS (
    SELECT *
    FROM public.incoming_purchase_invoices
    WHERE id = p_invoice_id
      AND public.rex_has_role(ARRAY['admin', 'accounting'])
  ), scored AS (
    SELECT
      s.id,
      s.shipment_code,
      s.supplier_id,
      coalesce(c.company, c.name) AS supplier_name,
      s.origin,
      s.destination,
      s.pickup_date,
      s.status,
      s.cost,
      s.cost_currency,
      least(
        100,
        CASE WHEN s.supplier_id = i.operational_supplier_id THEN 35 ELSE 0 END +
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM public.customers direct_supplier
            WHERE direct_supplier.id = s.supplier_id
              AND regexp_replace(coalesce(direct_supplier.vergi_no, direct_supplier.tc_no, ''), '\D', '', 'g') =
                  regexp_replace(i.issuer_tax_id, '\D', '', 'g')
          ) OR EXISTS (
            SELECT 1
            FROM public.supplier_invoice_issuers m
            WHERE m.operational_supplier_id = s.supplier_id
              AND regexp_replace(m.issuer_tax_id, '\D', '', 'g') = regexp_replace(i.issuer_tax_id, '\D', '', 'g')
              AND m.active
              AND m.approved_at IS NOT NULL
              AND (m.valid_until IS NULL OR m.valid_until >= i.invoice_date)
          ) THEN 30 ELSE 0
        END +
        CASE
          WHEN s.cost_currency = i.currency
            AND abs(coalesce(s.cost, 0) - i.grand_total) <= greatest(i.grand_total * 0.05, 1)
          THEN 25 ELSE 0
        END +
        CASE WHEN abs(s.pickup_date - i.invoice_date) <= 15 THEN 10 ELSE 0 END +
        CASE WHEN coalesce(i.description, '') ILIKE '%' || s.shipment_code || '%' THEN 30 ELSE 0 END
      )::integer AS score,
      array_remove(ARRAY[
        CASE WHEN s.supplier_id = i.operational_supplier_id THEN 'Kayıtlı nakliyeci aynı' END,
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM public.customers direct_supplier
            WHERE direct_supplier.id = s.supplier_id
              AND regexp_replace(coalesce(direct_supplier.vergi_no, direct_supplier.tc_no, ''), '\D', '', 'g') =
                  regexp_replace(i.issuer_tax_id, '\D', '', 'g')
          ) THEN 'Fatura VKN/TCKN bilgisi nakliyeciyle aynı'
          WHEN EXISTS (
            SELECT 1
            FROM public.supplier_invoice_issuers m
            WHERE m.operational_supplier_id = s.supplier_id
              AND regexp_replace(m.issuer_tax_id, '\D', '', 'g') = regexp_replace(i.issuer_tax_id, '\D', '', 'g')
              AND m.active
              AND m.approved_at IS NOT NULL
          ) THEN 'Onaylı fatura düzenleyicisi bağlantısı'
        END,
        CASE
          WHEN s.cost_currency = i.currency
            AND abs(coalesce(s.cost, 0) - i.grand_total) <= greatest(i.grand_total * 0.05, 1)
          THEN 'Tutar beklenen maliyetle uyumlu'
        END,
        CASE WHEN abs(s.pickup_date - i.invoice_date) <= 15 THEN 'Tarihler yakın' END,
        CASE WHEN coalesce(i.description, '') ILIKE '%' || s.shipment_code || '%' THEN 'Açıklamada sevkiyat kodu var' END
      ], NULL) AS reasons
    FROM inv i
    JOIN public.shipments s ON s.status NOT IN ('iptal', 'İptal')
    LEFT JOIN public.customers c ON c.id = s.supplier_id
    WHERE s.pickup_date BETWEEN i.invoice_date - interval '60 days' AND i.invoice_date + interval '15 days'
  )
  SELECT
    id,
    shipment_code,
    supplier_id,
    supplier_name,
    origin,
    destination,
    pickup_date,
    status,
    cost,
    cost_currency,
    score,
    reasons
  FROM scored
  WHERE score > 0
  ORDER BY score DESC, pickup_date DESC
  LIMIT 20;
$$;

REVOKE ALL ON FUNCTION public.rex_purchase_invoice_candidates(uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rex_purchase_invoice_candidates(uuid)
  TO authenticated;

-- Internal helpers are reached only through reviewed, role-checked RPCs or
-- database triggers/defaults. Removing authenticated EXECUTE prevents callers
-- from bypassing the outer authorization and validation layer.
REVOKE EXECUTE ON FUNCTION public.rex_create_sales_invoice_secure(uuid, uuid[], date, date, text, text, text, jsonb, text, text, numeric, text)
  FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.rex_create_sales_invoice(uuid, uuid[], date, date, text, text, text, jsonb)
  FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.rex_crm_complete_task(uuid)
  FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.rex_delete_sales_invoice(uuid)
  FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.rex_generate_tracking_number()
  FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.rex_save_shipment_with_uetds(uuid, jsonb, jsonb, jsonb)
  FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.rex_save_shipment(uuid, jsonb, jsonb)
  FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.rex_save_uetds_details(uuid, jsonb, jsonb)
  FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.rex_uetds_readiness(uuid)
  FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.rex_validate_assignment_with_load(uuid, uuid, numeric)
  FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.rex_validate_assignment(uuid, uuid)
  FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.rex_validate_transport_assignment(uuid, uuid, uuid, numeric, boolean)
  FROM authenticated;

-- U-ETDS is intentionally hidden in the current product. Keep its tables and
-- server-side implementation for a future regulatory change, but remove the
-- dormant user-callable RPC surface until it is deliberately re-enabled.
REVOKE EXECUTE ON FUNCTION public.rex_prepare_uetds_submission(uuid)
  FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.rex_record_carrier_uetds_reference(uuid, text)
  FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.rex_uetds_dashboard()
  FROM authenticated;

-- KolayBi reconciliation workers run only on the trusted server with the
-- service role. Signed-in browser users queue/review work through separate,
-- role-checked RPCs and cannot claim or finalize provider jobs directly.
REVOKE EXECUTE ON FUNCTION public.rex_claim_invoice_sync_job(text, uuid)
  FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.rex_import_kolaybi_purchase_invoice(jsonb)
  FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.rex_record_invoice_provider_document(uuid, bigint, text, jsonb)
  FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.rex_record_invoice_sync_result(uuid, text, boolean, text, bigint, text, text, text, text, jsonb)
  FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.rex_record_kolaybi_sync(uuid, text, bigint, text)
  FROM authenticated;

GRANT EXECUTE ON FUNCTION public.rex_claim_invoice_sync_job(text, uuid)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.rex_import_kolaybi_purchase_invoice(jsonb)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.rex_record_invoice_provider_document(uuid, bigint, text, jsonb)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.rex_record_invoice_sync_result(uuid, text, boolean, text, bigint, text, text, text, text, jsonb)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.rex_record_kolaybi_sync(uuid, text, bigint, text)
  TO service_role;

DO $verification$
DECLARE
  v_signature text;
  v_missing_search_path integer;
BEGIN
  SELECT count(*)
    INTO v_missing_search_path
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = ANY (ARRAY[
      'update_daily_analytics',
      'rex_role_requires_mfa',
      'rex_integration_append_only',
      'rex_base_permission_level',
      'rex_kolaybi_events_append_only',
      'rex_location_key',
      'rex_prevent_expense_catalog_delete',
      'rex_prevent_kolaybi_finance_delete'
    ])
    AND NOT EXISTS (
      SELECT 1
      FROM unnest(coalesce(p.proconfig, ARRAY[]::text[])) AS cfg
      WHERE cfg LIKE 'search_path=%'
    );

  IF v_missing_search_path <> 0 THEN
    RAISE EXCEPTION 'Security verification failed: % reviewed functions still have a mutable search_path', v_missing_search_path;
  END IF;

  FOREACH v_signature IN ARRAY ARRAY[
    'public.rex_create_sales_invoice_secure(uuid,uuid[],date,date,text,text,text,jsonb,text,text,numeric,text)',
    'public.rex_create_sales_invoice(uuid,uuid[],date,date,text,text,text,jsonb)',
    'public.rex_crm_complete_task(uuid)',
    'public.rex_delete_sales_invoice(uuid)',
    'public.rex_generate_tracking_number()',
    'public.rex_save_shipment_with_uetds(uuid,jsonb,jsonb,jsonb)',
    'public.rex_save_shipment(uuid,jsonb,jsonb)',
    'public.rex_save_uetds_details(uuid,jsonb,jsonb)',
    'public.rex_uetds_readiness(uuid)',
    'public.rex_validate_assignment_with_load(uuid,uuid,numeric)',
    'public.rex_validate_assignment(uuid,uuid)',
    'public.rex_validate_transport_assignment(uuid,uuid,uuid,numeric,boolean)',
    'public.rex_prepare_uetds_submission(uuid)',
    'public.rex_record_carrier_uetds_reference(uuid,text)',
    'public.rex_uetds_dashboard()',
    'public.rex_claim_invoice_sync_job(text,uuid)',
    'public.rex_import_kolaybi_purchase_invoice(jsonb)',
    'public.rex_record_invoice_provider_document(uuid,bigint,text,jsonb)',
    'public.rex_record_invoice_sync_result(uuid,text,boolean,text,bigint,text,text,text,text,jsonb)',
    'public.rex_record_kolaybi_sync(uuid,text,bigint,text)'
  ] LOOP
    IF has_function_privilege('authenticated', v_signature, 'EXECUTE') THEN
      RAISE EXCEPTION 'Security verification failed: authenticated can still execute %', v_signature;
    END IF;
  END LOOP;

  FOREACH v_signature IN ARRAY ARRAY[
    'public.rex_claim_invoice_sync_job(text,uuid)',
    'public.rex_import_kolaybi_purchase_invoice(jsonb)',
    'public.rex_record_invoice_provider_document(uuid,bigint,text,jsonb)',
    'public.rex_record_invoice_sync_result(uuid,text,boolean,text,bigint,text,text,text,text,jsonb)',
    'public.rex_record_kolaybi_sync(uuid,text,bigint,text)'
  ] LOOP
    IF NOT has_function_privilege('service_role', v_signature, 'EXECUTE') THEN
      RAISE EXCEPTION 'Security verification failed: service_role cannot execute %', v_signature;
    END IF;
  END LOOP;

  IF position(
    'rex_has_role' IN pg_get_functiondef('public.rex_purchase_invoice_candidates(uuid)'::regprocedure)
  ) = 0 THEN
    RAISE EXCEPTION 'Security verification failed: purchase invoice candidates lacks an application-role guard';
  END IF;

  IF NOT has_function_privilege(
    'authenticated',
    'public.rex_create_sales_invoice_secure_v2(uuid,uuid[],date,date,text,text,text,jsonb,text,text,numeric,text,text,uuid,uuid[],boolean)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'Security verification failed: current sales invoice RPC is unavailable';
  END IF;

  IF NOT has_function_privilege(
    'authenticated',
    'public.rex_save_shipment_multistop(uuid,jsonb,jsonb,jsonb,jsonb)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'Security verification failed: current shipment RPC is unavailable';
  END IF;

  IF NOT has_function_privilege('anon', 'public.rex_public_track_shipment(text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Security verification failed: public shipment tracking is unavailable';
  END IF;
END
$verification$;

COMMIT;
