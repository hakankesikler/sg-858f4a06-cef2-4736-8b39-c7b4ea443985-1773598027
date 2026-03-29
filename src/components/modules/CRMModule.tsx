import { useState } from "react";
import { Search, Plus, Phone, Mail, MapPin, Calendar, TrendingUp, Users, Building, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function CRMModule() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"list" | "cards">("list");

  // Mock müşteri verileri
  const customers = [
    {
      id: 1,
      name: "Anadolu Lojistik A.Ş.",
      contact: "Mehmet Yılmaz",
      phone: "+90 212 555 0101",
      email: "mehmet@anadolulojistik.com",
      city: "İstanbul",
      type: "Kurumsal",
      status: "Aktif",
      totalOrders: 145,
      revenue: "₺2,450,000",
      lastOrder: "2026-03-25"
    },
    {
      id: 2,
      name: "Ege Taşımacılık Ltd.",
      contact: "Ayşe Demir",
      phone: "+90 232 555 0202",
      email: "ayse@egetasimacilik.com",
      city: "İzmir",
      type: "Kurumsal",
      status: "Aktif",
      totalOrders: 89,
      revenue: "₺1,120,000",
      lastOrder: "2026-03-28"
    },
    {
      id: 3,
      name: "Marmara Ticaret",
      contact: "Can Öztürk",
      phone: "+90 216 555 0303",
      email: "can@marmaraticaret.com",
      city: "İstanbul",
      type: "KOBİ",
      status: "Potansiyel",
      totalOrders: 12,
      revenue: "₺185,000",
      lastOrder: "2026-03-20"
    },
    {
      id: 4,
      name: "Akdeniz Gıda San.",
      contact: "Zeynep Kaya",
      phone: "+90 242 555 0404",
      email: "zeynep@akdenizgida.com",
      city: "Antalya",
      type: "Kurumsal",
      status: "Aktif",
      totalOrders: 203,
      revenue: "₺3,780,000",
      lastOrder: "2026-03-29"
    }
  ];

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CRM - Müşteri Yönetimi</h1>
          <p className="text-gray-600 mt-1">Müşterilerinizi ve cari hesaplarınızı yönetin</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
          <Plus className="w-4 h-4 mr-2" />
          Yeni Müşteri Ekle
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Toplam Müşteri</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">449</p>
              <p className="text-xs text-blue-600 mt-1">↑ 12% bu ay</p>
            </div>
            <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center">
              <Users className="w-7 h-7 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Aktif Müşteri</p>
              <p className="text-3xl font-bold text-green-900 mt-2">387</p>
              <p className="text-xs text-green-600 mt-1">86% aktif oran</p>
            </div>
            <div className="w-14 h-14 bg-green-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700 font-medium">Potansiyel</p>
              <p className="text-3xl font-bold text-orange-900 mt-2">62</p>
              <p className="text-xs text-orange-600 mt-1">Takipte</p>
            </div>
            <div className="w-14 h-14 bg-orange-600 rounded-xl flex items-center justify-center">
              <Building className="w-7 h-7 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium">Toplam Ciro</p>
              <p className="text-3xl font-bold text-purple-900 mt-2">₺8.2M</p>
              <p className="text-xs text-purple-600 mt-1">Bu yıl</p>
            </div>
            <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Müşteri ara (isim, yetkili, şehir)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filtrele
          </Button>
          <div className="flex gap-2">
            <Button
              variant={activeTab === "list" ? "default" : "outline"}
              onClick={() => setActiveTab("list")}
              size="sm"
            >
              Liste
            </Button>
            <Button
              variant={activeTab === "cards" ? "default" : "outline"}
              onClick={() => setActiveTab("cards")}
              size="sm"
            >
              Kartlar
            </Button>
          </div>
        </div>
      </Card>

      {/* Customer List */}
      {activeTab === "list" ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Müşteri</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">İletişim</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Konum</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Durum</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Sipariş</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Ciro</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">{customer.name}</p>
                        <p className="text-sm text-gray-600">{customer.contact}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          {customer.phone}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          {customer.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {customer.city}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={customer.status === "Aktif" ? "default" : "secondary"}>
                        {customer.status}
                      </Badge>
                      <Badge variant="outline" className="ml-2">{customer.type}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{customer.totalOrders}</p>
                      <p className="text-xs text-gray-500">Son: {customer.lastOrder}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-green-600">{customer.revenue}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">Detay</Button>
                        <Button size="sm" variant="outline">Düzenle</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <Card key={customer.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    {customer.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                    <p className="text-sm text-gray-600">{customer.contact}</p>
                  </div>
                </div>
                <Badge variant={customer.status === "Aktif" ? "default" : "secondary"}>
                  {customer.status}
                </Badge>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  {customer.phone}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  {customer.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  {customer.city}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 pt-4 border-t">
                <div>
                  <p className="text-xs text-gray-500">Toplam Sipariş</p>
                  <p className="text-lg font-bold text-gray-900">{customer.totalOrders}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Toplam Ciro</p>
                  <p className="text-lg font-bold text-green-600">{customer.revenue}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1">Detay</Button>
                <Button size="sm" className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700">İletişim</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}