-- Cari ödeme/tahsilat tablosu oluştur
CREATE TABLE customer_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('odeme', 'tahsilat', 'virman')),
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Nakit', 'Havale', 'EFT', 'Kredi Kartı', 'Çek', 'Senet')),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  bank_account_id UUID REFERENCES financial_accounts(id) ON DELETE SET NULL,
  reference_no TEXT,
  description TEXT,
  related_invoice_id UUID REFERENCES sales_invoices(id) ON DELETE SET NULL,
  related_purchase_id UUID REFERENCES purchases(id) ON DELETE SET NULL,
  source_customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  target_customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  currency TEXT NOT NULL DEFAULT 'TRY' CHECK (currency IN ('TRY', 'USD', 'EUR', 'GBP')),
  exchange_rate NUMERIC(10,4) DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS politikaları
ALTER TABLE customer_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view customer payments"
  ON customer_payments FOR SELECT
  TO public
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert customer payments"
  ON customer_payments FOR INSERT
  TO public
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update customer payments"
  ON customer_payments FOR UPDATE
  TO public
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete customer payments"
  ON customer_payments FOR DELETE
  TO public
  USING (auth.uid() IS NOT NULL);

-- Indexler
CREATE INDEX idx_customer_payments_customer ON customer_payments(customer_id);
CREATE INDEX idx_customer_payments_date ON customer_payments(payment_date DESC);
CREATE INDEX idx_customer_payments_type ON customer_payments(transaction_type);
CREATE INDEX idx_customer_payments_invoice ON customer_payments(related_invoice_id);
CREATE INDEX idx_customer_payments_purchase ON customer_payments(related_purchase_id);

COMMENT ON TABLE customer_payments IS 'Cari ödeme ve tahsilat kayıtları';
COMMENT ON COLUMN customer_payments.transaction_type IS 'İşlem türü: odeme (cariye ödeme), tahsilat (cariden tahsilat), virman (cari virman)';
COMMENT ON COLUMN customer_payments.source_customer_id IS 'Virman işlemlerinde kaynak cari';
COMMENT ON COLUMN customer_payments.target_customer_id IS 'Virman işlemlerinde hedef cari';