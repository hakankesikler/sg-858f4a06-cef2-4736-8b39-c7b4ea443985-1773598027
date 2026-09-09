-- Keep KolayBi payment state and the REX purchase-invoice action queue consistent.

CREATE OR REPLACE FUNCTION public.rex_import_kolaybi_purchase_invoice(p_invoice jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
  v_id uuid;
  v_existing uuid;
  v_tax text;
  v_document_id text;
  v_uuid text;
  v_payment_status text:=lower(trim(coalesce(p_invoice->>'payment_status','')));
  v_old_status text;
  v_next_status text;
BEGIN
  IF auth.role()<>'service_role' AND NOT public.rex_has_role(ARRAY['admin','accounting']) THEN
    RAISE EXCEPTION 'KolayBi alış faturası aktarma yetkiniz yok';
  END IF;
  v_document_id:=nullif(trim(p_invoice->>'provider_document_id'),'');
  v_uuid:=nullif(trim(p_invoice->>'official_uuid'),'');
  v_tax:=regexp_replace(coalesce(p_invoice->>'issuer_tax_id',''),'\D','','g');
  SELECT id,status INTO v_existing,v_old_status FROM public.incoming_purchase_invoices
   WHERE (v_document_id IS NOT NULL AND source='kolaybi' AND provider_document_id=v_document_id)
      OR (v_uuid IS NOT NULL AND official_uuid=v_uuid) LIMIT 1;
  IF v_existing IS NOT NULL THEN
    v_next_status:=CASE
      WHEN v_payment_status IN ('paid','odendi','ödendi','completed','tamamlandi','tamamlandı')
        AND v_old_status NOT IN ('cancelled','duplicate','rejected','disputed') THEN 'paid'
      WHEN v_payment_status IN ('unpaid','partially_paid','odenmedi','ödenmedi','kismi odendi','kısmi ödendi')
        AND v_old_status='paid' THEN 'review_required'
      ELSE v_old_status
    END;
    UPDATE public.incoming_purchase_invoices SET
      provider_status=nullif(trim(p_invoice->>'provider_status'),''),
      e_document_status=nullif(trim(p_invoice->>'e_document_status'),''),
      payment_status=nullif(trim(p_invoice->>'payment_status'),''),
      provider_balance=coalesce(nullif(p_invoice->>'provider_balance','')::numeric,provider_balance),
      status=v_next_status,
      raw_payload=coalesce(raw_payload,'{}'::jsonb)||p_invoice,
      last_synced_at=now(),updated_at=now()
    WHERE id=v_existing;
    IF v_next_status IS DISTINCT FROM v_old_status THEN
      PERFORM public.rex_record_purchase_invoice_event(
        v_existing,'kolaybi_payment_reconciled',v_old_status,v_next_status,
        jsonb_build_object('payment_status',nullif(v_payment_status,''),'automatic',true)
      );
    END IF;
    RETURN jsonb_build_object('id',v_existing,'created',false,'updated',true,'status',v_next_status);
  END IF;
  v_next_status:=CASE
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
    upper(trim(p_invoice->>'invoice_no')),(p_invoice->>'invoice_date')::date,nullif(p_invoice->>'due_date','')::date,
    trim(p_invoice->>'issuer_name'),v_tax,nullif(trim(p_invoice->>'issuer_tax_office'),''),
    upper(coalesce(nullif(p_invoice->>'currency',''),'TRY')),coalesce((p_invoice->>'net_total')::numeric,0),
    coalesce((p_invoice->>'vat_total')::numeric,0),coalesce((p_invoice->>'withholding_total')::numeric,0),
    (p_invoice->>'grand_total')::numeric,nullif(trim(p_invoice->>'description'),''),v_next_status,p_invoice,now(),auth.uid(),
    nullif(trim(p_invoice->>'provider_status'),''),nullif(trim(p_invoice->>'e_document_status'),''),
    nullif(trim(p_invoice->>'payment_status'),''),coalesce(nullif(p_invoice->>'provider_balance','')::numeric,0),now()
  ) RETURNING id INTO v_id;
  PERFORM public.rex_record_purchase_invoice_event(
    v_id,'kolaybi_imported',NULL,v_next_status,
    jsonb_build_object('provider_document_id',v_document_id,'automatic',auth.role()='service_role','payment_status',nullif(v_payment_status,''))
  );
  RETURN jsonb_build_object('id',v_id,'created',true,'status',v_next_status);
EXCEPTION WHEN unique_violation THEN
  RETURN jsonb_build_object('created',false,'duplicate',true);
END $$;

REVOKE ALL ON FUNCTION public.rex_import_kolaybi_purchase_invoice(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rex_import_kolaybi_purchase_invoice(jsonb) TO authenticated,service_role;

WITH candidates AS MATERIALIZED (
  SELECT id,status AS old_status
  FROM public.incoming_purchase_invoices
  WHERE source='kolaybi'
    AND lower(trim(coalesce(payment_status,''))) IN ('paid','odendi','ödendi','completed','tamamlandi','tamamlandı')
    AND status NOT IN ('paid','cancelled','duplicate','rejected','disputed')
  FOR UPDATE
), changed AS (
  UPDATE public.incoming_purchase_invoices
     SET status='paid',updated_at=now()
  FROM candidates
  WHERE incoming_purchase_invoices.id=candidates.id
  RETURNING incoming_purchase_invoices.id,candidates.old_status
)
INSERT INTO public.purchase_invoice_events(invoice_id,event_type,old_status,new_status,details)
SELECT id,'kolaybi_payment_reconciled',old_status,'paid',
       jsonb_build_object('automatic',true,'reason','KolayBi ödeme geçmişi başlangıç uzlaştırması')
FROM changed;

COMMENT ON FUNCTION public.rex_import_kolaybi_purchase_invoice(jsonb) IS
  'KolayBi alış faturasını tekrar güvenli biçimde işler; ödeme tamamlandıysa inceleme kuyruğuna eklemez.';
