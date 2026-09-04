-- Reconcile KolayBi evidence through an explicit service-role-only function
-- while direct client updates remain blocked by the invoice field guard.

CREATE OR REPLACE FUNCTION public.rex_apply_customer_e_document_defaults()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public,pg_temp AS $$
BEGIN
  IF NEW.kolaybi_e_document_type IS NULL OR
     (NEW.kolaybi_e_document_type IS NOT DISTINCT FROM OLD.kolaybi_e_document_type AND
      NEW.kolaybi_e_document_scenario IS NOT DISTINCT FROM OLD.kolaybi_e_document_scenario) THEN
    RETURN NEW;
  END IF;

  PERFORM set_config('rex.invoice_sync','on',true);
  UPDATE public.sales_invoices
  SET document_type = NEW.kolaybi_e_document_type,
      document_scenario = CASE
        WHEN NEW.kolaybi_e_document_type = 'e_archive' THEN 'EARSIVFATURA'
        WHEN NEW.kolaybi_e_document_scenario IN ('TEMELFATURA','TICARIFATURA','KAMU')
          THEN NEW.kolaybi_e_document_scenario
        ELSE 'TEMELFATURA'
      END,
      updated_at = now()
  WHERE customer_id = NEW.id
    AND kolaybi_document_id IS NULL
    AND integration_status IN ('draft','queued','mapping_required','failed');

  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.rex_reconcile_sales_invoice_from_provider(
  p_invoice_id uuid,
  p_provider_status text,
  p_kolaybi_status text,
  p_e_invoice_status text,
  p_has_profile boolean,
  p_document_type text,
  p_document_scenario text,
  p_official_uuid text,
  p_official_invoice_no text,
  p_payment_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public,pg_temp AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Bu işlem yalnızca güvenli entegrasyon servisi tarafından yapılabilir';
  END IF;
  IF p_has_profile AND p_document_type NOT IN ('e_invoice','e_archive') THEN
    RAISE EXCEPTION 'Geçersiz e-belge türü';
  END IF;
  IF p_has_profile AND p_document_scenario NOT IN ('EARSIVFATURA','TEMELFATURA','TICARIFATURA','KAMU') THEN
    RAISE EXCEPTION 'Geçersiz e-belge senaryosu';
  END IF;
  IF p_payment_status IS NOT NULL AND p_payment_status NOT IN ('Bekliyor','Kısmi Ödendi','Ödendi','Gecikmiş','İptal') THEN
    RAISE EXCEPTION 'Geçersiz ödeme durumu';
  END IF;

  PERFORM set_config('rex.invoice_sync','on',true);
  UPDATE public.sales_invoices
  SET provider_status = p_provider_status,
      kolaybi_status = p_kolaybi_status,
      e_invoice_status = p_e_invoice_status,
      document_type = CASE WHEN p_has_profile THEN p_document_type ELSE document_type END,
      document_scenario = CASE WHEN p_has_profile THEN p_document_scenario ELSE document_scenario END,
      official_uuid = CASE WHEN p_has_profile THEN nullif(trim(p_official_uuid),'') ELSE official_uuid END,
      official_invoice_no = CASE WHEN p_has_profile THEN nullif(trim(p_official_invoice_no),'') ELSE official_invoice_no END,
      payment_status = coalesce(p_payment_status,payment_status),
      last_status_check_at = now(),
      updated_at = now()
  WHERE id = p_invoice_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'Fatura bulunamadı'; END IF;
END $$;

REVOKE ALL ON FUNCTION public.rex_apply_customer_e_document_defaults() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.rex_apply_customer_e_document_defaults() TO service_role;
REVOKE ALL ON FUNCTION public.rex_reconcile_sales_invoice_from_provider(uuid,text,text,text,boolean,text,text,text,text,text)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.rex_reconcile_sales_invoice_from_provider(uuid,text,text,text,boolean,text,text,text,text,text)
  TO service_role;

