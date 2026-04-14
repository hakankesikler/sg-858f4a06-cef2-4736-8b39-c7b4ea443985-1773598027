-- Create storage bucket for shipment documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('shipment-documents', 'shipment-documents', true) 
ON CONFLICT (id) DO NOTHING;

-- Set up security policies for the bucket (allow public read/write for now since it's a demo)
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'shipment-documents');
CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'shipment-documents');