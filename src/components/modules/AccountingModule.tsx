import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Download,
  Eye,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Calendar,
  Users,
  BarChart3,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExpenseCategory {
  id: string;
  name: string;
  types: string[];
}

export function AccountingModule() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Category Edit Modal State
  const [editCategoryModal, setEditCategoryModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<ExpenseCategory | null>(null);
  const [editedCategoryName, setEditedCategoryName] = useState("");

  // Add New Type Modal State
  const [addTypeModal, setAddTypeModal] = useState(false);
  const [currentCategoryForType, setCurrentCategoryForType] = useState<ExpenseCategory | null>(null);
  const [newTypeName, setNewTypeName] = useState("");

  // Edit Type Modal State
  const [editTypeModal, setEditTypeModal] = useState(false);
  const [currentTypeForEdit, setCurrentTypeForEdit] = useState<{ categoryId: string; typeName: string; typeIndex: number } | null>(null);
  const [editedTypeName, setEditedTypeName] = useState("");

  // Expense Categories State
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([
    {
      id: "1",
      name: "Kategoriyle Genel Gider Tipleri",
      types: ["Yiyecek"]
    },
    {
      id: "2",
      name: "Araç Bakım Durumu",
      types: ["Araç Temizliği Bakım Giderleri", "Araç Düzensel Giderleri"]
    },
    {
      id: "3",
      name: "Yaşam",
      types: ["Freight Forwarding Yaşam"]
    },
    {
      id: "4",
      name: "Taşıma Faturaları",
      types: ["FULL TRUCK YÜKUMA", "Parsiyel Taşıma"]
    },
    {
      id: "5",
      name: "Kurumsal Giderler",
      types: ["İş Takibi Güvenlik/Danışmanlık Masrafı", "Freight Forwarding Sigortas", "Taşıma Diğer Giderleri", "Broker Giderleri", "Elektrik"]
    },
    {
      id: "6",
      name: "Finansal",
      types: ["Vakıfbank Yan Aziz Dijital Kredi", "Vakıfbank Yan Envar Saravas Kredi", "Vakıfbank Diğer Kredisi", "KFT", "Masrafı"]
    },
    {
      id: "7",
      name: "Denizden",
      types: ["Debiyo", "CMA Belgesi", "Dönenem", "Terminiz"]
    },
    {
      id: "8",
      name: "Ulaşım/Konuklama",
      types: ["Toplantı Yatanmış", "Kolaylıklar", "Araç Kiralama", "Dinmiyel Ovum", "Taleb"]
    },
    {
      id: "9",
      name: "Temel Giderler",
      types: ["Kargo Ödemeleri", "Kasa", "Yemsal Harcamalar", "Muhasebe/Mali Müşavir", "Sponsor Gideri"]
    },
    {
      id: "10",
      name: "Vergi",
      types: ["Mezuniyet Teknoloji", "Gerçek Üstünde Kararne Soğu Vergisi", "Kurumlar Vergisi", "ÖTV", "Stopaj"]
    },
    {
      id: "11",
      name: "Diğer",
      types: ["Dizüner Freezer", "Müşteriye Bedelini Taşıma Yenr Organizasyon", "Maskes", "Kargo", "Reklam/Tanıtım"]
    }
  ]);

  // Open Edit Category Modal
  const handleEditCategory = (category: ExpenseCategory) => {
    setCurrentCategory(category);
    setEditedCategoryName(category.name);
    setEditCategoryModal(true);
  };

  // Update Category Name
  const handleUpdateCategory = () => {
    if (!currentCategory || !editedCategoryName.trim()) {
      toast({
        title: "Hata",
        description: "Kategori adı boş olamaz",
        variant: "destructive",
      });
      return;
    }

    setExpenseCategories(prev => 
      prev.map(cat => 
        cat.id === currentCategory.id 
          ? { ...cat, name: editedCategoryName.trim() }
          : cat
      )
    );

    toast({
      title: "Başarılı",
      description: "Kategori güncellendi",
    });

    setEditCategoryModal(false);
    setCurrentCategory(null);
    setEditedCategoryName("");
  };

  // Delete Category
  const handleDeleteCategory = () => {
    if (!currentCategory) return;

    setExpenseCategories(prev => prev.filter(cat => cat.id !== currentCategory.id));

    toast({
      title: "Başarılı",
      description: "Kategori silindi",
    });

    setEditCategoryModal(false);
    setCurrentCategory(null);
    setEditedCategoryName("");
  };

  // Close Modal
  const handleCloseModal = () => {
    setEditCategoryModal(false);
    setCurrentCategory(null);
    setEditedCategoryName("");
  };

  // Open Add Type Modal
  const handleAddType = (category: ExpenseCategory) => {
    setCurrentCategoryForType(category);
    setNewTypeName("");
    setAddTypeModal(true);
  };

  // Save New Type
  const handleSaveNewType = () => {
    if (!currentCategoryForType || !newTypeName.trim()) {
      toast({
        title: "Hata",
        description: "Genel gider adı boş olamaz",
        variant: "destructive",
      });
      return;
    }

    setExpenseCategories(prev => 
      prev.map(cat => 
        cat.id === currentCategoryForType.id 
          ? { ...cat, types: [...cat.types, newTypeName.trim()] }
          : cat
      )
    );

    toast({
      title: "Başarılı",
      description: "Yeni gider tipi eklendi",
    });

    setAddTypeModal(false);
    setCurrentCategoryForType(null);
    setNewTypeName("");
  };

  // Close Add Type Modal
  const handleCloseAddTypeModal = () => {
    setAddTypeModal(false);
    setCurrentCategoryForType(null);
    setNewTypeName("");
  };

  // Open Edit Type Modal
  const handleEditType = (categoryId: string, typeName: string, typeIndex: number) => {
    console.log("Edit Type Clicked:", { categoryId, typeName, typeIndex });
    setCurrentTypeForEdit({ categoryId, typeName, typeIndex });
    setEditedTypeName(typeName);
    setEditTypeModal(true);
  };

  // Update Type Name
  const handleUpdateType = () => {
    if (!currentTypeForEdit || !editedTypeName.trim()) {
      toast({
        title: "Hata",
        description: "Gider tipi adı boş olamaz",
        variant: "destructive",
      });
      return;
    }

    setExpenseCategories(prev => 
      prev.map(cat => 
        cat.id === currentTypeForEdit.categoryId 
          ? { 
              ...cat, 
              types: cat.types.map((type, idx) => 
                idx === currentTypeForEdit.typeIndex ? editedTypeName.trim() : type
              ) 
            }
          : cat
      )
    );

    toast({
      title: "Başarılı",
      description: "Gider tipi güncellendi",
    });

    setEditTypeModal(false);
    setCurrentTypeForEdit(null);
    setEditedTypeName("");
  };

  // Delete Type
  const handleDeleteType = () => {
    if (!currentTypeForEdit) return;

    setExpenseCategories(prev => 
      prev.map(cat => 
        cat.id === currentTypeForEdit.categoryId 
          ? { 
              ...cat, 
              types: cat.types.filter((_, idx) => idx !== currentTypeForEdit.typeIndex) 
            }
          : cat
      )
    );

    toast({
      title: "Başarılı",
      description: "Gider tipi silindi",
    });

    setEditTypeModal(false);
    setCurrentTypeForEdit(null);
    setEditedTypeName("");
  };

  // Close Edit Type Modal
  const handleCloseEditTypeModal = () => {
    setEditTypeModal(false);
    setCurrentTypeForEdit(null);
    setEditedTypeName("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Muhasebe</h2>
      </div>

      <Tabs defaultValue="panel" className="space-y-4">
        <TabsList>
          <TabsTrigger value="panel">Panel</TabsTrigger>
          <TabsTrigger value="sales">Satış</TabsTrigger>
          <TabsTrigger value="purchase">Alış</TabsTrigger>
          <TabsTrigger value="expenses">Giderler</TabsTrigger>
          <TabsTrigger value="cari">Cari Hesaplar</TabsTrigger>
          <TabsTrigger value="reports">Raporlar</TabsTrigger>
        </TabsList>

        {/* Panel */}
        <TabsContent value="panel">
          <Card className="p-6">
            <p className="text-gray-500">Panel içeriği yakında eklenecek...</p>
          </Card>
        </TabsContent>

        {/* Satış */}
        <TabsContent value="sales">
          <Card className="p-6">
            <p className="text-gray-500">Satış faturaları yakında eklenecek...</p>
          </Card>
        </TabsContent>

        {/* Alış */}
        <TabsContent value="purchase">
          <Card className="p-6">
            <p className="text-gray-500">Alış faturaları yakında eklenecek...</p>
          </Card>
        </TabsContent>

        {/* Giderler */}
        <TabsContent value="expenses" className="space-y-4">
          <Tabs defaultValue="general-expenses" className="space-y-4">
            <TabsList>
              <TabsTrigger value="general-expenses">Genel Giderler</TabsTrigger>
              <TabsTrigger value="expense-types">Genel Gider Tipleri</TabsTrigger>
              <TabsTrigger value="recurring-expenses">Tekrarlı Genel Giderler</TabsTrigger>
            </TabsList>

            {/* Genel Giderler Alt Sekmesi */}
            <TabsContent value="general-expenses" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Gider ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      <SelectItem value="operational">Operasyonel</SelectItem>
                      <SelectItem value="administrative">İdari</SelectItem>
                      <SelectItem value="financial">Finansal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Gider Ekle
                </Button>
              </div>

              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Açıklama</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Tutar</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        Gider kaydı bulunamadı. Yeni gider eklemek için yukarıdaki butona tıklayın.
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            {/* Genel Gider Tipleri Alt Sekmesi */}
            <TabsContent value="expense-types" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {expenseCategories.map((category) => (
                  <Card key={category.id} className="p-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">{category.name}</h3>
                      <div className="space-y-2">
                        {category.types.map((type, index) => (
                          <div key={`${category.id}-${index}`} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                            <span className="text-sm">{type}</span>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleEditType(category.id, type, index);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => handleEditCategory(category)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Kategoriyi Düzenle
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => handleAddType(category)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Yeni Tip Ekle
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}

              </div>
            </TabsContent>

            {/* Tekrarlı Genel Giderler Alt Sekmesi */}
            <TabsContent value="recurring-expenses" className="space-y-4">
              <Card className="p-6">
                <p className="text-center text-gray-500">Tekrarlı genel giderler yakında eklenecek...</p>
              </Card>
            </TabsContent>

          </Tabs>
        </TabsContent>

        {/* Cari Hesaplar */}
        <TabsContent value="cari">
          <Card className="p-6">
            <p className="text-gray-500">Cari hesaplar yakında eklenecek...</p>
          </Card>
        </TabsContent>

        {/* Raporlar */}
        <TabsContent value="reports">
          <Card className="p-6">
            <p className="text-gray-500">Raporlar yakında eklenecek...</p>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Category Edit Modal */}
      <Dialog open={editCategoryModal} onOpenChange={setEditCategoryModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              Kategori Düzenle
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">
                Ad <span className="text-red-500">*</span>
              </Label>
              <Input
                id="category-name"
                value={editedCategoryName}
                onChange={(e) => setEditedCategoryName(e.target.value)}
                placeholder="Kategori adı"
                className="w-full"
              />
            </div>
          </div>

          <DialogFooter className="flex justify-center gap-3 sm:justify-center">
            <Button
              variant="outline"
              onClick={handleCloseModal}
              className="border-red-500 text-red-500 hover:bg-red-50"
            >
              Kapat
            </Button>
            <Button
              onClick={handleUpdateCategory}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Güncelle
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCategory}
              className="bg-red-600 hover:bg-red-700"
            >
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Type Modal */}
      <Dialog open={addTypeModal} onOpenChange={setAddTypeModal}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              Yeni Genel Gider Tipi
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type-name" className="text-blue-600">
                Genel Gider Adı <span className="text-blue-600">*</span>
              </Label>
              <Input
                id="type-name"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="Gider tipi adı girin"
                className="w-full"
              />
            </div>
          </div>

          <DialogFooter className="flex justify-center gap-3 sm:justify-center">
            <Button
              variant="outline"
              onClick={handleCloseAddTypeModal}
              className="border-red-500 text-red-500 hover:bg-red-50 px-8"
            >
              Kapat
            </Button>
            <Button
              onClick={handleSaveNewType}
              className="bg-green-600 hover:bg-green-700 text-white px-8"
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Type Modal */}
      <Dialog open={editTypeModal} onOpenChange={setEditTypeModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              Gider Tipi Düzenle
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-type-name">
                Gider Tipi Adı <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-type-name"
                value={editedTypeName}
                onChange={(e) => setEditedTypeName(e.target.value)}
                placeholder="Gider tipi adı"
                className="w-full"
              />
            </div>
          </div>

          <DialogFooter className="flex justify-center gap-3 sm:justify-center">
            <Button
              variant="outline"
              onClick={handleCloseEditTypeModal}
              className="border-red-500 text-red-500 hover:bg-red-50"
            >
              Kapat
            </Button>
            <Button
              onClick={handleUpdateType}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Kaydet
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteType}
              className="bg-red-600 hover:bg-red-700"
            >
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}