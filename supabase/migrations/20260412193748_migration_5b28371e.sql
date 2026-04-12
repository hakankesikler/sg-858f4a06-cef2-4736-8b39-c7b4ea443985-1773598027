-- Create customer_bank_accounts table
CREATE TABLE IF NOT EXISTS customer_bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  iban TEXT NOT NULL,
  account_holder TEXT NOT NULL,
  account_number TEXT,
  branch_name TEXT,
  branch_code TEXT,
  swift_code TEXT,
  currency TEXT DEFAULT 'TRY',
  is_default BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE customer_bank_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated users to view bank accounts"
  ON customer_bank_accounts FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to insert bank accounts"
  ON customer_bank_accounts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update bank accounts"
  ON customer_bank_accounts FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to delete bank accounts"
  ON customer_bank_accounts FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Create index
CREATE INDEX IF NOT EXISTS idx_customer_bank_accounts_customer_id ON customer_bank_accounts(customer_id);

-- Add comment
COMMENT ON TABLE customer_bank_accounts IS 'Cari banka hesap bilgileri - her cari için birden fazla hesap olabilir';