-- Create drivers table for customers
CREATE TABLE IF NOT EXISTS customer_drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  tc_no TEXT,
  phone1 TEXT,
  phone2 TEXT,
  src_belge_no TEXT,
  psikoteknik_belge_no TEXT,
  ehliyet_sinifi TEXT,
  ehliyet_gecerlilik_tarihi DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE customer_drivers IS 'Nakliyeci firmalarının sürücü bilgileri';

-- Create vehicles table for customers
CREATE TABLE IF NOT EXISTS customer_vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  arac_tipi TEXT CHECK (arac_tipi IN ('panelvan', 'kamyonet', 'kamyon', 'tir')),
  cekici_plakasi TEXT,
  dorse_plakasi TEXT,
  kasa_tipi TEXT CHECK (kasa_tipi IN ('kapali', 'acik', 'tenteli', 'frigo')),
  tasima_kapasitesi INTEGER,
  kasko_bitis_tarihi DATE,
  trafik_sigortasi_bitis_tarihi DATE,
  yetki_belgesi TEXT,
  ruhsat_dosyasi_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE customer_vehicles IS 'Nakliyeci firmalarının araç bilgileri';

-- Enable RLS on new tables
ALTER TABLE customer_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_vehicles ENABLE ROW LEVEL SECURITY;

-- RLS policies for customer_drivers
CREATE POLICY "auth_insert_customer_drivers" ON customer_drivers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_customer_drivers" ON customer_drivers FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_customer_drivers" ON customer_drivers FOR DELETE USING (auth.uid() IS NOT NULL);
CREATE POLICY "public_read_customer_drivers" ON customer_drivers FOR SELECT USING (true);

-- RLS policies for customer_vehicles
CREATE POLICY "auth_insert_customer_vehicles" ON customer_vehicles FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_customer_vehicles" ON customer_vehicles FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_customer_vehicles" ON customer_vehicles FOR DELETE USING (auth.uid() IS NOT NULL);
CREATE POLICY "public_read_customer_vehicles" ON customer_vehicles FOR SELECT USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_customer_drivers_customer_id ON customer_drivers(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_vehicles_customer_id ON customer_vehicles(customer_id);