-- Add delivery fields to shipments table
ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS delivered_to TEXT,
  ADD COLUMN IF NOT EXISTS delivery_proof_url TEXT,
  ADD COLUMN IF NOT EXISTS actual_delivery_date TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN shipments.delivered_to IS 'Teslim alan kişinin adı';
COMMENT ON COLUMN shipments.delivery_proof_url IS 'Teslim evrakı dosya URL';
COMMENT ON COLUMN shipments.actual_delivery_date IS 'Fiili teslim tarihi (kullanıcı teslim ettiğinde)';