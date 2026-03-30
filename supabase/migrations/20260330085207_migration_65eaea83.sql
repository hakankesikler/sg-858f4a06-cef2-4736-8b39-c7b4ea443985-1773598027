-- Create company_settings table
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Company Info
  company_name TEXT NOT NULL DEFAULT 'REX LOJİSTİK TAŞIMACILIK DEPOLAMA DANIŞMANLIK LİMİTED ŞİRKET',
  sector TEXT,
  company_type TEXT CHECK (company_type IN ('Tüzel', 'Şahıs')) DEFAULT 'Tüzel',
  
  -- Contact Info
  phone TEXT DEFAULT '+90 543 401 0755',
  email TEXT DEFAULT 'info@rexlojistik.com',
  website TEXT DEFAULT 'www.rexlojistik.com',
  
  -- Address Info
  country TEXT DEFAULT 'TR',
  city TEXT DEFAULT 'Bayraklı/İzmir',
  address TEXT DEFAULT 'Folkart Towers A Kule No:47/B K:26 D:2601 Adalet Mahallesi Manas Bulvarı',
  
  -- Tax Info
  tax_id TEXT DEFAULT '7342549288',
  tax_office TEXT DEFAULT 'KARSIYAKA VERGİ DAİRESİ',
  mersis_code TEXT DEFAULT '0734259288000001',
  
  -- E-Invoice Info
  e_invoice_provider TEXT DEFAULT 'KolayBi E-Faturam',
  e_invoice_status TEXT DEFAULT 'Tanımlı',
  document_type TEXT DEFAULT 'Fatura',
  operating_center TEXT DEFAULT 'İzmir',
  registration_number TEXT DEFAULT '240976',
  
  -- Financial Settings
  currency TEXT DEFAULT 'TRY' CHECK (currency IN ('TRY', 'USD', 'EUR', 'GBP')),
  auto_offsetting BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view company settings" ON company_settings FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert company settings" ON company_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update company settings" ON company_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete company settings" ON company_settings FOR DELETE USING (auth.uid() = user_id);

-- Insert default company settings
INSERT INTO company_settings (
  company_name,
  phone,
  email,
  website,
  country,
  city,
  address,
  company_type,
  tax_id,
  tax_office,
  mersis_code,
  e_invoice_provider,
  e_invoice_status,
  document_type,
  operating_center,
  registration_number,
  currency,
  auto_offsetting
) VALUES (
  'REX LOJİSTİK TAŞIMACILIK DEPOLAMA DANIŞMANLIK LİMİTED ŞİRKET',
  '+90 543 401 0755',
  'info@rexlojistik.com',
  'www.rexlojistik.com',
  'TR',
  'Bayraklı/İzmir',
  'Folkart Towers A Kule No:47/B K:26 D:2601 Adalet Mahallesi Manas Bulvarı',
  'Tüzel',
  '7342549288',
  'KARSIYAKA VERGİ DAİRESİ',
  '0734259288000001',
  'KolayBi E-Faturam',
  'Tanımlı',
  'Fatura',
  'İzmir',
  '240976',
  'TRY',
  false
);