import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  KeyRound,
  Laptop,
  Loader2,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserRole, roleLabels, type AppRole } from "@/lib/access-control";
import { getMfaState, recordSecurityEvent, roleRequiresMfa } from "@/lib/security";
import { useToast } from "@/hooks/use-toast";

type SecurityEvent = {
  id: string;
  email: string;
  event_type: string;
  description: string;
  created_at: string;
};

const eventLabels: Record<string, string> = {
  login_success: "Güvenli giriş",
  mfa_enrolled: "Authenticator etkinleştirildi",
  mfa_verified: "MFA doğrulandı",
  mfa_removed: "Authenticator kaldırıldı",
  password_changed: "Şifre değiştirildi",
  other_sessions_revoked: "Diğer oturumlar kapatıldı",
  session_timeout: "Oturum süresi doldu",
};

export function SecuritySettings() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [role, setRole] = useState<AppRole | null>(null);
  const [email, setEmail] = useState("");
  const [mfaActive, setMfaActive] = useState(false);
  const [aal, setAal] = useState("aal1");
  const [events, setEvents] = useState<SecurityEvent[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Oturum bulunamadı");
      const [currentRole, mfa] = await Promise.all([
        getCurrentUserRole(userData.user.id),
        getMfaState(),
      ]);
      setRole(currentRole);
      setEmail(userData.user.email || "");
      setMfaActive(mfa.verifiedFactors.length > 0);
      setAal(mfa.currentLevel);

      const { data } = await supabase
        .from("staff_security_events" as any)
        .select("id,email,event_type,description,created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      setEvents((data || []) as unknown as SecurityEvent[]);
    } catch {
      toast({ title: "Güvenlik bilgileri yüklenemedi", description: "Oturumunuzu yenileyip tekrar deneyin.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { void load(); }, [load]);

  const openMfa = async () => {
    await router.push(`/personel/mfa?redirect=${encodeURIComponent("/personel/profil?module=settings&tab=security")}`);
  };

  const revokeOtherSessions = async () => {
    if (!window.confirm("Bu hesapla diğer cihazlarda açık olan tüm oturumlar kapatılsın mı?")) return;
    setWorking(true);
    const { error } = await supabase.auth.signOut({ scope: "others" });
    if (!error) await recordSecurityEvent("other_sessions_revoked", "Diğer cihazlardaki personel oturumları kapatıldı.");
    setWorking(false);
    toast(error
      ? { title: "Oturumlar kapatılamadı", description: error.message, variant: "destructive" }
      : { title: "Diğer oturumlar kapatıldı", description: "Bu cihazdaki güvenli oturumunuz açık kaldı." });
    if (!error) void load();
  };

  const sendPasswordReset = async () => {
    if (!email) return;
    setWorking(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/login` });
    setWorking(false);
    toast(error
      ? { title: "Bağlantı gönderilemedi", description: error.message, variant: "destructive" }
      : { title: "Şifre yenileme bağlantısı gönderildi", description: email });
  };

  if (loading) return <Card className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></Card>;

  const mfaRequired = role ? roleRequiresMfa(role) : false;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3"><span className="rounded-xl bg-blue-100 p-3 text-blue-700"><ShieldCheck className="w-6 h-6" /></span><div><h3 className="font-semibold text-lg">İki Aşamalı Doğrulama</h3><p className="text-sm text-slate-600 mt-1">Şifrenize ek olarak Authenticator kodu ister.</p></div></div>
            <Badge className={mfaActive && aal === "aal2" ? "bg-emerald-600" : "bg-amber-500"}>{mfaActive ? (aal === "aal2" ? "Etkin ve doğrulandı" : "Doğrulama gerekli") : "Kurulmadı"}</Badge>
          </div>
          <div className="mt-5 rounded-xl border bg-slate-50 p-4 text-sm space-y-1"><p><strong>Hesap:</strong> {email}</p><p><strong>Görev:</strong> {role ? roleLabels[role] : "-"}</p><p><strong>Politika:</strong> {mfaRequired ? "Bu görev için MFA zorunlu" : "İsteğe bağlı"}</p></div>
          <Button className="mt-5" onClick={() => void openMfa()}>{mfaActive ? "MFA Doğrulamasına Git" : "Authenticator Kur"}</Button>
        </Card>

        <Card className="p-6">
          <div className="flex gap-3"><span className="rounded-xl bg-violet-100 p-3 text-violet-700"><Laptop className="w-6 h-6" /></span><div><h3 className="font-semibold text-lg">Oturum Güvenliği</h3><p className="text-sm text-slate-600 mt-1">Unutulan veya açık kalan oturumları sınırlar.</p></div></div>
          <div className="grid grid-cols-2 gap-3 mt-5"><div className="rounded-xl bg-slate-50 border p-4"><p className="text-xs text-slate-500">Hareketsizlik</p><p className="font-semibold mt-1">2 saat 30 dakika</p></div><div className="rounded-xl bg-slate-50 border p-4"><p className="text-xs text-slate-500">Azami oturum</p><p className="font-semibold mt-1">8 saat</p></div></div>
          <Button variant="outline" className="mt-5" onClick={() => void revokeOtherSessions()} disabled={working}>Diğer Tüm Cihazlardan Çıkış Yap</Button>
        </Card>

        <Card className="p-6">
          <div className="flex gap-3"><span className="rounded-xl bg-orange-100 p-3 text-orange-700"><KeyRound className="w-6 h-6" /></span><div><h3 className="font-semibold text-lg">Şifre Güvenliği</h3><p className="text-sm text-slate-600 mt-1">Yeni şifreler için güçlü politika uygulanır.</p></div></div>
          <ul className="mt-5 text-sm text-slate-700 space-y-2"><li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />En az 6 karakter</li><li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />Büyük harf, küçük harf ve rakam</li><li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />Geçici şifre ilk girişte değişir</li></ul>
          <Button variant="outline" className="mt-5" onClick={() => void sendPasswordReset()} disabled={working}>Şifre Yenileme Bağlantısı Gönder</Button>
        </Card>

        <Card className="p-6">
          <div className="flex gap-3"><span className="rounded-xl bg-emerald-100 p-3 text-emerald-700"><LockKeyhole className="w-6 h-6" /></span><div><h3 className="font-semibold text-lg">Sistem Koruma Durumu</h3><p className="text-sm text-slate-600 mt-1">Kod ve veritabanı seviyesindeki aktif kontroller.</p></div></div>
          <div className="mt-5 space-y-3 text-sm">
            {["Rol ve kişisel yetki denetimi", "Özel belge depoları ve erişim kuralları", "Değiştirilemeyen işlem kayıtları", "HTTP güvenlik başlıkları", "Teslim evrakı antivirüs akışı"].map((label) => <div key={label} className="flex items-center justify-between gap-3"><span>{label}</span><Badge variant="outline" className="text-emerald-700 border-emerald-300"><CheckCircle2 className="w-3 h-3 mr-1" />Aktif</Badge></div>)}
            <div className="flex items-center justify-between gap-3"><span>CAPTCHA ve sızdırılmış şifre kontrolü</span><Badge variant="outline" className="text-amber-700 border-amber-300"><AlertTriangle className="w-3 h-3 mr-1" />Panel ayarı gerekli</Badge></div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between gap-4 mb-5"><div><h3 className="font-semibold text-lg">Güvenlik Hareketleri</h3><p className="text-sm text-slate-600">Giriş, MFA, şifre ve oturum işlemleri sonradan değiştirilemez.</p></div><Button variant="outline" size="sm" onClick={() => void load()}><RefreshCw className="w-4 h-4 mr-2" />Yenile</Button></div>
        {events.length === 0 ? <p className="text-sm text-slate-500 rounded-xl border bg-slate-50 p-5">Henüz güvenlik hareketi kaydedilmedi.</p> : <div className="divide-y rounded-xl border overflow-hidden">{events.map((event) => <div key={event.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2"><div><p className="font-medium">{eventLabels[event.event_type] || event.event_type}</p><p className="text-sm text-slate-600">{event.description || event.email}</p></div><div className="text-xs text-slate-500 flex items-center gap-1"><Clock3 className="w-3.5 h-3.5" />{new Date(event.created_at).toLocaleString("tr-TR")}</div></div>)}</div>}
      </Card>
    </div>
  );
}
