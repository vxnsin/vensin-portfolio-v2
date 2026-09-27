import { NextResponse, type NextRequest } from "next/server";
import { checkPassword, issueAdminCookie } from "@/lib/auth";
import { clientIp, limited } from "@/lib/ratelimit";

// The maintenance page has a small "owner?" form. A correct password sets the admin session cookie and sends you to the real site,
// without ever showing the admin panel; a wrong one bounces back with a short-lived flag the page turns into an error line.

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  const back = new URL("/", req.nextUrl.origin);
  const bounce = (flag: "wrong" | "slow") => {
    const res = NextResponse.redirect(back, 303);
    res.cookies.set("vd_unlock", flag, { path: "/", maxAge: 15, sameSite: "lax", httpOnly: true });
    return res;
  };

  if (limited(`unlock:${ip}`, 5, 10 * 60_000)) return bounce("slow");
  const form = await req.formData().catch(() => null);
  const password = String(form?.get("password") ?? "");
  if (!password || !checkPassword(password)) {
    await new Promise((r) => setTimeout(r, 1000));
    return bounce("wrong");
  }

  const res = NextResponse.redirect(back, 303);
  const c = issueAdminCookie();
  res.cookies.set(c.name, c.value, c.options);
  res.cookies.delete("vd_unlock");
  return res;
}
