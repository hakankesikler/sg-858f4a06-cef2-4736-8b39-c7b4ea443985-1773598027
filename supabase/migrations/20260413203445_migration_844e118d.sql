-- Step 1: Add new columns for forwarder/airline carriers
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS carrier_type TEXT DEFAULT 'karayolu' 
    CHECK (carrier_type IN ('karayolu', 'forwarder', 'nvocc', 'havayolu_acentesi', 'gsa')),
  ADD COLUMN IF NOT EXISTS iata_code TEXT,
  ADD COLUMN IF NOT EXISTS fiata_number TEXT,
  ADD COLUMN IF NOT EXISTS scac_code TEXT,
  ADD COLUMN IF NOT EXISTS airline_prefix TEXT,
  ADD COLUMN IF NOT EXISTS imo_ism_number TEXT,
  ADD COLUMN IF NOT EXISTS service_types TEXT[], -- ['FCL', 'LCL', 'AIR_EXPORT', 'AIR_IMPORT']
  ADD COLUMN IF NOT EXISTS service_regions TEXT[], -- ['EUROPE', 'FAR_EAST', 'AMERICAS', 'MIDDLE_EAST']
  ADD COLUMN IF NOT EXISTS equipment_types TEXT[], -- ['20DC', '40HC', 'REEFER', 'OT', 'FR']
  ADD COLUMN IF NOT EXISTS has_contract BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS contract_file_url TEXT,
  ADD COLUMN IF NOT EXISTS insurance_type TEXT,
  ADD COLUMN IF NOT EXISTS policy_number TEXT;

-- Step 2: Update supplier_category constraint to include new types
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_supplier_category_check;
ALTER TABLE customers ADD CONSTRAINT customers_supplier_category_check 
  CHECK (supplier_category IN ('nakliyeci', 'forwarder', 'nvocc', 'havayolu_acentesi', 'diger'));

-- Step 3: Create index for carrier_type for faster filtering
CREATE INDEX IF NOT EXISTS idx_customers_carrier_type ON customers(carrier_type);

-- Step 4: Add comment to explain the new structure
COMMENT ON COLUMN customers.carrier_type IS 'Taşıyıcı alt türü: karayolu, forwarder, nvocc, havayolu_acentesi, gsa';
COMMENT ON COLUMN customers.service_types IS 'Hizmet türleri: FCL, LCL, AIR_EXPORT, AIR_IMPORT, TRANSIT, DEPOLAMA, TERMINAL_HANDLING, EXPRESS';
COMMENT ON COLUMN customers.service_regions IS 'Hizmet bölgeleri: EUROPE, FAR_EAST, AMERICAS, MIDDLE_EAST, AFRICA, DOMESTIC';
COMMENT ON COLUMN customers.equipment_types IS 'Ekipman tipleri: 20DC, 40DC, 40HC, OT, FR, REEFER, DG, PERISHABLE, PHARMA';