-- Create a new policy that allows authenticated users to view all customers
CREATE POLICY "Authenticated users can view all customers" ON customers
FOR SELECT
USING (auth.role() = 'authenticated');