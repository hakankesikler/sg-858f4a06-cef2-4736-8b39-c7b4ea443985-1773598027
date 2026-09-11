BEGIN;

ALTER TABLE public.shipments
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

UPDATE public.shipments s
SET delivered_at=coalesce(
  (
    SELECT min(e.event_at)
    FROM public.shipment_events e
    WHERE e.shipment_id=s.id
      AND (
        e.event_type='delivered' OR
        (e.event_type='status_changed' AND e.new_status IN ('teslim_edildi','Teslim Edildi'))
      )
  ),
  s.actual_delivery_date,
  s.updated_at,
  now()
)
WHERE s.status IN ('teslim_edildi','Teslim Edildi')
  AND s.delivered_at IS NULL;

CREATE OR REPLACE FUNCTION public.rex_stamp_shipment_delivered_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public,pg_temp
AS $$
BEGIN
  IF NEW.status IN ('teslim_edildi','Teslim Edildi') THEN
    IF TG_OP='INSERT' THEN
      NEW.delivered_at:=coalesce(NEW.delivered_at,now());
    ELSIF OLD.status IS DISTINCT FROM NEW.status OR NEW.delivered_at IS NULL THEN
      NEW.delivered_at:=coalesce(NEW.delivered_at,now());
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS rex_shipments_stamp_delivered_at ON public.shipments;
DROP TRIGGER IF EXISTS rex_shipments_stamp_delivered_at_insert ON public.shipments;
DROP TRIGGER IF EXISTS rex_shipments_stamp_delivered_at_update ON public.shipments;
CREATE TRIGGER rex_shipments_stamp_delivered_at_insert
BEFORE INSERT ON public.shipments
FOR EACH ROW
EXECUTE FUNCTION public.rex_stamp_shipment_delivered_at();
CREATE TRIGGER rex_shipments_stamp_delivered_at_update
BEFORE UPDATE OF status ON public.shipments
FOR EACH ROW
EXECUTE FUNCTION public.rex_stamp_shipment_delivered_at();

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
    'delivered_to_masked',CASE WHEN s.status IN ('teslim_edildi','Teslim Edildi')
      THEN public.rex_mask_public_party_name(s.delivered_to) END,
    'delivery_document_available_until',CASE
      WHEN s.status IN ('teslim_edildi','Teslim Edildi')
       AND s.delivered_at IS NOT NULL
       AND now()<s.delivered_at+interval '24 hours'
       AND EXISTS (
         SELECT 1 FROM public.delivery_documents d
         WHERE d.shipment_id=s.id AND d.document_type='delivery_proof'
           AND d.is_active=true AND d.scan_status IN ('clean','legacy_unscanned')
       )
      THEN s.delivered_at+interval '24 hours'
    END,
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

REVOKE ALL ON FUNCTION public.rex_stamp_shipment_delivered_at() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.rex_public_track_shipment(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rex_public_track_shipment(text) TO anon,authenticated;

COMMENT ON COLUMN public.shipments.delivered_at IS
  'Exact server-side delivery completion time used for time-limited public delivery-document access.';
COMMENT ON FUNCTION public.rex_public_track_shipment(text) IS
  'Returns privacy-safe public shipment status, a masked recipient and at most a 24-hour delivery-document availability window.';

COMMIT;
