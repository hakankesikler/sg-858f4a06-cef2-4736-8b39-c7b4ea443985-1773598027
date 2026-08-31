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
  assert.match(shipmentService, /rex_can_assign_transport_carrier/);
  assert.match(crmService, /supplierCategory === "tasiyici"[\s\S]*prefix = "TSY"/);
});

test("shipment assignment still requires driver licence and vehicle registration", async () => {
  const sql = await read("supabase/migrations/20260818143000_transport_workflow_and_kolaybi.sql");
  assert.match(sql, /ehliyet_dosyasi_url/);
  assert.match(sql, /Sürücü ehliyet belgesi yüklenmeden atama yapılamaz/);
  assert.match(sql, /ruhsat_dosyasi_url/);
  assert.match(sql, /Araç ruhsatı yüklenmeden atama yapılamaz/);
  assert.match(sql, /PERFORM public\.rex_validate_assignment\(v_driver,v_vehicle\)/);
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
  assert.match(api, /status: "official"/);
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
  const [sql, service, accounting, accountingService] = await Promise.all([
    read("supabase/migrations/20260818234500_shipment_cancellation_and_revision_workflow.sql"),
    read("src/services/workflowService.ts"),
    read("src/components/modules/AccountingModule.tsx"),
    read("src/services/accountingService.ts"),
  ]);
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.rex_cancel_sales_invoice/);
  assert.match(sql, /KolayBi\/e-Fatura iptal veya iade işlemi tamamlanıp dış sistem referansı girilmelidir/);
  assert.match(sql, /SET payment_status='İptal'/);
  assert.match(sql, /Faturalar silinemez; iptal\/iade süreci kullanılmalıdır/);
  assert.match(sql, /rex_sales_invoices_no_direct_delete/);
  assert.match(service, /rex_cancel_sales_invoice/);
  assert.match(accounting, /Fatura İptal \/ İade Süreci/);
  assert.doesNotMatch(accountingService, /from\("sales_invoices"\)[\s\S]{0,100}\.delete\(\)/);
});

test("KolayBi invoices use a retryable idempotent state machine and only official documents invoice shipments", async () => {
  const [sql, integration, invoiceDialog, accounting, queueApi, statusApi, pdfApi] = await Promise.all([
    read("supabase/migrations/20260819003000_secure_kolaybi_invoice_pipeline.sql"),
    read("src/lib/kolaybi.ts"),
    read("src/components/InvoiceDialog.tsx"),
    read("src/components/modules/AccountingModule.tsx"),
    read("src/pages/api/kolaybi/process-queue.ts"),
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
  assert.match(integration, /kolaybi_product_id \|\| config\.defaultProductId/);
  assert.match(invoiceDialog, /rex_create_sales_invoice_secure|invoiceIntegrationService\.createDraft/);
  assert.match(accounting, /KolayBi Gönderimi Bekliyor/);
  assert.match(accounting, /handleRefreshInvoiceStatus/);
  assert.match(accounting, /handleOpenInvoicePdf/);
  assert.match(queueApi, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(queueApi, /CRON_SECRET/);
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
  assert.match(inbox, /KolayBi’den Kontrol Et/);
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

test("U-ETDS readiness keeps legacy shipments working until enforcement is explicitly enabled", async () => {
  const [sql, form, service, panel] = await Promise.all([
    read("supabase/migrations/20260819033000_uetds_readiness.sql"),
    read("src/components/ShipmentForm.tsx"),
    read("src/services/uetdsService.ts"),
    read("src/components/UetdsPanel.tsx"),
  ]);
  assert.match(sql, /environment text NOT NULL DEFAULT 'disabled'/);
  assert.match(sql, /enforcement_enabled boolean NOT NULL DEFAULT false/);
  assert.match(sql, /IF coalesce\(v_enforce,false\) THEN/);
  assert.match(sql, /'accepted','carrier_reported'/);
  assert.match(form, /U-ETDS Bildirim Bilgileri/);
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

test("staff security requires MFA for privileged roles and records immutable security events", async () => {
  const [sql, login, mfa, settings, session, api, config] = await Promise.all([
    read("supabase/migrations/20260825090000_staff_security_controls.sql"),
    read("src/pages/login.tsx"),
    read("src/pages/personel/mfa.tsx"),
    read("src/components/settings/SecuritySettings.tsx"),
    read("src/hooks/use-staff-session-security.ts"),
    read("src/pages/api/admin/staff-users.ts"),
    read("next.config.mjs"),
  ]);
  assert.match(sql, /p_role IN \('admin', 'accounting'\)/);
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
  assert.match(session, /STAFF_IDLE_TIMEOUT_MS/);
  assert.match(session, /STAFF_MAX_SESSION_MS/);
  assert.match(api, /tokenAssuranceLevel\(token\) !== "aal2"/);
  assert.match(config, /Content-Security-Policy/);
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
  const [content, pageTemplate, seo, header, footer, services, sitemap, robots] = await Promise.all([
    read("src/content/marketing-pages.ts"),
    read("src/components/MarketingPage.tsx"),
    read("src/components/SEO.tsx"),
    read("src/components/Header.tsx"),
    read("src/components/Footer.tsx"),
    read("src/components/Services.tsx"),
    read("public/sitemap.xml"),
    read("public/robots.txt"),
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
  assert.match(pageTemplate, /"@type": "Service"/);
  assert.match(pageTemplate, /"@type": "BreadcrumbList"/);
  assert.match(pageTemplate, /<h1/);
  assert.match(pageTemplate, /<details/);
  assert.match(seo, /application\/ld\+json/);
  assert.match(seo, /rel="canonical"/);
  assert.match(footer, /href="\/login"[\s\S]*REX TYS/);
  assert.doesNotMatch(footer, /Personel Girişi/);
  assert.doesNotMatch(footer, /href="\/musteri-giris"[\s\S]*Müşteri Portalı/);
  assert.match(robots, /Disallow: \/personel\//);
  assert.doesNotMatch(sitemap, /\/login<\/loc>/);
});

test("public SEO copy does not market customs-clearance services", async () => {
  const [content, privacy, kvkk, terms, sitemap] = await Promise.all([
    read("src/content/marketing-pages.ts"),
    read("src/pages/gizlilik-politikasi.tsx"),
    read("src/pages/kvkk-aydinlatma-metni.tsx"),
    read("src/pages/kullanim-kosullari.tsx"),
    read("public/sitemap.xml"),
  ]);
  assert.doesNotMatch(content, /gümrük/i);
  for (const legalPage of [privacy, kvkk, terms]) assert.match(legalPage, /noIndex/);
  assert.doesNotMatch(sitemap, /gizlilik-politikasi|kullanim-kosullari|kvkk-aydinlatma-metni/);
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
  assert.match(security, /MIN_PASSWORD_LENGTH = 6/);
});

test("KolayBi office connects sales, operations and accounting with durable sync records", async () => {
  const [sql, api, service, office, accounting] = await Promise.all([
    read("supabase/migrations/20260828150000_kolaybi_office_workspace.sql"),
    read("src/pages/api/kolaybi/office-sync.ts"),
    read("src/services/kolaybiOfficeService.ts"),
    read("src/components/modules/KolayBiOfficeModule.tsx"),
    read("src/components/modules/AccountingModule.tsx"),
  ]);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.kolaybi_master_records/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.kolaybi_sync_runs/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.kolaybi_sync_events/);
  assert.match(sql, /rex_kolaybi_events_append_only/);
  assert.match(sql, /REVOKE INSERT,UPDATE,DELETE ON public\.kolaybi_sync_events FROM authenticated/);
  assert.match(api, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(api, /rex_has_permission/);
  assert.match(api, /integrations\.connections/);
  assert.match(api, /idempotency_key/);
  assert.match(api, /\/associates/);
  assert.match(api, /\/products/);
  assert.match(api, /type=sale_invoice/);
  assert.match(api, /type=purchase_invoice/);
  assert.match(api, /review_required/);
  assert.match(service, /kolaybi_master_records/);
  assert.match(service, /kolaybi_sync_runs/);
  assert.match(office, /KolayBi Entegre Ofis/);
  assert.match(office, /Cari Borç \/ Alacak Raporu/);
  assert.match(office, /Math\.abs\(row\.balance\) >= 0\.01/);
  assert.match(office, /Tahsil Edilecek/);
  assert.match(office, /Ödenecek/);
  assert.match(office, /rex-cari-borc-alacak-raporu/);
  assert.match(office, /synchronize\("associates"\)/);
  assert.match(office, /Satış Yönetimi/);
  assert.match(office, /Satın Alma Yönetimi/);
  assert.match(office, /Genel Gider Yönetimi/);
  assert.match(office, /Ürünler ve Hizmetler/);
  assert.match(office, /Cari Hesaplar/);
  assert.match(office, /Finans/);
  assert.match(office, /Projeler/);
  assert.match(office, /Raporlar/);
  assert.match(office, /XLSX İndir/);
  assert.match(office, /Satış – Operasyon – Muhasebe Akışı/);
  assert.match(accounting, /Entegre Ofis/);
  assert.match(accounting, /KolayBiOfficeModule/);
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
  assert.match(tracking, /QuickShipper Gönderi No/);
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
