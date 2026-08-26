"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { ArrowLeft, ArrowRight, Loader2, Send, Plus, Trash2 } from "lucide-react";

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
  email: z.string().trim().refine(
    (value) => value === "" || /^\S+@\S+\.\S+$/.test(value),
    "Geçerli bir e-posta adresi giriniz",
  ),
  phone: z.string().trim().refine(
    (value) => value === "" || value.replace(/\D/g, "").length >= 10,
    "Geçerli bir telefon numarası giriniz",
  ),
  serviceType: z.enum(["domestic", "international"]),
  transportMode: z.string().min(1, "Taşıma türü seçiniz"),
  transportDetail: z.string().optional(),
  loadingPoint: z.string().min(2, "Yükleme noktası giriniz"),
  deliveryPoint: z.string().min(2, "Teslimat noktası giriniz"),
  specialRequirements: z.string().optional(),
  kvkkAcknowledged: z.boolean().refine((value) => value, {
    message: "KVKK Aydınlatma Metni hakkında bilgilendirildiğinizi işaretleyiniz",
  }),
  commercialConsent: z.boolean().optional(),
}).superRefine((data, ctx) => {
  if (!data.email && !data.phone) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Telefon veya e-postadan en az birini giriniz",
      path: ["phone"],
    });
  }
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
  const [step, setStep] = useState<1 | 2>(1);
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
    trigger,
    control,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      phone: "",
      kvkkAcknowledged: false,
      commercialConsent: false,
    },
  });

  const serviceType = watch("serviceType");
  const transportMode = watch("transportMode");
  const transportDetail = watch("transportDetail");

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

  const goToShipmentDetails = async () => {
    const isStepValid = await trigger([
      "fullName",
      "companyName",
      "email",
      "phone",
      "loadingPoint",
      "deliveryPoint",
    ], { shouldFocus: true });

    if (isStepValid) {
      setSubmitError("");
      setStep(2);
    }
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
      setStep(1);
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
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5" aria-label={`Teklif formu, adım ${step} / 2`}>
        <div className="mb-3 flex items-center justify-between gap-4 text-sm font-medium">
          <span className={step === 1 ? "text-white" : "text-blue-200"}>1. İletişim ve güzergâh</span>
          <span className={step === 2 ? "text-white" : "text-blue-200"}>2. Taşıma ve yük</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: step === 1 ? "50%" : "100%" }}
          />
        </div>
        <p className="mt-3 text-sm text-blue-100">Adım {step} / 2</p>
      </div>

      {step === 1 && (
        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="font-heading text-xl font-semibold text-white">İletişim Bilgileri</h3>
            <p className="text-sm text-blue-100">Telefon veya e-posta bilgilerinden en az birini girmeniz yeterlidir.</p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="fullName" className="text-white">Ad Soyad *</Label>
                <Input id="fullName" {...register("fullName")} className="mt-1 bg-white/95" placeholder="Ad Soyad" />
                {errors.fullName && <p className="mt-1 text-sm text-red-300">{errors.fullName.message}</p>}
              </div>

              <div>
                <Label htmlFor="companyName" className="text-white">Firma İsmi *</Label>
                <Input id="companyName" {...register("companyName")} className="mt-1 bg-white/95" placeholder="Firma İsmi" />
                {errors.companyName && <p className="mt-1 text-sm text-red-300">{errors.companyName.message}</p>}
              </div>

              <div>
                <Label htmlFor="phone" className="text-white">Telefon Numarası</Label>
                <Input id="phone" type="tel" autoComplete="tel" {...register("phone")} className="mt-1 bg-white/95" placeholder="+90 555 123 45 67" />
                {errors.phone && <p className="mt-1 text-sm text-red-300">{errors.phone.message}</p>}
              </div>

              <div>
                <Label htmlFor="email" className="text-white">E-posta Adresi</Label>
                <Input id="email" type="email" autoComplete="email" {...register("email")} className="mt-1 bg-white/95" placeholder="ornek@firma.com" />
                {errors.email && <p className="mt-1 text-sm text-red-300">{errors.email.message}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-heading text-xl font-semibold text-white">Güzergâh</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="loadingPoint" className="text-white">Yükleme Noktası *</Label>
                <Input id="loadingPoint" {...register("loadingPoint")} className="mt-1 bg-white/95" placeholder="İl / İlçe" />
                {errors.loadingPoint && <p className="mt-1 text-sm text-red-300">{errors.loadingPoint.message}</p>}
              </div>

              <div>
                <Label htmlFor="deliveryPoint" className="text-white">Teslimat Noktası *</Label>
                <Input id="deliveryPoint" {...register("deliveryPoint")} className="mt-1 bg-white/95" placeholder="İl / İlçe" />
                {errors.deliveryPoint && <p className="mt-1 text-sm text-red-300">{errors.deliveryPoint.message}</p>}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="button" size="lg" onClick={goToShipmentDetails} className="h-12 w-full bg-accent px-8 text-white hover:bg-accent/90 sm:w-auto">
              Devam Et <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="font-heading text-xl font-semibold text-white">Taşıma Bilgileri</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="serviceType" className="text-white">Hizmet Türü *</Label>
                <Select
                  value={serviceType}
                  onValueChange={(value) => {
                    setValue("serviceType", value as "domestic" | "international", { shouldValidate: true });
                    setValue("transportMode", "");
                    setValue("transportDetail", "");
                  }}
                >
                  <SelectTrigger id="serviceType" className="mt-1 bg-white/95"><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="domestic">Yurt İçi</SelectItem>
                    <SelectItem value="international">Uluslararası</SelectItem>
                  </SelectContent>
                </Select>
                {errors.serviceType && <p className="mt-1 text-sm text-red-300">{errors.serviceType.message}</p>}
              </div>

              <div>
                <Label htmlFor="transportMode" className="text-white">Taşıma Türü *</Label>
                <Select
                  value={transportMode}
                  onValueChange={(value) => {
                    setValue("transportMode", value, { shouldValidate: true });
                    setValue("transportDetail", "");
                  }}
                  disabled={!serviceType}
                >
                  <SelectTrigger id="transportMode" className="mt-1 bg-white/95"><SelectValue placeholder={serviceType ? "Seçiniz" : "Önce hizmet türünü seçin"} /></SelectTrigger>
                  <SelectContent>
                    {getTransportOptions().map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.transportMode && <p className="mt-1 text-sm text-red-300">{errors.transportMode.message}</p>}
              </div>

              <div>
                <Label htmlFor="transportDetail" className="text-white">Yük / Araç Detayı</Label>
                <Select value={transportDetail || ""} onValueChange={(value) => setValue("transportDetail", value)} disabled={!transportMode}>
                  <SelectTrigger id="transportDetail" className="mt-1 bg-white/95"><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                  <SelectContent>
                    {getTransportDetailOptions().map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-heading text-xl font-semibold text-white">Yük Özellikleri</h3>
              <p className="mt-1 text-sm text-blue-100">Doğru fiyatlandırma için ölçü, ağırlık ve adet bilgilerini girin.</p>
            </div>

            {cargos.map((cargo, index) => (
              <div key={index} className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-heading text-lg font-medium text-white">Yük #{index + 1}</h4>
                  {cargos.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeCargo(index)} className="text-red-300 hover:bg-red-500/10 hover:text-red-400">
                      <Trash2 className="mr-1 h-4 w-4" /> Sil
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                  {([
                    ["width", "En (cm)", "100"],
                    ["length", "Boy (cm)", "120"],
                    ["height", "Yükseklik (cm)", "80"],
                    ["weight", "Ağırlık (kg)", "500"],
                    ["quantity", "Adet", "1"],
                  ] as const).map(([field, label, placeholder]) => (
                    <div key={field}>
                      <Label htmlFor={`cargo-${index}-${field}`} className="text-white">{label} *</Label>
                      <Input
                        id={`cargo-${index}-${field}`}
                        type="number"
                        min="0"
                        value={cargo[field]}
                        onChange={(event) => updateCargo(index, field, event.target.value)}
                        className="mt-1 bg-white/95"
                        placeholder={placeholder}
                      />
                      {cargoErrors[index]?.[field] && <p className="mt-1 text-sm text-red-300">{cargoErrors[index]?.[field]}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addCargo} className="w-full border-white/20 text-white hover:bg-white/10 hover:text-white">
              <Plus className="mr-2 h-4 w-4" /> Yeni Yük Ekle
            </Button>
          </div>

          <div className="space-y-4">
            <h3 className="font-heading text-xl font-semibold text-white">Ek Bilgiler</h3>
            <div>
              <Label htmlFor="specialRequirements" className="text-white">Ek Notlar</Label>
              <Textarea id="specialRequirements" {...register("specialRequirements")} className="mt-1 bg-white/95" placeholder="Varsa özel taleplerinizi buraya yazabilirsiniz..." rows={3} />
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-white/15 bg-white/5 p-4 sm:p-5">
            <div>
              <div className="flex items-start gap-3">
                <Controller
                  name="kvkkAcknowledged"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="kvkkAcknowledged"
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                      aria-invalid={Boolean(errors.kvkkAcknowledged)}
                      className="mt-1 border-white/70 data-[state=checked]:border-accent data-[state=checked]:bg-accent"
                    />
                  )}
                />
                <Label htmlFor="kvkkAcknowledged" className="cursor-pointer text-sm font-normal leading-6 text-white">
                  <a
                    href="/kvkk-aydinlatma-metni"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-orange-300 underline underline-offset-2 hover:text-orange-200"
                  >
                    KVKK Aydınlatma Metni
                  </a>{" "}
                  kapsamında kişisel verilerimin teklif talebimin işleme alınması amacıyla kullanılması hakkında bilgilendirildim. *
                </Label>
              </div>
              {errors.kvkkAcknowledged && <p className="ml-7 mt-1 text-sm text-red-300">{errors.kvkkAcknowledged.message}</p>}
            </div>

            <div className="border-t border-white/10 pt-3">
              <div className="flex items-start gap-3">
                <Controller
                  name="commercialConsent"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="commercialConsent"
                      checked={field.value || false}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                      className="mt-1 border-white/70 data-[state=checked]:border-accent data-[state=checked]:bg-accent"
                    />
                  )}
                />
                <div>
                  <Label htmlFor="commercialConsent" className="cursor-pointer text-sm font-normal leading-6 text-white">
                    Kampanya, tanıtım ve duyurular için e-posta, SMS veya telefon yoluyla ticari elektronik ileti almak istiyorum. <span className="text-blue-200">(İsteğe bağlı)</span>
                  </Label>
                  <p className="mt-1 text-xs leading-5 text-blue-200">Bu tercih teklif talebinin gönderilmesi için zorunlu değildir ve daha sonra geri çekilebilir.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
            <Button type="button" size="lg" variant="outline" onClick={() => setStep(1)} className="h-12 border-white/20 text-white hover:bg-white/10 hover:text-white">
              <ArrowLeft className="mr-2 h-5 w-5" /> Geri
            </Button>
            <Button type="submit" size="lg" disabled={isSubmitting} className="h-12 bg-accent px-8 text-white hover:bg-accent/90">
              {isSubmitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Gönderiliyor...</> : <>Teklif Talep Et <Send className="ml-2 h-5 w-5" /></>}
            </Button>
          </div>
        </div>
      )}

      {submitSuccess && <p className="text-center font-medium text-green-300">✓ Talebiniz başarıyla gönderildi! En kısa sürede size dönüş yapacağız.</p>}
      {submitError && <p className="text-center font-medium text-red-300">{submitError}</p>}
    </form>
  );
}
