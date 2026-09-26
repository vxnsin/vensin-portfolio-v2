import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { isAdmin } from "@/lib/auth";
import { spotifyAuthUrl, spotifyConfigured } from "@/lib/spotify";

export const dynamic = "force-dynamic";

// starts the one-time spotify login (admin only)
export async function GET(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!spotifyConfigured()) return NextResponse.json({ error: "set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET first" }, { status: 503 });
  const state = randomBytes(12).toString("hex");
  const res = NextResponse.redirect(spotifyAuthUrl(req.nextUrl.origin, state));
  res.cookies.set("spotify_state", state, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
  return res;
}
