-- U-ETDS V2 readiness, controlled submission queue and immutable attempt history.
-- No Ministry username, password or token is stored in PostgreSQL.

ALTER TABLE public.shipment_events
  DROP CONSTRAINT IF EXISTS shipment_events_event_type_check;
ALTER TABLE public.shipment_events
  ADD CONSTRAINT shipment_events_event_type_check CHECK (event_type IN (
    'history_enabled','created','updated','assignment_changed','status_changed',
    'delivery_document_added','delivered','invoiced','invoice_unlinked','deleted',
    'owner_approved_edit','job_created','job_approved',
    'kolaybi_sync_started','kolaybi_sync_succeeded','kolaybi_sync_failed',
    'cancelled','revision_requested','revision_rejected','revision_applied','invoice_cancelled',
    'uetds_details_updated','uetds_queued','uetds_accepted','uetds_failed',
    'uetds_carrier_reference_recorded','uetds_cancellation_queued'
  ));

CREATE TABLE IF NOT EXISTS public.uetds_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  environment text NOT NULL DEFAULT 'disabled' CHECK (environment IN ('disabled','test','live')),
  reporter_mode text NOT NULL DEFAULT 'carrier' CHECK (reporter_mode IN ('rex','carrier')),
  enforcement_enabled boolean NOT NULL DEFAULT false,
  certificate_type text NOT NULL DEFAULT 'TIO',
  certificate_number text,
  unet_number text,
  certificate_expiry date,
  gateway_url text,
  fixed_egress_ip inet,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

INSERT INTO public.uetds_settings(
  id,environment,reporter_mode,enforcement_enabled,certificate_type,
  certificate_number,unet_number,certificate_expiry
) VALUES (
  true,'disabled','carrier',false,'TIO','İZM.U-NET.TİO.35.6323','1242885','2027-12-02'
) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.shipment_uetds_details (
  shipment_id uuid PRIMARY KEY REFERENCES public.shipments(id) ON DELETE RESTRICT,
  reporter_mode text NOT NULL DEFAULT 'carrier' CHECK (reporter_mode IN ('rex','carrier')),
  carrier_authorization_type text,
  carrier_authorization_number text,
  sender_tax_id text,
  receiver_tax_id text,
  loading_country_code text NOT NULL DEFAULT 'TR',
  loading_city_code integer,
  loading_district_code integer,
  unloading_country_code text NOT NULL DEFAULT 'TR',
  unloading_city_code integer,
  unloading_district_code integer,
  planned_departure_at timestamptz,
  planned_arrival_at timestamptz,
  transport_type smallint NOT NULL DEFAULT 2 CHECK (transport_type IN (1,2)),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.shipment_cargo_items
  ADD COLUMN IF NOT EXISTS uetds_load_type_code text,
  ADD COLUMN IF NOT EXISTS uetds_unit_code text DEFAULT 'KG',
  ADD COLUMN IF NOT EXISTS dangerous_goods boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS un_number text,
  ADD COLUMN IF NOT EXISTS dangerous_transport_code integer,
  ADD COLUMN IF NOT EXISTS uetds_description text;

CREATE TABLE IF NOT EXISTS public.uetds_journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL UNIQUE REFERENCES public.shipments(id) ON DELETE RESTRICT,
  reporting_mode text NOT NULL CHECK (reporting_mode IN ('rex','carrier')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft','incomplete','ready','queued','sending','accepted','partial_error',
    'error','update_pending','cancel_pending','cancelled','carrier_reported'
  )),
  company_journey_number text NOT NULL UNIQUE,
  uetds_journey_reference text,
  carrier_reference text,
  payload_hash text,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  last_error text,
  next_retry_at timestamptz,
  queued_at timestamptz,
  submitted_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

CREATE TABLE IF NOT EXISTS public.uetds_journey_loads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id uuid NOT NULL REFERENCES public.uetds_journeys(id) ON DELETE RESTRICT,
  cargo_item_id uuid NOT NULL REFERENCES public.shipment_cargo_items(id) ON DELETE RESTRICT,
  company_load_number text NOT NULL,
  uetds_load_reference text,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','accepted','error','cancelled')),
  result_code text,
  result_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(journey_id,cargo_item_id),
  UNIQUE(company_load_number)
);

CREATE TABLE IF NOT EXISTS public.uetds_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id uuid NOT NULL REFERENCES public.uetds_journeys(id) ON DELETE RESTRICT,
  operation text NOT NULL CHECK (operation IN (
    'new_journey_v2','update_journey','add_load','update_load_v2',
    'cancel_load_v2','cancel_journey','activate_journey','query_summary','query_report'
  )),
  request_hash text NOT NULL,
  status text NOT NULL CHECK (status IN ('queued','sending','success','error')),
  response_code text,
  response_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

CREATE INDEX IF NOT EXISTS uetds_journeys_status_retry_idx
  ON public.uetds_journeys(status,next_retry_at,created_at);
CREATE INDEX IF NOT EXISTS uetds_attempts_journey_idx
  ON public.uetds_attempts(journey_id,created_at DESC);

ALTER TABLE public.uetds_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_uetds_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uetds_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uetds_journey_loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uetds_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY rex_uetds_settings_select ON public.uetds_settings
  FOR SELECT TO authenticated USING (public.rex_has_role(ARRAY['admin','operations']));
CREATE POLICY rex_shipment_uetds_details_select ON public.shipment_uetds_details
  FOR SELECT TO authenticated USING (public.rex_has_role(ARRAY['admin','operations']));
CREATE POLICY rex_uetds_journeys_select ON public.uetds_journeys
  FOR SELECT TO authenticated USING (public.rex_has_role(ARRAY['admin','operations']));
CREATE POLICY rex_uetds_journey_loads_select ON public.uetds_journey_loads
  FOR SELECT TO authenticated USING (public.rex_has_role(ARRAY['admin','operations']));
CREATE POLICY rex_uetds_attempts_select ON public.uetds_attempts
  FOR SELECT TO authenticated USING (public.rex_has_role(ARRAY['admin','operations']));

REVOKE ALL ON public.uetds_settings,public.shipment_uetds_details,public.uetds_journeys,
  public.uetds_journey_loads,public.uetds_attempts FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.uetds_settings,public.shipment_uetds_details,public.uetds_journeys,
  public.uetds_journey_loads,public.uetds_attempts TO authenticated;

CREATE OR REPLACE FUNCTION public.rex_block_uetds_attempt_mutation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  RAISE EXCEPTION 'U-ETDS gönderim geçmişi değiştirilemez veya silinemez';
END $$;

DROP TRIGGER IF EXISTS rex_uetds_attempts_append_only ON public.uetds_attempts;
CREATE TRIGGER rex_uetds_attempts_append_only
  BEFORE UPDATE OR DELETE ON public.uetds_attempts
  FOR EACH ROW EXECUTE FUNCTION public.rex_block_uetds_attempt_mutation();

CREATE OR REPLACE FUNCTION public.rex_uetds_readiness(p_shipment_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
  v_shipment public.shipments%ROWTYPE;
  v_detail public.shipment_uetds_details%ROWTYPE;
  v_driver public.drivers%ROWTYPE;
  v_vehicle public.vehicles%ROWTYPE;
  v_missing text[] := ARRAY[]::text[];
  v_bad_cargo integer := 0;
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin','operations']) THEN
    RAISE EXCEPTION 'U-ETDS uygunluk kontrolü için yetkiniz bulunmuyor';
  END IF;
  SELECT * INTO v_shipment FROM public.shipments WHERE id=p_shipment_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sevkiyat bulunamadı'; END IF;
  SELECT * INTO v_detail FROM public.shipment_uetds_details WHERE shipment_id=p_shipment_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ready',false,'missing',ARRAY['U-ETDS bildirim bilgileri girilmemiş']);
  END IF;

  IF v_shipment.driver_id IS NULL THEN v_missing:=array_append(v_missing,'Sürücü ataması');
  ELSE
    SELECT * INTO v_driver FROM public.drivers WHERE id=v_shipment.driver_id;
    IF coalesce(v_driver.tc_no,'') !~ '^[0-9]{11}$' THEN v_missing:=array_append(v_missing,'Sürücü T.C. kimlik numarası'); END IF;
  END IF;
  IF v_shipment.vehicle_id IS NULL THEN v_missing:=array_append(v_missing,'Araç ataması');
  ELSE
    SELECT * INTO v_vehicle FROM public.vehicles WHERE id=v_shipment.vehicle_id;
    IF nullif(trim(v_vehicle.cekici_plakasi),'') IS NULL THEN v_missing:=array_append(v_missing,'Araç plakası'); END IF;
  END IF;
  IF nullif(trim(v_shipment.sender_name),'') IS NULL THEN v_missing:=array_append(v_missing,'Gönderici unvanı'); END IF;
  IF nullif(trim(v_shipment.receiver),'') IS NULL THEN v_missing:=array_append(v_missing,'Alıcı unvanı'); END IF;
  IF coalesce(v_detail.sender_tax_id,'') !~ '^[0-9]{10,11}$' THEN v_missing:=array_append(v_missing,'Gönderici VKN/TCKN'); END IF;
  IF coalesce(v_detail.receiver_tax_id,'') !~ '^[0-9]{10,11}$' THEN v_missing:=array_append(v_missing,'Alıcı VKN/TCKN'); END IF;
  IF nullif(trim(v_detail.loading_country_code),'') IS NULL THEN v_missing:=array_append(v_missing,'Yükleme ülke kodu'); END IF;
  IF upper(v_detail.loading_country_code)='TR' AND (v_detail.loading_city_code IS NULL OR v_detail.loading_district_code IS NULL) THEN
    v_missing:=array_append(v_missing,'Yükleme il/ilçe MERSİS kodları');
  END IF;
  IF nullif(trim(v_detail.unloading_country_code),'') IS NULL THEN v_missing:=array_append(v_missing,'Boşaltma ülke kodu'); END IF;
  IF upper(v_detail.unloading_country_code)='TR' AND (v_detail.unloading_city_code IS NULL OR v_detail.unloading_district_code IS NULL) THEN
    v_missing:=array_append(v_missing,'Boşaltma il/ilçe MERSİS kodları');
  END IF;
  IF v_detail.planned_departure_at IS NULL THEN v_missing:=array_append(v_missing,'Planlanan hareket zamanı'); END IF;
  IF v_detail.planned_arrival_at IS NULL THEN v_missing:=array_append(v_missing,'Planlanan varış zamanı'); END IF;
  IF v_detail.planned_departure_at IS NOT NULL AND v_detail.planned_arrival_at IS NOT NULL
     AND v_detail.planned_arrival_at<=v_detail.planned_departure_at THEN
    v_missing:=array_append(v_missing,'Varış zamanı hareket zamanından sonra olmalı');
  END IF;
  IF v_detail.reporter_mode='carrier' THEN
    IF v_shipment.supplier_id IS NULL THEN v_missing:=array_append(v_missing,'Bildirimi yapacak taşıyıcı'); END IF;
    IF nullif(trim(v_detail.carrier_authorization_type),'') IS NULL THEN v_missing:=array_append(v_missing,'Taşıyıcı yetki belgesi türü'); END IF;
    IF nullif(trim(v_detail.carrier_authorization_number),'') IS NULL THEN v_missing:=array_append(v_missing,'Taşıyıcı yetki belgesi numarası'); END IF;
    IF upper(coalesce(v_detail.carrier_authorization_type,'')) IN ('C1','K2') THEN
      v_missing:=array_append(v_missing,'TİO işinde C1/K2 taşıyıcı kullanılamaz');
    END IF;
  END IF;

  SELECT count(*) INTO v_bad_cargo
  FROM public.shipment_cargo_items c
  WHERE c.shipment_id=p_shipment_id AND (
    nullif(trim(c.uetds_load_type_code),'') IS NULL OR nullif(trim(c.uetds_unit_code),'') IS NULL OR
    (c.dangerous_goods AND (nullif(trim(c.un_number),'') IS NULL OR c.dangerous_transport_code IS NULL))
  );
  IF NOT EXISTS (SELECT 1 FROM public.shipment_cargo_items c WHERE c.shipment_id=p_shipment_id) THEN
    v_missing:=array_append(v_missing,'Yük kalemi');
  ELSIF v_bad_cargo>0 THEN
    v_missing:=array_append(v_missing,'Yük kalemi U-ETDS tür/birim veya tehlikeli madde bilgisi');
  END IF;
  RETURN jsonb_build_object('ready',cardinality(v_missing)=0,'missing',to_jsonb(v_missing));
END $$;

CREATE OR REPLACE FUNCTION public.rex_save_uetds_details(
  p_shipment_id uuid,p_details jsonb,p_cargo_items jsonb
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_item jsonb; v_code text;
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin','operations']) THEN RAISE EXCEPTION 'Bu işlem için yetkiniz bulunmuyor'; END IF;
  SELECT shipment_code INTO v_code FROM public.shipments WHERE id=p_shipment_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sevkiyat bulunamadı'; END IF;
  INSERT INTO public.shipment_uetds_details(
    shipment_id,reporter_mode,carrier_authorization_type,carrier_authorization_number,
    sender_tax_id,receiver_tax_id,loading_country_code,loading_city_code,loading_district_code,
    unloading_country_code,unloading_city_code,unloading_district_code,
    planned_departure_at,planned_arrival_at,transport_type,updated_by
  ) VALUES (
    p_shipment_id,coalesce(nullif(p_details->>'reporter_mode',''),'carrier'),
    nullif(trim(p_details->>'carrier_authorization_type'),''),nullif(trim(p_details->>'carrier_authorization_number'),''),
    nullif(regexp_replace(p_details->>'sender_tax_id','\D','','g'),''),nullif(regexp_replace(p_details->>'receiver_tax_id','\D','','g'),''),
    upper(coalesce(nullif(p_details->>'loading_country_code',''),'TR')),nullif(p_details->>'loading_city_code','')::integer,
    nullif(p_details->>'loading_district_code','')::integer,upper(coalesce(nullif(p_details->>'unloading_country_code',''),'TR')),
    nullif(p_details->>'unloading_city_code','')::integer,nullif(p_details->>'unloading_district_code','')::integer,
    nullif(p_details->>'planned_departure_at','')::timestamptz,nullif(p_details->>'planned_arrival_at','')::timestamptz,
    coalesce(nullif(p_details->>'transport_type','')::smallint,2),auth.uid()
  ) ON CONFLICT (shipment_id) DO UPDATE SET
    reporter_mode=excluded.reporter_mode,carrier_authorization_type=excluded.carrier_authorization_type,
    carrier_authorization_number=excluded.carrier_authorization_number,sender_tax_id=excluded.sender_tax_id,
    receiver_tax_id=excluded.receiver_tax_id,loading_country_code=excluded.loading_country_code,
    loading_city_code=excluded.loading_city_code,loading_district_code=excluded.loading_district_code,
    unloading_country_code=excluded.unloading_country_code,unloading_city_code=excluded.unloading_city_code,
    unloading_district_code=excluded.unloading_district_code,planned_departure_at=excluded.planned_departure_at,
    planned_arrival_at=excluded.planned_arrival_at,transport_type=excluded.transport_type,updated_at=now(),updated_by=auth.uid();

  FOR v_item IN SELECT value FROM jsonb_array_elements(coalesce(p_cargo_items,'[]'::jsonb)) LOOP
    UPDATE public.shipment_cargo_items SET
      uetds_load_type_code=nullif(trim(v_item->>'uetds_load_type_code'),''),
      uetds_unit_code=upper(coalesce(nullif(trim(v_item->>'uetds_unit_code'),''),'KG')),
      dangerous_goods=coalesce((v_item->>'dangerous_goods')::boolean,false),
      un_number=nullif(upper(trim(v_item->>'un_number')),''),
      dangerous_transport_code=nullif(v_item->>'dangerous_transport_code','')::integer,
      uetds_description=nullif(trim(v_item->>'uetds_description'),'')
    WHERE shipment_id=p_shipment_id AND sira_no=coalesce((v_item->>'sira_no')::integer,1);
  END LOOP;

  INSERT INTO public.shipment_events(
    shipment_id,shipment_code,event_type,changed_fields,actor_id,actor_email,actor_role,source,note
  ) VALUES (
    p_shipment_id,v_code,'uetds_details_updated',jsonb_build_object('readiness',public.rex_uetds_readiness(p_shipment_id)),
    auth.uid(),auth.jwt()->>'email',(SELECT role FROM public.app_user_roles WHERE user_id=auth.uid() AND active=true LIMIT 1),
    'portal','U-ETDS bildirim bilgileri güncellendi'
  );
END $$;

CREATE OR REPLACE FUNCTION public.rex_save_shipment_with_uetds(
  p_shipment_id uuid,p_shipment jsonb,p_cargo_items jsonb,p_uetds_details jsonb
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_id uuid;
BEGIN
  v_id:=public.rex_save_shipment(p_shipment_id,p_shipment,p_cargo_items);
  PERFORM public.rex_save_uetds_details(v_id,coalesce(p_uetds_details,'{}'::jsonb),p_cargo_items);
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.rex_prepare_uetds_submission(p_shipment_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
  v_settings public.uetds_settings%ROWTYPE;
  v_detail public.shipment_uetds_details%ROWTYPE;
  v_ready jsonb;
  v_shipment_code text;
  v_journey_id uuid;
  v_hash text;
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin','operations']) THEN RAISE EXCEPTION 'Bu işlem için yetkiniz bulunmuyor'; END IF;
  SELECT * INTO v_settings FROM public.uetds_settings WHERE id=true;
  IF v_settings.environment NOT IN ('test','live') THEN RAISE EXCEPTION 'U-ETDS bağlantısı henüz etkin değil'; END IF;
  SELECT * INTO v_detail FROM public.shipment_uetds_details WHERE shipment_id=p_shipment_id;
  IF NOT FOUND OR v_detail.reporter_mode<>'rex' THEN RAISE EXCEPTION 'Bu sevkiyatın bildirimi taşıyıcı tarafından yapılacak'; END IF;
  v_ready:=public.rex_uetds_readiness(p_shipment_id);
  IF NOT coalesce((v_ready->>'ready')::boolean,false) THEN
    RAISE EXCEPTION 'U-ETDS bilgileri eksik: %',array_to_string(ARRAY(SELECT jsonb_array_elements_text(v_ready->'missing')),', ');
  END IF;
  SELECT shipment_code INTO v_shipment_code FROM public.shipments WHERE id=p_shipment_id FOR UPDATE;
  v_hash:=md5(p_shipment_id::text||':'||coalesce((SELECT max(updated_at)::text FROM public.shipment_cargo_items WHERE shipment_id=p_shipment_id),'')||':'||now()::date::text);
  INSERT INTO public.uetds_journeys(
    shipment_id,reporting_mode,status,company_journey_number,payload_hash,queued_at,created_by,updated_by
  ) VALUES (p_shipment_id,'rex','queued','REX-'||v_shipment_code,v_hash,now(),auth.uid(),auth.uid())
  ON CONFLICT (shipment_id) DO UPDATE SET
    reporting_mode='rex',status='queued',payload_hash=excluded.payload_hash,version=public.uetds_journeys.version+1,
    queued_at=now(),next_retry_at=NULL,last_error=NULL,updated_at=now(),updated_by=auth.uid()
  RETURNING id INTO v_journey_id;

  INSERT INTO public.uetds_journey_loads(journey_id,cargo_item_id,company_load_number,status)
  SELECT v_journey_id,c.id,'REX-'||v_shipment_code||'-'||lpad(c.sira_no::text,3,'0'),'queued'
  FROM public.shipment_cargo_items c WHERE c.shipment_id=p_shipment_id
  ON CONFLICT (journey_id,cargo_item_id) DO UPDATE SET status='queued',updated_at=now();
  INSERT INTO public.uetds_attempts(journey_id,operation,request_hash,status,created_by)
  VALUES(v_journey_id,'new_journey_v2',v_hash,'queued',auth.uid());
  INSERT INTO public.shipment_events(
    shipment_id,shipment_code,event_type,changed_fields,actor_id,actor_email,actor_role,source,note
  ) VALUES(p_shipment_id,v_shipment_code,'uetds_queued',jsonb_build_object('journey_id',v_journey_id,'environment',v_settings.environment),
    auth.uid(),auth.jwt()->>'email',(SELECT role FROM public.app_user_roles WHERE user_id=auth.uid() AND active=true LIMIT 1),'portal','U-ETDS V2 gönderim kuyruğuna alındı');
  RETURN v_journey_id;
END $$;

CREATE OR REPLACE FUNCTION public.rex_review_shipment_revision(
  p_request_id uuid,p_decision text,p_note text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_request public.shipment_revision_requests%ROWTYPE; v_email text:=lower(coalesce(auth.jwt()->>'email',''));
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin']) OR v_email<>'info@rexlojistik.com' THEN RAISE EXCEPTION 'Revizyonu yalnızca şirket sahibi hesabı onaylayabilir'; END IF;
  IF p_decision NOT IN ('approve','reject') THEN RAISE EXCEPTION 'Geçersiz revizyon kararı'; END IF;
  IF p_decision='reject' AND (nullif(trim(p_note),'') IS NULL OR length(trim(p_note))<5) THEN RAISE EXCEPTION 'Ret açıklaması en az 5 karakter olmalıdır'; END IF;
  SELECT * INTO v_request FROM public.shipment_revision_requests WHERE id=p_request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Revizyon talebi bulunamadı'; END IF;
  IF v_request.status<>'pending' THEN RAISE EXCEPTION 'Revizyon talebi daha önce sonuçlandırılmış'; END IF;
  IF p_decision='reject' THEN
    UPDATE public.shipment_revision_requests SET status='rejected',reviewed_by=auth.uid(),reviewed_by_email=v_email,reviewed_at=now(),review_note=trim(p_note) WHERE id=p_request_id;
    INSERT INTO public.shipment_events(shipment_id,shipment_code,event_type,old_status,new_status,changed_fields,actor_id,actor_email,actor_role,source,note)
    SELECT s.id,s.shipment_code,'revision_rejected',s.status,s.status,jsonb_build_object('revision_request_id',p_request_id,'review_note',trim(p_note)),
      auth.uid(),v_email,'admin','portal','Revizyon talebi reddedildi: '||trim(p_note) FROM public.shipments s WHERE s.id=v_request.shipment_id;
    RETURN;
  END IF;
  UPDATE public.shipment_revision_requests SET status='approved',reviewed_by=auth.uid(),reviewed_by_email=v_email,reviewed_at=now(),review_note=nullif(trim(p_note),'') WHERE id=p_request_id;
  PERFORM set_config('rex.approved_revision_id',p_request_id::text,true);
  PERFORM public.rex_save_shipment_with_uetds(
    v_request.shipment_id,
    v_request.proposed_shipment || jsonb_build_object('_owner_confirmation_code',v_request.shipment_code),
    v_request.proposed_cargo_items,
    coalesce(v_request.proposed_shipment->'_uetds_details','{}'::jsonb)
  );
  UPDATE public.shipment_revision_requests SET status='applied',applied_at=now() WHERE id=p_request_id;
  INSERT INTO public.shipment_events(shipment_id,shipment_code,event_type,old_status,new_status,changed_fields,actor_id,actor_email,actor_role,source,note)
  SELECT s.id,s.shipment_code,'revision_applied',s.status,s.status,jsonb_build_object('revision_request_id',p_request_id,'review_note',p_note),
    auth.uid(),v_email,'admin','portal','Revizyon şirket sahibi tarafından onaylandı ve uygulandı' FROM public.shipments s WHERE s.id=v_request.shipment_id;
END $$;

CREATE OR REPLACE FUNCTION public.rex_record_carrier_uetds_reference(p_shipment_id uuid,p_reference text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_code text; v_id uuid;
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin','operations']) THEN RAISE EXCEPTION 'Bu işlem için yetkiniz bulunmuyor'; END IF;
  IF length(trim(coalesce(p_reference,'')))<3 THEN RAISE EXCEPTION 'Geçerli taşıyıcı U-ETDS referansı girilmelidir'; END IF;
  SELECT shipment_code INTO v_code FROM public.shipments WHERE id=p_shipment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sevkiyat bulunamadı'; END IF;
  INSERT INTO public.uetds_journeys(
    shipment_id,reporting_mode,status,company_journey_number,carrier_reference,accepted_at,created_by,updated_by
  ) VALUES(p_shipment_id,'carrier','carrier_reported','REX-'||v_code,trim(p_reference),now(),auth.uid(),auth.uid())
  ON CONFLICT (shipment_id) DO UPDATE SET reporting_mode='carrier',status='carrier_reported',carrier_reference=trim(p_reference),
    accepted_at=now(),last_error=NULL,updated_at=now(),updated_by=auth.uid()
  RETURNING id INTO v_id;
  INSERT INTO public.shipment_events(
    shipment_id,shipment_code,event_type,changed_fields,actor_id,actor_email,actor_role,source,note
  ) VALUES(p_shipment_id,v_code,'uetds_carrier_reference_recorded',jsonb_build_object('carrier_reference',trim(p_reference)),
    auth.uid(),auth.jwt()->>'email',(SELECT role FROM public.app_user_roles WHERE user_id=auth.uid() AND active=true LIMIT 1),'portal','Taşıyıcının U-ETDS bildirim referansı kaydedildi');
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.rex_uetds_dashboard()
RETURNS TABLE(
  shipment_id uuid,shipment_code text,shipment_status text,reporter_mode text,
  planned_departure_at timestamptz,journey_status text,reference_number text,
  last_error text,ready boolean,missing_fields text[]
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
  SELECT s.id,s.shipment_code,s.status,coalesce(d.reporter_mode,'carrier'),d.planned_departure_at,
    coalesce(j.status,'incomplete'),coalesce(j.uetds_journey_reference,j.carrier_reference),j.last_error,
    coalesce((r.value->>'ready')::boolean,false),
    ARRAY(SELECT jsonb_array_elements_text(coalesce(r.value->'missing','[]'::jsonb)))
  FROM public.shipments s
  LEFT JOIN public.shipment_uetds_details d ON d.shipment_id=s.id
  LEFT JOIN public.uetds_journeys j ON j.shipment_id=s.id
  CROSS JOIN LATERAL (SELECT public.rex_uetds_readiness(s.id) value) r
  WHERE s.status NOT IN ('iptal','İptal')
  ORDER BY s.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.rex_set_shipment_status(p_shipment_id uuid,p_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
  v_current text; v_driver uuid; v_vehicle uuid; v_load numeric;
  v_enforce boolean; v_uetds_status text;
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin','operations']) THEN RAISE EXCEPTION 'Bu işlem için yetkiniz bulunmuyor'; END IF;
  IF p_status='iptal' THEN RAISE EXCEPTION 'İptal nedeni zorunludur; sevkiyat iptal işlemini kullanın'; END IF;
  IF p_status NOT IN ('hazirlaniyor','yolda') THEN RAISE EXCEPTION 'Geçersiz sevkiyat durumu'; END IF;
  SELECT status,driver_id,vehicle_id,toplam_kg_ds INTO v_current,v_driver,v_vehicle,v_load FROM public.shipments WHERE id=p_shipment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sevkiyat bulunamadı'; END IF;
  IF v_current IN ('teslim_edildi','Teslim Edildi','iptal','İptal') THEN RAISE EXCEPTION 'Tamamlanmış sevkiyatın durumu değiştirilemez'; END IF;
  PERFORM public.rex_validate_assignment_with_load(v_driver,v_vehicle,v_load);
  IF p_status='yolda' AND v_current NOT IN ('beklemede','hazirlaniyor','hazırlanıyor','Hazırlanıyor') THEN RAISE EXCEPTION 'Sevkiyat yola çıkarılamaz'; END IF;
  IF p_status='yolda' THEN
    SELECT enforcement_enabled INTO v_enforce FROM public.uetds_settings WHERE id=true;
    IF coalesce(v_enforce,false) THEN
      SELECT status INTO v_uetds_status FROM public.uetds_journeys WHERE shipment_id=p_shipment_id;
      IF coalesce(v_uetds_status,'') NOT IN ('accepted','carrier_reported') THEN
        RAISE EXCEPTION 'U-ETDS bildirimi kabul edilmeden veya taşıyıcı referansı girilmeden sevkiyat başlatılamaz';
      END IF;
    END IF;
  END IF;
  UPDATE public.shipments SET status=p_status,updated_at=now() WHERE id=p_shipment_id;
END $$;

CREATE OR REPLACE FUNCTION public.rex_uetds_cancel_sync()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_journey public.uetds_journeys%ROWTYPE;
BEGIN
  IF NEW.status IN ('iptal','İptal') AND OLD.status IS DISTINCT FROM NEW.status THEN
    SELECT * INTO v_journey FROM public.uetds_journeys WHERE shipment_id=NEW.id;
    IF FOUND AND v_journey.status IN ('accepted','carrier_reported') THEN
      UPDATE public.uetds_journeys SET
        status=CASE WHEN reporting_mode='rex' THEN 'cancel_pending' ELSE 'cancelled' END,
        updated_at=now(),updated_by=auth.uid()
      WHERE id=v_journey.id;
      IF v_journey.reporting_mode='rex' THEN
        INSERT INTO public.uetds_attempts(journey_id,operation,request_hash,status,created_by)
        VALUES(v_journey.id,'cancel_journey',md5(v_journey.id::text||':cancel:'||now()::date::text),'queued',auth.uid());
      END IF;
      INSERT INTO public.shipment_events(
        shipment_id,shipment_code,event_type,changed_fields,actor_id,actor_email,actor_role,source,note
      ) VALUES(NEW.id,NEW.shipment_code,'uetds_cancellation_queued',jsonb_build_object('reporting_mode',v_journey.reporting_mode),
        auth.uid(),auth.jwt()->>'email',(SELECT role FROM public.app_user_roles WHERE user_id=auth.uid() AND active=true LIMIT 1),'portal','U-ETDS sefer iptal süreci oluşturuldu');
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS rex_uetds_cancel_sync ON public.shipments;
CREATE TRIGGER rex_uetds_cancel_sync
  AFTER UPDATE OF status ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.rex_uetds_cancel_sync();

CREATE OR REPLACE FUNCTION public.rex_claim_uetds_job()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_journey public.uetds_journeys%ROWTYPE; v_payload jsonb;
BEGIN
  IF auth.role()<>'service_role' THEN RAISE EXCEPTION 'Bu işlem yalnızca güvenli kuyruk işleyicisi içindir'; END IF;
  SELECT * INTO v_journey FROM public.uetds_journeys
  WHERE status IN ('queued','error','update_pending','cancel_pending')
    AND (next_retry_at IS NULL OR next_retry_at<=now())
    AND attempt_count<8
  ORDER BY coalesce(next_retry_at,queued_at,created_at)
  FOR UPDATE SKIP LOCKED LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;
  UPDATE public.uetds_journeys SET status='sending',attempt_count=attempt_count+1,submitted_at=now(),updated_at=now()
  WHERE id=v_journey.id;

  SELECT jsonb_build_object(
    'journey_id',j.id,'operation',CASE WHEN v_journey.status='cancel_pending' THEN 'seferIptalEt' ELSE 'yeniYukKaydiBildirV2' END,
    'environment',st.environment,'company_journey_number',j.company_journey_number,'uetds_reference',j.uetds_journey_reference,
    'shipment',jsonb_build_object(
      'shipment_code',s.shipment_code,'sender_name',s.sender_name,'sender_tax_id',d.sender_tax_id,
      'receiver_name',s.receiver,'receiver_tax_id',d.receiver_tax_id,'origin',s.origin,'destination',s.destination,
      'loading_country_code',d.loading_country_code,'loading_city_code',d.loading_city_code,'loading_district_code',d.loading_district_code,
      'unloading_country_code',d.unloading_country_code,'unloading_city_code',d.unloading_city_code,'unloading_district_code',d.unloading_district_code,
      'planned_departure_at',d.planned_departure_at,'planned_arrival_at',d.planned_arrival_at,'transport_type',d.transport_type,
      'driver_tc',dr.tc_no,'vehicle_plate',v.cekici_plakasi,'trailer_plate',v.dorse_plakasi
    ),
    'loads',coalesce((SELECT jsonb_agg(jsonb_build_object(
      'company_load_number',jl.company_load_number,'load_type_code',c.uetds_load_type_code,'description',coalesce(c.uetds_description,c.cinsi),
      'quantity',c.adet,'unit_code',c.uetds_unit_code,'weight',c.adet*c.kg_ds,'dangerous_goods',c.dangerous_goods,
      'un_number',c.un_number,'dangerous_transport_code',c.dangerous_transport_code
    ) ORDER BY c.sira_no) FROM public.uetds_journey_loads jl JOIN public.shipment_cargo_items c ON c.id=jl.cargo_item_id WHERE jl.journey_id=j.id),'[]'::jsonb)
  ) INTO v_payload
  FROM public.uetds_journeys j
  JOIN public.shipments s ON s.id=j.shipment_id
  JOIN public.shipment_uetds_details d ON d.shipment_id=s.id
  JOIN public.drivers dr ON dr.id=s.driver_id
  JOIN public.vehicles v ON v.id=s.vehicle_id
  JOIN public.uetds_settings st ON st.id=true
  WHERE j.id=v_journey.id;
  RETURN v_payload;
END $$;

CREATE OR REPLACE FUNCTION public.rex_record_uetds_result(
  p_journey_id uuid,p_success boolean,p_reference text DEFAULT NULL,
  p_response_code text DEFAULT NULL,p_message text DEFAULT NULL,p_retryable boolean DEFAULT false
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_journey public.uetds_journeys%ROWTYPE; v_shipment_code text;
BEGIN
  IF auth.role()<>'service_role' THEN RAISE EXCEPTION 'Bu işlem yalnızca güvenli kuyruk işleyicisi içindir'; END IF;
  SELECT * INTO v_journey FROM public.uetds_journeys WHERE id=p_journey_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'U-ETDS sefer kaydı bulunamadı'; END IF;
  SELECT shipment_code INTO v_shipment_code FROM public.shipments WHERE id=v_journey.shipment_id;
  IF p_success THEN
    UPDATE public.uetds_journeys SET
      status=CASE WHEN v_journey.status='sending' AND v_journey.uetds_journey_reference IS NOT NULL AND p_reference IS NULL THEN 'cancelled' ELSE 'accepted' END,
      uetds_journey_reference=coalesce(nullif(trim(p_reference),''),uetds_journey_reference),accepted_at=now(),last_error=NULL,next_retry_at=NULL,updated_at=now()
    WHERE id=p_journey_id;
    INSERT INTO public.uetds_attempts(journey_id,operation,request_hash,status,response_code,response_message,completed_at)
    VALUES(p_journey_id,CASE WHEN v_journey.uetds_journey_reference IS NULL THEN 'new_journey_v2' ELSE 'cancel_journey' END,
      coalesce(v_journey.payload_hash,md5(p_journey_id::text)),'success',p_response_code,left(p_message,1000),now());
    INSERT INTO public.shipment_events(shipment_id,shipment_code,event_type,changed_fields,source,note)
    VALUES(v_journey.shipment_id,v_shipment_code,'uetds_accepted',jsonb_build_object('reference',p_reference,'code',p_response_code),'uetds_gateway','U-ETDS işlemi Bakanlık tarafından kabul edildi');
  ELSE
    UPDATE public.uetds_journeys SET status='error',last_error=left(coalesce(p_message,'Bilinmeyen U-ETDS hatası'),1000),
      next_retry_at=CASE WHEN p_retryable AND attempt_count<8 THEN now()+make_interval(secs=>least(3600,30*power(2,attempt_count)::integer)) ELSE NULL END,updated_at=now()
    WHERE id=p_journey_id;
    INSERT INTO public.uetds_attempts(journey_id,operation,request_hash,status,response_code,response_message,completed_at)
    VALUES(p_journey_id,CASE WHEN v_journey.uetds_journey_reference IS NULL THEN 'new_journey_v2' ELSE 'cancel_journey' END,
      coalesce(v_journey.payload_hash,md5(p_journey_id::text)),'error',p_response_code,left(p_message,1000),now());
    INSERT INTO public.shipment_events(shipment_id,shipment_code,event_type,changed_fields,source,note)
    VALUES(v_journey.shipment_id,v_shipment_code,'uetds_failed',jsonb_build_object('code',p_response_code,'retryable',p_retryable),'uetds_gateway',left(coalesce(p_message,'U-ETDS gönderim hatası'),1000));
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.rex_uetds_readiness(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.rex_save_uetds_details(uuid,jsonb,jsonb) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.rex_save_shipment_with_uetds(uuid,jsonb,jsonb,jsonb) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.rex_prepare_uetds_submission(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.rex_record_carrier_uetds_reference(uuid,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.rex_uetds_dashboard() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rex_uetds_readiness(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_save_uetds_details(uuid,jsonb,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_save_shipment_with_uetds(uuid,jsonb,jsonb,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_prepare_uetds_submission(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_record_carrier_uetds_reference(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_uetds_dashboard() TO authenticated;
REVOKE ALL ON FUNCTION public.rex_claim_uetds_job() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.rex_record_uetds_result(uuid,boolean,text,text,text,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.rex_claim_uetds_job() TO service_role;
GRANT EXECUTE ON FUNCTION public.rex_record_uetds_result(uuid,boolean,text,text,text,boolean) TO service_role;
