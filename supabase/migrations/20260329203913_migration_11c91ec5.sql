-- ============================================
-- 2. LOGISTICS MODULE TABLES
-- ============================================

-- Vehicles (Araçlar)
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_no TEXT NOT NULL UNIQUE,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('Kamyon', 'Kamyonet', 'Tır', 'Van')),
  driver_name TEXT,
  driver_phone TEXT,
  status TEXT DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Bakımda', 'Devre Dışı')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Warehouses (Depolar)
CREATE TABLE warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  capacity INTEGER DEFAULT 1000,
  current_stock INTEGER DEFAULT 0,
  manager_name TEXT,
  manager_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shipments (Sevkiyatlar)
CREATE TABLE shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_no TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  status TEXT DEFAULT 'Hazırlanıyor' CHECK (status IN ('Hazırlanıyor', 'Yolda', 'Dağıtımda', 'Teslim Edildi', 'İptal')),
  cargo_type TEXT,
  weight DECIMAL(10,2),
  eta TIMESTAMPTZ,
  delivery_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vehicles
CREATE POLICY "Users can view all vehicles" ON vehicles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert vehicles" ON vehicles FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update vehicles" ON vehicles FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete vehicles" ON vehicles FOR DELETE USING (auth.uid() IS NOT NULL);

-- RLS Policies for warehouses
CREATE POLICY "Users can view all warehouses" ON warehouses FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert warehouses" ON warehouses FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update warehouses" ON warehouses FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete warehouses" ON warehouses FOR DELETE USING (auth.uid() IS NOT NULL);

-- RLS Policies for shipments
CREATE POLICY "Users can view all shipments" ON shipments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert shipments" ON shipments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update shipments" ON shipments FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete shipments" ON shipments FOR DELETE USING (auth.uid() IS NOT NULL);