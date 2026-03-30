-- Create employee_accounts table (Personel Carileri)
CREATE TABLE IF NOT EXISTS employee_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  account_code TEXT UNIQUE NOT NULL,
  balance DECIMAL(12,2) DEFAULT 0, -- Positive = employee owes company, Negative = company owes employee
  credit_limit DECIMAL(12,2) DEFAULT 0,
  salary DECIMAL(12,2),
  advance_balance DECIMAL(12,2) DEFAULT 0, -- Current advance (avans)
  last_transaction_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create partner_accounts table (Ortaklar Carileri)
CREATE TABLE IF NOT EXISTS partner_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  partner_name TEXT NOT NULL,
  partner_type TEXT CHECK (partner_type IN ('Yönetici Ortak', 'Komanditer Ortak', 'Limited Ortak', 'Anonim Ortak')) DEFAULT 'Limited Ortak',
  account_code TEXT UNIQUE NOT NULL,
  identity_number TEXT, -- TC Kimlik / Pasaport
  share_percentage DECIMAL(5,2), -- Ownership percentage (0-100)
  capital_contribution DECIMAL(12,2) DEFAULT 0, -- Initial capital (sermaye)
  balance DECIMAL(12,2) DEFAULT 0, -- Current balance (positive = partner owes, negative = company owes)
  phone TEXT,
  email TEXT,
  address TEXT,
  last_transaction_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create account_transactions table (for all account types)
CREATE TABLE IF NOT EXISTS account_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  account_type TEXT CHECK (account_type IN ('Genel', 'Personel', 'Ortak')) NOT NULL,
  account_id UUID NOT NULL, -- References customer/employee/partner id
  transaction_type TEXT CHECK (transaction_type IN ('Borç', 'Alacak', 'Avans', 'Maaş', 'Sermaye')) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  reference_no TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE employee_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employee_accounts
CREATE POLICY "Users can view employee_accounts" ON employee_accounts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert employee_accounts" ON employee_accounts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update employee_accounts" ON employee_accounts FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete employee_accounts" ON employee_accounts FOR DELETE USING (auth.uid() IS NOT NULL);

-- RLS Policies for partner_accounts
CREATE POLICY "Users can view partner_accounts" ON partner_accounts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert partner_accounts" ON partner_accounts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update partner_accounts" ON partner_accounts FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete partner_accounts" ON partner_accounts FOR DELETE USING (auth.uid() IS NOT NULL);

-- RLS Policies for account_transactions
CREATE POLICY "Users can view account_transactions" ON account_transactions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert account_transactions" ON account_transactions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update account_transactions" ON account_transactions FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete account_transactions" ON account_transactions FOR DELETE USING (auth.uid() IS NOT NULL);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_employee_accounts_employee ON employee_accounts(employee_id);
CREATE INDEX IF NOT EXISTS idx_partner_accounts_active ON partner_accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_account_transactions_account ON account_transactions(account_type, account_id);
CREATE INDEX IF NOT EXISTS idx_account_transactions_date ON account_transactions(transaction_date DESC);