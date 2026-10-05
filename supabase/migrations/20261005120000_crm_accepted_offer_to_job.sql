BEGIN;

-- A work order must point to the exact accepted revision used for its price.
ALTER TABLE public.transport_jobs
  ADD COLUMN IF NOT EXISTS crm_offer_id uuid REFERENCES public.crm_offers(id) ON DELETE RESTRICT;
CREATE UNIQUE INDEX IF NOT EXISTS transport_jobs_crm_offer_id_unique
  ON public.transport_jobs(crm_offer_id) WHERE crm_offer_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.rex_crm_offer_job_links(p_opportunity_id uuid)
RETURNS TABLE(offer_id uuid, job_id uuid, job_code text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  IF NOT public.rex_has_permission('crm.sales_pipeline','view')
     OR NOT public.rex_crm_can_access_opportunity(p_opportunity_id) THEN
    RAISE EXCEPTION 'Bu CRM kaydına erişim yetkiniz yok';
  END IF;
  RETURN QUERY SELECT j.crm_offer_id,j.id,j.job_code FROM public.transport_jobs j
    JOIN public.crm_offers o ON o.id=j.crm_offer_id
    WHERE o.opportunity_id=p_opportunity_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.rex_crm_create_job_from_accepted_offer(p_offer_id uuid, p_job jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
  v_offer public.crm_offers%ROWTYPE;
  v_opp public.crm_opportunities%ROWTYPE;
  v_job uuid;
  v_code text;
  v_quantity integer;
  v_weight numeric;
  v_job_date date;
  v_supplier uuid;
  v_seller text;
BEGIN
  IF NOT public.rex_has_permission('sales.work_orders','manage')
     OR NOT public.rex_has_permission('crm.sales_pipeline','manage') THEN
    RAISE EXCEPTION 'Teklif ve iş kaydı yetkisi gereklidir';
  END IF;
  IF p_job IS NULL OR jsonb_typeof(p_job)<>'object' THEN
    RAISE EXCEPTION 'İş emri bilgileri eksik';
  END IF;

  SELECT * INTO v_offer FROM public.crm_offers WHERE id=p_offer_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Teklif bulunamadı'; END IF;
  IF NOT public.rex_crm_can_access_opportunity(v_offer.opportunity_id) THEN
    RAISE EXCEPTION 'Bu CRM kaydına erişim yetkiniz yok';
  END IF;
  SELECT * INTO v_opp FROM public.crm_opportunities
    WHERE id=v_offer.opportunity_id FOR UPDATE;
  SELECT * INTO v_offer FROM public.crm_offers WHERE id=p_offer_id FOR UPDATE;
  IF v_offer.opportunity_id<>v_opp.id
     OR NOT public.rex_crm_can_access_opportunity(v_opp.id) THEN
    RAISE EXCEPTION 'Teklif ve CRM kaydı uyuşmuyor veya erişim yetkiniz yok';
  END IF;
  IF v_offer.status<>'accepted' OR v_offer.approval_status IN ('pending','rejected') THEN
    RAISE EXCEPTION 'Yalnızca kabul edilmiş ve onayı tamamlanmış teklif iş emrine dönüştürülebilir';
  END IF;
  IF v_offer.amount<=0 THEN RAISE EXCEPTION 'Teklif tutarı sıfırdan büyük olmalıdır'; END IF;
  IF v_opp.stage IN ('declined','lost') THEN
    RAISE EXCEPTION 'Kapalı CRM kaydından iş emri oluşturulamaz';
  END IF;
  IF v_opp.customer_id IS NULL THEN RAISE EXCEPTION 'Önce müşteri cari kartını oluşturun'; END IF;
  IF v_offer.customer_id IS NOT NULL AND v_offer.customer_id<>v_opp.customer_id THEN
    RAISE EXCEPTION 'Teklif carisi ile CRM carisi uyuşmuyor';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.transport_jobs j
    LEFT JOIN public.crm_offers linked ON linked.id=j.crm_offer_id
    WHERE j.customer_id=v_opp.customer_id AND (
      coalesce(linked.parent_offer_id,linked.id)=coalesce(v_offer.parent_offer_id,v_offer.id)
      OR j.quote_no IN (
        SELECT family.offer_no FROM public.crm_offers family
        WHERE family.opportunity_id=v_offer.opportunity_id
          AND coalesce(family.parent_offer_id,family.id)=coalesce(v_offer.parent_offer_id,v_offer.id)
      )
    )
  ) THEN
    RAISE EXCEPTION 'Bu teklif veya revizyon ailesi için zaten bir iş emri var; önce mevcut kaydı kontrol edin';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.crm_offers newer
    WHERE newer.opportunity_id=v_offer.opportunity_id
      AND coalesce(newer.parent_offer_id,newer.id)=coalesce(v_offer.parent_offer_id,v_offer.id)
      AND newer.status='accepted' AND newer.revision_no>v_offer.revision_no
  ) THEN
    RAISE EXCEPTION 'Bu teklifin daha yeni kabul edilmiş bir revizyonu var';
  END IF;

  v_quantity:=nullif(p_job->>'quantity','')::integer;
  v_weight:=nullif(p_job->>'total_weight','')::numeric;
  v_job_date:=nullif(p_job->>'job_date','')::date;
  v_supplier:=nullif(p_job->>'supplier_id','')::uuid;
  IF v_job_date IS NULL OR v_quantity IS NULL OR v_quantity<=0
     OR v_weight IS NULL OR v_weight<=0
     OR nullif(trim(p_job->>'sender_name'),'') IS NULL
     OR nullif(trim(p_job->>'sender_address'),'') IS NULL
     OR nullif(trim(p_job->>'sender_city'),'') IS NULL
     OR nullif(trim(p_job->>'receiver_name'),'') IS NULL
     OR nullif(trim(p_job->>'receiver_address'),'') IS NULL
     OR nullif(trim(p_job->>'receiver_city'),'') IS NULL
     OR nullif(trim(p_job->>'cargo_type'),'') IS NULL THEN
    RAISE EXCEPTION 'Tarih, gönderici/alıcı adı ve adresi, iller, yük cinsi, adet ve ağırlık zorunludur';
  END IF;
  IF v_supplier IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.customers c WHERE c.id=v_supplier AND c.archived_at IS NULL AND (
      lower(coalesce(c.account_type,'')) LIKE '%tedarik%'
      OR lower(coalesce(c.account_type,'')) IN ('her_ikisi','her ikisi')
    )
  ) THEN
    RAISE EXCEPTION 'Geçerli bir tedarikçi cari kartı seçin';
  END IF;
  SELECT r.email INTO v_seller FROM public.app_user_roles r
    WHERE r.user_id=v_opp.assigned_to AND r.active=true LIMIT 1;

  PERFORM pg_advisory_xact_lock(hashtext('rex_transport_job_code'));
  SELECT 'JOB-'||lpad((coalesce(max((regexp_match(job_code,'^JOB-(\d+)$'))[1]::integer),0)+1)::text,6,'0')
    INTO v_code FROM public.transport_jobs;
  INSERT INTO public.transport_jobs(
    job_code,job_date,quote_no,crm_offer_id,seller,customer_id,supplier_id,
    sender_name,sender_address,sender_district,sender_city,
    receiver_name,receiver_address,receiver_district,receiver_city,
    quantity,cargo_type,unit_weight,total_weight,sales_unit_price,sales_total,cost,currency,submitted_by
  ) VALUES (
    v_code,v_job_date,v_offer.offer_no,v_offer.id,coalesce(v_seller,public.rex_crm_actor_email()),v_opp.customer_id,v_supplier,
    trim(p_job->>'sender_name'),trim(p_job->>'sender_address'),nullif(trim(p_job->>'sender_district'),''),trim(p_job->>'sender_city'),
    trim(p_job->>'receiver_name'),trim(p_job->>'receiver_address'),nullif(trim(p_job->>'receiver_district'),''),trim(p_job->>'receiver_city'),
    v_quantity,trim(p_job->>'cargo_type'),v_weight/v_quantity,v_weight,
    v_offer.amount/v_quantity,v_offer.amount,coalesce(v_offer.cost_amount,0),v_offer.currency,auth.uid()
  ) RETURNING id INTO v_job;
  UPDATE public.crm_opportunities SET first_job_id=coalesce(first_job_id,v_job),updated_at=now() WHERE id=v_opp.id;
  INSERT INTO public.crm_stage_events(opportunity_id,event_type,old_stage,new_stage,details,actor_id,actor_email)
  VALUES(v_opp.id,'job_created',v_opp.stage,v_opp.stage,
    jsonb_build_object('job_id',v_job,'job_code',v_code,'offer_id',v_offer.id,'offer_no',v_offer.offer_no),
    auth.uid(),public.rex_crm_actor_email());
  RETURN v_job;
END;
$$;

-- The old web-request-only RPC can create work orders without an accepted offer.
REVOKE EXECUTE ON FUNCTION public.rex_crm_create_job_from_quote(uuid) FROM authenticated;
REVOKE ALL ON FUNCTION public.rex_crm_offer_job_links(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rex_crm_offer_job_links(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.rex_crm_create_job_from_accepted_offer(uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rex_crm_create_job_from_accepted_offer(uuid,jsonb) TO authenticated;

COMMIT;
