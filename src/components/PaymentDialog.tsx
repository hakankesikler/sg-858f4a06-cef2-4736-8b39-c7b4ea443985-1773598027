import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { workflowService } from "@/services/workflowService";

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customer: any;
  onSuccess?: () => void;
}

export function PaymentDialog({ isOpen, onClose, customer, onSuccess }: PaymentDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [openPurchases, setOpenPurchases] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    amount: "",
    paymentMethod: "Nakit",
    paymentDate: new Date().toISOString().split("T")[0],
    bankAccountId: "",
    referenceNo: "",
    description: "",
    currency: "TRY",
    relatedPurchaseId: "",
  });

  useEffect(() => {
    if (isOpen) {
      loadBankAccounts();
    }
  }, [isOpen]);

  const loadBankAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from("financial_accounts")
        .select("*")
        .or("is_active.eq.true,is_active.is.null")
        .order("account_name");

      if (error) throw error;
      setBankAccounts(data || []);

      const { data: purchases, error: purchasesError } = await supabase
        .from("purchases")
        .select("id, purchase_no, total, paid_amount, currency, status")
        .eq("supplier_id", customer.id)
        .neq("status", "odendi")
        .order("purchase_date", { ascending: false });
      if (purchasesError) throw purchasesError;
      setOpenPurchases(purchases || []);
    } catch (error) {
      console.error("Error loading bank accounts:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast({
        title: "Uyarı",
        description: "Lütfen geçerli bir tutar girin",
        variant: "destructive",
      });
      return;
    }
    if (!formData.bankAccountId) {
      toast({ title: "Uyarı", description: "Lütfen işlemin yapılacağı finans hesabını seçin", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      await workflowService.recordCustomerPayment({
        customerId: customer.id,
        transactionType: "odeme",
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
        paymentDate: formData.paymentDate,
        description: formData.description,
        currency: formData.currency,
        referenceNo: formData.referenceNo,
        financialAccountId: formData.bankAccountId,
        relatedPurchaseId: formData.relatedPurchaseId || null,
      });

      toast({
        title: "Başarılı",
        description: `${formData.amount} ${formData.currency} ödeme kaydedildi`,
      });

      if (onSuccess) onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        amount: "",
        paymentMethod: "Nakit",
        paymentDate: new Date().toISOString().split("T")[0],
        bankAccountId: "",
        referenceNo: "",
        description: "",
        currency: "TRY",
        relatedPurchaseId: "",
      });
    } catch (error: any) {
      console.error("Error creating payment:", error);
      toast({
        title: "Hata",
        description: error.message || "Ödeme kaydedilirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ödeme Ekle - {customer?.company || customer?.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* TUTAR */}
            <div className="space-y-2">
              <Label htmlFor="amount">Tutar *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>

            {/* PARA BİRİMİ */}
            <div className="space-y-2">
              <Label htmlFor="currency">Para Birimi</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRY">TRY</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ÖDEME YÖNTEMİ */}
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Ödeme Yöntemi *</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Nakit">Nakit</SelectItem>
                  <SelectItem value="Havale">Havale</SelectItem>
                  <SelectItem value="EFT">EFT</SelectItem>
                  <SelectItem value="Kredi Kartı">Kredi Kartı</SelectItem>
                  <SelectItem value="Çek">Çek</SelectItem>
                  <SelectItem value="Senet">Senet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* TARİH */}
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Ödeme Tarihi *</Label>
              <Input
                id="paymentDate"
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                required
              />
            </div>

            {/* FİNANS HESABI */}
              <div className="space-y-2 col-span-2">
                <Label htmlFor="bankAccount">Finans Hesabı *</Label>
                <Select
                  value={formData.bankAccountId}
                  onValueChange={(value) => setFormData({ ...formData, bankAccountId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kasa veya banka hesabı seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.account_name} - {account.iban}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            {/* REFERANS NO */}
            {openPurchases.length > 0 && (
              <div className="space-y-2 col-span-2">
                <Label>İlgili Alış Faturası</Label>
                <Select
                  value={formData.relatedPurchaseId || "unallocated"}
                  onValueChange={(value) => setFormData({ ...formData, relatedPurchaseId: value === "unallocated" ? "" : value })}
                >
                  <SelectTrigger><SelectValue placeholder="Faturaya bağlama (isteğe bağlı)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unallocated">Genel ödeme</SelectItem>
                    {openPurchases.map((purchase) => (
                      <SelectItem key={purchase.id} value={purchase.id}>
                        {purchase.purchase_no} - {Number(purchase.total || 0).toLocaleString("tr-TR")} {purchase.currency || "TRY"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2 col-span-2">
              <Label htmlFor="referenceNo">Referans No / Dekont No</Label>
              <Input
                id="referenceNo"
                placeholder="Örn: DKT-2024-001"
                value={formData.referenceNo}
                onChange={(e) => setFormData({ ...formData, referenceNo: e.target.value })}
              />
            </div>

            {/* AÇIKLAMA */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                placeholder="Ödeme açıklaması..."
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                "Ödemeyi Kaydet"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
