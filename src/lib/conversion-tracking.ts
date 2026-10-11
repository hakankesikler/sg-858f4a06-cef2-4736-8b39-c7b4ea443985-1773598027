import { CONVERSION_PAGE, parseConversionPayload, referralSource } from "@/lib/conversion-payload";

// Capture click intent only. No form values or WhatsApp message text are collected.
export function installConversionTracking(): () => void {
  let source = referralSource(document.referrer);
  try {
    const saved = sessionStorage.getItem("rex_conversion_source");
    const candidate = parseConversionPayload({ eventId: "00000000-0000-4000-8000-000000000000", page: CONVERSION_PAGE, event: "quote_open", source: saved });
    if (candidate) source = candidate.source;
    else sessionStorage.setItem("rex_conversion_source", source);
  } catch { /* Tracking must not interfere with quotation flows. */ }
  let lastClick = "";
  let lastAt = 0;
  const listener = (click: MouseEvent) => {
    if (location.pathname !== CONVERSION_PAGE || !(click.target instanceof Element)) return;
    const control = click.target.closest<HTMLElement>("[data-rex-conversion]");
    if (!control || control.getAttribute("aria-disabled") === "true" || (control instanceof HTMLButtonElement && control.disabled)) return;
    const event = control.dataset.rexConversion;
    const now = Date.now();
    if (event === lastClick && now - lastAt < 1000) return;
    try {
      if (!crypto.randomUUID) return;
      const payload = parseConversionPayload({ eventId: crypto.randomUUID(), page: CONVERSION_PAGE, event, source });
      if (!payload) return;
      lastClick = event || "";
      lastAt = now;
      void fetch("/api/analytics/conversion", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), keepalive: true }).catch(() => undefined);
    } catch { /* Navigation and form behavior remain available if measurement fails. */ }
  };
  document.addEventListener("click", listener, true);
  return () => document.removeEventListener("click", listener, true);
}
