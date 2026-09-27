import { NextResponse, type NextRequest } from "next/server";
import { checkPassword, issueAdminCookie } from "@/lib/auth";

// The maintenance page has a small "owner?" form. A correct password sets the admin session cookie and sends you to the real site,
// without ever showing the admin panel; a wrong one bounces back with a short-lived flag the page turns into an error line.

export const dynamic = "force-dynamic";

const attempts = new Map<string, number[]>();
const WINDOW_MS = 10 * 60_000;
const MAX_ATTEMPTS = 5;

function tooMany(ip: string) {
  const now = Date.now();
  const list = (attempts.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (list.length >= MAX_ATTEMPTS) return true;
  list.push(now);
  attempts.set(ip, list);
  return false;
}

export async function POST(req: NextRequest) {
  const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  const back = new URL("/", req.nextUrl.origin);
  const bounce = (flag: "wrong" | "slow") => {
    const res = NextResponse.redirect(back, 303);
    res.cookies.set("vd_unlock", flag, { path: "/", maxAge: 15, sameSite: "lax", httpOnly: true });
    return res;
  };

  if (tooMany(ip)) return bounce("slow");
  const form = await req.formData().catch(() => null);
  const password = String(form?.get("password") ?? "");
  if (!password || !checkPassword(password)) return bounce("wrong");

  const res = NextResponse.redirect(back, 303);
  const c = issueAdminCookie();
  res.cookies.set(c.name, c.value, c.options);
  res.cookies.delete("vd_unlock");
  return res;
}
