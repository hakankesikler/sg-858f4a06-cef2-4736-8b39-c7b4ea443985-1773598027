-- E-Fatura/E-Arsiv secimini calisana birakma. Fatura olusturulurken
-- cari kartindaki KolayBi/yonetici tarafindan dogrulanmis profil tek kaynaktir.

UPDATE public.customers
SET kolaybi_e_document_type = 'e_invoice',
    kolaybi_e_document_scenario = 'TEMELFATURA',
    kolaybi_e_document_source = 'owner_confirmed',
    kolaybi_e_document_environment = 'live',
    kolaybi_e_document_evidence_at = now(),
    kolaybi_e_document_checked_at = now(),
    updated_at = now()
WHERE archived_at IS NULL
  AND (
    upper(coalesce(company, '')) LIKE '%TUSAN MOTOR%' OR
    upper(coalesce(company, '')) LIKE '%TUŞAN MOTOR%' OR
    upper(coalesce(company, '')) LIKE '%TUSAN OTO%' OR
    upper(coalesce(name, '')) LIKE '%TUSAN MOTOR%' OR
    upper(coalesce(name, '')) LIKE '%TUŞAN MOTOR%' OR
    upper(coalesce(name, '')) LIKE '%TUSAN OTO%'
  );

CREATE OR REPLACE FUNCTION public.rex_enforce_customer_e_document_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public,pg_temp AS $$
DECLARE
  v_type text;
  v_scenario text;
BEGIN
  SELECT kolaybi_e_document_type, kolaybi_e_document_scenario
    INTO v_type, v_scenario
  FROM public.customers
  WHERE id = NEW.customer_id
    AND archived_at IS NULL;

  IF v_type NOT IN ('e_invoice','e_archive') OR
     v_scenario NOT IN ('EARSIVFATURA','TEMELFATURA','TICARIFATURA','KAMU') THEN
    RAISE EXCEPTION 'Cari e-belge türü henüz otomatik doğrulanmadı. KolayBi senkronizasyonunu tamamlayın.';
  END IF;

  NEW.document_type := v_type;
  NEW.document_scenario := CASE
    WHEN v_type = 'e_archive' THEN 'EARSIVFATURA'
    WHEN v_scenario = 'EARSIVFATURA' THEN 'TEMELFATURA'
    ELSE v_scenario
  END;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS rex_sales_invoice_customer_e_document_profile ON public.sales_invoices;
CREATE TRIGGER rex_sales_invoice_customer_e_document_profile
  BEFORE INSERT ON public.sales_invoices
  FOR EACH ROW EXECUTE FUNCTION public.rex_enforce_customer_e_document_profile();

REVOKE ALL ON FUNCTION public.rex_enforce_customer_e_document_profile() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.rex_enforce_customer_e_document_profile() TO service_role;

COMMENT ON FUNCTION public.rex_enforce_customer_e_document_profile() IS
  'Satış faturasında e-belge türünü kullanıcı girdisinden değil doğrulanmış cari profilinden zorunlu olarak belirler.';
