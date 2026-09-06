type CargoAmountSource = {
  adet?: number | string | null;
  birim_fiyat?: number | string | null;
  alt_toplam_fiyat?: number | string | null;
};

type ShipmentAmountSource = {
  satis_tutar?: number | string | null;
  totalAmount?: number | string | null;
  shipment_cargo_items?: CargoAmountSource[] | null;
};

const positiveAmount = (value: unknown) => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
};

export function getShipmentInvoiceBaseAmount(shipment?: ShipmentAmountSource | null) {
  const recordedSalesAmount = positiveAmount(shipment?.satis_tutar);
  if (recordedSalesAmount > 0) return recordedSalesAmount;

  const suppliedTotal = positiveAmount(shipment?.totalAmount);
  if (suppliedTotal > 0) return suppliedTotal;

  return Number(((shipment?.shipment_cargo_items || []).reduce((sum, cargo) => {
    const lineTotal = positiveAmount(cargo.alt_toplam_fiyat)
      || positiveAmount(cargo.adet) * positiveAmount(cargo.birim_fiyat);
    return sum + lineTotal;
  }, 0)).toFixed(2));
}
