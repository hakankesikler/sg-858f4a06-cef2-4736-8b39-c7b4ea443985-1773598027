-- A shipment's operational carrier and an incoming invoice's legal issuer are
-- independent parties. Keep shipments.supplier_id as the optional operational
-- carrier for compatibility, and store the payable legal entity separately.

ALTER TABLE public.incoming_purchase_invoices
  ADD COLUMN IF NOT EXISTS billing_supplier_id uuid
  REFERENCES public.customers(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS incoming_purchase_invoices_billing_supplier_idx
  ON public.incoming_purchase_invoices(billing_supplier_id,invoice_date DESC);

COMMENT ON COLUMN public.shipments.supplier_id IS
  'Optional operational carrier/haulier. It does not determine the legal invoice issuer or payable account.';
COMMENT ON COLUMN public.incoming_purchase_invoices.operational_supplier_id IS
  'Optional carrier/haulier that physically operated the matched shipment.';
COMMENT ON COLUMN public.incoming_purchase_invoices.billing_supplier_id IS
  'Legal invoice issuer and payable supplier, resolved by invoice VKN/TCKN.';

CREATE OR REPLACE FUNCTION public.rex_resolve_purchase_invoice_billing_supplier()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
  v_supplier_id uuid;
  v_candidate_count integer;
  v_selected_tax text;
  v_selected_is_active boolean;
  v_tax text:=regexp_replace(coalesce(NEW.issuer_tax_id,''),'\D','','g');
BEGIN
  IF NEW.billing_supplier_id IS NOT NULL THEN
    SELECT regexp_replace(coalesce(nullif(c.vergi_no,''),nullif(c.tc_no,''),''),'\D','','g'),
      c.account_type IN ('tedarikci','her_ikisi') AND c.archived_at IS NULL
      INTO v_selected_tax,v_selected_is_active
    FROM public.customers c WHERE c.id=NEW.billing_supplier_id;
    IF coalesce(v_selected_is_active,false) IS DISTINCT FROM true THEN
      RAISE EXCEPTION 'Fatura carisi aktif bir tedarikçi olmalıdır';
    END IF;
    IF v_selected_tax IS DISTINCT FROM v_tax THEN
      RAISE EXCEPTION 'Fatura carisinin VKN/TCKN bilgisi faturayla eşleşmiyor';
    END IF;
    RETURN NEW;
  END IF;
  IF length(v_tax) NOT BETWEEN 10 AND 11 THEN RETURN NEW; END IF;

  SELECT (array_agg(c.id ORDER BY c.created_at,c.id))[1],count(*)
    INTO v_supplier_id,v_candidate_count
  FROM public.customers c
  WHERE c.account_type IN ('tedarikci','her_ikisi')
    AND c.archived_at IS NULL
    AND regexp_replace(coalesce(nullif(c.vergi_no,''),nullif(c.tc_no,''),''),'\D','','g')=v_tax;

  IF v_candidate_count=1 THEN NEW.billing_supplier_id:=v_supplier_id; END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS rex_purchase_invoice_billing_supplier_resolver ON public.incoming_purchase_invoices;
CREATE TRIGGER rex_purchase_invoice_billing_supplier_resolver
  BEFORE INSERT OR UPDATE OF issuer_tax_id,billing_supplier_id ON public.incoming_purchase_invoices
  FOR EACH ROW EXECUTE FUNCTION public.rex_resolve_purchase_invoice_billing_supplier();

CREATE OR REPLACE FUNCTION public.rex_link_unmatched_invoices_from_supplier()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
  v_tax text:=regexp_replace(coalesce(nullif(NEW.vergi_no,''),nullif(NEW.tc_no,''),''),'\D','','g');
BEGIN
  IF NEW.account_type NOT IN ('tedarikci','her_ikisi') OR NEW.archived_at IS NOT NULL OR length(v_tax) NOT BETWEEN 10 AND 11 THEN RETURN NEW; END IF;
  IF 1=(
    SELECT count(*) FROM public.customers c
    WHERE c.account_type IN ('tedarikci','her_ikisi') AND c.archived_at IS NULL
      AND regexp_replace(coalesce(nullif(c.vergi_no,''),nullif(c.tc_no,''),''),'\D','','g')=v_tax
  ) THEN
    UPDATE public.incoming_purchase_invoices
      SET billing_supplier_id=NEW.id,updated_at=now()
    WHERE billing_supplier_id IS NULL
      AND regexp_replace(coalesce(issuer_tax_id,''),'\D','','g')=v_tax;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS rex_customer_links_unmatched_purchase_invoices ON public.customers;
CREATE TRIGGER rex_customer_links_unmatched_purchase_invoices
  AFTER INSERT OR UPDATE OF vergi_no,tc_no,account_type,archived_at ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.rex_link_unmatched_invoices_from_supplier();

WITH normalized_suppliers AS (
  SELECT regexp_replace(coalesce(nullif(c.vergi_no,''),nullif(c.tc_no,''),''),'\D','','g') tax_id,
    (array_agg(c.id ORDER BY c.created_at,c.id))[1] supplier_id,
    count(*) candidate_count
  FROM public.customers c
  WHERE c.account_type IN ('tedarikci','her_ikisi') AND c.archived_at IS NULL
  GROUP BY regexp_replace(coalesce(nullif(c.vergi_no,''),nullif(c.tc_no,''),''),'\D','','g')
)
UPDATE public.incoming_purchase_invoices i
SET billing_supplier_id=s.supplier_id,updated_at=now()
FROM normalized_suppliers s
WHERE i.billing_supplier_id IS NULL AND s.candidate_count=1
  AND length(s.tax_id) BETWEEN 10 AND 11
  AND regexp_replace(coalesce(i.issuer_tax_id,''),'\D','','g')=s.tax_id;

CREATE OR REPLACE FUNCTION public.rex_set_purchase_invoice_billing_supplier(
  p_invoice_id uuid,p_supplier_id uuid
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
  v_invoice public.incoming_purchase_invoices%ROWTYPE;
  v_supplier public.customers%ROWTYPE;
  v_invoice_tax text;
  v_supplier_tax text;
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin','accounting']) THEN RAISE EXCEPTION 'Fatura carisi eşleştirme yetkiniz yok'; END IF;
  SELECT * INTO v_invoice FROM public.incoming_purchase_invoices WHERE id=p_invoice_id FOR UPDATE;
  IF NOT FOUND OR v_invoice.status NOT IN ('review_required','match_proposed','approval_pending','matched') THEN
    RAISE EXCEPTION 'Bu faturanın cari eşleştirmesi değiştirilemez';
  END IF;
  SELECT * INTO v_supplier FROM public.customers
    WHERE id=p_supplier_id AND account_type IN ('tedarikci','her_ikisi') AND archived_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Aktif fatura carisi bulunamadı'; END IF;

  v_invoice_tax:=regexp_replace(coalesce(v_invoice.issuer_tax_id,''),'\D','','g');
  v_supplier_tax:=regexp_replace(coalesce(nullif(v_supplier.vergi_no,''),nullif(v_supplier.tc_no,''),''),'\D','','g');
  IF v_invoice_tax<>v_supplier_tax THEN RAISE EXCEPTION 'Seçilen carinin VKN/TCKN bilgisi faturayla eşleşmiyor'; END IF;

  UPDATE public.incoming_purchase_invoices
    SET billing_supplier_id=p_supplier_id,updated_at=now()
  WHERE id=p_invoice_id;
  PERFORM public.rex_record_purchase_invoice_event(
    p_invoice_id,'billing_supplier_linked',v_invoice.status,v_invoice.status,
    jsonb_build_object('billing_supplier_id',p_supplier_id,'tax_id',v_invoice_tax)
  );
END $$;

REVOKE ALL ON FUNCTION public.rex_set_purchase_invoice_billing_supplier(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rex_set_purchase_invoice_billing_supplier(uuid,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.rex_approve_purchase_invoice(p_invoice_id uuid,p_confirmation boolean,p_note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
  v_invoice public.incoming_purchase_invoices%ROWTYPE;
  v_email text:=lower(coalesce(auth.jwt()->>'email',''));
  v_count integer;
  v_shipment uuid;
  v_purchase uuid;
BEGIN
  IF p_confirmation IS DISTINCT FROM true THEN RAISE EXCEPTION 'Yönetici onayı kutusu işaretlenmelidir'; END IF;
  IF v_email<>'info@rexlojistik.com' OR NOT public.rex_has_role(ARRAY['admin']) THEN RAISE EXCEPTION 'Bu işlem yalnızca şirket sahibi hesabından onaylanabilir'; END IF;
  SELECT * INTO v_invoice FROM public.incoming_purchase_invoices WHERE id=p_invoice_id FOR UPDATE;
  IF NOT FOUND OR v_invoice.status NOT IN ('matched','approval_pending') THEN RAISE EXCEPTION 'Fatura onaya hazır değil'; END IF;
  IF v_invoice.billing_supplier_id IS NULL THEN
    RAISE EXCEPTION 'Faturayı düzenleyen cari VKN/TCKN ile eşleştirilemedi; önce fatura carisini seçin';
  END IF;
  SELECT count(*) INTO v_count FROM public.purchase_invoice_allocations WHERE invoice_id=p_invoice_id AND active=true;
  SELECT shipment_id INTO v_shipment FROM public.purchase_invoice_allocations WHERE invoice_id=p_invoice_id AND active=true ORDER BY created_at LIMIT 1;

  INSERT INTO public.purchases(purchase_no,supplier_id,shipment_id,purchase_date,due_date,subtotal,tax,total,status,notes)
  VALUES(
    v_invoice.invoice_no,v_invoice.billing_supplier_id,CASE WHEN v_count=1 THEN v_shipment ELSE NULL END,
    v_invoice.invoice_date,v_invoice.due_date,v_invoice.net_total,v_invoice.vat_total,v_invoice.grand_total,'beklemede',
    coalesce(v_invoice.description,'')||CASE WHEN p_note IS NULL THEN '' ELSE E'\nOnay: '||p_note END
  ) RETURNING id INTO v_purchase;

  UPDATE public.incoming_purchase_invoices
    SET status='payment_pending',approved_at=now(),approved_by=auth.uid(),legacy_purchase_id=v_purchase,updated_at=now()
  WHERE id=p_invoice_id;
  IF v_count=1 THEN UPDATE public.shipments SET purchase_invoice_id=v_purchase,updated_at=now() WHERE id=v_shipment; END IF;
  PERFORM public.rex_record_purchase_invoice_event(
    p_invoice_id,'owner_approved',v_invoice.status,'payment_pending',
    jsonb_build_object(
      'note',p_note,'purchase_id',v_purchase,
      'billing_supplier_id',v_invoice.billing_supplier_id,
      'operational_supplier_id',v_invoice.operational_supplier_id
    )
  );
END $$;

REVOKE ALL ON FUNCTION public.rex_approve_purchase_invoice(uuid,boolean,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rex_approve_purchase_invoice(uuid,boolean,text) TO authenticated;

REVOKE ALL ON FUNCTION public.rex_resolve_purchase_invoice_billing_supplier() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.rex_link_unmatched_invoices_from_supplier() FROM PUBLIC,anon,authenticated;

COMMENT ON FUNCTION public.rex_approve_purchase_invoice(uuid,boolean,text) IS
  'Creates the payable against the legal billing supplier while retaining the optional operational carrier separately.';
