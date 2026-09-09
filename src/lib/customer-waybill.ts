import { generateWaybill } from "@/components/WaybillGenerator";
import type { CustomerPortalProfile, CustomerShipment } from "@/services/customerPortalService";

export async function downloadCustomerWaybill(shipment: CustomerShipment, profile: CustomerPortalProfile) {
  await generateWaybill({
    shipment_code: shipment.shipment_code,
    tracking_number: shipment.tracking_number,
    tracking_url: `${window.location.origin}/takip/${encodeURIComponent(shipment.tracking_number)}`,
    pickup_date: shipment.pickup_date,
    estimated_delivery_date: shipment.estimated_delivery_date,
    customer_name: profile.name,
    sender_name: shipment.sender_name,
    origin: shipment.origin,
    receiver: shipment.receiver,
    receiver_district: shipment.receiver_district,
    destination: shipment.destination,
    cargo_items: shipment.cargo_items,
    toplam_kg_ds: shipment.toplam_kg_ds,
    adet: shipment.adet,
    cinsi: shipment.cinsi,
    kg_ds: shipment.kg_ds,
  });
}
