import { supabase } from "@/integrations/supabase/client";
import { deletePrivateDocument, getPrivateDocumentSignedUrl, uploadPrivateDocument } from "@/lib/private-storage";

export type DeliveryDocumentType =
  | "delivery_proof"
  | "damaged_delivery_report"
  | "partial_delivery_report"
  | "recipient_photo"
  | "other";

export type DeliveryDocumentScanStatus = "pending" | "clean" | "infected" | "error" | "legacy_unscanned";

export interface DeliveryDocument {
  id: string;
  shipment_id: string;
  document_type: DeliveryDocumentType;
  document_group_id: string;
  version_number: number;
  supersedes_document_id?: string | null;
  is_active: boolean;
  file_reference: string;
  original_file_name: string;
  mime_type: string;
  file_size?: number | null;
  sha256?: string | null;
  notes?: string | null;
  scan_status: DeliveryDocumentScanStatus;
  scan_provider?: string | null;
  scan_result?: Record<string, unknown>;
  scanned_at?: string | null;
  uploaded_by_email?: string | null;
  uploaded_at: string;
}

export interface DeliveryDocumentUpload {
  file: File;
  documentType: DeliveryDocumentType;
  notes?: string;
  supersedesDocumentId?: string;
}

export const deliveryDocumentTypeLabels: Record<DeliveryDocumentType, string> = {
  delivery_proof: "Teslim Evrakı",
  damaged_delivery_report: "Hasarlı Teslimat Tutanağı",
  partial_delivery_report: "Eksik Teslimat Tutanağı",
  recipient_photo: "Teslim Fotoğrafı",
  other: "Diğer Belge",
};

const validMimeTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
const maxFileSize = 10 * 1024 * 1024;

function safeFileName(fileName: string) {
  const extension = fileName.includes(".") ? `.${fileName.split(".").pop()?.toLowerCase()}` : "";
  return `${crypto.randomUUID()}${extension}`;
}

async function sha256(file: File) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function validateFile(file: File) {
  if (!validMimeTypes.has(file.type)) throw new Error(`${file.name}: yalnızca PDF, JPG, PNG veya WEBP yüklenebilir.`);
  if (file.size < 1 || file.size > maxFileSize) throw new Error(`${file.name}: dosya boyutu 10 MB sınırını aşamaz.`);
}

async function requestVirusScan(documentId: string) {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) throw new Error("Oturum doğrulanamadı.");

  const response = await fetch("/api/security/scan-delivery-document", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ documentId }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result?.error || "Virüs taraması başlatılamadı.");
  return result as { status: DeliveryDocumentScanStatus; clean: boolean };
}

export const deliveryDocumentService = {
  async list(shipmentId: string): Promise<DeliveryDocument[]> {
    const { data, error } = await (supabase.from("delivery_documents" as any) as any)
      .select("*")
      .eq("shipment_id", shipmentId)
      .order("uploaded_at", { ascending: false });
    if (error) throw error;
    return (data || []) as DeliveryDocument[];
  },

  async upload(shipmentId: string, input: DeliveryDocumentUpload) {
    validateFile(input.file);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) throw new Error("Oturum doğrulanamadı.");

    const hash = await sha256(input.file);
    const path = `delivery-documents/${userId}/${shipmentId}/${safeFileName(input.file.name)}`;
    const reference = await uploadPrivateDocument("shipment-documents", path, input.file);
    const { data, error } = await supabase.rpc("rex_register_delivery_document" as any, {
      p_shipment_id: shipmentId,
      p_document_type: input.documentType,
      p_file_reference: reference,
      p_original_file_name: input.file.name,
      p_mime_type: input.file.type,
      p_file_size: input.file.size,
      p_sha256: hash,
      p_notes: input.notes?.trim() || null,
      p_supersedes_document_id: input.supersedesDocumentId || null,
    } as any);

    if (error || !data) {
      await deletePrivateDocument(reference, "shipment-documents");
      throw error || new Error("Teslim evrakı kaydedilemedi.");
    }

    let scanError: string | null = null;
    let scanStatus: DeliveryDocumentScanStatus = "pending";
    try {
      const scan = await requestVirusScan(data as unknown as string);
      scanStatus = scan.status;
    } catch (error: any) {
      scanError = error?.message || "Virüs taraması bekliyor.";
    }

    return { id: data as unknown as string, scanStatus, scanError };
  },

  async uploadMany(shipmentId: string, inputs: DeliveryDocumentUpload[]) {
    const results: Array<{ id: string; scanStatus: DeliveryDocumentScanStatus; scanError: string | null }> = [];
    for (const input of inputs) results.push(await this.upload(shipmentId, input));
    return results;
  },

  async retryScan(documentId: string) {
    return requestVirusScan(documentId);
  },

  async preview(document: DeliveryDocument) {
    if (!["clean", "legacy_unscanned"].includes(document.scan_status)) {
      throw new Error("Belge, virüs taraması temiz sonuçlanmadan önizlenemez.");
    }
    return getPrivateDocumentSignedUrl(document.file_reference, "shipment-documents");
  },

  async markDelivered(shipmentId: string, deliveredTo: string, deliveryDate: string, documentIds: string[]) {
    const { error } = await supabase.rpc("rex_mark_shipment_delivered_v2" as any, {
      p_shipment_id: shipmentId,
      p_delivered_to: deliveredTo,
      p_delivery_date: deliveryDate,
      p_document_ids: documentIds,
    } as any);
    if (error) throw error;
  },
};

