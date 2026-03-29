-- ============================================
-- 3. ACCOUNTING MODULE TABLES
-- ============================================

-- Invoices (Faturalar)
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  tax DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) GENERATED ALWAYS AS (amount + tax) STORED,
  status TEXT DEFAULT 'Bekliyor' CHECK (status IN ('Ödendi', 'Bekliyor', 'Gecikmiş', 'İptal')),
  due_date DATE,
  paid_date DATE,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments (Ödemeler)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Nakit', 'Kredi Kartı', 'Havale', 'EFT', 'Çek')),
  payment_date DATE DEFAULT CURRENT_DATE,
  reference_no TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoices
CREATE POLICY "Users can view all invoices" ON invoices FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert invoices" ON invoices FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update invoices" ON invoices FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete invoices" ON invoices FOR DELETE USING (auth.uid() IS NOT NULL);

-- RLS Policies for payments
CREATE POLICY "Users can view all payments" ON payments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert payments" ON payments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update payments" ON payments FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete payments" ON payments FOR DELETE USING (auth.uid() IS NOT NULL);