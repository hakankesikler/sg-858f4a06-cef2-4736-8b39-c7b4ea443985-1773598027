import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Landmark, RefreshCw, Search } from "lucide-react";
import { downloadExcel } from "@/lib/excel";

type FinanceWorkspaceProps = {
  accounts: any[];
  transactions: any[];
  canSync?: boolean;
  syncing?: boolean;
  onSync?: (resource: "vaults" | "vault_transactions") => Promise<void>;
};

const amount = (value: unknown, currency = "TRY") => new Intl.NumberFormat("tr-TR", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(value || 0));
const date = (value: unknown) => value ? new Date(String(value)).toLocaleDateString("tr-TR") : "-";

export function FinanceWorkspace({ accounts, transactions, canSync = false, syncing = false, onSync }: FinanceWorkspaceProps) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("tr-TR");
    if (!term) return transactions;
    return transactions.filter((row) => [row.transaction_no, row.description, row.category, row.associate_name, row.reference_no]
      .some((value) => String(value || "").toLocaleLowerCase("tr-TR").includes(term)));
  }, [search, transactions]);
  const totals = useMemo(() => accounts.reduce<Record<string, number>>((result, row) => {
    const code = row.currency || "TRY";
    result[code] = (result[code] || 0) + Number(row.provider_balance ?? row.balance ?? 0);
    return result;
  }, {}), [accounts]);

  const exportTransactions = async () => {
    await downloadExcel(`rex-finans-hareketleri-${new Date().toISOString().slice(0, 10)}.xlsx`, filtered.map((row) => ({
      Tarih: date(row.transaction_date), "İşlem No": row.transaction_no, Hesap: row.financial_accounts?.account_name || "-",
      Tür: row.type, Kategori: row.category, Açıklama: row.description, Cari: row.associate_name || "-",
      Referans: row.reference_no || "-", Para: row.currency || "TRY", Tutar: Number(row.amount || 0),
      "Kümülatif Bakiye": Number(row.cumulative_balance || 0), Kaynak: row.source === "kolaybi" ? "KolayBi" : "REX TYS",
    })), "Finans Hareketleri");
  };

  return <div className="space-y-5">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div><h3 className="text-xl font-bold">Banka, Kasa ve Hesap Hareketleri</h3><p className="text-sm text-slate-500">KolayBi hesap bakiyeleri, tahsilat, ödeme ve virman kayıtları tek ekranda.</p></div>
      <div className="flex flex-wrap gap-2">
        {canSync && onSync && <>
          <Button variant="outline" disabled={syncing} onClick={() => void onSync("vaults")}><RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />Hesapları Yenile</Button>
          <Button variant="outline" disabled={syncing} onClick={() => void onSync("vault_transactions")}><RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />Hareketleri Yenile</Button>
        </>}
        <Button variant="outline" disabled={filtered.length === 0} onClick={() => void exportTransactions()}><Download className="mr-2 h-4 w-4" />XLSX İndir</Button>
      </div>
    </div>

    {Object.keys(totals).length > 0 && <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Object.entries(totals).map(([code, total]) => <Card key={code} className="border-blue-100 bg-gradient-to-br from-white to-blue-50"><CardContent className="p-4"><p className="text-sm text-slate-500">Toplam {code} Bakiye</p><p className="mt-1 text-xl font-bold text-[#173f73]">{amount(total, code)}</p></CardContent></Card>)}</div>}

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {accounts.map((row) => <Card key={row.id}><CardContent className="p-5"><div className="flex items-center justify-between"><Landmark className="h-5 w-5 text-[#173f73]" /><div className="flex gap-1"><Badge variant="outline">{row.currency || "TRY"}</Badge>{row.source === "kolaybi" && <Badge className="bg-orange-50 text-orange-700 hover:bg-orange-50">KolayBi {row.provider_environment === "live" ? "Canlı" : "Test"}</Badge>}</div></div><p className="mt-3 font-semibold">{row.account_name}</p><p className="mt-2 text-2xl font-bold">{amount(row.provider_balance ?? row.balance, row.currency)}</p><p className="mt-1 text-xs text-slate-500">{row.bank_name || row.account_type}{row.last_synced_at ? ` · ${new Date(row.last_synced_at).toLocaleString("tr-TR")}` : ""}</p></CardContent></Card>)}
      {accounts.length === 0 && <Card className="md:col-span-2 xl:col-span-3"><CardContent className="p-8 text-center text-slate-500">Henüz finans hesabı yok. KolayBi bağlantısı hazırsa “Hesapları Yenile” düğmesini kullanın.</CardContent></Card>}
    </div>

    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between"><CardTitle className="text-base">Hesap Hareketleri</CardTitle><div className="relative w-full sm:w-80"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="İşlem, açıklama, cari veya referans ara" /></div></CardHeader>
      <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Tarih</TableHead><TableHead>Hesap</TableHead><TableHead>İşlem</TableHead><TableHead>Açıklama</TableHead><TableHead>Cari</TableHead><TableHead>Kaynak</TableHead><TableHead className="text-right">Tutar</TableHead><TableHead className="text-right">Bakiye</TableHead></TableRow></TableHeader><TableBody>
        {filtered.length === 0 ? <TableRow><TableCell colSpan={8} className="h-28 text-center text-slate-500">Hesap hareketi bulunmuyor.</TableCell></TableRow> : filtered.slice(0, 500).map((row) => <TableRow key={row.id}><TableCell>{date(row.transaction_date)}</TableCell><TableCell>{row.financial_accounts?.account_name || "-"}</TableCell><TableCell><p className="font-medium">{row.type}</p><p className="text-xs text-slate-500">{row.provider_transaction_subtype || row.category || row.transaction_no}</p></TableCell><TableCell className="max-w-[320px] truncate">{row.description || "-"}</TableCell><TableCell>{row.associate_name || "-"}</TableCell><TableCell>{row.source === "kolaybi" ? <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">KolayBi</Badge> : <Badge variant="outline">REX TYS</Badge>}</TableCell><TableCell className={`text-right font-semibold ${row.type === "Giden" ? "text-red-600" : "text-green-700"}`}>{row.type === "Giden" ? "-" : "+"}{amount(row.amount, row.currency)}</TableCell><TableCell className="text-right">{row.cumulative_balance === null || row.cumulative_balance === undefined ? "-" : amount(row.cumulative_balance, row.currency)}</TableCell></TableRow>)}
      </TableBody></Table></div>
    </Card>
  </div>;
}
