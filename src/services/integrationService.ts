import { supabase } from "@/integrations/supabase/client";
import type { ShipmentImportPayload } from "@/lib/shipment-import";

export type IntegrationPartner = {
  id: string;
  code: string;
  name: string;
  partner_type: "customer" | "carrier" | "accounting" | "integrator" | "government";
  channel: "api" | "webhook" | "csv" | "excel" | "sftp" | "edi";
  environment: "test" | "live";
  status: "draft" | "testing" | "active" | "paused" | "error";
  last_sync_at?: string | null;
  last_success_at?: string | null;
  last_error?: string | null;
  customer?: { id: string; name: string; customer_code?: string | null } | null;
};

export type IntegrationImportBatch = {
  id: string;
  file_name: string;
  status: "processing" | "completed" | "partial" | "failed";
  total_rows: number;
  imported_rows: number;
  invalid_rows: number;
  duplicate_rows: number;
  failed_rows: number;
  created_at: string;
  completed_at?: string | null;
  customer?: { id: string; name: string; customer_code?: string | null } | null;
  partner?: { id: string; name: string; code: string } | null;
};

export type ImportResult = {
  batch_id: string;
  already_processed: boolean;
  status: string;
  total: number;
  imported: number;
  invalid: number;
  duplicate: number;
  failed: number;
};

export const integrationService = {
  async getPartners(): Promise<IntegrationPartner[]> {
    const { data, error } = await (supabase.from("integration_partners" as any) as any)
      .select("*, customer:customers(id,name,customer_code)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []) as IntegrationPartner[];
  },

  async getImportBatches(): Promise<IntegrationImportBatch[]> {
    const { data, error } = await (supabase.from("integration_import_batches" as any) as any)
      .select("*, customer:customers(id,name,customer_code), partner:integration_partners(id,name,code)")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data || []) as IntegrationImportBatch[];
  },

  async importCustomerShipments(input: {
    customerId: string;
    fileName: string;
    idempotencyKey: string;
    rows: ShipmentImportPayload[];
  }): Promise<ImportResult> {
    const { data, error } = await supabase.rpc("rex_import_customer_shipments" as any, {
      p_customer_id: input.customerId,
      p_file_name: input.fileName,
      p_idempotency_key: input.idempotencyKey,
      p_rows: input.rows,
    } as any);
    if (error) throw error;
    return data as unknown as ImportResult;
  },
};
