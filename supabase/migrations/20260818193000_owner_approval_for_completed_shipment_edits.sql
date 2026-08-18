-- Completed shipments are immutable through direct table access. They can be
-- edited only through rex_save_shipment after owner identity and code approval.

ALTER TABLE public.shipment_events
  DROP CONSTRAINT IF EXISTS shipment_events_event_type_check;
ALTER TABLE public.shipment_events
  ADD CONSTRAINT shipment_events_event_type_check CHECK (event_type IN (
    'history_enabled','created','updated','assignment_changed','status_changed',
    'delivery_document_added','delivered','invoiced','invoice_unlinked','deleted',
    'owner_approved_edit'
  ));

DROP POLICY IF EXISTS rex_completed_shipment_update_guard ON public.shipments;
CREATE POLICY rex_completed_shipment_update_guard ON public.shipments
  AS RESTRICTIVE
  FOR UPDATE TO authenticated
  USING (status NOT IN ('teslim_edildi', 'Teslim Edildi'))
  WITH CHECK (true);

DROP POLICY IF EXISTS rex_completed_cargo_insert_guard ON public.shipment_cargo_items;
CREATE POLICY rex_completed_cargo_insert_guard ON public.shipment_cargo_items
  AS RESTRICTIVE
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shipments s
      WHERE s.id = shipment_id
        AND s.status NOT IN ('teslim_edildi', 'Teslim Edildi')
    )
  );

DROP POLICY IF EXISTS rex_completed_cargo_update_guard ON public.shipment_cargo_items;
CREATE POLICY rex_completed_cargo_update_guard ON public.shipment_cargo_items
  AS RESTRICTIVE
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.shipments s
      WHERE s.id = shipment_id
        AND s.status NOT IN ('teslim_edildi', 'Teslim Edildi')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shipments s
      WHERE s.id = shipment_id
        AND s.status NOT IN ('teslim_edildi', 'Teslim Edildi')
    )
  );

DROP POLICY IF EXISTS rex_completed_cargo_delete_guard ON public.shipment_cargo_items;
CREATE POLICY rex_completed_cargo_delete_guard ON public.shipment_cargo_items
  AS RESTRICTIVE
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.shipments s
      WHERE s.id = shipment_id
        AND s.status NOT IN ('teslim_edildi', 'Teslim Edildi')
    )
  );

CREATE OR REPLACE FUNCTION public.rex_save_shipment(
  p_shipment_id uuid,
  p_shipment jsonb,
  p_cargo_items jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public,pg_temp
AS $$
DECLARE
  v_id uuid;
  v_code text;
  v_status text;
  v_item jsonb;
  v_total_units integer := 0;
  v_total_weight numeric := 0;
  v_total_price numeric := 0;
  v_first_kind text;
  v_driver uuid;
  v_vehicle uuid;
  v_email text := lower(coalesce(auth.jwt()->>'email',''));
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin','operations']) THEN
    RAISE EXCEPTION 'Bu işlem için yetkiniz bulunmuyor';
  END IF;

  IF nullif(p_shipment->>'customer_id','') IS NULL
     OR nullif(trim(p_shipment->>'origin'),'') IS NULL
     OR nullif(trim(p_shipment->>'destination'),'') IS NULL
     OR nullif(p_shipment->>'pickup_date','') IS NULL THEN
    RAISE EXCEPTION 'Müşteri, çıkış, varış ve yükleme tarihi zorunludur';
  END IF;

  v_driver := nullif(p_shipment->>'driver_id','')::uuid;
  v_vehicle := nullif(p_shipment->>'vehicle_id','')::uuid;
  IF (v_driver IS NULL) <> (v_vehicle IS NULL) THEN
    RAISE EXCEPTION 'Sürücü ve araç birlikte seçilmelidir';
  END IF;
  IF v_driver IS NOT NULL THEN
    PERFORM public.rex_validate_assignment(v_driver,v_vehicle);
  END IF;

  IF jsonb_typeof(p_cargo_items) IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_cargo_items)=0 THEN
    RAISE EXCEPTION 'En az bir yük kalemi gereklidir';
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_cargo_items) LOOP
    IF coalesce((v_item->>'adet')::integer,0) <= 0
       OR coalesce((v_item->>'kg_ds')::numeric,0) <= 0
       OR nullif(trim(v_item->>'cinsi'),'') IS NULL THEN
      RAISE EXCEPTION 'Yük kalemlerinde adet, cins ve kg/desi zorunludur';
    END IF;
    v_total_units := v_total_units + (v_item->>'adet')::integer;
    v_total_weight := v_total_weight + (v_item->>'adet')::numeric * (v_item->>'kg_ds')::numeric;
    v_total_price := v_total_price + coalesce((v_item->>'alt_toplam_fiyat')::numeric,0);
    IF v_first_kind IS NULL THEN v_first_kind := trim(v_item->>'cinsi'); END IF;
  END LOOP;

  IF p_shipment_id IS NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext('rex_shipment_code'));
    SELECT 'SHP-' || lpad((coalesce(max((regexp_match(shipment_code,'^SHP-(\d+)$'))[1]::integer),0)+1)::text,6,'0')
    INTO v_code
    FROM public.shipments;

    INSERT INTO public.shipments(
      shipment_code,supplier_id,driver_id,vehicle_id,customer_id,origin,destination,
      pickup_date,estimated_delivery_date,cost,cost_currency,currency,status,
      sender_name,sender_ii,receiver,receiver_district,receiver_ii,adet,cinsi,kg_ds,
      toplam_kg_ds,satis_tutar,invoice_status
    ) VALUES (
      v_code,nullif(p_shipment->>'supplier_id','')::uuid,v_driver,v_vehicle,
      (p_shipment->>'customer_id')::uuid,trim(p_shipment->>'origin'),trim(p_shipment->>'destination'),
      (p_shipment->>'pickup_date')::date,nullif(p_shipment->>'estimated_delivery_date','')::date,
      nullif(p_shipment->>'cost','')::numeric,coalesce(nullif(p_shipment->>'cost_currency',''),'TRY'),
      coalesce(nullif(p_shipment->>'currency',''),'TRY'),
      CASE WHEN v_driver IS NULL THEN 'atama_bekliyor' ELSE 'beklemede' END,
      nullif(trim(p_shipment->>'sender_name'),''),nullif(trim(p_shipment->>'sender_ii'),''),
      nullif(trim(p_shipment->>'receiver'),''),nullif(trim(p_shipment->>'receiver_district'),''),
      nullif(trim(p_shipment->>'receiver_ii'),''),v_total_units,v_first_kind,
      v_total_weight/v_total_units,v_total_weight,v_total_price,'beklemede'
    ) RETURNING id INTO v_id;
  ELSE
    SELECT shipment_code,status INTO v_code,v_status
    FROM public.shipments
    WHERE id=p_shipment_id
    FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Sevkiyat bulunamadı'; END IF;

    IF v_status IN ('teslim_edildi','Teslim Edildi') THEN
      IF NOT public.rex_has_role(ARRAY['admin']) OR v_email <> 'info@rexlojistik.com' THEN
        RAISE EXCEPTION 'Tamamlanmış sevkiyatı yalnızca şirket sahibi değiştirebilir';
      END IF;
      IF nullif(trim(p_shipment->>'_owner_confirmation_code'),'') IS NULL
         OR trim(p_shipment->>'_owner_confirmation_code') <> v_code THEN
        RAISE EXCEPTION 'Değişiklik için sevkiyat koduyla şirket sahibi onayı gereklidir';
      END IF;
    END IF;

    UPDATE public.shipments SET
      supplier_id=nullif(p_shipment->>'supplier_id','')::uuid,
      driver_id=v_driver,
      vehicle_id=v_vehicle,
      customer_id=(p_shipment->>'customer_id')::uuid,
      origin=trim(p_shipment->>'origin'),
      destination=trim(p_shipment->>'destination'),
      pickup_date=(p_shipment->>'pickup_date')::date,
      estimated_delivery_date=nullif(p_shipment->>'estimated_delivery_date','')::date,
      cost=nullif(p_shipment->>'cost','')::numeric,
      cost_currency=coalesce(nullif(p_shipment->>'cost_currency',''),'TRY'),
      currency=coalesce(nullif(p_shipment->>'currency',''),'TRY'),
      status=CASE WHEN status IN ('atama_bekliyor','beklemede')
        THEN CASE WHEN v_driver IS NULL THEN 'atama_bekliyor' ELSE 'beklemede' END
        ELSE status END,
      sender_name=nullif(trim(p_shipment->>'sender_name'),''),
      sender_ii=nullif(trim(p_shipment->>'sender_ii'),''),
      receiver=nullif(trim(p_shipment->>'receiver'),''),
      receiver_district=nullif(trim(p_shipment->>'receiver_district'),''),
      receiver_ii=nullif(trim(p_shipment->>'receiver_ii'),''),
      adet=v_total_units,
      cinsi=v_first_kind,
      kg_ds=v_total_weight/v_total_units,
      toplam_kg_ds=v_total_weight,
      satis_tutar=v_total_price,
      updated_at=now()
    WHERE id=p_shipment_id;

    v_id := p_shipment_id;
    DELETE FROM public.shipment_cargo_items WHERE shipment_id=v_id;
  END IF;

  INSERT INTO public.shipment_cargo_items(
    shipment_id,adet,cinsi,kg_ds,sira_no,birim_fiyat,alt_toplam_fiyat,alt_toplam
  )
  SELECT v_id,(item->>'adet')::integer,trim(item->>'cinsi'),
    (item->>'kg_ds')::numeric,(row_number() over())::integer,
    coalesce((item->>'birim_fiyat')::numeric,0),
    coalesce((item->>'alt_toplam_fiyat')::numeric,0),
    (item->>'adet')::numeric*(item->>'kg_ds')::numeric
  FROM jsonb_array_elements(p_cargo_items) item;

  IF v_status IN ('teslim_edildi','Teslim Edildi') THEN
    INSERT INTO public.shipment_events(
      shipment_id,shipment_code,event_type,old_status,new_status,changed_fields,
      actor_id,actor_email,actor_role,source,note
    ) VALUES (
      v_id,v_code,'owner_approved_edit',v_status,v_status,'{}'::jsonb,
      auth.uid(),v_email,'admin','portal',
      'Tamamlanmış sevkiyat değişikliği şirket sahibi tarafından onaylandı'
    );
  END IF;

  RETURN v_id;
END $$;

REVOKE ALL ON FUNCTION public.rex_save_shipment(uuid,jsonb,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rex_save_shipment(uuid,jsonb,jsonb) TO authenticated;
