import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Edit, Trash2, Truck, FileText, Upload, ChevronDown } from "lucide-react";
import { logisticsService } from "@/services/logisticsService";

export function LogisticsModule() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [carriers, setCarriers] = useState<any[]>([]);
  const [isAddCarrierDialogOpen, setIsAddCarrierDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("shipments");
  const [firmaTuru, setFirmaTuru] = useState("gercek");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<any>({
    firma_adi: "",
    firma_turu: "gercek",
    vergi_dairesi: "",
    vergi_no: "",
    mersis_no: "",
    ticaret_sicil_no: "",
    merkez_adres: "",
    sube_adres: "",
    firma_telefon: "",
    firma_email: "",
    fatura_email: "",
    yetkili_ad_soyad: "",
    yetkili_telefon: "",
    yetkili_email: "",
    surucu_ad_soyad: "",
    surucu_tc: "",
    surucu_telefon1: "",
    surucu_telefon2: "",
    src_belge_no: "",
    psikoteknik_belge_no: "",
    ehliyet_sinifi: "",
    ehliyet_gecerlilik: "",
    arac_tipi: "",
    cekici_plaka: "",
    dorse_plaka: "",
    kasa_tipi: "",
    tasima_kapasitesi: "",
    kasko_bitis: "",
    trafik_sigorta_bitis: "",
    yetki_belgesi: "",
    calisma_bolgesi: "",
    uzmanlik: "",
    odeme_sekli: "",
    odeme_gunu: "",
    banka_adi: "",
    iban: "",
    hesap_sahibi: "",
    vergi_uyum: "evet",
  });

  const { toast } = useToast();

  useEffect(() => {
    loadShipments();
    loadCarriers();
  }, []);

  const loadShipments = async () => {
    try {
      const data = await logisticsService.getShipments();
      setShipments(data);
    } catch (error) {
      console.error("Error loading shipments:", error);
    }
  };

  const loadCarriers = async () => {
    try {
      const data = await logisticsService.getCarriers();
      setCarriers(data);
    } catch (error) {
      console.error("Error loading carriers:", error);
    }
  };

  const handleAddCarrier = async () => {
    // Zorunlu alan kontrolleri
    if (!formData.firma_adi) {
      toast({
        title: "Hata",
        description: "Lütfen firma adını giriniz",
        variant: "destructive",
      });
      return;
    }

    if (!formData.firma_telefon) {
      toast({
        title: "Hata",
        description: "Lütfen firma telefonu giriniz",
        variant: "destructive",
      });
      return;
    }

    if (!formData.firma_email) {
      toast({
        title: "Hata",
        description: "Lütfen firma e-posta giriniz",
        variant: "destructive",
      });
      return;
    }

    // E-posta formatı kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.firma_email)) {
      toast({
        title: "Hata",
        description: "Lütfen geçerli bir e-posta adresi giriniz",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await logisticsService.createCarrier(formData);
      toast({
        title: "Başarılı",
        description: "Nakliyeci başarıyla oluşturuldu",
      });
      setIsAddCarrierDialogOpen(false);
      setFormData({
        firma_adi: "",
        firma_turu: "gercek",
        vergi_dairesi: "",
        vergi_no: "",
        mersis_no: "",
        ticaret_sicil_no: "",
        merkez_adres: "",
        sube_adres: "",
        firma_telefon: "",
        firma_email: "",
        fatura_email: "",
        yetkili_ad_soyad: "",
        yetkili_telefon: "",
        yetkili_email: "",
        surucu_ad_soyad: "",
        surucu_tc: "",
        surucu_telefon1: "",
        surucu_telefon2: "",
        src_belge_no: "",
        psikoteknik_belge_no: "",
        ehliyet_sinifi: "",
        ehliyet_gecerlilik: "",
        arac_tipi: "",
        cekici_plaka: "",
        dorse_plaka: "",
        kasa_tipi: "",
        tasima_kapasitesi: "",
        kasko_bitis: "",
        trafik_sigorta_bitis: "",
        yetki_belgesi: "",
        calisma_bolgesi: "",
        uzmanlik: "",
        odeme_sekli: "",
        odeme_gunu: "",
        banka_adi: "",
        iban: "",
        hesap_sahibi: "",
        vergi_uyum: "evet",
      });
      loadCarriers();
    } catch (error) {
      console.error("Error creating carrier:", error);
      toast({
        title: "Hata",
        description: "Nakliyeci oluşturulurken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCarriers = carriers.filter(carrier =>
    carrier.firma_adi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    carrier.vergi_no?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [carrierFormData, setCarrierFormData] = useState({
    firma_adi: "",
    firma_turu: "gercek",
    vergi_dairesi: "",
    vergi_no: "",
    mersis_no: "",
    ticaret_sicil_no: "",
    merkez_adres: "",
    sube_adres: "",
    firma_telefon: "",
    firma_email: "",
    fatura_email: "",
    yetkili_adi: "",
    yetkili_telefon: "",
    yetkili_email: "",
    calisma_bolgesi: "",
    uzmanlik: "",
    odeme_sekli: "",
    odeme_gunu: "",
    banka_adi: "",
    iban: "",
    hesap_sahibi: "",
    vergi_unvani_uyum: "evet",
  });
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [currentDriver, setCurrentDriver] = useState({
    ad_soyad: "",
    tc_no: "",
    telefon1: "",
    telefon2: "",
    src_belge: "",
    psikoteknik_belge: "",
    ehliyet_sinifi: "",
    ehliyet_gecerlilik: "",
  });
  const [currentVehicle, setCurrentVehicle] = useState({
    arac_tipi: "",
    cekici_plaka: "",
    dorse_plaka: "",
    kasa_tipi: "",
    tasima_kapasitesi: "",
    kasko_bitis: "",
    trafik_sigorta_bitis: "",
    yetki_belgesi: "",
    ruhsat_file: null as File | null,
    ehliyet_file: null as File | null,
  });

  // VERGİ DAİRELERİ LİSTESİ (240+ vergi dairesi - Cari karttan aynı liste)
  const vergiDaireleri = [
    "ADANA / ALADAĞ VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ADANA / CEYHAN VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ADANA / ÇUKUROVA VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ADANA / FEKE VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ADANA / İMAMOĞLU VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ADANA / KARAİSALI VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ADANA / KARATAŞ VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ADANA / KOZAN VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ADANA / POZANTI VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ADANA / SAİMBEYLİ VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ADANA / SARIÇAM VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ADANA / SEYHAN VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ADANA / TUFANBEYLİ VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ADANA / YUMURTALIK VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ADANA / YÜREĞİR VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ADIYAMAN / MERKEZ VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ADIYAMAN / BESNİ VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ADIYAMAN / GÖLBAŞI VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ADIYAMAN / KAHTA VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "AFYONKARAHİSAR / MERKEZ VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "AFYONKARAHİSAR / BOLVADİN VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "AFYONKARAHİSAR / DİNAR VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "AFYONKARAHİSAR / EMİRDAĞ VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "AFYONKARAHİSAR / SANDIKLI VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "AĞRI / MERKEZ VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "AĞRI / DOĞUBAYAZIT VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "AĞRI / PATNOS VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "AKSARAY / MERKEZ VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "AMASYA / MERKEZ VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "AMASYA / MERZİFON VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "AMASYA / SULUOVA VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ANKARA / ALTINDAĞ VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ANKARA / ÇANKAYA VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ANKARA / ETİMESGUT VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ANKARA / GÖLBAŞI VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ANKARA / KEÇİÖREN VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ANKARA / MAMAK VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ANKARA / SİNCAN VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ANKARA / YENİMAHALLE VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ANKARA / AKYURT VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ANKARA / AYAŞ VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ANKARA / BALA VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ANKARA / BEYPAZARI VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ANKARA / ÇUBUK VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ANKARA / ELMADAĞ VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ANKARA / KALECIK VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ANKARA / POLATLI VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ANKARA / ŞEREFLİKOÇHİSAR VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ANTALYA / AKSEKI VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ANTALYA / ALANYA VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ANTALYA / ELMALI VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ANTALYA / FİNİKE VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ANTALYA / GAZİPAŞA VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ANTALYA / KEMER VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ANTALYA / KEPEZ VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ANTALYA / KORKUTELI VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ANTALYA / KUMLUCA VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ANTALYA / MANAVGAT VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ANTALYA / MURATPAŞA VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ANTALYA / SERİK VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ARTVİN / MERKEZ VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ARTVİN / BORÇKA VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ARTVİN / HOPA VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "AYDIN / MERKEZ VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "AYDIN / DİDİM VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "AYDIN / EFELER VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "AYDIN / KUŞADASI VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "AYDIN / NAZİLLİ VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "AYDIN / SÖKE VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "BALIKESİR / ALTIEYLÜL VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "BALIKESİR / AYVALIK VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "BALIKESİR / BANDIRMA VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "BALIKESİR / BİGADİÇ VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "BALIKESİR / BURHANIYE VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "BALIKESİR / DURSUNBEY VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "BALIKESİR / EDREMİT VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "BALIKESİR / ERDEK VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "BALIKESİR / GÖNEN VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "BALIKESİR / HAVRAN VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "BALIKESİR / İVRİNDİ VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "BALIKESİR / KARESI VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "BALIKESİR / SUSURLUK VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "BARTIN / MERKEZ VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "BATMAN / MERKEZ VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "BATMAN / BEŞİRİ VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "BATMAN / KOZLUK VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "BAYBURT / MERKEZ VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "BİLECİK / MERKEZ VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "BİLECİK / BOZÜYÜK VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "BİNGÖL / MERKEZ VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "BİTLİS / MERKEZ VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "BİTLİS / TATVAN VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "BOLU / MERKEZ VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "BOLU / DÜZCE VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "BOLU / GEREDE VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "BURDUR / MERKEZ VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "BURDUR / BUCAK VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "BURSA / BÜYÜKORHAN VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "BURSA / GEMLİK VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "BURSA / GÜRSU VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "BURSA / HARMANCIK VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "BURSA / İNEGÖL VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "BURSA / İZNİK VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "BURSA / KARACABEY VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "BURSA / KELES VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "BURSA / KESTEL VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "BURSA / MUDANYA VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "BURSA / MUSTAFAKEMALPAŞA VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "BURSA / NİLÜFER VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "BURSA / ORHANELİ VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "BURSA / ORHANGAZİ VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "BURSA / OSMANGAZİ VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "BURSA / YENİMAHALLE VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "BURSA / YILDIRIM VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ÇANAKKALE / MERKEZ VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ÇANAKKALE / BIGA VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ÇANAKKALE / ÇAN VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ÇANAKKALE / GELİBOLU VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ÇANKIRI / MERKEZ VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ÇANKIRI / ÇERKEŞ VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ÇORUM / MERKEZ VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ÇORUM / ALACA VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ÇORUM / İSKİLİP VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ÇORUM / OSMANCIK VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "ÇORUM / SUNGURLU VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "DENİZLİ / MERKEZ VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "DENİZLİ / BULDAN VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "DENİZLİ / ÇAL VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "DENİZLİ / ÇİVRİL VERGİ DAİRESİ MÜDÜRLÜĞÜ",
    "DENİZLİ / MERKEZEFENDİ VERGİ daİresi MÜDÜRLÜĞÜ",
    "DENİZLİ / PAMUKKALE VERGİ daİresi MÜDÜRLÜĞÜ",
    "DENİZLİ / TAVAS VERGİ daİresi MÜDÜRLÜĞÜ",
    "DİYARBAKIR / MERKEZ VERgİ daİresi MÜDÜRLÜĞÜ",
    "DİYARBAKIR / BİSMİL VERGİ daİresi MÜDÜRLÜĞÜ",
    "DİYARBAKIR / ÇINAR VERGİ daİresi MÜDÜRLÜĞÜ",
    "DİYARBAKIR / DİCLE VERGİ daİresi MÜDÜRLÜĞÜ",
    "DİYARBAKIR / ERGANİ VERgİ daİresi MÜDÜRLÜĞÜ",
    "DİYARBAKIR / KAYAPINAR VERgİ daİresi MÜDÜRLÜĞÜ",
    "DİYARBAKIR / SİLVAN VERgİ daİresi MÜDÜRLÜĞÜ",
    "DİYARBAKIR / SUR VERgİ daİresi MÜDÜRLÜĞÜ",
    "DİYARBAKIR / YENİŞEHİR VERgİ daİresi MÜDÜRLÜĞÜ",
    "EDİRNE / MERKEZ VERgİ daİresi MÜDÜRLÜĞÜ",
    "EDİRNE / KEŞAN VERgİ daİresi MÜDÜRLÜĞÜ",
    "EDİRNE / UZUNKÖPRÜ VERgİ daİresi MÜDÜRLÜĞÜ",
    "ELAZIĞ / MERKEZ VERgİ daİresi MÜDÜRLÜĞÜ",
    "ELAZIĞ / KARAKOÇAN VERgİ daİresi MÜDÜRLÜĞÜ",
    "ELAZIĞ / KOVANCULAR VERgİ daİresi MÜDÜRLÜĞÜ",
    "ERZİNCAN / MERKEZ VERgİ daİresi MÜDÜRLÜĞÜ",
    "ERZURUM / AŞKALE VERgİ daİresi MÜDÜRLÜĞÜ",
    "ERZURUM / AZIZIYE VERgİ daİresi MÜDÜRLÜĞÜ",
    "ERZURUM / HORASAN VERgİ daİresi MÜDÜRLÜĞÜ",
    "ERZURUM / PALANDÖKEN VERgİ daİresi MÜDÜRLÜĞÜ",
    "ERZURUM / PASINLER VERgİ daİresi MÜDÜRLÜĞÜ",
    "ERZURUM / YAKUTIYE VERgİ daİresi MÜDÜRLÜĞÜ",
    "ESKİŞEHİR / ALPU VERgİ daİresi MÜDÜRLÜĞÜ",
    "ESKİŞEHİR / MAHMUDIYE VERgİ daİresi MÜDÜRLÜĞÜ",
    "ESKİŞEHİR / ODUNPAZARI VERgİ daİresi MÜDÜRLÜĞÜ",
    "ESKİŞEHİR / SİVRİHİSAR VERgİ daİresi MÜDÜRLÜĞÜ",
    "ESKİŞEHİR / TEPEBAŞI VERgİ daİresi MÜDÜRLÜĞÜ",
    "GAZİANTEP / MERKEZ VERgİ daİresi MÜDÜRLÜĞÜ",
    "GAZİANTEP / ISLAHIYE VERgİ daİresi MÜDÜRLÜĞÜ",
    "GAZİANTEP / NİZİP VERgİ daİresi MÜDÜRLÜĞÜ",
    "GAZİANTEP / NURDAĞI VERgİ daİresi MÜDÜRLÜĞÜ",
    "GAZİANTEP / ŞAHİNBEY VERgİ daİresi MÜDÜRLÜĞÜ",
    "GAZİANTEP / ŞEHİTKAMİL VERgİ daİresi MÜDÜRLÜĞÜ",
    "GİRESUN / MERKEZ VERgİ daİresi MÜDÜRLÜĞÜ",
    "GİRESUN / BULANCAK VERgİ daİresi MÜDÜRLÜĞÜ",
    "GİRESUN / ESPİYE VERgİ daİresi MÜDÜRLÜĞÜ",
    "GİRESUN / GÖRELE VERgİ daİresi MÜDÜRLÜĞÜ",
    "GİRESUN / TİREBOLU VERgİ daİresi MÜDÜRLÜĞÜ",
    "GÜMÜŞHANE / MERKEZ VERgİ daİresi MÜDÜRLÜĞÜ",
    "HAKKARİ / MERKEZ VERgİ daİresi MÜDÜRLÜĞÜ",
    "HAKKARİ / YÜKSEKOVA VERgİ daİresi MÜDÜRLÜĞÜ",
    "HATAY / ALTINÖZÜ VERgİ daİresi MÜDÜRLÜĞÜ",
    "HATAY / ANTAKYA VERgİ daİresi MÜDÜRLÜĞÜ",
    "HATAY / DÖRTYOL VERgİ daİresi MÜDÜRLÜĞÜ",
    "HATAY / ERZİN VERgİ daİresi MÜDÜRLÜĞÜ",
    "HATAY / İSKENDERUN VERgİ daİresi MÜDÜRLÜĞÜ",
    "HATAY / KIRIKHAN VERgİ daİresi MÜDÜRLÜĞÜ",
    "HATAY / REŞADİYE VERgİ daİresi MÜDÜRLÜĞÜ",
    "HATAY / TURHAL VERgİ daİresi MÜDÜRLÜĞÜ",
    "HATAY / ZİLE VERgİ daİresi MÜDÜRLÜĞÜ",
    "IĞDIR / MERKEZ VERgİ daİresi MÜDÜRLÜĞÜ",
    "ISPARTA / MERKEZ VERgİ daİresi MÜDÜRLÜĞÜ",
    "ISPARTA / YALVAÇ VERgİ daİresi MÜDÜRLÜĞÜ",
    "İSTANBUL / ADALAR VERgİ daİresi MÜDÜRLÜĞÜ",
    "İSTANBUL / ARNAVUTKÖY VERgİ daİresi MÜDÜRLÜĞÜ",
    "İSTANBUL / ATAŞEHİR VERgİ daİresi MÜDÜRLÜĞÜ",
    "İSTANBUL / AVCILAR VERgİ daİresi MÜDÜRLÜĞÜ",
    "İSTANBUL / BAĞCILAR VERgİ daİresi MÜDÜRLÜĞÜ",
    "İSTANBUL / BAHÇELİEVLER VERgİ daİresi MÜDÜRLÜĞÜ",
    "İSTANBUL / BAKIRKÖY VERgİ daİresi MÜDÜRLÜĞÜ",
    "İSTANBUL / BAŞAKŞEHİR VERgİ daİresi MÜDÜRLÜĞÜ",
    "İSTANBUL / BAYRAMPAŞA VERgİ daİresi MÜDÜRLÜĞÜ",
    "İSTANBUL / BEŞİKTAŞ VERgİ daİresi MÜDÜRLÜĞÜ",
    "İSTANBUL / BEYKOZ VERgİ daİresi MÜDÜRLÜĞÜ",
    "İSTANBUL / BEYLİKDÜZÜ VERgİ daİresi MÜDÜRLÜĞÜ",
    "İSTANBUL / BEYOĞLU VERgİ daİresi MÜDÜRLÜĞÜ",
    "İSTANBUL / BÜYÜKÇEKMECE VERgİ daİresi MÜDÜRLÜĞÜ",
    "İSTANBUL / ÇATALCA VERgİ daİresi MÜDÜRLÜĞÜ",
    "İSTANBUL / ÇEKMEKÖY VERgİ daİresi MÜDÜRLÜĞÜ",
    "İSTANBUL / ESENLER VERgİ daİresi MÜDÜRLÜĞÜ",
    "İSTANBUL / ESENYURT VERgİ daİresi MÜDÜRLÜĞÜ",
    "İSTANBUL / EYÜPSULTAN VERgİ daİresi MÜDÜRLÜĞÜ",
    "İSTANBUL / FATİH VERgİ daİresi MÜDÜRLÜĞÜ",
    "İSTANBUL / GAZİOSMANPAŞA VERgİ daİresi MÜDÜRLÜĞÜ",
    "İSTANBUL / GÜNGÖREN VERgİ daİresi MÜDÜRLÜĞÜ",
    "İSTANBUL / KADIKÖY VERgİ daİresi MÜDÜRLÜĞÜ",
    "İSTANBUL / KAĞITHANE VERgİ daİresi MÜDÜRLÜĞÜ",
    "İSTANBUL / KARTAL VERgİ daİresi MÜDÜRLÜĞÜ",
    "İSTANBUL / KÜÇÜKÇEKMECE VERgİ daİresi MÜDÜRLÜĞÜ",
    "İSTANBUL / MALTEPE VERgİ daİresi MÜDÜRLÜĞÜ",
    "İSTANBUL / PENDİK VERgİ daİresi MÜDÜRLÜĞÜ",
    "İSTANBUL / SANCAKTEPE VERgİ daİresi MÜDÜRLÜĞÜ",
    "İSTANBUL / SARIYER VERgİ daİresi MÜDÜRLÜĞÜ",
    "İSTANBUL / SİLİVRİ VERgİ daİresi MÜDÜRLÜĞÜ",
    "İSTANBUL / SULTANBEYLİ VERgİ daİresi MÜDÜRLÜĞÜ",
    "İSTANBUL / SULTANGAZİ VERgİ daİresi MÜDÜRLÜĞÜ",
    "İSTANBUL / ŞİLE VERgİ daİresi MÜDÜRLÜĞÜ",
    "İSTANBUL / ŞİŞLİ VERgİ daİresi MÜDÜRLÜĞÜ",
    "İSTANBUL / TUZLA VERgİ daİresi MÜDÜRLÜĞÜ",
    "İSTANBUL / ÜMRANİYE VERgİ daİresi MÜDÜRLÜĞÜ",
    "İSTANBUL / ÜSKÜDAR VERgİ daİresi MÜDÜRLÜĞÜ",
    "İSTANBUL / ZEYTİNBURNU VERgİ daİresi MÜDÜRLÜĞÜ",
    "İZMİR / ALİAĞA VERgİ daİresi MÜDÜRLÜĞÜ",
    "İZMİR / BALÇOVA VERgİ daİresi MÜDÜRLÜĞÜ",
    "İZMİR / BAYINDIR VERgİ daİresi MÜDÜRLÜĞÜ",
    "İZMİR / BAYRAKLI VERgİ daİresi MÜDÜRLÜĞÜ",
    "İZMİR / BERGAMA VERgİ daİresi MÜDÜRLÜĞÜ",
    "İZMİR / BORNOVA VERgİ daİresi MÜDÜRLÜĞÜ",
    "İZMİR / BUCA VERgİ daİresi MÜDÜRLÜĞÜ",
    "İZMİR / ÇEŞME VERgİ daİresi MÜDÜRLÜĞÜ",
    "İZMİR / ÇİĞLİ VERgİ daİresi MÜDÜRLÜĞÜ",
    "İZMİR / FOÇA VERgİ daİresi MÜDÜRLÜĞÜ",
    "İZMİR / GAZİEMİR VERgİ daİresi MÜDÜRLÜĞÜ",
    "İZMİR / GÜZELBAHÇE VERgİ daİresi MÜDÜRLÜĞÜ",
    "İZMİR / KARABAĞLAR VERgİ daİresi MÜDÜRLÜĞÜ",
    "İZMİR / KARABURUN VERgİ daİresi MÜDÜRLÜĞÜ",
    "İZMİR / KARŞIYAKA VERgİ daİresi MÜDÜRLÜĞÜ",
    "İZMİR / KEMALPAŞA VERgİ daİresi MÜDÜRLÜĞÜ",
    "İZMİR / KINIK VERgİ daİresi MÜDÜRLÜĞÜ",
    "İZMİR / KIRAZ VERgİ daİresi MÜDÜRLÜĞÜ",
    "İZMİR / KONAK VERgİ daİresi MÜDÜRLÜĞÜ",
    "İZMİR / MENEMEN VERgİ daİresi MÜDÜRLÜĞÜ",
    "İZMİR / MENDERES VERgİ daİresi MÜDÜRLÜĞÜ",
    "İZMİR / NARLIDERE VERgİ daİresi MÜDÜRLÜĞÜ",
    "İZMİR / ÖDEMİŞ VERgİ daİresi MÜDÜRLÜĞÜ",
    "İZMİR / SEFERİHİSAR VERgİ daİresi MÜDÜRLÜĞÜ",
    "İZMİR / TIRE VERgİ daİresi MÜDÜRLÜĞÜ",
    "İZMİR / TORBALI VERgİ daİresi MÜDÜRLÜĞÜ",
    "İZMİR / URLA VERgİ daİresi MÜDÜRLÜĞÜ",
    "KAHRAMANMARAŞ / AFŞİN VERgİ daİresi MÜDÜRLÜĞÜ",
    "KAHRAMANMARAŞ / ANDIRIN VERgİ daİresi MÜDÜRLÜĞÜ",
    "KAHRAMANMARAŞ / DULKADİROĞLU VERgİ daİresi MÜDÜRLÜĞÜ",
    "KAHRAMANMARAŞ / ELBİSTAN VERgİ daİresi MÜDÜRLÜĞÜ",
    "KAHRAMANMARAŞ / ONİKİŞUBAT VERgİ daİresi MÜDÜRLÜĞÜ",
    "KAHRAMANMARAŞ / PAZARCIK VERgİ daİresi MÜDÜRLÜĞÜ",
    "KAHRAMANMARAŞ / TÜRKOĞLU VERgİ daİresi MÜDÜRLÜĞÜ",
    "KARABÜK / MERKEZ VERgİ daİresi MÜDÜRLÜĞÜ",
    "KARABÜK / SAFRANBOLU VERgİ daİresi MÜDÜRLÜĞÜ",
    "KARAMAN / MERKEZ VERgİ daİresi MÜDÜRLÜĞÜ",
    "KARAMAN / ERMENEK VERgİ daİresi MÜDÜRLÜĞÜ",
    "KARS / MERKEZ VERgİ daİresi MÜDÜRLÜĞÜ",
    "KASTAMONU / MERKEZ VERgİ daİresi MÜDÜRLÜĞÜ",
    "KASTAMONU / TOSYA VERgİ daİresi MÜDÜRLÜĞÜ",
    "KAYSERİ / AKKIŞLA VERgİ daİresi MÜDÜRLÜĞÜ",
    "KAYSERİ / BÜNYAN VERgİ daİresi MÜDÜRLÜĞÜ",
    "KAYSERİ / DEVELİ VERgİ daİresi MÜDÜRLÜĞÜ",
    "KAYSERİ / HACILAR VERgİ daİresi MÜDÜRLÜĞÜ",
    "KAYSERİ / İNCESU VERgİ daİresi MÜDÜRLÜĞÜ",
    "KAYSERİ / KOCASİNAN VERgİ daİresi MÜDÜRLÜĞÜ",
    "KAYSERİ / MELİKGAZİ VERgİ daİresi MÜDÜRLÜĞÜ",
    "KAYSERİ / PINARBAŞI VERgİ daİresi MÜDÜRLÜĞÜ",
    "KAYSERİ / TALAS VERgİ daİresi MÜDÜRLÜĞÜ",
    "KAYSERİ / YAHYALI VERgİ daİresi MÜDÜRLÜĞÜ",
    "KIRIKKALE / MERKEZ VERgİ daİresi MÜDÜRLÜĞÜ",
    "KIRKLARELİ / MERKEZ VERgİ daİresi MÜDÜRLÜĞÜ",
    "KIRKLARELİ / BABAESKİ VERgİ daİresi MÜDÜRLÜĞÜ",
    "KIRKLARELİ / LÜLEBURGAZ VERgİ daİresi MÜDÜRLÜĞÜ",
    "KIRŞEHİR / MERKEZ VERgİ daİresi MÜDÜRLÜĞÜ",
    "KIRŞEHİR / KAMAN VERgİ daİresi MÜDÜRLÜĞÜ",
    "KİLİS / MERKEZ VERgİ daİresi MÜDÜRLÜĞÜ",
    "KOCAELİ / BAŞİKELE VERgİ daİresi MÜDÜRLÜĞÜ",
    "KOCAELİ / ÇAYIROVA VERgİ daİresi MÜDÜRLÜĞÜ",
    "KOCAELİ / DARICA VERgİ daİresi MÜDÜRLÜĞÜ",
    "KOCAELİ / DERİNCE VERgİ daİresi MÜDÜRLÜĞÜ",
    "KOCAELİ / DİLOVASI VERgİ daİresi MÜDÜRLÜĞÜ",
    "KOCAELİ / GEBZE VERgİ daİresi MÜDÜRLÜĞÜ",
    "KOCAELİ / GÖLCÜK VERgİ daİresi MÜDÜRLÜĞÜ",
    "KOCAELİ / İZMİT VERgİ daİresi MÜDÜRLÜĞÜ",
    "KOCAELİ / KANDIRA VERgİ daİresi MÜDÜRLÜĞÜ",
    "KOCAELİ / KARAMÜRSEL VERgİ daİresi MÜDÜRLÜĞÜ",
    "KOCAELİ / KARTEPE VERgİ daİresi MÜDÜRLÜĞÜ",
    "KOCAELİ / KÖRFEZ VERgİ daİresi MÜDÜRLÜĞÜ",
    "KONYA / AKŞEHİR VERgİ daİresi MÜDÜRLÜĞÜ",
    "KONYA / BEYŞEHİR VERgİ daİresi MÜDÜRLÜĞÜ",
    "KONYA / CİHANBEYLİ VERgİ daİresi MÜDÜRLÜĞÜ",
    "KONYA / ÇUMRA VERgİ daİresi MÜDÜRLÜĞÜ",
    "KONYA / EREĞLİ VERgİ daİresi MÜDÜRLÜĞÜ",
    "KONYA / KARAPINAR VERgİ daİresi MÜDÜRLÜĞÜ",
    "KONYA / KARATAY VERgİ daİresi MÜDÜRLÜĞÜ",
    "KONYA / KULU VERgİ daİresi MÜDÜRLÜĞÜ",
    "KONYA / MERAM VERgİ daİresi MÜDÜRLÜĞÜ",
    "KONYA / SELÇUKLU VERgİ daİresi MÜDÜRLÜĞÜ",
    "KONYA / SEYDİŞEHİR VERgİ daİresi MÜDÜRLÜĞÜ",
    "KÜTAHYA / MERKEZ VERgİ daİresi MÜDÜRLÜĞÜ",
    "KÜTAHYA / EMET VERgİ daİresi MÜDÜRLÜĞÜ",
    "KÜTAHYA / GEDİZ VERgİ daİresi MÜDÜRLÜĞÜ",
    "KÜTAHYA / SİMAV VERgİ daİresi MÜDÜRLÜĞÜ",
    "KÜTAHYA / TAVŞANLI VERgİ daİresi MÜDÜRLÜĞÜ",
    "MALATYA / MERKEZ VERgİ daİresi MÜDÜRLÜĞÜ",
    "MALATYA / AKÇADAĞ VERgİ daİresi MÜDÜRLÜĞÜ",
    "MALATYA / ARAPGIR VERgİ daİresi MÜDÜRLÜĞÜ",
    "MALATYA / ARGUVAN VERgİ daİresi MÜDÜRLÜĞÜ",
    "MALATYA / BATTALGAZİ VERgİ daİresi MÜDÜRLÜĞÜ",
    "MALATYA / DARENDE VERgİ daİresi MÜDÜRLÜĞÜ",
    "MALATYA / DOĞANŞEHIR VERgİ daİresi MÜDÜRLÜĞÜ",
    "MALATYA / YEŞİLYURT VERgİ daİresi MÜDÜRLÜĞÜ",
    "MANİSA / AKHİSAR VERgİ daİresi MÜDÜRLÜĞÜ",
    "MANİSA / ALAŞEHİR VERgİ daİresi MÜDÜRLÜĞÜ",
    "MANİSA / DEMİRCİ VERgİ daİresi MÜDÜRLÜĞÜ",
    "MANİSA / KIRKAĞAÇ VERgİ daİresi MÜDÜRLÜĞÜ",
    "MANİSA / SARIGÖL VERgİ daİresi MÜDÜRLÜĞÜ",
    "MANİSA / SALİHLİ VERgİ daİresi MÜDÜRLÜĞÜ",
    "MANİSA / SOMA VERgİ daİresi MÜDÜRLÜĞÜ",
    "MANİSA / ŞEHZADELER VERgİ daİresi MÜDÜRLÜĞÜ",
    "MANİSA / TURGUTLU VERgİ daİresi MÜDÜRLÜĞÜ",
    "MANİSA / YUNUSEMRE VERgİ daİresi MÜDÜRLÜĞÜ",
    "MARDİN / MERKEZ VERgİ daİresi MÜDÜRLÜĞÜ",
    "MARDİN / DERİK VERgİ daİresi MÜDÜRLÜĞÜ",
    "MARDİN / KIZILTEPE VERgİ daİresi MÜDÜRLÜĞÜ",
    "MARDİN / MİDYAT VERgİ daİresi MÜDÜRLÜĞÜ",
    "MARDİN / NUSAYBİN VERgİ daİresi MÜDÜRLÜĞÜ",
    "MERSİN / AKDENIZ VERgİ daİresi MÜDÜRLÜĞÜ",
    "MERSİN / ANAMUR VERgİ daİresi MÜDÜRLÜĞÜ",
    "MERSİN / ERDEMLi VERgİ daİresi MÜDÜRLÜĞÜ",
    "MERSİN / MEZİTLİ VERgİ daİresi MÜDÜRLÜĞÜ",
    "MERSİN / SİLİFKE VERgİ daİresi MÜDÜRLÜĞÜ",
    "MERSİN / TARSUS VERgİ daİresi MÜDÜRLÜĞÜ",
    "MERSİN / TOROSLAR VERgİ daİresi MÜDÜRLÜĞÜ",
    "MERSİN / YENİŞEHİR VERgİ daİresi MÜDÜRLÜĞÜ",
    "MUĞLA / BODRUM VERgİ daİresi MÜDÜRLÜĞÜ",
    "MUĞLA / DALAMAN VERgİ daİresi MÜDÜRLÜĞÜ",
    "MUĞLA / FETHİYE VERgİ daİresi MÜDÜRLÜĞÜ",
    "MUĞLA / KÖYCEĞİZ VERgİ daİresi MÜDÜRLÜĞÜ",
    "MUĞLA / MARMARİS VERgİ daİresi MÜDÜRLÜĞÜ",
    "MUĞLA / MENTEŞE VERgİ daİresi MÜDÜRLÜĞÜ",
    "MUĞLA / MİLAS VERgİ daİresi MÜDÜRLÜĞÜ",
    "MUĞLA / SEYDİKEMER VERgİ daİresi MÜDÜRLÜĞÜ",
    "MUĞLA / ULA VERgİ daİresi MÜDÜRLÜĞÜ",
    "MUĞLA / YATAĞAN VERgİ daİresi MÜDÜRLÜĞÜ",
    "MUŞ / MERKEZ VERgİ daİresi MÜDÜRLÜĞÜ",
    "MUŞ / BULANIK VERgİ daİresi MÜDÜRLÜĞÜ",
    "NEVŞEHİR / MERKEZ VERgİ daİresi MÜDÜRLÜĞÜ",
    "NEVŞEHİR / AVANOS VERgİ daİresi MÜDÜRLÜĞÜ",
    "NEVŞEHİR / ÜRGÜG VERgİ daİresi MÜDÜRLÜĞÜ",
    "NİĞDE / MERKEZ VERgİ daİresi MÜDÜRLÜĞÜ",
    "NİĞDE / BOR VERgİ daİresi MÜDÜRLÜĞÜ",
    "ORDU / AKKUŞ VERgİ daİresi MÜDÜRLÜĞÜ",
    "ORDU / ALTINORDU VERgİ daİresi MÜDÜRLÜĞÜ",
    "ORDU / FATSA VERgİ daİresi MÜDÜRLÜĞÜ",
    "ORDU / GÖLKÖY VERgİ daİresi MÜDÜRLÜĞÜ",
    "ORDU / KORGAN VERgİ daİresi MÜDÜRLÜĞÜ",
    "ORDU / KUMRU VERgİ daİresi MÜDÜRLÜĞÜ",
    "ORDU / MESUDIYE VERgİ daİresi MÜDÜRLÜĞÜ",
    "ORDU / PERŞEMBE VERgİ daİresi MÜDÜRLÜĞÜ",
    "ORDU / ÜNYE VERgİ daİresi MÜDÜRLÜĞÜ",
    "OSMANİYE / MERKEZ VERgİ daİresi MÜDÜRLÜĞÜ",
    "OSMANİYE / BAHÇE VERgİ daİresi MÜDÜRLÜĞÜ",
    "OSMANİYE / KADİRLİ VERgİ daİresi MÜDÜRLÜĞÜ",
    "RİZE / MERKEZ VERgİ daİresi MÜDÜRLÜĞÜ",
    "RİZE / ARDEŞEN VERgİ daİresi MÜDÜRLÜĞÜ",
    "RİZE / ÇAYELİ VERgİ daİresi MÜDÜRLÜĞÜ",
    "RİZE / PAZAR VERgİ daİresi MÜDÜRLÜĞÜ",
    "SAKARYA / ADAPAZARI VERgİ daİresi MÜDÜRLÜĞÜ",
    "SAKARYA / AKYAZI VERgİ daİresi MÜDÜRLÜĞÜ",
    "SAKARYA / ARİFİYE VERgİ daİresi MÜDÜRLÜĞÜ",
    "SAKARYA / ERENLER VERgİ daİresi MÜDÜRLÜĞÜ",
    "SAKARYA / GEYVE VERgİ daİresi MÜDÜRLÜĞÜ",
    "SAKARYA / HENDEK VERgİ daİresi MÜDÜRLÜĞÜ",
    "SAKARYA / KARASU VERgİ daİresi MÜDÜRLÜĞÜ",
    "SAKARYA / SAPANCA VERgİ daİresi MÜDÜRLÜĞÜ",
    "SAKARYA / SERDİVAN VERgİ daİresi MÜDÜRLÜĞÜ",
    "SAMSUN / ALAÇAM VERgİ daİresi MÜDÜRLÜĞÜ",
    "SAMSUN / ATAKUM VERgİ daİresi MÜDÜRLÜĞÜ",
    "SAMSUN / BAFRA VERgİ daİresi MÜDÜRLÜĞÜ",
    "SAMSUN / ÇARŞAMBA VERgİ daİresi MÜDÜRLÜĞÜ",
    "SAMSUN / HAVZA VERgİ daİresi MÜDÜRLÜĞÜ",
    "SAMSUN / İLKADIM VERgİ daİresi MÜDÜRLÜĞÜ",
    "SAMSUN / KAVAK VERgİ daİresi MÜDÜRLÜĞÜ",
    "SAMSUN / LADİK VERgİ daİresi MÜDÜRLÜĞÜ",
    "SAMSUN / TERME VERgİ daİresi MÜDÜRLÜĞÜ",
    "SAMSUN / VEZİRKÖPRÜ VERgİ daİresi MÜDÜRLÜĞÜ",
    "SİİRT / MERKEZ VERgİ daİresi MÜDÜRLÜĞÜ",
    "SİİRT / KURTALAN VERgİ daİresi MÜDÜRLÜĞÜ",
    "SİİRT / PERVARI VERgİ daİresi MÜDÜRLÜĞÜ",
    "SİNOP / MERKEZ VERgİ daİresi MÜDÜRLÜĞÜ",
    "SİNOP / BOYABAT VERgİ daİresi MÜDÜRLÜĞÜ",
    "SİNOP / DURAĞAN VERgİ daİresi MÜDÜRLÜĞÜ",
    "SİVAS / MERKEZ VERgİ daİresi MÜDÜRLÜĞÜ",
    "SİVAS / DİVRİĞİ VERgİ daİresi MÜDÜRLÜĞÜ",
    "SİVAS / GEMEREK VERgİ daİresi MÜDÜRLÜĞÜ",
    "SİVAS / GÜRÜN VERgİ daİresi MÜDÜRLÜĞÜ",
    "SİVAS / HAFIK VERgİ daİresi MÜDÜRLÜĞÜ",
    "SİVAS / İMRANLI VERgİ daİresi MÜDÜRLÜĞÜ",
    "SİVAS / KANGAL VERgİ daİresi MÜDÜRLÜĞÜ",
    "SİVAS / ŞARKIŞla VERgİ daİresi MÜDÜRLÜĞÜ",
    "SİVAS / SUŞEHRI VERgİ daİresi MÜDÜRLÜĞÜ",
    "SİVAS / YILDIZELİ VERgİ daİresi MÜDÜRLÜĞÜ",
    "SİVAS / ZARA VERgİ daİresi MÜDÜRLÜĞÜ",
    "ŞANLIURFA / AKÇAKALE VERgİ daİresi MÜDÜRLÜĞÜ",
    "ŞANliURFA / BİRECİK VERgİ daİresi MÜDÜRLÜĞÜ",
    "ŞANLIURFA / BOZOVA VERgİ daİresi MÜDÜRLÜĞÜ",
    "ŞANLIURFA / CEYLANPINAR VERgİ daİresi MÜDÜRLÜĞÜ",
    "ŞANLIURFA / EYYÜBİYE VERgİ daİresi MÜDÜRLÜĞÜ",
    "ŞANLIURFA / HALFETİ VERgİ daİresi MÜDÜRLÜĞÜ",
    "ŞANLIURFA / HALİLİYE VERgİ daİresi MÜDÜRLÜĞÜ",
    "ŞANLIURFA / HARRAN VERgİ daİresi MÜDÜRLÜĞÜ",
    "ŞANLIURFA / KARAKÖPRÜ VERgİ daİresi MÜDÜRLÜĞÜ",
    "ŞANLIURFA / SİVEREK VERgİ daİresi MÜDÜRLÜĞÜ",
    "ŞANLIURFA / SURUÇ VERgİ daİresi MÜDÜRLÜĞÜ",
    "ŞANLIURFA / VİRANŞEHİR VERgİ daİresi MÜDÜRLÜĞÜ",
    "ŞIRNAK / MERKEZ VERgİ daİresi MÜDÜRLÜĞÜ",
    "ŞIRNAK / CİZRE VERgİ daİresi MÜDÜRLÜĞÜ",
    "ŞIRNAK / SİLOPİ VERgİ daİresi MÜDÜRLÜĞÜ",
    "TEKİRDAĞ / ÇERKEZKÖY VERgİ daİresi MÜDÜRLÜĞÜ",
    "TEKİRDAĞ / ÇORLU VERgİ daİresi MÜDÜRLÜĞÜ",
    "TEKİRDAĞ / HAYRABOLU VERgİ daİresi MÜDÜRLÜĞÜ",
    "TEKİRDAĞ / MALKARA VERgİ daİresi MÜDÜRLÜĞÜ",
    "TEKİRDAĞ / MURATLI VERgİ daİresi MÜDÜRLÜĞÜ",
    "TEKİRDAĞ / SARAY VERgİ daİresi MÜDÜRLÜĞÜ",
    "TEKİRDAĞ / SÜLEYMANPAŞA VERgİ daİresi MÜDÜRLÜĞÜ",
    "TOKAT / MERKEZ VERgİ daİresi MÜDÜRLÜĞÜ",
    "TOKAT / ALMUS VERgİ daİresi MÜDÜRLÜĞÜ",
    "TOKAT / ERBAA VERgİ daİresi MÜDÜRLÜĞÜ",
    "TOKAT / NİKSAR VERgİ daİresi MÜDÜRLÜĞÜ",
    "TOKAT / REŞADİYE VERgİ daİresi MÜDÜRLÜĞÜ",
    "TOKAT / TURHAL VERgİ daİresi MÜDÜRLÜĞÜ",
    "TOKAT / ZİLE VERgİ daİresi MÜDÜRLÜĞÜ",
    "TRABZON / AKÇAABAT VERgİ daİresi MÜDÜRLÜĞÜ",
    "TRABZON / ARAKLIVERgİ daİresi MÜDÜRLÜĞÜ",
    "TRABZON / ARSİN VERgİ daİresi MÜDÜRLÜĞÜ",
    "TRABZON / BEŞİKDÜZÜ VERgİ daİresi MÜDÜRLÜĞÜ",
    "TRABZON / OF VERgİ daİresi MÜDÜRLÜĞÜ",
    "TRABZON / ORTAHİSAR VERgİ daİresi MÜDÜRLÜĞÜ",
    "TRABZON / SÜRMENE VERgİ daİresi MÜDÜRLÜĞÜ",
    "TRABZON / VAKFIKEBIR VERgİ daİresi MÜDÜRLÜĞÜ",
    "TRABZON / YOMRA VERgİ daİresi MÜDÜRLÜĞÜ",
    "TUNCELİ / MERKEZ VERgİ daİresi MÜDÜRLÜĞÜ",
    "UŞAK / MERKEZ VERgİ daİresi MÜDÜRLÜĞÜ",
    "UŞAK / BANAZ VERgİ daİresi MÜDÜRLÜĞÜ",
    "UŞAK / EŞME VERgİ daİresi MÜDÜRLÜĞÜ",
    "VAN / MERKEZ VERgİ daİresi MÜDÜRLÜĞÜ",
    "VAN / BAŞKALE VERgİ daİresi MÜDÜRLÜĞÜ",
    "VAN / ERCİŞ VERgİ daİresi MÜDÜRLÜĞÜ",
    "VAN / GEVAŞ VERgİ daİresi MÜDÜRLÜĞÜ",
    "VAN / ÖZALP VERgİ daİresi MÜDÜRLÜĞÜ",
    "YALOVA / MERKEZ VERgİ daİresi MÜDÜRLÜĞÜ",
    "YALOVA / ÇINARCIK VERgİ daİresi MÜDÜRLÜĞÜ",
    "YOZGAT / MERKEZ VERgİ daİresi MÜDÜRLÜĞÜ",
    "YOZGAT / AKDAĞMADEN VERgİ daİresi MÜDÜRLÜĞÜ",
    "YOZGAT / BOĞAZLIYAN VERgİ daİresi MÜDÜRLÜĞÜ",
    "YOZGAT / SORGUN VERgİ daİresi MÜDÜRLÜĞÜ",
    "YOZGAT / ŞEFAATLİ VERgİ daİresi MÜDÜRLÜĞÜ",
    "YOZGAT / YERKÖY VERgİ daİresi MÜDÜRLÜĞÜ",
    "ZONGULDAK / ALAPLI VERgİ daİresi MÜDÜRLÜĞÜ",
    "ZONGULDAK / ÇAYCUMA VERgİ daİresi MÜDÜRLÜĞÜ",
    "ZONGULDAK / EREĞLİ VERgİ daİresi MÜDÜRLÜĞÜ",
    "ZONGULDAK / MERKEZ VERgİ daİresi MÜDÜRLÜĞÜ",
  ];

  const handleAddVehicle = () => {
    if (!currentVehicle.arac_tipi || !currentVehicle.cekici_plaka || !currentVehicle.kasa_tipi) {
      toast({
        title: "Hata",
        description: "Lütfen zorunlu araç bilgilerini giriniz",
        variant: "destructive",
      });
      return;
    }

    if (!currentVehicle.ruhsat_file) {
      toast({
        title: "Hata",
        description: "Lütfen ruhsat dosyası yükleyiniz",
        variant: "destructive",
      });
      return;
    }

    if (!currentVehicle.ehliyet_file) {
      toast({
        title: "Hata",
        description: "Lütfen ehliyet dosyası yükleyiniz",
        variant: "destructive",
      });
      return;
    }

    setVehicles([...vehicles, { ...currentVehicle, id: Date.now() }]);
    setCurrentVehicle({
      arac_tipi: "",
      cekici_plaka: "",
      dorse_plaka: "",
      kasa_tipi: "",
      tasima_kapasitesi: "",
      kasko_bitis: "",
      trafik_sigorta_bitis: "",
      yetki_belgesi: "",
      ruhsat_file: null,
      ehliyet_file: null,
    });
    toast({
      title: "Başarılı",
      description: "Araç başarıyla eklendi",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Lojistik Yönetimi</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="shipments">Sevkiyatlar</TabsTrigger>
          <TabsTrigger value="carriers">Nakliyeciler</TabsTrigger>
        </TabsList>

        {/* Sevkiyatlar Tab */}
        <TabsContent value="shipments">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Sevkiyat ara..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni Sevkiyat
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sevkiyat No</TableHead>
                    <TableHead>Müşteri</TableHead>
                    <TableHead>Çıkış</TableHead>
                    <TableHead>Varış</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        Henüz sevkiyat bulunmamaktadır
                      </TableCell>
                    </TableRow>
                  ) : (
                    shipments.map((shipment) => (
                      <TableRow key={shipment.id}>
                        <TableCell>{shipment.shipment_number}</TableCell>
                        <TableCell>{shipment.customer_name}</TableCell>
                        <TableCell>{shipment.origin}</TableCell>
                        <TableCell>{shipment.destination}</TableCell>
                        <TableCell>{new Date(shipment.date).toLocaleDateString("tr-TR")}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                            {shipment.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Nakliyeciler Tab */}
        <TabsContent value="carriers">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Nakliyeci ara..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => setIsAddCarrierDialogOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nakliyeci Tanımla
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Firma Adı</TableHead>
                    <TableHead>Vergi No</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>E-posta</TableHead>
                    <TableHead>Çalışma Bölgesi</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCarriers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Henüz nakliyeci bulunmamaktadır
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCarriers.map((carrier) => (
                      <TableRow key={carrier.id}>
                        <TableCell className="font-medium">{carrier.firma_adi}</TableCell>
                        <TableCell>{carrier.vergi_no}</TableCell>
                        <TableCell>{carrier.firma_telefon}</TableCell>
                        <TableCell>{carrier.firma_email}</TableCell>
                        <TableCell>{carrier.calisma_bolgesi}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Nakliyeci Tanımlama Dialog */}
      <Dialog open={isAddCarrierDialogOpen} onOpenChange={setIsAddCarrierDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Truck className="w-6 h-6 text-blue-600" />
              Nakliyeci Tanımlama Formu
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="firma" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="firma">Firma</TabsTrigger>
              <TabsTrigger value="yetkili">Yetkili</TabsTrigger>
              <TabsTrigger value="surucu">Sürücü</TabsTrigger>
              <TabsTrigger value="arac">Araç</TabsTrigger>
              <TabsTrigger value="operasyonel">Operasyonel</TabsTrigger>
              <TabsTrigger value="banka">Banka</TabsTrigger>
            </TabsList>

            {/* Firma Bilgileri Tab */}
            <TabsContent value="firma" className="space-y-6 mt-6">
              <Card className="p-6 bg-gray-50">
                <h3 className="text-lg font-semibold mb-4 text-blue-600">Firma Bilgileri</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-blue-500 font-normal">Firma Adı *</Label>
                    <Input
                      value={carrierFormData.firma_adi}
                      onChange={(e) => setCarrierFormData({ ...carrierFormData, firma_adi: e.target.value })}
                      placeholder="Firma adı"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-blue-500 font-normal">Firma Türü *</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="firma_turu"
                          value="gercek"
                          checked={carrierFormData.firma_turu === "gercek"}
                          onChange={(e) => setCarrierFormData({ ...carrierFormData, firma_turu: e.target.value })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span>Gerçek Kişi</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="firma_turu"
                          value="tuzel"
                          checked={carrierFormData.firma_turu === "tuzel"}
                          onChange={(e) => setCarrierFormData({ ...carrierFormData, firma_turu: e.target.value })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span>Tüzel</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-blue-500 font-normal">Vergi Dairesi *</Label>
                    <Select
                      value={carrierFormData.vergi_dairesi}
                      onValueChange={(value) => setCarrierFormData({ ...carrierFormData, vergi_dairesi: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Vergi dairesi seçiniz" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {vergiDaireleri.map((vd) => (
                          <SelectItem key={vd} value={vd}>
                            {vd}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-blue-500 font-normal">Vergi No *</Label>
                    <Input
                      value={carrierFormData.vergi_no}
                      onChange={(e) => setCarrierFormData({ ...carrierFormData, vergi_no: e.target.value })}
                      placeholder="Vergi numarası"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-blue-500 font-normal">Mersis No</Label>
                    <Input
                      value={carrierFormData.mersis_no}
                      onChange={(e) => setCarrierFormData({ ...carrierFormData, mersis_no: e.target.value })}
                      placeholder="Mersis numarası"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-blue-500 font-normal">Ticaret Sicil No</Label>
                    <Input
                      value={carrierFormData.ticaret_sicil_no}
                      onChange={(e) => setCarrierFormData({ ...carrierFormData, ticaret_sicil_no: e.target.value })}
                      placeholder="Ticaret sicil numarası"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-blue-500 font-normal">Merkez Adres</Label>
                    <textarea
                      className="w-full min-h-[80px] p-2 border rounded-md"
                      value={carrierFormData.merkez_adres}
                      onChange={(e) => setCarrierFormData({ ...carrierFormData, merkez_adres: e.target.value })}
                      placeholder="Merkez adres"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-blue-500 font-normal">Şube Adresi (varsa)</Label>
                    <textarea
                      className="w-full min-h-[80px] p-2 border rounded-md"
                      value={carrierFormData.sube_adres}
                      onChange={(e) => setCarrierFormData({ ...carrierFormData, sube_adres: e.target.value })}
                      placeholder="Şube adres"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-blue-500 font-normal">Firma Telefonu *</Label>
                    <Input
                      value={carrierFormData.firma_telefon}
                      onChange={(e) => setCarrierFormData({ ...carrierFormData, firma_telefon: e.target.value })}
                      placeholder="Telefon"
                      type="tel"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-blue-500 font-normal">Firma E-posta</Label>
                    <Input
                      value={carrierFormData.firma_email}
                      onChange={(e) => setCarrierFormData({ ...carrierFormData, firma_email: e.target.value })}
                      placeholder="E-posta"
                      type="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-blue-500 font-normal">Fatura / E-Fatura E-posta</Label>
                    <Input
                      value={carrierFormData.fatura_email}
                      onChange={(e) => setCarrierFormData({ ...carrierFormData, fatura_email: e.target.value })}
                      placeholder="Fatura e-posta"
                      type="email"
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Yetkili Bilgileri Tab */}
            <TabsContent value="yetkili" className="space-y-6 mt-6">
              <Card className="p-6 bg-gray-50">
                <h3 className="text-lg font-semibold mb-4 text-blue-600">Yetkili Bilgileri</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-blue-500 font-normal">Yetkili Adı Soyadı *</Label>
                    <Input
                      value={carrierFormData.yetkili_adi}
                      onChange={(e) => setCarrierFormData({ ...carrierFormData, yetkili_adi: e.target.value })}
                      placeholder="Ad Soyad"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-blue-500 font-normal">Yetkili Telefonu *</Label>
                    <Input
                      value={carrierFormData.yetkili_telefon}
                      onChange={(e) => setCarrierFormData({ ...carrierFormData, yetkili_telefon: e.target.value })}
                      placeholder="Telefon"
                      type="tel"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-blue-500 font-normal">Yetkili E-posta</Label>
                    <Input
                      value={carrierFormData.yetkili_email}
                      onChange={(e) => setCarrierFormData({ ...carrierFormData, yetkili_email: e.target.value })}
                      placeholder="E-posta"
                      type="email"
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Sürücü Bilgileri Tab */}
            <TabsContent value="surucu" className="space-y-6 mt-6">
              <Card className="p-6 bg-gray-50">
                <h3 className="text-lg font-semibold mb-4 text-blue-600">Sürücü Bilgileri</h3>
                <p className="text-sm text-gray-600 mb-4">Her araç için ayrı doldurulur</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Sürücü Adı Soyadı</Label>
                    <Input
                      value={formData.surucu_ad_soyad}
                      onChange={(e) => setFormData({ ...formData, surucu_ad_soyad: e.target.value })}
                      placeholder="Ad Soyad"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>T.C. Kimlik No</Label>
                    <Input
                      value={formData.surucu_tc}
                      onChange={(e) => setFormData({ ...formData, surucu_tc: e.target.value })}
                      placeholder="12345678901"
                      maxLength={11}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Telefon 1</Label>
                    <Input
                      value={formData.surucu_telefon1}
                      onChange={(e) => setFormData({ ...formData, surucu_telefon1: e.target.value })}
                      placeholder="0555 123 45 67"
                      type="tel"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefon 2</Label>
                    <Input
                      value={formData.surucu_telefon2}
                      onChange={(e) => setFormData({ ...formData, surucu_telefon2: e.target.value })}
                      placeholder="0555 123 45 67"
                      type="tel"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>SRC Belge No</Label>
                    <Input
                      value={formData.src_belge_no}
                      onChange={(e) => setFormData({ ...formData, src_belge_no: e.target.value })}
                      placeholder="SRC belge no"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Psikoteknik Belge No</Label>
                    <Input
                      value={formData.psikoteknik_belge_no}
                      onChange={(e) => setFormData({ ...formData, psikoteknik_belge_no: e.target.value })}
                      placeholder="Psikoteknik no"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ehliyet Sınıfı</Label>
                    <Select
                      value={formData.ehliyet_sinifi}
                      onValueChange={(value) => setFormData({ ...formData, ehliyet_sinifi: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="B">B</SelectItem>
                        <SelectItem value="C">C</SelectItem>
                        <SelectItem value="D">D</SelectItem>
                        <SelectItem value="E">E</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ehliyet Geçerlilik Tarihi</Label>
                    <Input
                      value={formData.ehliyet_gecerlilik}
                      onChange={(e) => setFormData({ ...formData, ehliyet_gecerlilik: e.target.value })}
                      type="date"
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Araç Bilgileri Tab */}
            <TabsContent value="arac" className="space-y-6 mt-6">
              <Card className="p-6 bg-gray-50">
                <h3 className="text-lg font-semibold mb-4 text-blue-600">Araç Bilgileri</h3>
                <p className="text-sm text-gray-600 mb-4">Her araç için ayrı kart açılır</p>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label>Araç Tipi</Label>
                    <Select
                      value={formData.arac_tipi}
                      onValueChange={(value) => setFormData({ ...formData, arac_tipi: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="panelvan">Panelvan</SelectItem>
                        <SelectItem value="kamyonet">Kamyonet</SelectItem>
                        <SelectItem value="kamyon">Kamyon</SelectItem>
                        <SelectItem value="tir">Tır</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Çekici Plakası</Label>
                    <Input
                      value={formData.cekici_plaka}
                      onChange={(e) => setFormData({ ...formData, cekici_plaka: e.target.value })}
                      placeholder="34 ABC 123"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Dorse Plakası (varsa)</Label>
                    <Input
                      value={formData.dorse_plaka}
                      onChange={(e) => setFormData({ ...formData, dorse_plaka: e.target.value })}
                      placeholder="34 XYZ 456"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Kasa Tipi</Label>
                    <Select
                      value={formData.kasa_tipi}
                      onValueChange={(value) => setFormData({ ...formData, kasa_tipi: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kapali">Kapalı</SelectItem>
                        <SelectItem value="acik">Açık</SelectItem>
                        <SelectItem value="tenteli">Tenteli</SelectItem>
                        <SelectItem value="frigo">Frigo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label>Taşıma Kapasitesi (kg)</Label>
                    <Input
                      value={formData.tasima_kapasitesi}
                      onChange={(e) => setFormData({ ...formData, tasima_kapasitesi: e.target.value })}
                      placeholder="1000"
                      type="number"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Kasko Bitiş Tarihi</Label>
                    <Input
                      value={formData.kasko_bitis}
                      onChange={(e) => setFormData({ ...formData, kasko_bitis: e.target.value })}
                      type="date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Trafik Sigortası Bitiş Tarihi</Label>
                    <Input
                      value={formData.trafik_sigorta_bitis}
                      onChange={(e) => setFormData({ ...formData, trafik_sigorta_bitis: e.target.value })}
                      type="date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Yetki Belgesi (K1/K2)</Label>
                    <Select
                      value={formData.yetki_belgesi}
                      onValueChange={(value) => setFormData({ ...formData, yetki_belgesi: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="K1">K1</SelectItem>
                        <SelectItem value="K2">K2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border-t border-gray-100 border-dashed my-4"></div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-blue-500 font-normal">Ruhsat Dosyası *</Label>
                    <Input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => setCurrentVehicle({ ...currentVehicle, ruhsat_file: e.target.files?.[0] || null })}
                      required
                    />
                    <p className="text-xs text-gray-500">PDF veya resim formatında yükleyiniz</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-blue-500 font-normal">Ehliyet Dosyası *</Label>
                    <Input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => setCurrentVehicle({ ...currentVehicle, ehliyet_file: e.target.files?.[0] || null })}
                      required
                    />
                    <p className="text-xs text-gray-500">PDF veya resim formatında yükleyiniz</p>
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <Button
                    type="button"
                    onClick={handleAddVehicle}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Araç Ekle
                  </Button>
                </div>
              </Card>
            </TabsContent>

            {/* Operasyonel Bilgiler Tab */}
            <TabsContent value="operasyonel" className="space-y-6 mt-6">
              <Card className="p-6 bg-gray-50">
                <h3 className="text-lg font-semibold mb-4 text-blue-600">Operasyonel Bilgiler</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label>Çalışma Bölgesi</Label>
                    <Select
                      value={formData.calisma_bolgesi}
                      onValueChange={(value) => setFormData({ ...formData, calisma_bolgesi: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="turkiye_geneli">Türkiye Geneli</SelectItem>
                        <SelectItem value="bolgesel">Bölgesel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Uzmanlık</Label>
                    <Select
                      value={formData.uzmanlik}
                      onValueChange={(value) => setFormData({ ...formData, uzmanlik: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="parsiyel">Parsiyel</SelectItem>
                        <SelectItem value="komple">Komple</SelectItem>
                        <SelectItem value="frigo">Frigo</SelectItem>
                        <SelectItem value="agir_yuk">Ağır Yük</SelectItem>
                        <SelectItem value="diger">Diğer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ödeme Şekli</Label>
                    <Select
                      value={formData.odeme_sekli}
                      onValueChange={(value) => setFormData({ ...formData, odeme_sekli: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nakit">Nakit</SelectItem>
                        <SelectItem value="havale">Havale</SelectItem>
                        <SelectItem value="vadeli">Vadeli</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ödeme Günü</Label>
                    <Select
                      value={formData.odeme_gunu}
                      onValueChange={(value) => setFormData({ ...formData, odeme_gunu: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seçiniz" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 Gün</SelectItem>
                        <SelectItem value="15">15 Gün</SelectItem>
                        <SelectItem value="30">30 Gün</SelectItem>
                        <SelectItem value="diger">Diğer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Banka Bilgileri Tab */}
            <TabsContent value="banka" className="space-y-6 mt-6">
              <Card className="p-6 bg-gray-50">
                <h3 className="text-lg font-semibold mb-4 text-blue-600">Banka Bilgileri</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label>Banka Adı</Label>
                    <Input
                      value={formData.banka_adi}
                      onChange={(e) => setFormData({ ...formData, banka_adi: e.target.value })}
                      placeholder="Banka adı"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>IBAN</Label>
                    <Input
                      value={formData.iban}
                      onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                      placeholder="TR00 0000 0000 0000 0000 0000 00"
                      maxLength={32}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hesap Sahibi</Label>
                    <Input
                      value={formData.hesap_sahibi}
                      onChange={(e) => setFormData({ ...formData, hesap_sahibi: e.target.value })}
                      placeholder="Ad Soyad / Firma Adı"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Vergi Ünvanı ile Uyum</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="vergiUyum"
                        value="evet"
                        checked={formData.vergi_uyum === "evet"}
                        onChange={() => setFormData({ ...formData, vergi_uyum: "evet" })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span>Evet</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="vergiUyum"
                        value="hayir"
                        checked={formData.vergi_uyum === "hayir"}
                        onChange={() => setFormData({ ...formData, vergi_uyum: "hayir" })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span>Hayır</span>
                    </label>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex justify-end gap-2 mt-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsAddCarrierDialogOpen(false)}
              className="bg-red-500 text-white hover:bg-red-600 hover:text-white border-0"
            >
              Vazgeç
            </Button>
            <div className="flex">
              <Button
                onClick={handleAddCarrier}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white rounded-r-none"
              >
                {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white rounded-l-none border-l border-green-700 px-2"
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}