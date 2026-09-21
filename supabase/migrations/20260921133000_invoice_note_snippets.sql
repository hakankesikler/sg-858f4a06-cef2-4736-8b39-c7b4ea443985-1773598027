-- Personal, named invoice-note drafts. They complement the existing company
-- invoice presentation templates without changing an invoice's category,
-- line description, tax treatment or bank-detail rules.

CREATE TABLE IF NOT EXISTS public.invoice_note_snippets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 2 AND 80),
  content text NOT NULL CHECK (char_length(trim(content)) BETWEEN 1 AND 5000),
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (created_by, name)
);

ALTER TABLE public.invoice_note_snippets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rex_invoice_note_snippets_select ON public.invoice_note_snippets;
CREATE POLICY rex_invoice_note_snippets_select ON public.invoice_note_snippets
  FOR SELECT TO authenticated
  USING (created_by = auth.uid());

DROP POLICY IF EXISTS rex_invoice_note_snippets_insert ON public.invoice_note_snippets;
CREATE POLICY rex_invoice_note_snippets_insert ON public.invoice_note_snippets
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS rex_invoice_note_snippets_update ON public.invoice_note_snippets;
CREATE POLICY rex_invoice_note_snippets_update ON public.invoice_note_snippets
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS rex_invoice_note_snippets_delete ON public.invoice_note_snippets;
CREATE POLICY rex_invoice_note_snippets_delete ON public.invoice_note_snippets
  FOR DELETE TO authenticated
  USING (created_by = auth.uid());

REVOKE ALL ON public.invoice_note_snippets FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_note_snippets TO authenticated;
