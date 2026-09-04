-- OCR was removed from staff workflows. Keep historical columns, but disable
-- the shared confirmation trigger that references table-specific fields.
DROP TRIGGER IF EXISTS rex_driver_document_confirmation_stamp ON public.drivers;
DROP TRIGGER IF EXISTS rex_vehicle_document_confirmation_stamp ON public.vehicles;
DROP FUNCTION IF EXISTS public.rex_stamp_transport_document_confirmation();

COMMENT ON COLUMN public.drivers.ehliyet_bilgileri_onaylandi_at IS
  'Historical field retained after transport document OCR was removed.';
COMMENT ON COLUMN public.vehicles.ruhsat_bilgileri_onaylandi_at IS
  'Historical field retained after transport document OCR was removed.';
