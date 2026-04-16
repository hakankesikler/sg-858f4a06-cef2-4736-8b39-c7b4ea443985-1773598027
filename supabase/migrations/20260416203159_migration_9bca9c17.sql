-- sales_invoices ve purchases tablolarına shipment_id kolonu ekle
ALTER TABLE sales_invoices 
ADD COLUMN IF NOT EXISTS shipment_id UUID REFERENCES shipments(id) ON DELETE SET NULL;

ALTER TABLE purchases 
ADD COLUMN IF NOT EXISTS shipment_id UUID REFERENCES shipments(id) ON DELETE SET NULL;

-- Index'ler ekle
CREATE INDEX IF NOT EXISTS idx_sales_invoices_shipment_id ON sales_invoices(shipment_id);
CREATE INDEX IF NOT EXISTS idx_purchases_shipment_id ON purchases(shipment_id);

-- Açıklamalar
COMMENT ON COLUMN sales_invoices.shipment_id IS 'İlgili sevkiyat ID (teslim edilmiş sevkiyatlar için)';
COMMENT ON COLUMN purchases.shipment_id IS 'İlgili sevkiyat ID (teslim edilmiş sevkiyatlar için)';