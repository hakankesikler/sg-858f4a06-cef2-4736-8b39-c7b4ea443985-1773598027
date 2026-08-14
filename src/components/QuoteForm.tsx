"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Plus, Trash2 } from "lucide-react";

const cargoSchema = z.object({
  width: z.string().min(1, "En giriniz"),
  length: z.string().min(1, "Boy giriniz"),
  height: z.string().min(1, "Yükseklik giriniz"),
  weight: z.string().min(1, "Ağırlık giriniz"),
  quantity: z.string().min(1, "Adet giriniz"),
});

const formSchema = z.object({
  fullName: z.string().min(2, "Ad Soyad en az 2 karakter olmalıdır"),
  companyName: z.string().min(2, "Firma ismi gereklidir"),
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  phone: z.string().min(10, "Geçerli bir telefon numarası giriniz"),
  serviceType: z.enum(["domestic", "international"]),
  transportMode: z.string().min(1, "Taşıma türü seçiniz"),
  transportDetail: z.string().optional(),
  loadingPoint: z.string().min(2, "Yükleme noktası giriniz"),
  deliveryPoint: z.string().min(2, "Teslimat noktası giriniz"),
  specialRequirements: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;
type CargoData = z.infer<typeof cargoSchema>;

const domesticRoadOptions = [
  { value: "pallet", label: "Palet" },
  { value: "one-cover", label: "1 Kapak" },
  { value: "half-truck", label: "Yarım Kamyon" },
  { value: "full-truck", label: "Tam Kamyon" },
  { value: "kirkayak", label: "Kırkayak" },
  { value: "tir", label: "Tır" },
  { value: "other", label: "Diğer" },
];

const internationalRoadOptions = [
  { value: "pallet", label: "Palet" },
  { value: "one-cover", label: "1 Kapak" },
  { value: "half-truck", label: "Yarım Kamyon" },
  { value: "full-truck", label: "Tam Kamyon" },
  { value: "kirkayak", label: "Kırkayak" },
  { value: "tir", label: "Tır" },
  { value: "other", label: "Diğer" },
];

const airwayOptions = [
  { value: "file", label: "Dosya" },
  { value: "package", label: "Paket" },
  { value: "box", label: "Koli" },
  { value: "pallet", label: "Palet" },
];

const seawayOptions = [
  { value: "pallet", label: "Palet" },
  { value: "box", label: "Koli" },
  { value: "container-20", label: "20 cc Konteyner" },
  { value: "container-40", label: "40 cc Konteyner" },
];

export function QuoteForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [cargos, setCargos] = useState<CargoData[]>([
    { width: "", length: "", height: "", weight: "", quantity: "" }
  ]);
  const [cargoErrors, setCargoErrors] = useState<Array<Partial<Record<keyof CargoData, string>>>>([{}]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const serviceType = watch("serviceType");
  const transportMode = watch("transportMode");

  const getTransportOptions = () => {
    if (serviceType === "domestic") {
      return [{ value: "road", label: "Karayolu" }];
    } else {
      return [
        { value: "road", label: "Karayolu" },
        { value: "air", label: "Havayolu" },
        { value: "sea", label: "Denizyolu" },
      ];
    }
  };

  const getTransportDetailOptions = () => {
    if (serviceType === "domestic" && transportMode === "road") {
      return domesticRoadOptions;
    } else if (serviceType === "international") {
      if (transportMode === "road") return internationalRoadOptions;
      if (transportMode === "air") return airwayOptions;
      if (transportMode === "sea") return seawayOptions;
    }
    return [];
  };

  const addCargo = () => {
    setCargos([...cargos, { width: "", length: "", height: "", weight: "", quantity: "" }]);
    setCargoErrors([...cargoErrors, {}]);
  };

  const removeCargo = (index: number) => {
    if (cargos.length > 1) {
      const newCargos = cargos.filter((_, i) => i !== index);
      const newErrors = cargoErrors.filter((_, i) => i !== index);
      setCargos(newCargos);
      setCargoErrors(newErrors);
    }
  };

  const updateCargo = (index: number, field: keyof CargoData, value: string) => {
    const newCargos = [...cargos];
    newCargos[index] = { ...newCargos[index], [field]: value };
    setCargos(newCargos);
    
    const newErrors = [...cargoErrors];
    newErrors[index] = { ...newErrors[index], [field]: undefined };
    setCargoErrors(newErrors);
  };

  const validateCargos = (): boolean => {
    const newErrors: Array<Partial<Record<keyof CargoData, string>>> = [];
    let isValid = true;

    cargos.forEach((cargo) => {
      const errors: Partial<Record<keyof CargoData, string>> = {};
      
      if (!cargo.width || cargo.width.trim() === "") {
        errors.width = "En giriniz";
        isValid = false;
      }
      if (!cargo.length || cargo.length.trim() === "") {
        errors.length = "Boy giriniz";
        isValid = false;
      }
      if (!cargo.height || cargo.height.trim() === "") {
        errors.height = "Yükseklik giriniz";
        isValid = false;
      }
      if (!cargo.weight || cargo.weight.trim() === "") {
        errors.weight = "Ağırlık giriniz";
        isValid = false;
      }
      if (!cargo.quantity || cargo.quantity.trim() === "") {
        errors.quantity = "Adet giriniz";
        isValid = false;
      }
      
      newErrors.push(errors);
    });

    setCargoErrors(newErrors);
    return isValid;
  };

  const onSubmit = async (data: FormData) => {
    if (!validateCargos()) {
      setSubmitError("Lütfen tüm yük bilgilerini doldurun");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch("/api/send-quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          cargos,
        }),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        console.error("Non-JSON response:", textResponse);
        throw new Error("Sunucu beklenmeyen bir yanıt döndü. Lütfen daha sonra tekrar deneyin.");
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Form gönderilemedi");
      }

      setSubmitSuccess(true);
      reset();
      setCargos([{ width: "", length: "", height: "", weight: "", quantity: "" }]);
      setCargoErrors([{}]);
      
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error) {
      if (error instanceof SyntaxError) {
        setSubmitError("API yanıtı işlenemedi. Lütfen sayfayı yenileyip tekrar deneyin.");
        console.error("JSON parse error:", error);
      } else {
        setSubmitError(error instanceof Error ? error.message : "Form gönderilirken bir hata oluştu. Lütfen tekrar deneyin.");
      }
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Kişisel Bilgiler */}
      <div className="space-y-4">
        <h3 className="font-heading font-semibold text-xl text-white mb-4">Kişisel Bilgiler</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fullName" className="text-white">Ad Soyad *</Label>
            <Input
              id="fullName"
              {...register("fullName")}
              className="mt-1 bg-white/95"
              placeholder="Ad Soyad"
            />
            {errors.fullName && (
              <p className="text-red-300 text-sm mt-1">{errors.fullName.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="companyName" className="text-white">Firma İsmi *</Label>
            <Input
              id="companyName"
              {...register("companyName")}
              className="mt-1 bg-white/95"
              placeholder="Firma İsmi"
            />
            {errors.companyName && (
              <p className="text-red-300 text-sm mt-1">{errors.companyName.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email" className="text-white">E-posta Adresi *</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              className="mt-1 bg-white/95"
              placeholder="ornek@firma.com"
            />
            {errors.email && (
              <p className="text-red-300 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phone" className="text-white">Telefon Numarası *</Label>
            <Input
              id="phone"
              {...register("phone")}
              className="mt-1 bg-white/95"
              placeholder="+90 555 123 45 67"
            />
            {errors.phone && (
              <p className="text-red-300 text-sm mt-1">{errors.phone.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Hizmet Seçimi */}
      <div className="space-y-4">
        <h3 className="font-heading font-semibold text-xl text-white mb-4">Hizmet Bilgileri</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="serviceType" className="text-white">Hizmet Türü *</Label>
            <Select onValueChange={(value) => setValue("serviceType", value as "domestic" | "international")}>
              <SelectTrigger className="mt-1 bg-white/95">
                <SelectValue placeholder="Seçiniz" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="domestic">Yurt İçi</SelectItem>
                <SelectItem value="international">Uluslararası</SelectItem>
              </SelectContent>
            </Select>
            {errors.serviceType && (
              <p className="text-red-300 text-sm mt-1">{errors.serviceType.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="transportMode" className="text-white">Taşıma Türü *</Label>
            <Select 
              onValueChange={(value) => {
                setValue("transportMode", value);
                setValue("transportDetail", "");
              }}
              disabled={!serviceType}
            >
              <SelectTrigger className="mt-1 bg-white/95">
                <SelectValue placeholder="Önce hizmet türü seçin" />
              </SelectTrigger>
              <SelectContent>
                {getTransportOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.transportMode && (
              <p className="text-red-300 text-sm mt-1">{errors.transportMode.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="transportDetail" className="text-white">Detay</Label>
            <Select 
              onValueChange={(value) => setValue("transportDetail", value)}
              disabled={!transportMode}
            >
              <SelectTrigger className="mt-1 bg-white/95">
                <SelectValue placeholder="Seçiniz" />
              </SelectTrigger>
              <SelectContent>
                {getTransportDetailOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="loadingPoint" className="text-white">Yükleme Noktası *</Label>
            <Input
              id="loadingPoint"
              {...register("loadingPoint")}
              className="mt-1 bg-white/95"
              placeholder="İstanbul"
            />
            {errors.loadingPoint && (
              <p className="text-red-300 text-sm mt-1">{errors.loadingPoint.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="deliveryPoint" className="text-white">Teslimat Noktası *</Label>
            <Input
              id="deliveryPoint"
              {...register("deliveryPoint")}
              className="mt-1 bg-white/95"
              placeholder="Ankara"
            />
            {errors.deliveryPoint && (
              <p className="text-red-300 text-sm mt-1">{errors.deliveryPoint.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Yük Özellikleri - Dinamik */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-semibold text-xl text-white">Yük Özellikleri</h3>
        </div>
        
        {cargos.map((cargo, index) => (
          <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-heading font-medium text-lg text-white">
                Yük #{index + 1}
              </h4>
              {cargos.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCargo(index)}
                  className="text-red-300 hover:text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Sil
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <Label htmlFor={`cargo-${index}-width`} className="text-white">En (cm) *</Label>
                <Input
                  id={`cargo-${index}-width`}
                  type="number"
                  value={cargo.width}
                  onChange={(e) => updateCargo(index, "width", e.target.value)}
                  className="mt-1 bg-white/95"
                  placeholder="100"
                />
                {cargoErrors[index]?.width && (
                  <p className="text-red-300 text-sm mt-1">{cargoErrors[index].width}</p>
                )}
              </div>

              <div>
                <Label htmlFor={`cargo-${index}-length`} className="text-white">Boy (cm) *</Label>
                <Input
                  id={`cargo-${index}-length`}
                  type="number"
                  value={cargo.length}
                  onChange={(e) => updateCargo(index, "length", e.target.value)}
                  className="mt-1 bg-white/95"
                  placeholder="120"
                />
                {cargoErrors[index]?.length && (
                  <p className="text-red-300 text-sm mt-1">{cargoErrors[index].length}</p>
                )}
              </div>

              <div>
                <Label htmlFor={`cargo-${index}-height`} className="text-white">Yükseklik (cm) *</Label>
                <Input
                  id={`cargo-${index}-height`}
                  type="number"
                  value={cargo.height}
                  onChange={(e) => updateCargo(index, "height", e.target.value)}
                  className="mt-1 bg-white/95"
                  placeholder="80"
                />
                {cargoErrors[index]?.height && (
                  <p className="text-red-300 text-sm mt-1">{cargoErrors[index].height}</p>
                )}
              </div>

              <div>
                <Label htmlFor={`cargo-${index}-weight`} className="text-white">Ağırlık (kg) *</Label>
                <Input
                  id={`cargo-${index}-weight`}
                  type="number"
                  value={cargo.weight}
                  onChange={(e) => updateCargo(index, "weight", e.target.value)}
                  className="mt-1 bg-white/95"
                  placeholder="500"
                />
                {cargoErrors[index]?.weight && (
                  <p className="text-red-300 text-sm mt-1">{cargoErrors[index].weight}</p>
                )}
              </div>

              <div>
                <Label htmlFor={`cargo-${index}-quantity`} className="text-white">Adet *</Label>
                <Input
                  id={`cargo-${index}-quantity`}
                  type="number"
                  value={cargo.quantity}
                  onChange={(e) => updateCargo(index, "quantity", e.target.value)}
                  className="mt-1 bg-white/95"
                  placeholder="1"
                />
                {cargoErrors[index]?.quantity && (
                  <p className="text-red-300 text-sm mt-1">{cargoErrors[index].quantity}</p>
                )}
              </div>
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addCargo}
          className="w-full border-white/20 text-white hover:bg-white/10 hover:text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Yeni Yük Ekle
        </Button>
      </div>

      {/* Özel Gereksinimler */}
      <div className="space-y-4">
        <h3 className="font-heading font-semibold text-xl text-white mb-4">Özel Gereksinimler</h3>
        <div>
          <Label htmlFor="specialRequirements" className="text-white">Ek Notlar</Label>
          <Textarea
            id="specialRequirements"
            {...register("specialRequirements")}
            className="mt-1 bg-white/95"
            placeholder="Varsa özel taleplerinizi buraya yazabilirsiniz..."
            rows={4}
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex flex-col items-center gap-4 pt-4">
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="bg-accent hover:bg-accent/90 text-white h-12 px-8 w-full md:w-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Gönderiliyor...
            </>
          ) : (
            <>
              Teklif Talep Et <Send className="ml-2 w-5 h-5" />
            </>
          )}
        </Button>

        {submitSuccess && (
          <p className="text-green-300 font-medium">
            ✓ Talebiniz başarıyla gönderildi! En kısa sürede size dönüş yapacağız.
          </p>
        )}

        {submitError && (
          <p className="text-red-300 font-medium">{submitError}</p>
        )}
      </div>
    </form>
  );
}