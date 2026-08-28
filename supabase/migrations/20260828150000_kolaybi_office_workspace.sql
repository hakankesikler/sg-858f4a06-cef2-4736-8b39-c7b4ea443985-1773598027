BEGIN;

-- KolayBi is the accounting provider, while REX TYS remains the operational
-- source of truth. These tables keep provider snapshots, durable sync state
-- and an immutable event trail without storing provider credentials.

CREATE TABLE IF NOT EXISTS public.kolaybi_master_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type text NOT NULL CHECK (resource_type IN ('company','associate','product','sales_invoice','purchase_invoice','payment')),
  external_id text NOT NULL,
  local_entity_type text CHECK (local_entity_type IN ('customer','product','sales_invoice','purchase_invoice','financial_transaction')),
  local_entity_id uuid,
  match_status text NOT NULL DEFAULT 'review_required' CHECK (match_status IN ('matched','review_required','ignored','error')),
  display_name text,
  external_code text,
  tax_identity text,
  currency text,
  amount numeric(18,2),
  provider_updated_at timestamptz,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (resource_type, external_id)
);

CREATE INDEX IF NOT EXISTS kolaybi_master_records_resource_idx
  ON public.kolaybi_master_records(resource_type, match_status, last_seen_at DESC);
CREATE INDEX IF NOT EXISTS kolaybi_master_records_local_idx
  ON public.kolaybi_master_records(local_entity_type, local_entity_id)
  WHERE local_entity_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.kolaybi_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type text NOT NULL CHECK (resource_type IN ('all','companies','associates','products','sales_invoices','purchase_invoices','payments')),
  direction text NOT NULL DEFAULT 'pull' CHECK (direction IN ('pull','push','status')),
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running','completed','partial','failed')),
  idempotency_key text NOT NULL UNIQUE CHECK (length(idempotency_key) BETWEEN 16 AND 128),
  received_count integer NOT NULL DEFAULT 0 CHECK (received_count >= 0),
  matched_count integer NOT NULL DEFAULT 0 CHECK (matched_count >= 0),
  review_count integer NOT NULL DEFAULT 0 CHECK (review_count >= 0),
  failed_count integer NOT NULL DEFAULT 0 CHECK (failed_count >= 0),
  last_error text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS kolaybi_sync_runs_started_idx
  ON public.kolaybi_sync_runs(started_at DESC);

CREATE TABLE IF NOT EXISTS public.kolaybi_sync_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid REFERENCES public.kolaybi_sync_runs(id) ON DELETE RESTRICT,
  resource_type text NOT NULL,
  external_id text,
  event_type text NOT NULL CHECK (event_type IN ('sync_started','record_matched','review_required','record_skipped','sync_completed','sync_failed')),
  status text NOT NULL CHECK (status IN ('info','success','warning','error')),
  summary text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kolaybi_sync_events_occurred_idx
  ON public.kolaybi_sync_events(occurred_at DESC);

ALTER TABLE public.kolaybi_master_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kolaybi_sync_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kolaybi_sync_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rex_kolaybi_records_select ON public.kolaybi_master_records;
CREATE POLICY rex_kolaybi_records_select ON public.kolaybi_master_records
  FOR SELECT TO authenticated USING (
    public.rex_has_permission('integrations.monitoring','view') OR
    public.rex_has_permission('accounting.sales','view') OR
    public.rex_has_permission('accounting.purchase','view') OR
    public.rex_has_permission('accounting.accounts','view')
  );

DROP POLICY IF EXISTS rex_kolaybi_runs_select ON public.kolaybi_sync_runs;
CREATE POLICY rex_kolaybi_runs_select ON public.kolaybi_sync_runs
  FOR SELECT TO authenticated USING (
    public.rex_has_permission('integrations.monitoring','view') OR
    public.rex_has_permission('integrations.connections','view')
  );

DROP POLICY IF EXISTS rex_kolaybi_events_select ON public.kolaybi_sync_events;
CREATE POLICY rex_kolaybi_events_select ON public.kolaybi_sync_events
  FOR SELECT TO authenticated USING (
    public.rex_has_permission('integrations.monitoring','view') OR
    public.rex_has_permission('integrations.connections','view')
  );

REVOKE INSERT,UPDATE,DELETE ON public.kolaybi_master_records FROM authenticated;
REVOKE INSERT,UPDATE,DELETE ON public.kolaybi_sync_runs FROM authenticated;
REVOKE INSERT,UPDATE,DELETE ON public.kolaybi_sync_events FROM authenticated;
GRANT SELECT ON public.kolaybi_master_records,public.kolaybi_sync_runs,public.kolaybi_sync_events TO authenticated;

CREATE OR REPLACE FUNCTION public.rex_kolaybi_events_append_only()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'KolayBi entegrasyon denetim kayıtları değiştirilemez veya silinemez';
END $$;

DROP TRIGGER IF EXISTS rex_kolaybi_events_append_only ON public.kolaybi_sync_events;
CREATE TRIGGER rex_kolaybi_events_append_only
  BEFORE UPDATE OR DELETE ON public.kolaybi_sync_events
  FOR EACH ROW EXECUTE FUNCTION public.rex_kolaybi_events_append_only();

COMMIT;
