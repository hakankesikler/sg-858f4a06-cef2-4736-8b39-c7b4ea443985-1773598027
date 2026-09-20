import { supabase } from "@/integrations/supabase/client";

export interface DeliveryDetails {
  delivered_to: string | null;
  actual_delivery_date: string | null;
  delivery_date: string | null;
}

export function deliveryDateInput(details: DeliveryDetails): string {
  if (!details.actual_delivery_date) return details.delivery_date ? `${details.delivery_date.slice(0, 10)}T00:00` : "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(details.actual_delivery_date));
  const part = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

export function deliveryTimestamp(input: string, previous: DeliveryDetails): string {
  // Preserve seconds and original timestamp when only the recipient changes.
  if (input === deliveryDateInput(previous) && previous.actual_delivery_date) return previous.actual_delivery_date;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(input)) throw new Error("Geçerli bir teslim tarihi girin.");
  const result = new Date(`${input}:00+03:00`);
  if (!Number.isFinite(result.getTime())) throw new Error("Geçerli bir teslim tarihi girin.");
  const iso = result.toISOString();
  if (deliveryDateInput({ ...previous, actual_delivery_date: iso }) !== input) throw new Error("Geçerli bir teslim tarihi girin.");
  return iso;
}

export const deliveryDetailsService = {
  async get(shipmentId: string): Promise<DeliveryDetails> {
    const { data, error } = await supabase.from("shipments")
      .select("delivered_to,actual_delivery_date,delivery_date").eq("id", shipmentId).single();
    if (error) throw error;
    return data;
  },
  async update(shipmentId: string, recipient: string, timestamp: string, expected: DeliveryDetails): Promise<DeliveryDetails> {
    const { data, error } = await supabase.rpc("rex_correct_delivery_details" as never, {
      p_shipment_id: shipmentId, p_delivered_to: recipient.trim(),
      p_actual_delivery_date: timestamp, p_expected: expected,
    } as never);
    if (error) throw error;
    return data as unknown as DeliveryDetails;
  },
};
