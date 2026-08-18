-- Shipment deletion is reserved for the company owner account and always
-- requires the exact shipment code as a second confirmation.

DROP POLICY IF EXISTS rex_shipments_delete_owner_only ON public.shipments;
CREATE POLICY rex_shipments_delete_owner_only ON public.shipments
  AS RESTRICTIVE
  FOR DELETE TO authenticated
  USING (false);

CREATE OR REPLACE FUNCTION public.rex_owner_delete_shipment(
  p_shipment_id uuid,
  p_confirmation_code text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public,pg_temp
AS $$
DECLARE
  v_code text;
  v_email text := lower(coalesce(auth.jwt()->>'email',''));
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin']) OR v_email <> 'info@rexlojistik.com' THEN
    RAISE EXCEPTION 'Sevkiyat silme yetkisi yalnızca şirket sahibi hesabına aittir';
  END IF;

  SELECT shipment_code INTO v_code
  FROM public.shipments
  WHERE id=p_shipment_id
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sevkiyat bulunamadı'; END IF;

  IF nullif(trim(p_confirmation_code),'') IS NULL OR trim(p_confirmation_code) <> v_code THEN
    RAISE EXCEPTION 'Onay için sevkiyat kodunu eksiksiz yazmalısınız';
  END IF;

  DELETE FROM public.shipments WHERE id=p_shipment_id;
END $$;

REVOKE ALL ON FUNCTION public.rex_owner_delete_shipment(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rex_owner_delete_shipment(uuid,text) TO authenticated;
