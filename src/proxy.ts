import { NextRequest, NextResponse } from "next/server";

const PRODUCTION_HOSTS = new Set(["rexlojistik.com", "www.rexlojistik.com"]);
const CRON_PATHS = new Set([
  "/api/crm/process-reminders",
  "/api/kolaybi/office-sync",
  "/api/kolaybi/outbound-sync",
  "/api/kolaybi/process-queue",
  "/api/kolaybi/purchase-invoices/sync",
  "/api/quotes/process-queue",
  "/api/uetds/process-queue",
]);

function requestHostname(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0];
  const host = forwardedHost || request.headers.get("host") || "";
  return host.trim().toLowerCase().replace(/:\d+$/, "");
}

function isAuthorizedCronRequest(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  return Boolean(
    cronSecret
    && CRON_PATHS.has(request.nextUrl.pathname)
    && request.headers.get("authorization") === `Bearer ${cronSecret}`,
  );
}

export function proxy(request: NextRequest) {
  if (process.env.VERCEL_ENV !== "production") {
    return NextResponse.next();
  }

  if (!PRODUCTION_HOSTS.has(requestHostname(request)) && !isAuthorizedCronRequest(request)) {
    return new NextResponse("Not Found", {
      status: 404,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
