-- Add sender_name field to shipments table
ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS sender_name TEXT;

COMMENT ON COLUMN shipments.sender_name IS 'Gönderici adı veya firma adı (müşteriden farklı olabilir)';