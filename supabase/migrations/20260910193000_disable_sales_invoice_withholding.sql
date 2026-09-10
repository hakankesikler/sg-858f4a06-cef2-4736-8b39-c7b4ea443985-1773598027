-- REX satış faturalarında tevkifat uygulanmaz. Tevkifat yalnızca gelen alış
-- faturalarının sağlayıcı verisinde korunur ve muhasebe ekranında gösterilir.

UPDATE public.invoice_note_templates
SET is_active = false,
    updated_at = now()
WHERE category = 'withholding_transport'
  AND is_active = true;

UPDATE public.sales_invoice_items AS item
SET withholding_code = NULL,
    withholding_value = NULL,
    withholding_type = NULL
FROM public.sales_invoices AS invoice
WHERE invoice.id = item.invoice_id
  AND invoice.kolaybi_document_id IS NULL
  AND (
    item.withholding_code IS NOT NULL OR
    item.withholding_value IS NOT NULL OR
    item.withholding_type IS NOT NULL
  );

CREATE OR REPLACE FUNCTION public.rex_clear_sales_invoice_item_withholding()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.withholding_code := NULL;
  NEW.withholding_value := NULL;
  NEW.withholding_type := NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rex_clear_sales_invoice_item_withholding_trigger
  ON public.sales_invoice_items;
CREATE TRIGGER rex_clear_sales_invoice_item_withholding_trigger
BEFORE INSERT OR UPDATE OF withholding_code, withholding_value, withholding_type
ON public.sales_invoice_items
FOR EACH ROW
EXECUTE FUNCTION public.rex_clear_sales_invoice_item_withholding();

REVOKE ALL ON FUNCTION public.rex_clear_sales_invoice_item_withholding() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rex_clear_sales_invoice_item_withholding() TO service_role;

COMMENT ON FUNCTION public.rex_clear_sales_invoice_item_withholding() IS
  'REX tarafından düzenlenen satış faturalarında tevkifat alanlarını daima temizler; alış faturası verilerini etkilemez.';
