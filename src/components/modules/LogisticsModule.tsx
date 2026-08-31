import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, User, Plus, Edit, Trash2, Package, FileText, FileDown, History, Copy, CircleX, ClipboardCheck, AlertTriangle, RadioTower, ExternalLink } from "lucide-react";
import { driverService, Driver } from "@/services/driverService";
import { vehicleService, Vehicle } from "@/services/vehicleService";
import { shipmentService, type ShipmentRevisionRequest } from "@/services/shipmentService";
import { transportJobService, type TransportJob } from "@/services/transportJobService";
import { transportComplianceService, type TransportComplianceAlert } from "@/services/transportComplianceService";
import { downloadExcel } from "@/lib/excel";
import { DriverForm } from "@/components/DriverForm";
import { VehicleForm } from "@/components/VehicleForm";
import { ShipmentForm } from "@/components/ShipmentForm";
import { DeliveryModal } from "@/components/DeliveryModal";
import { DeliveryDocumentsDialog } from "@/components/DeliveryDocumentsDialog";
import { generateWaybill } from "@/components/WaybillGenerator";
import { InvoiceDialog } from "@/components/InvoiceDialog";
import { ShipmentHistoryDialog } from "@/components/ShipmentHistoryDialog";
import { TransportJobHistoryDialog } from "@/components/TransportJobHistoryDialog";
import { UetdsPanel } from "@/components/UetdsPanel";
import { ShipmentExceptionDialog } from "@/components/ShipmentExceptionDialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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

function carrierTrackingUrl(carrier?: string | null, awb?: string | null) {
  if (!carrier || !awb) return "";
  const encoded = encodeURIComponent(awb);
  const urls: Record<string, string> = {
    FEDEX: `https://www.fedex.com/fedextrack/?trknbr=${encoded}`,
    UPS: `https://www.ups.com/track?tracknum=${encoded}`,
    DHL: `https://www.dhl.com/tr-tr/home/tracking/tracking-express.html?submit=1&tracking-id=${encoded}`,
    ARAMEX: `https://www.aramex.com/track/results?ShipmentNumber=${encoded}`,
    TNT: `https://www.tnt.com/express/tr_tr/site/shipping-tools/tracking.html?searchType=con&cons=${encoded}`,
    DPD: `https://tracking.dpd.de/status/en_US/parcel/${encoded}`,
  };
  return urls[carrier.toUpperCase()] || "";
}

export function LogisticsModule() {
  const { toast } = useToast();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [transportJobs, setTransportJobs] = useState<TransportJob[]>([]);
  const [revisionRequests, setRevisionRequests] = useState<ShipmentRevisionRequest[]>([]);
  const [complianceAlerts, setComplianceAlerts] = useState<TransportComplianceAlert[]>([]);
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
  const [shipmentDeleteConfirmation, setShipmentDeleteConfirmation] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  
  // Delivery modal state
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [deliveringShipment, setDeliveringShipment] = useState<any | null>(null);

  // Invoice dialog state
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [invoicingShipment, setInvoicingShipment] = useState<any | null>(null);
  const [historyShipment, setHistoryShipment] = useState<any | null>(null);
  const [documentsShipment, setDocumentsShipment] = useState<any | null>(null);
  const [exceptionShipment, setExceptionShipment] = useState<any | null>(null);
  const [historyJob, setHistoryJob] = useState<TransportJob | null>(null);
  const [cancellingShipment, setCancellingShipment] = useState<any | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");

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
    void supabase.auth.getUser().then(({ data }) => setCurrentUserEmail((data.user?.email || "").toLowerCase()));
    const refresh = () => void loadData();
    window.addEventListener("rex:transport-jobs-changed", refresh);
    return () => window.removeEventListener("rex:transport-jobs-changed", refresh);
  }, []);

  const loadData = async () => {
    try {
      setComplianceAlerts(await transportComplianceService.getAlerts(30));
    } catch (error) {
      console.error("Error loading transport compliance alerts:", error);
    }
    try {
      setTransportJobs(await transportJobService.list());
    } catch (error) {
      console.error("Error loading transport jobs:", error);
    }
    try {
      setRevisionRequests(await shipmentService.getRevisionRequests());
    } catch (error) {
      console.error("Error loading shipment revisions:", error);
    }
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
    if (shipmentDeleteConfirmation !== deletingShipment.shipment_code) {
      toast({ title: "Onay kodu hatalı", description: "Sevkiyat kodunu eksiksiz yazın.", variant: "destructive" });
      return;
    }
    try {
      await shipmentService.deleteShipment(deletingShipment.id, shipmentDeleteConfirmation);
      toast({
        title: "Başarılı",
        description: "Sevkiyat başarıyla silindi",
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error?.message || "Sevkiyat silinirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingShipment(null);
      setShipmentDeleteConfirmation("");
    }
  };

  const copyTrackingLink = async (shipment: any) => {
    if (!shipment.tracking_number) {
      toast({ title: "Takip numarası bulunamadı", variant: "destructive" });
      return;
    }
    try {
      const url = `${window.location.origin}/takip/${encodeURIComponent(shipment.tracking_number)}`;
      await navigator.clipboard.writeText(url);
      toast({
        title: "Takip bağlantısı kopyalandı",
        description: `${shipment.tracking_number} müşterinizle paylaşılabilir.`,
      });
    } catch {
      toast({ title: "Bağlantı kopyalanamadı", variant: "destructive" });
    }
  };

  const handleStartShipment = async (shipment: any) => {
    try {
      await shipmentService.setShipmentStatus(shipment.id, "yolda");
      toast({ title: "Başarılı", description: `${shipment.shipment_code} yola çıkarıldı` });
      await loadData();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error?.message || "Sevkiyat durumu güncellenemedi",
        variant: "destructive",
      });
    }
  };

  const handleReviewJob = async (job: TransportJob, decision: "onayla" | "reddet") => {
    const reason = decision === "reddet" ? window.prompt("Ret nedenini yazın:") : undefined;
    if (decision === "reddet" && !reason?.trim()) return;
    try {
      await transportJobService.review(job.id, decision, reason);
      toast({
        title: decision === "onayla" ? "İş onaylandı" : "İş reddedildi",
        description: decision === "onayla" ? "Sevkiyat, atama bekleyenler listesine eklendi." : undefined,
      });
      await loadData();
    } catch (error: any) {
      toast({ title: "İşlem tamamlanamadı", description: error?.message, variant: "destructive" });
    }
  };

  const handleCancelShipment = async () => {
    if (!cancellingShipment || cancellationReason.trim().length < 10) return;
    try {
      await shipmentService.cancelShipment(cancellingShipment.id, cancellationReason.trim());
      toast({ title: "Sevkiyat iptal edildi", description: "İptal nedeni işlem geçmişine kaydedildi." });
      setCancellingShipment(null);
      setCancellationReason("");
      await loadData();
    } catch (error: any) {
      toast({ title: "İptal işlemi tamamlanamadı", description: error?.message, variant: "destructive" });
    }
  };

  const handleReviewRevision = async (request: ShipmentRevisionRequest, decision: "approve" | "reject") => {
    const note = decision === "reject"
      ? window.prompt("Revizyonun ret nedenini yazın (en az 5 karakter):")
      : window.prompt("Onay notu ekleyebilirsiniz:") || undefined;
    if (decision === "reject" && (!note || note.trim().length < 5)) return;
    try {
      await shipmentService.reviewRevision(request.id, decision, note || undefined);
      toast({
        title: decision === "approve" ? "Revizyon onaylandı" : "Revizyon reddedildi",
        description: decision === "approve" ? "Onaylanan değişiklikler sevkiyata uygulandı." : undefined,
      });
      await loadData();
    } catch (error: any) {
      toast({ title: "Revizyon işlemi tamamlanamadı", description: error?.message, variant: "destructive" });
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "beklemede":
        return "bg-yellow-100 text-yellow-800";
      case "atama_bekliyor":
        return "bg-orange-100 text-orange-800";
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
      atama_bekliyor: "Atama Bekliyor",
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
    const matchesDriver = normalize(shipment.service_mode === "international_express" ? shipment.express_carrier || "" : shipment.driver?.full_name || "").includes(normalize(filters.driver));
    const matchesVehicle = normalize(shipment.service_mode === "international_express" ? `${shipment.booking_provider || ""} ${shipment.provider_reference || ""} ${shipment.awb_number || ""}` : shipment.vehicle?.cekici_plakasi || "").includes(normalize(filters.vehicle));
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
  const exportToExcel = async () => {
    try {
      const rows = filteredShipments.map((shipment) => ({
        "Sevkiyat Kodu": shipment.shipment_code || "-",
        "Yükleme Tarihi": shipment.pickup_date ? format(new Date(shipment.pickup_date), "dd.MM.yyyy", { locale: tr }) : "-",
        "Gönderici": shipment.sender_name || "-",
        "Gönderici İl": shipment.origin || "-",
        "Alıcı": shipment.receiver || "-",
        "Alıcı İlçe": shipment.receiver_district || "-",
        "Alıcı İl": shipment.destination || "-",
        "Sürücü / Taşıyıcı": shipment.service_mode === "international_express" ? shipment.express_carrier || "-" : shipment.driver?.full_name || "-",
        "Araç / AWB": shipment.service_mode === "international_express" ? shipment.awb_number || "-" : shipment.vehicle?.cekici_plakasi || "-",
        "Teslim Tarihi": shipment.delivery_date ? format(new Date(shipment.delivery_date), "dd.MM.yyyy", { locale: tr }) : "-",
        "Teslim Alan": shipment.delivered_to || "-",
        "Durum": getStatusLabel(shipment.status),
      }));
      await downloadExcel(`Sevkiyatlar_${format(new Date(), "dd-MM-yyyy_HH-mm")}.xlsx`, rows, "Sevkiyatlar");

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

  const complianceFor = (entityType: "driver" | "vehicle", entityId: string) =>
    complianceAlerts.filter((alert) => alert.entity_type === entityType && alert.entity_id === entityId);
  const blockedComplianceCount = complianceAlerts.filter((alert) => alert.severity === "blocked").length;
  const warningComplianceCount = complianceAlerts.filter((alert) => alert.severity === "warning").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Lojistik Yönetimi</h2>
      </div>

      {complianceAlerts.length > 0 && (
        <Card className={`border-l-4 p-4 ${blockedComplianceCount > 0 ? "border-l-red-600 bg-red-50/50" : "border-l-amber-500 bg-amber-50/50"}`}>
          <div className="flex items-start gap-3">
            <AlertTriangle className={`mt-0.5 h-5 w-5 ${blockedComplianceCount > 0 ? "text-red-600" : "text-amber-600"}`} />
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-slate-900">Sürücü ve Araç Belge Uyarıları</h3>
              <p className="mt-1 text-sm text-slate-600">
                {blockedComplianceCount > 0 && `${blockedComplianceCount} belge nedeniyle atama engelli. `}
                {warningComplianceCount > 0 && `${warningComplianceCount} belgenin süresi 30 gün içinde dolacak.`}
              </p>
              <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {complianceAlerts.slice(0, 9).map((alert) => (
                  <div key={`${alert.entity_type}-${alert.entity_id}-${alert.document_type}`} className="rounded-md border bg-white px-3 py-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium">{alert.entity_name}</span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${alert.severity === "blocked" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>
                        {alert.severity === "blocked" ? "Atama Engelli" : "Süre Yaklaşıyor"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">{alert.message}</p>
                  </div>
                ))}
              </div>
              {complianceAlerts.length > 9 && <p className="mt-2 text-xs text-slate-500">Ayrıntılar sürücü ve araç listelerinde gösterilir.</p>}
            </div>
          </div>
        </Card>
      )}

      <Tabs defaultValue="jobs" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="jobs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            İş Emirleri
          </TabsTrigger>
          <TabsTrigger value="shipments" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Sevkiyatlar
          </TabsTrigger>
          <TabsTrigger value="revisions" className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Revizyonlar
            {revisionRequests.some((request) => request.status === "pending") && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                {revisionRequests.filter((request) => request.status === "pending").length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="drivers" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Sürücüler
          </TabsTrigger>
          <TabsTrigger value="vehicles" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Araçlar
          </TabsTrigger>
          <TabsTrigger value="uetds" className="flex items-center gap-2">
            <RadioTower className="h-4 w-4" />
            U-ETDS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b"><tr>
                  <th className="p-4 text-left">İŞ NO</th><th className="p-4 text-left">TARİH</th>
                  <th className="p-4 text-left">MÜŞTERİ</th><th className="p-4 text-left">GÜZERGÂH</th>
                  <th className="p-4 text-left">YÜK</th><th className="p-4 text-left">TUTAR</th>
                  <th className="p-4 text-left">DURUM</th><th className="p-4 text-left">İŞLEMLER</th>
                </tr></thead>
                <tbody>
                  {transportJobs.map((job) => <tr key={job.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">{job.job_code}</td>
                    <td className="p-4">{format(new Date(job.job_date), "dd MMM yyyy", { locale: tr })}</td>
                    <td className="p-4">{job.customer?.name || "-"}</td>
                    <td className="p-4">{job.sender_city || "-"} → {job.receiver_city || "-"}</td>
                    <td className="p-4">{job.quantity} {job.cargo_type} / {job.total_weight} kg-ds</td>
                    <td className="p-4">{Number(job.sales_total || 0).toLocaleString("tr-TR")} {job.currency}</td>
                    <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs ${job.status === "onaylandi" ? "bg-green-100 text-green-800" : job.status === "reddedildi" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>{job.status === "onaylandi" ? "Onaylandı" : job.status === "reddedildi" ? "Reddedildi" : "Onay Bekliyor"}</span></td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" title="İşlem geçmişi" onClick={() => setHistoryJob(job)}>
                          <History className="h-4 w-4" />
                        </Button>
                        {job.status === "onay_bekliyor" && <>
                          <Button size="sm" onClick={() => void handleReviewJob(job, "onayla")}>Onayla</Button>
                          <Button size="sm" variant="outline" onClick={() => void handleReviewJob(job, "reddet")}>Reddet</Button>
                        </>}
                      </div>
                    </td>
                  </tr>)}
                  {transportJobs.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-gray-500">Henüz iş emri bulunmuyor.</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="shipments" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button onClick={() => void exportToExcel()} variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Excel İndir
              </Button>
              <Button variant="outline" onClick={() => window.location.assign("/personel/profil?module=integrations")}>
                <FileDown className="h-4 w-4 mr-2" />
                Güvenli Toplu Aktarım
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
                        <div>{shipment.pickup_date ? format(new Date(shipment.pickup_date), "dd MMM yyyy", { locale: tr }) : "-"}</div>
                        {shipment.tracking_number && <div className="mt-1 font-mono text-[11px] text-blue-700">{shipment.tracking_number}</div>}
                        {shipment.service_mode === "international_express" && <div className="mt-1 inline-flex rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-800">ULUSLARARASI EXPRESS</div>}
                      </td>
                      <td className="p-4">{shipment.sender_name || "-"}</td>
                      <td className="p-4">{shipment.receiver || "-"}</td>
                      <td className="p-4">{shipment.origin || "-"}</td>
                      <td className="p-4">{shipment.receiver_district || "-"}</td>
                      <td className="p-4">{shipment.destination || "-"}</td>
                      <td className="p-4 font-medium">
                        {shipment.service_mode === "international_express" ? shipment.express_carrier || "Taşıyıcı bekliyor" : shipment.driver?.full_name || "-"}
                      </td>
                      <td className="p-4">
                        {shipment.service_mode === "international_express" ? (
                          <div className="space-y-1 text-xs">
                            <p className="font-mono font-semibold">{shipment.awb_number || "AWB bekliyor"}</p>
                            {shipment.provider_reference && <p className="text-slate-500">QS: {shipment.provider_reference}</p>}
                          </div>
                        ) : shipment.vehicle?.cekici_plakasi || "-"}
                      </td>
                      <td className="p-4">
                        {shipment.delivery_date ? format(new Date(shipment.delivery_date), "dd MMM yyyy", { locale: tr }) : "-"}
                      </td>
                      <td className="p-4">
                        {shipment.delivered_to || "-"}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeColor(shipment.status)}`}>
                            {getStatusLabel(shipment.status)}
                          </span>
                          {shipment.status === "beklemede" && (
                            <button
                              type="button"
                              onClick={() => void handleStartShipment(shipment)}
                              className="text-xs font-medium text-blue-700 hover:text-blue-900"
                              title="Sevkiyatı yola çıkar"
                            >
                              Yola Çıkar
                            </button>
                          )}
                          {shipment.status === "yolda" && (
                            <button
                              type="button"
                              onClick={() => {
                                setDeliveringShipment(shipment);
                                setIsDeliveryModalOpen(true);
                              }}
                              className="text-xs font-medium text-green-700 hover:text-green-900"
                              title="Sevkiyatı teslim et"
                            >
                              Teslim Et
                            </button>
                          )}
                          {shipment.status === "teslim_edildi" && shipment.delivery_proof_url && (
                            <button
                              type="button"
                              onClick={() => setDocumentsShipment(shipment)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Teslim evrakını görüntüle"
                            >
                              <FileText className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        {shipment.exceptions?.filter((item: any) => item.status === "open").length > 0 && (
                          <button
                            type="button"
                            onClick={() => setExceptionShipment(shipment)}
                            className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800"
                          >
                            <AlertTriangle className="h-3 w-3" />
                            {shipment.exceptions.filter((item: any) => item.status === "open").length} Açık İstisna
                          </button>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {shipment.tracking_number && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => void copyTrackingLink(shipment)}
                              title="Müşteri takip bağlantısını kopyala"
                            >
                              <Copy className="h-4 w-4 text-blue-600" />
                            </Button>
                          )}
                          {shipment.service_mode === "international_express" && carrierTrackingUrl(shipment.express_carrier, shipment.awb_number) && (
                            <Button variant="ghost" size="sm" asChild title="Taşıyıcıda canlı takip">
                              <a href={carrierTrackingUrl(shipment.express_carrier, shipment.awb_number)} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4 text-orange-600" /></a>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setHistoryShipment(shipment)}
                            title="Değişiklik geçmişi"
                          >
                            <History className="h-4 w-4 text-slate-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDocumentsShipment(shipment)}
                            title="Teslim belge paketi, önizleme ve sürüm geçmişi"
                          >
                            <FileText className="h-4 w-4 text-cyan-700" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExceptionShipment(shipment)}
                            title="İstisna kaydı ekle veya geçmişi görüntüle"
                          >
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                          </Button>
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
                          {shipment.status === "teslim_edildi" && !shipment.sale_invoice_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setInvoicingShipment(shipment);
                                setIsInvoiceDialogOpen(true);
                              }}
                              title="Faturalandır"
                            >
                              <FileText className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          {!["teslim_edildi", "Teslim Edildi", "iptal", "İptal"].includes(shipment.status) &&
                            !shipment.sale_invoice_id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setCancellationReason("");
                                  setCancellingShipment(shipment);
                                }}
                                title="Sevkiyatı neden belirterek iptal et"
                              >
                                <CircleX className="h-4 w-4 text-amber-600" />
                              </Button>
                            )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              console.log("Editing shipment:", shipment);
                              setEditingShipment(shipment);
                              setIsShipmentFormOpen(true);
                            }}
                            title={
                              ["teslim_edildi", "Teslim Edildi"].includes(shipment.status)
                                ? "Yönetici onaylı revizyon talebi oluştur"
                                : "Sevkiyatı düzenle"
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {currentUserEmail === "info@rexlojistik.com" &&
                            ["atama_bekliyor", "beklemede", "hazirlaniyor", "hazırlanıyor", "Hazırlanıyor"].includes(shipment.status) &&
                            !shipment.sale_invoice_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setShipmentDeleteConfirmation("");
                                setDeletingShipment(shipment);
                                setDeleteType("shipment");
                                setIsDeleteDialogOpen(true);
                              }}
                              title="Sevkiyatı sil"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="revisions" className="space-y-4">
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="p-4 text-left">SEVKİYAT</th>
                    <th className="p-4 text-left">TALEP EDEN</th>
                    <th className="p-4 text-left">GEREKÇE</th>
                    <th className="p-4 text-left">TARİH</th>
                    <th className="p-4 text-left">DURUM</th>
                    <th className="p-4 text-left">İŞLEMLER</th>
                  </tr>
                </thead>
                <tbody>
                  {revisionRequests.map((request) => (
                    <tr key={request.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium">{request.shipment_code}</td>
                      <td className="p-4">{request.requested_by_email || "Kullanıcı"}</td>
                      <td className="max-w-md p-4 text-sm">{request.reason}</td>
                      <td className="p-4 text-sm">{format(new Date(request.requested_at), "dd MMM yyyy HH:mm", { locale: tr })}</td>
                      <td className="p-4">
                        <span className={`rounded-full px-2 py-1 text-xs ${
                          request.status === "pending" ? "bg-amber-100 text-amber-800" :
                          request.status === "applied" ? "bg-green-100 text-green-800" :
                          request.status === "rejected" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                        }`}>
                          {request.status === "pending" ? "Onay Bekliyor" : request.status === "applied" ? "Uygulandı" : request.status === "rejected" ? "Reddedildi" : "Onaylandı"}
                        </span>
                        {request.review_note && <p className="mt-1 text-xs text-slate-500">{request.review_note}</p>}
                      </td>
                      <td className="p-4">
                        {request.status === "pending" && currentUserEmail === "info@rexlojistik.com" && (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => void handleReviewRevision(request, "approve")}>Onayla ve Uygula</Button>
                            <Button size="sm" variant="outline" onClick={() => void handleReviewRevision(request, "reject")}>Reddet</Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {revisionRequests.length === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-gray-500">Henüz revizyon talebi bulunmuyor.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="uetds" className="space-y-4">
          <UetdsPanel onChanged={loadData} />
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
                    <th className="p-4 text-left text-sm font-medium">BELGE UYGUNLUĞU</th>
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
                        {(() => {
                          const alerts = complianceFor("driver", driver.id);
                          const blocked = alerts.some((alert) => alert.severity === "blocked");
                          const warning = alerts.some((alert) => alert.severity === "warning");
                          return (
                            <span className={`rounded-full px-2 py-1 text-xs ${blocked ? "bg-red-100 text-red-800" : warning ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"}`}>
                              {blocked ? "Atama Engelli" : warning ? "Süre Yaklaşıyor" : "Uygun"}
                            </span>
                          );
                        })()}
                      </td>
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
                    <th className="p-4 text-left text-sm font-medium">BELGE UYGUNLUĞU</th>
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
                        {(() => {
                          const alerts = complianceFor("vehicle", vehicle.id);
                          const blocked = alerts.some((alert) => alert.severity === "blocked");
                          const warning = alerts.some((alert) => alert.severity === "warning");
                          return (
                            <span className={`rounded-full px-2 py-1 text-xs ${blocked ? "bg-red-100 text-red-800" : warning ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"}`}>
                              {blocked ? "Atama Engelli" : warning ? "Süre Yaklaşıyor" : "Uygun"}
                            </span>
                          );
                        })()}
                      </td>
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

      {isInvoiceDialogOpen && invoicingShipment && (
        <InvoiceDialog
          isOpen={isInvoiceDialogOpen}
          onClose={() => {
            setIsInvoiceDialogOpen(false);
            setInvoicingShipment(null);
          }}
          onSuccess={loadData}
          shipment={invoicingShipment}
        />
      )}

      <ShipmentHistoryDialog
        isOpen={!!historyShipment}
        onClose={() => setHistoryShipment(null)}
        shipment={historyShipment}
      />

      <DeliveryDocumentsDialog
        isOpen={!!documentsShipment}
        onClose={() => setDocumentsShipment(null)}
        shipment={documentsShipment}
        onChanged={loadData}
      />

      <ShipmentExceptionDialog
        isOpen={!!exceptionShipment}
        onClose={() => setExceptionShipment(null)}
        shipment={exceptionShipment}
        onSuccess={loadData}
      />

      <TransportJobHistoryDialog
        isOpen={!!historyJob}
        onClose={() => setHistoryJob(null)}
        job={historyJob}
      />

      <AlertDialog open={!!cancellingShipment} onOpenChange={(open) => {
        if (!open) {
          setCancellingShipment(null);
          setCancellationReason("");
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sevkiyatı İptal Et</AlertDialogTitle>
            <AlertDialogDescription>
              {cancellingShipment?.shipment_code} sevkiyatı silinmeyecek; iptal olarak işaretlenip nedeni kalıcı işlem geçmişine yazılacaktır.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={cancellationReason}
            onChange={(event) => setCancellationReason(event.target.value)}
            placeholder="İptal nedenini ayrıntılı yazın (en az 10 karakter)"
            rows={4}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleCancelShipment()}
              disabled={cancellationReason.trim().length < 10}
              className="bg-amber-600 hover:bg-amber-700"
            >
              İptal Olarak İşaretle
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => {
        setIsDeleteDialogOpen(open);
        if (!open) setShipmentDeleteConfirmation("");
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Silme Onayı</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteType === "driver" && "Bu sürücüyü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."}
              {deleteType === "vehicle" && "Bu aracı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."}
              {deleteType === "shipment" && "Bu sevkiyatı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."}
            </AlertDialogDescription>
            {deleteType === "shipment" && deletingShipment && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-slate-700">Onaylamak için <strong>{deletingShipment.shipment_code}</strong> kodunu yazın:</p>
                <Input
                  value={shipmentDeleteConfirmation}
                  onChange={(event) => setShipmentDeleteConfirmation(event.target.value)}
                  placeholder={deletingShipment.shipment_code}
                  autoComplete="off"
                />
              </div>
            )}
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
              disabled={deleteType === "shipment" && shipmentDeleteConfirmation !== deletingShipment?.shipment_code}
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
