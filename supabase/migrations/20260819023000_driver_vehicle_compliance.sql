-- Driver/vehicle suitability, document expiry and capacity controls.

ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS src_belgesi_gecerlilik_tarihi date,
  ADD COLUMN IF NOT EXISTS psikoteknik_gecerlilik_tarihi date;

ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS yetki_belgesi_gecerlilik_tarihi date;

ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS vehicles_capacity_positive;
ALTER TABLE public.vehicles ADD CONSTRAINT vehicles_capacity_positive
  CHECK (tasima_kapasitesi_kg IS NULL OR tasima_kapasitesi_kg > 0);

CREATE OR REPLACE FUNCTION public.rex_required_license_classes(p_vehicle_type text)
RETURNS text[]
LANGUAGE sql IMMUTABLE SET search_path=public,pg_temp AS $$
  SELECT CASE lower(trim(coalesce(p_vehicle_type,'')))
    WHEN 'tir' THEN ARRAY['CE']::text[]
    WHEN 'tır' THEN ARRAY['CE']::text[]
    WHEN 'kamyon' THEN ARRAY['C','CE']::text[]
    WHEN 'kamyonet' THEN ARRAY['B','BE','C1','C1E','C','CE']::text[]
    WHEN 'panelvan' THEN ARRAY['B','BE','C1','C1E','C','CE']::text[]
    WHEN 'van' THEN ARRAY['B','BE','C1','C1E','C','CE']::text[]
    ELSE ARRAY[]::text[]
  END;
$$;

CREATE OR REPLACE FUNCTION public.rex_validate_assignment_with_load(
  p_driver_id uuid,p_vehicle_id uuid,p_load_weight numeric DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
  v_driver public.drivers%ROWTYPE;
  v_vehicle public.vehicles%ROWTYPE;
  v_required text[];
  v_actual text[];
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin','operations']) THEN RAISE EXCEPTION 'Bu işlem için yetkiniz bulunmuyor'; END IF;
  IF p_driver_id IS NULL OR p_vehicle_id IS NULL THEN RAISE EXCEPTION 'Sürücü ve araç birlikte atanmalıdır'; END IF;

  SELECT * INTO v_driver FROM public.drivers WHERE id=p_driver_id;
  IF NOT FOUND OR lower(coalesce(v_driver.status,'')) <> lower('Aktif') THEN RAISE EXCEPTION 'Aktif sürücü bulunamadı'; END IF;
  IF nullif(trim(v_driver.ehliyet_dosyasi_url),'') IS NULL THEN RAISE EXCEPTION 'Sürücü ehliyet belgesi yüklenmeden atama yapılamaz'; END IF;
  IF v_driver.ehliyet_gecerlilik_tarihi IS NULL THEN RAISE EXCEPTION 'Sürücü ehliyet geçerlilik tarihi zorunludur'; END IF;
  IF v_driver.ehliyet_gecerlilik_tarihi < current_date THEN RAISE EXCEPTION 'Sürücü ehliyetinin süresi geçmiş; atama yapılamaz'; END IF;
  IF nullif(trim(v_driver.ehliyet_sinifi),'') IS NULL THEN RAISE EXCEPTION 'Sürücü ehliyet sınıfı zorunludur'; END IF;
  IF nullif(trim(v_driver.src_belge_no),'') IS NULL OR v_driver.src_belgesi_gecerlilik_tarihi IS NULL THEN RAISE EXCEPTION 'Sürücünün SRC belge numarası ve geçerlilik tarihi zorunludur'; END IF;
  IF v_driver.src_belgesi_gecerlilik_tarihi < current_date THEN RAISE EXCEPTION 'Sürücünün SRC belgesinin süresi geçmiş; atama yapılamaz'; END IF;
  IF nullif(trim(v_driver.psikoteknik_belge_no),'') IS NULL OR v_driver.psikoteknik_gecerlilik_tarihi IS NULL THEN RAISE EXCEPTION 'Sürücünün psikoteknik belge numarası ve geçerlilik tarihi zorunludur'; END IF;
  IF v_driver.psikoteknik_gecerlilik_tarihi < current_date THEN RAISE EXCEPTION 'Sürücünün psikoteknik belgesinin süresi geçmiş; atama yapılamaz'; END IF;

  SELECT * INTO v_vehicle FROM public.vehicles WHERE id=p_vehicle_id;
  IF NOT FOUND OR lower(coalesce(v_vehicle.status,'')) <> lower('Aktif') THEN RAISE EXCEPTION 'Aktif araç bulunamadı'; END IF;
  IF nullif(trim(v_vehicle.ruhsat_dosyasi_url),'') IS NULL THEN RAISE EXCEPTION 'Araç ruhsatı yüklenmeden atama yapılamaz'; END IF;
  IF coalesce(v_vehicle.tasima_kapasitesi_kg,0)<=0 THEN RAISE EXCEPTION 'Araç taşıma kapasitesi tanımlanmadan atama yapılamaz'; END IF;
  IF p_load_weight IS NOT NULL AND p_load_weight>v_vehicle.tasima_kapasitesi_kg THEN
    RAISE EXCEPTION 'Yük ağırlığı (%) araç kapasitesini (%) aşıyor; atama yapılamaz',p_load_weight,v_vehicle.tasima_kapasitesi_kg;
  END IF;
  IF nullif(trim(v_vehicle.yetki_belgesi),'') IS NULL OR v_vehicle.yetki_belgesi_gecerlilik_tarihi IS NULL THEN RAISE EXCEPTION 'Aracın yetki belgesi ve geçerlilik tarihi zorunludur'; END IF;
  IF v_vehicle.yetki_belgesi_gecerlilik_tarihi < current_date THEN RAISE EXCEPTION 'Aracın yetki belgesinin süresi geçmiş; atama yapılamaz'; END IF;
  IF v_vehicle.trafik_sigortasi_bitis_tarihi IS NULL THEN RAISE EXCEPTION 'Aracın trafik sigortası bitiş tarihi zorunludur'; END IF;
  IF v_vehicle.trafik_sigortasi_bitis_tarihi < current_date THEN RAISE EXCEPTION 'Aracın trafik sigortasının süresi geçmiş; atama yapılamaz'; END IF;
  IF v_vehicle.kasko_bitis_tarihi IS NOT NULL AND v_vehicle.kasko_bitis_tarihi < current_date THEN RAISE EXCEPTION 'Aracın kayıtlı kasko belgesinin süresi geçmiş; atama yapılamaz'; END IF;

  v_required:=public.rex_required_license_classes(coalesce(v_vehicle.arac_tipi,v_vehicle.vehicle_type));
  IF cardinality(v_required)=0 THEN RAISE EXCEPTION 'Araç tipi tanımlı veya desteklenen bir tip olmalıdır'; END IF;
  v_actual:=regexp_split_to_array(upper(regexp_replace(v_driver.ehliyet_sinifi,'\s','','g')),',');
  IF NOT (v_actual && v_required) THEN
    RAISE EXCEPTION 'Sürücünün ehliyet sınıfı (%) araç tipi (%) için uygun değil. Gerekli sınıflar: %',v_driver.ehliyet_sinifi,coalesce(v_vehicle.arac_tipi,v_vehicle.vehicle_type),array_to_string(v_required,', ');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.rex_validate_assignment(p_driver_id uuid,p_vehicle_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  PERFORM public.rex_validate_assignment_with_load(p_driver_id,p_vehicle_id,NULL);
END $$;

CREATE OR REPLACE FUNCTION public.rex_shipment_assignment_compliance_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  IF NEW.driver_id IS NULL AND NEW.vehicle_id IS NULL THEN RETURN NEW; END IF;
  IF (NEW.driver_id IS NULL) <> (NEW.vehicle_id IS NULL) THEN RAISE EXCEPTION 'Sürücü ve araç birlikte atanmalıdır'; END IF;
  PERFORM public.rex_validate_assignment_with_load(NEW.driver_id,NEW.vehicle_id,NEW.toplam_kg_ds);
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS rex_shipment_assignment_compliance_guard ON public.shipments;
CREATE TRIGGER rex_shipment_assignment_compliance_guard
  BEFORE INSERT OR UPDATE OF driver_id,vehicle_id,toplam_kg_ds ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.rex_shipment_assignment_compliance_guard();

CREATE OR REPLACE FUNCTION public.rex_set_shipment_status(p_shipment_id uuid,p_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_current text; v_driver uuid; v_vehicle uuid; v_load numeric;
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin','operations']) THEN RAISE EXCEPTION 'Bu işlem için yetkiniz bulunmuyor'; END IF;
  IF p_status='iptal' THEN RAISE EXCEPTION 'İptal nedeni zorunludur; sevkiyat iptal işlemini kullanın'; END IF;
  IF p_status NOT IN ('hazirlaniyor','yolda') THEN RAISE EXCEPTION 'Geçersiz sevkiyat durumu'; END IF;
  SELECT status,driver_id,vehicle_id,toplam_kg_ds INTO v_current,v_driver,v_vehicle,v_load FROM public.shipments WHERE id=p_shipment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sevkiyat bulunamadı'; END IF;
  IF v_current IN ('teslim_edildi','Teslim Edildi','iptal','İptal') THEN RAISE EXCEPTION 'Tamamlanmış sevkiyatın durumu değiştirilemez'; END IF;
  PERFORM public.rex_validate_assignment_with_load(v_driver,v_vehicle,v_load);
  IF p_status='yolda' AND v_current NOT IN ('beklemede','hazirlaniyor','hazırlanıyor','Hazırlanıyor') THEN RAISE EXCEPTION 'Sevkiyat yola çıkarılamaz'; END IF;
  UPDATE public.shipments SET status=p_status,updated_at=now() WHERE id=p_shipment_id;
END $$;

CREATE OR REPLACE FUNCTION public.rex_transport_compliance_alerts(p_warning_days integer DEFAULT 30)
RETURNS TABLE(
  entity_type text,entity_id uuid,entity_name text,document_type text,
  expiry_date date,days_remaining integer,severity text,message text
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin','operations']) THEN RAISE EXCEPTION 'Belge uyarılarını görüntüleme yetkiniz yok'; END IF;
  IF p_warning_days NOT BETWEEN 1 AND 180 THEN RAISE EXCEPTION 'Uyarı süresi 1-180 gün arasında olmalıdır'; END IF;
  RETURN QUERY
  WITH documents AS (
    SELECT 'driver'::text entity_type,d.id entity_id,d.full_name entity_name,x.document_type,x.expiry_date,x.is_missing
    FROM public.drivers d
    CROSS JOIN LATERAL (VALUES
      ('Ehliyet'::text,d.ehliyet_gecerlilik_tarihi,d.ehliyet_dosyasi_url IS NULL OR d.ehliyet_gecerlilik_tarihi IS NULL),
      ('SRC Belgesi',d.src_belgesi_gecerlilik_tarihi,d.src_belge_no IS NULL OR d.src_belgesi_gecerlilik_tarihi IS NULL),
      ('Psikoteknik',d.psikoteknik_gecerlilik_tarihi,d.psikoteknik_belge_no IS NULL OR d.psikoteknik_gecerlilik_tarihi IS NULL)
    ) x(document_type,expiry_date,is_missing)
    WHERE lower(coalesce(d.status,''))=lower('Aktif')
    UNION ALL
    SELECT 'vehicle',v.id,coalesce(v.cekici_plakasi,v.vehicle_code),x.document_type,x.expiry_date,x.is_missing
    FROM public.vehicles v
    CROSS JOIN LATERAL (VALUES
      ('Ruhsat'::text,NULL::date,v.ruhsat_dosyasi_url IS NULL),
      ('Trafik Sigortası',v.trafik_sigortasi_bitis_tarihi,v.trafik_sigortasi_bitis_tarihi IS NULL),
      ('Yetki Belgesi',v.yetki_belgesi_gecerlilik_tarihi,v.yetki_belgesi IS NULL OR v.yetki_belgesi_gecerlilik_tarihi IS NULL),
      ('Kasko',v.kasko_bitis_tarihi,false)
    ) x(document_type,expiry_date,is_missing)
    WHERE lower(coalesce(v.status,''))=lower('Aktif') AND (x.document_type<>'Kasko' OR x.expiry_date IS NOT NULL)
  )
  SELECT d.entity_type,d.entity_id,d.entity_name,d.document_type,d.expiry_date,
    CASE WHEN d.expiry_date IS NULL THEN NULL ELSE d.expiry_date-current_date END,
    CASE WHEN d.is_missing OR d.expiry_date<current_date THEN 'blocked' WHEN d.expiry_date<=current_date+p_warning_days THEN 'warning' ELSE 'ok' END,
    CASE WHEN d.is_missing THEN d.document_type||' bilgisi eksik'
         WHEN d.expiry_date<current_date THEN d.document_type||' süresi geçmiş'
         WHEN d.expiry_date<=current_date+p_warning_days THEN d.document_type||' süresinin dolmasına '||(d.expiry_date-current_date)||' gün kaldı'
         ELSE d.document_type||' geçerli' END
  FROM documents d
  WHERE d.is_missing OR d.expiry_date<current_date OR d.expiry_date<=current_date+p_warning_days
  ORDER BY CASE WHEN d.is_missing OR d.expiry_date<current_date THEN 0 ELSE 1 END,d.expiry_date NULLS FIRST,d.entity_name;
END $$;

REVOKE ALL ON FUNCTION public.rex_required_license_classes(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rex_validate_assignment_with_load(uuid,uuid,numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rex_transport_compliance_alerts(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rex_validate_assignment_with_load(uuid,uuid,numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_transport_compliance_alerts(integer) TO authenticated;
