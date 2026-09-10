-- Yeni bir carinin KolayBi'de geçmiş resmî faturası bulunmayabilir. Böyle bir
-- durumda satış taslağını engelleme; çalışan seçimi olmayan geçici bir değerle
-- kaydet. Gerçek E-Fatura/E-Arşiv senaryosu KolayBi tarafından resmileştirme
-- anında belirlenir ve uygulama cevaptan hem faturayı hem cari profilini günceller.

CREATE OR REPLACE FUNCTION public.rex_enforce_customer_e_document_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public,pg_temp AS $$
DECLARE
  v_type text;
  v_scenario text;
  v_environment text;
BEGIN
  SELECT kolaybi_e_document_type, kolaybi_e_document_scenario, kolaybi_e_document_environment
    INTO v_type, v_scenario, v_environment
  FROM public.customers
  WHERE id = NEW.customer_id
    AND archived_at IS NULL;

  IF v_type IN ('e_invoice','e_archive') AND
     v_scenario IN ('EARSIVFATURA','TEMELFATURA','TICARIFATURA','KAMU') AND
     v_environment = 'live' THEN
    NEW.document_type := v_type;
    NEW.document_scenario := CASE
      WHEN v_type = 'e_archive' THEN 'EARSIVFATURA'
      WHEN v_scenario = 'EARSIVFATURA' THEN 'TEMELFATURA'
      ELSE v_scenario
    END;
  ELSE
    -- Yalnızca yerel taslağın mevcut NOT NULL/kontrol kurallarını karşılayan
    -- geçici değerlerdir; KolayBi'ye doğrulanmış senaryo olarak gönderilmez.
    NEW.document_type := 'e_archive';
    NEW.document_scenario := 'EARSIVFATURA';
  END IF;

  RETURN NEW;
END $$;

REVOKE ALL ON FUNCTION public.rex_enforce_customer_e_document_profile() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.rex_enforce_customer_e_document_profile() TO service_role;

COMMENT ON FUNCTION public.rex_enforce_customer_e_document_profile() IS
  'Doğrulanmış cari profilini uygular; yeni carilerde taslağı engellemeden KolayBi mükellefiyet kararını bekler.';
