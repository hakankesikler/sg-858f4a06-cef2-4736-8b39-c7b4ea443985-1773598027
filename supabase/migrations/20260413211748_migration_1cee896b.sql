-- Make origin and destination nullable (not required)
ALTER TABLE shipments
  ALTER COLUMN origin DROP NOT NULL,
  ALTER COLUMN destination DROP NOT NULL;

COMMENT ON COLUMN shipments.origin IS 'Çıkış noktası (opsiyonel - gönderici bilgisinden çıkarılabilir)';
COMMENT ON COLUMN shipments.destination IS 'Varış noktası (opsiyonel - alıcı bilgisinden çıkarılabilir)';