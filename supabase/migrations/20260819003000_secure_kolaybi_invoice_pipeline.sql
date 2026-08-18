-- Secure, retryable KolayBi invoice pipeline.
-- A shipment is invoiced only after an official e-document is confirmed.

ALTER TABLE public.sales_invoices
  ADD COLUMN IF NOT EXISTS integration_status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS document_type text NOT NULL DEFAULT 'e_archive',
  ADD COLUMN IF NOT EXISTS document_scenario text NOT NULL DEFAULT 'EARSIVFATURA',
  ADD COLUMN IF NOT EXISTS idempotency_key text,
  ADD COLUMN IF NOT EXISTS exchange_rate numeric(18,6) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS withholding_code text,
  ADD COLUMN IF NOT EXISTS withholding_rate numeric(7,4),
  ADD COLUMN IF NOT EXISTS exemption_code text,
  ADD COLUMN IF NOT EXISTS official_invoice_no text,
  ADD COLUMN IF NOT EXISTS official_uuid text,
  ADD COLUMN IF NOT EXISTS pdf_url text,
  ADD COLUMN IF NOT EXISTS provider_status text,
  ADD COLUMN IF NOT EXISTS retry_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_retry_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_status_check_at timestamptz;

UPDATE public.sales_invoices
SET idempotency_key='legacy:'||id::text
WHERE idempotency_key IS NULL;
ALTER TABLE public.sales_invoices ALTER COLUMN idempotency_key SET NOT NULL;

UPDATE public.sales_invoices
SET integration_status = CASE
  WHEN payment_status = 'İptal' AND cancellation_type = 'iade' THEN 'refund_created'
  WHEN payment_status = 'İptal' THEN 'cancelled'
  WHEN kolaybi_document_id IS NOT NULL AND e_invoice_status = 'oluşturuldu' THEN 'official'
  WHEN kolaybi_document_id IS NOT NULL THEN 'submitted'
  WHEN kolaybi_status IN ('failed','mapping_required') THEN kolaybi_status
  ELSE 'draft'
END
WHERE integration_status = 'draft';

ALTER TABLE public.sales_invoices DROP CONSTRAINT IF EXISTS sales_invoices_integration_status_check;
ALTER TABLE public.sales_invoices ADD CONSTRAINT sales_invoices_integration_status_check CHECK (
  integration_status IN (
    'draft','queued','processing','submitted','official','failed','mapping_required',
    'cancelled','refund_created'
  )
);
ALTER TABLE public.sales_invoices DROP CONSTRAINT IF EXISTS sales_invoices_document_type_check;
ALTER TABLE public.sales_invoices ADD CONSTRAINT sales_invoices_document_type_check
  CHECK (document_type IN ('e_invoice','e_archive'));
ALTER TABLE public.sales_invoices DROP CONSTRAINT IF EXISTS sales_invoices_exchange_rate_check;
ALTER TABLE public.sales_invoices ADD CONSTRAINT sales_invoices_exchange_rate_check
  CHECK (exchange_rate > 0);
ALTER TABLE public.sales_invoices DROP CONSTRAINT IF EXISTS sales_invoices_withholding_rate_check;
ALTER TABLE public.sales_invoices ADD CONSTRAINT sales_invoices_withholding_rate_check
  CHECK (withholding_rate IS NULL OR (withholding_rate > 0 AND withholding_rate <= 100));

CREATE UNIQUE INDEX IF NOT EXISTS sales_invoices_idempotency_key_unique
  ON public.sales_invoices(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS sales_invoices_kolaybi_document_unique
  ON public.sales_invoices(kolaybi_document_id) WHERE kolaybi_document_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS sales_invoices_official_uuid_unique
  ON public.sales_invoices(official_uuid) WHERE official_uuid IS NOT NULL;
CREATE INDEX IF NOT EXISTS sales_invoices_integration_status_idx
  ON public.sales_invoices(integration_status,next_retry_at);

ALTER TABLE public.sales_invoice_items
  ADD COLUMN IF NOT EXISTS kolaybi_product_id bigint,
  ADD COLUMN IF NOT EXISTS withholding_code text,
  ADD COLUMN IF NOT EXISTS withholding_value numeric(7,4),
  ADD COLUMN IF NOT EXISTS withholding_type text,
  ADD COLUMN IF NOT EXISTS exemption_code text;

ALTER TABLE public.sales_invoice_items DROP CONSTRAINT IF EXISTS sales_invoice_items_withholding_value_check;
ALTER TABLE public.sales_invoice_items ADD CONSTRAINT sales_invoice_items_withholding_value_check
  CHECK (withholding_value IS NULL OR (withholding_value > 0 AND withholding_value <= 100));
ALTER TABLE public.sales_invoice_items DROP CONSTRAINT IF EXISTS sales_invoice_items_withholding_type_check;
ALTER TABLE public.sales_invoice_items ADD CONSTRAINT sales_invoice_items_withholding_type_check
  CHECK (withholding_type IS NULL OR withholding_type IN ('PERCENTAGE','NUMERIC'));

CREATE TABLE IF NOT EXISTS public.invoice_product_mappings (
  product_code text PRIMARY KEY,
  kolaybi_product_id bigint NOT NULL,
  description text,
  vat_rate numeric(5,2),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
ALTER TABLE public.invoice_product_mappings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rex_invoice_product_mappings_select ON public.invoice_product_mappings;
CREATE POLICY rex_invoice_product_mappings_select ON public.invoice_product_mappings
  FOR SELECT TO authenticated USING (public.rex_has_role(ARRAY['admin','accounting']));
DROP POLICY IF EXISTS rex_invoice_product_mappings_write ON public.invoice_product_mappings;
CREATE POLICY rex_invoice_product_mappings_write ON public.invoice_product_mappings
  FOR ALL TO authenticated
  USING (public.rex_has_role(ARRAY['admin','accounting']))
  WITH CHECK (public.rex_has_role(ARRAY['admin','accounting']));

CREATE TABLE IF NOT EXISTS public.invoice_sync_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.sales_invoices(id) ON DELETE RESTRICT,
  job_type text NOT NULL DEFAULT 'send',
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 8,
  run_after timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  locked_by text,
  last_error text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key text NOT NULL,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT invoice_sync_jobs_type_check CHECK (job_type IN ('send','status','cancel','refund')),
  CONSTRAINT invoice_sync_jobs_status_check CHECK (status IN ('pending','processing','completed','dead')),
  CONSTRAINT invoice_sync_jobs_attempts_check CHECK (attempts >= 0 AND max_attempts BETWEEN 1 AND 20),
  CONSTRAINT invoice_sync_jobs_idempotency_unique UNIQUE(idempotency_key)
);
CREATE UNIQUE INDEX IF NOT EXISTS invoice_sync_jobs_one_active_job
  ON public.invoice_sync_jobs(invoice_id,job_type)
  WHERE status IN ('pending','processing');
CREATE INDEX IF NOT EXISTS invoice_sync_jobs_due_idx
  ON public.invoice_sync_jobs(status,run_after) WHERE status='pending';

ALTER TABLE public.invoice_sync_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rex_invoice_sync_jobs_select ON public.invoice_sync_jobs;
CREATE POLICY rex_invoice_sync_jobs_select ON public.invoice_sync_jobs
  FOR SELECT TO authenticated USING (public.rex_has_role(ARRAY['admin','accounting']));
REVOKE INSERT,UPDATE,DELETE ON public.invoice_sync_jobs FROM authenticated;

ALTER TABLE public.shipments DROP CONSTRAINT IF EXISTS shipments_invoice_status_check;
ALTER TABLE public.shipments ADD CONSTRAINT shipments_invoice_status_check CHECK (
  invoice_status IN (
    'beklemede','fatura_taslagi','kolaybi_bekliyor','kolaybi_gonderildi',
    'faturalandi','kismenfaturalandi','fatura_hatasi','fatura_iptal','iade_faturasi'
  )
);

ALTER TABLE public.shipment_events DROP CONSTRAINT IF EXISTS shipment_events_event_type_check;
ALTER TABLE public.shipment_events ADD CONSTRAINT shipment_events_event_type_check CHECK (
  event_type IN (
    'history_enabled','created','updated','assignment_changed','status_changed','driver_assigned','vehicle_assigned',
    'started','delivered','delivery_document_added','invoiced','invoice_unlinked',
    'kolaybi_sync_started','kolaybi_sync_succeeded','kolaybi_sync_failed',
    'deleted','owner_approved_edit','job_created','job_approved','cancelled','revision_requested','revision_rejected','revision_applied','invoice_cancelled',
    'invoice_queued','invoice_submitted','invoice_official','invoice_retry_scheduled',
    'invoice_status_checked','invoice_refund_created'
  )
);

CREATE OR REPLACE FUNCTION public.rex_create_sales_invoice_secure(
  p_customer_id uuid,
  p_shipment_ids uuid[],
  p_invoice_date date,
  p_due_date date,
  p_currency text,
  p_payment_status text,
  p_notes text,
  p_items jsonb,
  p_document_type text DEFAULT 'e_archive',
  p_document_scenario text DEFAULT 'EARSIVFATURA',
  p_exchange_rate numeric DEFAULT 1,
  p_idempotency_key text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public,pg_temp
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
  v_shipments integer := coalesce(cardinality(p_shipment_ids),0);
  v_key text := nullif(trim(p_idempotency_key),'');
  v_existing public.sales_invoices%ROWTYPE;
  v_product_id bigint;
BEGIN
  IF v_shipments > 0 THEN
    IF NOT public.rex_has_role(ARRAY['admin','accounting','operations']) THEN
      RAISE EXCEPTION 'Bu işlem için yetkiniz bulunmuyor';
    END IF;
  ELSIF NOT public.rex_has_role(ARRAY['admin','accounting']) THEN
    RAISE EXCEPTION 'Bu işlem için yetkiniz bulunmuyor';
  END IF;

  IF v_key IS NULL THEN v_key := gen_random_uuid()::text; END IF;
  SELECT * INTO v_existing FROM public.sales_invoices WHERE idempotency_key=v_key;
  IF FOUND THEN
    RETURN jsonb_build_object(
      'id',v_existing.id,'invoice_no',v_existing.invoice_no,
      'grand_total',v_existing.grand_total,'integration_status',v_existing.integration_status,
      'already_exists',true
    );
  END IF;

  IF p_customer_id IS NULL OR p_invoice_date IS NULL OR p_due_date IS NULL THEN
    RAISE EXCEPTION 'Müşteri, fatura tarihi ve vade tarihi zorunludur';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM public.customers WHERE id=p_customer_id) THEN
    RAISE EXCEPTION 'Müşteri bulunamadı';
  END IF;
  IF p_due_date < p_invoice_date THEN RAISE EXCEPTION 'Vade tarihi fatura tarihinden önce olamaz'; END IF;
  IF p_currency NOT IN ('TRY','USD','EUR','GBP') THEN RAISE EXCEPTION 'Geçersiz para birimi'; END IF;
  IF p_currency <> 'TRY' AND coalesce(p_exchange_rate,0) <= 0 THEN
    RAISE EXCEPTION 'Dövizli faturada geçerli kur zorunludur';
  END IF;
  IF p_currency='TRY' THEN p_exchange_rate := 1; END IF;
  IF p_document_type NOT IN ('e_invoice','e_archive') THEN RAISE EXCEPTION 'Geçersiz e-belge türü'; END IF;
  IF p_document_type='e_archive' AND p_document_scenario<>'EARSIVFATURA' THEN
    RAISE EXCEPTION 'E-arşiv belge senaryosu EARSIVFATURA olmalıdır';
  END IF;
  IF p_document_type='e_invoice' AND p_document_scenario NOT IN ('TEMELFATURA','TICARIFATURA','KAMU') THEN
    RAISE EXCEPTION 'Geçersiz e-fatura senaryosu';
  END IF;
  IF p_payment_status NOT IN ('Ödendi','Bekliyor','Gecikmiş','Kısmi Ödendi') THEN
    RAISE EXCEPTION 'Geçersiz ödeme durumu';
  END IF;
  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' OR jsonb_array_length(p_items)=0 THEN
    RAISE EXCEPTION 'En az bir fatura kalemi gereklidir';
  END IF;

  IF v_shipments>0 THEN
    PERFORM 1 FROM public.shipments WHERE id=ANY(p_shipment_ids) FOR UPDATE;
    IF (SELECT count(DISTINCT id) FROM public.shipments
        WHERE id=ANY(p_shipment_ids) AND status='teslim_edildi'
          AND customer_id=p_customer_id AND sale_invoice_id IS NULL) <> v_shipments THEN
      RAISE EXCEPTION 'Sevkiyatlar teslim edilmiş, aynı müşteriye ait ve daha önce faturalanmamış olmalıdır';
    END IF;
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    IF nullif(trim(v_item->>'description'),'') IS NULL
       OR coalesce((v_item->>'quantity')::numeric,0)<=0
       OR coalesce((v_item->>'unitPrice')::numeric,0)<0 THEN
      RAISE EXCEPTION 'Fatura kalemi açıklama, miktar ve fiyat bilgileri geçersiz';
    END IF;
    IF coalesce((v_item->>'vatRate')::numeric,-1)<0 OR coalesce((v_item->>'vatRate')::numeric,101)>100 THEN
      RAISE EXCEPTION 'KDV oranı 0 ile 100 arasında olmalıdır';
    END IF;
    IF coalesce((v_item->>'vatRate')::numeric,0)=0
       AND nullif(trim(v_item->>'exemptionCode'),'') IS NULL THEN
      RAISE EXCEPTION 'KDV oranı sıfır olan kalemde istisna kodu zorunludur';
    END IF;
    IF (nullif(trim(v_item->>'withholdingCode'),'') IS NULL)
       <> (nullif(trim(v_item->>'withholdingValue'),'') IS NULL) THEN
      RAISE EXCEPTION 'Tevkifat kodu ve oranı birlikte girilmelidir';
    END IF;
    IF nullif(trim(v_item->>'withholdingValue'),'') IS NOT NULL
       AND ((v_item->>'withholdingValue')::numeric<=0 OR (v_item->>'withholdingValue')::numeric>100) THEN
      RAISE EXCEPTION 'Tevkifat oranı 0 ile 100 arasında olmalıdır';
    END IF;
    v_subtotal := v_subtotal + (v_item->>'quantity')::numeric*(v_item->>'unitPrice')::numeric;
    v_tax := v_tax + ((v_item->>'quantity')::numeric*(v_item->>'unitPrice')::numeric*coalesce((v_item->>'vatRate')::numeric,0)/100);
  END LOOP;
  v_total := v_subtotal+v_tax;

  PERFORM pg_advisory_xact_lock(hashtext('rex_sales_invoice_no'));
  v_date_code := to_char(p_invoice_date,'YYYYMMDD');
  SELECT coalesce(max((regexp_match(invoice_no,'^SF-'||v_date_code||'-(\d+)$'))[1]::integer),0)+1
    INTO v_sequence FROM public.sales_invoices WHERE invoice_no LIKE 'SF-'||v_date_code||'-%';
  v_invoice_no := 'SF-'||v_date_code||'-'||lpad(v_sequence::text,3,'0');

  INSERT INTO public.sales_invoices(
    user_id,customer_id,shipment_id,invoice_no,invoice_date,due_date,payment_status,
    subtotal,total_tax,total_discount,shipping_cost,general_discount,grand_total,currency,
    notes,e_invoice_status,integration_status,document_type,document_scenario,
    idempotency_key,exchange_rate,kolaybi_status,next_retry_at
  ) VALUES(
    auth.uid(),p_customer_id,CASE WHEN v_shipments=1 THEN p_shipment_ids[1] ELSE NULL END,
    v_invoice_no,p_invoice_date,p_due_date,p_payment_status,v_subtotal,v_tax,0,0,0,v_total,
    p_currency,p_notes,'taslak','queued',p_document_type,p_document_scenario,
    v_key,p_exchange_rate,'queued',now()
  ) RETURNING id INTO v_invoice_id;

  INSERT INTO public.sales_invoice_items(
    invoice_id,product_code,description,quantity,unit,unit_price,subtotal,tax_rate,
    tax_amount,discount_amount,total,kolaybi_product_id,withholding_code,
    withholding_value,withholding_type,exemption_code
  )
  SELECT v_invoice_id,
    coalesce(nullif(item->>'productCode',''),'HIZMET'),trim(item->>'description'),
    (item->>'quantity')::numeric,coalesce(nullif(item->>'unit',''),'Adet'),
    (item->>'unitPrice')::numeric,(item->>'quantity')::numeric*(item->>'unitPrice')::numeric,
    coalesce((item->>'vatRate')::numeric,0),
    (item->>'quantity')::numeric*(item->>'unitPrice')::numeric*coalesce((item->>'vatRate')::numeric,0)/100,
    0,(item->>'quantity')::numeric*(item->>'unitPrice')::numeric*(1+coalesce((item->>'vatRate')::numeric,0)/100),
    coalesce(nullif(item->>'kolaybiProductId','')::bigint,
      (SELECT m.kolaybi_product_id FROM public.invoice_product_mappings m
       WHERE m.product_code=coalesce(nullif(item->>'productCode',''),'HIZMET') AND m.active=true)),
    nullif(trim(item->>'withholdingCode'),''),nullif(item->>'withholdingValue','')::numeric,
    CASE WHEN nullif(item->>'withholdingValue','') IS NULL THEN NULL ELSE coalesce(nullif(item->>'withholdingType',''),'PERCENTAGE') END,
    nullif(trim(item->>'exemptionCode'),'')
  FROM jsonb_array_elements(p_items) AS item;

  INSERT INTO public.invoice_sync_jobs(invoice_id,job_type,status,run_after,idempotency_key,payload)
  VALUES(v_invoice_id,'send','pending',now(),v_key||':send',jsonb_build_object('invoice_no',v_invoice_no));

  IF v_shipments>0 THEN
    PERFORM set_config('rex.invoice_sync','on',true);
    UPDATE public.shipments SET sale_invoice_id=v_invoice_id,invoice_status='kolaybi_bekliyor',updated_at=now()
    WHERE id=ANY(p_shipment_ids);
  END IF;

  INSERT INTO public.shipment_events(
    shipment_id,shipment_code,event_type,old_status,new_status,changed_fields,
    actor_id,actor_email,actor_role,source,note
  )
  SELECT s.id,s.shipment_code,'invoice_queued',s.status,s.status,
    jsonb_build_object('invoice_id',v_invoice_id,'invoice_no',v_invoice_no,'integration_status','queued'),
    auth.uid(),coalesce(auth.jwt()->>'email','system'),null,'accounting',
    'Fatura taslağı oluşturuldu ve KolayBi gönderim kuyruğuna alındı'
  FROM public.shipments s WHERE s.sale_invoice_id=v_invoice_id;

  RETURN jsonb_build_object(
    'id',v_invoice_id,'invoice_no',v_invoice_no,'grand_total',v_total,
    'integration_status','queued','already_exists',false
  );
END $$;

CREATE OR REPLACE FUNCTION public.rex_create_sales_invoice(
  p_customer_id uuid,p_shipment_ids uuid[],p_invoice_date date,p_due_date date,
  p_currency text,p_payment_status text,p_notes text,p_items jsonb
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  RETURN public.rex_create_sales_invoice_secure(
    p_customer_id,p_shipment_ids,p_invoice_date,p_due_date,p_currency,p_payment_status,
    p_notes,p_items,'e_archive','EARSIVFATURA',1,gen_random_uuid()::text
  );
END $$;

CREATE OR REPLACE FUNCTION public.rex_update_sales_invoice_draft(
  p_invoice_id uuid,p_invoice_date date,p_due_date date,p_notes text,p_items jsonb
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
  v_invoice public.sales_invoices%ROWTYPE;
  v_subtotal numeric:=0;
  v_tax numeric:=0;
  v_item jsonb;
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin','accounting']) THEN RAISE EXCEPTION 'Bu işlem için yetkiniz bulunmuyor'; END IF;
  SELECT * INTO v_invoice FROM public.sales_invoices WHERE id=p_invoice_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Fatura bulunamadı'; END IF;
  IF v_invoice.integration_status NOT IN ('draft','queued','failed','mapping_required') THEN
    RAISE EXCEPTION 'KolayBi gönderimi başlamış fatura değiştirilemez';
  END IF;
  IF p_due_date<p_invoice_date THEN RAISE EXCEPTION 'Vade tarihi fatura tarihinden önce olamaz'; END IF;
  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' OR jsonb_array_length(p_items)=0 THEN RAISE EXCEPTION 'En az bir fatura kalemi gereklidir'; END IF;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
    IF nullif(trim(v_item->>'description'),'') IS NULL OR coalesce((v_item->>'quantity')::numeric,0)<=0 OR coalesce((v_item->>'unitPrice')::numeric,0)<0 THEN
      RAISE EXCEPTION 'Geçersiz fatura kalemi';
    END IF;
    IF coalesce((v_item->>'vatRate')::numeric,-1)<0 OR coalesce((v_item->>'vatRate')::numeric,101)>100 THEN RAISE EXCEPTION 'Geçersiz KDV oranı'; END IF;
    IF coalesce((v_item->>'vatRate')::numeric,0)=0 AND nullif(trim(v_item->>'exemptionCode'),'') IS NULL THEN RAISE EXCEPTION 'Sıfır KDV için istisna kodu zorunludur'; END IF;
    v_subtotal:=v_subtotal+(v_item->>'quantity')::numeric*(v_item->>'unitPrice')::numeric;
    v_tax:=v_tax+(v_item->>'quantity')::numeric*(v_item->>'unitPrice')::numeric*coalesce((v_item->>'vatRate')::numeric,0)/100;
  END LOOP;
  PERFORM set_config('rex.invoice_sync','on',true);
  UPDATE public.sales_invoices SET invoice_date=p_invoice_date,due_date=p_due_date,notes=p_notes,
    subtotal=v_subtotal,total_tax=v_tax,grand_total=v_subtotal+v_tax,integration_status='queued',
    kolaybi_status='queued',next_retry_at=now(),updated_at=now() WHERE id=p_invoice_id;
  DELETE FROM public.sales_invoice_items WHERE invoice_id=p_invoice_id;
  INSERT INTO public.sales_invoice_items(invoice_id,product_code,description,quantity,unit,unit_price,subtotal,tax_rate,tax_amount,discount_amount,total,kolaybi_product_id,withholding_code,withholding_value,withholding_type,exemption_code)
  SELECT p_invoice_id,coalesce(nullif(item->>'productCode',''),'HIZMET'),trim(item->>'description'),
    (item->>'quantity')::numeric,coalesce(nullif(item->>'unit',''),'Adet'),(item->>'unitPrice')::numeric,
    (item->>'quantity')::numeric*(item->>'unitPrice')::numeric,coalesce((item->>'vatRate')::numeric,0),
    (item->>'quantity')::numeric*(item->>'unitPrice')::numeric*coalesce((item->>'vatRate')::numeric,0)/100,0,
    (item->>'quantity')::numeric*(item->>'unitPrice')::numeric*(1+coalesce((item->>'vatRate')::numeric,0)/100),
    coalesce(nullif(item->>'kolaybiProductId','')::bigint,(SELECT m.kolaybi_product_id FROM public.invoice_product_mappings m WHERE m.product_code=coalesce(nullif(item->>'productCode',''),'HIZMET') AND m.active=true)),
    nullif(trim(item->>'withholdingCode'),''),nullif(item->>'withholdingValue','')::numeric,
    CASE WHEN nullif(item->>'withholdingValue','') IS NULL THEN NULL ELSE coalesce(nullif(item->>'withholdingType',''),'PERCENTAGE') END,
    nullif(trim(item->>'exemptionCode'),'') FROM jsonb_array_elements(p_items) AS item;
  INSERT INTO public.invoice_sync_jobs(invoice_id,job_type,status,run_after,idempotency_key)
  VALUES(p_invoice_id,'send','pending',now(),v_invoice.idempotency_key||':send:'||extract(epoch from now())::bigint)
  ON CONFLICT DO NOTHING;
END $$;

CREATE OR REPLACE FUNCTION public.rex_queue_invoice_sync(p_invoice_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_invoice public.sales_invoices%ROWTYPE;
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin','accounting']) THEN RAISE EXCEPTION 'Bu işlem için yetkiniz bulunmuyor'; END IF;
  SELECT * INTO v_invoice FROM public.sales_invoices WHERE id=p_invoice_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Fatura bulunamadı'; END IF;
  IF v_invoice.integration_status IN ('official','cancelled','refund_created') THEN RAISE EXCEPTION 'Bu fatura yeniden gönderilemez'; END IF;
  PERFORM set_config('rex.invoice_sync','on',true);
  UPDATE public.sales_invoices SET integration_status='queued',kolaybi_status='queued',next_retry_at=now(),kolaybi_error=NULL,updated_at=now() WHERE id=p_invoice_id;
  UPDATE public.invoice_sync_jobs SET status='pending',run_after=now(),locked_at=NULL,locked_by=NULL,last_error=NULL,updated_at=now()
  WHERE invoice_id=p_invoice_id AND job_type='send' AND status IN ('pending','processing','dead');
  IF NOT FOUND THEN
    INSERT INTO public.invoice_sync_jobs(invoice_id,job_type,status,run_after,idempotency_key)
    VALUES(p_invoice_id,'send','pending',now(),v_invoice.idempotency_key||':send:'||extract(epoch from now())::bigint);
  END IF;
  UPDATE public.shipments SET invoice_status='kolaybi_bekliyor',updated_at=now() WHERE sale_invoice_id=p_invoice_id;
END $$;

CREATE OR REPLACE FUNCTION public.rex_claim_invoice_sync_job(
  p_worker_id text,p_invoice_id uuid DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_job public.invoice_sync_jobs%ROWTYPE;
BEGIN
  IF auth.role()<>'service_role' AND NOT public.rex_has_role(ARRAY['admin','accounting']) THEN
    RAISE EXCEPTION 'Bu işlem için yetkiniz bulunmuyor';
  END IF;
  SELECT * INTO v_job FROM public.invoice_sync_jobs
  WHERE status='pending' AND run_after<=now() AND attempts<max_attempts
    AND (p_invoice_id IS NULL OR invoice_id=p_invoice_id)
  ORDER BY run_after,created_at FOR UPDATE SKIP LOCKED LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;
  UPDATE public.invoice_sync_jobs SET status='processing',attempts=attempts+1,
    locked_at=now(),locked_by=left(coalesce(p_worker_id,'worker'),200),updated_at=now()
  WHERE id=v_job.id RETURNING * INTO v_job;
  PERFORM set_config('rex.invoice_sync','on',true);
  UPDATE public.sales_invoices SET integration_status='processing',kolaybi_status='started',
    last_attempt_at=now(),retry_count=v_job.attempts,next_retry_at=NULL,updated_at=now()
  WHERE id=v_job.invoice_id;
  RETURN jsonb_build_object('job_id',v_job.id,'invoice_id',v_job.invoice_id,'job_type',v_job.job_type,'attempt',v_job.attempts,'max_attempts',v_job.max_attempts);
END $$;

CREATE OR REPLACE FUNCTION public.rex_queue_invoice_status_check(p_invoice_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_invoice public.sales_invoices%ROWTYPE;
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin','accounting']) THEN RAISE EXCEPTION 'Bu işlem için yetkiniz bulunmuyor'; END IF;
  SELECT * INTO v_invoice FROM public.sales_invoices WHERE id=p_invoice_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Fatura bulunamadı'; END IF;
  IF v_invoice.kolaybi_document_id IS NULL THEN RAISE EXCEPTION 'KolayBi belge kimliği henüz oluşmadı'; END IF;
  INSERT INTO public.invoice_sync_jobs(invoice_id,job_type,status,run_after,idempotency_key)
  VALUES(p_invoice_id,'status','pending',now(),v_invoice.idempotency_key||':status:'||extract(epoch from now())::bigint)
  ON CONFLICT DO NOTHING;
END $$;

CREATE OR REPLACE FUNCTION public.rex_record_invoice_provider_document(
  p_job_id uuid,p_document_id bigint,p_provider_status text DEFAULT NULL,p_result jsonb DEFAULT '{}'::jsonb
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_job public.invoice_sync_jobs%ROWTYPE;
BEGIN
  IF auth.role()<>'service_role' AND NOT public.rex_has_role(ARRAY['admin','accounting']) THEN RAISE EXCEPTION 'Bu işlem için yetkiniz bulunmuyor'; END IF;
  SELECT * INTO v_job FROM public.invoice_sync_jobs WHERE id=p_job_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Kuyruk işi bulunamadı'; END IF;
  IF p_document_id IS NULL THEN RAISE EXCEPTION 'KolayBi belge kimliği zorunludur'; END IF;
  PERFORM set_config('rex.invoice_sync','on',true);
  UPDATE public.sales_invoices SET integration_status='submitted',kolaybi_status='created',
    kolaybi_document_id=p_document_id,provider_status=coalesce(nullif(trim(p_provider_status),''),provider_status),
    kolaybi_error=NULL,updated_at=now() WHERE id=v_job.invoice_id;
  UPDATE public.invoice_sync_jobs SET result=coalesce(result,'{}'::jsonb)||coalesce(p_result,'{}'::jsonb),updated_at=now() WHERE id=p_job_id;
  UPDATE public.shipments SET invoice_status='kolaybi_gonderildi',updated_at=now() WHERE sale_invoice_id=v_job.invoice_id;
END $$;

CREATE OR REPLACE FUNCTION public.rex_record_invoice_sync_result(
  p_job_id uuid,p_status text,p_retryable boolean DEFAULT false,p_error text DEFAULT NULL,
  p_document_id bigint DEFAULT NULL,p_uuid text DEFAULT NULL,p_invoice_no text DEFAULT NULL,
  p_provider_status text DEFAULT NULL,p_pdf_url text DEFAULT NULL,p_result jsonb DEFAULT '{}'::jsonb
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
  v_job public.invoice_sync_jobs%ROWTYPE;
  v_invoice public.sales_invoices%ROWTYPE;
  v_delay integer;
  v_event text;
BEGIN
  IF auth.role()<>'service_role' AND NOT public.rex_has_role(ARRAY['admin','accounting']) THEN RAISE EXCEPTION 'Bu işlem için yetkiniz bulunmuyor'; END IF;
  IF p_status NOT IN ('submitted','official','failed','mapping_required','status_checked') THEN RAISE EXCEPTION 'Geçersiz entegrasyon sonucu'; END IF;
  SELECT * INTO v_job FROM public.invoice_sync_jobs WHERE id=p_job_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Kuyruk işi bulunamadı'; END IF;
  SELECT * INTO v_invoice FROM public.sales_invoices WHERE id=v_job.invoice_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Fatura bulunamadı'; END IF;
  PERFORM set_config('rex.invoice_sync','on',true);

  IF p_status IN ('submitted','official','status_checked') THEN
    UPDATE public.invoice_sync_jobs SET status='completed',result=coalesce(p_result,'{}'::jsonb),
      completed_at=now(),locked_at=NULL,locked_by=NULL,last_error=NULL,updated_at=now() WHERE id=p_job_id;
    UPDATE public.sales_invoices SET
      integration_status=CASE WHEN p_status='official' THEN 'official' WHEN integration_status='official' THEN 'official' ELSE 'submitted' END,
      kolaybi_status=CASE WHEN p_status='official' THEN 'e_document_sent' ELSE 'created' END,
      kolaybi_document_id=coalesce(p_document_id,kolaybi_document_id),
      official_uuid=coalesce(nullif(trim(p_uuid),''),official_uuid),
      kolaybi_uuid=coalesce(nullif(trim(p_uuid),''),kolaybi_uuid),
      official_invoice_no=coalesce(nullif(trim(p_invoice_no),''),official_invoice_no),
      kolaybi_invoice_no=coalesce(nullif(trim(p_invoice_no),''),kolaybi_invoice_no),
      provider_status=coalesce(nullif(trim(p_provider_status),''),provider_status),
      pdf_url=coalesce(nullif(trim(p_pdf_url),''),pdf_url),
      kolaybi_synced_at=CASE WHEN p_status='official' THEN now() ELSE kolaybi_synced_at END,
      last_status_check_at=CASE WHEN p_status='status_checked' THEN now() ELSE last_status_check_at END,
      kolaybi_error=NULL,next_retry_at=NULL,updated_at=now()
    WHERE id=v_job.invoice_id;
    UPDATE public.shipments SET invoice_status=CASE WHEN p_status='official' THEN 'faturalandi' ELSE 'kolaybi_gonderildi' END,updated_at=now()
    WHERE sale_invoice_id=v_job.invoice_id;
    v_event:=CASE WHEN p_status='official' THEN 'invoice_official' WHEN p_status='status_checked' THEN 'invoice_status_checked' ELSE 'invoice_submitted' END;
  ELSE
    v_delay:=least(1440,(power(2,least(v_job.attempts,8))::integer)*5);
    UPDATE public.invoice_sync_jobs SET
      status=CASE WHEN p_retryable AND attempts<max_attempts THEN 'pending' ELSE 'dead' END,
      run_after=CASE WHEN p_retryable AND attempts<max_attempts THEN now()+make_interval(mins=>v_delay) ELSE run_after END,
      locked_at=NULL,locked_by=NULL,last_error=left(coalesce(p_error,'Bilinmeyen hata'),2000),updated_at=now()
    WHERE id=p_job_id;
    UPDATE public.sales_invoices SET integration_status=p_status,kolaybi_status=p_status,
      kolaybi_error=left(coalesce(p_error,'Bilinmeyen hata'),1000),
      next_retry_at=CASE WHEN p_retryable AND v_job.attempts<v_job.max_attempts THEN now()+make_interval(mins=>v_delay) ELSE NULL END,
      updated_at=now() WHERE id=v_job.invoice_id;
    UPDATE public.shipments SET invoice_status='fatura_hatasi',updated_at=now() WHERE sale_invoice_id=v_job.invoice_id;
    v_event:=CASE WHEN p_retryable AND v_job.attempts<v_job.max_attempts THEN 'invoice_retry_scheduled' ELSE 'kolaybi_sync_failed' END;
  END IF;

  INSERT INTO public.shipment_events(shipment_id,shipment_code,event_type,old_status,new_status,changed_fields,actor_id,actor_email,actor_role,source,note)
  SELECT s.id,s.shipment_code,v_event,s.status,s.status,
    jsonb_build_object('invoice_id',v_job.invoice_id,'integration_status',p_status,'document_id',p_document_id,'provider_status',p_provider_status,'attempt',v_job.attempts),
    auth.uid(),coalesce(auth.jwt()->>'email','system'),NULL,'kolaybi',
    CASE WHEN p_status='official' THEN 'KolayBi e-belgesi resmileşti'
         WHEN p_status='submitted' THEN 'Fatura KolayBi’ye gönderildi'
         WHEN p_status='status_checked' THEN 'KolayBi fatura durumu güncellendi'
         WHEN p_retryable THEN 'KolayBi gönderimi başarısız; otomatik yeniden deneme planlandı: '||left(coalesce(p_error,''),500)
         ELSE 'KolayBi gönderimi durduruldu: '||left(coalesce(p_error,''),500) END
  FROM public.shipments s WHERE s.sale_invoice_id=v_job.invoice_id;
END $$;

CREATE OR REPLACE FUNCTION public.rex_cancel_sales_invoice(
  p_invoice_id uuid,p_reason text,p_cancellation_type text,p_external_reference text DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_invoice public.sales_invoices%ROWTYPE; v_email text; v_role text;
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin','accounting']) THEN RAISE EXCEPTION 'Bu işlem için yetkiniz bulunmuyor'; END IF;
  IF nullif(trim(p_reason),'') IS NULL OR length(trim(p_reason))<10 THEN RAISE EXCEPTION 'Fatura iptal/iade nedeni en az 10 karakter olmalıdır'; END IF;
  IF p_cancellation_type NOT IN ('iptal','iade') THEN RAISE EXCEPTION 'İşlem türü iptal veya iade olmalıdır'; END IF;
  SELECT * INTO v_invoice FROM public.sales_invoices WHERE id=p_invoice_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Fatura bulunamadı'; END IF;
  IF v_invoice.integration_status IN ('cancelled','refund_created') THEN RAISE EXCEPTION 'Fatura daha önce iptal/iade edilmiş'; END IF;
  IF v_invoice.payment_status IN ('Ödendi','Kısmi Ödendi') AND p_cancellation_type<>'iade' THEN RAISE EXCEPTION 'Tahsilat bulunan fatura yalnızca iade süreciyle kapatılabilir'; END IF;
  IF v_invoice.document_type='e_invoice' AND v_invoice.integration_status='official' AND p_cancellation_type<>'iade' THEN RAISE EXCEPTION 'Resmî e-fatura iptal edilemez; iade faturası oluşturulmalıdır'; END IF;
  IF v_invoice.integration_status IN ('submitted','official') AND nullif(trim(p_external_reference),'') IS NULL THEN RAISE EXCEPTION 'KolayBi iptal/iade işlemi tamamlanıp dış sistem referansı girilmelidir'; END IF;
  SELECT email,role INTO v_email,v_role FROM public.app_user_roles WHERE user_id=auth.uid() AND active=true LIMIT 1;
  v_email:=coalesce(v_email,auth.jwt()->>'email');
  INSERT INTO public.shipment_events(shipment_id,shipment_code,event_type,old_status,new_status,changed_fields,actor_id,actor_email,actor_role,source,note)
  SELECT s.id,s.shipment_code,CASE WHEN p_cancellation_type='iade' THEN 'invoice_refund_created' ELSE 'invoice_cancelled' END,
    s.status,s.status,jsonb_build_object('invoice_id',p_invoice_id,'invoice_no',v_invoice.invoice_no,'type',p_cancellation_type,'reference',p_external_reference),
    auth.uid(),v_email,v_role,'accounting','Fatura '||CASE WHEN p_cancellation_type='iade' THEN 'iade' ELSE 'iptal' END||' süreci tamamlandı: '||trim(p_reason)
  FROM public.shipments s WHERE s.sale_invoice_id=p_invoice_id;
  PERFORM set_config('rex.invoice_sync','on',true);
  UPDATE public.sales_invoices SET payment_status='İptal',integration_status=CASE WHEN p_cancellation_type='iade' THEN 'refund_created' ELSE 'cancelled' END,
    kolaybi_status=CASE WHEN p_cancellation_type='iade' THEN 'refund_created' ELSE 'cancelled' END,
    cancellation_reason=trim(p_reason),cancellation_type=p_cancellation_type,cancellation_reference=nullif(trim(p_external_reference),''),
    cancelled_at=now(),cancelled_by=auth.uid(),updated_at=now() WHERE id=p_invoice_id;
  UPDATE public.invoice_sync_jobs SET status='dead',last_error='Fatura iptal/iade edildi',locked_at=NULL,locked_by=NULL,updated_at=now()
    WHERE invoice_id=p_invoice_id AND status IN ('pending','processing');
  UPDATE public.shipments SET invoice_status=CASE WHEN p_cancellation_type='iade' THEN 'iade_faturasi' ELSE 'fatura_iptal' END,updated_at=now()
    WHERE sale_invoice_id=p_invoice_id;
END $$;

CREATE OR REPLACE FUNCTION public.rex_guard_invoice_integration_fields()
RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
  IF current_setting('rex.invoice_sync',true)='on' THEN RETURN NEW; END IF;
  IF OLD.integration_status IS DISTINCT FROM NEW.integration_status
     OR OLD.kolaybi_document_id IS DISTINCT FROM NEW.kolaybi_document_id
     OR OLD.official_uuid IS DISTINCT FROM NEW.official_uuid
     OR OLD.official_invoice_no IS DISTINCT FROM NEW.official_invoice_no
     OR OLD.pdf_url IS DISTINCT FROM NEW.pdf_url
     OR OLD.provider_status IS DISTINCT FROM NEW.provider_status
     OR OLD.idempotency_key IS DISTINCT FROM NEW.idempotency_key THEN
    RAISE EXCEPTION 'Fatura entegrasyon alanları yalnızca güvenli iş akışıyla değiştirilebilir';
  END IF;
  IF OLD.integration_status NOT IN ('draft','queued','failed','mapping_required') AND ROW(OLD.invoice_date,OLD.due_date,OLD.customer_id,OLD.currency,OLD.grand_total,OLD.total_tax) IS DISTINCT FROM ROW(NEW.invoice_date,NEW.due_date,NEW.customer_id,NEW.currency,NEW.grand_total,NEW.total_tax) THEN
    RAISE EXCEPTION 'KolayBi gönderimi başlamış faturanın kritik alanları değiştirilemez';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS rex_invoice_integration_guard ON public.sales_invoices;
CREATE TRIGGER rex_invoice_integration_guard BEFORE UPDATE ON public.sales_invoices
FOR EACH ROW EXECUTE FUNCTION public.rex_guard_invoice_integration_fields();

REVOKE INSERT,UPDATE,DELETE ON public.sales_invoices FROM authenticated;
REVOKE INSERT,UPDATE,DELETE ON public.sales_invoice_items FROM authenticated;
GRANT SELECT ON public.invoice_sync_jobs,public.invoice_product_mappings TO authenticated;

REVOKE ALL ON FUNCTION public.rex_create_sales_invoice_secure(uuid,uuid[],date,date,text,text,text,jsonb,text,text,numeric,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.rex_update_sales_invoice_draft(uuid,date,date,text,jsonb) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.rex_queue_invoice_sync(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.rex_claim_invoice_sync_job(text,uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.rex_queue_invoice_status_check(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.rex_record_invoice_provider_document(uuid,bigint,text,jsonb) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.rex_record_invoice_sync_result(uuid,text,boolean,text,bigint,text,text,text,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rex_create_sales_invoice_secure(uuid,uuid[],date,date,text,text,text,jsonb,text,text,numeric,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_update_sales_invoice_draft(uuid,date,date,text,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_queue_invoice_sync(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_claim_invoice_sync_job(text,uuid) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.rex_queue_invoice_status_check(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_record_invoice_provider_document(uuid,bigint,text,jsonb) TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.rex_record_invoice_sync_result(uuid,text,boolean,text,bigint,text,text,text,text,jsonb) TO authenticated,service_role;
REVOKE ALL ON FUNCTION public.rex_guard_invoice_integration_fields() FROM PUBLIC;
