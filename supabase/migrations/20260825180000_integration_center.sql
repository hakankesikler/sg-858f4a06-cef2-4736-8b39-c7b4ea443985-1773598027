BEGIN;

-- Central integration registry and safe, idempotent bulk shipment ingestion.
-- Provider secrets stay in Supabase/Vercel secrets; this schema stores only
-- non-secret connection metadata, durable job state and immutable audit data.

ALTER TABLE public.staff_permission_overrides
  DROP CONSTRAINT IF EXISTS staff_permission_overrides_permission_key_check;
ALTER TABLE public.staff_permission_overrides
  ADD CONSTRAINT staff_permission_overrides_permission_key_check CHECK (permission_key IN (
    'crm.customers','crm.portal_invites','sales.work_orders',
    'operations.shipments','operations.assignments','operations.delivery',
    'operations.exceptions','operations.uetds','accounting.sales',
    'accounting.purchase','accounting.accounts','accounting.expenses',
    'reports.sales','reports.operations','reports.accounting','analytics.web',
    'integrations.connections','integrations.imports','integrations.monitoring'
  ));

CREATE OR REPLACE FUNCTION public.rex_base_permission_level(p_role text, p_key text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_role = 'admin' THEN 'manage'
    WHEN p_role = 'sales' AND p_key IN ('crm.customers','crm.portal_invites','sales.work_orders') THEN 'manage'
    WHEN p_role = 'sales' AND p_key IN ('reports.sales','integrations.monitoring') THEN 'view'
    WHEN p_role = 'operations' AND p_key IN (
      'sales.work_orders','operations.shipments','operations.assignments',
      'operations.delivery','operations.exceptions','operations.uetds','integrations.imports'
    ) THEN 'manage'
    WHEN p_role = 'operations' AND p_key IN ('crm.customers','reports.operations','analytics.web','integrations.monitoring') THEN 'view'
    WHEN p_role = 'accounting' AND p_key IN (
      'accounting.sales','accounting.purchase','accounting.accounts','accounting.expenses'
    ) THEN 'manage'
    WHEN p_role = 'accounting' AND p_key IN ('crm.customers','reports.accounting','integrations.monitoring') THEN 'view'
    ELSE 'none'
  END;
$$;

CREATE TABLE IF NOT EXISTS public.integration_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE CHECK (code ~ '^[A-Z0-9][A-Z0-9_-]{2,63}$'),
  name text NOT NULL CHECK (length(trim(name)) >= 2),
  partner_type text NOT NULL CHECK (partner_type IN ('customer','carrier','accounting','integrator','government')),
  customer_id uuid REFERENCES public.customers(id) ON DELETE RESTRICT,
  channel text NOT NULL CHECK (channel IN ('api','webhook','csv','excel','sftp','edi')),
  environment text NOT NULL DEFAULT 'test' CHECK (environment IN ('test','live')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','testing','active','paused','error')),
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_sync_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((partner_type = 'customer' AND customer_id IS NOT NULL) OR partner_type <> 'customer')
);

CREATE UNIQUE INDEX IF NOT EXISTS integration_customer_file_partner_unique
  ON public.integration_partners(customer_id, channel)
  WHERE partner_type = 'customer' AND channel IN ('csv','excel');

CREATE TABLE IF NOT EXISTS public.integration_import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.integration_partners(id) ON DELETE RESTRICT,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  file_name text NOT NULL,
  idempotency_key text NOT NULL CHECK (length(idempotency_key) BETWEEN 16 AND 128),
  status text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing','completed','partial','failed')),
  total_rows integer NOT NULL DEFAULT 0 CHECK (total_rows >= 0),
  imported_rows integer NOT NULL DEFAULT 0 CHECK (imported_rows >= 0),
  invalid_rows integer NOT NULL DEFAULT 0 CHECK (invalid_rows >= 0),
  duplicate_rows integer NOT NULL DEFAULT 0 CHECK (duplicate_rows >= 0),
  failed_rows integer NOT NULL DEFAULT 0 CHECK (failed_rows >= 0),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (partner_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS integration_import_batches_created_idx
  ON public.integration_import_batches(created_at DESC);

CREATE TABLE IF NOT EXISTS public.integration_import_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.integration_import_batches(id) ON DELETE RESTRICT,
  row_number integer NOT NULL CHECK (row_number >= 2),
  external_order_id text,
  status text NOT NULL CHECK (status IN ('invalid','imported','duplicate','failed')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  validation_errors jsonb NOT NULL DEFAULT '[]'::jsonb,
  shipment_id uuid REFERENCES public.shipments(id) ON DELETE RESTRICT,
  last_error text,
  processed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (batch_id, row_number)
);

CREATE TABLE IF NOT EXISTS public.integration_external_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.integration_partners(id) ON DELETE RESTRICT,
  entity_type text NOT NULL CHECK (entity_type IN ('shipment','customer','invoice','purchase_invoice','document')),
  external_id text NOT NULL,
  entity_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (partner_id, entity_type, external_id)
);

CREATE INDEX IF NOT EXISTS integration_external_entity_idx
  ON public.integration_external_references(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS public.integration_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES public.integration_partners(id) ON DELETE RESTRICT,
  batch_id uuid REFERENCES public.integration_import_batches(id) ON DELETE RESTRICT,
  event_type text NOT NULL CHECK (event_type IN (
    'partner_created','partner_updated','import_started','import_completed','import_partial','import_failed'
  )),
  status text NOT NULL CHECK (status IN ('info','success','warning','error')),
  summary text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS integration_events_occurred_idx
  ON public.integration_events(occurred_at DESC);

ALTER TABLE public.integration_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_import_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_external_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY rex_integration_partners_select ON public.integration_partners
  FOR SELECT TO authenticated USING (
    public.rex_has_permission('integrations.connections','view') OR
    public.rex_has_permission('integrations.imports','view') OR
    public.rex_has_permission('integrations.monitoring','view')
  );
CREATE POLICY rex_integration_partners_write ON public.integration_partners
  FOR ALL TO authenticated
  USING (public.rex_has_permission('integrations.connections','manage'))
  WITH CHECK (public.rex_has_permission('integrations.connections','manage'));

CREATE POLICY rex_integration_batches_select ON public.integration_import_batches
  FOR SELECT TO authenticated USING (
    public.rex_has_permission('integrations.imports','view') OR
    public.rex_has_permission('integrations.monitoring','view')
  );
CREATE POLICY rex_integration_rows_select ON public.integration_import_rows
  FOR SELECT TO authenticated USING (
    public.rex_has_permission('integrations.imports','view') OR
    public.rex_has_permission('integrations.monitoring','view')
  );
CREATE POLICY rex_integration_refs_select ON public.integration_external_references
  FOR SELECT TO authenticated USING (
    public.rex_has_permission('integrations.imports','view') OR
    public.rex_has_permission('integrations.monitoring','view')
  );
CREATE POLICY rex_integration_events_select ON public.integration_events
  FOR SELECT TO authenticated USING (
    public.rex_has_permission('integrations.connections','view') OR
    public.rex_has_permission('integrations.imports','view') OR
    public.rex_has_permission('integrations.monitoring','view')
  );

REVOKE INSERT,UPDATE,DELETE ON public.integration_import_batches FROM authenticated;
REVOKE INSERT,UPDATE,DELETE ON public.integration_import_rows FROM authenticated;
REVOKE INSERT,UPDATE,DELETE ON public.integration_external_references FROM authenticated;
REVOKE INSERT,UPDATE,DELETE ON public.integration_events FROM authenticated;
GRANT SELECT ON public.integration_partners,public.integration_import_batches,
  public.integration_import_rows,public.integration_external_references,public.integration_events TO authenticated;
GRANT INSERT,UPDATE,DELETE ON public.integration_partners TO authenticated;

CREATE OR REPLACE FUNCTION public.rex_integration_append_only()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Entegrasyon denetim kayıtları değiştirilemez veya silinemez';
END $$;

DROP TRIGGER IF EXISTS rex_integration_rows_append_only ON public.integration_import_rows;
CREATE TRIGGER rex_integration_rows_append_only BEFORE UPDATE OR DELETE ON public.integration_import_rows
FOR EACH ROW WHEN (coalesce(current_setting('rex.integration_worker',true),'') <> 'on')
EXECUTE FUNCTION public.rex_integration_append_only();
DROP TRIGGER IF EXISTS rex_integration_refs_append_only ON public.integration_external_references;
CREATE TRIGGER rex_integration_refs_append_only BEFORE UPDATE OR DELETE ON public.integration_external_references
FOR EACH ROW EXECUTE FUNCTION public.rex_integration_append_only();
DROP TRIGGER IF EXISTS rex_integration_events_append_only ON public.integration_events;
CREATE TRIGGER rex_integration_events_append_only BEFORE UPDATE OR DELETE ON public.integration_events
FOR EACH ROW EXECUTE FUNCTION public.rex_integration_append_only();

ALTER TABLE public.shipment_events DROP CONSTRAINT IF EXISTS shipment_events_event_type_check;
ALTER TABLE public.shipment_events ADD CONSTRAINT shipment_events_event_type_check CHECK (event_type IN (
  'history_enabled','created','updated','assignment_changed','status_changed','driver_assigned','vehicle_assigned','started',
  'delivery_document_added','delivered','invoiced','invoice_unlinked','deleted',
  'owner_approved_edit','job_created','job_approved',
  'kolaybi_sync_started','kolaybi_sync_succeeded','kolaybi_sync_failed',
  'cancelled','revision_requested','revision_rejected','revision_applied','invoice_cancelled',
  'uetds_details_updated','uetds_queued','uetds_accepted','uetds_failed',
  'uetds_carrier_reference_recorded','uetds_cancellation_queued',
  'invoice_queued','invoice_submitted','invoice_official','invoice_retry_scheduled',
  'invoice_status_checked','invoice_refund_created','exception_created','exception_resolved',
  'integration_imported'
));

CREATE OR REPLACE FUNCTION public.rex_import_customer_shipments(
  p_customer_id uuid,
  p_file_name text,
  p_idempotency_key text,
  p_rows jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public,pg_temp
AS $$
DECLARE
  v_customer public.customers%ROWTYPE;
  v_partner public.integration_partners%ROWTYPE;
  v_batch public.integration_import_batches%ROWTYPE;
  v_row jsonb;
  v_row_id uuid;
  v_row_number integer := 1;
  v_external_id text;
  v_quantity integer;
  v_unit_weight numeric;
  v_unit_price numeric;
  v_pickup_date date;
  v_estimated_delivery_date date;
  v_errors jsonb;
  v_shipment_id uuid;
  v_existing_entity uuid;
  v_imported integer := 0;
  v_invalid integer := 0;
  v_duplicate integer := 0;
  v_failed integer := 0;
  v_status text;
  v_actor_email text := lower(coalesce(auth.jwt()->>'email',''));
BEGIN
  IF NOT public.rex_has_permission('integrations.imports','manage')
     OR NOT public.rex_has_permission('operations.shipments','manage') THEN
    RAISE EXCEPTION 'Toplu sevkiyat aktarımı ve sevkiyat oluşturma yetkileri gereklidir';
  END IF;
  IF jsonb_typeof(p_rows) IS DISTINCT FROM 'array' OR jsonb_array_length(p_rows)=0 THEN
    RAISE EXCEPTION 'Aktarılacak sevkiyat satırı bulunamadı';
  END IF;
  IF jsonb_array_length(p_rows) > 1000 THEN RAISE EXCEPTION 'Bir dosyada en fazla 1000 sevkiyat aktarılabilir'; END IF;
  IF length(trim(coalesce(p_idempotency_key,''))) NOT BETWEEN 16 AND 128 THEN
    RAISE EXCEPTION 'Dosya işlem anahtarı geçersiz';
  END IF;

  SELECT * INTO v_customer FROM public.customers WHERE id=p_customer_id;
  IF NOT FOUND OR coalesce(v_customer.account_type,'musteri') <> 'musteri' THEN
    RAISE EXCEPTION 'Geçerli bir müşteri carisi seçin';
  END IF;

  SELECT * INTO v_partner FROM public.integration_partners
  WHERE customer_id=p_customer_id AND partner_type='customer' AND channel IN ('excel','csv')
  LIMIT 1;
  IF NOT FOUND THEN
    INSERT INTO public.integration_partners(
      code,name,partner_type,customer_id,channel,environment,status,settings,created_by,updated_by
    ) VALUES (
      'CUSTOMER-'||upper(substr(replace(p_customer_id::text,'-',''),1,12)),
      v_customer.name||' Toplu Gönderi', 'customer',p_customer_id,'excel','live','active',
      jsonb_build_object('accepted_formats',jsonb_build_array('xlsx','csv'),'max_rows',1000),auth.uid(),auth.uid()
    ) RETURNING * INTO v_partner;
    INSERT INTO public.integration_events(partner_id,event_type,status,summary,metadata,actor_id,actor_email)
    VALUES(v_partner.id,'partner_created','success',v_customer.name||' toplu gönderi bağlantısı oluşturuldu','{}',auth.uid(),v_actor_email);
  END IF;

  SELECT * INTO v_batch FROM public.integration_import_batches
  WHERE partner_id=v_partner.id AND idempotency_key=trim(p_idempotency_key);
  IF FOUND THEN
    RETURN jsonb_build_object(
      'batch_id',v_batch.id,'already_processed',true,'status',v_batch.status,
      'total',v_batch.total_rows,'imported',v_batch.imported_rows,'invalid',v_batch.invalid_rows,
      'duplicate',v_batch.duplicate_rows,'failed',v_batch.failed_rows
    );
  END IF;

  INSERT INTO public.integration_import_batches(
    partner_id,customer_id,file_name,idempotency_key,status,total_rows,created_by
  ) VALUES (
    v_partner.id,p_customer_id,left(trim(coalesce(p_file_name,'toplu-sevkiyat')),255),
    trim(p_idempotency_key),'processing',jsonb_array_length(p_rows),auth.uid()
  ) RETURNING * INTO v_batch;
  INSERT INTO public.integration_events(partner_id,batch_id,event_type,status,summary,metadata,actor_id,actor_email)
  VALUES(v_partner.id,v_batch.id,'import_started','info','Toplu sevkiyat aktarımı başladı',
    jsonb_build_object('file_name',p_file_name,'total_rows',jsonb_array_length(p_rows)),auth.uid(),v_actor_email);

  PERFORM set_config('rex.integration_worker','on',true);
  FOR v_row IN SELECT value FROM jsonb_array_elements(p_rows) LOOP
    v_row_number := v_row_number + 1;
    v_external_id := nullif(upper(trim(v_row->>'external_order_id')),'');
    v_errors := '[]'::jsonb;
    v_quantity := NULL; v_unit_weight := NULL; v_unit_price := 0;
    v_pickup_date := NULL; v_estimated_delivery_date := NULL; v_row_id := NULL;

    IF v_external_id IS NULL THEN v_errors := v_errors || '"Müşteri sipariş/referans numarası zorunludur"'::jsonb; END IF;
    IF nullif(trim(v_row->>'sender_name'),'') IS NULL THEN v_errors := v_errors || '"Gönderici adı zorunludur"'::jsonb; END IF;
    IF nullif(trim(v_row->>'origin'),'') IS NULL THEN v_errors := v_errors || '"Çıkış ili zorunludur"'::jsonb; END IF;
    IF nullif(trim(v_row->>'receiver'),'') IS NULL THEN v_errors := v_errors || '"Alıcı adı zorunludur"'::jsonb; END IF;
    IF nullif(trim(v_row->>'destination'),'') IS NULL THEN v_errors := v_errors || '"Varış ili zorunludur"'::jsonb; END IF;
    IF nullif(trim(v_row->>'cargo_type'),'') IS NULL THEN v_errors := v_errors || '"Yük cinsi zorunludur"'::jsonb; END IF;
    BEGIN v_quantity := nullif(v_row->>'quantity','')::integer;
    EXCEPTION WHEN OTHERS THEN v_errors := v_errors || '"Adet tam sayı olmalıdır"'::jsonb; END;
    BEGIN v_unit_weight := nullif(v_row->>'unit_weight','')::numeric;
    EXCEPTION WHEN OTHERS THEN v_errors := v_errors || '"Birim ağırlık sayısal olmalıdır"'::jsonb; END;
    BEGIN v_unit_price := coalesce(nullif(v_row->>'unit_price','')::numeric,0);
    EXCEPTION WHEN OTHERS THEN v_errors := v_errors || '"Birim fiyat sayısal olmalıdır"'::jsonb; END;
    BEGIN v_pickup_date := nullif(v_row->>'pickup_date','')::date;
    EXCEPTION WHEN OTHERS THEN v_errors := v_errors || '"Yükleme tarihi geçersizdir"'::jsonb; END;
    BEGIN v_estimated_delivery_date := nullif(v_row->>'estimated_delivery_date','')::date;
    EXCEPTION WHEN OTHERS THEN v_errors := v_errors || '"Tahmini teslim tarihi geçersizdir"'::jsonb; END;
    IF coalesce(v_quantity,0)<=0 THEN v_errors := v_errors || '"Adet sıfırdan büyük olmalıdır"'::jsonb; END IF;
    IF coalesce(v_unit_weight,0)<=0 THEN v_errors := v_errors || '"Birim ağırlık sıfırdan büyük olmalıdır"'::jsonb; END IF;

    IF jsonb_array_length(v_errors)>0 THEN
      INSERT INTO public.integration_import_rows(batch_id,row_number,external_order_id,status,payload,validation_errors)
      VALUES(v_batch.id,v_row_number,v_external_id,'invalid',v_row,v_errors);
      v_invalid := v_invalid+1;
      CONTINUE;
    END IF;

    SELECT entity_id INTO v_existing_entity FROM public.integration_external_references
    WHERE partner_id=v_partner.id AND entity_type='shipment' AND external_id=v_external_id;
    IF FOUND THEN
      INSERT INTO public.integration_import_rows(batch_id,row_number,external_order_id,status,payload,shipment_id)
      VALUES(v_batch.id,v_row_number,v_external_id,'duplicate',v_row,v_existing_entity);
      v_duplicate := v_duplicate+1;
      CONTINUE;
    END IF;

    INSERT INTO public.integration_import_rows(batch_id,row_number,external_order_id,status,payload)
    VALUES(v_batch.id,v_row_number,v_external_id,'failed',v_row) RETURNING id INTO v_row_id;
    BEGIN
      v_shipment_id := public.rex_save_shipment_with_uetds(
        NULL,
        jsonb_build_object(
          'customer_id',p_customer_id,'sender_name',trim(v_row->>'sender_name'),
          'origin',trim(v_row->>'origin'),'receiver',trim(v_row->>'receiver'),
          'receiver_district',nullif(trim(v_row->>'receiver_district'),''),
          'destination',trim(v_row->>'destination'),'pickup_date',v_pickup_date,
          'estimated_delivery_date',v_estimated_delivery_date,
          'currency',coalesce(nullif(upper(trim(v_row->>'currency')),''),'TRY')
        ),
        jsonb_build_array(jsonb_build_object(
          'adet',v_quantity,'cinsi',trim(v_row->>'cargo_type'),'kg_ds',v_unit_weight,
          'birim_fiyat',v_unit_price,'alt_toplam_fiyat',v_quantity*v_unit_price
        )),
        '{}'::jsonb
      );
      INSERT INTO public.integration_external_references(partner_id,entity_type,external_id,entity_id,created_by)
      VALUES(v_partner.id,'shipment',v_external_id,v_shipment_id,auth.uid());
      UPDATE public.integration_import_rows SET status='imported',shipment_id=v_shipment_id,last_error=NULL
      WHERE id=v_row_id;
      INSERT INTO public.shipment_events(
        shipment_id,shipment_code,event_type,old_status,new_status,changed_fields,
        actor_id,actor_email,actor_role,source,note
      ) SELECT s.id,s.shipment_code,'integration_imported',NULL,s.status,
        jsonb_build_object('partner_id',v_partner.id,'batch_id',v_batch.id,'external_order_id',v_external_id),
        auth.uid(),v_actor_email,(SELECT role FROM public.app_user_roles WHERE user_id=auth.uid() AND active=true LIMIT 1),
        'integration',v_customer.name||' toplu gönderi dosyasından aktarıldı'
      FROM public.shipments s WHERE s.id=v_shipment_id;
      v_imported := v_imported+1;
    EXCEPTION WHEN OTHERS THEN
      UPDATE public.integration_import_rows SET status='failed',last_error=left(SQLERRM,1000) WHERE id=v_row_id;
      v_failed := v_failed+1;
    END;
  END LOOP;

  v_status := CASE
    WHEN v_imported=jsonb_array_length(p_rows) THEN 'completed'
    WHEN v_imported>0 OR v_duplicate>0 THEN 'partial'
    ELSE 'failed'
  END;
  UPDATE public.integration_import_batches SET
    status=v_status,imported_rows=v_imported,invalid_rows=v_invalid,duplicate_rows=v_duplicate,
    failed_rows=v_failed,completed_at=now()
  WHERE id=v_batch.id RETURNING * INTO v_batch;
  UPDATE public.integration_partners SET
    last_sync_at=now(),last_success_at=CASE WHEN v_imported>0 THEN now() ELSE last_success_at END,
    last_error=CASE WHEN v_failed>0 THEN v_failed||' satır aktarılamadı' ELSE NULL END,updated_at=now(),updated_by=auth.uid()
  WHERE id=v_partner.id;
  INSERT INTO public.integration_events(partner_id,batch_id,event_type,status,summary,metadata,actor_id,actor_email)
  VALUES(
    v_partner.id,v_batch.id,
    CASE WHEN v_status='completed' THEN 'import_completed' WHEN v_status='partial' THEN 'import_partial' ELSE 'import_failed' END,
    CASE WHEN v_status='completed' THEN 'success' WHEN v_status='partial' THEN 'warning' ELSE 'error' END,
    format('%s sevkiyat aktarıldı, %s geçersiz, %s mükerrer, %s başarısız',v_imported,v_invalid,v_duplicate,v_failed),
    jsonb_build_object('total',jsonb_array_length(p_rows),'imported',v_imported,'invalid',v_invalid,'duplicate',v_duplicate,'failed',v_failed),
    auth.uid(),v_actor_email
  );

  RETURN jsonb_build_object(
    'batch_id',v_batch.id,'already_processed',false,'status',v_status,
    'total',jsonb_array_length(p_rows),'imported',v_imported,'invalid',v_invalid,
    'duplicate',v_duplicate,'failed',v_failed
  );
END $$;

REVOKE ALL ON FUNCTION public.rex_import_customer_shipments(uuid,text,text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rex_import_customer_shipments(uuid,text,text,jsonb) TO authenticated;

INSERT INTO public.integration_partners(
  code,name,partner_type,channel,environment,status,settings
) VALUES (
  'KOLAYBI','KolayBi Muhasebe','accounting','api','test','draft',
  jsonb_build_object('capabilities',jsonb_build_array('customers','products','sales_invoices','purchase_invoices'))
) ON CONFLICT (code) DO NOTHING;

COMMIT;
