-- International express cargo workflow (QuickShipper + carrier AWB), public tracking
-- and mandatory 311 / KDVK 14/1 invoice treatment.

ALTER TABLE public.shipments
  ADD COLUMN IF NOT EXISTS service_mode text NOT NULL DEFAULT 'road',
  ADD COLUMN IF NOT EXISTS booking_provider text,
  ADD COLUMN IF NOT EXISTS express_carrier text,
  ADD COLUMN IF NOT EXISTS awb_number text,
  ADD COLUMN IF NOT EXISTS provider_reference text,
  ADD COLUMN IF NOT EXISTS package_type text,
  ADD COLUMN IF NOT EXISTS origin_country_code text,
  ADD COLUMN IF NOT EXISTS destination_country_code text,
  ADD COLUMN IF NOT EXISTS carrier_status text,
  ADD COLUMN IF NOT EXISTS carrier_status_description text,
  ADD COLUMN IF NOT EXISTS carrier_last_synced_at timestamptz;

ALTER TABLE public.shipments DROP CONSTRAINT IF EXISTS shipments_service_mode_check;
ALTER TABLE public.shipments ADD CONSTRAINT shipments_service_mode_check
  CHECK (service_mode IN ('road','international_express'));
ALTER TABLE public.shipments DROP CONSTRAINT IF EXISTS shipments_booking_provider_check;
ALTER TABLE public.shipments ADD CONSTRAINT shipments_booking_provider_check
  CHECK (booking_provider IS NULL OR booking_provider IN ('quickshipper','direct','other'));
ALTER TABLE public.shipments DROP CONSTRAINT IF EXISTS shipments_express_carrier_check;
ALTER TABLE public.shipments ADD CONSTRAINT shipments_express_carrier_check
  CHECK (express_carrier IS NULL OR express_carrier IN ('FEDEX','UPS','DHL','ARAMEX','TNT','DPD','QS_SPECIAL','OTHER'));
ALTER TABLE public.shipments DROP CONSTRAINT IF EXISTS shipments_package_type_check;
ALTER TABLE public.shipments ADD CONSTRAINT shipments_package_type_check
  CHECK (package_type IS NULL OR package_type IN ('document','package'));
ALTER TABLE public.shipments DROP CONSTRAINT IF EXISTS shipments_express_fields_check;
ALTER TABLE public.shipments ADD CONSTRAINT shipments_express_fields_check CHECK (
  service_mode='road' OR (
    booking_provider IS NOT NULL AND package_type IS NOT NULL
    AND origin_country_code ~ '^[A-Z]{2}$'
    AND destination_country_code ~ '^[A-Z]{2}$'
  )
);
ALTER TABLE public.shipments DROP CONSTRAINT IF EXISTS shipments_awb_format_check;
ALTER TABLE public.shipments ADD CONSTRAINT shipments_awb_format_check
  CHECK (awb_number IS NULL OR upper(trim(awb_number)) ~ '^[A-Z0-9-]{6,40}$');

CREATE UNIQUE INDEX IF NOT EXISTS shipments_express_awb_unique
  ON public.shipments(express_carrier,upper(awb_number))
  WHERE service_mode='international_express' AND awb_number IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS shipments_provider_reference_unique
  ON public.shipments(booking_provider,upper(provider_reference))
  WHERE service_mode='international_express' AND provider_reference IS NOT NULL;
CREATE INDEX IF NOT EXISTS shipments_express_status_idx
  ON public.shipments(service_mode,express_carrier,carrier_status,created_at DESC);

CREATE OR REPLACE FUNCTION public.rex_express_tracking_url(p_carrier text,p_awb text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path=public,pg_temp AS $$
  SELECT CASE upper(trim(coalesce(p_carrier,'')))
    WHEN 'FEDEX' THEN 'https://www.fedex.com/apps/fedextrack/index.html?tracknumbers='||upper(trim(p_awb))||'&cntry_code=tr'
    WHEN 'UPS' THEN 'https://www.ups.com/track?loc=tr_TR&tracknum='||upper(trim(p_awb))
    WHEN 'DHL' THEN 'https://www.dhl.com/tr-tr/home/tracking.html?submit=1&tracking-id='||upper(trim(p_awb))
    WHEN 'ARAMEX' THEN 'https://www.aramex.com/track/results?ShipmentNumber='||upper(trim(p_awb))
    WHEN 'TNT' THEN 'https://www.fedex.com/fedextrack/?trknbr='||upper(trim(p_awb))
    WHEN 'DPD' THEN 'https://tracking.dpd.de/status/en_US/parcel/'||upper(trim(p_awb))
    ELSE NULL
  END
  WHERE coalesce(p_awb,'') ~* '^[A-Z0-9-]{6,40}$';
$$;

CREATE OR REPLACE FUNCTION public.rex_save_shipment(
  p_shipment_id uuid,p_shipment jsonb,p_cargo_items jsonb
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
  v_id uuid; v_code text; v_status text; v_item jsonb;
  v_total_units integer:=0; v_total_weight numeric:=0; v_total_price numeric:=0;
  v_first_kind text; v_driver uuid; v_vehicle uuid;
  v_email text:=lower(coalesce(auth.jwt()->>'email',''));
  v_service_mode text:=coalesce(nullif(p_shipment->>'service_mode',''),'road');
  v_carrier text:=nullif(upper(trim(p_shipment->>'express_carrier')),'');
  v_awb text:=nullif(upper(regexp_replace(coalesce(p_shipment->>'awb_number',''),'\s','','g')),'');
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin','operations']) THEN RAISE EXCEPTION 'Bu işlem için yetkiniz bulunmuyor'; END IF;
  IF v_service_mode NOT IN ('road','international_express') THEN RAISE EXCEPTION 'Geçersiz taşıma hizmeti'; END IF;
  IF nullif(p_shipment->>'customer_id','') IS NULL OR nullif(trim(p_shipment->>'origin'),'') IS NULL
     OR nullif(trim(p_shipment->>'destination'),'') IS NULL OR nullif(p_shipment->>'pickup_date','') IS NULL THEN
    RAISE EXCEPTION 'Müşteri, çıkış, varış ve yükleme tarihi zorunludur';
  END IF;

  v_driver:=nullif(p_shipment->>'driver_id','')::uuid;
  v_vehicle:=nullif(p_shipment->>'vehicle_id','')::uuid;
  IF v_service_mode='road' THEN
    IF (v_driver IS NULL) <> (v_vehicle IS NULL) THEN RAISE EXCEPTION 'Sürücü ve araç birlikte seçilmelidir'; END IF;
    IF v_driver IS NOT NULL THEN PERFORM public.rex_validate_assignment(v_driver,v_vehicle); END IF;
  ELSE
    v_driver:=NULL; v_vehicle:=NULL;
    IF coalesce(p_shipment->>'booking_provider','') NOT IN ('quickshipper','direct','other')
       OR coalesce(p_shipment->>'package_type','') NOT IN ('document','package') THEN
      RAISE EXCEPTION 'Express gönderide hizmet sağlayıcı ve gönderi türü zorunludur';
    END IF;
    IF upper(coalesce(p_shipment->>'origin_country_code','')) !~ '^[A-Z]{2}$'
       OR upper(coalesce(p_shipment->>'destination_country_code','')) !~ '^[A-Z]{2}$' THEN
      RAISE EXCEPTION 'Express gönderide çıkış ve varış ülke kodu iki harf olmalıdır';
    END IF;
    IF v_carrier IS NOT NULL AND v_carrier NOT IN ('FEDEX','UPS','DHL','ARAMEX','TNT','DPD','QS_SPECIAL','OTHER') THEN
      RAISE EXCEPTION 'Geçersiz express taşıyıcı';
    END IF;
    IF v_awb IS NOT NULL AND v_awb !~ '^[A-Z0-9-]{6,40}$' THEN RAISE EXCEPTION 'AWB numarası 6-40 harf/rakam olmalıdır'; END IF;
  END IF;

  IF jsonb_typeof(p_cargo_items) IS DISTINCT FROM 'array' OR jsonb_array_length(p_cargo_items)=0 THEN RAISE EXCEPTION 'En az bir yük kalemi gereklidir'; END IF;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_cargo_items) LOOP
    IF coalesce((v_item->>'adet')::integer,0)<=0 OR coalesce((v_item->>'kg_ds')::numeric,0)<=0 OR nullif(trim(v_item->>'cinsi'),'') IS NULL THEN
      RAISE EXCEPTION 'Yük kalemlerinde adet, cins ve kg/desi zorunludur';
    END IF;
    v_total_units:=v_total_units+(v_item->>'adet')::integer;
    v_total_weight:=v_total_weight+(v_item->>'adet')::numeric*(v_item->>'kg_ds')::numeric;
    v_total_price:=v_total_price+coalesce((v_item->>'alt_toplam_fiyat')::numeric,0);
    IF v_first_kind IS NULL THEN v_first_kind:=trim(v_item->>'cinsi'); END IF;
  END LOOP;

  IF p_shipment_id IS NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext('rex_shipment_code'));
    SELECT 'SHP-'||lpad((coalesce(max((regexp_match(shipment_code,'^SHP-(\d+)$'))[1]::integer),0)+1)::text,6,'0') INTO v_code FROM public.shipments;
    INSERT INTO public.shipments(
      shipment_code,supplier_id,driver_id,vehicle_id,customer_id,origin,destination,pickup_date,estimated_delivery_date,
      cost,cost_currency,currency,status,sender_name,sender_ii,receiver,receiver_district,receiver_ii,adet,cinsi,kg_ds,
      toplam_kg_ds,satis_tutar,invoice_status,service_mode,booking_provider,express_carrier,awb_number,provider_reference,
      package_type,origin_country_code,destination_country_code,carrier_status,carrier_status_description,carrier_last_synced_at
    ) VALUES(
      v_code,nullif(p_shipment->>'supplier_id','')::uuid,v_driver,v_vehicle,(p_shipment->>'customer_id')::uuid,
      trim(p_shipment->>'origin'),trim(p_shipment->>'destination'),(p_shipment->>'pickup_date')::date,
      nullif(p_shipment->>'estimated_delivery_date','')::date,nullif(p_shipment->>'cost','')::numeric,
      coalesce(nullif(p_shipment->>'cost_currency',''),'TRY'),coalesce(nullif(p_shipment->>'currency',''),'TRY'),
      CASE WHEN v_service_mode='international_express' OR v_driver IS NOT NULL THEN 'beklemede' ELSE 'atama_bekliyor' END,
      nullif(trim(p_shipment->>'sender_name'),''),nullif(trim(p_shipment->>'sender_ii'),''),nullif(trim(p_shipment->>'receiver'),''),
      nullif(trim(p_shipment->>'receiver_district'),''),nullif(trim(p_shipment->>'receiver_ii'),''),v_total_units,v_first_kind,
      v_total_weight/v_total_units,v_total_weight,v_total_price,'beklemede',v_service_mode,
      CASE WHEN v_service_mode='international_express' THEN p_shipment->>'booking_provider' END,
      CASE WHEN v_service_mode='international_express' THEN v_carrier END,CASE WHEN v_service_mode='international_express' THEN v_awb END,
      CASE WHEN v_service_mode='international_express' THEN nullif(upper(trim(p_shipment->>'provider_reference')),'') END,
      CASE WHEN v_service_mode='international_express' THEN p_shipment->>'package_type' END,
      CASE WHEN v_service_mode='international_express' THEN upper(p_shipment->>'origin_country_code') END,
      CASE WHEN v_service_mode='international_express' THEN upper(p_shipment->>'destination_country_code') END,
      CASE WHEN v_service_mode='international_express' THEN coalesce(nullif(upper(trim(p_shipment->>'carrier_status')),''),'GÖNDERİ OLUŞTURULDU') END,
      CASE WHEN v_service_mode='international_express' THEN nullif(trim(p_shipment->>'carrier_status_description'),'') END,NULL
    ) RETURNING id INTO v_id;
  ELSE
    SELECT shipment_code,status INTO v_code,v_status FROM public.shipments WHERE id=p_shipment_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Sevkiyat bulunamadı'; END IF;
    IF v_status IN ('teslim_edildi','Teslim Edildi') THEN
      IF NOT public.rex_has_role(ARRAY['admin']) OR v_email<>'info@rexlojistik.com' THEN RAISE EXCEPTION 'Tamamlanmış sevkiyatı yalnızca şirket sahibi değiştirebilir'; END IF;
      IF nullif(trim(p_shipment->>'_owner_confirmation_code'),'') IS NULL OR trim(p_shipment->>'_owner_confirmation_code')<>v_code THEN
        RAISE EXCEPTION 'Değişiklik için sevkiyat koduyla şirket sahibi onayı gereklidir';
      END IF;
    END IF;
    UPDATE public.shipments SET
      supplier_id=nullif(p_shipment->>'supplier_id','')::uuid,driver_id=v_driver,vehicle_id=v_vehicle,
      customer_id=(p_shipment->>'customer_id')::uuid,origin=trim(p_shipment->>'origin'),destination=trim(p_shipment->>'destination'),
      pickup_date=(p_shipment->>'pickup_date')::date,estimated_delivery_date=nullif(p_shipment->>'estimated_delivery_date','')::date,
      cost=nullif(p_shipment->>'cost','')::numeric,cost_currency=coalesce(nullif(p_shipment->>'cost_currency',''),'TRY'),
      currency=coalesce(nullif(p_shipment->>'currency',''),'TRY'),
      status=CASE WHEN status IN ('atama_bekliyor','beklemede') THEN CASE WHEN v_service_mode='international_express' OR v_driver IS NOT NULL THEN 'beklemede' ELSE 'atama_bekliyor' END ELSE status END,
      sender_name=nullif(trim(p_shipment->>'sender_name'),''),sender_ii=nullif(trim(p_shipment->>'sender_ii'),''),
      receiver=nullif(trim(p_shipment->>'receiver'),''),receiver_district=nullif(trim(p_shipment->>'receiver_district'),''),receiver_ii=nullif(trim(p_shipment->>'receiver_ii'),''),
      adet=v_total_units,cinsi=v_first_kind,kg_ds=v_total_weight/v_total_units,toplam_kg_ds=v_total_weight,satis_tutar=v_total_price,
      service_mode=v_service_mode,booking_provider=CASE WHEN v_service_mode='international_express' THEN p_shipment->>'booking_provider' END,
      express_carrier=CASE WHEN v_service_mode='international_express' THEN v_carrier END,
      awb_number=CASE WHEN v_service_mode='international_express' THEN v_awb END,
      provider_reference=CASE WHEN v_service_mode='international_express' THEN nullif(upper(trim(p_shipment->>'provider_reference')),'') END,
      package_type=CASE WHEN v_service_mode='international_express' THEN p_shipment->>'package_type' END,
      origin_country_code=CASE WHEN v_service_mode='international_express' THEN upper(p_shipment->>'origin_country_code') END,
      destination_country_code=CASE WHEN v_service_mode='international_express' THEN upper(p_shipment->>'destination_country_code') END,
      carrier_status=CASE WHEN v_service_mode='international_express' THEN coalesce(nullif(upper(trim(p_shipment->>'carrier_status')),''),carrier_status,'GÖNDERİ OLUŞTURULDU') END,
      carrier_status_description=CASE WHEN v_service_mode='international_express' THEN nullif(trim(p_shipment->>'carrier_status_description'),'') END,
      updated_at=now() WHERE id=p_shipment_id;
    v_id:=p_shipment_id; DELETE FROM public.shipment_cargo_items WHERE shipment_id=v_id;
  END IF;

  INSERT INTO public.shipment_cargo_items(shipment_id,adet,cinsi,kg_ds,sira_no,birim_fiyat,alt_toplam_fiyat,alt_toplam)
  SELECT v_id,(item->>'adet')::integer,trim(item->>'cinsi'),(item->>'kg_ds')::numeric,(row_number() over())::integer,
    coalesce((item->>'birim_fiyat')::numeric,0),coalesce((item->>'alt_toplam_fiyat')::numeric,0),(item->>'adet')::numeric*(item->>'kg_ds')::numeric
  FROM jsonb_array_elements(p_cargo_items) item;
  IF v_status IN ('teslim_edildi','Teslim Edildi') THEN
    INSERT INTO public.shipment_events(shipment_id,shipment_code,event_type,old_status,new_status,changed_fields,actor_id,actor_email,actor_role,source,note)
    VALUES(v_id,v_code,'owner_approved_edit',v_status,v_status,'{}'::jsonb,auth.uid(),v_email,'admin','portal','Tamamlanmış sevkiyat değişikliği şirket sahibi tarafından onaylandı');
  END IF;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.rex_save_shipment_with_uetds(
  p_shipment_id uuid,p_shipment jsonb,p_cargo_items jsonb,p_uetds_details jsonb
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_id uuid; v_mode text;
BEGIN
  v_id:=public.rex_save_shipment(p_shipment_id,p_shipment,p_cargo_items);
  SELECT service_mode INTO v_mode FROM public.shipments WHERE id=v_id;
  IF v_mode='road' THEN PERFORM public.rex_save_uetds_details(v_id,coalesce(p_uetds_details,'{}'::jsonb),p_cargo_items); END IF;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.rex_set_shipment_status(p_shipment_id uuid,p_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
  v_current text; v_driver uuid; v_vehicle uuid; v_load numeric; v_mode text; v_awb text; v_carrier text;
  v_enforce boolean; v_uetds_status text;
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin','operations']) THEN RAISE EXCEPTION 'Bu işlem için yetkiniz bulunmuyor'; END IF;
  IF p_status='iptal' THEN RAISE EXCEPTION 'İptal nedeni zorunludur; sevkiyat iptal işlemini kullanın'; END IF;
  IF p_status NOT IN ('hazirlaniyor','yolda') THEN RAISE EXCEPTION 'Geçersiz sevkiyat durumu'; END IF;
  SELECT status,driver_id,vehicle_id,toplam_kg_ds,service_mode,awb_number,express_carrier
    INTO v_current,v_driver,v_vehicle,v_load,v_mode,v_awb,v_carrier FROM public.shipments WHERE id=p_shipment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sevkiyat bulunamadı'; END IF;
  IF v_current IN ('teslim_edildi','Teslim Edildi','iptal','İptal') THEN RAISE EXCEPTION 'Tamamlanmış sevkiyatın durumu değiştirilemez'; END IF;
  IF v_mode='international_express' THEN
    IF p_status='yolda' AND (nullif(trim(v_awb),'') IS NULL OR nullif(trim(v_carrier),'') IS NULL) THEN
      RAISE EXCEPTION 'Express gönderi, taşıyıcı ve AWB numarası girilmeden başlatılamaz';
    END IF;
  ELSE
    PERFORM public.rex_validate_assignment_with_load(v_driver,v_vehicle,v_load);
    IF p_status='yolda' THEN
      SELECT enforcement_enabled INTO v_enforce FROM public.uetds_settings WHERE id=true;
      IF coalesce(v_enforce,false) THEN
        SELECT status INTO v_uetds_status FROM public.uetds_journeys WHERE shipment_id=p_shipment_id;
        IF coalesce(v_uetds_status,'') NOT IN ('accepted','carrier_reported') THEN RAISE EXCEPTION 'U-ETDS bildirimi kabul edilmeden veya taşıyıcı referansı girilmeden sevkiyat başlatılamaz'; END IF;
      END IF;
    END IF;
  END IF;
  IF p_status='yolda' AND v_current NOT IN ('beklemede','hazirlaniyor','hazırlanıyor','Hazırlanıyor') THEN RAISE EXCEPTION 'Sevkiyat yola çıkarılamaz'; END IF;
  UPDATE public.shipments SET status=p_status,
    carrier_status=CASE WHEN service_mode='international_express' AND p_status='yolda' AND coalesce(carrier_status,'')='GÖNDERİ OLUŞTURULDU' THEN 'ÇIKIŞ NOKTASINDA' ELSE carrier_status END,
    updated_at=now() WHERE id=p_shipment_id;
END $$;

CREATE OR REPLACE FUNCTION public.rex_uetds_dashboard()
RETURNS TABLE(shipment_id uuid,shipment_code text,shipment_status text,reporter_mode text,planned_departure_at timestamptz,journey_status text,reference_number text,last_error text,ready boolean,missing_fields text[])
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
  SELECT s.id,s.shipment_code,s.status,coalesce(d.reporter_mode,'carrier'),d.planned_departure_at,
    coalesce(j.status,'incomplete'),coalesce(j.uetds_journey_reference,j.carrier_reference),j.last_error,
    coalesce((r.value->>'ready')::boolean,false),ARRAY(SELECT jsonb_array_elements_text(coalesce(r.value->'missing','[]'::jsonb)))
  FROM public.shipments s LEFT JOIN public.shipment_uetds_details d ON d.shipment_id=s.id
  LEFT JOIN public.uetds_journeys j ON j.shipment_id=s.id CROSS JOIN LATERAL (SELECT public.rex_uetds_readiness(s.id) value) r
  WHERE s.status NOT IN ('iptal','İptal') AND s.service_mode='road' ORDER BY s.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.rex_public_track_shipment(p_tracking_number text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_result jsonb; v_identifier text:=upper(regexp_replace(trim(coalesce(p_tracking_number,'')),'\s','','g'));
BEGIN
  IF v_identifier !~ '^REX-[A-F0-9]{16}$' AND v_identifier !~ '^[A-Z0-9-]{6,40}$' THEN RETURN NULL; END IF;
  SELECT jsonb_build_object(
    'tracking_number',s.tracking_number,'shipment_code',s.shipment_code,'status',s.status,'origin',s.origin,'destination',s.destination,
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

INSERT INTO public.invoice_note_templates(code,name,category,line_description_template,notes,kolaybi_document_type,default_vat_rate,default_exemption_code,is_default,display_order)
VALUES('EXPRESS_ISTISNA_311','Uluslararası express kargo · 311/14','exempt_transport',
  '{{awb_number}} AWB numaralı {{express_carrier}} uluslararası express {{package_type}} taşıma organizasyonu ({{origin}} → {{destination}}).',
  E'Taşıma İşleri Organizatörlüğü Belge No: İZM.U-NET.TİO.35.6323\n3065 sayılı KDV Kanununun 14/1 maddesi kapsamında uluslararası taşımacılık hizmetidir.\nGİB istisna kodu: 311 - Uluslararası taşımacılık.\nQuickShipper/taşıyıcı AWB ve güzergâh bilgileri fatura kaleminde belirtilmiştir.',
  'ISTISNA',0,'311',false,25)
ON CONFLICT (code) DO UPDATE SET name=excluded.name,line_description_template=excluded.line_description_template,notes=excluded.notes,
  kolaybi_document_type='ISTISNA',default_vat_rate=0,default_exemption_code='311',is_active=true,updated_at=now();

CREATE OR REPLACE FUNCTION public.rex_create_sales_invoice_secure_v2(
  p_customer_id uuid,p_shipment_ids uuid[],p_invoice_date date,p_due_date date,p_currency text,p_payment_status text,
  p_notes text,p_items jsonb,p_document_type text DEFAULT 'e_archive',p_document_scenario text DEFAULT 'EARSIVFATURA',
  p_exchange_rate numeric DEFAULT 1,p_idempotency_key text DEFAULT NULL,p_invoice_category text DEFAULT 'domestic_transport',
  p_note_template_id uuid DEFAULT NULL,p_bank_account_ids uuid[] DEFAULT '{}'::uuid[],p_include_bank_details boolean DEFAULT false
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
  v_template public.invoice_note_templates%ROWTYPE; v_bank_ids uuid[]:=coalesce(p_bank_account_ids,'{}'::uuid[]);
  v_bank_text text; v_bank_snapshot jsonb:='[]'::jsonb; v_notes text:=nullif(trim(p_notes),''); v_result jsonb;
  v_invoice_id uuid; v_kolaybi_document_type text:='SATIS'; v_express_count integer:=0; v_shipment_count integer:=coalesce(cardinality(p_shipment_ids),0);
BEGIN
  IF v_shipment_count>0 THEN SELECT count(*) INTO v_express_count FROM public.shipments WHERE id=ANY(p_shipment_ids) AND service_mode='international_express'; END IF;
  IF v_express_count>0 AND v_express_count<>v_shipment_count THEN RAISE EXCEPTION 'Express ve karayolu sevkiyatları aynı faturada birleştirilemez'; END IF;
  IF v_express_count>0 THEN
    p_invoice_category:='exempt_transport';
    SELECT id INTO p_note_template_id FROM public.invoice_note_templates WHERE code='EXPRESS_ISTISNA_311' AND is_active=true;
    SELECT jsonb_agg(item||jsonb_build_object('productCode','ULUSLARARASI_EXPRESS','vatRate',0,'exemptionCode','311')) INTO p_items
      FROM jsonb_array_elements(p_items) item;
  END IF;
  IF p_invoice_category NOT IN ('domestic_transport','international_transport','exempt_transport','withholding_transport','other') THEN RAISE EXCEPTION 'Geçersiz fatura açıklama türü'; END IF;
  IF p_note_template_id IS NOT NULL THEN
    SELECT * INTO v_template FROM public.invoice_note_templates WHERE id=p_note_template_id AND is_active=true;
    IF NOT FOUND THEN RAISE EXCEPTION 'Fatura not şablonu bulunamadı veya pasif'; END IF;
    IF v_template.category<>p_invoice_category THEN RAISE EXCEPTION 'Not şablonu seçilen fatura türüyle uyumlu değil'; END IF;
    IF v_notes IS NULL THEN v_notes:=v_template.notes; END IF; v_kolaybi_document_type:=v_template.kolaybi_document_type;
  ELSE
    SELECT * INTO v_template FROM public.invoice_note_templates WHERE category=p_invoice_category AND is_active=true AND is_default=true ORDER BY display_order,id LIMIT 1;
    IF FOUND THEN IF v_notes IS NULL THEN v_notes:=v_template.notes; END IF; p_note_template_id:=v_template.id; v_kolaybi_document_type:=v_template.kolaybi_document_type; END IF;
  END IF;
  IF p_include_bank_details THEN
    IF coalesce(cardinality(v_bank_ids),0)=0 THEN SELECT coalesce(array_agg(id ORDER BY display_order,label),'{}'::uuid[]) INTO v_bank_ids FROM public.invoice_bank_accounts WHERE is_active=true AND is_default=true; END IF;
    SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'label',label,'account_holder',account_holder,'bank_name',bank_name,'branch_name',branch_name,'account_no',account_no,'iban',iban,'swift_code',swift_code,'currency',currency) ORDER BY display_order,label),'[]'::jsonb),
      string_agg(concat(label,E'\n',account_holder,E'\n',bank_name,CASE WHEN nullif(branch_name,'') IS NOT NULL THEN ' · '||branch_name ELSE '' END,E'\n','IBAN: ',iban,' · ',currency,CASE WHEN nullif(swift_code,'') IS NOT NULL THEN E'\nSWIFT: '||swift_code ELSE '' END),E'\n\n' ORDER BY display_order,label)
      INTO v_bank_snapshot,v_bank_text FROM public.invoice_bank_accounts WHERE is_active=true AND id=ANY(v_bank_ids);
    IF coalesce(cardinality(v_bank_ids),0)>0 AND v_bank_text IS NULL THEN RAISE EXCEPTION 'Seçilen banka hesapları bulunamadı veya pasif'; END IF;
    IF v_bank_text IS NOT NULL THEN v_notes:=concat_ws(E'\n\n',v_notes,E'Banka Bilgilerimiz:\n'||v_bank_text); END IF;
  END IF;
  v_result:=public.rex_create_sales_invoice_secure(p_customer_id,p_shipment_ids,p_invoice_date,p_due_date,p_currency,p_payment_status,
    coalesce(v_notes,''),p_items,p_document_type,p_document_scenario,p_exchange_rate,p_idempotency_key);
  IF coalesce((v_result->>'already_exists')::boolean,false)=false THEN
    v_invoice_id:=(v_result->>'id')::uuid;
    UPDATE public.sales_invoices SET invoice_category=p_invoice_category,invoice_note_template_id=p_note_template_id,
      include_bank_details=p_include_bank_details,bank_accounts_snapshot=v_bank_snapshot,kolaybi_document_type=v_kolaybi_document_type,
      exemption_code=CASE WHEN v_express_count>0 THEN '311' ELSE exemption_code END,updated_at=now() WHERE id=v_invoice_id;
  END IF;
  RETURN v_result;
END $$;

REVOKE ALL ON FUNCTION public.rex_create_sales_invoice_secure(uuid,uuid[],date,date,text,text,text,jsonb,text,text,numeric,text) FROM authenticated;
REVOKE ALL ON FUNCTION public.rex_express_tracking_url(text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rex_express_tracking_url(text,text) TO authenticated;
REVOKE ALL ON FUNCTION public.rex_public_track_shipment(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rex_public_track_shipment(text) TO anon,authenticated;
