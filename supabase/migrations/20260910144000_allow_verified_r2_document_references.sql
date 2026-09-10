-- R2 references are accepted only by the same business RPCs that already
-- validate document metadata and caller access. Existing Supabase references
-- remain valid during the migration.

DO $$
DECLARE
  v_definition text;
  v_updated text;
BEGIN
  SELECT pg_get_functiondef('public.rex_register_delivery_document(uuid,text,text,text,text,bigint,text,text,uuid)'::regprocedure)
  INTO v_definition;
  v_updated := v_definition;
  IF position('r2://shipment-documents/delivery-documents/' in v_updated) = 0
     AND position('^(storage|r2)://shipment-documents/delivery-documents/' in v_updated) = 0 THEN
    IF position('p_file_reference !~ ''^storage://shipment-documents/delivery-documents/''' in v_updated) = 0 THEN
      RAISE EXCEPTION 'rex_register_delivery_document path hardening target was not found';
    END IF;
    v_updated := replace(
      v_updated,
      'p_file_reference !~ ''^storage://shipment-documents/delivery-documents/''',
      '(p_file_reference !~ ''^storage://shipment-documents/delivery-documents/'' AND p_file_reference !~ ''^r2://shipment-documents/delivery-documents/'')'
    );
  END IF;
  IF position('operations.delivery' in v_updated) = 0 THEN
    IF position('NOT public.rex_has_role(ARRAY[''admin'',''operations''])' in v_updated) = 0 THEN
      RAISE EXCEPTION 'rex_register_delivery_document permission hardening target was not found';
    END IF;
    v_updated := replace(
      v_updated,
      'NOT public.rex_has_role(ARRAY[''admin'',''operations''])',
      'NOT public.rex_has_permission(''operations.delivery'',''manage'')'
    );
  END IF;
  EXECUTE v_updated;

  SELECT pg_get_functiondef('public.rex_create_shipment_exception(uuid,text,text,text[],uuid,timestamp with time zone)'::regprocedure)
  INTO v_definition;
  v_updated := v_definition;
  IF position('r2://shipment-exception-documents/exceptions/' in v_updated) = 0
     AND position('^(storage|r2)://shipment-exception-documents/exceptions/' in v_updated) = 0 THEN
    IF position('v_photo !~ ''^storage://shipment-exception-documents/exceptions/''' in v_updated) = 0 THEN
      RAISE EXCEPTION 'rex_create_shipment_exception path hardening target was not found';
    END IF;
    v_updated := replace(
      v_updated,
      'v_photo !~ ''^storage://shipment-exception-documents/exceptions/''',
      '(v_photo !~ ''^storage://shipment-exception-documents/exceptions/'' AND v_photo !~ ''^r2://shipment-exception-documents/exceptions/'')'
    );
  END IF;
  IF position('operations.exceptions' in v_updated) = 0 THEN
    IF position('NOT public.rex_has_role(ARRAY[''admin'',''operations''])' in v_updated) = 0 THEN
      RAISE EXCEPTION 'rex_create_shipment_exception permission hardening target was not found';
    END IF;
    v_updated := replace(
      v_updated,
      'NOT public.rex_has_role(ARRAY[''admin'',''operations''])',
      'NOT public.rex_has_permission(''operations.exceptions'',''manage'')'
    );
  END IF;
  EXECUTE v_updated;
END $$;

REVOKE ALL ON FUNCTION public.rex_register_delivery_document(uuid,text,text,text,text,bigint,text,text,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rex_register_delivery_document(uuid,text,text,text,text,bigint,text,text,uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.rex_create_shipment_exception(uuid,text,text,text[],uuid,timestamptz) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rex_create_shipment_exception(uuid,text,text,text[],uuid,timestamptz) TO authenticated;
