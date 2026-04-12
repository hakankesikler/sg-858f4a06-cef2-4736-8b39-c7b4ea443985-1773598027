import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, User, Plus, Edit, Trash2, Eye } from "lucide-react";
import { driverService, Driver } from "@/services/driverService";
import { vehicleService, Vehicle } from "@/services/vehicleService";
import { DriverForm } from "@/components/DriverForm";
import { VehicleForm } from "@/components/VehicleForm";
import { useToast } from "@/hooks/use-toast";
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

export function LogisticsModule() {
  const { toast } = useToast();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isDriverFormOpen, setIsDriverFormOpen] = useState(false);
  const [isVehicleFormOpen, setIsVehicleFormOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | undefined>();
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | undefined>();
  const [deletingDriver, setDeletingDriver] = useState<Driver | null>(null);
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<"driver" | "vehicle">("driver");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [driversData, vehiclesData] = await Promise.all([
        driverService.getDrivers(),
        vehicleService.getVehicles()
      ]);
      setDrivers(driversData);
      setVehicles(vehiclesData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Hata",
        description: "Veriler yüklenirken bir hata oluştu",
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Lojistik Yönetimi</h2>
      </div>

      <Tabs defaultValue="drivers" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="drivers" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Sürücüler
          </TabsTrigger>
          <TabsTrigger value="vehicles" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Araçlar
          </TabsTrigger>
        </TabsList>

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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Silme Onayı</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteType === "driver" 
                ? "Bu sürücüyü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
                : "Bu aracı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteType === "driver" ? handleDeleteDriver : handleDeleteVehicle}
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