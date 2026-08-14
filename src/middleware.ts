import { NextRequest, NextResponse } from "next/server";

export function middleware(_request: NextRequest) {
  return new NextResponse("Bu içerik kalıcı olarak kaldırıldı.", {
    status: 410,
    headers: {
      "Cache-Control": "public, max-age=0, s-maxage=3600",
      "Content-Type": "text/plain; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export const config = {
  matcher: [
    "/services/:path*",
    "/category/:path*",
    "/tag/:path*",
    "/contact/:path*",
  ],
};
