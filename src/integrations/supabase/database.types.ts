 
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      cari_cards: {
        Row: {
          account_type: string | null
          balance: number | null
          created_at: string | null
          credit_limit: number | null
          customer_id: string | null
          id: string
          payment_terms: number | null
          updated_at: string | null
        }
        Insert: {
          account_type?: string | null
          balance?: number | null
          created_at?: string | null
          credit_limit?: number | null
          customer_id?: string | null
          id?: string
          payment_terms?: number | null
          updated_at?: string | null
        }
        Update: {
          account_type?: string | null
          balance?: number | null
          created_at?: string | null
          credit_limit?: number | null
          customer_id?: string | null
          id?: string
          payment_terms?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cari_cards_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          company: string | null
          created_at: string | null
          email: string | null
          id: string
          last_contact: string | null
          name: string
          notes: string | null
          phone: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_contact?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_contact?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          annual_leave_total: number | null
          annual_leave_used: number | null
          avatar_url: string | null
          created_at: string | null
          department: string
          email: string | null
          hire_date: string
          id: string
          name: string
          performance_score: number | null
          phone: string | null
          position: string
          salary: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          annual_leave_total?: number | null
          annual_leave_used?: number | null
          avatar_url?: string | null
          created_at?: string | null
          department: string
          email?: string | null
          hire_date?: string
          id?: string
          name: string
          performance_score?: number | null
          phone?: string | null
          position: string
          salary?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          annual_leave_total?: number | null
          annual_leave_used?: number | null
          avatar_url?: string | null
          created_at?: string | null
          department?: string
          email?: string | null
          hire_date?: string
          id?: string
          name?: string
          performance_score?: number | null
          phone?: string | null
          position?: string
          salary?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          created_at: string | null
          customer_id: string | null
          due_date: string | null
          id: string
          invoice_no: string
          notes: string | null
          paid_date: string | null
          payment_method: string | null
          status: string | null
          tax: number | null
          total: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number
          created_at?: string | null
          customer_id?: string | null
          due_date?: string | null
          id?: string
          invoice_no: string
          notes?: string | null
          paid_date?: string | null
          payment_method?: string | null
          status?: string | null
          tax?: number | null
          total?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          customer_id?: string | null
          due_date?: string | null
          id?: string
          invoice_no?: string
          notes?: string | null
          paid_date?: string | null
          payment_method?: string | null
          status?: string | null
          tax?: number | null
          total?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      leaves: {
        Row: {
          approved_by: string | null
          approved_date: string | null
          created_at: string | null
          days: number | null
          employee_id: string | null
          end_date: string
          id: string
          leave_type: string
          reason: string | null
          start_date: string
          status: string | null
        }
        Insert: {
          approved_by?: string | null
          approved_date?: string | null
          created_at?: string | null
          days?: number | null
          employee_id?: string | null
          end_date: string
          id?: string
          leave_type: string
          reason?: string | null
          start_date: string
          status?: string | null
        }
        Update: {
          approved_by?: string | null
          approved_date?: string | null
          created_at?: string | null
          days?: number | null
          employee_id?: string | null
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string | null
          start_date?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leaves_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          invoice_id: string | null
          notes: string | null
          payment_date: string | null
          payment_method: string
          reference_no: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_method: string
          reference_no?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_method?: string
          reference_no?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll: {
        Row: {
          base_salary: number
          bonuses: number | null
          created_at: string | null
          deductions: number | null
          employee_id: string | null
          id: string
          month: string
          net_salary: number | null
          notes: string | null
          payment_date: string | null
        }
        Insert: {
          base_salary: number
          bonuses?: number | null
          created_at?: string | null
          deductions?: number | null
          employee_id?: string | null
          id?: string
          month: string
          net_salary?: number | null
          notes?: string | null
          payment_date?: string | null
        }
        Update: {
          base_salary?: number
          bonuses?: number | null
          created_at?: string | null
          deductions?: number | null
          employee_id?: string | null
          id?: string
          month?: string
          net_salary?: number | null
          notes?: string | null
          payment_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          category: string
          id: string
          key: string
          updated_at: string | null
          user_id: string | null
          value: string | null
        }
        Insert: {
          category: string
          id?: string
          key: string
          updated_at?: string | null
          user_id?: string | null
          value?: string | null
        }
        Update: {
          category?: string
          id?: string
          key?: string
          updated_at?: string | null
          user_id?: string | null
          value?: string | null
        }
        Relationships: []
      }
      shipments: {
        Row: {
          cargo_type: string | null
          created_at: string | null
          customer_id: string | null
          delivery_date: string | null
          destination: string
          eta: string | null
          id: string
          notes: string | null
          origin: string
          status: string | null
          tracking_no: string
          updated_at: string | null
          vehicle_id: string | null
          warehouse_id: string | null
          weight: number | null
        }
        Insert: {
          cargo_type?: string | null
          created_at?: string | null
          customer_id?: string | null
          delivery_date?: string | null
          destination: string
          eta?: string | null
          id?: string
          notes?: string | null
          origin: string
          status?: string | null
          tracking_no: string
          updated_at?: string | null
          vehicle_id?: string | null
          warehouse_id?: string | null
          weight?: number | null
        }
        Update: {
          cargo_type?: string | null
          created_at?: string | null
          customer_id?: string | null
          delivery_date?: string | null
          destination?: string
          eta?: string | null
          id?: string
          notes?: string | null
          origin?: string
          status?: string | null
          tracking_no?: string
          updated_at?: string | null
          vehicle_id?: string | null
          warehouse_id?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          created_at: string | null
          driver_name: string | null
          driver_phone: string | null
          id: string
          plate_no: string
          status: string | null
          updated_at: string | null
          vehicle_type: string
        }
        Insert: {
          created_at?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          id?: string
          plate_no: string
          status?: string | null
          updated_at?: string | null
          vehicle_type: string
        }
        Update: {
          created_at?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          id?: string
          plate_no?: string
          status?: string | null
          updated_at?: string | null
          vehicle_type?: string
        }
        Relationships: []
      }
      warehouses: {
        Row: {
          capacity: number | null
          created_at: string | null
          current_stock: number | null
          id: string
          location: string
          manager_name: string | null
          manager_phone: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          current_stock?: number | null
          id?: string
          location: string
          manager_name?: string | null
          manager_phone?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          current_stock?: number | null
          id?: string
          location?: string
          manager_name?: string | null
          manager_phone?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
