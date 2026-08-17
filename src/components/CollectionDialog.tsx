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

interface CollectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customer: any;
  onSuccess?: () => void;
}

export function CollectionDialog({ isOpen, onClose, customer, onSuccess }: CollectionDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [openInvoices, setOpenInvoices] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    amount: "",
    paymentMethod: "Nakit",
    paymentDate: new Date().toISOString().split("T")[0],
    bankAccountId: "",
    referenceNo: "",
    description: "",
    currency: "TRY",
    relatedInvoiceId: "",
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

      const { data: invoices, error: invoicesError } = await supabase
        .from("sales_invoices")
        .select("id, invoice_no, grand_total, currency, payment_status")
        .eq("customer_id", customer.id)
        .neq("payment_status", "Ödendi")
        .not("invoice_no", "like", "BORC-%")
        .not("invoice_no", "like", "ALACAK-%")
        .order("invoice_date", { ascending: false });
      if (invoicesError) throw invoicesError;
      setOpenInvoices(invoices || []);
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
        transactionType: "tahsilat",
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
        paymentDate: formData.paymentDate,
        description: formData.description,
        currency: formData.currency,
        referenceNo: formData.referenceNo,
        financialAccountId: formData.bankAccountId,
        relatedInvoiceId: formData.relatedInvoiceId || null,
      });

      toast({
        title: "Başarılı",
        description: `${formData.amount} ${formData.currency} tahsilat kaydedildi`,
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
        relatedInvoiceId: "",
      });
    } catch (error: any) {
      console.error("Error creating collection:", error);
      toast({
        title: "Hata",
        description: error.message || "Tahsilat kaydedilirken bir hata oluştu",
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
          <DialogTitle>Tahsilat Ekle - {customer?.company || customer?.name}</DialogTitle>
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

            {/* TAHSİLAT YÖNTEMİ */}
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Tahsilat Yöntemi *</Label>
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
              <Label htmlFor="paymentDate">Tahsilat Tarihi *</Label>
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
            {openInvoices.length > 0 && (
              <div className="space-y-2 col-span-2">
                <Label>İlgili Satış Faturası</Label>
                <Select
                  value={formData.relatedInvoiceId || "unallocated"}
                  onValueChange={(value) => setFormData({ ...formData, relatedInvoiceId: value === "unallocated" ? "" : value })}
                >
                  <SelectTrigger><SelectValue placeholder="Faturaya bağlama (isteğe bağlı)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unallocated">Genel tahsilat</SelectItem>
                    {openInvoices.map((invoice) => (
                      <SelectItem key={invoice.id} value={invoice.id}>
                        {invoice.invoice_no} - {Number(invoice.grand_total || 0).toLocaleString("tr-TR")} {invoice.currency || "TRY"}
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
                placeholder="Tahsilat açıklaması..."
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
                "Tahsilatı Kaydet"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
