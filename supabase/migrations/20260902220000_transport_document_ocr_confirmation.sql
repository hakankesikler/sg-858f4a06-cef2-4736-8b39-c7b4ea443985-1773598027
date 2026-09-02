-- OCR-derived licence and registration data is stored only after an authenticated operator confirms it.
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS ehliyet_veri_kaynagi text,
  ADD COLUMN IF NOT EXISTS ehliyet_ocr_guven_orani numeric(5,2),
  ADD COLUMN IF NOT EXISTS ehliyet_bilgileri_onaylandi_at timestamptz,
  ADD COLUMN IF NOT EXISTS ehliyet_bilgileri_onaylayan uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS ruhsat_veri_kaynagi text,
  ADD COLUMN IF NOT EXISTS ruhsat_ocr_guven_orani numeric(5,2),
  ADD COLUMN IF NOT EXISTS ruhsat_bilgileri_onaylandi_at timestamptz,
  ADD COLUMN IF NOT EXISTS ruhsat_bilgileri_onaylayan uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.drivers DROP CONSTRAINT IF EXISTS drivers_ehliyet_data_source_check;
ALTER TABLE public.drivers ADD CONSTRAINT drivers_ehliyet_data_source_check CHECK (ehliyet_veri_kaynagi IS NULL OR ehliyet_veri_kaynagi IN ('tesseract-local','manual-after-review'));
ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS vehicles_ruhsat_data_source_check;
ALTER TABLE public.vehicles ADD CONSTRAINT vehicles_ruhsat_data_source_check CHECK (ruhsat_veri_kaynagi IS NULL OR ruhsat_veri_kaynagi IN ('tesseract-local','manual-after-review'));

ALTER TABLE public.drivers DROP CONSTRAINT IF EXISTS drivers_ehliyet_ocr_confidence_range;
ALTER TABLE public.drivers ADD CONSTRAINT drivers_ehliyet_ocr_confidence_range CHECK (ehliyet_ocr_guven_orani IS NULL OR ehliyet_ocr_guven_orani BETWEEN 0 AND 100);
ALTER TABLE public.vehicles DROP CONSTRAINT IF EXISTS vehicles_ruhsat_ocr_confidence_range;
ALTER TABLE public.vehicles ADD CONSTRAINT vehicles_ruhsat_ocr_confidence_range CHECK (ruhsat_ocr_guven_orani IS NULL OR ruhsat_ocr_guven_orani BETWEEN 0 AND 100);

CREATE OR REPLACE FUNCTION public.rex_stamp_transport_document_confirmation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,auth AS $$
BEGIN
  IF TG_TABLE_NAME='drivers' AND NEW.ehliyet_bilgileri_onaylandi_at IS NOT NULL
     AND (TG_OP='INSERT' OR OLD.ehliyet_bilgileri_onaylandi_at IS DISTINCT FROM NEW.ehliyet_bilgileri_onaylandi_at) THEN
    NEW.ehliyet_bilgileri_onaylandi_at := now();
    NEW.ehliyet_bilgileri_onaylayan := auth.uid();
  ELSIF TG_TABLE_NAME='vehicles' AND NEW.ruhsat_bilgileri_onaylandi_at IS NOT NULL
     AND (TG_OP='INSERT' OR OLD.ruhsat_bilgileri_onaylandi_at IS DISTINCT FROM NEW.ruhsat_bilgileri_onaylandi_at) THEN
    NEW.ruhsat_bilgileri_onaylandi_at := now();
    NEW.ruhsat_bilgileri_onaylayan := auth.uid();
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS rex_driver_document_confirmation_stamp ON public.drivers;
CREATE TRIGGER rex_driver_document_confirmation_stamp BEFORE INSERT OR UPDATE ON public.drivers
FOR EACH ROW EXECUTE FUNCTION public.rex_stamp_transport_document_confirmation();
DROP TRIGGER IF EXISTS rex_vehicle_document_confirmation_stamp ON public.vehicles;
CREATE TRIGGER rex_vehicle_document_confirmation_stamp BEFORE INSERT OR UPDATE ON public.vehicles
FOR EACH ROW EXECUTE FUNCTION public.rex_stamp_transport_document_confirmation();
REVOKE ALL ON FUNCTION public.rex_stamp_transport_document_confirmation() FROM PUBLIC;
