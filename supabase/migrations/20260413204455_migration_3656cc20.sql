-- Add new fields to shipments table for detailed shipping information
ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS sender_ii TEXT,
  ADD COLUMN IF NOT EXISTS receiver TEXT,
  ADD COLUMN IF NOT EXISTS receiver_district TEXT,
  ADD COLUMN IF NOT EXISTS receiver_ii TEXT,
  ADD COLUMN IF NOT EXISTS adet INTEGER,
  ADD COLUMN IF NOT EXISTS cinsi TEXT,
  ADD COLUMN IF NOT EXISTS kg_ds NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS toplam_kg_ds NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS satis_birim NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS satis_tutar NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS mali TEXT;

COMMENT ON COLUMN shipments.sender_ii IS 'İkinci gönderici (opsiyonel)';
COMMENT ON COLUMN shipments.receiver IS 'Alıcı adı/firma';
COMMENT ON COLUMN shipments.receiver_district IS 'Alıcı ilçe';
COMMENT ON COLUMN shipments.receiver_ii IS 'İkinci alıcı (opsiyonel)';
COMMENT ON COLUMN shipments.adet IS 'Koli/paket adedi';
COMMENT ON COLUMN shipments.cinsi IS 'Yük cinsi/türü';
COMMENT ON COLUMN shipments.kg_ds IS 'Birim ağırlık/desi (KG)';
COMMENT ON COLUMN shipments.toplam_kg_ds IS 'Toplam ağırlık/desi (otomatik hesaplanan)';
COMMENT ON COLUMN shipments.satis_birim IS 'Birim satış fiyatı';
COMMENT ON COLUMN shipments.satis_tutar IS 'Toplam satış tutarı (otomatik hesaplanan)';
COMMENT ON COLUMN shipments.mali IS 'Mali durum/ödeme durumu';