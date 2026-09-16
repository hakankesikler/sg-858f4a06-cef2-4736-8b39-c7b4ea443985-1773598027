BEGIN;

-- REX TYS became the operational source of truth on 9 September 2026.
-- Earlier purchases remain visible as history, but they belong to the
-- completed Excel/KolayBi workflow and must not enter the matching queue.
ALTER TABLE public.incoming_purchase_invoices
  DROP CONSTRAINT IF EXISTS incoming_purchase_invoices_status_check;
ALTER TABLE public.incoming_purchase_invoices
  ADD CONSTRAINT incoming_purchase_invoices_status_check CHECK (status IN (
    'review_required','match_proposed','approval_pending','matched','approved',
    'payment_pending','paid','disputed','rejected','duplicate','cancelled','historical'
  ));

WITH candidates AS MATERIALIZED (
  SELECT id, status AS old_status
  FROM public.incoming_purchase_invoices
  WHERE invoice_date < DATE '2026-09-09'
    AND status IN ('review_required','match_proposed','approval_pending','matched')
  FOR UPDATE
), changed AS (
  UPDATE public.incoming_purchase_invoices invoice
  SET status = 'historical',
      updated_at = now(),
      raw_payload = coalesce(invoice.raw_payload, '{}'::jsonb) || jsonb_build_object(
        'tys_cutover_date', '2026-09-09',
        'matching_excluded', true,
        'matching_exclusion_reason', 'TYS öncesi Excel ve KolayBi sürecinde tamamlandı'
      )
  FROM candidates
  WHERE invoice.id = candidates.id
  RETURNING invoice.id, candidates.old_status
)
INSERT INTO public.purchase_invoice_events(invoice_id,event_type,old_status,new_status,details,actor_email)
SELECT id,'marked_historical_at_tys_cutover',old_status,'historical',
       jsonb_build_object('cutover_date','2026-09-09','automatic',true),
       'system'
FROM changed;

CREATE OR REPLACE FUNCTION public.rex_import_kolaybi_purchase_invoice(p_invoice jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id uuid;
  v_existing uuid;
  v_tax text;
  v_document_id text;
  v_uuid text;
  v_invoice_date date := (p_invoice->>'invoice_date')::date;
  v_payment_status text := lower(trim(coalesce(p_invoice->>'payment_status','')));
  v_old_status text;
  v_next_status text;
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.rex_has_role(ARRAY['admin','accounting']) THEN
    RAISE EXCEPTION 'KolayBi alış faturası aktarma yetkiniz yok';
  END IF;

  v_document_id := nullif(trim(p_invoice->>'provider_document_id'),'');
  v_uuid := nullif(trim(p_invoice->>'official_uuid'),'');
  v_tax := regexp_replace(coalesce(p_invoice->>'issuer_tax_id',''),'\D','','g');

  SELECT id,status INTO v_existing,v_old_status
  FROM public.incoming_purchase_invoices
  WHERE (v_document_id IS NOT NULL AND source='kolaybi' AND provider_document_id=v_document_id)
     OR (v_uuid IS NOT NULL AND official_uuid=v_uuid)
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    v_next_status := CASE
      WHEN v_old_status = 'historical' OR v_invoice_date < DATE '2026-09-09' THEN 'historical'
      WHEN v_payment_status IN ('paid','odendi','ödendi','completed','tamamlandi','tamamlandı')
        AND v_old_status NOT IN ('cancelled','duplicate','rejected','disputed') THEN 'paid'
      WHEN v_payment_status IN ('unpaid','partially_paid','odenmedi','ödenmedi','kismi odendi','kısmi ödendi')
        AND v_old_status='paid' THEN 'review_required'
      ELSE v_old_status
    END;

    UPDATE public.incoming_purchase_invoices
    SET provider_status = nullif(trim(p_invoice->>'provider_status'),''),
        e_document_status = nullif(trim(p_invoice->>'e_document_status'),''),
        payment_status = nullif(trim(p_invoice->>'payment_status'),''),
        provider_balance = coalesce(nullif(p_invoice->>'provider_balance','')::numeric,provider_balance),
        status = v_next_status,
        raw_payload = coalesce(raw_payload,'{}'::jsonb) || p_invoice ||
          CASE WHEN v_next_status='historical' THEN jsonb_build_object(
            'tys_cutover_date','2026-09-09','matching_excluded',true
          ) ELSE '{}'::jsonb END,
        last_synced_at = now(),
        updated_at = now()
    WHERE id = v_existing;

    IF v_next_status IS DISTINCT FROM v_old_status THEN
      PERFORM public.rex_record_purchase_invoice_event(
        v_existing,
        CASE WHEN v_next_status='historical' THEN 'marked_historical_at_tys_cutover' ELSE 'kolaybi_payment_reconciled' END,
        v_old_status,
        v_next_status,
        jsonb_build_object('payment_status',nullif(v_payment_status,''),'automatic',true,'cutover_date','2026-09-09')
      );
    END IF;
    RETURN jsonb_build_object('id',v_existing,'created',false,'updated',true,'status',v_next_status);
  END IF;

  v_next_status := CASE
    WHEN v_invoice_date < DATE '2026-09-09' THEN 'historical'
    WHEN v_payment_status IN ('paid','odendi','ödendi','completed','tamamlandi','tamamlandı') THEN 'paid'
    ELSE 'review_required'
  END;

  INSERT INTO public.incoming_purchase_invoices(
    source,provider_document_id,official_uuid,document_type,invoice_no,invoice_date,due_date,
    issuer_name,issuer_tax_id,issuer_tax_office,currency,net_total,vat_total,withholding_total,
    grand_total,description,status,raw_payload,imported_at,created_by,
    provider_status,e_document_status,payment_status,provider_balance,last_synced_at
  ) VALUES(
    'kolaybi',v_document_id,v_uuid,coalesce(nullif(p_invoice->>'document_type',''),'e_invoice'),
    upper(trim(p_invoice->>'invoice_no')),v_invoice_date,nullif(p_invoice->>'due_date','')::date,
    trim(p_invoice->>'issuer_name'),v_tax,nullif(trim(p_invoice->>'issuer_tax_office'),''),
    upper(coalesce(nullif(p_invoice->>'currency',''),'TRY')),coalesce((p_invoice->>'net_total')::numeric,0),
    coalesce((p_invoice->>'vat_total')::numeric,0),coalesce((p_invoice->>'withholding_total')::numeric,0),
    (p_invoice->>'grand_total')::numeric,nullif(trim(p_invoice->>'description'),''),v_next_status,
    p_invoice || CASE WHEN v_next_status='historical' THEN jsonb_build_object(
      'tys_cutover_date','2026-09-09','matching_excluded',true
    ) ELSE '{}'::jsonb END,
    now(),auth.uid(),nullif(trim(p_invoice->>'provider_status'),''),
    nullif(trim(p_invoice->>'e_document_status'),''),nullif(trim(p_invoice->>'payment_status'),''),
    coalesce(nullif(p_invoice->>'provider_balance','')::numeric,0),now()
  ) RETURNING id INTO v_id;

  PERFORM public.rex_record_purchase_invoice_event(
    v_id,
    CASE WHEN v_next_status='historical' THEN 'kolaybi_historical_imported' ELSE 'kolaybi_imported' END,
    NULL,
    v_next_status,
    jsonb_build_object(
      'provider_document_id',v_document_id,
      'automatic',auth.role()='service_role',
      'payment_status',nullif(v_payment_status,''),
      'cutover_date','2026-09-09'
    )
  );
  RETURN jsonb_build_object('id',v_id,'created',true,'status',v_next_status);
EXCEPTION WHEN unique_violation THEN
  RETURN jsonb_build_object('created',false,'duplicate',true);
END
$$;

CREATE OR REPLACE FUNCTION public.rex_purchase_invoice_candidates(p_invoice_id uuid)
RETURNS TABLE(
  shipment_id uuid,
  shipment_code text,
  supplier_id uuid,
  supplier_name text,
  origin text,
  destination text,
  pickup_date date,
  shipment_status text,
  expected_cost numeric,
  cost_currency text,
  score integer,
  reasons text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH inv AS (
    SELECT *
    FROM public.incoming_purchase_invoices
    WHERE id = p_invoice_id
      AND invoice_date >= DATE '2026-09-09'
      AND status IN ('review_required','match_proposed','approval_pending')
      AND public.rex_has_role(ARRAY['admin', 'accounting'])
  ), scored AS (
    SELECT
      s.id,
      s.shipment_code,
      s.supplier_id,
      coalesce(c.company,c.name) AS supplier_name,
      s.origin,
      s.destination,
      s.pickup_date,
      s.status,
      s.cost,
      s.cost_currency,
      least(
        100,
        CASE WHEN s.supplier_id = i.operational_supplier_id THEN 35 ELSE 0 END +
        CASE
          WHEN EXISTS (
            SELECT 1 FROM public.customers direct_supplier
            WHERE direct_supplier.id = s.supplier_id
              AND regexp_replace(coalesce(direct_supplier.vergi_no,direct_supplier.tc_no,''),'\D','','g') =
                  regexp_replace(i.issuer_tax_id,'\D','','g')
          ) OR EXISTS (
            SELECT 1 FROM public.supplier_invoice_issuers m
            WHERE m.operational_supplier_id = s.supplier_id
              AND regexp_replace(m.issuer_tax_id,'\D','','g') = regexp_replace(i.issuer_tax_id,'\D','','g')
              AND m.active AND m.approved_at IS NOT NULL
              AND (m.valid_until IS NULL OR m.valid_until >= i.invoice_date)
          ) THEN 30 ELSE 0
        END +
        CASE WHEN s.cost_currency=i.currency
          AND abs(coalesce(s.cost,0)-i.net_total) <= greatest(i.net_total*0.05,1)
          THEN 25 ELSE 0 END +
        CASE WHEN abs(s.pickup_date-i.invoice_date) <= 15 THEN 10 ELSE 0 END +
        CASE WHEN coalesce(i.description,'') ILIKE '%'||s.shipment_code||'%' THEN 30 ELSE 0 END
      )::integer AS score,
      array_remove(ARRAY[
        CASE WHEN s.supplier_id=i.operational_supplier_id THEN 'Kayıtlı nakliyeci aynı' END,
        CASE
          WHEN EXISTS (
            SELECT 1 FROM public.customers direct_supplier
            WHERE direct_supplier.id=s.supplier_id
              AND regexp_replace(coalesce(direct_supplier.vergi_no,direct_supplier.tc_no,''),'\D','','g') =
                  regexp_replace(i.issuer_tax_id,'\D','','g')
          ) THEN 'Fatura VKN/TCKN bilgisi nakliyeciyle aynı'
          WHEN EXISTS (
            SELECT 1 FROM public.supplier_invoice_issuers m
            WHERE m.operational_supplier_id=s.supplier_id
              AND regexp_replace(m.issuer_tax_id,'\D','','g')=regexp_replace(i.issuer_tax_id,'\D','','g')
              AND m.active AND m.approved_at IS NOT NULL
          ) THEN 'Onaylı fatura düzenleyicisi bağlantısı'
        END,
        CASE WHEN s.cost_currency=i.currency
          AND abs(coalesce(s.cost,0)-i.net_total) <= greatest(i.net_total*0.05,1)
          THEN 'KDV hariç fatura matrahı beklenen maliyetle uyumlu' END,
        CASE WHEN abs(s.pickup_date-i.invoice_date) <= 15 THEN 'Tarihler yakın' END,
        CASE WHEN coalesce(i.description,'') ILIKE '%'||s.shipment_code||'%' THEN 'Açıklamada sevkiyat kodu var' END
      ],NULL) AS reasons
    FROM inv i
    JOIN public.shipments s ON s.status NOT IN ('iptal','İptal')
    LEFT JOIN public.customers c ON c.id=s.supplier_id
    WHERE s.pickup_date >= DATE '2026-09-09'
      AND s.pickup_date BETWEEN i.invoice_date-interval '60 days' AND i.invoice_date+interval '15 days'
  )
  SELECT id,shipment_code,supplier_id,supplier_name,origin,destination,
         pickup_date,status,cost,cost_currency,score,reasons
  FROM scored
  WHERE score>0
  ORDER BY score DESC,pickup_date DESC
  LIMIT 20;
$$;

CREATE OR REPLACE FUNCTION public.rex_match_purchase_invoice(
  p_invoice_id uuid,
  p_allocations jsonb,
  p_general_expense numeric,
  p_checked boolean,
  p_reason text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_invoice public.incoming_purchase_invoices%ROWTYPE;
  v_item jsonb;
  v_sum numeric := 0;
  v_supplier uuid;
  v_operational_supplier uuid;
  v_billing_supplier uuid;
  v_pickup_date date;
  v_mismatch boolean := false;
  v_count integer := 0;
  v_status text;
  v_relation boolean := false;
  v_email text := lower(coalesce(auth.jwt()->>'email',''));
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin','accounting']) THEN
    RAISE EXCEPTION 'Alış faturası eşleştirme yetkiniz yok';
  END IF;
  IF p_checked IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Fatura ve iş bilgileri kontrol edildi onayı zorunludur';
  END IF;

  SELECT * INTO v_invoice
  FROM public.incoming_purchase_invoices
  WHERE id=p_invoice_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Fatura bulunamadı'; END IF;
  IF v_invoice.invoice_date < DATE '2026-09-09' OR v_invoice.status='historical' THEN
    RAISE EXCEPTION '9 Eylül 2026 öncesi faturalar TYS eşleştirme kapsamı dışındadır';
  END IF;
  IF v_invoice.status NOT IN ('review_required','match_proposed','approval_pending') THEN
    RAISE EXCEPTION 'Bu faturanın eşleştirmesi değiştirilemez';
  END IF;
  IF coalesce(v_invoice.net_total,0) <= 0 THEN
    RAISE EXCEPTION 'KDV hariç fatura matrahı geçersiz';
  END IF;
  IF jsonb_typeof(p_allocations) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Sevkiyat dağılımı geçersiz';
  END IF;
  IF coalesce(p_general_expense,0) < 0 THEN
    RAISE EXCEPTION 'Genel gider negatif olamaz';
  END IF;

  v_operational_supplier := v_invoice.operational_supplier_id;
  v_billing_supplier := public.rex_ensure_purchase_invoice_billing_supplier(p_invoice_id);
  v_invoice.billing_supplier_id := v_billing_supplier;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_allocations) LOOP
    IF coalesce((v_item->>'amount')::numeric,0) <= 0 THEN
      RAISE EXCEPTION 'Dağıtım tutarı sıfırdan büyük olmalıdır';
    END IF;

    SELECT supplier_id,pickup_date INTO v_supplier,v_pickup_date
    FROM public.shipments
    WHERE id=(v_item->>'shipment_id')::uuid
    FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Sevkiyat bulunamadı'; END IF;
    IF v_pickup_date < DATE '2026-09-09' THEN
      RAISE EXCEPTION '9 Eylül 2026 öncesi sevkiyatlar TYS fatura eşleştirme kapsamı dışındadır';
    END IF;

    -- Carrier assignment is an operations decision. Invoice matching never
    -- fills an empty shipment carrier from the legal invoice supplier.
    IF v_supplier IS NOT NULL THEN
      IF v_operational_supplier IS NULL THEN
        v_operational_supplier := v_supplier;
      ELSIF v_operational_supplier IS DISTINCT FROM v_supplier THEN
        v_mismatch := true;
      END IF;
    END IF;

    v_sum := v_sum+(v_item->>'amount')::numeric;
    v_count := v_count+1;
  END LOOP;

  IF abs(v_sum+coalesce(p_general_expense,0)-v_invoice.net_total)>0.01 THEN
    RAISE EXCEPTION 'Sevkiyat dağılımı ve genel gider toplamı KDV hariç fatura matrahına eşit olmalıdır';
  END IF;
  IF v_count=0 AND coalesce(p_general_expense,0)<=0 THEN
    RAISE EXCEPTION 'En az bir sevkiyat veya genel gider seçilmelidir';
  END IF;

  UPDATE public.purchase_invoice_allocations
  SET active=false
  WHERE invoice_id=p_invoice_id AND active;

  INSERT INTO public.purchase_invoice_allocations(
    invoice_id,shipment_id,amount,match_score,match_reasons,created_by
  )
  SELECT p_invoice_id,(x->>'shipment_id')::uuid,(x->>'amount')::numeric,
         nullif(x->>'score','')::integer,
         coalesce(ARRAY(SELECT jsonb_array_elements_text(coalesce(x->'reasons','[]'::jsonb))),'{}'),
         auth.uid()
  FROM jsonb_array_elements(p_allocations) x;

  -- No operation carrier is also a valid state. It must not turn the invoice
  -- issuer into the shipment carrier or create a false mismatch.
  v_relation := v_operational_supplier IS NULL;
  IF v_operational_supplier IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM public.customers c
      WHERE c.id=v_operational_supplier
        AND regexp_replace(coalesce(c.vergi_no,c.tc_no,''),'\D','','g') =
            regexp_replace(v_invoice.issuer_tax_id,'\D','','g')
    ) OR EXISTS(
      SELECT 1 FROM public.supplier_invoice_issuers m
      WHERE m.operational_supplier_id=v_operational_supplier
        AND regexp_replace(m.issuer_tax_id,'\D','','g')=regexp_replace(v_invoice.issuer_tax_id,'\D','','g')
        AND m.active AND m.approved_at IS NOT NULL
        AND (m.valid_until IS NULL OR m.valid_until>=v_invoice.invoice_date)
    ) INTO v_relation;
  END IF;

  v_status := CASE WHEN v_mismatch OR NOT v_relation OR v_count>1 OR EXISTS(
    SELECT 1
    FROM jsonb_array_elements(p_allocations) x
    JOIN public.shipments s ON s.id=(x->>'shipment_id')::uuid
    WHERE (x->>'amount')::numeric>coalesce(s.cost,0)+0.01
  ) THEN 'approval_pending' ELSE 'matched' END;

  UPDATE public.incoming_purchase_invoices
  SET status=v_status,
      operational_supplier_id=v_operational_supplier,
      matched_at=now(),
      matched_by=auth.uid(),
      updated_at=now(),
      raw_payload=coalesce(raw_payload,'{}'::jsonb)||jsonb_build_object(
        'general_expense',coalesce(p_general_expense,0),
        'match_reason',nullif(trim(p_reason),''),
        'matching_basis','net_total',
        'matching_total',v_invoice.net_total,
        'vat_total',v_invoice.vat_total,
        'withholding_total',v_invoice.withholding_total,
        'payable_total',v_invoice.grand_total,
        'invoice_carrier_assignments',0,
        'carrier_assignment_policy','manual_only'
      )
  WHERE id=p_invoice_id;

  PERFORM public.rex_record_purchase_invoice_event(
    p_invoice_id,'matched',v_invoice.status,v_status,
    jsonb_build_object(
      'allocations',p_allocations,
      'general_expense',coalesce(p_general_expense,0),
      'reason',p_reason,
      'billing_supplier_id',v_billing_supplier,
      'operational_supplier_id',v_operational_supplier,
      'invoice_carrier_assignments',0,
      'carrier_assignment_policy','manual_only',
      'matching_basis','net_total',
      'matching_total',v_invoice.net_total,
      'vat_total',v_invoice.vat_total,
      'withholding_total',v_invoice.withholding_total,
      'payable_total',v_invoice.grand_total
    )
  );

  IF v_status='matched'
     AND v_email='info@rexlojistik.com'
     AND public.rex_has_role(ARRAY['admin']) THEN
    PERFORM public.rex_approve_purchase_invoice(p_invoice_id,true,p_reason);
    RETURN 'payment_pending';
  END IF;

  RETURN v_status;
END
$$;

REVOKE ALL ON FUNCTION public.rex_import_kolaybi_purchase_invoice(jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rex_purchase_invoice_candidates(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rex_match_purchase_invoice(uuid,jsonb,numeric,boolean,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rex_import_kolaybi_purchase_invoice(jsonb) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.rex_purchase_invoice_candidates(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_match_purchase_invoice(uuid,jsonb,numeric,boolean,text) TO authenticated;

COMMENT ON FUNCTION public.rex_import_kolaybi_purchase_invoice(jsonb) IS
  'Imports only post-cutover invoices into the TYS action queue; earlier invoices remain historical.';
COMMENT ON FUNCTION public.rex_purchase_invoice_candidates(uuid) IS
  'Suggests only invoices and shipments within the TYS period beginning 9 September 2026.';
COMMENT ON FUNCTION public.rex_match_purchase_invoice(uuid,jsonb,numeric,boolean,text) IS
  'Matches post-cutover invoice cost without automatically assigning a carrier to the shipment.';

COMMIT;
