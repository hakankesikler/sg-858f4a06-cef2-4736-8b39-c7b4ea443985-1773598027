-- Duplicate cari kontrolü için unique constraint
-- Aynı ünvan + aynı vergi numarası kombinasyonu engellenir
-- NOT: PostgreSQL'de NULL değerler unique constraint'ten muaftır
-- Yani vergi_no NULL olan kayıtlar bu kuraldan etkilenmez

ALTER TABLE customers 
ADD CONSTRAINT customers_name_vergi_no_unique 
UNIQUE (name, vergi_no);

-- İndeks performansı için (opsiyonel)
CREATE INDEX IF NOT EXISTS idx_customers_name_vergi_no 
ON customers(name, vergi_no) 
WHERE vergi_no IS NOT NULL;