BEGIN;

-- Ensure every incoming purchase invoice has one legal supplier card. Existing
-- cards are reused by VKN/TCKN, customer-only cards are promoted, and a new
-- card is created only when the legal identity is unique and complete.
CREATE OR REPLACE FUNCTION public.rex_ensure_purchase_invoice_billing_supplier(
  p_invoice_id uuid
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_invoice public.incoming_purchase_invoices%ROWTYPE;
  v_tax text;
  v_supplier_id uuid;
  v_account_type text;
  v_candidate_count integer := 0;
  v_code text;
  v_created boolean := false;
  v_promoted boolean := false;
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin', 'accounting']) THEN
    RAISE EXCEPTION 'Fatura carisi oluşturma yetkiniz yok';
  END IF;

  SELECT * INTO v_invoice
  FROM public.incoming_purchase_invoices
  WHERE id = p_invoice_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Fatura bulunamadı'; END IF;
  IF v_invoice.billing_supplier_id IS NOT NULL THEN
    RETURN v_invoice.billing_supplier_id;
  END IF;

  v_tax := regexp_replace(coalesce(v_invoice.issuer_tax_id, ''), '\D', '', 'g');
  IF length(v_tax) NOT BETWEEN 10 AND 11 OR nullif(trim(v_invoice.issuer_name), '') IS NULL THEN
    RAISE EXCEPTION 'Fatura carisi için geçerli VKN/TCKN ve unvan gereklidir';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('rex_purchase_invoice_supplier:' || v_tax));

  SELECT
    (array_agg(c.id ORDER BY c.created_at, c.id))[1],
    (array_agg(c.account_type ORDER BY c.created_at, c.id))[1],
    count(*)
  INTO v_supplier_id, v_account_type, v_candidate_count
  FROM public.customers c
  WHERE c.archived_at IS NULL
    AND regexp_replace(coalesce(nullif(c.vergi_no, ''), nullif(c.tc_no, ''), ''), '\D', '', 'g') = v_tax;

  IF v_candidate_count > 1 THEN
    RAISE EXCEPTION 'Aynı VKN/TCKN ile birden fazla cari bulundu; mükerrer cariler düzeltilmelidir';
  ELSIF v_candidate_count = 1 THEN
    IF v_account_type = 'musteri' THEN
      UPDATE public.customers
      SET account_type = 'her_ikisi',
          supplier_category = coalesce(supplier_category, 'diger'),
          updated_at = now()
      WHERE id = v_supplier_id;
      v_promoted := true;
    ELSIF v_account_type NOT IN ('tedarikci', 'her_ikisi') THEN
      RAISE EXCEPTION 'VKN/TCKN ile bulunan cari tedarikçi olarak kullanılamaz';
    END IF;
  ELSE
    v_code := 'KBS-' || v_tax;
    IF EXISTS (SELECT 1 FROM public.customers WHERE customer_code = v_code) THEN
      v_code := 'KBS-' || substr(md5(v_tax || ':' || p_invoice_id::text), 1, 12);
    END IF;

    INSERT INTO public.customers(
      name, company, customer_code, account_type, supplier_category, status,
      vergi_no, tc_no, tax_office, notes, updated_at
    ) VALUES (
      trim(v_invoice.issuer_name), trim(v_invoice.issuer_name), v_code,
      'tedarikci', 'diger', 'Aktif',
      CASE WHEN length(v_tax) = 10 THEN v_tax END,
      CASE WHEN length(v_tax) = 11 THEN v_tax END,
      nullif(trim(v_invoice.issuer_tax_office), ''),
      'Gelen alış faturası üzerinden VKN/TCKN ile otomatik oluşturuldu.', now()
    )
    RETURNING id INTO v_supplier_id;
    v_created := true;
  END IF;

  UPDATE public.incoming_purchase_invoices
  SET billing_supplier_id = v_supplier_id,
      updated_at = now()
  WHERE id = p_invoice_id;

  PERFORM public.rex_record_purchase_invoice_event(
    p_invoice_id,
    'billing_supplier_ensured',
    v_invoice.status,
    v_invoice.status,
    jsonb_build_object(
      'billing_supplier_id', v_supplier_id,
      'tax_id', v_tax,
      'created', v_created,
      'promoted', v_promoted
    )
  );

  RETURN v_supplier_id;
END
$$;

REVOKE ALL ON FUNCTION public.rex_ensure_purchase_invoice_billing_supplier(uuid)
  FROM PUBLIC, anon, authenticated;

-- Completed shipments normally require the revision workflow. The sole
-- exception below permits a previously empty operational carrier to be filled
-- from the legal invoice supplier while the same invoice is actively matched.
CREATE OR REPLACE FUNCTION public.rex_guard_completed_shipment_critical_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_revision text := current_setting('rex.approved_revision_id', true);
  v_match_invoice text := current_setting('rex.purchase_invoice_match_id', true);
  v_invoice_assignment boolean := false;
BEGIN
  IF OLD.status IN ('teslim_edildi', 'Teslim Edildi') AND (
    OLD.customer_id IS DISTINCT FROM NEW.customer_id OR OLD.supplier_id IS DISTINCT FROM NEW.supplier_id OR
    OLD.driver_id IS DISTINCT FROM NEW.driver_id OR OLD.vehicle_id IS DISTINCT FROM NEW.vehicle_id OR
    OLD.origin IS DISTINCT FROM NEW.origin OR OLD.destination IS DISTINCT FROM NEW.destination OR
    OLD.pickup_date IS DISTINCT FROM NEW.pickup_date OR OLD.estimated_delivery_date IS DISTINCT FROM NEW.estimated_delivery_date OR
    OLD.cost IS DISTINCT FROM NEW.cost OR OLD.currency IS DISTINCT FROM NEW.currency OR OLD.cost_currency IS DISTINCT FROM NEW.cost_currency OR
    OLD.sender_name IS DISTINCT FROM NEW.sender_name OR OLD.sender_ii IS DISTINCT FROM NEW.sender_ii OR
    OLD.receiver IS DISTINCT FROM NEW.receiver OR OLD.receiver_district IS DISTINCT FROM NEW.receiver_district OR OLD.receiver_ii IS DISTINCT FROM NEW.receiver_ii OR
    OLD.adet IS DISTINCT FROM NEW.adet OR OLD.cinsi IS DISTINCT FROM NEW.cinsi OR OLD.kg_ds IS DISTINCT FROM NEW.kg_ds OR
    OLD.toplam_kg_ds IS DISTINCT FROM NEW.toplam_kg_ds OR OLD.satis_tutar IS DISTINCT FROM NEW.satis_tutar
  ) THEN
    IF nullif(v_match_invoice, '') IS NOT NULL
       AND OLD.supplier_id IS NULL
       AND NEW.supplier_id IS NOT NULL
       AND OLD.customer_id IS NOT DISTINCT FROM NEW.customer_id
       AND OLD.driver_id IS NOT DISTINCT FROM NEW.driver_id
       AND OLD.vehicle_id IS NOT DISTINCT FROM NEW.vehicle_id
       AND OLD.origin IS NOT DISTINCT FROM NEW.origin
       AND OLD.destination IS NOT DISTINCT FROM NEW.destination
       AND OLD.pickup_date IS NOT DISTINCT FROM NEW.pickup_date
       AND OLD.estimated_delivery_date IS NOT DISTINCT FROM NEW.estimated_delivery_date
       AND OLD.cost IS NOT DISTINCT FROM NEW.cost
       AND OLD.currency IS NOT DISTINCT FROM NEW.currency
       AND OLD.cost_currency IS NOT DISTINCT FROM NEW.cost_currency
       AND OLD.sender_name IS NOT DISTINCT FROM NEW.sender_name
       AND OLD.sender_ii IS NOT DISTINCT FROM NEW.sender_ii
       AND OLD.receiver IS NOT DISTINCT FROM NEW.receiver
       AND OLD.receiver_district IS NOT DISTINCT FROM NEW.receiver_district
       AND OLD.receiver_ii IS NOT DISTINCT FROM NEW.receiver_ii
       AND OLD.adet IS NOT DISTINCT FROM NEW.adet
       AND OLD.cinsi IS NOT DISTINCT FROM NEW.cinsi
       AND OLD.kg_ds IS NOT DISTINCT FROM NEW.kg_ds
       AND OLD.toplam_kg_ds IS NOT DISTINCT FROM NEW.toplam_kg_ds
       AND OLD.satis_tutar IS NOT DISTINCT FROM NEW.satis_tutar
       AND public.rex_has_role(ARRAY['admin', 'accounting'])
    THEN
      SELECT EXISTS(
        SELECT 1
        FROM public.incoming_purchase_invoices i
        JOIN public.purchase_invoice_allocations a
          ON a.invoice_id = i.id AND a.shipment_id = OLD.id AND a.active
        WHERE i.id = v_match_invoice::uuid
          AND i.billing_supplier_id = NEW.supplier_id
      ) INTO v_invoice_assignment;
    END IF;

    IF NOT v_invoice_assignment AND (
      nullif(v_revision, '') IS NULL OR NOT EXISTS (
        SELECT 1 FROM public.shipment_revision_requests r
        WHERE r.id = v_revision::uuid AND r.shipment_id = OLD.id AND r.status = 'approved'
      )
    ) THEN
      RAISE EXCEPTION 'Tamamlanmış sevkiyatın kritik alanları yalnızca onaylı revizyonla değiştirilebilir';
    END IF;
  END IF;
  RETURN NEW;
END
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
  v_effective_supplier uuid;
  v_operational_supplier uuid;
  v_preselected_supplier uuid;
  v_billing_supplier uuid;
  v_mismatch boolean := false;
  v_count integer := 0;
  v_status text;
  v_relation boolean := false;
  v_assigned_count integer := 0;
  v_email text := lower(coalesce(auth.jwt()->>'email', ''));
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

  v_preselected_supplier := v_invoice.operational_supplier_id;
  v_billing_supplier := public.rex_ensure_purchase_invoice_billing_supplier(p_invoice_id);
  v_invoice.billing_supplier_id := v_billing_supplier;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_allocations) LOOP
    IF coalesce((v_item->>'amount')::numeric, 0) <= 0 THEN
      RAISE EXCEPTION 'Dağıtım tutarı sıfırdan büyük olmalıdır';
    END IF;

    SELECT supplier_id INTO v_supplier
    FROM public.shipments
    WHERE id = (v_item->>'shipment_id')::uuid
    FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Sevkiyat bulunamadı'; END IF;

    -- A carrier already recorded on the shipment is authoritative. Only an
    -- empty carrier is completed from the invoice's legal supplier.
    v_effective_supplier := coalesce(v_supplier, v_billing_supplier);
    IF v_operational_supplier IS NULL THEN
      v_operational_supplier := v_effective_supplier;
    ELSIF v_operational_supplier IS DISTINCT FROM v_effective_supplier THEN
      v_mismatch := true;
    END IF;
    IF v_preselected_supplier IS NOT NULL
       AND v_preselected_supplier IS DISTINCT FROM v_effective_supplier THEN
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

  -- Rematching keeps history while ensuring there is only one active
  -- allocation for each selected shipment.
  UPDATE public.purchase_invoice_allocations
  SET active = false
  WHERE invoice_id = p_invoice_id AND active;

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

  PERFORM set_config('rex.purchase_invoice_match_id', p_invoice_id::text, true);
  WITH assigned AS (
    UPDATE public.shipments s
    SET supplier_id = v_billing_supplier,
        updated_at = now()
    WHERE s.supplier_id IS NULL
      AND s.id IN (
        SELECT (x->>'shipment_id')::uuid
        FROM jsonb_array_elements(p_allocations) x
      )
    RETURNING s.id
  )
  SELECT count(*) INTO v_assigned_count FROM assigned;

  IF v_operational_supplier IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1
      FROM public.customers c
      WHERE c.id = v_operational_supplier
        AND regexp_replace(coalesce(c.vergi_no, c.tc_no, ''), '\D', '', 'g') =
            regexp_replace(v_invoice.issuer_tax_id, '\D', '', 'g')
    ) OR EXISTS(
      SELECT 1
      FROM public.supplier_invoice_issuers m
      WHERE m.operational_supplier_id = v_operational_supplier
        AND regexp_replace(m.issuer_tax_id, '\D', '', 'g') = regexp_replace(v_invoice.issuer_tax_id, '\D', '', 'g')
        AND m.active
        AND m.approved_at IS NOT NULL
        AND (m.valid_until IS NULL OR m.valid_until >= v_invoice.invoice_date)
    ) INTO v_relation;
  END IF;

  v_status := CASE WHEN v_mismatch OR NOT v_relation OR v_count > 1 OR EXISTS(
    SELECT 1
    FROM jsonb_array_elements(p_allocations) x
    JOIN public.shipments s ON s.id = (x->>'shipment_id')::uuid
    WHERE (x->>'amount')::numeric > coalesce(s.cost, 0) + 0.01
  ) THEN 'approval_pending' ELSE 'matched' END;

  UPDATE public.incoming_purchase_invoices
  SET status = v_status,
      operational_supplier_id = v_operational_supplier,
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
        'payable_total', v_invoice.grand_total,
        'invoice_carrier_assignments', v_assigned_count
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
      'billing_supplier_id', v_billing_supplier,
      'operational_supplier_id', v_operational_supplier,
      'invoice_carrier_assignments', v_assigned_count,
      'matching_basis', 'net_total',
      'matching_total', v_invoice.net_total,
      'vat_total', v_invoice.vat_total,
      'withholding_total', v_invoice.withholding_total,
      'payable_total', v_invoice.grand_total
    )
  );

  -- The company-owner admin already performed the explicit matching check.
  -- Clean one-shipment matches can therefore create the payable atomically;
  -- exceptions remain in the review queue and keep the existing approval path.
  IF v_status = 'matched'
     AND v_email = 'info@rexlojistik.com'
     AND public.rex_has_role(ARRAY['admin']) THEN
    PERFORM public.rex_approve_purchase_invoice(p_invoice_id, true, p_reason);
    RETURN 'payment_pending';
  END IF;

  RETURN v_status;
END
$$;

REVOKE ALL ON FUNCTION public.rex_match_purchase_invoice(uuid, jsonb, numeric, boolean, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rex_match_purchase_invoice(uuid, jsonb, numeric, boolean, text)
  TO authenticated;

COMMENT ON FUNCTION public.rex_ensure_purchase_invoice_billing_supplier(uuid) IS
  'Reuses or creates the unique legal supplier card for an incoming invoice by verified VKN/TCKN.';
COMMENT ON FUNCTION public.rex_match_purchase_invoice(uuid, jsonb, numeric, boolean, text) IS
  'Matches net invoice cost, fills only empty shipment carriers from the legal supplier, preserves existing carriers, and finalizes clean owner-admin matches.';

COMMIT;
