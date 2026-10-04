BEGIN;

-- A prospect's negative decision is not the loss of an established customer.
ALTER TABLE public.crm_opportunities DROP CONSTRAINT IF EXISTS crm_opportunities_stage_check;
ALTER TABLE public.crm_opportunities ADD CONSTRAINT crm_opportunities_stage_check
  CHECK (stage IN ('introduction','quote_required','follow_up','declined','won','lost'));
ALTER TABLE public.crm_opportunities
  ADD COLUMN IF NOT EXISTS declined_at timestamptz,
  ADD COLUMN IF NOT EXISTS declined_reason text;

-- Reclassify only unambiguous legacy prospects. Keep genuine and uncertain
-- former-customer records untouched for a separate human review.
UPDATE public.crm_opportunities o
SET stage='declined',
    declined_at=coalesce(o.lost_at,o.updated_at),
    declined_reason=coalesce(nullif(trim(o.lost_reason),''),'Önceki kayıp kaydı yeniden sınıflandırıldı'),
    lost_at=NULL, lost_reason=NULL, next_action_at=NULL
WHERE o.stage='lost' AND o.won_at IS NULL
  AND o.first_job_id IS NULL AND o.first_invoice_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.shipments s
    WHERE s.customer_id=o.customer_id AND s.status IN ('teslim_edildi','Teslim Edildi')
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.sales_invoices i
    WHERE i.customer_id=o.customer_id AND i.integration_status='official'
  );

CREATE OR REPLACE FUNCTION public.rex_crm_opportunity_before_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  IF TG_OP='INSERT' THEN
    IF NEW.stage IN ('won','lost','declined') THEN
      RAISE EXCEPTION 'Yeni CRM kaydı kapalı veya kazanılmış aşamada oluşturulamaz';
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    IF NEW.stage='declined' THEN
      IF OLD.stage NOT IN ('introduction','quote_required','follow_up') THEN
        RAISE EXCEPTION 'Olumsuz sonuç yalnızca henüz kazanılmamış adaylarda kullanılabilir';
      END IF;
      IF length(trim(coalesce(NEW.declined_reason,'')))<3 THEN
        RAISE EXCEPTION 'Olumsuz sonuç nedeni zorunludur';
      END IF;
      NEW.declined_at:=coalesce(NEW.declined_at,now());
      NEW.lost_at:=NULL;
      NEW.lost_reason:=NULL;
      NEW.next_action_at:=NULL;
    ELSIF NEW.stage='lost' THEN
      IF OLD.stage<>'won' OR OLD.won_at IS NULL OR OLD.customer_id IS NULL
         OR OLD.first_job_id IS NULL OR OLD.first_invoice_id IS NULL THEN
        RAISE EXCEPTION 'Kaybedildi yalnızca önce kazanılmış ve gerçek işi olan müşteriler içindir';
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM public.transport_jobs j
        WHERE j.id=OLD.first_job_id AND j.customer_id=OLD.customer_id
      ) OR NOT EXISTS (
        SELECT 1 FROM public.sales_invoices i
        WHERE i.id=OLD.first_invoice_id AND i.customer_id=OLD.customer_id
      ) OR NOT EXISTS (
        SELECT 1 FROM public.shipments s
        WHERE s.customer_id=OLD.customer_id AND s.status IN ('teslim_edildi','Teslim Edildi')
      ) THEN
        RAISE EXCEPTION 'Kaybedildi için müşteriye ait iş, fatura ve teslim edilmiş sevkiyat gereklidir';
      END IF;
      IF EXISTS (
        SELECT 1 FROM public.shipments s
        WHERE s.customer_id=OLD.customer_id
          AND coalesce(s.status,'') NOT IN ('teslim_edildi','Teslim Edildi','iptal','İptal')
      ) THEN
        RAISE EXCEPTION 'Açık sevkiyatı olan müşteri Kaybedildi yapılamaz';
      END IF;
      IF length(trim(coalesce(NEW.lost_reason,'')))<3 THEN
        RAISE EXCEPTION 'Müşterinin çalışmayı bırakma nedeni zorunludur';
      END IF;
      NEW.lost_at:=coalesce(NEW.lost_at,now());
      NEW.declined_at:=NULL;
      NEW.declined_reason:=NULL;
      NEW.next_action_at:=NULL;
    ELSE
      IF OLD.stage='declined' THEN
        NEW.declined_at:=NULL;
        NEW.declined_reason:=NULL;
      END IF;
      IF OLD.stage='lost' THEN
        IF NEW.stage<>'won' THEN
          RAISE EXCEPTION 'Eski müşteri ilişkisi önce Kazanıldı aşamasına geri alınmalıdır';
        END IF;
        NEW.lost_at:=NULL;
        NEW.lost_reason:=NULL;
      END IF;
    END IF;
  END IF;
  NEW.updated_at:=now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS rex_crm_opportunity_before_update ON public.crm_opportunities;
CREATE TRIGGER rex_crm_opportunity_before_update BEFORE INSERT OR UPDATE ON public.crm_opportunities
FOR EACH ROW EXECUTE FUNCTION public.rex_crm_opportunity_before_update();

-- Closed prospects must not count toward a representative's open workload.
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
      WHERE o.assigned_to=r.user_id AND o.stage NOT IN ('declined','won','lost')
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
        jsonb_build_object('lost_reason',NEW.lost_reason,'declined_reason',NEW.declined_reason),auth.uid(),public.rex_crm_actor_email());
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Terminal records should not keep overdue sales reminders or silently reopen
-- when a later activity/offer is entered. Reopening is an explicit CRM action.
CREATE OR REPLACE FUNCTION public.rex_crm_close_terminal_tasks()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  IF NEW.stage IN ('declined','lost') THEN
    UPDATE public.crm_tasks SET status='cancelled',updated_at=now()
    WHERE opportunity_id=NEW.id AND status='pending';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER rex_crm_close_terminal_tasks AFTER UPDATE OF stage ON public.crm_opportunities
FOR EACH ROW WHEN (OLD.stage IS DISTINCT FROM NEW.stage)
EXECUTE FUNCTION public.rex_crm_close_terminal_tasks();
UPDATE public.crm_tasks t SET status='cancelled',updated_at=now()
FROM public.crm_opportunities o
WHERE t.opportunity_id=o.id AND t.status='pending' AND o.stage IN ('declined','lost');

CREATE OR REPLACE FUNCTION public.rex_crm_terminal_activity_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.crm_opportunities o WHERE o.id=NEW.opportunity_id
      AND o.stage IN ('declined','lost')
  ) AND (NEW.outcome IN ('quote_requested','quote_sent') OR NEW.next_action_at IS NOT NULL) THEN
    RAISE EXCEPTION 'Kapalı CRM kaydını önce yeniden açın; ardından teklif veya takip işlemi oluşturun';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER rex_crm_terminal_activity_guard BEFORE INSERT ON public.crm_activities
FOR EACH ROW EXECUTE FUNCTION public.rex_crm_terminal_activity_guard();

CREATE OR REPLACE FUNCTION public.rex_crm_terminal_offer_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.crm_opportunities o WHERE o.id=NEW.opportunity_id
      AND o.stage IN ('declined','lost')
  ) AND (TG_OP='INSERT' OR NEW.status IN ('draft','sent','accepted')) THEN
    RAISE EXCEPTION 'Kapalı CRM kaydına yeni teklif eklemek için önce kaydı yeniden açın';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER rex_crm_terminal_offer_guard BEFORE INSERT OR UPDATE OF status ON public.crm_offers
FOR EACH ROW EXECUTE FUNCTION public.rex_crm_terminal_offer_guard();

-- A customer who later leaves must remain in the historical won figures for
-- the date on which the first job was actually won.
CREATE OR REPLACE FUNCTION public.rex_crm_performance(p_from date DEFAULT current_date,p_to date DEFAULT current_date)
RETURNS TABLE(
  user_id uuid,email text,full_name text,role text,calls bigint,visits bigint,emails bigint,
  customer_meetings bigint,introductions bigint,quotes_sent bigint,won bigint,lost bigint,
  tasks_due bigint,tasks_completed bigint,tasks_overdue bigint,pipeline_value numeric,
  weighted_forecast numeric,won_value numeric,avg_sales_cycle_days numeric,avg_margin_percent numeric
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  IF p_to<p_from THEN RAISE EXCEPTION 'Rapor bitiş tarihi başlangıçtan önce olamaz'; END IF;
  IF NOT public.rex_has_permission('crm.sales_pipeline','view') AND NOT public.rex_has_permission('reports.sales','view') THEN
    RAISE EXCEPTION 'Satış performansı görüntüleme yetkiniz bulunmuyor';
  END IF;
  RETURN QUERY
  WITH representatives AS (
    SELECT r.user_id,r.email,coalesce(p.full_name,r.email) full_name,r.role
    FROM public.app_user_roles r LEFT JOIN public.profiles p ON p.id=r.user_id
    WHERE r.active=true
      AND (r.role IN ('admin','sales') OR EXISTS (
        SELECT 1 FROM public.staff_permission_overrides permission_override
        WHERE permission_override.user_id=r.user_id AND permission_override.permission_key='crm.sales_pipeline' AND permission_override.access_level IN ('view','manage')
      ))
      AND (r.user_id=auth.uid() OR public.rex_is_owner_admin() OR (
        public.rex_has_permission('crm.team_pipeline','view') AND r.manager_id=auth.uid()
      ))
  ), activity AS (
    SELECT coalesce(a.representative_id,a.created_by) owner_id,
      count(*) FILTER (WHERE a.activity_type='call') calls,
      count(*) FILTER (WHERE a.activity_type='visit') visits,
      count(*) FILTER (WHERE a.activity_type='email') emails,
      count(*) FILTER (WHERE a.activity_type IN ('call','visit','meeting')) customer_meetings,
      count(*) FILTER (WHERE a.outcome='introduction_completed') introductions
    FROM public.crm_activities a WHERE a.activity_at::date BETWEEN p_from AND p_to
    GROUP BY coalesce(a.representative_id,a.created_by)
  ), offer_counts AS (
    SELECT coalesce(op.assigned_to,f.created_by) owner_id,count(*) FILTER (WHERE f.sent_at IS NOT NULL) quotes_sent,
      avg(CASE WHEN f.amount>0 AND f.status IN ('sent','accepted') THEN ((f.amount-f.cost_amount)/f.amount)*100 END) avg_margin
    FROM public.crm_offers f JOIN public.crm_opportunities op ON op.id=f.opportunity_id
    WHERE coalesce(f.sent_at,f.created_at)::date BETWEEN p_from AND p_to
    GROUP BY coalesce(op.assigned_to,f.created_by)
  ), task_counts AS (
    SELECT t.assigned_to owner_id,count(*) tasks_due,
      count(*) FILTER (WHERE t.status='completed') tasks_completed,
      count(*) FILTER (WHERE t.status='pending' AND t.due_at<now()) tasks_overdue
    FROM public.crm_tasks t WHERE t.due_at::date BETWEEN p_from AND p_to GROUP BY t.assigned_to
  ), opportunity_values AS (
    SELECT coalesce(op.assigned_to,op.created_by) owner_id,op.stage,op.created_at,op.won_at,op.lost_at,
      CASE
        WHEN latest.currency='TRY' THEN latest.amount
        WHEN latest.exchange_rate>0 THEN latest.amount*latest.exchange_rate
        WHEN op.currency='TRY' THEN coalesce(op.estimated_value,0)
        ELSE 0
      END value_try
    FROM public.crm_opportunities op
    LEFT JOIN LATERAL (
      SELECT offer.amount,offer.currency,offer.exchange_rate FROM public.crm_offers offer
      WHERE offer.opportunity_id=op.id AND offer.status IN ('sent','accepted')
      ORDER BY offer.revision_no DESC,offer.created_at DESC LIMIT 1
    ) latest ON true
  ), opportunity_summary AS (
    SELECT v.owner_id,
      count(*) FILTER (WHERE v.won_at::date BETWEEN p_from AND p_to) won,
      count(*) FILTER (WHERE v.stage='lost' AND v.won_at IS NOT NULL AND v.lost_at::date BETWEEN p_from AND p_to) lost,
      coalesce(sum(v.value_try) FILTER (WHERE v.stage IN ('introduction','quote_required','follow_up')),0) pipeline_value,
      coalesce(sum(v.value_try*CASE v.stage WHEN 'introduction' THEN 0.15 WHEN 'quote_required' THEN 0.35 WHEN 'follow_up' THEN 0.65 ELSE 0 END),0) weighted_forecast,
      coalesce(sum(v.value_try) FILTER (WHERE v.won_at::date BETWEEN p_from AND p_to),0) won_value,
      avg(EXTRACT(epoch FROM (v.won_at-v.created_at))/86400) FILTER (WHERE v.won_at::date BETWEEN p_from AND p_to) avg_cycle
    FROM opportunity_values v GROUP BY v.owner_id
  )
  SELECT r.user_id,r.email,r.full_name,r.role,
    coalesce(a.calls,0),coalesce(a.visits,0),coalesce(a.emails,0),coalesce(a.customer_meetings,0),coalesce(a.introductions,0),
    coalesce(o.quotes_sent,0),coalesce(s.won,0),coalesce(s.lost,0),coalesce(t.tasks_due,0),coalesce(t.tasks_completed,0),coalesce(t.tasks_overdue,0),
    round(coalesce(s.pipeline_value,0),2),round(coalesce(s.weighted_forecast,0),2),round(coalesce(s.won_value,0),2),
    round(coalesce(s.avg_cycle,0),1),round(coalesce(o.avg_margin,0),1)
  FROM representatives r LEFT JOIN activity a ON a.owner_id=r.user_id
  LEFT JOIN offer_counts o ON o.owner_id=r.user_id LEFT JOIN task_counts t ON t.owner_id=r.user_id
  LEFT JOIN opportunity_summary s ON s.owner_id=r.user_id
  ORDER BY coalesce(s.won_value,0) DESC,coalesce(a.customer_meetings,0) DESC,r.full_name;
END;
$$;

COMMIT;
