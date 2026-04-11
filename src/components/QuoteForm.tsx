"use client";

import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const quoteFormSchema = z.object({
  fullName: z.string().min(2, { message: "Ad Soyad en az 2 karakter olmalıdır." }),
  companyName: z.string().optional(),
  email: z.string().email({ message: "Geçerli bir e-posta adresi giriniz." }),
  phone: z.string().min(10, { message: "Geçerli bir telefon numarası giriniz." }),
  
  // Transport details
  serviceType: z.enum(["domestic", "international"], {
    required_error: "Lütfen hizmet türü seçiniz.",
  }),
  transportMode: z.string({ required_error: "Lütfen taşıma şekli seçiniz." }),
  transportDetail: z.string().optional(),
  
  // Location
  senderCountry: z.string({ required_error: "Gönderici ülke seçiniz." }),
  senderCity: z.string({ required_error: "Gönderici şehir seçiniz." }),
  receiverCountry: z.string({ required_error: "Alıcı ülke seçiniz." }),
  receiverCity: z.string({ required_error: "Alıcı şehir seçiniz." }),
  senderAddress: z.string().optional(),
  receiverAddress: z.string().optional(),
  
  // Cargo Details
  cargoType: z.string({ required_error: "Lütfen yük tipi seçiniz." }),
  weight: z.string({ required_error: "Lütfen ağırlık giriniz." }),
  volume: z.string().optional(),
  pieces: z.string().optional(),
  value: z.string().optional(),
  readyDate: z.string().optional(),
  
  // Extra Services
  insurance: z.boolean().default(false),
  customs: z.boolean().default(false),
  warehousing: z.boolean().default(false),
  
  message: z.string().optional(),
});

type QuoteFormValues = z.infer<typeof quoteFormSchema>;

export function QuoteForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      fullName: "",
      companyName: "",
      email: "",
      phone: "",
      serviceType: "domestic",
      transportMode: "road",
      senderCountry: "Türkiye",
      senderCity: "",
      receiverCountry: "Türkiye",
      receiverCity: "",
      senderAddress: "",
      receiverAddress: "",
      cargoType: "",
      weight: "",
      volume: "",
      pieces: "",
      value: "",
      readyDate: "",
      insurance: false,
      customs: false,
      warehousing: false,
      message: "",
    },
  });

  const watchServiceType = form.watch("serviceType");
  const watchTransportMode = form.watch("transportMode");

  const onSubmit = async (data: QuoteFormValues) => {
    setIsSubmitting(true);
    
    try {
      // 1. E-posta Gönderimi (Mevcut API)
      const response = await fetch("/api/send-quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Teklif talebi gönderilemedi.");
      }

      // 2. Supabase CRM Leads Tablosuna Kayıt
      const { error: leadError } = await supabase.from("leads").insert([
        {
          company_name: data.companyName || data.fullName,
          contact_name: data.fullName,
          email: data.email,
          phone: data.phone,
          service_type: data.transportMode,
          origin: `${data.senderCity}, ${data.senderCountry}`,
          destination: `${data.receiverCity}, ${data.receiverCountry}`,
          cargo_type: data.cargoType,
          weight: data.weight,
          volume: data.volume,
          package_count: data.pieces,
          pickup_date: data.readyDate || null,
          special_requirements: [
            data.insurance ? "Sigorta" : null,
            data.customs ? "Gümrük" : null,
            data.warehousing ? "Depolama" : null
          ].filter(Boolean).join(", "),
          message: data.message,
          status: "yeni",
          source: "website",
          priority: "normal",
        },
      ]);

      if (leadError) {
        console.error("Lead kayıt hatası:", leadError);
      }

      toast({
        title: "Talebiniz alınmıştır",
        description: "En kısa sürede size teklifimizi ileteceğiz.",
      });
      
      form.reset();
    } catch (error) {
      console.error("Form submit error:", error);
      toast({
        title: "Bir hata oluştu",
        description: "Lütfen daha sonra tekrar deneyiniz.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-lg border p-6 md:p-8">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-slate-800">Online Teklif Alın</h2>
        <p className="text-slate-500 mt-2">İhtiyacınız olan taşımacılık hizmeti için hızlıca teklif alın.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* İletişim Bilgileri */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">İletişim Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ad Soyad *</FormLabel>
                    <FormControl>
                      <Input placeholder="Adınız Soyadınız" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Firma Adı</FormLabel>
                    <FormControl>
                      <Input placeholder="Firmanızın Adı" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-posta *</FormLabel>
                    <FormControl>
                      <Input placeholder="ornek@firma.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon *</FormLabel>
                    <FormControl>
                      <Input placeholder="05XX XXX XX XX" type="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Taşıma Bilgileri */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Taşıma Bilgileri</h3>
            
            <FormField
              control={form.control}
              name="serviceType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Hizmet Türü *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1 sm:flex-row sm:space-x-4 sm:space-y-0"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="domestic" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Yurtiçi Taşıma
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="international" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Uluslararası Taşıma
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <FormField
                control={form.control}
                name="transportMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taşıma Şekli *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Taşıma şekli seçiniz" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="road">Karayolu Taşımacılığı</SelectItem>
                        <SelectItem value="sea">Denizyolu Taşımacılığı</SelectItem>
                        <SelectItem value="air">Havayolu Taşımacılığı</SelectItem>
                        <SelectItem value="rail">Demiryolu Taşımacılığı</SelectItem>
                        <SelectItem value="intermodal">Multimodal/İntermodal</SelectItem>
                        <SelectItem value="project">Proje Taşımacılığı</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="transportDetail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taşıma Detayı</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Detay seçiniz" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ftl">Komple (FTL/FCL)</SelectItem>
                        <SelectItem value="ltl">Parsiyel (LTL/LCL)</SelectItem>
                        <SelectItem value="express">Minivan/Express</SelectItem>
                        <SelectItem value="heavy">Ağır/Gabaridışı</SelectItem>
                        <SelectItem value="temp">Isı Kontrollü (Frigo)</SelectItem>
                        <SelectItem value="adr">Tehlikeli Madde (ADR)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Lokasyon Bilgileri */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Lokasyon Bilgileri</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-4 border p-4 rounded-lg bg-slate-50">
                <h4 className="font-medium text-slate-700">Yükleme Yeri</h4>
                <FormField
                  control={form.control}
                  name="senderCountry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ülke *</FormLabel>
                      <FormControl>
                        <Input placeholder="Örn: Türkiye" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="senderCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İl / İlçe *</FormLabel>
                      <FormControl>
                        <Input placeholder="Örn: İstanbul / Pendik" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 border p-4 rounded-lg bg-slate-50">
                <h4 className="font-medium text-slate-700">Teslimat Yeri</h4>
                <FormField
                  control={form.control}
                  name="receiverCountry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ülke *</FormLabel>
                      <FormControl>
                        <Input placeholder="Örn: Almanya" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="receiverCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İl / İlçe *</FormLabel>
                      <FormControl>
                        <Input placeholder="Örn: Münih" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Yük Bilgileri */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Yük Bilgileri</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="cargoType"
                render={({ field }) => (
                  <FormItem className="col-span-1 sm:col-span-2">
                    <FormLabel>Yük Cinsi *</FormLabel>
                    <FormControl>
                      <Input placeholder="Örn: Makine Aksamı, Tekstil, vb." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="readyDate"
                render={({ field }) => (
                  <FormItem className="col-span-1 sm:col-span-2">
                    <FormLabel>Yükleme Tarihi</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brüt Ağırlık *</FormLabel>
                    <FormControl>
                      <Input placeholder="Örn: 24000 Kg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="volume"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hacim / Ölçüler</FormLabel>
                    <FormControl>
                      <Input placeholder="Örn: 10 cbm / 120x80x100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pieces"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kap Adedi</FormLabel>
                    <FormControl>
                      <Input placeholder="Örn: 10 Palet, 5 Koli" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mal Bedeli</FormLabel>
                    <FormControl>
                      <Input placeholder="Örn: 50.000 EUR" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Ek Hizmetler ve Notlar */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Ek Hizmetler ve Notlar</h3>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <FormField
                control={form.control}
                name="insurance"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Emtia Sigortası İstiyorum</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customs"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Gümrükleme İstiyorum</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="warehousing"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Depolama İstiyorum</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ek Notlarınız</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Belirtmek istediğiniz diğer detaylar..." 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="pt-4 border-t flex items-center justify-end">
            <Button 
              type="submit" 
              className="w-full sm:w-auto min-w-[200px] h-12 text-lg font-semibold bg-red-600 hover:bg-red-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Gönderiliyor..." : "Teklif İste"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}