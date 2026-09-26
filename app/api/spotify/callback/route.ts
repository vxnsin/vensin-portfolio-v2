import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";
import { exchangeCode, fetchSpotifyData, SPOTIFY_CACHE_KEY, SPOTIFY_TTL, spotifyConnected, spotifyRedirectBase } from "@/lib/spotify";
import { refresh } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const err = req.nextUrl.searchParams.get("error");
  const expected = req.cookies.get("spotify_state")?.value;
  const back = (q: string) => NextResponse.redirect(`${spotifyRedirectBase()}/admin/spotify?${q}`);

  if (err) return back(`error=${encodeURIComponent(err)}`);
  // a second hit of the callback (browser re-request) has no state cookie anymore: if we are already connected, that is fine
  if (!code || !state || state !== expected) return back(spotifyConnected() ? "ok=1" : "error=state");
  try {
    await exchangeCode(code);
    await refresh(SPOTIFY_CACHE_KEY, SPOTIFY_TTL, fetchSpotifyData);
    const res = back("ok=1");
    res.cookies.delete("spotify_state");
    return res;
  } catch (e) {
    return back(`error=${encodeURIComponent(e instanceof Error ? e.message : "token")}`);
  }
}
