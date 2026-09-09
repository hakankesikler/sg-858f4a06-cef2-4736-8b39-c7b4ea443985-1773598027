-- Persist KolayBi's current associate balances and expose the authoritative
-- provider balance in the scalable REX customer financial directory.

CREATE TABLE IF NOT EXISTS public.kolaybi_customer_balance_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  provider_environment text NOT NULL CHECK (provider_environment IN ('test', 'live')),
  provider_associate_id bigint NOT NULL CHECK (provider_associate_id > 0),
  currency text NOT NULL DEFAULT 'TRY',
  balance numeric(18,4) NOT NULL DEFAULT 0,
  company_amount numeric(18,2) NOT NULL DEFAULT 0,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_environment, provider_associate_id, currency)
);

CREATE INDEX IF NOT EXISTS idx_kolaybi_customer_balance_customer_environment
  ON public.kolaybi_customer_balance_snapshots(customer_id, provider_environment, last_synced_at DESC);

ALTER TABLE public.kolaybi_customer_balance_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rex_kolaybi_customer_balance_select
  ON public.kolaybi_customer_balance_snapshots;
CREATE POLICY rex_kolaybi_customer_balance_select
  ON public.kolaybi_customer_balance_snapshots
  FOR SELECT TO authenticated
  USING (
    public.rex_has_permission('crm.customers', 'view')
    OR public.rex_has_permission('accounting.accounts', 'view')
  );

REVOKE ALL ON public.kolaybi_customer_balance_snapshots FROM anon;
GRANT SELECT ON public.kolaybi_customer_balance_snapshots TO authenticated;

CREATE OR REPLACE VIEW public.rex_customer_financial_directory
WITH (security_invoker = true)
AS
WITH sales AS (
  SELECT customer_id,
    sum(grand_total * coalesce(exchange_rate, 1))
      FILTER (WHERE coalesce(payment_status, '') <> 'İptal'
        AND coalesce(integration_status, '') NOT IN ('cancelled', 'refund_created')
        AND coalesce(invoice_no, '') NOT LIKE 'BORC-%'
        AND coalesce(invoice_no, '') NOT LIKE 'ALACAK-%') AS invoiced,
    max(greatest(invoice_date::timestamptz, created_at)) AS last_activity_at
  FROM public.sales_invoices
  WHERE customer_id IS NOT NULL
  GROUP BY customer_id
), purchases AS (
  SELECT supplier_id AS customer_id,
    sum(total) FILTER (WHERE coalesce(status, '') <> 'İptal'
      AND coalesce(purchase_no, '') NOT LIKE 'BORC-%'
      AND coalesce(purchase_no, '') NOT LIKE 'ALACAK-%') AS invoiced,
    max(greatest(purchase_date::timestamptz, created_at)) AS last_activity_at
  FROM public.purchases
  WHERE supplier_id IS NOT NULL
  GROUP BY supplier_id
), payments AS (
  SELECT customer_id,
    sum(amount * coalesce(exchange_rate, 1)) FILTER (WHERE transaction_type = 'tahsilat') AS collected,
    sum(amount * coalesce(exchange_rate, 1)) FILTER (WHERE transaction_type = 'odeme') AS paid,
    max(greatest(payment_date::timestamptz, created_at)) AS last_activity_at
  FROM public.customer_payments
  WHERE customer_id IS NOT NULL
  GROUP BY customer_id
), adjustments AS (
  SELECT account_id AS customer_id,
    sum(CASE WHEN transaction_type = 'Alacak' THEN amount ELSE -amount END) AS balance,
    max(coalesce(transaction_date, created_at)) AS last_activity_at
  FROM public.account_transactions
  WHERE account_id IS NOT NULL
  GROUP BY account_id
), local_summary AS (
  SELECT c.id AS customer_id,
    CASE
      WHEN coalesce(c.account_type, 'musteri') = 'musteri'
        THEN coalesce(s.invoiced, 0) - coalesce(pm.collected, 0) + coalesce(a.balance, 0)
      WHEN c.account_type = 'tedarikci'
        THEN -coalesce(p.invoiced, 0) + coalesce(pm.paid, 0) + coalesce(a.balance, 0)
      ELSE coalesce(a.balance, 0)
    END::numeric(18,2) AS balance,
    greatest(s.last_activity_at, p.last_activity_at, pm.last_activity_at, a.last_activity_at) AS last_financial_activity_at
  FROM public.customers c
  LEFT JOIN sales s ON s.customer_id = c.id
  LEFT JOIN purchases p ON p.customer_id = c.id
  LEFT JOIN payments pm ON pm.customer_id = c.id
  LEFT JOIN adjustments a ON a.customer_id = c.id
  WHERE c.archived_at IS NULL
), live_provider AS (
  SELECT customer_id,
    sum(company_amount)::numeric(18,2) AS balance,
    max(last_synced_at) AS last_synced_at
  FROM public.kolaybi_customer_balance_snapshots
  WHERE provider_environment = 'live'
  GROUP BY customer_id
), summary AS (
  SELECT l.customer_id,
    coalesce(p.balance, l.balance, 0)::numeric(18,2) AS balance,
    greatest(l.last_financial_activity_at, p.last_synced_at) AS last_financial_activity_at
  FROM local_summary l
  LEFT JOIN live_provider p ON p.customer_id = l.customer_id
)
SELECT customer_id, balance, last_financial_activity_at,
  CASE
    WHEN abs(balance) >= 0.01 THEN 'open_balance'
    WHEN last_financial_activity_at >= now() - interval '24 months' THEN 'recent_zero'
    ELSE 'dormant_zero'
  END::text AS financial_activity_segment
FROM summary;

GRANT SELECT ON public.rex_customer_financial_directory TO authenticated;

COMMENT ON TABLE public.kolaybi_customer_balance_snapshots IS
  'KolayBi cari listesinden alınan para birimi bazlı güncel bakiye anlık görüntüleri.';
COMMENT ON VIEW public.rex_customer_financial_directory IS
  'KolayBi canlı eşleşmesi varsa sağlayıcı bakiyesini, aksi halde yerel mali hareket bakiyesini gösteren cari dizini.';
