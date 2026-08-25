import { useEffect, useRef } from "react";

export const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

type Props = {
  onToken: (token: string) => void;
  theme?: "light" | "dark" | "auto";
};

export function TurnstileWidget({ onToken, theme = "light" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!turnstileSiteKey || !containerRef.current) return;
    let cancelled = false;

    const render = () => {
      const turnstile = (window as any).turnstile;
      if (cancelled || !turnstile || !containerRef.current || widgetIdRef.current) return;
      widgetIdRef.current = turnstile.render(containerRef.current, {
        sitekey: turnstileSiteKey,
        theme,
        callback: (token: string) => onToken(token),
        "expired-callback": () => onToken(""),
        "error-callback": () => onToken(""),
      });
    };

    const existing = document.querySelector<HTMLScriptElement>('script[data-rex-turnstile="true"]');
    if ((window as any).turnstile) render();
    else if (existing) existing.addEventListener("load", render, { once: true });
    else {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.dataset.rexTurnstile = "true";
      script.addEventListener("load", render, { once: true });
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      const turnstile = (window as any).turnstile;
      if (turnstile && widgetIdRef.current) turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    };
  }, [onToken, theme]);

  if (!turnstileSiteKey) return null;
  return <div ref={containerRef} className="flex justify-center min-h-[65px]" aria-label="Robot doğrulaması" />;
}
