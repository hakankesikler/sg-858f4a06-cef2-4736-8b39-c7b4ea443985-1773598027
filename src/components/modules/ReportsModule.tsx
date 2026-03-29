import { BarChart3, TrendingUp, Calendar, DollarSign, Package, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ReportsModule() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Raporlama & Analitik</h1>
          <p className="text-gray-600 mt-1">İş performansı ve finansal analizler</p>
        </div>
        <Button className="bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800">
          <BarChart3 className="w-4 h-4 mr-2" />
          Yeni Rapor
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-blue-900">Aylık Gelir Trendi</h3>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-900">₺8.2M</p>
          <p className="text-sm text-blue-600 mt-1">↑ 18% artış (Mart 2026)</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-green-900">Toplam Sipariş</h3>
            <Package className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-900">1,248</p>
          <p className="text-sm text-green-600 mt-1">Bu ay</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-purple-900">Müşteri Memnuniyeti</h3>
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-purple-900">94%</p>
          <p className="text-sm text-purple-600 mt-1">Mükemmel performans</p>
        </Card>
      </div>

      {/* Report Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Finansal Raporlar</h3>
              <p className="text-sm text-gray-600">Gelir, gider ve kar analizi</p>
            </div>
          </div>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start">Gelir Raporu</Button>
            <Button variant="outline" className="w-full justify-start">Gider Raporu</Button>
            <Button variant="outline" className="w-full justify-start">Kar-Zarar Tablosu</Button>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <Package className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Operasyon Raporları</h3>
              <p className="text-sm text-gray-600">Sevkiyat ve lojistik analizi</p>
            </div>
          </div>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start">Sevkiyat Raporu</Button>
            <Button variant="outline" className="w-full justify-start">Teslimat Performansı</Button>
            <Button variant="outline" className="w-full justify-start">Araç Kullanım Raporu</Button>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Müşteri Raporları</h3>
              <p className="text-sm text-gray-600">CRM ve satış analizi</p>
            </div>
          </div>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start">Müşteri Analizi</Button>
            <Button variant="outline" className="w-full justify-start">Satış Raporu</Button>
            <Button variant="outline" className="w-full justify-start">Memnuniyet Anketi</Button>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Periyodik Raporlar</h3>
              <p className="text-sm text-gray-600">Aylık ve yıllık analizler</p>
            </div>
          </div>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start">Aylık Özet</Button>
            <Button variant="outline" className="w-full justify-start">Yıllık Performans</Button>
            <Button variant="outline" className="w-full justify-start">Trend Analizi</Button>
          </div>
        </Card>
      </div>

      {/* Chart Placeholder */}
      <Card className="p-6">
        <h3 className="font-bold text-gray-900 text-lg mb-4">Son 6 Ay Gelir Grafiği</h3>
        <div className="h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
          <div className="text-center text-gray-500">
            <BarChart3 className="w-16 h-16 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">Grafik burada görüntülenecek</p>
            <p className="text-xs mt-1">(Chart.js veya Recharts entegrasyonu yapılabilir)</p>
          </div>
        </div>
      </Card>
    </div>
  );
}