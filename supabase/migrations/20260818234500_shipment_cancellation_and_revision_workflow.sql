-- Status-aware deletion, reasoned cancellation, invoice cancellation/refund,
-- and owner-approved revisions for completed shipments.

ALTER TABLE public.shipments
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by uuid;

ALTER TABLE public.sales_invoices
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS cancellation_type text,
  ADD COLUMN IF NOT EXISTS cancellation_reference text,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by uuid;

ALTER TABLE public.sales_invoices
  DROP CONSTRAINT IF EXISTS sales_invoices_payment_status_check;
ALTER TABLE public.sales_invoices
  ADD CONSTRAINT sales_invoices_payment_status_check CHECK (
    payment_status IN ('Ödendi','Bekliyor','Gecikmiş','Kısmi Ödendi','İptal')
  );

ALTER TABLE public.sales_invoices
  DROP CONSTRAINT IF EXISTS sales_invoices_cancellation_type_check;
ALTER TABLE public.sales_invoices
  ADD CONSTRAINT sales_invoices_cancellation_type_check CHECK (
    cancellation_type IS NULL OR cancellation_type IN ('iptal','iade')
  );

ALTER TABLE public.shipment_events
  DROP CONSTRAINT IF EXISTS shipment_events_event_type_check;
ALTER TABLE public.shipment_events
  ADD CONSTRAINT shipment_events_event_type_check CHECK (event_type IN (
    'history_enabled','created','updated','assignment_changed','status_changed',
    'delivery_document_added','delivered','invoiced','invoice_unlinked','deleted',
    'owner_approved_edit','job_created','job_approved',
    'kolaybi_sync_started','kolaybi_sync_succeeded','kolaybi_sync_failed',
    'cancelled','revision_requested','revision_rejected','revision_applied','invoice_cancelled'
  ));

CREATE TABLE IF NOT EXISTS public.shipment_revision_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL,
  shipment_code text NOT NULL,
  reason text NOT NULL CHECK (length(trim(reason)) >= 10),
  proposed_shipment jsonb NOT NULL,
  proposed_cargo_items jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','rejected','approved','applied')),
  requested_by uuid NOT NULL,
  requested_by_email text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid,
  reviewed_by_email text,
  reviewed_at timestamptz,
  review_note text,
  applied_at timestamptz
);

CREATE INDEX IF NOT EXISTS shipment_revision_requests_status_idx
  ON public.shipment_revision_requests(status,requested_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS shipment_revision_requests_one_pending
  ON public.shipment_revision_requests(shipment_id)
  WHERE status='pending';

ALTER TABLE public.shipment_revision_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rex_shipment_revision_requests_select ON public.shipment_revision_requests;
CREATE POLICY rex_shipment_revision_requests_select ON public.shipment_revision_requests
  FOR SELECT TO authenticated
  USING (public.rex_has_role(ARRAY['admin','operations','accounting']));

REVOKE ALL ON public.shipment_revision_requests FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.shipment_revision_requests TO authenticated;

CREATE OR REPLACE FUNCTION public.rex_owner_delete_shipment(
  p_shipment_id uuid,
  p_confirmation_code text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public,pg_temp
AS $$
DECLARE
  v_shipment public.shipments%ROWTYPE;
  v_email text := lower(coalesce(auth.jwt()->>'email',''));
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin']) OR v_email <> 'info@rexlojistik.com' THEN
    RAISE EXCEPTION 'Sevkiyat silme yetkisi yalnızca şirket sahibi hesabına aittir';
  END IF;

  SELECT * INTO v_shipment FROM public.shipments WHERE id=p_shipment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sevkiyat bulunamadı'; END IF;
  IF nullif(trim(p_confirmation_code),'') IS NULL OR trim(p_confirmation_code) <> v_shipment.shipment_code THEN
    RAISE EXCEPTION 'Onay için sevkiyat kodunu eksiksiz yazmalısınız';
  END IF;
  IF v_shipment.status IN ('yolda','Yolda','Dağıtımda','teslim_edildi','Teslim Edildi','iptal','İptal') THEN
    RAISE EXCEPTION 'Yoldaki, tamamlanmış veya iptal edilmiş sevkiyat silinemez; iptal/revizyon süreci kullanılmalıdır';
  END IF;
  IF v_shipment.sale_invoice_id IS NOT NULL OR v_shipment.invoice_status IN ('faturalandi','kismenfaturalandi') THEN
    RAISE EXCEPTION 'Faturalı sevkiyat silinemez; önce fatura iptal/iade süreci tamamlanmalıdır';
  END IF;

  DELETE FROM public.shipments WHERE id=p_shipment_id;
END $$;

CREATE OR REPLACE FUNCTION public.rex_set_shipment_status(p_shipment_id uuid,p_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public,pg_temp
AS $$
DECLARE v_current text; v_driver uuid; v_vehicle uuid;
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin','operations']) THEN RAISE EXCEPTION 'Bu işlem için yetkiniz bulunmuyor'; END IF;
  IF p_status='iptal' THEN RAISE EXCEPTION 'İptal nedeni zorunludur; sevkiyat iptal işlemini kullanın'; END IF;
  IF p_status NOT IN ('hazirlaniyor','yolda') THEN RAISE EXCEPTION 'Geçersiz sevkiyat durumu'; END IF;
  SELECT status,driver_id,vehicle_id INTO v_current,v_driver,v_vehicle FROM public.shipments WHERE id=p_shipment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sevkiyat bulunamadı'; END IF;
  IF v_current IN ('teslim_edildi','Teslim Edildi','iptal','İptal') THEN RAISE EXCEPTION 'Tamamlanmış sevkiyatın durumu değiştirilemez'; END IF;
  PERFORM public.rex_validate_assignment(v_driver,v_vehicle);
  IF p_status='yolda' AND v_current NOT IN ('beklemede','hazirlaniyor','hazırlanıyor','Hazırlanıyor') THEN RAISE EXCEPTION 'Sevkiyat yola çıkarılamaz'; END IF;
  UPDATE public.shipments SET status=p_status,updated_at=now() WHERE id=p_shipment_id;
END $$;

CREATE OR REPLACE FUNCTION public.rex_cancel_shipment(p_shipment_id uuid,p_reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public,pg_temp
AS $$
DECLARE
  v_shipment public.shipments%ROWTYPE;
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin','operations']) THEN RAISE EXCEPTION 'Bu işlem için yetkiniz bulunmuyor'; END IF;
  IF nullif(trim(p_reason),'') IS NULL OR length(trim(p_reason)) < 10 THEN
    RAISE EXCEPTION 'İptal nedeni en az 10 karakter olmalıdır';
  END IF;
  SELECT * INTO v_shipment FROM public.shipments WHERE id=p_shipment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sevkiyat bulunamadı'; END IF;
  IF v_shipment.status IN ('iptal','İptal') THEN RAISE EXCEPTION 'Sevkiyat zaten iptal edilmiş'; END IF;
  IF v_shipment.status IN ('teslim_edildi','Teslim Edildi') THEN
    RAISE EXCEPTION 'Teslim edilmiş sevkiyat doğrudan iptal edilemez; yönetici onaylı revizyon gerekir';
  END IF;
  IF v_shipment.sale_invoice_id IS NOT NULL OR v_shipment.invoice_status IN ('faturalandi','kismenfaturalandi') THEN
    RAISE EXCEPTION 'Faturalı sevkiyat iptal edilemez; önce fatura iptal/iade süreci tamamlanmalıdır';
  END IF;
  IF v_shipment.status IN ('yolda','Yolda','Dağıtımda') AND NOT public.rex_has_role(ARRAY['admin']) THEN
    RAISE EXCEPTION 'Yoldaki sevkiyatı yalnızca yönetici iptal edebilir';
  END IF;

  UPDATE public.shipments
  SET status='iptal',cancellation_reason=trim(p_reason),cancelled_at=now(),cancelled_by=auth.uid(),updated_at=now()
  WHERE id=p_shipment_id;

  INSERT INTO public.shipment_events(
    shipment_id,shipment_code,event_type,old_status,new_status,changed_fields,
    actor_id,actor_email,actor_role,source,note
  ) VALUES (
    v_shipment.id,v_shipment.shipment_code,'cancelled',v_shipment.status,'iptal',
    jsonb_build_object('cancellation_reason',jsonb_build_object('old',NULL,'new',trim(p_reason))),
    auth.uid(),coalesce((SELECT email FROM public.app_user_roles WHERE user_id=auth.uid() AND active=true LIMIT 1),auth.jwt()->>'email'),
    (SELECT role FROM public.app_user_roles WHERE user_id=auth.uid() AND active=true LIMIT 1),'portal',
    'Sevkiyat iptal edildi: '||trim(p_reason)
  );
END $$;

CREATE OR REPLACE FUNCTION public.rex_request_shipment_revision(
  p_shipment_id uuid,
  p_reason text,
  p_proposed_shipment jsonb,
  p_proposed_cargo_items jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public,pg_temp
AS $$
DECLARE
  v_shipment public.shipments%ROWTYPE;
  v_id uuid;
  v_email text;
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin','operations']) THEN RAISE EXCEPTION 'Bu işlem için yetkiniz bulunmuyor'; END IF;
  IF nullif(trim(p_reason),'') IS NULL OR length(trim(p_reason)) < 10 THEN
    RAISE EXCEPTION 'Revizyon gerekçesi en az 10 karakter olmalıdır';
  END IF;
  IF jsonb_typeof(p_proposed_shipment) IS DISTINCT FROM 'object'
     OR jsonb_typeof(p_proposed_cargo_items) IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_proposed_cargo_items)=0 THEN
    RAISE EXCEPTION 'Revizyon bilgileri ve yük kalemleri zorunludur';
  END IF;
  SELECT * INTO v_shipment FROM public.shipments WHERE id=p_shipment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sevkiyat bulunamadı'; END IF;
  IF v_shipment.status NOT IN ('teslim_edildi','Teslim Edildi')
     AND v_shipment.invoice_status NOT IN ('faturalandi','kismenfaturalandi') THEN
    RAISE EXCEPTION 'Revizyon süreci yalnızca tamamlanmış veya faturalı sevkiyatlar içindir';
  END IF;
  IF EXISTS (SELECT 1 FROM public.shipment_revision_requests WHERE shipment_id=p_shipment_id AND status='pending') THEN
    RAISE EXCEPTION 'Bu sevkiyat için bekleyen bir revizyon talebi zaten var';
  END IF;
  v_email := coalesce((SELECT email FROM public.app_user_roles WHERE user_id=auth.uid() AND active=true LIMIT 1),auth.jwt()->>'email');
  INSERT INTO public.shipment_revision_requests(
    shipment_id,shipment_code,reason,proposed_shipment,proposed_cargo_items,requested_by,requested_by_email
  ) VALUES (
    v_shipment.id,v_shipment.shipment_code,trim(p_reason),p_proposed_shipment,p_proposed_cargo_items,auth.uid(),v_email
  ) RETURNING id INTO v_id;

  INSERT INTO public.shipment_events(
    shipment_id,shipment_code,event_type,old_status,new_status,changed_fields,
    actor_id,actor_email,actor_role,source,note
  ) VALUES (
    v_shipment.id,v_shipment.shipment_code,'revision_requested',v_shipment.status,v_shipment.status,
    jsonb_build_object('revision_request_id',v_id,'reason',trim(p_reason),'proposed_shipment',p_proposed_shipment),
    auth.uid(),v_email,(SELECT role FROM public.app_user_roles WHERE user_id=auth.uid() AND active=true LIMIT 1),'portal',
    'Tamamlanmış sevkiyat için revizyon talebi oluşturuldu: '||trim(p_reason)
  );
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.rex_guard_completed_shipment_critical_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public,pg_temp
AS $$
DECLARE v_revision text := current_setting('rex.approved_revision_id',true);
BEGIN
  IF OLD.status IN ('teslim_edildi','Teslim Edildi') AND (
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
    IF nullif(v_revision,'') IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.shipment_revision_requests r
      WHERE r.id=v_revision::uuid AND r.shipment_id=OLD.id AND r.status='approved'
    ) THEN
      RAISE EXCEPTION 'Tamamlanmış sevkiyatın kritik alanları yalnızca onaylı revizyonla değiştirilebilir';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS rex_completed_shipment_critical_guard ON public.shipments;
CREATE TRIGGER rex_completed_shipment_critical_guard
BEFORE UPDATE ON public.shipments
FOR EACH ROW EXECUTE FUNCTION public.rex_guard_completed_shipment_critical_fields();

CREATE OR REPLACE FUNCTION public.rex_guard_completed_cargo_revision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public,pg_temp
AS $$
DECLARE
  v_shipment_id uuid;
  v_status text;
  v_revision text := current_setting('rex.approved_revision_id',true);
BEGIN
  v_shipment_id := CASE WHEN TG_OP='DELETE' THEN OLD.shipment_id ELSE NEW.shipment_id END;
  SELECT status INTO v_status FROM public.shipments WHERE id=v_shipment_id;
  IF v_status IN ('teslim_edildi','Teslim Edildi') THEN
    IF nullif(v_revision,'') IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.shipment_revision_requests r
      WHERE r.id=v_revision::uuid AND r.shipment_id=v_shipment_id AND r.status='approved'
    ) THEN
      RAISE EXCEPTION 'Tamamlanmış sevkiyatın yük bilgileri yalnızca onaylı revizyonla değiştirilebilir';
    END IF;
  END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS rex_completed_cargo_revision_guard ON public.shipment_cargo_items;
CREATE TRIGGER rex_completed_cargo_revision_guard
BEFORE INSERT OR UPDATE OR DELETE ON public.shipment_cargo_items
FOR EACH ROW EXECUTE FUNCTION public.rex_guard_completed_cargo_revision();

CREATE OR REPLACE FUNCTION public.rex_review_shipment_revision(
  p_request_id uuid,
  p_decision text,
  p_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public,pg_temp
AS $$
DECLARE
  v_request public.shipment_revision_requests%ROWTYPE;
  v_email text := lower(coalesce(auth.jwt()->>'email',''));
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin']) OR v_email <> 'info@rexlojistik.com' THEN
    RAISE EXCEPTION 'Revizyonu yalnızca şirket sahibi hesabı onaylayabilir';
  END IF;
  IF p_decision NOT IN ('approve','reject') THEN RAISE EXCEPTION 'Geçersiz revizyon kararı'; END IF;
  IF p_decision='reject' AND (nullif(trim(p_note),'') IS NULL OR length(trim(p_note))<5) THEN
    RAISE EXCEPTION 'Ret açıklaması en az 5 karakter olmalıdır';
  END IF;
  SELECT * INTO v_request FROM public.shipment_revision_requests WHERE id=p_request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Revizyon talebi bulunamadı'; END IF;
  IF v_request.status<>'pending' THEN RAISE EXCEPTION 'Revizyon talebi daha önce sonuçlandırılmış'; END IF;

  IF p_decision='reject' THEN
    UPDATE public.shipment_revision_requests
    SET status='rejected',reviewed_by=auth.uid(),reviewed_by_email=v_email,reviewed_at=now(),review_note=trim(p_note)
    WHERE id=p_request_id;
    INSERT INTO public.shipment_events(
      shipment_id,shipment_code,event_type,old_status,new_status,changed_fields,
      actor_id,actor_email,actor_role,source,note
    ) SELECT s.id,s.shipment_code,'revision_rejected',s.status,s.status,
      jsonb_build_object('revision_request_id',p_request_id,'review_note',trim(p_note)),
      auth.uid(),v_email,'admin','portal','Revizyon talebi reddedildi: '||trim(p_note)
      FROM public.shipments s WHERE s.id=v_request.shipment_id;
    RETURN;
  END IF;

  UPDATE public.shipment_revision_requests
  SET status='approved',reviewed_by=auth.uid(),reviewed_by_email=v_email,reviewed_at=now(),review_note=nullif(trim(p_note),'')
  WHERE id=p_request_id;
  PERFORM set_config('rex.approved_revision_id',p_request_id::text,true);
  PERFORM public.rex_save_shipment(
    v_request.shipment_id,
    v_request.proposed_shipment || jsonb_build_object('_owner_confirmation_code',v_request.shipment_code),
    v_request.proposed_cargo_items
  );
  UPDATE public.shipment_revision_requests SET status='applied',applied_at=now() WHERE id=p_request_id;
  INSERT INTO public.shipment_events(
    shipment_id,shipment_code,event_type,old_status,new_status,changed_fields,
    actor_id,actor_email,actor_role,source,note
  ) SELECT s.id,s.shipment_code,'revision_applied',s.status,s.status,
    jsonb_build_object('revision_request_id',p_request_id,'review_note',p_note),
    auth.uid(),v_email,'admin','portal','Revizyon şirket sahibi tarafından onaylandı ve uygulandı'
    FROM public.shipments s WHERE s.id=v_request.shipment_id;
END $$;

CREATE OR REPLACE FUNCTION public.rex_cancel_sales_invoice(
  p_invoice_id uuid,
  p_reason text,
  p_cancellation_type text,
  p_external_reference text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public,pg_temp
AS $$
DECLARE
  v_invoice public.sales_invoices%ROWTYPE;
  v_email text;
  v_role text;
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin','accounting']) THEN RAISE EXCEPTION 'Bu işlem için yetkiniz bulunmuyor'; END IF;
  IF nullif(trim(p_reason),'') IS NULL OR length(trim(p_reason))<10 THEN RAISE EXCEPTION 'Fatura iptal/iade nedeni en az 10 karakter olmalıdır'; END IF;
  IF p_cancellation_type NOT IN ('iptal','iade') THEN RAISE EXCEPTION 'İşlem türü iptal veya iade olmalıdır'; END IF;
  SELECT * INTO v_invoice FROM public.sales_invoices WHERE id=p_invoice_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Fatura bulunamadı'; END IF;
  IF v_invoice.payment_status='İptal' THEN RAISE EXCEPTION 'Fatura daha önce iptal/iade edilmiş'; END IF;
  IF v_invoice.payment_status IN ('Ödendi','Kısmi Ödendi') AND p_cancellation_type<>'iade' THEN
    RAISE EXCEPTION 'Tahsilat bulunan fatura yalnızca iade süreciyle kapatılabilir';
  END IF;
  IF (v_invoice.kolaybi_document_id IS NOT NULL OR v_invoice.e_invoice_status='oluşturuldu')
     AND nullif(trim(p_external_reference),'') IS NULL THEN
    RAISE EXCEPTION 'KolayBi/e-Fatura iptal veya iade işlemi tamamlanıp dış sistem referansı girilmelidir';
  END IF;

  SELECT email,role INTO v_email,v_role FROM public.app_user_roles WHERE user_id=auth.uid() AND active=true LIMIT 1;
  v_email := coalesce(v_email,auth.jwt()->>'email');
  INSERT INTO public.shipment_events(
    shipment_id,shipment_code,event_type,old_status,new_status,changed_fields,
    actor_id,actor_email,actor_role,source,note
  )
  SELECT s.id,s.shipment_code,'invoice_cancelled',s.status,s.status,
         jsonb_build_object('invoice_id',p_invoice_id,'invoice_no',v_invoice.invoice_no,'type',p_cancellation_type,'reference',p_external_reference),
         auth.uid(),v_email,v_role,'accounting',
         'Fatura '||CASE WHEN p_cancellation_type='iade' THEN 'iade' ELSE 'iptal' END||' süreci tamamlandı: '||trim(p_reason)
  FROM public.shipments s WHERE s.sale_invoice_id=p_invoice_id;

  UPDATE public.sales_invoices
  SET payment_status='İptal',cancellation_reason=trim(p_reason),cancellation_type=p_cancellation_type,
      cancellation_reference=nullif(trim(p_external_reference),''),cancelled_at=now(),cancelled_by=auth.uid(),updated_at=now()
  WHERE id=p_invoice_id;
  UPDATE public.shipments
  SET sale_invoice_id=NULL,invoice_status='beklemede',updated_at=now()
  WHERE sale_invoice_id=p_invoice_id;
END $$;

CREATE OR REPLACE FUNCTION public.rex_delete_sales_invoice(p_invoice_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  RAISE EXCEPTION 'Faturalar silinemez; iptal/iade süreci kullanılmalıdır';
END $$;

DROP POLICY IF EXISTS rex_sales_invoices_no_direct_delete ON public.sales_invoices;
CREATE POLICY rex_sales_invoices_no_direct_delete ON public.sales_invoices
  AS RESTRICTIVE FOR DELETE TO authenticated USING (false);
REVOKE DELETE ON public.sales_invoices FROM authenticated;

REVOKE ALL ON FUNCTION public.rex_cancel_shipment(uuid,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.rex_request_shipment_revision(uuid,text,jsonb,jsonb) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.rex_review_shipment_revision(uuid,text,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.rex_cancel_sales_invoice(uuid,text,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rex_cancel_shipment(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_request_shipment_revision(uuid,text,jsonb,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_review_shipment_revision(uuid,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_cancel_sales_invoice(uuid,text,text,text) TO authenticated;

REVOKE ALL ON FUNCTION public.rex_guard_completed_shipment_critical_fields() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rex_guard_completed_cargo_revision() FROM PUBLIC;
