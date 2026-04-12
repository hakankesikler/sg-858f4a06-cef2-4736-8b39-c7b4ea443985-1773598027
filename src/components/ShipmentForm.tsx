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
  const [pickupDate, setPickupDate] = useState<Date>();
  const [deliveryDate, setDeliveryDate] = useState<Date>();
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState<Date>();
  
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
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
    price: "",
    currency: "TRY",
    payment_status: "beklemede",
    status: "beklemede",
    notes: ""
  });

  useEffect(() => {
    if (isOpen) {
      loadSelectionData();
      if (!editMode) {
        loadNextShipmentCode();
      }
    }
  }, [isOpen, editMode]);

  useEffect(() => {
    if (editMode && initialData && isOpen) {
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
        price: initialData.price?.toString() || "",
        currency: initialData.currency || "TRY",
        payment_status: initialData.payment_status || "beklemede",
        status: initialData.status || "beklemede",
        notes: initialData.notes || ""
      });
      if (initialData.pickup_date) setPickupDate(new Date(initialData.pickup_date));
      if (initialData.delivery_date) setDeliveryDate(new Date(initialData.delivery_date));
      if (initialData.estimated_delivery_date) setEstimatedDeliveryDate(new Date(initialData.estimated_delivery_date));
    } else if (!editMode && isOpen) {
      resetForm();
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
      
      const submitData: Shipment = {
        shipment_code: shipmentCode,
        driver_id: formData.driver_id || null,
        vehicle_id: formData.vehicle_id || null,
        customer_id: formData.customer_id || null,
        origin: formData.origin,
        destination: formData.destination,
        pickup_date: pickupDate ? format(pickupDate, "yyyy-MM-dd") : null,
        delivery_date: deliveryDate ? format(deliveryDate, "yyyy-MM-dd") : null,
        estimated_delivery_date: estimatedDeliveryDate ? format(estimatedDeliveryDate, "yyyy-MM-dd") : null,
        cargo_type: formData.cargo_type || null,
        cargo_weight: formData.cargo_weight ? parseFloat(formData.cargo_weight) : null,
        cargo_volume: formData.cargo_volume ? parseFloat(formData.cargo_volume) : null,
        cargo_description: formData.cargo_description || null,
        price: formData.price ? parseFloat(formData.price) : null,
        currency: formData.currency,
        payment_status: formData.payment_status,
        status: formData.status,
        notes: formData.notes || null
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
      price: "",
      currency: "TRY",
      payment_status: "beklemede",
      status: "beklemede",
      notes: ""
    });
    setPickupDate(undefined);
    setDeliveryDate(undefined);
    setEstimatedDeliveryDate(undefined);
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {pickupDate ? format(pickupDate, "PPP", { locale: tr }) : "Tarih seçin"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar 
                    mode="single" 
                    selected={pickupDate} 
                    onSelect={setPickupDate} 
                    locale={tr}
                    captionLayout="dropdown-buttons"
                    fromYear={2020}
                    toYear={2035}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Tahmini Teslim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {estimatedDeliveryDate ? format(estimatedDeliveryDate, "PPP", { locale: tr }) : "Tarih seçin"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar 
                    mode="single" 
                    selected={estimatedDeliveryDate} 
                    onSelect={setEstimatedDeliveryDate} 
                    locale={tr}
                    captionLayout="dropdown-buttons"
                    fromYear={2020}
                    toYear={2035}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Teslim Tarihi</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deliveryDate ? format(deliveryDate, "PPP", { locale: tr }) : "Tarih seçin"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar 
                    mode="single" 
                    selected={deliveryDate} 
                    onSelect={setDeliveryDate} 
                    locale={tr}
                    captionLayout="dropdown-buttons"
                    fromYear={2020}
                    toYear={2035}
                  />
                </PopoverContent>
              </Popover>
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