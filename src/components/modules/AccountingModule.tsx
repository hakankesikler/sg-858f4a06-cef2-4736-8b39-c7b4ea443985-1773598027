import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Plus,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from "lucide-react";

export function AccountingModule() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Muhasebe Modülü</h2>
          <p className="text-muted-foreground">
            Finansal yönetim ve raporlama sistemi
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Yeni İşlem
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="invoices">Faturalar</TabsTrigger>
          <TabsTrigger value="expenses">Giderler</TabsTrigger>
          <TabsTrigger value="reports">Raporlar</TabsTrigger>
        </TabsList>

        {/* Genel Bakış */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Toplam Gelir
                  </p>
                  <h3 className="text-2xl font-bold">₺0</h3>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                +0% geçen aya göre
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Toplam Gider
                  </p>
                  <h3 className="text-2xl font-bold">₺0</h3>
                </div>
                <TrendingDown className="h-8 w-8 text-red-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                +0% geçen aya göre
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Bekleyen Faturalar
                  </p>
                  <h3 className="text-2xl font-bold">0</h3>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">0 adet ödenmedi</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Net Kar</p>
                  <h3 className="text-2xl font-bold">₺0</h3>
                </div>
                <DollarSign className="h-8 w-8 text-purple-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Bu ayki performans
              </p>
            </Card>
          </div>
        </TabsContent>

        {/* Faturalar */}
        <TabsContent value="invoices" className="space-y-4">
          <Card className="p-6">
            <p className="text-muted-foreground">Fatura yönetimi yakında eklenecek...</p>
          </Card>
        </TabsContent>

        {/* Giderler */}
        <TabsContent value="expenses" className="space-y-4">
          <Card className="p-6">
            <p className="text-muted-foreground">Gider yönetimi yakında eklenecek...</p>
          </Card>
        </TabsContent>

        {/* Raporlar */}
        <TabsContent value="reports" className="space-y-4">
          <Card className="p-6">
            <p className="text-muted-foreground">Finansal raporlar yakında eklenecek...</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}