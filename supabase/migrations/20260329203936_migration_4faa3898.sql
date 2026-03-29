-- ============================================
-- 4. HR MODULE TABLES
-- ============================================

-- Employees (Personel)
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  department TEXT NOT NULL CHECK (department IN ('Lojistik', 'Operasyon', 'Finans', 'İnsan Kaynakları', 'Satış', 'BT', 'Yönetim')),
  position TEXT NOT NULL,
  salary DECIMAL(12,2),
  hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'İzinli', 'İşten Ayrıldı')),
  annual_leave_total INTEGER DEFAULT 20,
  annual_leave_used INTEGER DEFAULT 0,
  performance_score INTEGER CHECK (performance_score >= 0 AND performance_score <= 100),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leaves (İzinler)
CREATE TABLE leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('Yıllık İzin', 'Hastalık İzni', 'Ücretsiz İzin', 'Doğum İzni', 'Evlilik İzni')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days INTEGER GENERATED ALWAYS AS (end_date - start_date + 1) STORED,
  status TEXT DEFAULT 'Bekliyor' CHECK (status IN ('Bekliyor', 'Onaylandı', 'Reddedildi')),
  reason TEXT,
  approved_by TEXT,
  approved_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payroll (Bordro)
CREATE TABLE payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  base_salary DECIMAL(12,2) NOT NULL,
  bonuses DECIMAL(12,2) DEFAULT 0,
  deductions DECIMAL(12,2) DEFAULT 0,
  net_salary DECIMAL(12,2) GENERATED ALWAYS AS (base_salary + bonuses - deductions) STORED,
  payment_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;

-- RLS Policies for employees
CREATE POLICY "Users can view all employees" ON employees FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert employees" ON employees FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update employees" ON employees FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete employees" ON employees FOR DELETE USING (auth.uid() IS NOT NULL);

-- RLS Policies for leaves
CREATE POLICY "Users can view all leaves" ON leaves FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert leaves" ON leaves FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update leaves" ON leaves FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete leaves" ON leaves FOR DELETE USING (auth.uid() IS NOT NULL);

-- RLS Policies for payroll
CREATE POLICY "Users can view all payroll" ON payroll FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert payroll" ON payroll FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update payroll" ON payroll FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete payroll" ON payroll FOR DELETE USING (auth.uid() IS NOT NULL);