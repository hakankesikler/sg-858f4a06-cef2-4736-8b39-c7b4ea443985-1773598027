BEGIN;

ALTER TABLE public.crm_settings
  RENAME COLUMN approval_threshold TO approval_threshold_try;
ALTER TABLE public.crm_settings
  ADD COLUMN IF NOT EXISTS approval_threshold_usd numeric(15,2) NOT NULL DEFAULT 3000 CHECK (approval_threshold_usd>=0),
  ADD COLUMN IF NOT EXISTS approval_threshold_eur numeric(15,2) NOT NULL DEFAULT 3000 CHECK (approval_threshold_eur>=0),
  ADD COLUMN IF NOT EXISTS approval_threshold_gbp numeric(15,2) NOT NULL DEFAULT 2500 CHECK (approval_threshold_gbp>=0),
  ADD COLUMN IF NOT EXISTS minimum_margin_percent numeric(6,2) NOT NULL DEFAULT 8 CHECK (minimum_margin_percent BETWEEN -100 AND 100);

ALTER TABLE public.crm_offers
  ADD COLUMN IF NOT EXISTS pickup_location text,
  ADD COLUMN IF NOT EXISTS delivery_location text,
  ADD COLUMN IF NOT EXISTS service_type text,
  ADD COLUMN IF NOT EXISTS vehicle_type text,
  ADD COLUMN IF NOT EXISTS cargo_description text,
  ADD COLUMN IF NOT EXISTS weight_kg numeric(15,3) CHECK (weight_kg IS NULL OR weight_kg>=0),
  ADD COLUMN IF NOT EXISTS pallet_count integer CHECK (pallet_count IS NULL OR pallet_count>=0),
  ADD COLUMN IF NOT EXISTS cost_amount numeric(15,2) NOT NULL DEFAULT 0 CHECK (cost_amount>=0),
  ADD COLUMN IF NOT EXISTS vat_rate numeric(6,2) NOT NULL DEFAULT 20 CHECK (vat_rate BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS payment_terms text,
  ADD COLUMN IF NOT EXISTS incoterm text,
  ADD COLUMN IF NOT EXISTS exchange_rate numeric(18,6) CHECK (exchange_rate IS NULL OR exchange_rate>0),
  ADD COLUMN IF NOT EXISTS parent_offer_id uuid REFERENCES public.crm_offers(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS revision_no integer NOT NULL DEFAULT 1 CHECK (revision_no>0),
  ADD COLUMN IF NOT EXISTS decision_at timestamptz,
  ADD COLUMN IF NOT EXISTS decision_by_name text,
  ADD COLUMN IF NOT EXISTS decision_channel text,
  ADD COLUMN IF NOT EXISTS decision_reason text;

CREATE TABLE IF NOT EXISTS public.crm_offer_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.crm_offers(id) ON DELETE RESTRICT,
  line_no integer NOT NULL CHECK (line_no>0),
  description text NOT NULL CHECK (length(trim(description))>=2),
  quantity numeric(15,3) NOT NULL DEFAULT 1 CHECK (quantity>0),
  unit text NOT NULL DEFAULT 'adet',
  unit_price numeric(15,2) NOT NULL CHECK (unit_price>=0),
  tax_rate numeric(6,2) NOT NULL DEFAULT 20 CHECK (tax_rate BETWEEN 0 AND 100),
  surcharge_type text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(offer_id,line_no)
);
CREATE INDEX IF NOT EXISTS crm_offer_items_offer_idx ON public.crm_offer_items(offer_id,line_no);
ALTER TABLE public.crm_offer_items ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.crm_offer_items TO authenticated;
CREATE POLICY rex_crm_offer_items_select ON public.crm_offer_items FOR SELECT TO authenticated
  USING (public.rex_has_permission('crm.sales_pipeline','view') OR public.rex_has_permission('reports.sales','view'));
CREATE POLICY rex_crm_offer_items_write ON public.crm_offer_items FOR ALL TO authenticated
  USING (public.rex_has_permission('crm.sales_pipeline','manage') AND EXISTS(SELECT 1 FROM public.crm_offers o WHERE o.id=offer_id AND o.status='draft'))
  WITH CHECK (public.rex_has_permission('crm.sales_pipeline','manage') AND EXISTS(SELECT 1 FROM public.crm_offers o WHERE o.id=offer_id AND o.status='draft'));

ALTER TABLE public.crm_stage_events DROP CONSTRAINT IF EXISTS crm_stage_events_event_type_check;
ALTER TABLE public.crm_stage_events ADD CONSTRAINT crm_stage_events_event_type_check CHECK (event_type IN (
  'created','assigned','stage_changed','activity_added','offer_created','offer_sent','offer_revised',
  'offer_accepted','offer_rejected','offer_cancelled','offer_expired','customer_created','job_created',
  'won_automatically','lost'
));

CREATE OR REPLACE FUNCTION public.rex_crm_offer_before_write()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_sequence integer; v_threshold numeric; v_min_margin numeric; v_margin numeric;
BEGIN
  IF TG_OP='INSERT' THEN
    IF nullif(trim(NEW.offer_no),'') IS NULL THEN
      PERFORM pg_advisory_xact_lock(hashtext('rex_crm_offer_no'));
      SELECT coalesce(max((regexp_match(offer_no,'^TKL-[0-9]{4}-(\d+)'))[1]::integer),0)+1 INTO v_sequence
      FROM public.crm_offers WHERE offer_no LIKE 'TKL-'||to_char(current_date,'YYYY')||'-%';
      NEW.offer_no:='TKL-'||to_char(current_date,'YYYY')||'-'||lpad(v_sequence::text,5,'0');
    END IF;
    NEW.version_no:=1;
  ELSE
    IF ROW(OLD.subject,OLD.amount,OLD.currency,OLD.valid_until,OLD.notes,OLD.pickup_location,OLD.delivery_location,OLD.service_type,OLD.vehicle_type,OLD.cargo_description,OLD.weight_kg,OLD.pallet_count,OLD.cost_amount,OLD.vat_rate,OLD.payment_terms,OLD.incoterm)
       IS DISTINCT FROM ROW(NEW.subject,NEW.amount,NEW.currency,NEW.valid_until,NEW.notes,NEW.pickup_location,NEW.delivery_location,NEW.service_type,NEW.vehicle_type,NEW.cargo_description,NEW.weight_kg,NEW.pallet_count,NEW.cost_amount,NEW.vat_rate,NEW.payment_terms,NEW.incoterm) THEN
      IF OLD.status<>'draft' THEN RAISE EXCEPTION 'Gönderilmiş teklif doğrudan değiştirilemez; revizyon oluşturun'; END IF;
      NEW.version_no:=OLD.version_no+1;
      NEW.approved_by:=NULL; NEW.approved_at:=NULL; NEW.approval_note:=NULL;
    END IF;
  END IF;
  SELECT CASE NEW.currency WHEN 'USD' THEN approval_threshold_usd WHEN 'EUR' THEN approval_threshold_eur WHEN 'GBP' THEN approval_threshold_gbp ELSE approval_threshold_try END,
    minimum_margin_percent INTO v_threshold,v_min_margin FROM public.crm_settings WHERE id=true;
  v_margin:=CASE WHEN NEW.amount>0 THEN ((NEW.amount-NEW.cost_amount)/NEW.amount)*100 ELSE 0 END;
  IF TG_OP='INSERT' OR OLD.amount IS DISTINCT FROM NEW.amount OR OLD.cost_amount IS DISTINCT FROM NEW.cost_amount OR OLD.currency IS DISTINCT FROM NEW.currency THEN
    NEW.approval_status:=CASE WHEN NEW.amount>=coalesce(v_threshold,100000) OR v_margin<coalesce(v_min_margin,8) THEN 'pending' ELSE 'not_required' END;
  END IF;
  IF NEW.currency<>'TRY' AND NEW.exchange_rate IS NULL THEN RAISE EXCEPTION 'Dövizli teklifte kur bilgisi zorunludur'; END IF;
  IF NEW.status='sent' AND NEW.approval_status NOT IN ('not_required','approved') THEN RAISE EXCEPTION 'Yönetici onayı tamamlanmadan teklif gönderilemez'; END IF;
  IF NEW.status='sent' AND (TG_OP='INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN NEW.sent_at:=coalesce(NEW.sent_at,now()); END IF;
  NEW.updated_at:=now(); RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.rex_crm_offer_version_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_offer public.crm_offers%ROWTYPE; v_items jsonb;
BEGIN
  -- The constraint trigger runs at transaction end. By then every offer line
  -- created by the atomic RPC is present, so the immutable snapshot is complete.
  SELECT * INTO v_offer FROM public.crm_offers WHERE id=NEW.id;
  IF NOT FOUND THEN RETURN NEW; END IF;
  SELECT coalesce(jsonb_agg(to_jsonb(item) ORDER BY item.line_no),'[]'::jsonb)
    INTO v_items
  FROM public.crm_offer_items item WHERE item.offer_id=NEW.id;
  INSERT INTO public.crm_offer_versions(offer_id,version_no,snapshot,actor_id,actor_email)
  VALUES(v_offer.id,v_offer.version_no,(to_jsonb(v_offer)-'email_error')||jsonb_build_object('items',v_items),auth.uid(),public.rex_crm_actor_email())
  ON CONFLICT (offer_id,version_no) DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS rex_crm_offer_version_event ON public.crm_offers;
CREATE CONSTRAINT TRIGGER rex_crm_offer_version_event
AFTER INSERT OR UPDATE ON public.crm_offers
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION public.rex_crm_offer_version_event();

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
    pickup_location,delivery_location,service_type,vehicle_type,cargo_description,weight_kg,pallet_count,cost_amount,vat_rate,payment_terms,incoterm,exchange_rate,parent_offer_id,revision_no)
  VALUES(v_old.offer_no||'-R'||v_revision,v_old.opportunity_id,v_old.quote_request_id,v_old.customer_id,v_old.subject,v_old.amount,v_old.currency,'draft',v_old.valid_until,
    concat_ws(E'\n',v_old.notes,'Revizyon nedeni: '||trim(p_reason)),auth.uid(),v_old.pickup_location,v_old.delivery_location,v_old.service_type,v_old.vehicle_type,v_old.cargo_description,
    v_old.weight_kg,v_old.pallet_count,v_old.cost_amount,v_old.vat_rate,v_old.payment_terms,v_old.incoterm,v_old.exchange_rate,coalesce(v_old.parent_offer_id,v_old.id),v_revision)
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
  INSERT INTO public.crm_offers(offer_no,opportunity_id,quote_request_id,customer_id,subject,amount,currency,status,valid_until,notes,created_by,
    pickup_location,delivery_location,service_type,vehicle_type,cargo_description,weight_kg,pallet_count,cost_amount,vat_rate,payment_terms,incoterm,exchange_rate)
  VALUES('',(p_payload->>'opportunity_id')::uuid,nullif(p_payload->>'quote_request_id','')::uuid,nullif(p_payload->>'customer_id','')::uuid,
    trim(p_payload->>'subject'),v_amount,coalesce(nullif(p_payload->>'currency',''),'TRY'),'draft',nullif(p_payload->>'valid_until','')::date,nullif(p_payload->>'notes',''),auth.uid(),
    nullif(p_payload->>'pickup_location',''),nullif(p_payload->>'delivery_location',''),nullif(p_payload->>'service_type',''),nullif(p_payload->>'vehicle_type',''),
    nullif(p_payload->>'cargo_description',''),nullif(p_payload->>'weight_kg','')::numeric,nullif(p_payload->>'pallet_count','')::integer,
    coalesce(nullif(p_payload->>'cost_amount','')::numeric,0),coalesce(nullif(p_payload->>'vat_rate','')::numeric,20),nullif(p_payload->>'payment_terms',''),
    nullif(p_payload->>'incoterm',''),nullif(p_payload->>'exchange_rate','')::numeric) RETURNING id INTO v_offer_id;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
    v_line:=v_line+1;
    INSERT INTO public.crm_offer_items(offer_id,line_no,description,quantity,unit,unit_price,tax_rate,surcharge_type)
    VALUES(v_offer_id,v_line,trim(v_item->>'description'),(v_item->>'quantity')::numeric,coalesce(nullif(v_item->>'unit',''),'adet'),
      (v_item->>'unit_price')::numeric,coalesce(nullif(v_item->>'tax_rate','')::numeric,20),nullif(v_item->>'surcharge_type',''));
  END LOOP;
  RETURN v_offer_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.rex_crm_decide_offer(p_offer_id uuid,p_decision text,p_actor_name text,p_channel text,p_reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_offer public.crm_offers%ROWTYPE; v_event text;
BEGIN
  IF NOT public.rex_has_permission('crm.sales_pipeline','manage') THEN RAISE EXCEPTION 'Teklif sonucu kaydetme yetkiniz bulunmuyor'; END IF;
  IF p_decision NOT IN ('accepted','rejected','cancelled') THEN RAISE EXCEPTION 'Geçersiz teklif kararı'; END IF;
  IF p_decision IN ('accepted','rejected') AND length(trim(coalesce(p_actor_name,'')))<2 THEN RAISE EXCEPTION 'Kararı veren müşteri yetkilisi zorunludur'; END IF;
  IF p_decision IN ('rejected','cancelled') AND length(trim(coalesce(p_reason,'')))<3 THEN RAISE EXCEPTION 'Ret veya iptal nedeni zorunludur'; END IF;
  SELECT * INTO v_offer FROM public.crm_offers WHERE id=p_offer_id FOR UPDATE;
  IF NOT FOUND OR v_offer.status NOT IN ('sent') THEN RAISE EXCEPTION 'Yalnızca gönderilmiş teklif sonuçlandırılabilir'; END IF;
  UPDATE public.crm_offers SET status=p_decision,decision_at=now(),decision_by_name=nullif(trim(p_actor_name),''),decision_channel=nullif(trim(p_channel),''),decision_reason=nullif(trim(p_reason),''),updated_at=now()
  WHERE id=p_offer_id;
  v_event:=CASE p_decision WHEN 'accepted' THEN 'offer_accepted' WHEN 'rejected' THEN 'offer_rejected' ELSE 'offer_cancelled' END;
  INSERT INTO public.crm_stage_events(opportunity_id,event_type,old_stage,new_stage,details,actor_id,actor_email)
  SELECT v_offer.opportunity_id,v_event,o.stage,o.stage,jsonb_build_object('offer_id',v_offer.id,'actor_name',p_actor_name,'channel',p_channel,'reason',p_reason),auth.uid(),public.rex_crm_actor_email()
  FROM public.crm_opportunities o WHERE o.id=v_offer.opportunity_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.rex_crm_expire_offers()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_count integer;
BEGIN
  UPDATE public.crm_offers SET status='expired',decision_at=now(),decision_reason='Geçerlilik süresi otomatik sona erdi',updated_at=now()
  WHERE status='sent' AND valid_until<current_date;
  GET DIAGNOSTICS v_count=ROW_COUNT; RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.rex_crm_create_offer_revision(uuid,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.rex_crm_create_offer(jsonb,jsonb) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.rex_crm_decide_offer(uuid,text,text,text,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.rex_crm_expire_offers() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rex_crm_create_offer_revision(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_crm_create_offer(jsonb,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_crm_decide_offer(uuid,text,text,text,text) TO authenticated;

COMMIT;
