BEGIN;

-- Keep invoice payment figures separate from the document total.  The old UI
-- only stored a label, which allowed an incomplete provider payload to mark a
-- completely open invoice as paid.
ALTER TABLE public.sales_invoices
  ADD COLUMN IF NOT EXISTS paid_amount numeric(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance numeric(15,2),
  ADD COLUMN IF NOT EXISTS payment_source text NOT NULL DEFAULT 'rex_tys',
  ADD COLUMN IF NOT EXISTS payment_last_synced_at timestamptz;

UPDATE public.sales_invoices
SET balance = greatest(coalesce(grand_total, 0) - coalesce(paid_amount, 0), 0)
WHERE balance IS NULL;

ALTER TABLE public.sales_invoices
  ALTER COLUMN balance SET DEFAULT 0,
  ALTER COLUMN balance SET NOT NULL;

ALTER TABLE public.sales_invoices
  DROP CONSTRAINT IF EXISTS sales_invoices_paid_amount_check;
ALTER TABLE public.sales_invoices
  ADD CONSTRAINT sales_invoices_paid_amount_check CHECK (paid_amount >= 0);
ALTER TABLE public.sales_invoices
  DROP CONSTRAINT IF EXISTS sales_invoices_balance_check;
ALTER TABLE public.sales_invoices
  ADD CONSTRAINT sales_invoices_balance_check CHECK (balance >= 0);
ALTER TABLE public.sales_invoices
  DROP CONSTRAINT IF EXISTS sales_invoices_payment_source_check;
ALTER TABLE public.sales_invoices
  ADD CONSTRAINT sales_invoices_payment_source_check
  CHECK (payment_source IN ('rex_tys','kolaybi'));

-- New drafts start fully open. Later collection/provider updates change the
-- paid amount, and this trigger keeps the stored balance consistent.
CREATE OR REPLACE FUNCTION public.rex_sync_sales_invoice_balance()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.paid_amount := greatest(coalesce(NEW.paid_amount, 0), 0);
  NEW.balance := greatest(coalesce(NEW.grand_total, 0) - NEW.paid_amount, 0);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rex_sync_sales_invoice_balance ON public.sales_invoices;
CREATE TRIGGER trg_rex_sync_sales_invoice_balance
BEFORE INSERT OR UPDATE OF grand_total, paid_amount ON public.sales_invoices
FOR EACH ROW EXECUTE FUNCTION public.rex_sync_sales_invoice_balance();

-- Provider evidence makes outbound payment operations auditable and lets the
-- application distinguish a local-only entry from a KolayBi-synchronised one.
ALTER TABLE public.customer_payments
  ADD COLUMN IF NOT EXISTS sync_status text NOT NULL DEFAULT 'local_only',
  ADD COLUMN IF NOT EXISTS provider_environment text,
  ADD COLUMN IF NOT EXISTS provider_transaction_id text,
  ADD COLUMN IF NOT EXISTS provider_payload jsonb,
  ADD COLUMN IF NOT EXISTS provider_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS provider_error text;

ALTER TABLE public.customer_payments
  DROP CONSTRAINT IF EXISTS customer_payments_sync_status_check;
ALTER TABLE public.customer_payments
  ADD CONSTRAINT customer_payments_sync_status_check
  CHECK (sync_status IN ('local_only','synced','failed','provider_imported'));
ALTER TABLE public.customer_payments
  DROP CONSTRAINT IF EXISTS customer_payments_provider_environment_check;
ALTER TABLE public.customer_payments
  ADD CONSTRAINT customer_payments_provider_environment_check
  CHECK (provider_environment IS NULL OR provider_environment IN ('test','live'));

CREATE UNIQUE INDEX IF NOT EXISTS customer_payments_provider_transaction_uidx
  ON public.customer_payments(provider_environment, provider_transaction_id)
  WHERE provider_transaction_id IS NOT NULL;

-- Repair payment figures and the false "Ödendi" labels using real local
-- collections.  A subsequent KolayBi sync can authoritatively replace these
-- figures for provider-linked invoices.
WITH totals AS (
  SELECT i.id,
    coalesce(sum(p.amount) FILTER (WHERE p.transaction_type = 'tahsilat'), 0)::numeric(15,2) AS paid
  FROM public.sales_invoices i
  LEFT JOIN public.customer_payments p ON p.related_invoice_id = i.id
  GROUP BY i.id
)
UPDATE public.sales_invoices i
SET paid_amount = totals.paid,
    balance = greatest(coalesce(i.grand_total, 0) - totals.paid, 0),
    payment_status = CASE
      WHEN i.payment_status = 'İptal' THEN 'İptal'
      WHEN totals.paid >= coalesce(i.grand_total, 0) - 0.01 THEN 'Ödendi'
      WHEN totals.paid > 0 THEN 'Kısmi Ödendi'
      WHEN i.due_date < current_date THEN 'Gecikmiş'
      ELSE 'Bekliyor'
    END,
    payment_source = 'rex_tys',
    updated_at = now()
FROM totals
WHERE totals.id = i.id;

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
  v_invoice_balance numeric;
  v_purchase_total numeric;
  v_purchase_paid numeric;
  v_transaction_no text;
BEGIN
  IF NOT public.rex_has_permission('accounting.accounts', 'manage') THEN
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
  IF p_related_invoice_id IS NOT NULL AND p_related_purchase_id IS NOT NULL THEN
    RAISE EXCEPTION 'Bir hareket aynı anda hem satış hem alış faturasına bağlanamaz';
  END IF;

  IF p_related_invoice_id IS NOT NULL THEN
    IF p_transaction_type <> 'tahsilat' THEN RAISE EXCEPTION 'Satış faturasına yalnızca tahsilat bağlanabilir'; END IF;
    SELECT grand_total, greatest(grand_total - coalesce((
      SELECT sum(amount) FROM public.customer_payments
      WHERE related_invoice_id = p_related_invoice_id AND transaction_type = 'tahsilat'
    ), 0), 0)
    INTO v_invoice_total, v_invoice_balance
    FROM public.sales_invoices
    WHERE id = p_related_invoice_id AND customer_id = p_customer_id
      AND payment_status <> 'İptal'
    FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Müşteriye ait açık satış faturası bulunamadı'; END IF;
    IF p_amount > v_invoice_balance + 0.01 THEN RAISE EXCEPTION 'Tahsilat açık fatura bakiyesini aşamaz'; END IF;
  END IF;

  IF p_related_purchase_id IS NOT NULL THEN
    IF p_transaction_type <> 'odeme' THEN RAISE EXCEPTION 'Alış faturasına yalnızca ödeme bağlanabilir'; END IF;
    SELECT total, coalesce(paid_amount, 0)
    INTO v_purchase_total, v_purchase_paid
    FROM public.purchases
    WHERE id = p_related_purchase_id AND supplier_id = p_customer_id
      AND status <> 'İptal'
    FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Tedarikçiye ait açık alış faturası bulunamadı'; END IF;
    IF p_amount > greatest(v_purchase_total - v_purchase_paid, 0) + 0.01 THEN
      RAISE EXCEPTION 'Ödeme açık alış faturası bakiyesini aşamaz';
    END IF;
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
    reference_no, transaction_date, related_purchase_id, notes
  ) VALUES (
    v_transaction_no, p_financial_account_id,
    CASE WHEN p_transaction_type='tahsilat' THEN 'Gelen' ELSE 'Giden' END,
    CASE WHEN p_transaction_type='tahsilat' THEN 'Cari Tahsilat' ELSE 'Cari Ödeme' END,
    p_amount, coalesce(nullif(trim(p_description),''), CASE WHEN p_transaction_type='tahsilat' THEN 'Cari tahsilat' ELSE 'Cari ödeme' END),
    nullif(trim(p_reference_no),''), p_payment_date, p_related_purchase_id,
    'customer_payment:' || v_payment_id::text
  );

  IF p_related_invoice_id IS NOT NULL THEN
    SELECT coalesce(sum(amount),0) INTO v_payment_total
    FROM public.customer_payments
    WHERE related_invoice_id=p_related_invoice_id AND transaction_type='tahsilat';
    UPDATE public.sales_invoices SET
      paid_amount = v_payment_total,
      balance = greatest(v_invoice_total - v_payment_total, 0),
      payment_status = CASE WHEN v_payment_total >= v_invoice_total - 0.01 THEN 'Ödendi' ELSE 'Kısmi Ödendi' END,
      payment_source = 'rex_tys',
      updated_at = now()
    WHERE id=p_related_invoice_id;
  END IF;

  IF p_related_purchase_id IS NOT NULL THEN
    SELECT coalesce(sum(amount),0) INTO v_payment_total
    FROM public.customer_payments
    WHERE related_purchase_id=p_related_purchase_id AND transaction_type='odeme';
    UPDATE public.purchases SET
      paid_amount = v_payment_total,
      status = CASE WHEN v_payment_total >= coalesce(v_purchase_total,0) - 0.01 THEN 'Ödendi' ELSE 'Kısmi Ödendi' END,
      updated_at = now()
    WHERE id=p_related_purchase_id;

    UPDATE public.incoming_purchase_invoices SET
      provider_balance = greatest(grand_total - v_payment_total, 0),
      payment_status = CASE WHEN v_payment_total >= grand_total - 0.01 THEN 'paid' ELSE 'partially_paid' END,
      status = CASE
        WHEN status IN ('cancelled','duplicate','rejected','disputed','historical') THEN status
        WHEN v_payment_total >= grand_total - 0.01 THEN 'paid'
        ELSE 'payment_pending'
      END,
      updated_at = now()
    WHERE legacy_purchase_id = p_related_purchase_id;
  END IF;

  RETURN v_payment_id;
END;
$$;

REVOKE ALL ON FUNCTION public.rex_record_customer_payment(uuid,text,numeric,text,date,uuid,text,text,text,uuid,uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rex_record_customer_payment(uuid,text,numeric,text,date,uuid,text,text,text,uuid,uuid)
  TO authenticated;

-- Extended provider reconciliation.  The legacy 10-argument overload remains
-- available during rolling deployment; the application calls this overload
-- only when an explicit payment amount or balance exists in KolayBi.
CREATE OR REPLACE FUNCTION public.rex_reconcile_sales_invoice_from_provider(
  p_invoice_id uuid,
  p_provider_status text,
  p_kolaybi_status text,
  p_e_invoice_status text,
  p_has_profile boolean,
  p_document_type text,
  p_document_scenario text,
  p_official_uuid text,
  p_official_invoice_no text,
  p_payment_status text,
  p_paid_amount numeric,
  p_balance numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public,pg_temp AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Bu işlem yalnızca güvenli entegrasyon servisi tarafından yapılabilir';
  END IF;
  IF p_has_profile AND p_document_type NOT IN ('e_invoice','e_archive') THEN RAISE EXCEPTION 'Geçersiz e-belge türü'; END IF;
  IF p_has_profile AND p_document_scenario NOT IN ('EARSIVFATURA','TEMELFATURA','TICARIFATURA','KAMU') THEN RAISE EXCEPTION 'Geçersiz e-belge senaryosu'; END IF;
  IF p_payment_status IS NOT NULL AND p_payment_status NOT IN ('Bekliyor','Kısmi Ödendi','Ödendi','Gecikmiş','İptal') THEN RAISE EXCEPTION 'Geçersiz ödeme durumu'; END IF;
  IF p_paid_amount IS NOT NULL AND p_paid_amount < 0 THEN RAISE EXCEPTION 'Tahsilat tutarı negatif olamaz'; END IF;
  IF p_balance IS NOT NULL AND p_balance < 0 THEN RAISE EXCEPTION 'Fatura bakiyesi negatif olamaz'; END IF;

  PERFORM set_config('rex.invoice_sync','on',true);
  UPDATE public.sales_invoices
  SET provider_status = p_provider_status,
      kolaybi_status = p_kolaybi_status,
      e_invoice_status = p_e_invoice_status,
      document_type = CASE WHEN p_has_profile THEN p_document_type ELSE document_type END,
      document_scenario = CASE WHEN p_has_profile THEN p_document_scenario ELSE document_scenario END,
      official_uuid = CASE WHEN p_has_profile THEN nullif(trim(p_official_uuid),'') ELSE official_uuid END,
      official_invoice_no = CASE WHEN p_has_profile THEN nullif(trim(p_official_invoice_no),'') ELSE official_invoice_no END,
      payment_status = coalesce(p_payment_status,payment_status),
      paid_amount = coalesce(p_paid_amount, paid_amount),
      balance = coalesce(p_balance, balance),
      payment_source = CASE WHEN p_paid_amount IS NOT NULL OR p_balance IS NOT NULL THEN 'kolaybi' ELSE payment_source END,
      payment_last_synced_at = CASE WHEN p_paid_amount IS NOT NULL OR p_balance IS NOT NULL THEN now() ELSE payment_last_synced_at END,
      last_status_check_at = now(),
      updated_at = now()
  WHERE id = p_invoice_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Fatura bulunamadı'; END IF;
END $$;

REVOKE ALL ON FUNCTION public.rex_reconcile_sales_invoice_from_provider(uuid,text,text,text,boolean,text,text,text,text,text,numeric,numeric)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.rex_reconcile_sales_invoice_from_provider(uuid,text,text,text,boolean,text,text,text,text,text,numeric,numeric)
  TO service_role;

COMMIT;
