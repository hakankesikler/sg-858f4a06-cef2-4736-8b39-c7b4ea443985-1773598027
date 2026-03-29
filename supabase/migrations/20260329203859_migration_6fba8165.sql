-- ============================================
-- 1. CRM MODULE TABLES
-- ============================================

-- Customers (Müşteriler)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  status TEXT DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Potansiyel', 'Eski Müşteri')),
  last_contact DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cari Cards (Cari Kartlar)
CREATE TABLE cari_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  account_type TEXT DEFAULT 'Müşteri' CHECK (account_type IN ('Müşteri', 'Tedarikçi', 'Her İkisi')),
  balance DECIMAL(15,2) DEFAULT 0,
  credit_limit DECIMAL(15,2) DEFAULT 0,
  payment_terms INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cari_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customers
CREATE POLICY "Users can view all customers" ON customers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert customers" ON customers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update customers" ON customers FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete customers" ON customers FOR DELETE USING (auth.uid() IS NOT NULL);

-- RLS Policies for cari_cards
CREATE POLICY "Users can view all cari cards" ON cari_cards FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert cari cards" ON cari_cards FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update cari cards" ON cari_cards FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete cari cards" ON cari_cards FOR DELETE USING (auth.uid() IS NOT NULL);