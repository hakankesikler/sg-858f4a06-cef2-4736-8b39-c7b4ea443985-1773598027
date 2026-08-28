import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFile(resolve(root, path), "utf8");

test("CRM customer records are archived and audited instead of hard-deleted", async () => {
  const [sql, service, screen] = await Promise.all([
    read("supabase/migrations/20260827160000_crm_customer_security.sql"),
    read("src/services/crmService.ts"),
    read("src/components/modules/CRMModule.tsx"),
  ]);
  assert.match(sql, /ALTER TABLE public\.customers ENABLE ROW LEVEL SECURITY/);
  assert.match(sql, /REVOKE DELETE ON public\.customers FROM authenticated/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.customer_audit_events/);
  assert.match(sql, /rex_customer_audit_append_only/);
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.rex_archive_customer/);
  assert.match(service, /archiveCustomer/);
  assert.doesNotMatch(service, /from\("customers"\)[\s\S]{0,120}\.delete\(\)/);
  assert.match(screen, /Mükerrer Cariyle Birleştir/);
});

test("CRM tasks cannot be completed without a structured activity result", async () => {
  const [sql, service, screen] = await Promise.all([
    read("supabase/migrations/20260827161000_crm_task_outcomes.sql"),
    read("src/services/salesCrmService.ts"),
    read("src/components/modules/SalesCRMModule.tsx"),
  ]);
  assert.match(sql, /rex_crm_complete_task_with_activity/);
  assert.match(sql, /Görüşme özeti zorunludur/);
  assert.match(sql, /sonraki işlem tarihi zorunludur/);
  assert.match(sql, /assigned_to<>auth\.uid\(\)/);
  assert.match(service, /p_outcome: activity\.outcome/);
  assert.match(screen, /Görev ancak sonuç ve görüşme özetiyle tamamlanacaktır/);
});

test("offers have items, revisions, approval limits and a terminal decision trail", async () => {
  const [sql, delivery, screen] = await Promise.all([
    read("supabase/migrations/20260827162000_crm_offer_lifecycle.sql"),
    read("src/lib/crm-offer-delivery.ts"),
    read("src/components/modules/SalesCRMModule.tsx"),
  ]);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.crm_offer_items/);
  assert.match(sql, /approval_threshold_usd/);
  assert.match(sql, /minimum_margin_percent/);
  assert.match(sql, /rex_crm_create_offer_revision/);
  assert.match(sql, /rex_crm_decide_offer/);
  assert.match(sql, /FOR UPDATE/);
  assert.match(sql, /CREATE CONSTRAINT TRIGGER rex_crm_offer_version_event/);
  assert.match(sql, /DEFERRABLE INITIALLY DEFERRED/);
  assert.match(sql, /jsonb_build_object\('items',v_items\)/);
  assert.match(delivery, /crm_offer_items/);
  assert.match(screen, /Fiyat kalemleri/);
  assert.match(screen, /Kararı veren müşteri yetkilisinin adı/);
});

test("CRM records and their child rows remain self-or-team scoped", async () => {
  const [scopeSql, reportSql, permissions] = await Promise.all([
    read("supabase/migrations/20260827163000_crm_scope_and_settings.sql"),
    read("supabase/migrations/20260827165000_crm_reporting_and_scope.sql"),
    read("src/lib/staff-permissions.ts"),
  ]);
  assert.match(scopeSql, /manager_id uuid/);
  assert.match(scopeSql, /rex_crm_can_access_opportunity/);
  assert.match(scopeSql, /member\.manager_id=auth\.uid\(\)/);
  assert.match(reportSql, /rex_crm_offer_items_select/);
  assert.match(reportSql, /rex_crm_offer_versions_select/);
  assert.match(reportSql, /rex_crm_stage_events_select/);
  assert.match(reportSql, /crm\.offer_approval','manage'/);
  for (const key of ["crm.team_pipeline", "crm.offer_approval", "crm.exports", "crm.settings"]) assert.match(permissions, new RegExp(key.replace(".", "\\.")));
});

test("CRM operations include contacts, notifications, provider events, atomic import and merge", async () => {
  const [sql, webhook, cron, service, screen] = await Promise.all([
    read("supabase/migrations/20260827164000_crm_operations_layer.sql"),
    read("src/pages/api/resend-webhook.ts"),
    read("src/pages/api/crm/process-reminders.ts"),
    read("src/services/crmService.ts"),
    read("src/components/modules/SalesCRMModule.tsx"),
  ]);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.crm_contacts/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.crm_notifications/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.crm_email_events/);
  assert.match(sql, /rex_crm_import_customers/);
  assert.match(sql, /rex_crm_merge_customers/);
  assert.match(sql, /idempotency_key text NOT NULL UNIQUE/);
  assert.match(webhook, /resend\.webhooks\.verify/);
  assert.match(webhook, /RESEND_WEBHOOK_SECRET/);
  assert.match(cron, /req\.method !== "GET" && req\.method !== "POST"/);
  assert.match(cron, /res\.setHeader\("Allow", "GET, POST"\)/);
  assert.match(cron, /rex_crm_generate_notifications/);
  assert.match(service, /bulkImportCustomers/);
  assert.match(service, /mergeCustomers/);
  assert.match(screen, /CRM Uyarıları/);
  assert.match(screen, /Müşteri Yetkilileri/);
});

test("CRM reporting covers forecast, overdue work, margin and sales cycle", async () => {
  const [sql, service, screen] = await Promise.all([
    read("supabase/migrations/20260827165000_crm_reporting_and_scope.sql"),
    read("src/services/salesCrmService.ts"),
    read("src/components/modules/SalesCRMModule.tsx"),
  ]);
  assert.match(sql, /weighted_forecast numeric/);
  assert.match(sql, /tasks_overdue bigint/);
  assert.match(sql, /avg_sales_cycle_days numeric/);
  assert.match(sql, /avg_margin_percent numeric/);
  assert.match(sql, /r\.manager_id=auth\.uid\(\)/);
  assert.match(service, /weighted_forecast: number/);
  assert.match(screen, /Ağırlıklı tahmin/);
  assert.match(screen, /Satış döngüsü/);
  assert.match(screen, /Ort\. marj/);
});
