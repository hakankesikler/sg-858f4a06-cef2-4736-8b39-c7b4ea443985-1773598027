-- Now add ALL missing columns at once
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS ticaret_sicil_no TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS fax TEXT,
ADD COLUMN IF NOT EXISTS branch_address TEXT,
ADD COLUMN IF NOT EXISTS invoice_email TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS vade_gunu INTEGER,
ADD COLUMN IF NOT EXISTS sabit_iskonto NUMERIC,
ADD COLUMN IF NOT EXISTS supplier_category TEXT,
ADD COLUMN IF NOT EXISTS customer_code TEXT,
ADD COLUMN IF NOT EXISTS authorized_person_name TEXT,
ADD COLUMN IF NOT EXISTS authorized_person_phone TEXT,
ADD COLUMN IF NOT EXISTS authorized_person_email TEXT,
ADD COLUMN IF NOT EXISTS work_area TEXT,
ADD COLUMN IF NOT EXISTS specialty TEXT[],
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS payment_day INTEGER;

-- Add comments
COMMENT ON COLUMN customers.ticaret_sicil_no IS 'Ticaret sicil numarası';
COMMENT ON COLUMN customers.website IS 'Website URL';
COMMENT ON COLUMN customers.fax IS 'Faks numarası';
COMMENT ON COLUMN customers.branch_address IS 'Şube adresi';
COMMENT ON COLUMN customers.invoice_email IS 'Fatura e-posta adresi';
COMMENT ON COLUMN customers.postal_code IS 'Posta kodu';
COMMENT ON COLUMN customers.vade_gunu IS 'Vade günü sayısı';
COMMENT ON COLUMN customers.sabit_iskonto IS 'Sabit iskonto yüzdesi';
COMMENT ON COLUMN customers.supplier_category IS 'Tedarikçi kategorisi (nakliyeci, forwarder, diger)';
COMMENT ON COLUMN customers.customer_code IS 'Formatted customer code (CST-000001, NKL-000001, etc.)';
COMMENT ON COLUMN customers.authorized_person_name IS 'Yetkili kişi adı soyadı (nakliyeci için)';
COMMENT ON COLUMN customers.authorized_person_phone IS 'Yetkili kişi telefonu (nakliyeci için)';
COMMENT ON COLUMN customers.authorized_person_email IS 'Yetkili kişi e-posta (nakliyeci için)';
COMMENT ON COLUMN customers.work_area IS 'Çalışma bölgesi (nakliyeci için)';
COMMENT ON COLUMN customers.specialty IS 'Uzmanlık alanları (nakliyeci için)';
COMMENT ON COLUMN customers.payment_method IS 'Ödeme yöntemi (nakliyeci için)';
COMMENT ON COLUMN customers.payment_day IS 'Ödeme günü (nakliyeci için)';