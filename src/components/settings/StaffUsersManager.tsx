import { useCallback, useEffect, useState } from "react";
import { Copy, Eye, EyeOff, KeyRound, RefreshCw, ShieldCheck, UserPlus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type StaffRole = "sales" | "operations" | "accounting" | "viewer";
type StaffUser = {
  user_id: string;
  email: string;
  role: StaffRole | "admin" | "hr" | "demo";
  active: boolean;
  full_name: string;
  last_sign_in_at: string | null;
  invited_at: string | null;
  is_owner: boolean;
};

const roleDetails: Record<StaffRole, { label: string; description: string }> = {
  sales: { label: "Satış", description: "CRM, cari kayıtları ve cari raporları" },
  operations: { label: "Operasyon", description: "CRM, sevkiyat, sürücü/araç ve operasyon raporları" },
  accounting: { label: "Muhasebe", description: "Cari, fatura, ödeme ve finans raporları" },
  viewer: { label: "Kısıtlı Görüntüleyici", description: "Yalnızca güvenli özet ekranı" },
};

const allRoleLabels: Record<string, string> = {
  admin: "Yönetici",
  sales: "Satış",
  operations: "Operasyon",
  accounting: "Muhasebe",
  hr: "İnsan Kaynakları",
  viewer: "Kısıtlı Görüntüleyici",
  demo: "Demo",
};

async function staffRequest(method: "GET" | "POST" | "PATCH", body?: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.");
  const response = await fetch("/api/admin/staff-users", {
    method,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "İşlem tamamlanamadı.");
  return payload;
}

function dateLabel(value: string | null) {
  return value ? new Date(value).toLocaleString("tr-TR") : "Henüz giriş yapmadı";
}

function generateTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = new Uint32Array(10);
  crypto.getRandomValues(bytes);
  return `Rx${Array.from(bytes, (value) => alphabet[value % alphabet.length]).join("")}9!`;
}

export function StaffUsersManager() {
  const { toast } = useToast();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<StaffRole>("operations");

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const payload = await staffRequest("GET");
      setUsers(payload.users || []);
    } catch (error: any) {
      toast({ title: "Kullanıcılar alınamadı", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  const createAccount = async () => {
    try {
      setSaving(true);
      await staffRequest("POST", { fullName, email, password, role });
      toast({ title: "Personel hesabı oluşturuldu", description: `${email} kullanıcısı ilk girişte geçici şifresini değiştirecek.` });
      setFullName("");
      setEmail("");
      setPassword("");
      setRole("operations");
      await loadUsers();
    } catch (error: any) {
      toast({ title: "Hesap oluşturulamadı", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const updateUser = async (user: StaffUser, next: { role?: StaffRole; active?: boolean }) => {
    try {
      setUpdatingId(user.user_id);
      await staffRequest("PATCH", {
        userId: user.user_id,
        role: next.role || user.role,
        active: next.active ?? user.active,
      });
      toast({ title: "Yetki güncellendi", description: `${user.email} için yeni ayarlar kaydedildi.` });
      await loadUsers();
    } catch (error: any) {
      toast({ title: "Yetki güncellenemedi", description: error.message, variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 border-blue-200 bg-blue-50/50">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
          <div>
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-700" />
              <h3 className="text-lg font-semibold text-gray-900">Yeni Personel Hesabı Aç</h3>
            </div>
            <p className="text-sm text-gray-600 mt-1">Kullanıcı adı olarak e-posta ve geçici şifreyi burada belirleyin. Çalışan ilk girişte şifresini değiştirmek zorundadır.</p>
          </div>
          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Sadece şirket sahibi yönetebilir</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-5">
          <div><Label htmlFor="staff-name">Ad Soyad</Label><Input id="staff-name" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Çalışanın adı soyadı" /></div>
          <div><Label htmlFor="staff-email">Kullanıcı Adı / E-posta</Label><Input id="staff-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="calisan@rexlojistik.com" /></div>
          <div><Label htmlFor="staff-password">Geçici Şifre</Label><div className="flex gap-2"><div className="relative flex-1"><Input id="staff-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" className="pr-10" /><button type="button" aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div><Button type="button" variant="outline" size="icon" title="Güçlü şifre üret" onClick={() => setPassword(generateTemporaryPassword())}><KeyRound className="w-4 h-4" /></Button><Button type="button" variant="outline" size="icon" title="Şifreyi kopyala" disabled={!password} onClick={() => { void navigator.clipboard.writeText(password); toast({ title: "Geçici şifre kopyalandı" }); }}><Copy className="w-4 h-4" /></Button></div></div>
          <div><Label>Yetki Grubu</Label><Select value={role} onValueChange={(value) => setRole(value as StaffRole)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(roleDetails).map(([value, detail]) => <SelectItem key={value} value={value}>{detail.label}</SelectItem>)}</SelectContent></Select></div>
        </div>
        <p className="mt-3 text-xs text-slate-500">Geçici şifre en az 10 karakter, bir harf ve bir rakam içermelidir. Oluşturduktan sonra çalışanla güvenli bir kanaldan paylaşın.</p>
        <div className="mt-4 rounded-lg border border-blue-200 bg-white p-3 text-sm text-gray-700"><strong>{roleDetails[role].label}:</strong> {roleDetails[role].description}</div>
        <Button className="mt-4" onClick={() => void createAccount()} disabled={saving || !fullName.trim() || !email.trim() || password.length < 10}><UserPlus className="w-4 h-4 mr-2" />{saving ? "Oluşturuluyor..." : "Personel Hesabını Oluştur"}</Button>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div><div className="flex items-center gap-2"><Users className="w-5 h-5 text-slate-700" /><h3 className="text-lg font-semibold">Personel Hesapları</h3></div><p className="text-sm text-gray-600 mt-1">Rol değişiklikleri bir sonraki işlemde ve yeniden girişte uygulanır.</p></div>
          <Button variant="outline" size="sm" onClick={() => void loadUsers()} disabled={loading}><RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />Yenile</Button>
        </div>
        {loading ? <div className="py-12 text-center text-gray-500">Kullanıcılar yükleniyor...</div> : (
          <div className="space-y-3">
            {users.map((user) => {
              const editable = !user.is_owner && ["sales", "operations", "accounting", "viewer"].includes(user.role);
              return (
                <div key={user.user_id} className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr_0.8fr] gap-4 items-center rounded-xl border p-4">
                  <div className="min-w-0"><div className="flex items-center gap-2"><p className="font-semibold truncate">{user.full_name || user.email.split("@")[0]}</p>{user.is_owner && <Badge className="bg-slate-900"><ShieldCheck className="w-3 h-3 mr-1" />Şirket Sahibi</Badge>}</div><p className="text-sm text-gray-600 truncate">{user.email}</p><p className="text-xs text-gray-400 mt-1">Son giriş: {dateLabel(user.last_sign_in_at)}</p></div>
                  <div>{editable ? <Select value={user.role} disabled={updatingId === user.user_id} onValueChange={(value) => void updateUser(user, { role: value as StaffRole })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(roleDetails).map(([value, detail]) => <SelectItem key={value} value={value}>{detail.label}</SelectItem>)}</SelectContent></Select> : <Badge variant="outline" className="text-sm py-1.5 px-3">{allRoleLabels[user.role] || user.role}</Badge>}<p className="text-xs text-gray-500 mt-1">{user.role in roleDetails ? roleDetails[user.role as StaffRole].description : "Tam yönetim yetkisi"}</p></div>
                  <div className="flex lg:justify-end items-center gap-3"><div className="text-right"><p className="text-sm font-medium">{user.active ? "Hesap aktif" : "Erişim kapalı"}</p><p className="text-xs text-gray-500">{user.active ? "Portala giriş yapabilir" : "Portal verilerine erişemez"}</p></div><Switch checked={user.active} disabled={!editable || updatingId === user.user_id} onCheckedChange={(checked) => void updateUser(user, { active: checked })} /></div>
                </div>
              );
            })}
            {!users.length && <div className="py-12 text-center text-gray-500">Henüz personel hesabı bulunmuyor.</div>}
          </div>
        )}
      </Card>
    </div>
  );
}
