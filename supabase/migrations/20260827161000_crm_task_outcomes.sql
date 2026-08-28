BEGIN;

ALTER TABLE public.crm_activities
  ADD COLUMN IF NOT EXISTS task_id uuid REFERENCES public.crm_tasks(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS representative_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS crm_activities_task_unique
  ON public.crm_activities(task_id) WHERE task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS crm_activities_representative_idx
  ON public.crm_activities(representative_id,activity_at DESC);

CREATE OR REPLACE FUNCTION public.rex_crm_complete_task(p_task_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  RAISE EXCEPTION 'Görev, görüşme sonucu ve kısa özet kaydedilmeden kapatılamaz';
END;
$$;

CREATE OR REPLACE FUNCTION public.rex_crm_complete_task_with_activity(
  p_task_id uuid,p_activity_type text,p_outcome text,p_summary text,
  p_activity_at timestamptz DEFAULT now(),p_next_action_at timestamptz DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_task public.crm_tasks%ROWTYPE; v_activity_id uuid;
BEGIN
  IF NOT public.rex_has_permission('crm.sales_pipeline','manage') THEN RAISE EXCEPTION 'CRM görev yönetimi yetkiniz bulunmuyor'; END IF;
  IF p_activity_type NOT IN ('call','visit','email','meeting','note') THEN RAISE EXCEPTION 'Geçersiz faaliyet türü'; END IF;
  IF p_outcome NOT IN ('reached','not_reached','introduction_completed','positive','negative','follow_up','quote_requested','quote_sent','no_interest','other') THEN RAISE EXCEPTION 'Geçersiz görüşme sonucu'; END IF;
  IF length(trim(coalesce(p_summary,''))) < 3 THEN RAISE EXCEPTION 'Görüşme özeti zorunludur'; END IF;
  IF p_outcome IN ('not_reached','positive','follow_up','quote_requested') AND p_next_action_at IS NULL THEN
    RAISE EXCEPTION 'Bu görüşme sonucu için sonraki işlem tarihi zorunludur';
  END IF;
  SELECT * INTO v_task FROM public.crm_tasks WHERE id=p_task_id AND status='pending' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Açık görev bulunamadı'; END IF;
  IF v_task.assigned_to IS NOT NULL AND v_task.assigned_to<>auth.uid() AND NOT public.rex_is_owner_admin() THEN RAISE EXCEPTION 'Yalnızca size atanmış görevi kapatabilirsiniz'; END IF;
  INSERT INTO public.crm_activities(task_id,opportunity_id,customer_id,activity_type,outcome,summary,activity_at,next_action_at,representative_id,created_by)
  VALUES(v_task.id,v_task.opportunity_id,v_task.customer_id,p_activity_type,p_outcome,trim(p_summary),coalesce(p_activity_at,now()),p_next_action_at,coalesce(v_task.assigned_to,auth.uid()),auth.uid())
  RETURNING id INTO v_activity_id;
  UPDATE public.crm_tasks SET status='completed',completed_at=now(),completed_by=auth.uid(),updated_at=now() WHERE id=v_task.id;
  RETURN v_activity_id;
END;
$$;

REVOKE ALL ON FUNCTION public.rex_crm_complete_task_with_activity(uuid,text,text,text,timestamptz,timestamptz) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rex_crm_complete_task_with_activity(uuid,text,text,text,timestamptz,timestamptz) TO authenticated;

COMMIT;
