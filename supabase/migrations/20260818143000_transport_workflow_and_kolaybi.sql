-- Transport job approval, document-gated assignment, proof-gated delivery,
-- and KolayBi synchronization metadata.

CREATE TABLE IF NOT EXISTS public.transport_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_code text NOT NULL UNIQUE,
  job_date date NOT NULL DEFAULT current_date,
  quote_no text,
  seller text,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  supplier_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  sender_name text NOT NULL,
  sender_address text,
  sender_postal_code text,
  sender_district text,
  sender_city text,
  receiver_name text NOT NULL,
  receiver_address text,
  receiver_postal_code text,
  receiver_district text,
  receiver_city text,
  quantity integer NOT NULL CHECK (quantity > 0),
  cargo_type text NOT NULL,
  unit_weight numeric NOT NULL CHECK (unit_weight > 0),
  total_weight numeric NOT NULL CHECK (total_weight > 0),
  sales_unit_price numeric NOT NULL DEFAULT 0 CHECK (sales_unit_price >= 0),
  sales_total numeric NOT NULL DEFAULT 0 CHECK (sales_total >= 0),
  cost numeric NOT NULL DEFAULT 0 CHECK (cost >= 0),
  currency text NOT NULL DEFAULT 'TRY' CHECK (currency IN ('TRY','USD','EUR','GBP')),
  status text NOT NULL DEFAULT 'onay_bekliyor' CHECK (status IN ('onay_bekliyor','onaylandi','reddedildi')),
  shipment_id uuid UNIQUE REFERENCES public.shipments(id) ON DELETE SET NULL,
  submitted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.transport_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rex_transport_jobs_select ON public.transport_jobs;
DROP POLICY IF EXISTS rex_transport_jobs_write ON public.transport_jobs;
CREATE POLICY rex_transport_jobs_select ON public.transport_jobs FOR SELECT TO authenticated
  USING (public.rex_has_role(ARRAY['admin','operations','accounting']));
CREATE POLICY rex_transport_jobs_write ON public.transport_jobs FOR ALL TO authenticated
  USING (public.rex_has_role(ARRAY['admin','operations']))
  WITH CHECK (public.rex_has_role(ARRAY['admin','operations']));

ALTER TABLE public.shipments
  ADD COLUMN IF NOT EXISTS source_job_id uuid UNIQUE REFERENCES public.transport_jobs(id) ON DELETE SET NULL;
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS kolaybi_contact_id bigint,
  ADD COLUMN IF NOT EXISTS kolaybi_address_id bigint;
ALTER TABLE public.sales_invoices
  ADD COLUMN IF NOT EXISTS kolaybi_document_id bigint,
  ADD COLUMN IF NOT EXISTS kolaybi_status text,
  ADD COLUMN IF NOT EXISTS kolaybi_uuid text,
  ADD COLUMN IF NOT EXISTS kolaybi_invoice_no text,
  ADD COLUMN IF NOT EXISTS kolaybi_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS kolaybi_error text;

CREATE INDEX IF NOT EXISTS transport_jobs_status_idx ON public.transport_jobs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS shipments_source_job_idx ON public.shipments(source_job_id);

ALTER TABLE public.shipments DROP CONSTRAINT IF EXISTS shipments_status_check;
ALTER TABLE public.shipments ADD CONSTRAINT shipments_status_check CHECK (
  status IN ('atama_bekliyor','beklemede','hazirlaniyor','hazırlanıyor','Hazırlanıyor','Yolda','yolda','Dağıtımda','teslim_edildi','Teslim Edildi','iptal','İptal')
);

CREATE OR REPLACE FUNCTION public.rex_create_transport_job(p_job jsonb)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_id uuid; v_code text; v_qty integer; v_unit_weight numeric; v_total numeric;
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin','operations']) THEN RAISE EXCEPTION 'Bu işlem için yetkiniz bulunmuyor'; END IF;
  v_qty := coalesce(nullif(p_job->>'quantity','')::integer,0);
  v_unit_weight := coalesce(nullif(p_job->>'unit_weight','')::numeric,0);
  v_total := coalesce(nullif(p_job->>'total_weight','')::numeric,v_qty*v_unit_weight);
  IF nullif(p_job->>'customer_id','') IS NULL OR nullif(trim(p_job->>'sender_name'),'') IS NULL
     OR nullif(trim(p_job->>'receiver_name'),'') IS NULL OR nullif(trim(p_job->>'cargo_type'),'') IS NULL
     OR v_qty <= 0 OR v_unit_weight <= 0 OR v_total <= 0 THEN
    RAISE EXCEPTION 'Müşteri, gönderici, alıcı, yük cinsi, adet ve ağırlık zorunludur';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext('rex_transport_job_code'));
  SELECT 'JOB-'||lpad((coalesce(max((regexp_match(job_code,'^JOB-(\d+)$'))[1]::integer),0)+1)::text,6,'0') INTO v_code FROM public.transport_jobs;
  INSERT INTO public.transport_jobs(
    job_code,job_date,quote_no,seller,customer_id,supplier_id,sender_name,sender_address,sender_postal_code,
    sender_district,sender_city,receiver_name,receiver_address,receiver_postal_code,receiver_district,receiver_city,
    quantity,cargo_type,unit_weight,total_weight,sales_unit_price,sales_total,cost,currency
  ) VALUES (
    v_code,coalesce(nullif(p_job->>'job_date','')::date,current_date),nullif(trim(p_job->>'quote_no'),''),nullif(trim(p_job->>'seller'),''),
    (p_job->>'customer_id')::uuid,nullif(p_job->>'supplier_id','')::uuid,trim(p_job->>'sender_name'),nullif(trim(p_job->>'sender_address'),''),
    nullif(trim(p_job->>'sender_postal_code'),''),nullif(trim(p_job->>'sender_district'),''),nullif(trim(p_job->>'sender_city'),''),
    trim(p_job->>'receiver_name'),nullif(trim(p_job->>'receiver_address'),''),nullif(trim(p_job->>'receiver_postal_code'),''),
    nullif(trim(p_job->>'receiver_district'),''),nullif(trim(p_job->>'receiver_city'),''),v_qty,trim(p_job->>'cargo_type'),
    v_unit_weight,v_total,coalesce(nullif(p_job->>'sales_unit_price','')::numeric,0),coalesce(nullif(p_job->>'sales_total','')::numeric,0),
    coalesce(nullif(p_job->>'cost','')::numeric,0),coalesce(nullif(p_job->>'currency',''),'TRY')
  ) RETURNING id INTO v_id;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.rex_review_transport_job(p_job_id uuid,p_decision text,p_reason text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_job public.transport_jobs%ROWTYPE; v_shipment uuid; v_code text;
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin','operations']) THEN RAISE EXCEPTION 'Bu işlem için yetkiniz bulunmuyor'; END IF;
  IF p_decision NOT IN ('onayla','reddet') THEN RAISE EXCEPTION 'Geçersiz onay kararı'; END IF;
  SELECT * INTO v_job FROM public.transport_jobs WHERE id=p_job_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'İş kaydı bulunamadı'; END IF;
  IF v_job.status <> 'onay_bekliyor' THEN RAISE EXCEPTION 'Bu iş kaydı daha önce sonuçlandırılmış'; END IF;
  IF p_decision='reddet' THEN
    IF nullif(trim(p_reason),'') IS NULL THEN RAISE EXCEPTION 'Ret nedeni zorunludur'; END IF;
    UPDATE public.transport_jobs SET status='reddedildi',rejection_reason=trim(p_reason),approved_by=auth.uid(),approved_at=now(),updated_at=now() WHERE id=p_job_id;
    RETURN NULL;
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext('rex_shipment_code'));
  SELECT 'SHP-'||lpad((coalesce(max((regexp_match(shipment_code,'^SHP-(\d+)$'))[1]::integer),0)+1)::text,6,'0') INTO v_code FROM public.shipments;
  INSERT INTO public.shipments(
    shipment_code,source_job_id,customer_id,supplier_id,origin,destination,pickup_date,cost,cost_currency,currency,status,
    sender_name,sender_ii,receiver,receiver_district,receiver_ii,adet,cinsi,kg_ds,toplam_kg_ds,satis_birim,satis_tutar,invoice_status
  ) VALUES (
    v_code,v_job.id,v_job.customer_id,v_job.supplier_id,coalesce(v_job.sender_city,v_job.sender_address,'Belirtilmedi'),
    coalesce(v_job.receiver_city,v_job.receiver_address,'Belirtilmedi'),v_job.job_date,v_job.cost,v_job.currency,v_job.currency,'atama_bekliyor',
    v_job.sender_name,v_job.sender_city,v_job.receiver_name,v_job.receiver_district,v_job.receiver_city,v_job.quantity,v_job.cargo_type,
    v_job.unit_weight,v_job.total_weight,v_job.sales_unit_price,v_job.sales_total,'beklemede'
  ) RETURNING id INTO v_shipment;
  INSERT INTO public.shipment_cargo_items(shipment_id,adet,cinsi,kg_ds,sira_no,birim_fiyat,alt_toplam_fiyat,alt_toplam)
  VALUES(v_shipment,v_job.quantity,v_job.cargo_type,v_job.unit_weight,1,v_job.sales_unit_price,v_job.sales_total,v_job.total_weight);
  UPDATE public.transport_jobs SET status='onaylandi',shipment_id=v_shipment,approved_by=auth.uid(),approved_at=now(),updated_at=now() WHERE id=p_job_id;
  RETURN v_shipment;
END $$;

CREATE OR REPLACE FUNCTION public.rex_validate_assignment(p_driver_id uuid,p_vehicle_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_driver record; v_vehicle record;
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin','operations']) THEN RAISE EXCEPTION 'Bu işlem için yetkiniz bulunmuyor'; END IF;
  IF p_driver_id IS NULL OR p_vehicle_id IS NULL THEN RAISE EXCEPTION 'Sürücü ve araç birlikte atanmalıdır'; END IF;
  SELECT status,ehliyet_dosyasi_url,ehliyet_gecerlilik_tarihi INTO v_driver FROM public.drivers WHERE id=p_driver_id;
  IF NOT FOUND OR lower(coalesce(v_driver.status,'')) <> lower('Aktif') THEN RAISE EXCEPTION 'Aktif sürücü bulunamadı'; END IF;
  IF nullif(trim(v_driver.ehliyet_dosyasi_url),'') IS NULL THEN RAISE EXCEPTION 'Sürücü ehliyet belgesi yüklenmeden atama yapılamaz'; END IF;
  IF v_driver.ehliyet_gecerlilik_tarihi IS NULL OR v_driver.ehliyet_gecerlilik_tarihi < current_date THEN RAISE EXCEPTION 'Sürücü ehliyeti geçerli olmalıdır'; END IF;
  SELECT status,ruhsat_dosyasi_url INTO v_vehicle FROM public.vehicles WHERE id=p_vehicle_id;
  IF NOT FOUND OR lower(coalesce(v_vehicle.status,'')) <> lower('Aktif') THEN RAISE EXCEPTION 'Aktif araç bulunamadı'; END IF;
  IF nullif(trim(v_vehicle.ruhsat_dosyasi_url),'') IS NULL THEN RAISE EXCEPTION 'Araç ruhsatı yüklenmeden atama yapılamaz'; END IF;
END $$;

-- Replace only the validation/state sections of the existing save workflow.
CREATE OR REPLACE FUNCTION public.rex_save_shipment(p_shipment_id uuid,p_shipment jsonb,p_cargo_items jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_id uuid; v_code text; v_item jsonb; v_total_units integer:=0; v_total_weight numeric:=0; v_total_price numeric:=0; v_first_kind text; v_driver uuid; v_vehicle uuid;
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin','operations']) THEN RAISE EXCEPTION 'Bu işlem için yetkiniz bulunmuyor'; END IF;
  IF nullif(p_shipment->>'customer_id','') IS NULL OR nullif(trim(p_shipment->>'origin'),'') IS NULL OR nullif(trim(p_shipment->>'destination'),'') IS NULL OR nullif(p_shipment->>'pickup_date','') IS NULL THEN
    RAISE EXCEPTION 'Müşteri, çıkış, varış ve yükleme tarihi zorunludur';
  END IF;
  v_driver:=nullif(p_shipment->>'driver_id','')::uuid; v_vehicle:=nullif(p_shipment->>'vehicle_id','')::uuid;
  IF (v_driver IS NULL) <> (v_vehicle IS NULL) THEN RAISE EXCEPTION 'Sürücü ve araç birlikte seçilmelidir'; END IF;
  IF v_driver IS NOT NULL THEN PERFORM public.rex_validate_assignment(v_driver,v_vehicle); END IF;
  IF jsonb_typeof(p_cargo_items) IS DISTINCT FROM 'array' OR jsonb_array_length(p_cargo_items)=0 THEN RAISE EXCEPTION 'En az bir yük kalemi gereklidir'; END IF;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_cargo_items) LOOP
    IF coalesce((v_item->>'adet')::integer,0)<=0 OR coalesce((v_item->>'kg_ds')::numeric,0)<=0 OR nullif(trim(v_item->>'cinsi'),'') IS NULL THEN RAISE EXCEPTION 'Yük kalemlerinde adet, cins ve kg/desi zorunludur'; END IF;
    v_total_units:=v_total_units+(v_item->>'adet')::integer; v_total_weight:=v_total_weight+(v_item->>'adet')::numeric*(v_item->>'kg_ds')::numeric;
    v_total_price:=v_total_price+coalesce((v_item->>'alt_toplam_fiyat')::numeric,0); IF v_first_kind IS NULL THEN v_first_kind:=trim(v_item->>'cinsi'); END IF;
  END LOOP;
  IF p_shipment_id IS NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext('rex_shipment_code'));
    SELECT 'SHP-'||lpad((coalesce(max((regexp_match(shipment_code,'^SHP-(\d+)$'))[1]::integer),0)+1)::text,6,'0') INTO v_code FROM public.shipments;
    INSERT INTO public.shipments(shipment_code,supplier_id,driver_id,vehicle_id,customer_id,origin,destination,pickup_date,estimated_delivery_date,cost,cost_currency,currency,status,sender_name,sender_ii,receiver,receiver_district,receiver_ii,adet,cinsi,kg_ds,toplam_kg_ds,satis_tutar,invoice_status)
    VALUES(v_code,nullif(p_shipment->>'supplier_id','')::uuid,v_driver,v_vehicle,(p_shipment->>'customer_id')::uuid,trim(p_shipment->>'origin'),trim(p_shipment->>'destination'),(p_shipment->>'pickup_date')::date,nullif(p_shipment->>'estimated_delivery_date','')::date,nullif(p_shipment->>'cost','')::numeric,coalesce(nullif(p_shipment->>'cost_currency',''),'TRY'),coalesce(nullif(p_shipment->>'currency',''),'TRY'),CASE WHEN v_driver IS NULL THEN 'atama_bekliyor' ELSE 'beklemede' END,nullif(trim(p_shipment->>'sender_name'),''),nullif(trim(p_shipment->>'sender_ii'),''),nullif(trim(p_shipment->>'receiver'),''),nullif(trim(p_shipment->>'receiver_district'),''),nullif(trim(p_shipment->>'receiver_ii'),''),v_total_units,v_first_kind,v_total_weight/v_total_units,v_total_weight,v_total_price,'beklemede') RETURNING id INTO v_id;
  ELSE
    SELECT shipment_code INTO v_code FROM public.shipments WHERE id=p_shipment_id FOR UPDATE; IF NOT FOUND THEN RAISE EXCEPTION 'Sevkiyat bulunamadı'; END IF;
    UPDATE public.shipments SET supplier_id=nullif(p_shipment->>'supplier_id','')::uuid,driver_id=v_driver,vehicle_id=v_vehicle,customer_id=(p_shipment->>'customer_id')::uuid,origin=trim(p_shipment->>'origin'),destination=trim(p_shipment->>'destination'),pickup_date=(p_shipment->>'pickup_date')::date,estimated_delivery_date=nullif(p_shipment->>'estimated_delivery_date','')::date,cost=nullif(p_shipment->>'cost','')::numeric,cost_currency=coalesce(nullif(p_shipment->>'cost_currency',''),'TRY'),currency=coalesce(nullif(p_shipment->>'currency',''),'TRY'),status=CASE WHEN status IN ('atama_bekliyor','beklemede') THEN CASE WHEN v_driver IS NULL THEN 'atama_bekliyor' ELSE 'beklemede' END ELSE status END,sender_name=nullif(trim(p_shipment->>'sender_name'),''),sender_ii=nullif(trim(p_shipment->>'sender_ii'),''),receiver=nullif(trim(p_shipment->>'receiver'),''),receiver_district=nullif(trim(p_shipment->>'receiver_district'),''),receiver_ii=nullif(trim(p_shipment->>'receiver_ii'),''),adet=v_total_units,cinsi=v_first_kind,kg_ds=v_total_weight/v_total_units,toplam_kg_ds=v_total_weight,satis_tutar=v_total_price,updated_at=now() WHERE id=p_shipment_id;
    v_id:=p_shipment_id; DELETE FROM public.shipment_cargo_items WHERE shipment_id=v_id;
  END IF;
  INSERT INTO public.shipment_cargo_items(shipment_id,adet,cinsi,kg_ds,sira_no,birim_fiyat,alt_toplam_fiyat,alt_toplam)
  SELECT v_id,(item->>'adet')::integer,trim(item->>'cinsi'),(item->>'kg_ds')::numeric,(row_number() over())::integer,coalesce((item->>'birim_fiyat')::numeric,0),coalesce((item->>'alt_toplam_fiyat')::numeric,0),(item->>'adet')::numeric*(item->>'kg_ds')::numeric FROM jsonb_array_elements(p_cargo_items) item;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.rex_set_shipment_status(p_shipment_id uuid,p_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_current text; v_driver uuid; v_vehicle uuid;
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin','operations']) THEN RAISE EXCEPTION 'Bu işlem için yetkiniz bulunmuyor'; END IF;
  IF p_status NOT IN ('hazirlaniyor','yolda','iptal') THEN RAISE EXCEPTION 'Geçersiz sevkiyat durumu'; END IF;
  SELECT status,driver_id,vehicle_id INTO v_current,v_driver,v_vehicle FROM public.shipments WHERE id=p_shipment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sevkiyat bulunamadı'; END IF;
  IF v_current IN ('teslim_edildi','Teslim Edildi','iptal','İptal') THEN RAISE EXCEPTION 'Tamamlanmış sevkiyatın durumu değiştirilemez'; END IF;
  IF p_status IN ('hazirlaniyor','yolda') THEN PERFORM public.rex_validate_assignment(v_driver,v_vehicle); END IF;
  IF p_status='yolda' AND v_current NOT IN ('beklemede','hazirlaniyor','hazırlanıyor','Hazırlanıyor') THEN RAISE EXCEPTION 'Sevkiyat yola çıkarılamaz'; END IF;
  UPDATE public.shipments SET status=p_status,updated_at=now() WHERE id=p_shipment_id;
END $$;

CREATE OR REPLACE FUNCTION public.rex_mark_shipment_delivered(p_shipment_id uuid,p_delivered_to text,p_delivery_date date,p_delivery_proof_url text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_status text;
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin','operations']) THEN RAISE EXCEPTION 'Bu işlem için yetkiniz bulunmuyor'; END IF;
  IF nullif(trim(p_delivered_to),'') IS NULL OR p_delivery_date IS NULL OR nullif(trim(p_delivery_proof_url),'') IS NULL THEN RAISE EXCEPTION 'Teslim alan, teslim tarihi ve teslim evrakı zorunludur'; END IF;
  SELECT status INTO v_status FROM public.shipments WHERE id=p_shipment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sevkiyat bulunamadı'; END IF;
  IF v_status <> 'yolda' AND v_status <> 'Yolda' THEN RAISE EXCEPTION 'Yalnızca yoldaki sevkiyat teslim edilebilir'; END IF;
  UPDATE public.shipments SET status='teslim_edildi',delivered_to=trim(p_delivered_to),delivery_date=p_delivery_date,actual_delivery_date=p_delivery_date::timestamp AT TIME ZONE 'Europe/Istanbul',delivery_proof_url=p_delivery_proof_url,invoice_status='beklemede',updated_at=now() WHERE id=p_shipment_id;
END $$;

REVOKE ALL ON FUNCTION public.rex_create_transport_job(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rex_review_transport_job(uuid,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rex_validate_assignment(uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rex_create_transport_job(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_review_transport_job(uuid,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_validate_assignment(uuid,uuid) TO authenticated;
