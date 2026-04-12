-- 1. Create Storage Buckets for files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('driver-documents', 'driver-documents', true) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('vehicle-documents', 'vehicle-documents', true) 
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies if any to prevent conflicts
DROP POLICY IF EXISTS "Public Access Driver Docs" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert Driver Docs" ON storage.objects;
DROP POLICY IF EXISTS "Public Access Vehicle Docs" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert Vehicle Docs" ON storage.objects;

-- 3. Create simple policies for file uploads (allow authenticated users)
CREATE POLICY "Public Access Driver Docs" ON storage.objects FOR SELECT USING (bucket_id = 'driver-documents');
CREATE POLICY "Public Insert Driver Docs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'driver-documents');
CREATE POLICY "Public Access Vehicle Docs" ON storage.objects FOR SELECT USING (bucket_id = 'vehicle-documents');
CREATE POLICY "Public Insert Vehicle Docs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'vehicle-documents');