-- Add customer_code column to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS customer_code TEXT;

-- Create unique index on customer_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_customer_code ON customers(customer_code);

-- Add comment
COMMENT ON COLUMN customers.customer_code IS 'Otomatik artan cari kodu (CAR000001, CAR000002, ...)';