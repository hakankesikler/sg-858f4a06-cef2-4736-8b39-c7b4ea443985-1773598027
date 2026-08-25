import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/access-control";

export const STAFF_IDLE_TIMEOUT_MS = 30 * 60 * 1000;
export const STAFF_MAX_SESSION_MS = 8 * 60 * 60 * 1000;
export const MIN_PASSWORD_LENGTH = 12;
export const STAFF_SESSION_STARTED_KEY = "rex_staff_session_started_at";
export const STAFF_LAST_ACTIVITY_KEY = "rex_staff_last_activity_at";

export type SecurityEventType =
  | "login_success"
  | "mfa_enrolled"
  | "mfa_verified"
  | "mfa_removed"
  | "password_changed"
  | "other_sessions_revoked"
  | "session_timeout";

export function roleRequiresMfa(role: AppRole) {
  return role === "admin" || role === "accounting";
}

export function passwordPolicyError(password: string) {
  if (password.length < MIN_PASSWORD_LENGTH) return `Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalıdır.`;
  if (!/[a-zçğıöşü]/.test(password)) return "Şifre en az bir küçük harf içermelidir.";
  if (!/[A-ZÇĞİÖŞÜ]/.test(password)) return "Şifre en az bir büyük harf içermelidir.";
  if (!/\d/.test(password)) return "Şifre en az bir rakam içermelidir.";
  return null;
}

export async function getMfaState() {
  const [{ data: assurance, error: assuranceError }, { data: factors, error: factorsError }] = await Promise.all([
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    supabase.auth.mfa.listFactors(),
  ]);
  if (assuranceError) throw assuranceError;
  if (factorsError) throw factorsError;
  const verifiedFactors = (factors?.totp || []).filter((factor) => factor.status === "verified");
  return {
    currentLevel: assurance?.currentLevel || "aal1",
    nextLevel: assurance?.nextLevel || "aal1",
    verifiedFactors,
  };
}

export async function recordSecurityEvent(
  eventType: SecurityEventType,
  description: string,
  metadata: Record<string, unknown> = {},
) {
  await supabase.rpc("rex_record_security_event" as any, {
    p_event_type: eventType,
    p_description: description,
    p_metadata: metadata,
  } as any);
}

export function safePortalRedirect(value: unknown) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/personel/profil";
}

export function startStaffSessionClock() {
  if (typeof window === "undefined") return;
  const now = String(Date.now());
  window.localStorage.setItem(STAFF_SESSION_STARTED_KEY, now);
  window.localStorage.setItem(STAFF_LAST_ACTIVITY_KEY, now);
}

export function clearStaffSessionClock() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STAFF_SESSION_STARTED_KEY);
  window.localStorage.removeItem(STAFF_LAST_ACTIVITY_KEY);
}
