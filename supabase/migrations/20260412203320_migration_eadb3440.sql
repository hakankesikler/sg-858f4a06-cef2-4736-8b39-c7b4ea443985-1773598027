-- Add all missing address/contact columns
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS branch_address TEXT,
ADD COLUMN IF NOT EXISTS invoice_email TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT;

COMMENT ON COLUMN customers.branch_address IS 'Şube adresi';
COMMENT ON COLUMN customers.invoice_email IS 'Fatura e-posta adresi';
COMMENT ON COLUMN customers.postal_code IS 'Posta kodu';