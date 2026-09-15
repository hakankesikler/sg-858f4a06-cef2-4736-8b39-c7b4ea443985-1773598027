BEGIN;

-- Finansal performans raporu yalnızca gerçek belge tarihi doğrulanmış faaliyet
-- giderlerini kullanır. Finansman ve yatırım harcamaları ayrı sınıflandırılır.
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS provider_issue_date date,
  ADD COLUMN IF NOT EXISTS reporting_date_status text NOT NULL DEFAULT 'verified',
  ADD COLUMN IF NOT EXISTS reporting_classification text NOT NULL DEFAULT 'operating_expense';

UPDATE public.expenses
SET reporting_classification = CASE lower(btrim(coalesce(category, '')))
  WHEN 'finansal' THEN 'financing'
  WHEN 'demirbaş' THEN 'capital_expenditure'
  ELSE 'operating_expense'
END;

-- Önceki KolayBi senkronizasyonu tarih gelmediğinde senkronizasyon gününü
-- kullanıyordu. Bu kayıtlar gerçek belge detayı yeniden okunana kadar hiçbir
-- döneme yazılmaz; böylece Eylül gibi tek bir aya yapay gider yüklenmez.
UPDATE public.expenses
SET
  provider_issue_date = NULL,
  expense_date = NULL,
  reporting_date_status = 'unverified',
  updated_at = now()
WHERE source = 'kolaybi';

ALTER TABLE public.expenses
  ADD CONSTRAINT expenses_reporting_date_status_check
    CHECK (reporting_date_status IN ('verified','unverified')),
  ADD CONSTRAINT expenses_reporting_classification_check
    CHECK (reporting_classification IN ('operating_expense','financing','capital_expenditure','excluded')),
  ADD CONSTRAINT expenses_kolaybi_verified_date_check
    CHECK (
      source <> 'kolaybi'
      OR reporting_date_status <> 'verified'
      OR (provider_issue_date IS NOT NULL AND expense_date = provider_issue_date)
    );

CREATE INDEX IF NOT EXISTS expenses_financial_reporting_idx
  ON public.expenses(expense_date,currency)
  WHERE reporting_date_status = 'verified'
    AND reporting_classification = 'operating_expense';

CREATE OR REPLACE VIEW public.rex_financial_reportable_expenses
WITH (security_invoker = true)
AS
SELECT
  e.id,
  e.expense_date,
  e.amount,
  e.currency,
  e.status
FROM public.expenses e
WHERE e.reporting_date_status = 'verified'
  AND e.reporting_classification = 'operating_expense';

REVOKE ALL ON public.rex_financial_reportable_expenses FROM anon, authenticated;

COMMENT ON COLUMN public.expenses.provider_issue_date IS
  'Harici muhasebe kaynağındaki doğrulanmış belge tarihi.';
COMMENT ON COLUMN public.expenses.reporting_date_status IS
  'Belge tarihinin finansal dönem raporlaması için doğrulanıp doğrulanmadığı.';
COMMENT ON COLUMN public.expenses.reporting_classification IS
  'Faaliyet gideri, finansman veya yatırım harcaması raporlama sınıfı.';
COMMENT ON VIEW public.rex_financial_reportable_expenses IS
  'Finansal performans için doğrulanmış faaliyet giderleri; finansman ve yatırım harcamalarını içermez.';

-- Mevcut RPC'nin erişim kontrollerini ve diğer hesaplarını aynen koruyup yalnızca
-- gider kaynağını doğrulanmış raporlama görünümüne yönlendirir.
DO $$
DECLARE
  v_definition text;
BEGIN
  v_definition := pg_get_functiondef(
    'public.rex_financial_dashboard(integer,integer,text)'::regprocedure
  );

  IF position('FROM public.rex_financial_reportable_expenses e' IN v_definition) > 0 THEN
    RETURN;
  END IF;

  IF position('FROM public.expenses e' IN v_definition) = 0 THEN
    RAISE EXCEPTION 'rex_financial_dashboard gider kaynağı beklenen yapıda değil';
  END IF;

  EXECUTE replace(
    v_definition,
    'FROM public.expenses e',
    'FROM public.rex_financial_reportable_expenses e'
  );
END $$;

COMMIT;
