import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, User, Plus, Edit, Trash2, Package, FileText, FileDown } from "lucide-react";
import { driverService, Driver } from "@/services/driverService";
import { vehicleService, Vehicle } from "@/services/vehicleService";
import { shipmentService } from "@/services/shipmentService";
import { DriverForm } from "@/components/DriverForm";
import { VehicleForm } from "@/components/VehicleForm";
import { ShipmentForm } from "@/components/ShipmentForm";
import { DeliveryModal } from "@/components/DeliveryModal";
import { generateWaybill } from "@/components/WaybillGenerator";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import * as XLSX from "xlsx";

export function LogisticsModule() {
  const { toast } = useToast();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [isDriverFormOpen, setIsDriverFormOpen] = useState(false);
  const [isVehicleFormOpen, setIsVehicleFormOpen] = useState(false);
  const [isShipmentFormOpen, setIsShipmentFormOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | undefined>();
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | undefined>();
  const [editingShipment, setEditingShipment] = useState<any | undefined>();
  const [deletingDriver, setDeletingDriver] = useState<Driver | null>(null);
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);
  const [deletingShipment, setDeletingShipment] = useState<any | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<"driver" | "vehicle" | "shipment">("driver");
  
  // Delivery modal state
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [deliveringShipment, setDeliveringShipment] = useState<any | null>(null);

  // Column filters
  const [filters, setFilters] = useState({
    sender_name: "",
    origin: "",
    receiver: "",
    receiver_district: "",
    destination: "",
    driver: "",
    vehicle: "",
    status: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Load drivers
    try {
      const driversData = await driverService.getDrivers();
      setDrivers(driversData);
    } catch (error) {
      console.error("Error loading drivers:", error);
      toast({
        title: "Uyarı",
        description: "Sürücüler yüklenirken bir hata oluştu",
        variant: "destructive",
      });
    }

    // Load vehicles
    try {
      const vehiclesData = await vehicleService.getVehicles();
      setVehicles(vehiclesData);
    } catch (error) {
      console.error("Error loading vehicles:", error);
      toast({
        title: "Uyarı",
        description: "Araçlar yüklenirken bir hata oluştu",
        variant: "destructive",
      });
    }

    // Load shipments
    try {
      const shipmentsData = await shipmentService.getShipments();
      setShipments(shipmentsData);
    } catch (error) {
      console.error("Error loading shipments:", error);
      toast({
        title: "Uyarı",
        description: "Sevkiyatlar yüklenirken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDriver = async () => {
    if (!deletingDriver) return;
    try {
      await driverService.deleteDriver(deletingDriver.id!);
      toast({
        title: "Başarılı",
        description: "Sürücü başarıyla silindi",
      });
      loadData();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Sürücü silinirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingDriver(null);
    }
  };

  const handleDeleteVehicle = async () => {
    if (!deletingVehicle) return;
    try {
      await vehicleService.deleteVehicle(deletingVehicle.id!);
      toast({
        title: "Başarılı",
        description: "Araç başarıyla silindi",
      });
      loadData();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Araç silinirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingVehicle(null);
    }
  };

  const handleDeleteShipment = async () => {
    if (!deletingShipment) return;
    try {
      await shipmentService.deleteShipment(deletingShipment.id);
      toast({
        title: "Başarılı",
        description: "Sevkiyat başarıyla silindi",
      });
      loadData();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Sevkiyat silinirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingShipment(null);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "beklemede":
        return "bg-yellow-100 text-yellow-800";
      case "hazırlaniyor":
        return "bg-blue-100 text-blue-800";
      case "yolda":
        return "bg-purple-100 text-purple-800";
      case "teslim_edildi":
        return "bg-green-100 text-green-800";
      case "iptal":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      beklemede: "Beklemede",
      hazırlaniyor: "Hazırlanıyor",
      yolda: "Yolda",
      teslim_edildi: "Teslim Edildi",
      iptal: "İptal"
    };
    return labels[status] || status;
  };

  // Normalize Turkish characters for case-insensitive search
  const normalize = (str: string) => {
    if (!str) return "";
    return str
      .toLowerCase()
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/İ/g, "i");
  };

  // Filter shipments based on search inputs
  const filteredShipments = shipments.filter((shipment) => {
    const matchesSender = normalize(shipment.sender_name || "").includes(normalize(filters.sender_name));
    const matchesOrigin = normalize(shipment.origin || "").includes(normalize(filters.origin));
    const matchesReceiver = normalize(shipment.receiver || "").includes(normalize(filters.receiver));
    const matchesDistrict = normalize(shipment.receiver_district || "").includes(normalize(filters.receiver_district));
    const matchesDestination = normalize(shipment.destination || "").includes(normalize(filters.destination));
    const matchesDriver = normalize(shipment.driver?.full_name || "").includes(normalize(filters.driver));
    const matchesVehicle = normalize(shipment.vehicle?.cekici_plakasi || "").includes(normalize(filters.vehicle));
    const matchesStatus = normalize(getStatusLabel(shipment.status)).includes(normalize(filters.status));

    return (
      matchesSender &&
      matchesOrigin &&
      matchesReceiver &&
      matchesDistrict &&
      matchesDestination &&
      matchesDriver &&
      matchesVehicle &&
      matchesStatus
    );
  });

  // Export to Excel
  const exportToExcel = () => {
    try {
      const data = filteredShipments.map((shipment) => ({
        "Sevkiyat Kodu": shipment.shipment_code || "-",
        "Yükleme Tarihi": shipment.pickup_date ? format(new Date(shipment.pickup_date), "dd.MM.yyyy", { locale: tr }) : "-",
        "Gönderici": shipment.sender_name || "-",
        "Gönderici İl": shipment.origin || "-",
        "Alıcı": shipment.receiver || "-",
        "Alıcı İlçe": shipment.receiver_district || "-",
        "Alıcı İl": shipment.destination || "-",
        "Sürücü": shipment.driver?.full_name || "-",
        "Araç": shipment.vehicle?.cekici_plakasi || "-",
        "Teslim Tarihi": shipment.delivery_date ? format(new Date(shipment.delivery_date), "dd.MM.yyyy", { locale: tr }) : "-",
        "Teslim Alan": shipment.delivered_to || "-",
        "Durum": getStatusLabel(shipment.status),
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sevkiyatlar");

      // Auto-size columns
      const maxWidth = 20;
      const colWidths = Object.keys(data[0] || {}).map(() => ({ wch: maxWidth }));
      worksheet["!cols"] = colWidths;

      const fileName = `Sevkiyatlar_${format(new Date(), "dd-MM-yyyy_HH-mm")}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({
        title: "Başarılı",
        description: "Excel dosyası indirildi",
      });
    } catch (error) {
      console.error("Excel export error:", error);
      toast({
        title: "Hata",
        description: "Excel dosyası oluşturulurken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    try {
      const headers = [
        "Sevkiyat Kodu",
        "Yükleme Tarihi",
        "Gönderici",
        "Gönderici İl",
        "Alıcı",
        "Alıcı İlçe",
        "Alıcı İl",
        "Sürücü",
        "Araç",
        "Teslim Tarihi",
        "Teslim Alan",
        "Durum",
      ];

      const rows = filteredShipments.map((shipment) => [
        shipment.shipment_code || "-",
        shipment.pickup_date ? format(new Date(shipment.pickup_date), "dd.MM.yyyy", { locale: tr }) : "-",
        shipment.sender_name || "-",
        shipment.origin || "-",
        shipment.receiver || "-",
        shipment.receiver_district || "-",
        shipment.destination || "-",
        shipment.driver?.full_name || "-",
        shipment.vehicle?.cekici_plakasi || "-",
        shipment.delivery_date ? format(new Date(shipment.delivery_date), "dd.MM.yyyy", { locale: tr }) : "-",
        shipment.delivered_to || "-",
        getStatusLabel(shipment.status),
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      // UTF-8 BOM for Turkish characters
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Sevkiyatlar_${format(new Date(), "dd-MM-yyyy_HH-mm")}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Başarılı",
        description: "CSV dosyası indirildi",
      });
    } catch (error) {
      console.error("CSV export error:", error);
      toast({
        title: "Hata",
        description: "CSV dosyası oluşturulurken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Lojistik Yönetimi</h2>
      </div>

      <Tabs defaultValue="shipments" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="shipments" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Sevkiyatlar
          </TabsTrigger>
          <TabsTrigger value="drivers" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Sürücüler
          </TabsTrigger>
          <TabsTrigger value="vehicles" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Araçlar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shipments" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button onClick={exportToExcel} variant="outline">
                <FileDown className="h-4 w-4 mr-2" />
                Excel İndir
              </Button>
              <Button onClick={exportToCSV} variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                CSV İndir
              </Button>
            </div>
            <Button onClick={() => {
              setEditingShipment(undefined);
              setIsShipmentFormOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Sevkiyat
            </Button>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-4 text-left text-sm font-semibold">YÜKLEME</th>
                    <th className="p-4 text-left text-sm font-semibold">GÖNDERİCİ</th>
                    <th className="p-4 text-left text-sm font-semibold">ALICI</th>
                    <th className="p-4 text-left text-sm font-semibold">GÖNDERİCİ İL</th>
                    <th className="p-4 text-left text-sm font-semibold">ALICI İLÇE</th>
                    <th className="p-4 text-left text-sm font-semibold">ALICI İL</th>
                    <th className="p-4 text-left text-sm font-semibold">SÜRÜCÜ</th>
                    <th className="p-4 text-left text-sm font-semibold">ARAÇ</th>
                    <th className="p-4 text-left text-sm font-semibold">TESLİM TARİHİ</th>
                    <th className="p-4 text-left text-sm font-semibold">TESLİM ALAN</th>
                    <th className="p-4 text-left text-sm font-semibold">DURUM</th>
                    <th className="p-4 text-left text-sm font-semibold">İŞLEMLER</th>
                  </tr>
                  <tr>
                    <th className="p-2"><div className="h-8"></div></th>
                    <th className="p-2">
                      <input
                        type="text"
                        placeholder="Ara..."
                        value={filters.sender_name}
                        onChange={(e) => setFilters({ ...filters, sender_name: e.target.value })}
                        className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </th>
                    <th className="p-2">
                      <input
                        type="text"
                        placeholder="Ara..."
                        value={filters.receiver}
                        onChange={(e) => setFilters({ ...filters, receiver: e.target.value })}
                        className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </th>
                    <th className="p-2">
                      <input
                        type="text"
                        placeholder="Ara..."
                        value={filters.origin}
                        onChange={(e) => setFilters({ ...filters, origin: e.target.value })}
                        className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </th>
                    <th className="p-2">
                      <input
                        type="text"
                        placeholder="Ara..."
                        value={filters.receiver_district}
                        onChange={(e) => setFilters({ ...filters, receiver_district: e.target.value })}
                        className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </th>
                    <th className="p-2">
                      <input
                        type="text"
                        placeholder="Ara..."
                        value={filters.destination}
                        onChange={(e) => setFilters({ ...filters, destination: e.target.value })}
                        className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </th>
                    <th className="p-2">
                      <input
                        type="text"
                        placeholder="Ara..."
                        value={filters.driver}
                        onChange={(e) => setFilters({ ...filters, driver: e.target.value })}
                        className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </th>
                    <th className="p-2">
                      <input
                        type="text"
                        placeholder="Ara..."
                        value={filters.vehicle}
                        onChange={(e) => setFilters({ ...filters, vehicle: e.target.value })}
                        className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </th>
                    <th className="p-2"><div className="h-8"></div></th>
                    <th className="p-2"><div className="h-8"></div></th>
                    <th className="p-2">
                      <input
                        type="text"
                        placeholder="Ara..."
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </th>
                    <th className="p-2"><div className="h-8"></div></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShipments.map((shipment) => (
                    <tr key={shipment.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        {shipment.pickup_date ? format(new Date(shipment.pickup_date), "dd MMM yyyy", { locale: tr }) : "-"}
                      </td>
                      <td className="p-4">{shipment.sender_name || "-"}</td>
                      <td className="p-4">{shipment.receiver || "-"}</td>
                      <td className="p-4">{shipment.origin || "-"}</td>
                      <td className="p-4">{shipment.receiver_district || "-"}</td>
                      <td className="p-4">{shipment.destination || "-"}</td>
                      <td className="p-4 font-medium">{shipment.driver?.full_name || "-"}</td>
                      <td className="p-4">{shipment.vehicle?.cekici_plakasi || "-"}</td>
                      <td className="p-4">
                        {shipment.delivery_date ? format(new Date(shipment.delivery_date), "dd MMM yyyy", { locale: tr }) : "-"}
                      </td>
                      <td className="p-4">
                        {shipment.delivered_to || "-"}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {shipment.status === "beklemede" ? (
                            <button
                              onClick={() => {
                                setDeliveringShipment(shipment);
                                setIsDeliveryModalOpen(true);
                              }}
                              className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeColor(shipment.status)} cursor-pointer hover:opacity-80`}
                              title="Teslim et"
                            >
                              {getStatusLabel(shipment.status)}
                            </button>
                          ) : (
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeColor(shipment.status)}`}>
                              {getStatusLabel(shipment.status)}
                            </span>
                          )}
                          {shipment.status === "teslim_edildi" && shipment.delivery_proof_url && (
                            <a
                              href={shipment.delivery_proof_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                              title="Teslim evrakını görüntüle"
                            >
                              <FileText className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              try {
                                await generateWaybill(shipment);
                              } catch (error) {
                                console.error("Error generating waybill:", error);
                                toast({
                                  title: "Hata",
                                  description: "İrsaliye oluşturulurken bir hata oluştu",
                                  variant: "destructive",
                                });
                              }
                            }}
                            title="İrsaliye İndir"
                          >
                            <FileDown className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              console.log("Editing shipment:", shipment);
                              setEditingShipment(shipment);
                              setIsShipmentFormOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeletingShipment(shipment);
                              setDeleteType("shipment");
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="drivers" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => {
              setEditingDriver(undefined);
              setIsDriverFormOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Sürücü
            </Button>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4 text-left text-sm font-medium">KOD</th>
                    <th className="p-4 text-left text-sm font-medium">AD SOYAD</th>
                    <th className="p-4 text-left text-sm font-medium">TC NO</th>
                    <th className="p-4 text-left text-sm font-medium">TELEFON</th>
                    <th className="p-4 text-left text-sm font-medium">EHLİYET SINIFI</th>
                    <th className="p-4 text-left text-sm font-medium">DURUM</th>
                    <th className="p-4 text-left text-sm font-medium">İŞLEMLER</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.map((driver) => (
                    <tr key={driver.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium">{driver.driver_code}</td>
                      <td className="p-4">{driver.full_name}</td>
                      <td className="p-4">{driver.tc_no}</td>
                      <td className="p-4">{driver.phone_1}</td>
                      <td className="p-4">{driver.ehliyet_sinifi || "-"}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          {driver.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              console.log("Editing driver:", driver);
                              setEditingDriver(driver);
                              setIsDriverFormOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeletingDriver(driver);
                              setDeleteType("driver");
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="vehicles" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => {
              setEditingVehicle(undefined);
              setIsVehicleFormOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Araç
            </Button>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4 text-left text-sm font-medium">KOD</th>
                    <th className="p-4 text-left text-sm font-medium">ARAÇ TİPİ</th>
                    <th className="p-4 text-left text-sm font-medium">ÇEKİCİ PLAKA</th>
                    <th className="p-4 text-left text-sm font-medium">DORSE PLAKA</th>
                    <th className="p-4 text-left text-sm font-medium">KASA TİPİ</th>
                    <th className="p-4 text-left text-sm font-medium">KAPASİTE</th>
                    <th className="p-4 text-left text-sm font-medium">DURUM</th>
                    <th className="p-4 text-left text-sm font-medium">İŞLEMLER</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium">{vehicle.vehicle_code}</td>
                      <td className="p-4 capitalize">{vehicle.arac_tipi}</td>
                      <td className="p-4">{vehicle.cekici_plakasi}</td>
                      <td className="p-4">{vehicle.dorse_plakasi || "-"}</td>
                      <td className="p-4 capitalize">{vehicle.kasa_tipi}</td>
                      <td className="p-4">{vehicle.tasima_kapasitesi_kg ? `${vehicle.tasima_kapasitesi_kg} kg` : "-"}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          {vehicle.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              console.log("Editing vehicle:", vehicle);
                              setEditingVehicle(vehicle);
                              setIsVehicleFormOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeletingVehicle(vehicle);
                              setDeleteType("vehicle");
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <DriverForm
        isOpen={isDriverFormOpen}
        onClose={() => {
          setIsDriverFormOpen(false);
          setEditingDriver(undefined);
        }}
        onSuccess={loadData}
        editMode={!!editingDriver}
        initialData={editingDriver}
      />

      <VehicleForm
        isOpen={isVehicleFormOpen}
        onClose={() => {
          setIsVehicleFormOpen(false);
          setEditingVehicle(undefined);
        }}
        onSuccess={loadData}
        editMode={!!editingVehicle}
        initialData={editingVehicle}
      />

      <ShipmentForm
        isOpen={isShipmentFormOpen}
        onClose={() => {
          setIsShipmentFormOpen(false);
          setEditingShipment(undefined);
        }}
        onSuccess={loadData}
        editMode={!!editingShipment}
        initialData={editingShipment}
      />

      <DeliveryModal
        isOpen={isDeliveryModalOpen}
        onClose={() => {
          setIsDeliveryModalOpen(false);
          setDeliveringShipment(null);
        }}
        shipmentId={deliveringShipment?.id || ""}
        shipmentCode={deliveringShipment?.shipment_code || ""}
        onSuccess={loadData}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Silme Onayı</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteType === "driver" && "Bu sürücüyü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."}
              {deleteType === "vehicle" && "Bu aracı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."}
              {deleteType === "shipment" && "Bu sevkiyatı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={
                deleteType === "driver" ? handleDeleteDriver :
                deleteType === "vehicle" ? handleDeleteVehicle :
                handleDeleteShipment
              }
              className="bg-red-600 hover:bg-red-700"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}