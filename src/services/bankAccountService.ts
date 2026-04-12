import { supabase } from "@/integrations/supabase/client";

export interface BankAccount {
  id?: string;
  customer_id: string;
  bank_name: string;
  iban: string;
  account_holder: string;
  account_number?: string;
  branch_name?: string;
  branch_code?: string;
  swift_code?: string;
  currency?: string;
  is_default?: boolean;
  notes?: string;
}

export const bankAccountService = {
  async getBankAccounts(customerId: string) {
    const { data, error } = await supabase
      .from("customer_bank_accounts")
      .select("*")
      .eq("customer_id", customerId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching bank accounts:", error);
      throw error;
    }

    return data || [];
  },

  async createBankAccount(account: BankAccount) {
    // If this is set as default, unset other defaults for this customer
    if (account.is_default) {
      await supabase
        .from("customer_bank_accounts")
        .update({ is_default: false })
        .eq("customer_id", account.customer_id);
    }

    const { data, error } = await supabase
      .from("customer_bank_accounts")
      .insert(account)
      .select()
      .single();

    if (error) {
      console.error("Error creating bank account:", error);
      throw error;
    }

    return data;
  },

  async updateBankAccount(id: string, updates: Partial<BankAccount>) {
    // If setting as default, unset other defaults
    if (updates.is_default && updates.customer_id) {
      await supabase
        .from("customer_bank_accounts")
        .update({ is_default: false })
        .eq("customer_id", updates.customer_id);
    }

    const { data, error } = await supabase
      .from("customer_bank_accounts")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating bank account:", error);
      throw error;
    }

    return data;
  },

  async deleteBankAccount(id: string) {
    const { error } = await supabase
      .from("customer_bank_accounts")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting bank account:", error);
      throw error;
    }
  }
};