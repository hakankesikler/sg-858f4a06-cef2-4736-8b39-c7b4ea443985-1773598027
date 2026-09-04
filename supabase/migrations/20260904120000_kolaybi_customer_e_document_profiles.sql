-- Keep the recipient e-document choice aligned with KolayBi evidence instead of
-- defaulting every customer to e-Archive.

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS kolaybi_e_document_type text,
  ADD COLUMN IF NOT EXISTS kolaybi_e_document_scenario text,
  ADD COLUMN IF NOT EXISTS kolaybi_e_document_source text,
  ADD COLUMN IF NOT EXISTS kolaybi_e_document_environment text,
  ADD COLUMN IF NOT EXISTS kolaybi_e_document_evidence_at timestamptz,
  ADD COLUMN IF NOT EXISTS kolaybi_e_document_checked_at timestamptz;

ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_kolaybi_e_document_type_check;
ALTER TABLE public.customers ADD CONSTRAINT customers_kolaybi_e_document_type_check
  CHECK (kolaybi_e_document_type IS NULL OR kolaybi_e_document_type IN ('e_invoice','e_archive'));

ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_kolaybi_e_document_scenario_check;
ALTER TABLE public.customers ADD CONSTRAINT customers_kolaybi_e_document_scenario_check
  CHECK (
    kolaybi_e_document_scenario IS NULL OR
    kolaybi_e_document_scenario IN ('EARSIVFATURA','TEMELFATURA','TICARIFATURA','KAMU')
  );

ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_kolaybi_e_document_environment_check;
ALTER TABLE public.customers ADD CONSTRAINT customers_kolaybi_e_document_environment_check
  CHECK (kolaybi_e_document_environment IS NULL OR kolaybi_e_document_environment IN ('test','live'));

CREATE INDEX IF NOT EXISTS customers_kolaybi_e_document_profile_idx
  ON public.customers(kolaybi_e_document_type, kolaybi_e_document_checked_at DESC)
  WHERE archived_at IS NULL;

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

DROP TRIGGER IF EXISTS rex_customer_e_document_defaults ON public.customers;
CREATE TRIGGER rex_customer_e_document_defaults
  AFTER UPDATE OF kolaybi_e_document_type, kolaybi_e_document_scenario ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.rex_apply_customer_e_document_defaults();

-- The customer supplied this correction explicitly. Live KolayBi evidence can
-- refresh it later; sandbox history is never allowed to downgrade live evidence.
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
    upper(coalesce(company,'')) LIKE '%TEKNİK İSTİF%' OR
    upper(coalesce(company,'')) LIKE '%TEKNIK ISTIF%' OR
    upper(coalesce(name,'')) LIKE '%TEKNİK İSTİF%' OR
    upper(coalesce(name,'')) LIKE '%TEKNIK ISTIF%'
  );

REVOKE ALL ON FUNCTION public.rex_apply_customer_e_document_defaults() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.rex_apply_customer_e_document_defaults() TO service_role;

COMMENT ON COLUMN public.customers.kolaybi_e_document_type IS
  'KolayBi resmi belge geçmişinden veya yetkili kullanıcı doğrulamasından gelen e_invoice/e_archive tercihi.';
COMMENT ON COLUMN public.customers.kolaybi_e_document_evidence_at IS
  'Belge türü kararını destekleyen en güncel KolayBi resmi fatura tarihi.';
