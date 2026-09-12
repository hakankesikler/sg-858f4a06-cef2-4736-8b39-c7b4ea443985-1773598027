import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFile(resolve(root, path), "utf8");

test("GPSLine estimates keep acceptance day excluded and respect district service days", async () => {
  const [schema, seed, service, estimator, shipmentForm, salesScreen] = await Promise.all([
    read("supabase/migrations/20260831110000_gpsline_transit_estimator.sql"),
    read("supabase/migrations/20260831111000_gpsline_transit_schedule_seed.sql"),
    read("src/services/gpslineTransitService.ts"),
    read("src/components/GpslineDeliveryEstimator.tsx"),
    read("src/components/ShipmentForm.tsx"),
    read("src/components/modules/SalesCRMModule.tsx"),
  ]);
  assert.match(schema, /v_date := v_date \+ 1/);
  assert.match(schema, /extract\(isodow FROM v_date\).*BETWEEN 1 AND 5/s);
  assert.match(schema, /ANY\(v_route\.delivery_weekdays\)/);
  assert.match(schema, /'planned_departure_date', p_collection_date \+ 1/);
  assert.match(schema, /'adjusted_for_service_day'/);
  assert.equal((seed.match(/\('gpsline',/g) || []).length, 12060);
  assert.doesNotMatch(seed, /�/);
  assert.match(service, /rex_estimate_gpsline_delivery/);
  assert.match(estimator, /Tarihi ve Fiyatı Uygula/);
  assert.match(shipmentForm, /setEstimatedDeliveryDate\(value\.estimated_delivery_date\)/);
  assert.match(salesScreen, /transit_schedule_snapshot/);
});

test("GPSLine pallet pricing uses aggregate desi, a 250 minimum and a 35 percent markup", async () => {
  const [pricing, service, estimator, shipmentForm, salesScreen] = await Promise.all([
    read("supabase/migrations/20260831170000_gpsline_pricing.sql"),
    read("src/services/gpslineTransitService.ts"),
    read("src/components/GpslineDeliveryEstimator.tsx"),
    read("src/components/ShipmentForm.tsx"),
    read("src/components/modules/SalesCRMModule.tsx"),
  ]);
  assert.equal((pricing.match(/\('gpsline','/g) || []).length, 246);
  assert.match(pricing, /v_excess_desi := greatest\(p_total_desi_kg-v_tariff\.min_chargeable_desi_kg,0\)/);
  assert.match(pricing, /v_base_cost := round\(v_base_desi\*v_tariff\.cost_per_desi_kg,2\)/);
  assert.match(pricing, /v_cost := round\(v_base_cost\+v_excess_cost,2\)/);
  assert.doesNotMatch(pricing, /p_total_desi_kg > p_pallet_count \* 250/);
  assert.match(pricing, /v_recommended := round\(v_cost\*\(1\+v_tariff\.markup_rate\),2\)/);
  assert.match(pricing, /0\.35,'TRY','gpsline maliyet listesi\.xlsx'/);
  assert.doesNotMatch(pricing, /�/);
  assert.match(service, /rex_calculate_gpsline_price/);
  assert.match(estimator, /250 desi\/kg minimum fiyatlama basamağıdır; üst sınır değildir/);
  assert.match(estimator, /Artan \{price\.excess_desi_kg\.toLocaleString/);
  assert.match(estimator, /Önerilen minimum satış/);
  assert.doesNotMatch(shipmentForm, /invalidGpslinePallet|her palet en fazla 250/);
  assert.match(shipmentForm, /price\.recommended_sale_amount/);
  assert.match(salesScreen, /GPSLine parsiyel taşıma hizmeti/);
  assert.match(salesScreen, /cost_amount: String\(price\.cost_amount\)/);
  const adana450Cost = 250 * 9.09 + (450 - 250) * 9.09;
  assert.equal(adana450Cost, 4090.5);
  assert.equal(Math.round(adana450Cost * 1.35 * 100) / 100, 5522.18);
});

test("supplier classification separates hauliers from corporate carriers and protects carrier assignment", async () => {
  const [sql, permissions, form, cariForm, shipmentService, crmService] = await Promise.all([
    read("supabase/migrations/20260831193000_supplier_carrier_classification.sql"),
    read("src/lib/staff-permissions.ts"),
    read("src/components/ShipmentForm.tsx"),
    read("src/components/CariForm.tsx"),
    read("src/services/shipmentService.ts"),
    read("src/services/crmService.ts"),
  ]);
  assert.match(sql, /supplier_category IN \('nakliyeci','tasiyici','forwarder','diger'\)/);
  assert.match(sql, /LIKE '%gpsline%'/);
  assert.match(sql, /LIKE '%quickshipper%'/);
  assert.match(sql, /LIKE '%ergulkargo%'/);
  assert.match(sql, /operations\.carrier_assignment/);
  assert.match(sql, /rex_can_assign_transport_carrier/);
  assert.match(sql, /rex_customer_carrier_classification_guard/);
  assert.match(sql, /Kurumsal taşıyıcı ataması için ayrıca taşıyıcı atama yetkisi gereklidir/);
  assert.match(sql, /v_category='nakliyeci'[\s\S]*sürücü ve araç zorunludur/);
  assert.match(sql, /v_new_category='tasiyici'[\s\S]*NEW\.status='atama_bekliyor'[\s\S]*NEW\.status:='beklemede'/);
  assert.match(sql, /Nakliyeci sürücüsünün 11 haneli T\.C\. kimlik numarası zorunludur/);
  assert.match(sql, /Nakliyeci aracının plakası zorunludur/);
  assert.match(permissions, /operations\.carrier_assignment/);
  assert.doesNotMatch(permissions, /operations:\s*\{[^}]*operations\.carrier_assignment[^}]*\}/);
  assert.match(form, /selectedSupplierIsCarrier/);
  assert.match(form, /selectedSupplierIsHaulier/);
  assert.match(form, /Kurumsal taşıyıcı atandı/);
  assert.match(form, /Nakliyeci atamasında sürücü ve araç zorunludur/);
  assert.match(cariForm, /value="tasiyici">Taşıyıcı Firma/);
  assert.match(cariForm, /ref=\{emailInputRef\}[\s\S]*defaultValue=\{initialData\?\.email \|\| formData\.email\}/);
  assert.match(cariForm, /email: emailInputRef\.current\?\.value\.trim\(\) \|\| formData\.email/);
  assert.doesNotMatch(cariForm, /defaultValue=\{initialData\?\.email \|\| formData\.email\}[\s\S]{0,300}onInput=/);
  assert.match(cariForm, /inputMode="email"[\s\S]*autoComplete="email"[\s\S]*pattern=/);
  assert.match(cariForm, /value=\{formData\.address\}[\s\S]*const address = event\.currentTarget\.value;[\s\S]*setFormData\(\(current\) => \(\{ \.\.\.current, address \}\)\)/);
  assert.match(cariForm, /value=\{formData\.address_type\}[\s\S]*address_type: value/);
  assert.match(cariForm, /populatedCustomerRef\.current === customerKey/);
  assert.match(cariForm, /populatedCustomerRef\.current = customerKey/);
  assert.match(shipmentService, /rex_can_assign_transport_carrier/);
  assert.match(shipmentService, /customer:customers!shipments_customer_id_fkey/);
  assert.match(shipmentService, /supplier:customers!shipments_supplier_id_fkey/);
  assert.match(crmService, /supplierCategory === "tasiyici"[\s\S]*prefix = "TSY"/);
});

test("shipment queries disambiguate customer and operational supplier relations", async () => {
  const [shipmentService, logisticsService] = await Promise.all([
    read("src/services/shipmentService.ts"),
    read("src/services/logisticsService.ts"),
  ]);
  for (const source of [shipmentService, logisticsService]) {
    assert.match(source, /customers!shipments_customer_id_fkey/);
    assert.match(source, /customers!shipments_supplier_id_fkey/);
  }
  assert.doesNotMatch(shipmentService, /customer:customers\(id, customer_code, name, phone\)/);
  assert.doesNotMatch(logisticsService, /\.select\("\*, customers\(/);
});

test("shipment assignment still requires driver licence and vehicle registration", async () => {
  const sql = await read("supabase/migrations/20260818143000_transport_workflow_and_kolaybi.sql");
  assert.match(sql, /ehliyet_dosyasi_url/);
  assert.match(sql, /Sürücü ehliyet belgesi yüklenmeden atama yapılamaz/);
  assert.match(sql, /ruhsat_dosyasi_url/);
  assert.match(sql, /Araç ruhsatı yüklenmeden atama yapılamaz/);
  assert.match(sql, /PERFORM public\.rex_validate_assignment\(v_driver,v_vehicle\)/);
});

test("driver licence and vehicle registration upload without OCR or confirmation checkbox", async () => {
  const [driverForm, vehicleForm, cleanupMigration, packageJson, nextConfig] = await Promise.all([
    read("src/components/DriverForm.tsx"),
    read("src/components/VehicleForm.tsx"),
    read("supabase/migrations/20260905090000_remove_transport_document_confirmation.sql"),
    read("package.json"),
    read("next.config.mjs"),
  ]);
  assert.doesNotMatch(driverForm, /extractTransportDocumentLocally|ocrStatus|ocrProgress|tesseract|TransportDocumentReview|documentConfirmed|bilgileri_onaylandi_at/i);
  assert.doesNotMatch(vehicleForm, /extractTransportDocumentLocally|ocrStatus|ocrProgress|tesseract|TransportDocumentReview|documentConfirmed|bilgileri_onaylandi_at/i);
  assert.match(cleanupMigration, /DROP TRIGGER IF EXISTS rex_driver_document_confirmation_stamp/);
  assert.match(cleanupMigration, /DROP TRIGGER IF EXISTS rex_vehicle_document_confirmation_stamp/);
  assert.match(cleanupMigration, /DROP FUNCTION IF EXISTS public\.rex_stamp_transport_document_confirmation/);
  assert.doesNotMatch(packageJson, /tesseract|pdfjs|prepare-local-ocr/i);
  assert.doesNotMatch(nextConfig, /wasm-unsafe-eval/);
});

test("sales invoice lines use the active KolayBi product catalog", async () => {
  const dialog = await read("src/components/InvoiceDialog.tsx");
  assert.match(dialog, /from\("products_services"\)[\s\S]*\.eq\("invoice_enabled", true\)[\s\S]*\.eq\("is_active", true\)/);
  assert.match(dialog, /Katalog Ürünü \/ Hizmeti/);
  assert.match(dialog, /productCode: item\.productCode \|\| "HIZMET"/);
  assert.match(dialog, /kolaybiProductId: item\.kolaybiProductId \|\| null/);
  assert.match(dialog, /handleCatalogProductChange/);
});

test("invoice catalog is limited to the approved KolayBi code list and auto-matches by code", async () => {
  const [migration, syncApi] = await Promise.all([
    read("supabase/migrations/20260905170000_replace_invoice_product_catalog.sql"),
    read("src/pages/api/kolaybi/office-sync.ts"),
  ]);
  const expectedCodes = [
    "HZM000002", "HZM000021", "HZM000003", "HZM000025", "HZM000022",
    "URN000006", "HZM000019", "HZM000013", "HZM000012", "URN000011",
    "HZM000024", "HZM000023", "HZM000026", "HZM000011", "URN000009",
    "HZM000006", "HZM000027", "HZM000008", "URN000004", "HZM000018",
  ];
  for (const code of expectedCodes) assert.match(migration, new RegExp(`'${code}'`));
  assert.match(migration, /ADD COLUMN IF NOT EXISTS invoice_enabled boolean NOT NULL DEFAULT false/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS invoice_sort_order integer/);
  assert.match(migration, /SET invoice_enabled=false,[\s\S]*is_active=false/);
  assert.match(migration, /WHERE product\.invoice_enabled=true AND product\.kolaybi_product_id IS NOT NULL/);
  assert.match(migration, /match_status='matched'/);
  assert.match(syncApi, /\.eq\("code", canonicalCode\)[\s\S]*\.eq\("invoice_enabled", true\)/);
  assert.match(syncApi, /product_code: canonicalCode/);
  assert.match(syncApi, /kolaybi_product_id: externalId/);
  assert.match(syncApi, /description: invoiceProduct\.name \|\| canonicalCode/);
  assert.match(syncApi, /matchStatus: "matched"/);
});

test("delivery still requires a proof document and creates invoice-ready state", async () => {
  const sql = await read("supabase/migrations/20260818143000_transport_workflow_and_kolaybi.sql");
  const start = sql.indexOf("CREATE OR REPLACE FUNCTION public.rex_mark_shipment_delivered");
  const end = sql.indexOf("REVOKE ALL ON FUNCTION", start);
  const deliveryFunction = sql.slice(start, end);
  assert.ok(start >= 0, "Delivery function must exist");
  assert.match(deliveryFunction, /p_delivery_proof_url/);
  assert.match(deliveryFunction, /Teslim alan, teslim tarihi ve teslim evrakı zorunludur/);
  assert.match(deliveryFunction, /status='teslim_edildi'/);
  assert.match(deliveryFunction, /invoice_status='beklemede'/);
});

test("shipment deletion remains restricted to owner with exact code confirmation", async () => {
  const sql = await read("supabase/migrations/20260818183000_owner_only_shipment_delete.sql");
  assert.match(sql, /v_email <> 'info@rexlojistik\.com'/);
  assert.match(sql, /rex_has_role\(ARRAY\['admin'\]\)/);
  assert.match(sql, /trim\(p_confirmation_code\) <> v_code/);
  assert.match(sql, /CREATE POLICY rex_shipments_delete_owner_only[\s\S]*USING \(false\)/);
});

test("completed shipment changes remain owner-approved", async () => {
  const sql = await read("supabase/migrations/20260818193000_owner_approval_for_completed_shipment_edits.sql");
  assert.match(sql, /rex_completed_shipment_update_guard/);
  assert.match(sql, /v_email <> 'info@rexlojistik\.com'/);
  assert.match(sql, /Değişiklik için sevkiyat koduyla şirket sahibi onayı gereklidir/);
});

test("public tracking keeps random REX numbers and exposes only its safe RPC", async () => {
  const sql = await read("supabase/migrations/20260818203000_public_shipment_tracking.sql");
  assert.match(sql, /\^REX-\[A-F0-9\]\{16\}\$/);
  assert.match(sql, /CREATE UNIQUE INDEX IF NOT EXISTS shipments_tracking_number_unique/);
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.rex_public_track_shipment/);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.rex_public_track_shipment\(text\) TO anon,authenticated/);
});

test("public tracking shows only server-masked sender and receiver hints", async () => {
  const [sql, service, tracking] = await Promise.all([
    read("supabase/migrations/20260905150000_mask_public_tracking_parties.sql"),
    read("src/services/publicTrackingService.ts"),
    read("src/components/TrackingSection.tsx"),
  ]);
  const publicFunction = sql.slice(sql.indexOf("CREATE OR REPLACE FUNCTION public.rex_public_track_shipment"));
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.rex_mask_public_party_name/);
  assert.match(sql, /v_visible:=CASE WHEN char_length\(v_word\)<=3 THEN char_length\(v_word\) ELSE 2 END/);
  assert.match(publicFunction, /'sender_masked',public\.rex_mask_public_party_name\(s\.sender_name\)/);
  assert.match(publicFunction, /'receiver_masked',public\.rex_mask_public_party_name\(s\.receiver\)/);
  assert.doesNotMatch(publicFunction, /'sender_name',s\.sender_name/);
  assert.doesNotMatch(publicFunction, /'receiver',s\.receiver/);
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.rex_mask_public_party_name\(text\) FROM PUBLIC,anon,authenticated/);
  assert.match(service, /sender_masked\?: string \| null/);
  assert.match(service, /receiver_masked\?: string \| null/);
  assert.match(tracking, />Gönderici</);
  assert.match(tracking, /result\.sender_masked/);
  assert.match(tracking, />Alıcı</);
  assert.match(tracking, /result\.receiver_masked/);
});

test("public tracking masks the delivery recipient and limits proof access to 24 hours", async () => {
  const [hardenedSql, timedSql, api, deliveryApi, service, tracking] = await Promise.all([
    read("supabase/migrations/20260910143000_harden_public_tracking_privacy.sql"),
    read("supabase/migrations/20260911150000_public_delivery_document_24h.sql"),
    read("src/pages/api/tracking/express.ts"),
    read("src/pages/api/tracking/delivery-document.ts"),
    read("src/services/publicTrackingService.ts"),
    read("src/components/TrackingSection.tsx"),
  ]);
  const publicFunction = timedSql.slice(timedSql.indexOf("CREATE OR REPLACE FUNCTION public.rex_public_track_shipment"));
  assert.doesNotMatch(publicFunction, /'delivered_to'|'delivery_proof_url'|'provider_reference'/);
  assert.match(publicFunction, /'delivered_to_masked'.*rex_mask_public_party_name\(s\.delivered_to\)/s);
  assert.match(publicFunction, /'delivery_document_available_until'/);
  assert.match(publicFunction, /s\.delivered_at\+interval '24 hours'/);
  assert.match(timedSql, /ADD COLUMN IF NOT EXISTS delivered_at timestamptz/);
  assert.match(timedSql, /CREATE TRIGGER rex_shipments_stamp_delivered_at_insert/);
  assert.match(timedSql, /CREATE TRIGGER rex_shipments_stamp_delivered_at_update/);
  assert.match(hardenedSql, /DROP POLICY IF EXISTS rex_public_delivered_proof_select/);
  assert.match(hardenedSql, /REVOKE ALL ON FUNCTION public\.rex_is_delivered_proof_object\(text\) FROM PUBLIC,anon,authenticated/);
  assert.match(api, /delete shipment\.delivered_to/);
  assert.match(api, /delete shipment\.delivery_proof_url/);
  assert.match(api, /delete shipment\.provider_reference/);
  assert.match(deliveryApi, /\^REX-\[A-F0-9\]\{16\}\$/);
  assert.match(deliveryApi, /deliveredAt \+ accessWindowMs/);
  assert.match(deliveryApi, /allowedScanStatuses = new Set\(\["clean", "legacy_unscanned"\]\)/);
  assert.match(deliveryApi, /createR2ViewUrl/);
  assert.doesNotMatch(deliveryApi, /res\.status\(200\)\.json\([^)]*file_reference/s);
  assert.match(service, /delivered_to_masked\?: string \| null/);
  assert.match(service, /delivery_document_available_until\?: string \| null/);
  assert.match(tracking, /result\.delivered_to_masked/);
  assert.match(tracking, /Teslim Evrakını Görüntüle/);
  assert.match(tracking, /\/api\/tracking\/delivery-document\?tracking=/);
  assert.doesNotMatch(tracking, /result\.provider_reference/);
});

test("customer portal remains company-scoped and does not expose internal costs", async () => {
  const sql = await read("supabase/migrations/20260818224500_customer_portal.sql");
  const start = sql.indexOf("CREATE OR REPLACE FUNCTION public.rex_customer_portal_shipments");
  const end = sql.indexOf("REVOKE ALL ON FUNCTION", start);
  const portalFunction = sql.slice(start, end);
  assert.ok(start >= 0, "Customer shipment function must exist");
  assert.match(portalFunction, /WHERE s\.customer_id = v_customer_id/);
  assert.match(portalFunction, /WHERE user_id = auth\.uid\(\) AND active = true/);
  assert.doesNotMatch(portalFunction, /s\.cost|cost_currency|supplier_id|driver_id|vehicle_id|satis_tutar|satis_birim/);
  assert.match(sql, /token text NOT NULL UNIQUE/);
  assert.match(sql, /expires_at > now\(\)/);
});

test("critical public and staff entry points remain wired", async () => {
  const [header, home, staffLogin, customerLogin, tracking] = await Promise.all([
    read("src/components/Header.tsx"),
    read("src/pages/index.tsx"),
    read("src/pages/login.tsx"),
    read("src/pages/musteri-giris.tsx"),
    read("src/components/TrackingSection.tsx"),
  ]);
  assert.match(header, /href="\/musteri-giris"/);
  assert.match(header, /Müşteri Portalı/);
  assert.match(home, /<TrackingSection \/>/);
  assert.match(tracking, /rex_public_track_shipment|publicTrackingService\.track/);
  assert.match(staffLogin, /Taşıma Yönetim Sistemi/);
  assert.match(staffLogin, /REX TYS'ye güvenli giriş yapın/);
  assert.doesNotMatch(staffLogin, /REX Operasyon Portalı/);
  assert.match(customerLogin, /customerPortalService\.getProfile/);
});

test("work order and shipment audit trails remain append-only and actor-aware", async () => {
  const sql = await read("supabase/migrations/20260818233000_complete_audit_trail.sql");
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.transport_job_events/);
  assert.match(sql, /'job_created','job_updated','job_approved','job_rejected','job_deleted'/);
  assert.match(sql, /CREATE TRIGGER rex_transport_jobs_audit/);
  assert.match(sql, /actor_id,actor_email,actor_role/);
  assert.match(sql, /e\.event_type IN \('job_created','job_approved'\)/);
  assert.match(sql, /REVOKE INSERT,UPDATE,DELETE ON public\.transport_jobs FROM authenticated/);
  assert.match(sql, /CREATE TRIGGER rex_shipment_events_append_only[\s\S]*BEFORE UPDATE OR DELETE/);
  assert.match(sql, /CREATE TRIGGER rex_transport_job_events_append_only[\s\S]*BEFORE UPDATE OR DELETE/);
});

test("delivery proof and KolayBi synchronization keep distinct audit events", async () => {
  const [sql, api, history] = await Promise.all([
    read("supabase/migrations/20260818233000_complete_audit_trail.sql"),
    read("src/lib/kolaybi.ts"),
    read("src/components/ShipmentHistoryDialog.tsx"),
  ]);
  assert.match(sql, /CREATE TRIGGER rex_delivery_document_with_delivery_audit/);
  assert.match(sql, /'delivery_document_added'/);
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.rex_record_kolaybi_sync/);
  assert.match(sql, /'kolaybi_sync_started','kolaybi_sync_succeeded','kolaybi_sync_failed'/);
  assert.match(api, /rex_claim_invoice_sync_job/);
  assert.match(api, /rex_record_invoice_provider_document/);
  assert.match(api, /rex_record_invoice_sync_result/);
  assert.match(api, /classifyKolayBiEDocument/);
  assert.match(api, /identity\.uuid && identity\.invoiceNo/);
  assert.match(api, /hasVerifiedCustomerEDocumentProfile/);
  assert.match(api, /KolayBi\/entegratör mükellefiyet sorgusunun karar vermesini/);
  assert.match(api, /environment !== kolayBiEnvironment\(config\)/);
  assert.match(history, /kolaybi_sync_succeeded/);
});

test("work order history remains visible from the logistics screen", async () => {
  const [service, module, dialog] = await Promise.all([
    read("src/services/transportJobService.ts"),
    read("src/components/modules/LogisticsModule.tsx"),
    read("src/components/TransportJobHistoryDialog.tsx"),
  ]);
  assert.match(service, /from\("transport_job_events" as any\)/);
  assert.match(module, /TransportJobHistoryDialog/);
  assert.match(module, /setHistoryJob\(job\)/);
  assert.match(dialog, /İş Emri Geçmişi/);
  assert.match(dialog, /actor_email/);
  assert.match(dialog, /old_status/);
});

test("shipment deletion and cancellation remain status-aware and reasoned", async () => {
  const sql = await read("supabase/migrations/20260818234500_shipment_cancellation_and_revision_workflow.sql");
  assert.match(sql, /v_shipment\.status IN \('yolda','Yolda','Dağıtımda','teslim_edildi','Teslim Edildi','iptal','İptal'\)/);
  assert.match(sql, /v_shipment\.sale_invoice_id IS NOT NULL/);
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.rex_cancel_shipment/);
  assert.match(sql, /İptal nedeni en az 10 karakter olmalıdır/);
  assert.match(sql, /Faturalı sevkiyat iptal edilemez/);
  assert.match(sql, /cancelled_by=auth\.uid\(\)/);
});

test("completed shipment revisions require a formal owner approval workflow", async () => {
  const [sql, form, logistics] = await Promise.all([
    read("supabase/migrations/20260818234500_shipment_cancellation_and_revision_workflow.sql"),
    read("src/components/ShipmentForm.tsx"),
    read("src/components/modules/LogisticsModule.tsx"),
  ]);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.shipment_revision_requests/);
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.rex_request_shipment_revision/);
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.rex_review_shipment_revision/);
  assert.match(sql, /v_email <> 'info@rexlojistik\.com'/);
  assert.match(sql, /rex_completed_shipment_critical_guard/);
  assert.match(sql, /rex_completed_cargo_revision_guard/);
  assert.match(form, /shipmentService\.requestRevision/);
  assert.match(form, /Revizyon Talebi Oluştur/);
  assert.match(logistics, /value="revisions"/);
  assert.match(logistics, /handleReviewRevision/);
});

test("invoice cancellation is soft, reasoned and external-reference gated", async () => {
  const [sql, service, cancelApi, accounting, accountingService] = await Promise.all([
    read("supabase/migrations/20260818234500_shipment_cancellation_and_revision_workflow.sql"),
    read("src/services/workflowService.ts"),
    read("src/pages/api/kolaybi/invoices/[invoiceId]/cancel.ts"),
    read("src/components/modules/AccountingModule.tsx"),
    read("src/services/accountingService.ts"),
  ]);
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.rex_cancel_sales_invoice/);
  assert.match(sql, /KolayBi\/e-Fatura iptal veya iade işlemi tamamlanıp dış sistem referansı girilmelidir/);
  assert.match(sql, /SET payment_status='İptal'/);
  assert.match(sql, /Faturalar silinemez; iptal\/iade süreci kullanılmalıdır/);
  assert.match(sql, /rex_sales_invoices_no_direct_delete/);
  assert.match(service, /\/api\/kolaybi\/invoices\/\$\{input\.invoiceId\}\/cancel/);
  assert.match(cancelApi, /rex_cancel_sales_invoice/);
  assert.match(accounting, /Fatura İptal \/ İade Süreci/);
  assert.doesNotMatch(accountingService, /from\("sales_invoices"\)[\s\S]{0,100}\.delete\(\)/);
});

test("KolayBi invoices use a retryable idempotent state machine and only official documents invoice shipments", async () => {
  const [sql, reconciliation, integration, invoiceDialog, accounting, queueApi, invoiceApi, statusApi, pdfApi] = await Promise.all([
    read("supabase/migrations/20260819003000_secure_kolaybi_invoice_pipeline.sql"),
    read("supabase/migrations/20260902233000_kolaybi_e_document_reconciliation.sql"),
    read("src/lib/kolaybi.ts"),
    read("src/components/InvoiceDialog.tsx"),
    read("src/components/modules/AccountingModule.tsx"),
    read("src/pages/api/kolaybi/process-queue.ts"),
    read("src/pages/api/kolaybi/invoices.ts"),
    read("src/pages/api/kolaybi/invoices/[invoiceId]/status.ts"),
    read("src/pages/api/kolaybi/invoices/[invoiceId]/pdf.ts"),
  ]);
  assert.match(sql, /'draft','queued','processing','submitted','official','failed','mapping_required'/);
  assert.match(sql, /CREATE UNIQUE INDEX IF NOT EXISTS sales_invoices_idempotency_key_unique/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.invoice_sync_jobs/);
  assert.match(sql, /FOR UPDATE SKIP LOCKED/);
  assert.match(sql, /power\(2,least\(v_job\.attempts,8\)\)/);
  assert.match(sql, /invoice_status='kolaybi_bekliyor'/);
  assert.match(sql, /CASE WHEN p_status='official' THEN 'faturalandi' ELSE 'kolaybi_gonderildi' END/);
  assert.match(sql, /KDV oranı sıfır olan kalemde istisna kodu zorunludur/);
  assert.match(sql, /Tevkifat kodu ve oranı birlikte girilmelidir/);
  assert.match(sql, /Dövizli faturada geçerli kur zorunludur/);
  assert.match(sql, /REVOKE INSERT,UPDATE,DELETE ON public\.sales_invoices FROM authenticated/);
  assert.match(integration, /serial_no/);
  assert.match(integration, /invoices\/e-document\/create/);
  assert.match(integration, /invoices\/e-document\/view/);
  assert.match(integration, /e_document\/invoices\?/);
  assert.match(integration, /KOLAYBI_COMPANY_ID/);
  assert.match(integration, /direction: "outbound"/);
  assert.match(integration, /document_id: String\(invoice\.kolaybi_document_id\)/);
  assert.match(integration, /kolaybi_product_id \|\| config\.defaultProductId/);
  assert.match(integration, /providerInvoiceIdentity/);
  assert.match(integration, /data\?\.ettn/);
  assert.match(integration, /data\?\.serial_no/);
  assert.match(integration, /identity\.uuid && identity\.invoiceNo/);
  assert.doesNotMatch(integration, /status: detail\.uuid \? "official"/);
  assert.match(reconciliation, /CREATE OR REPLACE FUNCTION public\.rex_queue_stale_invoice_status_checks/);
  assert.match(reconciliation, /i\.integration_status='submitted'/);
  assert.match(reconciliation, /j\.status IN \('pending','processing'\)/);
  assert.match(reconciliation, /'cancelled','rejected'/);
  assert.match(reconciliation, /WHEN p_status='rejected' THEN 'failed'/);
  assert.match(invoiceDialog, /rex_create_sales_invoice_secure|invoiceIntegrationService\.createDraft/);
  assert.match(accounting, /E-Belge Gönderimi Bekliyor/);
  assert.match(accounting, /handleRefreshInvoiceStatus/);
  assert.match(accounting, /handleOpenInvoicePdf/);
  assert.match(accounting, /invoice\.official_invoice_no/);
  assert.match(accounting, /invoice\.official_uuid/);
  assert.match(accounting, /invoice\.provider_status/);
  assert.match(queueApi, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(queueApi, /CRON_SECRET/);
  assert.match(queueApi, /rex_queue_stale_invoice_status_checks/);
  assert.match(queueApi, /processKolayBiJob\(db, null, \{ admin, actorId, actorEmail \}\)/);
  assert.match(invoiceApi, /SUPABASE_SECRET_KEY \|\| process\.env\.SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(invoiceApi, /processKolayBiJob\(db, invoiceId, \{/);
  assert.match(integration, /automatic associate matching started/);
  assert.match(integration, /synchronizeKolayBiAssociate/);
  assert.match(integration, /synchronizeMissingInvoiceProducts/);
  assert.match(integration, /\/products\?\$\{query\.toString\(\)\}/);
  assert.match(integration, /product_type: "service"/);
  assert.match(integration, /missing product created automatically/);
  assert.match(integration, /from\("sales_invoice_items"\)\.update/);
  assert.match(statusApi, /rex_queue_invoice_status_check/);
  assert.match(pdfApi, /Content-Type", "application\/pdf/);
});

test("invoice descriptions and bank details are selected in REX TYS and snapshotted before KolayBi submission", async () => {
  const [sql, dialog, service, integration, settings, xslt] = await Promise.all([
    read("supabase/migrations/20260828193000_invoice_presentation_rules.sql"),
    read("src/components/InvoiceDialog.tsx"),
    read("src/services/invoiceIntegrationService.ts"),
    read("src/lib/kolaybi.ts"),
    read("src/components/InvoiceConfigurationPanel.tsx"),
    read("docs/kolaybi-xslt/rex-tys-kolaybi-fatura.xslt.in"),
  ]);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.invoice_note_templates/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.invoice_bank_accounts/);
  assert.match(sql, /bank_accounts_snapshot jsonb/);
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.rex_create_sales_invoice_secure_v2/);
  assert.match(sql, /Banka Bilgilerimiz/);
  assert.match(sql, /v_result:=public\.rex_create_sales_invoice_secure/);
  assert.match(dialog, /Fatura açıklama türü/);
  assert.match(dialog, /Banka bilgilerini faturada göster/);
  assert.match(dialog, /applyNoteTemplate/);
  assert.match(service, /rex_create_sales_invoice_secure_v2/);
  assert.match(integration, /invoice\.kolaybi_document_type/);
  assert.match(integration, /vat_exemption_reason_code/);
  assert.match(settings, /Fatura açıklama şablonları/);
  assert.match(settings, /Faturada gösterilecek banka hesapları/);
  assert.match(xslt, /Açıklama, Notlar ve Banka Bilgileri/);
  assert.match(xslt, /new QRCode/);
  assert.match(xslt, /"vkntckn"/);
  assert.match(xslt, /"avkntckn"/);
});

test("KolayBi e-invoice and e-archive use separate fixed-label XSLT files", async () => {
  const [eInvoiceXslt, eArchiveXslt, buildScript, guide] = await Promise.all([
    read("docs/kolaybi-xslt/rex-tys-kolaybi-e-fatura.xslt"),
    read("docs/kolaybi-xslt/rex-tys-kolaybi-e-arsiv.xslt"),
    read("docs/kolaybi-xslt/build-kolaybi-xslt.mjs"),
    read("docs/kolaybi-xslt/KOLAYBI_XSLT_KURULUM.md"),
  ]);
  assert.match(eInvoiceXslt, /<div class="doc-type">e-Fatura<\/div>/);
  assert.doesNotMatch(eInvoiceXslt, /Bu belge e-Arşiv Fatura kapsamında/);
  assert.match(eArchiveXslt, /<div class="doc-type">e-Arşiv Fatura<\/div>/);
  assert.match(eArchiveXslt, /Bu belge e-Arşiv Fatura kapsamında/);
  assert.match(eInvoiceXslt, /new QRCode/);
  assert.match(eArchiveXslt, /new QRCode/);
  assert.match(buildScript, /rex-tys-kolaybi-e-fatura\.xslt/);
  assert.match(buildScript, /rex-tys-kolaybi-e-arsiv\.xslt/);
  assert.match(guide, /KolayBi \*\*e-Fatura\*\* alanına/);
  assert.match(guide, /KolayBi \*\*e-Arşiv\*\* alanına/);
});

test("KolayBi live cutover remains read-only until explicitly enabled", async () => {
  const [gate, officeSync, queue, associateSync, purchaseSync] = await Promise.all([
    read("src/lib/kolaybi-live-gate.ts"),
    read("src/pages/api/kolaybi/office-sync.ts"),
    read("src/lib/kolaybi.ts"),
    read("src/lib/kolaybi-associates.ts"),
    read("src/pages/api/kolaybi/purchase-invoices/sync.ts"),
  ]);

  assert.match(gate, /KOLAYBI_LIVE_SYNC_ENABLED/);
  assert.match(gate, /includes\("sandbox"\)/);
  assert.match(gate, /assertKolayBiSyncEnabled/);
  assert.match(officeSync, /req\.method === "POST" \|\| cronMode/);
  assert.match(officeSync, /isKolayBiSyncEnabled\(baseUrl\)/);
  assert.match(officeSync, /processWithConcurrency\(records, 24/);
  assert.match(officeSync, /writeBatches\(admin, "kolaybi_master_records"/);
  assert.match(officeSync, /writeBatches\(admin, "kolaybi_sync_events"/);
  assert.match(officeSync, /processWithConcurrency\(resourcesBeforeTransactions, 3, syncResource\)/);
  assert.match(officeSync, /if \(resources\.includes\("vault_transactions"\)\) await syncResource\("vault_transactions"\)/);
  assert.match(queue, /assertKolayBiSyncEnabled\(config\.baseUrl\)/);
  assert.match(associateSync, /assertKolayBiSyncEnabled\(baseUrl\)/);
  assert.match(purchaseSync, /isKolayBiSyncEnabled\(baseUrl\)/);
});

test("incoming purchase invoices require documents, human matching and owner approval", async () => {
  const [sql, inbox, service] = await Promise.all([
    read("supabase/migrations/20260819013000_purchase_invoice_matching.sql"),
    read("src/components/PurchaseInvoiceInbox.tsx"),
    read("src/services/purchaseInvoiceService.ts"),
  ]);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.incoming_purchase_invoices/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.supplier_invoice_issuers/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.purchase_invoice_allocations/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.purchase_invoice_events/);
  assert.match(sql, /BEFORE UPDATE OR DELETE ON public\.purchase_invoice_events/);
  assert.match(sql, /Fatura ve iş bilgileri kontrol edildi onayı zorunludur/);
  assert.match(sql, /v_email<>'info@rexlojistik\.com'/);
  assert.match(sql, /Sevkiyat dağılımı ve genel gider toplamı fatura toplamına eşit olmalıdır/);
  assert.match(sql, /incoming_purchase_invoices_legal_unique/);
  assert.match(inbox, /Gelenleri Yenile/);
  assert.match(inbox, /Kontrol Edildi, Eşleştir/);
  assert.match(service, /purchase-invoice-documents/);
  assert.match(service, /crypto\.subtle\.digest\("SHA-256"/);
});

test("KolayBi inbound purchase invoices are synchronized without exposing credentials", async () => {
  const [syncApi, pdfApi] = await Promise.all([
    read("src/pages/api/kolaybi/purchase-invoices/sync.ts"),
    read("src/pages/api/kolaybi/purchase-invoices/[invoiceId]/pdf.ts"),
  ]);
  assert.match(syncApi, /direction: "inbound"/);
  assert.match(syncApi, /min_issue_date: minIssueDate/);
  assert.match(syncApi, /type: "purchase_invoice"/);
  assert.match(syncApi, /commercialIndexes/);
  assert.match(syncApi, /matchingCommercial/);
  assert.match(syncApi, /matchingAssociate/);
  assert.match(syncApi, /header\?\.associate/);
  assert.match(syncApi, /skip_reasons: skipReasons/);
  assert.match(syncApi, /KOLAYBI_COMPANY_ID/);
  assert.match(syncApi, /rex_import_kolaybi_purchase_invoice/);
  assert.match(syncApi, /Authorization: `Bearer \$\{accessToken\}`/);
  assert.match(pdfApi, /invoices\/e-document\/view\?uuid=/);
  assert.match(pdfApi, /Cache-Control", "private, no-store"/);
});

test("driver and vehicle assignments enforce core documents, licence and load rules", async () => {
  const [sql, optionalSql, optionalVehicleSql, shipmentForm, driverForm, vehicleForm] = await Promise.all([
    read("supabase/migrations/20260819023000_driver_vehicle_compliance.sql"),
    read("supabase/migrations/20260819030000_optional_driver_vehicle_documents.sql"),
    read("supabase/migrations/20260819031500_optional_vehicle_authorization.sql"),
    read("src/components/ShipmentForm.tsx"),
    read("src/components/DriverForm.tsx"),
    read("src/components/VehicleForm.tsx"),
  ]);
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.rex_validate_assignment_with_load/);
  assert.match(sql, /p_load_weight>v_vehicle\.tasima_kapasitesi_kg/);
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.rex_required_license_classes/);
  assert.match(sql, /v_actual && v_required/);
  assert.match(sql, /yetki_belgesi_gecerlilik_tarihi < current_date/);
  assert.match(sql, /CREATE TRIGGER rex_shipment_assignment_compliance_guard/);
  assert.match(sql, /PERFORM public\.rex_validate_assignment_with_load\(v_driver,v_vehicle,v_load\)/);
  assert.doesNotMatch(optionalVehicleSql, /v_vehicle\.yetki_belgesi_gecerlilik_tarihi < current_date/);
  assert.doesNotMatch(optionalVehicleSql, /nullif\(trim\(v_vehicle\.yetki_belgesi\)/);
  assert.doesNotMatch(optionalSql, /src_belgesi_gecerlilik_tarihi < current_date/);
  assert.doesNotMatch(optionalSql, /psikoteknik_gecerlilik_tarihi < current_date/);
  assert.doesNotMatch(optionalSql, /trafik_sigortasi_bitis_tarihi < current_date/);
  assert.doesNotMatch(shipmentForm, /driver\.src_belgesi_gecerlilik_tarihi >= today/);
  assert.doesNotMatch(shipmentForm, /driver\.psikoteknik_gecerlilik_tarihi >= today/);
  assert.doesNotMatch(shipmentForm, /vehicle\.trafik_sigortasi_bitis_tarihi >= today/);
  assert.doesNotMatch(shipmentForm, /vehicle\.yetki_belgesi_gecerlilik_tarihi >= today/);
  assert.match(driverForm, /src_belgesi_gecerlilik_tarihi/);
  assert.match(driverForm, /psikoteknik_gecerlilik_tarihi/);
  assert.match(vehicleForm, /yetki_belgesi_gecerlilik_tarihi/);
  assert.match(driverForm, /SRC Belge No \(İsteğe Bağlı\)/);
  assert.match(vehicleForm, /Trafik Sigortası Bitiş Tarihi \(İsteğe Bağlı\)/);
  assert.match(vehicleForm, /Taşıt Kartı \/ Yetki Belgesi Eki \(İsteğe Bağlı\)/);
});

test("managers receive 30-day warnings only for assignment-blocking documents", async () => {
  const [sql, service, logistics] = await Promise.all([
    read("supabase/migrations/20260819023000_driver_vehicle_compliance.sql"),
    read("src/services/transportComplianceService.ts"),
    read("src/components/modules/LogisticsModule.tsx"),
  ]);
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.rex_transport_compliance_alerts/);
  assert.match(sql, /p_warning_days integer DEFAULT 30/);
  assert.match(sql, /d\.expiry_date<=current_date\+p_warning_days/);
  assert.match(service, /rex_transport_compliance_alerts/);
  assert.match(service, /p_warning_days: warningDays/);
  assert.match(service, /new Set\(\["SRC Belgesi", "Psikoteknik", "Trafik Sigortası", "Yetki Belgesi"\]\)/);
  assert.match(service, /!optionalDocuments\.has\(alert\.document_type\)/);
  assert.match(logistics, /transportComplianceService\.getAlerts\(30\)/);
  assert.match(logistics, /Atama Engelli/);
  assert.match(logistics, /Süre Yaklaşıyor/);
});

test("U-ETDS stays hidden from staff screens while its dormant data infrastructure is preserved", async () => {
  const [sql, form, service, panel, logistics, permissions] = await Promise.all([
    read("supabase/migrations/20260819033000_uetds_readiness.sql"),
    read("src/components/ShipmentForm.tsx"),
    read("src/services/uetdsService.ts"),
    read("src/components/UetdsPanel.tsx"),
    read("src/components/modules/LogisticsModule.tsx"),
    read("src/lib/staff-permissions.ts"),
  ]);
  assert.match(sql, /environment text NOT NULL DEFAULT 'disabled'/);
  assert.match(sql, /enforcement_enabled boolean NOT NULL DEFAULT false/);
  assert.match(sql, /IF coalesce\(v_enforce,false\) THEN/);
  assert.match(sql, /'accepted','carrier_reported'/);
  assert.doesNotMatch(form, /U-ETDS Bildirim Bilgileri/);
  assert.doesNotMatch(logistics, /value="uetds"/);
  assert.match(permissions, /visiblePermissionCatalog = permissionCatalog\.filter\(\(item\) => item\.key !== "operations\.uetds"\)/);
  assert.match(form, /planned_departure_at/);
  assert.match(form, /uetds_load_type_code/);
  assert.match(service, /rex_uetds_dashboard/);
  assert.match(panel, /Taşıyıcı U-ETDS referansı/);
});

test("U-ETDS queue is idempotent, retryable and keeps an immutable audit history", async () => {
  const [sql, integration, queueApi] = await Promise.all([
    read("supabase/migrations/20260819033000_uetds_readiness.sql"),
    read("src/lib/uetds.ts"),
    read("src/pages/api/uetds/process-queue.ts"),
  ]);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.uetds_journeys/);
  assert.match(sql, /shipment_id uuid NOT NULL UNIQUE/);
  assert.match(sql, /CREATE TRIGGER rex_uetds_attempts_append_only[\s\S]*BEFORE UPDATE OR DELETE/);
  assert.match(sql, /FOR UPDATE SKIP LOCKED/);
  assert.match(sql, /attempt_count<8/);
  assert.match(sql, /power\(2,attempt_count\)/);
  assert.match(sql, /auth\.role\(\)<>'service_role'/);
  assert.doesNotMatch(sql, /uetds_password|uetds_username|web_service_token/);
  assert.match(integration, /yeniYukKaydiBildirV2/);
  assert.match(integration, /seferIptalEt/);
  assert.match(integration, /UETDS_GATEWAY_URL/);
  assert.match(integration, /UETDS_GATEWAY_TOKEN/);
  assert.match(queueApi, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(queueApi, /CRON_SECRET/);
});

test("TIO carrier and shipment data is validated before U-ETDS submission", async () => {
  const sql = await read("supabase/migrations/20260819033000_uetds_readiness.sql");
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.rex_uetds_readiness/);
  assert.match(sql, /Sürücü T\.C\. kimlik numarası/);
  assert.match(sql, /Araç plakası/);
  assert.match(sql, /Gönderici VKN\/TCKN/);
  assert.match(sql, /Yükleme il\/ilçe MERSİS kodları/);
  assert.match(sql, /TİO işinde C1\/K2 taşıyıcı kullanılamaz/);
  assert.match(sql, /dangerous_goods AND \(nullif\(trim\(c\.un_number/);
  assert.match(sql, /rex_save_shipment_with_uetds/);
  assert.match(sql, /uetds_cancellation_queued/);
});

test("shipment exceptions require a responsible person and preserve private evidence", async () => {
  const [sql, service, dialog, logistics] = await Promise.all([
    read("supabase/migrations/20260819040000_shipment_exceptions.sql"),
    read("src/services/shipmentExceptionService.ts"),
    read("src/components/ShipmentExceptionDialog.tsx"),
    read("src/components/modules/LogisticsModule.tsx"),
  ]);
  assert.match(sql, /'gecikme','arac_arizasi','hasarli_teslimat','eksik_teslimat'/);
  assert.match(sql, /'teslim_edilemedi','iade','iptal'/);
  assert.match(sql, /description text NOT NULL CHECK \(length\(trim\(description\)\) >= 10\)/);
  assert.match(sql, /responsible_user_id uuid NOT NULL/);
  assert.match(sql, /photo_urls text\[\] NOT NULL/);
  assert.match(sql, /'shipment-exception-documents','shipment-exception-documents',false/);
  assert.match(sql, /CREATE TRIGGER rex_shipment_exception_events_append_only[\s\S]*BEFORE UPDATE OR DELETE/);
  assert.match(service, /rex_create_shipment_exception/);
  assert.match(service, /shipment-exception-documents/);
  assert.match(dialog, /Sevkiyat İstisnaları/);
  assert.match(dialog, /Sorumlu Kişi/);
  assert.match(dialog, /Fotoğraflar \(en fazla 5\)/);
  assert.match(logistics, /Açık İstisna/);
});

test("exception cancellation uses the existing guarded shipment cancellation workflow", async () => {
  const sql = await read("supabase/migrations/20260819040000_shipment_exceptions.sql");
  assert.match(sql, /IF p_exception_type='iptal'/);
  assert.match(sql, /PERFORM public\.rex_cancel_shipment\(p_shipment_id,trim\(p_description\)\)/);
  assert.match(sql, /exception_created/);
  assert.match(sql, /exception_resolved/);
  assert.match(sql, /REVOKE ALL ON public\.shipment_exceptions,public\.shipment_exception_events FROM PUBLIC,anon,authenticated/);
});

test("delivery completion supports typed multi-document packages without bypassing validation", async () => {
  const [sql, modal, service] = await Promise.all([
    read("supabase/migrations/20260819050000_delivery_document_management.sql"),
    read("src/components/DeliveryModal.tsx"),
    read("src/services/deliveryDocumentService.ts"),
  ]);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.delivery_documents/);
  assert.match(sql, /'delivery_proof','damaged_delivery_report','partial_delivery_report','recipient_photo','other'/);
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.rex_mark_shipment_delivered_v2/);
  assert.match(sql, /En az bir belge Teslim Evrakı türünde olmalıdır/);
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.rex_mark_shipment_delivered\(uuid,text,date,text\) FROM PUBLIC,anon,authenticated/);
  assert.match(modal, /type="file" multiple/);
  assert.match(modal, /Hasarlı Teslimat Tutanağı|deliveryDocumentTypeLabels/);
  assert.match(service, /rex_register_delivery_document/);
  assert.match(service, /rex_mark_shipment_delivered_v2/);
});

test("delivery documents have private previews and immutable version history", async () => {
  const [sql, dialog] = await Promise.all([
    read("supabase/migrations/20260819050000_delivery_document_management.sql"),
    read("src/components/DeliveryDocumentsDialog.tsx"),
  ]);
  assert.match(sql, /document_group_id uuid NOT NULL/);
  assert.match(sql, /version_number integer NOT NULL/);
  assert.match(sql, /supersedes_document_id uuid/);
  assert.match(sql, /CREATE TRIGGER rex_delivery_document_events_append_only[\s\S]*BEFORE UPDATE OR DELETE/);
  assert.match(sql, /bucket_id='shipment-documents'[\s\S]*scan_status IN \('clean','legacy_unscanned'\)/);
  assert.match(dialog, /Yeni Sürüm/);
  assert.match(dialog, /iframe src=\{preview\.url\}/);
  assert.match(dialog, /Geçmiş sürüm/);
});

test("delivery file antivirus scanning is server-side, quarantined and fail-visible", async () => {
  const [sql, api, service] = await Promise.all([
    read("supabase/migrations/20260819050000_delivery_document_management.sql"),
    read("src/pages/api/security/scan-delivery-document.ts"),
    read("src/services/deliveryDocumentService.ts"),
  ]);
  assert.match(sql, /scan_enforcement_enabled boolean NOT NULL DEFAULT false/);
  assert.match(sql, /scan_status IN \('pending','clean','infected','error','legacy_unscanned'\)/);
  assert.match(sql, /auth\.role\(\)<>'service_role'/);
  assert.match(sql, /Zararlı olduğu belirlenen dosya ile teslimat tamamlanamaz/);
  assert.match(api, /CLOUDMERSIVE_API_KEY/);
  assert.match(api, /virus\/scan\/file\/advanced/);
  assert.match(api, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(api, /rex_record_delivery_document_scan/);
  assert.match(service, /\/api\/security\/scan-delivery-document/);
  assert.match(service, /crypto\.subtle\.digest\("SHA-256"/);
});

test("production traffic cannot bypass Cloudflare through the Vercel hostname", async () => {
  const proxy = await read("src/proxy.ts");
  assert.match(proxy, /VERCEL_ENV\s*!==\s*["']production["']/);
  assert.match(proxy, /rexlojistik\.com/);
  assert.match(proxy, /www\.rexlojistik\.com/);
  assert.match(proxy, /x-forwarded-host/);
  assert.match(proxy, /CRON_PATHS/);
  assert.match(proxy, /process\.env\.CRON_SECRET/);
  assert.match(proxy, /request\.headers\.get\("authorization"\) === `Bearer \$\{cronSecret\}`/);
  assert.match(proxy, /CRON_PATHS\.has\(request\.nextUrl\.pathname\)/);
  assert.match(proxy, /status:\s*404/);
  assert.match(proxy, /Cache-Control["']?:\s*["']no-store/);
});

test("private documents use permission-scoped and verified Cloudflare R2 uploads without breaking legacy references", async () => {
  const [storage, r2, api, scan, env, nextConfig, migration] = await Promise.all([
    read("src/lib/private-storage.ts"),
    read("src/lib/r2-server.ts"),
    read("src/pages/api/storage/signed-url.ts"),
    read("src/pages/api/security/scan-delivery-document.ts"),
    read(".env.example"),
    read("next.config.mjs"),
    read("supabase/migrations/20260910144000_allow_verified_r2_document_references.sql"),
  ]);
  assert.match(storage, /NEXT_PUBLIC_PRIVATE_STORAGE_BACKEND === "r2"/);
  assert.match(storage, /r2:\/\//);
  assert.match(storage, /storage:\/\//);
  assert.match(storage, /\/api\/storage\/signed-url/);
  assert.match(r2, /R2_ACCESS_KEY_ID/);
  assert.match(r2, /R2_SECRET_ACCESS_KEY/);
  assert.match(r2, /expiresIn: 300/);
  assert.match(api, /rex_has_permission/);
  assert.match(api, /permissionByNamespace/);
  assert.match(api, /mimeTypesByNamespace/);
  assert.match(api, /generatedUploadPath/);
  assert.match(api, /verify-upload/);
  assert.match(api, /cleanup-upload/);
  assert.match(api, /isObjectReferenced/);
  assert.doesNotMatch(api, /operation === "delete"/);
  assert.match(r2, /ContentLength: contentLength/);
  assert.match(r2, /HeadObjectCommand/);
  assert.match(r2, /ResponseContentDisposition: "attachment"/);
  assert.match(storage, /pendingR2UploadTokens/);
  assert.match(storage, /operation: "verify-upload"/);
  assert.match(migration, /r2:\/\/shipment-documents\/delivery-documents/);
  assert.match(migration, /r2:\/\/shipment-exception-documents\/exceptions/);
  assert.match(scan, /downloadR2Object/);
  assert.match(env, /NEXT_PUBLIC_PRIVATE_STORAGE_BACKEND=supabase/);
  assert.doesNotMatch(env, /NEXT_PUBLIC_R2_(?:ACCESS|SECRET)/);
  assert.match(nextConfig, /process\.env\.R2_BUCKET_NAME/);
  assert.match(nextConfig, /\$\{bucket\}\.\$\{url\.host\}/);
});

test("web analytics collects server-trusted demographics without leaking URL tokens or IP addresses", async () => {
  const [sql, api, service, dashboard] = await Promise.all([
    read("supabase/migrations/20260821010000_secure_web_analytics_demographics.sql"),
    read("src/pages/api/analytics/visit.ts"),
    read("src/services/analyticsService.ts"),
    read("src/components/modules/AnalyticsModule.tsx"),
  ]);
  assert.match(sql, /split_part\(split_part\(coalesce\(page_url, '\/'\), '\?', 1\), '#', 1\)/);
  assert.match(sql, /ip_address[\s\S]*NULL/);
  assert.match(sql, /auth\.role\(\) <> 'service_role'/);
  assert.match(sql, /visitor_id = p_visitor_id::text/);
  assert.match(sql, /p_visitor_id::text,/);
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.rex_record_visit_secure[\s\S]*FROM PUBLIC, anon, authenticated/);
  assert.match(api, /x-vercel-ip-country/);
  assert.match(api, /x-vercel-ip-city/);
  assert.match(api, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(service, /split\(\/\[\?#\]\//);
  assert.match(service, /\/api\/analytics\/visit/);
  assert.doesNotMatch(service, /p_user_agent/);
  assert.match(dashboard, /Coğrafi Konum/);
  assert.match(dashboard, /Tarayıcılar/);
  assert.match(dashboard, /İşletim Sistemleri/);
  assert.match(dashboard, /Dil Dağılımı/);
});

test("staff account creation and department roles remain owner-controlled and server-enforced", async () => {
  const [sql, api, manager, access, setup] = await Promise.all([
    read("supabase/migrations/20260821030000_staff_user_access_management.sql"),
    read("src/pages/api/admin/staff-users.ts"),
    read("src/components/settings/StaffUsersManager.tsx"),
    read("src/lib/access-control.ts"),
    read("src/pages/personel/sifre-olustur.tsx"),
  ]);
  assert.match(sql, /role IN \('admin','sales','operations','accounting','hr','viewer','demo'\)/);
  assert.match(sql, /lower\(email\) = 'info@rexlojistik\.com'/);
  assert.match(sql, /staff_access_events/);
  assert.match(sql, /rex_sales_write/);
  assert.match(api, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(api, /auth\.admin\.createUser/);
  assert.match(api, /must_change_password: true/);
  assert.match(api, /Şirket sahibi hesabının yetkisi veya durumu değiştirilemez/);
  assert.doesNotMatch(api, /MANAGEABLE_ROLES[^\n]*admin/);
  assert.match(manager, /Yeni Personel Hesabı Aç/);
  assert.match(manager, /Geçici Şifre/);
  assert.match(manager, /Satış/);
  assert.match(manager, /Operasyon/);
  assert.match(manager, /Muhasebe/);
  assert.match(access, /sales: \["dashboard", "crm", "reports", "integrations"\]/);
  assert.match(setup, /must_change_password: false/);
});

test("staff permissions support audited per-person cross-department view and manage levels", async () => {
  const [sql, api, manager, permissions, portal] = await Promise.all([
    read("supabase/migrations/20260821040000_staff_granular_permissions.sql"),
    read("src/pages/api/admin/staff-users.ts"),
    read("src/components/settings/StaffUsersManager.tsx"),
    read("src/lib/staff-permissions.ts"),
    read("src/pages/personel/profil.tsx"),
  ]);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.staff_permission_overrides/);
  assert.match(sql, /access_level IN \('none','view','manage'\)/);
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.rex_has_permission/);
  assert.match(sql, /CREATE TRIGGER rex_granular_permission_guard/);
  assert.match(sql, /rex_create_customer_portal_invite[\s\S]*crm\.portal_invites/);
  assert.match(sql, /permissions_changed/);
  assert.match(sql, /public\.rex_is_owner_admin\(\)/);
  assert.match(api, /req\.method === "PUT"/);
  assert.match(api, /staff_permission_overrides/);
  assert.match(api, /Yönetici hesaplarının tam yetkisi kişisel izinlerle daraltılamaz/);
  assert.match(manager, /Kişiye Özel Çapraz Yetkiler/);
  assert.match(manager, /Sadece görüntüleme/);
  assert.match(manager, /İşlem yapabilir/);
  assert.match(permissions, /accounting\.purchase/);
  assert.match(permissions, /operations\.shipments/);
  assert.match(permissions, /sales\.work_orders/);
  assert.match(portal, /getCurrentUserAccess/);
  assert.match(portal, /hasPermission\(permissions, "crm\.customers", "manage"\)/);
});

test("staff security requires MFA for every staff role and records immutable security events", async () => {
  const [sql, allStaffSql, login, mfa, settings, session, securityLib, api, config] = await Promise.all([
    read("supabase/migrations/20260825090000_staff_security_controls.sql"),
    read("supabase/migrations/20260910145000_require_mfa_for_all_staff.sql"),
    read("src/pages/login.tsx"),
    read("src/pages/personel/mfa.tsx"),
    read("src/components/settings/SecuritySettings.tsx"),
    read("src/hooks/use-staff-session-security.ts"),
    read("src/lib/security.ts"),
    read("src/pages/api/admin/staff-users.ts"),
    read("next.config.mjs"),
  ]);
  assert.match(sql, /p_role IN \('admin', 'accounting'\)/);
  assert.match(allStaffSql, /p_role IN \('admin','sales','operations','accounting','hr','viewer','demo'\)/);
  assert.match(allStaffSql, /auth\.jwt\(\) ->> 'aal'[\s\S]*<> 'aal2'/);
  assert.match(sql, /auth\.jwt\(\) ->> 'aal'[^\n]*'aal2'/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.staff_security_events/);
  assert.match(sql, /CREATE TRIGGER rex_staff_security_events_append_only/);
  assert.match(sql, /REVOKE INSERT, UPDATE, DELETE ON public\.staff_security_events/);
  assert.match(login, /getAuthenticatorAssuranceLevel|getMfaState/);
  assert.match(login, /personel\/mfa/);
  assert.match(mfa, /mfa\.enroll/);
  assert.match(mfa, /mfa\.challenge/);
  assert.match(mfa, /mfa\.verify/);
  assert.match(settings, /Diğer Tüm Cihazlardan Çıkış Yap/);
  assert.match(settings, /Güvenlik Hareketleri/);
  assert.match(settings, /30 dakika/);
  assert.match(session, /STAFF_IDLE_TIMEOUT_MS/);
  assert.match(session, /STAFF_MAX_SESSION_MS/);
  assert.match(securityLib, /STAFF_IDLE_TIMEOUT_MS = 30 \* 60 \* 1000/);
  assert.match(securityLib, /STAFF_MAX_SESSION_MS = 8 \* 60 \* 60 \* 1000/);
  assert.match(api, /tokenAssuranceLevel\(token\) !== "aal2"/);
  assert.match(config, /Content-Security-Policy/);
  assert.match(config, /\.r2\.cloudflarestorage\.com/);
  assert.match(config, /url\.origin/);
  assert.match(config, /Strict-Transport-Security/);
  assert.match(config, /X-Frame-Options/);
});

test("integration center imports customer shipments idempotently with row-level audit", async () => {
  const [sql, module, parser, service, permissions, portal, logistics] = await Promise.all([
    read("supabase/migrations/20260825180000_integration_center.sql"),
    read("src/components/modules/IntegrationsModule.tsx"),
    read("src/lib/shipment-import.ts"),
    read("src/services/integrationService.ts"),
    read("src/lib/staff-permissions.ts"),
    read("src/pages/personel/profil.tsx"),
    read("src/components/modules/LogisticsModule.tsx"),
  ]);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.integration_partners/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.integration_import_batches/);
  assert.match(sql, /UNIQUE \(partner_id, idempotency_key\)/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.integration_external_references/);
  assert.match(sql, /UNIQUE \(partner_id, entity_type, external_id\)/);
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.rex_import_customer_shipments/);
  assert.match(sql, /integrations\.imports','manage'/);
  assert.match(sql, /operations\.shipments','manage'/);
  assert.match(sql, /integration_imported/);
  assert.match(sql, /rex_integration_events_append_only/);
  assert.match(module, /Dosya seçildiğinde satırlar kaydedilmeden önce burada kontrol edilir/);
  assert.match(module, /Mükerrerlik koruması/);
  assert.match(module, /accept="\.xlsx,application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet"/);
  assert.doesNotMatch(module, /CSV/);
  assert.match(parser, /readSheet/);
  assert.match(parser, /\["csv", "xlsx"\]/);
  assert.match(parser, /Aynı dosyada mükerrer referans/);
  assert.match(service, /rex_import_customer_shipments/);
  assert.match(permissions, /integrations\.connections/);
  assert.match(permissions, /integrations\.imports/);
  assert.match(permissions, /integrations\.monitoring/);
  assert.match(portal, /Entegrasyon Merkezi/);
  assert.match(portal, /<IntegrationsModule permissions=\{permissions\}/);
  assert.match(logistics, /Güvenli Toplu Aktarım/);
  assert.doesNotMatch(logistics, /handleCsvImport/);
});

test("all user-facing reports and exports generate real XLSX workbooks", async () => {
  const [excel, reports, logistics, accounting, transactions, customers, customerPortal, integrations] = await Promise.all([
    read("src/lib/excel.ts"),
    read("src/components/modules/ReportsModule.tsx"),
    read("src/components/modules/LogisticsModule.tsx"),
    read("src/components/modules/AccountingModule.tsx"),
    read("src/components/CustomerTransactionsDialog.tsx"),
    read("src/components/modules/CRMModule.tsx"),
    read("src/pages/musteri/sevkiyatlar.tsx"),
    read("src/components/modules/IntegrationsModule.tsx"),
  ]);
  assert.match(excel, /write-excel-file\/browser/);
  assert.match(excel, /\.xlsx/);
  for (const source of [reports, logistics, accounting, transactions, customers, customerPortal, integrations]) {
    assert.match(source, /downloadExcel/);
    assert.doesNotMatch(source, /downloadCsv|text\/csv|\.csv\b/);
  }
});

test("public logistics services have dedicated SEO pages and internal navigation", async () => {
  const slugs = [
    "yurtici-parsiyel-tasimacilik",
    "komple-tasimacilik",
    "uluslararasi-karayolu-tasimaciligi",
    "hava-kargo",
    "denizyolu-tasimaciligi",
    "express-kargo",
    "depolama",
    "hakkimizda",
    "iletisim",
  ];
  const [content, pageTemplate, structuredData, seo, header, footer, services, sitemap, robots, nextConfig] = await Promise.all([
    read("src/content/marketing-pages.ts"),
    read("src/components/MarketingPage.tsx"),
    read("src/lib/structured-data.ts"),
    read("src/components/SEO.tsx"),
    read("src/components/Header.tsx"),
    read("src/components/Footer.tsx"),
    read("src/components/Services.tsx"),
    read("public/sitemap.xml"),
    read("public/robots.txt"),
    read("next.config.mjs"),
  ]);

  for (const slug of slugs) {
    const route = await read(`src/pages/${slug}.tsx`);
    assert.match(route, new RegExp(`marketingPages\\["${slug}"\\]`));
    assert.match(content, new RegExp(`slug: "${slug}"`));
    assert.match(sitemap, new RegExp(`https://www\\.rexlojistik\\.com/${slug}`));
  }

  for (const serviceSlug of slugs.slice(0, 7)) {
    assert.match(header, new RegExp(`/${serviceSlug}`));
    assert.match(footer, new RegExp(`/${serviceSlug}`));
    assert.match(services, new RegExp(`/${serviceSlug === "yurtici-parsiyel-tasimacilik" || serviceSlug !== "komple-tasimacilik" ? serviceSlug : "komple-tasimacilik"}`));
  }
  assert.match(content, /title: "Yurtiçi Komple Taşımacılık"/);
  assert.match(content, /Tam kamyon yükü veya tam tır yükü/);
  assert.match(header, /Yurtiçi Komple Taşımacılık/);
  assert.match(footer, /Yurtiçi Komple Taşımacılık/);
  assert.match(services, /Tam kamyon ve tam tır yükleri/);
  const footerServiceSection = footer.match(/\{\/\* Hizmetlerimiz \*\/\}([\s\S]*?)\{\/\* Kurumsal \*\/\}/)?.[1];
  assert.ok(footerServiceSection);
  assert.deepEqual(
    [...footerServiceSection.matchAll(/href="\/([^"]+)"/g)].map((match) => match[1]),
    slugs.slice(0, 7),
  );
  assert.match(pageTemplate, /buildMarketingPageStructuredData/);
  for (const schemaType of ["Organization", "LocalBusiness", "WebSite", "WebPage", "Service", "BreadcrumbList"]) {
    assert.match(structuredData, new RegExp(`"@type": "${schemaType}"`));
  }
  assert.match(structuredData, /const ORGANIZATION_ID = `\$\{SITE_URL\}\/\#organization`/);
  assert.match(structuredData, /const WEBSITE_ID = `\$\{SITE_URL\}\/\#website`/);
  assert.match(structuredData, /provider: \{ "@id": ORGANIZATION_ID \}/);
  assert.doesNotMatch(structuredData, /"@type": "(?:FAQPage|AggregateRating|Review|Offer|AggregateOffer)"/);
  assert.match(pageTemplate, /<h1/);
  assert.match(pageTemplate, /<details/);
  assert.match(seo, /application\/ld\+json/);
  assert.match(seo, /rel="canonical"/);
  assert.match(footer, /href="\/login"[\s\S]*REX TYS/);
  assert.doesNotMatch(footer, /Personel Girişi/);
  assert.doesNotMatch(footer, /href="\/musteri-giris"[\s\S]*Müşteri Portalı/);
  assert.match(robots, /Disallow: \/api\//);
  assert.doesNotMatch(robots, /Disallow: \/(?:login|personel|musteri|takip)/);
  assert.match(nextConfig, /key: "X-Robots-Tag", value: "noindex, nofollow, noarchive"/);
  assert.match(nextConfig, /source: "\/personel\/:path\*", headers: noIndexHeaders/);
  assert.match(nextConfig, /source: "\/takip\/:path\*", headers: noIndexHeaders/);
  assert.doesNotMatch(sitemap, /\/login<\/loc>/);
  assert.doesNotMatch(sitemap, /<(?:lastmod|changefreq|priority)>/);

  const registeredSlugs = [...content.matchAll(/^  (?:(?:"([^"]+)")|([A-Za-z0-9_-]+)): \{$/gm)]
    .map((match) => match[1] || match[2])
    .sort();
  const sitemapUrls = [...sitemap.matchAll(/<loc>https:\/\/www\.rexlojistik\.com(\/[^<]*)<\/loc>/g)]
    .map((match) => match[1])
    .sort();
  assert.deepEqual(sitemapUrls, ["/", ...registeredSlugs.map((slug) => `/${slug}`)].sort());
});

test("private and utility routes emit explicit noindex directives", async () => {
  const [seo, profile, jobEntry, customerEntry, rexgen] = await Promise.all([
    read("src/components/SEO.tsx"),
    read("src/pages/personel/profil.tsx"),
    read("src/pages/personel/is-giris.tsx"),
    read("src/pages/personel/cari-ekle.tsx"),
    read("src/pages/rexgen.tsx"),
  ]);

  for (const route of [profile, jobEntry, customerEntry, rexgen]) assert.match(route, /noIndex/);
  assert.match(seo, /noIndex \? "noindex, nofollow" : "index, follow"/);
  assert.match(seo, /\{url && <link rel="canonical" href=\{url\} \/>\}/);
});

test("public SEO copy keeps customs operations outside REX's service claim", async () => {
  const [content, privacy, kvkk, terms, sitemap] = await Promise.all([
    read("src/content/marketing-pages.ts"),
    read("src/pages/gizlilik-politikasi.tsx"),
    read("src/pages/kvkk-aydinlatma-metni.tsx"),
    read("src/pages/kullanim-kosullari.tsx"),
    read("public/sitemap.xml"),
  ]);
  assert.match(content, /Liman, Antrepo ve İhracat Depolarına Çift Yönlü Transfer/);
  assert.match(content, /REX Lojistik’in bu hizmetteki görevi gümrük müşavirliği veya ithalat işlemi yürütmek değildir/);
  assert.match(content, /eşya teslim alınabilir hâle geldikten sonraki araç, alım, yurtiçi taşıma ve teslim koordinasyonunu sağlar/);
  assert.doesNotMatch(content, /gümrükleme hizmeti (sunuyoruz|veriyoruz)/i);
  for (const legalPage of [privacy, kvkk, terms]) assert.match(legalPage, /noIndex/);
  assert.doesNotMatch(sitemap, /gizlilik-politikasi|kullanim-kosullari|kvkk-aydinlatma-metni/);
});

test("customs-area and weekend transfer pages provide truthful searchable decision paths", async () => {
  const [customsRoute, weekendRoute, content, planner, header, footer, sitemap] = await Promise.all([
    read("src/pages/gumruk-antrepo-yurtici-transfer.tsx"),
    read("src/pages/hafta-sonu-acil-nakliye.tsx"),
    read("src/content/marketing-pages.ts"),
    read("src/components/RapidTransferPlanner.tsx"),
    read("src/components/Header.tsx"),
    read("src/components/Footer.tsx"),
    read("public/sitemap.xml"),
  ]);

  assert.match(customsRoute, /marketingPages\["gumruk-antrepo-yurtici-transfer"\]/);
  assert.match(customsRoute, /RapidTransferPlanner variant="customs"/);
  assert.match(weekendRoute, /marketingPages\["hafta-sonu-acil-nakliye"\]/);
  assert.match(weekendRoute, /RapidTransferPlanner variant="weekend"/);
  assert.match(content, /Ambarlı Limanı ve çevresindeki Beylikdüzü–Esenyurt–Büyükçekmece antrepo hattı/);
  assert.match(content, /Muratbey Gümrük Müdürlüğü ile Çatalca–Hadımköy/);
  assert.match(content, /İzmir, Manisa ve Ankara’dan İstanbul ihracat depolarına/);
  assert.match(content, /ana hat aracının son kabul saatinden önce teslim edilmesi gerekir/);
  assert.match(content, /İzmir ve Manisa Çıkışlı Ertesi Gün Acil Nakliye/);
  assert.match(content, /İzmir ve Manisa’dan ertesi gün Türkiye geneli teslimat/);
  assert.match(content, /cuma alım–cumartesi teslim seçeneğini operasyon uygunluğuna göre değerlendiriyoruz/);
  assert.match(content, /Bu hizmet sabit ve koşulsuz bir teslim garantisi değildir/);
  assert.match(planner, /Çift yönlü operasyon ön kontrolü/);
  assert.match(planner, /type CustomsDirection = "export" \| "import"/);
  assert.match(planner, /İhracat yönü/);
  assert.match(planner, /İthalat yönü/);
  assert.match(planner, /İstanbul Avrupa yakası ihracat deposu/);
  assert.match(planner, /İzmir\/Manisa çıkışlı ertesi gün hedefli acil nakliye/);
  assert.match(planner, /İstanbul \/ Türkiye geneli/);
  assert.match(planner, /Operasyon özetini WhatsApp’tan gönder/);
  assert.match(header, /\/gumruk-antrepo-yurtici-transfer/);
  assert.match(header, /\/hafta-sonu-acil-nakliye/);
  assert.match(header, /label: "Yurtiçi Parsiyel Taşımacılık",\s+children:/);
  assert.doesNotMatch(footer, /gumruk-antrepo-yurtici-transfer|hafta-sonu-acil-nakliye/);
  assert.match(sitemap, /https:\/\/www\.rexlojistik\.com\/gumruk-antrepo-yurtici-transfer/);
  assert.match(sitemap, /https:\/\/www\.rexlojistik\.com\/hafta-sonu-acil-nakliye/);
});

test("international road freight pages form a unique SEO and quote-preparation hub", async () => {
  const [mainRoute, partialRoute, content, planner, header, sitemap] = await Promise.all([
    read("src/pages/uluslararasi-karayolu-tasimaciligi.tsx"),
    read("src/pages/uluslararasi-karayolu-parsiyel-tasimacilik.tsx"),
    read("src/content/marketing-pages.ts"),
    read("src/components/RoadFreightPlanner.tsx"),
    read("src/components/Header.tsx"),
    read("public/sitemap.xml"),
  ]);

  assert.match(mainRoute, /marketingPages\["uluslararasi-karayolu-tasimaciligi"\]/);
  assert.match(partialRoute, /marketingPages\["uluslararasi-karayolu-parsiyel-tasimacilik"\]/);
  assert.match(partialRoute, /RoadFreightPlanner/);
  assert.match(content, /title: "Uluslararası Karayolu Parsiyel Taşımacılık"/);
  assert.match(content, /Parsiyel, LTL ve FTL/);
  assert.match(content, /Türkiye’den Avrupa’ya ve uygun Avrupa adreslerinden Türkiye’ye/);
  assert.match(planner, /Rota ve yük uygunluk ön kontrolü/);
  assert.match(planner, /Teklif hazırlık durumu/);
  assert.match(planner, /Özeti WhatsApp ile gönder/);
  assert.match(planner, /Bu araç fiyat veya kesin transit süre üretmez/);
  assert.match(header, /\/uluslararasi-karayolu-parsiyel-tasimacilik/);
  assert.match(header, /\/minivan-express-tasimacilik/);
  assert.match(header, /label: "Uluslararası Karayolu",\s+children:/);
  assert.match(sitemap, /https:\/\/www\.rexlojistik\.com\/uluslararasi-karayolu-parsiyel-tasimacilik/);
});

test("minivan express page provides a unique capacity-aware decision flow", async () => {
  const [route, content, planner, header, footer, sitemap] = await Promise.all([
    read("src/pages/minivan-express-tasimacilik.tsx"),
    read("src/content/marketing-pages.ts"),
    read("src/components/MinivanExpressPlanner.tsx"),
    read("src/components/Header.tsx"),
    read("src/components/Footer.tsx"),
    read("public/sitemap.xml"),
  ]);

  assert.match(route, /marketingPages\["minivan-express-tasimacilik"\]/);
  assert.match(route, /MinivanExpressPlanner/);
  assert.match(content, /title: "Türkiye–Avrupa Minivan Express Taşımacılık"/);
  assert.match(content, /Minivan mı, hava kargo mu, parsiyel mi\?/);
  assert.match(content, /1\.300 kg, 15–17 m³ ve 6–7 Euro palet/);
  assert.match(content, /Kesin olmayan genel süre vaadi|rota teyidinden sonra gerçekçi kapıdan kapıya tahmin/);
  assert.match(planner, /Minivan uygunluk ve teklif ön kontrolü/);
  assert.match(planner, /Dedike minivan için güçlü aday/);
  assert.match(planner, /Minivan teklifini gönder/);
  assert.match(planner, /Sonuç ön değerlendirmedir/);
  assert.match(header, /\/minivan-express-tasimacilik/);
  assert.doesNotMatch(footer, /\/minivan-express-tasimacilik/);
  assert.match(sitemap, /https:\/\/www\.rexlojistik\.com\/minivan-express-tasimacilik/);
});

test("domestic partial page prepares multi-load WhatsApp quotes", async () => {
  const [route, planner] = await Promise.all([
    read("src/pages/yurtici-parsiyel-tasimacilik.tsx"),
    read("src/components/DomesticPartialPlanner.tsx"),
  ]);

  assert.match(route, /DomesticPartialPlanner/);
  assert.match(planner, /Gönderici/);
  assert.match(planner, /Alıcı/);
  assert.match(planner, /Yük cinsi \/ ambalajı/);
  assert.match(planner, /Toplam ağırlık \(kg\)/);
  assert.match(planner, /Boy \(cm\)/);
  assert.match(planner, /En \(cm\)/);
  assert.match(planner, /Yükseklik \(cm\)/);
  assert.match(planner, /İstif durumu/);
  assert.match(planner, /İstiflenebilir/);
  assert.match(planner, /İstiflenemez/);
  assert.match(planner, /REFERENCE_STACK_HEIGHT_CM = 240/);
  assert.match(planner, /REFERENCE_TRAILER_WIDTH_METERS = 2\.4/);
  assert.match(planner, /LDM tahmini araç yeri/);
  assert.match(planner, /estimateLoadMeters/);
  assert.match(planner, /Yük Ekle/);
  assert.match(planner, /Parsiyel teklifini WhatsApp’tan gönder/);
  assert.match(planner, /Yük kalemleri:/);
});

test("Izmir and Manisa partial landing pages are distinct, crawlable, and quote-ready", async () => {
  const [izmirRoute, manisaRoute, mainRoute, content, planner, sitemap, structuredData] = await Promise.all([
    read("src/pages/izmir-parsiyel-tasimacilik.tsx"),
    read("src/pages/manisa-parsiyel-tasimacilik.tsx"),
    read("src/pages/yurtici-parsiyel-tasimacilik.tsx"),
    read("src/content/marketing-pages.ts"),
    read("src/components/DomesticPartialPlanner.tsx"),
    read("public/sitemap.xml"),
    read("src/lib/structured-data.ts"),
  ]);

  assert.match(izmirRoute, /defaultSenderCity="İzmir"/);
  assert.match(izmirRoute, /sectionId="izmir-parsiyel-teklif"/);
  assert.match(manisaRoute, /defaultSenderCity="Manisa"/);
  assert.match(manisaRoute, /sectionId="manisa-parsiyel-teklif"/);
  assert.match(mainRoute, /DomesticPartialPlanner/);
  assert.match(content, /İzmir Parsiyel Taşımacılık \| 1 Paletten Türkiye Geneli \| REX Lojistik/);
  assert.match(content, /Manisa Parsiyel Taşımacılık \| 1 Paletten Türkiye Geneli \| REX Lojistik/);
  assert.match(content, /Bornova, Kemalpaşa, Gaziemir, Çiğli, Torbalı, Aliağa, Menemen ve Menderes/);
  assert.match(content, /Manisa OSB, Yunusemre, Şehzadeler, Muradiye, Turgutlu, Akhisar ve Salihli/);
  assert.match(content, /href: "\/izmir-parsiyel-tasimacilik"/);
  assert.match(content, /href: "\/manisa-parsiyel-tasimacilik"/);
  assert.match(content, /Yük Bilgilerini Gönder – Teklif Al/);
  assert.match(planner, /Açık yükleme adresi/);
  assert.match(planner, /Açık teslimat adresi/);
  assert.match(planner, /Palet \/ koli adedi/);
  assert.match(planner, /Yük hazır olma tarihi/);
  assert.match(planner, /required/);
  assert.match(sitemap, /https:\/\/www\.rexlojistik\.com\/izmir-parsiyel-tasimacilik/);
  assert.match(sitemap, /https:\/\/www\.rexlojistik\.com\/manisa-parsiyel-tasimacilik/);
  assert.match(structuredData, /"izmir-parsiyel-tasimacilik"/);
  assert.match(structuredData, /"manisa-parsiyel-tasimacilik"/);
  assert.doesNotMatch(`${content}\n${izmirRoute}\n${manisaRoute}`, /özmal araç|kendi depolarımız|kendi şubelerimiz|tedarikçi adı|alış fiyat/i);
});

test("Commit 6 acceptance: Izmir-Istanbul route is indexable, private by design, and mobile quote-ready", async () => {
  const [route, content, marketingPage, planner, sitemap, structuredData] = await Promise.all([
    read("src/pages/izmir-istanbul-parsiyel-tasimacilik.tsx"),
    read("src/content/marketing-pages.ts"),
    read("src/components/MarketingPage.tsx"),
    read("src/components/DomesticPartialPlanner.tsx"),
    read("public/sitemap.xml"),
    read("src/lib/structured-data.ts"),
  ]);
  const routeStart = content.indexOf('"izmir-istanbul-parsiyel-tasimacilik":');
  const routeEnd = content.indexOf('"izmir-gebze-parsiyel-tasimacilik":', routeStart);
  const routeContent = content.slice(routeStart, routeEnd);
  const sitemapMatches = sitemap.match(/https:\/\/www\.rexlojistik\.com\/izmir-istanbul-parsiyel-tasimacilik/g) ?? [];

  assert.ok(routeStart >= 0 && routeEnd > routeStart, "route content should exist as an isolated marketing entry");
  assert.match(routeContent, /seoTitle: "İzmir İstanbul Parsiyel Taşımacılık \| REX Lojistik"/);
  assert.match(routeContent, /seoDescription: "İzmir'den İstanbul'a 1 paletten başlayan parsiyel yüklerinizi adresinizden alıyor, Avrupa ve Anadolu Yakası'nda alıcı adresine teslim ediyoruz\. Hızlı teklif alın\."/);
  assert.match(routeContent, /title: "İzmir İstanbul Parsiyel Taşımacılık"/);
  assert.match(routeContent, /breadcrumbParent:[\s\S]*href: "\/izmir-parsiyel-tasimacilik"/);
  assert.match(routeContent, /İstanbul Avrupa ve Anadolu Yakası'na Adrese Teslim/);
  assert.match(routeContent, /1 Palet Yük İzmir'den İstanbul'a Gönderilebilir mi\?/);
  assert.match(routeContent, /İzmir İstanbul Parsiyel Nakliye Fiyatı Nasıl Hesaplanır\?/);
  assert.match(routeContent, /İzmir İstanbul Parsiyel Taşıma Süreci/);
  assert.match(routeContent, /Parsiyel mi, Komple Araç mı\?/);
  assert.equal((routeContent.match(/question:/g) ?? []).length, 7, "all seven visible FAQ items should be present");
  assert.match(routeContent, /href: "\/izmir-parsiyel-tasimacilik"/);
  assert.match(routeContent, /href: "\/yurtici-parsiyel-tasimacilik"/);
  assert.match(routeContent, /href: "\/komple-tasimacilik"/);
  assert.match(content, /anchor: "İzmir → İstanbul", href: "\/izmir-istanbul-parsiyel-tasimacilik"/);

  assert.match(route, /defaultSenderCity="İzmir"/);
  assert.match(route, /defaultReceiverCity="İstanbul"/);
  assert.match(route, /sectionId="izmir-istanbul-parsiyel-teklif"/);
  assert.match(route, /Yük Bilgilerini Gönder – Teklif Al/);
  assert.match(route, /routeSummaryLabel="İzmir → İstanbul rota planı"/);
  assert.match(planner, /Açık yükleme adresi/);
  assert.match(planner, /Açık teslimat adresi/);
  assert.match(planner, /Palet \/ koli adedi/);
  assert.match(planner, /Toplam ağırlık \(kg\)/);
  assert.match(planner, /İstiflenebilirlik/);
  assert.match(planner, /Yük hazır olma tarihi/);
  assert.match(planner, /sm:grid-cols-2/);
  assert.match(marketingPage, /mt-9 flex flex-col gap-3 sm:flex-row/);
  assert.match(marketingPage, /mt-8 flex flex-col justify-center gap-3 sm:flex-row/);
  assert.match(marketingPage, /rex:open-quote-form/);

  assert.equal(sitemapMatches.length, 1, "canonical route should appear in sitemap exactly once");
  assert.match(structuredData, /"izmir-istanbul-parsiyel-tasimacilik"/);
  assert.match(structuredData, /page\.breadcrumbParent/);
  assert.doesNotMatch(
    `${routeContent}\n${route}\n${structuredData}`,
    /FedEx|UPS|DHL|Aramex|QuickShipper|Navlungo|alt taşıyıcı|anlaşmalı kargo|nakliye tedarikçi|komisyoncu|alış fiyat|hangi yükün hangi taşıyıcı|kendi kamyonu|dağıtım merkezi|İstanbul şubesi/i,
    "source-visible route data must not disclose carriers, suppliers, buying prices, or the fulfillment model",
  );
});

test("Izmir-Gebze route acceptance: industrial intent, correct province/district defaults, and private operations", async () => {
  const [route, content, marketingPage, planner, sitemap, structuredData] = await Promise.all([
    read("src/pages/izmir-gebze-parsiyel-tasimacilik.tsx"),
    read("src/content/marketing-pages.ts"),
    read("src/components/MarketingPage.tsx"),
    read("src/components/DomesticPartialPlanner.tsx"),
    read("public/sitemap.xml"),
    read("src/lib/structured-data.ts"),
  ]);
  const routeStart = content.indexOf('"izmir-gebze-parsiyel-tasimacilik":');
  const routeEnd = content.indexOf('"izmir-bursa-parsiyel-tasimacilik":', routeStart);
  const routeContent = content.slice(routeStart, routeEnd);
  const sectionsContent = routeContent.slice(routeContent.indexOf("sections: ["), routeContent.indexOf("steps: ["));
  const stepsContent = routeContent.slice(routeContent.indexOf("steps: ["), routeContent.indexOf("faq: ["));
  const sitemapMatches = sitemap.match(/https:\/\/www\.rexlojistik\.com\/izmir-gebze-parsiyel-tasimacilik/g) ?? [];

  assert.ok(routeStart >= 0 && routeEnd > routeStart, "route content should exist as an isolated marketing entry");
  assert.match(routeContent, /seoTitle: "İzmir Gebze Parsiyel Taşımacılık \| REX Lojistik"/);
  assert.match(routeContent, /seoDescription: "İzmir'den Gebze'ye 1 paletten başlayan sanayi ve ticari yüklerinizi adresinizden alıyor, Gebze'de alıcı adresine teslim ediyoruz\. Hızlı teklif alın\."/);
  assert.match(routeContent, /title: "İzmir Gebze Parsiyel Taşımacılık"/);
  assert.match(routeContent, /breadcrumbParent:[\s\S]*href: "\/izmir-parsiyel-tasimacilik"/);
  assert.match(routeContent, /İzmir'in Sanayi ve Ticaret Bölgelerinden Gebze'ye Taşıma/);
  assert.match(routeContent, /Sanayi Yüklerinin Yanında Ticari Yükler de Taşınabilir/);
  assert.match(routeContent, /1 Palet İzmir'den Gebze'ye Gönderilebilir mi\?/);
  assert.match(routeContent, /İzmir Gebze Parsiyel Nakliye Fiyatı Nasıl Hesaplanır\?/);
  assert.match(routeContent, /İzmir–Gebze Hattı Neden Önemli\?/);
  assert.equal((sectionsContent.match(/title: "/g) ?? []).length, 9, "all nine route-specific sections should be present");
  assert.equal((stepsContent.match(/title: "/g) ?? []).length, 5, "all five process steps should be present");
  assert.equal((routeContent.match(/question:/g) ?? []).length, 7, "all seven visible FAQ items should be present");
  assert.match(routeContent, /href: "\/izmir-parsiyel-tasimacilik"/);
  assert.match(routeContent, /href: "\/yurtici-parsiyel-tasimacilik"/);
  assert.match(routeContent, /href: "\/komple-tasimacilik"/);
  assert.match(content, /anchor: "İzmir → Gebze", href: "\/izmir-gebze-parsiyel-tasimacilik"/);

  assert.match(route, /defaultSenderCity="İzmir"/);
  assert.match(route, /defaultReceiverCity="Kocaeli"/);
  assert.match(route, /defaultReceiverDistrict="Gebze"/);
  assert.match(route, /sectionId="izmir-gebze-parsiyel-teklif"/);
  assert.match(route, /Yük Bilgilerini Gönder – Teklif Al/);
  assert.match(route, /routeSummaryLabel="İzmir → Gebze rota planı"/);
  assert.match(planner, /Açık yükleme adresi/);
  assert.match(planner, /Açık teslimat adresi/);
  assert.match(planner, /Palet \/ koli adedi/);
  assert.match(planner, /Toplam ağırlık \(kg\)/);
  assert.match(planner, /İstiflenebilirlik/);
  assert.match(planner, /Yük hazır olma tarihi/);
  assert.match(planner, /sm:grid-cols-2/);
  assert.match(marketingPage, /mt-9 flex flex-col gap-3 sm:flex-row/);
  assert.match(marketingPage, /mt-8 flex flex-col justify-center gap-3 sm:flex-row/);
  assert.match(marketingPage, /rex:open-quote-form/);

  assert.equal(sitemapMatches.length, 1, "canonical route should appear in sitemap exactly once");
  assert.match(structuredData, /"izmir-gebze-parsiyel-tasimacilik"/);
  assert.match(structuredData, /page\.breadcrumbParent/);
  assert.doesNotMatch(
    `${routeContent}\n${route}\n${structuredData}`,
    /FedEx|UPS|DHL|Aramex|QuickShipper|Navlungo|alt taşıyıcı|anlaşmalı kargo|nakliye komisyoncu|araç tedarik|alış fiyat|hangi yükün hangi firma|arka plandaki tedarik modeli|özmal filo|Gebze şubesi|Gebze deposu|kendi dağıtım merkezi/i,
    "source-visible route data must not disclose carriers, suppliers, buying prices, or the fulfillment model",
  );
});

test("Manisa-Gebze route acceptance: industrial intent, correct province/district defaults, and private operations", async () => {
  const [route, content, marketingPage, planner, sitemap, structuredData] = await Promise.all([
    read("src/pages/manisa-gebze-parsiyel-tasimacilik.tsx"),
    read("src/content/marketing-pages.ts"),
    read("src/components/MarketingPage.tsx"),
    read("src/components/DomesticPartialPlanner.tsx"),
    read("public/sitemap.xml"),
    read("src/lib/structured-data.ts"),
  ]);
  const routeStart = content.indexOf('"manisa-gebze-parsiyel-tasimacilik":');
  const routeEnd = content.indexOf('"manisa-bursa-parsiyel-tasimacilik":', routeStart);
  const routeContent = content.slice(routeStart, routeEnd);
  const sectionsContent = routeContent.slice(routeContent.indexOf("sections: ["), routeContent.indexOf("steps: ["));
  const stepsContent = routeContent.slice(routeContent.indexOf("steps: ["), routeContent.indexOf("faq: ["));
  const sitemapMatches = sitemap.match(/https:\/\/www\.rexlojistik\.com\/manisa-gebze-parsiyel-tasimacilik/g) ?? [];

  assert.ok(routeStart >= 0 && routeEnd > routeStart, "route content should exist as an isolated marketing entry");
  assert.match(routeContent, /seoTitle: "Manisa Gebze Parsiyel Taşımacılık \| REX Lojistik"/);
  assert.match(routeContent, /seoDescription: "Manisa'dan Gebze'ye 1 paletten başlayan sanayi ve ticari yüklerinizi adresinizden alıyor, Gebze'de alıcı adresine teslim ediyoruz\. Hızlı teklif alın\."/);
  assert.match(routeContent, /title: "Manisa Gebze Parsiyel Taşımacılık"/);
  assert.match(routeContent, /breadcrumbParent:[\s\S]*href: "\/manisa-parsiyel-tasimacilik"/);
  assert.match(routeContent, /Manisa Sanayisinden Gebze'ye Taşıma Çözümleri/);
  assert.match(routeContent, /Hangi Sanayi ve Ticari Yükler Taşınabilir\?/);
  assert.match(routeContent, /1 Palet Manisa'dan Gebze'ye Gönderilebilir mi\?/);
  assert.match(routeContent, /Manisa Gebze Parsiyel Nakliye Fiyatı Nasıl Hesaplanır\?/);
  assert.match(routeContent, /Gebze Neden Önemli Bir Teslimat Noktası\?/);
  assert.equal((sectionsContent.match(/title: "/g) ?? []).length, 9, "all nine route-specific sections should be present");
  assert.equal((stepsContent.match(/title: "/g) ?? []).length, 5, "all five process steps should be present");
  assert.equal((routeContent.match(/question:/g) ?? []).length, 7, "all seven visible FAQ items should be present");
  assert.match(routeContent, /href: "\/manisa-parsiyel-tasimacilik"/);
  assert.match(routeContent, /href: "\/yurtici-parsiyel-tasimacilik"/);
  assert.match(routeContent, /href: "\/komple-tasimacilik"/);
  assert.match(content, /anchor: "Manisa → Gebze", href: "\/manisa-gebze-parsiyel-tasimacilik"/);

  assert.match(route, /defaultSenderCity="Manisa"/);
  assert.match(route, /defaultReceiverCity="Kocaeli"/);
  assert.match(route, /defaultReceiverDistrict="Gebze"/);
  assert.match(route, /sectionId="manisa-gebze-parsiyel-teklif"/);
  assert.match(route, /Yük Bilgilerini Gönder – Teklif Al/);
  assert.match(route, /routeSummaryLabel="Manisa → Gebze rota planı"/);
  assert.match(planner, /Açık yükleme adresi/);
  assert.match(planner, /Açık teslimat adresi/);
  assert.match(planner, /Palet \/ koli adedi/);
  assert.match(planner, /Toplam ağırlık \(kg\)/);
  assert.match(planner, /İstiflenebilirlik/);
  assert.match(planner, /Yük hazır olma tarihi/);
  assert.match(planner, /sm:grid-cols-2/);
  assert.match(marketingPage, /mt-9 flex flex-col gap-3 sm:flex-row/);
  assert.match(marketingPage, /mt-8 flex flex-col justify-center gap-3 sm:flex-row/);
  assert.match(marketingPage, /rex:open-quote-form/);

  assert.equal(sitemapMatches.length, 1, "canonical route should appear in sitemap exactly once");
  assert.match(structuredData, /"manisa-gebze-parsiyel-tasimacilik"/);
  assert.match(structuredData, /page\.breadcrumbParent/);
  assert.doesNotMatch(
    `${routeContent}\n${route}\n${structuredData}`,
    /FedEx|UPS|DHL|Aramex|QuickShipper|Navlungo|alt taşıyıcı|anlaşmalı kargo|nakliye komisyoncu|araç tedarik kayna|alış fiyat|hangi hattın hangi firma|arka plandaki ticari model|özmal araç|kendi filomuz|Gebze şubesi|Gebze deposu/i,
    "source-visible route data must not disclose carriers, suppliers, buying prices, or the fulfillment model",
  );
  assert.doesNotMatch(routeContent, /\bADR\b|tehlikeli madde|soğuk zincir|ilaç|canlı hayvan|özel izinli|gabari dışı|yanıcı|patlayıcı/i);
});

test("Izmir-Bursa route acceptance: industrial corridor intent, city defaults, and private operations", async () => {
  const [route, content, marketingPage, planner, sitemap, structuredData] = await Promise.all([
    read("src/pages/izmir-bursa-parsiyel-tasimacilik.tsx"),
    read("src/content/marketing-pages.ts"),
    read("src/components/MarketingPage.tsx"),
    read("src/components/DomesticPartialPlanner.tsx"),
    read("public/sitemap.xml"),
    read("src/lib/structured-data.ts"),
  ]);
  const routeStart = content.indexOf('"izmir-bursa-parsiyel-tasimacilik":');
  const routeEnd = content.indexOf('"manisa-parsiyel-tasimacilik":', routeStart);
  const routeContent = content.slice(routeStart, routeEnd);
  const sectionsContent = routeContent.slice(routeContent.indexOf("sections: ["), routeContent.indexOf("steps: ["));
  const stepsContent = routeContent.slice(routeContent.indexOf("steps: ["), routeContent.indexOf("faq: ["));
  const sitemapMatches = sitemap.match(/https:\/\/www\.rexlojistik\.com\/izmir-bursa-parsiyel-tasimacilik/g) ?? [];

  assert.ok(routeStart >= 0 && routeEnd > routeStart, "route content should exist as an isolated marketing entry");
  assert.match(routeContent, /seoTitle: "İzmir Bursa Parsiyel Taşımacılık \| REX Lojistik"/);
  assert.match(routeContent, /seoDescription: "İzmir'den Bursa'ya 1 paletten başlayan sanayi ve ticari yüklerinizi adresinizden alıyor, Bursa'da alıcı adresine teslim ediyoruz\. Hızlı teklif alın\."/);
  assert.match(routeContent, /title: "İzmir Bursa Parsiyel Taşımacılık"/);
  assert.match(routeContent, /breadcrumbParent:[\s\S]*href: "\/izmir-parsiyel-tasimacilik"/);
  assert.match(routeContent, /Kemalpaşa, Işıkkent, Torbalı ve Çiğli'den Bursa'ya Yük Taşıma/);
  assert.match(routeContent, /İzmir–Bursa Hattında Sanayi ve Ticari Yükler/);
  assert.match(routeContent, /1 Palet İzmir'den Bursa'ya Gönderilebilir mi\?/);
  assert.match(routeContent, /İzmir Bursa Parsiyel Nakliye Fiyatı Nasıl Hesaplanır\?/);
  assert.match(routeContent, /İzmir–Bursa Hattı Neden Önemli\?/);
  assert.equal((sectionsContent.match(/title: "/g) ?? []).length, 9, "all nine route-specific sections should be present");
  assert.equal((stepsContent.match(/title: "/g) ?? []).length, 5, "all five process steps should be present");
  assert.equal((routeContent.match(/question:/g) ?? []).length, 7, "all seven visible FAQ items should be present");
  assert.match(routeContent, /href: "\/izmir-parsiyel-tasimacilik"/);
  assert.match(routeContent, /href: "\/yurtici-parsiyel-tasimacilik"/);
  assert.match(routeContent, /href: "\/komple-tasimacilik"/);
  assert.match(content, /anchor: "İzmir → Bursa", href: "\/izmir-bursa-parsiyel-tasimacilik"/);

  assert.match(route, /defaultSenderCity="İzmir"/);
  assert.match(route, /defaultReceiverCity="Bursa"/);
  assert.doesNotMatch(route, /defaultReceiverDistrict=/);
  assert.match(route, /sectionId="izmir-bursa-parsiyel-teklif"/);
  assert.match(route, /Yük Bilgilerini Gönder – Teklif Al/);
  assert.match(route, /routeSummaryLabel="İzmir → Bursa rota planı"/);
  assert.match(planner, /Açık yükleme adresi/);
  assert.match(planner, /Açık teslimat adresi/);
  assert.match(planner, /Palet \/ koli adedi/);
  assert.match(planner, /Toplam ağırlık \(kg\)/);
  assert.match(planner, /İstiflenebilirlik/);
  assert.match(planner, /Yük hazır olma tarihi/);
  assert.match(planner, /sm:grid-cols-2/);
  assert.match(marketingPage, /mt-9 flex flex-col gap-3 sm:flex-row/);
  assert.match(marketingPage, /mt-8 flex flex-col justify-center gap-3 sm:flex-row/);
  assert.match(marketingPage, /rex:open-quote-form/);

  assert.equal(sitemapMatches.length, 1, "canonical route should appear in sitemap exactly once");
  assert.match(structuredData, /"izmir-bursa-parsiyel-tasimacilik"/);
  assert.match(structuredData, /page\.breadcrumbParent/);
  assert.doesNotMatch(
    `${routeContent}\n${route}\n${structuredData}`,
    /FedEx|UPS|DHL|Aramex|QuickShipper|Navlungo|alt taşıyıcı|anlaşmalı kargo|nakliye komisyoncu|araç tedarik|alış fiyat|ticari anlaşma|hangi hattın hangi firma|arka plandaki tedarik modeli|özmal araç|özmal filo|kendi filomuz|Bursa şubesi|Bursa deposu|kendi aktarma merkezi/i,
    "source-visible route data must not disclose carriers, suppliers, buying prices, or the fulfillment model",
  );
  assert.doesNotMatch(routeContent, /otomotiv lojistiği uzmanı|OEM lojistik sağlayıcısı|just-in-time|üretim hattı besleme/i);
});

test("Manisa-Bursa route acceptance: industrial corridor intent, city defaults, and private operations", async () => {
  const [route, content, marketingPage, planner, sitemap, structuredData] = await Promise.all([
    read("src/pages/manisa-bursa-parsiyel-tasimacilik.tsx"),
    read("src/content/marketing-pages.ts"),
    read("src/components/MarketingPage.tsx"),
    read("src/components/DomesticPartialPlanner.tsx"),
    read("public/sitemap.xml"),
    read("src/lib/structured-data.ts"),
  ]);
  const routeStart = content.indexOf('"manisa-bursa-parsiyel-tasimacilik":');
  const routeEnd = content.indexOf('"denizyolu-parsiyel-tasimacilik":', routeStart);
  const routeContent = content.slice(routeStart, routeEnd);
  const sectionsContent = routeContent.slice(routeContent.indexOf("sections: ["), routeContent.indexOf("steps: ["));
  const stepsContent = routeContent.slice(routeContent.indexOf("steps: ["), routeContent.indexOf("faq: ["));
  const sitemapMatches = sitemap.match(/https:\/\/www\.rexlojistik\.com\/manisa-bursa-parsiyel-tasimacilik/g) ?? [];

  assert.ok(routeStart >= 0 && routeEnd > routeStart, "route content should exist as an isolated marketing entry");
  assert.match(routeContent, /seoTitle: "Manisa Bursa Parsiyel Taşımacılık \| REX Lojistik"/);
  assert.match(routeContent, /seoDescription: "Manisa'dan Bursa'ya 1 paletten başlayan sanayi ve ticari yüklerinizi adresinizden alıyor, Bursa'da alıcı adresine teslim ediyoruz\. Hızlı teklif alın\."/);
  assert.match(routeContent, /title: "Manisa Bursa Parsiyel Taşımacılık"/);
  assert.match(routeContent, /breadcrumbParent:[\s\S]*href: "\/manisa-parsiyel-tasimacilik"/);
  assert.match(routeContent, /Manisa–Bursa Sanayi ve Üretim Hattında Parsiyel Taşıma/);
  assert.match(routeContent, /Bursa'ya Hangi Sanayi ve Ticari Yükler Gönderilebilir\?/);
  assert.match(routeContent, /1 Palet Manisa'dan Bursa'ya Gönderilebilir mi\?/);
  assert.match(routeContent, /Manisa Bursa Parsiyel Nakliye Fiyatı Nasıl Hesaplanır\?/);
  assert.match(routeContent, /Manisa–Bursa Hattı Neden Önemli\?/);
  assert.equal((sectionsContent.match(/title: "/g) ?? []).length, 9, "all nine route-specific sections should be present");
  assert.equal((stepsContent.match(/title: "/g) ?? []).length, 5, "all five process steps should be present");
  assert.equal((routeContent.match(/question:/g) ?? []).length, 7, "all seven visible FAQ items should be present");
  assert.match(routeContent, /href: "\/manisa-parsiyel-tasimacilik"/);
  assert.match(routeContent, /href: "\/yurtici-parsiyel-tasimacilik"/);
  assert.match(routeContent, /href: "\/komple-tasimacilik"/);
  assert.match(content, /anchor: "Manisa → Bursa", href: "\/manisa-bursa-parsiyel-tasimacilik"/);

  assert.match(route, /defaultSenderCity="Manisa"/);
  assert.match(route, /defaultReceiverCity="Bursa"/);
  assert.doesNotMatch(route, /defaultReceiverDistrict=/);
  assert.match(route, /sectionId="manisa-bursa-parsiyel-teklif"/);
  assert.match(route, /Yük Bilgilerini Gönder – Teklif Al/);
  assert.match(route, /routeSummaryLabel="Manisa → Bursa rota planı"/);
  assert.match(planner, /Açık yükleme adresi/);
  assert.match(planner, /Açık teslimat adresi/);
  assert.match(planner, /Palet \/ koli adedi/);
  assert.match(planner, /Toplam ağırlık \(kg\)/);
  assert.match(planner, /İstiflenebilirlik/);
  assert.match(planner, /Yük hazır olma tarihi/);
  assert.match(planner, /sm:grid-cols-2/);
  assert.match(marketingPage, /mt-9 flex flex-col gap-3 sm:flex-row/);
  assert.match(marketingPage, /mt-8 flex flex-col justify-center gap-3 sm:flex-row/);
  assert.match(marketingPage, /rex:open-quote-form/);

  assert.equal(sitemapMatches.length, 1, "canonical route should appear in sitemap exactly once");
  assert.match(structuredData, /"manisa-bursa-parsiyel-tasimacilik"/);
  assert.match(structuredData, /page\.breadcrumbParent/);
  assert.doesNotMatch(
    `${routeContent}\n${route}\n${structuredData}`,
    /FedEx|UPS|DHL|Aramex|QuickShipper|Navlungo|alt taşıyıcı|anlaşmalı kargo|nakliye komisyoncu|araç tedarik|alış fiyat|ticari anlaşma|hangi hattın hangi firma|arka plandaki tedarik modeli|özmal araç|özmal filo|kendi filomuz|Bursa şubesi|Bursa deposu|kendi aktarma merkezi/i,
    "source-visible route data must not disclose carriers, suppliers, buying prices, or the fulfillment model",
  );
  assert.doesNotMatch(routeContent, /otomotiv lojistiği uzmanı|OEM lojistik sağlayıcısı|just-in-time|üretim hattı besleme/i);
});

test("public service pages prepare service-specific WhatsApp quote summaries", async () => {
  const routeVariants = {
    "komple-tasimacilik": "complete",
    "uluslararasi-karayolu-tasimaciligi": "international-road",
    "hava-kargo": "air",
    "kapidan-kapiya-hava-kargo": "air-door",
    "turkiye-geneli-hava-kargo-alimi": "air-pickup",
    "denizyolu-tasimaciligi": "sea",
    "denizyolu-parsiyel-tasimacilik": "sea-lcl",
    "denizyolu-konteyner-tasimaciligi": "sea-fcl",
    "yurtdisindan-turkiyeye-express-kargo": "express-import",
    "turkiyeden-yurtdisina-express-kargo": "express-export",
    depolama: "storage",
  };
  const [planner, ...routes] = await Promise.all([
    read("src/components/ServiceWhatsAppPlanner.tsx"),
    ...Object.keys(routeVariants).map((slug) => read(`src/pages/${slug}.tsx`)),
  ]);

  Object.entries(routeVariants).forEach(([slug, variant], index) => {
    assert.match(routes[index], /ServiceWhatsAppPlanner/);
    assert.match(routes[index], new RegExp(`variant="${variant}"`), `${slug} should use its service-specific planner`);
  });
  assert.match(planner, /https:\/\/wa\.me\/905434010755\?text=/);
  assert.match(planner, /Teklif hazırlık durumu/);
  assert.match(planner, /Uygun operasyonu, tahmini süreyi ve toplam fiyat kapsamını/);
  assert.match(planner, /Türkiye'nin 81 ilinden alım adresini/);
  assert.match(planner, /LCL denizyolu parsiyel taşımacılığı/);
  assert.match(planner, /FCL komple konteyner taşımacılığı/);
  assert.match(planner, /yurt dışından Türkiye'ye express kargo/);
  assert.match(planner, /Türkiye'den yurt dışına express kargo/);
  assert.match(planner, /depolama, elleçleme ve dağıtım/);
});

test("the detailed quote form is rendered only from the header", async () => {
  const [header, home, hero, marketing, air, express, sea, expressPlanner] = await Promise.all([
    read("src/components/Header.tsx"),
    read("src/pages/index.tsx"),
    read("src/components/Hero.tsx"),
    read("src/components/MarketingPage.tsx"),
    read("src/components/AirCargoResourcePage.tsx"),
    read("src/components/ExpressCargoResourcePage.tsx"),
    read("src/components/SeaFreightResourcePage.tsx"),
    read("src/components/ExpressQuotePlanner.tsx"),
  ]);

  assert.match(header, /<QuoteForm\s*\/>/);
  assert.match(header, /onClick=\{openQuoteForm\}>Teklif Al/);
  assert.match(header, /rex:open-quote-form/);
  assert.match(hero, /rex:open-quote-form/);
  assert.match(hero, /Hızlı Teklif Al/);
  assert.doesNotMatch(hero, /<QuoteForm\s*\/>/);
  [home, hero, marketing, air, express, sea, expressPlanner].forEach((source) => {
    assert.doesNotMatch(source, /<CTA\s*\/>/);
    assert.doesNotMatch(source, /openQuoteForm/);
  });
});

test("homepage SEO, hero copy and service headings are semantic and focused", async () => {
  const [home, hero, services, tracking, features, header, footer, seo] = await Promise.all([
    read("src/pages/index.tsx"),
    read("src/components/Hero.tsx"),
    read("src/components/Services.tsx"),
    read("src/components/TrackingSection.tsx"),
    read("src/components/Features.tsx"),
    read("src/components/Header.tsx"),
    read("src/components/Footer.tsx"),
    read("src/components/SEO.tsx"),
  ]);

  assert.match(home, /title="REX Lojistik \| Parsiyel, Komple ve Uluslararası Taşımacılık"/);
  assert.match(home, /description="REX Lojistik; yurtiçi parsiyel ve komple taşımacılık, uluslararası karayolu, hava kargo, denizyolu ve express lojistik çözümleri sunar\. 1 paletten komple araca, Türkiye geneli ve uluslararası taşımacılık için hızlı teklif alın\."/);
  assert.match(home, /url="https:\/\/www\.rexlojistik\.com\/"/);
  const documentDefaults = seo.slice(seo.indexOf("export function SEOElements"));
  assert.doesNotMatch(documentDefaults, /<meta name="description"/);
  assert.match(hero, /<h1[\s\S]*Yurtiçi ve Uluslararası[\s\S]*Lojistik Çözümleri[\s\S]*<\/h1>/);
  assert.doesNotMatch(hero, /<h1[\s\S]*Lojistikte Güvenilir Çözüm[\s\S]*<\/h1>/);
  assert.match(hero, /Lojistikte Güvenilir Çözüm/);
  assert.match(hero, /1 paletten komple araca; Türkiye&apos;nin 81 iline ve dünya genelinde karayolu, hava, denizyolu ve express taşımacılık çözümleri\./);

  const renderedHomepageSources = [home, hero, services, tracking, features, header, footer].join("\n");
  assert.equal((renderedHomepageSources.match(/<h1\b/g) || []).length, 1);
  assert.match(services, /<h2[\s\S]*Hizmetlerimiz[\s\S]*<\/h2>/);
  assert.match(services, /<h3[\s\S]*\{service\.title\}[\s\S]*<\/h3>/);
  assert.match(features, /20\+ yıllık sektör deneyiminin üzerine kurulan REX Lojistik/);

  const expectedServices = [
    ["Yurtiçi Parsiyel Taşımacılık", "/yurtici-parsiyel-tasimacilik"],
    ["Yurtiçi Komple Taşımacılık", "/komple-tasimacilik"],
    ["Uluslararası Karayolu Taşımacılığı", "/uluslararasi-karayolu-tasimaciligi"],
    ["Hava Kargo", "/hava-kargo"],
    ["Denizyolu Taşımacılığı", "/denizyolu-tasimaciligi"],
    ["Uluslararası Express Kargo", "/express-kargo"],
    ["Depolama Hizmetleri", "/depolama"],
  ];
  for (const [title, href] of expectedServices) {
    assert.match(services, new RegExp(`title: "${title}"`));
    assert.match(services, new RegExp(`href: "${href}"`));
  }
});

test("service pages expose crawlable contextual links only to existing internal routes", async () => {
  const [content, marketingPage] = await Promise.all([
    read("src/content/marketing-pages.ts"),
    read("src/components/MarketingPage.tsx"),
  ]);
  const expectedLinks = [
    ["yurtici-parsiyel-tasimacilik", "komple araç", "/komple-tasimacilik"],
    ["yurtici-parsiyel-tasimacilik", "Depolama bağlantısı", "/depolama"],
    ["yurtici-parsiyel-tasimacilik", "uluslararası karayolu taşımacılığı", "/uluslararasi-karayolu-tasimaciligi"],
    ["komple-tasimacilik", "yurtiçi parsiyel taşımacılık", "/yurtici-parsiyel-tasimacilik"],
    ["komple-tasimacilik", "uluslararası karayolu taşımacılığı", "/uluslararasi-karayolu-tasimaciligi"],
    ["komple-tasimacilik", "Depolama ihtiyacı", "/depolama"],
    ["uluslararasi-karayolu-tasimaciligi", "uluslararası parsiyel taşımacılık", "/uluslararasi-karayolu-parsiyel-tasimacilik"],
    ["uluslararasi-karayolu-tasimaciligi", "komple taşımacılık", "/komple-tasimacilik"],
    ["uluslararasi-karayolu-tasimaciligi", "minivan express", "/minivan-express-tasimacilik"],
    ["uluslararasi-karayolu-tasimaciligi", "hava kargo", "/hava-kargo"],
    ["uluslararasi-karayolu-parsiyel-tasimacilik", "uluslararası karayolu taşımacılığı", "/uluslararasi-karayolu-tasimaciligi"],
    ["uluslararasi-karayolu-parsiyel-tasimacilik", "minivan express", "/minivan-express-tasimacilik"],
    ["uluslararasi-karayolu-parsiyel-tasimacilik", "hava kargo", "/hava-kargo"],
    ["minivan-express-tasimacilik", "uluslararası karayolu taşımacılığı", "/uluslararasi-karayolu-tasimaciligi"],
    ["minivan-express-tasimacilik", "uluslararası parsiyel taşımacılık", "/uluslararasi-karayolu-parsiyel-tasimacilik"],
    ["minivan-express-tasimacilik", "hava kargo", "/hava-kargo"],
    ["hava-kargo", "Türkiye geneli hava kargo alım", "/turkiye-geneli-hava-kargo-alimi"],
    ["hava-kargo", "kapıdan kapıya hava kargo", "/kapidan-kapiya-hava-kargo"],
    ["hava-kargo", "uluslararası karayolu taşımacılığı", "/uluslararasi-karayolu-tasimaciligi"],
    ["hava-kargo", "denizyolu taşımacılığı", "/denizyolu-tasimaciligi"],
    ["kapidan-kapiya-hava-kargo", "hava kargo hizmetinde", "/hava-kargo"],
    ["turkiye-geneli-hava-kargo-alimi", "hava kargo hizmeti", "/hava-kargo"],
    ["denizyolu-tasimaciligi", "LCL parsiyel denizyolu taşımacılığında", "/denizyolu-parsiyel-tasimacilik"],
    ["denizyolu-tasimaciligi", "FCL komple konteyner taşımacılığında", "/denizyolu-konteyner-tasimaciligi"],
    ["denizyolu-tasimaciligi", "hava kargo", "/hava-kargo"],
    ["denizyolu-tasimaciligi", "uluslararası karayolu taşımacılığı", "/uluslararasi-karayolu-tasimaciligi"],
    ["denizyolu-parsiyel-tasimacilik", "denizyolu taşımacılığı", "/denizyolu-tasimaciligi"],
    ["denizyolu-parsiyel-tasimacilik", "FCL", "/denizyolu-konteyner-tasimaciligi"],
    ["denizyolu-konteyner-tasimaciligi", "denizyolu taşımacılığı", "/denizyolu-tasimaciligi"],
    ["denizyolu-konteyner-tasimaciligi", "LCL", "/denizyolu-parsiyel-tasimacilik"],
    ["express-kargo", "hava kargo", "/hava-kargo"],
    ["express-kargo", "minivan express", "/minivan-express-tasimacilik"],
    ["depolama", "yurtiçi parsiyel taşımacılık", "/yurtici-parsiyel-tasimacilik"],
    ["depolama", "komple taşımacılık", "/komple-tasimacilik"],
  ];

  const pageBlock = (slug) => {
    const start = content.indexOf(`  "${slug}": {`);
    assert.notEqual(start, -1, `${slug} must exist in marketing content`);
    const next = content.indexOf("\n  \"", start + 5);
    return content.slice(start, next === -1 ? content.length : next);
  };

  for (const [source, anchor, href] of expectedLinks) {
    const block = pageBlock(source);
    const copy = block.slice(0, block.indexOf("contextualLinks:"));
    assert.ok(copy.includes(anchor), `${source} copy must naturally contain ${anchor}`);
    assert.ok(block.includes(`{ anchor: "${anchor}", href: "${href}" }`), `${source} must link ${anchor} to ${href}`);
  }

  assert.equal(expectedLinks.length, 34);
  const contextualRenderer = marketingPage.slice(
    marketingPage.indexOf("function renderContextualParagraph"),
    marketingPage.indexOf("export function MarketingPage"),
  );
  assert.match(contextualRenderer, /<Link[\s\S]*href=\{nextLink\.link\.href\}/);
  assert.match(contextualRenderer, /usedTargets\.add\(nextLink\.link\.href\)/);
  assert.doesNotMatch(contextualRenderer, /rel="nofollow"/);
  assert.doesNotMatch(contextualRenderer, /target="_blank"/);

  const targetPaths = [...new Set(expectedLinks.map(([, , href]) => href))];
  await Promise.all(targetPaths.map((href) => read(`src/pages${href}.tsx`)));
});

test("every public page uses the enlarged REX-only favicon", async () => {
  const [document, notFound] = await Promise.all([
    read("src/pages/_document.tsx"),
    read("src/pages/404.tsx"),
  ]);
  assert.match(document, /rel="icon"[\s\S]*\/rex-favicon-rex\.png\?v=2/);
  assert.match(document, /rel="apple-touch-icon"[\s\S]*\/rex-favicon-rex\.png\?v=2/);
  assert.match(notFound, /\/rex-favicon-rex\.png\?v=2/);
  assert.doesNotMatch(notFound, /\/favicon\.ico/);
});

test("public homepage protects customer confidentiality and avoids unverifiable proof points", async () => {
  const [home, hero, cta] = await Promise.all([
    read("src/pages/index.tsx"),
    read("src/components/Hero.tsx"),
    read("src/components/CTA.tsx"),
  ]);
  assert.doesNotMatch(home, /Testimonials|referanslar/);
  assert.doesNotMatch(hero, /50K\+|Müşteri\s*</);
  assert.doesNotMatch(cta, /100%|Müşteri Memnuniyeti/);
  assert.match(hero, /Paletten Başlayan/);
  assert.match(cta, /81[\s\S]*İl Kapsama/);
  assert.match(cta, /fiyat teklifimizi hazırlayıp sizinle paylaşalım/);
  assert.doesNotMatch(cta, /fiyat teklifi alalım/);
});

test("public quote request is a two-step form with flexible contact validation", async () => {
  const [form, endpoint, delivery, queueApi, sql, privacyNotice, vercel] = await Promise.all([
    read("src/components/QuoteForm.tsx"),
    read("src/pages/api/send-quote.ts"),
    read("src/lib/quote-delivery.ts"),
    read("src/pages/api/quotes/process-queue.ts"),
    read("supabase/migrations/20260826120000_secure_quote_requests.sql"),
    read("src/pages/kvkk-aydinlatma-metni.tsx"),
    read("vercel.json"),
  ]);
  assert.match(form, /İletişim ve güzergâh/);
  assert.match(form, /Taşıma ve yük/);
  assert.match(form, /Adım \{step\} \/ 2/);
  assert.match(form, /Telefon veya e-postadan en az birini giriniz/);
  assert.match(form, /goToShipmentDetails/);
  assert.match(endpoint, /\(!emailProvided && !phoneProvided\)/);
  assert.match(delivery, /Yükleme Noktası: \$\{data\.loading_point\}/);
  assert.match(endpoint, /validPositiveNumber/);
  assert.doesNotMatch(delivery, /data\.senderCountry|data\.receiverCountry/);
  assert.match(form, /href="\/kvkk-aydinlatma-metni"/);
  assert.match(form, /name="kvkkAcknowledged"/);
  assert.match(form, /name="commercialConsent"/);
  assert.match(form, /İsteğe bağlı/);
  assert.match(form, /kvkkAcknowledged: false/);
  assert.match(form, /commercialConsent: false/);
  assert.match(form, /TurnstileWidget/);
  assert.match(form, /captchaToken/);
  assert.match(form, /submissionId/);
  assert.match(endpoint, /siteverify/);
  assert.match(endpoint, /TURNSTILE_SECRET_KEY/);
  assert.match(endpoint, /rex_consume_quote_rate_limit/);
  assert.match(endpoint, /QUOTE_SECURITY_SECRET/);
  assert.match(endpoint, /formData\.kvkkAcknowledged !== true/);
  assert.match(endpoint, /PRIVACY_NOTICE_VERSION/);
  assert.match(endpoint, /quote_consent_events/);
  assert.match(delivery, /QUOTE_RECIPIENT_EMAIL \|\| "info@rexlojistik\.com"/);
  assert.match(delivery, /Ticari Elektronik İleti İzni/);
  assert.doesNotMatch(delivery, /hakankesikler@gmail\.com/);
  assert.match(queueApi, /rex_claim_quote_delivery_job/);
  assert.match(queueApi, /CRON_SECRET/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.quote_requests/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.quote_consent_events/);
  assert.match(sql, /quote_consent_events_immutable/);
  assert.match(sql, /REVOKE ALL ON public\.quote_consent_events FROM PUBLIC, anon, authenticated/);
  assert.match(vercel, /\/api\/quotes\/process-queue\?limit=20/);
  assert.match(privacyNotice, /Kişisel Verilerin İşlenmesinin Hukuki Sebepleri/);
  assert.match(privacyNotice, /teklif talebinin işleme alınmasının şartı değildir/);
});

test("sales CRM preserves the complete quote-to-first-invoice funnel", async () => {
  const [sql, service, screen, permissions, workspace] = await Promise.all([
    read("supabase/migrations/20260827100000_sales_crm_pipeline.sql"),
    read("src/services/salesCrmService.ts"),
    read("src/components/modules/SalesCRMModule.tsx"),
    read("src/lib/staff-permissions.ts"),
    read("src/components/modules/CRMWorkspace.tsx"),
  ]);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.crm_opportunities/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.crm_activities/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.crm_offers/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.crm_stage_events/);
  assert.match(sql, /CREATE TRIGGER rex_crm_quote_to_opportunity AFTER INSERT ON public\.quote_requests/);
  assert.match(sql, /WHEN NEW\.status='sent'[\s\S]*THEN 'follow_up'/);
  assert.match(sql, /NEW\.integration_status='official'/);
  assert.match(sql, /t\.status='onaylandi'/);
  assert.match(sql, /first_job_id IS NULL OR NEW\.first_invoice_id IS NULL/);
  assert.match(sql, /rex_crm_stage_events_immutable/);
  assert.match(service, /addActivity/);
  assert.match(service, /createOffer/);
  assert.match(service, /createJobFromQuote/);
  assert.match(screen, /Müşteri Görüşmeleri ve Teklif Süreci/);
  assert.match(screen, /Satış Temsilcisi Performansı/);
  assert.match(screen, /İlk iş emri onaylanıp sevkiyat tamamlandıktan/);
  assert.match(permissions, /crm\.sales_pipeline/);
  assert.match(workspace, /Satış CRM/);
});

test("sales CRM automates tasks, approvals, customer 360 and real offer delivery", async () => {
  const [sql, service, screen, delivery, api] = await Promise.all([
    read("supabase/migrations/20260827113000_sales_crm_automation.sql"),
    read("src/services/salesCrmService.ts"),
    read("src/components/modules/SalesCRMModule.tsx"),
    read("src/lib/crm-offer-delivery.ts"),
    read("src/pages/api/crm/offers/[offerId]/send.ts"),
  ]);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.crm_tasks/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.crm_offer_versions/);
  assert.match(sql, /rex_crm_assign_and_schedule/);
  assert.match(sql, /rex_crm_duplicate_candidates/);
  assert.match(sql, /rex_crm_customer_360/);
  assert.match(sql, /Kaybedilen satışlarda kayıp nedeni zorunludur/);
  assert.match(sql, /Yüksek tutarlı teklifleri yalnızca şirket sahibi onaylayabilir/);
  assert.match(sql, /Teklif sürüm geçmişi değiştirilemez veya silinemez/);
  assert.match(service, /completeTask/);
  assert.match(service, /findDuplicates/);
  assert.match(service, /customer360/);
  assert.match(service, /sendOffer/);
  assert.match(screen, /Bugünün Satış Görevleri/);
  assert.match(screen, /Müşteri 360°/);
  assert.match(screen, /E-posta ile Gönder/);
  assert.match(screen, /REX_CRM_/);
  assert.match(delivery, /attachments/);
  assert.match(delivery, /application\/pdf/);
  assert.match(delivery, /idempotencyKey/);
  assert.match(api, /rex_has_permission/);
  assert.match(api, /email_status: "sent"/);
  assert.match(api, /quote_sent/);
});

test("staff password recovery opens a dedicated secure reset flow", async () => {
  const [login, recoveryGate, security] = await Promise.all([
    read("src/pages/login.tsx"),
    read("src/pages/sifre-yenile.tsx"),
    read("src/lib/security.ts"),
  ]);
  assert.match(login, /token_hash/);
  assert.match(login, /verifyOtp/);
  assert.match(login, /type: "recovery"/);
  assert.match(login, /recoverySessionReady/);
  assert.match(login, /recoveryMfaRequired/);
  assert.match(login, /recoveryMfaFactorId/);
  assert.match(login, /supabase\.auth\.mfa\.challenge/);
  assert.match(login, /supabase\.auth\.mfa\.verify/);
  assert.match(login, /Microsoft Authenticator/);
  assert.match(login, /insufficient_aal/);
  assert.match(login, /Güvenli bağlantı doğrulanıyor/);
  assert.match(login, /supabase\.auth\.setSession/);
  assert.match(login, /exchangeCodeForSession/);
  assert.match(login, /access_token/);
  assert.match(login, /refresh_token/);
  assert.match(login, /supabase\.auth\.getSession/);
  assert.match(login, /supabase\.auth\.getUser/);
  assert.match(login, /eski bir oturumun yeni şifre bağlantısının önüne geçmesine izin verme/);
  assert.match(login, /önceki şifrenizden farklı/);
  assert.match(login, /error_code/);
  assert.match(login, /otp_expired/);
  assert.match(login, /redirectTo: `\$\{window\.location\.origin\}\/login`/);
  assert.match(login, /Güvenlik doğrulaması gerekli/);
  assert.ok(login.indexOf("if (hasTokenHash)") < login.indexOf("const recoverySession = recoverySessionReady"));
  assert.match(recoveryGate, /Şifre Yenilemeye Devam Et/);
  assert.match(recoveryGate, /token_hash/);
  assert.match(recoveryGate, /type=recovery/);
  assert.doesNotMatch(recoveryGate, /supabase\.auth/);
  assert.match(security, /MIN_PASSWORD_LENGTH = 12/);
  assert.match(security, /STAFF_IDLE_TIMEOUT_MS = 30 \* 60 \* 1000/);
  assert.match(security, /\["admin", "sales", "operations", "accounting", "hr", "viewer", "demo"\]\.includes\(role\)/);
  assert.match(security, /en az bir özel karakter/);
});

test("sea freight content hub publishes LCL, FCL, container and CBM resources", async () => {
  const slugs = [
    "denizyolu-parsiyel-tasimacilik",
    "denizyolu-konteyner-tasimaciligi",
    "lcl-mi-fcl-mi",
    "konteyner-olculeri",
    "cbm-hesaplama",
  ];
  const [content, resourcePage, structuredData, header, footer, sitemap, calculator] = await Promise.all([
    read("src/content/marketing-pages.ts"),
    read("src/components/SeaFreightResourcePage.tsx"),
    read("src/lib/structured-data.ts"),
    read("src/components/Header.tsx"),
    read("src/components/Footer.tsx"),
    read("public/sitemap.xml"),
    read("src/pages/cbm-hesaplama.tsx"),
  ]);

  for (const slug of slugs) {
    assert.match(content, new RegExp(`"${slug}"`));
    assert.match(sitemap, new RegExp(`https://www\\.rexlojistik\\.com/${slug}`));
  }

  assert.match(header, /Denizyolu Parsiyel \(LCL\)/);
  assert.match(header, /Konteyner Taşımacılığı \(FCL\)/);
  assert.match(header, /label: "Denizyolu Taşımacılığı",\s+children:/);
  assert.match(header, /aria-expanded=\{expandedMobileService === item\.href\}/);
  assert.doesNotMatch(footer, /CBM Hesaplama/);
  assert.match(content, /related: \["denizyolu-parsiyel-tasimacilik", "denizyolu-konteyner-tasimaciligi", "lcl-mi-fcl-mi", "cbm-hesaplama"\]/);
  assert.match(resourcePage, /buildResourcePageStructuredData/);
  assert.match(structuredData, /"@type": "Article"/);
  assert.doesNotMatch(structuredData, /"@type": "FAQPage"/);
  assert.match(content, /Akılcı Maliyet/);
  assert.match(content, /Planlı Transit/);
  assert.match(content, /Maliyet Kontrolü/);
  assert.match(content, /Program Seçeneği/);
  assert.match(calculator, /Boy × En × Yükseklik × Adet ÷ 1\.000\.000/);
  assert.match(calculator, /Doğru ölçü, daha isabetli seçenek/);
  assert.match(calculator, /aria-live="polite"/);
});

test("air cargo content hub publishes nationwide pickup, comparison and chargeable-weight resources", async () => {
  const airSlugs = [
    "uluslararasi-hava-kargo",
    "kapidan-kapiya-hava-kargo",
    "turkiye-geneli-hava-kargo-alimi",
    "hava-kargo-mu-express-kargo-mu",
    "hava-kargo-hacimsel-agirlik-hesaplama",
  ];
  const [content, resourcePage, structuredData, calculator, comparison, header, footer, sitemap] = await Promise.all([
    read("src/content/marketing-pages.ts"),
    read("src/components/AirCargoResourcePage.tsx"),
    read("src/lib/structured-data.ts"),
    read("src/pages/hava-kargo-hacimsel-agirlik-hesaplama.tsx"),
    read("src/pages/hava-kargo-mu-express-kargo-mu.tsx"),
    read("src/components/Header.tsx"),
    read("src/components/Footer.tsx"),
    read("public/sitemap.xml"),
  ]);

  for (const slug of airSlugs) {
    assert.match(content, new RegExp(`"${slug}"`));
    assert.match(sitemap, new RegExp(`/${slug}<`));
  }

  assert.match(content, /Türkiye'nin 81 ilindeki uygun adreslerden/);
  assert.match(content, /Zaman–Maliyet Dengesi/);
  assert.match(content, /REX'in işi tam da bu bağlantıları görünür hale getirmektir/);
  assert.match(resourcePage, /Hava kargo bilgi merkezi/);
  assert.match(resourcePage, /81 ilden uygun alım/);
  assert.match(resourcePage, /buildResourcePageStructuredData/);
  assert.doesNotMatch(structuredData, /"@type": "FAQPage"/);
  assert.match(calculator, /volumeCm3 \/ 6_000/);
  assert.match(calculator, /chargeableWeight/);
  assert.match(calculator, /aria-live="polite"/);
  assert.match(calculator, /6\.000 böleni yaygın bir planlama referansıdır/);
  assert.match(comparison, /Genel hava kargo/);
  assert.match(comparison, /Express kargo/);
  assert.match(header, /Kapıdan Kapıya Hava Kargo/);
  assert.match(header, /Türkiye Geneli Hava Kargo Alımı/);
  assert.match(header, /label: "Hava Kargo Taşımacılığı",\s+children:/);
  assert.doesNotMatch(footer, /Hava Kargo Ağırlık Hesaplama/);
  assert.match(content, /related: \["kapidan-kapiya-hava-kargo", "turkiye-geneli-hava-kargo-alimi", "hava-kargo-hacimsel-agirlik-hesaplama"\]/);
});

test("express cargo hub publishes inbound, outbound and planning resources without exposing intermediary integrations", async () => {
  const expressSlugs = [
    "yurtdisindan-turkiyeye-express-kargo",
    "turkiyeden-yurtdisina-express-kargo",
    "express-kargo-hacimsel-agirlik-hesaplama",
    "yurtdisi-kargo-gonderim-rehberi",
    "almanyaya-express-kargo",
    "amerikaya-express-kargo",
    "ingiltereye-express-kargo",
    "cinden-turkiyeye-express-kargo",
  ];
  const [content, resourcePage, structuredData, calculator, guide, planner, expressPage, header, footer, services, sitemap] = await Promise.all([
    read("src/content/marketing-pages.ts"),
    read("src/components/ExpressCargoResourcePage.tsx"),
    read("src/lib/structured-data.ts"),
    read("src/pages/express-kargo-hacimsel-agirlik-hesaplama.tsx"),
    read("src/pages/yurtdisi-kargo-gonderim-rehberi.tsx"),
    read("src/components/ExpressQuotePlanner.tsx"),
    read("src/pages/express-kargo.tsx"),
    read("src/components/Header.tsx"),
    read("src/components/Footer.tsx"),
    read("src/components/Services.tsx"),
    read("public/sitemap.xml"),
  ]);

  for (const slug of expressSlugs) {
    assert.match(content, new RegExp(`"${slug}"`));
    assert.match(sitemap, new RegExp(`/${slug}<`));
  }

  const publicExpressCopy = [content, resourcePage, guide, services].join("\n");
  assert.match(content, /220'den fazla ülke ve bölgeye/);
  assert.match(content, /Türkiye'den dünyaya, dünyadan Türkiye'ye/);
  assert.match(content, /DHL Express, FedEx, UPS veya Aramex/);
  assert.match(content, /ortaklık, yetkili temsilcilik veya marka onayı anlamına gelmez/);
  assert.doesNotMatch(publicExpressCopy, /QuickShipper|Navlungo/i);
  assert.match(resourcePage, /Express kargo bilgi merkezi/);
  assert.match(resourcePage, /Dünyadan Türkiye'ye/);
  assert.match(resourcePage, /buildResourcePageStructuredData/);
  assert.doesNotMatch(structuredData, /"@type": "FAQPage"/);
  assert.match(calculator, /volumeCm3 \/ 5_000/);
  assert.match(calculator, /Boy × En × Yükseklik × Adet ÷ 5\.000/);
  assert.match(calculator, /aria-live="polite"/);
  assert.match(guide, /Taşıyıcı değil, uygun servis seçilir/);
  assert.match(expressPage, /ExpressQuotePlanner/);
  assert.match(planner, /Akıllı express ön analiz/);
  assert.match(planner, /Ekonomik plan/);
  assert.match(planner, /Dengeli plan/);
  assert.match(planner, /Öncelikli plan/);
  assert.match(planner, /Yaklaşık ücretlendirilebilir/);
  assert.match(planner, /wa\.me\/905434010755\?text=/);
  assert.match(planner, /Ön kabul kontrolü gerekli/);
  assert.match(header, /Yurt Dışından Türkiye'ye Express/);
  assert.match(header, /Türkiye'den Yurt Dışına Express/);
  assert.match(header, /label: "Uluslararası Express Kargo",\s+children:/);
  assert.doesNotMatch(footer, /Express Kargo Desi Hesaplama/);
  assert.match(content, /related: \["yurtdisindan-turkiyeye-express-kargo", "turkiyeden-yurtdisina-express-kargo", "express-kargo-hacimsel-agirlik-hesaplama", "yurtdisi-kargo-gonderim-rehberi"\]/);
});

test("KolayBi office connects sales, operations and accounting with durable sync records", async () => {
  const [sql, mappingSql, productSyncSql, expenseSql, financeSql, activeSql, reconciliationSql, automaticSyncSql, api, purchaseSyncApi, associateTransactionsApi, mappingApi, associateCreateApi, associateHelper, outboundSyncApi, proceedApi, cancelApi, providerLib, workflow, collection, vercel, service, office, expenseWorkspace, financeWorkspace, accounting, cariForm] = await Promise.all([
    read("supabase/migrations/20260828150000_kolaybi_office_workspace.sql"),
    read("supabase/migrations/20260831210000_kolaybi_manual_mappings.sql"),
    read("supabase/migrations/20260831223000_kolaybi_product_catalog_sync.sql"),
    read("supabase/migrations/20260831234500_kolaybi_general_expense_workspace.sql"),
    read("supabase/migrations/20260901110000_kolaybi_finance_sync.sql"),
    read("supabase/migrations/20260901170000_kolaybi_active_workflows.sql"),
    read("supabase/migrations/20260904123000_secure_customer_e_document_reconciliation.sql"),
    read("supabase/migrations/20260904143000_kolaybi_automatic_bidirectional_sync.sql"),
    read("src/pages/api/kolaybi/office-sync.ts"),
    read("src/pages/api/kolaybi/purchase-invoices/sync.ts"),
    read("src/pages/api/kolaybi/associate-transactions.ts"),
    read("src/pages/api/kolaybi/mappings.ts"),
    read("src/pages/api/kolaybi/associates/[customerId].ts"),
    read("src/lib/kolaybi-associates.ts"),
    read("src/pages/api/kolaybi/outbound-sync.ts"),
    read("src/pages/api/kolaybi/invoices/[invoiceId]/proceed.ts"),
    read("src/pages/api/kolaybi/invoices/[invoiceId]/cancel.ts"),
    read("src/lib/kolaybi.ts"),
    read("src/services/workflowService.ts"),
    read("src/components/CollectionDialog.tsx"),
    read("vercel.json"),
    read("src/services/kolaybiOfficeService.ts"),
    read("src/components/modules/KolayBiOfficeModule.tsx"),
    read("src/components/GeneralExpenseWorkspace.tsx"),
    read("src/components/FinanceWorkspace.tsx"),
    read("src/components/modules/AccountingModule.tsx"),
    read("src/components/CariForm.tsx"),
  ]);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.kolaybi_master_records/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.kolaybi_sync_runs/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.kolaybi_sync_events/);
  assert.match(sql, /rex_kolaybi_events_append_only/);
  assert.match(sql, /REVOKE INSERT,UPDATE,DELETE ON public\.kolaybi_sync_events FROM authenticated/);
  assert.match(mappingSql, /manual_match/);
  assert.match(mappingSql, /manual_ignore/);
  assert.match(mappingSql, /rex_resolve_kolaybi_mapping/);
  assert.match(mappingSql, /SECURITY DEFINER/);
  assert.match(mappingSql, /invoice_product_mappings/);
  assert.match(productSyncSql, /provider_environment,resource_type,external_id/);
  assert.match(productSyncSql, /products_services_kolaybi_identity_uidx/);
  assert.match(productSyncSql, /approval_status IN \('not_required','pending','approved','rejected'\)/);
  assert.match(productSyncSql, /rex_review_kolaybi_product/);
  assert.match(productSyncSql, /product_approved/);
  assert.match(productSyncSql, /product_rejected/);
  assert.match(expenseSql, /CREATE TABLE IF NOT EXISTS public\.expense_categories/);
  assert.match(expenseSql, /CREATE TABLE IF NOT EXISTS public\.expense_types/);
  assert.match(expenseSql, /expense_type_provider_mappings/);
  assert.match(expenseSql, /expenses_kolaybi_identity_uidx/);
  assert.match(expenseSql, /rex_prevent_expense_catalog_delete/);
  assert.match(expenseSql, /accounting\.expenses/);
  assert.match(financeSql, /financial_accounts_kolaybi_identity_uidx/);
  assert.match(financeSql, /transactions_kolaybi_identity_uidx/);
  assert.match(financeSql, /account_transactions_kolaybi_identity_uidx/);
  assert.match(financeSql, /rex_prevent_kolaybi_finance_delete/);
  assert.match(activeSql, /provider_status text/);
  assert.match(activeSql, /payment_status text/);
  assert.match(activeSql, /auth\.role\(\)<>'service_role'/);
  assert.match(activeSql, /last_synced_at/);
  assert.match(reconciliationSql, /rex_reconcile_sales_invoice_from_provider/);
  assert.match(reconciliationSql, /auth\.role\(\) <> 'service_role'/);
  assert.match(reconciliationSql, /set_config\('rex\.invoice_sync','on',true\)/);
  assert.match(reconciliationSql, /last_status_check_at/);
  assert.match(automaticSyncSql, /CREATE TABLE IF NOT EXISTS public\.kolaybi_outbound_jobs/);
  assert.match(automaticSyncSql, /rex_queue_kolaybi_customer_sync/);
  assert.match(automaticSyncSql, /rex_claim_kolaybi_outbound_job/);
  assert.match(automaticSyncSql, /rex_finish_kolaybi_outbound_job/);
  assert.match(automaticSyncSql, /FOR UPDATE SKIP LOCKED/);
  assert.match(api, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(api, /rex_has_permission/);
  assert.match(api, /integrations\.connections/);
  assert.match(api, /idempotency_key/);
  assert.match(api, /\/associates/);
  assert.match(api, /\/products/);
  assert.match(api, /type=sale_invoice/);
  assert.match(api, /type=purchase_invoice/);
  assert.match(api, /\/financial_action_types/);
  assert.match(api, /type=general_expense/);
  assert.match(api, /kolaybi_financial_action_type_id/);
  assert.match(api, /provider_environment/);
  assert.match(api, /review_required/);
  assert.match(api, /materialAssociateBalance/);
  assert.match(api, /if \(!balances\.length\) return null/);
  assert.match(api, /Sıfır bakiyeli ve REX TYS'de kullanılmayan KolayBi carisi/);
  assert.match(api, /incoming_purchase_invoices/);
  assert.doesNotMatch(api, /from\("purchase_invoices"\)/);
  assert.match(api, /REX TYS fatura kataloğunda kullanılmayan KolayBi ürün\/hizmeti yok sayıldı/);
  assert.match(api, /ignored_count: ignored/);
  assert.match(api, /updatePartner/);
  assert.match(api, /integration_partners/);
  assert.match(api, /\/vaults/);
  assert.match(api, /vault_transactions/);
  assert.match(api, /provider_transactionable_id/);
  assert.match(api, /cronMode/);
  assert.match(api, /kolaybi-office:active:/);
  assert.match(api, /rex_reconcile_sales_invoice_from_provider/);
  assert.match(api, /Kısmi Ödendi/);
  assert.match(purchaseSyncApi, /KOLAYBI_PURCHASE_SYNC_DAYS/);
  assert.match(purchaseSyncApi, /lastPageFrom/);
  assert.match(purchaseSyncApi, /provider_balance/);
  assert.match(purchaseSyncApi, /serviceKey/);
  assert.match(associateTransactionsApi, /accounting\.accounts/);
  assert.match(associateTransactionsApi, /\/associates\/\$\{associateId\}\/transactions/);
  assert.match(associateTransactionsApi, /associate_transactions_synced/);
  assert.match(mappingApi, /integrations\.connections/);
  assert.match(mappingApi, /p_local_entity_id/);
  assert.match(mappingApi, /rex_resolve_kolaybi_mapping/);
  assert.match(mappingApi, /rex_review_kolaybi_product/);
  assert.match(associateCreateApi, /synchronizeKolayBiAssociate/);
  assert.match(associateHelper, /baseUrl\.includes\("sandbox"\) \? "test" : "live"/);
  assert.doesNotMatch(associateHelper, /yalnızca KolayBi sandbox ortamında/);
  assert.match(associateHelper, /associates\?identity_no=/);
  assert.match(associateHelper, /exactMatches\.length > 1/);
  assert.match(associateHelper, /hydrateAssociateAddress/);
  assert.match(associateHelper, /KolayBi cari kartında fatura adresi bulunamadı/);
  assert.match(associateHelper, /match_method: matchMethod/);
  assert.match(associateHelper, /created_from_tms/);
  assert.match(associateHelper, /staleMappingError/);
  assert.match(outboundSyncApi, /rex_claim_kolaybi_outbound_job/);
  assert.match(outboundSyncApi, /rex_finish_kolaybi_outbound_job/);
  assert.match(outboundSyncApi, /synchronizeKolayBiAssociate/);
  assert.match(outboundSyncApi, /CRON_SECRET/);
  assert.match(proceedApi, /accounting\.accounts/);
  assert.match(proceedApi, /proceedKolayBiInvoice/);
  assert.match(proceedApi, /rex_record_customer_payment/);
  assert.match(cancelApi, /accounting\.sales/);
  assert.match(cancelApi, /cancelKolayBiInvoice/);
  assert.match(cancelApi, /rex_cancel_sales_invoice/);
  assert.match(providerLib, /\/invoices\/proceed/);
  assert.match(providerLib, /\/invoices\/e-document\/cancel/);
  assert.match(providerLib, /sale_return_invoice/);
  assert.match(providerLib, /return_invoice_references\[serial_no\]/);
  assert.match(providerLib, /automatic associate matching started/);
  assert.match(providerLib, /synchronizeKolayBiAssociate/);
  assert.match(workflow, /recordKolayBiCustomerPayment/);
  assert.match(collection, /kolaybi_document_id/);
  assert.match(collection, /kolaybi_vault_id/);
  assert.match(collection, /fatura ve cari hareketlerine otomatik olarak işlenecektir/);
  const vercelConfig = JSON.parse(vercel);
  assert.match(vercel, /\/api\/kolaybi\/process-queue\?limit=10[\s\S]*\*\/15 \* \* \* \*/);
  assert.match(vercel, /office-sync\?mode=active&resource=products/);
  assert.match(vercel, /office-sync\?mode=active&resource=associates/);
  assert.match(vercel, /office-sync\?mode=active&resource=sales_invoices/);
  assert.match(vercel, /office-sync\?mode=active&resource=purchase_invoices/);
  assert.match(vercel, /office-sync\?mode=active&resource=vault_transactions/);
  assert.match(vercel, /\/api\/kolaybi\/outbound-sync\?limit=20[\s\S]*12,27,42,57 \* \* \* \*/);
  assert.match(vercel, /\/api\/kolaybi\/purchase-invoices\/sync[\s\S]*17 \* \* \* \*/);
  assert.deepEqual(vercelConfig.regions, ["fra1"]);
  assert.match(service, /kolaybi_master_records/);
  assert.match(service, /synchronizeAssociate/);
  assert.match(service, /synchronizeOutbound/);
  assert.match(service, /kolaybi_sync_runs/);
  assert.match(service, /resolveMapping/);
  assert.match(service, /reviewImportedProduct/);
  assert.match(service, /synchronizeAssociateTransactions/);
  assert.match(service, /KOLAYBI_SYNC_RESOURCES/);
  assert.match(service, /synchronizeAllResources/);
  assert.match(api, /kolaybi-office:active:\$\{requested\}:\$\{hourKey\}/);
  assert.match(api, /Senkronizasyon sunucu süre sınırında tamamlanamadı/);
  assert.doesNotMatch(cariForm, /<Label>Contact ID<\/Label>/);
  assert.doesNotMatch(cariForm, /<Label>Address ID<\/Label>/);
  assert.doesNotMatch(cariForm, /KolayBi Otomatik Eşleştirme/);
  assert.match(cariForm, /synchronizeAssociate\(savedCustomer\.id\)/);
  assert.match(office, /VKN\/TCKN, cari kodu ve tekil e-posta eşleşmeleri otomatik yapılır/);
  assert.doesNotMatch(office, /KolayBi Entegre Ofis/);
  assert.doesNotMatch(office, /Otomatik senkronizasyon aktif/);
  assert.match(office, /Muhasebe Entegrasyonu/);
  assert.match(office, /Bağlantıyı Kontrol Et/);
  assert.match(office, /Acil Yenile/);
  assert.doesNotMatch(office, /Ortam:[\s\S]{0,160}Kontrol bekliyor/);
  assert.match(office, /KolayBi Eşleştirme Kontrolü/);
  assert.match(office, /TMS carisi seçin/);
  assert.match(office, /Yok say/);
  assert.match(office, /Cari Bakiye Mutabakatı/);
  assert.match(office, /data\.associateRecords\.map/);
  assert.match(office, /rexBalance - providerBalance/);
  assert.match(office, /Cari eşleşmesi yok/);
  assert.match(service, /optionalAllRows\("kolaybi_master_records", "id", \{ provider_environment: providerEnvironment, resource_type: "associate" \}\)/);
  assert.match(service, /optionalAllRows\("rex_customer_financial_directory", "customer_id"\)/);
  assert.match(service, /optionalProviderCount\(providerEnvironment/);
  assert.match(office, /currencyCode\(balance\?\.currency \|\| record\.currency\)/);
  assert.match(api, /currency: currency\(balance\?\.currency\)/);
  assert.match(api, /value\.iso_code/);
  assert.match(office, /Tahsil Edilecek/);
  assert.match(office, /Ödenecek/);
  assert.match(office, /rex-cari-borc-alacak-raporu/);
  assert.match(office, /synchronize\("associates"\)/);
  assert.match(office, /Satış Yönetimi/);
  assert.match(office, /Satın Alma Yönetimi/);
  assert.match(expenseWorkspace, /Genel Gider Yönetimi/);
  assert.match(office, /GeneralExpenseWorkspace/);
  assert.match(expenseWorkspace, /Gider Tiplerini Yenile/);
  assert.match(expenseWorkspace, /Giderleri Yenile/);
  assert.match(expenseWorkspace, /Açık Bakiye/);
  assert.match(expenseWorkspace, /Gider Tipleri ve Kategoriler/);
  assert.match(expenseWorkspace, /setExpenseCategoryActive/);
  assert.match(expenseWorkspace, /setExpenseTypeActive/);
  assert.match(office, /Ürünler ve Hizmetler/);
  assert.doesNotMatch(office, /KolayBi'den Yenile/);
  assert.match(office, /Onay bekliyor/);
  assert.match(office, /reviewImportedProduct/);
  assert.match(office, /Canlı/);
  assert.match(office, /Test/);
  assert.match(office, /Cari Hesaplar/);
  assert.match(office, /Finans/);
  assert.match(office, /FinanceWorkspace/);
  assert.match(financeWorkspace, /Hesapları Yenile/);
  assert.match(financeWorkspace, /Hareketleri Yenile/);
  assert.match(financeWorkspace, /Kümülatif Bakiye/);
  assert.doesNotMatch(office, /TabsTrigger value="projects"/);
  assert.match(office, /Raporlar ve Mutabakat/);
  assert.match(office, /Muhasebe Entegrasyonu/);
  assert.match(office, /XLSX İndir/);
  assert.match(office, /Satış – Operasyon – Muhasebe Akışı/);
  assert.match(accounting, /Muhasebe Merkezi/);
  assert.match(accounting, /KolayBiOfficeModule/);
});

test("KolayBi live associate sync imports open-balance customers and publishes provider balances", async () => {
  const [migration, api, service] = await Promise.all([
    read("supabase/migrations/20260909010000_kolaybi_customer_balance_sync.sql"),
    read("src/pages/api/kolaybi/office-sync.ts"),
    read("src/services/kolaybiOfficeService.ts"),
  ]);

  assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.kolaybi_customer_balance_snapshots/);
  assert.match(migration, /UNIQUE \(provider_environment, provider_associate_id, currency\)/);
  assert.match(migration, /sum\(company_amount\)::numeric\(18,2\) AS balance/);
  assert.match(migration, /WHERE provider_environment = 'live'/);
  assert.match(migration, /coalesce\(p\.balance, l\.balance, 0\)/);
  assert.match(api, /createAssociateCustomer/);
  assert.match(api, /replaceAssociateBalanceSnapshots/);
  assert.match(api, /Bakiyesi bulunan KolayBi carisi REX TYS'ye otomatik aktarıldı/);
  assert.match(api, /provider_environment,provider_associate_id,currency/);
  assert.match(api, /ambiguousMatch/);
  assert.match(service, /rex_customer_financial_directory/);
});

test("international express cargo supports QuickShipper AWB tracking and mandatory 311 exemption invoices", async () => {
  const [sql, form, tracking, publicService, api, logistics, invoice] = await Promise.all([
    read("supabase/migrations/20260830153000_international_express_shipments.sql"),
    read("src/components/ShipmentForm.tsx"),
    read("src/components/TrackingSection.tsx"),
    read("src/services/publicTrackingService.ts"),
    read("src/pages/api/tracking/express.ts"),
    read("src/components/modules/LogisticsModule.tsx"),
    read("src/components/InvoiceDialog.tsx"),
  ]);
  assert.match(sql, /ADD COLUMN IF NOT EXISTS service_mode/);
  assert.match(sql, /ADD COLUMN IF NOT EXISTS awb_number/);
  assert.match(sql, /shipments_express_awb_unique/);
  assert.match(sql, /international_express/);
  assert.match(sql, /EXPRESS_ISTISNA_311/);
  assert.match(sql, /KDV Kanununun 14\/1/);
  assert.match(sql, /GİB istisna kodu: 311/);
  assert.match(sql, /'exemptionCode','311'/);
  assert.match(sql, /s\.service_mode='road'/);
  assert.match(sql, /rex_express_tracking_url/);
  assert.match(form, /Uluslararası express kargo/);
  assert.match(form, /QuickShipper Gönderi No/);
  assert.match(form, /Entegratör AWB Numarası/);
  assert.match(form, /formData\.service_mode === "road"/);
  assert.match(tracking, /REX takip numarası veya FedEx, UPS, DHL ve Aramex AWB/);
  assert.match(tracking, /Taşıyıcıda Canlı Takip/);
  assert.doesNotMatch(tracking, /QuickShipper Gönderi No/);
  assert.match(publicService, /\^\[A-Z0-9-\]\{6,40\}\$/);
  assert.match(publicService, /\/api\/tracking\/express/);
  assert.match(api, /QUICKSHIPPER_TRACKING_API_URL/);
  assert.match(api, /QUICKSHIPPER_API_KEY/);
  assert.match(api, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(api, /carrier_status_changed/);
  assert.match(logistics, /ULUSLARARASI EXPRESS/);
  assert.match(logistics, /AWB bekliyor/);
  assert.match(invoice, /EXPRESS_ISTISNA_311/);
  assert.match(invoice, /exempt_transport/);
});

test("KolayBi official history determines each customer's e-invoice or e-archive profile", async () => {
  const [sql, syncApi, providerLib, invoiceDialog, office] = await Promise.all([
    read("supabase/migrations/20260904120000_kolaybi_customer_e_document_profiles.sql"),
    read("src/pages/api/kolaybi/office-sync.ts"),
    read("src/lib/kolaybi.ts"),
    read("src/components/InvoiceDialog.tsx"),
    read("src/components/modules/KolayBiOfficeModule.tsx"),
  ]);
  assert.match(sql, /kolaybi_e_document_type/);
  assert.match(sql, /rex_apply_customer_e_document_defaults/);
  assert.match(sql, /TEKNİK İSTİF/);
  assert.match(sql, /kolaybi_document_id IS NULL/);
  assert.match(syncApi, /KOLAYBI_COMPANY_ID/);
  assert.match(syncApi, /\/e_document\/invoices/);
  assert.match(syncApi, /header\?\.associate\?\.identity_no/);
  assert.match(syncApi, /kolaybi_official_invoice/);
  assert.match(syncApi, /current\?\.kolaybi_e_document_environment === "live" && providerEnvironment === "test"/);
  assert.match(providerLib, /alignInvoiceWithCustomerProfile/);
  assert.match(providerLib, /recordCustomerEDocumentProfile/);
  assert.match(invoiceDialog, /Sistem doğruladı/);
  assert.match(invoiceDialog, /KolayBi gönderimde otomatik belirleyecek/);
  assert.doesNotMatch(invoiceDialog, /manualEDocumentConfirmed/);
  assert.match(office, /E-Belge/);
  assert.doesNotMatch(office, /E-Belge Türlerini Karşılaştır/);
  assert.match(office, /row\.kolaybi_e_document_type === "e_invoice"/);
});

test("sales invoice e-document choice is automatic and TUSAN is confirmed as e-invoice", async () => {
  const [migration, invoiceDialog] = await Promise.all([
    read("supabase/migrations/20260905190000_automatic_customer_e_document_decision.sql"),
    read("src/components/InvoiceDialog.tsx"),
  ]);
  assert.match(migration, /TUSAN MOTOR/);
  assert.match(migration, /kolaybi_e_document_type = 'e_invoice'/);
  assert.match(migration, /BEFORE INSERT ON public\.sales_invoices/);
  assert.match(migration, /NEW\.document_type := v_type/);
  assert.match(migration, /Cari e-belge türü henüz otomatik doğrulanmadı/);
  assert.match(invoiceDialog, /E-Fatura\/E-Arşiv türü KolayBi mükellefiyet sorgusundan alınır/);
  assert.doesNotMatch(invoiceDialog, /E-belge türünü KolayBi cari\/fatura bilgileriyle kontrol ettim/);
});

test("KolayBi sandbox test identities receive deterministic e-document profiles", async () => {
  const syncApi = await read("src/pages/api/kolaybi/office-sync.ts");
  assert.match(syncApi, /identity === "1020304050" \|\| identity === "12345678901"/);
  assert.match(syncApi, /documentType: "e_invoice" as const, scenario: "TICARIFATURA" as const/);
  assert.match(syncApi, /identity === "11111111111"/);
  assert.match(syncApi, /documentType: "e_archive" as const, scenario: "EARSIVFATURA" as const/);
  assert.match(syncApi, /providerEnvironment === "test"/);
  assert.match(syncApi, /kolaybi_e_document_source: "kolaybi_sandbox_test_identity"/);
});

test("sales invoice e-document profile is resolved on demand and withholding stays purchase-only", async () => {
  const [resolver, endpoint, service, invoiceDialog, editDialog, provider, configuration, purchaseInbox, migration, nartliftProfile] = await Promise.all([
    read("src/lib/kolaybi-customer-e-document.ts"),
    read("src/pages/api/kolaybi/customers/[customerId]/e-document-profile.ts"),
    read("src/services/invoiceIntegrationService.ts"),
    read("src/components/InvoiceDialog.tsx"),
    read("src/components/EditInvoiceDialog.tsx"),
    read("src/lib/kolaybi.ts"),
    read("src/components/InvoiceConfigurationPanel.tsx"),
    read("src/components/PurchaseInvoiceInbox.tsx"),
    read("supabase/migrations/20260910193000_disable_sales_invoice_withholding.sql"),
    read("supabase/migrations/20260910223000_backfill_nartlift_e_document_profile.sql"),
  ]);

  assert.match(resolver, /associate_id: String\(contactId\)/);
  assert.match(resolver, /party_name: partyName/);
  assert.match(resolver, /returnedIdentity === customerIdentity/);
  assert.match(resolver, /commercialRows\.slice\(0, 20\)/);
  assert.doesNotMatch(resolver, /\.slice\(0, 12\)/);
  assert.match(resolver, /pagedProviderList/);
  assert.match(resolver, /per_page/);
  assert.match(resolver, /KOLAYBI_SALES_PROFILE_SYNC_DAYS/);
  assert.match(resolver, /\/e_document\/invoices\?/);
  assert.match(resolver, /document_id: String\(documentId\)/);
  assert.match(resolver, /kolaybi_official_invoice_on_demand/);
  assert.match(endpoint, /accounting\.sales/);
  assert.match(endpoint, /synchronizeKolayBiAssociate/);
  assert.match(service, /resolveCustomerEDocumentProfile\(input\.customerId\)/);
  assert.match(invoiceDialog, /KolayBi ile doğrulanıyor/);
  assert.doesNotMatch(invoiceDialog, /Tevkifat Kodu|Tevkifat Oranı/);
  assert.match(editDialog, /withholdingCode: null/);
  assert.doesNotMatch(provider, /items\[\$\{index\}\]\[withholding_code\]/);
  assert.doesNotMatch(configuration, /Tevkifatlı taşıma/);
  assert.match(purchaseInbox, /<Label>Tevkifat<\/Label>/);
  assert.match(migration, /rex_clear_sales_invoice_item_withholding/);
  assert.match(migration, /WHERE category = 'withholding_transport'/);
  assert.match(nartliftProfile, /6290569996/);
  assert.match(nartliftProfile, /kolaybi_contact_id = 6281105/);
  assert.match(nartliftProfile, /TICARIFATURA/);
  assert.match(nartliftProfile, /kolaybi_official_invoice_verified/);
});

test("KolayBi sales sync reconciles all customer e-document profiles from paged official history", async () => {
  const syncApi = await read("src/pages/api/kolaybi/office-sync.ts");
  const resolver = await read("src/lib/kolaybi-customer-e-document.ts");
  assert.match(syncApi, /reconcileCustomerEDocumentProfiles/);
  assert.match(syncApi, /pagedProviderList/);
  assert.match(syncApi, /PROFILE_MAX_PAGES = 40/);
  assert.match(syncApi, /KOLAYBI_SALES_PROFILE_SYNC_DAYS \|\| 1825/);
  assert.match(syncApi, /kolaybi_official_invoice_bulk/);
  assert.match(syncApi, /sales_profile_reconciliation/);
  assert.match(syncApi, /resource === "sales_invoices" && companyId/);
  assert.match(syncApi, /official\?\.document_scenario/);
  assert.match(syncApi, /official\?\.document_uuid/);
  assert.match(syncApi, /official\?\.document_no/);
  assert.match(resolver, /value\?\.document_scenario/);
  assert.match(resolver, /value\?\.document_uuid/);
  assert.match(resolver, /value\?\.document_no/);
});

test("new customers can create drafts while KolayBi resolves the official e-document scenario", async () => {
  const [endpoint, service, provider, invoiceDialog, migration] = await Promise.all([
    read("src/pages/api/kolaybi/customers/[customerId]/e-document-profile.ts"),
    read("src/services/invoiceIntegrationService.ts"),
    read("src/lib/kolaybi.ts"),
    read("src/components/InvoiceDialog.tsx"),
    read("supabase/migrations/20260910204500_allow_provider_resolved_sales_e_documents.sql"),
  ]);

  assert.match(endpoint, /providerResolutionPending: true/);
  assert.match(service, /if \(!result\.profile\) return null/);
  assert.match(service, /profile\?\.documentType \|\| input\.documentType/);
  assert.match(provider, /hasVerifiedCustomerEDocumentProfile/);
  assert.match(provider, /if \(hasVerifiedCustomerEDocumentProfile\(invoice, config\)\)/);
  assert.doesNotMatch(provider, /assertCustomerEDocumentEnvironment/);
  assert.match(invoiceDialog, /gerçek senaryoyu resmileştirme sırasında KolayBi belirler/);
  assert.match(migration, /v_environment = 'live'/);
  assert.match(migration, /NEW\.document_type := 'e_archive'/);
  assert.doesNotMatch(migration, /RAISE EXCEPTION 'Cari e-belge türü henüz otomatik doğrulanmadı/);
});

test("shipment save lets PostgreSQL calculate the generated cargo subtotal", async () => {
  const sql = await read("supabase/migrations/20260905103000_fix_shipment_generated_subtotal.sql");
  const cargoInsert = sql.match(/INSERT INTO public\.shipment_cargo_items\([\s\S]*?FROM jsonb_array_elements\(p_cargo_items\) item;/)?.[0] || "";

  assert.match(cargoInsert, /shipment_id,adet,cinsi,kg_ds,sira_no,birim_fiyat,alt_toplam_fiyat/);
  assert.doesNotMatch(cargoInsert, /alt_toplam\s*[,)\n]/);
  assert.doesNotMatch(cargoInsert, /adet'\)::numeric\*\(item->>'kg_ds/);
});

test("purchase invoices separate the operational carrier from the legal payable supplier", async () => {
  const [sql, service, inbox, shipmentForm] = await Promise.all([
    read("supabase/migrations/20260905130000_separate_operational_and_billing_suppliers.sql"),
    read("src/services/purchaseInvoiceService.ts"),
    read("src/components/PurchaseInvoiceInbox.tsx"),
    read("src/components/ShipmentForm.tsx"),
  ]);

  assert.match(sql, /ADD COLUMN IF NOT EXISTS billing_supplier_id/);
  assert.match(sql, /rex_purchase_invoice_billing_supplier_resolver/);
  assert.match(sql, /regexp_replace\(coalesce\(NEW\.issuer_tax_id/);
  assert.match(sql, /v_invoice\.invoice_no,v_invoice\.billing_supplier_id/);
  assert.doesNotMatch(sql, /VALUES\(v_invoice\.invoice_no,v_invoice\.operational_supplier_id/);
  assert.match(sql, /billing_supplier_linked/);
  assert.match(sql, /Fatura carisinin VKN\/TCKN bilgisi faturayla eşleşmiyor/);
  assert.match(service, /incoming_purchase_invoices_billing_supplier_id_fkey/);
  assert.match(service, /rex_set_purchase_invoice_billing_supplier/);
  assert.match(service, /\.is\("archived_at", null\)/);
  assert.match(inbox, /Fatura Carisi/);
  assert.match(inbox, /Operasyon Taşıyıcısı/);
  assert.match(inbox, /Cari kart açıldığında fatura otomatik bağlanır/);
  assert.match(inbox, /Tahmini maliyet/);
  assert.match(inbox, /Gerçekleşen maliyet/);
  assert.match(shipmentForm, /Operasyon Taşıyıcısı \(Opsiyonel\)/);
});

test("KolayBi purchase invoices create and link missing legal supplier cards without duplicates", async () => {
  const [sql, syncApi, cariForm, accounting, crm, shipmentForm, transactions] = await Promise.all([
    read("supabase/migrations/20260909170000_auto_create_kolaybi_purchase_suppliers.sql"),
    read("src/pages/api/kolaybi/purchase-invoices/sync.ts"),
    read("src/components/CariForm.tsx"),
    read("src/components/modules/AccountingModule.tsx"),
    read("src/components/modules/CRMModule.tsx"),
    read("src/components/ShipmentForm.tsx"),
    read("src/components/CustomerTransactionsDialog.tsx"),
  ]);

  assert.match(sql, /'her_ikisi'/);
  assert.match(sql, /rex_ensure_kolaybi_purchase_supplier/);
  assert.match(sql, /pg_advisory_xact_lock/);
  assert.match(sql, /v_candidate_count > 1/);
  assert.match(sql, /supplier_category=coalesce\(supplier_category,'diger'\)/);
  assert.match(sql, /SET billing_supplier_id=v_customer_id/);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.rex_ensure_kolaybi_purchase_supplier\(jsonb,jsonb,text\)\s+TO service_role/);
  assert.match(sql, /rex_create_customer_portal_invite/);
  assert.match(sql, /account_type, 'musteri'\) NOT IN \('musteri','her_ikisi'\)/);
  assert.match(sql, /rex_crm_quote_to_opportunity/);
  assert.match(sql, /rex_crm_duplicate_candidates/);
  assert.match(sql, /rex_crm_convert_to_customer/);
  assert.match(sql, /WITH \(security_invoker = true\)/);
  assert.match(syncApi, /rex_ensure_kolaybi_purchase_supplier/);
  assert.match(syncApi, /ensuredSupplierTaxes = new Set/);
  assert.match(syncApi, /suppliers_created/);
  assert.match(syncApi, /suppliers_promoted/);
  assert.match(cariForm, /Müşteri ve Tedarikçi/);
  assert.match(accounting, /accountType === "her_ikisi"/);
  assert.match(crm, /c\.account_type === "her_ikisi"/);
  assert.match(shipmentForm, /c\.account_type === "her_ikisi"/);
  assert.match(transactions, /accountType === "tedarikci" \|\| accountType === "her_ikisi"/);
});

test("invoice preview follows official e-invoice and e-archive presentation data", async () => {
  const [dialog, template] = await Promise.all([
    read("src/components/InvoicePreviewDialog.tsx"),
    read("src/components/InvoiceTemplate.tsx"),
  ]);

  assert.match(dialog, /customer:customers!sales_invoices_customer_id_fkey/);
  assert.match(dialog, /items:sales_invoice_items/);
  assert.match(dialog, /official_invoice_no/);
  assert.match(dialog, /official_uuid/);
  assert.match(dialog, /invoice\.total_tax/);
  assert.match(dialog, /rawItem\.tax_amount/);
  assert.match(dialog, /invoice\.document_type === "e_invoice"/);
  assert.match(dialog, /textValue\(invoice\.kolaybi_document_type\) \|\| "SATIS"/);
  assert.doesNotMatch(dialog, /"Bilinmeyen Cari"/);
  assert.doesNotMatch(dialog, /\? "SATIŞ" : "ALIŞ"/);

  assert.match(template, /"e-Arşiv Fatura" : "e-Fatura"/);
  assert.match(template, /GİB KAREKOD/);
  assert.match(template, /Resmîleştirme sonrasında e-belgede oluşur/);
  assert.match(template, /Resmî PDF’yi Aç/);
  assert.match(template, /Teslim şekli: Elektronik/);
  assert.match(template, /@page \{ size: A4; margin: 0; \}/);
  assert.match(template, /break-inside: avoid/);
});

test("sales invoice drafts stay editable until accounting approval", async () => {
  const [sql, dialog, editDialog, pending, office, logistics, preview, service, amountHelper] = await Promise.all([
    read("supabase/migrations/20260906093118_invoice_draft_accounting_approval.sql"),
    read("src/components/InvoiceDialog.tsx"),
    read("src/components/EditInvoiceDialog.tsx"),
    read("src/components/PendingInvoicesDialog.tsx"),
    read("src/components/modules/KolayBiOfficeModule.tsx"),
    read("src/components/modules/LogisticsModule.tsx"),
    read("src/components/InvoicePreviewDialog.tsx"),
    read("src/services/invoiceIntegrationService.ts"),
    read("src/lib/shipment-invoice-amount.ts"),
  ]);

  assert.match(sql, /accounting_review_status text NOT NULL DEFAULT 'pending'/);
  assert.match(sql, /'integration_status','draft'/);
  assert.match(sql, /invoice_status='fatura_taslagi'/);
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.rex_approve_sales_invoice_draft/);
  assert.match(sql, /Yalnızca muhasebe yetkilisi taslağı onaylayabilir/);
  assert.match(sql, /Sıfır tutarlı fatura taslağı onaylanamaz/);
  assert.match(sql, /Fatura önce muhasebe tarafından incelenip onaylanmalıdır/);
  assert.match(sql, /accounting_review_status='pending'/);
  assert.doesNotMatch(dialog, /invoiceIntegrationService\.send\(invoice\.id\)/);
  assert.match(editDialog, /\.from\("products_services"\)/);
  assert.match(editDialog, /\.eq\("invoice_enabled", true\)/);
  assert.match(editDialog, /En az bir geçerli ürün veya hizmet kalemi seçmelisiniz/);
  assert.match(editDialog, /shipmentAmount > 0/);
  assert.match(editDialog, /0 TL tutarlı veya miktarı sıfır olan bir fatura taslağı kaydedilemez/);
  assert.match(editDialog, /placeholder="İstisna kodu \(ör\. 311\)"/);
  assert.match(dialog, /catalogPrice > 0 \? catalogPrice : Number\(current\.unitPrice \|\| 0\)/);
  assert.match(dialog, /getShipmentInvoiceLines\(shipment\)/);
  assert.match(dialog, /0 TL tutarlı veya miktarı sıfır olan bir fatura taslağı oluşturulamaz/);
  assert.doesNotMatch(pending, /invoiceIntegrationService\.send\(invoiceData\.id\)/);
  assert.doesNotMatch(pending, /totalAmount \/ 1\.2/);
  assert.match(pending, /satis_tutar,/);
  assert.match(pending, /currency,/);
  assert.match(pending, /shipments\.flatMap\(\(shipment\) => getShipmentInvoiceLines\(shipment\)\)/);
  assert.match(pending, /Farklı para birimindeki sevkiyatlar aynı faturada birleştirilemez/);
  assert.match(amountHelper, /recordedSalesAmount > 0/);
  assert.match(amountHelper, /shipment_cargo_items/);
  assert.match(office, /Muhasebe Onayı Bekliyor/);
  assert.match(logistics, /Bağlı fatura taslağını veya resmî faturayı aç/);
  assert.match(logistics, /Fatura taslağını düzenle/);
  assert.match(logistics, /openShipmentInvoice\(shipment, "edit"\)/);
  assert.match(preview, /Taslağı Düzenle/);
  assert.match(preview, /Onayla ve E-Belgeye Gönder/);
  assert.match(service, /rex_approve_sales_invoice_draft/);
});

test("shipments support multiple pickup and delivery stops with separately priced invoice lines", async () => {
  const [sql, form, shipmentService, routeService, pending, invoiceDialog, invoiceLines, logistics] = await Promise.all([
    read("supabase/migrations/20260906153000_multi_stop_shipments.sql"),
    read("src/components/ShipmentForm.tsx"),
    read("src/services/shipmentService.ts"),
    read("src/services/shipmentRouteService.ts"),
    read("src/components/PendingInvoicesDialog.tsx"),
    read("src/components/InvoiceDialog.tsx"),
    read("src/lib/shipment-invoice-lines.ts"),
    read("src/components/modules/LogisticsModule.tsx"),
  ]);

  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.shipment_route_stops/);
  assert.match(sql, /stop_type IN \('pickup','delivery'\)/);
  assert.match(sql, /ADD COLUMN IF NOT EXISTS pickup_stop_id/);
  assert.match(sql, /ADD COLUMN IF NOT EXISTS delivery_stop_id/);
  assert.match(sql, /ADD COLUMN IF NOT EXISTS route_description/);
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.rex_save_shipment_multistop/);
  assert.match(sql, /Her yük kalemi geçerli bir alım ve teslim noktasına bağlanmalıdır/);
  assert.match(sql, /legacy-pickup-1/);
  assert.match(sql, /legacy-delivery-1/);
  assert.match(form, /Alım Noktaları/);
  assert.match(form, /Teslim Noktaları/);
  assert.match(form, /pickup_stop_key/);
  assert.match(form, /delivery_stop_key/);
  assert.match(form, /Yük \/ Hat Açıklaması/);
  assert.match(form, /Birim Fiyat/);
  assert.match(shipmentService, /rex_save_shipment_multistop/);
  assert.match(shipmentService, /p_route_stops: routeStops/);
  assert.match(shipmentService, /shipment_cargo_items_pickup_stop_id_fkey/);
  assert.match(shipmentService, /shipment_cargo_items_delivery_stop_id_fkey/);
  assert.match(shipmentService, /route_stops:shipment_route_stops/);
  assert.match(routeService, /shipment_route_stops/);
  assert.match(pending, /shipment_cargo_items_pickup_stop_id_fkey/);
  assert.match(pending, /shipment_cargo_items_delivery_stop_id_fkey/);
  assert.match(invoiceDialog, /getShipmentInvoiceLines/);
  assert.match(invoiceLines, /pricedItems\.map/);
  assert.match(invoiceLines, /item\.route_description/);
  assert.match(invoiceLines, /unitPrice/);
  assert.match(logistics, /alım noktası/);
  assert.match(logistics, /teslim noktası/);
});

test("shipment parties distinguish companies from people and learn reusable addresses", async () => {
  const [migration, form, stopCard, routeService, shipmentService] = await Promise.all([
    read("supabase/migrations/20260911120000_learn_shipment_parties.sql"),
    read("src/components/ShipmentForm.tsx"),
    read("src/components/ShipmentPartyStopCard.tsx"),
    read("src/services/shipmentRouteService.ts"),
    read("src/services/shipmentService.ts"),
  ]);

  assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.shipment_party_directory/);
  assert.match(migration, /party_type IN \('corporate','individual'\)/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS identity_no/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS source_customer_id/);
  assert.match(migration, /ON CONFLICT \(normalized_name,location_key\) DO UPDATE/);
  assert.match(migration, /use_count=shipment_party_directory\.use_count\+1/);
  assert.match(migration, /GRANT SELECT ON TABLE public\.shipment_party_directory TO authenticated/);
  assert.match(migration, /REVOKE ALL ON TABLE public\.shipment_party_directory FROM PUBLIC,anon,authenticated/);
  assert.match(form, /shipmentRouteService\.getPartyDirectory/);
  assert.match(form, /customerEntry\.address_line/);
  assert.match(form, /applyPartyDirectoryEntry/);
  assert.match(form, /Girilen kurumsal Vergi No 10, bireysel T\.C\. Kimlik No 11 haneli olmalıdır/);
  assert.match(form, /sender_tax_id: primaryPickup\.identity_no/);
  assert.match(form, /receiver_tax_id: primaryDelivery\.identity_no/);
  assert.match(stopCard, /Kurumsal/);
  assert.match(stopCard, /Bireysel/);
  assert.match(stopCard, /Vergi No \(VKN\)/);
  assert.match(stopCard, /T\.C\. Kimlik No/);
  assert.match(stopCard, /Kayıtlı Bilgiyi \/ Adresi Kullan/);
  assert.match(routeService, /shipment_party_directory/);
  assert.match(shipmentService, /party_type,identity_no,source_customer_id/);
});

test("required form fields are highlighted and the first invalid field is revealed", async () => {
  const [form, stopCard, input, select, textarea] = await Promise.all([
    read("src/components/ShipmentForm.tsx"),
    read("src/components/ShipmentPartyStopCard.tsx"),
    read("src/components/ui/input.tsx"),
    read("src/components/ui/select.tsx"),
    read("src/components/ui/textarea.tsx"),
  ]);

  assert.match(form, /validationAttempted/);
  assert.match(form, /formRef\.current\?\.querySelector<HTMLElement>\('\[aria-invalid="true"\]'\)/);
  assert.match(form, /scrollIntoView\(\{ behavior: "smooth", block: "center" \}\)/);
  assert.match(form, /Müşteri \(Ödeme Sorumlusu\) seçilmelidir/);
  assert.match(form, /Faturayı ödeyecek müşteri seçilmelidir/);
  assert.match(form, /aria-invalid=\{validationAttempted/);
  assert.match(stopCard, /missingCompanyName/);
  assert.match(stopCard, /İl bilgisi zorunludur/);
  assert.match(input, /aria-\[invalid=true\]:border-red-500/);
  assert.match(input, /user-invalid:border-red-500/);
  assert.match(select, /aria-\[invalid=true\]:border-red-500/);
  assert.match(textarea, /aria-\[invalid=true\]:border-red-500/);
});

test("shipment completion offers the approved driver details in WhatsApp and a branded waybill", async () => {
  const [notification, shipmentForm, waybill, customerWaybill] = await Promise.all([
    read("src/components/ShipmentNotificationDialog.tsx"),
    read("src/components/ShipmentForm.tsx"),
    read("src/components/WaybillGenerator.tsx"),
    read("src/lib/customer-waybill.ts"),
  ]);

  assert.match(notification, /REX LOJİSTİK - SEVKİYAT BİLGİSİ/);
  assert.match(notification, /WhatsApp mesajı önizlemesi/);
  assert.match(notification, /Waybill PDF/);
  assert.match(notification, /driver_tc/);
  assert.match(notification, /T\.C\. Kimlik No/);
  assert.match(notification, /isTir \? "Çekici" : "Plaka"/);
  assert.match(notification, /isTir && shipment\.trailer_plate/);
  assert.match(notification, /şemsiye sigortamız kapsamında sigortalı taşındığından/);
  assert.match(notification, /7342549288/);
  assert.match(shipmentForm, /driver_phone: selectedDriver\?\.phone_1/);
  assert.match(shipmentForm, /driver_tc: selectedDriver\?\.tc_no/);
  assert.match(shipmentForm, /route_stops: routeStops/);
  assert.match(shipmentForm, /cargo_items: cargoItems/);
  assert.match(waybill, /TASIMA BELGESI \/ WAYBILL/);
  assert.match(waybill, /BELGE BILGILERI \/ DOCUMENT DETAILS/);
  assert.match(waybill, /TASIYICI BILGILERI \/ CARRIER DETAILS/);
  assert.match(waybill, /rex_logo_gu_ncel\.png/);
  assert.match(waybill, /logo_data_url/);
  assert.match(waybill, /mali belge veya sevk irsaliyesi yerine gecmez/);
  assert.match(waybill, /This document is for operational information only/);
  assert.match(customerWaybill, /generateWaybill/);
});

test("legacy test sales invoices are archived without affecting operational totals", async () => {
  const [sql, accounting, customerTransactions, collections, reports, service, officeSync] = await Promise.all([
    read("supabase/migrations/20260908202159_archive_legacy_test_sales_invoices.sql"),
    read("src/components/modules/AccountingModule.tsx"),
    read("src/components/CustomerTransactionsDialog.tsx"),
    read("src/components/CollectionDialog.tsx"),
    read("src/components/modules/ReportsModule.tsx"),
    read("src/services/accountingService.ts"),
    read("src/pages/api/kolaybi/office-sync.ts"),
  ]);

  assert.match(sql, /ADD COLUMN IF NOT EXISTS archived_at timestamptz/);
  assert.match(sql, /archive_reason = 'Eski geliştirme\/test taslağı'/);
  assert.match(sql, /AND integration_status = 'draft'/);
  assert.match(sql, /AND kolaybi_document_id IS NULL/);
  assert.match(sql, /AND official_invoice_no IS NULL/);
  assert.match(sql, /AND official_uuid IS NULL/);
  assert.match(sql, /AND user_id IS NULL/);
  assert.match(accounting, /\.is\("archived_at", null\)/);
  assert.match(customerTransactions, /\.is\("archived_at", null\)/);
  assert.match(collections, /\.is\("archived_at", null\)/);
  assert.match(reports, /\.is\("archived_at", null\)/);
  assert.match(service, /\.is\("archived_at", null\)/);
  assert.match(officeSync, /\.is\("archived_at", null\)/);
});

test("integrated sales list hides non-operational records and opens shipment history", async () => {
  const [service, office] = await Promise.all([
    read("src/services/kolaybiOfficeService.ts"),
    read("src/components/modules/KolayBiOfficeModule.tsx"),
  ]);

  assert.match(service, /activeSalesInvoiceRows/);
  assert.match(service, /\.is\("archived_at", null\)/);
  assert.match(service, /\.not\("invoice_no", "like", "ALACAK-%"\)/);
  assert.match(service, /\.not\("invoice_no", "like", "BORC-%"\)/);
  assert.match(service, /salesInvoiceProviderRecords/);
  assert.match(service, /otherEnvironmentInvoiceIds/);
  assert.match(service, /currentEnvironmentInvoiceIds/);
  assert.match(office, /ShipmentHistoryDialog/);
  assert.match(office, />Sevkiyat</);
  assert.match(office, /shipmentByInvoiceId/);
  assert.match(office, /Sevkiyat geçmişini aç/);
  assert.match(office, /Bağımsız belge/);
});

test("paid KolayBi purchase history stays out of the review queue and the inbox is paginated", async () => {
  const [sql, service, inbox] = await Promise.all([
    read("supabase/migrations/20260909211500_reconcile_kolaybi_purchase_payment_status.sql"),
    read("src/services/purchaseInvoiceService.ts"),
    read("src/components/PurchaseInvoiceInbox.tsx"),
  ]);

  assert.match(sql, /v_payment_status IN \('paid'/);
  assert.match(sql, /THEN 'paid'/);
  assert.match(sql, /kolaybi_payment_reconciled/);
  assert.match(sql, /UPDATE public\.incoming_purchase_invoices/);
  assert.match(service, /\{ count: "exact" \}/);
  assert.match(service, /\.range\(from, from \+ pageSize - 1\)/);
  assert.match(service, /async stats\(\)/);
  assert.match(service, /paymentStatus/);
  assert.match(service, /\.eq\("payment_status", options\.paymentStatus\)/);
  assert.match(service, /query\.order\(sortBy/);
  assert.match(inbox, /useState\("review_required"\)/);
  assert.match(inbox, /Tüm Ödeme Durumları/);
  assert.match(inbox, /Ödenmemiş/);
  assert.match(inbox, /Kısmi Ödenmiş/);
  assert.match(inbox, /toggleSort\("grand_total"\)/);
  assert.match(inbox, /toggleSort\("payment_status"\)/);
  assert.match(inbox, /Ödenmiş \/ Geçmiş/);
  assert.match(inbox, />Ödeme\{sortIcon\("payment_status"\)\}<\/Button>/);
  assert.match(inbox, /Önceki/);
  assert.match(inbox, /Sonraki/);
});

test("security-definer RPCs use a reviewed access matrix and server-only KolayBi workers", async () => {
  const [sql, kolaybi, statusEndpoint] = await Promise.all([
    read("supabase/migrations/20260909201711_tighten_function_access_matrix.sql"),
    read("src/lib/kolaybi.ts"),
    read("src/pages/api/kolaybi/invoices/[invoiceId]/status.ts"),
  ]);

  assert.equal((sql.match(/\nALTER FUNCTION public\./g) || []).length >= 8, true);
  assert.match(sql, /SECURITY DEFINER[\s\S]*SET search_path = public, pg_temp/);
  assert.match(sql, /rex_purchase_invoice_candidates[\s\S]*rex_has_role\(ARRAY\['admin', 'accounting'\]\)/);
  assert.match(sql, /REVOKE EXECUTE ON FUNCTION public\.rex_generate_tracking_number\(\)[\s\S]*FROM authenticated/);
  assert.match(sql, /REVOKE EXECUTE ON FUNCTION public\.rex_validate_transport_assignment/);
  assert.match(sql, /REVOKE EXECUTE ON FUNCTION public\.rex_uetds_dashboard\(\)/);
  assert.match(sql, /REVOKE EXECUTE ON FUNCTION public\.rex_claim_invoice_sync_job/);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.rex_claim_invoice_sync_job[\s\S]*TO service_role/);
  assert.match(sql, /public shipment tracking is unavailable/);
  assert.match(kolaybi, /const workerDb = options\.admin \|\| db/);
  assert.match(kolaybi, /workerDb\.rpc\("rex_claim_invoice_sync_job"/);
  assert.match(kolaybi, /workerDb\.rpc\("rex_record_invoice_provider_document"/);
  assert.match(kolaybi, /recordResult\(workerDb/);
  assert.match(statusEndpoint, /SUPABASE_SECRET_KEY \|\| process\.env\.SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(statusEndpoint, /processKolayBiJob\(db, invoiceId, \{[\s\S]*admin/);
});

test("hot RLS paths and operational foreign keys are performance hardened", async () => {
  const sql = await read("supabase/migrations/20260910110000_optimize_hot_rls_and_indexes.sql");

  for (const table of [
    "transactions",
    "account_transactions",
    "incoming_purchase_invoices",
    "customers",
    "sales_invoices",
    "shipments",
  ]) {
    assert.match(sql, new RegExp(`DROP POLICY IF EXISTS rex_permission_write ON public\\.${table}`));
  }

  assert.match(sql, /user_id = \(SELECT auth\.uid\(\)\)/);
  assert.match(sql, /recipient_id = \(SELECT auth\.uid\(\)\)/);
  assert.match(sql, /\(SELECT auth\.jwt\(\)\) ->> 'email'/);
  assert.match(sql, /CREATE POLICY rex_customers_no_direct_delete[\s\S]*FOR DELETE TO authenticated[\s\S]*USING \(false\)/);
  assert.match(sql, /CREATE POLICY rex_permission_update ON public\.shipments[\s\S]*operations\.shipments[\s\S]*status <> ALL/);

  for (const index of [
    "customers_active_created_idx",
    "transactions_transaction_date_idx",
    "transactions_account_date_idx",
    "transactions_related_invoice_id_idx",
    "transactions_related_purchase_id_idx",
    "incoming_purchase_invoices_payment_date_idx",
    "incoming_purchase_invoices_operational_supplier_idx",
    "incoming_purchase_invoices_legacy_purchase_idx",
    "shipments_created_at_idx",
    "shipments_customer_created_idx",
    "shipments_supplier_pickup_idx",
    "shipments_driver_id_idx",
    "shipments_vehicle_id_idx",
  ]) {
    assert.match(sql, new RegExp(index));
  }

  assert.match(sql, /duplicate permissive hot-table paths remain/);
  assert.match(sql, /a protected business table permits direct DELETE/);
});
