BEGIN;

-- KolayBi's payable amount includes VAT and subtracts withheld VAT. Shipment
-- costs are stored net of VAT, so operational matching must use the invoice
-- tax base. Backfill withholding only when the implied amount is a valid
-- tenth-based share of the invoice VAT; this avoids treating discounts or
-- malformed totals as withholding.
WITH corrected AS (
  UPDATE public.incoming_purchase_invoices
  SET withholding_total = round(net_total + vat_total - grand_total, 2),
      updated_at = now()
  WHERE source = 'kolaybi'
    AND coalesce(withholding_total, 0) = 0
    AND vat_total > 0
    AND round(net_total + vat_total - grand_total, 2) > 0.01
    AND round(net_total + vat_total - grand_total, 2) <= vat_total + 0.01
    AND round(((net_total + vat_total - grand_total) / vat_total) * 10) BETWEEN 1 AND 10
    AND abs(
      ((net_total + vat_total - grand_total) / vat_total) * 10
      - round(((net_total + vat_total - grand_total) / vat_total) * 10)
    ) <= 0.01
  RETURNING id, status, withholding_total
)
INSERT INTO public.purchase_invoice_events(
  invoice_id, event_type, old_status, new_status, details, actor_email
)
SELECT
  id,
  'withholding_backfilled',
  status,
  status,
  jsonb_build_object(
    'automatic', true,
    'withholding_total', withholding_total,
    'reason', 'Matrah + KDV - ödenecek tutar kontrolü'
  ),
  'system'
FROM corrected;

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
      AND public.rex_has_role(ARRAY['admin', 'accounting'])
  ), scored AS (
    SELECT
      s.id,
      s.shipment_code,
      s.supplier_id,
      coalesce(c.company, c.name) AS supplier_name,
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
            SELECT 1
            FROM public.customers direct_supplier
            WHERE direct_supplier.id = s.supplier_id
              AND regexp_replace(coalesce(direct_supplier.vergi_no, direct_supplier.tc_no, ''), '\D', '', 'g') =
                  regexp_replace(i.issuer_tax_id, '\D', '', 'g')
          ) OR EXISTS (
            SELECT 1
            FROM public.supplier_invoice_issuers m
            WHERE m.operational_supplier_id = s.supplier_id
              AND regexp_replace(m.issuer_tax_id, '\D', '', 'g') = regexp_replace(i.issuer_tax_id, '\D', '', 'g')
              AND m.active
              AND m.approved_at IS NOT NULL
              AND (m.valid_until IS NULL OR m.valid_until >= i.invoice_date)
          ) THEN 30 ELSE 0
        END +
        CASE
          WHEN s.cost_currency = i.currency
            AND abs(coalesce(s.cost, 0) - i.net_total) <= greatest(i.net_total * 0.05, 1)
          THEN 25 ELSE 0
        END +
        CASE WHEN abs(s.pickup_date - i.invoice_date) <= 15 THEN 10 ELSE 0 END +
        CASE WHEN coalesce(i.description, '') ILIKE '%' || s.shipment_code || '%' THEN 30 ELSE 0 END
      )::integer AS score,
      array_remove(ARRAY[
        CASE WHEN s.supplier_id = i.operational_supplier_id THEN 'Kayıtlı nakliyeci aynı' END,
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM public.customers direct_supplier
            WHERE direct_supplier.id = s.supplier_id
              AND regexp_replace(coalesce(direct_supplier.vergi_no, direct_supplier.tc_no, ''), '\D', '', 'g') =
                  regexp_replace(i.issuer_tax_id, '\D', '', 'g')
          ) THEN 'Fatura VKN/TCKN bilgisi nakliyeciyle aynı'
          WHEN EXISTS (
            SELECT 1
            FROM public.supplier_invoice_issuers m
            WHERE m.operational_supplier_id = s.supplier_id
              AND regexp_replace(m.issuer_tax_id, '\D', '', 'g') = regexp_replace(i.issuer_tax_id, '\D', '', 'g')
              AND m.active
              AND m.approved_at IS NOT NULL
          ) THEN 'Onaylı fatura düzenleyicisi bağlantısı'
        END,
        CASE
          WHEN s.cost_currency = i.currency
            AND abs(coalesce(s.cost, 0) - i.net_total) <= greatest(i.net_total * 0.05, 1)
          THEN 'KDV hariç fatura matrahı beklenen maliyetle uyumlu'
        END,
        CASE WHEN abs(s.pickup_date - i.invoice_date) <= 15 THEN 'Tarihler yakın' END,
        CASE WHEN coalesce(i.description, '') ILIKE '%' || s.shipment_code || '%' THEN 'Açıklamada sevkiyat kodu var' END
      ], NULL) AS reasons
    FROM inv i
    JOIN public.shipments s ON s.status NOT IN ('iptal', 'İptal')
    LEFT JOIN public.customers c ON c.id = s.supplier_id
    WHERE s.pickup_date BETWEEN i.invoice_date - interval '60 days' AND i.invoice_date + interval '15 days'
  )
  SELECT
    id, shipment_code, supplier_id, supplier_name, origin, destination,
    pickup_date, status, cost, cost_currency, score, reasons
  FROM scored
  WHERE score > 0
  ORDER BY score DESC, pickup_date DESC
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
  v_mismatch boolean := false;
  v_count integer := 0;
  v_status text;
  v_relation boolean;
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin', 'accounting']) THEN
    RAISE EXCEPTION 'Alış faturası eşleştirme yetkiniz yok';
  END IF;
  IF p_checked IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Fatura ve iş bilgileri kontrol edildi onayı zorunludur';
  END IF;

  SELECT * INTO v_invoice
  FROM public.incoming_purchase_invoices
  WHERE id = p_invoice_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Fatura bulunamadı'; END IF;
  IF v_invoice.status NOT IN ('review_required', 'match_proposed', 'approval_pending') THEN
    RAISE EXCEPTION 'Bu faturanın eşleştirmesi değiştirilemez';
  END IF;
  IF coalesce(v_invoice.net_total, 0) <= 0 THEN
    RAISE EXCEPTION 'KDV hariç fatura matrahı geçersiz';
  END IF;
  IF jsonb_typeof(p_allocations) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Sevkiyat dağılımı geçersiz';
  END IF;
  IF coalesce(p_general_expense, 0) < 0 THEN
    RAISE EXCEPTION 'Genel gider negatif olamaz';
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_allocations) LOOP
    IF coalesce((v_item->>'amount')::numeric, 0) <= 0 THEN
      RAISE EXCEPTION 'Dağıtım tutarı sıfırdan büyük olmalıdır';
    END IF;
    SELECT supplier_id INTO v_supplier
    FROM public.shipments
    WHERE id = (v_item->>'shipment_id')::uuid;
    IF NOT FOUND THEN RAISE EXCEPTION 'Sevkiyat bulunamadı'; END IF;
    IF v_invoice.operational_supplier_id IS NULL THEN
      UPDATE public.incoming_purchase_invoices
      SET operational_supplier_id = v_supplier
      WHERE id = p_invoice_id;
      v_invoice.operational_supplier_id := v_supplier;
    ELSIF v_supplier IS DISTINCT FROM v_invoice.operational_supplier_id THEN
      v_mismatch := true;
    END IF;
    v_sum := v_sum + (v_item->>'amount')::numeric;
    v_count := v_count + 1;
  END LOOP;

  IF abs(v_sum + coalesce(p_general_expense, 0) - v_invoice.net_total) > 0.01 THEN
    RAISE EXCEPTION 'Sevkiyat dağılımı ve genel gider toplamı KDV hariç fatura matrahına eşit olmalıdır';
  END IF;
  IF v_count = 0 AND coalesce(p_general_expense, 0) <= 0 THEN
    RAISE EXCEPTION 'En az bir sevkiyat veya genel gider seçilmelidir';
  END IF;

  SELECT EXISTS(
    SELECT 1
    FROM public.customers c
    WHERE c.id = v_invoice.operational_supplier_id
      AND regexp_replace(coalesce(c.vergi_no, c.tc_no, ''), '\D', '', 'g') = regexp_replace(v_invoice.issuer_tax_id, '\D', '', 'g')
  ) OR EXISTS(
    SELECT 1
    FROM public.supplier_invoice_issuers m
    WHERE m.operational_supplier_id = v_invoice.operational_supplier_id
      AND regexp_replace(m.issuer_tax_id, '\D', '', 'g') = regexp_replace(v_invoice.issuer_tax_id, '\D', '', 'g')
      AND m.active
      AND m.approved_at IS NOT NULL
      AND (m.valid_until IS NULL OR m.valid_until >= v_invoice.invoice_date)
  ) INTO v_relation;

  v_status := CASE WHEN v_mismatch OR NOT v_relation OR v_count > 1 OR EXISTS(
    SELECT 1
    FROM jsonb_array_elements(p_allocations) x
    JOIN public.shipments s ON s.id = (x->>'shipment_id')::uuid
    WHERE (x->>'amount')::numeric > coalesce(s.cost, 0) + 0.01
  ) THEN 'approval_pending' ELSE 'matched' END;

  INSERT INTO public.purchase_invoice_allocations(
    invoice_id, shipment_id, amount, match_score, match_reasons, created_by
  )
  SELECT
    p_invoice_id,
    (x->>'shipment_id')::uuid,
    (x->>'amount')::numeric,
    nullif(x->>'score', '')::integer,
    coalesce(ARRAY(SELECT jsonb_array_elements_text(coalesce(x->'reasons', '[]'::jsonb))), '{}'),
    auth.uid()
  FROM jsonb_array_elements(p_allocations) x;

  UPDATE public.incoming_purchase_invoices
  SET status = v_status,
      matched_at = now(),
      matched_by = auth.uid(),
      updated_at = now(),
      raw_payload = raw_payload || jsonb_build_object(
        'general_expense', coalesce(p_general_expense, 0),
        'match_reason', nullif(trim(p_reason), ''),
        'matching_basis', 'net_total',
        'matching_total', v_invoice.net_total,
        'vat_total', v_invoice.vat_total,
        'withholding_total', v_invoice.withholding_total,
        'payable_total', v_invoice.grand_total
      )
  WHERE id = p_invoice_id;

  PERFORM public.rex_record_purchase_invoice_event(
    p_invoice_id,
    'matched',
    v_invoice.status,
    v_status,
    jsonb_build_object(
      'allocations', p_allocations,
      'general_expense', coalesce(p_general_expense, 0),
      'reason', p_reason,
      'matching_basis', 'net_total',
      'matching_total', v_invoice.net_total,
      'vat_total', v_invoice.vat_total,
      'withholding_total', v_invoice.withholding_total,
      'payable_total', v_invoice.grand_total
    )
  );
  RETURN v_status;
END
$$;

REVOKE ALL ON FUNCTION public.rex_purchase_invoice_candidates(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rex_match_purchase_invoice(uuid, jsonb, numeric, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rex_purchase_invoice_candidates(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_match_purchase_invoice(uuid, jsonb, numeric, boolean, text) TO authenticated;

COMMENT ON FUNCTION public.rex_purchase_invoice_candidates(uuid) IS
  'Suggests shipment matches by comparing VAT-exclusive shipment costs with the invoice net tax base.';
COMMENT ON FUNCTION public.rex_match_purchase_invoice(uuid, jsonb, numeric, boolean, text) IS
  'Allocates the VAT-exclusive invoice tax base to shipments while preserving VAT, withholding, and payable totals separately.';

COMMIT;
