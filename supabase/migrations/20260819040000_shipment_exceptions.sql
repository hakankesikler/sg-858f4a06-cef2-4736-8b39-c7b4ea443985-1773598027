-- Shipment exception management with private evidence and immutable audit history.

ALTER TABLE public.shipment_events
  DROP CONSTRAINT IF EXISTS shipment_events_event_type_check;
ALTER TABLE public.shipment_events
  ADD CONSTRAINT shipment_events_event_type_check CHECK (event_type IN (
    'history_enabled','created','updated','assignment_changed','status_changed','driver_assigned','vehicle_assigned','started',
    'delivery_document_added','delivered','invoiced','invoice_unlinked','deleted',
    'owner_approved_edit','job_created','job_approved',
    'kolaybi_sync_started','kolaybi_sync_succeeded','kolaybi_sync_failed',
    'cancelled','revision_requested','revision_rejected','revision_applied','invoice_cancelled',
    'uetds_details_updated','uetds_queued','uetds_accepted','uetds_failed',
    'uetds_carrier_reference_recorded','uetds_cancellation_queued',
    'invoice_queued','invoice_submitted','invoice_official','invoice_retry_scheduled',
    'invoice_status_checked','invoice_refund_created',
    'exception_created','exception_resolved'
  ));

CREATE TABLE IF NOT EXISTS public.shipment_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES public.shipments(id) ON DELETE RESTRICT,
  shipment_code text NOT NULL,
  exception_type text NOT NULL CHECK (exception_type IN (
    'gecikme','arac_arizasi','hasarli_teslimat','eksik_teslimat',
    'teslim_edilemedi','iade','iptal'
  )),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved')),
  description text NOT NULL CHECK (length(trim(description)) >= 10),
  photo_urls text[] NOT NULL DEFAULT ARRAY[]::text[] CHECK (cardinality(photo_urls) <= 5),
  responsible_user_id uuid NOT NULL,
  responsible_email text NOT NULL,
  occurred_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  created_by_email text,
  resolved_at timestamptz,
  resolved_by uuid,
  resolved_by_email text,
  resolution_note text,
  CHECK (
    (status='open' AND resolved_at IS NULL AND resolved_by IS NULL) OR
    (status='resolved' AND resolved_at IS NOT NULL AND resolved_by IS NOT NULL AND length(trim(resolution_note)) >= 5)
  )
);

CREATE TABLE IF NOT EXISTS public.shipment_exception_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exception_id uuid NOT NULL REFERENCES public.shipment_exceptions(id) ON DELETE RESTRICT,
  shipment_id uuid NOT NULL REFERENCES public.shipments(id) ON DELETE RESTRICT,
  event_type text NOT NULL CHECK (event_type IN ('created','resolved')),
  event_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_id uuid,
  actor_email text,
  actor_role text,
  event_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shipment_exceptions_shipment_idx
  ON public.shipment_exceptions(shipment_id,status,occurred_at DESC);
CREATE INDEX IF NOT EXISTS shipment_exceptions_responsible_idx
  ON public.shipment_exceptions(responsible_user_id,status,occurred_at DESC);
CREATE INDEX IF NOT EXISTS shipment_exception_events_exception_idx
  ON public.shipment_exception_events(exception_id,event_at DESC);

ALTER TABLE public.shipment_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_exception_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY rex_shipment_exceptions_select ON public.shipment_exceptions
  FOR SELECT TO authenticated
  USING (public.rex_has_role(ARRAY['admin','operations']));
CREATE POLICY rex_shipment_exception_events_select ON public.shipment_exception_events
  FOR SELECT TO authenticated
  USING (public.rex_has_role(ARRAY['admin','operations']));

REVOKE ALL ON public.shipment_exceptions,public.shipment_exception_events FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.shipment_exceptions,public.shipment_exception_events TO authenticated;

CREATE OR REPLACE FUNCTION public.rex_block_exception_history_mutation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  RAISE EXCEPTION 'Sevkiyat istisna geçmişi değiştirilemez veya silinemez';
END $$;

DROP TRIGGER IF EXISTS rex_shipment_exception_events_append_only ON public.shipment_exception_events;
CREATE TRIGGER rex_shipment_exception_events_append_only
  BEFORE UPDATE OR DELETE ON public.shipment_exception_events
  FOR EACH ROW EXECUTE FUNCTION public.rex_block_exception_history_mutation();

INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES(
  'shipment-exception-documents','shipment-exception-documents',false,5242880,
  ARRAY['image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

DROP POLICY IF EXISTS rex_shipment_exception_documents_select ON storage.objects;
CREATE POLICY rex_shipment_exception_documents_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id='shipment-exception-documents'
    AND public.rex_has_role(ARRAY['admin','operations'])
  );

DROP POLICY IF EXISTS rex_shipment_exception_documents_insert ON storage.objects;
CREATE POLICY rex_shipment_exception_documents_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id='shipment-exception-documents'
    AND public.rex_has_role(ARRAY['admin','operations'])
    AND (storage.foldername(name))[1]='exceptions'
  );

CREATE OR REPLACE FUNCTION public.rex_exception_responsibles()
RETURNS TABLE(user_id uuid,email text,role text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
  SELECT r.user_id,r.email,r.role
  FROM public.app_user_roles r
  WHERE r.active=true AND r.role IN ('admin','operations')
    AND public.rex_has_role(ARRAY['admin','operations'])
  ORDER BY r.email;
$$;

CREATE OR REPLACE FUNCTION public.rex_create_shipment_exception(
  p_shipment_id uuid,
  p_exception_type text,
  p_description text,
  p_photo_urls text[],
  p_responsible_user_id uuid,
  p_occurred_at timestamptz
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
  v_shipment public.shipments%ROWTYPE;
  v_responsible_email text;
  v_actor_email text;
  v_actor_role text;
  v_id uuid;
  v_photo text;
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin','operations']) THEN RAISE EXCEPTION 'İstisna kaydı oluşturma yetkiniz bulunmuyor'; END IF;
  IF p_exception_type NOT IN ('gecikme','arac_arizasi','hasarli_teslimat','eksik_teslimat','teslim_edilemedi','iade','iptal') THEN
    RAISE EXCEPTION 'Geçersiz istisna türü';
  END IF;
  IF nullif(trim(p_description),'') IS NULL OR length(trim(p_description))<10 THEN
    RAISE EXCEPTION 'İstisna açıklaması en az 10 karakter olmalıdır';
  END IF;
  IF p_occurred_at IS NULL OR p_occurred_at>now()+interval '5 minutes' THEN RAISE EXCEPTION 'Geçerli olay tarihi ve saati zorunludur'; END IF;
  IF cardinality(coalesce(p_photo_urls,ARRAY[]::text[]))>5 THEN RAISE EXCEPTION 'En fazla 5 fotoğraf eklenebilir'; END IF;
  FOREACH v_photo IN ARRAY coalesce(p_photo_urls,ARRAY[]::text[]) LOOP
    IF v_photo !~ '^storage://shipment-exception-documents/exceptions/' THEN
      RAISE EXCEPTION 'İstisna fotoğraf adresi geçersiz';
    END IF;
  END LOOP;
  SELECT * INTO v_shipment FROM public.shipments WHERE id=p_shipment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sevkiyat bulunamadı'; END IF;
  SELECT r.email INTO v_responsible_email FROM public.app_user_roles r
  WHERE r.user_id=p_responsible_user_id AND r.active=true AND r.role IN ('admin','operations');
  IF NOT FOUND THEN RAISE EXCEPTION 'Aktif ve yetkili bir sorumlu kişi seçilmelidir'; END IF;
  SELECT r.email,r.role INTO v_actor_email,v_actor_role FROM public.app_user_roles r WHERE r.user_id=auth.uid() AND r.active=true LIMIT 1;

  IF p_exception_type='iptal' AND v_shipment.status NOT IN ('iptal','İptal') THEN
    PERFORM public.rex_cancel_shipment(p_shipment_id,trim(p_description));
  END IF;

  INSERT INTO public.shipment_exceptions(
    shipment_id,shipment_code,exception_type,description,photo_urls,responsible_user_id,
    responsible_email,occurred_at,created_by,created_by_email
  ) VALUES(
    p_shipment_id,v_shipment.shipment_code,p_exception_type,trim(p_description),coalesce(p_photo_urls,ARRAY[]::text[]),
    p_responsible_user_id,v_responsible_email,p_occurred_at,auth.uid(),coalesce(v_actor_email,auth.jwt()->>'email')
  ) RETURNING id INTO v_id;

  INSERT INTO public.shipment_exception_events(
    exception_id,shipment_id,event_type,event_data,actor_id,actor_email,actor_role
  ) VALUES(
    v_id,p_shipment_id,'created',jsonb_build_object(
      'exception_type',p_exception_type,'description',trim(p_description),
      'photo_count',cardinality(coalesce(p_photo_urls,ARRAY[]::text[])),
      'responsible_user_id',p_responsible_user_id,'responsible_email',v_responsible_email,
      'occurred_at',p_occurred_at
    ),auth.uid(),coalesce(v_actor_email,auth.jwt()->>'email'),v_actor_role
  );
  INSERT INTO public.shipment_events(
    shipment_id,shipment_code,event_type,old_status,new_status,changed_fields,
    actor_id,actor_email,actor_role,source,note
  ) VALUES(
    p_shipment_id,v_shipment.shipment_code,'exception_created',v_shipment.status,
    CASE WHEN p_exception_type='iptal' THEN 'iptal' ELSE v_shipment.status END,
    jsonb_build_object('exception_id',v_id,'exception_type',p_exception_type,'responsible_email',v_responsible_email,'photo_count',cardinality(coalesce(p_photo_urls,ARRAY[]::text[]))),
    auth.uid(),coalesce(v_actor_email,auth.jwt()->>'email'),v_actor_role,'portal',
    'Sevkiyat istisnası oluşturuldu: '||trim(p_description)
  );
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.rex_resolve_shipment_exception(p_exception_id uuid,p_resolution_note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
  v_exception public.shipment_exceptions%ROWTYPE;
  v_actor_email text;
  v_actor_role text;
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin','operations']) THEN RAISE EXCEPTION 'İstisna kaydını sonuçlandırma yetkiniz bulunmuyor'; END IF;
  IF nullif(trim(p_resolution_note),'') IS NULL OR length(trim(p_resolution_note))<5 THEN RAISE EXCEPTION 'Sonuç açıklaması en az 5 karakter olmalıdır'; END IF;
  SELECT * INTO v_exception FROM public.shipment_exceptions WHERE id=p_exception_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'İstisna kaydı bulunamadı'; END IF;
  IF v_exception.status<>'open' THEN RAISE EXCEPTION 'İstisna daha önce sonuçlandırılmış'; END IF;
  SELECT r.email,r.role INTO v_actor_email,v_actor_role FROM public.app_user_roles r WHERE r.user_id=auth.uid() AND r.active=true LIMIT 1;
  UPDATE public.shipment_exceptions SET
    status='resolved',resolved_at=now(),resolved_by=auth.uid(),resolved_by_email=coalesce(v_actor_email,auth.jwt()->>'email'),resolution_note=trim(p_resolution_note)
  WHERE id=p_exception_id;
  INSERT INTO public.shipment_exception_events(exception_id,shipment_id,event_type,event_data,actor_id,actor_email,actor_role)
  VALUES(p_exception_id,v_exception.shipment_id,'resolved',jsonb_build_object('resolution_note',trim(p_resolution_note)),auth.uid(),coalesce(v_actor_email,auth.jwt()->>'email'),v_actor_role);
  INSERT INTO public.shipment_events(
    shipment_id,shipment_code,event_type,changed_fields,actor_id,actor_email,actor_role,source,note
  ) VALUES(
    v_exception.shipment_id,v_exception.shipment_code,'exception_resolved',
    jsonb_build_object('exception_id',p_exception_id,'exception_type',v_exception.exception_type,'resolution_note',trim(p_resolution_note)),
    auth.uid(),coalesce(v_actor_email,auth.jwt()->>'email'),v_actor_role,'portal','Sevkiyat istisnası sonuçlandırıldı: '||trim(p_resolution_note)
  );
END $$;

REVOKE ALL ON FUNCTION public.rex_exception_responsibles() FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.rex_create_shipment_exception(uuid,text,text,text[],uuid,timestamptz) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.rex_resolve_shipment_exception(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rex_exception_responsibles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_create_shipment_exception(uuid,text,text,text[],uuid,timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_resolve_shipment_exception(uuid,text) TO authenticated;
