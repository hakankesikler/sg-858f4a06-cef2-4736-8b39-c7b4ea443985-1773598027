-- Add e_invoice_status column to sales_invoices table if it doesn't exist
ALTER TABLE sales_invoices 
ADD COLUMN IF NOT EXISTS e_invoice_status TEXT DEFAULT 'taslak';

-- Update existing records to have 'oluşturuldu' status
UPDATE sales_invoices 
SET e_invoice_status = 'oluşturuldu' 
WHERE e_invoice_status IS NULL;