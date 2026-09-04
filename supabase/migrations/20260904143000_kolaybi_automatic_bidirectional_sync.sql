-- Durable REX TYS -> KolayBi associate synchronization queue.
-- Inbound accounting data remains handled by the existing hourly office sync.

CREATE TABLE IF NOT EXISTS public.kolaybi_outbound_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type text NOT NULL DEFAULT 'associate' CHECK (resource_type IN ('associate')),
  entity_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  operation text NOT NULL DEFAULT 'upsert' CHECK (operation IN ('upsert')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','review_required','dead')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  max_attempts integer NOT NULL DEFAULT 8 CHECK (max_attempts BETWEEN 1 AND 20),
  run_after timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  locked_by text,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(resource_type,entity_id)
);

CREATE INDEX IF NOT EXISTS kolaybi_outbound_jobs_worker_idx
  ON public.kolaybi_outbound_jobs(status,run_after,created_at)
  WHERE status IN ('pending','processing');

ALTER TABLE public.kolaybi_outbound_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS kolaybi_outbound_jobs_monitor ON public.kolaybi_outbound_jobs;
CREATE POLICY kolaybi_outbound_jobs_monitor ON public.kolaybi_outbound_jobs
  FOR SELECT TO authenticated
  USING (public.rex_has_permission('integrations.monitoring','view'));

REVOKE ALL ON TABLE public.kolaybi_outbound_jobs FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.kolaybi_outbound_jobs TO authenticated;
GRANT ALL ON TABLE public.kolaybi_outbound_jobs TO service_role;

CREATE OR REPLACE FUNCTION public.rex_queue_kolaybi_customer_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public,pg_temp
AS $$
DECLARE
  v_identity text;
BEGIN
  v_identity := regexp_replace(coalesce(NEW.vergi_no,NEW.tc_no,''),'\D','','g');
  IF NEW.archived_at IS NOT NULL OR length(v_identity) NOT IN (10,11) THEN
    RETURN NEW;
  END IF;
  IF NEW.kolaybi_contact_id IS NOT NULL THEN
    IF TG_OP='INSERT' THEN RETURN NEW; END IF;
    IF OLD.vergi_no IS NOT DISTINCT FROM NEW.vergi_no AND OLD.tc_no IS NOT DISTINCT FROM NEW.tc_no THEN RETURN NEW; END IF;
  END IF;

  INSERT INTO public.kolaybi_outbound_jobs(resource_type,entity_id,operation,status,attempts,run_after,locked_at,locked_by,last_error,updated_at)
  VALUES('associate',NEW.id,'upsert','pending',0,now(),NULL,NULL,NULL,now())
  ON CONFLICT(resource_type,entity_id) DO UPDATE SET
    status='pending', attempts=0, run_after=now(), locked_at=NULL, locked_by=NULL, last_error=NULL, updated_at=now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS queue_kolaybi_customer_insert ON public.customers;
CREATE TRIGGER queue_kolaybi_customer_insert
AFTER INSERT ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.rex_queue_kolaybi_customer_sync();

DROP TRIGGER IF EXISTS queue_kolaybi_customer_update ON public.customers;
CREATE TRIGGER queue_kolaybi_customer_update
AFTER UPDATE OF name,company,vergi_no,tc_no,tax_office,email,phone,address,city,district,postal_code,website,account_type
ON public.customers
FOR EACH ROW
WHEN (
  OLD.name IS DISTINCT FROM NEW.name OR OLD.company IS DISTINCT FROM NEW.company OR
  OLD.vergi_no IS DISTINCT FROM NEW.vergi_no OR OLD.tc_no IS DISTINCT FROM NEW.tc_no OR
  OLD.tax_office IS DISTINCT FROM NEW.tax_office OR OLD.email IS DISTINCT FROM NEW.email OR
  OLD.phone IS DISTINCT FROM NEW.phone OR OLD.address IS DISTINCT FROM NEW.address OR
  OLD.city IS DISTINCT FROM NEW.city OR OLD.district IS DISTINCT FROM NEW.district OR
  OLD.postal_code IS DISTINCT FROM NEW.postal_code OR OLD.website IS DISTINCT FROM NEW.website OR
  OLD.account_type IS DISTINCT FROM NEW.account_type
)
EXECUTE FUNCTION public.rex_queue_kolaybi_customer_sync();

CREATE OR REPLACE FUNCTION public.rex_claim_kolaybi_outbound_job(p_worker_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public,pg_temp
AS $$
DECLARE
  v_job public.kolaybi_outbound_jobs%ROWTYPE;
BEGIN
  IF auth.role() <> 'service_role' THEN RAISE EXCEPTION 'Bu işlem yalnızca sistem görevlisi tarafından çalıştırılabilir'; END IF;

  SELECT * INTO v_job
  FROM public.kolaybi_outbound_jobs
  WHERE (
    status='pending' AND run_after <= now()
  ) OR (
    status='processing' AND locked_at < now() - interval '15 minutes'
  )
  ORDER BY run_after,created_at
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF v_job.id IS NULL THEN RETURN NULL; END IF;

  UPDATE public.kolaybi_outbound_jobs
  SET status='processing', attempts=attempts+1, locked_at=now(), locked_by=left(p_worker_id,100), updated_at=now()
  WHERE id=v_job.id
  RETURNING * INTO v_job;

  RETURN to_jsonb(v_job);
END $$;

CREATE OR REPLACE FUNCTION public.rex_finish_kolaybi_outbound_job(
  p_job_id uuid,
  p_success boolean,
  p_retryable boolean DEFAULT true,
  p_error text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public,pg_temp
AS $$
DECLARE
  v_attempts integer;
  v_max_attempts integer;
BEGIN
  IF auth.role() <> 'service_role' THEN RAISE EXCEPTION 'Bu işlem yalnızca sistem görevlisi tarafından çalıştırılabilir'; END IF;
  SELECT attempts,max_attempts INTO v_attempts,v_max_attempts FROM public.kolaybi_outbound_jobs WHERE id=p_job_id FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;

  IF p_success THEN
    UPDATE public.kolaybi_outbound_jobs
    SET status='completed', run_after=now(), locked_at=NULL, locked_by=NULL, last_error=NULL, updated_at=now()
    WHERE id=p_job_id;
  ELSIF NOT p_retryable THEN
    UPDATE public.kolaybi_outbound_jobs
    SET status='review_required', locked_at=NULL, locked_by=NULL, last_error=left(coalesce(p_error,'Kontrol gerekli'),1000), updated_at=now()
    WHERE id=p_job_id;
  ELSIF v_attempts >= v_max_attempts THEN
    UPDATE public.kolaybi_outbound_jobs
    SET status='dead', locked_at=NULL, locked_by=NULL, last_error=left(coalesce(p_error,'Azami deneme sayısı aşıldı'),1000), updated_at=now()
    WHERE id=p_job_id;
  ELSE
    UPDATE public.kolaybi_outbound_jobs
    SET status='pending', run_after=now() + make_interval(mins => least(240, power(2,greatest(v_attempts-1,0))::integer * 5)),
        locked_at=NULL, locked_by=NULL, last_error=left(coalesce(p_error,'Geçici hata'),1000), updated_at=now()
    WHERE id=p_job_id;
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.rex_queue_kolaybi_customer_sync() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rex_claim_kolaybi_outbound_job(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rex_finish_kolaybi_outbound_job(uuid,boolean,boolean,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rex_claim_kolaybi_outbound_job(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.rex_finish_kolaybi_outbound_job(uuid,boolean,boolean,text) TO service_role;

COMMENT ON TABLE public.kolaybi_outbound_jobs IS 'REX TYS cari kartlarını KolayBi ile otomatik eşleştiren dayanıklı yeniden deneme kuyruğu.';
