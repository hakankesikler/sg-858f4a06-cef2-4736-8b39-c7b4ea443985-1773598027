BEGIN;

-- Removal withdraws a document from the delivery package, retaining its audit trail.
ALTER TABLE public.delivery_documents
  ADD COLUMN IF NOT EXISTS removed_at timestamptz,
  ADD COLUMN IF NOT EXISTS removed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.delivery_documents
  ADD CONSTRAINT delivery_documents_removed_inactive CHECK (removed_at IS NULL OR NOT is_active);
ALTER TABLE public.delivery_document_events DROP CONSTRAINT delivery_document_events_event_type_check;
ALTER TABLE public.delivery_document_events ADD CONSTRAINT delivery_document_events_event_type_check
  CHECK (event_type IN ('uploaded','version_uploaded','scan_clean','scan_infected','scan_error','removed'));

-- Internal helper: never change delivery status, recipient, dates or accounting fields.
CREATE OR REPLACE FUNCTION public.rex_refresh_delivery_proof(p_shipment_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_reference text;
BEGIN
  SELECT file_reference INTO v_reference FROM public.delivery_documents
  WHERE shipment_id=p_shipment_id AND document_type='delivery_proof'
    AND is_active AND removed_at IS NULL AND scan_status IN ('clean','legacy_unscanned')
  ORDER BY uploaded_at DESC,version_number DESC,id DESC LIMIT 1;
  UPDATE public.shipments SET delivery_proof_url=v_reference
  WHERE id=p_shipment_id AND status IN ('teslim_edildi','Teslim Edildi')
    AND delivery_proof_url IS DISTINCT FROM v_reference;
END $$;
REVOKE ALL ON FUNCTION public.rex_refresh_delivery_proof(uuid) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.rex_remove_delivery_document(p_document_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
  v_doc public.delivery_documents%ROWTYPE;
  v_shipment_id uuid;
  v_email text;
  v_role text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.rex_has_permission('operations.delivery','manage')
     OR NOT public.rex_has_permission('operations.shipments','manage') THEN
    RAISE EXCEPTION 'Evrak kaldırmak için sevkiyat ve teslim evrağı düzenleme yetkisi gerekir';
  END IF;
  SELECT shipment_id INTO v_shipment_id FROM public.delivery_documents WHERE id=p_document_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Teslim evrakı bulunamadı'; END IF;
  -- Consistent lock order for uploads, scans and removals of the same shipment.
  PERFORM 1 FROM public.shipments WHERE id=v_shipment_id FOR UPDATE;
  SELECT * INTO v_doc FROM public.delivery_documents WHERE id=p_document_id FOR UPDATE;
  IF v_doc.removed_at IS NOT NULL THEN RETURN; END IF;
  SELECT email,role INTO v_email,v_role FROM public.app_user_roles
  WHERE user_id=auth.uid() AND active=true LIMIT 1;
  UPDATE public.delivery_documents SET is_active=false,removed_at=now(),removed_by=auth.uid()
  WHERE id=p_document_id;
  PERFORM public.rex_refresh_delivery_proof(v_shipment_id);
  INSERT INTO public.delivery_document_events(document_id,shipment_id,event_type,event_data,actor_id,actor_email,actor_role)
  VALUES(p_document_id,v_shipment_id,'removed',
    jsonb_build_object('file_name',v_doc.original_file_name,'version_number',v_doc.version_number),
    auth.uid(),coalesce(v_email,auth.jwt()->>'email'),v_role);
  INSERT INTO public.shipment_events(shipment_id,shipment_code,event_type,changed_fields,actor_id,actor_email,actor_role,source,note)
  SELECT id,shipment_code,'updated',
    jsonb_build_object('delivery_document_removed',jsonb_build_object('old',v_doc.original_file_name,'new',NULL)),
    auth.uid(),coalesce(v_email,auth.jwt()->>'email'),v_role,'portal','Yanlış teslim evrakı kaldırıldı; yeni evrak yüklenebilir'
  FROM public.shipments WHERE id=v_shipment_id;
END $$;
REVOKE ALL ON FUNCTION public.rex_remove_delivery_document(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rex_remove_delivery_document(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.rex_record_delivery_document_scan(
  p_document_id uuid,p_status text,p_provider text,p_result jsonb DEFAULT '{}'::jsonb
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
  v_doc public.delivery_documents%ROWTYPE;
  v_shipment_id uuid;
  v_activate boolean;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Tarama sonucu yalnızca güvenli sunucu tarafından kaydedilebilir'; END IF;
  IF p_status IS NULL OR p_status NOT IN ('clean','infected','error') THEN RAISE EXCEPTION 'Geçersiz tarama sonucu'; END IF;
  SELECT shipment_id INTO v_shipment_id FROM public.delivery_documents WHERE id=p_document_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Teslim evrakı bulunamadı'; END IF;
  PERFORM 1 FROM public.shipments WHERE id=v_shipment_id FOR UPDATE;
  SELECT * INTO v_doc FROM public.delivery_documents WHERE id=p_document_id FOR UPDATE;
  -- A late scan may neither restore a removed document nor roll back a newer version.
  v_activate := p_status='clean' AND v_doc.removed_at IS NULL AND NOT EXISTS (
    SELECT 1 FROM public.delivery_documents
    WHERE document_group_id=v_doc.document_group_id AND version_number>v_doc.version_number
      AND scan_status='clean'
  );
  UPDATE public.delivery_documents
  SET scan_status=p_status,scan_provider=nullif(trim(p_provider),''),scan_result=coalesce(p_result,'{}'::jsonb),scanned_at=now(),
      is_active=CASE WHEN removed_at IS NOT NULL OR p_status='infected' THEN false
        WHEN p_status='clean' THEN v_activate ELSE is_active END
  WHERE id=p_document_id;
  IF v_activate THEN
    UPDATE public.delivery_documents SET is_active=false
    WHERE document_group_id=v_doc.document_group_id AND id<>p_document_id AND is_active;
  END IF;
  PERFORM public.rex_refresh_delivery_proof(v_shipment_id);
  INSERT INTO public.delivery_document_events(document_id,shipment_id,event_type,event_data,actor_role)
  VALUES(p_document_id,v_shipment_id,'scan_'||p_status,jsonb_build_object('provider',p_provider,'result',coalesce(p_result,'{}'::jsonb)),'service_role');
END $$;
REVOKE ALL ON FUNCTION public.rex_record_delivery_document_scan(uuid,text,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.rex_record_delivery_document_scan(uuid,text,text,jsonb) TO service_role;

-- Preserve the deployed registration validation, R2 handling and permission checks.
DO $$
DECLARE v_definition text;
BEGIN
  SELECT pg_get_functiondef('public.rex_register_delivery_document(uuid,text,text,text,text,bigint,text,text,uuid)'::regprocedure) INTO v_definition;
  IF position('IF NOT EXISTS(SELECT 1 FROM public.shipments WHERE id=p_shipment_id) THEN' in v_definition)=0
     OR position('v_version:=v_previous.version_number+1;' in v_definition)=0 THEN
    RAISE EXCEPTION 'Belge kayıt fonksiyonu beklenen sürümde değil; değişiklik uygulanmadı';
  END IF;
  v_definition:=replace(v_definition,
    'IF NOT EXISTS(SELECT 1 FROM public.shipments WHERE id=p_shipment_id) THEN',
    'PERFORM 1 FROM public.shipments WHERE id=p_shipment_id FOR UPDATE; IF NOT FOUND THEN');
  v_definition:=replace(v_definition,'IF NOT v_previous.is_active THEN',
    'IF NOT v_previous.is_active OR v_previous.removed_at IS NOT NULL THEN');
  v_definition:=replace(v_definition,'v_version:=v_previous.version_number+1;',
    'SELECT coalesce(max(version_number),0)+1 INTO v_version FROM public.delivery_documents WHERE document_group_id=v_group;');
  EXECUTE v_definition;
END $$;

COMMIT;
