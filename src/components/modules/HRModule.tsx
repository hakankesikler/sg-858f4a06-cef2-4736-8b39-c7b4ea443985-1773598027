import { useState } from "react";
import { Users, Calendar, DollarSign, Award, Search, Filter, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function HRModule() {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock personel verileri
  const employees = [
    {
      id: 1,
      name: "Ahmet Yılmaz",
      position: "Operasyon Müdürü",
      department: "Lojistik",
      email: "ahmet@rexlojistik.com",
      phone: "+90 532 555 0101",
      salary: "₺45,000",
      startDate: "2020-03-15",
      status: "Aktif",
      leaveBalance: 12
    },
    {
      id: 2,
      name: "Ayşe Demir",
      position: "Müşteri İlişkileri Uzmanı",
      department: "CRM",
      email: "ayse@rexlojistik.com",
      phone: "+90 532 555 0202",
      salary: "₺32,000",
      startDate: "2021-06-01",
      status: "Aktif",
      leaveBalance: 15
    },
    {
      id: 3,
      name: "Mehmet Öztürk",
      position: "Muhasebe Müdürü",
      department: "Finans",
      email: "mehmet@rexlojistik.com",
      phone: "+90 532 555 0303",
      salary: "₺40,000",
      startDate: "2019-01-20",
      status: "Aktif",
      leaveBalance: 8
    },
    {
      id: 4,
      name: "Zeynep Kaya",
      position: "İK Uzmanı",
      department: "İnsan Kaynakları",
      email: "zeynep@rexlojistik.com",
      phone: "+90 532 555 0404",
      salary: "₺35,000",
      startDate: "2022-09-10",
      status: "İzinli",
      leaveBalance: 5
    }
  ];

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">İnsan Kaynakları</h1>
          <p className="text-gray-600 mt-1">Personel yönetimi, izin takibi ve bordro</p>
        </div>
        <Button className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800">
          <UserPlus className="w-4 h-4 mr-2" />
          Yeni Personel Ekle
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-indigo-700 font-medium">Toplam Personel</p>
              <p className="text-3xl font-bold text-indigo-900 mt-2">47</p>
              <p className="text-xs text-indigo-600 mt-1">↑ 3 yeni bu ay</p>
            </div>
            <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Users className="w-7 h-7 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Aktif Çalışan</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">44</p>
              <p className="text-xs text-blue-600 mt-1">93% aktif oran</p>
            </div>
            <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center">
              <Award className="w-7 h-7 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700 font-medium">İzinli</p>
              <p className="text-3xl font-bold text-orange-900 mt-2">3</p>
              <p className="text-xs text-orange-600 mt-1">Bu hafta</p>
            </div>
            <div className="w-14 h-14 bg-orange-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-7 h-7 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Toplam Bordro</p>
              <p className="text-3xl font-bold text-green-900 mt-2">₺1.8M</p>
              <p className="text-xs text-green-600 mt-1">Aylık</p>
            </div>
            <div className="w-14 h-14 bg-green-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-7 h-7 text-white" />
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
              placeholder="Personel ara (isim, pozisyon, departman)..."
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

      {/* Employee Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((employee) => (
          <Card key={employee.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4 mb-4">
              <Avatar className="w-14 h-14">
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-bold text-lg">
                  {employee.name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg">{employee.name}</h3>
                <p className="text-sm text-gray-600">{employee.position}</p>
                <Badge variant="outline" className="mt-1">{employee.department}</Badge>
              </div>
              <Badge variant={employee.status === "Aktif" ? "default" : "secondary"}>
                {employee.status}
              </Badge>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {employee.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {employee.phone}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-xs text-gray-500">Maaş</p>
                <p className="font-bold text-gray-900">{employee.salary}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">İzin Hakkı</p>
                <p className="font-bold text-gray-900">{employee.leaveBalance} gün</p>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button size="sm" variant="outline" className="flex-1">Profil</Button>
              <Button size="sm" className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700">Düzenle</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}