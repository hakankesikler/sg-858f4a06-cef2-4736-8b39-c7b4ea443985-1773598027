-- Add missing vehicle fields to database
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS ruhsat_sahibi_adi_soyadi TEXT,
  ADD COLUMN IF NOT EXISTS ruhsat_no TEXT,
  ADD COLUMN IF NOT EXISTS ruhsat_dosyasi TEXT;

COMMENT ON COLUMN vehicles.ruhsat_sahibi_adi_soyadi IS 'Ruhsat sahibinin adı soyadı';
COMMENT ON COLUMN vehicles.ruhsat_no IS 'Ruhsat numarası';
COMMENT ON COLUMN vehicles.ruhsat_dosyasi IS 'Ruhsat dosyası URL veya yolu';