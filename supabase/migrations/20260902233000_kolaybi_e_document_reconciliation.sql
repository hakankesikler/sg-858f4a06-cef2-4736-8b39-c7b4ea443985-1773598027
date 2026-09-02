-- Reconcile KolayBi e-document identity and provider status without treating a draft UUID as official.

CREATE OR REPLACE FUNCTION public.rex_queue_invoice_status_check(p_invoice_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public,pg_temp
AS $$
DECLARE
  v_invoice public.sales_invoices%ROWTYPE;
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin','accounting']) THEN
    RAISE EXCEPTION 'Bu işlem için yetkiniz bulunmuyor';
  END IF;

  SELECT * INTO v_invoice
  FROM public.sales_invoices
  WHERE id=p_invoice_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Fatura bulunamadı'; END IF;
  IF v_invoice.kolaybi_document_id IS NULL THEN
    RAISE EXCEPTION 'KolayBi belge kimliği henüz oluşmadı';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.invoice_sync_jobs
    WHERE invoice_id=p_invoice_id
      AND job_type='status'
      AND status IN ('pending','processing')
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.invoice_sync_jobs(invoice_id,job_type,status,run_after,idempotency_key)
  VALUES(
    p_invoice_id,
    'status',
    'pending',
    now(),
    v_invoice.idempotency_key||':status:manual:'||gen_random_uuid()::text
  );
END
$$;

CREATE OR REPLACE FUNCTION public.rex_queue_stale_invoice_status_checks(p_limit integer DEFAULT 10)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public,pg_temp
AS $$
DECLARE
  v_count integer := 0;
BEGIN
  IF auth.role()<>'service_role' AND NOT public.rex_has_role(ARRAY['admin','accounting']) THEN
    RAISE EXCEPTION 'Bu işlem için yetkiniz bulunmuyor';
  END IF;

  WITH candidates AS (
    SELECT i.id, i.idempotency_key
    FROM public.sales_invoices i
    WHERE i.integration_status='submitted'
      AND i.kolaybi_document_id IS NOT NULL
      AND (i.last_status_check_at IS NULL OR i.last_status_check_at <= now()-interval '15 minutes')
      AND NOT EXISTS (
        SELECT 1
        FROM public.invoice_sync_jobs j
        WHERE j.invoice_id=i.id
          AND j.job_type='status'
          AND j.status IN ('pending','processing')
      )
    ORDER BY i.last_status_check_at ASC NULLS FIRST, i.created_at ASC
    LIMIT greatest(1,least(coalesce(p_limit,10),100))
    FOR UPDATE OF i SKIP LOCKED
  )
  INSERT INTO public.invoice_sync_jobs(invoice_id,job_type,status,run_after,idempotency_key)
  SELECT
    c.id,
    'status',
    'pending',
    now(),
    c.idempotency_key||':status:auto:'||floor(extract(epoch from now())/900)::bigint::text
  FROM candidates c
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END
$$;

CREATE OR REPLACE FUNCTION public.rex_record_invoice_sync_result(
  p_job_id uuid,p_status text,p_retryable boolean DEFAULT false,p_error text DEFAULT NULL,
  p_document_id bigint DEFAULT NULL,p_uuid text DEFAULT NULL,p_invoice_no text DEFAULT NULL,
  p_provider_status text DEFAULT NULL,p_pdf_url text DEFAULT NULL,p_result jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public,pg_temp
AS $$
DECLARE
  v_job public.invoice_sync_jobs%ROWTYPE;
  v_invoice public.sales_invoices%ROWTYPE;
  v_delay integer;
  v_event text;
BEGIN
  IF auth.role()<>'service_role' AND NOT public.rex_has_role(ARRAY['admin','accounting']) THEN
    RAISE EXCEPTION 'Bu işlem için yetkiniz bulunmuyor';
  END IF;
  IF p_status NOT IN (
    'submitted','official','failed','mapping_required','status_checked','cancelled','rejected'
  ) THEN
    RAISE EXCEPTION 'Geçersiz entegrasyon sonucu';
  END IF;

  SELECT * INTO v_job
  FROM public.invoice_sync_jobs
  WHERE id=p_job_id
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Kuyruk işi bulunamadı'; END IF;

  SELECT * INTO v_invoice
  FROM public.sales_invoices
  WHERE id=v_job.invoice_id
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Fatura bulunamadı'; END IF;

  PERFORM set_config('rex.invoice_sync','on',true);

  IF p_status IN ('submitted','official','status_checked','cancelled','rejected') THEN
    UPDATE public.invoice_sync_jobs
    SET status='completed',
        result=coalesce(p_result,'{}'::jsonb),
        completed_at=now(),
        locked_at=NULL,
        locked_by=NULL,
        last_error=CASE WHEN p_status='rejected' THEN left(coalesce(p_error,p_provider_status,'KolayBi e-belgesi reddedildi'),2000) ELSE NULL END,
        updated_at=now()
    WHERE id=p_job_id;

    UPDATE public.sales_invoices
    SET integration_status=CASE
          WHEN p_status='official' THEN 'official'
          WHEN p_status='cancelled' THEN 'cancelled'
          WHEN p_status='rejected' THEN 'failed'
          WHEN integration_status='official' THEN 'official'
          ELSE 'submitted'
        END,
        kolaybi_status=CASE
          WHEN p_status='official' THEN 'e_document_sent'
          WHEN p_status='cancelled' THEN 'provider_cancelled'
          WHEN p_status='rejected' THEN 'provider_rejected'
          ELSE 'created'
        END,
        kolaybi_document_id=coalesce(p_document_id,kolaybi_document_id),
        official_uuid=coalesce(nullif(trim(p_uuid),''),official_uuid),
        kolaybi_uuid=coalesce(nullif(trim(p_uuid),''),kolaybi_uuid),
        official_invoice_no=coalesce(nullif(trim(p_invoice_no),''),official_invoice_no),
        kolaybi_invoice_no=coalesce(nullif(trim(p_invoice_no),''),kolaybi_invoice_no),
        provider_status=coalesce(nullif(trim(p_provider_status),''),provider_status),
        pdf_url=coalesce(nullif(trim(p_pdf_url),''),pdf_url),
        kolaybi_synced_at=CASE WHEN p_status='official' THEN now() ELSE kolaybi_synced_at END,
        last_status_check_at=CASE WHEN v_job.job_type='status' THEN now() ELSE last_status_check_at END,
        kolaybi_error=CASE
          WHEN p_status='rejected' THEN left(coalesce(p_error,p_provider_status,'KolayBi e-belgesi reddedildi'),1000)
          ELSE NULL
        END,
        next_retry_at=NULL,
        updated_at=now()
    WHERE id=v_job.invoice_id;

    UPDATE public.shipments
    SET invoice_status=CASE
          WHEN p_status='official' THEN 'faturalandi'
          WHEN p_status='cancelled' THEN 'fatura_iptal'
          WHEN p_status='rejected' THEN 'fatura_hatasi'
          ELSE 'kolaybi_gonderildi'
        END,
        updated_at=now()
    WHERE sale_invoice_id=v_job.invoice_id;

    v_event:=CASE
      WHEN p_status='official' THEN 'invoice_official'
      WHEN p_status='cancelled' THEN 'invoice_cancelled'
      WHEN p_status='rejected' THEN 'kolaybi_sync_failed'
      WHEN p_status='status_checked' THEN 'invoice_status_checked'
      ELSE 'invoice_submitted'
    END;
  ELSE
    v_delay:=least(1440,(power(2,least(v_job.attempts,8))::integer)*5);

    UPDATE public.invoice_sync_jobs
    SET status=CASE WHEN p_retryable AND attempts<max_attempts THEN 'pending' ELSE 'dead' END,
        run_after=CASE
          WHEN p_retryable AND attempts<max_attempts THEN now()+make_interval(mins=>v_delay)
          ELSE run_after
        END,
        locked_at=NULL,
        locked_by=NULL,
        last_error=left(coalesce(p_error,'Bilinmeyen hata'),2000),
        updated_at=now()
    WHERE id=p_job_id;

    UPDATE public.sales_invoices
    SET integration_status=p_status,
        kolaybi_status=p_status,
        kolaybi_error=left(coalesce(p_error,'Bilinmeyen hata'),1000),
        next_retry_at=CASE
          WHEN p_retryable AND v_job.attempts<v_job.max_attempts THEN now()+make_interval(mins=>v_delay)
          ELSE NULL
        END,
        updated_at=now()
    WHERE id=v_job.invoice_id;

    UPDATE public.shipments
    SET invoice_status='fatura_hatasi',updated_at=now()
    WHERE sale_invoice_id=v_job.invoice_id;

    v_event:=CASE
      WHEN p_retryable AND v_job.attempts<v_job.max_attempts THEN 'invoice_retry_scheduled'
      ELSE 'kolaybi_sync_failed'
    END;
  END IF;

  INSERT INTO public.shipment_events(
    shipment_id,shipment_code,event_type,old_status,new_status,changed_fields,
    actor_id,actor_email,actor_role,source,note
  )
  SELECT
    s.id,
    s.shipment_code,
    v_event,
    s.status,
    s.status,
    jsonb_build_object(
      'invoice_id',v_job.invoice_id,
      'integration_status',p_status,
      'document_id',p_document_id,
      'invoice_no',p_invoice_no,
      'uuid',p_uuid,
      'provider_status',p_provider_status,
      'attempt',v_job.attempts
    ),
    auth.uid(),
    coalesce(auth.jwt()->>'email','system'),
    NULL,
    'kolaybi',
    CASE
      WHEN p_status='official' THEN 'KolayBi e-belgesi resmileşti'
      WHEN p_status='cancelled' THEN 'KolayBi e-belgesi sağlayıcıda iptal edildi'
      WHEN p_status='rejected' THEN 'KolayBi e-belgesi sağlayıcı tarafından reddedildi: '||left(coalesce(p_provider_status,p_error,''),500)
      WHEN p_status='submitted' THEN 'Fatura KolayBi’ye gönderildi'
      WHEN p_status='status_checked' THEN 'KolayBi fatura durumu güncellendi'
      WHEN p_retryable THEN 'KolayBi gönderimi başarısız; otomatik yeniden deneme planlandı: '||left(coalesce(p_error,''),500)
      ELSE 'KolayBi gönderimi durduruldu: '||left(coalesce(p_error,''),500)
    END
  FROM public.shipments s
  WHERE s.sale_invoice_id=v_job.invoice_id;
END
$$;

REVOKE ALL ON FUNCTION public.rex_queue_invoice_status_check(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.rex_queue_stale_invoice_status_checks(integer) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.rex_record_invoice_sync_result(uuid,text,boolean,text,bigint,text,text,text,text,jsonb) FROM PUBLIC,anon;

GRANT EXECUTE ON FUNCTION public.rex_queue_invoice_status_check(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_queue_stale_invoice_status_checks(integer) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.rex_record_invoice_sync_result(uuid,text,boolean,text,bigint,text,text,text,text,jsonb) TO authenticated,service_role;

COMMENT ON FUNCTION public.rex_queue_stale_invoice_status_checks(integer) IS
  'KolayBi’ye gönderilmiş ve son durumu eski olan faturalar için tekil durum sorguları kuyruğa ekler.';
