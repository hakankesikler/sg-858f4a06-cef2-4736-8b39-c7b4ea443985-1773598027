BEGIN;

CREATE OR REPLACE FUNCTION public.rex_crm_create_opportunity(p_payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id uuid;
  v_assigned_to uuid := coalesce(nullif(p_payload->>'assigned_to', '')::uuid, auth.uid());
  v_source text := coalesce(nullif(p_payload->>'source', ''), 'manual');
  v_stage text := coalesce(nullif(p_payload->>'stage', ''), 'introduction');
  v_company_name text := trim(coalesce(p_payload->>'company_name', ''));
BEGIN
  IF NOT public.rex_has_permission('crm.sales_pipeline', 'manage') THEN
    RAISE EXCEPTION 'Yeni potansiyel müşteri oluşturma yetkiniz bulunmuyor';
  END IF;
  IF length(v_company_name) < 2 THEN
    RAISE EXCEPTION 'Firma adı zorunludur';
  END IF;
  IF v_source NOT IN ('manual', 'website', 'referral', 'existing_customer', 'integration') THEN
    RAISE EXCEPTION 'Geçersiz CRM kaynak türü';
  END IF;
  IF v_stage NOT IN ('introduction', 'quote_required', 'follow_up', 'won', 'lost') THEN
    RAISE EXCEPTION 'Geçersiz CRM aşaması';
  END IF;
  IF v_stage IN ('won', 'lost') THEN
    RAISE EXCEPTION 'Yeni potansiyel müşteri kazanıldı veya kaybedildi aşamasında açılamaz';
  END IF;
  IF v_assigned_to <> auth.uid()
     AND NOT public.rex_is_owner_admin()
     AND NOT EXISTS (
       SELECT 1 FROM public.app_user_roles me
       WHERE me.user_id = auth.uid() AND me.active = true AND me.role = 'admin'
     )
     AND NOT (
       public.rex_has_permission('crm.team_pipeline', 'manage')
       AND EXISTS (
         SELECT 1 FROM public.app_user_roles member
         WHERE member.user_id = v_assigned_to
           AND member.active = true
           AND member.manager_id = auth.uid()
       )
     ) THEN
    RAISE EXCEPTION 'Bu satış temsilcisine kayıt atama yetkiniz bulunmuyor';
  END IF;

  INSERT INTO public.crm_opportunities(
    company_name, contact_name, email, phone, source, stage, assigned_to,
    next_action_at, notes, created_by
  ) VALUES (
    v_company_name,
    nullif(trim(coalesce(p_payload->>'contact_name', '')), ''),
    nullif(lower(trim(coalesce(p_payload->>'email', ''))), ''),
    nullif(trim(coalesce(p_payload->>'phone', '')), ''),
    v_source,
    v_stage,
    v_assigned_to,
    nullif(p_payload->>'next_action_at', '')::timestamptz,
    nullif(trim(coalesce(p_payload->>'notes', '')), ''),
    auth.uid()
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.rex_crm_create_opportunity(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rex_crm_create_opportunity(jsonb) TO authenticated;

COMMIT;
