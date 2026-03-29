import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Employee = Database["public"]["Tables"]["employees"]["Row"];
type EmployeeInsert = Database["public"]["Tables"]["employees"]["Insert"];
type Leave = Database["public"]["Tables"]["leaves"]["Row"];
type LeaveInsert = Database["public"]["Tables"]["leaves"]["Insert"];
type Payroll = Database["public"]["Tables"]["payroll"]["Row"];

export const hrService = {
  // Employees
  async getEmployees() {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching employees:", error);
      throw error;
    }
    return data || [];
  },

  async getEmployeeById(id: string) {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) {
      console.error("Error fetching employee:", error);
      throw error;
    }
    return data;
  },

  async createEmployee(employee: EmployeeInsert) {
    const { data, error } = await supabase
      .from("employees")
      .insert(employee)
      .select()
      .single();
    
    if (error) {
      console.error("Error creating employee:", error);
      throw error;
    }
    return data;
  },

  async updateEmployee(id: string, updates: Partial<EmployeeInsert>) {
    const { data, error } = await supabase
      .from("employees")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating employee:", error);
      throw error;
    }
    return data;
  },

  async deleteEmployee(id: string) {
    const { error } = await supabase
      .from("employees")
      .delete()
      .eq("id", id);
    
    if (error) {
      console.error("Error deleting employee:", error);
      throw error;
    }
  },

  // Leaves
  async getLeaves() {
    const { data, error } = await supabase
      .from("leaves")
      .select("*, employees(name, department)")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching leaves:", error);
      throw error;
    }
    return data || [];
  },

  async createLeave(leave: LeaveInsert) {
    const { data, error } = await supabase
      .from("leaves")
      .insert(leave)
      .select()
      .single();
    
    if (error) {
      console.error("Error creating leave:", error);
      throw error;
    }
    return data;
  },

  async updateLeaveStatus(id: string, status: string, approvedBy?: string, rejectionReason?: string) {
    const { data, error } = await supabase
      .from("leaves")
      .update({ 
        status, 
        approved_by: approvedBy,
        rejection_reason: rejectionReason 
      })
      .eq("id", id)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating leave status:", error);
      throw error;
    }
    return data;
  },

  // Payroll
  async getPayroll() {
    const { data, error } = await supabase
      .from("payroll")
      .select("*, employees(name, department, position)")
      .order("payment_date", { ascending: false });
    
    if (error) {
      console.error("Error fetching payroll:", error);
      throw error;
    }
    return data || [];
  },

  // Statistics
  async getHRStats() {
    const { data: employees, error } = await supabase
      .from("employees")
      .select("status, salary");
    
    if (error) {
      console.error("Error fetching HR stats:", error);
      throw error;
    }

    const { data: leaves } = await supabase
      .from("leaves")
      .select("status")
      .eq("status", "Onaylandı");

    const total = employees?.filter(e => e.status === "Aktif").length || 0;
    const onLeave = leaves?.length || 0;
    const totalPayroll = employees?.reduce((sum, emp) => sum + Number(emp.salary), 0) || 0;

    return { total, onLeave, totalPayroll };
  }
};