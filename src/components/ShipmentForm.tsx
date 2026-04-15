import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { CalendarIcon, Plus, Trash2, Check, ChevronsUpDown } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { shipmentService, Shipment } from "@/services/shipmentService";
import { shipmentCargoService, type CargoItemInput } from "@/services/shipmentCargoService";
import { driverService, Driver } from "@/services/driverService";
import { vehicleService, Vehicle } from "@/services/vehicleService";
import { crmService, Customer } from "@/services/crmService";
import { cn } from "@/lib/utils";

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
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState("");
  
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  
  // Suggestions from past shipments
  const [senderSuggestions, setSenderSuggestions] = useState<string[]>([]);
  const [receiverSuggestions, setReceiverSuggestions] = useState<string[]>([]);
  const [districtSuggestions, setDistrictSuggestions] = useState<string[]>([]);
  const [originSuggestions, setOriginSuggestions] = useState<string[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<string[]>([]);
  
  // Combobox open states
  const [openSupplier, setOpenSupplier] = useState(false);
  const [openDriver, setOpenDriver] = useState(false);
  const [openVehicle, setOpenVehicle] = useState(false);
  const [openCustomer, setOpenCustomer] = useState(false);
  
  // Cargo items state
  const [cargoItems, setCargoItems] = useState<CargoItemInput[]>([
    { adet: 0, cinsi: "", kg_ds: 0, birim_fiyat: 0, alt_toplam_fiyat: 0, sira_no: 1 }
  ]);
  
  // Manual total price for reverse calculation
  const [manualTotalPrice, setManualTotalPrice] = useState<string>("");
  
  const [formData, setFormData] = useState({
    supplier_id: "",
    driver_id: "",
    vehicle_id: "",
    customer_id: "",
    origin: "",
    destination: "",
    cost: "",
    cost_currency: "TRY",
    currency: "TRY",
    sender_name: "",
    sender_ii: "",
    receiver: "",
    receiver_district: "",
    receiver_ii: "",
    adet: "",
    cinsi: "",
    kg_ds: "",
    toplam_kg_ds: ""
  });

  // Cargo items management functions
  const addCargoItem = () => {
    setCargoItems([...cargoItems, { 
      adet: 0, 
      cinsi: "", 
      kg_ds: 0, 
      birim_fiyat: 0,
      alt_toplam_fiyat: 0,
      sira_no: cargoItems.length + 1 
    }]);
  };

  const removeCargoItem = (index: number) => {
    if (cargoItems.length > 1) {
      const updated = cargoItems.filter((_, i) => i !== index);
      // Update sira_no after removal
      updated.forEach((item, idx) => {
        item.sira_no = idx + 1;
      });
      setCargoItems(updated);
    }
  };

  const updateCargoItem = (index: number, field: keyof CargoItemInput, value: string | number) => {
    const updated = [...cargoItems];
    if (field === 'adet') {
      updated[index].adet = typeof value === 'string' ? parseInt(value) || 0 : value;
    } else if (field === 'cinsi') {
      updated[index].cinsi = value.toString();
    } else if (field === 'kg_ds') {
      updated[index].kg_ds = typeof value === 'string' ? parseFloat(value) || 0 : value;
    } else if (field === 'birim_fiyat') {
      updated[index].birim_fiyat = typeof value === 'string' ? parseFloat(value) || 0 : value;
    }
    
    // Auto-calculate alt_toplam_fiyat (adet × birim_fiyat)
    updated[index].alt_toplam_fiyat = updated[index].adet * (updated[index].birim_fiyat || 0);
    
    setCargoItems(updated);
  };

  // Calculate total KG/DS from all cargo items
  const totalKgDs = cargoItems.reduce((sum, item) => {
    return sum + (item.adet * item.kg_ds);
  }, 0);

  // Calculate total price from all cargo items
  const totalPrice = cargoItems.reduce((sum, item) => {
    return sum + (item.alt_toplam_fiyat || 0);
  }, 0);

  // Distribute total price across cargo items based on KG/DS weight
  const distributePrice = () => {
    const targetTotal = parseFloat(manualTotalPrice);
    
    if (!targetTotal || targetTotal <= 0 || totalKgDs <= 0) {
      return;
    }

    // Calculate price per kg
    const pricePerKg = targetTotal / totalKgDs;

    // Update each cargo item
    const updated = cargoItems.map(item => {
      const itemTotalKg = item.adet * item.kg_ds;
      const itemTotalPrice = itemTotalKg * pricePerKg;
      const itemUnitPrice = item.adet > 0 ? itemTotalPrice / item.adet : 0;

      return {
        ...item,
        birim_fiyat: parseFloat(itemUnitPrice.toFixed(2)),
        alt_toplam_fiyat: parseFloat(itemTotalPrice.toFixed(2))
      };
    });

    setCargoItems(updated);
  };

  // Auto-distribute when manual total price changes
  useEffect(() => {
    if (manualTotalPrice && parseFloat(manualTotalPrice) > 0) {
      // Check if all birim_fiyat are zero or empty
      const allBirimFiyatEmpty = cargoItems.every(item => !item.birim_fiyat || item.birim_fiyat === 0);
      
      if (allBirimFiyatEmpty && totalKgDs > 0) {
        distributePrice();
      }
    }
  }, [manualTotalPrice]);

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

  useEffect(() => {
    if (editMode && initialData && isOpen) {
      console.log("Loading shipment data for edit:", initialData);
      setShipmentCode(initialData.shipment_code || "SHP-000001");
      setFormData({
        supplier_id: initialData.supplier_id || "",
        driver_id: initialData.driver_id || "",
        vehicle_id: initialData.vehicle_id || "",
        customer_id: initialData.customer_id || "",
        origin: initialData.origin || "",
        destination: initialData.destination || "",
        cost: initialData.cost?.toString() || "",
        cost_currency: initialData.cost_currency || "TRY",
        currency: initialData.currency || "TRY",
        sender_name: initialData.sender_name || "",
        sender_ii: initialData.sender_ii || "",
        receiver: initialData.receiver || "",
        receiver_district: initialData.receiver_district || "",
        receiver_ii: initialData.receiver_ii || "",
        adet: initialData.adet?.toString() || "",
        cinsi: initialData.cinsi || "",
        kg_ds: initialData.kg_ds?.toString() || "",
        toplam_kg_ds: initialData.toplam_kg_ds?.toString() || ""
      });
      
      // Load cargo items
      loadCargoItems(initialData.id);
      
      // Handle date conversions
      if (initialData.pickup_date) {
        const dateValue = initialData.pickup_date;
        setPickupDate(dateValue.includes('T') ? dateValue.split('T')[0] : dateValue);
      } else {
        setPickupDate("");
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

  const loadCargoItems = async (shipmentId: string) => {
    try {
      const items = await shipmentCargoService.getCargoItems(shipmentId);
      if (items.length > 0) {
        setCargoItems(items.map(item => ({
          adet: item.adet,
          cinsi: item.cinsi,
          kg_ds: item.kg_ds,
          birim_fiyat: item.birim_fiyat || 0,
          alt_toplam_fiyat: item.alt_toplam_fiyat || 0,
          sira_no: item.sira_no
        })));
      } else {
        setCargoItems([{ adet: 0, cinsi: "", kg_ds: 0, birim_fiyat: 0, alt_toplam_fiyat: 0, sira_no: 1 }]);
      }
    } catch (error) {
      console.error("Error loading cargo items:", error);
      setCargoItems([{ adet: 0, cinsi: "", kg_ds: 0, birim_fiyat: 0, alt_toplam_fiyat: 0, sira_no: 1 }]);
    }
  };

  const loadSelectionData = async () => {
    try {
      const [driversData, vehiclesData, customersData] = await Promise.all([
        driverService.getDrivers(),
        vehicleService.getVehicles(),
        crmService.getCustomers()
      ]);
      setDrivers(driversData);
      setVehicles(vehiclesData);
      
      // Filter customers by account_type, but include currently selected ones in edit mode
      const customersList = customersData.filter(c => {
        const isMusteri = c.account_type === "musteri" || !c.account_type;
        const isCurrentlySelected = editMode && initialData?.customer_id === c.id;
        return isMusteri || isCurrentlySelected;
      });
      
      const suppliersList = customersData.filter(c => {
        const isTedarikci = c.account_type === "tedarikci";
        const isCurrentlySelected = editMode && initialData?.supplier_id === c.id;
        return isTedarikci || isCurrentlySelected;
      });
      
      setCustomers(customersList);
      setSuppliers(suppliersList);
      
      // Load suggestions from past shipments
      await loadSuggestions();
    } catch (error) {
      console.error("Error loading selection data:", error);
    }
  };

  const loadSuggestions = async () => {
    try {
      const shipments = await shipmentService.getShipments();
      
      // Extract unique sender names
      const senders = [...new Set(
        shipments
          .map(s => s.sender_name)
          .filter(Boolean)
      )].sort();
      
      // Extract unique receiver names
      const receivers = [...new Set(
        shipments
          .map(s => s.receiver)
          .filter(Boolean)
      )].sort();
      
      // Extract unique receiver districts
      const districts = [...new Set(
        shipments
          .map(s => s.receiver_district)
          .filter(Boolean)
      )].sort();
      
      // Extract unique origin cities (gönderici il)
      const origins = [...new Set(
        shipments
          .map(s => s.origin)
          .filter(Boolean)
      )].sort();
      
      // Extract unique destination cities (alıcı il)
      const destinations = [...new Set(
        shipments
          .map(s => s.destination)
          .filter(Boolean)
      )].sort();
      
      setSenderSuggestions(senders);
      setReceiverSuggestions(receivers);
      setDistrictSuggestions(districts);
      setOriginSuggestions(origins);
      setDestinationSuggestions(destinations);
    } catch (error) {
      console.error("Error loading suggestions:", error);
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

  const handleCustomerChange = (customerId: string) => {
    setFormData({ ...formData, customer_id: customerId });
    
    // Auto-fill sender/receiver details from selected customer
    const selectedCustomer = customers.find(c => c.id === customerId);
    if (selectedCustomer && !editMode) {
      // Only auto-fill if not in edit mode (don't overwrite existing data)
      const customerName = selectedCustomer.name || "";
      const customerCity = selectedCustomer.city || "";
      const customerDistrict = selectedCustomer.district || "";
      
      // Auto-fill sender if empty
      if (!formData.sender_name) {
        setFormData(prev => ({
          ...prev,
          customer_id: customerId,
          sender_name: customerName
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      
      const submitData = {
        shipment_code: shipmentCode,
        supplier_id: formData.supplier_id || (editMode && initialData ? initialData.supplier_id : null),
        driver_id: formData.driver_id || (editMode && initialData ? initialData.driver_id : null),
        vehicle_id: formData.vehicle_id || (editMode && initialData ? initialData.vehicle_id : null),
        customer_id: formData.customer_id || (editMode && initialData ? initialData.customer_id : null),
        origin: formData.origin || (editMode && initialData ? initialData.origin : null),
        destination: formData.destination || (editMode && initialData ? initialData.destination : null),
        pickup_date: pickupDate || (editMode && initialData ? initialData.pickup_date : null),
        estimated_delivery_date: estimatedDeliveryDate || (editMode && initialData ? initialData.estimated_delivery_date : null),
        cost: formData.cost ? parseFloat(formData.cost) : (editMode && initialData && initialData.cost ? initialData.cost : null),
        cost_currency: formData.cost_currency,
        currency: formData.currency,
        status: editMode && initialData?.status ? initialData.status : "beklemede",
        sender_name: formData.sender_name || (editMode && initialData ? initialData.sender_name : null),
        sender_ii: formData.sender_ii || (editMode && initialData ? initialData.sender_ii : null),
        receiver: formData.receiver || (editMode && initialData ? initialData.receiver : null),
        receiver_district: formData.receiver_district || (editMode && initialData ? initialData.receiver_district : null),
        receiver_ii: formData.receiver_ii || (editMode && initialData ? initialData.receiver_ii : null),
        adet: formData.adet ? parseInt(formData.adet) : (editMode && initialData && initialData.adet ? initialData.adet : null),
        cinsi: formData.cinsi || (editMode && initialData ? initialData.cinsi : null),
        kg_ds: formData.kg_ds ? parseFloat(formData.kg_ds) : (editMode && initialData && initialData.kg_ds ? initialData.kg_ds : null),
        toplam_kg_ds: totalKgDs
      };

      let shipmentId: string;

      if (editMode && initialData) {
        await shipmentService.updateShipment(initialData.id, submitData);
        shipmentId = initialData.id;
        
        // Update cargo items
        await shipmentCargoService.updateCargoItems(shipmentId, cargoItems);
        
        toast({
          title: "Başarılı",
          description: "Sevkiyat başarıyla güncellendi",
        });
      } else {
        const created = await shipmentService.createShipment(submitData);
        shipmentId = created.id;
        
        // Create cargo items
        await shipmentCargoService.createCargoItems(shipmentId, cargoItems);
        
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
      supplier_id: "",
      driver_id: "",
      vehicle_id: "",
      customer_id: "",
      origin: "",
      destination: "",
      cost: "",
      cost_currency: "TRY",
      currency: "TRY",
      sender_name: "",
      sender_ii: "",
      receiver: "",
      receiver_district: "",
      receiver_ii: "",
      adet: "",
      cinsi: "",
      kg_ds: "",
      toplam_kg_ds: ""
    });
    setPickupDate("");
    setEstimatedDeliveryDate("");
    setShipmentCode("SHP-000001");
    setCargoItems([{ adet: 0, cinsi: "", kg_ds: 0, birim_fiyat: 0, alt_toplam_fiyat: 0, sira_no: 1 }]);
    setManualTotalPrice("");
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

          {/* Tedarikçi, Sürücü, Araç Seçimi */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tedarikçi</Label>
              <Popover open={openSupplier} onOpenChange={setOpenSupplier}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openSupplier}
                    className="w-full justify-between"
                  >
                    {formData.supplier_id
                      ? suppliers.find((s) => s.id === formData.supplier_id)?.name
                      : "Tedarikçi seçin"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Tedarikçi ara..." />
                    <CommandList>
                      <CommandEmpty>Tedarikçi bulunamadı.</CommandEmpty>
                      <CommandGroup>
                        {suppliers.map((supplier) => (
                          <CommandItem
                            key={supplier.id}
                            value={`${supplier.customer_code}-${supplier.name}-${supplier.id}`}
                            onSelect={() => {
                              setFormData({ ...formData, supplier_id: supplier.id });
                              setOpenSupplier(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.supplier_id === supplier.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {supplier.customer_code} - {supplier.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Sürücü</Label>
              <Popover open={openDriver} onOpenChange={setOpenDriver}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openDriver}
                    className="w-full justify-between"
                  >
                    {formData.driver_id
                      ? drivers.find((d) => d.id === formData.driver_id)?.full_name
                      : "Sürücü seçin"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Sürücü ara..." />
                    <CommandList>
                      <CommandEmpty>Sürücü bulunamadı.</CommandEmpty>
                      <CommandGroup>
                        {drivers.map((driver) => (
                          <CommandItem
                            key={driver.id}
                            value={`${driver.driver_code}-${driver.full_name}-${driver.id}`}
                            onSelect={() => {
                              setFormData({ ...formData, driver_id: driver.id });
                              setOpenDriver(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.driver_id === driver.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {driver.driver_code} - {driver.full_name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Araç</Label>
              <Popover open={openVehicle} onOpenChange={setOpenVehicle}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openVehicle}
                    className="w-full justify-between"
                  >
                    {formData.vehicle_id
                      ? vehicles.find((v) => v.id === formData.vehicle_id)?.cekici_plakasi
                      : "Araç seçin"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Araç ara..." />
                    <CommandList>
                      <CommandEmpty>Araç bulunamadı.</CommandEmpty>
                      <CommandGroup>
                        {vehicles.map((vehicle) => (
                          <CommandItem
                            key={vehicle.id}
                            value={`${vehicle.vehicle_code}-${vehicle.cekici_plakasi}-${vehicle.id}`}
                            onSelect={() => {
                              setFormData({ ...formData, vehicle_id: vehicle.id });
                              setOpenVehicle(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.vehicle_id === vehicle.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {vehicle.vehicle_code} - {vehicle.cekici_plakasi}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
            
            {/* Müşteri (Ödeme Sorumlusu) */}
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div className="space-y-2">
                <Label>Müşteri (Ödeme Sorumlusu)</Label>
                <Popover open={openCustomer} onOpenChange={setOpenCustomer}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCustomer}
                      className="w-full justify-between"
                    >
                      {formData.customer_id
                        ? customers.find((c) => c.id === formData.customer_id)?.name
                        : "Müşteri seçin"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[500px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Müşteri ara..." />
                      <CommandList>
                        <CommandEmpty>Müşteri bulunamadı.</CommandEmpty>
                        <CommandGroup>
                          {customers.map((customer) => (
                            <CommandItem
                              key={customer.id}
                              value={`${customer.customer_code}-${customer.name}-${customer.id}`}
                              onSelect={() => {
                                handleCustomerChange(customer.id!);
                                setOpenCustomer(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.customer_id === customer.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {customer.customer_code} - {customer.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            {/* Gönderici ve Alıcı */}
            <div className="grid grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Gönderici Adı/Firma</Label>
                <Input
                  list="sender-suggestions"
                  value={formData.sender_name}
                  onChange={(e) => setFormData({ ...formData, sender_name: e.target.value })}
                  placeholder="Örn: Medbar A.Ş"
                />
                <datalist id="sender-suggestions">
                  {senderSuggestions.map((suggestion, idx) => (
                    <option key={idx} value={suggestion} />
                  ))}
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.name || ""} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-2">
                <Label>Gönderici İl</Label>
                <Input
                  list="origin-suggestions"
                  value={formData.origin}
                  onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                  placeholder="Örn: İzmir, Ankara"
                />
                <datalist id="origin-suggestions">
                  {originSuggestions.map((suggestion, idx) => (
                    <option key={idx} value={suggestion} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-2">
                <Label>Alıcı Adı/Firma</Label>
                <Input
                  list="receiver-suggestions"
                  value={formData.receiver}
                  onChange={(e) => setFormData({ ...formData, receiver: e.target.value })}
                  placeholder="Örn: ASG Havaleli Depo"
                />
                <datalist id="receiver-suggestions">
                  {receiverSuggestions.map((suggestion, idx) => (
                    <option key={idx} value={suggestion} />
                  ))}
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.name || ""} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-2">
                <Label>Alıcı İlçe</Label>
                <Input
                  list="district-suggestions"
                  value={formData.receiver_district}
                  onChange={(e) => setFormData({ ...formData, receiver_district: e.target.value })}
                  placeholder="Örn: SANCAKTEPE, KARTAL"
                />
                <datalist id="district-suggestions">
                  {districtSuggestions.map((suggestion, idx) => (
                    <option key={idx} value={suggestion} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-2">
                <Label>Alıcı İl</Label>
                <Input
                  list="destination-suggestions"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  placeholder="Örn: İstanbul, Ankara"
                />
                <datalist id="destination-suggestions">
                  {destinationSuggestions.map((suggestion, idx) => (
                    <option key={idx} value={suggestion} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Yük Detayları - Çoklu Satırlar */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Yük Detayları</h3>
              <Button type="button" variant="outline" size="sm" onClick={addCargoItem}>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Satır Ekle
              </Button>
            </div>

            <div className="space-y-3">
              {cargoItems.map((item, index) => (
                <div key={index} className="grid grid-cols-7 gap-3 items-end p-3 border rounded-lg bg-gray-50">
                  <div className="space-y-1">
                    <Label className="text-xs">Adet</Label>
                    <Input
                      type="number"
                      value={item.adet || ""}
                      onChange={(e) => updateCargoItem(index, 'adet', e.target.value)}
                      placeholder="10"
                      min="1"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Cinsi</Label>
                    <Input
                      value={item.cinsi}
                      onChange={(e) => updateCargoItem(index, 'cinsi', e.target.value)}
                      placeholder="Koli, Palet..."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">KG/DS (Birim)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.kg_ds || ""}
                      onChange={(e) => updateCargoItem(index, 'kg_ds', e.target.value)}
                      placeholder="30.00"
                      min="0.01"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Alt Toplam KG</Label>
                    <div className="px-3 py-2 bg-white border rounded-md font-medium text-sm">
                      {(item.adet * item.kg_ds).toFixed(2)} kg
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Birim Fiyat (₺)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.birim_fiyat || ""}
                      onChange={(e) => updateCargoItem(index, 'birim_fiyat', e.target.value)}
                      placeholder="50.00"
                      min="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Alt Toplam Fiyat</Label>
                    <div className="px-3 py-2 bg-white border rounded-md font-medium text-sm text-green-600">
                      {(item.alt_toplam_fiyat || 0).toFixed(2)} ₺
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs opacity-0">Sil</Label>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeCargoItem(index)}
                      disabled={cargoItems.length === 1}
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
              <div className="flex justify-end items-center gap-2">
                <span className="text-sm font-semibold">TOPLAM KG/DS:</span>
                <span className="text-lg font-bold text-primary">
                  {totalKgDs.toFixed(2)} kg
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-semibold whitespace-nowrap">TOPLAM FİYAT:</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={manualTotalPrice || totalPrice.toFixed(2)}
                    onChange={(e) => setManualTotalPrice(e.target.value)}
                    placeholder="Manuel toplam fiyat girin"
                    className="font-bold text-green-600"
                  />
                  <span className="text-sm font-semibold">₺</span>
                </div>
                {manualTotalPrice && parseFloat(manualTotalPrice) !== totalPrice && (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={distributePrice}
                      className="w-full text-xs"
                    >
                      Fiyatı Dağıt (KG/DS Ağırlığına Göre)
                    </Button>
                  </div>
                )}
                {!manualTotalPrice && totalPrice > 0 && (
                  <p className="text-xs text-gray-500">
                    Otomatik hesaplanan: {totalPrice.toFixed(2)} ₺
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Tarih Bilgileri */}
          <div className="grid grid-cols-2 gap-4">
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