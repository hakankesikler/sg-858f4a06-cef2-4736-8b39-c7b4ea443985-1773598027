-- Remove mali column from shipments table
ALTER TABLE shipments
  DROP COLUMN IF EXISTS mali;