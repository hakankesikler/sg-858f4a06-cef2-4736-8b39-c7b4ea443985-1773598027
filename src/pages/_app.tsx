import { useEffect } from "react";
import { useRouter } from "next/router";
import { Toaster } from "@/components/ui/toaster";
import { trackPageVisit } from "@/services/analyticsService";
import "@/styles/globals.css";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Track page visits automatically
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      // Track the page visit
      trackPageVisit({
        page_url: url,
        page_title: document.title,
        referrer: document.referrer,
        user_agent: navigator.userAgent,
      });
    };

    // Track initial page load
    handleRouteChange(router.asPath);

    // Track subsequent route changes
    router.events.on("routeChangeComplete", handleRouteChange);

    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router]);

  return (
    <>
      <Component {...pageProps} />
      <Toaster />
    </>
  );
}