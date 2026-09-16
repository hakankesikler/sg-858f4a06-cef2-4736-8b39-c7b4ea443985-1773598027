BEGIN;

CREATE OR REPLACE FUNCTION public.rex_refresh_kolaybi_purchase_invoice_amounts(p_invoice jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_invoice public.incoming_purchase_invoices%ROWTYPE;
  v_document_id text := nullif(trim(p_invoice->>'provider_document_id'),'');
  v_uuid text := nullif(trim(p_invoice->>'official_uuid'),'');
  v_net_total numeric(18,2);
  v_vat_total numeric(18,2);
  v_withholding_total numeric(18,2);
  v_grand_total numeric(18,2);
  v_next_status text;
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.rex_has_role(ARRAY['admin','accounting']) THEN
    RAISE EXCEPTION 'KolayBi alış faturası tutarlarını güncelleme yetkiniz yok';
  END IF;
  IF coalesce((p_invoice->>'tax_breakdown_verified')::boolean,false) IS NOT TRUE THEN
    RAISE EXCEPTION 'Resmî fatura matrah ve vergi kırılımı doğrulanmadı';
  END IF;

  v_net_total := nullif(p_invoice->>'net_total','')::numeric;
  v_vat_total := nullif(p_invoice->>'vat_total','')::numeric;
  v_withholding_total := coalesce(nullif(p_invoice->>'withholding_total','')::numeric,0);
  v_grand_total := nullif(p_invoice->>'grand_total','')::numeric;
  IF coalesce(v_net_total,0) <= 0
     OR coalesce(v_vat_total,0) < 0
     OR coalesce(v_withholding_total,0) < 0
     OR coalesce(v_grand_total,0) <= 0
     OR abs(round(v_net_total + v_vat_total - v_withholding_total,2) - v_grand_total) > 0.02 THEN
    RAISE EXCEPTION 'Resmî fatura tutar kırılımı matematiksel olarak geçersiz';
  END IF;

  SELECT * INTO v_invoice
  FROM public.incoming_purchase_invoices
  WHERE (v_document_id IS NOT NULL AND source='kolaybi' AND provider_document_id=v_document_id)
     OR (v_uuid IS NOT NULL AND official_uuid=v_uuid)
  LIMIT 1
  FOR UPDATE;
  IF v_invoice.id IS NULL THEN
    RETURN jsonb_build_object('updated',false,'reason','not_found');
  END IF;
  IF v_invoice.status NOT IN ('review_required','match_proposed') THEN
    RETURN jsonb_build_object('id',v_invoice.id,'updated',false,'reason','workflow_locked','status',v_invoice.status);
  END IF;
  IF v_invoice.net_total = v_net_total
     AND v_invoice.vat_total = v_vat_total
     AND v_invoice.withholding_total = v_withholding_total
     AND v_invoice.grand_total = v_grand_total THEN
    RETURN jsonb_build_object('id',v_invoice.id,'updated',false,'reason','unchanged','status',v_invoice.status);
  END IF;

  v_next_status := CASE WHEN v_invoice.status='match_proposed' THEN 'review_required' ELSE v_invoice.status END;
  UPDATE public.incoming_purchase_invoices
  SET net_total=v_net_total,
      vat_total=v_vat_total,
      withholding_total=v_withholding_total,
      grand_total=v_grand_total,
      currency=upper(coalesce(nullif(p_invoice->>'currency',''),currency)),
      status=v_next_status,
      raw_payload=coalesce(raw_payload,'{}'::jsonb) || p_invoice || jsonb_build_object(
        'amounts_refreshed_at',now(),
        'amounts_refresh_source',coalesce(nullif(p_invoice->>'tax_breakdown_source',''),'verified_provider_breakdown')
      ),
      last_synced_at=now(),
      updated_at=now()
  WHERE id=v_invoice.id;

  PERFORM public.rex_record_purchase_invoice_event(
    v_invoice.id,
    'kolaybi_tax_breakdown_refreshed',
    v_invoice.status,
    v_next_status,
    jsonb_build_object(
      'old_net_total',v_invoice.net_total,
      'old_vat_total',v_invoice.vat_total,
      'old_withholding_total',v_invoice.withholding_total,
      'old_payable_total',v_invoice.grand_total,
      'new_net_total',v_net_total,
      'new_vat_total',v_vat_total,
      'new_withholding_total',v_withholding_total,
      'new_payable_total',v_grand_total,
      'source',coalesce(nullif(p_invoice->>'tax_breakdown_source',''),'verified_provider_breakdown'),
      'automatic',auth.role()='service_role'
    )
  );

  RETURN jsonb_build_object('id',v_invoice.id,'updated',true,'status',v_next_status);
END
$$;

REVOKE ALL ON FUNCTION public.rex_refresh_kolaybi_purchase_invoice_amounts(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rex_refresh_kolaybi_purchase_invoice_amounts(jsonb) TO authenticated, service_role;

COMMENT ON FUNCTION public.rex_refresh_kolaybi_purchase_invoice_amounts(jsonb) IS
  'Refreshes only unprocessed KolayBi purchase invoices from a verified official tax breakdown; processed accounting records remain immutable.';

COMMIT;
