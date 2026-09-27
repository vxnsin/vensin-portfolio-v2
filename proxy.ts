import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/auth";
import { getMaintenance } from "@/lib/maintenance";

import { isSeason } from "@/lib/season-data";
import { recordVisit } from "@/lib/visits";
import { clientIp, limited } from "@/lib/ratelimit";

// Maintenance mode, toggled in /admin/maintenance. Runs in the Node runtime so it can read sqlite.
// Admins (valid session cookie) always see the real site; everyone else gets the maintenance page with a 503.
// Admins can also preview any season with ?season=<name>; the proxy turns that into a request header the layout reads.

export const config = {
  matcher: ["/((?!admin|api|maintenance|_next/static|_next/image|favicon.ico|icon|opengraph-image|uploads|robots.txt|sitemap.xml).*)"],
};

const MAX_PUBLIC_BODY = 2 * 1024 * 1024; // the only big uploads happen in /admin, which is not routed through here

export function proxy(req: NextRequest) {
  const admin = verifyAdminToken(req.cookies.get(ADMIN_COOKIE)?.value);
  const ip = clientIp(req.headers);
  if (!admin) {
    // page requests: 120 per 30 seconds per ip is plenty for a human and a wall for a flood
    if (limited(`page:${ip}`, 120, 30_000)) {
      return new NextResponse("slow down a little _(:з)∠)_", { status: 429, headers: { "retry-after": "30", "content-type": "text/plain; charset=utf-8" } });
    }
    // forms on the public site are small; anything bigger is not a form
    if (req.method === "POST" && Number(req.headers.get("content-length") ?? 0) > MAX_PUBLIC_BODY) {
      return new NextResponse("that's too big for this form", { status: 413, headers: { "content-type": "text/plain; charset=utf-8" } });
    }
  }
  const preview = req.nextUrl.searchParams.get("season");
  // one tick per person per day, only for real page loads (not prefetches, not the admin)
  if (!admin && req.method === "GET" && req.headers.get("sec-fetch-dest") === "document" && !req.headers.get("next-router-prefetch")) {
    try {
      recordVisit(ip, req.headers.get("user-agent") ?? "");
    } catch {}
  }

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
