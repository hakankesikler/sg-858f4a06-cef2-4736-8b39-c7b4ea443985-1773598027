import { supabase } from "@/integrations/supabase/client";

export interface Vehicle {
  id?: string;
  vehicle_code?: string;
  arac_tipi: string;
  cekici_plakasi: string;
  dorse_plakasi?: string;
  kasa_tipi: string;
  tasima_kapasitesi_kg?: number;
  kasko_bitis_tarihi?: string;
  trafik_sigortasi_bitis_tarihi?: string;
  yetki_belgesi?: string;
  ruhsat_dosyasi_url?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export const vehicleService = {
  async getVehicles() {
    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching vehicles:", error);
      throw error;
    }

    return data || [];
  },

  async getNextVehicleCode(): Promise<string> {
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("vehicle_code")
        .not("vehicle_code", "is", null)
        .order("vehicle_code", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error fetching last vehicle code:", error);
        return "VHC-000001";
      }

      if (!data || data.length === 0) {
        return "VHC-000001";
      }

      const lastCode = data[0].vehicle_code;
      const match = lastCode?.match(/VHC-(\d+)/);
      
      if (!match) {
        return "VHC-000001";
      }

      const lastNumber = parseInt(match[1], 10);
      const nextNumber = lastNumber + 1;
      const nextCode = `VHC-${nextNumber.toString().padStart(6, "0")}`;
      
      return nextCode;
    } catch (error) {
      console.error("Error generating vehicle code:", error);
      return "VHC-000001";
    }
  },

  async createVehicle(vehicle: Vehicle) {
    if (!vehicle.vehicle_code) {
      vehicle.vehicle_code = await this.getNextVehicleCode();
    }

    const { data, error } = await supabase
      .from("vehicles")
      .insert(vehicle)
      .select()
      .single();

    if (error) {
      console.error("Error creating vehicle:", error);
      throw error;
    }

    return data;
  },

  async updateVehicle(id: string, vehicle: Partial<Vehicle>) {
    const { data, error } = await supabase
      .from("vehicles")
      .update({ ...vehicle, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating vehicle:", error);
      throw error;
    }

    return data;
  },

  async deleteVehicle(id: string) {
    const { error } = await supabase
      .from("vehicles")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting vehicle:", error);
      throw error;
    }
  },

  async uploadRuhsatFile(file: File, vehicleId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${vehicleId}/ruhsat_${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('vehicle-documents')
      .upload(fileName, file);

    if (error) {
      console.error("Error uploading file:", error);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('vehicle-documents')
      .getPublicUrl(data.path);

    return publicUrl;
  }
};