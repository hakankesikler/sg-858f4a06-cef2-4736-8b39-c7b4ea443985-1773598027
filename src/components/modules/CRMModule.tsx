import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { crmService } from "@/services/crmService";
import { useToast } from "@/hooks/use-toast";
import {
  Building2,
  Users,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  Plus,
  Search,
  Filter,
  Download,
  Pencil,
  Trash2,
  Eye,
  RefreshCw,
  ChevronDown,
  Edit,
  Briefcase,
  UserCircle2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CRMModule() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCustomers();
    loadLeads();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await crmService.getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error("Error loading customers:", error);
    }
  };

  const loadLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error("Error loading leads:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-blue-600">CRM - Müşteri Yönetimi</h1>
          <p className="text-gray-600 mt-1">Müşterilerinizi ve cari hesaplarınızı yönetin</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Toplam Müşteri</p>
                <h3 className="text-3xl font-bold text-blue-900 mt-2">
                  {customers.length}
                </h3>
                <p className="text-xs text-blue-600 mt-1">↑ 12% bu ay</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Aktif Müşteri</p>
                <h3 className="text-3xl font-bold text-green-900 mt-2">
                  {customers.filter((c: any) => c.status === "active").length}
                </h3>
                <p className="text-xs text-green-600 mt-1">86% aktif oran</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Potansiyel</p>
                <h3 className="text-3xl font-bold text-orange-900 mt-2">
                  {leads.length}
                </h3>
                <p className="text-xs text-orange-600 mt-1">Takipte</p>
              </div>
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Toplam Ciro</p>
                <h3 className="text-3xl font-bold text-purple-900 mt-2">₺8.2M</h3>
                <p className="text-xs text-purple-600 mt-1">Bu yıl</p>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="leads" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="leads" className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Potansiyel Müşteriler
          </TabsTrigger>
          <TabsTrigger value="musteriler" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Müşteriler
          </TabsTrigger>
        </TabsList>

        {/* Potansiyel Müşteriler Tab */}
        <TabsContent value="leads" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-blue-600">Potansiyel Müşteriler</h2>
                  <p className="text-sm text-gray-500 mt-1">Website teklif formundan gelen talepler</p>
                </div>
                <Button variant="outline" onClick={loadLeads}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Yenile
                </Button>
              </div>

              {leads.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <UserPlus className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Henüz potansiyel müşteri kaydı bulunmamaktadır</p>
                  <p className="text-sm mt-2">Website teklif formundan gelen talepler burada görünecektir</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {leads.map((lead) => (
                    <div
                      key={lead.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-blue-600">
                            {lead.company_name}
                          </h3>
                          <p className="text-sm text-gray-600">{lead.contact_name}</p>
                        </div>
                        <div className="flex gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              lead.status === "yeni"
                                ? "bg-blue-100 text-blue-700"
                                : lead.status === "inceleniyor"
                                ? "bg-yellow-100 text-yellow-700"
                                : lead.status === "teklif_verildi"
                                ? "bg-purple-100 text-purple-700"
                                : lead.status === "kazanildi"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {lead.status === "yeni"
                              ? "🆕 Yeni"
                              : lead.status === "inceleniyor"
                              ? "🔍 İnceleniyor"
                              : lead.status === "teklif_verildi"
                              ? "📋 Teklif Verildi"
                              : lead.status === "kazanildi"
                              ? "✅ Kazanıldı"
                              : "❌ Kaybedildi"}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              lead.priority === "acil"
                                ? "bg-red-100 text-red-700"
                                : lead.priority === "yüksek"
                                ? "bg-orange-100 text-orange-700"
                                : lead.priority === "normal"
                                ? "bg-gray-100 text-gray-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {lead.priority === "acil"
                              ? "🔥 Acil"
                              : lead.priority === "yüksek"
                              ? "⚡ Yüksek"
                              : lead.priority === "normal"
                              ? "📌 Normal"
                              : "📍 Düşük"}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-500">Telefon</p>
                          <p className="text-sm font-medium">{lead.phone}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">E-posta</p>
                          <p className="text-sm font-medium">{lead.email}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Hizmet</p>
                          <p className="text-sm font-medium">
                            {lead.service_type === "kara"
                              ? "🚛 Kara Yolu"
                              : lead.service_type === "deniz"
                              ? "🚢 Deniz Yolu"
                              : lead.service_type === "hava"
                              ? "✈️ Hava Yolu"
                              : lead.service_type === "depolama"
                              ? "📦 Depolama"
                              : "🌍 Uluslararası"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Talep Tarihi</p>
                          <p className="text-sm font-medium">
                            {new Date(lead.created_at).toLocaleDateString("tr-TR")}
                          </p>
                        </div>
                      </div>

                      {(lead.origin || lead.destination) && (
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          {lead.origin && (
                            <div>
                              <p className="text-xs text-gray-500">Nereden</p>
                              <p className="text-sm font-medium">{lead.origin}</p>
                            </div>
                          )}
                          {lead.destination && (
                            <div>
                              <p className="text-xs text-gray-500">Nereye</p>
                              <p className="text-sm font-medium">{lead.destination}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {lead.message && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-1">Mesaj</p>
                          <p className="text-sm bg-gray-50 p-2 rounded">{lead.message}</p>
                        </div>
                      )}

                      <div className="flex gap-2 mt-3 pt-3 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            supabase
                              .from("leads")
                              .update({ status: "inceleniyor" })
                              .eq("id", lead.id)
                              .then(() => loadLeads());
                          }}
                        >
                          İncele
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            supabase
                              .from("leads")
                              .update({ status: "teklif_verildi" })
                              .eq("id", lead.id)
                              .then(() => loadLeads());
                          }}
                        >
                          Teklif Ver
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            supabase
                              .from("leads")
                              .update({
                                status: "kazanildi",
                                converted_to_customer: true,
                                converted_at: new Date().toISOString(),
                              })
                              .eq("id", lead.id)
                              .then(() => {
                                loadLeads();
                                toast({
                                  title: "Başarılı",
                                  description: "Lead müşteriye dönüştürüldü",
                                });
                              });
                          }}
                        >
                          Müşteriye Dönüştür
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Müşteriler Tab */}
        <TabsContent value="musteriler" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-blue-600">Müşteriler</h2>
                <Button onClick={() => setIsAddDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni Müşteri Ekle
                </Button>
              </div>

              <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Müşteri ara (isim, yetkili, şehir)..."
                    className="pl-10"
                  />
                </div>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtrele
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Dışa Aktar
                </Button>
              </div>

              {customers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Henüz müşteri kaydı bulunmamaktadır</p>
                  <p className="text-sm mt-2">İlk müşterinizi eklemek için yukarıdaki butona tıklayın</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {customers.map((customer) => (
                    <Card key={customer.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg">{customer.company || customer.name}</h3>
                                <p className="text-sm text-gray-600">{customer.name}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span className="text-sm">{customer.phone}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span className="text-sm">{customer.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span className="text-sm">{customer.city || "İstanbul"}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  customer.status === "active"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}>
                                  {customer.status === "active" ? "Aktif" : "Kurumsal"}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}