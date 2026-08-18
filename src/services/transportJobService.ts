import { supabase } from "@/integrations/supabase/client";

export interface TransportJob {
  id: string;
  job_code: string;
  job_date: string;
  customer_id: string;
  supplier_id?: string | null;
  sender_name: string;
  receiver_name: string;
  sender_city?: string | null;
  receiver_city?: string | null;
  quantity: number;
  cargo_type: string;
  total_weight: number;
  sales_total: number;
  currency: string;
  status: "onay_bekliyor" | "onaylandi" | "reddedildi";
  shipment_id?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  customer?: { id: string; customer_code?: string | null; name: string } | null;
}

export const transportJobService = {
  async create(job: Record<string, unknown>) {
    const { data, error } = await supabase.rpc("rex_create_transport_job" as any, { p_job: job } as any);
    if (error) throw error;
    return data as unknown as string;
  },

  async list() {
    const { data, error } = await (supabase.from("transport_jobs" as any) as any)
      .select("*, customer:customers!transport_jobs_customer_id_fkey(id, customer_code, name)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []) as TransportJob[];
  },

  async review(id: string, decision: "onayla" | "reddet", reason?: string) {
    const { data, error } = await supabase.rpc("rex_review_transport_job" as any, {
      p_job_id: id,
      p_decision: decision,
      p_reason: reason || null,
    } as any);
    if (error) throw error;
    return data as unknown as string | null;
  },
};
