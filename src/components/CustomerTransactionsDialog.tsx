import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Upload, Filter, Search, AlertCircle, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CustomerTransactionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customer: any;
}

type Transaction = {
  id: string;
  date: string;
  type: string;
  documentNo: string;
  debit: number;
  credit: number;
  currency: string;
  exchangeRate: number;
  localAmount: number;
  balance: number;
};

export function CustomerTransactionsDialog({
  isOpen,
  onClose,
  customer,
}: CustomerTransactionsDialogProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Borç/Alacak Dialog States
  const [showDebtDialog, setShowDebtDialog] = useState(false);
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [debtForm, setDebtForm] = useState({
    amount: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    currency: "TRY"
  });
  const [creditForm, setCreditForm] = useState({
    amount: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    currency: "TRY"
  });

  useEffect(() => {
    if (isOpen && customer) {
      loadTransactions();
    }
  }, [isOpen, customer]);

  const loadTransactions = async () => {
    if (!customer) return;

    setIsLoading(true);
    try {
      const accountType = customer.account_type || "musteri";
      let allTransactions: Transaction[] = [];

      if (accountType === "musteri") {
        // Load sales invoices
        const { data: invoices, error } = await supabase
          .from("sales_invoices")
          .select("*")
          .eq("customer_id", customer.id)
          .order("invoice_date", { ascending: true });

        if (error) throw error;

        if (invoices) {
          const invoicesList = invoices as any[];
          allTransactions = invoicesList.map((inv) => ({
            id: inv.id,
            date: inv.invoice_date || inv.created_at,
            type: "Satış Faturası",
            documentNo: inv.invoice_no,
            debit: 0,
            credit: inv.grand_total,
            currency: inv.currency || "TRY",
            exchangeRate: 1,
            localAmount: inv.grand_total,
            balance: 0,
          }));
        }
      } else if (accountType === "tedarikci") {
        // Load purchase invoices
        const { data: purchases, error } = await supabase
          .from("purchases")
          .select("*")
          .eq("supplier_id", customer.id)
          .order("purchase_date", { ascending: true });

        if (error) throw error;

        if (purchases) {
          const purchasesList = purchases as any[];
          allTransactions = purchasesList.map((pur) => ({
            id: pur.id,
            date: pur.purchase_date || pur.created_at,
            type: "Alış Faturası",
            documentNo: pur.purchase_no || pur.invoice_no || "-",
            debit: pur.total,
            credit: 0,
            currency: pur.currency || "TRY",
            exchangeRate: 1,
            localAmount: pur.total,
            balance: 0,
          }));
        }
      }

      // Calculate cumulative balance
      let runningBalance = 0;
      allTransactions = allTransactions.map((tx) => {
        runningBalance += tx.credit - tx.debit;
        return { ...tx, balance: runningBalance };
      });

      setTransactions(allTransactions);
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDebt = async () => {
    if (!customer || !debtForm.amount) return;
    
    try {
      const accountType = customer.account_type || "musteri";
      
      if (accountType === "tedarikci") {
        // Add to purchases
        const { error } = await supabase.from("purchases").insert({
          supplier_id: customer.id,
          purchase_date: debtForm.date,
          purchase_no: `BORC-${Date.now()}`,
          total: parseFloat(debtForm.amount),
          currency: debtForm.currency,
          notes: debtForm.description,
          status: 'beklemede'
        });
        
        if (error) throw error;
      } else {
        // For musteri - add negative transaction
        const { error } = await supabase.from("sales_invoices").insert({
          customer_id: customer.id,
          invoice_date: debtForm.date,
          due_date: debtForm.date,
          invoice_no: `BORC-${Date.now()}`,
          grand_total: -parseFloat(debtForm.amount),
          currency: debtForm.currency,
          notes: debtForm.description,
          payment_status: 'Bekliyor'
        });
        
        if (error) throw error;
      }
      
      // Reset form and reload
      setDebtForm({ amount: "", description: "", date: new Date().toISOString().split('T')[0], currency: "TRY" });
      setShowDebtDialog(false);
      loadTransactions();
    } catch (error) {
      console.error("Error adding debt:", error);
      alert("Borç eklenirken bir hata oluştu!");
    }
  };

  const handleAddCredit = async () => {
    if (!customer || !creditForm.amount) return;
    
    try {
      const accountType = customer.account_type || "musteri";
      
      if (accountType === "musteri") {
        // Add to sales_invoices
        const { error } = await supabase.from("sales_invoices").insert({
          customer_id: customer.id,
          invoice_date: creditForm.date,
          due_date: creditForm.date,
          invoice_no: `ALACAK-${Date.now()}`,
          grand_total: parseFloat(creditForm.amount),
          currency: creditForm.currency,
          notes: creditForm.description,
          payment_status: 'Bekliyor'
        });
        
        if (error) throw error;
      } else {
        // For tedarikci - add negative transaction
        const { error } = await supabase.from("purchases").insert({
          supplier_id: customer.id,
          purchase_date: creditForm.date,
          purchase_no: `ALACAK-${Date.now()}`,
          total: -parseFloat(creditForm.amount),
          currency: creditForm.currency,
          notes: creditForm.description,
          status: 'beklemede'
        });
        
        if (error) throw error;
      }
      
      // Reset form and reload
      setCreditForm({ amount: "", description: "", date: new Date().toISOString().split('T')[0], currency: "TRY" });
      setShowCreditDialog(false);
      loadTransactions();
    } catch (error) {
      console.error("Error adding credit:", error);
      alert("Alacak eklenirken bir hata oluştu!");
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      tx.documentNo.toLowerCase().includes(searchLower) ||
      tx.type.toLowerCase().includes(searchLower)
    );
  });

  const handleExport = () => {
    const csvContent = [
      ["İşlem Tarihi", "İşlem Türü", "Evrak/Seri No", "Borç", "Alacak", "Döviz Kuru", "Yerel Tutar", "Bakiye"].join(","),
      ...filteredTransactions.map(tx => [
        new Date(tx.date).toLocaleDateString("tr-TR"),
        tx.type,
        tx.documentNo,
        tx.debit.toLocaleString("tr-TR"),
        tx.credit.toLocaleString("tr-TR"),
        tx.exchangeRate,
        tx.localAmount.toLocaleString("tr-TR"),
        tx.balance.toLocaleString("tr-TR")
      ].join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `cari_hareketleri_${customer?.name}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">
                Cari Hareketleri - {customer?.company || customer?.name}
              </DialogTitle>
              <div className="flex gap-2 mt-2">
                <Badge className="bg-orange-500 text-white">
                  {customer?.account_type === "musteri" && "Müşteri"}
                  {customer?.account_type === "tedarikci" && "Tedarikçi"}
                  {customer?.account_type === "personel" && "Personel"}
                  {customer?.account_type === "ortak" && "Ortak"}
                </Badge>
                <Badge className={customer?.status === "Aktif" ? "bg-blue-500 text-white" : "bg-gray-400 text-white"}>
                  {customer?.status || "Aktif"}
                </Badge>
              </div>
            </div>

            {/* Action Menus */}
            <div className="flex gap-2">
              {/* Borç / Alacak Ekle Menüsü */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    Borç / Alacak Ekle
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowDebtDialog(true)}>
                    Borç Ekle
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowCreditDialog(true)}>
                    Alacak Ekle
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Fatura Ekle Menüsü */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    Fatura Ekle
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => console.log("Satış Faturası")}>
                    Satış Faturası
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => console.log("Satın Alma Faturası")}>
                    Satın Alma Faturası
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => console.log("Satış İade Faturası")}>
                    Satış İade Faturası
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => console.log("Alış İade Faturası")}>
                    Alış İade Faturası
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => console.log("Genel Gider")}>
                    Genel Gider
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => console.log("Satış İrsaliyesi")}>
                    Satış İrsaliyesi
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Ödeme / Tahsilat Ekle Menüsü */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    Ödeme / Tahsilat Ekle
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => console.log("Ödeme Ekle")}>
                    Ödeme Ekle
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => console.log("Tahsilat Ekle")}>
                    Tahsilat Ekle
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => console.log("Cari Virman")}>
                    Cari Virman
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* İşlemler Menüsü */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    İşlemler
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => console.log("Mahsuplaştır")}>
                    Mahsuplaştır
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => console.log("Mahsuplaşmaları Kaldır")}>
                    Mahsuplaşmaları Kaldır
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => console.log("Cari Ekstresi Oluştur")}>
                    Cari Ekstresi Oluştur
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => console.log("Cariyi Pasifleştir")}>
                    Cariyi Pasifleştir
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => console.log("Sil")}
                    className="text-red-600 focus:text-red-600"
                  >
                    Sil
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </DialogHeader>

        {/* Warning Box */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm text-orange-800">
              <p>
                • Cariye eklenen <strong>borç ve ödeme kayıtları</strong> proje ile ilişkilendirildiği durumda projede <strong>'Nakit Ödemeler'</strong> bölümünde gösterilecektir.
              </p>
              <p>
                • Cariye eklenen <strong>alacak ve tahsilat kayıtları</strong> proje ile ilişkilendirildiği durumda projede <strong>'Nakit Tahsilatlar'</strong> bölümünde gösterilecektir.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => {}}>
              <Upload className="w-4 h-4 mr-2" />
              İçe Aktar
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Dışarıya Aktar
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4" />
            </Button>
          </div>

          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Ara"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Transactions Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>İşlem Tarihi</TableHead>
                <TableHead>İşlem Türü</TableHead>
                <TableHead>Evrak/Seri No</TableHead>
                <TableHead className="text-right">Borç</TableHead>
                <TableHead className="text-right">Alacak</TableHead>
                <TableHead className="text-right">Döviz Kuru</TableHead>
                <TableHead className="text-right">Yerel Tutar</TableHead>
                <TableHead className="text-right">Bakiye</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Yükleniyor...
                  </TableCell>
                </TableRow>
              ) : filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    Henüz işlem bulunmuyor
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((tx) => (
                  <TableRow key={tx.id} className="hover:bg-gray-50">
                    <TableCell>
                      {new Date(tx.date).toLocaleDateString("tr-TR")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {tx.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">{tx.documentNo}</TableCell>
                    <TableCell className="text-right font-semibold text-red-600">
                      {tx.debit > 0 ? `${tx.debit.toLocaleString("tr-TR")} ${tx.currency}` : "-"}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      {tx.credit > 0 ? `${tx.credit.toLocaleString("tr-TR")} ${tx.currency}` : "-"}
                    </TableCell>
                    <TableCell className="text-right">{tx.exchangeRate}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {tx.localAmount.toLocaleString("tr-TR")} TRY
                    </TableCell>
                    <TableCell className={`text-right font-bold ${tx.balance > 0 ? "text-green-600" : tx.balance < 0 ? "text-red-600" : "text-gray-700"}`}>
                      {tx.balance.toLocaleString("tr-TR")} TRY
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        {filteredTransactions.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">Toplam Borç</p>
                <p className="text-lg font-bold text-red-600">
                  {filteredTransactions.reduce((sum, tx) => sum + tx.debit, 0).toLocaleString("tr-TR")} TRY
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Toplam Alacak</p>
                <p className="text-lg font-bold text-green-600">
                  {filteredTransactions.reduce((sum, tx) => sum + tx.credit, 0).toLocaleString("tr-TR")} TRY
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Güncel Bakiye</p>
                <p className={`text-lg font-bold ${filteredTransactions[filteredTransactions.length - 1]?.balance > 0 ? "text-green-600" : filteredTransactions[filteredTransactions.length - 1]?.balance < 0 ? "text-red-600" : "text-gray-700"}`}>
                  {(filteredTransactions[filteredTransactions.length - 1]?.balance || 0).toLocaleString("tr-TR")} TRY
                </p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>

      {/* Borç Ekle Dialog */}
      <Dialog open={showDebtDialog} onOpenChange={setShowDebtDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Borç Ekle - {customer?.company || customer?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tutar</label>
              <Input
                type="number"
                placeholder="0.00"
                value={debtForm.amount}
                onChange={(e) => setDebtForm({ ...debtForm, amount: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Döviz</label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={debtForm.currency}
                onChange={(e) => setDebtForm({ ...debtForm, currency: e.target.value })}
              >
                <option value="TRY">TRY</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tarih</label>
              <Input
                type="date"
                value={debtForm.date}
                onChange={(e) => setDebtForm({ ...debtForm, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Açıklama</label>
              <Input
                placeholder="İşlem açıklaması..."
                value={debtForm.description}
                onChange={(e) => setDebtForm({ ...debtForm, description: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowDebtDialog(false)}>
                İptal
              </Button>
              <Button onClick={handleAddDebt}>
                Borç Ekle
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alacak Ekle Dialog */}
      <Dialog open={showCreditDialog} onOpenChange={setShowCreditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alacak Ekle - {customer?.company || customer?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tutar</label>
              <Input
                type="number"
                placeholder="0.00"
                value={creditForm.amount}
                onChange={(e) => setCreditForm({ ...creditForm, amount: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Döviz</label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={creditForm.currency}
                onChange={(e) => setCreditForm({ ...creditForm, currency: e.target.value })}
              >
                <option value="TRY">TRY</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tarih</label>
              <Input
                type="date"
                value={creditForm.date}
                onChange={(e) => setCreditForm({ ...creditForm, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Açıklama</label>
              <Input
                placeholder="İşlem açıklaması..."
                value={creditForm.description}
                onChange={(e) => setCreditForm({ ...creditForm, description: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowCreditDialog(false)}>
                İptal
              </Button>
              <Button onClick={handleAddCredit}>
                Alacak Ekle
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}