BEGIN;

ALTER TABLE public.financial_accounts
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'rex_tys',
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS provider_environment text,
  ADD COLUMN IF NOT EXISTS kolaybi_vault_id bigint,
  ADD COLUMN IF NOT EXISTS provider_type text,
  ADD COLUMN IF NOT EXISTS provider_balance numeric(18,2),
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;

ALTER TABLE public.financial_accounts DROP CONSTRAINT IF EXISTS financial_accounts_source_check;
ALTER TABLE public.financial_accounts ADD CONSTRAINT financial_accounts_source_check
  CHECK (source IN ('rex_tys','kolaybi'));
ALTER TABLE public.financial_accounts DROP CONSTRAINT IF EXISTS financial_accounts_provider_environment_check;
ALTER TABLE public.financial_accounts ADD CONSTRAINT financial_accounts_provider_environment_check
  CHECK (provider_environment IS NULL OR provider_environment IN ('test','live'));
CREATE UNIQUE INDEX IF NOT EXISTS financial_accounts_kolaybi_identity_uidx
  ON public.financial_accounts(provider_environment,kolaybi_vault_id)
  WHERE source='kolaybi' AND kolaybi_vault_id IS NOT NULL;

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'rex_tys',
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS provider_environment text,
  ADD COLUMN IF NOT EXISTS provider_vault_id bigint,
  ADD COLUMN IF NOT EXISTS provider_transactionable_id bigint,
  ADD COLUMN IF NOT EXISTS provider_transaction_id bigint,
  ADD COLUMN IF NOT EXISTS provider_transaction_type text,
  ADD COLUMN IF NOT EXISTS provider_transaction_subtype text,
  ADD COLUMN IF NOT EXISTS provider_payment_method text,
  ADD COLUMN IF NOT EXISTS cash_flow_direction smallint,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'TRY',
  ADD COLUMN IF NOT EXISTS exchange_rate numeric(18,8),
  ADD COLUMN IF NOT EXISTS exchange_amount numeric(18,2),
  ADD COLUMN IF NOT EXISTS quote_currency text,
  ADD COLUMN IF NOT EXISTS cumulative_balance numeric(18,2),
  ADD COLUMN IF NOT EXISTS associate_name text,
  ADD COLUMN IF NOT EXISTS project_names text,
  ADD COLUMN IF NOT EXISTS raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;

ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_source_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_source_check CHECK (source IN ('rex_tys','kolaybi'));
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_provider_environment_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_provider_environment_check
  CHECK (provider_environment IS NULL OR provider_environment IN ('test','live'));
CREATE UNIQUE INDEX IF NOT EXISTS transactions_kolaybi_identity_uidx
  ON public.transactions(provider_environment,provider_vault_id,provider_transactionable_id)
  WHERE source='kolaybi' AND provider_vault_id IS NOT NULL AND provider_transactionable_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS transactions_provider_date_idx
  ON public.transactions(provider_environment,transaction_date DESC);

ALTER TABLE public.account_transactions
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'rex_tys',
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS provider_environment text,
  ADD COLUMN IF NOT EXISTS provider_associate_id bigint,
  ADD COLUMN IF NOT EXISTS provider_transactionable_id bigint,
  ADD COLUMN IF NOT EXISTS provider_transaction_id bigint,
  ADD COLUMN IF NOT EXISTS provider_transaction_type text,
  ADD COLUMN IF NOT EXISTS provider_transaction_subtype text,
  ADD COLUMN IF NOT EXISTS provider_payment_method text,
  ADD COLUMN IF NOT EXISTS cash_flow_direction smallint,
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS exchange_rate numeric(18,8),
  ADD COLUMN IF NOT EXISTS exchange_amount numeric(18,2),
  ADD COLUMN IF NOT EXISTS quote_currency text,
  ADD COLUMN IF NOT EXISTS cumulative_balance numeric(18,2),
  ADD COLUMN IF NOT EXISTS raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;

ALTER TABLE public.account_transactions DROP CONSTRAINT IF EXISTS account_transactions_source_check;
ALTER TABLE public.account_transactions ADD CONSTRAINT account_transactions_source_check CHECK (source IN ('rex_tys','kolaybi'));
ALTER TABLE public.account_transactions DROP CONSTRAINT IF EXISTS account_transactions_provider_environment_check;
ALTER TABLE public.account_transactions ADD CONSTRAINT account_transactions_provider_environment_check
  CHECK (provider_environment IS NULL OR provider_environment IN ('test','live'));
CREATE UNIQUE INDEX IF NOT EXISTS account_transactions_kolaybi_identity_uidx
  ON public.account_transactions(provider_environment,provider_associate_id,provider_transactionable_id)
  WHERE source='kolaybi' AND provider_associate_id IS NOT NULL AND provider_transactionable_id IS NOT NULL;

ALTER TABLE public.kolaybi_master_records DROP CONSTRAINT IF EXISTS kolaybi_master_records_resource_type_check;
ALTER TABLE public.kolaybi_master_records ADD CONSTRAINT kolaybi_master_records_resource_type_check
  CHECK (resource_type IN ('company','associate','product','sales_invoice','purchase_invoice','payment','expense_type','general_expense','vault','vault_transaction','associate_transaction'));
ALTER TABLE public.kolaybi_master_records DROP CONSTRAINT IF EXISTS kolaybi_master_records_local_entity_type_check;
ALTER TABLE public.kolaybi_master_records ADD CONSTRAINT kolaybi_master_records_local_entity_type_check
  CHECK (local_entity_type IS NULL OR local_entity_type IN ('customer','product','sales_invoice','purchase_invoice','financial_account','financial_transaction','account_transaction','expense_type','general_expense'));
ALTER TABLE public.kolaybi_sync_runs DROP CONSTRAINT IF EXISTS kolaybi_sync_runs_resource_type_check;
ALTER TABLE public.kolaybi_sync_runs ADD CONSTRAINT kolaybi_sync_runs_resource_type_check
  CHECK (resource_type IN ('all','companies','associates','products','sales_invoices','purchase_invoices','payments','expense_types','general_expenses','vaults','vault_transactions','associate_transactions'));
ALTER TABLE public.kolaybi_sync_events DROP CONSTRAINT IF EXISTS kolaybi_sync_events_event_type_check;
ALTER TABLE public.kolaybi_sync_events ADD CONSTRAINT kolaybi_sync_events_event_type_check CHECK (event_type IN (
  'sync_started','record_matched','review_required','record_skipped','sync_completed','sync_failed',
  'manual_match','manual_ignore','mapping_reopened','product_imported_pending','product_sync_updated',
  'product_approved','product_rejected','associate_transactions_synced'
));

CREATE OR REPLACE FUNCTION public.rex_prevent_kolaybi_finance_delete() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.source='kolaybi' THEN
    RAISE EXCEPTION 'KolayBi finans kayıtları silinemez; kaynak sistemde düzeltilip yeniden senkronize edilmelidir';
  END IF;
  RETURN OLD;
END $$;

DROP TRIGGER IF EXISTS financial_accounts_kolaybi_no_delete_trg ON public.financial_accounts;
CREATE TRIGGER financial_accounts_kolaybi_no_delete_trg BEFORE DELETE ON public.financial_accounts
  FOR EACH ROW EXECUTE FUNCTION public.rex_prevent_kolaybi_finance_delete();
DROP TRIGGER IF EXISTS transactions_kolaybi_no_delete_trg ON public.transactions;
CREATE TRIGGER transactions_kolaybi_no_delete_trg BEFORE DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.rex_prevent_kolaybi_finance_delete();
DROP TRIGGER IF EXISTS account_transactions_kolaybi_no_delete_trg ON public.account_transactions;
CREATE TRIGGER account_transactions_kolaybi_no_delete_trg BEFORE DELETE ON public.account_transactions
  FOR EACH ROW EXECUTE FUNCTION public.rex_prevent_kolaybi_finance_delete();

COMMIT;
