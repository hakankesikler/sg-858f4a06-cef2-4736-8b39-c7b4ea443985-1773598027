BEGIN;

-- SECURITY DEFINER functions execute with their owner's privileges. Remove the
-- implicit PUBLIC/anon execution path from every such function in the exposed
-- public schema while preserving existing explicit authenticated/service_role
-- grants.
DO $migration$
DECLARE
  v_function record;
BEGIN
  FOR v_function IN
    SELECT
      n.nspname AS schema_name,
      p.proname AS function_name,
      pg_get_function_identity_arguments(p.oid) AS identity_arguments
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
  LOOP
    EXECUTE format(
      'REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM PUBLIC, anon',
      v_function.schema_name,
      v_function.function_name,
      v_function.identity_arguments
    );
  END LOOP;
END
$migration$;

-- Trigger and event-trigger functions are internal database entry points, not
-- client RPC endpoints. Existing triggers continue to execute as their owner.
DO $migration$
DECLARE
  v_function record;
BEGIN
  FOR v_function IN
    SELECT
      n.nspname AS schema_name,
      p.proname AS function_name,
      pg_get_function_identity_arguments(p.oid) AS identity_arguments
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND pg_catalog.format_type(p.prorettype, NULL) IN ('trigger', 'event_trigger')
  LOOP
    EXECUTE format(
      'REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM PUBLIC, anon, authenticated',
      v_function.schema_name,
      v_function.function_name,
      v_function.identity_arguments
    );
  END LOOP;
END
$migration$;

-- These helpers are called from privileged database functions/triggers. They
-- must never be exposed as direct Data API RPC endpoints.
REVOKE ALL ON FUNCTION public.rex_record_purchase_invoice_event(uuid, text, text, text, jsonb)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rex_crm_actor_email()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rls_auto_enable()
  FROM PUBLIC, anon, authenticated;

-- Deliberate anonymous allowlist: public shipment tracking and access checks
-- for already-delivered proof documents. Do not add entries without a security
-- review of parameters and returned fields.
GRANT EXECUTE ON FUNCTION public.rex_public_track_shipment(text)
  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rex_is_delivered_proof_object(text)
  TO anon, authenticated;

COMMENT ON FUNCTION public.rex_public_track_shipment(text) IS
  'Public RPC allowlist: masked shipment tracking by unguessable tracking number.';
COMMENT ON FUNCTION public.rex_is_delivered_proof_object(text) IS
  'Public RPC allowlist: boolean access check for an already-delivered proof object.';

-- Keep future application-owned functions private by default. Permissions must
-- be granted per function after its authorization model has been reviewed.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;

-- Fail the migration if the intended boundary is not in effect.
DO $verification$
DECLARE
  v_anon_rpc_count integer;
BEGIN
  IF has_function_privilege(
    'anon',
    'public.rex_record_purchase_invoice_event(uuid,text,text,text,jsonb)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'Security verification failed: purchase invoice event writer is anonymous';
  END IF;

  IF has_function_privilege('anon', 'public.rex_crm_actor_email()', 'EXECUTE') THEN
    RAISE EXCEPTION 'Security verification failed: CRM actor helper is anonymous';
  END IF;

  IF NOT has_function_privilege('anon', 'public.rex_public_track_shipment(text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Security verification failed: public shipment tracking is unavailable';
  END IF;

  IF NOT has_function_privilege('anon', 'public.rex_is_delivered_proof_object(text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Security verification failed: delivered proof access check is unavailable';
  END IF;

  SELECT count(*)
    INTO v_anon_rpc_count
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prosecdef
    AND has_function_privilege('anon', p.oid, 'EXECUTE')
    AND pg_catalog.format_type(p.prorettype, NULL) NOT IN ('trigger', 'event_trigger');

  IF v_anon_rpc_count <> 2 THEN
    RAISE EXCEPTION
      'Security verification failed: expected 2 anonymous SECURITY DEFINER RPCs, found %',
      v_anon_rpc_count;
  END IF;
END
$verification$;

COMMIT;
