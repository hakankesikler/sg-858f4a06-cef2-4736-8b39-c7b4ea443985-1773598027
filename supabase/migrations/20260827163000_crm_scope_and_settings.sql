BEGIN;

ALTER TABLE public.app_user_roles
  ADD COLUMN IF NOT EXISTS manager_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS app_user_roles_manager_idx ON public.app_user_roles(manager_id) WHERE active=true;

ALTER TABLE public.staff_permission_overrides DROP CONSTRAINT IF EXISTS staff_permission_overrides_permission_key_check;
ALTER TABLE public.staff_permission_overrides ADD CONSTRAINT staff_permission_overrides_permission_key_check CHECK (permission_key IN (
  'crm.customers','crm.portal_invites','crm.sales_pipeline','crm.team_pipeline','crm.offer_approval','crm.exports','crm.settings','sales.work_orders',
  'operations.shipments','operations.assignments','operations.delivery','operations.exceptions','operations.uetds','accounting.sales',
  'accounting.purchase','accounting.accounts','accounting.expenses','reports.sales','reports.operations','reports.accounting','analytics.web',
  'integrations.connections','integrations.imports','integrations.monitoring'
));

CREATE OR REPLACE FUNCTION public.rex_base_permission_level(p_role text,p_key text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN p_role='admin' THEN 'manage'
    WHEN p_role='sales' AND p_key IN ('crm.customers','crm.portal_invites','crm.sales_pipeline','crm.exports','sales.work_orders') THEN 'manage'
    WHEN p_role='sales' AND p_key IN ('reports.sales','integrations.monitoring') THEN 'view'
    WHEN p_role='operations' AND p_key IN ('sales.work_orders','operations.shipments','operations.assignments','operations.delivery','operations.exceptions','operations.uetds','integrations.imports') THEN 'manage'
    WHEN p_role='operations' AND p_key IN ('crm.customers','reports.operations','analytics.web','integrations.monitoring') THEN 'view'
    WHEN p_role='accounting' AND p_key IN ('accounting.sales','accounting.purchase','accounting.accounts','accounting.expenses') THEN 'manage'
    WHEN p_role='accounting' AND p_key IN ('crm.customers','reports.accounting','integrations.monitoring') THEN 'view'
    ELSE 'none' END;
$$;

CREATE OR REPLACE FUNCTION public.rex_crm_can_access_opportunity(p_opportunity_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.crm_opportunities o WHERE o.id=p_opportunity_id AND (
      o.assigned_to=auth.uid() OR o.created_by=auth.uid() OR public.rex_is_owner_admin()
      OR EXISTS(SELECT 1 FROM public.app_user_roles me WHERE me.user_id=auth.uid() AND me.active=true AND me.role='admin')
      OR (public.rex_has_permission('crm.team_pipeline','view') AND EXISTS(
        SELECT 1 FROM public.app_user_roles member WHERE member.user_id=o.assigned_to AND member.active=true AND member.manager_id=auth.uid()
      ))
    )
  );
$$;
REVOKE ALL ON FUNCTION public.rex_crm_can_access_opportunity(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rex_crm_can_access_opportunity(uuid) TO authenticated;

DROP POLICY IF EXISTS rex_crm_opportunities_select ON public.crm_opportunities;
DROP POLICY IF EXISTS rex_crm_opportunities_write ON public.crm_opportunities;
CREATE POLICY rex_crm_opportunities_select ON public.crm_opportunities FOR SELECT TO authenticated
  USING ((public.rex_has_permission('crm.sales_pipeline','view') OR public.rex_has_permission('reports.sales','view')) AND public.rex_crm_can_access_opportunity(id));
CREATE POLICY rex_crm_opportunities_insert ON public.crm_opportunities FOR INSERT TO authenticated
  WITH CHECK (public.rex_has_permission('crm.sales_pipeline','manage') AND (
    assigned_to IS NULL OR assigned_to=auth.uid() OR public.rex_is_owner_admin()
    OR EXISTS(SELECT 1 FROM public.app_user_roles me WHERE me.user_id=auth.uid() AND me.active=true AND me.role='admin')
    OR (public.rex_has_permission('crm.team_pipeline','manage') AND EXISTS(SELECT 1 FROM public.app_user_roles member WHERE member.user_id=assigned_to AND member.manager_id=auth.uid()))
  ));
CREATE POLICY rex_crm_opportunities_update ON public.crm_opportunities FOR UPDATE TO authenticated
  USING (public.rex_has_permission('crm.sales_pipeline','manage') AND public.rex_crm_can_access_opportunity(id))
  WITH CHECK (public.rex_has_permission('crm.sales_pipeline','manage') AND public.rex_crm_can_access_opportunity(id));

DROP POLICY IF EXISTS rex_crm_activities_select ON public.crm_activities;
DROP POLICY IF EXISTS rex_crm_activities_insert ON public.crm_activities;
CREATE POLICY rex_crm_activities_select ON public.crm_activities FOR SELECT TO authenticated
  USING ((public.rex_has_permission('crm.sales_pipeline','view') OR public.rex_has_permission('reports.sales','view')) AND public.rex_crm_can_access_opportunity(opportunity_id));
CREATE POLICY rex_crm_activities_insert ON public.crm_activities FOR INSERT TO authenticated
  WITH CHECK (public.rex_has_permission('crm.sales_pipeline','manage') AND created_by=auth.uid() AND public.rex_crm_can_access_opportunity(opportunity_id));

DROP POLICY IF EXISTS rex_crm_offers_select ON public.crm_offers;
DROP POLICY IF EXISTS rex_crm_offers_write ON public.crm_offers;
CREATE POLICY rex_crm_offers_select ON public.crm_offers FOR SELECT TO authenticated
  USING ((public.rex_has_permission('crm.sales_pipeline','view') OR public.rex_has_permission('reports.sales','view')) AND public.rex_crm_can_access_opportunity(opportunity_id));
CREATE POLICY rex_crm_offers_write ON public.crm_offers FOR ALL TO authenticated
  USING (public.rex_has_permission('crm.sales_pipeline','manage') AND public.rex_crm_can_access_opportunity(opportunity_id))
  WITH CHECK (public.rex_has_permission('crm.sales_pipeline','manage') AND public.rex_crm_can_access_opportunity(opportunity_id));

DROP POLICY IF EXISTS rex_crm_tasks_select ON public.crm_tasks;
DROP POLICY IF EXISTS rex_crm_tasks_write ON public.crm_tasks;
CREATE POLICY rex_crm_tasks_select ON public.crm_tasks FOR SELECT TO authenticated
  USING ((public.rex_has_permission('crm.sales_pipeline','view') OR public.rex_has_permission('reports.sales','view')) AND public.rex_crm_can_access_opportunity(opportunity_id));
CREATE POLICY rex_crm_tasks_write ON public.crm_tasks FOR ALL TO authenticated
  USING (public.rex_has_permission('crm.sales_pipeline','manage') AND public.rex_crm_can_access_opportunity(opportunity_id))
  WITH CHECK (public.rex_has_permission('crm.sales_pipeline','manage') AND public.rex_crm_can_access_opportunity(opportunity_id));

CREATE TABLE IF NOT EXISTS public.crm_settings_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  old_settings jsonb NOT NULL,new_settings jsonb NOT NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,actor_email text,created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_settings_events ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.crm_settings_events TO authenticated;
GRANT USAGE,SELECT ON SEQUENCE public.crm_settings_events_id_seq TO authenticated;
CREATE POLICY rex_crm_settings_events_select ON public.crm_settings_events FOR SELECT TO authenticated USING(public.rex_is_owner_admin());

CREATE OR REPLACE FUNCTION public.rex_crm_update_settings(p_settings jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_old public.crm_settings%ROWTYPE;
BEGIN
  IF NOT public.rex_is_owner_admin() THEN RAISE EXCEPTION 'CRM ayarlarını yalnızca şirket sahibi değiştirebilir'; END IF;
  SELECT * INTO v_old FROM public.crm_settings WHERE id=true FOR UPDATE;
  UPDATE public.crm_settings SET
    automatic_assignment=coalesce((p_settings->>'automatic_assignment')::boolean,automatic_assignment),
    response_sla_minutes=coalesce((p_settings->>'response_sla_minutes')::integer,response_sla_minutes),
    offer_follow_up_days=coalesce((p_settings->>'offer_follow_up_days')::integer,offer_follow_up_days),
    approval_threshold_try=coalesce((p_settings->>'approval_threshold_try')::numeric,approval_threshold_try),
    approval_threshold_usd=coalesce((p_settings->>'approval_threshold_usd')::numeric,approval_threshold_usd),
    approval_threshold_eur=coalesce((p_settings->>'approval_threshold_eur')::numeric,approval_threshold_eur),
    approval_threshold_gbp=coalesce((p_settings->>'approval_threshold_gbp')::numeric,approval_threshold_gbp),
    minimum_margin_percent=coalesce((p_settings->>'minimum_margin_percent')::numeric,minimum_margin_percent),
    updated_by=auth.uid(),updated_at=now() WHERE id=true;
  INSERT INTO public.crm_settings_events(old_settings,new_settings,actor_id,actor_email)
  SELECT to_jsonb(v_old),to_jsonb(s),auth.uid(),public.rex_crm_actor_email() FROM public.crm_settings s WHERE id=true;
END;
$$;
REVOKE ALL ON FUNCTION public.rex_crm_update_settings(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rex_crm_update_settings(jsonb) TO authenticated;

COMMIT;
