import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFile(resolve(root, path), "utf8");

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
  assert.match(staffLogin, /REX Operasyon Portalı/);
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
