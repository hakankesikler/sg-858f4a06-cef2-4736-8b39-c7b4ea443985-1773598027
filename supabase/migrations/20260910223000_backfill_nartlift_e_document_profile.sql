-- Nartlift'in KolayBi canlı hesabındaki REX2026000000431 numaralı resmî
-- faturası 28.08.2026 tarihinde TICARIFATURA olarak doğrulanmıştır.
UPDATE public.customers
SET
  kolaybi_e_document_type = 'e_invoice',
  kolaybi_e_document_scenario = 'TICARIFATURA',
  kolaybi_e_document_source = 'kolaybi_official_invoice_verified',
  kolaybi_e_document_environment = 'live',
  kolaybi_e_document_evidence_at = '2026-08-28T12:00:00.000Z'::timestamptz,
  kolaybi_e_document_checked_at = now(),
  updated_at = now()
WHERE regexp_replace(coalesce(vergi_no, tc_no, ''), '\D', '', 'g') = '6290569996'
  AND kolaybi_contact_id = 6281105;
