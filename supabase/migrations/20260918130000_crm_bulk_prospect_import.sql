BEGIN;

-- Excel ile aktarılan potansiyel müşteriler ayrı bir denetim kaydında tutulur.
CREATE TABLE IF NOT EXISTS public.crm_prospect_import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key text NOT NULL UNIQUE,
  file_name text NOT NULL,
  row_count integer NOT NULL CHECK (row_count BETWEEN 1 AND 1000),
  imported_rows integer NOT NULL DEFAULT 0,
  duplicate_rows integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_prospect_import_batches ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.crm_prospect_import_batches TO authenticated;

DROP POLICY IF EXISTS rex_crm_prospect_import_batches_select ON public.crm_prospect_import_batches;
CREATE POLICY rex_crm_prospect_import_batches_select ON public.crm_prospect_import_batches
  FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR public.rex_is_owner_admin());

-- Kaynak alanı, toplu CRM aktarımının izlenebilmesi için açıkça işaretlenir.
ALTER TABLE public.crm_opportunities DROP CONSTRAINT IF EXISTS crm_opportunities_source_check;
ALTER TABLE public.crm_opportunities ADD CONSTRAINT crm_opportunities_source_check
  CHECK (source IN ('manual', 'website', 'referral', 'existing_customer', 'integration', 'excel'));

CREATE OR REPLACE FUNCTION public.rex_crm_import_prospects(
  p_file_name text,
  p_idempotency_key text,
  p_rows jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_batch public.crm_prospect_import_batches%ROWTYPE;
  v_row jsonb;
  v_company_name text;
  v_contact_name text;
  v_email text;
  v_phone text;
  v_phone_digits text;
  v_next_action_at timestamptz;
  v_notes text;
  v_duplicate boolean;
  v_imported integer := 0;
  v_duplicates integer := 0;
BEGIN
  IF NOT public.rex_has_permission('crm.sales_pipeline', 'manage') THEN
    RAISE EXCEPTION 'CRM potansiyel müşteri aktarım yetkiniz bulunmuyor';
  END IF;

  IF jsonb_typeof(p_rows) <> 'array' OR jsonb_array_length(p_rows) NOT BETWEEN 1 AND 1000 THEN
    RAISE EXCEPTION 'Excel aktarımı 1-1000 satır arasında olmalıdır';
  END IF;

  SELECT * INTO v_batch
  FROM public.crm_prospect_import_batches
  WHERE idempotency_key = trim(coalesce(p_idempotency_key, ''));

  IF FOUND THEN
    RETURN jsonb_build_object(
      'batch_id', v_batch.id,
      'already_processed', true,
      'total', v_batch.row_count,
      'imported', v_batch.imported_rows,
      'duplicates', v_batch.duplicate_rows
    );
  END IF;

  INSERT INTO public.crm_prospect_import_batches(idempotency_key, file_name, row_count)
  VALUES (trim(p_idempotency_key), left(trim(coalesce(p_file_name, 'Excel aktarımı')), 255), jsonb_array_length(p_rows))
  RETURNING * INTO v_batch;

  FOR v_row IN SELECT value FROM jsonb_array_elements(p_rows) LOOP
    v_company_name := trim(coalesce(v_row->>'company_name', ''));
    v_contact_name := nullif(trim(coalesce(v_row->>'contact_name', '')), '');
    v_email := nullif(lower(trim(coalesce(v_row->>'email', ''))), '');
    v_phone := nullif(trim(coalesce(v_row->>'phone', '')), '');
    v_phone_digits := nullif(regexp_replace(coalesce(v_phone, ''), '\D', '', 'g'), '');
    v_notes := nullif(trim(coalesce(v_row->>'notes', '')), '');

    IF length(v_company_name) < 2 THEN
      RAISE EXCEPTION 'Aktarım satırında firma adı en az 2 karakter olmalıdır';
    END IF;
    IF v_email IS NULL AND v_phone_digits IS NULL THEN
      RAISE EXCEPTION '% için telefon veya e-posta zorunludur', v_company_name;
    END IF;
    IF v_email IS NOT NULL AND v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN
      RAISE EXCEPTION '% için e-posta biçimi geçersiz', v_company_name;
    END IF;
    IF v_phone_digits IS NOT NULL AND length(v_phone_digits) < 7 THEN
      RAISE EXCEPTION '% için telefon en az 7 rakam içermelidir', v_company_name;
    END IF;

    BEGIN
      v_next_action_at := nullif(trim(coalesce(v_row->>'next_action_at', '')), '')::timestamptz;
    EXCEPTION WHEN invalid_datetime_format OR datetime_field_overflow THEN
      RAISE EXCEPTION '% için sonraki işlem tarihi geçersiz', v_company_name;
    END;

    SELECT EXISTS (
      SELECT 1
      FROM public.customers c
      WHERE c.archived_at IS NULL
        AND (
          lower(trim(c.name)) = lower(v_company_name)
          OR (v_email IS NOT NULL AND lower(coalesce(c.email, '')) = v_email)
          OR (v_phone_digits IS NOT NULL AND regexp_replace(coalesce(c.phone, ''), '\D', '', 'g') = v_phone_digits)
        )
      UNION ALL
      SELECT 1
      FROM public.crm_opportunities o
      WHERE o.stage NOT IN ('won', 'lost')
        AND (
          lower(trim(o.company_name)) = lower(v_company_name)
          OR (v_email IS NOT NULL AND lower(coalesce(o.email, '')) = v_email)
          OR (v_phone_digits IS NOT NULL AND regexp_replace(coalesce(o.phone, ''), '\D', '', 'g') = v_phone_digits)
        )
    ) INTO v_duplicate;

    IF v_duplicate THEN
      v_duplicates := v_duplicates + 1;
      CONTINUE;
    END IF;

    INSERT INTO public.crm_opportunities(
      company_name, contact_name, email, phone, source, stage, assigned_to, next_action_at, notes, created_by
    ) VALUES (
      v_company_name,
      v_contact_name,
      v_email,
      v_phone,
      'excel',
      'introduction',
      auth.uid(),
      coalesce(v_next_action_at, now() + interval '7 days'),
      concat_ws(E'\n', 'Excel toplu aktarımı: ' || v_batch.file_name, v_notes),
      auth.uid()
    );
    v_imported := v_imported + 1;
  END LOOP;

  UPDATE public.crm_prospect_import_batches
  SET imported_rows = v_imported, duplicate_rows = v_duplicates
  WHERE id = v_batch.id;

  RETURN jsonb_build_object(
    'batch_id', v_batch.id,
    'already_processed', false,
    'total', jsonb_array_length(p_rows),
    'imported', v_imported,
    'duplicates', v_duplicates
  );
END;
$$;

REVOKE ALL ON FUNCTION public.rex_crm_import_prospects(text, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rex_crm_import_prospects(text, text, jsonb) TO authenticated;

COMMIT;
