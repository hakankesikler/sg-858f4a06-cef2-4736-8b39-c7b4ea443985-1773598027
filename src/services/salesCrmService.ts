import { supabase } from "@/integrations/supabase/client";

export type CrmStage = "introduction" | "quote_required" | "follow_up" | "won" | "lost";
export type ActivityType = "call" | "visit" | "email" | "meeting" | "note";
export type ActivityOutcome = "reached" | "not_reached" | "introduction_completed" | "positive" | "negative" | "follow_up" | "quote_requested" | "quote_sent" | "no_interest" | "other";

export type CrmOpportunity = {
  id: string;
  customer_id: string | null;
  quote_request_id: string | null;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  source: string;
  stage: CrmStage;
  assigned_to: string | null;
  next_action_at: string | null;
  estimated_value: number | null;
  currency: string;
  notes: string | null;
  first_job_id: string | null;
  first_invoice_id: string | null;
  won_at: string | null;
  lost_at: string | null;
  lost_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type CrmActivity = {
  id: string;
  opportunity_id: string;
  customer_id: string | null;
  activity_type: ActivityType;
  outcome: ActivityOutcome;
  summary: string;
  activity_at: string;
  next_action_at: string | null;
  created_by: string;
  created_at: string;
};

export type CrmOffer = {
  id: string;
  offer_no: string;
  opportunity_id: string;
  quote_request_id: string | null;
  customer_id: string | null;
  subject: string;
  amount: number;
  currency: string;
  status: "draft" | "sent" | "accepted" | "rejected" | "expired" | "cancelled";
  valid_until: string | null;
  sent_at: string | null;
  notes: string | null;
  version_no: number;
  recipient_email: string | null;
  approval_status: "not_required" | "pending" | "approved" | "rejected";
  approval_note: string | null;
  approved_by: string | null;
  approved_at: string | null;
  email_status: "not_sent" | "sending" | "sent" | "failed";
  email_provider_id: string | null;
  email_sent_at: string | null;
  email_error: string | null;
  created_at: string;
};

export type CrmTask = {
  id: string;
  opportunity_id: string;
  customer_id: string | null;
  assigned_to: string | null;
  task_type: "call" | "visit" | "email" | "quote" | "follow_up" | "review";
  title: string;
  due_at: string;
  priority: "low" | "normal" | "high" | "urgent";
  status: "pending" | "completed" | "cancelled";
  source: string;
  created_at: string;
};

export type DuplicateCandidate = {
  record_type: "customer" | "opportunity";
  id: string;
  company_name: string;
  email: string | null;
  phone: string | null;
  status: string;
};

export type Customer360 = {
  customer?: Record<string, unknown>;
  opportunity_count?: number;
  activity_count?: number;
  offer_count?: number;
  offer_total?: number;
  job_count?: number;
  shipment_count?: number;
  delivered_count?: number;
  invoice_count?: number;
  invoiced_total?: number;
  outstanding_total?: number;
  exception_count?: number;
  last_activity?: string | null;
  last_shipment?: string | null;
  recent_jobs?: Array<Record<string, unknown>>;
  recent_invoices?: Array<Record<string, unknown>>;
};

export type SalesRepresentative = { user_id: string; email: string; full_name: string; role: string };
export type SalesPerformance = SalesRepresentative & {
  calls: number;
  visits: number;
  emails: number;
  customer_meetings: number;
  introductions: number;
  quotes_sent: number;
  won: number;
};

export type QuoteDetail = {
  id: string;
  full_name: string;
  company_name: string;
  email: string | null;
  phone: string | null;
  service_type: string;
  transport_mode: string;
  transport_detail: string | null;
  loading_point: string;
  delivery_point: string;
  cargos: Array<Record<string, string | number>>;
  special_requirements: string | null;
  commercial_consent: boolean;
  created_at: string;
};

const table = (name: string) => supabase.from(name as never) as any;

export const salesCrmService = {
  async listOpportunities(): Promise<CrmOpportunity[]> {
    const { data, error } = await table("crm_opportunities").select("*").order("updated_at", { ascending: false });
    if (error) throw error;
    return (data || []) as CrmOpportunity[];
  },

  async listActivities(opportunityId?: string): Promise<CrmActivity[]> {
    let query = table("crm_activities").select("*").order("activity_at", { ascending: false });
    if (opportunityId) query = query.eq("opportunity_id", opportunityId);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as CrmActivity[];
  },

  async listOffers(opportunityId?: string): Promise<CrmOffer[]> {
    let query = table("crm_offers").select("*").order("created_at", { ascending: false });
    if (opportunityId) query = query.eq("opportunity_id", opportunityId);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as CrmOffer[];
  },

  async listTasks(): Promise<CrmTask[]> {
    const { data, error } = await table("crm_tasks").select("*").eq("status", "pending").order("due_at", { ascending: true }).limit(250);
    if (error) throw error;
    return (data || []) as CrmTask[];
  },

  async listRepresentatives(): Promise<SalesRepresentative[]> {
    const { data, error } = await supabase.rpc("rex_crm_sales_representatives" as never);
    if (error) throw error;
    return (data || []) as unknown as SalesRepresentative[];
  },

  async performance(from: string, to: string): Promise<SalesPerformance[]> {
    const { data, error } = await supabase.rpc("rex_crm_performance" as never, { p_from: from, p_to: to } as never);
    if (error) throw error;
    return (data || []) as unknown as SalesPerformance[];
  },

  async getQuoteDetail(id: string): Promise<QuoteDetail | null> {
    const { data, error } = await supabase.rpc("rex_crm_quote_detail" as never, { p_quote_request_id: id } as never);
    if (error) throw error;
    return ((data || [])[0] || null) as unknown as QuoteDetail | null;
  },

  async createOpportunity(input: Partial<CrmOpportunity> & { company_name: string }) {
    const payload = {
      company_name: input.company_name,
      contact_name: input.contact_name || null,
      email: input.email || null,
      phone: input.phone || null,
      source: input.source || "manual",
      stage: input.stage || "introduction",
      assigned_to: input.assigned_to || null,
      next_action_at: input.next_action_at || null,
      notes: input.notes || null,
    };
    const { data, error } = await table("crm_opportunities").insert(payload).select("*").single();
    if (error) throw error;
    return data as CrmOpportunity;
  },

  async updateOpportunity(id: string, input: Partial<CrmOpportunity>) {
    const { data, error } = await table("crm_opportunities").update({ ...input, updated_at: new Date().toISOString() }).eq("id", id).select("*").single();
    if (error) throw error;
    return data as CrmOpportunity;
  },

  async addActivity(input: {
    opportunity_id: string;
    customer_id?: string | null;
    activity_type: ActivityType;
    outcome: ActivityOutcome;
    summary: string;
    activity_at: string;
    next_action_at?: string | null;
  }) {
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await table("crm_activities").insert({ ...input, created_by: userData.user?.id }).select("*").single();
    if (error) throw error;
    return data as CrmActivity;
  },

  async createOffer(input: {
    opportunity_id: string;
    quote_request_id?: string | null;
    customer_id?: string | null;
    subject: string;
    amount: number;
    currency: string;
    status?: CrmOffer["status"];
    valid_until?: string | null;
    notes?: string | null;
  }) {
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await table("crm_offers").insert({ ...input, status: "draft", offer_no: "", created_by: userData.user?.id }).select("*").single();
    if (error) throw error;
    return data as CrmOffer;
  },

  async completeTask(taskId: string) {
    const { error } = await supabase.rpc("rex_crm_complete_task" as never, { p_task_id: taskId } as never);
    if (error) throw error;
  },

  async reviewOffer(offerId: string, decision: "approve" | "reject", note?: string) {
    const { error } = await supabase.rpc("rex_crm_review_offer" as never, { p_offer_id: offerId, p_decision: decision, p_note: note || null } as never);
    if (error) throw error;
  },

  async sendOffer(offerId: string, recipientEmail?: string) {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) throw new Error("Oturum süresi dolmuş. Lütfen tekrar giriş yapın.");
    const response = await fetch(`/api/crm/offers/${offerId}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ recipientEmail: recipientEmail || null }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Teklif e-postası gönderilemedi.");
    return result as { success: true; alreadySent?: boolean; providerId?: string };
  },

  async findDuplicates(companyName: string, email?: string, phone?: string): Promise<DuplicateCandidate[]> {
    const { data, error } = await supabase.rpc("rex_crm_duplicate_candidates" as never, {
      p_company_name: companyName, p_email: email || null, p_phone: phone || null,
    } as never);
    if (error) throw error;
    return (data || []) as unknown as DuplicateCandidate[];
  },

  async customer360(customerId: string): Promise<Customer360> {
    const { data, error } = await supabase.rpc("rex_crm_customer_360" as never, { p_customer_id: customerId } as never);
    if (error) throw error;
    return (data || {}) as unknown as Customer360;
  },

  async convertToCustomer(opportunityId: string): Promise<string> {
    const { data, error } = await supabase.rpc("rex_crm_convert_to_customer" as never, { p_opportunity_id: opportunityId } as never);
    if (error) throw error;
    return data as unknown as string;
  },

  async createJobFromQuote(opportunityId: string): Promise<string> {
    const { data, error } = await supabase.rpc("rex_crm_create_job_from_quote" as never, { p_opportunity_id: opportunityId } as never);
    if (error) throw error;
    return data as unknown as string;
  },
};
