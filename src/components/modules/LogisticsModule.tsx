import { useState } from "react";
import { Truck, Package, MapPin, Clock, CheckCircle2, AlertCircle, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function LogisticsModule() {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock sevkiyat verileri
  const shipments = [
    {
      id: "SHM-2026-001",
      sender: "Anadolu Lojistik",
      receiver: "Ege Ticaret",
      origin: "İstanbul",
      destination: "İzmir",
      status: "Yolda",
      vehicle: "34 ABC 123",
      driver: "Ahmet Yılmaz",
      cargo: "Electronics",
      weight: "2,500 kg",
      eta: "2026-03-30 14:00",
      progress: 65
    },
    {
      id: "SHM-2026-002",
      sender: "Marmara Gıda",
      receiver: "Akdeniz Market",
      origin: "Bursa",
      destination: "Antalya",
      status: "Teslim Edildi",
      vehicle: "16 XYZ 456",
      driver: "Mehmet Demir",
      cargo: "Food Products",
      weight: "1,800 kg",
      eta: "2026-03-29 16:30",
      progress: 100
    },
    {
      id: "SHM-2026-003",
      sender: "Karadeniz Tekstil",
      receiver: "İstanbul Moda",
      origin: "Trabzon",
      destination: "İstanbul",
      status: "Depoda",
      vehicle: "61 DEF 789",
      driver: "Can Öztürk",
      cargo: "Textiles",
      weight: "3,200 kg",
      eta: "2026-03-31 10:00",
      progress: 30
    },
    {
      id: "SHM-2026-004",
      sender: "Ege İnşaat",
      receiver: "Ankara Yapı",
      origin: "İzmir",
      destination: "Ankara",
      status: "Gecikmiş",
      vehicle: "35 GHI 321",
      driver: "Zeynep Kaya",
      cargo: "Construction Materials",
      weight: "5,000 kg",
      eta: "2026-03-29 09:00",
      progress: 45
    }
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      "Yolda": "bg-blue-100 text-blue-700 border-blue-200",
      "Teslim Edildi": "bg-green-100 text-green-700 border-green-200",
      "Depoda": "bg-orange-100 text-orange-700 border-orange-200",
      "Gecikmiş": "bg-red-100 text-red-700 border-red-200"
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const filteredShipments = shipments.filter(ship =>
    ship.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ship.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ship.vehicle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lojistik Yönetimi</h1>
          <p className="text-gray-600 mt-1">Sevkiyat, araç ve depo takibi</p>
        </div>
        <Button className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800">
          <Package className="w-4 h-4 mr-2" />
          Yeni Sevkiyat
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Aktif Sevkiyat</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">48</p>
              <p className="text-xs text-blue-600 mt-1">Yolda</p>
            </div>
            <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center">
              <Truck className="w-7 h-7 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Teslim Edildi</p>
              <p className="text-3xl font-bold text-green-900 mt-2">142</p>
              <p className="text-xs text-green-600 mt-1">Bu ay</p>
            </div>
            <div className="w-14 h-14 bg-green-600 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700 font-medium">Depoda</p>
              <p className="text-3xl font-bold text-orange-900 mt-2">23</p>
              <p className="text-xs text-orange-600 mt-1">Bekliyor</p>
            </div>
            <div className="w-14 h-14 bg-orange-600 rounded-xl flex items-center justify-center">
              <Package className="w-7 h-7 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 font-medium">Gecikmiş</p>
              <p className="text-3xl font-bold text-red-900 mt-2">7</p>
              <p className="text-xs text-red-600 mt-1">Dikkat!</p>
            </div>
            <div className="w-14 h-14 bg-red-600 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Sevkiyat ara (ID, gönderici, araç)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filtrele
          </Button>
        </div>
      </Card>

      {/* Shipments List */}
      <div className="space-y-4">
        {filteredShipments.map((shipment) => (
          <Card key={shipment.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white font-bold">
                  <Truck className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{shipment.id}</h3>
                  <p className="text-sm text-gray-600">{shipment.cargo}</p>
                </div>
              </div>
              <Badge className={getStatusColor(shipment.status)}>
                {shipment.status}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Gönderici</p>
                <p className="font-semibold text-gray-900">{shipment.sender}</p>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {shipment.origin}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Alıcı</p>
                <p className="font-semibold text-gray-900">{shipment.receiver}</p>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {shipment.destination}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Araç & Sürücü</p>
                <p className="font-semibold text-gray-900">{shipment.vehicle}</p>
                <p className="text-sm text-gray-600">{shipment.driver}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Ağırlık & ETA</p>
                <p className="font-semibold text-gray-900">{shipment.weight}</p>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {shipment.eta}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">İlerleme</span>
                <span className="font-semibold text-gray-900">{shipment.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all"
                  style={{ width: `${shipment.progress}%` }}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t">
              <Button size="sm" variant="outline">Detay</Button>
              <Button size="sm" variant="outline">Harita</Button>
              <Button size="sm" variant="outline">İletişim</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}