-- Add UNIQUE constraint on vergi_no column
-- This ensures no two companies can have the same vergi_no
ALTER TABLE customers 
ADD CONSTRAINT customers_vergi_no_unique 
UNIQUE (vergi_no);

-- Create index for faster duplicate checks
CREATE INDEX IF NOT EXISTS idx_customers_vergi_no 
ON customers(vergi_no) 
WHERE vergi_no IS NOT NULL;