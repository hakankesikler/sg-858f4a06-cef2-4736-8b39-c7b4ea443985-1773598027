import { supabase } from "@/integrations/supabase/client";

export interface Driver {
  id?: string;
  driver_code?: string;
  full_name: string;
  tc_no: string;
  phone_1: string;
  phone_2?: string;
  src_belge_no?: string;
  psikoteknik_belge_no?: string;
  ehliyet_sinifi?: string;
  ehliyet_gecerlilik_tarihi?: string;
  ehliyet_dosyasi_url?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export const driverService = {
  async getDrivers() {
    const { data, error } = await supabase
      .from("drivers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching drivers:", error);
      throw error;
    }

    console.log("Drivers fetched from database:", data);
    return data || [];
  },

  async getNextDriverCode(): Promise<string> {
    try {
      const { data, error } = await supabase
        .from("drivers")
        .select("driver_code")
        .not("driver_code", "is", null)
        .order("driver_code", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error fetching last driver code:", error);
        return "DRV-000001";
      }

      if (!data || data.length === 0) {
        return "DRV-000001";
      }

      const lastCode = data[0].driver_code;
      const match = lastCode?.match(/DRV-(\d+)/);
      
      if (!match) {
        return "DRV-000001";
      }

      const lastNumber = parseInt(match[1], 10);
      const nextNumber = lastNumber + 1;
      const nextCode = `DRV-${nextNumber.toString().padStart(6, "0")}`;
      
      return nextCode;
    } catch (error) {
      console.error("Error generating driver code:", error);
      return "DRV-000001";
    }
  },

  async createDriver(driver: Driver) {
    if (!driver.driver_code) {
      driver.driver_code = await this.getNextDriverCode();
    }

    const { data, error } = await supabase
      .from("drivers")
      .insert(driver as any)
      .select()
      .single();

    if (error) {
      console.error("Error creating driver:", error);
      throw error;
    }

    return data;
  },

  async updateDriver(id: string, driver: Partial<Driver>) {
    const { data, error } = await supabase
      .from("drivers")
      .update({ ...driver, updated_at: new Date().toISOString() } as any)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating driver:", error);
      throw error;
    }

    return data;
  },

  async deleteDriver(id: string) {
    const { error } = await supabase
      .from("drivers")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting driver:", error);
      throw error;
    }
  },

  async uploadEhliyetFile(file: File, driverId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${driverId}/ehliyet_${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('driver-documents')
      .upload(fileName, file);

    if (error) {
      console.error("Error uploading file:", error);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('driver-documents')
      .getPublicUrl(data.path);

    return publicUrl;
  }
};