import { supabase } from "@/integrations/supabase/client";

export interface Shipment {
  id?: string;
  shipment_code?: string;
  tracking_number?: string;
  supplier_id?: string | null;
  driver_id?: string | null;
  vehicle_id?: string | null;
  customer_id?: string | null;
  origin: string;
  destination: string;
  pickup_date?: string | null;
  delivery_date?: string | null;
  estimated_delivery_date?: string | null;
  cost?: number | null;
  cost_currency?: string;
  currency?: string;
  status?: string;
  sender_name?: string | null;
  sender_ii?: string | null;
  receiver?: string | null;
  receiver_district?: string | null;
  receiver_ii?: string | null;
  adet?: number | null;
  cinsi?: string | null;
  kg_ds?: number | null;
  toplam_kg_ds?: number | null;
  satis_birim?: number | null;
  satis_tutar?: number | null;
  delivered_to?: string | null;
  delivery_proof_url?: string | null;
  actual_delivery_date?: string | null;
  cancellation_reason?: string | null;
  cancelled_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ShipmentRevisionRequest {
  id: string;
  shipment_id: string;
  shipment_code: string;
  reason: string;
  status: "pending" | "rejected" | "approved" | "applied";
  requested_by_email?: string | null;
  requested_at: string;
  reviewed_by_email?: string | null;
  reviewed_at?: string | null;
  review_note?: string | null;
  applied_at?: string | null;
}

export interface ShipmentEvent {
  id: string;
  shipment_id: string;
  shipment_code?: string | null;
  event_type: string;
  old_status?: string | null;
  new_status?: string | null;
  changed_fields: Record<string, { old?: unknown; new?: unknown } | unknown>;
  actor_email?: string | null;
  actor_role?: string | null;
  event_at: string;
  source: string;
  note?: string | null;
}

export const shipmentService = {
  async getShipmentHistory(shipmentId: string): Promise<ShipmentEvent[]> {
    const { data, error } = await (supabase.from("shipment_events" as any) as any)
      .select("*")
      .eq("shipment_id", shipmentId)
      .order("event_at", { ascending: false });
    if (error) throw error;
    return (data || []) as ShipmentEvent[];
  },

  async saveShipmentWithCargo(
    shipmentId: string | null,
    shipment: Partial<Shipment>,
    cargoItems: Array<{
      adet: number;
      cinsi: string;
      kg_ds: number;
      birim_fiyat?: number;
      alt_toplam_fiyat?: number;
      uetds_load_type_code?: string;
      uetds_unit_code?: string;
      dangerous_goods?: boolean;
      un_number?: string;
      dangerous_transport_code?: number;
      uetds_description?: string;
    }>,
    completedEditConfirmation?: string,
    uetdsDetails: Record<string, unknown> = {},
  ): Promise<string> {
    const { data, error } = await supabase.rpc("rex_save_shipment_with_uetds" as any, {
      p_shipment_id: shipmentId,
      p_shipment: {
        ...shipment,
        _owner_confirmation_code: completedEditConfirmation || null,
      },
      p_cargo_items: cargoItems,
      p_uetds_details: uetdsDetails,
    } as any);

    if (error) throw error;
    return data as unknown as string;
  },

  async setShipmentStatus(id: string, status: "hazirlaniyor" | "yolda") {
    const { error } = await supabase.rpc("rex_set_shipment_status" as any, {
      p_shipment_id: id,
      p_status: status,
    } as any);
    if (error) throw error;
  },

  async cancelShipment(id: string, reason: string) {
    const { error } = await supabase.rpc("rex_cancel_shipment" as any, {
      p_shipment_id: id,
      p_reason: reason,
    } as any);
    if (error) throw error;
  },

  async requestRevision(
    shipmentId: string,
    reason: string,
    proposedShipment: Partial<Shipment>,
    proposedCargoItems: unknown[],
  ) {
    const { data, error } = await supabase.rpc("rex_request_shipment_revision" as any, {
      p_shipment_id: shipmentId,
      p_reason: reason,
      p_proposed_shipment: proposedShipment,
      p_proposed_cargo_items: proposedCargoItems,
    } as any);
    if (error) throw error;
    return data as unknown as string;
  },

  async getRevisionRequests(): Promise<ShipmentRevisionRequest[]> {
    const { data, error } = await (supabase.from("shipment_revision_requests" as any) as any)
      .select("*")
      .order("requested_at", { ascending: false });
    if (error) throw error;
    return (data || []) as ShipmentRevisionRequest[];
  },

  async reviewRevision(id: string, decision: "approve" | "reject", note?: string) {
    const { error } = await supabase.rpc("rex_review_shipment_revision" as any, {
      p_request_id: id,
      p_decision: decision,
      p_note: note || null,
    } as any);
    if (error) throw error;
  },

  async markDelivered(
    id: string,
    deliveredTo: string,
    deliveryDate: string,
    deliveryProofUrl: string | null,
  ) {
    const { error } = await supabase.rpc("rex_mark_shipment_delivered" as any, {
      p_shipment_id: id,
      p_delivered_to: deliveredTo,
      p_delivery_date: deliveryDate,
      p_delivery_proof_url: deliveryProofUrl,
    } as any);
    if (error) throw error;
  },

  async getShipments() {
    const { data, error } = await supabase
      .from("shipments")
      .select(`
        *,
        supplier:customers!shipments_supplier_id_fkey(id, customer_code, name),
        driver:drivers(id, driver_code, full_name),
        vehicle:vehicles(id, vehicle_code, cekici_plakasi, arac_tipi),
        customer:customers!shipments_customer_id_fkey(id, customer_code, name)
        ,uetds_details:shipment_uetds_details(*)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching shipments:", error);
      throw error;
    }

    return data || [];
  },

  async getNextShipmentCode(): Promise<string> {
    try {
      const { data, error } = await supabase
        .from("shipments")
        .select("shipment_code")
        .not("shipment_code", "is", null)
        .order("shipment_code", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error fetching last shipment code:", error);
        return "SHP-000001";
      }

      if (!data || data.length === 0) {
        return "SHP-000001";
      }

      const lastCode = data[0].shipment_code;
      const match = lastCode?.match(/SHP-(\d+)/);
      
      if (!match) {
        return "SHP-000001";
      }

      const lastNumber = parseInt(match[1], 10);
      const nextNumber = lastNumber + 1;
      const nextCode = `SHP-${nextNumber.toString().padStart(6, "0")}`;
      
      console.log("Last shipment code:", lastCode, "→ Next code:", nextCode);
      
      return nextCode;
    } catch (error) {
      console.error("Error generating shipment code:", error);
      return "SHP-000001";
    }
  },

  async createShipment(shipment: Shipment) {
    if (!shipment.shipment_code) {
      shipment.shipment_code = await this.getNextShipmentCode();
    }

    const { data, error } = await supabase
      .from("shipments")
      .insert(shipment as any)
      .select()
      .single();

    if (error) {
      console.error("Error creating shipment:", error);
      throw error;
    }

    return data;
  },

  async updateShipment(id: string, shipment: Partial<Shipment>) {
    const { data, error } = await supabase
      .from("shipments")
      .update({ ...shipment, updated_at: new Date().toISOString() } as any)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating shipment:", error);
      throw error;
    }

    return data;
  },

  async deleteShipment(id: string, confirmationCode: string) {
    const { error } = await supabase.rpc("rex_owner_delete_shipment" as any, {
      p_shipment_id: id,
      p_confirmation_code: confirmationCode,
    } as any);

    if (error) {
      console.error("Error deleting shipment:", error);
      throw error;
    }
  },

  async getShipmentById(id: string) {
    const { data, error } = await supabase
      .from("shipments")
      .select(`
        *,
        driver:drivers(id, driver_code, full_name, phone_1),
        vehicle:vehicles(id, vehicle_code, cekici_plakasi, arac_tipi),
        customer:customers(id, customer_code, name, phone)
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching shipment:", error);
      throw error;
    }

    return data;
  }
};
