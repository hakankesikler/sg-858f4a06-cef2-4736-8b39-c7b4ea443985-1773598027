import { useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import {
  clearStaffSessionClock,
  recordSecurityEvent,
  STAFF_IDLE_TIMEOUT_MS,
  STAFF_LAST_ACTIVITY_KEY,
  STAFF_MAX_SESSION_MS,
  STAFF_SESSION_STARTED_KEY,
} from "@/lib/security";

export function useStaffSessionSecurity(enabled: boolean) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    let closing = false;
    let lastActivityWrite = 0;
    const now = Date.now();
    if (!Number(window.localStorage.getItem(STAFF_SESSION_STARTED_KEY))) {
      window.localStorage.setItem(STAFF_SESSION_STARTED_KEY, String(now));
    }
    if (!Number(window.localStorage.getItem(STAFF_LAST_ACTIVITY_KEY))) {
      window.localStorage.setItem(STAFF_LAST_ACTIVITY_KEY, String(now));
    }

    const touchActivity = () => {
      const current = Date.now();
      if (current - lastActivityWrite < 30_000) return;
      lastActivityWrite = current;
      window.localStorage.setItem(STAFF_LAST_ACTIVITY_KEY, String(current));
    };

    const closeExpiredSession = async () => {
      if (closing) return;
      const current = Date.now();
      const startedAt = Number(window.localStorage.getItem(STAFF_SESSION_STARTED_KEY)) || current;
      const lastActiveAt = Number(window.localStorage.getItem(STAFF_LAST_ACTIVITY_KEY)) || startedAt;
      const idleExpired = current - lastActiveAt >= STAFF_IDLE_TIMEOUT_MS;
      const maximumExpired = current - startedAt >= STAFF_MAX_SESSION_MS;
      if (!idleExpired && !maximumExpired) return;
      closing = true;
      try {
        await recordSecurityEvent(
          "session_timeout",
          idleExpired ? "Oturum hareketsizlik nedeniyle kapatıldı." : "Azami oturum süresi doldu.",
          { reason: idleExpired ? "idle" : "maximum" },
        );
      } catch {
        // Session closure must continue even if audit recording is unavailable.
      }
      await supabase.auth.signOut({ scope: "local" });
      clearStaffSessionClock();
      await router.replace("/login?reason=timeout");
    };

    const activityEvents: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "scroll", "touchstart"];
    activityEvents.forEach((name) => window.addEventListener(name, touchActivity, { passive: true }));
    const visibilityHandler = () => {
      if (document.visibilityState === "visible") void closeExpiredSession();
    };
    document.addEventListener("visibilitychange", visibilityHandler);
    const interval = window.setInterval(() => void closeExpiredSession(), 60_000);
    void closeExpiredSession();

    return () => {
      activityEvents.forEach((name) => window.removeEventListener(name, touchActivity));
      document.removeEventListener("visibilitychange", visibilityHandler);
      window.clearInterval(interval);
    };
  }, [enabled, router]);
}
