-- Add cost (maliyet) field to shipments table
ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS cost DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS cost_currency TEXT DEFAULT 'TRY';

COMMENT ON COLUMN shipments.cost IS 'İşin maliyeti (nakliyeci/taşımacı maliyeti)';
COMMENT ON COLUMN shipments.cost_currency IS 'Maliyet para birimi';