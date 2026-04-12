-- Check if shipments table has the new structure or if it needs to be recreated
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shipments' AND column_name = 'shipment_code') THEN
    -- If shipments table exists but has old structure, we drop and recreate
    DROP TABLE IF EXISTS shipments CASCADE;
    
    CREATE TABLE shipments (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      shipment_code TEXT UNIQUE NOT NULL,
      driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
      vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
      customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      pickup_date DATE,
      delivery_date DATE,
      estimated_delivery_date DATE,
      cargo_type TEXT,
      cargo_weight DECIMAL(10,2),
      cargo_volume DECIMAL(10,2),
      cargo_description TEXT,
      price DECIMAL(12,2),
      currency TEXT DEFAULT 'TRY',
      payment_status TEXT DEFAULT 'beklemede',
      status TEXT DEFAULT 'beklemede',
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "shipments_select" ON shipments FOR SELECT USING (auth.uid() IS NOT NULL);
    CREATE POLICY "shipments_insert" ON shipments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
    CREATE POLICY "shipments_update" ON shipments FOR UPDATE USING (auth.uid() IS NOT NULL);
    CREATE POLICY "shipments_delete" ON shipments FOR DELETE USING (auth.uid() IS NOT NULL);
  END IF;
END $$;