import { supabase } from "@/integrations/supabase/client";

export type CustomerPortalProfile = {
  customer_id: string;
  customer_code: string | null;
  name: string;
  email: string;
  authorized_person_name: string | null;
};

export type CustomerCargoItem = {
  adet: number;
  cinsi: string;
  kg_ds: number;
  sira_no: number;
};

export type CustomerShipment = {
  id: string;
  shipment_code: string;
  tracking_number: string;
  status: string | null;
  created_at: string | null;
  pickup_date: string | null;
  estimated_delivery_date: string | null;
  actual_delivery_date: string | null;
  delivery_date: string | null;
  delivered_to: string | null;
  delivery_proof_url: string | null;
  sender_name: string | null;
  origin: string | null;
  receiver: string | null;
  receiver_district: string | null;
  destination: string | null;
  adet: number | null;
  cinsi: string | null;
  kg_ds: number | null;
  toplam_kg_ds: number | null;
  cargo_items: CustomerCargoItem[];
};

export type CustomerPortalInvite = {
  customer_id: string;
  customer_name: string;
  email: string;
  token: string;
  expires_at: string;
};

const rpc = async <T>(name: string, params?: Record<string, unknown>): Promise<T> => {
  const { data, error } = await supabase.rpc(name as never, (params || {}) as never);
  if (error) throw error;
  return data as T;
};

export const customerPortalService = {
  getProfile: () => rpc<CustomerPortalProfile | null>("rex_customer_portal_profile"),
  getShipments: () => rpc<CustomerShipment[]>("rex_customer_portal_shipments"),
  createInvite: (customerId: string, email: string) =>
    rpc<CustomerPortalInvite>("rex_create_customer_portal_invite", {
      p_customer_id: customerId,
      p_email: email,
    }),
  claimInvite: (token: string) =>
    rpc<{ ok: boolean; customer_id: string }>("rex_claim_customer_portal_invite", { p_token: token }),
};
