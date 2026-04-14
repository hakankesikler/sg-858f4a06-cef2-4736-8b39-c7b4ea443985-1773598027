-- Add pricing columns to shipment_cargo_items
ALTER TABLE shipment_cargo_items
  ADD COLUMN IF NOT EXISTS birim_fiyat DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS alt_toplam_fiyat DECIMAL(10, 2) DEFAULT 0;

COMMENT ON COLUMN shipment_cargo_items.birim_fiyat IS 'Birim fiyat (her koli/palet/sandık için)';
COMMENT ON COLUMN shipment_cargo_items.alt_toplam_fiyat IS 'Alt toplam fiyat (adet × birim_fiyat)';