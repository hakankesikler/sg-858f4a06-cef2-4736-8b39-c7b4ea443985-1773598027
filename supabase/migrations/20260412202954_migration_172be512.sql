-- Add missing nakliyeci columns to customers table
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS authorized_person_name TEXT,
ADD COLUMN IF NOT EXISTS authorized_person_phone TEXT,
ADD COLUMN IF NOT EXISTS authorized_person_email TEXT,
ADD COLUMN IF NOT EXISTS work_area TEXT,
ADD COLUMN IF NOT EXISTS specialty TEXT[],
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS payment_day INTEGER;

-- Add comments
COMMENT ON COLUMN customers.authorized_person_name IS 'Yetkili kişi adı (nakliyeci için)';
COMMENT ON COLUMN customers.authorized_person_phone IS 'Yetkili kişi telefonu (nakliyeci için)';
COMMENT ON COLUMN customers.authorized_person_email IS 'Yetkili kişi emaili (nakliyeci için)';
COMMENT ON COLUMN customers.work_area IS 'Çalışma alanı (nakliyeci için)';
COMMENT ON COLUMN customers.specialty IS 'Uzmanlık alanları (nakliyeci için)';
COMMENT ON COLUMN customers.payment_method IS 'Ödeme yöntemi (nakliyeci için)';
COMMENT ON COLUMN customers.payment_day IS 'Ödeme günü (nakliyeci için)';