import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { shipmentService, Shipment } from "@/services/shipmentService";
import { shipmentCargoService, type CargoItemInput } from "@/services/shipmentCargoService";
import { driverService, Driver } from "@/services/driverService";
import { vehicleService, Vehicle } from "@/services/vehicleService";
import { crmService, Customer } from "@/services/crmService";
import { cn } from "@/lib/utils";
import { ShipmentNotificationDialog } from "@/components/ShipmentNotificationDialog";

// Helper function to convert text to title case (Turkish locale aware)
const toTitleCase = (str: string | null | undefined): string => {
  if (!str) return "";
  return str
    .toLocaleLowerCase("tr-TR")
    .split(" ")
    .map(word => word.charAt(0).toLocaleUpperCase("tr-TR") + word.slice(1))
    .join(" ");
};

// Helper function to normalize Turkish characters for search
const normalizeTurkish = (str: string): string => {
  return str
    .replace(/İ/g, 'I')
    .replace(/ı/g, 'i')
    .replace(/I/g, 'i')
    .replace(/Ş/g, 'S')
    .replace(/ş/g, 's')
    .replace(/Ğ/g, 'G')
    .replace(/ğ/g, 'g')
    .replace(/Ü/g, 'U')
    .replace(/ü/g, 'u')
    .replace(/Ö/g, 'O')
    .replace(/ö/g, 'o')
    .replace(/Ç/g, 'C')
    .replace(/ç/g, 'c')
    .toLowerCase();
};

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
  
  // Search states
  const [searchSupplier, setSearchSupplier] = useState("");
  const [searchDriver, setSearchDriver] = useState("");
  const [searchVehicle, setSearchVehicle] = useState("");
  const [searchCustomer, setSearchCustomer] = useState("");
  
  // Suggestions from past shipments
  const [senderSuggestions, setSenderSuggestions] = useState<string[]>([]);
  const [receiverSuggestions, setReceiverSuggestions] = useState<string[]>([]);
  const [districtSuggestions, setDistrictSuggestions] = useState<string[]>([]);
  const [originSuggestions, setOriginSuggestions] = useState<string[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<string[]>([]);
  
  // Notification dialog state
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [notificationData, setNotificationData] = useState<{
    shipment_code: string;
    driver_name: string;
    driver_tc: string;
    driver_phone: string;
    vehicle_plate: string;
    trailer_plate: string;
    origin: string;
    destination: string;
    customer_phone?: string;
    customer_email?: string;
  } | null>(null);
  
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

  // Filtered lists based on search (with Turkish character normalization)
  const filteredSuppliers = useMemo(() => {
    if (!searchSupplier) return suppliers;
    const search = normalizeTurkish(searchSupplier);
    return suppliers.filter(s => 
      normalizeTurkish(s.name || '').includes(search) || 
      normalizeTurkish(s.customer_code || '').includes(search)
    );
  }, [suppliers, searchSupplier]);

  const filteredDrivers = useMemo(() => {
    if (!searchDriver) return drivers;
    const search = normalizeTurkish(searchDriver);
    return drivers.filter(d => 
      normalizeTurkish(d.full_name || '').includes(search) || 
      normalizeTurkish(d.driver_code || '').includes(search)
    );
  }, [drivers, searchDriver]);

  const filteredVehicles = useMemo(() => {
    if (!searchVehicle) return vehicles;
    const search = normalizeTurkish(searchVehicle);
    return vehicles.filter(v => 
      normalizeTurkish(v.cekici_plakasi || '').includes(search) || 
      normalizeTurkish(v.vehicle_code || '').includes(search)
    );
  }, [vehicles, searchVehicle]);

  const filteredCustomers = useMemo(() => {
    if (!searchCustomer) return customers;
    const search = normalizeTurkish(searchCustomer);
    
    // Debug: Show first 3 customers with normalization
    console.log('🔍 İlk 3 Müşteri Debug:', customers.slice(0, 3).map(c => ({
      code: c.customer_code,
      name: c.name,
      normalized: normalizeTurkish(c.name || ''),
      searchTerm: search,
      nameMatch: normalizeTurkish(c.name || '').includes(search),
      codeMatch: normalizeTurkish(c.customer_code || '').includes(search)
    })));
    
    // Check if PROLINE exists
    const prolineCustomer = customers.find(c => c.name?.toUpperCase().includes('PROLINE'));
    if (prolineCustomer) {
      console.log('✅ PROLINE BULUNDU:', {
        code: prolineCustomer.customer_code,
        name: prolineCustomer.name,
        normalized: normalizeTurkish(prolineCustomer.name || ''),
        searchTerm: search,
        match: normalizeTurkish(prolineCustomer.name || '').includes(search)
      });
    }
    
    const filtered = customers.filter(c => 
      normalizeTurkish(c.name || '').includes(search) || 
      normalizeTurkish(c.customer_code || '').includes(search)
    );
    
    console.log('Müşteri filtreleme:', {
      searchCustomer,
      searchNormalized: search,
      totalCustomers: customers.length,
      filteredCount: filtered.length,
      firstCustomer: customers[0]?.name,
      firstCustomerNormalized: normalizeTurkish(customers[0]?.name || '')
    });
    
    return filtered;
  }, [customers, searchCustomer]);

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
    
    updated[index].alt_toplam_fiyat = updated[index].adet * (updated[index].birim_fiyat || 0);
    
    setCargoItems(updated);
  };

  const totalKgDs = cargoItems.reduce((sum, item) => {
    return sum + (item.adet * item.kg_ds);
  }, 0);

  const totalPrice = cargoItems.reduce((sum, item) => {
    return sum + (item.alt_toplam_fiyat || 0);
  }, 0);

  const distributePrice = () => {
    const targetTotal = parseFloat(manualTotalPrice);
    
    if (!targetTotal || targetTotal <= 0 || totalKgDs <= 0) {
      return;
    }

    const pricePerKg = targetTotal / totalKgDs;

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

  useEffect(() => {
    if (manualTotalPrice && parseFloat(manualTotalPrice) > 0) {
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
  }, [isOpen]);

  useEffect(() => {
    const adet = parseFloat(formData.adet) || 0;
    const kgDs = parseFloat(formData.kg_ds) || 0;
    const toplam = adet * kgDs;
    
    if (toplam > 0 && toplam.toString() !== formData.toplam_kg_ds) {
      setFormData(prev => ({ ...prev, toplam_kg_ds: toplam.toFixed(2) }));
    }
  }, [formData.adet, formData.kg_ds]);

  useEffect(() => {
    if (editMode && initialData && isOpen && 
        drivers.length > 0 && 
        vehicles.length > 0 && 
        customers.length > 0) {
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
      
      loadCargoItems(initialData.id);
      
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
    }
  }, [editMode, initialData, isOpen, drivers, vehicles, customers]);

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
      
      console.log('📦 API\'den gelen TÜM müşteriler:', customersData.length);
      
      // Check for PROLINE before filtering
      const prolineBeforeFilter = customersData.find(c => c.name?.toUpperCase().includes('PROLINE'));
      if (prolineBeforeFilter) {
        console.log('🔍 PROLINE (filter ÖNCE):', {
          code: prolineBeforeFilter.customer_code,
          name: prolineBeforeFilter.name,
          account_type: prolineBeforeFilter.account_type,
          account_type_type: typeof prolineBeforeFilter.account_type
        });
      } else {
        console.log('❌ PROLINE API\'den gelmedi!');
      }
      
      const customersList = customersData.filter(c => {
        const isMusteri = c.account_type === "musteri" || !c.account_type;
        const isCurrentlySelected = editMode && initialData?.customer_id === c.id;
        return isMusteri || isCurrentlySelected;
      });
      
      console.log('✅ Filter SONRASI müşteriler:', customersList.length);
      
      // Check for PROLINE after filtering
      const prolineAfterFilter = customersList.find(c => c.name?.toUpperCase().includes('PROLINE'));
      if (prolineAfterFilter) {
        console.log('✅ PROLINE (filter SONRA) - MEVCUT!');
      } else {
        console.log('❌ PROLINE (filter SONRA) - FİLTRELENDİ!');
      }
      
      const suppliersList = customersData.filter(c => {
        const isTedarikci = c.account_type === "tedarikci";
        const isCurrentlySelected = editMode && initialData?.supplier_id === c.id;
        return isTedarikci || isCurrentlySelected;
      });
      
      setCustomers(customersList);
      setSuppliers(suppliersList);
      
      await loadSuggestions();
    } catch (error) {
      console.error("Error loading selection data:", error);
    }
  };

  const loadSuggestions = async () => {
    try {
      const shipments = await shipmentService.getShipments();
      
      const senders = [...new Set(
        shipments
          .map(s => s.sender_name)
          .filter(Boolean)
      )].sort();
      
      const receivers = [...new Set(
        shipments
          .map(s => s.receiver)
          .filter(Boolean)
      )].sort();
      
      const districts = [...new Set(
        shipments
          .map(s => s.receiver_district)
          .filter(Boolean)
      )].sort();
      
      const origins = [...new Set(
        shipments
          .map(s => s.origin)
          .filter(Boolean)
      )].sort();
      
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
    
    const selectedCustomer = customers.find(c => c.id === customerId);
    if (selectedCustomer && !editMode) {
      const customerName = selectedCustomer.name || "";
      
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
        
        await shipmentCargoService.updateCargoItems(shipmentId, cargoItems);
        
        toast({
          title: "Başarılı",
          description: "Sevkiyat başarıyla güncellendi",
        });
      } else {
        const created = await shipmentService.createShipment(submitData);
        shipmentId = created.id;
        
        await shipmentCargoService.createCargoItems(shipmentId, cargoItems);
        
        const selectedDriver = drivers.find(d => d.id === formData.driver_id);
        const selectedVehicle = vehicles.find(v => v.id === formData.vehicle_id);
        const selectedCustomer = customers.find(c => c.id === formData.customer_id);
        
        if (selectedDriver && selectedVehicle && selectedCustomer) {
          setNotificationData({
            shipment_code: shipmentCode,
            driver_name: selectedDriver.full_name || "",
            driver_tc: selectedDriver.tc_no || "",
            driver_phone: selectedDriver.phone || "",
            vehicle_plate: selectedVehicle.cekici_plakasi || "",
            trailer_plate: selectedVehicle.dorse_plakasi || "",
            origin: formData.origin || "",
            destination: formData.destination || "",
            customer_phone: selectedCustomer.phone || "",
            customer_email: selectedCustomer.email || ""
          });
          
          setShowNotificationDialog(true);
        }
        
        toast({
          title: "Başarılı",
          description: "Sevkiyat başarıyla oluşturuldu",
        });
      }

      onSuccess();
      if (!showNotificationDialog) {
        onClose();
      }
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
    setSearchSupplier("");
    setSearchDriver("");
    setSearchVehicle("");
    setSearchCustomer("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editMode ? "Sevkiyat Düzenle" : "Yeni Sevkiyat Oluştur"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Sevkiyat Kodu</Label>
            <Input value={shipmentCode} disabled className="bg-gray-50" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tedarikçi</Label>
              <Input
                placeholder="Tedarikçi ara..."
                value={searchSupplier}
                onChange={(e) => setSearchSupplier(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
              />
              <Select value={formData.supplier_id} onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Tedarikçi seçin" />
                </SelectTrigger>
                <SelectContent>
                  {filteredSuppliers.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">Tedarikçi bulunamadı</div>
                  ) : (
                    filteredSuppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id!}>
                        {supplier.customer_code} - {supplier.name?.toUpperCase()}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sürücü</Label>
              <Input
                placeholder="Sürücü ara..."
                value={searchDriver}
                onChange={(e) => setSearchDriver(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
              />
              <Select value={formData.driver_id} onValueChange={(value) => setFormData({ ...formData, driver_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sürücü seçin" />
                </SelectTrigger>
                <SelectContent>
                  {filteredDrivers.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">Sürücü bulunamadı</div>
                  ) : (
                    filteredDrivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id!}>
                        {driver.driver_code} - {toTitleCase(driver.full_name)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Araç</Label>
              <Input
                placeholder="Araç ara..."
                value={searchVehicle}
                onChange={(e) => setSearchVehicle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
              />
              <Select value={formData.vehicle_id} onValueChange={(value) => setFormData({ ...formData, vehicle_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Araç seçin" />
                </SelectTrigger>
                <SelectContent>
                  {filteredVehicles.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">Araç bulunamadı</div>
                  ) : (
                    filteredVehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id!}>
                        {vehicle.vehicle_code} - {vehicle.cekici_plakasi?.toUpperCase()}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

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

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-4">Gönderici ve Alıcı Detayları</h3>
            
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div className="space-y-2">
                <Label>Müşteri (Ödeme Sorumlusu)</Label>
                <Input
                  placeholder="Müşteri ara..."
                  value={searchCustomer}
                  onChange={(e) => {
                    setSearchCustomer(e.target.value);
                    console.log('Müşteri arama:', e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                />
                <Select value={formData.customer_id} onValueChange={handleCustomerChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Müşteri seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCustomers.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500">Müşteri bulunamadı</div>
                    ) : (
                      filteredCustomers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id!}>
                          {customer.customer_code} - {customer.name?.toUpperCase()}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
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
      
      {notificationData && (
        <ShipmentNotificationDialog
          open={showNotificationDialog}
          onClose={() => {
            setShowNotificationDialog(false);
            setNotificationData(null);
            onClose();
          }}
          shipmentData={notificationData}
        />
      )}
    </Dialog>
  );
}