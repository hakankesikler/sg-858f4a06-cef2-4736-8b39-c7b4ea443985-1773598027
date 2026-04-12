-- Create drivers table if it doesn't exist
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_code TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  tc_no TEXT UNIQUE NOT NULL,
  phone_1 TEXT NOT NULL,
  phone_2 TEXT,
  src_belge_no TEXT,
  psikoteknik_belge_no TEXT,
  ehliyet_sinifi TEXT,
  ehliyet_gecerlilik_tarihi DATE,
  ehliyet_dosyasi_url TEXT,
  status TEXT DEFAULT 'Aktif',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies for drivers
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_drivers" ON drivers;
CREATE POLICY "public_read_drivers" ON drivers FOR SELECT USING (true);

DROP POLICY IF EXISTS "auth_insert_drivers" ON drivers;
CREATE POLICY "auth_insert_drivers" ON drivers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "auth_update_drivers" ON drivers;
CREATE POLICY "auth_update_drivers" ON drivers FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "auth_delete_drivers" ON drivers;
CREATE POLICY "auth_delete_drivers" ON drivers FOR DELETE USING (auth.uid() IS NOT NULL);

-- Alter existing vehicles table to add new columns
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS vehicle_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS arac_tipi TEXT,
ADD COLUMN IF NOT EXISTS cekici_plakasi TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS dorse_plakasi TEXT,
ADD COLUMN IF NOT EXISTS kasa_tipi TEXT,
ADD COLUMN IF NOT EXISTS tasima_kapasitesi_kg INTEGER,
ADD COLUMN IF NOT EXISTS kasko_bitis_tarihi DATE,
ADD COLUMN IF NOT EXISTS trafik_sigortasi_bitis_tarihi DATE,
ADD COLUMN IF NOT EXISTS yetki_belgesi TEXT,
ADD COLUMN IF NOT EXISTS ruhsat_dosyasi_url TEXT;

-- Drop old constraints if they conflict (like vehicle_type check)
ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_vehicle_type_check;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_drivers_driver_code ON drivers(driver_code);
CREATE INDEX IF NOT EXISTS idx_vehicles_vehicle_code ON vehicles(vehicle_code);