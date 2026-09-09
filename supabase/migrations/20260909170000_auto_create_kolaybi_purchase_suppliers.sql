BEGIN;

-- A legal entity can be both a customer and a supplier. This prevents a
-- duplicate cari card when a KolayBi purchase invoice is received from a
-- company that already exists in REX as a customer.
ALTER TABLE public.customers
  DROP CONSTRAINT IF EXISTS customers_account_type_check;
ALTER TABLE public.customers
  ADD CONSTRAINT customers_account_type_check
  CHECK (account_type IN ('musteri','tedarikci','her_ikisi','personel','ortak'));

CREATE OR REPLACE FUNCTION public.rex_ensure_kolaybi_purchase_supplier(
  p_invoice jsonb,
  p_associate jsonb DEFAULT '{}'::jsonb,
  p_provider_environment text DEFAULT 'live'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public,pg_temp
AS $$
DECLARE
  v_tax text:=regexp_replace(coalesce(p_invoice->>'issuer_tax_id',''),'\D','','g');
  v_name text:=nullif(trim(p_invoice->>'issuer_name'),'');
  v_tax_office text:=nullif(trim(coalesce(p_invoice->>'issuer_tax_office',p_associate->>'tax_office')),'');
  v_provider_id bigint;
  v_address_id bigint;
  v_address jsonb:='{}'::jsonb;
  v_customer_id uuid;
  v_account_type text;
  v_candidate_count integer:=0;
  v_code text;
  v_created boolean:=false;
  v_promoted boolean:=false;
  v_linked integer:=0;
BEGIN
  IF p_provider_environment NOT IN ('test','live') THEN
    RAISE EXCEPTION 'Geçersiz KolayBi ortamı';
  END IF;
  IF length(v_tax) NOT BETWEEN 10 AND 11 OR v_name IS NULL THEN
    RETURN jsonb_build_object('created',false,'promoted',false,'linked',0,'review_required',true,'reason','missing_identity_or_name');
  END IF;

  IF coalesce(p_associate->>'id','') ~ '^[0-9]+$' THEN
    v_provider_id:=(p_associate->>'id')::bigint;
  END IF;
  IF jsonb_typeof(p_associate->'address')='array' THEN
    v_address:=coalesce(p_associate->'address'->0,'{}'::jsonb);
  END IF;
  IF coalesce(v_address->>'id','') ~ '^[0-9]+$' THEN
    v_address_id:=(v_address->>'id')::bigint;
  END IF;

  -- Serialize by legal identity so parallel cron invocations cannot create two
  -- cards for the same supplier.
  PERFORM pg_advisory_xact_lock(hashtext('rex_kolaybi_purchase_supplier:'||v_tax));

  SELECT (array_agg(c.id ORDER BY c.created_at,c.id))[1],
         (array_agg(c.account_type ORDER BY c.created_at,c.id))[1],
         count(*)
    INTO v_customer_id,v_account_type,v_candidate_count
  FROM public.customers c
  WHERE c.archived_at IS NULL
    AND regexp_replace(coalesce(nullif(c.vergi_no,''),nullif(c.tc_no,''),''),'\D','','g')=v_tax;

  IF v_candidate_count > 1 THEN
    RETURN jsonb_build_object('created',false,'promoted',false,'linked',0,'review_required',true,'reason','ambiguous_customer');
  END IF;

  IF v_candidate_count=1 THEN
    IF v_account_type='musteri' THEN
      UPDATE public.customers
      SET account_type='her_ikisi',
          supplier_category=coalesce(supplier_category,'diger'),
          kolaybi_contact_id=coalesce(kolaybi_contact_id,v_provider_id),
          kolaybi_address_id=coalesce(kolaybi_address_id,v_address_id),
          updated_at=now()
      WHERE id=v_customer_id;
      v_promoted:=true;
      INSERT INTO public.customer_audit_events(
        customer_id,event_type,reason,old_data,new_data,actor_email
      )
      SELECT v_customer_id,'updated',
        'KolayBi alış faturası nedeniyle cari müşteri ve tedarikçi olarak sınıflandırıldı.',
        jsonb_build_object('account_type','musteri'),to_jsonb(c),'system@rex.local'
      FROM public.customers c WHERE c.id=v_customer_id;
    ELSIF v_account_type NOT IN ('tedarikci','her_ikisi') THEN
      RETURN jsonb_build_object('created',false,'promoted',false,'linked',0,'review_required',true,'reason','incompatible_account_type');
    ELSE
      UPDATE public.customers
      SET kolaybi_contact_id=coalesce(kolaybi_contact_id,v_provider_id),
          kolaybi_address_id=coalesce(kolaybi_address_id,v_address_id),
          supplier_category=coalesce(supplier_category,'diger'),
          updated_at=now()
      WHERE id=v_customer_id AND (
        (kolaybi_contact_id IS NULL AND v_provider_id IS NOT NULL)
        OR (kolaybi_address_id IS NULL AND v_address_id IS NOT NULL)
        OR supplier_category IS NULL
      );
    END IF;
  ELSE
    v_code:=nullif(trim(p_associate->>'code'),'');
    IF v_code IS NULL OR EXISTS(SELECT 1 FROM public.customers WHERE customer_code=v_code) THEN
      v_code:=CASE WHEN v_provider_id IS NOT NULL
        THEN 'KB-'||CASE WHEN p_provider_environment='live' THEN 'L' ELSE 'T' END||'-'||v_provider_id::text
        ELSE 'KBS-'||v_tax END;
    END IF;
    IF EXISTS(SELECT 1 FROM public.customers WHERE customer_code=v_code) THEN
      v_code:='KBS-'||substr(md5(p_provider_environment||':'||v_tax),1,12);
    END IF;

    INSERT INTO public.customers(
      name,company,customer_code,account_type,supplier_category,status,
      vergi_no,tc_no,tax_office,phone,email,address,city,district,postal_code,
      kolaybi_contact_id,kolaybi_address_id,notes,updated_at
    ) VALUES (
      v_name,v_name,v_code,'tedarikci','diger','Aktif',
      CASE WHEN length(v_tax)=10 THEN v_tax END,
      CASE WHEN length(v_tax)=11 THEN v_tax END,
      v_tax_office,
      nullif(trim(p_associate->>'phone'),''),
      nullif(lower(trim(p_associate->>'email')),''),
      nullif(trim(coalesce(v_address->>'address',v_address->>'full_address',v_address->>'description')),''),
      nullif(trim(v_address->>'city'),''),
      nullif(trim(v_address->>'district'),''),
      nullif(trim(coalesce(v_address->>'postal_code',v_address->>'zip_code')),''),
      v_provider_id,v_address_id,
      'KolayBi '||CASE WHEN p_provider_environment='live' THEN 'canlı' ELSE 'sandbox' END||
        ' alış faturası entegrasyonu ile otomatik oluşturuldu.',now()
    ) RETURNING id INTO v_customer_id;
    v_created:=true;

    INSERT INTO public.customer_audit_events(
      customer_id,event_type,reason,new_data,actor_email
    )
    SELECT v_customer_id,'imported',
      'KolayBi alış faturasında kullanılan tedarikçi otomatik aktarıldı.',
      to_jsonb(c),'system@rex.local'
    FROM public.customers c WHERE c.id=v_customer_id;
  END IF;

  UPDATE public.incoming_purchase_invoices
  SET billing_supplier_id=v_customer_id,updated_at=now()
  WHERE source='kolaybi' AND billing_supplier_id IS NULL
    AND regexp_replace(coalesce(issuer_tax_id,''),'\D','','g')=v_tax;
  GET DIAGNOSTICS v_linked=ROW_COUNT;

  IF v_provider_id IS NOT NULL THEN
    UPDATE public.kolaybi_master_records
    SET local_entity_type='customer',local_entity_id=v_customer_id,
        match_status='matched',last_seen_at=now()
    WHERE provider_environment=p_provider_environment
      AND resource_type='associate' AND external_id=v_provider_id::text
      AND (
        local_entity_type IS DISTINCT FROM 'customer'
        OR local_entity_id IS DISTINCT FROM v_customer_id
        OR match_status IS DISTINCT FROM 'matched'
      );
  END IF;

  RETURN jsonb_build_object(
    'customer_id',v_customer_id,'created',v_created,'promoted',v_promoted,
    'linked',v_linked,'review_required',false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.rex_ensure_kolaybi_purchase_supplier(jsonb,jsonb,text)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.rex_ensure_kolaybi_purchase_supplier(jsonb,jsonb,text)
  TO service_role;

-- Preserve the carrier-classification authorization and assignment rules for
-- records that are both customers and suppliers.
CREATE OR REPLACE FUNCTION public.rex_customer_carrier_classification_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_changes_carrier boolean:=false;
BEGIN
  IF current_setting('request.jwt.claim.role',true)='service_role' THEN RETURN NEW; END IF;
  IF TG_OP='INSERT' THEN
    v_changes_carrier:=NEW.account_type IN ('tedarikci','her_ikisi') AND NEW.supplier_category='tasiyici';
  ELSE
    v_changes_carrier:=
      (OLD.account_type IN ('tedarikci','her_ikisi') AND OLD.supplier_category='tasiyici')
      OR (NEW.account_type IN ('tedarikci','her_ikisi') AND NEW.supplier_category='tasiyici');
    v_changes_carrier:=v_changes_carrier AND (
      OLD.account_type IS DISTINCT FROM NEW.account_type
      OR OLD.supplier_category IS DISTINCT FROM NEW.supplier_category
    );
  END IF;
  IF v_changes_carrier AND NOT public.rex_can_assign_transport_carrier() THEN
    RAISE EXCEPTION 'Kurumsal taşıyıcı sınıfını yalnızca şirket sahibi veya taşıyıcı atama yetkisi verilen personel değiştirebilir';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.rex_validate_transport_assignment(
  p_supplier_id uuid,
  p_driver_id uuid,
  p_vehicle_id uuid,
  p_load_weight numeric DEFAULT NULL,
  p_require_default_assignment boolean DEFAULT false
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
  v_category text;
  v_driver public.drivers%ROWTYPE;
  v_vehicle public.vehicles%ROWTYPE;
BEGIN
  IF p_supplier_id IS NOT NULL THEN
    SELECT supplier_category INTO v_category
    FROM public.customers
    WHERE id=p_supplier_id AND account_type IN ('tedarikci','her_ikisi') AND archived_at IS NULL;
    IF NOT FOUND THEN RAISE EXCEPTION 'Aktif tedarikçi bulunamadı'; END IF;
  END IF;
  IF v_category='nakliyeci' OR (p_require_default_assignment AND v_category IS DISTINCT FROM 'tasiyici') THEN
    IF p_driver_id IS NULL OR p_vehicle_id IS NULL THEN
      RAISE EXCEPTION 'Nakliyeci sevkiyatında sürücü ve araç zorunludur';
    END IF;
  ELSIF (p_driver_id IS NULL) <> (p_vehicle_id IS NULL) THEN
    RAISE EXCEPTION 'Sürücü ve araç birlikte atanmalıdır';
  END IF;
  IF p_driver_id IS NOT NULL THEN
    IF v_category='nakliyeci' THEN
      SELECT * INTO v_driver FROM public.drivers WHERE id=p_driver_id;
      SELECT * INTO v_vehicle FROM public.vehicles WHERE id=p_vehicle_id;
      IF nullif(trim(v_driver.full_name),'') IS NULL THEN RAISE EXCEPTION 'Nakliyeci sürücüsünün adı ve soyadı zorunludur'; END IF;
      IF coalesce(v_driver.tc_no,'') !~ '^[0-9]{11}$' THEN RAISE EXCEPTION 'Nakliyeci sürücüsünün 11 haneli T.C. kimlik numarası zorunludur'; END IF;
      IF nullif(trim(v_vehicle.cekici_plakasi),'') IS NULL THEN RAISE EXCEPTION 'Nakliyeci aracının plakası zorunludur'; END IF;
    END IF;
    PERFORM public.rex_validate_assignment_with_load(p_driver_id,p_vehicle_id,p_load_weight);
  END IF;
  RETURN v_category;
END;
$$;

REVOKE ALL ON FUNCTION public.rex_customer_carrier_classification_guard() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.rex_validate_transport_assignment(uuid,uuid,uuid,numeric,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rex_validate_transport_assignment(uuid,uuid,uuid,numeric,boolean) TO authenticated;

-- A combined card remains a customer for portal access. Without this
-- replacement, promoting an existing customer to her_ikisi would make its
-- portal-invite action fail even though the customer relationship continues.
CREATE OR REPLACE FUNCTION public.rex_create_customer_portal_invite(
  p_customer_id uuid,
  p_email text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_customer public.customers%ROWTYPE;
  v_email text := lower(trim(coalesce(p_email, '')));
  v_token text := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  v_expires_at timestamptz := now() + interval '72 hours';
BEGIN
  IF NOT public.rex_has_permission('crm.portal_invites', 'manage') THEN
    RAISE EXCEPTION 'Müşteri portalı daveti oluşturma yetkiniz bulunmuyor';
  END IF;
  SELECT * INTO v_customer FROM public.customers WHERE id = p_customer_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Müşteri bulunamadı'; END IF;
  IF coalesce(v_customer.account_type, 'musteri') NOT IN ('musteri','her_ikisi') THEN
    RAISE EXCEPTION 'Müşteri portalı yalnızca müşteri carileri için açılabilir';
  END IF;
  IF v_email = '' OR v_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
    RAISE EXCEPTION 'Geçerli bir e-posta adresi girin';
  END IF;
  UPDATE public.customer_portal_invites
  SET expires_at = now(), used_at = coalesce(used_at, now())
  WHERE customer_id = p_customer_id AND lower(email) = v_email AND used_at IS NULL;
  INSERT INTO public.customer_portal_invites(customer_id, email, token, expires_at, created_by)
  VALUES (p_customer_id, v_email, v_token, v_expires_at, auth.uid());
  RETURN jsonb_build_object(
    'customer_id', p_customer_id,
    'customer_name', v_customer.name,
    'email', v_email,
    'token', v_token,
    'expires_at', v_expires_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.rex_create_customer_portal_invite(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rex_create_customer_portal_invite(uuid,text) TO authenticated;

-- Combined cards must also remain visible to CRM matching. Otherwise an
-- existing customer promoted by an incoming invoice could be recreated as a
-- second customer from a quote or opportunity.
CREATE OR REPLACE FUNCTION public.rex_crm_quote_to_opportunity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_customer uuid;
BEGIN
  SELECT c.id INTO v_customer FROM public.customers c
  WHERE coalesce(c.account_type,'musteri') IN ('musteri','her_ikisi') AND (
    (NEW.email IS NOT NULL AND lower(c.email)=lower(NEW.email)) OR
    (NEW.phone IS NOT NULL AND regexp_replace(coalesce(c.phone,''),'\D','','g')=regexp_replace(NEW.phone,'\D','','g'))
  ) ORDER BY c.created_at LIMIT 1;
  INSERT INTO public.crm_opportunities(customer_id,quote_request_id,company_name,contact_name,email,phone,source,stage,next_action_at,notes)
  VALUES(v_customer,NEW.id,NEW.company_name,NEW.full_name,NEW.email,NEW.phone,'website','quote_required',
    now()+interval '1 day',concat_ws(' | ',
      CASE NEW.service_type WHEN 'domestic' THEN 'Yurtiçi' ELSE 'Uluslararası' END,
      CASE NEW.transport_mode WHEN 'road' THEN 'Karayolu' WHEN 'air' THEN 'Havayolu' ELSE 'Denizyolu' END,
      NEW.loading_point||' → '||NEW.delivery_point,NEW.special_requirements))
  ON CONFLICT (quote_request_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.rex_crm_duplicate_candidates(
  p_company_name text,p_email text DEFAULT NULL,p_phone text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,extensions,pg_temp AS $$
DECLARE v_result jsonb;
BEGIN
  IF NOT public.rex_has_permission('crm.sales_pipeline','view') THEN RAISE EXCEPTION 'CRM görüntüleme yetkiniz bulunmuyor'; END IF;
  SELECT coalesce(jsonb_agg(row_to_json(x) ORDER BY x.match_score DESC),'[]'::jsonb) INTO v_result FROM (
    SELECT 'customer' record_type,c.id,c.name company_name,c.email,c.phone,c.status,
      greatest(similarity(lower(trim(c.name)),lower(trim(p_company_name))),CASE WHEN nullif(trim(p_email),'') IS NOT NULL AND lower(c.email)=lower(trim(p_email)) THEN 1 ELSE 0 END,CASE WHEN length(regexp_replace(coalesce(p_phone,''),'\D','','g'))>=7 AND right(regexp_replace(coalesce(c.phone,''),'\D','','g'),10)=right(regexp_replace(p_phone,'\D','','g'),10) THEN 1 ELSE 0 END) match_score
    FROM public.customers c WHERE c.archived_at IS NULL AND coalesce(c.account_type,'musteri') IN ('musteri','her_ikisi')
      AND (similarity(lower(trim(c.name)),lower(trim(p_company_name)))>=0.55 OR (nullif(trim(p_email),'') IS NOT NULL AND lower(c.email)=lower(trim(p_email))) OR (length(regexp_replace(coalesce(p_phone,''),'\D','','g'))>=7 AND right(regexp_replace(coalesce(c.phone,''),'\D','','g'),10)=right(regexp_replace(p_phone,'\D','','g'),10)))
    UNION ALL
    SELECT 'opportunity',o.id,o.company_name,o.email,o.phone,o.stage,
      greatest(similarity(lower(trim(o.company_name)),lower(trim(p_company_name))),CASE WHEN nullif(trim(p_email),'') IS NOT NULL AND lower(o.email)=lower(trim(p_email)) THEN 1 ELSE 0 END,CASE WHEN length(regexp_replace(coalesce(p_phone,''),'\D','','g'))>=7 AND right(regexp_replace(coalesce(o.phone,''),'\D','','g'),10)=right(regexp_replace(p_phone,'\D','','g'),10) THEN 1 ELSE 0 END)
    FROM public.crm_opportunities o WHERE public.rex_crm_can_access_opportunity(o.id)
      AND (similarity(lower(trim(o.company_name)),lower(trim(p_company_name)))>=0.55 OR (nullif(trim(p_email),'') IS NOT NULL AND lower(o.email)=lower(trim(p_email))) OR (length(regexp_replace(coalesce(p_phone,''),'\D','','g'))>=7 AND right(regexp_replace(coalesce(o.phone,''),'\D','','g'),10)=right(regexp_replace(p_phone,'\D','','g'),10)))
    LIMIT 20
  ) x;
  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.rex_crm_convert_to_customer(p_opportunity_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_opp public.crm_opportunities%ROWTYPE; v_customer uuid; v_code text; v_sequence integer;
BEGIN
  IF NOT public.rex_has_permission('crm.sales_pipeline','manage') OR NOT public.rex_has_permission('crm.customers','manage') THEN
    RAISE EXCEPTION 'CRM ve cari oluşturma yetkisi gereklidir';
  END IF;
  SELECT * INTO v_opp FROM public.crm_opportunities WHERE id=p_opportunity_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Satış kaydı bulunamadı'; END IF;
  IF v_opp.customer_id IS NOT NULL THEN RETURN v_opp.customer_id; END IF;
  SELECT c.id INTO v_customer FROM public.customers c WHERE coalesce(c.account_type,'musteri') IN ('musteri','her_ikisi') AND (
    (v_opp.email IS NOT NULL AND lower(c.email)=lower(v_opp.email)) OR
    (v_opp.phone IS NOT NULL AND regexp_replace(coalesce(c.phone,''),'\D','','g')=regexp_replace(v_opp.phone,'\D','','g'))
  ) ORDER BY c.created_at LIMIT 1;
  IF v_customer IS NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext('rex_customer_code_CST'));
    SELECT coalesce(max((regexp_match(customer_code,'^CST-(\d+)$'))[1]::integer),0)+1 INTO v_sequence FROM public.customers WHERE customer_code LIKE 'CST-%';
    v_code:='CST-'||lpad(v_sequence::text,6,'0');
    INSERT INTO public.customers(name,company,phone,email,status,notes,account_type,customer_code)
    VALUES(v_opp.company_name,v_opp.company_name,v_opp.phone,v_opp.email,'Potansiyel',v_opp.notes,'musteri',v_code) RETURNING id INTO v_customer;
  ELSE
    SELECT customer_code INTO v_code FROM public.customers WHERE id=v_customer;
  END IF;
  UPDATE public.crm_opportunities SET customer_id=v_customer,updated_at=now() WHERE id=v_opp.id;
  UPDATE public.crm_tasks SET customer_id=v_customer,updated_at=now() WHERE opportunity_id=v_opp.id;
  INSERT INTO public.crm_stage_events(opportunity_id,event_type,old_stage,new_stage,details,actor_id,actor_email)
  VALUES(v_opp.id,'customer_created',v_opp.stage,v_opp.stage,jsonb_build_object('customer_id',v_customer,'customer_code',v_code),auth.uid(),public.rex_crm_actor_email());
  RETURN v_customer;
END;
$$;

REVOKE ALL ON FUNCTION public.rex_crm_duplicate_candidates(text,text,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.rex_crm_convert_to_customer(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rex_crm_duplicate_candidates(text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_crm_convert_to_customer(uuid) TO authenticated;

-- Backfill every currently unmatched live KolayBi purchase-invoice issuer.
DO $$
DECLARE
  v_row record;
  v_result jsonb;
BEGIN
  FOR v_row IN
    SELECT DISTINCT ON (regexp_replace(i.issuer_tax_id,'\D','','g'))
      jsonb_build_object(
        'issuer_tax_id',regexp_replace(i.issuer_tax_id,'\D','','g'),
        'issuer_name',i.issuer_name,
        'issuer_tax_office',i.issuer_tax_office
      ) AS invoice_payload,
      coalesce(a.payload,'{}'::jsonb) AS associate_payload
    FROM public.incoming_purchase_invoices i
    LEFT JOIN LATERAL (
      SELECT m.payload
      FROM public.kolaybi_master_records m
      WHERE m.provider_environment='live' AND m.resource_type='associate'
        AND regexp_replace(coalesce(m.tax_identity,''),'\D','','g')=
          regexp_replace(i.issuer_tax_id,'\D','','g')
      ORDER BY m.last_seen_at DESC
      LIMIT 1
    ) a ON true
    WHERE i.source='kolaybi' AND i.billing_supplier_id IS NULL
      AND length(regexp_replace(i.issuer_tax_id,'\D','','g')) BETWEEN 10 AND 11
    ORDER BY regexp_replace(i.issuer_tax_id,'\D','','g'),i.invoice_date DESC,i.created_at DESC
  LOOP
    SELECT public.rex_ensure_kolaybi_purchase_supplier(
      v_row.invoice_payload,v_row.associate_payload,'live'
    ) INTO v_result;
  END LOOP;
END;
$$;

-- Keep local fallback balances correct for cards that act in both directions.
CREATE OR REPLACE VIEW public.rex_customer_financial_directory
WITH (security_invoker = true)
AS
WITH sales AS (
  SELECT customer_id,
    sum(grand_total * coalesce(exchange_rate, 1))
      FILTER (WHERE coalesce(payment_status, '') <> 'İptal'
        AND coalesce(integration_status, '') NOT IN ('cancelled', 'refund_created')
        AND coalesce(invoice_no, '') NOT LIKE 'BORC-%'
        AND coalesce(invoice_no, '') NOT LIKE 'ALACAK-%') AS invoiced,
    max(greatest(invoice_date::timestamptz, created_at)) AS last_activity_at
  FROM public.sales_invoices WHERE customer_id IS NOT NULL GROUP BY customer_id
), purchases AS (
  SELECT supplier_id AS customer_id,
    sum(total) FILTER (WHERE coalesce(status, '') <> 'İptal'
      AND coalesce(purchase_no, '') NOT LIKE 'BORC-%'
      AND coalesce(purchase_no, '') NOT LIKE 'ALACAK-%') AS invoiced,
    max(greatest(purchase_date::timestamptz, created_at)) AS last_activity_at
  FROM public.purchases WHERE supplier_id IS NOT NULL GROUP BY supplier_id
), payments AS (
  SELECT customer_id,
    sum(amount * coalesce(exchange_rate, 1)) FILTER (WHERE transaction_type='tahsilat') AS collected,
    sum(amount * coalesce(exchange_rate, 1)) FILTER (WHERE transaction_type='odeme') AS paid,
    max(greatest(payment_date::timestamptz, created_at)) AS last_activity_at
  FROM public.customer_payments WHERE customer_id IS NOT NULL GROUP BY customer_id
), adjustments AS (
  SELECT account_id AS customer_id,
    sum(CASE WHEN transaction_type='Alacak' THEN amount ELSE -amount END) AS balance,
    max(coalesce(transaction_date,created_at)) AS last_activity_at
  FROM public.account_transactions WHERE account_id IS NOT NULL GROUP BY account_id
), local_summary AS (
  SELECT c.id AS customer_id,
    CASE
      WHEN coalesce(c.account_type,'musteri')='musteri'
        THEN coalesce(s.invoiced,0)-coalesce(pm.collected,0)+coalesce(a.balance,0)
      WHEN c.account_type='tedarikci'
        THEN -coalesce(p.invoiced,0)+coalesce(pm.paid,0)+coalesce(a.balance,0)
      WHEN c.account_type='her_ikisi'
        THEN coalesce(s.invoiced,0)-coalesce(pm.collected,0)
          -coalesce(p.invoiced,0)+coalesce(pm.paid,0)+coalesce(a.balance,0)
      ELSE coalesce(a.balance,0)
    END::numeric(18,2) AS balance,
    greatest(s.last_activity_at,p.last_activity_at,pm.last_activity_at,a.last_activity_at) AS last_financial_activity_at
  FROM public.customers c
  LEFT JOIN sales s ON s.customer_id=c.id
  LEFT JOIN purchases p ON p.customer_id=c.id
  LEFT JOIN payments pm ON pm.customer_id=c.id
  LEFT JOIN adjustments a ON a.customer_id=c.id
  WHERE c.archived_at IS NULL
), live_provider AS (
  SELECT customer_id,sum(company_amount)::numeric(18,2) AS balance,max(last_synced_at) AS last_synced_at
  FROM public.kolaybi_customer_balance_snapshots
  WHERE provider_environment='live' GROUP BY customer_id
), summary AS (
  SELECT l.customer_id,coalesce(p.balance,l.balance,0)::numeric(18,2) AS balance,
    greatest(l.last_financial_activity_at,p.last_synced_at) AS last_financial_activity_at
  FROM local_summary l LEFT JOIN live_provider p ON p.customer_id=l.customer_id
)
SELECT customer_id,balance,last_financial_activity_at,
  CASE WHEN abs(balance)>=0.01 THEN 'open_balance'
    WHEN last_financial_activity_at>=now()-interval '24 months' THEN 'recent_zero'
    ELSE 'dormant_zero' END::text AS financial_activity_segment
FROM summary;

GRANT SELECT ON public.rex_customer_financial_directory TO authenticated;

COMMIT;
