-- If column doesn't exist, add it
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS customer_code TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_customer_code ON customers(customer_code);

-- Add comment
COMMENT ON COLUMN customers.customer_code IS 'Formatted customer code (CST-000001, NKL-000001, etc.)';