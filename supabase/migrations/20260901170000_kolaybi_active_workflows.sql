-- Active KolayBi workflows: durable purchase status and safe automated imports.

ALTER TABLE public.incoming_purchase_invoices
  ADD COLUMN IF NOT EXISTS provider_status text,
  ADD COLUMN IF NOT EXISTS e_document_status text,
  ADD COLUMN IF NOT EXISTS payment_status text,
  ADD COLUMN IF NOT EXISTS provider_balance numeric(14,2),
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;

CREATE INDEX IF NOT EXISTS incoming_purchase_invoices_provider_state_idx
  ON public.incoming_purchase_invoices(source,provider_status,payment_status,last_synced_at DESC)
  WHERE source='kolaybi';

CREATE OR REPLACE FUNCTION public.rex_import_kolaybi_purchase_invoice(p_invoice jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_id uuid; v_existing uuid; v_tax text; v_document_id text; v_uuid text;
BEGIN
  IF auth.role()<>'service_role' AND NOT public.rex_has_role(ARRAY['admin','accounting']) THEN
    RAISE EXCEPTION 'KolayBi alış faturası aktarma yetkiniz yok';
  END IF;
  v_document_id:=nullif(trim(p_invoice->>'provider_document_id'),'');
  v_uuid:=nullif(trim(p_invoice->>'official_uuid'),'');
  v_tax:=regexp_replace(coalesce(p_invoice->>'issuer_tax_id',''),'\D','','g');
  SELECT id INTO v_existing FROM public.incoming_purchase_invoices
   WHERE (v_document_id IS NOT NULL AND source='kolaybi' AND provider_document_id=v_document_id)
      OR (v_uuid IS NOT NULL AND official_uuid=v_uuid) LIMIT 1;
  IF v_existing IS NOT NULL THEN
    UPDATE public.incoming_purchase_invoices SET
      provider_status=nullif(trim(p_invoice->>'provider_status'),''),
      e_document_status=nullif(trim(p_invoice->>'e_document_status'),''),
      payment_status=nullif(trim(p_invoice->>'payment_status'),''),
      provider_balance=coalesce(nullif(p_invoice->>'provider_balance','')::numeric,provider_balance),
      raw_payload=coalesce(raw_payload,'{}'::jsonb)||p_invoice,
      last_synced_at=now(),updated_at=now()
    WHERE id=v_existing;
    RETURN jsonb_build_object('id',v_existing,'created',false,'updated',true);
  END IF;
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
    (p_invoice->>'grand_total')::numeric,nullif(trim(p_invoice->>'description'),''),'review_required',p_invoice,now(),auth.uid(),
    nullif(trim(p_invoice->>'provider_status'),''),nullif(trim(p_invoice->>'e_document_status'),''),
    nullif(trim(p_invoice->>'payment_status'),''),coalesce(nullif(p_invoice->>'provider_balance','')::numeric,0),now()
  ) RETURNING id INTO v_id;
  PERFORM public.rex_record_purchase_invoice_event(v_id,'kolaybi_imported',NULL,'review_required',jsonb_build_object('provider_document_id',v_document_id,'automatic',auth.role()='service_role'));
  RETURN jsonb_build_object('id',v_id,'created',true);
EXCEPTION WHEN unique_violation THEN
  RETURN jsonb_build_object('created',false,'duplicate',true);
END $$;

REVOKE ALL ON FUNCTION public.rex_import_kolaybi_purchase_invoice(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rex_import_kolaybi_purchase_invoice(jsonb) TO authenticated,service_role;

COMMENT ON COLUMN public.incoming_purchase_invoices.provider_status IS 'KolayBi ticari belge durumu; REX onay/eşleştirme durumundan bağımsızdır.';
COMMENT ON COLUMN public.incoming_purchase_invoices.payment_status IS 'KolayBi ödeme durumu; otomatik senkronizasyonda güncellenir.';
