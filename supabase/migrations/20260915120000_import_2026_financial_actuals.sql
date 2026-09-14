BEGIN;

CREATE TABLE IF NOT EXISTS public.management_financial_actuals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actual_date date NOT NULL,
  granularity text NOT NULL CHECK (granularity IN ('day', 'month')),
  currency text NOT NULL DEFAULT 'TRY' CHECK (currency IN ('TRY','EUR','USD','GBP')),
  revenue numeric(20,6) NOT NULL DEFAULT 0 CHECK (revenue >= 0),
  direct_cost numeric(20,6) NOT NULL DEFAULT 0 CHECK (direct_cost >= 0),
  record_count integer CHECK (record_count IS NULL OR record_count >= 0),
  source_name text NOT NULL,
  source_reference text NOT NULL,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (actual_date, granularity, currency)
);

CREATE TABLE IF NOT EXISTS public.management_financial_cutovers (
  currency text PRIMARY KEY CHECK (currency IN ('TRY','EUR','USD','GBP')),
  legacy_from_date date NOT NULL,
  live_from_date date NOT NULL,
  source_name text NOT NULL,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (legacy_from_date < live_from_date)
);

ALTER TABLE public.management_financial_actuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.management_financial_cutovers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rex_management_financial_actuals_select ON public.management_financial_actuals;
CREATE POLICY rex_management_financial_actuals_select ON public.management_financial_actuals
  FOR SELECT TO authenticated
  USING (public.rex_has_permission('reports.accounting', 'view'));

DROP POLICY IF EXISTS rex_management_financial_actuals_manage ON public.management_financial_actuals;
CREATE POLICY rex_management_financial_actuals_manage ON public.management_financial_actuals
  FOR ALL TO authenticated
  USING (public.rex_has_permission('reports.accounting', 'manage'))
  WITH CHECK (public.rex_has_permission('reports.accounting', 'manage'));

DROP POLICY IF EXISTS rex_management_financial_cutovers_select ON public.management_financial_cutovers;
CREATE POLICY rex_management_financial_cutovers_select ON public.management_financial_cutovers
  FOR SELECT TO authenticated
  USING (public.rex_has_permission('reports.accounting', 'view'));

DROP POLICY IF EXISTS rex_management_financial_cutovers_manage ON public.management_financial_cutovers;
CREATE POLICY rex_management_financial_cutovers_manage ON public.management_financial_cutovers
  FOR ALL TO authenticated
  USING (public.rex_has_permission('reports.accounting', 'manage'))
  WITH CHECK (public.rex_has_permission('reports.accounting', 'manage'));

CREATE OR REPLACE FUNCTION public.rex_touch_management_financial_actual()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at := now();
  NEW.updated_by := auth.uid();
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := coalesce(NEW.created_by, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rex_management_financial_actuals_touch ON public.management_financial_actuals;
CREATE TRIGGER rex_management_financial_actuals_touch
  BEFORE INSERT OR UPDATE ON public.management_financial_actuals
  FOR EACH ROW EXECUTE FUNCTION public.rex_touch_management_financial_actual();

DROP TRIGGER IF EXISTS rex_management_financial_cutovers_touch ON public.management_financial_cutovers;
CREATE TRIGGER rex_management_financial_cutovers_touch
  BEFORE INSERT OR UPDATE ON public.management_financial_cutovers
  FOR EACH ROW EXECUTE FUNCTION public.rex_touch_management_financial_actual();

INSERT INTO public.management_financial_cutovers (
  currency, legacy_from_date, live_from_date, source_name, notes
)
VALUES (
  'TRY',
  DATE '2026-01-01',
  DATE '2026-09-09',
  '2026 002 REX LOJİSTİK.xlsx + canlı TMS karşılaştırması',
  '1 Ocak-8 Eylül Excel gerçekleşenleri; 9 Eylül ve sonrası canlı sevkiyat kayıtları. Çift sayımı engelleyen doğrulanmış kesim.'
)
ON CONFLICT (currency) DO NOTHING;

-- Ocak-Haziran için kaynak çalışma kitabında yalnızca doğrulanmış aylık özet
-- bulunuyor. Günlük kayıt uydurulmaması için record_count boş bırakılır.
INSERT INTO public.management_financial_actuals (
  actual_date, granularity, currency, revenue, direct_cost, record_count,
  source_name, source_reference, notes
)
VALUES
  (DATE '2026-01-01', 'month', 'TRY', 1454749.14, 1013462.6856, NULL, '2026 002 REX LOJİSTİK.xlsx', 'CİRO:H3:S3', 'Doğrulanmış aylık özet'),
  (DATE '2026-02-01', 'month', 'TRY', 1138837.21,  749351.1530, NULL, '2026 002 REX LOJİSTİK.xlsx', 'CİRO:H3:S3', 'Doğrulanmış aylık özet'),
  (DATE '2026-03-01', 'month', 'TRY', 1156718.00,  754811.0464, NULL, '2026 002 REX LOJİSTİK.xlsx', 'CİRO:H3:S3', 'Doğrulanmış aylık özet'),
  (DATE '2026-04-01', 'month', 'TRY', 1659930.6651,1113924.5060, NULL, '2026 002 REX LOJİSTİK.xlsx', 'CİRO:H3:S3', 'Doğrulanmış aylık özet'),
  (DATE '2026-05-01', 'month', 'TRY', 1197482.88025,777295.8700, NULL, '2026 002 REX LOJİSTİK.xlsx', 'CİRO:H3:S3', 'Doğrulanmış aylık özet'),
  (DATE '2026-06-01', 'month', 'TRY', 1487893.78,  964805.1400, NULL, '2026 002 REX LOJİSTİK.xlsx', 'CİRO:H3:S3', 'Doğrulanmış aylık özet')
ON CONFLICT (actual_date, granularity, currency) DO NOTHING;

-- 1 Temmuz-8 Eylül için kaynak çalışma kitabının ham iş satırlarından
-- toplanan günlük gerçekleşenler. 9 Eylül sonrası canlı TMS yetkilidir.
INSERT INTO public.management_financial_actuals (
  actual_date, granularity, currency, revenue, direct_cost, record_count,
  source_name, source_reference
)
VALUES
('2026-07-01', 'day', 'TRY', 28200.00, 19449.00, 5, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-07-01'),
  ('2026-07-02', 'day', 'TRY', 113932.76, 72615.07, 12, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-07-02'),
  ('2026-07-03', 'day', 'TRY', 53550.00, 47249.00, 6, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-07-03'),
  ('2026-07-04', 'day', 'TRY', 27550.00, 20649.00, 5, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-07-04'),
  ('2026-07-05', 'day', 'TRY', 1300.00, 0.00, 1, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-07-05'),
  ('2026-07-06', 'day', 'TRY', 39800.00, 33149.00, 6, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-07-06'),
  ('2026-07-07', 'day', 'TRY', 109300.00, 71749.00, 7, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-07-07'),
  ('2026-07-08', 'day', 'TRY', 36800.00, 27249.00, 4, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-07-08'),
  ('2026-07-09', 'day', 'TRY', 94283.80, 72109.80, 8, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-07-09'),
  ('2026-07-10', 'day', 'TRY', 40650.00, 26249.00, 6, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-07-10'),
  ('2026-07-11', 'day', 'TRY', 11100.00, 6249.00, 2, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-07-11'),
  ('2026-07-12', 'day', 'TRY', 2600.00, 0.00, 1, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-07-12'),
  ('2026-07-13', 'day', 'TRY', 100500.00, 65314.00, 9, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-07-13'),
  ('2026-07-14', 'day', 'TRY', 91600.00, 58449.00, 8, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-07-14'),
  ('2026-07-15', 'day', 'TRY', 25100.00, 17249.00, 3, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-07-15'),
  ('2026-07-16', 'day', 'TRY', 58160.86, 38788.44, 4, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-07-16'),
  ('2026-07-17', 'day', 'TRY', 53200.00, 30152.60, 9, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-07-17'),
  ('2026-07-18', 'day', 'TRY', 35850.00, 28749.00, 4, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-07-18'),
  ('2026-07-19', 'day', 'TRY', 2600.00, 0.00, 1, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-07-19'),
  ('2026-07-20', 'day', 'TRY', 38328.52, 21193.25, 7, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-07-20'),
  ('2026-07-21', 'day', 'TRY', 55800.00, 41849.00, 9, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-07-21'),
  ('2026-07-22', 'day', 'TRY', 77100.00, 48079.00, 10, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-07-22'),
  ('2026-07-23', 'day', 'TRY', 36250.00, 23449.00, 8, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-07-23'),
  ('2026-07-24', 'day', 'TRY', 56472.88, 26942.22, 12, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-07-24'),
  ('2026-07-25', 'day', 'TRY', 11850.00, 6249.00, 3, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-07-25'),
  ('2026-07-26', 'day', 'TRY', 2600.00, 0.00, 1, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-07-26'),
  ('2026-07-27', 'day', 'TRY', 56591.28, 33287.78, 8, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-07-27'),
  ('2026-07-28', 'day', 'TRY', 54150.00, 33649.00, 9, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-07-28'),
  ('2026-07-29', 'day', 'TRY', 55950.00, 37249.00, 7, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-07-29'),
  ('2026-07-30', 'day', 'TRY', 48600.00, 32249.00, 5, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-07-30'),
  ('2026-07-31', 'day', 'TRY', 19850.00, 15749.00, 6, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-07-31'),
  ('2026-08-01', 'day', 'TRY', 11850.00, 6249.00, 3, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-08-01'),
  ('2026-08-02', 'day', 'TRY', 2600.00, 0.00, 1, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-08-02'),
  ('2026-08-03', 'day', 'TRY', 82268.00, 52814.00, 10, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-08-03'),
  ('2026-08-04', 'day', 'TRY', 63600.00, 36249.00, 8, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-08-04'),
  ('2026-08-05', 'day', 'TRY', 73150.00, 52149.00, 10, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-08-05'),
  ('2026-08-06', 'day', 'TRY', 58850.00, 29249.00, 7, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-08-06'),
  ('2026-08-07', 'day', 'TRY', 81100.00, 61249.00, 8, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-08-07'),
  ('2026-08-08', 'day', 'TRY', 2600.00, 0.00, 1, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-08-08'),
  ('2026-08-09', 'day', 'TRY', 2600.00, 0.00, 1, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-08-09'),
  ('2026-08-10', 'day', 'TRY', 148000.00, 70958.00, 8, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-08-10'),
  ('2026-08-11', 'day', 'TRY', 36500.00, 25066.00, 7, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-08-11'),
  ('2026-08-12', 'day', 'TRY', 28300.00, 19400.00, 4, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-08-12'),
  ('2026-08-13', 'day', 'TRY', 55150.00, 35152.50, 8, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-08-13'),
  ('2026-08-14', 'day', 'TRY', 9536.00, 5450.00, 2, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-08-14'),
  ('2026-08-17', 'day', 'TRY', 182733.56, 81660.43, 8, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-08-17'),
  ('2026-08-18', 'day', 'TRY', 38844.10, 24144.10, 6, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-08-18'),
  ('2026-08-20', 'day', 'TRY', 20800.00, 9300.00, 5, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-08-20'),
  ('2026-08-21', 'day', 'TRY', 81500.00, 55000.00, 7, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-08-21'),
  ('2026-08-24', 'day', 'TRY', 48807.93, 31823.09, 6, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-08-24'),
  ('2026-08-25', 'day', 'TRY', 4000.00, 1000.00, 1, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-08-25'),
  ('2026-08-26', 'day', 'TRY', 121700.00, 75400.00, 8, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-08-26'),
  ('2026-08-27', 'day', 'TRY', 24500.00, 15920.00, 3, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-08-27'),
  ('2026-08-28', 'day', 'TRY', 111400.00, 49200.00, 5, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-08-28'),
  ('2026-08-29', 'day', 'TRY', 10500.00, 6500.00, 1, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-08-29'),
  ('2026-08-31', 'day', 'TRY', 12000.00, 7500.00, 2, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-08-31'),
  ('2026-09-01', 'day', 'TRY', 27304.00, 14200.00, 4, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-09-01'),
  ('2026-09-02', 'day', 'TRY', 15250.00, 8619.50, 3, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-09-02'),
  ('2026-09-03', 'day', 'TRY', 38000.00, 22562.17, 6, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-09-03'),
  ('2026-09-04', 'day', 'TRY', 50000.00, 26400.00, 6, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-09-04'),
  ('2026-09-05', 'day', 'TRY', 72000.00, 49000.00, 4, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-09-05'),
  ('2026-09-07', 'day', 'TRY', 20500.00, 14600.00, 3, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-09-07'),
  ('2026-09-08', 'day', 'TRY', 13500.00, 6472.50, 5, '2026 002 REX LOJİSTİK.xlsx', 'FİŞ GİRİŞ:2026-09-08')
ON CONFLICT (actual_date, granularity, currency) DO NOTHING;

CREATE OR REPLACE FUNCTION public.rex_financial_dashboard(
  p_year integer,
  p_month integer,
  p_currency text DEFAULT 'TRY'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_currency text := upper(trim(coalesce(p_currency, 'TRY')));
BEGIN
  IF NOT public.rex_has_permission('reports.accounting', 'view') THEN
    RAISE EXCEPTION 'Finans göstergelerini görüntüleme yetkiniz bulunmuyor';
  END IF;
  IF p_year NOT BETWEEN 2020 AND 2100 THEN
    RAISE EXCEPTION 'Geçerli bir rapor yılı seçin';
  END IF;
  IF p_month NOT BETWEEN 1 AND 12 THEN
    RAISE EXCEPTION 'Geçerli bir rapor ayı seçin';
  END IF;
  IF v_currency NOT IN ('TRY','EUR','USD','GBP') THEN
    RAISE EXCEPTION 'Desteklenmeyen para birimi';
  END IF;

  RETURN (
    WITH cutover AS (
      SELECT
        coalesce(
          (SELECT c.legacy_from_date FROM public.management_financial_cutovers c WHERE c.currency = v_currency),
          DATE '1900-01-01'
        ) AS legacy_from_date,
        coalesce(
          (SELECT c.live_from_date FROM public.management_financial_cutovers c WHERE c.currency = v_currency),
          DATE '1900-01-01'
        ) AS live_from_date
    ),
    shipment_source AS (
      SELECT
        s.id,
        coalesce(s.pickup_date, (s.created_at AT TIME ZONE 'Europe/Istanbul')::date) AS activity_date,
        upper(coalesce(nullif(trim(s.currency), ''), 'TRY')) AS revenue_currency,
        upper(coalesce(nullif(trim(s.cost_currency), ''), nullif(trim(s.currency), ''), 'TRY')) AS direct_cost_currency,
        greatest(coalesce(s.satis_tutar, 0), 0)::numeric AS revenue,
        greatest(coalesce(s.cost, 0), 0)::numeric AS direct_cost,
        s.satis_tutar IS NULL AS revenue_missing,
        s.cost IS NULL AS cost_missing
      FROM public.shipments s
      CROSS JOIN cutover c
      WHERE (
          coalesce(s.pickup_date, (s.created_at AT TIME ZONE 'Europe/Istanbul')::date) < c.legacy_from_date
          OR coalesce(s.pickup_date, (s.created_at AT TIME ZONE 'Europe/Istanbul')::date) >= c.live_from_date
        )
        AND coalesce(s.pickup_date, (s.created_at AT TIME ZONE 'Europe/Istanbul')::date) >= make_date(p_year - 1, 1, 1)
        AND coalesce(s.pickup_date, (s.created_at AT TIME ZONE 'Europe/Istanbul')::date) < make_date(p_year + 1, 1, 1)
        AND coalesce(s.pickup_date, (s.created_at AT TIME ZONE 'Europe/Istanbul')::date) <= (now() AT TIME ZONE 'Europe/Istanbul')::date
        AND regexp_replace(lower(trim(coalesce(s.status, ''))), '[ _-]+', '', 'g') NOT IN ('iptal','cancelled','canceled')
    ),
    shipment_amounts AS (
      SELECT
        id,
        activity_date,
        CASE WHEN revenue_currency = v_currency THEN revenue ELSE 0 END AS revenue,
        CASE WHEN direct_cost_currency = v_currency THEN direct_cost ELSE 0 END AS direct_cost,
        revenue_currency,
        direct_cost_currency,
        revenue_missing,
        cost_missing
      FROM shipment_source
      WHERE revenue_currency = v_currency OR direct_cost_currency = v_currency
    ),
    legacy_source AS (
      SELECT
        a.actual_date AS activity_date,
        a.granularity,
        a.revenue::numeric AS revenue,
        a.direct_cost::numeric AS direct_cost,
        coalesce(a.record_count, 0)::integer AS shipment_count
      FROM public.management_financial_actuals a
      WHERE a.currency = v_currency
        AND a.actual_date >= make_date(p_year - 1, 1, 1)
        AND a.actual_date < make_date(p_year + 1, 1, 1)
    ),
    actual_source AS (
      SELECT
        activity_date,
        revenue,
        direct_cost,
        1::integer AS shipment_count
      FROM shipment_amounts
      UNION ALL
      SELECT
        activity_date,
        revenue,
        direct_cost,
        shipment_count
      FROM legacy_source
    ),
    daily_actual_source AS (
      SELECT
        activity_date,
        revenue,
        direct_cost,
        1::integer AS shipment_count
      FROM shipment_amounts
      UNION ALL
      SELECT
        activity_date,
        revenue,
        direct_cost,
        shipment_count
      FROM legacy_source
      WHERE granularity = 'day'
    ),
    expense_source AS (
      SELECT
        e.expense_date AS activity_date,
        greatest(coalesce(e.amount, 0), 0)::numeric AS operating_expense
      FROM public.expenses e
      WHERE e.expense_date >= make_date(p_year - 1, 1, 1)
        AND e.expense_date < make_date(p_year + 1, 1, 1)
        AND e.expense_date <= (now() AT TIME ZONE 'Europe/Istanbul')::date
        AND upper(coalesce(nullif(trim(e.currency), ''), 'TRY')) = v_currency
        AND lower(trim(coalesce(e.status, ''))) <> 'iptal'
    ),
    months AS (
      SELECT generate_series(1, 12)::integer AS month_no
    ),
    shipment_monthly AS (
      SELECT
        extract(month FROM activity_date)::integer AS month_no,
        sum(revenue)::numeric AS revenue,
        sum(direct_cost)::numeric AS direct_cost,
        sum(shipment_count)::integer AS shipment_count
      FROM actual_source
      WHERE extract(year FROM activity_date)::integer = p_year
      GROUP BY 1
    ),
    expense_monthly AS (
      SELECT
        extract(month FROM activity_date)::integer AS month_no,
        sum(operating_expense)::numeric AS operating_expenses
      FROM expense_source
      WHERE extract(year FROM activity_date)::integer = p_year
      GROUP BY 1
    ),
    monthly_rows AS (
      SELECT
        m.month_no,
        coalesce(sm.revenue, 0)::numeric AS revenue,
        coalesce(sm.direct_cost, 0)::numeric AS direct_cost,
        (coalesce(sm.revenue, 0) - coalesce(sm.direct_cost, 0))::numeric AS gross_profit,
        coalesce(em.operating_expenses, 0)::numeric AS operating_expenses,
        (coalesce(sm.revenue, 0) - coalesce(sm.direct_cost, 0) - coalesce(em.operating_expenses, 0))::numeric AS net_profit,
        coalesce(sm.shipment_count, 0)::integer AS shipment_count,
        coalesce(t.revenue_target, 0)::numeric AS revenue_target,
        coalesce(t.direct_cost_target, 0)::numeric AS direct_cost_target,
        coalesce(t.operating_expense_target, 0)::numeric AS operating_expense_target
      FROM months m
      LEFT JOIN shipment_monthly sm ON sm.month_no = m.month_no
      LEFT JOIN expense_monthly em ON em.month_no = m.month_no
      LEFT JOIN public.management_financial_targets t
        ON t.target_year = p_year AND t.target_month = m.month_no AND t.currency = v_currency
    ),
    year_actual AS (
      SELECT
        sum(revenue)::numeric AS revenue,
        sum(direct_cost)::numeric AS direct_cost,
        sum(gross_profit)::numeric AS gross_profit,
        sum(operating_expenses)::numeric AS operating_expenses,
        sum(net_profit)::numeric AS net_profit,
        sum(shipment_count)::integer AS shipment_count
      FROM monthly_rows
    ),
    year_target AS (
      SELECT
        sum(revenue_target)::numeric AS revenue_target,
        sum(direct_cost_target)::numeric AS direct_cost_target,
        sum(operating_expense_target)::numeric AS operating_expense_target
      FROM monthly_rows
    ),
    selected_month AS (
      SELECT * FROM monthly_rows WHERE month_no = p_month
    ),
    days AS (
      SELECT generate_series(
        make_date(p_year, p_month, 1)::timestamp,
        (make_date(p_year, p_month, 1) + interval '1 month - 1 day')::timestamp,
        interval '1 day'
      )::date AS day_date
    ),
    shipment_daily AS (
      SELECT
        activity_date AS day_date,
        sum(revenue)::numeric AS revenue,
        sum(direct_cost)::numeric AS direct_cost,
        sum(shipment_count)::integer AS shipment_count
      FROM daily_actual_source
      WHERE activity_date >= make_date(p_year, p_month, 1)
        AND activity_date < (make_date(p_year, p_month, 1) + interval '1 month')::date
      GROUP BY activity_date
    ),
    expense_daily AS (
      SELECT activity_date AS day_date, sum(operating_expense)::numeric AS operating_expenses
      FROM expense_source
      WHERE activity_date >= make_date(p_year, p_month, 1)
        AND activity_date < (make_date(p_year, p_month, 1) + interval '1 month')::date
      GROUP BY activity_date
    ),
    previous_year AS (
      SELECT
        coalesce(sum(revenue), 0)::numeric AS revenue,
        coalesce(sum(direct_cost), 0)::numeric AS direct_cost,
        coalesce(sum(shipment_count), 0)::integer AS shipment_count
      FROM actual_source
      WHERE activity_date >= make_date(p_year - 1, 1, 1)
        AND activity_date < make_date(p_year, 1, 1)
    ),
    previous_year_expenses AS (
      SELECT coalesce(sum(operating_expense), 0)::numeric AS operating_expenses
      FROM expense_source
      WHERE activity_date >= make_date(p_year - 1, 1, 1)
        AND activity_date < make_date(p_year, 1, 1)
    ),
    quality AS (
      SELECT
        count(*) FILTER (
          WHERE extract(year FROM activity_date)::integer = p_year
            AND revenue_currency = v_currency AND revenue_missing
        )::integer AS missing_revenue_count,
        count(*) FILTER (
          WHERE extract(year FROM activity_date)::integer = p_year
            AND revenue_currency = v_currency AND cost_missing
        )::integer AS missing_cost_count,
        count(*) FILTER (
          WHERE extract(year FROM activity_date)::integer = p_year
            AND revenue_currency = v_currency AND direct_cost_currency <> revenue_currency
        )::integer AS currency_mismatch_count,
        (
          SELECT count(*)::integer
          FROM legacy_source
          WHERE extract(year FROM activity_date)::integer = p_year
            AND granularity = 'month'
        ) AS legacy_monthly_summary_count,
        (
          SELECT coalesce(sum(shipment_count), 0)::integer
          FROM legacy_source
          WHERE extract(year FROM activity_date)::integer = p_year
            AND granularity = 'day'
        ) AS imported_daily_record_count,
        (SELECT live_from_date FROM cutover) AS live_cutover_date
      FROM shipment_source
    )
    SELECT jsonb_build_object(
      'year', p_year,
      'month', p_month,
      'currency', v_currency,
      'basis', 'verified_excel_history_and_live_shipments_excluding_vat',
      'generatedAt', now(),
      'yearActual', jsonb_build_object(
        'revenue', ya.revenue,
        'directCost', ya.direct_cost,
        'grossProfit', ya.gross_profit,
        'grossMargin', CASE WHEN ya.revenue > 0 THEN round(100 * ya.gross_profit / ya.revenue, 1) ELSE 0 END,
        'costMarkup', CASE WHEN ya.direct_cost > 0 THEN round(100 * ya.gross_profit / ya.direct_cost, 1) ELSE 0 END,
        'operatingExpenses', ya.operating_expenses,
        'netProfit', ya.net_profit,
        'shipmentCount', ya.shipment_count
      ),
      'yearTarget', jsonb_build_object(
        'revenue', yt.revenue_target,
        'directCost', yt.direct_cost_target,
        'grossProfit', yt.revenue_target - yt.direct_cost_target,
        'operatingExpenses', yt.operating_expense_target,
        'netProfit', yt.revenue_target - yt.direct_cost_target - yt.operating_expense_target
      ),
      'monthActual', jsonb_build_object(
        'revenue', sm.revenue,
        'directCost', sm.direct_cost,
        'grossProfit', sm.gross_profit,
        'grossMargin', CASE WHEN sm.revenue > 0 THEN round(100 * sm.gross_profit / sm.revenue, 1) ELSE 0 END,
        'costMarkup', CASE WHEN sm.direct_cost > 0 THEN round(100 * sm.gross_profit / sm.direct_cost, 1) ELSE 0 END,
        'operatingExpenses', sm.operating_expenses,
        'netProfit', sm.net_profit,
        'shipmentCount', sm.shipment_count
      ),
      'monthTarget', jsonb_build_object(
        'revenue', sm.revenue_target,
        'directCost', sm.direct_cost_target,
        'grossProfit', sm.revenue_target - sm.direct_cost_target,
        'operatingExpenses', sm.operating_expense_target,
        'netProfit', sm.revenue_target - sm.direct_cost_target - sm.operating_expense_target
      ),
      'previousYearActual', jsonb_build_object(
        'revenue', py.revenue,
        'directCost', py.direct_cost,
        'grossProfit', py.revenue - py.direct_cost,
        'operatingExpenses', pye.operating_expenses,
        'netProfit', py.revenue - py.direct_cost - pye.operating_expenses,
        'shipmentCount', py.shipment_count
      ),
      'dataQuality', jsonb_build_object(
        'missingRevenueCount', q.missing_revenue_count,
        'missingCostCount', q.missing_cost_count,
        'currencyMismatchCount', q.currency_mismatch_count,
        'legacyMonthlySummaryCount', q.legacy_monthly_summary_count,
        'importedDailyRecordCount', q.imported_daily_record_count,
        'liveCutoverDate', q.live_cutover_date
      ),
      'monthly', (
        SELECT jsonb_agg(jsonb_build_object(
          'month', mr.month_no,
          'revenue', mr.revenue,
          'directCost', mr.direct_cost,
          'grossProfit', mr.gross_profit,
          'grossMargin', CASE WHEN mr.revenue > 0 THEN round(100 * mr.gross_profit / mr.revenue, 1) ELSE 0 END,
          'costMarkup', CASE WHEN mr.direct_cost > 0 THEN round(100 * mr.gross_profit / mr.direct_cost, 1) ELSE 0 END,
          'operatingExpenses', mr.operating_expenses,
          'netProfit', mr.net_profit,
          'shipmentCount', mr.shipment_count,
          'revenueTarget', mr.revenue_target,
          'directCostTarget', mr.direct_cost_target,
          'grossProfitTarget', mr.revenue_target - mr.direct_cost_target,
          'operatingExpenseTarget', mr.operating_expense_target,
          'netProfitTarget', mr.revenue_target - mr.direct_cost_target - mr.operating_expense_target
        ) ORDER BY mr.month_no) FROM monthly_rows mr
      ),
      'daily', (
        SELECT jsonb_agg(jsonb_build_object(
          'date', d.day_date,
          'revenue', coalesce(sd.revenue, 0),
          'directCost', coalesce(sd.direct_cost, 0),
          'grossProfit', coalesce(sd.revenue, 0) - coalesce(sd.direct_cost, 0),
          'grossMargin', CASE WHEN coalesce(sd.revenue, 0) > 0
            THEN round(100 * (coalesce(sd.revenue, 0) - coalesce(sd.direct_cost, 0)) / sd.revenue, 1) ELSE 0 END,
          'operatingExpenses', coalesce(ed.operating_expenses, 0),
          'netProfit', coalesce(sd.revenue, 0) - coalesce(sd.direct_cost, 0) - coalesce(ed.operating_expenses, 0),
          'shipmentCount', coalesce(sd.shipment_count, 0)
        ) ORDER BY d.day_date)
        FROM days d
        LEFT JOIN shipment_daily sd ON sd.day_date = d.day_date
        LEFT JOIN expense_daily ed ON ed.day_date = d.day_date
      )
    )
    FROM year_actual ya
    CROSS JOIN year_target yt
    CROSS JOIN selected_month sm
    CROSS JOIN previous_year py
    CROSS JOIN previous_year_expenses pye
    CROSS JOIN quality q
  );
END;
$$;

REVOKE ALL ON TABLE public.management_financial_actuals FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.management_financial_cutovers FROM PUBLIC, anon;
GRANT SELECT ON TABLE public.management_financial_actuals TO authenticated;
GRANT SELECT ON TABLE public.management_financial_cutovers TO authenticated;

COMMIT;
