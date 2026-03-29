import { useState, useEffect } from "react";
import { Truck, Package, MapPin, Clock, CheckCircle2, AlertCircle, Search, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { logisticsService } from "@/services/logisticsService";

export function LogisticsModule() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [stats, setStats] = useState({ active: 0, pending: 0, completed: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [shipmentData, statsData] = await Promise.all([
        logisticsService.getShipments(),
        logisticsService.getShipmentStats()
      ]);
      setShipments(shipmentData);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading logistics data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredShipments = shipments.filter(shipment =>
    shipment.tracking_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.origin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.destination?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusConfig = (status: string) => {
    const configs = {
      "Hazırlanıyor": { color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Package, progress: 25 },
      "Yolda": { color: "bg-blue-100 text-blue-700 border-blue-200", icon: Truck, progress: 50 },
      "Dağıtımda": { color: "bg-orange-100 text-orange-700 border-orange-200", icon: MapPin, progress: 75 },
      "Teslim Edildi": { color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2, progress: 100 }
    };
    return configs[status as keyof typeof configs] || configs["Hazırlanıyor"];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Sevkiyatlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lojistik Yönetimi</h2>
          <p className="text-gray-600 mt-1">Sevkiyat ve araç takip sistemi</p>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700">
          <Plus className="w-4 h-4 mr-2" />
          Yeni Sevkiyat
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Aktif Sevkiyat</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.active}</p>
            </div>
            <Truck className="w-10 h-10 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Bekleyen</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pending}</p>
            </div>
            <Clock className="w-10 h-10 text-yellow-600" />
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Tamamlanan</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.completed}</p>
            </div>
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Sevkiyat ara (takip no, güzergah)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Shipments List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredShipments.map((shipment) => {
          const statusConfig = getStatusConfig(shipment.status);
          const StatusIcon = statusConfig.icon;

          return (
            <Card key={shipment.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{shipment.tracking_no}</h3>
                    <p className="text-sm text-gray-600">{shipment.customers?.name || "Müşteri Yok"}</p>
                  </div>
                  <Badge className={statusConfig.color}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {shipment.status}
                  </Badge>
                </div>

                <Progress value={statusConfig.progress} className="h-2" />

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{shipment.origin} → {shipment.destination}</span>
                  </div>
                  {shipment.vehicles && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Truck className="w-4 h-4" />
                      <span>{shipment.vehicles.plate_no} - {shipment.vehicles.driver_name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600">
                    <Package className="w-4 h-4" />
                    <span>Tutar: ₺{shipment.amount?.toLocaleString('tr-TR')}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" size="sm" className="flex-1">
                    Detaylar
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    İletişim
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredShipments.length === 0 && (
        <Card className="p-12">
          <div className="text-center text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Arama kriterlerine uygun sevkiyat bulunamadı.</p>
          </div>
        </Card>
      )}
    </div>
  );
}