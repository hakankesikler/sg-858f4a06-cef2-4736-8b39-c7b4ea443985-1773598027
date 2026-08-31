BEGIN;

-- Sandbox ve canlı kayıtları aynı KolayBi kimliğini taşıyabilir. Sağlayıcı
-- aynası ile senkronizasyon geçmişi bu nedenle ortam bazında ayrılır.
ALTER TABLE public.kolaybi_master_records
  ADD COLUMN IF NOT EXISTS provider_environment text NOT NULL DEFAULT 'test';
ALTER TABLE public.kolaybi_master_records
  DROP CONSTRAINT IF EXISTS kolaybi_master_records_provider_environment_check;
ALTER TABLE public.kolaybi_master_records
  ADD CONSTRAINT kolaybi_master_records_provider_environment_check
  CHECK (provider_environment IN ('test','live'));
ALTER TABLE public.kolaybi_master_records
  DROP CONSTRAINT IF EXISTS kolaybi_master_records_resource_type_external_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS kolaybi_master_records_environment_resource_uidx
  ON public.kolaybi_master_records(provider_environment,resource_type,external_id);

ALTER TABLE public.kolaybi_sync_runs
  ADD COLUMN IF NOT EXISTS provider_environment text NOT NULL DEFAULT 'test';
ALTER TABLE public.kolaybi_sync_runs
  DROP CONSTRAINT IF EXISTS kolaybi_sync_runs_provider_environment_check;
ALTER TABLE public.kolaybi_sync_runs
  ADD CONSTRAINT kolaybi_sync_runs_provider_environment_check
  CHECK (provider_environment IN ('test','live'));

ALTER TABLE public.kolaybi_sync_events
  ADD COLUMN IF NOT EXISTS provider_environment text NOT NULL DEFAULT 'test';
ALTER TABLE public.kolaybi_sync_events
  DROP CONSTRAINT IF EXISTS kolaybi_sync_events_provider_environment_check;
ALTER TABLE public.kolaybi_sync_events
  ADD CONSTRAINT kolaybi_sync_events_provider_environment_check
  CHECK (provider_environment IN ('test','live'));
ALTER TABLE public.kolaybi_sync_events
  DROP CONSTRAINT IF EXISTS kolaybi_sync_events_event_type_check;
ALTER TABLE public.kolaybi_sync_events
  ADD CONSTRAINT kolaybi_sync_events_event_type_check CHECK (event_type IN (
    'sync_started','record_matched','review_required','record_skipped',
    'sync_completed','sync_failed','manual_match','manual_ignore','mapping_reopened',
    'product_imported_pending','product_sync_updated','product_approved','product_rejected'
  ));

-- REX ürün kartında sağlayıcı kimliği tutulur; API anahtarı veya başka bir
-- gizli bilgi kesinlikle bu tabloya yazılmaz.
ALTER TABLE public.products_services
  ADD COLUMN IF NOT EXISTS external_source text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS provider_environment text,
  ADD COLUMN IF NOT EXISTS kolaybi_product_id bigint,
  ADD COLUMN IF NOT EXISTS provider_code text,
  ADD COLUMN IF NOT EXISTS provider_barcode text,
  ADD COLUMN IF NOT EXISTS purchase_currency text,
  ADD COLUMN IF NOT EXISTS sale_currency text,
  ADD COLUMN IF NOT EXISTS provider_active boolean,
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;

ALTER TABLE public.products_services
  DROP CONSTRAINT IF EXISTS products_services_external_source_check;
ALTER TABLE public.products_services
  ADD CONSTRAINT products_services_external_source_check
  CHECK (external_source IN ('manual','kolaybi'));
ALTER TABLE public.products_services
  DROP CONSTRAINT IF EXISTS products_services_provider_environment_check;
ALTER TABLE public.products_services
  ADD CONSTRAINT products_services_provider_environment_check
  CHECK (provider_environment IS NULL OR provider_environment IN ('test','live'));
ALTER TABLE public.products_services
  DROP CONSTRAINT IF EXISTS products_services_approval_status_check;
ALTER TABLE public.products_services
  ADD CONSTRAINT products_services_approval_status_check
  CHECK (approval_status IN ('not_required','pending','approved','rejected'));

CREATE UNIQUE INDEX IF NOT EXISTS products_services_kolaybi_identity_uidx
  ON public.products_services(provider_environment,kolaybi_product_id)
  WHERE external_source='kolaybi' AND kolaybi_product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS products_services_kolaybi_review_idx
  ON public.products_services(approval_status,provider_environment,last_synced_at DESC)
  WHERE external_source='kolaybi';

CREATE OR REPLACE FUNCTION public.rex_review_kolaybi_product(
  p_record_id uuid,
  p_decision text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public,pg_temp
AS $$
DECLARE
  v_record public.kolaybi_master_records%ROWTYPE;
  v_product public.products_services%ROWTYPE;
  v_actor_email text := lower(coalesce(auth.jwt()->>'email',''));
BEGIN
  IF NOT public.rex_has_permission('integrations.connections','manage') THEN
    RAISE EXCEPTION 'KolayBi ürün aktarımını yönetme yetkiniz yok';
  END IF;
  IF p_decision NOT IN ('approve','reject') THEN
    RAISE EXCEPTION 'Ürün onay kararı geçersiz';
  END IF;

  SELECT * INTO v_record
    FROM public.kolaybi_master_records
    WHERE id=p_record_id AND resource_type='product'
    FOR UPDATE;
  IF NOT FOUND OR v_record.local_entity_id IS NULL THEN
    RAISE EXCEPTION 'Onaylanabilir KolayBi ürün kaydı bulunamadı';
  END IF;

  SELECT * INTO v_product
    FROM public.products_services
    WHERE id=v_record.local_entity_id AND external_source='kolaybi'
    FOR UPDATE;
  IF NOT FOUND OR v_product.provider_environment<>v_record.provider_environment THEN
    RAISE EXCEPTION 'KolayBi ürün kartı ile ortam bilgisi eşleşmiyor';
  END IF;

  IF p_decision='approve' THEN
    UPDATE public.products_services SET
      approval_status='approved',
      is_active=coalesce(provider_active,true),
      updated_at=now()
      WHERE id=v_product.id;
    UPDATE public.kolaybi_master_records SET match_status='matched'
      WHERE id=v_record.id;
    INSERT INTO public.invoice_product_mappings(
      product_code,kolaybi_product_id,description,vat_rate,active,updated_at
    ) VALUES (
      v_product.code,v_record.external_id::bigint,
      coalesce(v_record.display_name,v_product.name),coalesce(v_product.tax_rate,0),true,now()
    )
    ON CONFLICT (product_code) DO UPDATE SET
      kolaybi_product_id=EXCLUDED.kolaybi_product_id,
      description=EXCLUDED.description,
      vat_rate=EXCLUDED.vat_rate,
      active=true,
      updated_at=now();
  ELSE
    UPDATE public.products_services SET
      approval_status='rejected',is_active=false,updated_at=now()
      WHERE id=v_product.id;
    UPDATE public.kolaybi_master_records SET match_status='ignored'
      WHERE id=v_record.id;
  END IF;

  INSERT INTO public.kolaybi_sync_events(
    resource_type,external_id,provider_environment,event_type,status,summary,
    metadata,actor_id,actor_email
  ) VALUES (
    'product',v_record.external_id,v_record.provider_environment,
    CASE WHEN p_decision='approve' THEN 'product_approved' ELSE 'product_rejected' END,
    CASE WHEN p_decision='approve' THEN 'success' ELSE 'warning' END,
    coalesce(v_record.display_name,v_record.external_id)||
      CASE WHEN p_decision='approve' THEN ' kullanıma açıldı' ELSE ' reddedildi ve pasif bırakıldı' END,
    jsonb_build_object('record_id',v_record.id,'local_entity_id',v_product.id),
    auth.uid(),v_actor_email
  );

  RETURN jsonb_build_object(
    'success',true,'record_id',v_record.id,'local_entity_id',v_product.id,
    'decision',p_decision
  );
END $$;

REVOKE ALL ON FUNCTION public.rex_review_kolaybi_product(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rex_review_kolaybi_product(uuid,text) TO authenticated;

-- Manuel eşleştirme aynı TMS kartının test ve canlı KolayBi kayıtlarına ayrı
-- ayrı bağlanmasına izin verir; aynı ortam içindeki çift eşleşmeyi yine engeller.
CREATE OR REPLACE FUNCTION public.rex_resolve_kolaybi_mapping(
  p_record_id uuid,
  p_action text,
  p_local_entity_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public,pg_temp
AS $$
DECLARE
  v_record public.kolaybi_master_records%ROWTYPE;
  v_product public.products_services%ROWTYPE;
  v_customer public.customers%ROWTYPE;
  v_duplicate_name text;
  v_external_id bigint;
  v_address_id bigint;
  v_actor_email text := lower(coalesce(auth.jwt()->>'email',''));
BEGIN
  IF NOT public.rex_has_permission('integrations.connections','manage') THEN
    RAISE EXCEPTION 'KolayBi eşleştirmelerini yönetme yetkiniz yok';
  END IF;
  IF p_action NOT IN ('match','ignore') THEN
    RAISE EXCEPTION 'Eşleştirme işlemi geçersiz';
  END IF;

  SELECT * INTO v_record FROM public.kolaybi_master_records
    WHERE id=p_record_id FOR UPDATE;
  IF NOT FOUND OR v_record.resource_type NOT IN ('associate','product') THEN
    RAISE EXCEPTION 'Eşleştirilebilir KolayBi kaydı bulunamadı';
  END IF;

  IF p_action='ignore' THEN
    IF v_record.match_status='matched' THEN
      RAISE EXCEPTION 'Eşleşmiş kayıt doğrudan yok sayılamaz';
    END IF;
    UPDATE public.kolaybi_master_records SET
      match_status='ignored',local_entity_type=NULL,local_entity_id=NULL
      WHERE id=v_record.id;
    INSERT INTO public.kolaybi_sync_events(
      resource_type,external_id,provider_environment,event_type,status,summary,
      metadata,actor_id,actor_email
    ) VALUES (
      v_record.resource_type,v_record.external_id,v_record.provider_environment,
      'manual_ignore','warning',
      coalesce(v_record.display_name,v_record.external_id)||' kullanıcı kararıyla yok sayıldı',
      jsonb_build_object('record_id',v_record.id),auth.uid(),v_actor_email
    );
    RETURN jsonb_build_object('success',true,'record_id',v_record.id,'match_status','ignored');
  END IF;

  IF p_local_entity_id IS NULL THEN
    RAISE EXCEPTION 'Eşleştirilecek TMS kaydını seçin';
  END IF;
  IF v_record.match_status='matched' THEN
    IF v_record.local_entity_id=p_local_entity_id THEN
      RETURN jsonb_build_object(
        'success',true,'record_id',v_record.id,'match_status','matched',
        'local_entity_id',p_local_entity_id,'already_matched',true
      );
    END IF;
    RAISE EXCEPTION 'Eşleşmiş kayıt doğrudan değiştirilemez';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(
    v_record.provider_environment||':'||v_record.resource_type||':'||p_local_entity_id::text,0
  ));
  SELECT display_name INTO v_duplicate_name FROM public.kolaybi_master_records
    WHERE provider_environment=v_record.provider_environment
      AND resource_type=v_record.resource_type
      AND local_entity_id=p_local_entity_id
      AND match_status='matched' AND id<>v_record.id
    LIMIT 1;
  IF FOUND THEN
    RAISE EXCEPTION 'Bu TMS kaydı bu ortamda zaten % ile eşleştirilmiş',
      coalesce(v_duplicate_name,'başka bir KolayBi kaydı');
  END IF;
  IF v_record.external_id !~ '^[0-9]+$' THEN
    RAISE EXCEPTION 'KolayBi kayıt kimliği geçerli değil';
  END IF;
  v_external_id := v_record.external_id::bigint;

  IF v_record.resource_type='associate' THEN
    SELECT * INTO v_customer FROM public.customers WHERE id=p_local_entity_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Seçilen TMS carisi bulunamadı'; END IF;
    SELECT nullif(item->>'id','')::bigint INTO v_address_id
      FROM jsonb_array_elements(
        CASE WHEN jsonb_typeof(v_record.payload->'address')='array'
          THEN v_record.payload->'address' ELSE '[]'::jsonb END
      ) item
      ORDER BY CASE WHEN item->>'address_type'='invoice' THEN 0 ELSE 1 END
      LIMIT 1;
    UPDATE public.customers SET
      kolaybi_contact_id=v_external_id,
      kolaybi_address_id=coalesce(v_address_id,kolaybi_address_id)
      WHERE id=p_local_entity_id;
    UPDATE public.kolaybi_master_records SET
      match_status='matched',local_entity_type='customer',local_entity_id=p_local_entity_id
      WHERE id=v_record.id;
  ELSE
    SELECT * INTO v_product FROM public.products_services WHERE id=p_local_entity_id;
    IF NOT FOUND OR nullif(trim(v_product.code),'') IS NULL THEN
      RAISE EXCEPTION 'Seçilen ürün/hizmet kaydı bulunamadı veya kodu boş';
    END IF;
    INSERT INTO public.invoice_product_mappings(
      product_code,kolaybi_product_id,description,vat_rate,active,updated_at
    ) VALUES (
      v_product.code,v_external_id,coalesce(v_record.display_name,v_product.name),
      coalesce(nullif(v_record.payload->>'vat_value','')::numeric,v_product.tax_rate,0),
      true,now()
    )
    ON CONFLICT (product_code) DO UPDATE SET
      kolaybi_product_id=EXCLUDED.kolaybi_product_id,
      description=EXCLUDED.description,
      vat_rate=EXCLUDED.vat_rate,
      active=true,
      updated_at=now();
    UPDATE public.kolaybi_master_records SET
      match_status='matched',local_entity_type='product',local_entity_id=p_local_entity_id
      WHERE id=v_record.id;
  END IF;

  INSERT INTO public.kolaybi_sync_events(
    resource_type,external_id,provider_environment,event_type,status,summary,
    metadata,actor_id,actor_email
  ) VALUES (
    v_record.resource_type,v_record.external_id,v_record.provider_environment,
    'manual_match','success',
    coalesce(v_record.display_name,v_record.external_id)||' kullanıcı kararıyla TMS kaydına eşleştirildi',
    jsonb_build_object('record_id',v_record.id,'local_entity_id',p_local_entity_id),
    auth.uid(),v_actor_email
  );
  RETURN jsonb_build_object(
    'success',true,'record_id',v_record.id,'match_status','matched',
    'local_entity_id',p_local_entity_id
  );
END $$;

REVOKE ALL ON FUNCTION public.rex_resolve_kolaybi_mapping(uuid,text,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rex_resolve_kolaybi_mapping(uuid,text,uuid) TO authenticated;

COMMIT;
