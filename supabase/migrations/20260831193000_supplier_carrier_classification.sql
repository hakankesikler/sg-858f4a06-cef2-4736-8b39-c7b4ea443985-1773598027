BEGIN;

-- Nakliyeci, kendi sürücüsü/aracı sisteme tanımlanan bireysel veya küçük filo
-- tedarikçisidir. Taşıyıcı ise GPSLine, Ergül Kargo ve QuickShipper gibi kendi
-- operasyon kaynağını yöneten kurumsal hizmet sağlayıcıdır.
ALTER TABLE public.customers
  DROP CONSTRAINT IF EXISTS customers_supplier_category_check;
ALTER TABLE public.customers
  ADD CONSTRAINT customers_supplier_category_check CHECK (
    supplier_category IS NULL OR supplier_category IN ('nakliyeci','tasiyici','forwarder','diger')
  );
COMMENT ON COLUMN public.customers.supplier_category IS
  'Tedarikçi sınıfı: nakliyeci (sürücü/araç zorunlu), tasiyici (kurumsal taşıyıcı; sürücü/araç opsiyonel), forwarder veya diger.';

-- Kullanıcının özellikle belirttiği mevcut kurumsal taşıyıcıları kalıcı olarak sınıflandır.
UPDATE public.customers
SET supplier_category='tasiyici', updated_at=now()
WHERE account_type='tedarikci'
  AND (
    regexp_replace(translate(lower(coalesce(name,'')),'çğıöşü','cgiosu'),'[^a-z0-9]','','g') LIKE '%gpsline%'
    OR regexp_replace(translate(lower(coalesce(name,'')),'çğıöşü','cgiosu'),'[^a-z0-9]','','g') LIKE '%quickshipper%'
    OR regexp_replace(translate(lower(coalesce(name,'')),'çğıöşü','cgiosu'),'[^a-z0-9]','','g') LIKE '%ergulkargo%'
  );

ALTER TABLE public.staff_permission_overrides
  DROP CONSTRAINT IF EXISTS staff_permission_overrides_permission_key_check;
ALTER TABLE public.staff_permission_overrides
  ADD CONSTRAINT staff_permission_overrides_permission_key_check CHECK (permission_key IN (
    'crm.customers','crm.portal_invites','crm.sales_pipeline','crm.team_pipeline','crm.offer_approval','crm.exports','crm.settings','sales.work_orders',
    'operations.shipments','operations.assignments','operations.carrier_assignment','operations.delivery','operations.exceptions','operations.uetds',
    'accounting.sales','accounting.purchase','accounting.accounts','accounting.expenses','reports.sales','reports.operations','reports.accounting','analytics.web',
    'integrations.connections','integrations.imports','integrations.monitoring'
  ));

-- Bu izin hiçbir departmana otomatik verilmez. Şirket sahibi veya sahibi tarafından
-- personel bazında "Yönetebilir" olarak açılan kullanıcı taşıyıcı atayabilir.
CREATE OR REPLACE FUNCTION public.rex_can_assign_transport_carrier()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
  SELECT public.rex_is_owner_admin()
    OR public.rex_has_permission('operations.carrier_assignment','manage');
$$;
REVOKE ALL ON FUNCTION public.rex_can_assign_transport_carrier() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rex_can_assign_transport_carrier() TO authenticated;

CREATE OR REPLACE FUNCTION public.rex_customer_carrier_classification_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_changes_carrier boolean:=false;
BEGIN
  IF coalesce(auth.role(),'')='service_role' THEN RETURN NEW; END IF;

  IF TG_OP='INSERT' THEN
    v_changes_carrier:=NEW.account_type='tedarikci' AND NEW.supplier_category='tasiyici';
  ELSE
    v_changes_carrier:=
      (OLD.account_type='tedarikci' AND OLD.supplier_category='tasiyici')
      OR (NEW.account_type='tedarikci' AND NEW.supplier_category='tasiyici');
    v_changes_carrier:=v_changes_carrier AND (
      OLD.account_type IS DISTINCT FROM NEW.account_type
      OR OLD.supplier_category IS DISTINCT FROM NEW.supplier_category
    );
  END IF;

  IF v_changes_carrier AND NOT public.rex_can_assign_transport_carrier() THEN
    RAISE EXCEPTION 'Kurumsal taşıyıcı sınıfını yalnızca şirket sahibi veya taşıyıcı atama yetkisi verilen personel değiştirebilir';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS rex_customer_carrier_classification_guard ON public.customers;
CREATE TRIGGER rex_customer_carrier_classification_guard
  BEFORE INSERT OR UPDATE OF account_type,supplier_category ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.rex_customer_carrier_classification_guard();

CREATE OR REPLACE FUNCTION public.rex_validate_transport_assignment(
  p_supplier_id uuid,
  p_driver_id uuid,
  p_vehicle_id uuid,
  p_load_weight numeric DEFAULT NULL,
  p_require_default_assignment boolean DEFAULT false
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
  v_category text;
  v_driver public.drivers%ROWTYPE;
  v_vehicle public.vehicles%ROWTYPE;
BEGIN
  IF p_supplier_id IS NOT NULL THEN
    SELECT supplier_category INTO v_category
    FROM public.customers
    WHERE id=p_supplier_id AND account_type='tedarikci' AND archived_at IS NULL;
    IF NOT FOUND THEN RAISE EXCEPTION 'Aktif tedarikçi bulunamadı'; END IF;
  END IF;

  IF v_category='nakliyeci' OR (p_require_default_assignment AND v_category IS DISTINCT FROM 'tasiyici') THEN
    IF p_driver_id IS NULL OR p_vehicle_id IS NULL THEN
      RAISE EXCEPTION 'Nakliyeci sevkiyatında sürücü ve araç zorunludur';
    END IF;
  ELSIF (p_driver_id IS NULL) <> (p_vehicle_id IS NULL) THEN
    RAISE EXCEPTION 'Sürücü ve araç birlikte atanmalıdır';
  END IF;

  IF p_driver_id IS NOT NULL THEN
    IF v_category='nakliyeci' THEN
      SELECT * INTO v_driver FROM public.drivers WHERE id=p_driver_id;
      SELECT * INTO v_vehicle FROM public.vehicles WHERE id=p_vehicle_id;
      IF nullif(trim(v_driver.full_name),'') IS NULL THEN RAISE EXCEPTION 'Nakliyeci sürücüsünün adı ve soyadı zorunludur'; END IF;
      IF coalesce(v_driver.tc_no,'') !~ '^[0-9]{11}$' THEN RAISE EXCEPTION 'Nakliyeci sürücüsünün 11 haneli T.C. kimlik numarası zorunludur'; END IF;
      IF nullif(trim(v_vehicle.cekici_plakasi),'') IS NULL THEN RAISE EXCEPTION 'Nakliyeci aracının plakası zorunludur'; END IF;
    END IF;
    PERFORM public.rex_validate_assignment_with_load(p_driver_id,p_vehicle_id,p_load_weight);
  END IF;

  RETURN v_category;
END $$;
REVOKE ALL ON FUNCTION public.rex_validate_transport_assignment(uuid,uuid,uuid,numeric,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rex_validate_transport_assignment(uuid,uuid,uuid,numeric,boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.rex_shipment_assignment_compliance_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
  v_new_category text;
  v_old_category text;
  v_supplier_changed boolean;
  v_require_for_status boolean;
BEGIN
  IF NEW.supplier_id IS NOT NULL THEN
    SELECT supplier_category INTO v_new_category FROM public.customers WHERE id=NEW.supplier_id;
  END IF;
  IF TG_OP='UPDATE' AND OLD.supplier_id IS NOT NULL THEN
    SELECT supplier_category INTO v_old_category FROM public.customers WHERE id=OLD.supplier_id;
  END IF;

  IF TG_OP='INSERT' THEN
    v_supplier_changed:=true;
  ELSE
    v_supplier_changed:=OLD.supplier_id IS DISTINCT FROM NEW.supplier_id;
  END IF;
  IF v_supplier_changed
     AND (v_new_category='tasiyici' OR v_old_category='tasiyici')
     AND coalesce(auth.role(),'')<>'service_role'
     AND NOT public.rex_can_assign_transport_carrier() THEN
    RAISE EXCEPTION 'Kurumsal taşıyıcı ataması için ayrıca taşıyıcı atama yetkisi gereklidir';
  END IF;

  IF NEW.service_mode='international_express' THEN RETURN NEW; END IF;

  v_require_for_status:=NEW.status IN ('hazirlaniyor','hazırlanıyor','Hazırlanıyor','yolda');
  v_new_category:=public.rex_validate_transport_assignment(
    NEW.supplier_id,NEW.driver_id,NEW.vehicle_id,NEW.toplam_kg_ds,v_require_for_status
  );

  IF v_new_category='tasiyici' AND NEW.status='atama_bekliyor' THEN
    NEW.status:='beklemede';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS rex_shipment_assignment_compliance_guard ON public.shipments;
CREATE TRIGGER rex_shipment_assignment_compliance_guard
  BEFORE INSERT OR UPDATE OF supplier_id,driver_id,vehicle_id,toplam_kg_ds,service_mode,status ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.rex_shipment_assignment_compliance_guard();

CREATE OR REPLACE FUNCTION public.rex_set_shipment_status(p_shipment_id uuid,p_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
  v_current text; v_supplier uuid; v_driver uuid; v_vehicle uuid; v_load numeric;
  v_mode text; v_awb text; v_carrier text; v_category text;
  v_enforce boolean; v_uetds_status text;
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin','operations']) THEN RAISE EXCEPTION 'Bu işlem için yetkiniz bulunmuyor'; END IF;
  IF p_status='iptal' THEN RAISE EXCEPTION 'İptal nedeni zorunludur; sevkiyat iptal işlemini kullanın'; END IF;
  IF p_status NOT IN ('hazirlaniyor','yolda') THEN RAISE EXCEPTION 'Geçersiz sevkiyat durumu'; END IF;

  SELECT status,supplier_id,driver_id,vehicle_id,toplam_kg_ds,service_mode,awb_number,express_carrier
    INTO v_current,v_supplier,v_driver,v_vehicle,v_load,v_mode,v_awb,v_carrier
  FROM public.shipments WHERE id=p_shipment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sevkiyat bulunamadı'; END IF;
  IF v_current IN ('teslim_edildi','Teslim Edildi','iptal','İptal') THEN RAISE EXCEPTION 'Tamamlanmış sevkiyatın durumu değiştirilemez'; END IF;

  IF v_mode='international_express' THEN
    IF p_status='yolda' AND (nullif(trim(v_awb),'') IS NULL OR nullif(trim(v_carrier),'') IS NULL) THEN
      RAISE EXCEPTION 'Express gönderi, taşıyıcı ve AWB numarası girilmeden başlatılamaz';
    END IF;
  ELSE
    v_category:=public.rex_validate_transport_assignment(v_supplier,v_driver,v_vehicle,v_load,true);
    IF p_status='yolda' THEN
      SELECT enforcement_enabled INTO v_enforce FROM public.uetds_settings WHERE id=true;
      IF coalesce(v_enforce,false) THEN
        SELECT status INTO v_uetds_status FROM public.uetds_journeys WHERE shipment_id=p_shipment_id;
        IF coalesce(v_uetds_status,'') NOT IN ('accepted','carrier_reported') THEN
          RAISE EXCEPTION 'U-ETDS bildirimi kabul edilmeden veya taşıyıcı referansı girilmeden sevkiyat başlatılamaz';
        END IF;
      END IF;
    END IF;
  END IF;

  IF p_status='yolda' AND v_current NOT IN ('beklemede','hazirlaniyor','hazırlanıyor','Hazırlanıyor') THEN
    RAISE EXCEPTION 'Sevkiyat yola çıkarılamaz';
  END IF;
  UPDATE public.shipments SET status=p_status,
    carrier_status=CASE WHEN service_mode='international_express' AND p_status='yolda' AND coalesce(carrier_status,'')='GÖNDERİ OLUŞTURULDU' THEN 'ÇIKIŞ NOKTASINDA' ELSE carrier_status END,
    updated_at=now() WHERE id=p_shipment_id;
END $$;

COMMIT;
