-- Every fixture is rolled back inside this single statement, including in GUI editors.
DO $test$
DECLARE
  actor uuid;
  shipment uuid:=gen_random_uuid();
  original jsonb;
  expected jsonb;
  result jsonb;
  denied boolean;
BEGIN
 BEGIN
  SELECT user_id INTO actor FROM public.app_user_roles WHERE role='admin' AND active ORDER BY user_id LIMIT 1;
  IF actor IS NULL THEN RAISE EXCEPTION 'Active test actor required'; END IF;
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','service_role','aal','aal2')::text,true);
  INSERT INTO public.shipments(id,shipment_code,status,delivered_to,delivery_date,actual_delivery_date,invoice_status)
  VALUES(shipment,'TEST-DETAILS-'||shipment::text,'teslim_edildi','Wrong recipient','2026-09-19','2026-09-18T21:00:45.123Z','beklemede');
  SELECT to_jsonb(s) INTO original FROM public.shipments s WHERE id=shipment;
  expected:=jsonb_build_object('delivered_to',original->'delivered_to','actual_delivery_date',original->'actual_delivery_date','delivery_date',original->'delivery_date');
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated','aal','aal1')::text,true);
  denied:=false;
  BEGIN
    PERFORM public.rex_correct_delivery_details(shipment,'Correct recipient','2026-09-19T21:30:00Z',expected);
  EXCEPTION WHEN OTHERS THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'MFA requirement bypassed'; END IF;
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',gen_random_uuid(),'role','authenticated','aal','aal2')::text,true);
  denied:=false;
  BEGIN
    PERFORM public.rex_correct_delivery_details(shipment,'Correct recipient','2026-09-19T21:30:00Z',expected);
  EXCEPTION WHEN OTHERS THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Unauthorized correction accepted'; END IF;
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated','aal','aal2')::text,true);
  denied:=false;
  BEGIN
    PERFORM public.rex_correct_delivery_details(shipment,'  ','2026-09-19T21:30:00Z',expected);
  EXCEPTION WHEN OTHERS THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Empty recipient accepted'; END IF;
  result:=public.rex_correct_delivery_details(shipment,' Correct recipient ','2026-09-19T21:30:00Z',expected);
  IF result->>'delivered_to'<>'Correct recipient' OR result->>'delivery_date'<>'2026-09-20' THEN
    RAISE EXCEPTION 'Recipient or Turkey calendar date incorrect';
  END IF;
  IF (SELECT to_jsonb(s)-ARRAY['delivered_to','actual_delivery_date','delivery_date','updated_at'] FROM public.shipments s WHERE id=shipment)
    IS DISTINCT FROM original-ARRAY['delivered_to','actual_delivery_date','delivery_date','updated_at'] THEN
    RAISE EXCEPTION 'Unrelated field or public access window changed';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM public.shipment_events WHERE shipment_id=shipment
    AND changed_fields->'delivered_to'->>'old'='Wrong recipient'
    AND changed_fields->'delivered_to'->>'new'='Correct recipient' AND actor_id=actor) THEN
    RAISE EXCEPTION 'Before/after audit missing';
  END IF;
  denied:=false;
  BEGIN
    PERFORM public.rex_correct_delivery_details(shipment,'Stale overwrite','2026-09-19T21:30:00Z',expected);
  EXCEPTION WHEN OTHERS THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Stale update accepted'; END IF;
  IF has_function_privilege('anon','public.rex_correct_delivery_details(uuid,text,timestamptz,jsonb)','EXECUTE') THEN
    RAISE EXCEPTION 'Anonymous correction grant';
  END IF;
  RAISE EXCEPTION USING ERRCODE='ZX001', MESSAGE='All delivery correction checks passed; roll back fixtures';
 EXCEPTION WHEN SQLSTATE 'ZX001' THEN NULL;
 END;
END $test$;
