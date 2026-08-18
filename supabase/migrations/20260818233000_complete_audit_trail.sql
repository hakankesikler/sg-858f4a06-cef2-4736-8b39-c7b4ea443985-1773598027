-- Complete, append-only operational audit trail for transport jobs, shipments,
-- delivery documents and KolayBi synchronization.

ALTER TABLE public.shipment_events
  ADD COLUMN IF NOT EXISTS source_event_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS shipment_events_source_event_unique
  ON public.shipment_events(source_event_id)
  WHERE source_event_id IS NOT NULL;

ALTER TABLE public.shipment_events
  DROP CONSTRAINT IF EXISTS shipment_events_event_type_check;
ALTER TABLE public.shipment_events
  ADD CONSTRAINT shipment_events_event_type_check CHECK (event_type IN (
    'history_enabled','created','updated','assignment_changed','status_changed',
    'delivery_document_added','delivered','invoiced','invoice_unlinked','deleted',
    'owner_approved_edit','job_created','job_approved',
    'kolaybi_sync_started','kolaybi_sync_succeeded','kolaybi_sync_failed'
  ));

CREATE TABLE IF NOT EXISTS public.transport_job_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  job_code text NOT NULL,
  shipment_id uuid,
  event_type text NOT NULL CHECK (event_type IN (
    'job_created','job_updated','job_approved','job_rejected','job_deleted'
  )),
  old_status text,
  new_status text,
  changed_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_id uuid,
  actor_email text,
  actor_role text,
  event_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'portal',
  note text
);

CREATE INDEX IF NOT EXISTS transport_job_events_job_idx
  ON public.transport_job_events(job_id,event_at DESC);
CREATE INDEX IF NOT EXISTS transport_job_events_code_idx
  ON public.transport_job_events(job_code,event_at DESC);

ALTER TABLE public.transport_job_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rex_transport_job_events_select ON public.transport_job_events;
CREATE POLICY rex_transport_job_events_select ON public.transport_job_events
  FOR SELECT TO authenticated
  USING (public.rex_has_role(ARRAY['admin','operations','accounting']));

REVOKE ALL ON public.transport_job_events FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.transport_job_events TO authenticated;

-- Work orders are written only through the guarded RPC functions. This prevents
-- submitted_by/approved_by fields from being silently overwritten by clients.
REVOKE INSERT,UPDATE,DELETE ON public.transport_jobs FROM authenticated;
GRANT SELECT ON public.transport_jobs TO authenticated;

CREATE OR REPLACE FUNCTION public.rex_audit_transport_job_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public,pg_temp
AS $$
DECLARE
  v_old jsonb := CASE WHEN TG_OP='INSERT' THEN '{}'::jsonb ELSE to_jsonb(OLD) END;
  v_new jsonb := CASE WHEN TG_OP='DELETE' THEN '{}'::jsonb ELSE to_jsonb(NEW) END;
  v_changes jsonb := '{}'::jsonb;
  v_type text;
  v_actor uuid := auth.uid();
  v_email text;
  v_role text;
  v_event_id uuid;
  v_note text;
BEGIN
  IF v_actor IS NOT NULL THEN
    SELECT email,role INTO v_email,v_role
    FROM public.app_user_roles
    WHERE user_id=v_actor AND active=true
    LIMIT 1;
    v_email := coalesce(v_email,auth.jwt()->>'email');
  END IF;

  IF TG_OP='INSERT' THEN
    v_type := 'job_created';
    v_changes := jsonb_build_object('new_record',v_new-ARRAY['created_at','updated_at']);
    v_note := 'İş emri '||NEW.job_code||' oluşturuldu';
  ELSIF TG_OP='DELETE' THEN
    v_type := 'job_deleted';
    v_changes := jsonb_build_object('deleted_record',v_old-ARRAY['created_at','updated_at']);
    v_note := 'İş emri '||OLD.job_code||' silindi';
  ELSE
    SELECT coalesce(jsonb_object_agg(key,jsonb_build_object('old',v_old->key,'new',value)),'{}'::jsonb)
    INTO v_changes
    FROM jsonb_each(v_new)
    WHERE key NOT IN ('created_at','updated_at')
      AND (v_old->key) IS DISTINCT FROM value;

    IF v_changes='{}'::jsonb THEN RETURN NEW; END IF;

    v_type := CASE
      WHEN OLD.status IS DISTINCT FROM NEW.status AND NEW.status='onaylandi' THEN 'job_approved'
      WHEN OLD.status IS DISTINCT FROM NEW.status AND NEW.status='reddedildi' THEN 'job_rejected'
      ELSE 'job_updated'
    END;
    v_note := CASE v_type
      WHEN 'job_approved' THEN 'İş emri '||NEW.job_code||' onaylandı'
      WHEN 'job_rejected' THEN 'İş emri '||NEW.job_code||' reddedildi: '||coalesce(NEW.rejection_reason,'Neden belirtilmedi')
      ELSE 'İş emri '||NEW.job_code||' güncellendi'
    END;
  END IF;

  INSERT INTO public.transport_job_events(
    job_id,job_code,shipment_id,event_type,old_status,new_status,changed_fields,
    actor_id,actor_email,actor_role,source,note
  ) VALUES (
    coalesce(NEW.id,OLD.id),coalesce(NEW.job_code,OLD.job_code),coalesce(NEW.shipment_id,OLD.shipment_id),v_type,
    CASE WHEN TG_OP='INSERT' THEN NULL ELSE OLD.status END,
    CASE WHEN TG_OP='DELETE' THEN NULL ELSE NEW.status END,
    v_changes,v_actor,v_email,v_role,
    CASE WHEN v_actor IS NULL THEN 'system' ELSE 'portal' END,v_note
  ) RETURNING id INTO v_event_id;

  -- Once a work order becomes a shipment, carry its immutable origin and
  -- approval events into the shipment timeline.
  IF TG_OP='UPDATE' AND NEW.shipment_id IS NOT NULL AND v_type='job_approved' THEN
    INSERT INTO public.shipment_events(
      shipment_id,shipment_code,event_type,old_status,new_status,changed_fields,
      actor_id,actor_email,actor_role,event_at,source,note,source_event_id
    )
    SELECT NEW.shipment_id,s.shipment_code,e.event_type,e.old_status,e.new_status,e.changed_fields,
           e.actor_id,e.actor_email,e.actor_role,e.event_at,'transport_job',e.note,e.id
    FROM public.transport_job_events e
    JOIN public.shipments s ON s.id=NEW.shipment_id
    WHERE e.job_id=NEW.id AND e.event_type IN ('job_created','job_approved')
    ON CONFLICT (source_event_id) WHERE source_event_id IS NOT NULL DO NOTHING;
  END IF;

  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS rex_transport_jobs_audit ON public.transport_jobs;
CREATE TRIGGER rex_transport_jobs_audit
AFTER INSERT OR UPDATE OR DELETE ON public.transport_jobs
FOR EACH ROW EXECUTE FUNCTION public.rex_audit_transport_job_change();

-- Reconstruct trustworthy baseline events for work orders created before this migration.
INSERT INTO public.transport_job_events(
  job_id,job_code,shipment_id,event_type,old_status,new_status,changed_fields,
  actor_id,actor_email,actor_role,event_at,source,note
)
SELECT j.id,j.job_code,j.shipment_id,'job_created',NULL,'onay_bekliyor',
       jsonb_build_object('job_code',jsonb_build_object('old',NULL,'new',j.job_code)),
       j.submitted_by,r.email,r.role,j.created_at,'migration','Geçmiş iş emri kaydı sisteme alındı'
FROM public.transport_jobs j
LEFT JOIN LATERAL (
  SELECT email,role FROM public.app_user_roles
  WHERE user_id=j.submitted_by AND active=true LIMIT 1
) r ON true
WHERE NOT EXISTS (
  SELECT 1 FROM public.transport_job_events e
  WHERE e.job_id=j.id AND e.event_type='job_created'
);

INSERT INTO public.transport_job_events(
  job_id,job_code,shipment_id,event_type,old_status,new_status,changed_fields,
  actor_id,actor_email,actor_role,event_at,source,note
)
SELECT j.id,j.job_code,j.shipment_id,
       CASE WHEN j.status='onaylandi' THEN 'job_approved' ELSE 'job_rejected' END,
       'onay_bekliyor',j.status,
       jsonb_build_object(
         'status',jsonb_build_object('old','onay_bekliyor','new',j.status),
         'rejection_reason',jsonb_build_object('old',NULL,'new',j.rejection_reason)
       ),
       j.approved_by,r.email,r.role,coalesce(j.approved_at,j.updated_at),'migration',
       CASE WHEN j.status='onaylandi' THEN 'Geçmiş iş emri onayı sisteme alındı'
            ELSE 'Geçmiş iş emri reddi sisteme alındı: '||coalesce(j.rejection_reason,'Neden belirtilmedi') END
FROM public.transport_jobs j
LEFT JOIN LATERAL (
  SELECT email,role FROM public.app_user_roles
  WHERE user_id=j.approved_by AND active=true LIMIT 1
) r ON true
WHERE j.status IN ('onaylandi','reddedildi')
  AND NOT EXISTS (
    SELECT 1 FROM public.transport_job_events e
    WHERE e.job_id=j.id AND e.event_type=CASE WHEN j.status='onaylandi' THEN 'job_approved' ELSE 'job_rejected' END
  );

INSERT INTO public.shipment_events(
  shipment_id,shipment_code,event_type,old_status,new_status,changed_fields,
  actor_id,actor_email,actor_role,event_at,source,note,source_event_id
)
SELECT j.shipment_id,s.shipment_code,e.event_type,e.old_status,e.new_status,e.changed_fields,
       e.actor_id,e.actor_email,e.actor_role,e.event_at,'transport_job',e.note,e.id
FROM public.transport_job_events e
JOIN public.transport_jobs j ON j.id=e.job_id
JOIN public.shipments s ON s.id=j.shipment_id
WHERE j.shipment_id IS NOT NULL AND e.event_type IN ('job_created','job_approved')
ON CONFLICT (source_event_id) WHERE source_event_id IS NOT NULL DO NOTHING;

-- Delivery and proof upload happen in one transaction. Preserve both as distinct
-- events instead of hiding the document action inside the delivered event.
CREATE OR REPLACE FUNCTION public.rex_audit_delivery_document_with_delivery()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public,pg_temp
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_email text;
  v_role text;
BEGIN
  IF v_actor IS NOT NULL THEN
    SELECT email,role INTO v_email,v_role
    FROM public.app_user_roles
    WHERE user_id=v_actor AND active=true LIMIT 1;
    v_email := coalesce(v_email,auth.jwt()->>'email');
  END IF;

  INSERT INTO public.shipment_events(
    shipment_id,shipment_code,event_type,old_status,new_status,changed_fields,
    actor_id,actor_email,actor_role,source,note
  ) VALUES (
    NEW.id,NEW.shipment_code,'delivery_document_added',OLD.status,NEW.status,
    jsonb_build_object('delivery_proof_url',jsonb_build_object('old',OLD.delivery_proof_url,'new',NEW.delivery_proof_url)),
    v_actor,v_email,v_role,CASE WHEN v_actor IS NULL THEN 'system' ELSE 'portal' END,
    'Teslim evrakı yüklenerek teslimat tamamlandı'
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS rex_delivery_document_with_delivery_audit ON public.shipments;
CREATE TRIGGER rex_delivery_document_with_delivery_audit
AFTER UPDATE OF delivery_proof_url,status ON public.shipments
FOR EACH ROW
WHEN (
  OLD.delivery_proof_url IS DISTINCT FROM NEW.delivery_proof_url
  AND NEW.delivery_proof_url IS NOT NULL
  AND OLD.status IS DISTINCT FROM NEW.status
)
EXECUTE FUNCTION public.rex_audit_delivery_document_with_delivery();

CREATE OR REPLACE FUNCTION public.rex_record_kolaybi_sync(
  p_invoice_id uuid,
  p_status text,
  p_document_id bigint DEFAULT NULL,
  p_error text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public,pg_temp
AS $$
DECLARE
  v_invoice public.sales_invoices%ROWTYPE;
  v_actor uuid := auth.uid();
  v_email text;
  v_role text;
  v_event_type text;
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin','accounting']) THEN
    RAISE EXCEPTION 'KolayBi işlemi için yetkiniz bulunmuyor';
  END IF;
  IF p_status NOT IN ('started','created','e_document_sent','mapping_required','failed') THEN
    RAISE EXCEPTION 'Geçersiz KolayBi işlem durumu';
  END IF;

  SELECT * INTO v_invoice FROM public.sales_invoices WHERE id=p_invoice_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Fatura bulunamadı'; END IF;

  SELECT email,role INTO v_email,v_role
  FROM public.app_user_roles
  WHERE user_id=v_actor AND active=true LIMIT 1;
  v_email := coalesce(v_email,auth.jwt()->>'email');

  UPDATE public.sales_invoices
  SET kolaybi_status=p_status,
      kolaybi_document_id=coalesce(p_document_id,kolaybi_document_id),
      kolaybi_synced_at=CASE WHEN p_status IN ('created','e_document_sent') THEN now() ELSE kolaybi_synced_at END,
      kolaybi_error=CASE WHEN p_status IN ('mapping_required','failed') THEN left(coalesce(p_error,'Bilinmeyen hata'),1000) ELSE NULL END
  WHERE id=p_invoice_id;

  v_event_type := CASE
    WHEN p_status='started' THEN 'kolaybi_sync_started'
    WHEN p_status IN ('created','e_document_sent') THEN 'kolaybi_sync_succeeded'
    ELSE 'kolaybi_sync_failed'
  END;

  INSERT INTO public.shipment_events(
    shipment_id,shipment_code,event_type,old_status,new_status,changed_fields,
    actor_id,actor_email,actor_role,source,note
  )
  SELECT s.id,s.shipment_code,v_event_type,s.status,s.status,
         jsonb_build_object(
           'kolaybi_status',jsonb_build_object('old',v_invoice.kolaybi_status,'new',p_status),
           'kolaybi_document_id',jsonb_build_object('old',v_invoice.kolaybi_document_id,'new',p_document_id)
         ),
         v_actor,v_email,v_role,'kolaybi',
         CASE
           WHEN p_status='started' THEN 'KolayBi fatura aktarımı başlatıldı'
           WHEN p_status IN ('created','e_document_sent') THEN 'KolayBi fatura aktarımı tamamlandı'
           WHEN p_status='mapping_required' THEN 'KolayBi cari eşlemesi eksik: '||left(coalesce(p_error,''),500)
           ELSE 'KolayBi fatura aktarımı başarısız: '||left(coalesce(p_error,''),500)
         END
  FROM public.shipments s
  WHERE s.sale_invoice_id=p_invoice_id;
END $$;

REVOKE ALL ON FUNCTION public.rex_record_kolaybi_sync(uuid,text,bigint,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rex_record_kolaybi_sync(uuid,text,bigint,text) TO authenticated;

-- Application and elevated API sessions cannot rewrite or delete audit rows.
CREATE OR REPLACE FUNCTION public.rex_reject_audit_event_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path=public,pg_temp
AS $$
BEGIN
  RAISE EXCEPTION 'Denetim kayıtları değiştirilemez veya silinemez';
END $$;

DROP TRIGGER IF EXISTS rex_shipment_events_append_only ON public.shipment_events;
CREATE TRIGGER rex_shipment_events_append_only
BEFORE UPDATE OR DELETE ON public.shipment_events
FOR EACH ROW EXECUTE FUNCTION public.rex_reject_audit_event_mutation();

DROP TRIGGER IF EXISTS rex_transport_job_events_append_only ON public.transport_job_events;
CREATE TRIGGER rex_transport_job_events_append_only
BEFORE UPDATE OR DELETE ON public.transport_job_events
FOR EACH ROW EXECUTE FUNCTION public.rex_reject_audit_event_mutation();

REVOKE ALL ON FUNCTION public.rex_audit_transport_job_change() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rex_audit_delivery_document_with_delivery() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rex_reject_audit_event_mutation() FROM PUBLIC;
