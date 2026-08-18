import { supabase } from "@/integrations/supabase/client";
import { storageReference } from "@/lib/private-storage";

export type ShipmentExceptionType =
  | "gecikme"
  | "arac_arizasi"
  | "hasarli_teslimat"
  | "eksik_teslimat"
  | "teslim_edilemedi"
  | "iade"
  | "iptal";

export interface ExceptionResponsible {
  user_id: string;
  email: string;
  role: string;
}

export interface ShipmentException {
  id: string;
  shipment_id: string;
  shipment_code: string;
  exception_type: ShipmentExceptionType;
  status: "open" | "resolved";
  description: string;
  photo_urls: string[];
  responsible_user_id: string;
  responsible_email: string;
  occurred_at: string;
  created_at: string;
  created_by_email?: string | null;
  resolved_at?: string | null;
  resolved_by_email?: string | null;
  resolution_note?: string | null;
}

export const shipmentExceptionService = {
  async getResponsibles(): Promise<ExceptionResponsible[]> {
    const { data, error } = await supabase.rpc("rex_exception_responsibles" as any);
    if (error) throw error;
    return (data || []) as unknown as ExceptionResponsible[];
  },

  async list(shipmentId: string): Promise<ShipmentException[]> {
    const { data, error } = await (supabase.from("shipment_exceptions" as any) as any)
      .select("*")
      .eq("shipment_id", shipmentId)
      .order("occurred_at", { ascending: false });
    if (error) throw error;
    return (data || []) as ShipmentException[];
  },

  async uploadPhotos(shipmentId: string, files: File[]): Promise<string[]> {
    const references: string[] = [];
    for (const file of files) {
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `exceptions/${shipmentId}/${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage
        .from("shipment-exception-documents")
        .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
      if (error) throw error;
      references.push(storageReference("shipment-exception-documents", path));
    }
    return references;
  },

  async create(input: {
    shipmentId: string;
    exceptionType: ShipmentExceptionType;
    description: string;
    photoUrls: string[];
    responsibleUserId: string;
    occurredAt: string;
  }): Promise<string> {
    const { data, error } = await supabase.rpc("rex_create_shipment_exception" as any, {
      p_shipment_id: input.shipmentId,
      p_exception_type: input.exceptionType,
      p_description: input.description,
      p_photo_urls: input.photoUrls,
      p_responsible_user_id: input.responsibleUserId,
      p_occurred_at: input.occurredAt,
    } as any);
    if (error) throw error;
    return data as unknown as string;
  },

  async resolve(exceptionId: string, resolutionNote: string): Promise<void> {
    const { error } = await supabase.rpc("rex_resolve_shipment_exception" as any, {
      p_exception_id: exceptionId,
      p_resolution_note: resolutionNote,
    } as any);
    if (error) throw error;
  },
};
