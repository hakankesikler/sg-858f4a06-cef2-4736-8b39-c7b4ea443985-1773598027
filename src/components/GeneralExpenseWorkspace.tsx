import React, { useEffect, useMemo, useState } from "react";
import { CircleDollarSign, Layers3, Loader2, Plus, RefreshCw, Search, WalletCards } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { accountingService } from "@/services/accountingService";

type ExpenseType = {
  id: string;
  category_id: string;
  name: string;
  description?: string | null;
  source?: string;
  is_active?: boolean;
  expense_type_provider_mappings?: Array<{ provider_environment: string; external_id: number }>;
};

type ExpenseCategory = {
  id: string;
  name: string;
  is_active?: boolean;
  sort_order?: number;
  expense_types?: ExpenseType[];
};

type Props = {
  expenses: any[];
  canManage: boolean;
  canSync: boolean;
  syncing: boolean;
  onSync: (resource: "expense_types" | "general_expenses") => Promise<void>;
};

const money = (value: unknown, currency = "TRY") =>
  `${Number(value || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${String(currency || "TRY").toUpperCase()}`;

const localDate = (value: unknown) => {
  if (!value) return "-";
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleDateString("tr-TR");
};

const statusClass = (status: string) => {
  const normalized = status.toLocaleLowerCase("tr-TR");
  if (normalized.includes("ödendi") && !normalized.includes("kısmi")) return "border-green-200 bg-green-50 text-green-700";
  if (normalized.includes("iptal") || normalized.includes("hata")) return "border-red-200 bg-red-50 text-red-700";
  if (normalized.includes("bek") || normalized.includes("kısmi")) return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-blue-200 bg-blue-50 text-blue-700";
};

export function GeneralExpenseWorkspace({ expenses, canManage, canSync, syncing, onSync }: Props) {
  const { toast } = useToast();
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showInactive, setShowInactive] = useState(false);
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [typeDialog, setTypeDialog] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newType, setNewType] = useState("");
  const [newTypeCategory, setNewTypeCategory] = useState("");
  const [saving, setSaving] = useState(false);

  const loadCatalog = async () => {
    setCatalogLoading(true);
    try {
      const rows = await accountingService.getExpenseCategories();
      setCategories(rows as ExpenseCategory[]);
    } catch (error: any) {
      toast({ title: "Gider kategorileri yüklenemedi", description: error.message, variant: "destructive" });
    } finally {
      setCatalogLoading(false);
    }
  };

  useEffect(() => { void loadCatalog(); }, []);

  const typeById = useMemo(() => {
    const map = new Map<string, ExpenseType>();
    categories.forEach((category) => (category.expense_types || []).forEach((type) => map.set(type.id, type)));
    return map;
  }, [categories]);
  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);

  const filteredExpenses = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase("tr-TR");
    return expenses.filter((row) => {
      if (categoryFilter !== "all" && row.category_id !== categoryFilter) return false;
      if (!needle) return true;
      const typeName = typeById.get(row.type_id)?.name || row.category || "";
      return [row.vendor, row.provider_document_no, row.invoice_no, row.description, typeName, row.status]
        .some((value) => String(value || "").toLocaleLowerCase("tr-TR").includes(needle));
    });
  }, [expenses, categoryFilter, search, typeById]);

  const totals = useMemo(() => expenses.reduce((acc, row) => {
    const code = String(row.currency || "TRY").toUpperCase();
    acc.total[code] = (acc.total[code] || 0) + Number(row.provider_total ?? row.total ?? (Number(row.amount || 0) + Number(row.tax || 0)));
    acc.balance[code] = (acc.balance[code] || 0) + Number(row.balance || 0);
    if (Number(row.balance || 0) <= 0 && row.status !== "İptal") acc.paid += 1;
    return acc;
  }, { total: {} as Record<string, number>, balance: {} as Record<string, number>, paid: 0 }), [expenses]);

  const totalText = (values: Record<string, number>) => {
    const entries = Object.entries(values);
    return entries.length ? entries.map(([code, amount]) => money(amount, code)).join(" · ") : money(0);
  };

  const saveCategory = async () => {
    if (newCategory.trim().length < 2) return;
    setSaving(true);
    try {
      await accountingService.createExpenseCategory(newCategory);
      setNewCategory(""); setCategoryDialog(false); await loadCatalog();
      toast({ title: "Kategori eklendi", description: "Kategori genel gider sınıflandırmasında kullanıma açıldı." });
    } catch (error: any) {
      toast({ title: "Kategori eklenemedi", description: error.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const saveType = async () => {
    if (!newTypeCategory || newType.trim().length < 2) return;
    setSaving(true);
    try {
      await accountingService.createExpenseType(newTypeCategory, newType);
      setNewType(""); setTypeDialog(false); await loadCatalog();
      toast({ title: "Gider tipi eklendi", description: "Yeni tip seçili kategoride kullanıma açıldı." });
    } catch (error: any) {
      toast({ title: "Gider tipi eklenemedi", description: error.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const toggleCategory = async (category: ExpenseCategory, active: boolean) => {
    try {
      await accountingService.setExpenseCategoryActive(category.id, active);
      await loadCatalog();
      toast({ title: active ? "Kategori açıldı" : "Kategori pasife alındı", description: "Geçmiş gider kayıtları korunmaya devam eder." });
    } catch (error: any) {
      toast({ title: "Kategori güncellenemedi", description: error.message, variant: "destructive" });
    }
  };

  const toggleType = async (type: ExpenseType, active: boolean) => {
    try {
      await accountingService.setExpenseTypeActive(type.id, active);
      await loadCatalog();
    } catch (error: any) {
      toast({ title: "Gider tipi güncellenemedi", description: error.message, variant: "destructive" });
    }
  };

  const syncResource = async (resource: "expense_types" | "general_expenses") => {
    await onSync(resource);
    await loadCatalog();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div><h3 className="text-xl font-bold">Genel Gider Yönetimi</h3><p className="text-sm text-slate-500">KolayBi giderlerini, açık bakiyeleri ve REX sınıflandırmasını tek ekrandan izleyin.</p></div>
        {canSync && <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void syncResource("expense_types")} disabled={syncing}><RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`}/>Gider Tiplerini Yenile</Button>
          <Button onClick={() => void syncResource("general_expenses")} disabled={syncing} className="bg-orange-600 hover:bg-orange-700"><RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`}/>Giderleri Yenile</Button>
        </div>}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="border-blue-200 bg-blue-50"><CardContent className="p-4"><div className="flex justify-between"><div><p className="text-sm text-blue-700">Toplam Gider</p><p className="mt-2 text-xl font-bold">{totalText(totals.total)}</p><p className="mt-1 text-xs text-slate-500">{expenses.length} belge</p></div><CircleDollarSign className="h-6 w-6 text-blue-600"/></div></CardContent></Card>
        <Card className="border-orange-200 bg-orange-50"><CardContent className="p-4"><div className="flex justify-between"><div><p className="text-sm text-orange-700">Açık Bakiye</p><p className="mt-2 text-xl font-bold">{totalText(totals.balance)}</p><p className="mt-1 text-xs text-slate-500">Ödeme bekleyen giderler</p></div><WalletCards className="h-6 w-6 text-orange-600"/></div></CardContent></Card>
        <Card className="border-green-200 bg-green-50"><CardContent className="p-4"><div className="flex justify-between"><div><p className="text-sm text-green-700">Kapanan Belgeler</p><p className="mt-2 text-xl font-bold">{totals.paid}</p><p className="mt-1 text-xs text-slate-500">Bakiyesi sıfır olan kayıt</p></div><Layers3 className="h-6 w-6 text-green-600"/></div></CardContent></Card>
      </div>

      <Tabs defaultValue="records">
        <TabsList><TabsTrigger value="records">Genel Giderler</TabsTrigger><TabsTrigger value="catalog">Gider Tipleri ve Kategoriler</TabsTrigger></TabsList>
        <TabsContent value="records" className="mt-4 space-y-3">
          <Card><CardContent className="p-4"><div className="grid gap-3 md:grid-cols-[1fr_260px]">
            <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400"/><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari, belge no, açıklama veya gider tipi ara" className="pl-9"/></div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}><SelectTrigger><SelectValue placeholder="Tüm kategoriler"/></SelectTrigger><SelectContent><SelectItem value="all">Tüm kategoriler</SelectItem>{categories.filter((row) => row.is_active !== false).map((row) => <SelectItem key={row.id} value={row.id}>{row.name}</SelectItem>)}</SelectContent></Select>
          </div></CardContent></Card>
          <Card className="overflow-hidden"><div className="overflow-x-auto"><Table><TableHeader><TableRow>
            <TableHead>E-Belge</TableHead><TableHead>Cari Adı</TableHead><TableHead>Gider Tipi</TableHead><TableHead>Belge No</TableHead><TableHead>Durum</TableHead><TableHead>Düzenleme</TableHead><TableHead>Vade</TableHead><TableHead className="text-right">Genel Toplam</TableHead><TableHead className="text-right">Bakiye</TableHead>
          </TableRow></TableHeader><TableBody>
            {filteredExpenses.length === 0 ? <TableRow><TableCell colSpan={9} className="py-12 text-center text-slate-500">Henüz genel gider bulunmuyor. KolayBi’den aktarmak için “Giderleri Yenile”yi kullanın.</TableCell></TableRow> : filteredExpenses.map((row) => {
              const type = typeById.get(row.type_id); const category = categoryById.get(row.category_id);
              return <TableRow key={row.id}><TableCell><Badge variant="outline" className={row.e_document_status ? "border-blue-200 bg-blue-50 text-blue-700" : "text-slate-500"}>{row.e_document_status || "Belgesiz"}</Badge></TableCell><TableCell className="font-medium">{row.vendor || "-"}</TableCell><TableCell><p>{type?.name || row.category || "Kategorisiz"}</p>{category && <p className="text-xs text-slate-500">{category.name}</p>}</TableCell><TableCell className="font-mono text-xs">{row.provider_document_no || row.invoice_no || row.expense_no}</TableCell><TableCell><Badge variant="outline" className={statusClass(row.status || "Bekliyor")}>{row.status || "Bekliyor"}</Badge></TableCell><TableCell>{localDate(row.expense_date)}</TableCell><TableCell>{localDate(row.due_date)}</TableCell><TableCell className="text-right font-semibold">{money(row.provider_total ?? row.total ?? (Number(row.amount || 0) + Number(row.tax || 0)), row.currency)}</TableCell><TableCell className="text-right font-semibold">{money(row.balance, row.currency)}</TableCell></TableRow>;
            })}
          </TableBody></Table></div></Card>
        </TabsContent>

        <TabsContent value="catalog" className="mt-4 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h4 className="font-semibold">REX gider sınıflandırması</h4><p className="text-sm text-slate-500">KolayBi gider tipleri eşleştirilir; REX’e özel tipler ayrıca eklenebilir.</p></div>{canManage && <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setCategoryDialog(true)}><Plus className="mr-2 h-4 w-4"/>Kategori Ekle</Button><Button onClick={() => { setNewTypeCategory(categories.find((row) => row.is_active !== false)?.id || ""); setTypeDialog(true); }}><Plus className="mr-2 h-4 w-4"/>Gider Tipi Ekle</Button></div>}</div>
          <label className="flex items-center gap-2 text-sm text-slate-600"><Switch checked={showInactive} onCheckedChange={setShowInactive}/>Pasif kategori ve tipleri göster</label>
          {catalogLoading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-blue-600"/></div> : <div className="grid gap-4 xl:grid-cols-2">{categories.filter((category) => showInactive || category.is_active !== false).map((category) => <Card key={category.id} className={category.is_active === false ? "opacity-60" : ""}><CardHeader className="pb-3"><div className="flex items-start justify-between gap-3"><div><CardTitle className="text-base">{category.name}</CardTitle><CardDescription>{(category.expense_types || []).filter((type) => type.is_active !== false).length} aktif gider tipi</CardDescription></div>{canManage && <Switch checked={category.is_active !== false} onCheckedChange={(checked) => void toggleCategory(category, checked)}/>}</div></CardHeader><CardContent className="space-y-2">{(category.expense_types || []).filter((type) => showInactive || type.is_active !== false).length === 0 ? <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-500">Bu kategoride gider tipi yok.</p> : (category.expense_types || []).filter((type) => showInactive || type.is_active !== false).sort((a, b) => a.name.localeCompare(b.name, "tr")).map((type) => <div key={type.id} className={`flex items-center justify-between gap-3 rounded-md border p-3 ${type.is_active === false ? "bg-slate-50" : "bg-white"}`}><div><p className="text-sm font-medium">{type.name}</p><div className="mt-1 flex gap-1">{type.source === "kolaybi" && <Badge variant="outline" className="text-[10px]">KolayBi</Badge>}</div></div>{canManage && <Switch checked={type.is_active !== false} disabled={category.is_active === false} onCheckedChange={(checked) => void toggleType(type, checked)}/>}</div>)}</CardContent></Card>)}</div>}
        </TabsContent>
      </Tabs>

      <Dialog open={categoryDialog} onOpenChange={setCategoryDialog}><DialogContent><DialogHeader><DialogTitle>Yeni Gider Kategorisi</DialogTitle></DialogHeader><div className="space-y-2"><Label>Kategori adı</Label><Input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="Örn. Operasyon Ofis Giderleri" maxLength={120}/></div><DialogFooter><Button variant="outline" onClick={() => setCategoryDialog(false)}>Vazgeç</Button><Button onClick={saveCategory} disabled={saving || newCategory.trim().length < 2}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Kaydet</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={typeDialog} onOpenChange={setTypeDialog}><DialogContent><DialogHeader><DialogTitle>Yeni Gider Tipi</DialogTitle></DialogHeader><div className="space-y-4"><div className="space-y-2"><Label>Kategori</Label><Select value={newTypeCategory} onValueChange={setNewTypeCategory}><SelectTrigger><SelectValue placeholder="Kategori seçin"/></SelectTrigger><SelectContent>{categories.filter((row) => row.is_active !== false).map((row) => <SelectItem key={row.id} value={row.id}>{row.name}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Gider tipi adı</Label><Input value={newType} onChange={(event) => setNewType(event.target.value)} placeholder="Örn. Araç muayene gideri" maxLength={160}/></div></div><DialogFooter><Button variant="outline" onClick={() => setTypeDialog(false)}>Vazgeç</Button><Button onClick={saveType} disabled={saving || !newTypeCategory || newType.trim().length < 2}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Kaydet</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
