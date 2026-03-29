import { useState, useEffect } from "react";
import { Users, Calendar, DollarSign, Award, Search, Filter, Plus, Phone, Mail } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { hrService } from "@/services/hrService";

export function HRModule() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, onLeave: 0, totalPayroll: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [employeeData, statsData] = await Promise.all([
        hrService.getEmployees(),
        hrService.getHRStats()
      ]);
      setEmployees(employeeData);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading HR data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.position?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDepartmentColor = (dept: string) => {
    const colors: Record<string, string> = {
      "Lojistik": "bg-orange-100 text-orange-700 border-orange-200",
      "Operasyon": "bg-blue-100 text-blue-700 border-blue-200",
      "Finans": "bg-green-100 text-green-700 border-green-200",
      "İnsan Kaynakları": "bg-purple-100 text-purple-700 border-purple-200",
      "Satış": "bg-pink-100 text-pink-700 border-pink-200",
      "Müşteri Hizmetleri": "bg-indigo-100 text-indigo-700 border-indigo-200"
    };
    return colors[dept] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Personel verileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">İnsan Kaynakları</h2>
          <p className="text-gray-600 mt-1">Personel ve izin yönetimi</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Yeni Personel
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Toplam Personel</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <Users className="w-10 h-10 text-indigo-600" />
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">İzinde</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.onLeave}</p>
            </div>
            <Calendar className="w-10 h-10 text-yellow-600" />
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Toplam Bordro</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">₺{stats.totalPayroll.toLocaleString('tr-TR')}</p>
            </div>
            <DollarSign className="w-10 h-10 text-green-600" />
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Personel ara (isim, departman, pozisyon)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filtrele
          </Button>
        </div>
      </Card>

      {/* Employee List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map((employee) => {
          const leaveUsed = employee.leave_days_used || 0;
          const leaveTotal = employee.leave_days_total || 20;
          const leavePercentage = (leaveUsed / leaveTotal) * 100;

          return (
            <Card key={employee.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900">{employee.name}</h3>
                    <p className="text-gray-600 text-sm">{employee.position}</p>
                  </div>
                  <Badge className={getDepartmentColor(employee.department)}>
                    {employee.department}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{employee.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{employee.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>İşe Giriş: {new Date(employee.hire_date).toLocaleDateString('tr-TR')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign className="w-4 h-4" />
                    <span>Maaş: ₺{Number(employee.salary).toLocaleString('tr-TR')}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">İzin Kullanımı</span>
                    <span className="font-semibold text-gray-900">{leaveUsed}/{leaveTotal} gün</span>
                  </div>
                  <Progress value={leavePercentage} className="h-2" />
                </div>

                {employee.performance_score && (
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Award className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm text-gray-600">Performans: <span className="font-semibold">{employee.performance_score}/100</span></span>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" size="sm" className="flex-1">
                    Detaylar
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    Düzenle
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredEmployees.length === 0 && (
        <Card className="p-12">
          <div className="text-center text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Arama kriterlerine uygun personel bulunamadı.</p>
          </div>
        </Card>
      )}
    </div>
  );
}