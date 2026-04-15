-- 1. shipments tablosuna faturalama kolonları ekle
ALTER TABLE shipments 
ADD COLUMN IF NOT EXISTS invoice_status TEXT DEFAULT 'beklemede',
ADD COLUMN IF NOT EXISTS sale_invoice_id UUID REFERENCES sales_invoices(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS purchase_invoice_id UUID REFERENCES purchases(id) ON DELETE SET NULL;

-- 2. invoice_status için CHECK constraint
ALTER TABLE shipments DROP CONSTRAINT IF EXISTS shipments_invoice_status_check;
ALTER TABLE shipments ADD CONSTRAINT shipments_invoice_status_check 
CHECK (invoice_status IN ('beklemede', 'faturalandi', 'kismenfaturalandi'));

-- 3. Index ekle
CREATE INDEX IF NOT EXISTS idx_shipments_invoice_status ON shipments(invoice_status);
CREATE INDEX IF NOT EXISTS idx_shipments_sale_invoice ON shipments(sale_invoice_id);
CREATE INDEX IF NOT EXISTS idx_shipments_purchase_invoice ON shipments(purchase_invoice_id);

-- 4. Yorum ekle
COMMENT ON COLUMN shipments.invoice_status IS 'Sevkiyat faturalama durumu: beklemede, faturalandi, kismenfaturalandi';
COMMENT ON COLUMN shipments.sale_invoice_id IS 'Müşteriye kesilen satış faturası ID';
COMMENT ON COLUMN shipments.purchase_invoice_id IS 'Tedarikçiden gelen alış faturası ID';