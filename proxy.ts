import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/auth";
import { getMaintenance } from "@/lib/maintenance";

import { isSeason } from "@/lib/season-data";

// Maintenance mode, toggled in /admin/maintenance. Runs in the Node runtime so it can read sqlite.
// Admins (valid session cookie) always see the real site; everyone else gets the maintenance page with a 503.
// Admins can also preview any season with ?season=<name>; the proxy turns that into a request header the layout reads.

export const config = {
  matcher: ["/((?!admin|api|maintenance|_next/static|_next/image|favicon.ico|icon|opengraph-image|uploads|robots.txt|sitemap.xml).*)"],
};

export function proxy(req: NextRequest) {
  const admin = verifyAdminToken(req.cookies.get(ADMIN_COOKIE)?.value);
  const preview = req.nextUrl.searchParams.get("season");
  const pass = () => {
    if (!admin || !isSeason(preview)) return NextResponse.next();
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-season-preview", preview);
    return NextResponse.next({ request: { headers: requestHeaders } });
  };

  const m = getMaintenance();
  if (!m.on || admin) return pass();

  const url = req.nextUrl.clone();
  url.pathname = "/api/maintenance";
  url.search = "";
  const res = NextResponse.rewrite(url, { status: 503 });
  res.headers.set("Retry-After", "3600");
  res.headers.set("X-Robots-Tag", "noindex");
  return res;
}
