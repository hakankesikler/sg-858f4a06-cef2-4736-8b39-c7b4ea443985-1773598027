ALTER TABLE public.crm_offers
  ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS collection_date date,
  ADD COLUMN IF NOT EXISTS destination_district text,
  ADD COLUMN IF NOT EXISTS estimated_delivery_date date,
  ADD COLUMN IF NOT EXISTS transit_schedule_snapshot jsonb;

CREATE INDEX IF NOT EXISTS crm_offers_supplier_collection_idx ON public.crm_offers(supplier_id, collection_date DESC);

CREATE OR REPLACE FUNCTION public.rex_crm_create_offer_revision(p_offer_id uuid,p_reason text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_old public.crm_offers%ROWTYPE; v_new_id uuid; v_revision integer;
BEGIN
  IF NOT public.rex_has_permission('crm.sales_pipeline','manage') THEN RAISE EXCEPTION 'Teklif revizyon yetkiniz bulunmuyor'; END IF;
  IF length(trim(coalesce(p_reason,'')))<3 THEN RAISE EXCEPTION 'Revizyon nedeni zorunludur'; END IF;
  SELECT * INTO v_old FROM public.crm_offers WHERE id=p_offer_id FOR UPDATE;
  IF NOT FOUND OR v_old.status='draft' THEN RAISE EXCEPTION 'Yalnızca gönderilmiş veya sonuçlanmış teklif revize edilebilir'; END IF;
  SELECT coalesce(max(revision_no),1)+1 INTO v_revision FROM public.crm_offers WHERE id=coalesce(v_old.parent_offer_id,v_old.id) OR parent_offer_id=coalesce(v_old.parent_offer_id,v_old.id);
  INSERT INTO public.crm_offers(offer_no,opportunity_id,quote_request_id,customer_id,subject,amount,currency,status,valid_until,notes,created_by,
    pickup_location,delivery_location,service_type,vehicle_type,cargo_description,weight_kg,pallet_count,cost_amount,vat_rate,payment_terms,incoterm,exchange_rate,
    supplier_id,collection_date,destination_district,estimated_delivery_date,transit_schedule_snapshot,parent_offer_id,revision_no)
  VALUES(v_old.offer_no||'-R'||v_revision,v_old.opportunity_id,v_old.quote_request_id,v_old.customer_id,v_old.subject,v_old.amount,v_old.currency,'draft',v_old.valid_until,
    concat_ws(E'\n',v_old.notes,'Revizyon nedeni: '||trim(p_reason)),auth.uid(),v_old.pickup_location,v_old.delivery_location,v_old.service_type,v_old.vehicle_type,
    v_old.cargo_description,v_old.weight_kg,v_old.pallet_count,v_old.cost_amount,v_old.vat_rate,v_old.payment_terms,v_old.incoterm,v_old.exchange_rate,
    v_old.supplier_id,v_old.collection_date,v_old.destination_district,v_old.estimated_delivery_date,v_old.transit_schedule_snapshot,
    coalesce(v_old.parent_offer_id,v_old.id),v_revision)
  RETURNING id INTO v_new_id;
  INSERT INTO public.crm_offer_items(offer_id,line_no,description,quantity,unit,unit_price,tax_rate,surcharge_type)
  SELECT v_new_id,line_no,description,quantity,unit,unit_price,tax_rate,surcharge_type FROM public.crm_offer_items WHERE offer_id=v_old.id;
  INSERT INTO public.crm_stage_events(opportunity_id,event_type,old_stage,new_stage,details,actor_id,actor_email)
  SELECT v_old.opportunity_id,'offer_revised',o.stage,o.stage,jsonb_build_object('old_offer_id',v_old.id,'new_offer_id',v_new_id,'reason',trim(p_reason)),auth.uid(),public.rex_crm_actor_email()
  FROM public.crm_opportunities o WHERE o.id=v_old.opportunity_id;
  RETURN v_new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.rex_crm_create_offer(p_payload jsonb,p_items jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_offer_id uuid; v_item jsonb; v_line integer:=0; v_items_total numeric:=0; v_amount numeric;
BEGIN
  IF NOT public.rex_has_permission('crm.sales_pipeline','manage') THEN RAISE EXCEPTION 'Teklif oluşturma yetkiniz bulunmuyor'; END IF;
  v_amount:=coalesce((p_payload->>'amount')::numeric,0);
  IF v_amount<0 OR length(trim(coalesce(p_payload->>'subject','')))<2 THEN RAISE EXCEPTION 'Teklif konusu ve geçerli tutar zorunludur'; END IF;
  IF jsonb_typeof(coalesce(p_items,'[]'::jsonb))<>'array' OR jsonb_array_length(coalesce(p_items,'[]'::jsonb))=0 THEN RAISE EXCEPTION 'En az bir teklif kalemi zorunludur'; END IF;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
    v_items_total:=v_items_total+coalesce((v_item->>'quantity')::numeric,0)*coalesce((v_item->>'unit_price')::numeric,0);
  END LOOP;
  IF abs(v_items_total-v_amount)>0.01 THEN RAISE EXCEPTION 'Teklif toplamı ile kalem toplamı eşit olmalıdır'; END IF;
  IF nullif(p_payload->>'estimated_delivery_date','') IS NOT NULL AND nullif(p_payload->>'collection_date','') IS NULL THEN RAISE EXCEPTION 'Tahmini teslim tarihi için alım tarihi zorunludur'; END IF;
  INSERT INTO public.crm_offers(offer_no,opportunity_id,quote_request_id,customer_id,subject,amount,currency,status,valid_until,notes,created_by,
    pickup_location,delivery_location,service_type,vehicle_type,cargo_description,weight_kg,pallet_count,cost_amount,vat_rate,payment_terms,incoterm,exchange_rate,
    supplier_id,collection_date,destination_district,estimated_delivery_date,transit_schedule_snapshot)
  VALUES('',(p_payload->>'opportunity_id')::uuid,nullif(p_payload->>'quote_request_id','')::uuid,nullif(p_payload->>'customer_id','')::uuid,
    trim(p_payload->>'subject'),v_amount,coalesce(nullif(p_payload->>'currency',''),'TRY'),'draft',nullif(p_payload->>'valid_until','')::date,nullif(p_payload->>'notes',''),auth.uid(),
    nullif(p_payload->>'pickup_location',''),nullif(p_payload->>'delivery_location',''),nullif(p_payload->>'service_type',''),nullif(p_payload->>'vehicle_type',''),
    nullif(p_payload->>'cargo_description',''),nullif(p_payload->>'weight_kg','')::numeric,nullif(p_payload->>'pallet_count','')::integer,
    coalesce(nullif(p_payload->>'cost_amount','')::numeric,0),coalesce(nullif(p_payload->>'vat_rate','')::numeric,20),nullif(p_payload->>'payment_terms',''),
    nullif(p_payload->>'incoterm',''),nullif(p_payload->>'exchange_rate','')::numeric,nullif(p_payload->>'supplier_id','')::uuid,
    nullif(p_payload->>'collection_date','')::date,nullif(p_payload->>'destination_district',''),nullif(p_payload->>'estimated_delivery_date','')::date,
    p_payload->'transit_schedule_snapshot') RETURNING id INTO v_offer_id;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
    v_line:=v_line+1;
    INSERT INTO public.crm_offer_items(offer_id,line_no,description,quantity,unit,unit_price,tax_rate,surcharge_type)
    VALUES(v_offer_id,v_line,trim(v_item->>'description'),(v_item->>'quantity')::numeric,coalesce(nullif(v_item->>'unit',''),'adet'),
      (v_item->>'unit_price')::numeric,coalesce(nullif(v_item->>'tax_rate','')::numeric,20),nullif(v_item->>'surcharge_type',''));
  END LOOP;
  RETURN v_offer_id;
END;
$$;

COMMENT ON COLUMN public.crm_offers.transit_schedule_snapshot IS 'Teklif anındaki değiştirilemez tedarikçi termin hesap özeti';
