BEGIN;

ALTER TABLE public.kolaybi_sync_events
  DROP CONSTRAINT IF EXISTS kolaybi_sync_events_event_type_check;
ALTER TABLE public.kolaybi_sync_events
  ADD CONSTRAINT kolaybi_sync_events_event_type_check CHECK (event_type IN (
    'sync_started','record_matched','review_required','record_skipped',
    'sync_completed','sync_failed','manual_match','manual_ignore','mapping_reopened'
  ));

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
  IF p_action NOT IN ('match','ignore') THEN RAISE EXCEPTION 'Eşleştirme işlemi geçersiz'; END IF;

  SELECT * INTO v_record FROM public.kolaybi_master_records WHERE id=p_record_id FOR UPDATE;
  IF NOT FOUND OR v_record.resource_type NOT IN ('associate','product') THEN
    RAISE EXCEPTION 'Eşleştirilebilir KolayBi kaydı bulunamadı';
  END IF;

  IF p_action='ignore' THEN
    IF v_record.match_status='matched' THEN RAISE EXCEPTION 'Eşleşmiş kayıt doğrudan yok sayılamaz'; END IF;
    UPDATE public.kolaybi_master_records
      SET match_status='ignored',local_entity_type=NULL,local_entity_id=NULL
      WHERE id=v_record.id;
    INSERT INTO public.kolaybi_sync_events(resource_type,external_id,event_type,status,summary,metadata,actor_id,actor_email)
    VALUES(v_record.resource_type,v_record.external_id,'manual_ignore','warning',
      coalesce(v_record.display_name,v_record.external_id)||' kullanıcı kararıyla yok sayıldı',
      jsonb_build_object('record_id',v_record.id),auth.uid(),v_actor_email);
    RETURN jsonb_build_object('success',true,'record_id',v_record.id,'match_status','ignored');
  END IF;

  IF p_local_entity_id IS NULL THEN RAISE EXCEPTION 'Eşleştirilecek TMS kaydını seçin'; END IF;
  IF v_record.match_status='matched' THEN
    IF v_record.local_entity_id=p_local_entity_id THEN
      RETURN jsonb_build_object('success',true,'record_id',v_record.id,'match_status','matched',
        'local_entity_id',p_local_entity_id,'already_matched',true);
    END IF;
    RAISE EXCEPTION 'Eşleşmiş kayıt doğrudan değiştirilemez';
  END IF;

  -- Aynı yerel kayda eşzamanlı iki sağlayıcı kaydı bağlanmasını engeller.
  PERFORM pg_advisory_xact_lock(hashtextextended(v_record.resource_type||':'||p_local_entity_id::text,0));
  SELECT display_name INTO v_duplicate_name FROM public.kolaybi_master_records
    WHERE resource_type=v_record.resource_type AND local_entity_id=p_local_entity_id
      AND match_status='matched' AND id<>v_record.id LIMIT 1;
  IF FOUND THEN RAISE EXCEPTION 'Bu TMS kaydı zaten % ile eşleştirilmiş',coalesce(v_duplicate_name,'başka bir KolayBi kaydı'); END IF;
  IF v_record.external_id !~ '^[0-9]+$' THEN RAISE EXCEPTION 'KolayBi kayıt kimliği geçerli değil'; END IF;
  v_external_id := v_record.external_id::bigint;

  IF v_record.resource_type='associate' THEN
    SELECT * INTO v_customer FROM public.customers WHERE id=p_local_entity_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Seçilen TMS carisi bulunamadı'; END IF;
    SELECT nullif(item->>'id','')::bigint INTO v_address_id
      FROM jsonb_array_elements(CASE WHEN jsonb_typeof(v_record.payload->'address')='array' THEN v_record.payload->'address' ELSE '[]'::jsonb END) item
      ORDER BY CASE WHEN item->>'address_type'='invoice' THEN 0 ELSE 1 END LIMIT 1;
    UPDATE public.customers SET
      kolaybi_contact_id=v_external_id,
      kolaybi_address_id=coalesce(v_address_id,kolaybi_address_id)
      WHERE id=p_local_entity_id;
    UPDATE public.kolaybi_master_records SET
      match_status='matched',local_entity_type='customer',local_entity_id=p_local_entity_id
      WHERE id=v_record.id;
  ELSE
    SELECT * INTO v_product FROM public.products_services WHERE id=p_local_entity_id;
    IF NOT FOUND OR nullif(trim(v_product.code),'') IS NULL THEN RAISE EXCEPTION 'Seçilen ürün/hizmet kaydı bulunamadı veya kodu boş'; END IF;
    INSERT INTO public.invoice_product_mappings(product_code,kolaybi_product_id,description,vat_rate,active,updated_at)
    VALUES(v_product.code,v_external_id,coalesce(v_record.display_name,v_product.name),
      coalesce(nullif(v_record.payload->>'vat_value','')::numeric,v_product.tax_rate,0),true,now())
    ON CONFLICT (product_code) DO UPDATE SET
      kolaybi_product_id=EXCLUDED.kolaybi_product_id,description=EXCLUDED.description,
      vat_rate=EXCLUDED.vat_rate,active=true,updated_at=now();
    UPDATE public.kolaybi_master_records SET
      match_status='matched',local_entity_type='product',local_entity_id=p_local_entity_id
      WHERE id=v_record.id;
  END IF;

  INSERT INTO public.kolaybi_sync_events(resource_type,external_id,event_type,status,summary,metadata,actor_id,actor_email)
  VALUES(v_record.resource_type,v_record.external_id,'manual_match','success',
    coalesce(v_record.display_name,v_record.external_id)||' kullanıcı kararıyla TMS kaydına eşleştirildi',
    jsonb_build_object('record_id',v_record.id,'local_entity_id',p_local_entity_id),auth.uid(),v_actor_email);
  RETURN jsonb_build_object('success',true,'record_id',v_record.id,'match_status','matched','local_entity_id',p_local_entity_id);
END $$;

REVOKE ALL ON FUNCTION public.rex_resolve_kolaybi_mapping(uuid,text,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rex_resolve_kolaybi_mapping(uuid,text,uuid) TO authenticated;

COMMIT;
