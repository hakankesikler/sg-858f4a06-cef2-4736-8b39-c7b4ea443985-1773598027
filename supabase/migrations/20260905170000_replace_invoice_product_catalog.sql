BEGIN;

-- Fatura seçim kataloğu, genel ürün/hizmet çalışma alanından ayrı yönetilir.
-- Eski kartlar silinmez; böylece geçmiş fatura ve alış kayıtları korunur.
ALTER TABLE public.products_services
  ADD COLUMN IF NOT EXISTS invoice_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS invoice_sort_order integer;

CREATE INDEX IF NOT EXISTS products_services_invoice_catalog_idx
  ON public.products_services(invoice_enabled,is_active,invoice_sort_order,name)
  WHERE invoice_enabled=true;

CREATE TEMP TABLE IF NOT EXISTS rex_requested_invoice_catalog (
  code text PRIMARY KEY,
  name text NOT NULL,
  product_type text NOT NULL,
  sort_order integer NOT NULL
) ON COMMIT DROP;
TRUNCATE rex_requested_invoice_catalog;

INSERT INTO rex_requested_invoice_catalog(code,name,product_type,sort_order) VALUES
  ('HZM000002','Taşıma Bedeli','Hizmet',1),
  ('HZM000021','EXPRESS TAŞIMA Bedeli','Hizmet',2),
  ('HZM000003','Uluslararası Parsiyel Taşıma Hizmeti','Hizmet',3),
  ('HZM000025','Kara Navlun Bedeli','Hizmet',4),
  ('HZM000022','Deniz Navlunu (All In)','Hizmet',5),
  ('URN000006','Hava Kargo Taşıma Bedeli','Ürün',6),
  ('HZM000019','Kargo Hizmetbedeli','Hizmet',7),
  ('HZM000013','Denız Navlunu','Hizmet',8),
  ('HZM000012','Konşimento Ücreti','Hizmet',9),
  ('URN000011','Ardiye Bedeli','Ürün',10),
  ('HZM000024','Vgw - Vgm Tartımucretı','Hizmet',11),
  ('HZM000023','Vgm Admın Fee','Hizmet',12),
  ('HZM000026','Gümrük Vergisi','Hizmet',13),
  ('HZM000011','Vgm Admın Fee','Hizmet',14),
  ('URN000009','Imco Stıcker','Ürün',15),
  ('HZM000006','Depolama','Hizmet',16),
  ('HZM000027','Şrinkleme','Hizmet',17),
  ('HZM000008','Elleçleme - Paletleme Hizmeti','Hizmet',18),
  ('URN000004','Hasar Bedeli','Ürün',19),
  ('HZM000018','İade Faturası','Hizmet',20);

-- Önceki PRD/KB-TEST ve diğer katalog kartlarını fatura seçiminden çıkar.
UPDATE public.products_services p
SET invoice_enabled=false,
    is_active=false,
    updated_at=now()
WHERE NOT EXISTS (
  SELECT 1 FROM rex_requested_invoice_catalog requested
  WHERE requested.code=upper(trim(p.code))
);

-- İstenen kodlar tek kanonik kart olarak tutulur. KolayBi kimliği kod
-- eşleşmesiyle daha sonra test veya canlı ortamdan otomatik güncellenir.
INSERT INTO public.products_services(
  code,name,type,category,unit,is_active,external_source,provider_code,
  approval_status,invoice_enabled,invoice_sort_order,notes
)
SELECT
  requested.code,requested.name,requested.product_type,'KolayBi Fatura Kataloğu',
  'Adet',true,'manual',requested.code,'approved',true,requested.sort_order,
  'KolayBi ürün/hizmet koduyla otomatik eşleşen REX TYS fatura kalemi.'
FROM rex_requested_invoice_catalog requested
ORDER BY requested.sort_order
ON CONFLICT (code) DO UPDATE SET
  name=EXCLUDED.name,
  type=EXCLUDED.type,
  category=EXCLUDED.category,
  is_active=true,
  external_source='manual',
  provider_code=EXCLUDED.provider_code,
  approval_status='approved',
  invoice_enabled=true,
  invoice_sort_order=EXCLUDED.invoice_sort_order,
  notes=EXCLUDED.notes,
  updated_at=now();

-- Eski kod eşlemeleri yeni faturalarda kullanılamaz.
UPDATE public.invoice_product_mappings mapping
SET active=false,updated_at=now()
WHERE NOT EXISTS (
  SELECT 1 FROM rex_requested_invoice_catalog requested
  WHERE requested.code=upper(trim(mapping.product_code))
);

-- Daha önce KolayBi'den okunmuş kimlikleri kod üzerinden yeni kanonik
-- kartlara ve fatura eşlemelerine bağla. Canlı kayıt varsa test kaydına
-- göre önceliklidir.
WITH ranked_provider AS (
  SELECT
    upper(trim(master.external_code)) AS code,
    master.external_id::bigint AS kolaybi_product_id,
    master.provider_environment,
    row_number() OVER (
      PARTITION BY upper(trim(master.external_code))
      ORDER BY CASE WHEN master.provider_environment='live' THEN 0 ELSE 1 END,
               master.last_seen_at DESC
    ) AS priority
  FROM public.kolaybi_master_records master
  JOIN rex_requested_invoice_catalog requested
    ON requested.code=upper(trim(master.external_code))
  WHERE master.resource_type='product'
    AND master.external_id ~ '^[0-9]+$'
), selected_provider AS (
  SELECT code,kolaybi_product_id,provider_environment
  FROM ranked_provider WHERE priority=1
)
UPDATE public.products_services product
SET kolaybi_product_id=provider.kolaybi_product_id,
    provider_environment=provider.provider_environment,
    provider_code=provider.code,
    last_synced_at=now(),
    updated_at=now()
FROM selected_provider provider
WHERE product.code=provider.code AND product.invoice_enabled=true;

INSERT INTO public.invoice_product_mappings(
  product_code,kolaybi_product_id,description,vat_rate,active,updated_at
)
SELECT
  product.code,product.kolaybi_product_id,product.name,product.tax_rate,true,now()
FROM public.products_services product
WHERE product.invoice_enabled=true AND product.kolaybi_product_id IS NOT NULL
ON CONFLICT (product_code) DO UPDATE SET
  kolaybi_product_id=EXCLUDED.kolaybi_product_id,
  description=EXCLUDED.description,
  vat_rate=EXCLUDED.vat_rate,
  active=true,
  updated_at=now();

UPDATE public.kolaybi_master_records master
SET local_entity_type='product',
    local_entity_id=product.id,
    match_status='matched'
FROM public.products_services product
WHERE master.resource_type='product'
  AND upper(trim(master.external_code))=product.code
  AND product.invoice_enabled=true;

COMMENT ON COLUMN public.products_services.invoice_enabled IS
  'Only active rows enabled here may be selected on sales invoice lines.';

COMMIT;
