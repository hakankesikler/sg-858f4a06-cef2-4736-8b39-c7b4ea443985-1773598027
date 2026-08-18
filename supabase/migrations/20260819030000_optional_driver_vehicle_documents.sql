-- SRC, psychotechnical and traffic insurance information remain optional.
-- Missing or expired optional information must not block shipment assignment.

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

  SELECT * INTO v_vehicle FROM public.vehicles WHERE id=p_vehicle_id;
  IF NOT FOUND OR lower(coalesce(v_vehicle.status,'')) <> lower('Aktif') THEN RAISE EXCEPTION 'Aktif araç bulunamadı'; END IF;
  IF nullif(trim(v_vehicle.ruhsat_dosyasi_url),'') IS NULL THEN RAISE EXCEPTION 'Araç ruhsatı yüklenmeden atama yapılamaz'; END IF;
  IF coalesce(v_vehicle.tasima_kapasitesi_kg,0)<=0 THEN RAISE EXCEPTION 'Araç taşıma kapasitesi tanımlanmadan atama yapılamaz'; END IF;
  IF p_load_weight IS NOT NULL AND p_load_weight>v_vehicle.tasima_kapasitesi_kg THEN
    RAISE EXCEPTION 'Yük ağırlığı (%) araç kapasitesini (%) aşıyor; atama yapılamaz',p_load_weight,v_vehicle.tasima_kapasitesi_kg;
  END IF;
  IF nullif(trim(v_vehicle.yetki_belgesi),'') IS NULL OR v_vehicle.yetki_belgesi_gecerlilik_tarihi IS NULL THEN RAISE EXCEPTION 'Aracın yetki belgesi ve geçerlilik tarihi zorunludur'; END IF;
  IF v_vehicle.yetki_belgesi_gecerlilik_tarihi < current_date THEN RAISE EXCEPTION 'Aracın yetki belgesinin süresi geçmiş; atama yapılamaz'; END IF;
  IF v_vehicle.kasko_bitis_tarihi IS NOT NULL AND v_vehicle.kasko_bitis_tarihi < current_date THEN RAISE EXCEPTION 'Aracın kayıtlı kasko belgesinin süresi geçmiş; atama yapılamaz'; END IF;

  v_required:=public.rex_required_license_classes(coalesce(v_vehicle.arac_tipi,v_vehicle.vehicle_type));
  IF cardinality(v_required)=0 THEN RAISE EXCEPTION 'Araç tipi tanımlı veya desteklenen bir tip olmalıdır'; END IF;
  v_actual:=regexp_split_to_array(upper(regexp_replace(v_driver.ehliyet_sinifi,'\s','','g')),',');
  IF NOT (v_actual && v_required) THEN
    RAISE EXCEPTION 'Sürücünün ehliyet sınıfı (%) araç tipi (%) için uygun değil. Gerekli sınıflar: %',v_driver.ehliyet_sinifi,coalesce(v_vehicle.arac_tipi,v_vehicle.vehicle_type),array_to_string(v_required,', ');
  END IF;
END $$;

GRANT EXECUTE ON FUNCTION public.rex_validate_assignment_with_load(uuid,uuid,numeric) TO authenticated;
