import { useEffect } from "react";
import { useRouter } from "next/router";
import { Plus_Jakarta_Sans, Work_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { trackPageVisit } from "@/services/analyticsService";
import "@/styles/globals.css";
import type { AppProps } from "next/app";

// Keep the existing faces (including synthesized weights) while serving fonts locally.
const headingFont = Plus_Jakarta_Sans({
  weight: ["400", "600", "700", "800"],
  style: "normal",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
  adjustFontFallback: false,
});
const bodyFont = Work_Sans({
  weight: ["400", "500", "600"],
  style: "normal",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
  adjustFontFallback: false,
});

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
      <style jsx global>{`
        :root {
          --rex-font-heading: ${headingFont.style.fontFamily};
          --rex-font-body: ${bodyFont.style.fontFamily};
        }
      `}</style>
      <Component {...pageProps} />
      <Toaster />
    </>
  );
}
