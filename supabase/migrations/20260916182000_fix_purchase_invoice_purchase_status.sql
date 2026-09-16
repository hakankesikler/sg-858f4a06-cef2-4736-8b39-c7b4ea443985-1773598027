BEGIN;

-- The legacy purchases table uses Turkish title-case payment states.
-- The approval RPC previously inserted the shipment state `beklemede`, which
-- violates purchases_status_check. Keep the invoice workflow state separate
-- and create the supplier payable with the valid `Bekliyor` state.
CREATE OR REPLACE FUNCTION public.rex_approve_purchase_invoice(
  p_invoice_id uuid,
  p_confirmation boolean,
  p_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_invoice public.incoming_purchase_invoices%ROWTYPE;
  v_email text := lower(coalesce(auth.jwt()->>'email', ''));
  v_count integer;
  v_shipment uuid;
  v_purchase uuid;
  v_expected_payable numeric(18,2);
BEGIN
  IF p_confirmation IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Yönetici onayı kutusu işaretlenmelidir';
  END IF;
  IF v_email <> 'info@rexlojistik.com'
     OR NOT public.rex_has_role(ARRAY['admin']) THEN
    RAISE EXCEPTION 'Bu işlem yalnızca şirket sahibi hesabından onaylanabilir';
  END IF;

  SELECT * INTO v_invoice
  FROM public.incoming_purchase_invoices
  WHERE id = p_invoice_id
  FOR UPDATE;

  IF NOT FOUND OR v_invoice.status NOT IN ('matched', 'approval_pending') THEN
    RAISE EXCEPTION 'Fatura onaya hazır değil';
  END IF;
  IF v_invoice.billing_supplier_id IS NULL THEN
    RAISE EXCEPTION 'Faturayı düzenleyen cari VKN/TCKN ile eşleştirilemedi; önce fatura carisini seçin';
  END IF;

  v_expected_payable := round(
    coalesce(v_invoice.net_total, 0)
    + coalesce(v_invoice.vat_total, 0)
    - coalesce(v_invoice.withholding_total, 0),
    2
  );
  IF abs(v_expected_payable - v_invoice.grand_total) > 0.01 THEN
    RAISE EXCEPTION
      'Fatura matrah, KDV, tevkifat ve ödenecek tutar kırılımı birbiriyle uyumlu değil';
  END IF;

  SELECT count(*) INTO v_count
  FROM public.purchase_invoice_allocations
  WHERE invoice_id = p_invoice_id AND active = true;

  SELECT shipment_id INTO v_shipment
  FROM public.purchase_invoice_allocations
  WHERE invoice_id = p_invoice_id AND active = true
  ORDER BY created_at
  LIMIT 1;

  INSERT INTO public.purchases(
    purchase_no,
    supplier_id,
    shipment_id,
    purchase_date,
    due_date,
    subtotal,
    tax,
    discount,
    withholding_total,
    status,
    notes
  )
  VALUES(
    v_invoice.invoice_no,
    v_invoice.billing_supplier_id,
    CASE WHEN v_count = 1 THEN v_shipment ELSE NULL END,
    v_invoice.invoice_date,
    v_invoice.due_date,
    v_invoice.net_total,
    v_invoice.vat_total,
    0,
    v_invoice.withholding_total,
    'Bekliyor',
    coalesce(v_invoice.description, '')
      || CASE WHEN p_note IS NULL THEN '' ELSE E'\nOnay: ' || p_note END
  )
  RETURNING id INTO v_purchase;

  UPDATE public.incoming_purchase_invoices
  SET status = 'payment_pending',
      approved_at = now(),
      approved_by = auth.uid(),
      legacy_purchase_id = v_purchase,
      updated_at = now()
  WHERE id = p_invoice_id;

  IF v_count = 1 THEN
    UPDATE public.shipments
    SET purchase_invoice_id = v_purchase,
        updated_at = now()
    WHERE id = v_shipment;
  END IF;

  PERFORM public.rex_record_purchase_invoice_event(
    p_invoice_id,
    'owner_approved',
    v_invoice.status,
    'payment_pending',
    jsonb_build_object(
      'note', p_note,
      'purchase_id', v_purchase,
      'billing_supplier_id', v_invoice.billing_supplier_id,
      'operational_supplier_id', v_invoice.operational_supplier_id,
      'net_total', v_invoice.net_total,
      'vat_total', v_invoice.vat_total,
      'withholding_total', v_invoice.withholding_total,
      'payable_total', v_invoice.grand_total
    )
  );
END
$$;

REVOKE ALL ON FUNCTION public.rex_approve_purchase_invoice(uuid, boolean, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rex_approve_purchase_invoice(uuid, boolean, text)
  TO authenticated;

COMMENT ON FUNCTION public.rex_approve_purchase_invoice(uuid, boolean, text) IS
  'Creates a VAT- and withholding-aware supplier payable using the valid Bekliyor purchase status.';

COMMIT;
