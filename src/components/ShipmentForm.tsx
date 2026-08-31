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
import { openPrivateDocument } from "@/lib/private-storage";
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

// Helper function to format datetime for display
const formatDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return format(date, "dd.MM.yyyy HH:mm", { locale: tr });
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
  const [revisionReason, setRevisionReason] = useState("");
  const isCompletedEdit = Boolean(
    editMode && initialData && (
      ["teslim_edildi", "Teslim Edildi"].includes(initialData.status) ||
      ["faturalandi", "kismenfaturalandi"].includes(initialData.invoice_status)
    ),
  );
  
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
    tracking_number: string;
    tracking_url: string;
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
    { adet: 0, cinsi: "", kg_ds: 0, birim_fiyat: 0, alt_toplam_fiyat: 0, sira_no: 1, uetds_unit_code: "KG", dangerous_goods: false }
  ]);

  const [uetdsData, setUetdsData] = useState({
    reporter_mode: "carrier",
    carrier_authorization_type: "",
    carrier_authorization_number: "",
    sender_tax_id: "",
    receiver_tax_id: "",
    loading_country_code: "TR",
    loading_city_code: "",
    loading_district_code: "",
    unloading_country_code: "TR",
    unloading_city_code: "",
    unloading_district_code: "",
    planned_departure_at: "",
    planned_arrival_at: "",
    transport_type: "2",
  });
  
  // Manual total price for reverse calculation
  const [manualTotalPrice, setManualTotalPrice] = useState<string>("");
  
  const [formData, setFormData] = useState({
    service_mode: "road",
    booking_provider: "quickshipper",
    express_carrier: "",
    awb_number: "",
    provider_reference: "",
    package_type: "document",
    origin_country_code: "TR",
    destination_country_code: "",
    carrier_status: "GÖNDERİ OLUŞTURULDU",
    carrier_status_description: "",
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
    
    const filtered = customers.filter(c => 
      normalizeTurkish(c.name || '').includes(search) || 
      normalizeTurkish(c.customer_code || '').includes(search)
    );
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
      uetds_unit_code: "KG",
      dangerous_goods: false,
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

  const updateCargoItem = (index: number, field: keyof CargoItemInput, value: string | number | boolean) => {
    const updated = [...cargoItems];
    if (field === 'adet') {
      updated[index].adet = typeof value === 'string' ? parseInt(value) || 0 : Number(value);
    } else if (field === 'cinsi') {
      updated[index].cinsi = value.toString();
    } else if (field === 'kg_ds') {
      updated[index].kg_ds = typeof value === 'string' ? parseFloat(value) || 0 : Number(value);
    } else if (field === 'birim_fiyat') {
      updated[index].birim_fiyat = typeof value === 'string' ? parseFloat(value) || 0 : Number(value);
    } else if (field === 'dangerous_goods') {
      updated[index].dangerous_goods = Boolean(value);
      if (!value) {
        updated[index].un_number = "";
        updated[index].dangerous_transport_code = undefined;
      }
    } else if (field === 'dangerous_transport_code') {
      updated[index].dangerous_transport_code = typeof value === 'string' ? parseInt(value) || undefined : Number(value) || undefined;
    } else {
      (updated[index] as unknown as Record<string, unknown>)[field] = value;
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
      setRevisionReason("");
      loadSelectionData();
      if (!editMode) {
        loadNextShipmentCode();
      }
    }
  }, [isOpen, editMode]);

  useEffect(() => {
    if (editMode && initialData && isOpen && 
        drivers.length > 0 && 
        vehicles.length > 0 && 
        customers.length > 0) {
      setShipmentCode(initialData.shipment_code || "SHP-000001");
      const detail = Array.isArray(initialData.uetds_details) ? initialData.uetds_details[0] : initialData.uetds_details;
      const toLocalDateTime = (value?: string | null) => value ? new Date(value).toISOString().slice(0, 16) : "";
      setUetdsData({
        reporter_mode: detail?.reporter_mode || "carrier",
        carrier_authorization_type: detail?.carrier_authorization_type || "",
        carrier_authorization_number: detail?.carrier_authorization_number || "",
        sender_tax_id: detail?.sender_tax_id || "",
        receiver_tax_id: detail?.receiver_tax_id || "",
        loading_country_code: detail?.loading_country_code || "TR",
        loading_city_code: detail?.loading_city_code?.toString() || "",
        loading_district_code: detail?.loading_district_code?.toString() || "",
        unloading_country_code: detail?.unloading_country_code || "TR",
        unloading_city_code: detail?.unloading_city_code?.toString() || "",
        unloading_district_code: detail?.unloading_district_code?.toString() || "",
        planned_departure_at: toLocalDateTime(detail?.planned_departure_at),
        planned_arrival_at: toLocalDateTime(detail?.planned_arrival_at),
        transport_type: detail?.transport_type?.toString() || "2",
      });
      setFormData({
        service_mode: initialData.service_mode || "road",
        booking_provider: initialData.booking_provider || "quickshipper",
        express_carrier: initialData.express_carrier || "",
        awb_number: initialData.awb_number || "",
        provider_reference: initialData.provider_reference || "",
        package_type: initialData.package_type || "document",
        origin_country_code: initialData.origin_country_code || "TR",
        destination_country_code: initialData.destination_country_code || "",
        carrier_status: initialData.carrier_status || "GÖNDERİ OLUŞTURULDU",
        carrier_status_description: initialData.carrier_status_description || "",
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
          ,uetds_load_type_code: (item as any).uetds_load_type_code || ""
          ,uetds_unit_code: (item as any).uetds_unit_code || "KG"
          ,dangerous_goods: Boolean((item as any).dangerous_goods)
          ,un_number: (item as any).un_number || ""
          ,dangerous_transport_code: (item as any).dangerous_transport_code || undefined
          ,uetds_description: (item as any).uetds_description || ""
        })));
      } else {
        setCargoItems([{ adet: 0, cinsi: "", kg_ds: 0, birim_fiyat: 0, alt_toplam_fiyat: 0, sira_no: 1, uetds_unit_code: "KG", dangerous_goods: false }]);
      }
    } catch (error) {
      console.error("Error loading cargo items:", error);
      setCargoItems([{ adet: 0, cinsi: "", kg_ds: 0, birim_fiyat: 0, alt_toplam_fiyat: 0, sira_no: 1, uetds_unit_code: "KG", dangerous_goods: false }]);
    }
  };

  const loadSelectionData = async () => {
    try {
      const [driversData, vehiclesData, customersData] = await Promise.all([
        driverService.getDrivers(),
        vehicleService.getVehicles(),
        crmService.getCustomers()
      ]);
      const today = new Date().toISOString().slice(0, 10);
      setDrivers(driversData.filter((driver) =>
        driver.status === "Aktif" &&
        Boolean(driver.ehliyet_dosyasi_url) &&
        Boolean(driver.ehliyet_gecerlilik_tarihi) &&
        driver.ehliyet_gecerlilik_tarihi >= today &&
        Boolean(driver.ehliyet_sinifi)
      ));
      setVehicles(vehiclesData.filter((vehicle) =>
        vehicle.status === "Aktif" &&
        Boolean(vehicle.ruhsat_dosyasi_url) &&
        Number(vehicle.tasima_kapasitesi_kg || 0) > 0 &&
        (!vehicle.kasko_bitis_tarihi || vehicle.kasko_bitis_tarihi >= today)
      ));
      
      // REMOVED FILTER - Show ALL customers in shipment form (any cari can be a customer)
      const customersList = customersData;
      
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

    if (isCompletedEdit && revisionReason.trim().length < 10) {
      toast({
        title: "Revizyon gerekçesi gerekli",
        description: "Tamamlanmış sevkiyat için en az 10 karakterlik revizyon gerekçesi yazın.",
        variant: "destructive",
      });
      return;
    }

    const invalidCargo = cargoItems.some(item => item.adet <= 0 || item.kg_ds <= 0 || !item.cinsi.trim());
    const isExpress = formData.service_mode === "international_express";
    const incompleteAssignment = !isExpress && Boolean(formData.driver_id) !== Boolean(formData.vehicle_id);
    const invalidExpress = isExpress && (
      !formData.booking_provider || !formData.package_type ||
      !/^[A-Z]{2}$/.test(formData.origin_country_code) ||
      !/^[A-Z]{2}$/.test(formData.destination_country_code)
    );
    if (!formData.customer_id || incompleteAssignment || invalidExpress ||
        !formData.origin.trim() || !formData.destination.trim() || !pickupDate || invalidCargo) {
      toast({
        title: "Eksik Bilgi",
        description: incompleteAssignment
          ? "Sürücü ve araç birlikte seçilmelidir."
          : invalidExpress
            ? "Express gönderide sağlayıcı, dosya/paket türü ile çıkış ve varış ülke kodları zorunludur."
          : "Müşteri, çıkış/varış, yükleme tarihi ve geçerli yük kalemleri zorunludur.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const submitData = {
        shipment_code: shipmentCode,
        service_mode: formData.service_mode as Shipment["service_mode"],
        booking_provider: isExpress ? formData.booking_provider as Shipment["booking_provider"] : null,
        express_carrier: isExpress ? (formData.express_carrier || null) as Shipment["express_carrier"] : null,
        awb_number: isExpress ? formData.awb_number.replace(/\s+/g, "").toUpperCase() || null : null,
        provider_reference: isExpress ? formData.provider_reference.trim().toUpperCase() || null : null,
        package_type: isExpress ? formData.package_type as Shipment["package_type"] : null,
        origin_country_code: isExpress ? formData.origin_country_code : null,
        destination_country_code: isExpress ? formData.destination_country_code : null,
        carrier_status: isExpress ? formData.carrier_status : null,
        carrier_status_description: isExpress ? formData.carrier_status_description || null : null,
        supplier_id: formData.supplier_id || (editMode && initialData ? initialData.supplier_id : null),
        driver_id: isExpress ? null : formData.driver_id || (editMode && initialData ? initialData.driver_id : null),
        vehicle_id: isExpress ? null : formData.vehicle_id || (editMode && initialData ? initialData.vehicle_id : null),
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
        toplam_kg_ds: totalKgDs,
        _uetds_details: uetdsData,
      };

      if (isCompletedEdit) {
        await shipmentService.requestRevision(initialData.id, revisionReason.trim(), submitData, cargoItems);
        toast({
          title: "Revizyon talebi oluşturuldu",
          description: "Değişiklikler şirket sahibi onayından sonra uygulanacak.",
        });
        onSuccess();
        onClose();
        resetForm();
        return;
      }

      const shipmentId = await shipmentService.saveShipmentWithCargo(
        editMode && initialData ? initialData.id : null,
        submitData,
        cargoItems,
        undefined,
        uetdsData,
      );

      if (editMode && initialData) {
        
        toast({
          title: "Başarılı",
          description: "Sevkiyat başarıyla güncellendi",
        });
      } else {
        const savedShipment: any = await shipmentService.getShipmentById(shipmentId);
        const selectedDriver = drivers.find(d => d.id === formData.driver_id);
        const selectedVehicle = vehicles.find(v => v.id === formData.vehicle_id);
        const selectedCustomer = customers.find(c => c.id === formData.customer_id);
        
        
        if (selectedDriver && selectedVehicle && selectedCustomer) {
          setNotificationData({
            shipment_code: savedShipment.shipment_code || shipmentCode,
            tracking_number: savedShipment.tracking_number || "",
            tracking_url: savedShipment.tracking_number
              ? `${window.location.origin}/takip/${encodeURIComponent(savedShipment.tracking_number)}`
              : "",
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
        description: isExpress
          ? (formData.awb_number ? "Express gönderi AWB numarasıyla oluşturuldu" : "Express gönderi oluşturuldu; yola çıkmadan önce taşıyıcı ve AWB girilmelidir")
          : formData.driver_id
            ? "Sevkiyat atamasıyla birlikte oluşturuldu"
            : "Sevkiyat oluşturuldu; sürücü ve araç ataması bekliyor",
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
      service_mode: "road",
      booking_provider: "quickshipper",
      express_carrier: "",
      awb_number: "",
      provider_reference: "",
      package_type: "document",
      origin_country_code: "TR",
      destination_country_code: "",
      carrier_status: "GÖNDERİ OLUŞTURULDU",
      carrier_status_description: "",
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
    setUetdsData({
      reporter_mode: "carrier", carrier_authorization_type: "", carrier_authorization_number: "",
      sender_tax_id: "", receiver_tax_id: "", loading_country_code: "TR", loading_city_code: "",
      loading_district_code: "", unloading_country_code: "TR", unloading_city_code: "",
      unloading_district_code: "", planned_departure_at: "", planned_arrival_at: "", transport_type: "2",
    });
    setRevisionReason("");
    setShipmentCode("SHP-000001");
    setCargoItems([{ adet: 0, cinsi: "", kg_ds: 0, birim_fiyat: 0, alt_toplam_fiyat: 0, sira_no: 1, uetds_unit_code: "KG", dangerous_goods: false }]);
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

          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Taşıma Hizmeti *</Label>
                <Select value={formData.service_mode} onValueChange={(value) => setFormData({
                  ...formData,
                  service_mode: value,
                  driver_id: value === "international_express" ? "" : formData.driver_id,
                  vehicle_id: value === "international_express" ? "" : formData.vehicle_id,
                })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="road">Karayolu taşımacılığı</SelectItem>
                    <SelectItem value="international_express">Uluslararası express kargo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-lg bg-white p-3 text-sm text-slate-600">
                {formData.service_mode === "international_express"
                  ? "QuickShipper veya doğrudan FedEx, UPS, DHL, Aramex gibi taşıyıcılarla yapılan dosya ve paket gönderileri."
                  : "Sürücü, araç ve gerektiğinde U-ETDS akışıyla yürütülen karayolu sevkiyatları."}
              </div>
            </div>

            {formData.service_mode === "international_express" && (
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Hizmet Sağlayıcı *</Label>
                  <Select value={formData.booking_provider} onValueChange={(value) => setFormData({ ...formData, booking_provider: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quickshipper">QuickShipper</SelectItem>
                      <SelectItem value="direct">Taşıyıcı ile doğrudan</SelectItem>
                      <SelectItem value="other">Diğer sağlayıcı</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Entegratör / Taşıyıcı</Label>
                  <Select value={formData.express_carrier || "pending"} onValueChange={(value) => setFormData({ ...formData, express_carrier: value === "pending" ? "" : value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Henüz belli değil</SelectItem>
                      <SelectItem value="FEDEX">FedEx</SelectItem>
                      <SelectItem value="UPS">UPS</SelectItem>
                      <SelectItem value="DHL">DHL</SelectItem>
                      <SelectItem value="ARAMEX">Aramex</SelectItem>
                      <SelectItem value="TNT">TNT</SelectItem>
                      <SelectItem value="DPD">DPD</SelectItem>
                      <SelectItem value="QS_SPECIAL">QuickShipper Özel Teslimat</SelectItem>
                      <SelectItem value="OTHER">Diğer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Gönderi Türü *</Label>
                  <Select value={formData.package_type} onValueChange={(value) => setFormData({ ...formData, package_type: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="document">Dosya</SelectItem><SelectItem value="package">Paket</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>QuickShipper Gönderi No</Label>
                  <Input value={formData.provider_reference} onChange={(event) => setFormData({ ...formData, provider_reference: event.target.value.toUpperCase() })} placeholder="Örn. 6Q3431791689" />
                </div>
                <div className="space-y-2">
                  <Label>Entegratör AWB Numarası</Label>
                  <Input value={formData.awb_number} onChange={(event) => setFormData({ ...formData, awb_number: event.target.value.replace(/\s+/g, "").toUpperCase() })} placeholder="Yola çıkmadan önce zorunlu" />
                </div>
                <div className="space-y-2">
                  <Label>Taşıyıcı Durumu</Label>
                  <Select value={formData.carrier_status} onValueChange={(value) => setFormData({ ...formData, carrier_status: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GÖNDERİ OLUŞTURULDU">Gönderi Oluşturuldu</SelectItem>
                      <SelectItem value="ÇIKIŞ NOKTASINDA">Çıkış Noktasında</SelectItem>
                      <SelectItem value="GÜMRÜKTE">Gümrükte</SelectItem>
                      <SelectItem value="DAĞITIM MERKEZİNDE">Dağıtım Merkezinde</SelectItem>
                      <SelectItem value="DAĞITIMDA">Dağıtımda</SelectItem>
                      <SelectItem value="TESLİM EDİLDİ">Teslim Edildi</SelectItem>
                      <SelectItem value="İSTİSNA">İstisna / Sorun</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Çıkış Ülke Kodu *</Label><Input value={formData.origin_country_code} onChange={(event) => setFormData({ ...formData, origin_country_code: event.target.value.replace(/[^a-z]/gi, "").toUpperCase().slice(0, 2) })} placeholder="TR" /></div>
                <div className="space-y-2"><Label>Varış Ülke Kodu *</Label><Input value={formData.destination_country_code} onChange={(event) => setFormData({ ...formData, destination_country_code: event.target.value.replace(/[^a-z]/gi, "").toUpperCase().slice(0, 2) })} placeholder="DE, US, GB..." /></div>
                <div className="space-y-2 md:col-span-3"><Label>Taşıyıcı Durum Açıklaması</Label><Input value={formData.carrier_status_description} onChange={(event) => setFormData({ ...formData, carrier_status_description: event.target.value })} placeholder="Gümrük, gecikme veya teslim bilgisi" /></div>
                <p className="md:col-span-3 text-xs text-slate-500">AWB girildiğinde REX takip ekranı bu numarayla da sorgulanır ve müşteriyi resmî taşıyıcı takip sayfasına yönlendirir.</p>
              </div>
            )}
          </div>

          <div className={`grid gap-4 ${formData.service_mode === "road" ? "grid-cols-3" : "grid-cols-1"}`}>
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
            <div className={`space-y-2 ${formData.service_mode === "road" ? "" : "hidden"}`}>
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
            <div className={`space-y-2 ${formData.service_mode === "road" ? "" : "hidden"}`}>
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
                  <div className="space-y-1">
                    <Label className="text-xs">U-ETDS Yük Türü Kodu</Label>
                    <Input
                      value={item.uetds_load_type_code || ""}
                      onChange={(e) => updateCargoItem(index, 'uetds_load_type_code', e.target.value)}
                      placeholder="Bakanlık kodu"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">U-ETDS Birimi</Label>
                    <select
                      value={item.uetds_unit_code || "KG"}
                      onChange={(e) => updateCargoItem(index, 'uetds_unit_code', e.target.value)}
                      className="h-10 w-full rounded-md border bg-white px-3 text-sm"
                    >
                      <option value="KG">Kilogram</option>
                      <option value="LT">Litre</option>
                      <option value="AD">Adet</option>
                      <option value="M3">Metreküp</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Tehlikeli Madde</Label>
                    <select
                      value={item.dangerous_goods ? "yes" : "no"}
                      onChange={(e) => updateCargoItem(index, 'dangerous_goods', e.target.value === "yes")}
                      className="h-10 w-full rounded-md border bg-white px-3 text-sm"
                    >
                      <option value="no">Hayır</option>
                      <option value="yes">Evet</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">UN Numarası</Label>
                    <Input
                      value={item.un_number || ""}
                      onChange={(e) => updateCargoItem(index, 'un_number', e.target.value)}
                      placeholder="UN 1203"
                      disabled={!item.dangerous_goods}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Tehlikeli Taşıma Kodu</Label>
                    <Input
                      type="number"
                      value={item.dangerous_transport_code || ""}
                      onChange={(e) => updateCargoItem(index, 'dangerous_transport_code', e.target.value)}
                      placeholder="Bakanlık kodu"
                      disabled={!item.dangerous_goods}
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">U-ETDS Yük Açıklaması</Label>
                    <Input
                      value={item.uetds_description || ""}
                      onChange={(e) => updateCargoItem(index, 'uetds_description', e.target.value)}
                      placeholder="Gerekirse ayrıntılı yük açıklaması"
                    />
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

          {formData.service_mode === "road" && (
          <div className="border-t pt-4">
            <div className="mb-4">
              <h3 className="font-semibold">U-ETDS Bildirim Bilgileri</h3>
              <p className="mt-1 text-sm text-slate-500">
                Bu alanlar sevkiyatı kaydetmeye engel olmaz. Tamamlandığında U-ETDS sekmesinde kayıt “Hazır” görünür.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Bildirimi Kim Yapacak?</Label>
                <Select value={uetdsData.reporter_mode} onValueChange={(value) => setUetdsData({ ...uetdsData, reporter_mode: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="carrier">Taşıyıcı firma</SelectItem><SelectItem value="rex">REX Lojistik</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Gönderici VKN/TCKN</Label>
                <Input value={uetdsData.sender_tax_id} onChange={(e) => setUetdsData({ ...uetdsData, sender_tax_id: e.target.value.replace(/\D/g, '').slice(0, 11) })} placeholder="10 veya 11 hane" />
              </div>
              <div className="space-y-2">
                <Label>Alıcı VKN/TCKN</Label>
                <Input value={uetdsData.receiver_tax_id} onChange={(e) => setUetdsData({ ...uetdsData, receiver_tax_id: e.target.value.replace(/\D/g, '').slice(0, 11) })} placeholder="10 veya 11 hane" />
              </div>

              {uetdsData.reporter_mode === "carrier" && <>
                <div className="space-y-2">
                  <Label>Taşıyıcı Yetki Belgesi Türü</Label>
                  <Input value={uetdsData.carrier_authorization_type} onChange={(e) => setUetdsData({ ...uetdsData, carrier_authorization_type: e.target.value.toUpperCase() })} placeholder="K1, L1, C2..." />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Taşıyıcı Yetki Belgesi Numarası</Label>
                  <Input value={uetdsData.carrier_authorization_number} onChange={(e) => setUetdsData({ ...uetdsData, carrier_authorization_number: e.target.value })} />
                </div>
              </>}

              <div className="space-y-2"><Label>Yükleme Ülke Kodu</Label><Input value={uetdsData.loading_country_code} onChange={(e) => setUetdsData({ ...uetdsData, loading_country_code: e.target.value.toUpperCase().slice(0, 2) })} /></div>
              <div className="space-y-2"><Label>Yükleme İl Kodu</Label><Input type="number" value={uetdsData.loading_city_code} onChange={(e) => setUetdsData({ ...uetdsData, loading_city_code: e.target.value })} placeholder="Bakanlık/MERNİS kodu" /></div>
              <div className="space-y-2"><Label>Yükleme İlçe Kodu</Label><Input type="number" value={uetdsData.loading_district_code} onChange={(e) => setUetdsData({ ...uetdsData, loading_district_code: e.target.value })} placeholder="Bakanlık/MERNİS kodu" /></div>
              <div className="space-y-2"><Label>Boşaltma Ülke Kodu</Label><Input value={uetdsData.unloading_country_code} onChange={(e) => setUetdsData({ ...uetdsData, unloading_country_code: e.target.value.toUpperCase().slice(0, 2) })} /></div>
              <div className="space-y-2"><Label>Boşaltma İl Kodu</Label><Input type="number" value={uetdsData.unloading_city_code} onChange={(e) => setUetdsData({ ...uetdsData, unloading_city_code: e.target.value })} placeholder="Bakanlık/MERNİS kodu" /></div>
              <div className="space-y-2"><Label>Boşaltma İlçe Kodu</Label><Input type="number" value={uetdsData.unloading_district_code} onChange={(e) => setUetdsData({ ...uetdsData, unloading_district_code: e.target.value })} placeholder="Bakanlık/MERNİS kodu" /></div>
              <div className="space-y-2"><Label>Planlanan Hareket</Label><Input type="datetime-local" value={uetdsData.planned_departure_at} onChange={(e) => setUetdsData({ ...uetdsData, planned_departure_at: e.target.value })} /></div>
              <div className="space-y-2"><Label>Planlanan Varış</Label><Input type="datetime-local" value={uetdsData.planned_arrival_at} onChange={(e) => setUetdsData({ ...uetdsData, planned_arrival_at: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Taşıma Türü</Label>
                <Select value={uetdsData.transport_type} onValueChange={(value) => setUetdsData({ ...uetdsData, transport_type: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="2">Yurt içi</SelectItem><SelectItem value="1">Uluslararası</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </div>
          )}

          {/* TESLIMAT BİLGİLERİ - Sadece teslim edilmiş sevkiyatlar için */}
          {editMode && initialData && initialData.status === "teslim_edildi" && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-4 text-green-600">✅ Teslimat Bilgileri</h3>
              
              <div className="grid grid-cols-3 gap-4 bg-green-50 p-4 rounded-lg">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Teslim Tarihi</Label>
                  <div className="px-3 py-2 bg-white border rounded-md">
                    {initialData.actual_delivery_date 
                      ? formatDateTime(initialData.actual_delivery_date)
                      : "-"}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Teslim Alan Kişi</Label>
                  <div className="px-3 py-2 bg-white border rounded-md">
                    {initialData.delivered_to || "-"}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Teslim Evrakı</Label>
                  {initialData.delivery_proof_url ? (
                    <button
                      type="button"
                      onClick={() => void openPrivateDocument(initialData.delivery_proof_url, 'shipment-documents')}
                      className="flex items-center gap-2 px-3 py-2 bg-white border rounded-md hover:bg-gray-50 transition-colors text-blue-600 hover:text-blue-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      PDF İndir
                    </button>
                  ) : (
                    <div className="px-3 py-2 bg-white border rounded-md text-gray-400">
                      Yok
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {isCompletedEdit && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 space-y-2">
              <p className="font-semibold text-amber-900">Yönetici onaylı revizyon</p>
              <p className="text-sm text-amber-800">
                Müşteri, fiyat, güzergâh veya yük değişiklikleri doğrudan uygulanmaz.
                Talebiniz şirket sahibinin onayına gönderilecektir.
              </p>
              <Textarea
                value={revisionReason}
                onChange={(event) => setRevisionReason(event.target.value)}
                placeholder="Revizyonun neden gerekli olduğunu açıklayın (en az 10 karakter)"
                rows={3}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || (isCompletedEdit && revisionReason.trim().length < 10)}
            >
              {isSubmitting ? "Kaydediliyor..." : isCompletedEdit ? "Revizyon Talebi Oluştur" : editMode ? "Güncelle" : "Kaydet"}
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
