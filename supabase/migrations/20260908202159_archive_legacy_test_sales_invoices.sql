ALTER TABLE public.sales_invoices
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archive_reason text;

CREATE INDEX IF NOT EXISTS sales_invoices_active_created_idx
  ON public.sales_invoices (created_at DESC)
  WHERE archived_at IS NULL;

COMMENT ON COLUMN public.sales_invoices.archived_at IS
  'Faturayı silmeden operasyonel listelerden ve finansal toplam hesaplarından çıkarır.';

COMMENT ON COLUMN public.sales_invoices.archive_reason IS
  'Arşivleme gerekçesini denetim izi olarak saklar.';

UPDATE public.sales_invoices
SET archived_at = now(),
    archive_reason = 'Eski geliştirme/test taslağı',
    updated_at = now()
WHERE invoice_no IN (
    'SF-2024-001',
    'SF-2024-NaN',
    'SF-20260430-001',
    'SF-20260430-002',
    'SF-20260430-003',
    'SF-20260430-004'
  )
  AND integration_status = 'draft'
  AND kolaybi_document_id IS NULL
  AND official_invoice_no IS NULL
  AND official_uuid IS NULL
  AND user_id IS NULL
  AND archived_at IS NULL;
