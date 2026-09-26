import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/auth";
import { getMaintenance } from "@/lib/maintenance";

// Maintenance mode, toggled in /admin/maintenance. Runs in the Node runtime so it can read sqlite.
// Admins (valid session cookie) always see the real site; everyone else gets the maintenance page with a 503.

export const config = {
  matcher: ["/((?!admin|api|maintenance|_next/static|_next/image|favicon.ico|icon|opengraph-image|uploads|robots.txt|sitemap.xml).*)"],
};

export function proxy(req: NextRequest) {
  const m = getMaintenance();
  if (!m.on) return NextResponse.next();
  if (verifyAdminToken(req.cookies.get(ADMIN_COOKIE)?.value)) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/api/maintenance";
  url.search = "";
  const res = NextResponse.rewrite(url, { status: 503 });
  res.headers.set("Retry-After", "3600");
  res.headers.set("X-Robots-Tag", "noindex");
  return res;
}
