-- Create detailed sales invoice system (Fixed)
CREATE TABLE IF NOT EXISTS sales_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  invoice_no TEXT NOT NULL UNIQUE,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'Bekliyor' CHECK (payment_status IN ('Ödendi', 'Bekliyor', 'Gecikmiş', 'Kısmi Ödendi')),
  payment_method TEXT,
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_tax DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_discount DECIMAL(15,2) NOT NULL DEFAULT 0,
  shipping_cost DECIMAL(15,2) NOT NULL DEFAULT 0,
  general_discount DECIMAL(15,2) NOT NULL DEFAULT 0,
  grand_total DECIMAL(15,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'TRY',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES sales_invoices(id) ON DELETE CASCADE,
  product_code TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'Adet',
  unit_price DECIMAL(15,2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  total DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sales_invoices_customer ON sales_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_date ON sales_invoices(invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_status ON sales_invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_items_invoice ON sales_invoice_items(invoice_id);

-- Enable RLS
ALTER TABLE sales_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_invoice_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view sales invoices" ON sales_invoices FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert sales invoices" ON sales_invoices FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update sales invoices" ON sales_invoices FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete sales invoices" ON sales_invoices FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view invoice items" ON sales_invoice_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert invoice items" ON sales_invoice_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update invoice items" ON sales_invoice_items FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete invoice items" ON sales_invoice_items FOR DELETE USING (auth.uid() IS NOT NULL);