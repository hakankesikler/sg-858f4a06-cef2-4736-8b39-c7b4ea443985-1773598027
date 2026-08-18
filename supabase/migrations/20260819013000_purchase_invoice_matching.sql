-- Incoming purchase invoice inbox, controlled shipment matching and immutable audit trail.

CREATE TABLE IF NOT EXISTS public.supplier_invoice_issuers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operational_supplier_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  issuer_name text NOT NULL,
  issuer_tax_id text NOT NULL,
  relationship_reason text NOT NULL,
  valid_from date NOT NULL DEFAULT current_date,
  valid_until date,
  active boolean NOT NULL DEFAULT true,
  approved_at timestamptz,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT supplier_invoice_issuers_tax_id_check CHECK (length(regexp_replace(issuer_tax_id,'\D','','g')) BETWEEN 10 AND 11),
  CONSTRAINT supplier_invoice_issuers_reason_check CHECK (length(trim(relationship_reason)) >= 10),
  CONSTRAINT supplier_invoice_issuers_dates_check CHECK (valid_until IS NULL OR valid_until >= valid_from)
);
CREATE UNIQUE INDEX IF NOT EXISTS supplier_invoice_issuers_active_unique
  ON public.supplier_invoice_issuers(operational_supplier_id, regexp_replace(issuer_tax_id,'\D','','g'))
  WHERE active=true;

CREATE TABLE IF NOT EXISTS public.incoming_purchase_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  provider_document_id text,
  official_uuid text,
  document_type text NOT NULL,
  invoice_no text NOT NULL,
  invoice_date date NOT NULL,
  due_date date,
  issuer_name text NOT NULL,
  issuer_tax_id text NOT NULL,
  issuer_tax_office text,
  currency text NOT NULL DEFAULT 'TRY',
  net_total numeric(18,2) NOT NULL DEFAULT 0,
  vat_total numeric(18,2) NOT NULL DEFAULT 0,
  withholding_total numeric(18,2) NOT NULL DEFAULT 0,
  grand_total numeric(18,2) NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'review_required',
  operational_supplier_id uuid REFERENCES public.customers(id) ON DELETE RESTRICT,
  file_path text,
  file_hash text,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  legacy_purchase_id uuid REFERENCES public.purchases(id) ON DELETE RESTRICT,
  imported_at timestamptz,
  matched_at timestamptz,
  matched_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT incoming_purchase_invoices_source_check CHECK (source IN ('kolaybi','manual')),
  CONSTRAINT incoming_purchase_invoices_type_check CHECK (document_type IN ('e_invoice','e_archive')),
  CONSTRAINT incoming_purchase_invoices_currency_check CHECK (currency IN ('TRY','USD','EUR','GBP')),
  CONSTRAINT incoming_purchase_invoices_amount_check CHECK (grand_total > 0 AND net_total >= 0 AND vat_total >= 0 AND withholding_total >= 0),
  CONSTRAINT incoming_purchase_invoices_tax_id_check CHECK (length(regexp_replace(issuer_tax_id,'\D','','g')) BETWEEN 10 AND 11),
  CONSTRAINT incoming_purchase_invoices_status_check CHECK (status IN (
    'review_required','match_proposed','approval_pending','matched','approved',
    'payment_pending','paid','disputed','rejected','duplicate','cancelled'
  ))
);
CREATE UNIQUE INDEX IF NOT EXISTS incoming_purchase_invoices_provider_unique
  ON public.incoming_purchase_invoices(source,provider_document_id) WHERE provider_document_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS incoming_purchase_invoices_uuid_unique
  ON public.incoming_purchase_invoices(official_uuid) WHERE official_uuid IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS incoming_purchase_invoices_legal_unique
  ON public.incoming_purchase_invoices(regexp_replace(issuer_tax_id,'\D','','g'),upper(invoice_no));
CREATE UNIQUE INDEX IF NOT EXISTS incoming_purchase_invoices_hash_unique
  ON public.incoming_purchase_invoices(file_hash) WHERE file_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS incoming_purchase_invoices_status_idx
  ON public.incoming_purchase_invoices(status,invoice_date DESC);

CREATE TABLE IF NOT EXISTS public.purchase_invoice_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.incoming_purchase_invoices(id) ON DELETE RESTRICT,
  shipment_id uuid NOT NULL REFERENCES public.shipments(id) ON DELETE RESTRICT,
  amount numeric(18,2) NOT NULL CHECK (amount > 0),
  revision_no integer NOT NULL DEFAULT 1 CHECK (revision_no > 0),
  active boolean NOT NULL DEFAULT true,
  match_score integer CHECK (match_score IS NULL OR match_score BETWEEN 0 AND 100),
  match_reasons text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  voided_at timestamptz,
  voided_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  void_reason text
);
CREATE UNIQUE INDEX IF NOT EXISTS purchase_invoice_allocations_active_unique
  ON public.purchase_invoice_allocations(invoice_id,shipment_id) WHERE active=true;
CREATE INDEX IF NOT EXISTS purchase_invoice_allocations_shipment_idx
  ON public.purchase_invoice_allocations(shipment_id) WHERE active=true;

CREATE TABLE IF NOT EXISTS public.purchase_invoice_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  invoice_id uuid NOT NULL REFERENCES public.incoming_purchase_invoices(id) ON DELETE RESTRICT,
  event_type text NOT NULL,
  old_status text,
  new_status text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS purchase_invoice_events_invoice_idx
  ON public.purchase_invoice_events(invoice_id,created_at DESC);

ALTER TABLE public.supplier_invoice_issuers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incoming_purchase_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_invoice_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_invoice_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rex_supplier_invoice_issuers_select ON public.supplier_invoice_issuers;
CREATE POLICY rex_supplier_invoice_issuers_select ON public.supplier_invoice_issuers
  FOR SELECT TO authenticated USING (public.rex_has_role(ARRAY['admin','accounting','operations']));
DROP POLICY IF EXISTS rex_purchase_invoices_select ON public.incoming_purchase_invoices;
CREATE POLICY rex_purchase_invoices_select ON public.incoming_purchase_invoices
  FOR SELECT TO authenticated USING (public.rex_has_role(ARRAY['admin','accounting','operations']));
DROP POLICY IF EXISTS rex_purchase_allocations_select ON public.purchase_invoice_allocations;
CREATE POLICY rex_purchase_allocations_select ON public.purchase_invoice_allocations
  FOR SELECT TO authenticated USING (public.rex_has_role(ARRAY['admin','accounting','operations']));
DROP POLICY IF EXISTS rex_purchase_events_select ON public.purchase_invoice_events;
CREATE POLICY rex_purchase_events_select ON public.purchase_invoice_events
  FOR SELECT TO authenticated USING (public.rex_has_role(ARRAY['admin','accounting']));

REVOKE INSERT,UPDATE,DELETE ON public.supplier_invoice_issuers FROM authenticated;
REVOKE INSERT,UPDATE,DELETE ON public.incoming_purchase_invoices FROM authenticated;
REVOKE INSERT,UPDATE,DELETE ON public.purchase_invoice_allocations FROM authenticated;
REVOKE INSERT,UPDATE,DELETE ON public.purchase_invoice_events FROM authenticated;

CREATE OR REPLACE FUNCTION public.rex_purchase_invoice_events_append_only()
RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
  RAISE EXCEPTION 'Alış faturası işlem geçmişi değiştirilemez veya silinemez';
END $$;
DROP TRIGGER IF EXISTS rex_purchase_invoice_events_append_only ON public.purchase_invoice_events;
CREATE TRIGGER rex_purchase_invoice_events_append_only
  BEFORE UPDATE OR DELETE ON public.purchase_invoice_events
  FOR EACH ROW EXECUTE FUNCTION public.rex_purchase_invoice_events_append_only();

CREATE OR REPLACE FUNCTION public.rex_record_purchase_invoice_event(
  p_invoice_id uuid,p_event_type text,p_old_status text,p_new_status text,p_details jsonb DEFAULT '{}'::jsonb
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  INSERT INTO public.purchase_invoice_events(invoice_id,event_type,old_status,new_status,details,actor_id,actor_email)
  VALUES(p_invoice_id,p_event_type,p_old_status,p_new_status,coalesce(p_details,'{}'::jsonb),auth.uid(),coalesce(auth.jwt()->>'email','system'));
END $$;

CREATE OR REPLACE FUNCTION public.rex_create_manual_purchase_invoice(
  p_invoice_no text,p_invoice_date date,p_due_date date,p_document_type text,
  p_issuer_name text,p_issuer_tax_id text,p_currency text,p_net_total numeric,
  p_vat_total numeric,p_withholding_total numeric,p_grand_total numeric,
  p_description text,p_file_path text,p_file_hash text,p_operational_supplier_id uuid DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_id uuid; v_tax text:=regexp_replace(coalesce(p_issuer_tax_id,''),'\D','','g');
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin','accounting']) THEN RAISE EXCEPTION 'Alış faturası kaydetme yetkiniz yok'; END IF;
  IF nullif(trim(p_invoice_no),'') IS NULL OR p_invoice_date IS NULL OR nullif(trim(p_issuer_name),'') IS NULL THEN
    RAISE EXCEPTION 'Fatura numarası, tarihi ve düzenleyen bilgisi zorunludur';
  END IF;
  IF length(v_tax) NOT BETWEEN 10 AND 11 THEN RAISE EXCEPTION 'Geçerli VKN veya TCKN girilmelidir'; END IF;
  IF p_document_type NOT IN ('e_invoice','e_archive') THEN RAISE EXCEPTION 'Geçersiz belge türü'; END IF;
  IF p_currency NOT IN ('TRY','USD','EUR','GBP') OR coalesce(p_grand_total,0)<=0 THEN RAISE EXCEPTION 'Para birimi veya tutar geçersiz'; END IF;
  IF nullif(trim(p_file_path),'') IS NULL OR nullif(trim(p_file_hash),'') IS NULL THEN RAISE EXCEPTION 'Fatura PDF/XML belgesi zorunludur'; END IF;
  IF p_operational_supplier_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.customers WHERE id=p_operational_supplier_id) THEN RAISE EXCEPTION 'Tedarikçi bulunamadı'; END IF;
  INSERT INTO public.incoming_purchase_invoices(
    source,document_type,invoice_no,invoice_date,due_date,issuer_name,issuer_tax_id,currency,
    net_total,vat_total,withholding_total,grand_total,description,status,operational_supplier_id,
    file_path,file_hash,created_by
  ) VALUES(
    'manual',p_document_type,upper(trim(p_invoice_no)),p_invoice_date,p_due_date,trim(p_issuer_name),v_tax,p_currency,
    coalesce(p_net_total,0),coalesce(p_vat_total,0),coalesce(p_withholding_total,0),p_grand_total,
    nullif(trim(p_description),''),'review_required',p_operational_supplier_id,trim(p_file_path),trim(p_file_hash),auth.uid()
  ) RETURNING id INTO v_id;
  PERFORM public.rex_record_purchase_invoice_event(v_id,'manual_uploaded',NULL,'review_required',jsonb_build_object('file_path',p_file_path));
  RETURN v_id;
EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION 'Bu fatura daha önce kaydedilmiş görünüyor';
END $$;

CREATE OR REPLACE FUNCTION public.rex_import_kolaybi_purchase_invoice(p_invoice jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_id uuid; v_existing uuid; v_tax text; v_document_id text; v_uuid text;
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin','accounting']) THEN RAISE EXCEPTION 'KolayBi alış faturası aktarma yetkiniz yok'; END IF;
  v_document_id:=nullif(trim(p_invoice->>'provider_document_id'),'');
  v_uuid:=nullif(trim(p_invoice->>'official_uuid'),'');
  v_tax:=regexp_replace(coalesce(p_invoice->>'issuer_tax_id',''),'\D','','g');
  SELECT id INTO v_existing FROM public.incoming_purchase_invoices
   WHERE (v_document_id IS NOT NULL AND source='kolaybi' AND provider_document_id=v_document_id)
      OR (v_uuid IS NOT NULL AND official_uuid=v_uuid) LIMIT 1;
  IF v_existing IS NOT NULL THEN RETURN jsonb_build_object('id',v_existing,'created',false); END IF;
  INSERT INTO public.incoming_purchase_invoices(
    source,provider_document_id,official_uuid,document_type,invoice_no,invoice_date,due_date,
    issuer_name,issuer_tax_id,issuer_tax_office,currency,net_total,vat_total,withholding_total,
    grand_total,description,status,raw_payload,imported_at,created_by
  ) VALUES(
    'kolaybi',v_document_id,v_uuid,coalesce(nullif(p_invoice->>'document_type',''),'e_invoice'),
    upper(trim(p_invoice->>'invoice_no')),(p_invoice->>'invoice_date')::date,nullif(p_invoice->>'due_date','')::date,
    trim(p_invoice->>'issuer_name'),v_tax,nullif(trim(p_invoice->>'issuer_tax_office'),''),
    upper(coalesce(nullif(p_invoice->>'currency',''),'TRY')),coalesce((p_invoice->>'net_total')::numeric,0),
    coalesce((p_invoice->>'vat_total')::numeric,0),coalesce((p_invoice->>'withholding_total')::numeric,0),
    (p_invoice->>'grand_total')::numeric,nullif(trim(p_invoice->>'description'),''),'review_required',p_invoice,now(),auth.uid()
  ) RETURNING id INTO v_id;
  PERFORM public.rex_record_purchase_invoice_event(v_id,'kolaybi_imported',NULL,'review_required',jsonb_build_object('provider_document_id',v_document_id));
  RETURN jsonb_build_object('id',v_id,'created',true);
EXCEPTION WHEN unique_violation THEN
  RETURN jsonb_build_object('created',false,'duplicate',true);
END $$;

CREATE OR REPLACE FUNCTION public.rex_purchase_invoice_candidates(p_invoice_id uuid)
RETURNS TABLE(
  shipment_id uuid,shipment_code text,supplier_id uuid,supplier_name text,origin text,destination text,
  pickup_date date,shipment_status text,expected_cost numeric,cost_currency text,score integer,reasons text[]
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
  WITH inv AS (
    SELECT * FROM public.incoming_purchase_invoices WHERE id=p_invoice_id
  ), scored AS (
    SELECT s.id,s.shipment_code,s.supplier_id,coalesce(c.company,c.name) supplier_name,s.origin,s.destination,
      s.pickup_date,s.status,s.cost,s.cost_currency,
      least(100,
        CASE WHEN s.supplier_id=i.operational_supplier_id THEN 35 ELSE 0 END +
        CASE WHEN EXISTS(SELECT 1 FROM public.customers direct_supplier WHERE direct_supplier.id=s.supplier_id AND regexp_replace(coalesce(direct_supplier.vergi_no,direct_supplier.tc_no,''),'\D','','g')=regexp_replace(i.issuer_tax_id,'\D','','g'))
               OR EXISTS(SELECT 1 FROM public.supplier_invoice_issuers m WHERE m.operational_supplier_id=s.supplier_id AND regexp_replace(m.issuer_tax_id,'\D','','g')=regexp_replace(i.issuer_tax_id,'\D','','g') AND m.active AND m.approved_at IS NOT NULL AND (m.valid_until IS NULL OR m.valid_until>=i.invoice_date)) THEN 30 ELSE 0 END +
        CASE WHEN s.cost_currency=i.currency AND abs(coalesce(s.cost,0)-i.grand_total)<=greatest(i.grand_total*0.05,1) THEN 25 ELSE 0 END +
        CASE WHEN abs(s.pickup_date-i.invoice_date)<=15 THEN 10 ELSE 0 END +
        CASE WHEN coalesce(i.description,'') ILIKE '%'||s.shipment_code||'%' THEN 30 ELSE 0 END
      )::integer score,
      array_remove(ARRAY[
        CASE WHEN s.supplier_id=i.operational_supplier_id THEN 'Kayıtlı nakliyeci aynı' END,
        CASE WHEN EXISTS(SELECT 1 FROM public.customers direct_supplier WHERE direct_supplier.id=s.supplier_id AND regexp_replace(coalesce(direct_supplier.vergi_no,direct_supplier.tc_no,''),'\D','','g')=regexp_replace(i.issuer_tax_id,'\D','','g')) THEN 'Fatura VKN/TCKN bilgisi nakliyeciyle aynı'
             WHEN EXISTS(SELECT 1 FROM public.supplier_invoice_issuers m WHERE m.operational_supplier_id=s.supplier_id AND regexp_replace(m.issuer_tax_id,'\D','','g')=regexp_replace(i.issuer_tax_id,'\D','','g') AND m.active AND m.approved_at IS NOT NULL) THEN 'Onaylı fatura düzenleyicisi bağlantısı' END,
        CASE WHEN s.cost_currency=i.currency AND abs(coalesce(s.cost,0)-i.grand_total)<=greatest(i.grand_total*0.05,1) THEN 'Tutar beklenen maliyetle uyumlu' END,
        CASE WHEN abs(s.pickup_date-i.invoice_date)<=15 THEN 'Tarihler yakın' END,
        CASE WHEN coalesce(i.description,'') ILIKE '%'||s.shipment_code||'%' THEN 'Açıklamada sevkiyat kodu var' END
      ],NULL) reasons
    FROM inv i JOIN public.shipments s ON s.status NOT IN ('iptal','İptal')
    LEFT JOIN public.customers c ON c.id=s.supplier_id
    WHERE s.pickup_date BETWEEN i.invoice_date-interval '60 days' AND i.invoice_date+interval '15 days'
  )
  SELECT id,shipment_code,supplier_id,supplier_name,origin,destination,pickup_date,status,cost,cost_currency,score,reasons
  FROM scored WHERE score>0 ORDER BY score DESC,pickup_date DESC LIMIT 20;
$$;

CREATE OR REPLACE FUNCTION public.rex_match_purchase_invoice(
  p_invoice_id uuid,p_allocations jsonb,p_general_expense numeric,p_checked boolean,p_reason text DEFAULT NULL
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_invoice public.incoming_purchase_invoices%ROWTYPE; v_item jsonb; v_sum numeric:=0; v_supplier uuid; v_mismatch boolean:=false; v_count integer:=0; v_status text; v_relation boolean;
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin','accounting']) THEN RAISE EXCEPTION 'Alış faturası eşleştirme yetkiniz yok'; END IF;
  IF p_checked IS DISTINCT FROM true THEN RAISE EXCEPTION 'Fatura ve iş bilgileri kontrol edildi onayı zorunludur'; END IF;
  SELECT * INTO v_invoice FROM public.incoming_purchase_invoices WHERE id=p_invoice_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Fatura bulunamadı'; END IF;
  IF v_invoice.status NOT IN ('review_required','match_proposed','approval_pending') THEN RAISE EXCEPTION 'Bu faturanın eşleştirmesi değiştirilemez'; END IF;
  IF jsonb_typeof(p_allocations) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Sevkiyat dağılımı geçersiz'; END IF;
  IF coalesce(p_general_expense,0)<0 THEN RAISE EXCEPTION 'Genel gider negatif olamaz'; END IF;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_allocations) LOOP
    IF coalesce((v_item->>'amount')::numeric,0)<=0 THEN RAISE EXCEPTION 'Dağıtım tutarı sıfırdan büyük olmalıdır'; END IF;
    SELECT supplier_id INTO v_supplier FROM public.shipments WHERE id=(v_item->>'shipment_id')::uuid;
    IF NOT FOUND THEN RAISE EXCEPTION 'Sevkiyat bulunamadı'; END IF;
    IF v_invoice.operational_supplier_id IS NULL THEN
      UPDATE public.incoming_purchase_invoices SET operational_supplier_id=v_supplier WHERE id=p_invoice_id;
      v_invoice.operational_supplier_id:=v_supplier;
    ELSIF v_supplier IS DISTINCT FROM v_invoice.operational_supplier_id THEN v_mismatch:=true; END IF;
    v_sum:=v_sum+(v_item->>'amount')::numeric; v_count:=v_count+1;
  END LOOP;
  IF abs(v_sum+coalesce(p_general_expense,0)-v_invoice.grand_total)>0.01 THEN RAISE EXCEPTION 'Sevkiyat dağılımı ve genel gider toplamı fatura toplamına eşit olmalıdır'; END IF;
  IF v_count=0 AND coalesce(p_general_expense,0)<=0 THEN RAISE EXCEPTION 'En az bir sevkiyat veya genel gider seçilmelidir'; END IF;
  SELECT EXISTS(SELECT 1 FROM public.customers c WHERE c.id=v_invoice.operational_supplier_id AND regexp_replace(coalesce(c.vergi_no,c.tc_no,''),'\D','','g')=regexp_replace(v_invoice.issuer_tax_id,'\D','','g'))
    OR EXISTS(SELECT 1 FROM public.supplier_invoice_issuers m WHERE m.operational_supplier_id=v_invoice.operational_supplier_id AND regexp_replace(m.issuer_tax_id,'\D','','g')=regexp_replace(v_invoice.issuer_tax_id,'\D','','g') AND m.active AND m.approved_at IS NOT NULL AND (m.valid_until IS NULL OR m.valid_until>=v_invoice.invoice_date)) INTO v_relation;
  v_status:=CASE WHEN v_mismatch OR NOT v_relation OR v_count>1 OR EXISTS(
    SELECT 1 FROM jsonb_array_elements(p_allocations) x JOIN public.shipments s ON s.id=(x->>'shipment_id')::uuid
    WHERE (x->>'amount')::numeric>coalesce(s.cost,0)+0.01
  ) THEN 'approval_pending' ELSE 'matched' END;
  INSERT INTO public.purchase_invoice_allocations(invoice_id,shipment_id,amount,match_score,match_reasons,created_by)
  SELECT p_invoice_id,(x->>'shipment_id')::uuid,(x->>'amount')::numeric,nullif(x->>'score','')::integer,
    coalesce(ARRAY(SELECT jsonb_array_elements_text(coalesce(x->'reasons','[]'::jsonb))),'{}'),auth.uid()
  FROM jsonb_array_elements(p_allocations) x;
  UPDATE public.incoming_purchase_invoices SET status=v_status,matched_at=now(),matched_by=auth.uid(),updated_at=now(),
    raw_payload=raw_payload||jsonb_build_object('general_expense',coalesce(p_general_expense,0),'match_reason',nullif(trim(p_reason),'')) WHERE id=p_invoice_id;
  PERFORM public.rex_record_purchase_invoice_event(p_invoice_id,'matched',v_invoice.status,v_status,jsonb_build_object('allocations',p_allocations,'general_expense',coalesce(p_general_expense,0),'reason',p_reason));
  RETURN v_status;
END $$;

CREATE OR REPLACE FUNCTION public.rex_approve_purchase_invoice(p_invoice_id uuid,p_confirmation boolean,p_note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_invoice public.incoming_purchase_invoices%ROWTYPE; v_email text:=lower(coalesce(auth.jwt()->>'email','')); v_count integer; v_shipment uuid; v_purchase uuid;
BEGIN
  IF p_confirmation IS DISTINCT FROM true THEN RAISE EXCEPTION 'Yönetici onayı kutusu işaretlenmelidir'; END IF;
  IF v_email<>'info@rexlojistik.com' OR NOT public.rex_has_role(ARRAY['admin']) THEN RAISE EXCEPTION 'Bu işlem yalnızca şirket sahibi hesabından onaylanabilir'; END IF;
  SELECT * INTO v_invoice FROM public.incoming_purchase_invoices WHERE id=p_invoice_id FOR UPDATE;
  IF NOT FOUND OR v_invoice.status NOT IN ('matched','approval_pending') THEN RAISE EXCEPTION 'Fatura onaya hazır değil'; END IF;
  SELECT count(*) INTO v_count FROM public.purchase_invoice_allocations WHERE invoice_id=p_invoice_id AND active=true;
  SELECT shipment_id INTO v_shipment FROM public.purchase_invoice_allocations WHERE invoice_id=p_invoice_id AND active=true ORDER BY created_at LIMIT 1;
  IF v_invoice.operational_supplier_id IS NULL THEN RAISE EXCEPTION 'Ödeme kaydı için nakliyeci seçilmelidir'; END IF;
  INSERT INTO public.purchases(purchase_no,supplier_id,shipment_id,purchase_date,due_date,subtotal,tax,total,status,notes)
  VALUES(v_invoice.invoice_no,v_invoice.operational_supplier_id,CASE WHEN v_count=1 THEN v_shipment ELSE NULL END,v_invoice.invoice_date,v_invoice.due_date,v_invoice.net_total,v_invoice.vat_total,v_invoice.grand_total,'beklemede',coalesce(v_invoice.description,'')||CASE WHEN p_note IS NULL THEN '' ELSE E'\nOnay: '||p_note END)
  RETURNING id INTO v_purchase;
  UPDATE public.incoming_purchase_invoices SET status='payment_pending',approved_at=now(),approved_by=auth.uid(),legacy_purchase_id=v_purchase,updated_at=now() WHERE id=p_invoice_id;
  IF v_count=1 THEN UPDATE public.shipments SET purchase_invoice_id=v_purchase,updated_at=now() WHERE id=v_shipment; END IF;
  PERFORM public.rex_record_purchase_invoice_event(p_invoice_id,'owner_approved',v_invoice.status,'payment_pending',jsonb_build_object('note',p_note,'purchase_id',v_purchase));
END $$;

CREATE OR REPLACE FUNCTION public.rex_approve_supplier_invoice_issuer(p_invoice_id uuid,p_reason text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_invoice public.incoming_purchase_invoices%ROWTYPE; v_email text:=lower(coalesce(auth.jwt()->>'email','')); v_id uuid;
BEGIN
  IF v_email<>'info@rexlojistik.com' OR NOT public.rex_has_role(ARRAY['admin']) THEN RAISE EXCEPTION 'Fatura düzenleyicisi bağlantısını yalnızca şirket sahibi onaylayabilir'; END IF;
  IF length(trim(coalesce(p_reason,'')))<10 THEN RAISE EXCEPTION 'İlişki açıklaması en az 10 karakter olmalıdır'; END IF;
  SELECT * INTO v_invoice FROM public.incoming_purchase_invoices WHERE id=p_invoice_id FOR UPDATE;
  IF NOT FOUND OR v_invoice.operational_supplier_id IS NULL THEN RAISE EXCEPTION 'Faturada nakliyeci seçilmelidir'; END IF;
  INSERT INTO public.supplier_invoice_issuers(operational_supplier_id,issuer_name,issuer_tax_id,relationship_reason,approved_at,approved_by,created_by)
  VALUES(v_invoice.operational_supplier_id,v_invoice.issuer_name,v_invoice.issuer_tax_id,trim(p_reason),now(),auth.uid(),auth.uid())
  ON CONFLICT (operational_supplier_id,(regexp_replace(issuer_tax_id,'\D','','g'))) WHERE active=true
  DO UPDATE SET issuer_name=excluded.issuer_name,relationship_reason=excluded.relationship_reason,approved_at=now(),approved_by=auth.uid()
  RETURNING id INTO v_id;
  PERFORM public.rex_record_purchase_invoice_event(p_invoice_id,'issuer_relation_approved',v_invoice.status,v_invoice.status,jsonb_build_object('relationship_id',v_id,'reason',p_reason));
  RETURN v_id;
END $$;

INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('purchase-invoice-documents','purchase-invoice-documents',false,15728640,ARRAY['application/pdf','application/xml','text/xml'])
ON CONFLICT(id) DO UPDATE SET public=false,file_size_limit=15728640,allowed_mime_types=excluded.allowed_mime_types;
DROP POLICY IF EXISTS rex_purchase_invoice_documents_select ON storage.objects;
CREATE POLICY rex_purchase_invoice_documents_select ON storage.objects FOR SELECT TO authenticated
  USING(bucket_id='purchase-invoice-documents' AND public.rex_has_role(ARRAY['admin','accounting']));
DROP POLICY IF EXISTS rex_purchase_invoice_documents_insert ON storage.objects;
CREATE POLICY rex_purchase_invoice_documents_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK(bucket_id='purchase-invoice-documents' AND public.rex_has_role(ARRAY['admin','accounting']) AND (storage.foldername(name))[1]=auth.uid()::text);

REVOKE ALL ON FUNCTION public.rex_create_manual_purchase_invoice(text,date,date,text,text,text,text,numeric,numeric,numeric,numeric,text,text,text,uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rex_import_kolaybi_purchase_invoice(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rex_purchase_invoice_candidates(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rex_match_purchase_invoice(uuid,jsonb,numeric,boolean,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rex_approve_purchase_invoice(uuid,boolean,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rex_approve_supplier_invoice_issuer(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rex_create_manual_purchase_invoice(text,date,date,text,text,text,text,numeric,numeric,numeric,numeric,text,text,text,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_import_kolaybi_purchase_invoice(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_purchase_invoice_candidates(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_match_purchase_invoice(uuid,jsonb,numeric,boolean,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_approve_purchase_invoice(uuid,boolean,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_approve_supplier_invoice_issuer(uuid,text) TO authenticated;
