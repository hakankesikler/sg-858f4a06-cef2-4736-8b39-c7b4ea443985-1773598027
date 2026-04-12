-- Add supplier_category column to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS supplier_category TEXT
CHECK (supplier_category IN ('nakliyeci', 'forwarder', 'diger') OR supplier_category IS NULL);

COMMENT ON COLUMN customers.supplier_category IS 'Tedarikçi kategorisi: nakliyeci, forwarder (Forwarder/Acente), diger (Diğer Tedarikçiler)';