-- Dynamic invoice descriptions and selectable REX TYS bank details.
-- KolayBi accepts invoice-level description but has no dedicated bank-account
-- input on invoice creation, so the selected account snapshot is appended to
-- the official invoice description before the queue becomes visible.

CREATE TABLE IF NOT EXISTS public.invoice_note_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN (
    'domestic_transport','international_transport','exempt_transport',
    'withholding_transport','other'
  )),
  line_description_template text NOT NULL,
  notes text NOT NULL,
  kolaybi_document_type text NOT NULL DEFAULT 'SATIS',
  default_vat_rate numeric(5,2) NOT NULL DEFAULT 20 CHECK (default_vat_rate BETWEEN 0 AND 100),
  default_exemption_code text,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 100,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS invoice_note_templates_one_default_per_category
  ON public.invoice_note_templates(category) WHERE is_default=true AND is_active=true;

CREATE TABLE IF NOT EXISTS public.invoice_bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  account_holder text NOT NULL,
  bank_name text NOT NULL,
  branch_name text,
  account_no text,
  iban text NOT NULL,
  swift_code text,
  currency text NOT NULL DEFAULT 'TRY' CHECK (currency IN ('TRY','USD','EUR','GBP')),
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 100,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS invoice_bank_accounts_iban_unique
  ON public.invoice_bank_accounts(regexp_replace(upper(iban),'\s','','g'));

ALTER TABLE public.sales_invoices
  ADD COLUMN IF NOT EXISTS invoice_category text NOT NULL DEFAULT 'domestic_transport',
  ADD COLUMN IF NOT EXISTS invoice_note_template_id uuid REFERENCES public.invoice_note_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS include_bank_details boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bank_accounts_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS kolaybi_document_type text NOT NULL DEFAULT 'SATIS';

ALTER TABLE public.sales_invoices DROP CONSTRAINT IF EXISTS sales_invoices_invoice_category_check;
ALTER TABLE public.sales_invoices ADD CONSTRAINT sales_invoices_invoice_category_check CHECK (
  invoice_category IN ('domestic_transport','international_transport','exempt_transport','withholding_transport','other')
);
ALTER TABLE public.sales_invoices DROP CONSTRAINT IF EXISTS sales_invoices_bank_snapshot_array_check;
ALTER TABLE public.sales_invoices ADD CONSTRAINT sales_invoices_bank_snapshot_array_check
  CHECK (jsonb_typeof(bank_accounts_snapshot)='array');

ALTER TABLE public.invoice_note_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_bank_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rex_invoice_note_templates_select ON public.invoice_note_templates;
CREATE POLICY rex_invoice_note_templates_select ON public.invoice_note_templates
  FOR SELECT TO authenticated USING (public.rex_has_role(ARRAY['admin','accounting','operations']));
DROP POLICY IF EXISTS rex_invoice_note_templates_write ON public.invoice_note_templates;
CREATE POLICY rex_invoice_note_templates_write ON public.invoice_note_templates
  FOR ALL TO authenticated
  USING (public.rex_has_role(ARRAY['admin','accounting']))
  WITH CHECK (public.rex_has_role(ARRAY['admin','accounting']));

DROP POLICY IF EXISTS rex_invoice_bank_accounts_select ON public.invoice_bank_accounts;
CREATE POLICY rex_invoice_bank_accounts_select ON public.invoice_bank_accounts
  FOR SELECT TO authenticated USING (public.rex_has_role(ARRAY['admin','accounting','operations']));
DROP POLICY IF EXISTS rex_invoice_bank_accounts_write ON public.invoice_bank_accounts;
CREATE POLICY rex_invoice_bank_accounts_write ON public.invoice_bank_accounts
  FOR ALL TO authenticated
  USING (public.rex_has_role(ARRAY['admin','accounting']))
  WITH CHECK (public.rex_has_role(ARRAY['admin','accounting']));

REVOKE ALL ON public.invoice_note_templates,public.invoice_bank_accounts FROM anon;
GRANT SELECT ON public.invoice_note_templates,public.invoice_bank_accounts TO authenticated;
GRANT INSERT,UPDATE,DELETE ON public.invoice_note_templates,public.invoice_bank_accounts TO authenticated;

INSERT INTO public.invoice_note_templates(
  code,name,category,line_description_template,notes,kolaybi_document_type,
  default_vat_rate,default_exemption_code,is_default,display_order
) VALUES
  ('YURTICI_TASIMA','Yurtiçi taşıma','domestic_transport',
   '{{shipment_code}} numaralı {{origin}} → {{destination}} yurtiçi karayolu taşıma hizmeti.',
   E'Taşıma İşleri Organizatörlüğü Belge No: İZM.U-NET.TİO.35.6323\nSevkiyat ve güzergâh bilgileri fatura kaleminde belirtilmiştir.\nFaturaya ilişkin itirazların yasal süre içinde yazılı olarak bildirilmesi gerekir.',
   'SATIS',20,NULL,true,10),
  ('ULUSLARARASI_TASIMA','Uluslararası taşıma','international_transport',
   '{{shipment_code}} numaralı {{origin}} → {{destination}} uluslararası taşıma hizmeti.',
   E'Taşıma İşleri Organizatörlüğü Belge No: İZM.U-NET.TİO.35.6323\nUluslararası taşımanın güzergâhı, sevkiyat referansı ve kullanılan para birimi fatura kaleminde belirtilmiştir.\nFaturaya ilişkin itirazların yasal süre içinde yazılı olarak bildirilmesi gerekir.',
   'SATIS',20,NULL,true,20),
  ('ISTISNA_TASIMA','KDV istisnalı taşıma','exempt_transport',
   '{{shipment_code}} numaralı {{origin}} → {{destination}} taşıma hizmeti.',
   E'Taşıma İşleri Organizatörlüğü Belge No: İZM.U-NET.TİO.35.6323\nKDV istisna kodu ve yasal istisna gerekçesi fatura kaleminde ayrıca gösterilmiştir.\nSevkiyat referansı ve güzergâh bilgileri fatura kaleminde belirtilmiştir.',
   'ISTISNA',0,NULL,true,30),
  ('TEVKIFATLI_TASIMA','Tevkifatlı taşıma','withholding_transport',
   '{{shipment_code}} numaralı {{origin}} → {{destination}} taşıma hizmeti.',
   E'Taşıma İşleri Organizatörlüğü Belge No: İZM.U-NET.TİO.35.6323\nUygulanan tevkifat kodu ve oranı ilgili fatura kaleminde gösterilmiştir.\nSevkiyat referansı ve güzergâh bilgileri fatura kaleminde belirtilmiştir.',
   'TEVKIFAT',20,NULL,true,40),
  ('DIGER_HIZMET','Diğer hizmet','other',
   '{{service_type}} hizmeti.',
   E'Taşıma İşleri Organizatörlüğü Belge No: İZM.U-NET.TİO.35.6323\nHizmetin kapsamı fatura kaleminde ve ilgili iş referansında belirtilmiştir.',
   'SATIS',20,NULL,true,50)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.invoice_bank_accounts(
  label,account_holder,bank_name,iban,currency,is_default,display_order
) VALUES(
  'Ana TL Hesabı',
  'REX LOJİSTİK TAŞIMACILIK DEPOLAMA DANIŞMANLIK LİMİTED ŞİRKETİ',
  'Banka Hesabı',
  'TR24 0001 5001 5800 7355 9235 06',
  'TRY',true,10
) ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.rex_create_sales_invoice_secure_v2(
  p_customer_id uuid,
  p_shipment_ids uuid[],
  p_invoice_date date,
  p_due_date date,
  p_currency text,
  p_payment_status text,
  p_notes text,
  p_items jsonb,
  p_document_type text DEFAULT 'e_archive',
  p_document_scenario text DEFAULT 'EARSIVFATURA',
  p_exchange_rate numeric DEFAULT 1,
  p_idempotency_key text DEFAULT NULL,
  p_invoice_category text DEFAULT 'domestic_transport',
  p_note_template_id uuid DEFAULT NULL,
  p_bank_account_ids uuid[] DEFAULT '{}'::uuid[],
  p_include_bank_details boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public,pg_temp
AS $$
DECLARE
  v_template public.invoice_note_templates%ROWTYPE;
  v_bank_ids uuid[] := coalesce(p_bank_account_ids,'{}'::uuid[]);
  v_bank_text text;
  v_bank_snapshot jsonb := '[]'::jsonb;
  v_notes text := nullif(trim(p_notes),'');
  v_result jsonb;
  v_invoice_id uuid;
  v_kolaybi_document_type text := 'SATIS';
BEGIN
  IF p_invoice_category NOT IN ('domestic_transport','international_transport','exempt_transport','withholding_transport','other') THEN
    RAISE EXCEPTION 'Geçersiz fatura açıklama türü';
  END IF;

  IF p_note_template_id IS NOT NULL THEN
    SELECT * INTO v_template FROM public.invoice_note_templates
    WHERE id=p_note_template_id AND is_active=true;
    IF NOT FOUND THEN RAISE EXCEPTION 'Fatura not şablonu bulunamadı veya pasif'; END IF;
    IF v_template.category<>p_invoice_category THEN RAISE EXCEPTION 'Not şablonu seçilen fatura türüyle uyumlu değil'; END IF;
    IF v_notes IS NULL THEN v_notes:=v_template.notes; END IF;
    v_kolaybi_document_type:=v_template.kolaybi_document_type;
  ELSE
    SELECT * INTO v_template FROM public.invoice_note_templates
    WHERE category=p_invoice_category AND is_active=true AND is_default=true
    ORDER BY display_order,id LIMIT 1;
    IF FOUND THEN
      IF v_notes IS NULL THEN v_notes:=v_template.notes; END IF;
      p_note_template_id:=v_template.id;
      v_kolaybi_document_type:=v_template.kolaybi_document_type;
    END IF;
  END IF;

  IF p_include_bank_details THEN
    IF coalesce(cardinality(v_bank_ids),0)=0 THEN
      SELECT coalesce(array_agg(id ORDER BY display_order,label),'{}'::uuid[]) INTO v_bank_ids
      FROM public.invoice_bank_accounts WHERE is_active=true AND is_default=true;
    END IF;

    SELECT
      coalesce(jsonb_agg(jsonb_build_object(
        'id',id,'label',label,'account_holder',account_holder,'bank_name',bank_name,
        'branch_name',branch_name,'account_no',account_no,'iban',iban,
        'swift_code',swift_code,'currency',currency
      ) ORDER BY display_order,label),'[]'::jsonb),
      string_agg(
        concat(
          label,E'\n',account_holder,E'\n',bank_name,
          CASE WHEN nullif(branch_name,'') IS NOT NULL THEN ' · '||branch_name ELSE '' END,E'\n',
          'IBAN: ',iban,' · ',currency,
          CASE WHEN nullif(swift_code,'') IS NOT NULL THEN E'\nSWIFT: '||swift_code ELSE '' END
        ),E'\n\n' ORDER BY display_order,label
      )
    INTO v_bank_snapshot,v_bank_text
    FROM public.invoice_bank_accounts
    WHERE is_active=true AND id=ANY(v_bank_ids);

    IF coalesce(cardinality(v_bank_ids),0)>0 AND v_bank_text IS NULL THEN
      RAISE EXCEPTION 'Seçilen banka hesapları bulunamadı veya pasif';
    END IF;
    IF v_bank_text IS NOT NULL THEN
      v_notes:=concat_ws(E'\n\n',v_notes,E'Banka Bilgilerimiz:\n'||v_bank_text);
    END IF;
  END IF;

  v_result:=public.rex_create_sales_invoice_secure(
    p_customer_id,p_shipment_ids,p_invoice_date,p_due_date,p_currency,p_payment_status,
    coalesce(v_notes,''),p_items,p_document_type,p_document_scenario,p_exchange_rate,p_idempotency_key
  );

  IF coalesce((v_result->>'already_exists')::boolean,false)=false THEN
    v_invoice_id:=(v_result->>'id')::uuid;
    UPDATE public.sales_invoices SET
      invoice_category=p_invoice_category,
      invoice_note_template_id=p_note_template_id,
      include_bank_details=p_include_bank_details,
      bank_accounts_snapshot=v_bank_snapshot,
      kolaybi_document_type=v_kolaybi_document_type,
      updated_at=now()
    WHERE id=v_invoice_id;
  END IF;

  RETURN v_result;
END $$;

REVOKE ALL ON FUNCTION public.rex_create_sales_invoice_secure_v2(
  uuid,uuid[],date,date,text,text,text,jsonb,text,text,numeric,text,text,uuid,uuid[],boolean
) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rex_create_sales_invoice_secure_v2(
  uuid,uuid[],date,date,text,text,text,jsonb,text,text,numeric,text,text,uuid,uuid[],boolean
) TO authenticated;

