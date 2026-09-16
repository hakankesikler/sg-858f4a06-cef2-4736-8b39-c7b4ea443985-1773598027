BEGIN;

-- Preserve gross VAT and withholding separately on the legacy payable row.
-- `total` used to be a generated column, which rejected the explicit payable
-- amount written by rex_approve_purchase_invoice. Converting the same column
-- in place keeps dependent views intact while the trigger below remains the
-- single source of truth for every insert and update.
ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS withholding_total numeric(15,2) NOT NULL DEFAULT 0;

ALTER TABLE public.purchases
  ALTER COLUMN total DROP EXPRESSION IF EXISTS;

ALTER TABLE public.purchases
  DROP CONSTRAINT IF EXISTS purchases_withholding_total_check;
ALTER TABLE public.purchases
  ADD CONSTRAINT purchases_withholding_total_check
  CHECK (
    withholding_total >= 0
    AND withholding_total <= coalesce(tax, 0) + 0.01
  );

CREATE OR REPLACE FUNCTION public.rex_calculate_purchase_payable_total()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.total := round(
    coalesce(NEW.subtotal, 0)
    + coalesce(NEW.tax, 0)
    - coalesce(NEW.discount, 0)
    - coalesce(NEW.withholding_total, 0),
    2
  );

  IF NEW.total < 0 THEN
    RAISE EXCEPTION 'Alış faturası ödenecek tutarı negatif olamaz';
  END IF;

  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS rex_calculate_purchase_payable_total_trigger
  ON public.purchases;
CREATE TRIGGER rex_calculate_purchase_payable_total_trigger
BEFORE INSERT OR UPDATE ON public.purchases
FOR EACH ROW
EXECUTE FUNCTION public.rex_calculate_purchase_payable_total();

-- Existing rows have no withholding split. Recalculate them with zero
-- withholding so their current accounting meaning remains unchanged.
UPDATE public.purchases
SET withholding_total = coalesce(withholding_total, 0);

ANALYZE public.purchases;

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
    'beklemede',
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

REVOKE ALL ON FUNCTION public.rex_calculate_purchase_payable_total()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rex_calculate_purchase_payable_total()
  TO service_role;

REVOKE ALL ON FUNCTION public.rex_approve_purchase_invoice(uuid, boolean, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rex_approve_purchase_invoice(uuid, boolean, text)
  TO authenticated;

COMMENT ON COLUMN public.purchases.withholding_total IS
  'Incoming purchase invoice VAT withholding deducted from the supplier payable.';
COMMENT ON FUNCTION public.rex_calculate_purchase_payable_total() IS
  'Calculates supplier payable as subtotal plus VAT minus discount and VAT withholding.';
COMMENT ON FUNCTION public.rex_approve_purchase_invoice(uuid, boolean, text) IS
  'Creates the supplier payable without writing a generated value and preserves VAT withholding separately.';

COMMIT;
