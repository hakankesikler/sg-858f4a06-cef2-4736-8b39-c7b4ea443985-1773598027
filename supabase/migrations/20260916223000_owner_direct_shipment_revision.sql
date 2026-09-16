BEGIN;

-- The company owner is the final approver. Requiring the owner to create a
-- request and then approve the same request adds no separation of duties.
-- This wrapper keeps the existing audited revision machinery but completes
-- both steps atomically, without asking the owner for a manual justification.
CREATE OR REPLACE FUNCTION public.rex_owner_apply_shipment_revision(
  p_shipment_id uuid,
  p_proposed_shipment jsonb,
  p_proposed_cargo_items jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_request_id uuid;
  v_email text := lower(coalesce(auth.jwt()->>'email', ''));
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin']) OR v_email <> 'info@rexlojistik.com' THEN
    RAISE EXCEPTION 'Bu işlem yalnızca şirket sahibi hesabı tarafından yapılabilir';
  END IF;

  v_request_id := public.rex_request_shipment_revision(
    p_shipment_id,
    'Şirket sahibi tarafından doğrudan düzenlendi',
    p_proposed_shipment,
    p_proposed_cargo_items
  );

  PERFORM public.rex_review_shipment_revision(
    v_request_id,
    'approve',
    'Şirket sahibi tarafından doğrudan uygulandı'
  );

  RETURN v_request_id;
END
$$;

REVOKE ALL ON FUNCTION public.rex_owner_apply_shipment_revision(uuid, jsonb, jsonb)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rex_owner_apply_shipment_revision(uuid, jsonb, jsonb)
  TO authenticated;

COMMENT ON FUNCTION public.rex_owner_apply_shipment_revision(uuid, jsonb, jsonb) IS
  'Atomically applies an owner-authored completed-shipment revision while preserving the revision audit trail.';

COMMIT;
