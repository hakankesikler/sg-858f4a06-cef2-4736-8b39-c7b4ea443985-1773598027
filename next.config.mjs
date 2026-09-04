/** @type {import('next').NextConfig} */
import { createRequire } from "module";

// Check if element-tagger is available
function isElementTaggerAvailable() {
  try {
    const require = createRequire(import.meta.url);
    require.resolve("@softgenai/element-tagger");
    return true;
  } catch {
    return false;
  }
}

// Build turbo rules only if tagger is available
function getTurboRules() {
  if (!isElementTaggerAvailable()) {
    console.log(
      "[Softgen] Element tagger not found, skipping loader configuration"
    );
    return {};
  }

  return {
    "*.tsx": ["@softgenai/element-tagger"],
    "*.jsx": ["@softgenai/element-tagger"],
  };
}

function getR2ConnectSources() {
  const endpoint = process.env.R2_ENDPOINT?.trim();
  const bucket = process.env.R2_BUCKET_NAME?.trim();
  if (!endpoint) return [];

  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:" || !url.hostname.endsWith(".r2.cloudflarestorage.com")) {
      return [];
    }
    const sources = [url.origin];
    if (bucket && /^[a-z0-9][a-z0-9.-]*[a-z0-9]$/.test(bucket)) {
      sources.push(`${url.protocol}//${bucket}.${url.host}`);
    }
    return sources;
  } catch {
    return [];
  }
}

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  experimental: {
    // Keep build-time type checking isolated without requiring child processes.
    workerThreads: true,
    useTypeScriptCli: false,
  },
  turbopack: {
    rules: getTurboRules(),
  },
  allowedDevOrigins: ["*.daytona.work", "*.softgen.dev"],
  async headers() {
    const r2ConnectSources = getR2ConnectSources();
    const contentSecurityPolicy = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      [
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com",
        ...r2ConnectSources,
      ].filter(Boolean).join(" "),
      "frame-src https://challenges.cloudflare.com",
      "media-src 'self' blob: https:",
      "worker-src 'self' blob:",
      "upgrade-insecure-requests",
    ].join("; ");

    return [{
      source: "/(.*)",
      headers: [
        { key: "Content-Security-Policy", value: contentSecurityPolicy },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
        { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        { key: "X-XSS-Protection", value: "0" },
      ],
    }];
  },
};

export default nextConfig;
