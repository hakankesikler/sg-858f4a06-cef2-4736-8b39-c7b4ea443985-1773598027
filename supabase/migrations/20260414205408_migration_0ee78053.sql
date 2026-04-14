-- Create shipment_cargo_items table for multiple cargo lines
CREATE TABLE IF NOT EXISTS shipment_cargo_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  adet INTEGER NOT NULL CHECK (adet > 0),
  cinsi TEXT NOT NULL,
  kg_ds DECIMAL(10,2) NOT NULL CHECK (kg_ds > 0),
  alt_toplam DECIMAL(10,2) GENERATED ALWAYS AS (adet * kg_ds) STORED,
  sira_no INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_shipment_cargo_items_shipment_id 
  ON shipment_cargo_items(shipment_id);

-- Add RLS policies
ALTER TABLE shipment_cargo_items ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users
CREATE POLICY "auth_all_cargo_items" ON shipment_cargo_items
  FOR ALL USING (true);

-- Add comments
COMMENT ON TABLE shipment_cargo_items IS 'Sevkiyat yük kalemleri - bir sevkiyat birden fazla yük kalemine sahip olabilir';
COMMENT ON COLUMN shipment_cargo_items.adet IS 'Koli/palet/paket sayısı';
COMMENT ON COLUMN shipment_cargo_items.cinsi IS 'Yük cinsi (Koli, Palet, vb.)';
COMMENT ON COLUMN shipment_cargo_items.kg_ds IS 'Birim ağırlık (kg/desi)';
COMMENT ON COLUMN shipment_cargo_items.alt_toplam IS 'Otomatik hesaplanan alt toplam (adet × kg_ds)';
COMMENT ON COLUMN shipment_cargo_items.sira_no IS 'Sıra numarası';