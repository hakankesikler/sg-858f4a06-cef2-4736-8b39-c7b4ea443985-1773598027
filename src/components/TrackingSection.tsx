import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Package, MapPin, Truck, CheckCircle } from "lucide-react";

export function TrackingSection() {
  const [trackingNumber, setTrackingNumber] = useState("");

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading font-bold text-4xl text-navy mb-4">
              Gönderinizi Takip Edin
            </h2>
            <p className="text-muted-foreground text-lg">
              REX Lojistik kargo takip sistemi ile gönderinizin anlık konumunu öğrenin
            </p>
          </div>

          <Card className="border-2 shadow-xl">
            <CardContent className="p-8">
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Takip numaranızı girin (örn: REX2024001234)"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>
                <Button size="lg" className="bg-gradient-accent hover:opacity-90 h-12 px-8">
                  Sorgula
                </Button>
              </div>

              <div className="bg-secondary/30 rounded-xl p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-primary p-3 rounded-full mb-2">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-sm font-semibold text-navy">Teslim Alındı</div>
                    <div className="text-xs text-muted-foreground">12.03.2026</div>
                  </div>

                  <div className="hidden md:block flex-1 h-0.5 bg-gradient-to-r from-primary to-accent" />

                  <div className="flex flex-col items-center text-center">
                    <div className="bg-accent p-3 rounded-full mb-2">
                      <Truck className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-sm font-semibold text-navy">Yolda</div>
                    <div className="text-xs text-muted-foreground">13.03.2026</div>
                  </div>

                  <div className="hidden md:block flex-1 h-0.5 bg-gradient-to-r from-accent via-muted to-muted" />

                  <div className="flex flex-col items-center text-center">
                    <div className="bg-muted p-3 rounded-full mb-2">
                      <MapPin className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="text-sm font-semibold text-muted-foreground">Transfer</div>
                    <div className="text-xs text-muted-foreground">Bekleniyor</div>
                  </div>

                  <div className="hidden md:block flex-1 h-0.5 bg-muted" />

                  <div className="flex flex-col items-center text-center">
                    <div className="bg-muted p-3 rounded-full mb-2">
                      <CheckCircle className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="text-sm font-semibold text-muted-foreground">Teslim Edildi</div>
                    <div className="text-xs text-muted-foreground">Bekleniyor</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                <p>Takip numaranızı bulamıyor musunuz? <a href="tel:+905434010755" className="text-primary hover:underline">0543 401 07 55</a> numaralı hattan bize ulaşabilirsiniz.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}