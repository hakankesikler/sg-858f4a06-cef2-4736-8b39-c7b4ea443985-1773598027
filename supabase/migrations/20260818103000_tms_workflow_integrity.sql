-- End-to-end TMS workflow integrity.
-- Existing business rows are preserved; only unambiguous missing links are backfilled.

CREATE UNIQUE INDEX IF NOT EXISTS shipments_shipment_code_unique
  ON public.shipments (shipment_code);
CREATE UNIQUE INDEX IF NOT EXISTS sales_invoices_invoice_no_unique
  ON public.sales_invoices (invoice_no);

ALTER TABLE public.account_transactions
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'TRY';
CREATE INDEX IF NOT EXISTS account_transactions_customer_id_idx
  ON public.account_transactions (customer_id, transaction_date DESC);

INSERT INTO public.account_transactions (
  account_type, account_id, customer_id, transaction_type, amount,
  description, reference_no, transaction_date
)
SELECT
  'Genel', i.customer_id, i.customer_id,
  CASE WHEN i.invoice_no LIKE 'BORC-%' THEN 'Borç' ELSE 'Alacak' END,
  abs(i.grand_total), coalesce(i.notes,'Geçmiş cari düzeltmesi'),
  i.invoice_no, i.invoice_date::timestamp with time zone
FROM public.sales_invoices i
WHERE (i.invoice_no LIKE 'BORC-%' OR i.invoice_no LIKE 'ALACAK-%')
  AND i.customer_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.account_transactions a
    WHERE a.customer_id=i.customer_id AND a.reference_no=i.invoice_no
  );

INSERT INTO public.account_transactions (
  account_type, account_id, customer_id, transaction_type, amount,
  description, reference_no, transaction_date
)
SELECT
  'Genel', p.supplier_id, p.supplier_id,
  CASE WHEN p.purchase_no LIKE 'BORC-%' THEN 'Borç' ELSE 'Alacak' END,
  abs(p.total), coalesce(p.notes,'Geçmiş cari düzeltmesi'),
  p.purchase_no, p.purchase_date::timestamp with time zone
FROM public.purchases p
WHERE (p.purchase_no LIKE 'BORC-%' OR p.purchase_no LIKE 'ALACAK-%')
  AND p.supplier_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.account_transactions a
    WHERE a.customer_id=p.supplier_id AND a.reference_no=p.purchase_no
  );

UPDATE public.shipments s
SET customer_id = (
      SELECT c.id
      FROM public.customers c
      WHERE lower(trim(c.name)) = lower(trim(s.sender_name))
      LIMIT 1
    ),
    updated_at = now()
WHERE s.customer_id IS NULL
  AND s.sender_name IS NOT NULL
  AND 1 = (
    SELECT count(*)
    FROM public.customers c
    WHERE lower(trim(c.name)) = lower(trim(s.sender_name))
  );

UPDATE public.shipments
SET invoice_status = CASE WHEN sale_invoice_id IS NULL THEN 'beklemede' ELSE 'faturalandi' END,
    updated_at = now()
WHERE invoice_status IS NULL;

CREATE OR REPLACE FUNCTION public.rex_save_shipment(
  p_shipment_id uuid,
  p_shipment jsonb,
  p_cargo_items jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id uuid;
  v_code text;
  v_item jsonb;
  v_item_count integer := 0;
  v_total_units integer := 0;
  v_total_weight numeric := 0;
  v_total_price numeric := 0;
  v_first_kind text;
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin','operations']) THEN
    RAISE EXCEPTION 'Bu işlem için yetkiniz bulunmuyor';
  END IF;

  IF NULLIF(p_shipment->>'customer_id', '') IS NULL
     OR NULLIF(p_shipment->>'driver_id', '') IS NULL
     OR NULLIF(p_shipment->>'vehicle_id', '') IS NULL
     OR NULLIF(trim(p_shipment->>'origin'), '') IS NULL
     OR NULLIF(trim(p_shipment->>'destination'), '') IS NULL
     OR NULLIF(p_shipment->>'pickup_date', '') IS NULL THEN
    RAISE EXCEPTION 'Müşteri, sürücü, araç, çıkış, varış ve yükleme tarihi zorunludur';
  END IF;

  IF jsonb_typeof(p_cargo_items) IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_cargo_items) = 0 THEN
    RAISE EXCEPTION 'En az bir yük kalemi gereklidir';
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_cargo_items)
  LOOP
    IF coalesce((v_item->>'adet')::integer, 0) <= 0
       OR coalesce((v_item->>'kg_ds')::numeric, 0) <= 0
       OR NULLIF(trim(v_item->>'cinsi'), '') IS NULL THEN
      RAISE EXCEPTION 'Yük kalemlerinde adet, cins ve kg/desi zorunludur';
    END IF;
    v_item_count := v_item_count + 1;
    v_total_units := v_total_units + (v_item->>'adet')::integer;
    v_total_weight := v_total_weight + ((v_item->>'adet')::numeric * (v_item->>'kg_ds')::numeric);
    v_total_price := v_total_price + coalesce((v_item->>'alt_toplam_fiyat')::numeric, 0);
    IF v_first_kind IS NULL THEN v_first_kind := trim(v_item->>'cinsi'); END IF;
  END LOOP;

  IF p_shipment_id IS NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext('rex_shipment_code'));
    SELECT 'SHP-' || lpad((coalesce(max((regexp_match(shipment_code, '^SHP-(\d+)$'))[1]::integer), 0) + 1)::text, 6, '0')
    INTO v_code
    FROM public.shipments;

    INSERT INTO public.shipments (
      shipment_code, supplier_id, driver_id, vehicle_id, customer_id,
      origin, destination, pickup_date, estimated_delivery_date,
      cost, cost_currency, currency, status, sender_name, sender_ii,
      receiver, receiver_district, receiver_ii, adet, cinsi, kg_ds,
      toplam_kg_ds, satis_tutar, invoice_status
    ) VALUES (
      v_code,
      nullif(p_shipment->>'supplier_id','')::uuid,
      nullif(p_shipment->>'driver_id','')::uuid,
      nullif(p_shipment->>'vehicle_id','')::uuid,
      nullif(p_shipment->>'customer_id','')::uuid,
      trim(p_shipment->>'origin'), trim(p_shipment->>'destination'),
      nullif(p_shipment->>'pickup_date','')::date,
      nullif(p_shipment->>'estimated_delivery_date','')::date,
      nullif(p_shipment->>'cost','')::numeric,
      coalesce(nullif(p_shipment->>'cost_currency',''),'TRY'),
      coalesce(nullif(p_shipment->>'currency',''),'TRY'),
      'beklemede', nullif(trim(p_shipment->>'sender_name'),''),
      nullif(trim(p_shipment->>'sender_ii'),''),
      nullif(trim(p_shipment->>'receiver'),''),
      nullif(trim(p_shipment->>'receiver_district'),''),
      nullif(trim(p_shipment->>'receiver_ii'),''),
      v_total_units, v_first_kind,
      CASE WHEN v_total_units > 0 THEN v_total_weight / v_total_units ELSE 0 END,
      v_total_weight, v_total_price, 'beklemede'
    ) RETURNING id INTO v_id;
  ELSE
    SELECT shipment_code INTO v_code
    FROM public.shipments
    WHERE id = p_shipment_id
    FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Sevkiyat bulunamadı'; END IF;

    UPDATE public.shipments SET
      supplier_id = nullif(p_shipment->>'supplier_id','')::uuid,
      driver_id = nullif(p_shipment->>'driver_id','')::uuid,
      vehicle_id = nullif(p_shipment->>'vehicle_id','')::uuid,
      customer_id = nullif(p_shipment->>'customer_id','')::uuid,
      origin = trim(p_shipment->>'origin'),
      destination = trim(p_shipment->>'destination'),
      pickup_date = nullif(p_shipment->>'pickup_date','')::date,
      estimated_delivery_date = nullif(p_shipment->>'estimated_delivery_date','')::date,
      cost = nullif(p_shipment->>'cost','')::numeric,
      cost_currency = coalesce(nullif(p_shipment->>'cost_currency',''),'TRY'),
      currency = coalesce(nullif(p_shipment->>'currency',''),'TRY'),
      sender_name = nullif(trim(p_shipment->>'sender_name'),''),
      sender_ii = nullif(trim(p_shipment->>'sender_ii'),''),
      receiver = nullif(trim(p_shipment->>'receiver'),''),
      receiver_district = nullif(trim(p_shipment->>'receiver_district'),''),
      receiver_ii = nullif(trim(p_shipment->>'receiver_ii'),''),
      adet = v_total_units,
      cinsi = v_first_kind,
      kg_ds = CASE WHEN v_total_units > 0 THEN v_total_weight / v_total_units ELSE 0 END,
      toplam_kg_ds = v_total_weight,
      satis_tutar = v_total_price,
      updated_at = now()
    WHERE id = p_shipment_id;
    v_id := p_shipment_id;
    DELETE FROM public.shipment_cargo_items WHERE shipment_id = v_id;
  END IF;

  INSERT INTO public.shipment_cargo_items (
    shipment_id, adet, cinsi, kg_ds, sira_no, birim_fiyat, alt_toplam_fiyat, alt_toplam
  )
  SELECT
    v_id,
    (item->>'adet')::integer,
    trim(item->>'cinsi'),
    (item->>'kg_ds')::numeric,
    (row_number() OVER ())::integer,
    coalesce((item->>'birim_fiyat')::numeric, 0),
    coalesce((item->>'alt_toplam_fiyat')::numeric, 0),
    (item->>'adet')::numeric * (item->>'kg_ds')::numeric
  FROM jsonb_array_elements(p_cargo_items) AS item;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.rex_set_shipment_status(
  p_shipment_id uuid,
  p_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_current text;
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin','operations']) THEN
    RAISE EXCEPTION 'Bu işlem için yetkiniz bulunmuyor';
  END IF;
  IF p_status NOT IN ('hazirlaniyor','yolda','iptal') THEN
    RAISE EXCEPTION 'Geçersiz sevkiyat durumu';
  END IF;
  SELECT status INTO v_current FROM public.shipments WHERE id = p_shipment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sevkiyat bulunamadı'; END IF;
  IF v_current IN ('teslim_edildi','iptal') THEN
    RAISE EXCEPTION 'Tamamlanmış sevkiyatın durumu değiştirilemez';
  END IF;
  IF p_status = 'yolda' AND v_current NOT IN ('beklemede','hazirlaniyor','hazırlaniyor') THEN
    RAISE EXCEPTION 'Sevkiyat yola çıkarılamaz';
  END IF;
  UPDATE public.shipments SET status = p_status, updated_at = now() WHERE id = p_shipment_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.rex_mark_shipment_delivered(
  p_shipment_id uuid,
  p_delivered_to text,
  p_delivery_date date,
  p_delivery_proof_url text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_status text;
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin','operations']) THEN
    RAISE EXCEPTION 'Bu işlem için yetkiniz bulunmuyor';
  END IF;
  IF NULLIF(trim(p_delivered_to),'') IS NULL OR p_delivery_date IS NULL THEN
    RAISE EXCEPTION 'Teslim alan kişi ve teslim tarihi zorunludur';
  END IF;
  SELECT status INTO v_status FROM public.shipments WHERE id = p_shipment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sevkiyat bulunamadı'; END IF;
  IF v_status = 'iptal' THEN RAISE EXCEPTION 'İptal edilmiş sevkiyat teslim edilemez'; END IF;

  UPDATE public.shipments SET
    status = 'teslim_edildi',
    delivered_to = trim(p_delivered_to),
    delivery_date = p_delivery_date,
    actual_delivery_date = p_delivery_date::timestamp AT TIME ZONE 'Europe/Istanbul',
    delivery_proof_url = coalesce(p_delivery_proof_url, delivery_proof_url),
    invoice_status = coalesce(invoice_status, 'beklemede'),
    updated_at = now()
  WHERE id = p_shipment_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.rex_create_sales_invoice(
  p_customer_id uuid,
  p_shipment_ids uuid[],
  p_invoice_date date,
  p_due_date date,
  p_currency text,
  p_payment_status text,
  p_notes text,
  p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_invoice_id uuid;
  v_invoice_no text;
  v_date_code text;
  v_sequence integer;
  v_subtotal numeric := 0;
  v_tax numeric := 0;
  v_total numeric := 0;
  v_item jsonb;
  v_shipments integer := coalesce(cardinality(p_shipment_ids), 0);
BEGIN
  IF v_shipments > 0 THEN
    IF NOT public.rex_has_role(ARRAY['admin','accounting','operations']) THEN
      RAISE EXCEPTION 'Bu işlem için yetkiniz bulunmuyor';
    END IF;
  ELSIF NOT public.rex_has_role(ARRAY['admin','accounting']) THEN
    RAISE EXCEPTION 'Bu işlem için yetkiniz bulunmuyor';
  END IF;

  IF p_customer_id IS NULL OR p_invoice_date IS NULL OR p_due_date IS NULL THEN
    RAISE EXCEPTION 'Müşteri, fatura tarihi ve vade tarihi zorunludur';
  END IF;
  IF p_due_date < p_invoice_date THEN RAISE EXCEPTION 'Vade tarihi fatura tarihinden önce olamaz'; END IF;
  IF p_currency NOT IN ('TRY','USD','EUR','GBP') THEN RAISE EXCEPTION 'Geçersiz para birimi'; END IF;
  IF p_payment_status NOT IN ('Ödendi','Bekliyor','Gecikmiş','Kısmi Ödendi') THEN
    RAISE EXCEPTION 'Geçersiz ödeme durumu';
  END IF;
  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'En az bir fatura kalemi gereklidir';
  END IF;

  IF v_shipments > 0 THEN
    IF (SELECT count(DISTINCT id) FROM public.shipments WHERE id = ANY(p_shipment_ids)
        AND status = 'teslim_edildi' AND customer_id = p_customer_id AND sale_invoice_id IS NULL) <> v_shipments THEN
      RAISE EXCEPTION 'Sevkiyatlar teslim edilmiş, aynı müşteriye ait ve daha önce faturalanmamış olmalıdır';
    END IF;
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    IF NULLIF(trim(v_item->>'description'),'') IS NULL
       OR coalesce((v_item->>'quantity')::numeric, 0) <= 0
       OR coalesce((v_item->>'unitPrice')::numeric, 0) < 0 THEN
      RAISE EXCEPTION 'Fatura kalemi açıklama, miktar ve fiyat bilgileri geçersiz';
    END IF;
    v_subtotal := v_subtotal + (v_item->>'quantity')::numeric * (v_item->>'unitPrice')::numeric;
    v_tax := v_tax + ((v_item->>'quantity')::numeric * (v_item->>'unitPrice')::numeric * coalesce((v_item->>'vatRate')::numeric,0) / 100);
  END LOOP;
  v_total := v_subtotal + v_tax;

  PERFORM pg_advisory_xact_lock(hashtext('rex_sales_invoice_no'));
  v_date_code := to_char(p_invoice_date, 'YYYYMMDD');
  SELECT coalesce(max((regexp_match(invoice_no, '^SF-' || v_date_code || '-(\d+)$'))[1]::integer),0) + 1
  INTO v_sequence
  FROM public.sales_invoices
  WHERE invoice_no LIKE 'SF-' || v_date_code || '-%';
  v_invoice_no := 'SF-' || v_date_code || '-' || lpad(v_sequence::text, 3, '0');

  INSERT INTO public.sales_invoices (
    user_id, customer_id, shipment_id, invoice_no, invoice_date, due_date,
    payment_status, subtotal, total_tax, total_discount, shipping_cost,
    general_discount, grand_total, currency, notes, e_invoice_status
  ) VALUES (
    auth.uid(), p_customer_id,
    CASE WHEN v_shipments = 1 THEN p_shipment_ids[1] ELSE NULL END,
    v_invoice_no, p_invoice_date, p_due_date, p_payment_status,
    v_subtotal, v_tax, 0, 0, 0, v_total, p_currency, p_notes, 'taslak'
  ) RETURNING id INTO v_invoice_id;

  INSERT INTO public.sales_invoice_items (
    invoice_id, product_code, description, quantity, unit, unit_price,
    subtotal, tax_rate, tax_amount, discount_amount, total
  )
  SELECT
    v_invoice_id,
    coalesce(nullif(item->>'productCode',''),'HIZMET'),
    trim(item->>'description'),
    (item->>'quantity')::numeric,
    coalesce(nullif(item->>'unit',''),'Adet'),
    (item->>'unitPrice')::numeric,
    (item->>'quantity')::numeric * (item->>'unitPrice')::numeric,
    coalesce((item->>'vatRate')::numeric,0),
    (item->>'quantity')::numeric * (item->>'unitPrice')::numeric * coalesce((item->>'vatRate')::numeric,0) / 100,
    0,
    (item->>'quantity')::numeric * (item->>'unitPrice')::numeric * (1 + coalesce((item->>'vatRate')::numeric,0) / 100)
  FROM jsonb_array_elements(p_items) AS item;

  IF v_shipments > 0 THEN
    UPDATE public.shipments
    SET sale_invoice_id = v_invoice_id, invoice_status = 'faturalandi', updated_at = now()
    WHERE id = ANY(p_shipment_ids);
  END IF;

  RETURN jsonb_build_object('id',v_invoice_id,'invoice_no',v_invoice_no,'grand_total',v_total);
END;
$$;

CREATE OR REPLACE FUNCTION public.rex_delete_sales_invoice(p_invoice_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin','accounting']) THEN
    RAISE EXCEPTION 'Bu işlem için yetkiniz bulunmuyor';
  END IF;
  UPDATE public.shipments
  SET sale_invoice_id = NULL, invoice_status = 'beklemede', updated_at = now()
  WHERE sale_invoice_id = p_invoice_id;
  DELETE FROM public.sales_invoices WHERE id = p_invoice_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Fatura bulunamadı'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.rex_record_customer_payment(
  p_customer_id uuid,
  p_transaction_type text,
  p_amount numeric,
  p_payment_method text,
  p_payment_date date,
  p_financial_account_id uuid,
  p_reference_no text,
  p_description text,
  p_currency text,
  p_related_invoice_id uuid DEFAULT NULL,
  p_related_purchase_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_payment_id uuid;
  v_payment_total numeric;
  v_invoice_total numeric;
  v_purchase_total numeric;
  v_transaction_no text;
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin','accounting']) THEN
    RAISE EXCEPTION 'Bu işlem için yetkiniz bulunmuyor';
  END IF;
  IF p_transaction_type NOT IN ('odeme','tahsilat') OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Geçersiz ödeme/tahsilat bilgisi';
  END IF;
  IF p_payment_method NOT IN ('Nakit','Havale','EFT','Kredi Kartı','Çek','Senet')
     OR p_currency NOT IN ('TRY','USD','EUR','GBP') THEN
    RAISE EXCEPTION 'Geçersiz yöntem veya para birimi';
  END IF;
  IF p_financial_account_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.financial_accounts
    WHERE id = p_financial_account_id AND coalesce(is_active,true)
  ) THEN
    RAISE EXCEPTION 'Aktif bir finans hesabı seçilmelidir';
  END IF;

  INSERT INTO public.customer_payments (
    customer_id, transaction_type, amount, payment_method, payment_date,
    bank_account_id, reference_no, description, related_invoice_id,
    related_purchase_id, currency, exchange_rate
  ) VALUES (
    p_customer_id, p_transaction_type, p_amount, p_payment_method, p_payment_date,
    p_financial_account_id, nullif(trim(p_reference_no),''), nullif(trim(p_description),''),
    p_related_invoice_id, p_related_purchase_id, p_currency, 1
  ) RETURNING id INTO v_payment_id;

  UPDATE public.financial_accounts
  SET balance = coalesce(balance,0) + CASE WHEN p_transaction_type='tahsilat' THEN p_amount ELSE -p_amount END,
      updated_at = now()
  WHERE id = p_financial_account_id;

  v_transaction_no := 'CH-' || to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS');
  INSERT INTO public.transactions (
    transaction_no, account_id, type, category, amount, description,
    reference_no, transaction_date, notes
  ) VALUES (
    v_transaction_no, p_financial_account_id,
    CASE WHEN p_transaction_type='tahsilat' THEN 'Gelen' ELSE 'Giden' END,
    CASE WHEN p_transaction_type='tahsilat' THEN 'Cari Tahsilat' ELSE 'Cari Ödeme' END,
    p_amount, coalesce(nullif(trim(p_description),''), CASE WHEN p_transaction_type='tahsilat' THEN 'Cari tahsilat' ELSE 'Cari ödeme' END),
    nullif(trim(p_reference_no),''), p_payment_date, 'customer_payment:' || v_payment_id::text
  );

  IF p_related_invoice_id IS NOT NULL THEN
    SELECT grand_total INTO v_invoice_total FROM public.sales_invoices
    WHERE id=p_related_invoice_id AND customer_id=p_customer_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Müşteriye ait fatura bulunamadı'; END IF;
    SELECT coalesce(sum(amount),0) INTO v_payment_total FROM public.customer_payments
    WHERE related_invoice_id=p_related_invoice_id AND transaction_type='tahsilat';
    UPDATE public.sales_invoices SET
      payment_status = CASE WHEN v_payment_total >= v_invoice_total THEN 'Ödendi' ELSE 'Kısmi Ödendi' END,
      updated_at = now()
    WHERE id=p_related_invoice_id;
  END IF;

  IF p_related_purchase_id IS NOT NULL THEN
    SELECT total INTO v_purchase_total FROM public.purchases
    WHERE id=p_related_purchase_id AND supplier_id=p_customer_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Tedarikçiye ait alış faturası bulunamadı'; END IF;
    SELECT coalesce(sum(amount),0) INTO v_payment_total FROM public.customer_payments
    WHERE related_purchase_id=p_related_purchase_id AND transaction_type='odeme';
    UPDATE public.purchases SET
      paid_amount = v_payment_total,
      status = CASE WHEN v_payment_total >= coalesce(v_purchase_total,0) THEN 'odendi' ELSE 'kismi_odendi' END,
      updated_at = now()
    WHERE id=p_related_purchase_id;
  END IF;

  RETURN v_payment_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.rex_record_customer_adjustment(
  p_customer_id uuid,
  p_transaction_type text,
  p_amount numeric,
  p_transaction_date date,
  p_currency text,
  p_description text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id uuid;
  v_reference text;
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin','accounting']) THEN
    RAISE EXCEPTION 'Bu işlem için yetkiniz bulunmuyor';
  END IF;
  IF p_transaction_type NOT IN ('Borç','Alacak') OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Geçersiz cari düzeltme bilgisi';
  END IF;
  IF p_currency NOT IN ('TRY','USD','EUR','GBP') THEN RAISE EXCEPTION 'Geçersiz para birimi'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.customers WHERE id=p_customer_id) THEN
    RAISE EXCEPTION 'Cari bulunamadı';
  END IF;
  v_reference := 'CD-' || to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS');
  INSERT INTO public.account_transactions (
    account_type, account_id, customer_id, transaction_type, amount,
    description, reference_no, transaction_date, currency, created_by
  ) VALUES (
    'Genel', p_customer_id, p_customer_id, p_transaction_type, p_amount,
    nullif(trim(p_description),''), v_reference, p_transaction_date, p_currency, auth.uid()
  ) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.rex_unlink_deleted_invoice()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.shipments
  SET sale_invoice_id=NULL, invoice_status='beklemede', updated_at=now()
  WHERE sale_invoice_id=OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS rex_sales_invoice_delete_sync ON public.sales_invoices;
CREATE TRIGGER rex_sales_invoice_delete_sync
BEFORE DELETE ON public.sales_invoices
FOR EACH ROW EXECUTE FUNCTION public.rex_unlink_deleted_invoice();

REVOKE ALL ON FUNCTION public.rex_save_shipment(uuid,jsonb,jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rex_set_shipment_status(uuid,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rex_mark_shipment_delivered(uuid,text,date,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rex_create_sales_invoice(uuid,uuid[],date,date,text,text,text,jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rex_delete_sales_invoice(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rex_record_customer_payment(uuid,text,numeric,text,date,uuid,text,text,text,uuid,uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rex_record_customer_adjustment(uuid,text,numeric,date,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rex_save_shipment(uuid,jsonb,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_set_shipment_status(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_mark_shipment_delivered(uuid,text,date,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_create_sales_invoice(uuid,uuid[],date,date,text,text,text,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_delete_sales_invoice(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_record_customer_payment(uuid,text,numeric,text,date,uuid,text,text,text,uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_record_customer_adjustment(uuid,text,numeric,date,text,text) TO authenticated;
