import { supabase } from "@/integrations/supabase/client";

export type GpslineRouteOptions = {
  origins: string[];
  destinations: string[];
  districts: string[];
};

export type GpslineDeliveryEstimate = {
  provider_code: "gpsline";
  origin_region: string;
  destination_region: string;
  destination_city: string;
  destination_district: string;
  collection_date: string;
  planned_departure_date: string;
  transit_business_days: number;
  base_route_date: string;
  estimated_delivery_date: string;
  adjusted_for_service_day: boolean;
  delivery_weekdays: number[];
  delivery_weekday_names: string[];
  note: string | null;
  source_document: string;
  source_effective_date: string;
  disclaimer: string;
};

export type GpslinePriceEstimate = {
  provider_code: "gpsline";
  origin_zone: string;
  destination_region: string;
  pallet_count: number;
  entered_total_desi_kg: number;
  chargeable_desi_kg: number;
  minimum_charge_applied: boolean;
  max_desi_per_pallet: number;
  cost_per_desi_kg: number;
  cost_amount: number;
  markup_rate: number;
  sales_margin_rate: number;
  recommended_sale_per_desi_kg: number;
  recommended_sale_amount: number;
  gross_profit_amount: number;
  currency: "TRY";
  source_document: string;
  version_label: string;
  pricing_note: string;
};

const normalize = (value?: string | null) => (value || "")
  .toLocaleLowerCase("tr-TR")
  .replace(/ı/g, "i")
  .replace(/ç/g, "c")
  .replace(/ğ/g, "g")
  .replace(/ö/g, "o")
  .replace(/ş/g, "s")
  .replace(/ü/g, "u")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]/g, "");

export const isGpslineSupplier = (supplierName?: string | null) => normalize(supplierName).includes("gpsline");

export const findGpslineOption = (value: string | null | undefined, options: string[]) => {
  const key = normalize(value);
  if (!key) return "";
  const exact = options.find((option) => normalize(option) === key);
  if (exact) return exact;
  const candidates = options.filter((option) => normalize(option).startsWith(key) || key.startsWith(normalize(option)));
  return candidates.length === 1 ? candidates[0] : "";
};

export const gpslineTransitService = {
  async getOptions(origin?: string | null, destination?: string | null): Promise<GpslineRouteOptions> {
    const { data, error } = await supabase.rpc("rex_gpsline_route_options" as never, {
      p_origin: origin || null,
      p_destination: destination || null,
    } as never);
    if (error) throw error;
    const value = (data || {}) as unknown as Partial<GpslineRouteOptions>;
    return {
      origins: value.origins || [],
      destinations: value.destinations || [],
      districts: value.districts || [],
    };
  },

  async estimate(input: { origin: string; destination: string; district: string; collectionDate: string }): Promise<GpslineDeliveryEstimate> {
    const { data, error } = await supabase.rpc("rex_estimate_gpsline_delivery" as never, {
      p_origin: input.origin,
      p_destination: input.destination,
      p_district: input.district,
      p_collection_date: input.collectionDate,
    } as never);
    if (error) throw error;
    return data as unknown as GpslineDeliveryEstimate;
  },

  async calculatePrice(input: { origin: string; destination: string; totalDesiKg: number; palletCount: number }): Promise<GpslinePriceEstimate> {
    const { data, error } = await supabase.rpc("rex_calculate_gpsline_price" as never, {
      p_origin: input.origin,
      p_destination: input.destination,
      p_total_desi_kg: input.totalDesiKg,
      p_pallet_count: input.palletCount,
    } as never);
    if (error) throw error;
    return data as unknown as GpslinePriceEstimate;
  },
};
