BEGIN;

CREATE TABLE IF NOT EXISTS public.crm_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  automatic_assignment boolean NOT NULL DEFAULT true,
  response_sla_minutes integer NOT NULL DEFAULT 120 CHECK (response_sla_minutes BETWEEN 15 AND 10080),
  offer_follow_up_days integer NOT NULL DEFAULT 2 CHECK (offer_follow_up_days BETWEEN 1 AND 30),
  approval_threshold numeric(15,2) NOT NULL DEFAULT 100000 CHECK (approval_threshold >= 0),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.crm_settings(id) VALUES(true) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.crm_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES public.crm_opportunities(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  task_type text NOT NULL CHECK (task_type IN ('call','visit','email','quote','follow_up','review')),
  title text NOT NULL,
  due_at timestamptz NOT NULL,
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','cancelled')),
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','website_quote','activity','offer','system')),
  completed_at timestamptz,
  completed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_offer_versions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  offer_id uuid NOT NULL REFERENCES public.crm_offers(id) ON DELETE RESTRICT,
  version_no integer NOT NULL CHECK (version_no > 0),
  snapshot jsonb NOT NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(offer_id,version_no)
);

ALTER TABLE public.crm_offers
  ADD COLUMN IF NOT EXISTS version_no integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS recipient_email text,
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS approval_note text,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_status text NOT NULL DEFAULT 'not_sent',
  ADD COLUMN IF NOT EXISTS email_provider_id text,
  ADD COLUMN IF NOT EXISTS email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_error text;

ALTER TABLE public.crm_offers DROP CONSTRAINT IF EXISTS crm_offers_approval_status_check;
ALTER TABLE public.crm_offers ADD CONSTRAINT crm_offers_approval_status_check
  CHECK (approval_status IN ('not_required','pending','approved','rejected'));
ALTER TABLE public.crm_offers DROP CONSTRAINT IF EXISTS crm_offers_email_status_check;
ALTER TABLE public.crm_offers ADD CONSTRAINT crm_offers_email_status_check
  CHECK (email_status IN ('not_sent','sending','sent','failed'));

CREATE INDEX IF NOT EXISTS crm_tasks_due_idx ON public.crm_tasks(status,due_at,assigned_to);
CREATE INDEX IF NOT EXISTS crm_offer_versions_offer_idx ON public.crm_offer_versions(offer_id,version_no DESC);

ALTER TABLE public.crm_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_offer_versions ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.crm_settings TO authenticated;
GRANT SELECT,INSERT,UPDATE ON public.crm_tasks TO authenticated;
GRANT SELECT ON public.crm_offer_versions TO authenticated;
GRANT USAGE,SELECT ON SEQUENCE public.crm_offer_versions_id_seq TO authenticated;

DROP POLICY IF EXISTS rex_crm_settings_select ON public.crm_settings;
CREATE POLICY rex_crm_settings_select ON public.crm_settings FOR SELECT TO authenticated
  USING (public.rex_has_permission('crm.sales_pipeline','view'));
DROP POLICY IF EXISTS rex_crm_tasks_select ON public.crm_tasks;
CREATE POLICY rex_crm_tasks_select ON public.crm_tasks FOR SELECT TO authenticated
  USING (public.rex_has_permission('crm.sales_pipeline','view') OR public.rex_has_permission('reports.sales','view'));
DROP POLICY IF EXISTS rex_crm_tasks_write ON public.crm_tasks;
CREATE POLICY rex_crm_tasks_write ON public.crm_tasks FOR ALL TO authenticated
  USING (public.rex_has_permission('crm.sales_pipeline','manage'))
  WITH CHECK (public.rex_has_permission('crm.sales_pipeline','manage'));
DROP POLICY IF EXISTS rex_crm_offer_versions_select ON public.crm_offer_versions;
CREATE POLICY rex_crm_offer_versions_select ON public.crm_offer_versions FOR SELECT TO authenticated
  USING (public.rex_has_permission('crm.sales_pipeline','view') OR public.rex_has_permission('reports.sales','view'));

CREATE OR REPLACE FUNCTION public.rex_crm_record_opportunity_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  IF TG_OP='INSERT' THEN
    INSERT INTO public.crm_stage_events(opportunity_id,event_type,new_stage,details,actor_id,actor_email)
    VALUES(NEW.id,'created',NEW.stage,jsonb_build_object('source',NEW.source,'company_name',NEW.company_name),auth.uid(),public.rex_crm_actor_email());
  ELSE
    IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
      INSERT INTO public.crm_stage_events(opportunity_id,event_type,old_stage,new_stage,details,actor_id,actor_email)
      VALUES(NEW.id,'assigned',OLD.stage,NEW.stage,jsonb_build_object('old_assigned_to',OLD.assigned_to,'new_assigned_to',NEW.assigned_to),auth.uid(),public.rex_crm_actor_email());
    END IF;
    IF OLD.stage IS DISTINCT FROM NEW.stage THEN
      IF NEW.stage='lost' AND length(trim(coalesce(NEW.lost_reason,'')))<3 THEN
        RAISE EXCEPTION 'Kaybedilen satışlarda kayıp nedeni zorunludur';
      END IF;
      IF NEW.stage='won' AND (NEW.first_job_id IS NULL OR NEW.first_invoice_id IS NULL) THEN
        RAISE EXCEPTION 'Müşteri yalnızca ilk işi alınarak resmî faturası kesildikten sonra kazanılmış sayılır';
      END IF;
      INSERT INTO public.crm_stage_events(opportunity_id,event_type,old_stage,new_stage,details,actor_id,actor_email)
      VALUES(NEW.id,CASE WHEN NEW.stage='lost' THEN 'lost' ELSE 'stage_changed' END,OLD.stage,NEW.stage,
        jsonb_build_object('lost_reason',NEW.lost_reason),auth.uid(),public.rex_crm_actor_email());
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.rex_crm_opportunity_before_update()
RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    IF NEW.stage='lost' THEN NEW.lost_at:=coalesce(NEW.lost_at,now());
    ELSIF OLD.stage='lost' THEN NEW.lost_at:=NULL; NEW.lost_reason:=NULL;
    END IF;
  END IF;
  NEW.updated_at:=now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS rex_crm_opportunity_before_update ON public.crm_opportunities;
CREATE TRIGGER rex_crm_opportunity_before_update BEFORE UPDATE ON public.crm_opportunities
FOR EACH ROW EXECUTE FUNCTION public.rex_crm_opportunity_before_update();

-- Assignment favors active sales representatives with the fewest open records.
CREATE OR REPLACE FUNCTION public.rex_crm_assign_and_schedule()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_assignee uuid; v_due timestamptz; v_sla integer; v_auto boolean;
BEGIN
  SELECT automatic_assignment,response_sla_minutes INTO v_auto,v_sla FROM public.crm_settings WHERE id=true;
  v_due:=coalesce(NEW.next_action_at,now()+make_interval(mins=>coalesce(v_sla,120)));
  v_assignee:=NEW.assigned_to;
  IF v_assignee IS NULL AND coalesce(v_auto,true) THEN
    SELECT r.user_id INTO v_assignee
    FROM public.app_user_roles r
    LEFT JOIN LATERAL (
      SELECT count(*) open_count FROM public.crm_opportunities o
      WHERE o.assigned_to=r.user_id AND o.stage NOT IN ('won','lost')
    ) workload ON true
    WHERE r.active=true AND (
      r.role='sales' OR (r.role='admin' AND lower(r.email)='info@rexlojistik.com') OR EXISTS(
        SELECT 1 FROM public.staff_permission_overrides p
        WHERE p.user_id=r.user_id AND p.permission_key='crm.sales_pipeline' AND p.access_level='manage'
      )
    )
    ORDER BY CASE WHEN r.role='sales' THEN 0 ELSE 1 END,workload.open_count,r.updated_at NULLS FIRST
    LIMIT 1;
  END IF;
  IF v_assignee IS NOT NULL AND NEW.assigned_to IS NULL THEN
    UPDATE public.crm_opportunities SET assigned_to=v_assignee,updated_at=now() WHERE id=NEW.id;
  END IF;
  INSERT INTO public.crm_tasks(opportunity_id,customer_id,assigned_to,task_type,title,due_at,priority,source,created_by)
  VALUES(NEW.id,NEW.customer_id,v_assignee,CASE WHEN NEW.stage='quote_required' THEN 'quote' ELSE 'call' END,
    CASE WHEN NEW.stage='quote_required' THEN NEW.company_name||' için teklif hazırla' ELSE NEW.company_name||' ile ilk görüşmeyi yap' END,
    v_due,CASE WHEN NEW.source='website' THEN 'high' ELSE 'normal' END,
    CASE WHEN NEW.source='website' THEN 'website_quote' ELSE 'system' END,NEW.created_by);
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS rex_crm_assign_and_schedule ON public.crm_opportunities;
CREATE TRIGGER rex_crm_assign_and_schedule AFTER INSERT ON public.crm_opportunities
FOR EACH ROW EXECUTE FUNCTION public.rex_crm_assign_and_schedule();

CREATE OR REPLACE FUNCTION public.rex_crm_activity_after_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_stage text; v_assignee uuid;
BEGIN
  SELECT stage,assigned_to INTO v_stage,v_assignee FROM public.crm_opportunities WHERE id=NEW.opportunity_id FOR UPDATE;
  UPDATE public.crm_opportunities SET
    next_action_at=coalesce(NEW.next_action_at,next_action_at),
    stage=CASE
      WHEN NEW.outcome='quote_requested' AND stage NOT IN ('won','lost') THEN 'quote_required'
      WHEN NEW.outcome='quote_sent' AND stage NOT IN ('won','lost') THEN 'follow_up'
      ELSE stage END,
    updated_at=now()
  WHERE id=NEW.opportunity_id;
  UPDATE public.customers SET last_contact=NEW.activity_at::date,updated_at=now() WHERE id=NEW.customer_id;
  IF NEW.next_action_at IS NOT NULL THEN
    INSERT INTO public.crm_tasks(opportunity_id,customer_id,assigned_to,task_type,title,due_at,priority,source,created_by)
    SELECT NEW.opportunity_id,NEW.customer_id,coalesce(v_assignee,NEW.created_by),
      CASE WHEN NEW.outcome='quote_requested' THEN 'quote' ELSE 'follow_up' END,
      CASE WHEN NEW.outcome='quote_requested' THEN o.company_name||' için teklif hazırla' ELSE o.company_name||' takibini yap' END,
      NEW.next_action_at,'normal','activity',NEW.created_by FROM public.crm_opportunities o WHERE o.id=NEW.opportunity_id;
  END IF;
  INSERT INTO public.crm_stage_events(opportunity_id,event_type,old_stage,new_stage,details,actor_id,actor_email)
  SELECT NEW.opportunity_id,'activity_added',v_stage,o.stage,
    jsonb_build_object('activity_id',NEW.id,'activity_type',NEW.activity_type,'outcome',NEW.outcome,'summary',NEW.summary),
    NEW.created_by,public.rex_crm_actor_email() FROM public.crm_opportunities o WHERE o.id=NEW.opportunity_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.rex_crm_offer_before_write()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_sequence integer; v_threshold numeric;
BEGIN
  IF TG_OP='INSERT' THEN
    IF nullif(trim(NEW.offer_no),'') IS NULL THEN
      PERFORM pg_advisory_xact_lock(hashtext('rex_crm_offer_no'));
      SELECT coalesce(max((regexp_match(offer_no,'^TKL-[0-9]{4}-(\d+)$'))[1]::integer),0)+1 INTO v_sequence
      FROM public.crm_offers WHERE offer_no LIKE 'TKL-'||to_char(current_date,'YYYY')||'-%';
      NEW.offer_no:='TKL-'||to_char(current_date,'YYYY')||'-'||lpad(v_sequence::text,5,'0');
    END IF;
    SELECT approval_threshold INTO v_threshold FROM public.crm_settings WHERE id=true;
    NEW.approval_status:=CASE WHEN NEW.amount>=coalesce(v_threshold,100000) THEN 'pending' ELSE 'not_required' END;
    NEW.version_no:=1;
  ELSE
    IF ROW(OLD.subject,OLD.amount,OLD.currency,OLD.valid_until,OLD.notes)
       IS DISTINCT FROM ROW(NEW.subject,NEW.amount,NEW.currency,NEW.valid_until,NEW.notes) THEN
      IF OLD.status='sent' THEN RAISE EXCEPTION 'Gönderilmiş teklif doğrudan değiştirilemez; yeni teklif oluşturun'; END IF;
      NEW.version_no:=OLD.version_no+1;
      SELECT approval_threshold INTO v_threshold FROM public.crm_settings WHERE id=true;
      NEW.approval_status:=CASE WHEN NEW.amount>=coalesce(v_threshold,100000) THEN 'pending' ELSE 'not_required' END;
      NEW.approved_by:=NULL; NEW.approved_at:=NULL; NEW.approval_note:=NULL;
    END IF;
  END IF;
  IF NEW.status='sent' AND NEW.approval_status NOT IN ('not_required','approved') THEN
    RAISE EXCEPTION 'Yönetici onayı tamamlanmadan teklif gönderilemez';
  END IF;
  IF NEW.status='sent' AND (TG_OP='INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN NEW.sent_at:=coalesce(NEW.sent_at,now()); END IF;
  NEW.updated_at:=now(); RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.rex_crm_offer_version_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  INSERT INTO public.crm_offer_versions(offer_id,version_no,snapshot,actor_id,actor_email)
  VALUES(NEW.id,NEW.version_no,jsonb_build_object(
    'offer_no',NEW.offer_no,'subject',NEW.subject,'amount',NEW.amount,'currency',NEW.currency,
    'valid_until',NEW.valid_until,'notes',NEW.notes,'status',NEW.status,'approval_status',NEW.approval_status
  ),auth.uid(),public.rex_crm_actor_email()) ON CONFLICT (offer_id,version_no) DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS rex_crm_offer_version_event ON public.crm_offers;
CREATE TRIGGER rex_crm_offer_version_event AFTER INSERT OR UPDATE OF subject,amount,currency,valid_until,notes ON public.crm_offers
FOR EACH ROW EXECUTE FUNCTION public.rex_crm_offer_version_event();

CREATE OR REPLACE FUNCTION public.rex_crm_offer_after_write()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_old_stage text; v_days integer; v_assignee uuid;
BEGIN
  SELECT stage,assigned_to INTO v_old_stage,v_assignee FROM public.crm_opportunities WHERE id=NEW.opportunity_id FOR UPDATE;
  UPDATE public.crm_opportunities SET estimated_value=NEW.amount,currency=NEW.currency,
    stage=CASE WHEN NEW.status='sent' AND stage NOT IN ('won','lost') THEN 'follow_up' ELSE stage END,updated_at=now()
  WHERE id=NEW.opportunity_id;
  IF NEW.status='sent' AND (TG_OP='INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
    SELECT offer_follow_up_days INTO v_days FROM public.crm_settings WHERE id=true;
    INSERT INTO public.crm_tasks(opportunity_id,customer_id,assigned_to,task_type,title,due_at,priority,source,created_by)
    SELECT NEW.opportunity_id,NEW.customer_id,coalesce(v_assignee,NEW.created_by),'follow_up',o.company_name||' teklifini takip et',
      now()+make_interval(days=>coalesce(v_days,2)),'high','offer',NEW.created_by FROM public.crm_opportunities o WHERE o.id=NEW.opportunity_id;
  END IF;
  INSERT INTO public.crm_stage_events(opportunity_id,event_type,old_stage,new_stage,details,actor_id,actor_email)
  SELECT NEW.opportunity_id,CASE WHEN NEW.status='sent' THEN 'offer_sent' ELSE 'offer_created' END,v_old_stage,o.stage,
    jsonb_build_object('offer_id',NEW.id,'offer_no',NEW.offer_no,'amount',NEW.amount,'currency',NEW.currency,
      'status',NEW.status,'version_no',NEW.version_no,'approval_status',NEW.approval_status),
    NEW.created_by,public.rex_crm_actor_email() FROM public.crm_opportunities o WHERE o.id=NEW.opportunity_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.rex_crm_quote_to_opportunity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_customer uuid;
BEGIN
  SELECT c.id INTO v_customer FROM public.customers c
  WHERE coalesce(c.account_type,'musteri')='musteri' AND (
    (NEW.email IS NOT NULL AND lower(c.email)=lower(NEW.email)) OR
    (NEW.phone IS NOT NULL AND regexp_replace(coalesce(c.phone,''),'\D','','g')=regexp_replace(NEW.phone,'\D','','g'))
  ) ORDER BY c.created_at LIMIT 1;
  INSERT INTO public.crm_opportunities(customer_id,quote_request_id,company_name,contact_name,email,phone,source,stage,next_action_at,notes)
  VALUES(v_customer,NEW.id,NEW.company_name,NEW.full_name,NEW.email,NEW.phone,'website','quote_required',
    now()+interval '1 day',concat_ws(' | ',
      CASE NEW.service_type WHEN 'domestic' THEN 'Yurtiçi' ELSE 'Uluslararası' END,
      CASE NEW.transport_mode WHEN 'road' THEN 'Karayolu' WHEN 'air' THEN 'Havayolu' ELSE 'Denizyolu' END,
      NEW.loading_point||' → '||NEW.delivery_point,NEW.special_requirements))
  ON CONFLICT (quote_request_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.rex_crm_complete_task(p_task_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  IF NOT public.rex_has_permission('crm.sales_pipeline','manage') THEN RAISE EXCEPTION 'CRM görev yönetimi yetkiniz bulunmuyor'; END IF;
  UPDATE public.crm_tasks SET status='completed',completed_at=now(),completed_by=auth.uid(),updated_at=now()
  WHERE id=p_task_id AND status='pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'Açık görev bulunamadı'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.rex_crm_review_offer(p_offer_id uuid,p_decision text,p_note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  IF NOT public.rex_is_owner_admin() THEN RAISE EXCEPTION 'Yüksek tutarlı teklifleri yalnızca şirket sahibi onaylayabilir'; END IF;
  IF p_decision NOT IN ('approve','reject') THEN RAISE EXCEPTION 'Geçersiz onay kararı'; END IF;
  IF p_decision='reject' AND length(trim(coalesce(p_note,'')))<3 THEN RAISE EXCEPTION 'Ret açıklaması zorunludur'; END IF;
  UPDATE public.crm_offers SET approval_status=CASE WHEN p_decision='approve' THEN 'approved' ELSE 'rejected' END,
    approval_note=nullif(trim(p_note),''),approved_by=auth.uid(),approved_at=now(),updated_at=now()
  WHERE id=p_offer_id AND approval_status='pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'Onay bekleyen teklif bulunamadı'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.rex_crm_duplicate_candidates(p_company_name text,p_email text DEFAULT NULL,p_phone text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_result jsonb;
BEGIN
  IF NOT public.rex_has_permission('crm.sales_pipeline','view') THEN RAISE EXCEPTION 'CRM görüntüleme yetkiniz bulunmuyor'; END IF;
  SELECT coalesce(jsonb_agg(row_to_json(x)),'[]'::jsonb) INTO v_result FROM (
    SELECT 'customer' record_type,c.id,c.name company_name,c.email,c.phone,c.status
    FROM public.customers c WHERE coalesce(c.account_type,'musteri')='musteri' AND (
      (nullif(trim(p_email),'') IS NOT NULL AND lower(c.email)=lower(trim(p_email))) OR
      (nullif(regexp_replace(coalesce(p_phone,''),'\D','','g'),'') IS NOT NULL AND regexp_replace(coalesce(c.phone,''),'\D','','g')=regexp_replace(p_phone,'\D','','g')) OR
      lower(trim(c.name))=lower(trim(p_company_name))
    )
    UNION ALL
    SELECT 'opportunity',o.id,o.company_name,o.email,o.phone,o.stage FROM public.crm_opportunities o WHERE (
      (nullif(trim(p_email),'') IS NOT NULL AND lower(o.email)=lower(trim(p_email))) OR
      (nullif(regexp_replace(coalesce(p_phone,''),'\D','','g'),'') IS NOT NULL AND regexp_replace(coalesce(o.phone,''),'\D','','g')=regexp_replace(p_phone,'\D','','g')) OR
      lower(trim(o.company_name))=lower(trim(p_company_name))
    ) LIMIT 20
  ) x;
  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.rex_crm_convert_to_customer(p_opportunity_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_opp public.crm_opportunities%ROWTYPE; v_customer uuid; v_code text; v_sequence integer;
BEGIN
  IF NOT public.rex_has_permission('crm.sales_pipeline','manage') OR NOT public.rex_has_permission('crm.customers','manage') THEN
    RAISE EXCEPTION 'CRM ve cari oluşturma yetkisi gereklidir';
  END IF;
  SELECT * INTO v_opp FROM public.crm_opportunities WHERE id=p_opportunity_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Satış kaydı bulunamadı'; END IF;
  IF v_opp.customer_id IS NOT NULL THEN RETURN v_opp.customer_id; END IF;
  SELECT c.id INTO v_customer FROM public.customers c WHERE coalesce(c.account_type,'musteri')='musteri' AND (
    (v_opp.email IS NOT NULL AND lower(c.email)=lower(v_opp.email)) OR
    (v_opp.phone IS NOT NULL AND regexp_replace(coalesce(c.phone,''),'\D','','g')=regexp_replace(v_opp.phone,'\D','','g'))
  ) ORDER BY c.created_at LIMIT 1;
  IF v_customer IS NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext('rex_customer_code_CST'));
    SELECT coalesce(max((regexp_match(customer_code,'^CST-(\d+)$'))[1]::integer),0)+1 INTO v_sequence FROM public.customers WHERE customer_code LIKE 'CST-%';
    v_code:='CST-'||lpad(v_sequence::text,6,'0');
    INSERT INTO public.customers(name,company,phone,email,status,notes,account_type,customer_code)
    VALUES(v_opp.company_name,v_opp.company_name,v_opp.phone,v_opp.email,'Potansiyel',v_opp.notes,'musteri',v_code) RETURNING id INTO v_customer;
  ELSE
    SELECT customer_code INTO v_code FROM public.customers WHERE id=v_customer;
  END IF;
  UPDATE public.crm_opportunities SET customer_id=v_customer,updated_at=now() WHERE id=v_opp.id;
  UPDATE public.crm_tasks SET customer_id=v_customer,updated_at=now() WHERE opportunity_id=v_opp.id;
  INSERT INTO public.crm_stage_events(opportunity_id,event_type,old_stage,new_stage,details,actor_id,actor_email)
  VALUES(v_opp.id,'customer_created',v_opp.stage,v_opp.stage,jsonb_build_object('customer_id',v_customer,'customer_code',v_code),auth.uid(),public.rex_crm_actor_email());
  RETURN v_customer;
END;
$$;

CREATE OR REPLACE FUNCTION public.rex_crm_customer_360(p_customer_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_result jsonb;
BEGIN
  IF NOT public.rex_has_permission('crm.sales_pipeline','view') AND NOT public.rex_has_permission('crm.customers','view') THEN
    RAISE EXCEPTION 'Müşteri görünümü yetkiniz bulunmuyor';
  END IF;
  SELECT jsonb_build_object(
    'customer',to_jsonb(c),
    'opportunity_count',(SELECT count(*) FROM public.crm_opportunities o WHERE o.customer_id=c.id),
    'activity_count',(SELECT count(*) FROM public.crm_activities a WHERE a.customer_id=c.id),
    'offer_count',(SELECT count(*) FROM public.crm_offers o WHERE o.customer_id=c.id),
    'offer_total',(SELECT coalesce(sum(o.amount),0) FROM public.crm_offers o WHERE o.customer_id=c.id AND o.status IN ('sent','accepted')),
    'job_count',(SELECT count(*) FROM public.transport_jobs j WHERE j.customer_id=c.id),
    'shipment_count',(SELECT count(*) FROM public.shipments s WHERE s.customer_id=c.id),
    'delivered_count',(SELECT count(*) FROM public.shipments s WHERE s.customer_id=c.id AND s.status IN ('teslim_edildi','Teslim Edildi')),
    'invoice_count',(SELECT count(*) FROM public.sales_invoices i WHERE i.customer_id=c.id AND i.integration_status NOT IN ('cancelled','refund_created')),
    'invoiced_total',(SELECT coalesce(sum(i.grand_total),0) FROM public.sales_invoices i WHERE i.customer_id=c.id AND i.integration_status='official'),
    'outstanding_total',(SELECT coalesce(sum(i.grand_total),0) FROM public.sales_invoices i WHERE i.customer_id=c.id AND i.integration_status='official' AND i.payment_status IN ('Bekliyor','Gecikmiş','Kısmi Ödendi')),
    'exception_count',(SELECT count(*) FROM public.shipment_exceptions e JOIN public.shipments s ON s.id=e.shipment_id WHERE s.customer_id=c.id),
    'last_activity',(SELECT max(a.activity_at) FROM public.crm_activities a WHERE a.customer_id=c.id),
    'last_shipment',(SELECT max(s.created_at) FROM public.shipments s WHERE s.customer_id=c.id),
    'recent_jobs',(SELECT coalesce(jsonb_agg(row_to_json(j)),'[]'::jsonb) FROM (SELECT job_code,status,job_date,sales_total,currency FROM public.transport_jobs WHERE customer_id=c.id ORDER BY created_at DESC LIMIT 5) j),
    'recent_invoices',(SELECT coalesce(jsonb_agg(row_to_json(i)),'[]'::jsonb) FROM (SELECT invoice_no,invoice_date,grand_total,currency,payment_status,integration_status FROM public.sales_invoices WHERE customer_id=c.id ORDER BY created_at DESC LIMIT 5) i)
  ) INTO v_result FROM public.customers c WHERE c.id=p_customer_id;
  RETURN coalesce(v_result,'{}'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.rex_crm_offer_versions_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN RAISE EXCEPTION 'Teklif sürüm geçmişi değiştirilemez veya silinemez'; END;
$$;
DROP TRIGGER IF EXISTS rex_crm_offer_versions_immutable ON public.crm_offer_versions;
CREATE TRIGGER rex_crm_offer_versions_immutable BEFORE UPDATE OR DELETE ON public.crm_offer_versions
FOR EACH ROW EXECUTE FUNCTION public.rex_crm_offer_versions_immutable();

-- Backfill assignment/tasks for records created before automation was enabled.
DO $$ DECLARE r record; v_assignee uuid;
BEGIN
  FOR r IN SELECT * FROM public.crm_opportunities o WHERE o.stage NOT IN ('won','lost') LOOP
    v_assignee:=r.assigned_to;
    IF v_assignee IS NULL THEN
      SELECT a.user_id INTO v_assignee FROM public.app_user_roles a WHERE a.active=true AND a.role IN ('sales','admin')
      ORDER BY CASE WHEN a.role='sales' THEN 0 ELSE 1 END,a.updated_at NULLS FIRST LIMIT 1;
      UPDATE public.crm_opportunities SET assigned_to=v_assignee,updated_at=now() WHERE id=r.id;
    END IF;
    IF NOT EXISTS(SELECT 1 FROM public.crm_tasks t WHERE t.opportunity_id=r.id AND t.status='pending') THEN
      INSERT INTO public.crm_tasks(opportunity_id,customer_id,assigned_to,task_type,title,due_at,priority,source,created_by)
      VALUES(r.id,r.customer_id,v_assignee,CASE WHEN r.stage='quote_required' THEN 'quote' ELSE 'call' END,
        CASE WHEN r.stage='quote_required' THEN r.company_name||' için teklif hazırla' ELSE r.company_name||' ile görüş' END,
        coalesce(r.next_action_at,now()),CASE WHEN r.source='website' THEN 'high' ELSE 'normal' END,'system',r.created_by);
    END IF;
  END LOOP;
END $$;

REVOKE ALL ON FUNCTION public.rex_crm_complete_task(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.rex_crm_review_offer(uuid,text,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.rex_crm_duplicate_candidates(text,text,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.rex_crm_customer_360(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rex_crm_complete_task(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_crm_review_offer(uuid,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_crm_duplicate_candidates(text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_crm_customer_360(uuid) TO authenticated;

COMMIT;
