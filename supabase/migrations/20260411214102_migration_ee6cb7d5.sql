-- Eğer RLS blokluyor ise public read policy ekle
DROP POLICY IF EXISTS "public_read_leads" ON leads;
CREATE POLICY "public_read_leads" ON leads FOR SELECT USING (true);

DROP POLICY IF EXISTS "anon_insert_leads" ON leads;
CREATE POLICY "anon_insert_leads" ON leads FOR INSERT WITH CHECK (true);