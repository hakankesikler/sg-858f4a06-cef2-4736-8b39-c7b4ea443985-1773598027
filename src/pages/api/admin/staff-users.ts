import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { permissionCatalog, type PermissionKey, type PermissionLevel } from "@/lib/staff-permissions";

const MANAGEABLE_ROLES = ["sales", "operations", "accounting", "viewer"] as const;
type ManageableRole = (typeof MANAGEABLE_ROLES)[number];

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function isManageableRole(value: unknown): value is ManageableRole {
  return typeof value === "string" && MANAGEABLE_ROLES.includes(value as ManageableRole);
}

const permissionKeys = new Set<string>(permissionCatalog.map((item) => item.key));

function parsePermissionOverrides(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const result: Partial<Record<PermissionKey, PermissionLevel>> = {};
  for (const [key, level] of Object.entries(value)) {
    if (!permissionKeys.has(key) || !["inherit", "none", "view", "manage"].includes(String(level))) return null;
    if (level !== "inherit") result[key as PermissionKey] = level as PermissionLevel;
  }
  return result;
}

function requestOriginIsValid(req: NextApiRequest) {
  const host = text(req.headers.host, 255);
  const rawOrigin = text(req.headers.origin || req.headers.referer, 500);
  if (!host || !rawOrigin) return false;
  try {
    return new URL(rawOrigin).host === host;
  } catch {
    return false;
  }
}

export const config = { api: { bodyParser: { sizeLimit: "8kb" } } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "private, no-store");
  if (!["GET", "POST", "PATCH", "PUT"].includes(req.method || "")) {
    return res.status(405).json({ error: "Desteklenmeyen işlem." });
  }
  if (!requestOriginIsValid(req)) return res.status(403).json({ error: "Geçersiz istek kaynağı." });

  const token = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : "";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!token) return res.status(401).json({ error: "Oturum doğrulanamadı." });
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return res.status(503).json({ error: "Kullanıcı yönetimi servisi yapılandırılmamış." });
  }

  const userDb = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const adminDb = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: authenticated, error: authError } = await userDb.auth.getUser(token);
  if (authError || !authenticated.user) return res.status(401).json({ error: "Oturum süresi dolmuş." });

  const actor = authenticated.user;
  const { data: actorRole } = await adminDb
    .from("app_user_roles")
    .select("email,role,active")
    .eq("user_id", actor.id)
    .maybeSingle();
  if (!actorRole || !actorRole.active || actorRole.role !== "admin" || actorRole.email.toLowerCase() !== "info@rexlojistik.com") {
    return res.status(403).json({ error: "Kullanıcı ve yetkileri yalnızca şirket sahibi hesabı yönetebilir." });
  }

  if (req.method === "GET") {
    const [{ data: roleRows, error: roleError }, { data: authUsers, error: usersError }, { data: overrideRows, error: overridesError }] = await Promise.all([
      adminDb.from("app_user_roles").select("user_id,email,role,active,created_at,updated_at").order("created_at"),
      adminDb.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      adminDb.from("staff_permission_overrides").select("user_id,permission_key,access_level"),
    ]);
    if (roleError || usersError || overridesError) return res.status(500).json({ error: "Kullanıcı listesi ve kişisel yetkiler alınamadı." });
    const authMap = new Map((authUsers.users || []).map((user) => [user.id, user]));
    const overridesByUser = new Map<string, Record<string, PermissionLevel>>();
    for (const row of overrideRows || []) {
      const current = overridesByUser.get(row.user_id) || {};
      current[row.permission_key] = row.access_level as PermissionLevel;
      overridesByUser.set(row.user_id, current);
    }
    return res.status(200).json({
      users: (roleRows || []).map((row) => {
        const authUser = authMap.get(row.user_id);
        return {
          ...row,
          full_name: text(authUser?.user_metadata?.full_name, 120),
          last_sign_in_at: authUser?.last_sign_in_at || null,
          invited_at: authUser?.invited_at || null,
          is_owner: row.email.toLowerCase() === "info@rexlojistik.com",
          permission_overrides: overridesByUser.get(row.user_id) || {},
        };
      }),
    });
  }

  if (req.method === "PUT") {
    const userId = text(req.body?.userId, 36);
    const overrides = parsePermissionOverrides(req.body?.overrides);
    if (!/^[0-9a-f-]{36}$/i.test(userId)) return res.status(400).json({ error: "Kullanıcı kimliği geçersiz." });
    if (!overrides) return res.status(400).json({ error: "Kişisel yetki listesi geçersiz." });

    const { data: target, error: targetError } = await adminDb
      .from("app_user_roles")
      .select("email,role,active")
      .eq("user_id", userId)
      .maybeSingle();
    if (targetError || !target) return res.status(404).json({ error: "Kullanıcı bulunamadı." });
    if (target.email.toLowerCase() === "info@rexlojistik.com" || target.role === "admin") {
      return res.status(403).json({ error: "Yönetici hesaplarının tam yetkisi kişisel izinlerle daraltılamaz." });
    }

    const { data: previousRows, error: previousError } = await adminDb
      .from("staff_permission_overrides")
      .select("user_id,permission_key,access_level,updated_by,created_at,updated_at")
      .eq("user_id", userId);
    if (previousError) return res.status(500).json({ error: "Mevcut kişisel yetkiler okunamadı." });
    const { error: deleteError } = await adminDb.from("staff_permission_overrides").delete().eq("user_id", userId);
    if (deleteError) return res.status(500).json({ error: "Önceki kişisel yetkiler temizlenemedi." });
    const rows = Object.entries(overrides).map(([permissionKey, accessLevel]) => ({
      user_id: userId,
      permission_key: permissionKey,
      access_level: accessLevel,
      updated_by: actor.id,
      updated_at: new Date().toISOString(),
    }));
    if (rows.length) {
      const { error: insertError } = await adminDb.from("staff_permission_overrides").insert(rows);
      if (insertError) {
        if (previousRows?.length) await adminDb.from("staff_permission_overrides").insert(previousRows);
        return res.status(500).json({ error: "Kişisel yetkiler kaydedilemedi; önceki ayarlar korundu." });
      }
    }
    await adminDb.from("staff_access_events").insert({
      target_user_id: userId,
      target_email: target.email,
      event_type: "permissions_changed",
      old_role: target.role,
      new_role: target.role,
      old_active: target.active,
      new_active: target.active,
      actor_id: actor.id,
      actor_email: actor.email || actorRole.email,
    });
    return res.status(200).json({ success: true });
  }

  if (req.method === "POST") {
    const email = text(req.body?.email, 255).toLowerCase();
    const fullName = text(req.body?.fullName, 120);
    const password = text(req.body?.password, 128);
    const role = req.body?.role;
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: "Geçerli bir e-posta adresi girin." });
    if (!fullName) return res.status(400).json({ error: "Ad soyad zorunludur." });
    if (password.length < 10 || !/[A-Za-zÇĞİÖŞÜçğıöşü]/.test(password) || !/\d/.test(password)) {
      return res.status(400).json({ error: "Geçici şifre en az 10 karakter, bir harf ve bir rakam içermelidir." });
    }
    if (!isManageableRole(role)) return res.status(400).json({ error: "Geçerli bir yetki grubu seçin." });

    const { data: existing } = await adminDb.from("app_user_roles").select("user_id").ilike("email", email).maybeSingle();
    if (existing) return res.status(409).json({ error: "Bu e-posta için zaten bir personel hesabı bulunuyor." });

    const { data: created, error: createError } = await adminDb.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, staff_role: role, must_change_password: true },
    });
    if (createError || !created.user) {
      return res.status(422).json({ error: createError?.message || "Personel hesabı oluşturulamadı." });
    }

    const { error: roleError } = await adminDb.from("app_user_roles").upsert({
      user_id: created.user.id,
      email,
      role,
      active: true,
      updated_at: new Date().toISOString(),
    });
    if (roleError) return res.status(500).json({ error: "Kullanıcı oluşturuldu ancak yetkisi kaydedilemedi." });

    await adminDb.from("staff_access_events").insert({
      target_user_id: created.user.id,
      target_email: email,
      event_type: "created",
      new_role: role,
      new_active: true,
      actor_id: actor.id,
      actor_email: actor.email || actorRole.email,
    });
    return res.status(201).json({ success: true });
  }

  const userId = text(req.body?.userId, 36);
  const role = req.body?.role;
  const active = req.body?.active;
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return res.status(400).json({ error: "Kullanıcı kimliği geçersiz." });
  if (!isManageableRole(role)) return res.status(400).json({ error: "Geçerli bir yetki grubu seçin." });
  if (typeof active !== "boolean") return res.status(400).json({ error: "Hesap durumu geçersiz." });

  const { data: target, error: targetError } = await adminDb
    .from("app_user_roles")
    .select("email,role,active")
    .eq("user_id", userId)
    .maybeSingle();
  if (targetError || !target) return res.status(404).json({ error: "Kullanıcı bulunamadı." });
  if (target.email.toLowerCase() === "info@rexlojistik.com") {
    return res.status(403).json({ error: "Şirket sahibi hesabının yetkisi veya durumu değiştirilemez." });
  }

  const { error: updateError } = await adminDb.from("app_user_roles").update({
    role,
    active,
    updated_at: new Date().toISOString(),
  }).eq("user_id", userId);
  if (updateError) return res.status(500).json({ error: "Kullanıcı yetkisi güncellenemedi." });

  const eventType = target.active !== active
    ? (active ? "activated" : "deactivated")
    : "role_changed";
  await adminDb.from("staff_access_events").insert({
    target_user_id: userId,
    target_email: target.email,
    event_type: eventType,
    old_role: target.role,
    new_role: role,
    old_active: target.active,
    new_active: active,
    actor_id: actor.id,
    actor_email: actor.email || actorRole.email,
  });
  return res.status(200).json({ success: true });
}
