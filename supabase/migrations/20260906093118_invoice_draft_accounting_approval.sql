-- Keep operational invoice drafts editable until accounting explicitly approves them.

ALTER TABLE public.sales_invoices
  ADD COLUMN IF NOT EXISTS accounting_review_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS accounting_review_note text,
  ADD COLUMN IF NOT EXISTS accounting_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS accounting_reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.sales_invoices
  DROP CONSTRAINT IF EXISTS sales_invoices_accounting_review_status_check;
ALTER TABLE public.sales_invoices
  ADD CONSTRAINT sales_invoices_accounting_review_status_check
  CHECK (accounting_review_status IN ('pending','approved'));

UPDATE public.sales_invoices
SET accounting_review_status = CASE
      WHEN integration_status IN ('submitted','official','cancelled','refund_created')
        OR kolaybi_document_id IS NOT NULL THEN 'approved'
      ELSE 'pending'
    END,
    accounting_reviewed_at = CASE
      WHEN integration_status IN ('submitted','official','cancelled','refund_created')
        OR kolaybi_document_id IS NOT NULL THEN coalesce(kolaybi_synced_at,updated_at,created_at)
      ELSE NULL
    END;

-- Stop legacy, not-yet-submitted jobs so migration cannot send a document before review.
UPDATE public.invoice_sync_jobs j
SET status='dead',locked_at=NULL,locked_by=NULL,
    last_error='Muhasebe onayı bekleniyor',updated_at=now()
FROM public.sales_invoices i
WHERE i.id=j.invoice_id
  AND i.accounting_review_status='pending'
  AND i.kolaybi_document_id IS NULL
  AND j.status IN ('pending','processing');

CREATE INDEX IF NOT EXISTS sales_invoices_accounting_review_idx
  ON public.sales_invoices(accounting_review_status,created_at DESC)
  WHERE accounting_review_status='pending';

ALTER TABLE public.shipment_events DROP CONSTRAINT IF EXISTS shipment_events_event_type_check;
ALTER TABLE public.shipment_events ADD CONSTRAINT shipment_events_event_type_check CHECK (event_type IN (
  'history_enabled','created','updated','assignment_changed','status_changed','driver_assigned','vehicle_assigned','started',
  'delivery_document_added','delivered','invoiced','invoice_unlinked','deleted',
  'owner_approved_edit','job_created','job_approved',
  'kolaybi_sync_started','kolaybi_sync_succeeded','kolaybi_sync_failed',
  'cancelled','revision_requested','revision_rejected','revision_applied','invoice_cancelled',
  'uetds_details_updated','uetds_queued','uetds_accepted','uetds_failed',
  'uetds_carrier_reference_recorded','uetds_cancellation_queued',
  'invoice_draft_created','invoice_draft_updated','invoice_accounting_approved',
  'invoice_queued','invoice_submitted','invoice_official','invoice_retry_scheduled',
  'invoice_status_checked','invoice_refund_created','exception_created','exception_resolved',
  'integration_imported'
));

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
      'accounting_review_status',v_existing.accounting_review_status,'already_exists',true
    );
  END IF;

  IF p_customer_id IS NULL OR p_invoice_date IS NULL OR p_due_date IS NULL THEN
    RAISE EXCEPTION 'Müşteri, fatura tarihi ve vade tarihi zorunludur';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM public.customers WHERE id=p_customer_id) THEN RAISE EXCEPTION 'Müşteri bulunamadı'; END IF;
  IF p_due_date < p_invoice_date THEN RAISE EXCEPTION 'Vade tarihi fatura tarihinden önce olamaz'; END IF;
  IF p_currency NOT IN ('TRY','USD','EUR','GBP') THEN RAISE EXCEPTION 'Geçersiz para birimi'; END IF;
  IF p_currency <> 'TRY' AND coalesce(p_exchange_rate,0) <= 0 THEN RAISE EXCEPTION 'Dövizli faturada geçerli kur zorunludur'; END IF;
  IF p_currency='TRY' THEN p_exchange_rate := 1; END IF;
  IF p_document_type NOT IN ('e_invoice','e_archive') THEN RAISE EXCEPTION 'Geçersiz e-belge türü'; END IF;
  IF p_document_type='e_archive' AND p_document_scenario<>'EARSIVFATURA' THEN RAISE EXCEPTION 'E-arşiv belge senaryosu EARSIVFATURA olmalıdır'; END IF;
  IF p_document_type='e_invoice' AND p_document_scenario NOT IN ('TEMELFATURA','TICARIFATURA','KAMU') THEN RAISE EXCEPTION 'Geçersiz e-fatura senaryosu'; END IF;
  IF p_payment_status NOT IN ('Ödendi','Bekliyor','Gecikmiş','Kısmi Ödendi') THEN RAISE EXCEPTION 'Geçersiz ödeme durumu'; END IF;
  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' OR jsonb_array_length(p_items)=0 THEN RAISE EXCEPTION 'En az bir fatura kalemi gereklidir'; END IF;

  IF v_shipments>0 THEN
    PERFORM 1 FROM public.shipments WHERE id=ANY(p_shipment_ids) FOR UPDATE;
    IF (SELECT count(DISTINCT id) FROM public.shipments
        WHERE id=ANY(p_shipment_ids) AND status='teslim_edildi'
          AND customer_id=p_customer_id AND sale_invoice_id IS NULL) <> v_shipments THEN
      RAISE EXCEPTION 'Sevkiyatlar teslim edilmiş, aynı müşteriye ait ve daha önce faturalanmamış olmalıdır';
    END IF;
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
    IF nullif(trim(v_item->>'description'),'') IS NULL
       OR coalesce((v_item->>'quantity')::numeric,0)<=0
       OR coalesce((v_item->>'unitPrice')::numeric,0)<0 THEN
      RAISE EXCEPTION 'Fatura kalemi açıklama, miktar ve fiyat bilgileri geçersiz';
    END IF;
    IF coalesce((v_item->>'vatRate')::numeric,-1)<0 OR coalesce((v_item->>'vatRate')::numeric,101)>100 THEN RAISE EXCEPTION 'KDV oranı 0 ile 100 arasında olmalıdır'; END IF;
    IF coalesce((v_item->>'vatRate')::numeric,0)=0 AND nullif(trim(v_item->>'exemptionCode'),'') IS NULL THEN RAISE EXCEPTION 'KDV oranı sıfır olan kalemde istisna kodu zorunludur'; END IF;
    IF (nullif(trim(v_item->>'withholdingCode'),'') IS NULL) <> (nullif(trim(v_item->>'withholdingValue'),'') IS NULL) THEN RAISE EXCEPTION 'Tevkifat kodu ve oranı birlikte girilmelidir'; END IF;
    IF nullif(trim(v_item->>'withholdingValue'),'') IS NOT NULL
       AND ((v_item->>'withholdingValue')::numeric<=0 OR (v_item->>'withholdingValue')::numeric>100) THEN RAISE EXCEPTION 'Tevkifat oranı 0 ile 100 arasında olmalıdır'; END IF;
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
    idempotency_key,exchange_rate,kolaybi_status,next_retry_at,accounting_review_status
  ) VALUES(
    auth.uid(),p_customer_id,CASE WHEN v_shipments=1 THEN p_shipment_ids[1] ELSE NULL END,
    v_invoice_no,p_invoice_date,p_due_date,p_payment_status,v_subtotal,v_tax,0,0,0,v_total,
    p_currency,p_notes,'taslak','draft',p_document_type,p_document_scenario,
    v_key,p_exchange_rate,'draft',NULL,'pending'
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

  IF v_shipments>0 THEN
    PERFORM set_config('rex.invoice_sync','on',true);
    UPDATE public.shipments SET sale_invoice_id=v_invoice_id,invoice_status='fatura_taslagi',updated_at=now()
    WHERE id=ANY(p_shipment_ids);
  END IF;

  INSERT INTO public.shipment_events(
    shipment_id,shipment_code,event_type,old_status,new_status,changed_fields,
    actor_id,actor_email,actor_role,source,note
  )
  SELECT s.id,s.shipment_code,'invoice_draft_created',s.status,s.status,
    jsonb_build_object('invoice_id',v_invoice_id,'invoice_no',v_invoice_no,'integration_status','draft'),
    auth.uid(),coalesce(auth.jwt()->>'email','system'),null,'operations',
    'Fatura taslağı oluşturuldu; muhasebe incelemesi bekleniyor'
  FROM public.shipments s WHERE s.sale_invoice_id=v_invoice_id;

  RETURN jsonb_build_object(
    'id',v_invoice_id,'invoice_no',v_invoice_no,'grand_total',v_total,
    'integration_status','draft','accounting_review_status','pending','already_exists',false
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
  IF NOT public.rex_has_role(ARRAY['admin','accounting','operations']) THEN RAISE EXCEPTION 'Bu işlem için yetkiniz bulunmuyor'; END IF;
  SELECT * INTO v_invoice FROM public.sales_invoices WHERE id=p_invoice_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Fatura bulunamadı'; END IF;
  IF v_invoice.kolaybi_document_id IS NOT NULL OR v_invoice.integration_status NOT IN ('draft','queued','failed','mapping_required') THEN
    RAISE EXCEPTION 'KolayBi gönderimi başlamış fatura değiştirilemez';
  END IF;
  IF p_due_date<p_invoice_date THEN RAISE EXCEPTION 'Vade tarihi fatura tarihinden önce olamaz'; END IF;
  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' OR jsonb_array_length(p_items)=0 THEN RAISE EXCEPTION 'En az bir fatura kalemi gereklidir'; END IF;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
    IF nullif(trim(v_item->>'description'),'') IS NULL OR coalesce((v_item->>'quantity')::numeric,0)<=0 OR coalesce((v_item->>'unitPrice')::numeric,0)<0 THEN RAISE EXCEPTION 'Geçersiz fatura kalemi'; END IF;
    IF coalesce((v_item->>'vatRate')::numeric,-1)<0 OR coalesce((v_item->>'vatRate')::numeric,101)>100 THEN RAISE EXCEPTION 'Geçersiz KDV oranı'; END IF;
    IF coalesce((v_item->>'vatRate')::numeric,0)=0 AND nullif(trim(v_item->>'exemptionCode'),'') IS NULL THEN RAISE EXCEPTION 'Sıfır KDV için istisna kodu zorunludur'; END IF;
    v_subtotal:=v_subtotal+(v_item->>'quantity')::numeric*(v_item->>'unitPrice')::numeric;
    v_tax:=v_tax+(v_item->>'quantity')::numeric*(v_item->>'unitPrice')::numeric*coalesce((v_item->>'vatRate')::numeric,0)/100;
  END LOOP;
  PERFORM set_config('rex.invoice_sync','on',true);
  UPDATE public.sales_invoices SET invoice_date=p_invoice_date,due_date=p_due_date,notes=p_notes,
    subtotal=v_subtotal,total_tax=v_tax,grand_total=v_subtotal+v_tax,integration_status='draft',
    kolaybi_status='draft',kolaybi_error=NULL,next_retry_at=NULL,
    accounting_review_status='pending',accounting_review_note=NULL,
    accounting_reviewed_at=NULL,accounting_reviewed_by=NULL,updated_at=now()
  WHERE id=p_invoice_id;
  UPDATE public.invoice_sync_jobs SET status='dead',locked_at=NULL,locked_by=NULL,
    last_error='Taslak değiştirildi; yeniden muhasebe onayı gerekiyor',updated_at=now()
  WHERE invoice_id=p_invoice_id AND status IN ('pending','processing');
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
  UPDATE public.shipments SET invoice_status='fatura_taslagi',updated_at=now() WHERE sale_invoice_id=p_invoice_id;
  INSERT INTO public.shipment_events(shipment_id,shipment_code,event_type,old_status,new_status,changed_fields,actor_id,actor_email,actor_role,source,note)
  SELECT s.id,s.shipment_code,'invoice_draft_updated',s.status,s.status,
    jsonb_build_object('invoice_id',p_invoice_id,'invoice_no',v_invoice.invoice_no,'grand_total',v_subtotal+v_tax),
    auth.uid(),coalesce(auth.jwt()->>'email','system'),null,'accounting','Fatura taslağı düzenlendi; muhasebe onayı sıfırlandı'
  FROM public.shipments s WHERE s.sale_invoice_id=p_invoice_id;
END $$;

CREATE OR REPLACE FUNCTION public.rex_approve_sales_invoice_draft(
  p_invoice_id uuid,p_note text DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_invoice public.sales_invoices%ROWTYPE;
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin','accounting']) THEN RAISE EXCEPTION 'Yalnızca muhasebe yetkilisi taslağı onaylayabilir'; END IF;
  SELECT * INTO v_invoice FROM public.sales_invoices WHERE id=p_invoice_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Fatura bulunamadı'; END IF;
  IF v_invoice.kolaybi_document_id IS NOT NULL OR v_invoice.integration_status NOT IN ('draft','queued','failed','mapping_required') THEN RAISE EXCEPTION 'Bu fatura artık taslak aşamasında değildir'; END IF;
  IF v_invoice.accounting_review_status='approved'
     AND EXISTS(SELECT 1 FROM public.invoice_sync_jobs WHERE invoice_id=p_invoice_id AND job_type='send' AND status IN ('pending','processing')) THEN
    RETURN;
  END IF;
  IF coalesce(v_invoice.grand_total,0)<=0 THEN RAISE EXCEPTION 'Sıfır tutarlı fatura taslağı onaylanamaz'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.sales_invoice_items WHERE invoice_id=p_invoice_id) THEN RAISE EXCEPTION 'Fatura kalemi bulunmuyor'; END IF;
  PERFORM set_config('rex.invoice_sync','on',true);
  UPDATE public.sales_invoices SET accounting_review_status='approved',accounting_review_note=nullif(trim(p_note),''),
    accounting_reviewed_at=now(),accounting_reviewed_by=auth.uid(),integration_status='queued',
    kolaybi_status='queued',kolaybi_error=NULL,next_retry_at=now(),updated_at=now()
  WHERE id=p_invoice_id;
  UPDATE public.invoice_sync_jobs SET status='dead',locked_at=NULL,locked_by=NULL,updated_at=now()
  WHERE invoice_id=p_invoice_id AND status IN ('pending','processing');
  INSERT INTO public.invoice_sync_jobs(invoice_id,job_type,status,run_after,idempotency_key,payload)
  VALUES(p_invoice_id,'send','pending',now(),v_invoice.idempotency_key||':approved:'||extract(epoch from clock_timestamp())::bigint,
    jsonb_build_object('invoice_no',v_invoice.invoice_no,'accounting_approved',true));
  UPDATE public.shipments SET invoice_status='kolaybi_bekliyor',updated_at=now() WHERE sale_invoice_id=p_invoice_id;
  INSERT INTO public.shipment_events(shipment_id,shipment_code,event_type,old_status,new_status,changed_fields,actor_id,actor_email,actor_role,source,note)
  SELECT s.id,s.shipment_code,'invoice_accounting_approved',s.status,s.status,
    jsonb_build_object('invoice_id',p_invoice_id,'invoice_no',v_invoice.invoice_no,'integration_status','queued'),
    auth.uid(),coalesce(auth.jwt()->>'email','system'),'accounting','accounting',
    concat('Muhasebe fatura taslağını onayladı',CASE WHEN nullif(trim(p_note),'') IS NOT NULL THEN ': '||trim(p_note) ELSE '' END)
  FROM public.shipments s WHERE s.sale_invoice_id=p_invoice_id;
END $$;

CREATE OR REPLACE FUNCTION public.rex_queue_invoice_sync(p_invoice_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_invoice public.sales_invoices%ROWTYPE;
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin','accounting']) THEN RAISE EXCEPTION 'Bu işlem için yetkiniz bulunmuyor'; END IF;
  SELECT * INTO v_invoice FROM public.sales_invoices WHERE id=p_invoice_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Fatura bulunamadı'; END IF;
  IF v_invoice.accounting_review_status<>'approved' THEN RAISE EXCEPTION 'Fatura önce muhasebe tarafından incelenip onaylanmalıdır'; END IF;
  IF v_invoice.integration_status IN ('official','cancelled','refund_created') THEN RAISE EXCEPTION 'Bu fatura yeniden gönderilemez'; END IF;
  PERFORM set_config('rex.invoice_sync','on',true);
  UPDATE public.sales_invoices SET integration_status='queued',kolaybi_status='queued',next_retry_at=now(),kolaybi_error=NULL,updated_at=now() WHERE id=p_invoice_id;
  UPDATE public.invoice_sync_jobs SET status='pending',run_after=now(),locked_at=NULL,locked_by=NULL,last_error=NULL,updated_at=now()
  WHERE invoice_id=p_invoice_id AND job_type='send' AND status IN ('pending','processing');
  IF NOT FOUND THEN
    INSERT INTO public.invoice_sync_jobs(invoice_id,job_type,status,run_after,idempotency_key)
    VALUES(p_invoice_id,'send','pending',now(),v_invoice.idempotency_key||':send:'||extract(epoch from clock_timestamp())::bigint);
  END IF;
  UPDATE public.shipments SET invoice_status='kolaybi_bekliyor',updated_at=now() WHERE sale_invoice_id=p_invoice_id;
END $$;

REVOKE ALL ON FUNCTION public.rex_create_sales_invoice_secure(uuid,uuid[],date,date,text,text,text,jsonb,text,text,numeric,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.rex_update_sales_invoice_draft(uuid,date,date,text,jsonb) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.rex_approve_sales_invoice_draft(uuid,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.rex_queue_invoice_sync(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rex_create_sales_invoice_secure(uuid,uuid[],date,date,text,text,text,jsonb,text,text,numeric,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_update_sales_invoice_draft(uuid,date,date,text,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_approve_sales_invoice_draft(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_queue_invoice_sync(uuid) TO authenticated;
