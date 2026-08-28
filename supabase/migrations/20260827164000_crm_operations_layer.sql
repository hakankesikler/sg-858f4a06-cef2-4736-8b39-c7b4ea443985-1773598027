BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.crm_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  opportunity_id uuid REFERENCES public.crm_opportunities(id) ON DELETE SET NULL,
  full_name text NOT NULL CHECK (length(trim(full_name))>=2),
  title text,department text,email text,phone text,
  preferred_channel text CHECK (preferred_channel IS NULL OR preferred_channel IN ('email','phone','whatsapp','meeting')),
  is_decision_maker boolean NOT NULL DEFAULT false,is_primary boolean NOT NULL DEFAULT false,
  commercial_consent boolean NOT NULL DEFAULT false,consent_recorded_at timestamptz,
  active boolean NOT NULL DEFAULT true,created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS crm_contacts_customer_idx ON public.crm_contacts(customer_id,active,is_primary DESC);
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,UPDATE ON public.crm_contacts TO authenticated;
CREATE POLICY rex_crm_contacts_select ON public.crm_contacts FOR SELECT TO authenticated USING(public.rex_has_permission('crm.customers','view'));
CREATE POLICY rex_crm_contacts_write ON public.crm_contacts FOR ALL TO authenticated
  USING(public.rex_has_permission('crm.customers','manage')) WITH CHECK(public.rex_has_permission('crm.customers','manage'));

CREATE TABLE IF NOT EXISTS public.crm_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id uuid REFERENCES public.crm_opportunities(id) ON DELETE CASCADE,task_id uuid REFERENCES public.crm_tasks(id) ON DELETE CASCADE,
  offer_id uuid REFERENCES public.crm_offers(id) ON DELETE CASCADE,notification_type text NOT NULL,
  title text NOT NULL,message text NOT NULL,severity text NOT NULL DEFAULT 'info' CHECK(severity IN ('info','warning','critical')),
  deduplication_key text NOT NULL UNIQUE,read_at timestamptz,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS crm_notifications_recipient_idx ON public.crm_notifications(recipient_id,read_at,created_at DESC);
ALTER TABLE public.crm_notifications ENABLE ROW LEVEL SECURITY;
GRANT SELECT,UPDATE ON public.crm_notifications TO authenticated;
CREATE POLICY rex_crm_notifications_self_select ON public.crm_notifications FOR SELECT TO authenticated USING(recipient_id=auth.uid());
CREATE POLICY rex_crm_notifications_self_update ON public.crm_notifications FOR UPDATE TO authenticated USING(recipient_id=auth.uid()) WITH CHECK(recipient_id=auth.uid());

ALTER TABLE public.crm_offers DROP CONSTRAINT IF EXISTS crm_offers_email_status_check;
ALTER TABLE public.crm_offers ADD CONSTRAINT crm_offers_email_status_check CHECK(email_status IN ('not_sent','sending','sent','delivered','delayed','opened','clicked','bounced','complained','failed'));
CREATE TABLE IF NOT EXISTS public.crm_email_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,event_id text NOT NULL UNIQUE,
  offer_id uuid REFERENCES public.crm_offers(id) ON DELETE RESTRICT,provider_email_id text NOT NULL,event_type text NOT NULL,
  event_at timestamptz NOT NULL,payload jsonb NOT NULL DEFAULT '{}'::jsonb,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS crm_email_events_offer_idx ON public.crm_email_events(offer_id,event_at DESC);
ALTER TABLE public.crm_email_events ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.crm_email_events TO authenticated;
GRANT USAGE,SELECT ON SEQUENCE public.crm_email_events_id_seq TO authenticated;
CREATE POLICY rex_crm_email_events_select ON public.crm_email_events FOR SELECT TO authenticated
  USING(public.rex_has_permission('crm.sales_pipeline','view') AND (offer_id IS NULL OR EXISTS(SELECT 1 FROM public.crm_offers o WHERE o.id=offer_id AND public.rex_crm_can_access_opportunity(o.opportunity_id))));

CREATE TABLE IF NOT EXISTS public.crm_import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),idempotency_key text NOT NULL UNIQUE,file_name text,row_count integer NOT NULL,
  status text NOT NULL CHECK(status IN ('completed','failed')),created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_import_batches ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.crm_import_batches TO authenticated;
CREATE POLICY rex_crm_import_batches_select ON public.crm_import_batches FOR SELECT TO authenticated USING(created_by=auth.uid() OR public.rex_is_owner_admin());

CREATE OR REPLACE FUNCTION public.rex_crm_generate_notifications()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_count integer:=0; v_rows integer;
BEGIN
  INSERT INTO public.crm_notifications(recipient_id,opportunity_id,task_id,notification_type,title,message,severity,deduplication_key)
  SELECT t.assigned_to,t.opportunity_id,t.id,'task_overdue','Geciken satış görevi',t.title||' görevinin süresi geçti.',
    CASE WHEN t.due_at<now()-interval '1 day' THEN 'critical' ELSE 'warning' END,'task-overdue-'||t.id||'-'||current_date
  FROM public.crm_tasks t WHERE t.status='pending' AND t.assigned_to IS NOT NULL AND t.due_at<now()
  ON CONFLICT(deduplication_key) DO NOTHING;
  GET DIAGNOSTICS v_rows=ROW_COUNT; v_count:=v_count+v_rows;
  INSERT INTO public.crm_notifications(recipient_id,opportunity_id,offer_id,notification_type,title,message,severity,deduplication_key)
  SELECT coalesce(o.assigned_to,o.created_by),o.id,f.id,'offer_expiring','Teklif süresi yaklaşıyor',f.offer_no||' numaralı teklif '||f.valid_until||' tarihinde sona eriyor.','warning','offer-expiring-'||f.id||'-'||current_date
  FROM public.crm_offers f JOIN public.crm_opportunities o ON o.id=f.opportunity_id
  WHERE f.status='sent' AND f.valid_until BETWEEN current_date AND current_date+2
  ON CONFLICT(deduplication_key) DO NOTHING;
  GET DIAGNOSTICS v_rows=ROW_COUNT; v_count:=v_count+v_rows;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.rex_crm_record_email_event(p_event_id text,p_provider_id text,p_type text,p_event_at timestamptz,p_payload jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_offer uuid; v_status text;
BEGIN
  SELECT id INTO v_offer FROM public.crm_offers WHERE email_provider_id=p_provider_id;
  INSERT INTO public.crm_email_events(event_id,offer_id,provider_email_id,event_type,event_at,payload)
  VALUES(p_event_id,v_offer,p_provider_id,p_type,p_event_at,coalesce(p_payload,'{}'::jsonb)) ON CONFLICT(event_id) DO NOTHING;
  v_status:=CASE p_type WHEN 'email.delivered' THEN 'delivered' WHEN 'email.delivery_delayed' THEN 'delayed' WHEN 'email.opened' THEN 'opened' WHEN 'email.clicked' THEN 'clicked' WHEN 'email.bounced' THEN 'bounced' WHEN 'email.complained' THEN 'complained' WHEN 'email.failed' THEN 'failed' ELSE NULL END;
  IF v_offer IS NOT NULL AND v_status IS NOT NULL THEN
    UPDATE public.crm_offers SET email_status=v_status,email_error=CASE WHEN v_status IN ('bounced','complained','failed') THEN p_type ELSE email_error END,updated_at=now() WHERE id=v_offer;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.rex_crm_duplicate_candidates(p_company_name text,p_email text DEFAULT NULL,p_phone text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,extensions,pg_temp AS $$
DECLARE v_result jsonb;
BEGIN
  IF NOT public.rex_has_permission('crm.sales_pipeline','view') THEN RAISE EXCEPTION 'CRM görüntüleme yetkiniz bulunmuyor'; END IF;
  SELECT coalesce(jsonb_agg(row_to_json(x) ORDER BY x.match_score DESC),'[]'::jsonb) INTO v_result FROM (
    SELECT 'customer' record_type,c.id,c.name company_name,c.email,c.phone,c.status,
      greatest(similarity(lower(trim(c.name)),lower(trim(p_company_name))),CASE WHEN nullif(trim(p_email),'') IS NOT NULL AND lower(c.email)=lower(trim(p_email)) THEN 1 ELSE 0 END,CASE WHEN length(regexp_replace(coalesce(p_phone,''),'\D','','g'))>=7 AND right(regexp_replace(coalesce(c.phone,''),'\D','','g'),10)=right(regexp_replace(p_phone,'\D','','g'),10) THEN 1 ELSE 0 END) match_score
    FROM public.customers c WHERE c.archived_at IS NULL AND coalesce(c.account_type,'musteri')='musteri'
      AND (similarity(lower(trim(c.name)),lower(trim(p_company_name)))>=0.55 OR (nullif(trim(p_email),'') IS NOT NULL AND lower(c.email)=lower(trim(p_email))) OR (length(regexp_replace(coalesce(p_phone,''),'\D','','g'))>=7 AND right(regexp_replace(coalesce(c.phone,''),'\D','','g'),10)=right(regexp_replace(p_phone,'\D','','g'),10)))
    UNION ALL
    SELECT 'opportunity',o.id,o.company_name,o.email,o.phone,o.stage,
      greatest(similarity(lower(trim(o.company_name)),lower(trim(p_company_name))),CASE WHEN nullif(trim(p_email),'') IS NOT NULL AND lower(o.email)=lower(trim(p_email)) THEN 1 ELSE 0 END,CASE WHEN length(regexp_replace(coalesce(p_phone,''),'\D','','g'))>=7 AND right(regexp_replace(coalesce(o.phone,''),'\D','','g'),10)=right(regexp_replace(p_phone,'\D','','g'),10) THEN 1 ELSE 0 END)
    FROM public.crm_opportunities o WHERE public.rex_crm_can_access_opportunity(o.id)
      AND (similarity(lower(trim(o.company_name)),lower(trim(p_company_name)))>=0.55 OR (nullif(trim(p_email),'') IS NOT NULL AND lower(o.email)=lower(trim(p_email))) OR (length(regexp_replace(coalesce(p_phone,''),'\D','','g'))>=7 AND right(regexp_replace(coalesce(o.phone,''),'\D','','g'),10)=right(regexp_replace(p_phone,'\D','','g'),10)))
    LIMIT 20
  ) x;
  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.rex_crm_import_customers(p_file_name text,p_idempotency_key text,p_rows jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_batch uuid; v_row jsonb; v_customer uuid; v_code text; v_seq integer; v_count integer:=0;
BEGIN
  IF NOT public.rex_has_permission('crm.customers','manage') THEN RAISE EXCEPTION 'Cari içe aktarma yetkiniz bulunmuyor'; END IF;
  IF jsonb_typeof(p_rows)<>'array' OR jsonb_array_length(p_rows)=0 OR jsonb_array_length(p_rows)>1000 THEN RAISE EXCEPTION 'Excel aktarımı 1-1000 satır arasında olmalıdır'; END IF;
  SELECT id INTO v_batch FROM public.crm_import_batches WHERE idempotency_key=p_idempotency_key;
  IF FOUND THEN RETURN jsonb_build_object('batch_id',v_batch,'row_count',(SELECT row_count FROM public.crm_import_batches WHERE id=v_batch),'already_processed',true); END IF;
  INSERT INTO public.crm_import_batches(idempotency_key,file_name,row_count,status) VALUES(p_idempotency_key,left(p_file_name,255),jsonb_array_length(p_rows),'completed') RETURNING id INTO v_batch;
  FOR v_row IN SELECT value FROM jsonb_array_elements(p_rows) LOOP
    IF length(trim(coalesce(v_row->>'name','')))<2 THEN RAISE EXCEPTION 'Aktarım satırında cari adı eksik'; END IF;
    IF nullif(v_row->>'vergi_no','') IS NOT NULL AND EXISTS(SELECT 1 FROM public.customers WHERE archived_at IS NULL AND vergi_no=v_row->>'vergi_no') THEN RAISE EXCEPTION 'Vergi numarası zaten kayıtlı: %',v_row->>'vergi_no'; END IF;
    PERFORM pg_advisory_xact_lock(hashtext('rex_customer_code_CST'));
    SELECT coalesce(max((regexp_match(customer_code,'^CST-(\d+)$'))[1]::integer),0)+1 INTO v_seq FROM public.customers WHERE customer_code LIKE 'CST-%';
    v_code:='CST-'||lpad(v_seq::text,6,'0');
    INSERT INTO public.customers(name,company,account_type,customer_code,status,vergi_no,tc_no,tax_office,city,district,address,phone,email)
    VALUES(trim(v_row->>'name'),trim(v_row->>'name'),coalesce(nullif(v_row->>'account_type',''),'musteri'),v_code,'Potansiyel',nullif(v_row->>'vergi_no',''),nullif(v_row->>'tc_no',''),nullif(v_row->>'tax_office',''),nullif(v_row->>'city',''),nullif(v_row->>'district',''),nullif(v_row->>'address',''),nullif(v_row->>'phone',''),nullif(lower(v_row->>'email'),'')) RETURNING id INTO v_customer;
    INSERT INTO public.customer_audit_events(customer_id,event_type,reason,new_data,actor_id,actor_email)
    SELECT v_customer,'imported','Excel toplu aktarımı: '||v_batch,to_jsonb(c),auth.uid(),public.rex_crm_actor_email() FROM public.customers c WHERE c.id=v_customer;
    v_count:=v_count+1;
  END LOOP;
  RETURN jsonb_build_object('batch_id',v_batch,'row_count',v_count,'already_processed',false);
END;
$$;

CREATE OR REPLACE FUNCTION public.rex_crm_merge_customers(p_source uuid,p_target uuid,p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE r record; v_source public.customers%ROWTYPE;
BEGIN
  IF NOT public.rex_is_owner_admin() THEN RAISE EXCEPTION 'Cari birleştirmeyi yalnızca şirket sahibi yapabilir'; END IF;
  IF p_source=p_target OR length(trim(coalesce(p_reason,'')))<10 THEN RAISE EXCEPTION 'Kaynak, hedef ve en az 10 karakterli neden zorunludur'; END IF;
  SELECT * INTO v_source FROM public.customers WHERE id=p_source AND archived_at IS NULL FOR UPDATE;
  IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM public.customers WHERE id=p_target AND archived_at IS NULL) THEN RAISE EXCEPTION 'Aktif kaynak veya hedef cari bulunamadı'; END IF;
  FOR r IN SELECT n.nspname schema_name,c.relname table_name,a.attname column_name
    FROM pg_constraint fk JOIN pg_class c ON c.oid=fk.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace
    JOIN pg_attribute a ON a.attrelid=fk.conrelid AND a.attnum=fk.conkey[1]
    WHERE fk.contype='f' AND fk.confrelid='public.customers'::regclass AND array_length(fk.conkey,1)=1
      AND c.relname NOT IN ('customer_audit_events')
  LOOP EXECUTE format('UPDATE %I.%I SET %I=$1 WHERE %I=$2',r.schema_name,r.table_name,r.column_name,r.column_name) USING p_target,p_source; END LOOP;
  UPDATE public.customers SET archived_at=now(),archived_by=auth.uid(),archive_reason='Birleştirildi: '||trim(p_reason),status='Pasif',updated_at=now() WHERE id=p_source;
  INSERT INTO public.customer_audit_events(customer_id,event_type,reason,old_data,new_data,actor_id,actor_email)
  VALUES(p_source,'merged',trim(p_reason),to_jsonb(v_source),jsonb_build_object('merged_into',p_target),auth.uid(),public.rex_crm_actor_email());
END;
$$;

REVOKE ALL ON FUNCTION public.rex_crm_generate_notifications() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.rex_crm_record_email_event(text,text,text,timestamptz,jsonb) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.rex_crm_import_customers(text,text,jsonb) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.rex_crm_merge_customers(uuid,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rex_crm_import_customers(text,text,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_crm_merge_customers(uuid,uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_crm_generate_notifications() TO service_role;
GRANT EXECUTE ON FUNCTION public.rex_crm_record_email_event(text,text,text,timestamptz,jsonb) TO service_role;

COMMIT;
