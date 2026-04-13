-- Remove unnecessary fields from shipments table
ALTER TABLE shipments
  DROP COLUMN IF EXISTS cargo_type,
  DROP COLUMN IF EXISTS cargo_weight,
  DROP COLUMN IF EXISTS cargo_volume,
  DROP COLUMN IF EXISTS cargo_description,
  DROP COLUMN IF EXISTS price,
  DROP COLUMN IF EXISTS currency,
  DROP COLUMN IF EXISTS payment_status,
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS notes;