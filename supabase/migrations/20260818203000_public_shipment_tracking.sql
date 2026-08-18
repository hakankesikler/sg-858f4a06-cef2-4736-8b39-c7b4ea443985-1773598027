-- High-entropy tracking numbers and a privacy-safe public tracking endpoint.

ALTER TABLE public.shipments
  ADD COLUMN IF NOT EXISTS tracking_number text;

CREATE OR REPLACE FUNCTION public.rex_generate_tracking_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public,pg_temp
AS $$
DECLARE
  v_candidate text;
BEGIN
  LOOP
    v_candidate := 'REX-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,16));
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.shipments WHERE tracking_number=v_candidate
    );
  END LOOP;
  RETURN v_candidate;
END $$;

DO $$
DECLARE
  v_id uuid;
BEGIN
  FOR v_id IN
    SELECT id FROM public.shipments WHERE tracking_number IS NULL FOR UPDATE
  LOOP
    UPDATE public.shipments
    SET tracking_number=public.rex_generate_tracking_number()
    WHERE id=v_id;
  END LOOP;
END $$;

ALTER TABLE public.shipments
  ALTER COLUMN tracking_number SET DEFAULT public.rex_generate_tracking_number(),
  ALTER COLUMN tracking_number SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS shipments_tracking_number_unique
  ON public.shipments(tracking_number);

CREATE OR REPLACE FUNCTION public.rex_public_track_shipment(p_tracking_number text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path=public,pg_temp
AS $$
DECLARE
  v_result jsonb;
  v_tracking_number text := upper(trim(coalesce(p_tracking_number,'')));
BEGIN
  IF v_tracking_number !~ '^REX-[A-F0-9]{16}$' THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'tracking_number',s.tracking_number,
    'shipment_code',s.shipment_code,
    'status',s.status,
    'origin',s.origin,
    'destination',s.destination,
    'pickup_date',s.pickup_date,
    'estimated_delivery_date',s.estimated_delivery_date,
    'delivery_date',s.delivery_date,
    'delivered_to',CASE WHEN s.status IN ('teslim_edildi','Teslim Edildi') THEN s.delivered_to ELSE NULL END,
    'delivery_proof_url',CASE WHEN s.status IN ('teslim_edildi','Teslim Edildi') THEN s.delivery_proof_url ELSE NULL END,
    'created_at',s.created_at,
    'updated_at',s.updated_at,
    'events',coalesce((
      SELECT jsonb_agg(
        jsonb_build_object(
          'event_type',e.event_type,
          'old_status',e.old_status,
          'new_status',e.new_status,
          'event_at',e.event_at
        ) ORDER BY e.event_at
      )
      FROM public.shipment_events e
      WHERE e.shipment_id=s.id
        AND e.event_type IN ('created','assignment_changed','status_changed','delivered')
    ),'[]'::jsonb)
  )
  INTO v_result
  FROM public.shipments s
  WHERE s.tracking_number=v_tracking_number;

  RETURN v_result;
END $$;

REVOKE ALL ON FUNCTION public.rex_generate_tracking_number() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.rex_generate_tracking_number() TO authenticated;
REVOKE ALL ON FUNCTION public.rex_public_track_shipment(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rex_public_track_shipment(text) TO anon,authenticated;

CREATE OR REPLACE FUNCTION public.rex_is_delivered_proof_object(p_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path=public,pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.shipments s
    WHERE p_name <> ''
      AND s.status IN ('teslim_edildi','Teslim Edildi')
      AND s.delivery_proof_url IS NOT NULL
      AND right(s.delivery_proof_url,length(p_name))=p_name
  );
$$;

REVOKE ALL ON FUNCTION public.rex_is_delivered_proof_object(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rex_is_delivered_proof_object(text) TO anon,authenticated;

-- The bucket stays private. Anonymous users may only request/read a known
-- delivered proof object; operation-aware filtering prevents bucket listing.
DROP POLICY IF EXISTS rex_public_delivered_proof_select ON storage.objects;
CREATE POLICY rex_public_delivered_proof_select ON storage.objects
  FOR SELECT TO anon
  USING (
    bucket_id='shipment-documents'
    AND storage.allow_any_operation(ARRAY[
      'object.get_authenticated_info',
      'object.get_authenticated'
    ])
    AND public.rex_is_delivered_proof_object(name)
  );
