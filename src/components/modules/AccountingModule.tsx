import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LayoutDashboard, 
  Users, 
  Building, 
  Handshake,
  FileText,
  TrendingUp,
  DollarSign,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Plus
} from "lucide-react";

export function AccountingModule() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Muhasebe</h1>
          <p className="text-muted-foreground mt-1">
            Finansal yönetim ve raporlama
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Panel
          </TabsTrigger>
          <TabsTrigger value="customers">
            <Users className="h-4 w-4 mr-2" />
            Müşteri Cari
          </TabsTrigger>
          <TabsTrigger value="suppliers">
            <Building className="h-4 w-4 mr-2" />
            Tedarikçi Cari
          </TabsTrigger>
          <TabsTrigger value="employees">
            <Users className="h-4 w-4 mr-2" />
            Personel Cari
          </TabsTrigger>
          <TabsTrigger value="partners">
            <Handshake className="h-4 w-4 mr-2" />
            Ortak Cari
          </TabsTrigger>
          <TabsTrigger value="reports">
            <FileText className="h-4 w-4 mr-2" />
            Raporlar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Toplam Alacak</p>
                  <h3 className="text-2xl font-bold mt-2">₺125,450</h3>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Toplam Borç</p>
                  <h3 className="text-2xl font-bold mt-2">₺85,230</h3>
                </div>
                <DollarSign className="h-8 w-8 text-red-600" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Açık Faturalar</p>
                  <h3 className="text-2xl font-bold mt-2">23</h3>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Bu Ay</p>
                  <h3 className="text-2xl font-bold mt-2">₺40,220</h3>
                </div>
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Müşteri Cari Hesapları</h3>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Müşteri
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              Müşteri cari hesapları burada görüntülenecek...
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Tedarikçi Cari Hesapları</h3>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Tedarikçi
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              Tedarikçi cari hesapları burada görüntülenecek...
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="employees">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Personel Cari Hesapları</h3>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Personel
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              Personel cari hesapları burada görüntülenecek...
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="partners">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Ortak Cari Hesapları</h3>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Ortak
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              Ortak cari hesapları burada görüntülenecek...
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Mali Raporlar</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <Button variant="outline" className="h-20 flex-col">
                <FileText className="h-6 w-6 mb-2" />
                Gelir-Gider Raporu
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <TrendingUp className="h-6 w-6 mb-2" />
                Kar-Zarar Raporu
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <DollarSign className="h-6 w-6 mb-2" />
                Nakit Akış Raporu
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <Calendar className="h-6 w-6 mb-2" />
                Aylık Özet
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}