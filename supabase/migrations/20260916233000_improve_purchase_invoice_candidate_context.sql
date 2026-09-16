BEGIN;

-- The candidate percentage represents three independent signals:
-- carrier identity (45), VAT-exclusive amount (35) and date proximity (20).
-- A carrier that was learned from the invoice tax identity must be worth the
-- same as a carrier that was entered on the shipment beforehand.
DROP FUNCTION IF EXISTS public.rex_purchase_invoice_candidates(uuid);

CREATE FUNCTION public.rex_purchase_invoice_candidates(p_invoice_id uuid)
RETURNS TABLE(
  shipment_id uuid,
  shipment_code text,
  supplier_id uuid,
  supplier_name text,
  origin text,
  destination text,
  pickup_date date,
  shipment_status text,
  expected_cost numeric,
  cost_currency text,
  sender_name text,
  receiver_name text,
  package_count integer,
  package_type text,
  score integer,
  reasons text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH inv AS (
    SELECT *
    FROM public.incoming_purchase_invoices
    WHERE id = p_invoice_id
      AND invoice_date >= DATE '2026-09-09'
      AND status IN ('review_required','match_proposed','approval_pending')
      AND public.rex_has_role(ARRAY['admin', 'accounting'])
  ), signals AS (
    SELECT
      s.id,
      s.shipment_code,
      s.supplier_id,
      coalesce(c.company,c.name) AS supplier_name,
      s.origin,
      s.destination,
      s.pickup_date,
      s.status,
      s.cost,
      s.cost_currency,
      s.sender_name,
      s.receiver,
      s.adet,
      s.cinsi,
      i.invoice_date,
      i.net_total,
      i.currency AS invoice_currency,
      coalesce(i.description,'') ILIKE '%'||s.shipment_code||'%' AS code_matches,
      s.supplier_id = i.operational_supplier_id AS assigned_carrier_matches,
      EXISTS (
        SELECT 1
        FROM public.customers direct_supplier
        WHERE direct_supplier.id = s.supplier_id
          AND regexp_replace(coalesce(direct_supplier.vergi_no,direct_supplier.tc_no,''),'\D','','g') =
              regexp_replace(i.issuer_tax_id,'\D','','g')
      ) AS direct_tax_matches,
      EXISTS (
        SELECT 1
        FROM public.supplier_invoice_issuers m
        WHERE m.operational_supplier_id = s.supplier_id
          AND regexp_replace(m.issuer_tax_id,'\D','','g') = regexp_replace(i.issuer_tax_id,'\D','','g')
          AND m.active
          AND m.approved_at IS NOT NULL
          AND (m.valid_until IS NULL OR m.valid_until >= i.invoice_date)
      ) AS approved_issuer_matches
    FROM inv i
    JOIN public.shipments s ON s.status NOT IN ('iptal','İptal')
    LEFT JOIN public.customers c ON c.id = s.supplier_id
    WHERE s.pickup_date >= DATE '2026-09-09'
      AND s.pickup_date BETWEEN i.invoice_date-interval '60 days' AND i.invoice_date+interval '15 days'
  ), scored AS (
    SELECT
      sig.*,
      least(
        100,
        CASE
          WHEN assigned_carrier_matches OR direct_tax_matches OR approved_issuer_matches THEN 45
          ELSE 0
        END +
        CASE
          WHEN cost_currency = invoice_currency
            AND abs(coalesce(cost,0)-net_total) <= greatest(net_total*0.01,1) THEN 35
          WHEN cost_currency = invoice_currency
            AND abs(coalesce(cost,0)-net_total) <= greatest(net_total*0.05,1) THEN 25
          ELSE 0
        END +
        CASE WHEN abs(pickup_date-invoice_date) <= 15 THEN 20 ELSE 0 END +
        CASE WHEN code_matches THEN 40 ELSE 0 END
      )::integer AS match_score,
      array_remove(ARRAY[
        CASE
          WHEN assigned_carrier_matches THEN 'Kayıtlı operasyon taşıyıcısı aynı'
          WHEN direct_tax_matches THEN 'Fatura VKN/TCKN bilgisi nakliyeciyle aynı'
          WHEN approved_issuer_matches THEN 'Onaylı fatura düzenleyicisi bağlantısı'
        END,
        CASE
          WHEN cost_currency = invoice_currency
            AND abs(coalesce(cost,0)-net_total) <= greatest(net_total*0.01,1)
            THEN 'KDV hariç tutar tam uyumlu'
          WHEN cost_currency = invoice_currency
            AND abs(coalesce(cost,0)-net_total) <= greatest(net_total*0.05,1)
            THEN 'KDV hariç tutar yakın'
        END,
        CASE
          WHEN abs(pickup_date-invoice_date) = 0 THEN 'Fatura ve yükleme tarihi aynı'
          WHEN abs(pickup_date-invoice_date) <= 3 THEN 'Tarihler çok yakın'
          WHEN abs(pickup_date-invoice_date) <= 15 THEN 'Tarihler yakın'
        END,
        CASE WHEN code_matches THEN 'Açıklamada sevkiyat kodu var' END
      ],NULL) AS match_reasons
    FROM signals sig
  )
  SELECT
    id,
    shipment_code,
    supplier_id,
    supplier_name,
    origin,
    destination,
    pickup_date,
    status,
    cost,
    cost_currency,
    sender_name,
    receiver,
    adet,
    cinsi,
    match_score,
    match_reasons
  FROM scored
  WHERE match_score > 0
  ORDER BY match_score DESC,pickup_date DESC
  LIMIT 20;
$$;

REVOKE ALL ON FUNCTION public.rex_purchase_invoice_candidates(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rex_purchase_invoice_candidates(uuid) TO authenticated;

COMMENT ON FUNCTION public.rex_purchase_invoice_candidates(uuid) IS
  'Ranks post-cutover purchase-invoice shipment candidates and returns compact shipment-party and cargo context.';

COMMIT;
