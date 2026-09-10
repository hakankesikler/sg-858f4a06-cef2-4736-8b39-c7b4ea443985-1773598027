-- Public tracking is status-only. Delivery evidence, recipient identity and
-- provider-internal references remain available only inside the staff portal.

CREATE OR REPLACE FUNCTION public.rex_public_track_shipment(p_tracking_number text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_result jsonb; v_identifier text:=upper(regexp_replace(trim(coalesce(p_tracking_number,'')),'\s','','g'));
BEGIN
  IF v_identifier !~ '^REX-[A-F0-9]{16}$' AND v_identifier !~ '^[A-Z0-9-]{6,40}$' THEN RETURN NULL; END IF;
  SELECT jsonb_build_object(
    'tracking_number',s.tracking_number,'shipment_code',s.shipment_code,'status',s.status,
    'sender_masked',public.rex_mask_public_party_name(s.sender_name),
    'receiver_masked',public.rex_mask_public_party_name(s.receiver),
    'origin',s.origin,'destination',s.destination,
    'pickup_date',s.pickup_date,'estimated_delivery_date',s.estimated_delivery_date,'delivery_date',s.delivery_date,
    'created_at',s.created_at,'updated_at',s.updated_at,'service_mode',s.service_mode,'booking_provider',s.booking_provider,
    'express_carrier',s.express_carrier,'awb_number',s.awb_number,
    'package_type',s.package_type,'origin_country_code',s.origin_country_code,'destination_country_code',s.destination_country_code,
    'carrier_status',s.carrier_status,'carrier_status_description',s.carrier_status_description,'carrier_last_synced_at',s.carrier_last_synced_at,
    'carrier_tracking_url',public.rex_express_tracking_url(s.express_carrier,s.awb_number),
    'events',coalesce((SELECT jsonb_agg(jsonb_build_object('event_type',e.event_type,'old_status',e.old_status,'new_status',e.new_status,'event_at',e.event_at) ORDER BY e.event_at)
      FROM public.shipment_events e WHERE e.shipment_id=s.id AND e.event_type IN ('created','assignment_changed','status_changed','delivered')),'[]'::jsonb)
  ) INTO v_result FROM public.shipments s
  WHERE s.tracking_number=v_identifier OR (s.service_mode='international_express' AND upper(coalesce(s.awb_number,''))=v_identifier)
  ORDER BY CASE WHEN s.tracking_number=v_identifier THEN 0 ELSE 1 END LIMIT 1;
  RETURN v_result;
END $$;

REVOKE ALL ON FUNCTION public.rex_public_track_shipment(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rex_public_track_shipment(text) TO anon,authenticated;

DROP POLICY IF EXISTS rex_public_delivered_proof_select ON storage.objects;
REVOKE ALL ON FUNCTION public.rex_is_delivered_proof_object(text) FROM PUBLIC,anon,authenticated;

COMMENT ON FUNCTION public.rex_public_track_shipment(text) IS
  'Returns public shipment status without recipient identity, delivery evidence or provider-internal references.';
COMMENT ON FUNCTION public.rex_is_delivered_proof_object(text) IS
  'Legacy helper retained for migration compatibility; no browser role may execute it.';
