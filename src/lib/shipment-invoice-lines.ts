import { getShipmentInvoiceBaseAmount } from "@/lib/shipment-invoice-amount";

type RelatedStop = {
  company_name?: string | null;
  district?: string | null;
  city?: string | null;
};

type CargoItem = {
  adet?: number | null;
  cinsi?: string | null;
  birim_fiyat?: number | null;
  alt_toplam_fiyat?: number | null;
  route_description?: string | null;
  pickup_stop?: RelatedStop | RelatedStop[] | null;
  delivery_stop?: RelatedStop | RelatedStop[] | null;
};

export type ShipmentInvoiceLine = {
  productCode: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatRate: number;
  exemptionCode: string | null;
};

const relation = (value: RelatedStop | RelatedStop[] | null | undefined) =>
  Array.isArray(value) ? value[0] : value;

const stopLabel = (stopValue: CargoItem["pickup_stop"], fallback: string) => {
  const stop = relation(stopValue);
  if (!stop) return fallback;
  const place = [stop.district, stop.city].filter(Boolean).join(" / ");
  return [stop.company_name, place].filter(Boolean).join(" · ") || fallback;
};

export const getShipmentInvoiceLines = (shipment: any): ShipmentInvoiceLine[] => {
  const isExpress = shipment?.service_mode === "international_express";
  const cargoItems = (shipment?.shipment_cargo_items || []) as CargoItem[];
  const pricedItems = cargoItems.filter((item) => Number(item.alt_toplam_fiyat || 0) > 0 || Number(item.birim_fiyat || 0) > 0);

  if (pricedItems.length === 0) {
    return [{
      productCode: isExpress ? "HZM000021" : "HZM000002",
      description: `${shipment?.shipment_code || "Sevkiyat"} taşıma hizmeti (${shipment?.origin || ""} → ${shipment?.destination || ""})`.trim(),
      quantity: 1,
      unit: "Adet",
      unitPrice: getShipmentInvoiceBaseAmount(shipment),
      vatRate: isExpress ? 0 : 20,
      exemptionCode: isExpress ? "311" : null,
    }];
  }

  return pricedItems.map((item, index) => {
    const quantity = Math.max(Number(item.adet || 1), 1);
    const lineTotal = Number(item.alt_toplam_fiyat || 0);
    const unitPrice = Number(item.birim_fiyat || 0) > 0 ? Number(item.birim_fiyat) : lineTotal / quantity;
    const pickup = stopLabel(item.pickup_stop, shipment?.origin || "Alım noktası");
    const delivery = stopLabel(item.delivery_stop, shipment?.destination || "Teslim noktası");
    const parts = [
      `${shipment?.shipment_code || "Sevkiyat"} · ${item.cinsi || `Yük ${index + 1}`}`,
      `${pickup} → ${delivery}`,
      item.route_description,
    ].filter(Boolean);
    return {
      productCode: isExpress ? "HZM000021" : "HZM000002",
      description: parts.join(" · "),
      quantity,
      unit: "Adet",
      unitPrice,
      vatRate: isExpress ? 0 : 20,
      exemptionCode: isExpress ? "311" : null,
    };
  });
};
