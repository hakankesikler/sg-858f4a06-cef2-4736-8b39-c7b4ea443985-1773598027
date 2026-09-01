-- Production advisor hardening that does not alter application role policies.
ALTER FUNCTION public.auto_confirm_user()
  SET search_path = pg_catalog, public;
REVOKE ALL ON FUNCTION public.auto_confirm_user() FROM PUBLIC, anon, authenticated;

-- Remove redundant manual indexes only when their constraint-backed equivalents exist.
DO $$
BEGIN
  IF to_regclass('public.sales_invoices_invoice_no_key') IS NOT NULL THEN
    DROP INDEX IF EXISTS public.sales_invoices_invoice_no_unique;
  END IF;
  IF to_regclass('public.shipments_shipment_code_key') IS NOT NULL THEN
    DROP INDEX IF EXISTS public.shipments_shipment_code_unique;
  END IF;
END;
$$;
