-- Public tracking may show a recognizable party hint, but never the complete
-- sender or receiver name. Masking happens inside the security-definer RPC so
-- the raw values are not transmitted to an anonymous browser.

CREATE OR REPLACE FUNCTION public.rex_mask_public_party_name(p_name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path=public,pg_temp
AS $$
DECLARE
  v_clean text:=regexp_replace(trim(coalesce(p_name,'')),'\s+',' ','g');
  v_words text[];
  v_word text;
  v_result text:='';
  v_index integer:=0;
  v_visible integer;
BEGIN
  IF v_clean='' THEN RETURN NULL; END IF;
  v_words:=regexp_split_to_array(v_clean,' ');
  FOREACH v_word IN ARRAY v_words LOOP
    v_index:=v_index+1;
    IF v_index=1 THEN
      v_visible:=CASE WHEN char_length(v_word)<=3 THEN char_length(v_word) ELSE 2 END;
      v_result:=upper(substr(v_word,1,1))||lower(substr(v_word,2,greatest(v_visible-1,0)))
        ||repeat('*',greatest(char_length(v_word)-v_visible,0));
    ELSE
      v_result:=v_result||' '||repeat('*',greatest(char_length(v_word),3));
    END IF;
  END LOOP;
  RETURN v_result;
END $$;

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
    'delivered_to',CASE WHEN s.status IN ('teslim_edildi','Teslim Edildi') THEN s.delivered_to END,
    'delivery_proof_url',CASE WHEN s.status IN ('teslim_edildi','Teslim Edildi') THEN s.delivery_proof_url END,
    'created_at',s.created_at,'updated_at',s.updated_at,'service_mode',s.service_mode,'booking_provider',s.booking_provider,
    'express_carrier',s.express_carrier,'awb_number',s.awb_number,'provider_reference',s.provider_reference,
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

REVOKE ALL ON FUNCTION public.rex_mask_public_party_name(text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.rex_public_track_shipment(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rex_public_track_shipment(text) TO anon,authenticated;

COMMENT ON FUNCTION public.rex_mask_public_party_name(text) IS
  'Returns a privacy-safe public hint such as Tu*** ***** without exposing a complete party name.';
