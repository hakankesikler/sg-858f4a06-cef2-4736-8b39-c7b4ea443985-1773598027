-- ============================================
-- ACCOUNTING MODULE TABLES
-- ============================================

-- 1. Products and Services Catalog
CREATE TABLE IF NOT EXISTS products_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('Ürün', 'Hizmet')),
  category TEXT,
  unit TEXT DEFAULT 'Adet' CHECK (unit IN ('Adet', 'Kg', 'Ton', 'Metre', 'M2', 'M3', 'Litre', 'Paket', 'Saat', 'Gün')),
  purchase_price NUMERIC(15,2) DEFAULT 0,
  sale_price NUMERIC(15,2) DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 20.00,
  stock_quantity INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Purchases (Alış Faturaları)
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_no TEXT NOT NULL UNIQUE,
  supplier_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  purchase_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
  tax NUMERIC(15,2) DEFAULT 0,
  discount NUMERIC(15,2) DEFAULT 0,
  total NUMERIC(15,2) GENERATED ALWAYS AS (subtotal + tax - discount) STORED,
  status TEXT DEFAULT 'Bekliyor' CHECK (status IN ('Bekliyor', 'Ödendi', 'Kısmi Ödendi', 'Gecikmiş', 'İptal')),
  payment_method TEXT CHECK (payment_method IN ('Nakit', 'Kredi Kartı', 'Havale', 'EFT', 'Çek', 'Açık Hesap')),
  paid_amount NUMERIC(15,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Purchase Items
CREATE TABLE IF NOT EXISTS purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products_services(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(15,2) NOT NULL,
  tax_rate NUMERIC(5,2) DEFAULT 20.00,
  total NUMERIC(15,2) GENERATED ALWAYS AS (quantity * unit_price * (1 + tax_rate / 100)) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Expenses (Genel Giderler)
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_no TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN (
    'Kira', 'Elektrik', 'Su', 'Doğalgaz', 'İnternet/Telefon',
    'Ofis Malzemeleri', 'Temizlik', 'Ulaşım', 'Yakıt',
    'Personel Yemek', 'Eğitim', 'Danışmanlık', 'Reklam/Pazarlama',
    'Sigorta', 'Vergi/Harç', 'Bakım/Onarım', 'Kırtasiye', 'Diğer'
  )),
  description TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  tax NUMERIC(15,2) DEFAULT 0,
  total NUMERIC(15,2) GENERATED ALWAYS AS (amount + tax) STORED,
  expense_date DATE DEFAULT CURRENT_DATE,
  payment_method TEXT CHECK (payment_method IN ('Nakit', 'Kredi Kartı', 'Havale', 'EFT', 'Çek')),
  paid_by TEXT,
  vendor TEXT,
  invoice_no TEXT,
  is_recurring BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'Ödendi' CHECK (status IN ('Ödendi', 'Bekliyor', 'Onay Bekliyor')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Financial Accounts (Kasa/Banka)
CREATE TABLE IF NOT EXISTS financial_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('Kasa', 'Banka', 'Kredi Kartı', 'Diğer')),
  bank_name TEXT,
  account_no TEXT,
  iban TEXT,
  currency TEXT DEFAULT 'TRY' CHECK (currency IN ('TRY', 'USD', 'EUR', 'GBP')),
  balance NUMERIC(15,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Transactions (Finans İşlemleri)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_no TEXT NOT NULL UNIQUE,
  account_id UUID REFERENCES financial_accounts(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('Gelen', 'Giden', 'Virman')),
  category TEXT,
  amount NUMERIC(15,2) NOT NULL,
  description TEXT NOT NULL,
  reference_no TEXT,
  transaction_date DATE DEFAULT CURRENT_DATE,
  related_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  related_purchase_id UUID REFERENCES purchases(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_code TEXT NOT NULL UNIQUE,
  project_name TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  description TEXT,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  budget NUMERIC(15,2),
  actual_cost NUMERIC(15,2) DEFAULT 0,
  status TEXT DEFAULT 'Devam Ediyor' CHECK (status IN ('Planlama', 'Devam Ediyor', 'Askıda', 'Tamamlandı', 'İptal')),
  manager TEXT,
  priority TEXT DEFAULT 'Orta' CHECK (priority IN ('Düşük', 'Orta', 'Yüksek', 'Acil')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Project Costs
CREATE TABLE IF NOT EXISTS project_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  cost_type TEXT NOT NULL CHECK (cost_type IN ('İşçilik', 'Malzeme', 'Ekipman', 'Ulaşım', 'Diğer')),
  description TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  cost_date DATE DEFAULT CURRENT_DATE,
  invoice_no TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE products_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_costs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (authenticated users can do everything)
CREATE POLICY "Users can view products_services" ON products_services FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert products_services" ON products_services FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update products_services" ON products_services FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete products_services" ON products_services FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view purchases" ON purchases FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert purchases" ON purchases FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update purchases" ON purchases FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete purchases" ON purchases FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view purchase_items" ON purchase_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert purchase_items" ON purchase_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update purchase_items" ON purchase_items FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete purchase_items" ON purchase_items FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view expenses" ON expenses FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert expenses" ON expenses FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update expenses" ON expenses FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete expenses" ON expenses FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view financial_accounts" ON financial_accounts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert financial_accounts" ON financial_accounts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update financial_accounts" ON financial_accounts FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete financial_accounts" ON financial_accounts FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view transactions" ON transactions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update transactions" ON transactions FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete transactions" ON transactions FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view projects" ON projects FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert projects" ON projects FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update projects" ON projects FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete projects" ON projects FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view project_costs" ON project_costs FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert project_costs" ON project_costs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update project_costs" ON project_costs FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete project_costs" ON project_costs FOR DELETE USING (auth.uid() IS NOT NULL);