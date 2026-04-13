import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { shipmentService, Shipment } from "@/services/shipmentService";
import { driverService, Driver } from "@/services/driverService";
import { vehicleService, Vehicle } from "@/services/vehicleService";
import { crmService, Customer } from "@/services/crmService";

interface ShipmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editMode?: boolean;
  initialData?: any;
}

export function ShipmentForm({ isOpen, onClose, onSuccess, editMode = false, initialData }: ShipmentFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shipmentCode, setShipmentCode] = useState("SHP-000001");
  const [pickupDate, setPickupDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState("");
  
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    driver_id: "",
    vehicle_id: "",
    customer_id: "",
    origin: "",
    destination: "",
    cargo_type: "",
    cargo_weight: "",
    cargo_volume: "",
    cargo_description: "",
    cost: "",
    cost_currency: "TRY",
    price: "",
    currency: "TRY",
    payment_status: "beklemede",
    status: "beklemede",
    notes: "",
    sender_name: "",
    sender_ii: "",
    receiver: "",
    receiver_district: "",
    receiver_ii: "",
    adet: "",
    cinsi: "",
    kg_ds: "",
    toplam_kg_ds: "",
    satis_birim: "",
    satis_tutar: "",
    mali: "nakit"
  });

  useEffect(() => {
    if (isOpen) {
      loadSelectionData();
      if (!editMode) {
        loadNextShipmentCode();
      }
    }
  }, [isOpen, editMode]);

  // Auto-calculate toplam_kg_ds (adet * kg_ds)
  useEffect(() => {
    const adet = parseFloat(formData.adet) || 0;
    const kgDs = parseFloat(formData.kg_ds) || 0;
    const toplam = adet * kgDs;
    
    if (toplam > 0 && toplam.toString() !== formData.toplam_kg_ds) {
      setFormData(prev => ({ ...prev, toplam_kg_ds: toplam.toFixed(2) }));
    }
  }, [formData.adet, formData.kg_ds]);

  // Auto-calculate satis_tutar (adet * satis_birim)
  useEffect(() => {
    const adet = parseFloat(formData.adet) || 0;
    const birim = parseFloat(formData.satis_birim) || 0;
    const tutar = adet * birim;
    
    if (tutar > 0 && tutar.toString() !== formData.satis_tutar) {
      setFormData(prev => ({ ...prev, satis_tutar: tutar.toFixed(2) }));
    }
  }, [formData.adet, formData.satis_birim]);

  useEffect(() => {
    if (editMode && initialData && isOpen) {
      console.log("Loading shipment data for edit:", initialData);
      setShipmentCode(initialData.shipment_code || "SHP-000001");
      setFormData({
        driver_id: initialData.driver_id || "",
        vehicle_id: initialData.vehicle_id || "",
        customer_id: initialData.customer_id || "",
        origin: initialData.origin || "",
        destination: initialData.destination || "",
        cargo_type: initialData.cargo_type || "",
        cargo_weight: initialData.cargo_weight?.toString() || "",
        cargo_volume: initialData.cargo_volume?.toString() || "",
        cargo_description: initialData.cargo_description || "",
        cost: initialData.cost?.toString() || "",
        cost_currency: initialData.cost_currency || "TRY",
        price: initialData.price?.toString() || "",
        currency: initialData.currency || "TRY",
        payment_status: initialData.payment_status || "beklemede",
        status: initialData.status || "beklemede",
        notes: initialData.notes || "",
        sender_name: initialData.sender_name || "",
        sender_ii: initialData.sender_ii || "",
        receiver: initialData.receiver || "",
        receiver_district: initialData.receiver_district || "",
        receiver_ii: initialData.receiver_ii || "",
        adet: initialData.adet?.toString() || "",
        cinsi: initialData.cinsi || "",
        kg_ds: initialData.kg_ds?.toString() || "",
        toplam_kg_ds: initialData.toplam_kg_ds?.toString() || "",
        satis_birim: initialData.satis_birim?.toString() || "",
        satis_tutar: initialData.satis_tutar?.toString() || "",
        mali: initialData.mali || "nakit"
      });
      
      // Handle date conversions
      if (initialData.pickup_date) {
        const dateValue = initialData.pickup_date;
        setPickupDate(dateValue.includes('T') ? dateValue.split('T')[0] : dateValue);
      } else {
        setPickupDate("");
      }
      if (initialData.delivery_date) {
        const dateValue = initialData.delivery_date;
        setDeliveryDate(dateValue.includes('T') ? dateValue.split('T')[0] : dateValue);
      } else {
        setDeliveryDate("");
      }
      if (initialData.estimated_delivery_date) {
        const dateValue = initialData.estimated_delivery_date;
        setEstimatedDeliveryDate(dateValue.includes('T') ? dateValue.split('T')[0] : dateValue);
      } else {
        setEstimatedDeliveryDate("");
      }
    } else if (!editMode && isOpen) {
      resetForm();
      loadNextShipmentCode();
    }
  }, [editMode, initialData, isOpen]);

  const loadSelectionData = async () => {
    try {
      const [driversData, vehiclesData, customersData] = await Promise.all([
        driverService.getDrivers(),
        vehicleService.getVehicles(),
        crmService.getCustomers()
      ]);
      setDrivers(driversData);
      setVehicles(vehiclesData);
      setCustomers(customersData);
    } catch (error) {
      console.error("Error loading selection data:", error);
    }
  };

  const loadNextShipmentCode = async () => {
    try {
      const nextCode = await shipmentService.getNextShipmentCode();
      setShipmentCode(nextCode);
    } catch (error) {
      console.error("Error loading next shipment code:", error);
      setShipmentCode("SHP-000001");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.origin || !formData.destination) {
      toast({
        title: "Hata",
        description: "Lütfen çıkış ve varış noktalarını girin",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const submitData = {
        shipment_code: shipmentCode,
        driver_id: formData.driver_id || null,
        vehicle_id: formData.vehicle_id || null,
        customer_id: formData.customer_id || null,
        origin: formData.origin,
        destination: formData.destination,
        pickup_date: pickupDate || null,
        delivery_date: deliveryDate || null,
        estimated_delivery_date: estimatedDeliveryDate || null,
        cargo_type: formData.cargo_type || null,
        cargo_weight: formData.cargo_weight ? parseFloat(formData.cargo_weight) : null,
        cargo_volume: formData.cargo_volume ? parseFloat(formData.cargo_volume) : null,
        cargo_description: formData.cargo_description || null,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        cost_currency: formData.cost_currency,
        price: formData.price ? parseFloat(formData.price) : null,
        currency: formData.currency,
        payment_status: formData.payment_status,
        status: formData.status,
        notes: formData.notes || null,
        sender_name: formData.sender_name || null,
        sender_ii: formData.sender_ii || null,
        receiver: formData.receiver || null,
        receiver_district: formData.receiver_district || null,
        receiver_ii: formData.receiver_ii || null,
        adet: formData.adet ? parseInt(formData.adet) : null,
        cinsi: formData.cinsi || null,
        kg_ds: formData.kg_ds ? parseFloat(formData.kg_ds) : null,
        toplam_kg_ds: formData.toplam_kg_ds ? parseFloat(formData.toplam_kg_ds) : null,
        satis_birim: formData.satis_birim ? parseFloat(formData.satis_birim) : null,
        satis_tutar: formData.satis_tutar ? parseFloat(formData.satis_tutar) : null,
        mali: formData.mali || null
      };

      if (editMode && initialData) {
        await shipmentService.updateShipment(initialData.id, submitData);
        toast({
          title: "Başarılı",
          description: "Sevkiyat başarıyla güncellendi",
        });
      } else {
        await shipmentService.createShipment(submitData);
        toast({
          title: "Başarılı",
          description: "Sevkiyat başarıyla oluşturuldu",
        });
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error("Submit error:", error);
      toast({
        title: "Hata",
        description: error?.message || "Sevkiyat kaydedilirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      driver_id: "",
      vehicle_id: "",
      customer_id: "",
      origin: "",
      destination: "",
      cargo_type: "",
      cargo_weight: "",
      cargo_volume: "",
      cargo_description: "",
      cost: "",
      cost_currency: "TRY",
      price: "",
      currency: "TRY",
      payment_status: "beklemede",
      status: "beklemede",
      notes: "",
      sender_name: "",
      sender_ii: "",
      receiver: "",
      receiver_district: "",
      receiver_ii: "",
      adet: "",
      cinsi: "",
      kg_ds: "",
      toplam_kg_ds: "",
      satis_birim: "",
      satis_tutar: "",
      mali: "nakit"
    });
    setPickupDate("");
    setDeliveryDate("");
    setEstimatedDeliveryDate("");
    setShipmentCode("SHP-000001");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editMode ? "Sevkiyat Düzenle" : "Yeni Sevkiyat Oluştur"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sevkiyat Kodu */}
          <div className="space-y-2">
            <Label>Sevkiyat Kodu</Label>
            <Input value={shipmentCode} disabled className="bg-gray-50" />
          </div>

          {/* Sürücü, Araç, Müşteri Seçimi */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Sürücü</Label>
              <Select value={formData.driver_id} onValueChange={(value) => setFormData({ ...formData, driver_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sürücü seçin" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id!}>
                      {driver.driver_code} - {driver.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Araç</Label>
              <Select value={formData.vehicle_id} onValueChange={(value) => setFormData({ ...formData, vehicle_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Araç seçin" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id!}>
                      {vehicle.vehicle_code} - {vehicle.cekici_plakasi}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Müşteri</Label>
              <Select value={formData.customer_id} onValueChange={(value) => setFormData({ ...formData, customer_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Müşteri seçin" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id!}>
                      {customer.customer_code} - {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Maliyet Bilgileri */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Maliyet (Size Olan Maliyet)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Para Birimi</Label>
              <Select value={formData.cost_currency} onValueChange={(value) => setFormData({ ...formData, cost_currency: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRY">TRY</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Gönderici ve Alıcı Bilgileri */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-4">Gönderici ve Alıcı Detayları</h3>
            <div className="grid grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Gönderici Adı/Firma</Label>
                <Input
                  value={formData.sender_name}
                  onChange={(e) => setFormData({ ...formData, sender_name: e.target.value })}
                  placeholder="Gönderici adı veya firma"
                />
              </div>
              <div className="space-y-2">
                <Label>Gönderici II</Label>
                <Input
                  value={formData.sender_ii}
                  onChange={(e) => setFormData({ ...formData, sender_ii: e.target.value })}
                  placeholder="İkinci gönderici (opsiyonel)"
                />
              </div>
              <div className="space-y-2">
                <Label>Alıcı Adı/Firma</Label>
                <Input
                  value={formData.receiver}
                  onChange={(e) => setFormData({ ...formData, receiver: e.target.value })}
                  placeholder="Alıcı adı veya firma"
                />
              </div>
              <div className="space-y-2">
                <Label>Alıcı İlçe</Label>
                <Input
                  value={formData.receiver_district}
                  onChange={(e) => setFormData({ ...formData, receiver_district: e.target.value })}
                  placeholder="İlçe"
                />
              </div>
              <div className="space-y-2">
                <Label>Alıcı II</Label>
                <Input
                  value={formData.receiver_ii}
                  onChange={(e) => setFormData({ ...formData, receiver_ii: e.target.value })}
                  placeholder="İkinci alıcı (opsiyonel)"
                />
              </div>
            </div>
          </div>

          {/* Yük Detayları - Adet, Cinsi, KG/DS */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-4">Yük Detayları</h3>
            <div className="grid grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Adet</Label>
                <Input
                  type="number"
                  value={formData.adet}
                  onChange={(e) => setFormData({ ...formData, adet: e.target.value })}
                  placeholder="Koli/paket sayısı"
                />
              </div>
              <div className="space-y-2">
                <Label>Cinsi</Label>
                <Input
                  value={formData.cinsi}
                  onChange={(e) => setFormData({ ...formData, cinsi: e.target.value })}
                  placeholder="Yük cinsi"
                />
              </div>
              <div className="space-y-2">
                <Label>KG/DS (Birim)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.kg_ds}
                  onChange={(e) => setFormData({ ...formData, kg_ds: e.target.value })}
                  placeholder="Birim ağırlık"
                />
              </div>
              <div className="space-y-2">
                <Label>Toplam KG/DS</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.toplam_kg_ds}
                  disabled
                  className="bg-gray-100"
                  placeholder="Otomatik hesaplanır"
                />
                <p className="text-xs text-gray-500">Adet × KG/DS</p>
              </div>
              <div className="space-y-2">
                <Label>Mali Durum</Label>
                <Select value={formData.mali} onValueChange={(value) => setFormData({ ...formData, mali: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nakit">Nakit</SelectItem>
                    <SelectItem value="kredi_karti">Kredi Kartı</SelectItem>
                    <SelectItem value="havale">Havale/EFT</SelectItem>
                    <SelectItem value="cek">Çek</SelectItem>
                    <SelectItem value="acik_hesap">Açık Hesap</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Satış Bilgileri */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-4">Satış Bilgileri</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Satış Birim (Fiyat)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.satis_birim}
                  onChange={(e) => setFormData({ ...formData, satis_birim: e.target.value })}
                  placeholder="Birim fiyat"
                />
              </div>
              <div className="space-y-2">
                <Label>Satış Tutar (Toplam)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.satis_tutar}
                  disabled
                  className="bg-gray-100"
                  placeholder="Otomatik hesaplanır"
                />
                <p className="text-xs text-gray-500">Adet × Birim Fiyat</p>
              </div>
              <div className="space-y-2">
                <Label>Para Birimi</Label>
                <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRY">TRY</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Rota Bilgileri */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-4">Rota Bilgileri</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Çıkış Noktası *</Label>
                <Input
                  value={formData.origin}
                  onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                  placeholder="Örn: İzmir"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Varış Noktası *</Label>
                <Input
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  placeholder="Örn: Ankara"
                  required
                />
              </div>
            </div>
          </div>

          {/* Tarih Bilgileri */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Yükleme Tarihi</Label>
              <Input
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label>Tahmini Teslim</Label>
              <Input
                type="date"
                value={estimatedDeliveryDate}
                onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label>Teslim Tarihi</Label>
              <Input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Yük Bilgileri */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-4">Yük Bilgileri</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="space-y-2">
                <Label>Yük Tipi</Label>
                <Input
                  value={formData.cargo_type}
                  onChange={(e) => setFormData({ ...formData, cargo_type: e.target.value })}
                  placeholder="Örn: Palet, Koli"
                />
              </div>
              <div className="space-y-2">
                <Label>Ağırlık (kg)</Label>
                <Input
                  type="number"
                  value={formData.cargo_weight}
                  onChange={(e) => setFormData({ ...formData, cargo_weight: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Hacim (m³)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.cargo_volume}
                  onChange={(e) => setFormData({ ...formData, cargo_volume: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Yük Açıklaması</Label>
              <Textarea
                value={formData.cargo_description}
                onChange={(e) => setFormData({ ...formData, cargo_description: e.target.value })}
                placeholder="Yük hakkında detaylı bilgi..."
                rows={3}
              />
            </div>
          </div>

          {/* Finansal Bilgiler */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-4">Finansal Bilgiler</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Fiyat</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Para Birimi</Label>
                <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRY">TRY</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ödeme Durumu</Label>
                <Select value={formData.payment_status} onValueChange={(value) => setFormData({ ...formData, payment_status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beklemede">Beklemede</SelectItem>
                    <SelectItem value="kismen_odendi">Kısmen Ödendi</SelectItem>
                    <SelectItem value="odendi">Ödendi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Durum ve Notlar */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sevkiyat Durumu</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beklemede">Beklemede</SelectItem>
                  <SelectItem value="hazırlaniyor">Hazırlanıyor</SelectItem>
                  <SelectItem value="yolda">Yolda</SelectItem>
                  <SelectItem value="teslim_edildi">Teslim Edildi</SelectItem>
                  <SelectItem value="iptal">İptal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notlar</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Ek notlar..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Kaydediliyor..." : editMode ? "Güncelle" : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}