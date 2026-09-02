-- Scalable customer directory: financial balance and last movement summary.
-- Every non-archived customer stays visible; age never removes a customer.

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
), summary AS (
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
)
SELECT customer_id, balance, last_financial_activity_at,
  CASE
    WHEN abs(balance) >= 0.01 THEN 'open_balance'
    WHEN last_financial_activity_at >= now() - interval '24 months' THEN 'recent_zero'
    ELSE 'dormant_zero'
  END::text AS financial_activity_segment
FROM summary;

GRANT SELECT ON public.rex_customer_financial_directory TO authenticated;

CREATE INDEX IF NOT EXISTS idx_customers_active_account_created
  ON public.customers(account_type, created_at DESC) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_customers_active_vergi_no
  ON public.customers(vergi_no) WHERE archived_at IS NULL AND vergi_no IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_active_tc_no
  ON public.customers(tc_no) WHERE archived_at IS NULL AND tc_no IS NOT NULL;

COMMENT ON VIEW public.rex_customer_financial_directory IS
  'Cari başına güncel yerel bakiye, son mali hareket ve açık/hareketli/durgun segmenti.';
