-- Add supplier_id to shipments table
ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES customers(id) ON DELETE SET NULL;

COMMENT ON COLUMN shipments.supplier_id IS 'Tedarikçi (fatura carisi - ödeme yapılacak firma)';