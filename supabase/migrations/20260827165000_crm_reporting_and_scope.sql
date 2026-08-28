BEGIN;

-- Child records must never reveal an opportunity outside the current user's
-- own/team scope, even when the user has a general CRM view permission.
DROP POLICY IF EXISTS rex_crm_offer_items_select ON public.crm_offer_items;
CREATE POLICY rex_crm_offer_items_select ON public.crm_offer_items FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.crm_offers offer
    WHERE offer.id=offer_id AND public.rex_crm_can_access_opportunity(offer.opportunity_id)
  ));
DROP POLICY IF EXISTS rex_crm_offer_items_write ON public.crm_offer_items;
CREATE POLICY rex_crm_offer_items_write ON public.crm_offer_items FOR ALL TO authenticated
  USING (public.rex_has_permission('crm.sales_pipeline','manage') AND EXISTS (
    SELECT 1 FROM public.crm_offers offer
    WHERE offer.id=offer_id AND offer.status='draft' AND public.rex_crm_can_access_opportunity(offer.opportunity_id)
  ))
  WITH CHECK (public.rex_has_permission('crm.sales_pipeline','manage') AND EXISTS (
    SELECT 1 FROM public.crm_offers offer
    WHERE offer.id=offer_id AND offer.status='draft' AND public.rex_crm_can_access_opportunity(offer.opportunity_id)
  ));

DROP POLICY IF EXISTS rex_crm_offer_versions_select ON public.crm_offer_versions;
CREATE POLICY rex_crm_offer_versions_select ON public.crm_offer_versions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.crm_offers offer
    WHERE offer.id=offer_id AND public.rex_crm_can_access_opportunity(offer.opportunity_id)
  ));

DROP POLICY IF EXISTS rex_crm_stage_events_select ON public.crm_stage_events;
CREATE POLICY rex_crm_stage_events_select ON public.crm_stage_events FOR SELECT TO authenticated
  USING (public.rex_crm_can_access_opportunity(opportunity_id));

DROP POLICY IF EXISTS rex_crm_settings_select ON public.crm_settings;
CREATE POLICY rex_crm_settings_select ON public.crm_settings FOR SELECT TO authenticated
  USING (public.rex_has_permission('crm.sales_pipeline','view') OR public.rex_has_permission('crm.settings','view'));

-- Offer approval and CRM configuration can be delegated separately from the
-- admin role through the granular permission screen.
CREATE OR REPLACE FUNCTION public.rex_crm_review_offer(p_offer_id uuid,p_decision text,p_note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_opportunity uuid;
BEGIN
  IF NOT public.rex_has_permission('crm.offer_approval','manage') THEN
    RAISE EXCEPTION 'Teklif onay yetkiniz bulunmuyor';
  END IF;
  IF p_decision NOT IN ('approve','reject') THEN RAISE EXCEPTION 'Geçersiz onay kararı'; END IF;
  IF p_decision='reject' AND length(trim(coalesce(p_note,'')))<3 THEN RAISE EXCEPTION 'Ret açıklaması zorunludur'; END IF;
  SELECT opportunity_id INTO v_opportunity FROM public.crm_offers WHERE id=p_offer_id;
  IF v_opportunity IS NULL OR NOT public.rex_crm_can_access_opportunity(v_opportunity) THEN
    RAISE EXCEPTION 'Teklif bulunamadı veya erişim yetkiniz yok';
  END IF;
  UPDATE public.crm_offers SET approval_status=CASE WHEN p_decision='approve' THEN 'approved' ELSE 'rejected' END,
    approval_note=nullif(trim(p_note),''),approved_by=auth.uid(),approved_at=now(),updated_at=now()
  WHERE id=p_offer_id AND approval_status='pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'Onay bekleyen teklif bulunamadı'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.rex_crm_update_settings(p_settings jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_old public.crm_settings%ROWTYPE;
BEGIN
  IF NOT public.rex_has_permission('crm.settings','manage') THEN RAISE EXCEPTION 'CRM ayar yetkiniz bulunmuyor'; END IF;
  SELECT * INTO v_old FROM public.crm_settings WHERE id=true FOR UPDATE;
  UPDATE public.crm_settings SET
    automatic_assignment=coalesce((p_settings->>'automatic_assignment')::boolean,automatic_assignment),
    response_sla_minutes=greatest(15,least(10080,coalesce((p_settings->>'response_sla_minutes')::integer,response_sla_minutes))),
    offer_follow_up_days=greatest(1,least(30,coalesce((p_settings->>'offer_follow_up_days')::integer,offer_follow_up_days))),
    approval_threshold_try=greatest(0,coalesce((p_settings->>'approval_threshold_try')::numeric,approval_threshold_try)),
    approval_threshold_usd=greatest(0,coalesce((p_settings->>'approval_threshold_usd')::numeric,approval_threshold_usd)),
    approval_threshold_eur=greatest(0,coalesce((p_settings->>'approval_threshold_eur')::numeric,approval_threshold_eur)),
    approval_threshold_gbp=greatest(0,coalesce((p_settings->>'approval_threshold_gbp')::numeric,approval_threshold_gbp)),
    minimum_margin_percent=greatest(-100,least(100,coalesce((p_settings->>'minimum_margin_percent')::numeric,minimum_margin_percent))),
    updated_by=auth.uid(),updated_at=now() WHERE id=true;
  INSERT INTO public.crm_settings_events(old_settings,new_settings,actor_id,actor_email)
  SELECT to_jsonb(v_old),to_jsonb(s),auth.uid(),public.rex_crm_actor_email() FROM public.crm_settings s WHERE id=true;
END;
$$;

-- Consent time is recorded automatically; unchecking consent also clears it.
CREATE OR REPLACE FUNCTION public.rex_crm_contact_consent_stamp()
RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
  IF nullif(trim(coalesce(NEW.email,'')),'') IS NULL AND nullif(trim(coalesce(NEW.phone,'')),'') IS NULL THEN
    RAISE EXCEPTION 'Müşteri yetkilisi için telefon veya e-posta zorunludur';
  END IF;
  IF NEW.is_primary THEN
    UPDATE public.crm_contacts SET is_primary=false,updated_at=now()
    WHERE customer_id=NEW.customer_id AND active=true AND id<>NEW.id AND is_primary=true;
  END IF;
  NEW.consent_recorded_at:=CASE
    WHEN NOT NEW.commercial_consent THEN NULL
    WHEN TG_OP='INSERT' THEN coalesce(NEW.consent_recorded_at,now())
    ELSE coalesce(OLD.consent_recorded_at,now())
  END;
  NEW.updated_at:=now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS rex_crm_contact_consent_stamp ON public.crm_contacts;
CREATE TRIGGER rex_crm_contact_consent_stamp BEFORE INSERT OR UPDATE ON public.crm_contacts
FOR EACH ROW EXECUTE FUNCTION public.rex_crm_contact_consent_stamp();

DROP FUNCTION IF EXISTS public.rex_crm_performance(date,date);
CREATE FUNCTION public.rex_crm_performance(p_from date DEFAULT current_date,p_to date DEFAULT current_date)
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
      count(*) FILTER (WHERE v.stage='won' AND v.won_at::date BETWEEN p_from AND p_to) won,
      count(*) FILTER (WHERE v.stage='lost' AND v.lost_at::date BETWEEN p_from AND p_to) lost,
      coalesce(sum(v.value_try) FILTER (WHERE v.stage IN ('introduction','quote_required','follow_up')),0) pipeline_value,
      coalesce(sum(v.value_try*CASE v.stage WHEN 'introduction' THEN 0.15 WHEN 'quote_required' THEN 0.35 WHEN 'follow_up' THEN 0.65 ELSE 0 END),0) weighted_forecast,
      coalesce(sum(v.value_try) FILTER (WHERE v.stage='won' AND v.won_at::date BETWEEN p_from AND p_to),0) won_value,
      avg(EXTRACT(epoch FROM (v.won_at-v.created_at))/86400) FILTER (WHERE v.stage='won' AND v.won_at::date BETWEEN p_from AND p_to) avg_cycle
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

REVOKE ALL ON FUNCTION public.rex_crm_performance(date,date) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rex_crm_performance(date,date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_crm_expire_offers() TO service_role;

COMMIT;
