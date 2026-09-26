import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { isAdmin } from "@/lib/auth";
import { spotifyAuthUrl, spotifyConfigured, spotifyRedirectBase } from "@/lib/spotify";

export const dynamic = "force-dynamic";

// starts the one-time spotify login (admin only)
export async function GET(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!spotifyConfigured()) return NextResponse.json({ error: "set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET first" }, { status: 503 });
  // the callback lands on the configured host; cookies are per host, so the login has to start there too
  // nextUrl.origin can be the internal hostname in dev, so compare the real host header
  const base = spotifyRedirectBase();
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  if (host !== new URL(base).host) return NextResponse.redirect(`${base}/admin/spotify?hint=host`);
  const state = randomBytes(12).toString("hex");
  const res = NextResponse.redirect(spotifyAuthUrl(state));
  res.cookies.set("spotify_state", state, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
  return res;
}
