-- Add missing columns to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'musteri',
ADD COLUMN IF NOT EXISTS tc_no TEXT,
ADD COLUMN IF NOT EXISTS vergi_no TEXT,
ADD COLUMN IF NOT EXISTS tax_office TEXT,
ADD COLUMN IF NOT EXISTS mersis TEXT,
ADD COLUMN IF NOT EXISTS short_name TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS fax TEXT,
ADD COLUMN IF NOT EXISTS district TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS vade_gunu INTEGER,
ADD COLUMN IF NOT EXISTS sabit_iskonto NUMERIC(5,2);

-- Add check constraint for account_type
ALTER TABLE customers 
DROP CONSTRAINT IF EXISTS customers_account_type_check;

ALTER TABLE customers
ADD CONSTRAINT customers_account_type_check 
CHECK (account_type IN ('musteri', 'tedarikci', 'personel', 'ortak'));

-- Add check constraint for vade_gunu
ALTER TABLE customers
DROP CONSTRAINT IF EXISTS customers_vade_gunu_check;

ALTER TABLE customers
ADD CONSTRAINT customers_vade_gunu_check
CHECK (vade_gunu IS NULL OR (vade_gunu >= 1 AND vade_gunu <= 999));

-- Add check constraint for sabit_iskonto
ALTER TABLE customers
DROP CONSTRAINT IF EXISTS customers_sabit_iskonto_check;

ALTER TABLE customers
ADD CONSTRAINT customers_sabit_iskonto_check
CHECK (sabit_iskonto IS NULL OR (sabit_iskonto >= 0 AND sabit_iskonto <= 100));