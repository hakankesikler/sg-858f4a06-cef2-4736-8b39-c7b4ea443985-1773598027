-- Run after the migration. The nested exception block rolls back all fixtures,
-- even in SQL editors that split BEGIN/ROLLBACK into separate requests.
-- Only synthetic records are written; no object storage calls are made.
DO $test$
DECLARE
  actor uuid;
  shipment uuid := gen_random_uuid();
  doc1 uuid;
  doc2 uuid;
  doc3 uuid;
  before_state jsonb;
  after_state jsonb;
  denied boolean;
  rolled_back boolean := false;
BEGIN
 BEGIN
  SELECT user_id INTO actor FROM public.app_user_roles
  WHERE role='admin' AND active ORDER BY user_id LIMIT 1;
  IF actor IS NULL THEN RAISE EXCEPTION 'Test requires an existing active admin'; END IF;
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','service_role','aal','aal2')::text,true);
  INSERT INTO public.shipments(id,shipment_code,status,delivered_to,delivery_date,invoice_status)
  VALUES(shipment,'TEST-DOC-'||shipment::text,'teslim_edildi','Synthetic recipient',current_date,'beklemede');
  SELECT to_jsonb(s)-ARRAY['delivery_proof_url','updated_at'] INTO before_state FROM public.shipments s WHERE id=shipment;
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated','aal','aal2')::text,true);
  doc1:=public.rex_register_delivery_document(shipment,'delivery_proof','r2://shipment-documents/delivery-documents/test/one.pdf','one.pdf','application/pdf',10,repeat('a',64));
  -- An authenticated client cannot supply a clean scan result.
  denied:=false;
  BEGIN
    PERFORM public.rex_record_delivery_document_scan(doc1,'clean','test');
  EXCEPTION WHEN OTHERS THEN denied:=true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'Client scan was not rejected'; END IF;
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','service_role','aal','aal2')::text,true);
  PERFORM public.rex_record_delivery_document_scan(doc1,'clean','test');
  IF (SELECT delivery_proof_url FROM public.shipments WHERE id=shipment) IS DISTINCT FROM 'r2://shipment-documents/delivery-documents/test/one.pdf' THEN RAISE EXCEPTION 'Clean proof pointer not set'; END IF;
  -- MFA and anonymous checks must also apply to the removal RPC.
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated','aal','aal1')::text,true);
  denied:=false;
  BEGIN
    PERFORM public.rex_remove_delivery_document(doc1);
  EXCEPTION WHEN OTHERS THEN denied:=true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'AAL1 removal was not rejected'; END IF;
  PERFORM set_config('request.jwt.claims','{"role":"anon"}',true);
  denied:=false;
  BEGIN
    PERFORM public.rex_remove_delivery_document(doc1);
  EXCEPTION WHEN OTHERS THEN denied:=true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'Anonymous removal was not rejected'; END IF;
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated','aal','aal2')::text,true);
  doc2:=public.rex_register_delivery_document(shipment,'delivery_proof','r2://shipment-documents/delivery-documents/test/two.pdf','two.pdf','application/pdf',10,repeat('b',64),NULL,doc1);
  PERFORM public.rex_remove_delivery_document(doc2);
  -- A discarded pending version must not cause duplicate version numbers.
  doc3:=public.rex_register_delivery_document(shipment,'delivery_proof','r2://shipment-documents/delivery-documents/test/three.pdf','three.pdf','application/pdf',10,repeat('c',64),NULL,doc1);
  IF (SELECT version_number FROM public.delivery_documents WHERE id=doc3)<>3 THEN RAISE EXCEPTION 'Version number reused'; END IF;
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','service_role','aal','aal2')::text,true);
  PERFORM public.rex_record_delivery_document_scan(doc3,'clean','test');
  PERFORM public.rex_record_delivery_document_scan(doc1,'clean','test');
  PERFORM public.rex_record_delivery_document_scan(doc2,'clean','test');
  IF EXISTS(SELECT 1 FROM public.delivery_documents WHERE id IN(doc1,doc2) AND is_active) THEN RAISE EXCEPTION 'Late scan restored obsolete proof'; END IF;
  IF (SELECT delivery_proof_url FROM public.shipments WHERE id=shipment) IS DISTINCT FROM 'r2://shipment-documents/delivery-documents/test/three.pdf' THEN RAISE EXCEPTION 'Replacement proof pointer incorrect'; END IF;
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated','aal','aal2')::text,true);
  PERFORM public.rex_remove_delivery_document(doc3);
  PERFORM public.rex_remove_delivery_document(doc3);
  IF (SELECT delivery_proof_url FROM public.shipments WHERE id=shipment) IS NOT NULL THEN RAISE EXCEPTION 'Last proof pointer retained'; END IF;
  IF (SELECT count(*) FROM public.delivery_document_events WHERE document_id=doc3 AND event_type='removed')<>1 THEN RAISE EXCEPTION 'Removal audit not idempotent'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.shipment_events WHERE shipment_id=shipment AND changed_fields ? 'delivery_document_removed') THEN RAISE EXCEPTION 'Shipment audit missing'; END IF;
  -- New independent upload is still possible after removing the last proof.
  doc2:=public.rex_register_delivery_document(shipment,'delivery_proof','r2://shipment-documents/delivery-documents/test/new.pdf','new.pdf','application/pdf',10,repeat('d',64));
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','service_role','aal','aal2')::text,true);
  PERFORM public.rex_record_delivery_document_scan(doc2,'clean','test');
  PERFORM public.rex_record_delivery_document_scan(doc3,'clean','test');
  IF (SELECT delivery_proof_url FROM public.shipments WHERE id=shipment) IS DISTINCT FROM 'r2://shipment-documents/delivery-documents/test/new.pdf' THEN RAISE EXCEPTION 'Fresh proof not selected'; END IF;
  SELECT to_jsonb(s)-ARRAY['delivery_proof_url','updated_at'] INTO after_state FROM public.shipments s WHERE id=shipment;
  IF before_state IS DISTINCT FROM after_state THEN RAISE EXCEPTION 'Delivery or accounting fields changed'; END IF;
  IF has_function_privilege('anon','public.rex_remove_delivery_document(uuid)','EXECUTE') THEN RAISE EXCEPTION 'Anonymous RPC grant'; END IF;
  IF has_function_privilege('authenticated','public.rex_record_delivery_document_scan(uuid,text,text,jsonb)','EXECUTE') THEN RAISE EXCEPTION 'Client scan grant'; END IF;
  RAISE EXCEPTION USING ERRCODE='ZX001', MESSAGE='Rollback successful test fixtures';
 EXCEPTION WHEN SQLSTATE 'ZX001' THEN
  rolled_back := true;
 END;
 IF NOT rolled_back THEN RAISE EXCEPTION 'Fixture rollback did not execute'; END IF;
END $test$;
SELECT 'PASS: removal, reupload, versioning, late scans, audit, authorization, unchanged shipment fields' AS result;
