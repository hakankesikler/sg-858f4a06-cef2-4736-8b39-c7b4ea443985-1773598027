-- Potansiyel Müşteriler (Leads) Tablosu
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Form Bilgileri
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  
  -- Hizmet Bilgileri
  service_type TEXT NOT NULL, -- 'kara', 'deniz', 'hava', 'depolama', 'uluslararası'
  origin TEXT,
  destination TEXT,
  cargo_type TEXT,
  weight TEXT,
  volume TEXT,
  package_count TEXT,
  
  -- Tarih Bilgileri
  pickup_date DATE,
  delivery_date DATE,
  
  -- Ek Bilgiler
  special_requirements TEXT,
  message TEXT,
  
  -- CRM Durum
  status TEXT DEFAULT 'yeni', -- 'yeni', 'inceleniyor', 'teklif_verildi', 'kazanildi', 'kaybedildi'
  assigned_to UUID REFERENCES auth.users(id),
  priority TEXT DEFAULT 'normal', -- 'düşük', 'normal', 'yüksek', 'acil'
  
  -- Meta
  source TEXT DEFAULT 'website', -- 'website', 'telefon', 'email', 'referans'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  converted_to_customer BOOLEAN DEFAULT FALSE,
  converted_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- RLS Policies (Public insert for website form, authenticated read for CRM)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Anonim kullanıcılar website formundan lead oluşturabilir
CREATE POLICY "anon_insert_lead" ON leads
  FOR INSERT
  WITH CHECK (true);

-- Authenticated users can view all leads
CREATE POLICY "auth_read_leads" ON leads
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Authenticated users can update leads
CREATE POLICY "auth_update_leads" ON leads
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Index for performance
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);

COMMENT ON TABLE leads IS 'Potansiyel müşteriler - Website teklif formundan gelen talepler';