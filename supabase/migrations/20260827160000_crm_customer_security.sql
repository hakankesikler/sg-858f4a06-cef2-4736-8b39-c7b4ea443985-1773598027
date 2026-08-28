BEGIN;

-- Customer master data is never hard-deleted. Records are archived with an
-- immutable reasoned audit event so historic jobs, invoices and portal links
-- keep their referential integrity.
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archive_reason text;

CREATE INDEX IF NOT EXISTS customers_active_created_idx
  ON public.customers(created_at DESC) WHERE archived_at IS NULL;

CREATE TABLE IF NOT EXISTS public.customer_audit_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  event_type text NOT NULL CHECK (event_type IN ('created','updated','archived','restored','merged','imported')),
  reason text,
  old_data jsonb,
  new_data jsonb,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS customer_audit_events_customer_idx
  ON public.customer_audit_events(customer_id,created_at DESC);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_audit_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can view all customers" ON public.customers;
DROP POLICY IF EXISTS "Users can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Users can update customers" ON public.customers;
DROP POLICY IF EXISTS "Users can delete customers" ON public.customers;
DROP POLICY IF EXISTS rex_customers_select ON public.customers;
DROP POLICY IF EXISTS rex_customers_insert ON public.customers;
DROP POLICY IF EXISTS rex_customers_update ON public.customers;
DROP POLICY IF EXISTS rex_customers_delete ON public.customers;

CREATE POLICY rex_customers_select ON public.customers FOR SELECT TO authenticated
  USING (public.rex_has_permission('crm.customers','view'));
CREATE POLICY rex_customers_insert ON public.customers FOR INSERT TO authenticated
  WITH CHECK (public.rex_has_permission('crm.customers','manage') AND archived_at IS NULL);
CREATE POLICY rex_customers_update ON public.customers FOR UPDATE TO authenticated
  USING (public.rex_has_permission('crm.customers','manage'))
  WITH CHECK (public.rex_has_permission('crm.customers','manage'));

REVOKE DELETE ON public.customers FROM authenticated;
GRANT SELECT ON public.customer_audit_events TO authenticated;
GRANT USAGE,SELECT ON SEQUENCE public.customer_audit_events_id_seq TO authenticated;
CREATE POLICY rex_customer_audit_select ON public.customer_audit_events FOR SELECT TO authenticated
  USING (public.rex_has_permission('crm.customers','view') OR public.rex_has_permission('reports.sales','view'));

CREATE OR REPLACE FUNCTION public.rex_customer_audit_append_only()
RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
  RAISE EXCEPTION 'Cari denetim kayıtları değiştirilemez veya silinemez';
END;
$$;
DROP TRIGGER IF EXISTS rex_customer_audit_append_only ON public.customer_audit_events;
CREATE TRIGGER rex_customer_audit_append_only BEFORE UPDATE OR DELETE ON public.customer_audit_events
FOR EACH ROW EXECUTE FUNCTION public.rex_customer_audit_append_only();

CREATE OR REPLACE FUNCTION public.rex_archive_customer(p_customer_id uuid,p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_customer public.customers%ROWTYPE;
BEGIN
  IF NOT public.rex_has_permission('crm.customers','manage') THEN
    RAISE EXCEPTION 'Cari arşivleme yetkiniz bulunmuyor';
  END IF;
  IF length(trim(coalesce(p_reason,''))) < 10 THEN
    RAISE EXCEPTION 'Arşivleme nedeni en az 10 karakter olmalıdır';
  END IF;
  SELECT * INTO v_customer FROM public.customers WHERE id=p_customer_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Cari kaydı bulunamadı'; END IF;
  IF v_customer.archived_at IS NOT NULL THEN RAISE EXCEPTION 'Cari zaten arşivlenmiş'; END IF;
  UPDATE public.customers SET archived_at=now(),archived_by=auth.uid(),archive_reason=trim(p_reason),
    status='Pasif',updated_at=now() WHERE id=p_customer_id;
  INSERT INTO public.customer_audit_events(customer_id,event_type,reason,old_data,new_data,actor_id,actor_email)
  SELECT p_customer_id,'archived',trim(p_reason),to_jsonb(v_customer),to_jsonb(c),auth.uid(),public.rex_crm_actor_email()
  FROM public.customers c WHERE c.id=p_customer_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.rex_restore_customer(p_customer_id uuid,p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_customer public.customers%ROWTYPE;
BEGIN
  IF NOT public.rex_is_owner_admin() THEN RAISE EXCEPTION 'Arşivden çıkarma yalnızca şirket yöneticisi tarafından yapılabilir'; END IF;
  IF length(trim(coalesce(p_reason,''))) < 10 THEN RAISE EXCEPTION 'Geri alma nedeni en az 10 karakter olmalıdır'; END IF;
  SELECT * INTO v_customer FROM public.customers WHERE id=p_customer_id FOR UPDATE;
  IF NOT FOUND OR v_customer.archived_at IS NULL THEN RAISE EXCEPTION 'Arşivlenmiş cari bulunamadı'; END IF;
  UPDATE public.customers SET archived_at=NULL,archived_by=NULL,archive_reason=NULL,status='Aktif',updated_at=now()
  WHERE id=p_customer_id;
  INSERT INTO public.customer_audit_events(customer_id,event_type,reason,old_data,new_data,actor_id,actor_email)
  SELECT p_customer_id,'restored',trim(p_reason),to_jsonb(v_customer),to_jsonb(c),auth.uid(),public.rex_crm_actor_email()
  FROM public.customers c WHERE c.id=p_customer_id;
END;
$$;

REVOKE ALL ON FUNCTION public.rex_archive_customer(uuid,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.rex_restore_customer(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rex_archive_customer(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_restore_customer(uuid,text) TO authenticated;

COMMIT;
