BEGIN;

-- KolayBi'nin duz gider tipi listesini REX rapor kategorileriyle birlestirir.
-- Gecmis baglari korumak icin kategori ve tipler silinmez, pasife alinir.
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 2 AND 120),
  normalized_name text GENERATED ALWAYS AS (lower(btrim(name))) STORED,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 100 CHECK (sort_order >= 0),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (normalized_name)
);

CREATE TABLE IF NOT EXISTS public.expense_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.expense_categories(id) ON DELETE RESTRICT,
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 2 AND 160),
  normalized_name text GENERATED ALWAYS AS (lower(btrim(name))) STORED,
  description text,
  source text NOT NULL DEFAULT 'rex_tys' CHECK (source IN ('rex_tys','kolaybi')),
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 100 CHECK (sort_order >= 0),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id,normalized_name)
);

CREATE TABLE IF NOT EXISTS public.expense_type_provider_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_type_id uuid NOT NULL REFERENCES public.expense_types(id) ON DELETE RESTRICT,
  provider text NOT NULL DEFAULT 'kolaybi' CHECK (provider='kolaybi'),
  provider_environment text NOT NULL CHECK (provider_environment IN ('test','live')),
  external_id bigint NOT NULL CHECK (external_id > 0),
  provider_name text NOT NULL,
  provider_description text,
  last_synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider,provider_environment,external_id)
);

CREATE TABLE IF NOT EXISTS public.expense_catalog_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('category','expense_type','provider_mapping')),
  entity_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('created','updated','activated','deactivated','provider_synced')),
  old_data jsonb,
  new_data jsonb,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  actor_email text DEFAULT lower(coalesce(auth.jwt()->>'email','')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS expense_types_category_idx ON public.expense_types(category_id,is_active,sort_order,name);
CREATE INDEX IF NOT EXISTS expense_type_provider_mappings_type_idx ON public.expense_type_provider_mappings(expense_type_id,provider_environment);
CREATE INDEX IF NOT EXISTS expense_catalog_events_entity_idx ON public.expense_catalog_events(entity_type,entity_id,created_at DESC);

ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_category_check;
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_status_check;
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.expense_categories(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS type_id uuid REFERENCES public.expense_types(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'rex_tys',
  ADD COLUMN IF NOT EXISTS provider_environment text,
  ADD COLUMN IF NOT EXISTS kolaybi_document_id bigint,
  ADD COLUMN IF NOT EXISTS kolaybi_financial_action_type_id bigint,
  ADD COLUMN IF NOT EXISTS provider_document_no text,
  ADD COLUMN IF NOT EXISTS provider_status text,
  ADD COLUMN IF NOT EXISTS e_document_status text,
  ADD COLUMN IF NOT EXISTS payment_status text,
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'TRY',
  ADD COLUMN IF NOT EXISTS balance numeric(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS provider_total numeric(15,2),
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;
ALTER TABLE public.expenses
  ADD CONSTRAINT expenses_source_check CHECK (source IN ('rex_tys','kolaybi')),
  ADD CONSTRAINT expenses_provider_environment_check CHECK (provider_environment IS NULL OR provider_environment IN ('test','live')),
  ADD CONSTRAINT expenses_status_check CHECK (status IN ('Taslak','Yeni','Ödendi','Kısmi Ödendi','Bekliyor','Onay Bekliyor','İptal')),
  ADD CONSTRAINT expenses_currency_check CHECK (currency IN ('TRY','USD','EUR','GBP'));
CREATE UNIQUE INDEX IF NOT EXISTS expenses_kolaybi_identity_uidx ON public.expenses(provider_environment,kolaybi_document_id)
  WHERE source='kolaybi' AND kolaybi_document_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS expenses_category_type_idx ON public.expenses(category_id,type_id,expense_date DESC);

INSERT INTO public.expense_categories(name,sort_order) VALUES
  ('Kategorisiz',10),('Kurumsal Giderler',20),('Finansal',30),('Demirbaş',40),
  ('Ulaşım / Konaklama',50),('Temel Giderler',60),('Vergi',70),('Diğer',80),
  ('Taşıma Faturaları',90),('Yazılım',100),('Araç Bakım ve Onarım',110)
ON CONFLICT (normalized_name) DO UPDATE SET sort_order=EXCLUDED.sort_order;

WITH seed(category_name,type_name,sort_order) AS (VALUES
  ('Kategorisiz','İçecek',10),('Kategorisiz','Yiyecek',20),
  ('Kurumsal Giderler','İş Sağlığı Güvenliği Danışmanlık Hizmeti',10),('Kurumsal Giderler','Freight Forwarding Sigortası',20),
  ('Kurumsal Giderler','Ticaret Odası Giderleri',30),('Kurumsal Giderler','Noter Giderleri',40),
  ('Kurumsal Giderler','Elektrik',50),('Kurumsal Giderler','Su',60),('Kurumsal Giderler','Doğalgaz',70),
  ('Kurumsal Giderler','Kömür',80),('Kurumsal Giderler','İnternet',90),('Kurumsal Giderler','Trafik Cezası',100),
  ('Kurumsal Giderler','HGS',110),('Kurumsal Giderler','OGS',120),('Kurumsal Giderler','Belediye Ödemesi',130),('Kurumsal Giderler','SGK',140),
  ('Finansal','Vakıfbank Sky Kobi Dijital Kredi',10),('Finansal','Vakıfbank Tam Esnaf Standart Kredi',20),
  ('Finansal','Halkbank İhtiyaç Kredisi',30),('Finansal','EFT',40),('Finansal','Havale',50),('Finansal','Faiz',60),('Finansal','Komisyon',70),
  ('Demirbaş','Mobilya',10),('Demirbaş','Ofis Eşyası',20),('Demirbaş','Donanım',30),('Demirbaş','Temizlik',40),
  ('Ulaşım / Konaklama','Seyahat Harcaması',10),('Ulaşım / Konaklama','Akaryakıt',20),('Ulaşım / Konaklama','Araç Kiralama',30),
  ('Ulaşım / Konaklama','Otopark Ücreti',40),('Ulaşım / Konaklama','Taksi',50),('Ulaşım / Konaklama','Bilet',60),
  ('Temel Giderler','Kargo Ödemesi',10),('Temel Giderler','Kira',20),('Temel Giderler','Yemek Harcaması',30),
  ('Temel Giderler','Muhasebe/Mali Müşavir',40),('Temel Giderler','İletişim Gideri',50),('Temel Giderler','Ağırlama Gideri',60),
  ('Temel Giderler','Kırtasiye',70),('Temel Giderler','Eğlence',80),('Temel Giderler','Eğitim',90),
  ('Temel Giderler','Fuar ve Organizasyon',100),('Temel Giderler','Abonelik Ücreti',110),('Temel Giderler','Bakım',120),('Temel Giderler','Temizlik',130),
  ('Vergi','MTV (Motorlu Taşıtlar)',10),('Vergi','Gerçek Usulde Katma Değer Vergisi',20),('Vergi','Kurumlar Vergisi',30),
  ('Vergi','AGİ',40),('Vergi','Stopaj',50),('Vergi','Damga Vergisi',60),('Vergi','Gümrük Vergisi',70),
  ('Vergi','Belediye Vergileri',80),('Vergi','Belediye Harçları',90),
  ('Diğer','Marka / Patent',10),('Diğer','Ulaştırma Bakanlığı Taşıma İşleri Organizatörlüğü Yetki Belgesi Ödemesi',20),
  ('Diğer','Market',30),('Diğer','Kargo',40),('Diğer','Reklam/Tanıtım',50),
  ('Taşıma Faturaları','Full Truck Taşıma',10),('Taşıma Faturaları','Parsiyel Taşıma',20),
  ('Yazılım','Freight Forwarding Yazılımı',10),
  ('Araç Bakım ve Onarım','Araç Tamir ve Bakım Giderleri',10),('Araç Bakım ve Onarım','Araç Donanım Giderleri',20)
)
INSERT INTO public.expense_types(category_id,name,sort_order)
SELECT c.id,s.type_name,s.sort_order FROM seed s JOIN public.expense_categories c ON c.name=s.category_name
ON CONFLICT (category_id,normalized_name) DO UPDATE SET sort_order=EXCLUDED.sort_order;

UPDATE public.expenses e SET type_id=t.id,category_id=t.category_id
FROM public.expense_types t WHERE e.type_id IS NULL AND t.normalized_name=lower(btrim(e.category));
UPDATE public.expenses e SET category_id=c.id FROM public.expense_categories c
WHERE e.category_id IS NULL AND c.name='Diğer';

ALTER TABLE public.kolaybi_master_records DROP CONSTRAINT IF EXISTS kolaybi_master_records_resource_type_check;
ALTER TABLE public.kolaybi_master_records ADD CONSTRAINT kolaybi_master_records_resource_type_check
  CHECK (resource_type IN ('company','associate','product','sales_invoice','purchase_invoice','payment','expense_type','general_expense'));
ALTER TABLE public.kolaybi_master_records DROP CONSTRAINT IF EXISTS kolaybi_master_records_local_entity_type_check;
ALTER TABLE public.kolaybi_master_records ADD CONSTRAINT kolaybi_master_records_local_entity_type_check
  CHECK (local_entity_type IS NULL OR local_entity_type IN ('customer','product','sales_invoice','purchase_invoice','financial_transaction','expense_type','general_expense'));
ALTER TABLE public.kolaybi_sync_runs DROP CONSTRAINT IF EXISTS kolaybi_sync_runs_resource_type_check;
ALTER TABLE public.kolaybi_sync_runs ADD CONSTRAINT kolaybi_sync_runs_resource_type_check
  CHECK (resource_type IN ('all','companies','associates','products','sales_invoices','purchase_invoices','payments','expense_types','general_expenses'));

CREATE OR REPLACE FUNCTION public.rex_expense_catalog_audit() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
  v_entity_type text := CASE TG_TABLE_NAME WHEN 'expense_categories' THEN 'category' WHEN 'expense_types' THEN 'expense_type' ELSE 'provider_mapping' END;
  v_action text;
BEGIN
  IF TG_OP='INSERT' THEN v_action := CASE WHEN TG_TABLE_NAME='expense_type_provider_mappings' THEN 'provider_synced' ELSE 'created' END;
  ELSIF (to_jsonb(OLD)->>'is_active') IS DISTINCT FROM (to_jsonb(NEW)->>'is_active') THEN
    v_action := CASE WHEN coalesce((to_jsonb(NEW)->>'is_active')::boolean,false) THEN 'activated' ELSE 'deactivated' END;
  ELSE v_action := CASE WHEN TG_TABLE_NAME='expense_type_provider_mappings' THEN 'provider_synced' ELSE 'updated' END;
  END IF;
  INSERT INTO public.expense_catalog_events(entity_type,entity_id,action,old_data,new_data)
  VALUES (v_entity_type,NEW.id,v_action,CASE WHEN TG_OP='UPDATE' THEN to_jsonb(OLD) END,to_jsonb(NEW));
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS expense_categories_audit_trg ON public.expense_categories;
CREATE TRIGGER expense_categories_audit_trg AFTER INSERT OR UPDATE ON public.expense_categories FOR EACH ROW EXECUTE FUNCTION public.rex_expense_catalog_audit();
DROP TRIGGER IF EXISTS expense_types_audit_trg ON public.expense_types;
CREATE TRIGGER expense_types_audit_trg AFTER INSERT OR UPDATE ON public.expense_types FOR EACH ROW EXECUTE FUNCTION public.rex_expense_catalog_audit();
DROP TRIGGER IF EXISTS expense_type_provider_mappings_audit_trg ON public.expense_type_provider_mappings;
CREATE TRIGGER expense_type_provider_mappings_audit_trg AFTER INSERT OR UPDATE ON public.expense_type_provider_mappings FOR EACH ROW EXECUTE FUNCTION public.rex_expense_catalog_audit();

CREATE OR REPLACE FUNCTION public.rex_prevent_expense_catalog_delete() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Gider kategorileri ve tipleri silinemez; geçmiş kayıtlar için pasife alınmalıdır'; END $$;
DROP TRIGGER IF EXISTS expense_categories_no_delete_trg ON public.expense_categories;
CREATE TRIGGER expense_categories_no_delete_trg BEFORE DELETE ON public.expense_categories FOR EACH ROW EXECUTE FUNCTION public.rex_prevent_expense_catalog_delete();
DROP TRIGGER IF EXISTS expense_types_no_delete_trg ON public.expense_types;
CREATE TRIGGER expense_types_no_delete_trg BEFORE DELETE ON public.expense_types FOR EACH ROW EXECUTE FUNCTION public.rex_prevent_expense_catalog_delete();

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_type_provider_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_catalog_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can insert expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete expenses" ON public.expenses;
DROP POLICY IF EXISTS rex_select ON public.expenses;
DROP POLICY IF EXISTS rex_write ON public.expenses;
DROP POLICY IF EXISTS rex_permission_select ON public.expenses;
DROP POLICY IF EXISTS rex_permission_write ON public.expenses;
CREATE POLICY expenses_select_policy ON public.expenses FOR SELECT TO authenticated USING (public.rex_has_permission('accounting.expenses','view'));
CREATE POLICY expenses_insert_policy ON public.expenses FOR INSERT TO authenticated WITH CHECK (public.rex_has_permission('accounting.expenses','manage'));
CREATE POLICY expenses_update_policy ON public.expenses FOR UPDATE TO authenticated USING (public.rex_has_permission('accounting.expenses','manage')) WITH CHECK (public.rex_has_permission('accounting.expenses','manage'));
CREATE POLICY expense_categories_select_policy ON public.expense_categories FOR SELECT TO authenticated USING (public.rex_has_permission('accounting.expenses','view'));
CREATE POLICY expense_categories_insert_policy ON public.expense_categories FOR INSERT TO authenticated WITH CHECK (public.rex_has_permission('accounting.expenses','manage'));
CREATE POLICY expense_categories_update_policy ON public.expense_categories FOR UPDATE TO authenticated USING (public.rex_has_permission('accounting.expenses','manage')) WITH CHECK (public.rex_has_permission('accounting.expenses','manage'));
CREATE POLICY expense_types_select_policy ON public.expense_types FOR SELECT TO authenticated USING (public.rex_has_permission('accounting.expenses','view'));
CREATE POLICY expense_types_insert_policy ON public.expense_types FOR INSERT TO authenticated WITH CHECK (public.rex_has_permission('accounting.expenses','manage'));
CREATE POLICY expense_types_update_policy ON public.expense_types FOR UPDATE TO authenticated USING (public.rex_has_permission('accounting.expenses','manage')) WITH CHECK (public.rex_has_permission('accounting.expenses','manage'));
CREATE POLICY expense_type_mappings_select_policy ON public.expense_type_provider_mappings FOR SELECT TO authenticated USING (public.rex_has_permission('accounting.expenses','view'));
CREATE POLICY expense_catalog_events_select_policy ON public.expense_catalog_events FOR SELECT TO authenticated USING (public.rex_has_permission('accounting.expenses','manage'));
GRANT SELECT,INSERT,UPDATE ON public.expense_categories,public.expense_types TO authenticated;
GRANT SELECT ON public.expense_type_provider_mappings,public.expense_catalog_events TO authenticated;

COMMIT;
