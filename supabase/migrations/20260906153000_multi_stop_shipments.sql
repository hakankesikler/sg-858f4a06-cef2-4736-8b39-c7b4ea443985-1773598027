BEGIN;

CREATE TABLE IF NOT EXISTS public.shipment_route_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  stop_key text NOT NULL,
  stop_type text NOT NULL CHECK (stop_type IN ('pickup','delivery')),
  sequence_no integer NOT NULL CHECK (sequence_no > 0),
  company_name text NOT NULL CHECK (length(trim(company_name)) > 0),
  address_line text,
  district text,
  city text NOT NULL CHECK (length(trim(city)) > 0),
  contact_name text,
  contact_phone text,
  instructions text,
  planned_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shipment_id,stop_key),
  UNIQUE (shipment_id,stop_type,sequence_no)
);

CREATE INDEX IF NOT EXISTS shipment_route_stops_shipment_idx
  ON public.shipment_route_stops(shipment_id,stop_type,sequence_no);

ALTER TABLE public.shipment_cargo_items
  ADD COLUMN IF NOT EXISTS pickup_stop_id uuid REFERENCES public.shipment_route_stops(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS delivery_stop_id uuid REFERENCES public.shipment_route_stops(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS route_description text;

CREATE INDEX IF NOT EXISTS shipment_cargo_items_pickup_stop_idx
  ON public.shipment_cargo_items(pickup_stop_id);
CREATE INDEX IF NOT EXISTS shipment_cargo_items_delivery_stop_idx
  ON public.shipment_cargo_items(delivery_stop_id);

INSERT INTO public.shipment_route_stops(
  shipment_id,stop_key,stop_type,sequence_no,company_name,district,city
)
SELECT s.id,'legacy-pickup-1','pickup',1,
  coalesce(nullif(trim(s.sender_name),''),'Alım noktası'),NULL,
  coalesce(nullif(trim(s.origin),''),'Belirtilmemiş')
FROM public.shipments s
WHERE NOT EXISTS (
  SELECT 1 FROM public.shipment_route_stops rs
  WHERE rs.shipment_id=s.id AND rs.stop_type='pickup'
);

INSERT INTO public.shipment_route_stops(
  shipment_id,stop_key,stop_type,sequence_no,company_name,district,city
)
SELECT s.id,'legacy-delivery-1','delivery',1,
  coalesce(nullif(trim(s.receiver),''),'Teslim noktası'),nullif(trim(s.receiver_district),''),
  coalesce(nullif(trim(s.destination),''),nullif(trim(s.receiver_ii),''),'Belirtilmemiş')
FROM public.shipments s
WHERE NOT EXISTS (
  SELECT 1 FROM public.shipment_route_stops rs
  WHERE rs.shipment_id=s.id AND rs.stop_type='delivery'
);

UPDATE public.shipment_cargo_items c
SET pickup_stop_id=(
      SELECT rs.id FROM public.shipment_route_stops rs
      WHERE rs.shipment_id=c.shipment_id AND rs.stop_type='pickup'
      ORDER BY rs.sequence_no LIMIT 1
    ),
    delivery_stop_id=(
      SELECT rs.id FROM public.shipment_route_stops rs
      WHERE rs.shipment_id=c.shipment_id AND rs.stop_type='delivery'
      ORDER BY rs.sequence_no LIMIT 1
    )
WHERE c.pickup_stop_id IS NULL OR c.delivery_stop_id IS NULL;

CREATE OR REPLACE FUNCTION public.rex_validate_cargo_route_stops()
RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
  IF NEW.pickup_stop_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.shipment_route_stops s
    WHERE s.id=NEW.pickup_stop_id AND s.shipment_id=NEW.shipment_id AND s.stop_type='pickup'
  ) THEN
    RAISE EXCEPTION 'Yük kaleminin alım noktası bu sevkiyata ait değil';
  END IF;
  IF NEW.delivery_stop_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.shipment_route_stops s
    WHERE s.id=NEW.delivery_stop_id AND s.shipment_id=NEW.shipment_id AND s.stop_type='delivery'
  ) THEN
    RAISE EXCEPTION 'Yük kaleminin teslim noktası bu sevkiyata ait değil';
  END IF;
  NEW.route_description:=nullif(left(trim(coalesce(NEW.route_description,'')),1000),'');
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS rex_validate_cargo_route_stops ON public.shipment_cargo_items;
CREATE TRIGGER rex_validate_cargo_route_stops
  BEFORE INSERT OR UPDATE OF shipment_id,pickup_stop_id,delivery_stop_id,route_description
  ON public.shipment_cargo_items
  FOR EACH ROW EXECUTE FUNCTION public.rex_validate_cargo_route_stops();

CREATE OR REPLACE FUNCTION public.rex_guard_completed_route_stop_revision()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
  v_shipment_id uuid:=CASE WHEN TG_OP='DELETE' THEN OLD.shipment_id ELSE NEW.shipment_id END;
  v_status text;
  v_revision text:=current_setting('rex.approved_revision_id',true);
BEGIN
  SELECT status INTO v_status FROM public.shipments WHERE id=v_shipment_id;
  IF v_status IN ('teslim_edildi','Teslim Edildi') THEN
    IF nullif(v_revision,'') IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.shipment_revision_requests r
      WHERE r.id=v_revision::uuid AND r.shipment_id=v_shipment_id AND r.status='approved'
    ) THEN
      RAISE EXCEPTION 'Tamamlanmış sevkiyatın rota noktaları yalnızca onaylı revizyonla değiştirilebilir';
    END IF;
  END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS rex_completed_route_stop_revision_guard ON public.shipment_route_stops;
CREATE TRIGGER rex_completed_route_stop_revision_guard
  BEFORE INSERT OR UPDATE OR DELETE ON public.shipment_route_stops
  FOR EACH ROW EXECUTE FUNCTION public.rex_guard_completed_route_stop_revision();

ALTER TABLE public.shipment_route_stops ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.shipment_route_stops FROM anon;
GRANT SELECT ON TABLE public.shipment_route_stops TO authenticated;
DROP POLICY IF EXISTS rex_permission_select ON public.shipment_route_stops;
CREATE POLICY rex_permission_select ON public.shipment_route_stops
  FOR SELECT TO authenticated
  USING (
    public.rex_has_permission('operations.shipments','view') OR
    public.rex_has_permission('reports.operations','view')
  );
DROP POLICY IF EXISTS rex_permission_write ON public.shipment_route_stops;
CREATE POLICY rex_permission_write ON public.shipment_route_stops
  FOR ALL TO authenticated
  USING (public.rex_has_permission('operations.shipments','manage'))
  WITH CHECK (public.rex_has_permission('operations.shipments','manage'));
DROP TRIGGER IF EXISTS rex_granular_permission_guard ON public.shipment_route_stops;
CREATE TRIGGER rex_granular_permission_guard
  BEFORE INSERT OR UPDATE OR DELETE ON public.shipment_route_stops
  FOR EACH ROW EXECUTE FUNCTION public.rex_require_permission('operations.shipments');

CREATE OR REPLACE FUNCTION public.rex_save_shipment_multistop(
  p_shipment_id uuid,
  p_shipment jsonb,
  p_cargo_items jsonb,
  p_route_stops jsonb,
  p_uetds_details jsonb DEFAULT '{}'::jsonb
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
  v_id uuid;
  v_stop jsonb;
  v_item jsonb;
  v_pickup jsonb;
  v_delivery jsonb;
  v_shipment jsonb:=coalesce(p_shipment,'{}'::jsonb);
  v_stop_count integer;
  v_distinct_stop_count integer;
BEGIN
  IF jsonb_typeof(p_route_stops) IS DISTINCT FROM 'array' OR jsonb_array_length(p_route_stops)<2 THEN
    RAISE EXCEPTION 'En az bir alım ve bir teslim noktası gereklidir';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(p_route_stops) s WHERE s->>'stop_type'='pickup')
     OR NOT EXISTS (SELECT 1 FROM jsonb_array_elements(p_route_stops) s WHERE s->>'stop_type'='delivery') THEN
    RAISE EXCEPTION 'En az bir alım ve bir teslim noktası gereklidir';
  END IF;

  SELECT count(*),count(DISTINCT value->>'stop_key')
    INTO v_stop_count,v_distinct_stop_count
  FROM jsonb_array_elements(p_route_stops);
  IF v_stop_count<>v_distinct_stop_count THEN RAISE EXCEPTION 'Rota noktası anahtarları benzersiz olmalıdır'; END IF;

  FOR v_stop IN SELECT value FROM jsonb_array_elements(p_route_stops) LOOP
    IF coalesce(v_stop->>'stop_type','') NOT IN ('pickup','delivery')
       OR nullif(trim(v_stop->>'stop_key'),'') IS NULL
       OR nullif(trim(v_stop->>'company_name'),'') IS NULL
       OR nullif(trim(v_stop->>'city'),'') IS NULL THEN
      RAISE EXCEPTION 'Her rota noktası için tür, firma ve il zorunludur';
    END IF;
  END LOOP;

  IF jsonb_typeof(p_cargo_items) IS DISTINCT FROM 'array' OR jsonb_array_length(p_cargo_items)=0 THEN
    RAISE EXCEPTION 'En az bir yük kalemi gereklidir';
  END IF;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_cargo_items) LOOP
    IF NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(p_route_stops) s
      WHERE s->>'stop_type'='pickup' AND s->>'stop_key'=v_item->>'pickup_stop_key'
    ) OR NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(p_route_stops) s
      WHERE s->>'stop_type'='delivery' AND s->>'stop_key'=v_item->>'delivery_stop_key'
    ) THEN
      RAISE EXCEPTION 'Her yük kalemi geçerli bir alım ve teslim noktasına bağlanmalıdır';
    END IF;
  END LOOP;

  SELECT value INTO v_pickup FROM jsonb_array_elements(p_route_stops)
    WHERE value->>'stop_type'='pickup'
    ORDER BY coalesce(nullif(value->>'sequence_no','')::integer,1) LIMIT 1;
  SELECT value INTO v_delivery FROM jsonb_array_elements(p_route_stops)
    WHERE value->>'stop_type'='delivery'
    ORDER BY coalesce(nullif(value->>'sequence_no','')::integer,1) LIMIT 1;

  v_shipment:=v_shipment||jsonb_build_object(
    'sender_name',trim(v_pickup->>'company_name'),
    'sender_ii',trim(v_pickup->>'city'),
    'origin',trim(v_pickup->>'city'),
    'receiver',trim(v_delivery->>'company_name'),
    'receiver_district',nullif(trim(v_delivery->>'district'),''),
    'receiver_ii',trim(v_delivery->>'city'),
    'destination',trim(v_delivery->>'city')
  );

  v_id:=public.rex_save_shipment_with_uetds(
    p_shipment_id,v_shipment,p_cargo_items,coalesce(p_uetds_details,'{}'::jsonb)
  );

  DELETE FROM public.shipment_route_stops WHERE shipment_id=v_id;
  INSERT INTO public.shipment_route_stops(
    shipment_id,stop_key,stop_type,sequence_no,company_name,address_line,district,city,
    contact_name,contact_phone,instructions,planned_at
  )
  SELECT v_id,trim(s->>'stop_key'),s->>'stop_type',row_number() OVER (
      PARTITION BY s->>'stop_type' ORDER BY coalesce(nullif(s->>'sequence_no','')::integer,1)
    ),trim(s->>'company_name'),nullif(trim(s->>'address_line'),''),nullif(trim(s->>'district'),''),
    trim(s->>'city'),nullif(trim(s->>'contact_name'),''),nullif(trim(s->>'contact_phone'),''),
    nullif(trim(s->>'instructions'),''),nullif(s->>'planned_at','')::timestamptz
  FROM jsonb_array_elements(p_route_stops) s;

  UPDATE public.shipment_cargo_items c
  SET pickup_stop_id=pickup.id,
      delivery_stop_id=delivery.id,
      route_description=nullif(left(trim(coalesce(ci.item->>'route_description','')),1000),'')
  FROM jsonb_array_elements(p_cargo_items) WITH ORDINALITY ci(item,ordinality)
  JOIN public.shipment_route_stops pickup
    ON pickup.shipment_id=v_id AND pickup.stop_type='pickup'
   AND pickup.stop_key=ci.item->>'pickup_stop_key'
  JOIN public.shipment_route_stops delivery
    ON delivery.shipment_id=v_id AND delivery.stop_type='delivery'
   AND delivery.stop_key=ci.item->>'delivery_stop_key'
  WHERE c.shipment_id=v_id AND c.sira_no=ci.ordinality;

  IF EXISTS (
    SELECT 1 FROM public.shipment_cargo_items c
    WHERE c.shipment_id=v_id AND (c.pickup_stop_id IS NULL OR c.delivery_stop_id IS NULL)
  ) THEN
    RAISE EXCEPTION 'Yük kalemlerinin rota bağlantısı tamamlanamadı';
  END IF;
  RETURN v_id;
END $$;

REVOKE ALL ON FUNCTION public.rex_save_shipment_multistop(uuid,jsonb,jsonb,jsonb,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rex_save_shipment_multistop(uuid,jsonb,jsonb,jsonb,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.rex_review_shipment_revision(
  p_request_id uuid,p_decision text,p_note text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
  v_request public.shipment_revision_requests%ROWTYPE;
  v_email text:=lower(coalesce(auth.jwt()->>'email',''));
  v_route_stops jsonb;
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin']) OR v_email<>'info@rexlojistik.com' THEN
    RAISE EXCEPTION 'Revizyonu yalnızca şirket sahibi hesabı onaylayabilir';
  END IF;
  IF p_decision NOT IN ('approve','reject') THEN RAISE EXCEPTION 'Geçersiz revizyon kararı'; END IF;
  IF p_decision='reject' AND (nullif(trim(p_note),'') IS NULL OR length(trim(p_note))<5) THEN
    RAISE EXCEPTION 'Ret açıklaması en az 5 karakter olmalıdır';
  END IF;
  SELECT * INTO v_request FROM public.shipment_revision_requests WHERE id=p_request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Revizyon talebi bulunamadı'; END IF;
  IF v_request.status<>'pending' THEN RAISE EXCEPTION 'Revizyon talebi daha önce sonuçlandırılmış'; END IF;

  IF p_decision='reject' THEN
    UPDATE public.shipment_revision_requests
    SET status='rejected',reviewed_by=auth.uid(),reviewed_by_email=v_email,reviewed_at=now(),review_note=trim(p_note)
    WHERE id=p_request_id;
    INSERT INTO public.shipment_events(
      shipment_id,shipment_code,event_type,old_status,new_status,changed_fields,
      actor_id,actor_email,actor_role,source,note
    ) SELECT s.id,s.shipment_code,'revision_rejected',s.status,s.status,
      jsonb_build_object('revision_request_id',p_request_id,'review_note',trim(p_note)),
      auth.uid(),v_email,'admin','portal','Revizyon talebi reddedildi: '||trim(p_note)
    FROM public.shipments s WHERE s.id=v_request.shipment_id;
    RETURN;
  END IF;

  UPDATE public.shipment_revision_requests
  SET status='approved',reviewed_by=auth.uid(),reviewed_by_email=v_email,reviewed_at=now(),review_note=nullif(trim(p_note),'')
  WHERE id=p_request_id;
  PERFORM set_config('rex.approved_revision_id',p_request_id::text,true);
  v_route_stops:=v_request.proposed_shipment->'_route_stops';
  IF jsonb_typeof(v_route_stops)='array' AND jsonb_array_length(v_route_stops)>=2 THEN
    PERFORM public.rex_save_shipment_multistop(
      v_request.shipment_id,
      (v_request.proposed_shipment-'_route_stops')||jsonb_build_object('_owner_confirmation_code',v_request.shipment_code),
      v_request.proposed_cargo_items,v_route_stops,
      coalesce(v_request.proposed_shipment->'_uetds_details','{}'::jsonb)
    );
  ELSE
    PERFORM public.rex_save_shipment(
      v_request.shipment_id,
      v_request.proposed_shipment||jsonb_build_object('_owner_confirmation_code',v_request.shipment_code),
      v_request.proposed_cargo_items
    );
  END IF;
  UPDATE public.shipment_revision_requests SET status='applied',applied_at=now() WHERE id=p_request_id;
  INSERT INTO public.shipment_events(
    shipment_id,shipment_code,event_type,old_status,new_status,changed_fields,
    actor_id,actor_email,actor_role,source,note
  ) SELECT s.id,s.shipment_code,'revision_applied',s.status,s.status,
    jsonb_build_object('revision_request_id',p_request_id,'review_note',p_note),
    auth.uid(),v_email,'admin','portal','Revizyon şirket sahibi tarafından onaylandı ve uygulandı'
  FROM public.shipments s WHERE s.id=v_request.shipment_id;
END $$;

REVOKE ALL ON FUNCTION public.rex_review_shipment_revision(uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rex_review_shipment_revision(uuid,text,text) TO authenticated;

COMMENT ON TABLE public.shipment_route_stops IS
  'A shipment may contain any number of ordered pickup and delivery stops.';
COMMENT ON COLUMN public.shipment_cargo_items.route_description IS
  'Operational explanation for what is collected at the pickup stop and delivered to the destination stop.';
COMMENT ON FUNCTION public.rex_save_shipment_multistop(uuid,jsonb,jsonb,jsonb,jsonb) IS
  'Atomically saves a shipment, ordered route stops and cargo-to-stop assignments.';

COMMIT;
