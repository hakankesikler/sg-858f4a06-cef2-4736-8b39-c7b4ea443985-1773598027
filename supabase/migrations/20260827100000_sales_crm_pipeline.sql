BEGIN;

-- Sales users receive pipeline permissions by default; the owner can still
-- override this permission per employee from the existing access screen.
ALTER TABLE public.staff_permission_overrides
  DROP CONSTRAINT IF EXISTS staff_permission_overrides_permission_key_check;
ALTER TABLE public.staff_permission_overrides
  ADD CONSTRAINT staff_permission_overrides_permission_key_check CHECK (permission_key IN (
    'crm.customers','crm.portal_invites','crm.sales_pipeline','sales.work_orders',
    'operations.shipments','operations.assignments','operations.delivery',
    'operations.exceptions','operations.uetds','accounting.sales',
    'accounting.purchase','accounting.accounts','accounting.expenses',
    'reports.sales','reports.operations','reports.accounting','analytics.web',
    'integrations.connections','integrations.imports','integrations.monitoring'
  ));

CREATE OR REPLACE FUNCTION public.rex_base_permission_level(p_role text, p_key text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_role = 'admin' THEN 'manage'
    WHEN p_role = 'sales' AND p_key IN ('crm.customers','crm.portal_invites','crm.sales_pipeline','sales.work_orders') THEN 'manage'
    WHEN p_role = 'sales' AND p_key IN ('reports.sales','integrations.monitoring') THEN 'view'
    WHEN p_role = 'operations' AND p_key IN (
      'sales.work_orders','operations.shipments','operations.assignments',
      'operations.delivery','operations.exceptions','operations.uetds','integrations.imports'
    ) THEN 'manage'
    WHEN p_role = 'operations' AND p_key IN ('crm.customers','reports.operations','analytics.web','integrations.monitoring') THEN 'view'
    WHEN p_role = 'accounting' AND p_key IN (
      'accounting.sales','accounting.purchase','accounting.accounts','accounting.expenses'
    ) THEN 'manage'
    WHEN p_role = 'accounting' AND p_key IN ('crm.customers','reports.accounting','integrations.monitoring') THEN 'view'
    ELSE 'none'
  END;
$$;

CREATE TABLE IF NOT EXISTS public.crm_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  quote_request_id uuid UNIQUE REFERENCES public.quote_requests(id) ON DELETE RESTRICT,
  company_name text NOT NULL,
  contact_name text,
  email text,
  phone text,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','website','referral','existing_customer','integration')),
  stage text NOT NULL DEFAULT 'introduction' CHECK (stage IN ('introduction','quote_required','follow_up','won','lost')),
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  next_action_at timestamptz,
  estimated_value numeric(15,2) CHECK (estimated_value IS NULL OR estimated_value >= 0),
  currency text NOT NULL DEFAULT 'TRY' CHECK (currency IN ('TRY','USD','EUR','GBP')),
  notes text,
  first_job_id uuid REFERENCES public.transport_jobs(id) ON DELETE SET NULL,
  first_invoice_id uuid REFERENCES public.sales_invoices(id) ON DELETE SET NULL,
  won_at timestamptz,
  lost_at timestamptz,
  lost_reason text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES public.crm_opportunities(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  activity_type text NOT NULL CHECK (activity_type IN ('call','visit','email','meeting','note')),
  outcome text NOT NULL CHECK (outcome IN (
    'reached','not_reached','introduction_completed','positive','negative',
    'follow_up','quote_requested','quote_sent','no_interest','other'
  )),
  summary text NOT NULL CHECK (length(trim(summary)) >= 3),
  activity_at timestamptz NOT NULL DEFAULT now(),
  next_action_at timestamptz,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_no text NOT NULL UNIQUE,
  opportunity_id uuid NOT NULL REFERENCES public.crm_opportunities(id) ON DELETE RESTRICT,
  quote_request_id uuid REFERENCES public.quote_requests(id) ON DELETE RESTRICT,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  subject text NOT NULL,
  amount numeric(15,2) NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'TRY' CHECK (currency IN ('TRY','USD','EUR','GBP')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','accepted','rejected','expired','cancelled')),
  valid_until date,
  sent_at timestamptz,
  notes text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_stage_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  opportunity_id uuid NOT NULL REFERENCES public.crm_opportunities(id) ON DELETE RESTRICT,
  event_type text NOT NULL CHECK (event_type IN (
    'created','assigned','stage_changed','activity_added','offer_created','offer_sent',
    'customer_created','job_created','won_automatically','lost'
  )),
  old_stage text,
  new_stage text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS crm_opportunities_stage_idx ON public.crm_opportunities(stage, next_action_at, created_at DESC);
CREATE INDEX IF NOT EXISTS crm_opportunities_assignee_idx ON public.crm_opportunities(assigned_to, stage);
CREATE INDEX IF NOT EXISTS crm_activities_daily_idx ON public.crm_activities(created_by, activity_at DESC);
CREATE INDEX IF NOT EXISTS crm_activities_opportunity_idx ON public.crm_activities(opportunity_id, activity_at DESC);
CREATE INDEX IF NOT EXISTS crm_offers_opportunity_idx ON public.crm_offers(opportunity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS crm_stage_events_opportunity_idx ON public.crm_stage_events(opportunity_id, created_at DESC);

ALTER TABLE public.crm_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_stage_events ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.crm_opportunities TO authenticated;
GRANT SELECT, INSERT ON public.crm_activities TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.crm_offers TO authenticated;
GRANT SELECT ON public.crm_stage_events TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.crm_stage_events_id_seq TO authenticated;

CREATE POLICY rex_crm_opportunities_select ON public.crm_opportunities FOR SELECT TO authenticated
  USING (public.rex_has_permission('crm.sales_pipeline','view') OR public.rex_has_permission('reports.sales','view'));
CREATE POLICY rex_crm_opportunities_write ON public.crm_opportunities FOR ALL TO authenticated
  USING (public.rex_has_permission('crm.sales_pipeline','manage'))
  WITH CHECK (public.rex_has_permission('crm.sales_pipeline','manage'));
CREATE POLICY rex_crm_activities_select ON public.crm_activities FOR SELECT TO authenticated
  USING (public.rex_has_permission('crm.sales_pipeline','view') OR public.rex_has_permission('reports.sales','view'));
CREATE POLICY rex_crm_activities_insert ON public.crm_activities FOR INSERT TO authenticated
  WITH CHECK (public.rex_has_permission('crm.sales_pipeline','manage') AND created_by=auth.uid());
CREATE POLICY rex_crm_offers_select ON public.crm_offers FOR SELECT TO authenticated
  USING (public.rex_has_permission('crm.sales_pipeline','view') OR public.rex_has_permission('reports.sales','view'));
CREATE POLICY rex_crm_offers_write ON public.crm_offers FOR ALL TO authenticated
  USING (public.rex_has_permission('crm.sales_pipeline','manage'))
  WITH CHECK (public.rex_has_permission('crm.sales_pipeline','manage'));
CREATE POLICY rex_crm_stage_events_select ON public.crm_stage_events FOR SELECT TO authenticated
  USING (public.rex_has_permission('crm.sales_pipeline','view') OR public.rex_has_permission('reports.sales','view'));

CREATE OR REPLACE FUNCTION public.rex_crm_actor_email()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
  SELECT coalesce(auth.jwt()->>'email','system');
$$;

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

DROP TRIGGER IF EXISTS rex_crm_opportunity_event ON public.crm_opportunities;
CREATE TRIGGER rex_crm_opportunity_event
AFTER INSERT OR UPDATE OF stage,assigned_to ON public.crm_opportunities
FOR EACH ROW EXECUTE FUNCTION public.rex_crm_record_opportunity_event();

CREATE OR REPLACE FUNCTION public.rex_crm_activity_after_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_stage text;
BEGIN
  SELECT stage INTO v_stage FROM public.crm_opportunities WHERE id=NEW.opportunity_id FOR UPDATE;
  UPDATE public.crm_opportunities SET
    next_action_at=coalesce(NEW.next_action_at,next_action_at),
    stage=CASE
      WHEN NEW.outcome='quote_requested' AND stage NOT IN ('won','lost') THEN 'quote_required'
      WHEN NEW.outcome='quote_sent' AND stage NOT IN ('won','lost') THEN 'follow_up'
      ELSE stage END,
    updated_at=now()
  WHERE id=NEW.opportunity_id;
  UPDATE public.customers SET last_contact=NEW.activity_at::date, updated_at=now()
  WHERE id=NEW.customer_id;
  INSERT INTO public.crm_stage_events(opportunity_id,event_type,old_stage,new_stage,details,actor_id,actor_email)
  SELECT NEW.opportunity_id,'activity_added',v_stage,o.stage,
    jsonb_build_object('activity_id',NEW.id,'activity_type',NEW.activity_type,'outcome',NEW.outcome,'summary',NEW.summary),
    NEW.created_by,public.rex_crm_actor_email()
  FROM public.crm_opportunities o WHERE o.id=NEW.opportunity_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rex_crm_activity_after_insert ON public.crm_activities;
CREATE TRIGGER rex_crm_activity_after_insert AFTER INSERT ON public.crm_activities
FOR EACH ROW EXECUTE FUNCTION public.rex_crm_activity_after_insert();

CREATE OR REPLACE FUNCTION public.rex_crm_offer_before_write()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_sequence integer; v_old_stage text;
BEGIN
  IF TG_OP='INSERT' AND nullif(trim(NEW.offer_no),'') IS NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext('rex_crm_offer_no'));
    SELECT coalesce(max((regexp_match(offer_no,'^TKL-[0-9]{4}-(\d+)$'))[1]::integer),0)+1 INTO v_sequence
    FROM public.crm_offers WHERE offer_no LIKE 'TKL-'||to_char(current_date,'YYYY')||'-%';
    NEW.offer_no := 'TKL-'||to_char(current_date,'YYYY')||'-'||lpad(v_sequence::text,5,'0');
  END IF;
  IF NEW.status='sent' AND (TG_OP='INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN NEW.sent_at:=coalesce(NEW.sent_at,now()); END IF;
  NEW.updated_at:=now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.rex_crm_offer_after_write()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_old_stage text;
BEGIN
  SELECT stage INTO v_old_stage FROM public.crm_opportunities WHERE id=NEW.opportunity_id FOR UPDATE;
  UPDATE public.crm_opportunities SET
    estimated_value=NEW.amount,currency=NEW.currency,
    stage=CASE WHEN NEW.status='sent' AND stage NOT IN ('won','lost') THEN 'follow_up' ELSE stage END,
    updated_at=now()
  WHERE id=NEW.opportunity_id;
  INSERT INTO public.crm_stage_events(opportunity_id,event_type,old_stage,new_stage,details,actor_id,actor_email)
  SELECT NEW.opportunity_id,CASE WHEN NEW.status='sent' THEN 'offer_sent' ELSE 'offer_created' END,v_old_stage,o.stage,
    jsonb_build_object('offer_id',NEW.id,'offer_no',NEW.offer_no,'amount',NEW.amount,'currency',NEW.currency,'status',NEW.status),
    NEW.created_by,public.rex_crm_actor_email()
  FROM public.crm_opportunities o WHERE o.id=NEW.opportunity_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rex_crm_offer_before_write ON public.crm_offers;
CREATE TRIGGER rex_crm_offer_before_write BEFORE INSERT OR UPDATE ON public.crm_offers
FOR EACH ROW EXECUTE FUNCTION public.rex_crm_offer_before_write();
DROP TRIGGER IF EXISTS rex_crm_offer_after_write ON public.crm_offers;
CREATE TRIGGER rex_crm_offer_after_write AFTER INSERT OR UPDATE OF status ON public.crm_offers
FOR EACH ROW EXECUTE FUNCTION public.rex_crm_offer_after_write();

CREATE OR REPLACE FUNCTION public.rex_crm_quote_to_opportunity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  INSERT INTO public.crm_opportunities(
    quote_request_id,company_name,contact_name,email,phone,source,stage,next_action_at,notes
  ) VALUES(
    NEW.id,NEW.company_name,NEW.full_name,NEW.email,NEW.phone,'website','quote_required',
    now()+interval '1 day',
    concat_ws(' | ',
      CASE NEW.service_type WHEN 'domestic' THEN 'Yurtiçi' ELSE 'Uluslararası' END,
      CASE NEW.transport_mode WHEN 'road' THEN 'Karayolu' WHEN 'air' THEN 'Havayolu' ELSE 'Denizyolu' END,
      NEW.loading_point||' → '||NEW.delivery_point,
      NEW.special_requirements
    )
  ) ON CONFLICT (quote_request_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rex_crm_quote_to_opportunity ON public.quote_requests;
CREATE TRIGGER rex_crm_quote_to_opportunity AFTER INSERT ON public.quote_requests
FOR EACH ROW EXECUTE FUNCTION public.rex_crm_quote_to_opportunity();

-- Backfill prior web requests without duplicating them.
INSERT INTO public.crm_opportunities(quote_request_id,company_name,contact_name,email,phone,source,stage,next_action_at,notes,created_at)
SELECT q.id,q.company_name,q.full_name,q.email,q.phone,'website','quote_required',now(),
  concat_ws(' | ',q.loading_point||' → '||q.delivery_point,q.special_requirements),q.created_at
FROM public.quote_requests q
ON CONFLICT (quote_request_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.rex_crm_quote_detail(p_quote_request_id uuid)
RETURNS TABLE(
  id uuid, submission_id uuid, full_name text, company_name text, email text, phone text,
  service_type text, transport_mode text, transport_detail text, loading_point text,
  delivery_point text, cargos jsonb, special_requirements text, commercial_consent boolean,
  created_at timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  IF NOT public.rex_has_permission('crm.sales_pipeline','view') THEN RAISE EXCEPTION 'CRM görüntüleme yetkiniz bulunmuyor'; END IF;
  RETURN QUERY SELECT q.id,q.submission_id,q.full_name,q.company_name,q.email,q.phone,
    q.service_type,q.transport_mode,q.transport_detail,q.loading_point,q.delivery_point,
    q.cargos,q.special_requirements,q.commercial_consent,q.created_at
  FROM public.quote_requests q WHERE q.id=p_quote_request_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.rex_crm_sales_representatives()
RETURNS TABLE(user_id uuid,email text,full_name text,role text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  IF NOT public.rex_has_permission('crm.sales_pipeline','view') THEN RAISE EXCEPTION 'CRM görüntüleme yetkiniz bulunmuyor'; END IF;
  RETURN QUERY SELECT r.user_id,r.email,coalesce(p.full_name,r.email),r.role
  FROM public.app_user_roles r LEFT JOIN public.profiles p ON p.id=r.user_id
  WHERE r.active=true AND (r.role IN ('admin','sales') OR EXISTS(
    SELECT 1 FROM public.staff_permission_overrides o
    WHERE o.user_id=r.user_id AND o.permission_key='crm.sales_pipeline' AND o.access_level='manage'
  )) ORDER BY coalesce(p.full_name,r.email);
END;
$$;

CREATE OR REPLACE FUNCTION public.rex_crm_performance(p_from date DEFAULT current_date,p_to date DEFAULT current_date)
RETURNS TABLE(
  user_id uuid,email text,full_name text,calls bigint,visits bigint,emails bigint,
  customer_meetings bigint,introductions bigint,quotes_sent bigint,won bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  IF NOT public.rex_has_permission('crm.sales_pipeline','view') AND NOT public.rex_has_permission('reports.sales','view') THEN
    RAISE EXCEPTION 'Satış performansı görüntüleme yetkiniz bulunmuyor';
  END IF;
  RETURN QUERY
  WITH representatives AS (
    SELECT r.user_id,r.email,coalesce(p.full_name,r.email) full_name
    FROM public.app_user_roles r LEFT JOIN public.profiles p ON p.id=r.user_id
    WHERE r.active=true AND (r.role IN ('admin','sales') OR EXISTS(
      SELECT 1 FROM public.staff_permission_overrides o
      WHERE o.user_id=r.user_id AND o.permission_key='crm.sales_pipeline' AND o.access_level='manage'
    ))
  ), activity AS (
    SELECT a.created_by,
      count(*) FILTER (WHERE a.activity_type='call') calls,
      count(*) FILTER (WHERE a.activity_type='visit') visits,
      count(*) FILTER (WHERE a.activity_type='email') emails,
      count(*) FILTER (WHERE a.activity_type IN ('call','visit','meeting')) customer_meetings,
      count(*) FILTER (WHERE a.outcome='introduction_completed') introductions
    FROM public.crm_activities a WHERE a.activity_at::date BETWEEN p_from AND p_to GROUP BY a.created_by
  ), offers AS (
    SELECT o.created_by,count(*) quotes_sent FROM public.crm_offers o
    WHERE o.sent_at::date BETWEEN p_from AND p_to GROUP BY o.created_by
  ), wins AS (
    SELECT coalesce(o.assigned_to,o.created_by) owner_id,count(*) won FROM public.crm_opportunities o
    WHERE o.won_at::date BETWEEN p_from AND p_to GROUP BY coalesce(o.assigned_to,o.created_by)
  )
  SELECT r.user_id,r.email,r.full_name,coalesce(a.calls,0),coalesce(a.visits,0),coalesce(a.emails,0),
    coalesce(a.customer_meetings,0),coalesce(a.introductions,0),coalesce(f.quotes_sent,0),coalesce(w.won,0)
  FROM representatives r LEFT JOIN activity a ON a.created_by=r.user_id
  LEFT JOIN offers f ON f.created_by=r.user_id LEFT JOIN wins w ON w.owner_id=r.user_id
  ORDER BY coalesce(a.customer_meetings,0) DESC,r.full_name;
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
  PERFORM pg_advisory_xact_lock(hashtext('rex_customer_code_CST'));
  SELECT coalesce(max((regexp_match(customer_code,'^CST-(\d+)$'))[1]::integer),0)+1 INTO v_sequence
  FROM public.customers WHERE customer_code LIKE 'CST-%';
  v_code:='CST-'||lpad(v_sequence::text,6,'0');
  INSERT INTO public.customers(name,company,phone,email,status,notes,account_type,customer_code)
  VALUES(v_opp.company_name,v_opp.company_name,v_opp.phone,v_opp.email,'Potansiyel',v_opp.notes,'musteri',v_code)
  RETURNING id INTO v_customer;
  UPDATE public.crm_opportunities SET customer_id=v_customer,updated_at=now() WHERE id=v_opp.id;
  INSERT INTO public.crm_stage_events(opportunity_id,event_type,old_stage,new_stage,details,actor_id,actor_email)
  VALUES(v_opp.id,'customer_created',v_opp.stage,v_opp.stage,jsonb_build_object('customer_id',v_customer,'customer_code',v_code),auth.uid(),public.rex_crm_actor_email());
  RETURN v_customer;
END;
$$;

CREATE OR REPLACE FUNCTION public.rex_crm_create_job_from_quote(p_opportunity_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_opp public.crm_opportunities%ROWTYPE; v_quote public.quote_requests%ROWTYPE; v_job uuid; v_code text;
  v_qty integer; v_total numeric; v_unit numeric;
BEGIN
  IF NOT public.rex_has_permission('sales.work_orders','manage') OR NOT public.rex_has_permission('crm.sales_pipeline','manage') THEN
    RAISE EXCEPTION 'Teklif ve iş kaydı yetkisi gereklidir';
  END IF;
  SELECT * INTO v_opp FROM public.crm_opportunities WHERE id=p_opportunity_id FOR UPDATE;
  IF NOT FOUND OR v_opp.quote_request_id IS NULL THEN RAISE EXCEPTION 'Web teklif talebi bulunamadı'; END IF;
  IF v_opp.customer_id IS NULL THEN RAISE EXCEPTION 'Önce müşteri cari kartını oluşturun'; END IF;
  IF v_opp.first_job_id IS NOT NULL THEN RETURN v_opp.first_job_id; END IF;
  SELECT * INTO v_quote FROM public.quote_requests WHERE id=v_opp.quote_request_id;
  SELECT greatest(1,coalesce(sum(greatest(1,(x->>'quantity')::numeric)),1))::integer,
    greatest(1,coalesce(sum(greatest(1,(x->>'quantity')::numeric)*greatest(0.001,(x->>'weight')::numeric)),1))
  INTO v_qty,v_total FROM jsonb_array_elements(v_quote.cargos) x;
  v_unit:=v_total/v_qty;
  PERFORM pg_advisory_xact_lock(hashtext('rex_transport_job_code'));
  SELECT 'JOB-'||lpad((coalesce(max((regexp_match(job_code,'^JOB-(\d+)$'))[1]::integer),0)+1)::text,6,'0') INTO v_code FROM public.transport_jobs;
  INSERT INTO public.transport_jobs(job_code,job_date,quote_no,seller,customer_id,sender_name,sender_address,sender_city,
    receiver_name,receiver_address,receiver_city,quantity,cargo_type,unit_weight,total_weight,sales_unit_price,sales_total,currency,submitted_by)
  VALUES(v_code,current_date,(SELECT offer_no FROM public.crm_offers WHERE opportunity_id=v_opp.id ORDER BY sent_at DESC NULLS LAST,created_at DESC LIMIT 1),
    public.rex_crm_actor_email(),v_opp.customer_id,v_opp.company_name,v_quote.loading_point,v_quote.loading_point,
    v_opp.company_name,v_quote.delivery_point,v_quote.delivery_point,v_qty,
    concat_ws(' / ',CASE v_quote.transport_mode WHEN 'road' THEN 'Karayolu' WHEN 'air' THEN 'Havayolu' ELSE 'Denizyolu' END,v_quote.transport_detail),
    v_unit,v_total,CASE WHEN v_qty>0 THEN coalesce(v_opp.estimated_value,0)/v_qty ELSE 0 END,coalesce(v_opp.estimated_value,0),v_opp.currency,auth.uid())
  RETURNING id INTO v_job;
  UPDATE public.crm_opportunities SET first_job_id=v_job,updated_at=now() WHERE id=v_opp.id;
  INSERT INTO public.crm_stage_events(opportunity_id,event_type,old_stage,new_stage,details,actor_id,actor_email)
  VALUES(v_opp.id,'job_created',v_opp.stage,v_opp.stage,jsonb_build_object('job_id',v_job,'job_code',v_code),auth.uid(),public.rex_crm_actor_email());
  RETURN v_job;
END;
$$;

CREATE OR REPLACE FUNCTION public.rex_crm_mark_won_after_invoice()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_opp record;
BEGIN
  IF NEW.integration_status='official' AND coalesce(OLD.integration_status,'') IS DISTINCT FROM 'official' THEN
    FOR v_opp IN
      SELECT DISTINCT o.id,o.stage,t.id job_id
      FROM public.crm_opportunities o
      JOIN public.transport_jobs t ON t.id=o.first_job_id AND t.status='onaylandi'
      JOIN public.shipments s ON s.source_job_id=t.id
      WHERE o.customer_id=NEW.customer_id AND s.sale_invoice_id=NEW.id AND o.stage NOT IN ('won','lost')
    LOOP
      UPDATE public.crm_opportunities SET stage='won',first_invoice_id=NEW.id,won_at=now(),lost_at=NULL,lost_reason=NULL,updated_at=now()
      WHERE id=v_opp.id;
      UPDATE public.customers SET status='Aktif',updated_at=now() WHERE id=NEW.customer_id;
      INSERT INTO public.crm_stage_events(opportunity_id,event_type,old_stage,new_stage,details,actor_id,actor_email)
      VALUES(v_opp.id,'won_automatically',v_opp.stage,'won',jsonb_build_object('job_id',v_opp.job_id,'invoice_id',NEW.id,'invoice_no',NEW.invoice_no),auth.uid(),public.rex_crm_actor_email());
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rex_crm_mark_won_after_invoice ON public.sales_invoices;
CREATE TRIGGER rex_crm_mark_won_after_invoice AFTER UPDATE OF integration_status ON public.sales_invoices
FOR EACH ROW EXECUTE FUNCTION public.rex_crm_mark_won_after_invoice();

CREATE OR REPLACE FUNCTION public.rex_crm_stage_events_immutable()
RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN RAISE EXCEPTION 'CRM işlem geçmişi değiştirilemez veya silinemez'; END;
$$;
DROP TRIGGER IF EXISTS rex_crm_stage_events_immutable ON public.crm_stage_events;
CREATE TRIGGER rex_crm_stage_events_immutable BEFORE UPDATE OR DELETE ON public.crm_stage_events
FOR EACH ROW EXECUTE FUNCTION public.rex_crm_stage_events_immutable();

REVOKE ALL ON FUNCTION public.rex_crm_quote_detail(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.rex_crm_sales_representatives() FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.rex_crm_performance(date,date) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.rex_crm_convert_to_customer(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.rex_crm_create_job_from_quote(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rex_crm_quote_detail(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_crm_sales_representatives() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_crm_performance(date,date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_crm_convert_to_customer(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_crm_create_job_from_quote(uuid) TO authenticated;

COMMIT;
