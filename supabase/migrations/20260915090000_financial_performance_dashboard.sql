BEGIN;

CREATE TABLE IF NOT EXISTS public.management_financial_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_year integer NOT NULL CHECK (target_year BETWEEN 2020 AND 2100),
  target_month smallint NOT NULL CHECK (target_month BETWEEN 1 AND 12),
  currency text NOT NULL DEFAULT 'TRY' CHECK (currency IN ('TRY','EUR','USD','GBP')),
  revenue_target numeric(18,2) NOT NULL DEFAULT 0 CHECK (revenue_target >= 0),
  direct_cost_target numeric(18,2) NOT NULL DEFAULT 0 CHECK (direct_cost_target >= 0),
  operating_expense_target numeric(18,2) NOT NULL DEFAULT 0 CHECK (operating_expense_target >= 0),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (target_year, target_month, currency)
);

ALTER TABLE public.management_financial_targets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rex_management_financial_targets_select ON public.management_financial_targets;
CREATE POLICY rex_management_financial_targets_select ON public.management_financial_targets
  FOR SELECT TO authenticated
  USING (public.rex_has_permission('reports.accounting', 'view'));

DROP POLICY IF EXISTS rex_management_financial_targets_manage ON public.management_financial_targets;
CREATE POLICY rex_management_financial_targets_manage ON public.management_financial_targets
  FOR ALL TO authenticated
  USING (public.rex_has_permission('reports.accounting', 'manage'))
  WITH CHECK (public.rex_has_permission('reports.accounting', 'manage'));

CREATE OR REPLACE FUNCTION public.rex_touch_management_financial_target()
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

DROP TRIGGER IF EXISTS rex_management_financial_targets_touch ON public.management_financial_targets;
CREATE TRIGGER rex_management_financial_targets_touch
  BEFORE INSERT OR UPDATE ON public.management_financial_targets
  FOR EACH ROW EXECUTE FUNCTION public.rex_touch_management_financial_target();

-- The 2026 TRY targets below come from the management budget supplied for this
-- dashboard. ON CONFLICT DO NOTHING preserves any target already entered.
INSERT INTO public.management_financial_targets (
  target_year, target_month, currency, revenue_target, direct_cost_target
)
VALUES
  (2026, 1, 'TRY', 1134000,  737100),
  (2026, 2, 'TRY', 1222200,  794430),
  (2026, 3, 'TRY', 1247400,  810810),
  (2026, 4, 'TRY', 1267200,  823680),
  (2026, 5, 'TRY', 1443600,  938340),
  (2026, 6, 'TRY', 1350000,  877500),
  (2026, 7, 'TRY', 1699200, 1104480),
  (2026, 8, 'TRY', 1846800, 1200420),
  (2026, 9, 'TRY', 2115000, 1374750),
  (2026,10, 'TRY', 1681200, 1092780),
  (2026,11, 'TRY', 1503000,  976950),
  (2026,12, 'TRY', 1490400,  968760)
ON CONFLICT (target_year, target_month, currency) DO NOTHING;

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
    WITH shipment_source AS (
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
      WHERE coalesce(s.pickup_date, (s.created_at AT TIME ZONE 'Europe/Istanbul')::date) >= make_date(p_year - 1, 1, 1)
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
        count(DISTINCT id)::integer AS shipment_count
      FROM shipment_amounts
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
        count(DISTINCT id)::integer AS shipment_count
      FROM shipment_amounts
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
        count(DISTINCT id)::integer AS shipment_count
      FROM shipment_amounts
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
        )::integer AS currency_mismatch_count
      FROM shipment_source
    )
    SELECT jsonb_build_object(
      'year', p_year,
      'month', p_month,
      'currency', v_currency,
      'basis', 'shipment_activity_date_excluding_vat',
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
        'currencyMismatchCount', q.currency_mismatch_count
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

CREATE OR REPLACE FUNCTION public.rex_save_financial_targets(
  p_year integer,
  p_currency text,
  p_targets jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_currency text := upper(trim(coalesce(p_currency, 'TRY')));
  v_item jsonb;
  v_month integer;
  v_revenue numeric;
  v_direct_cost numeric;
  v_operating_expense numeric;
BEGIN
  IF NOT public.rex_has_permission('reports.accounting', 'manage') THEN
    RAISE EXCEPTION 'Finans hedeflerini düzenleme yetkiniz bulunmuyor';
  END IF;
  IF p_year NOT BETWEEN 2020 AND 2100 OR v_currency NOT IN ('TRY','EUR','USD','GBP') THEN
    RAISE EXCEPTION 'Geçersiz hedef dönemi veya para birimi';
  END IF;
  IF p_targets IS NULL OR jsonb_typeof(p_targets) <> 'array' OR jsonb_array_length(p_targets) <> 12 THEN
    RAISE EXCEPTION 'On iki aya ait hedef bilgisi gönderilmelidir';
  END IF;
  IF (
    SELECT count(DISTINCT (item->>'month')::integer)
    FROM jsonb_array_elements(p_targets) item
    WHERE (item->>'month')::integer BETWEEN 1 AND 12
  ) <> 12 THEN
    RAISE EXCEPTION 'Her ay için yalnızca bir hedef bilgisi gönderilmelidir';
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_targets)
  LOOP
    v_month := (v_item->>'month')::integer;
    v_revenue := greatest(coalesce((v_item->>'revenueTarget')::numeric, 0), 0);
    v_direct_cost := greatest(coalesce((v_item->>'directCostTarget')::numeric, 0), 0);
    v_operating_expense := greatest(coalesce((v_item->>'operatingExpenseTarget')::numeric, 0), 0);
    IF v_month NOT BETWEEN 1 AND 12 THEN
      RAISE EXCEPTION 'Geçersiz hedef ayı';
    END IF;

    INSERT INTO public.management_financial_targets (
      target_year, target_month, currency, revenue_target, direct_cost_target,
      operating_expense_target, created_by, updated_by
    ) VALUES (
      p_year, v_month, v_currency, v_revenue, v_direct_cost,
      v_operating_expense, auth.uid(), auth.uid()
    )
    ON CONFLICT (target_year, target_month, currency) DO UPDATE SET
      revenue_target = EXCLUDED.revenue_target,
      direct_cost_target = EXCLUDED.direct_cost_target,
      operating_expense_target = EXCLUDED.operating_expense_target,
      updated_by = auth.uid(),
      updated_at = now();
  END LOOP;
END;
$$;

REVOKE ALL ON TABLE public.management_financial_targets FROM PUBLIC, anon;
GRANT SELECT ON TABLE public.management_financial_targets TO authenticated;
REVOKE ALL ON FUNCTION public.rex_touch_management_financial_target() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rex_financial_dashboard(integer,integer,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rex_save_financial_targets(integer,text,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rex_financial_dashboard(integer,integer,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_save_financial_targets(integer,text,jsonb) TO authenticated;

COMMIT;
