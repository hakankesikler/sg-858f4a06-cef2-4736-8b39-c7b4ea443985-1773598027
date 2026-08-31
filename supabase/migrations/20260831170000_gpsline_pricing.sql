-- GPSLine parsiyel maliyet ve önerilen asgari satış fiyatı altyapısı.
CREATE TABLE IF NOT EXISTS public.supplier_price_tariffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_code text NOT NULL,
  origin_zone text NOT NULL,
  destination_region text NOT NULL,
  min_chargeable_desi_kg numeric(12,2) NOT NULL DEFAULT 250 CHECK (min_chargeable_desi_kg > 0),
  cost_per_desi_kg numeric(12,4) NOT NULL CHECK (cost_per_desi_kg > 0),
  markup_rate numeric(8,6) NOT NULL DEFAULT 0.35 CHECK (markup_rate >= 0),
  currency text NOT NULL DEFAULT 'TRY' CHECK (currency IN ('TRY','USD','EUR','GBP')),
  source_document text NOT NULL,
  version_label text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT supplier_price_tariffs_unique UNIQUE (provider_code,origin_zone,destination_region,version_label)
);

CREATE INDEX IF NOT EXISTS supplier_price_tariffs_lookup_idx
  ON public.supplier_price_tariffs(provider_code,origin_zone,destination_region,active);

ALTER TABLE public.supplier_price_tariffs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.supplier_price_tariffs FROM PUBLIC, anon;
GRANT SELECT ON public.supplier_price_tariffs TO authenticated;

DROP POLICY IF EXISTS supplier_price_tariffs_read ON public.supplier_price_tariffs;
CREATE POLICY supplier_price_tariffs_read ON public.supplier_price_tariffs
FOR SELECT TO authenticated
USING (
  (public.rex_has_role(ARRAY['admin']) AND lower(coalesce(auth.jwt()->>'email',''))='info@rexlojistik.com')
  OR public.rex_has_permission('crm.sales_pipeline','view')
  OR public.rex_has_permission('operations.shipments','view')
);

CREATE OR REPLACE FUNCTION public.rex_calculate_gpsline_price(
  p_origin text,
  p_destination text,
  p_total_desi_kg numeric,
  p_pallet_count integer
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_allowed boolean;
  v_origin_key text := public.rex_location_key(p_origin);
  v_destination_key text := public.rex_location_key(p_destination);
  v_origin_zone text;
  v_tariff public.supplier_price_tariffs%ROWTYPE;
  v_chargeable numeric;
  v_base_desi numeric;
  v_excess_desi numeric;
  v_base_cost numeric;
  v_excess_cost numeric;
  v_cost numeric;
  v_recommended numeric;
BEGIN
  v_allowed := (public.rex_has_role(ARRAY['admin']) AND lower(coalesce(auth.jwt()->>'email',''))='info@rexlojistik.com')
    OR public.rex_has_permission('crm.sales_pipeline','view')
    OR public.rex_has_permission('operations.shipments','view');
  IF NOT v_allowed THEN RAISE EXCEPTION 'GPSLine maliyet bilgisine erişim yetkiniz yok'; END IF;
  IF coalesce(p_pallet_count,0) <= 0 THEN RAISE EXCEPTION 'Palet adedi en az 1 olmalıdır'; END IF;
  IF coalesce(p_total_desi_kg,0) <= 0 THEN RAISE EXCEPTION 'Toplam desi/kg sıfırdan büyük olmalıdır'; END IF;

  v_origin_zone := CASE
    WHEN v_origin_key IN ('izmir','manisa','izmirmanisa') THEN 'İzmir & Manisa'
    WHEN v_origin_key IN ('istanbulanadolu','anadolu') THEN 'İstanbul Anadolu'
    WHEN v_origin_key IN ('istanbulavrupa','avrupa') THEN 'İstanbul Avrupa'
    ELSE NULL
  END;
  IF v_origin_zone IS NULL THEN
    RAISE EXCEPTION 'GPSLine maliyet tarifesi yalnızca İzmir/Manisa, İstanbul Anadolu ve İstanbul Avrupa çıkışları için tanımlıdır';
  END IF;

  SELECT * INTO v_tariff
  FROM public.supplier_price_tariffs t
  WHERE t.provider_code='gpsline' AND t.active
    AND t.origin_zone=v_origin_zone
    AND public.rex_location_key(t.destination_region)=v_destination_key
  ORDER BY t.created_at DESC
  LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'GPSLine maliyet listesinde bu varış ili için fiyat bulunamadı'; END IF;

  v_base_desi := v_tariff.min_chargeable_desi_kg;
  v_excess_desi := greatest(p_total_desi_kg-v_tariff.min_chargeable_desi_kg,0);
  v_chargeable := v_base_desi+v_excess_desi;
  v_base_cost := round(v_base_desi*v_tariff.cost_per_desi_kg,2);
  v_excess_cost := round(v_excess_desi*v_tariff.cost_per_desi_kg,2);
  v_cost := round(v_base_cost+v_excess_cost,2);
  v_recommended := round(v_cost*(1+v_tariff.markup_rate),2);

  RETURN jsonb_build_object(
    'provider_code','gpsline',
    'origin_zone',v_origin_zone,
    'destination_region',v_tariff.destination_region,
    'pallet_count',p_pallet_count,
    'entered_total_desi_kg',p_total_desi_kg,
    'chargeable_desi_kg',v_chargeable,
    'minimum_charge_applied',p_total_desi_kg < v_tariff.min_chargeable_desi_kg,
    'base_desi_kg',v_base_desi,
    'excess_desi_kg',v_excess_desi,
    'cost_per_desi_kg',v_tariff.cost_per_desi_kg,
    'base_cost_amount',v_base_cost,
    'excess_cost_amount',v_excess_cost,
    'cost_amount',v_cost,
    'markup_rate',v_tariff.markup_rate,
    'sales_margin_rate',round((v_recommended-v_cost)/nullif(v_recommended,0),6),
    'recommended_sale_per_desi_kg',round(v_tariff.cost_per_desi_kg*(1+v_tariff.markup_rate),4),
    'recommended_sale_amount',v_recommended,
    'gross_profit_amount',round(v_recommended-v_cost,2),
    'currency',v_tariff.currency,
    'source_document',v_tariff.source_document,
    'version_label',v_tariff.version_label,
    'pricing_note','250 desi/kg minimum fiyatlama basamağıdır; üst sınır değildir. Toplam 250''yi aşarsa artan kısım aynı il bazlı desi/kg birim fiyatıyla eklenir. Önerilen satış fiyatı maliyet üzerine %35 eklenerek hesaplanır.'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.rex_calculate_gpsline_price(text,text,numeric,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rex_calculate_gpsline_price(text,text,numeric,integer) TO authenticated;

INSERT INTO public.supplier_price_tariffs (
  provider_code,origin_zone,destination_region,min_chargeable_desi_kg,
  cost_per_desi_kg,markup_rate,currency,source_document,version_label,active
) VALUES
('gpsline','İzmir & Manisa','Adana',250,9.0900,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Adana',250,9.1500,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Adana',250,9.7400,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Adıyaman',250,10.4500,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Adıyaman',250,10.7400,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Adıyaman',250,10.4400,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Afyonkarahisar',250,6.6100,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Afyonkarahisar',250,9.2900,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Afyonkarahisar',250,9.8100,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Ağrı',250,14.6200,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Ağrı',250,13.3700,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Ağrı',250,13.8200,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Amasya',250,11.2800,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Amasya',250,10.2000,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Amasya',250,10.7700,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Ankara',250,7.1600,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Ankara',250,6.7100,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Ankara',250,7.2500,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Antalya',250,9.2300,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Antalya',250,9.3100,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Antalya',250,9.9400,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Artvin',250,14.5500,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Artvin',250,13.2700,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Artvin',250,13.7200,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Aydın',250,5.3300,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Aydın',250,8.0000,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Aydın',250,8.5000,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Balıkesir',250,6.5600,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Balıkesir',250,9.2300,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Balıkesir',250,9.7500,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Bilecik',250,6.6500,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Bilecik',250,6.4400,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Bilecik',250,7.1600,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Bingöl',250,12.2200,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Bingöl',250,12.5600,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Bingöl',250,12.5600,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Bitlis',250,13.5100,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Bitlis',250,12.9200,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Bitlis',250,13.3000,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Bolu',250,7.4200,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Bolu',250,6.8400,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Bolu',250,7.5500,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Burdur',250,6.8200,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Burdur',250,9.5400,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Burdur',250,10.0900,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Bursa',250,7.6500,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Bursa',250,7.5600,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Bursa',250,8.2600,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Çanakkale',250,7.5100,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Çanakkale',250,10.2700,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Çanakkale',250,10.8300,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Çankırı',250,8.4400,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Çankırı',250,7.9900,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Çankırı',250,8.4400,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Çorum',250,11.6500,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Çorum',250,10.5700,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Çorum',250,11.1100,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Denizli',250,7.3500,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Denizli',250,8.7900,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Denizli',250,9.2900,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Diyarbakır',250,11.2400,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Diyarbakır',250,11.7100,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Diyarbakır',250,11.7500,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Edirne',250,8.6300,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Edirne',250,7.1500,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Edirne',250,6.1200,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Elazığ',250,11.3700,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Elazığ',250,11.4300,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Elazığ',250,11.9400,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Erzincan',250,14.6200,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Erzincan',250,13.3700,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Erzincan',250,13.8200,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Erzurum',250,12.1300,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Erzurum',250,11.0200,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Erzurum',250,11.5200,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Eskişehir',250,6.6500,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Eskişehir',250,6.4400,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Eskişehir',250,7.1600,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Gaziantep',250,9.5800,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Gaziantep',250,9.9400,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Gaziantep',250,9.6200,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Giresun',250,11.0900,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Giresun',250,9.9900,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Giresun',250,10.5300,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Gümüşhane',250,14.6200,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Gümüşhane',250,13.3700,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Gümüşhane',250,13.8200,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Hakkari',250,13.5100,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Hakkari',250,12.9200,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Hakkari',250,13.3000,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Hatay',250,9.9900,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Hatay',250,10.0400,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Hatay',250,10.5700,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Isparta',250,7.2400,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Isparta',250,10.0200,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Isparta',250,10.5300,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Mersin',250,9.6000,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Mersin',250,9.6400,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Mersin',250,10.2300,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','İstanbul-Anadolu',250,7.6500,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','İstanbul-Anadolu',250,5.4500,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','İstanbul-Anadolu',250,6.2200,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','İstanbul-Avrupa',250,8.1800,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','İstanbul-Avrupa',250,6.7000,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','İstanbul-Avrupa',250,5.7100,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','İzmir',250,5.5500,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','İzmir',250,7.6400,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','İzmir',250,7.8000,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Kars',250,14.6200,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Kars',250,13.3700,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Kars',250,13.8200,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Kastamonu',250,11.6800,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Kastamonu',250,10.6100,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Kastamonu',250,11.1400,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Kayseri',250,8.1500,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Kayseri',250,8.1800,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Kayseri',250,8.3100,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Kırklareli',250,8.5300,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Kırklareli',250,7.0600,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Kırklareli',250,6.0500,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Kırşehir',250,9.4800,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Kırşehir',250,9.4300,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Kırşehir',250,9.5600,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Kocaeli',250,7.8900,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Kocaeli',250,5.6400,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Kocaeli',250,6.3900,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Konya',250,7.4900,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Konya',250,7.9000,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Konya',250,8.0500,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Kütahya',250,6.8200,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Kütahya',250,9.5400,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Kütahya',250,10.0500,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Malatya',250,10.3400,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Malatya',250,10.4400,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Malatya',250,10.9700,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Manisa',250,5.6100,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Manisa',250,7.6900,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Manisa',250,7.9000,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Kahramanmaraş',250,10.3400,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Kahramanmaraş',250,10.6400,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Kahramanmaraş',250,10.3400,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Mardin',250,13.0700,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Mardin',250,13.4600,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Mardin',250,13.4200,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Muğla',250,7.0200,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Muğla',250,9.8100,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Muğla',250,10.2700,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Muş',250,12.8300,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Muş',250,13.2000,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Muş',250,13.2000,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Nevşehir',250,9.4800,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Nevşehir',250,9.4300,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Nevşehir',250,9.5600,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Niğde',250,9.4800,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Niğde',250,9.4300,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Niğde',250,9.5600,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Ordu',250,10.5700,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Ordu',250,9.4500,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Ordu',250,10.0500,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Rize',250,13.3000,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Rize',250,12.0700,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Rize',250,12.5500,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Sakarya',250,8.3400,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Sakarya',250,7.7400,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Sakarya',250,8.4100,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Samsun',250,10.1700,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Samsun',250,9.1100,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Samsun',250,9.6900,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Siirt',250,11.8800,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Siirt',250,12.2600,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Siirt',250,12.2700,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Sinop',250,11.2200,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Sinop',250,10.1000,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Sinop',250,10.6400,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Sivas',250,9.8300,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Sivas',250,9.7500,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Sivas',250,9.8500,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Tekirdağ',250,8.3100,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Tekirdağ',250,6.8400,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Tekirdağ',250,5.8500,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Tokat',250,11.0900,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Tokat',250,10.0400,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Tokat',250,10.5700,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Trabzon',250,12.2800,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Trabzon',250,11.1400,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Trabzon',250,11.6500,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Tunceli',250,11.3700,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Tunceli',250,11.4300,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Tunceli',250,11.9400,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Şanlıurfa',250,10.4500,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Şanlıurfa',250,10.7400,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Şanlıurfa',250,10.4400,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Uşak',250,8.0400,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Uşak',250,10.8500,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Uşak',250,11.3700,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Van',250,12.3500,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Van',250,11.7700,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Van',250,12.2600,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Yozgat',250,10.6600,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Yozgat',250,10.6100,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Yozgat',250,10.6400,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Zonguldak',250,8.5200,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Zonguldak',250,7.9000,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Zonguldak',250,8.5300,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Aksaray',250,9.6000,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Aksaray',250,9.5600,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Aksaray',250,9.6400,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Bayburt',250,14.6200,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Bayburt',250,13.3700,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Bayburt',250,13.8200,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Karaman',250,8.0000,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Karaman',250,8.4100,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Karaman',250,8.5300,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Kırıkkale',250,8.5900,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Kırıkkale',250,8.1000,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Kırıkkale',250,8.5900,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Batman',250,11.8200,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Batman',250,12.2200,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Batman',250,12.2300,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Şırnak',250,12.8300,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Şırnak',250,13.2000,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Şırnak',250,13.2000,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Bartın',250,8.9000,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Bartın',250,8.2900,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Bartın',250,8.9000,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Ardahan',250,14.6200,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Ardahan',250,13.3700,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Ardahan',250,13.8200,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Iğdır',250,14.6200,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Iğdır',250,13.3700,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Iğdır',250,13.8200,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Yalova',250,8.6500,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Yalova',250,8.5000,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Yalova',250,9.1500,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Karabük',250,8.9000,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Karabük',250,8.2900,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Karabük',250,8.9000,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Kilis',250,10.3400,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Kilis',250,10.6400,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Kilis',250,10.3400,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Osmaniye',250,10.3400,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Osmaniye',250,10.3600,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Osmaniye',250,10.9000,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İzmir & Manisa','Düzce',250,7.0600,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Anadolu','Düzce',250,6.5100,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true),
('gpsline','İstanbul Avrupa','Düzce',250,7.2200,0.35,'TRY','gpsline maliyet listesi.xlsx','2026-08-31-upload',true)
ON CONFLICT (provider_code,origin_zone,destination_region,version_label)
DO UPDATE SET
  min_chargeable_desi_kg=EXCLUDED.min_chargeable_desi_kg,
  cost_per_desi_kg=EXCLUDED.cost_per_desi_kg,
  markup_rate=EXCLUDED.markup_rate,
  currency=EXCLUDED.currency,
  source_document=EXCLUDED.source_document,
  active=true,
  updated_at=now();

COMMENT ON TABLE public.supplier_price_tariffs IS 'Tedarikçi bazlı il ve çıkış bölgesi maliyet tarifeleri';
COMMENT ON FUNCTION public.rex_calculate_gpsline_price(text,text,numeric,integer) IS 'GPSLine toplu desi/kg; ilk 250 minimum, artan desi ve maliyet üzerine yüzde 35 satış önerisi hesabı';

