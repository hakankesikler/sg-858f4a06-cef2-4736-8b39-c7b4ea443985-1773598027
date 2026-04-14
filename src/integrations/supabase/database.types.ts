/* eslint-disable @typescript-eslint/no-empty-object-type */
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
      account_transactions: {
        Row: {
          account_id: string
          account_type: string
          amount: number
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          reference_no: string | null
          transaction_date: string | null
          transaction_type: string
          user_id: string | null
        }
        Insert: {
          account_id: string
          account_type: string
          amount: number
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          reference_no?: string | null
          transaction_date?: string | null
          transaction_type: string
          user_id?: string | null
        }
        Update: {
          account_id?: string
          account_type?: string
          amount?: number
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          reference_no?: string | null
          transaction_date?: string | null
          transaction_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
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
      company_settings: {
        Row: {
          address: string | null
          auto_offsetting: boolean | null
          city: string | null
          company_name: string
          company_type: string | null
          country: string | null
          created_at: string | null
          currency: string | null
          document_type: string | null
          e_invoice_provider: string | null
          e_invoice_status: string | null
          email: string | null
          id: string
          mersis_code: string | null
          operating_center: string | null
          phone: string | null
          registration_number: string | null
          sector: string | null
          tax_id: string | null
          tax_office: string | null
          updated_at: string | null
          user_id: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          auto_offsetting?: boolean | null
          city?: string | null
          company_name?: string
          company_type?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          document_type?: string | null
          e_invoice_provider?: string | null
          e_invoice_status?: string | null
          email?: string | null
          id?: string
          mersis_code?: string | null
          operating_center?: string | null
          phone?: string | null
          registration_number?: string | null
          sector?: string | null
          tax_id?: string | null
          tax_office?: string | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          auto_offsetting?: boolean | null
          city?: string | null
          company_name?: string
          company_type?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          document_type?: string | null
          e_invoice_provider?: string | null
          e_invoice_status?: string | null
          email?: string | null
          id?: string
          mersis_code?: string | null
          operating_center?: string | null
          phone?: string | null
          registration_number?: string | null
          sector?: string | null
          tax_id?: string | null
          tax_office?: string | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Relationships: []
      }
      customer_bank_accounts: {
        Row: {
          account_holder: string
          account_number: string | null
          bank_name: string
          branch_code: string | null
          branch_name: string | null
          created_at: string | null
          currency: string | null
          customer_id: string
          iban: string
          id: string
          is_default: boolean | null
          notes: string | null
          swift_code: string | null
          updated_at: string | null
        }
        Insert: {
          account_holder: string
          account_number?: string | null
          bank_name: string
          branch_code?: string | null
          branch_name?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id: string
          iban: string
          id?: string
          is_default?: boolean | null
          notes?: string | null
          swift_code?: string | null
          updated_at?: string | null
        }
        Update: {
          account_holder?: string
          account_number?: string | null
          bank_name?: string
          branch_code?: string | null
          branch_name?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string
          iban?: string
          id?: string
          is_default?: boolean | null
          notes?: string | null
          swift_code?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_bank_accounts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_drivers: {
        Row: {
          created_at: string | null
          customer_id: string
          ehliyet_gecerlilik_tarihi: string | null
          ehliyet_sinifi: string | null
          full_name: string
          id: string
          phone1: string | null
          phone2: string | null
          psikoteknik_belge_no: string | null
          src_belge_no: string | null
          tc_no: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          ehliyet_gecerlilik_tarihi?: string | null
          ehliyet_sinifi?: string | null
          full_name: string
          id?: string
          phone1?: string | null
          phone2?: string | null
          psikoteknik_belge_no?: string | null
          src_belge_no?: string | null
          tc_no?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          ehliyet_gecerlilik_tarihi?: string | null
          ehliyet_sinifi?: string | null
          full_name?: string
          id?: string
          phone1?: string | null
          phone2?: string | null
          psikoteknik_belge_no?: string | null
          src_belge_no?: string | null
          tc_no?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_drivers_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_vehicles: {
        Row: {
          arac_tipi: string | null
          cekici_plakasi: string | null
          created_at: string | null
          customer_id: string
          dorse_plakasi: string | null
          id: string
          kasa_tipi: string | null
          kasko_bitis_tarihi: string | null
          ruhsat_dosyasi_url: string | null
          tasima_kapasitesi: number | null
          trafik_sigortasi_bitis_tarihi: string | null
          updated_at: string | null
          yetki_belgesi: string | null
        }
        Insert: {
          arac_tipi?: string | null
          cekici_plakasi?: string | null
          created_at?: string | null
          customer_id: string
          dorse_plakasi?: string | null
          id?: string
          kasa_tipi?: string | null
          kasko_bitis_tarihi?: string | null
          ruhsat_dosyasi_url?: string | null
          tasima_kapasitesi?: number | null
          trafik_sigortasi_bitis_tarihi?: string | null
          updated_at?: string | null
          yetki_belgesi?: string | null
        }
        Update: {
          arac_tipi?: string | null
          cekici_plakasi?: string | null
          created_at?: string | null
          customer_id?: string
          dorse_plakasi?: string | null
          id?: string
          kasa_tipi?: string | null
          kasko_bitis_tarihi?: string | null
          ruhsat_dosyasi_url?: string | null
          tasima_kapasitesi?: number | null
          trafik_sigortasi_bitis_tarihi?: string | null
          updated_at?: string | null
          yetki_belgesi?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_vehicles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          account_type: string | null
          address: string | null
          airline_prefix: string | null
          authorized_person_email: string | null
          authorized_person_name: string | null
          authorized_person_phone: string | null
          branch_address: string | null
          carrier_type: string | null
          city: string | null
          company: string | null
          contract_file_url: string | null
          created_at: string | null
          customer_code: string | null
          district: string | null
          email: string | null
          equipment_types: string[] | null
          fax: string | null
          fiata_number: string | null
          has_contract: boolean | null
          iata_code: string | null
          id: string
          imo_ism_number: string | null
          insurance_type: string | null
          invoice_email: string | null
          last_contact: string | null
          mersis: string | null
          name: string
          notes: string | null
          payment_day: number | null
          payment_method: string | null
          phone: string | null
          policy_number: string | null
          postal_code: string | null
          sabit_iskonto: number | null
          scac_code: string | null
          service_regions: string[] | null
          service_types: string[] | null
          short_name: string | null
          specialty: string[] | null
          status: string | null
          supplier_category: string | null
          tags: string | null
          tax_office: string | null
          tc_no: string | null
          ticaret_sicil_no: string | null
          updated_at: string | null
          vade_gunu: number | null
          vergi_no: string | null
          website: string | null
          work_area: string | null
        }
        Insert: {
          account_type?: string | null
          address?: string | null
          airline_prefix?: string | null
          authorized_person_email?: string | null
          authorized_person_name?: string | null
          authorized_person_phone?: string | null
          branch_address?: string | null
          carrier_type?: string | null
          city?: string | null
          company?: string | null
          contract_file_url?: string | null
          created_at?: string | null
          customer_code?: string | null
          district?: string | null
          email?: string | null
          equipment_types?: string[] | null
          fax?: string | null
          fiata_number?: string | null
          has_contract?: boolean | null
          iata_code?: string | null
          id?: string
          imo_ism_number?: string | null
          insurance_type?: string | null
          invoice_email?: string | null
          last_contact?: string | null
          mersis?: string | null
          name: string
          notes?: string | null
          payment_day?: number | null
          payment_method?: string | null
          phone?: string | null
          policy_number?: string | null
          postal_code?: string | null
          sabit_iskonto?: number | null
          scac_code?: string | null
          service_regions?: string[] | null
          service_types?: string[] | null
          short_name?: string | null
          specialty?: string[] | null
          status?: string | null
          supplier_category?: string | null
          tags?: string | null
          tax_office?: string | null
          tc_no?: string | null
          ticaret_sicil_no?: string | null
          updated_at?: string | null
          vade_gunu?: number | null
          vergi_no?: string | null
          website?: string | null
          work_area?: string | null
        }
        Update: {
          account_type?: string | null
          address?: string | null
          airline_prefix?: string | null
          authorized_person_email?: string | null
          authorized_person_name?: string | null
          authorized_person_phone?: string | null
          branch_address?: string | null
          carrier_type?: string | null
          city?: string | null
          company?: string | null
          contract_file_url?: string | null
          created_at?: string | null
          customer_code?: string | null
          district?: string | null
          email?: string | null
          equipment_types?: string[] | null
          fax?: string | null
          fiata_number?: string | null
          has_contract?: boolean | null
          iata_code?: string | null
          id?: string
          imo_ism_number?: string | null
          insurance_type?: string | null
          invoice_email?: string | null
          last_contact?: string | null
          mersis?: string | null
          name?: string
          notes?: string | null
          payment_day?: number | null
          payment_method?: string | null
          phone?: string | null
          policy_number?: string | null
          postal_code?: string | null
          sabit_iskonto?: number | null
          scac_code?: string | null
          service_regions?: string[] | null
          service_types?: string[] | null
          short_name?: string | null
          specialty?: string[] | null
          status?: string | null
          supplier_category?: string | null
          tags?: string | null
          tax_office?: string | null
          tc_no?: string | null
          ticaret_sicil_no?: string | null
          updated_at?: string | null
          vade_gunu?: number | null
          vergi_no?: string | null
          website?: string | null
          work_area?: string | null
        }
        Relationships: []
      }
      daily_analytics: {
        Row: {
          avg_pages_per_session: number | null
          avg_session_duration: number | null
          bounce_rate: number | null
          created_at: string | null
          date: string
          desktop_visits: number | null
          direct_traffic: number | null
          id: string
          mobile_visits: number | null
          new_visitors: number | null
          organic_traffic: number | null
          referral_traffic: number | null
          returning_visitors: number | null
          social_traffic: number | null
          tablet_visits: number | null
          total_visits: number | null
          unique_visitors: number | null
          updated_at: string | null
        }
        Insert: {
          avg_pages_per_session?: number | null
          avg_session_duration?: number | null
          bounce_rate?: number | null
          created_at?: string | null
          date: string
          desktop_visits?: number | null
          direct_traffic?: number | null
          id?: string
          mobile_visits?: number | null
          new_visitors?: number | null
          organic_traffic?: number | null
          referral_traffic?: number | null
          returning_visitors?: number | null
          social_traffic?: number | null
          tablet_visits?: number | null
          total_visits?: number | null
          unique_visitors?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_pages_per_session?: number | null
          avg_session_duration?: number | null
          bounce_rate?: number | null
          created_at?: string | null
          date?: string
          desktop_visits?: number | null
          direct_traffic?: number | null
          id?: string
          mobile_visits?: number | null
          new_visitors?: number | null
          organic_traffic?: number | null
          referral_traffic?: number | null
          returning_visitors?: number | null
          social_traffic?: number | null
          tablet_visits?: number | null
          total_visits?: number | null
          unique_visitors?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      drivers: {
        Row: {
          created_at: string | null
          driver_code: string
          ehliyet_dosyasi_url: string | null
          ehliyet_gecerlilik_tarihi: string | null
          ehliyet_sinifi: string | null
          full_name: string
          id: string
          phone_1: string
          phone_2: string | null
          psikoteknik_belge_no: string | null
          src_belge_no: string | null
          status: string | null
          tc_no: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          driver_code: string
          ehliyet_dosyasi_url?: string | null
          ehliyet_gecerlilik_tarihi?: string | null
          ehliyet_sinifi?: string | null
          full_name: string
          id?: string
          phone_1: string
          phone_2?: string | null
          psikoteknik_belge_no?: string | null
          src_belge_no?: string | null
          status?: string | null
          tc_no: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          driver_code?: string
          ehliyet_dosyasi_url?: string | null
          ehliyet_gecerlilik_tarihi?: string | null
          ehliyet_sinifi?: string | null
          full_name?: string
          id?: string
          phone_1?: string
          phone_2?: string | null
          psikoteknik_belge_no?: string | null
          src_belge_no?: string | null
          status?: string | null
          tc_no?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      employee_accounts: {
        Row: {
          account_code: string
          advance_balance: number | null
          balance: number | null
          created_at: string | null
          credit_limit: number | null
          employee_id: string | null
          id: string
          is_active: boolean | null
          last_transaction_date: string | null
          notes: string | null
          salary: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_code: string
          advance_balance?: number | null
          balance?: number | null
          created_at?: string | null
          credit_limit?: number | null
          employee_id?: string | null
          id?: string
          is_active?: boolean | null
          last_transaction_date?: string | null
          notes?: string | null
          salary?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_code?: string
          advance_balance?: number | null
          balance?: number | null
          created_at?: string | null
          credit_limit?: number | null
          employee_id?: string | null
          id?: string
          is_active?: boolean | null
          last_transaction_date?: string | null
          notes?: string | null
          salary?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_accounts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
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
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          description: string
          expense_date: string | null
          expense_no: string
          id: string
          invoice_no: string | null
          is_recurring: boolean | null
          notes: string | null
          paid_by: string | null
          payment_method: string | null
          status: string | null
          tax: number | null
          total: number | null
          updated_at: string | null
          vendor: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          description: string
          expense_date?: string | null
          expense_no: string
          id?: string
          invoice_no?: string | null
          is_recurring?: boolean | null
          notes?: string | null
          paid_by?: string | null
          payment_method?: string | null
          status?: string | null
          tax?: number | null
          total?: number | null
          updated_at?: string | null
          vendor?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          description?: string
          expense_date?: string | null
          expense_no?: string
          id?: string
          invoice_no?: string | null
          is_recurring?: boolean | null
          notes?: string | null
          paid_by?: string | null
          payment_method?: string | null
          status?: string | null
          tax?: number | null
          total?: number | null
          updated_at?: string | null
          vendor?: string | null
        }
        Relationships: []
      }
      financial_accounts: {
        Row: {
          account_name: string
          account_no: string | null
          account_type: string
          balance: number | null
          bank_name: string | null
          created_at: string | null
          currency: string | null
          iban: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          account_name: string
          account_no?: string | null
          account_type: string
          balance?: number | null
          bank_name?: string | null
          created_at?: string | null
          currency?: string | null
          iban?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          account_name?: string
          account_no?: string | null
          account_type?: string
          balance?: number | null
          bank_name?: string | null
          created_at?: string | null
          currency?: string | null
          iban?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
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
      leads: {
        Row: {
          assigned_to: string | null
          cargo_type: string | null
          company_name: string
          contact_name: string
          converted_at: string | null
          converted_to_customer: boolean | null
          created_at: string | null
          delivery_date: string | null
          destination: string | null
          email: string
          id: string
          message: string | null
          notes: string | null
          origin: string | null
          package_count: string | null
          phone: string
          pickup_date: string | null
          priority: string | null
          service_type: string
          source: string | null
          special_requirements: string | null
          status: string | null
          updated_at: string | null
          volume: string | null
          weight: string | null
        }
        Insert: {
          assigned_to?: string | null
          cargo_type?: string | null
          company_name: string
          contact_name: string
          converted_at?: string | null
          converted_to_customer?: boolean | null
          created_at?: string | null
          delivery_date?: string | null
          destination?: string | null
          email: string
          id?: string
          message?: string | null
          notes?: string | null
          origin?: string | null
          package_count?: string | null
          phone: string
          pickup_date?: string | null
          priority?: string | null
          service_type: string
          source?: string | null
          special_requirements?: string | null
          status?: string | null
          updated_at?: string | null
          volume?: string | null
          weight?: string | null
        }
        Update: {
          assigned_to?: string | null
          cargo_type?: string | null
          company_name?: string
          contact_name?: string
          converted_at?: string | null
          converted_to_customer?: boolean | null
          created_at?: string | null
          delivery_date?: string | null
          destination?: string | null
          email?: string
          id?: string
          message?: string | null
          notes?: string | null
          origin?: string | null
          package_count?: string | null
          phone?: string
          pickup_date?: string | null
          priority?: string | null
          service_type?: string
          source?: string | null
          special_requirements?: string | null
          status?: string | null
          updated_at?: string | null
          volume?: string | null
          weight?: string | null
        }
        Relationships: []
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
      partner_accounts: {
        Row: {
          account_code: string
          address: string | null
          balance: number | null
          capital_contribution: number | null
          created_at: string | null
          email: string | null
          id: string
          identity_number: string | null
          is_active: boolean | null
          last_transaction_date: string | null
          notes: string | null
          partner_name: string
          partner_type: string | null
          phone: string | null
          share_percentage: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_code: string
          address?: string | null
          balance?: number | null
          capital_contribution?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          identity_number?: string | null
          is_active?: boolean | null
          last_transaction_date?: string | null
          notes?: string | null
          partner_name: string
          partner_type?: string | null
          phone?: string | null
          share_percentage?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_code?: string
          address?: string | null
          balance?: number | null
          capital_contribution?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          identity_number?: string | null
          is_active?: boolean | null
          last_transaction_date?: string | null
          notes?: string | null
          partner_name?: string
          partner_type?: string | null
          phone?: string | null
          share_percentage?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
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
      popular_pages: {
        Row: {
          avg_time_on_page: number | null
          id: string
          last_updated: string | null
          page_title: string | null
          page_url: string
          total_views: number | null
          unique_views: number | null
        }
        Insert: {
          avg_time_on_page?: number | null
          id?: string
          last_updated?: string | null
          page_title?: string | null
          page_url: string
          total_views?: number | null
          unique_views?: number | null
        }
        Update: {
          avg_time_on_page?: number | null
          id?: string
          last_updated?: string | null
          page_title?: string | null
          page_url?: string
          total_views?: number | null
          unique_views?: number | null
        }
        Relationships: []
      }
      products_services: {
        Row: {
          category: string | null
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          min_stock_level: number | null
          name: string
          notes: string | null
          purchase_price: number | null
          sale_price: number | null
          stock_quantity: number | null
          tax_rate: number | null
          type: string
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          min_stock_level?: number | null
          name: string
          notes?: string | null
          purchase_price?: number | null
          sale_price?: number | null
          stock_quantity?: number | null
          tax_rate?: number | null
          type: string
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          min_stock_level?: number | null
          name?: string
          notes?: string | null
          purchase_price?: number | null
          sale_price?: number | null
          stock_quantity?: number | null
          tax_rate?: number | null
          type?: string
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
      project_costs: {
        Row: {
          amount: number
          cost_date: string | null
          cost_type: string
          created_at: string | null
          description: string
          id: string
          invoice_no: string | null
          notes: string | null
          project_id: string | null
        }
        Insert: {
          amount: number
          cost_date?: string | null
          cost_type: string
          created_at?: string | null
          description: string
          id?: string
          invoice_no?: string | null
          notes?: string | null
          project_id?: string | null
        }
        Update: {
          amount?: number
          cost_date?: string | null
          cost_type?: string
          created_at?: string | null
          description?: string
          id?: string
          invoice_no?: string | null
          notes?: string | null
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_costs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          actual_cost: number | null
          budget: number | null
          created_at: string | null
          customer_id: string | null
          description: string | null
          end_date: string | null
          id: string
          manager: string | null
          notes: string | null
          priority: string | null
          progress: number | null
          project_code: string
          project_name: string
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          actual_cost?: number | null
          budget?: number | null
          created_at?: string | null
          customer_id?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          manager?: string | null
          notes?: string | null
          priority?: string | null
          progress?: number | null
          project_code: string
          project_name: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_cost?: number | null
          budget?: number | null
          created_at?: string | null
          customer_id?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          manager?: string | null
          notes?: string | null
          priority?: string | null
          progress?: number | null
          project_code?: string
          project_name?: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_items: {
        Row: {
          created_at: string | null
          description: string
          id: string
          product_id: string | null
          purchase_id: string | null
          quantity: number
          tax_rate: number | null
          total: number | null
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          product_id?: string | null
          purchase_id?: string | null
          quantity?: number
          tax_rate?: number | null
          total?: number | null
          unit_price: number
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          product_id?: string | null
          purchase_id?: string | null
          quantity?: number
          tax_rate?: number | null
          total?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          created_at: string | null
          discount: number | null
          due_date: string | null
          id: string
          notes: string | null
          paid_amount: number | null
          payment_method: string | null
          purchase_date: string | null
          purchase_no: string
          status: string | null
          subtotal: number
          supplier_id: string | null
          tax: number | null
          total: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          discount?: number | null
          due_date?: string | null
          id?: string
          notes?: string | null
          paid_amount?: number | null
          payment_method?: string | null
          purchase_date?: string | null
          purchase_no: string
          status?: string | null
          subtotal?: number
          supplier_id?: string | null
          tax?: number | null
          total?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          discount?: number | null
          due_date?: string | null
          id?: string
          notes?: string | null
          paid_amount?: number | null
          payment_method?: string | null
          purchase_date?: string | null
          purchase_no?: string
          status?: string | null
          subtotal?: number
          supplier_id?: string | null
          tax?: number | null
          total?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_invoice_items: {
        Row: {
          created_at: string | null
          description: string
          discount_amount: number
          id: string
          invoice_id: string | null
          product_code: string
          quantity: number
          subtotal: number
          tax_amount: number
          tax_rate: number
          total: number
          unit: string
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          description: string
          discount_amount?: number
          id?: string
          invoice_id?: string | null
          product_code: string
          quantity?: number
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
          unit?: string
          unit_price?: number
        }
        Update: {
          created_at?: string | null
          description?: string
          discount_amount?: number
          id?: string
          invoice_id?: string | null
          product_code?: string
          quantity?: number
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
          unit?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "sales_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_invoices: {
        Row: {
          created_at: string | null
          currency: string
          customer_id: string | null
          due_date: string
          general_discount: number
          grand_total: number
          id: string
          invoice_date: string
          invoice_no: string
          notes: string | null
          payment_method: string | null
          payment_status: string
          shipping_cost: number
          subtotal: number
          total_discount: number
          total_tax: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string
          customer_id?: string | null
          due_date: string
          general_discount?: number
          grand_total?: number
          id?: string
          invoice_date?: string
          invoice_no: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string
          shipping_cost?: number
          subtotal?: number
          total_discount?: number
          total_tax?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string
          customer_id?: string | null
          due_date?: string
          general_discount?: number
          grand_total?: number
          id?: string
          invoice_date?: string
          invoice_no?: string
          notes?: string | null
          payment_method?: string | null
          payment_status?: string
          shipping_cost?: number
          subtotal?: number
          total_discount?: number
          total_tax?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
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
      shipment_cargo_items: {
        Row: {
          adet: number
          alt_toplam: number | null
          alt_toplam_fiyat: number | null
          birim_fiyat: number | null
          cinsi: string
          created_at: string | null
          id: string
          kg_ds: number
          shipment_id: string
          sira_no: number
          updated_at: string | null
        }
        Insert: {
          adet: number
          alt_toplam?: number | null
          alt_toplam_fiyat?: number | null
          birim_fiyat?: number | null
          cinsi: string
          created_at?: string | null
          id?: string
          kg_ds: number
          shipment_id: string
          sira_no?: number
          updated_at?: string | null
        }
        Update: {
          adet?: number
          alt_toplam?: number | null
          alt_toplam_fiyat?: number | null
          birim_fiyat?: number | null
          cinsi?: string
          created_at?: string | null
          id?: string
          kg_ds?: number
          shipment_id?: string
          sira_no?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipment_cargo_items_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          adet: number | null
          cinsi: string | null
          cost: number | null
          cost_currency: string | null
          created_at: string | null
          currency: string | null
          customer_id: string | null
          delivery_date: string | null
          destination: string | null
          driver_id: string | null
          estimated_delivery_date: string | null
          id: string
          kg_ds: number | null
          origin: string | null
          pickup_date: string | null
          receiver: string | null
          receiver_district: string | null
          receiver_ii: string | null
          satis_birim: number | null
          satis_tutar: number | null
          sender_ii: string | null
          sender_name: string | null
          shipment_code: string
          status: string | null
          supplier_id: string | null
          toplam_kg_ds: number | null
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          adet?: number | null
          cinsi?: string | null
          cost?: number | null
          cost_currency?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          delivery_date?: string | null
          destination?: string | null
          driver_id?: string | null
          estimated_delivery_date?: string | null
          id?: string
          kg_ds?: number | null
          origin?: string | null
          pickup_date?: string | null
          receiver?: string | null
          receiver_district?: string | null
          receiver_ii?: string | null
          satis_birim?: number | null
          satis_tutar?: number | null
          sender_ii?: string | null
          sender_name?: string | null
          shipment_code: string
          status?: string | null
          supplier_id?: string | null
          toplam_kg_ds?: number | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          adet?: number | null
          cinsi?: string | null
          cost?: number | null
          cost_currency?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          delivery_date?: string | null
          destination?: string | null
          driver_id?: string | null
          estimated_delivery_date?: string | null
          id?: string
          kg_ds?: number | null
          origin?: string | null
          pickup_date?: string | null
          receiver?: string | null
          receiver_district?: string | null
          receiver_ii?: string | null
          satis_birim?: number | null
          satis_tutar?: number | null
          sender_ii?: string | null
          sender_name?: string | null
          shipment_code?: string
          status?: string | null
          supplier_id?: string | null
          toplam_kg_ds?: number | null
          updated_at?: string | null
          vehicle_id?: string | null
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
            foreignKeyName: "shipments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_supplier_id_fkey"
            columns: ["supplier_id"]
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
        ]
      }
      traffic_sources: {
        Row: {
          id: string
          last_updated: string | null
          source_name: string
          source_type: string
          total_visits: number | null
          unique_visitors: number | null
        }
        Insert: {
          id?: string
          last_updated?: string | null
          source_name: string
          source_type: string
          total_visits?: number | null
          unique_visitors?: number | null
        }
        Update: {
          id?: string
          last_updated?: string | null
          source_name?: string
          source_type?: string
          total_visits?: number | null
          unique_visitors?: number | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string | null
          amount: number
          category: string | null
          created_at: string | null
          description: string
          id: string
          notes: string | null
          reference_no: string | null
          related_invoice_id: string | null
          related_purchase_id: string | null
          transaction_date: string | null
          transaction_no: string
          type: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          category?: string | null
          created_at?: string | null
          description: string
          id?: string
          notes?: string | null
          reference_no?: string | null
          related_invoice_id?: string | null
          related_purchase_id?: string | null
          transaction_date?: string | null
          transaction_no: string
          type: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          category?: string | null
          created_at?: string | null
          description?: string
          id?: string
          notes?: string | null
          reference_no?: string | null
          related_invoice_id?: string | null
          related_purchase_id?: string | null
          transaction_date?: string | null
          transaction_no?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_related_invoice_id_fkey"
            columns: ["related_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_related_purchase_id_fkey"
            columns: ["related_purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          arac_tipi: string | null
          cekici_plakasi: string | null
          created_at: string | null
          dorse_plakasi: string | null
          driver_name: string | null
          driver_phone: string | null
          id: string
          kasa_tipi: string | null
          kasko_bitis_tarihi: string | null
          plate_no: string | null
          ruhsat_dosyasi: string | null
          ruhsat_dosyasi_url: string | null
          ruhsat_no: string | null
          ruhsat_sahibi_adi_soyadi: string | null
          status: string | null
          tasima_kapasitesi_kg: number | null
          trafik_sigortasi_bitis_tarihi: string | null
          updated_at: string | null
          vehicle_code: string | null
          vehicle_type: string | null
          yetki_belgesi: string | null
        }
        Insert: {
          arac_tipi?: string | null
          cekici_plakasi?: string | null
          created_at?: string | null
          dorse_plakasi?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          id?: string
          kasa_tipi?: string | null
          kasko_bitis_tarihi?: string | null
          plate_no?: string | null
          ruhsat_dosyasi?: string | null
          ruhsat_dosyasi_url?: string | null
          ruhsat_no?: string | null
          ruhsat_sahibi_adi_soyadi?: string | null
          status?: string | null
          tasima_kapasitesi_kg?: number | null
          trafik_sigortasi_bitis_tarihi?: string | null
          updated_at?: string | null
          vehicle_code?: string | null
          vehicle_type?: string | null
          yetki_belgesi?: string | null
        }
        Update: {
          arac_tipi?: string | null
          cekici_plakasi?: string | null
          created_at?: string | null
          dorse_plakasi?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          id?: string
          kasa_tipi?: string | null
          kasko_bitis_tarihi?: string | null
          plate_no?: string | null
          ruhsat_dosyasi?: string | null
          ruhsat_dosyasi_url?: string | null
          ruhsat_no?: string | null
          ruhsat_sahibi_adi_soyadi?: string | null
          status?: string | null
          tasima_kapasitesi_kg?: number | null
          trafik_sigortasi_bitis_tarihi?: string | null
          updated_at?: string | null
          vehicle_code?: string | null
          vehicle_type?: string | null
          yetki_belgesi?: string | null
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
      website_visits: {
        Row: {
          browser: string | null
          city: string | null
          clicks_count: number | null
          country: string | null
          created_at: string | null
          device_type: string | null
          id: string
          ip_address: string | null
          is_new_visitor: boolean | null
          os: string | null
          page_title: string | null
          page_url: string
          referrer: string | null
          region: string | null
          screen_resolution: string | null
          scroll_depth: number | null
          session_duration: number | null
          session_id: string | null
          time_on_page: number | null
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          visited_at: string | null
          visitor_id: string
        }
        Insert: {
          browser?: string | null
          city?: string | null
          clicks_count?: number | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          is_new_visitor?: boolean | null
          os?: string | null
          page_title?: string | null
          page_url: string
          referrer?: string | null
          region?: string | null
          screen_resolution?: string | null
          scroll_depth?: number | null
          session_duration?: number | null
          session_id?: string | null
          time_on_page?: number | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visited_at?: string | null
          visitor_id: string
        }
        Update: {
          browser?: string | null
          city?: string | null
          clicks_count?: number | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          is_new_visitor?: boolean | null
          os?: string | null
          page_title?: string | null
          page_url?: string
          referrer?: string | null
          region?: string | null
          screen_resolution?: string | null
          scroll_depth?: number | null
          session_duration?: number | null
          session_id?: string | null
          time_on_page?: number | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visited_at?: string | null
          visitor_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_daily_analytics: { Args: never; Returns: undefined }
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
