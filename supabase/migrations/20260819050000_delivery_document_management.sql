-- Secure delivery document packages: multiple files, typed reports, AV status,
-- previews through signed URLs and immutable version/event history.

CREATE TABLE IF NOT EXISTS public.delivery_document_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  scan_provider text NOT NULL DEFAULT 'cloudmersive',
  scan_enforcement_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.delivery_document_settings(id,scan_provider,scan_enforcement_enabled)
VALUES(true,'cloudmersive',false)
ON CONFLICT(id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.delivery_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES public.shipments(id) ON DELETE RESTRICT,
  document_type text NOT NULL,
  document_group_id uuid NOT NULL DEFAULT gen_random_uuid(),
  version_number integer NOT NULL DEFAULT 1 CHECK (version_number > 0),
  supersedes_document_id uuid REFERENCES public.delivery_documents(id) ON DELETE RESTRICT,
  is_active boolean NOT NULL DEFAULT true,
  file_reference text NOT NULL,
  original_file_name text NOT NULL,
  mime_type text NOT NULL,
  file_size bigint,
  sha256 text,
  notes text,
  scan_status text NOT NULL DEFAULT 'pending',
  scan_provider text,
  scan_result jsonb NOT NULL DEFAULT '{}'::jsonb,
  scanned_at timestamptz,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_by_email text,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT delivery_documents_type_check CHECK (
    document_type IN ('delivery_proof','damaged_delivery_report','partial_delivery_report','recipient_photo','other')
  ),
  CONSTRAINT delivery_documents_scan_check CHECK (
    scan_status IN ('pending','clean','infected','error','legacy_unscanned')
  ),
  CONSTRAINT delivery_documents_file_size_check CHECK (
    file_size IS NULL OR (file_size > 0 AND file_size <= 10485760)
  ),
  CONSTRAINT delivery_documents_sha_check CHECK (
    sha256 IS NULL OR sha256 ~ '^[a-f0-9]{64}$'
  ),
  CONSTRAINT delivery_documents_version_unique UNIQUE(document_group_id,version_number)
);

CREATE INDEX IF NOT EXISTS delivery_documents_shipment_idx
  ON public.delivery_documents(shipment_id,uploaded_at DESC);
CREATE INDEX IF NOT EXISTS delivery_documents_active_idx
  ON public.delivery_documents(shipment_id,is_active,document_type);

CREATE TABLE IF NOT EXISTS public.delivery_document_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.delivery_documents(id) ON DELETE RESTRICT,
  shipment_id uuid NOT NULL REFERENCES public.shipments(id) ON DELETE RESTRICT,
  event_type text NOT NULL CHECK (event_type IN ('uploaded','version_uploaded','scan_clean','scan_infected','scan_error')),
  event_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  actor_role text,
  event_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS delivery_document_events_document_idx
  ON public.delivery_document_events(document_id,event_at DESC);

CREATE OR REPLACE FUNCTION public.rex_block_delivery_document_event_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  RAISE EXCEPTION 'Teslim evrakı denetim kayıtları değiştirilemez veya silinemez';
END $$;

DROP TRIGGER IF EXISTS rex_delivery_document_events_append_only ON public.delivery_document_events;
CREATE TRIGGER rex_delivery_document_events_append_only
BEFORE UPDATE OR DELETE ON public.delivery_document_events
FOR EACH ROW EXECUTE FUNCTION public.rex_block_delivery_document_event_change();

ALTER TABLE public.delivery_document_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_document_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rex_delivery_document_settings_select ON public.delivery_document_settings;
CREATE POLICY rex_delivery_document_settings_select ON public.delivery_document_settings
FOR SELECT TO authenticated USING (public.rex_has_role(ARRAY['admin','operations']));

DROP POLICY IF EXISTS rex_delivery_documents_select ON public.delivery_documents;
CREATE POLICY rex_delivery_documents_select ON public.delivery_documents
FOR SELECT TO authenticated USING (
  public.rex_has_role(ARRAY['admin','operations'])
  OR (
    is_active=true
    AND scan_status IN ('clean','legacy_unscanned')
    AND EXISTS (
      SELECT 1 FROM public.customer_portal_users cpu
      JOIN public.shipments s ON s.id=delivery_documents.shipment_id AND s.customer_id=cpu.customer_id
      WHERE cpu.user_id=auth.uid() AND cpu.active=true
    )
  )
);

DROP POLICY IF EXISTS rex_delivery_document_events_select ON public.delivery_document_events;
CREATE POLICY rex_delivery_document_events_select ON public.delivery_document_events
FOR SELECT TO authenticated USING (public.rex_has_role(ARRAY['admin','operations']));

REVOKE ALL ON public.delivery_document_settings FROM PUBLIC,anon,authenticated;
REVOKE ALL ON public.delivery_documents FROM PUBLIC,anon,authenticated;
REVOKE ALL ON public.delivery_document_events FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.delivery_document_settings TO authenticated;
GRANT SELECT ON public.delivery_documents TO authenticated;
GRANT SELECT ON public.delivery_document_events TO authenticated;

-- Keep existing proof references available as explicit, visibly unscanned legacy versions.
INSERT INTO public.delivery_documents(
  shipment_id,document_type,document_group_id,version_number,is_active,file_reference,
  original_file_name,mime_type,file_size,sha256,notes,scan_status,uploaded_at
)
SELECT
  s.id,'delivery_proof',gen_random_uuid(),1,true,s.delivery_proof_url,
  coalesce(nullif(regexp_replace(s.delivery_proof_url,'^.*/',''),''),'eski-teslim-evraki'),
  CASE
    WHEN lower(s.delivery_proof_url) ~ '\\.pdf($|\\?)' THEN 'application/pdf'
    WHEN lower(s.delivery_proof_url) ~ '\\.png($|\\?)' THEN 'image/png'
    WHEN lower(s.delivery_proof_url) ~ '\\.webp($|\\?)' THEN 'image/webp'
    ELSE 'image/jpeg'
  END,
  NULL,NULL,'Yeni belge yönetimi öncesinde yüklenen evrak','legacy_unscanned',coalesce(s.updated_at,s.created_at,now())
FROM public.shipments s
WHERE s.delivery_proof_url IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.delivery_documents d
    WHERE d.shipment_id=s.id AND d.file_reference=s.delivery_proof_url
  );

UPDATE storage.buckets
SET public=false,
    file_size_limit=10485760,
    allowed_mime_types=ARRAY['application/pdf','image/jpeg','image/png','image/webp']
WHERE id='shipment-documents';

-- Delivery files are immutable. Only new objects under the controlled prefix may be uploaded.
DROP POLICY IF EXISTS rex_documents_insert ON storage.objects;
CREATE POLICY rex_documents_insert ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  public.rex_has_role(ARRAY['admin','operations'])
  AND (
    bucket_id IN ('driver-documents','vehicle-documents')
    OR (
      bucket_id='shipment-documents'
      AND (storage.foldername(name))[1]='delivery-documents'
      AND (storage.foldername(name))[2]=auth.uid()::text
    )
  )
);

DROP POLICY IF EXISTS rex_documents_update ON storage.objects;
CREATE POLICY rex_documents_update ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id IN ('driver-documents','vehicle-documents')
  AND public.rex_has_role(ARRAY['admin','operations'])
)
WITH CHECK (
  bucket_id IN ('driver-documents','vehicle-documents')
  AND public.rex_has_role(ARRAY['admin','operations'])
);

DROP POLICY IF EXISTS rex_documents_delete ON storage.objects;
CREATE POLICY rex_documents_delete ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id IN ('driver-documents','vehicle-documents')
  AND public.rex_has_role(ARRAY['admin','operations'])
);

CREATE OR REPLACE FUNCTION public.rex_register_delivery_document(
  p_shipment_id uuid,
  p_document_type text,
  p_file_reference text,
  p_original_file_name text,
  p_mime_type text,
  p_file_size bigint,
  p_sha256 text,
  p_notes text DEFAULT NULL,
  p_supersedes_document_id uuid DEFAULT NULL
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
  v_id uuid;
  v_actor_email text;
  v_actor_role text;
  v_previous public.delivery_documents%ROWTYPE;
  v_group uuid := gen_random_uuid();
  v_version integer := 1;
  v_active boolean := true;
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin','operations']) THEN
    RAISE EXCEPTION 'Teslim evrakı yükleme yetkiniz bulunmuyor';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM public.shipments WHERE id=p_shipment_id) THEN
    RAISE EXCEPTION 'Sevkiyat bulunamadı';
  END IF;
  IF p_document_type NOT IN ('delivery_proof','damaged_delivery_report','partial_delivery_report','recipient_photo','other') THEN
    RAISE EXCEPTION 'Geçersiz teslim evrakı türü';
  END IF;
  IF p_file_reference !~ '^storage://shipment-documents/delivery-documents/' THEN
    RAISE EXCEPTION 'Geçersiz veya güvenli olmayan dosya adresi';
  END IF;
  IF nullif(trim(p_original_file_name),'') IS NULL OR length(trim(p_original_file_name)) > 255 THEN
    RAISE EXCEPTION 'Dosya adı zorunludur ve 255 karakteri geçemez';
  END IF;
  IF p_mime_type NOT IN ('application/pdf','image/jpeg','image/png','image/webp') THEN
    RAISE EXCEPTION 'Yalnızca PDF, JPG, PNG veya WEBP dosyaları kabul edilir';
  END IF;
  IF p_file_size IS NULL OR p_file_size < 1 OR p_file_size > 10485760 THEN
    RAISE EXCEPTION 'Dosya boyutu 10 MB sınırını aşamaz';
  END IF;
  IF lower(coalesce(p_sha256,'')) !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'Dosya bütünlük özeti geçersiz';
  END IF;

  SELECT email,role INTO v_actor_email,v_actor_role
  FROM public.app_user_roles WHERE user_id=auth.uid() AND active=true LIMIT 1;

  IF p_supersedes_document_id IS NOT NULL THEN
    SELECT * INTO v_previous FROM public.delivery_documents
    WHERE id=p_supersedes_document_id AND shipment_id=p_shipment_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Önceki belge sürümü bulunamadı'; END IF;
    IF v_previous.document_type<>p_document_type THEN RAISE EXCEPTION 'Yeni sürümün belge türü değiştirilemez'; END IF;
    IF NOT v_previous.is_active THEN RAISE EXCEPTION 'Yalnızca etkin belge için yeni sürüm eklenebilir'; END IF;
    v_group:=v_previous.document_group_id;
    v_version:=v_previous.version_number+1;
    v_active:=false;
  END IF;

  INSERT INTO public.delivery_documents(
    shipment_id,document_type,document_group_id,version_number,supersedes_document_id,is_active,
    file_reference,original_file_name,mime_type,file_size,sha256,notes,scan_status,
    uploaded_by,uploaded_by_email
  ) VALUES (
    p_shipment_id,p_document_type,v_group,v_version,p_supersedes_document_id,v_active,
    trim(p_file_reference),trim(p_original_file_name),p_mime_type,p_file_size,lower(p_sha256),
    nullif(trim(p_notes),''),'pending',auth.uid(),coalesce(v_actor_email,auth.jwt()->>'email')
  ) RETURNING id INTO v_id;

  INSERT INTO public.delivery_document_events(
    document_id,shipment_id,event_type,event_data,actor_id,actor_email,actor_role
  ) VALUES (
    v_id,p_shipment_id,CASE WHEN p_supersedes_document_id IS NULL THEN 'uploaded' ELSE 'version_uploaded' END,
    jsonb_build_object('document_type',p_document_type,'version_number',v_version,'file_name',trim(p_original_file_name),'sha256',lower(p_sha256),'supersedes',p_supersedes_document_id),
    auth.uid(),coalesce(v_actor_email,auth.jwt()->>'email'),v_actor_role
  );

  INSERT INTO public.shipment_events(
    shipment_id,shipment_code,event_type,changed_fields,actor_id,actor_email,actor_role,source,note
  )
  SELECT s.id,s.shipment_code,'delivery_document_added',
    jsonb_build_object(
      'document_type',jsonb_build_object('old',NULL,'new',p_document_type),
      'file_name',jsonb_build_object('old',NULL,'new',trim(p_original_file_name)),
      'version_number',jsonb_build_object('old',NULL,'new',v_version)
    ),auth.uid(),coalesce(v_actor_email,auth.jwt()->>'email'),v_actor_role,'portal',
    CASE WHEN p_supersedes_document_id IS NULL THEN 'Teslimat belgesi yüklendi' ELSE 'Teslimat belgesinin yeni sürümü yüklendi' END
  FROM public.shipments s WHERE s.id=p_shipment_id;

  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.rex_record_delivery_document_scan(
  p_document_id uuid,
  p_status text,
  p_provider text,
  p_result jsonb DEFAULT '{}'::jsonb
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
  v_doc public.delivery_documents%ROWTYPE;
BEGIN
  IF auth.role()<>'service_role' THEN RAISE EXCEPTION 'Tarama sonucu yalnızca güvenli sunucu tarafından kaydedilebilir'; END IF;
  IF p_status NOT IN ('clean','infected','error') THEN RAISE EXCEPTION 'Geçersiz tarama sonucu'; END IF;
  SELECT * INTO v_doc FROM public.delivery_documents WHERE id=p_document_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Teslim evrakı bulunamadı'; END IF;

  UPDATE public.delivery_documents
  SET scan_status=p_status,scan_provider=nullif(trim(p_provider),''),scan_result=coalesce(p_result,'{}'::jsonb),scanned_at=now(),
      is_active=CASE WHEN p_status='infected' THEN false WHEN p_status='clean' THEN true ELSE is_active END
  WHERE id=p_document_id;

  IF p_status='clean' AND v_doc.supersedes_document_id IS NOT NULL THEN
    UPDATE public.delivery_documents SET is_active=false WHERE id=v_doc.supersedes_document_id;
  END IF;

  INSERT INTO public.delivery_document_events(document_id,shipment_id,event_type,event_data,actor_role)
  VALUES(p_document_id,v_doc.shipment_id,'scan_'||p_status,jsonb_build_object('provider',p_provider,'result',coalesce(p_result,'{}'::jsonb)),'service_role');
END $$;

CREATE OR REPLACE FUNCTION public.rex_mark_shipment_delivered_v2(
  p_shipment_id uuid,
  p_delivered_to text,
  p_delivery_date date,
  p_document_ids uuid[]
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
  v_status text;
  v_total integer;
  v_proof_count integer;
  v_infected integer;
  v_unclean integer;
  v_enforce boolean;
  v_primary text;
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin','operations']) THEN RAISE EXCEPTION 'Bu işlem için yetkiniz bulunmuyor'; END IF;
  IF nullif(trim(p_delivered_to),'') IS NULL OR p_delivery_date IS NULL OR coalesce(cardinality(p_document_ids),0)=0 THEN
    RAISE EXCEPTION 'Teslim alan, teslim tarihi ve en az bir teslim evrakı zorunludur';
  END IF;
  IF cardinality(p_document_ids)<>cardinality(ARRAY(SELECT DISTINCT unnest(p_document_ids))) THEN
    RAISE EXCEPTION 'Aynı teslim evrakı birden fazla seçilemez';
  END IF;

  SELECT status INTO v_status FROM public.shipments WHERE id=p_shipment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sevkiyat bulunamadı'; END IF;
  IF v_status NOT IN ('yolda','Yolda') THEN RAISE EXCEPTION 'Yalnızca yoldaki sevkiyat teslim edilebilir'; END IF;

  SELECT count(*),count(*) FILTER(WHERE document_type='delivery_proof'),
         count(*) FILTER(WHERE scan_status='infected'),count(*) FILTER(WHERE scan_status<>'clean')
    INTO v_total,v_proof_count,v_infected,v_unclean
  FROM public.delivery_documents
  WHERE shipment_id=p_shipment_id AND id=ANY(p_document_ids) AND is_active=true;

  IF v_total<>cardinality(p_document_ids) THEN RAISE EXCEPTION 'Seçilen belgeler sevkiyata ait veya etkin değil'; END IF;
  IF v_proof_count<1 THEN RAISE EXCEPTION 'En az bir belge Teslim Evrakı türünde olmalıdır'; END IF;
  IF v_infected>0 THEN RAISE EXCEPTION 'Zararlı olduğu belirlenen dosya ile teslimat tamamlanamaz'; END IF;

  SELECT scan_enforcement_enabled INTO v_enforce FROM public.delivery_document_settings WHERE id=true;
  IF coalesce(v_enforce,false) AND v_unclean>0 THEN
    RAISE EXCEPTION 'Virüs taraması tamamlanmayan belgelerle teslimat tamamlanamaz';
  END IF;

  SELECT file_reference INTO v_primary
  FROM public.delivery_documents
  WHERE shipment_id=p_shipment_id AND id=ANY(p_document_ids) AND document_type='delivery_proof'
  ORDER BY CASE WHEN scan_status='clean' THEN 0 ELSE 1 END,uploaded_at LIMIT 1;

  UPDATE public.shipments SET
    status='teslim_edildi',delivered_to=trim(p_delivered_to),delivery_date=p_delivery_date,
    actual_delivery_date=p_delivery_date::timestamp AT TIME ZONE 'Europe/Istanbul',
    delivery_proof_url=v_primary,invoice_status='beklemede',updated_at=now()
  WHERE id=p_shipment_id;
END $$;

-- Retire the single-URL completion path so document validation cannot be bypassed.
REVOKE ALL ON FUNCTION public.rex_mark_shipment_delivered(uuid,text,date,text) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.rex_is_delivered_proof_object(p_name text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.delivery_documents d
    JOIN public.shipments s ON s.id=d.shipment_id
    WHERE p_name<>'' AND s.status IN ('teslim_edildi','Teslim Edildi')
      AND d.is_active=true AND d.scan_status IN ('clean','legacy_unscanned')
      AND right(d.file_reference,length(p_name))=p_name
  );
$$;

DROP POLICY IF EXISTS rex_customer_delivery_proof_select ON storage.objects;
CREATE POLICY rex_customer_delivery_proof_select ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id='shipment-documents'
  AND EXISTS (
    SELECT 1 FROM public.delivery_documents d
    JOIN public.shipments s ON s.id=d.shipment_id
    JOIN public.customer_portal_users cpu ON cpu.customer_id=s.customer_id
    WHERE cpu.user_id=auth.uid() AND cpu.active=true
      AND d.is_active=true AND d.scan_status IN ('clean','legacy_unscanned')
      AND right(d.file_reference,length(storage.objects.name))=storage.objects.name
  )
);

REVOKE ALL ON FUNCTION public.rex_register_delivery_document(uuid,text,text,text,text,bigint,text,text,uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.rex_record_delivery_document_scan(uuid,text,text,jsonb) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.rex_mark_shipment_delivered_v2(uuid,text,date,uuid[]) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.rex_block_delivery_document_event_change() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rex_register_delivery_document(uuid,text,text,text,text,bigint,text,text,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_record_delivery_document_scan(uuid,text,text,jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.rex_mark_shipment_delivered_v2(uuid,text,date,uuid[]) TO authenticated;

