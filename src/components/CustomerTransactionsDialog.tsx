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
import { Download, Upload, Filter, Search, AlertCircle } from "lucide-react";
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
          allTransactions = invoices.map((inv) => ({
            id: inv.id,
            date: inv.invoice_date || inv.created_at,
            type: "Satış Faturası",
            documentNo: inv.invoice_no,
            debit: 0,
            credit: inv.grand_total,
            currency: inv.currency || "TRY",
            exchangeRate: 1,
            localAmount: inv.grand_total,
            balance: 0, // Will calculate below
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
          allTransactions = purchases.map((pur) => ({
            id: pur.id,
            date: pur.purchase_date || pur.created_at,
            type: "Alış Faturası",
            documentNo: pur.purchase_no || pur.invoice_no || "-",
            debit: pur.total,
            credit: 0,
            currency: pur.currency || "TRY",
            exchangeRate: 1,
            localAmount: pur.total,
            balance: 0, // Will calculate below
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
      <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Cari Hareketleri - {customer?.company || customer?.name}
          </DialogTitle>
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
    </Dialog>
  );
}