import { supabase } from "@/integrations/supabase/client";

export type InvoiceCategory =
  | "domestic_transport"
  | "international_transport"
  | "exempt_transport"
  | "withholding_transport"
  | "other";

export type InvoiceNoteTemplate = {
  id: string;
  code: string;
  name: string;
  category: InvoiceCategory;
  line_description_template: string;
  notes: string;
  kolaybi_document_type: string;
  default_vat_rate: number;
  default_exemption_code: string | null;
  is_default: boolean;
  is_active: boolean;
  display_order: number;
};

export type InvoiceBankAccount = {
  id: string;
  label: string;
  account_holder: string;
  bank_name: string;
  branch_name: string | null;
  account_no: string | null;
  iban: string;
  swift_code: string | null;
  currency: string;
  is_default: boolean;
  is_active: boolean;
  display_order: number;
  notes: string | null;
};

const db = supabase as any;

export const invoicePresentationService = {
  async getTemplates(includeInactive = false): Promise<InvoiceNoteTemplate[]> {
    let query = db.from("invoice_note_templates").select("*").order("display_order").order("name");
    if (!includeInactive) query = query.eq("is_active", true);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getBankAccounts(includeInactive = false): Promise<InvoiceBankAccount[]> {
    let query = db.from("invoice_bank_accounts").select("*").order("display_order").order("label");
    if (!includeInactive) query = query.eq("is_active", true);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async saveTemplate(input: Partial<InvoiceNoteTemplate> & Pick<InvoiceNoteTemplate, "name" | "category" | "line_description_template" | "notes">) {
    const payload = {
      ...input,
      code: input.code || `${input.category}_${crypto.randomUUID().slice(0, 8)}`.toUpperCase(),
      updated_at: new Date().toISOString(),
    };
    const { data, error } = input.id
      ? await db.from("invoice_note_templates").update(payload).eq("id", input.id).select().single()
      : await db.from("invoice_note_templates").insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async saveBankAccount(input: Partial<InvoiceBankAccount> & Pick<InvoiceBankAccount, "label" | "account_holder" | "bank_name" | "iban" | "currency">) {
    const payload = { ...input, iban: input.iban.replace(/\s+/g, " ").trim().toUpperCase(), updated_at: new Date().toISOString() };
    const { data, error } = input.id
      ? await db.from("invoice_bank_accounts").update(payload).eq("id", input.id).select().single()
      : await db.from("invoice_bank_accounts").insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async setTemplateActive(id: string, active: boolean) {
    const { error } = await db.from("invoice_note_templates").update({ is_active: active, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) throw error;
  },

  async setBankAccountActive(id: string, active: boolean) {
    const { error } = await db.from("invoice_bank_accounts").update({ is_active: active, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) throw error;
  },
};
