import { NextResponse, type NextRequest } from "next/server";
import { bump, currentSpotify } from "@/lib/spotify-live";
import { getNowPlaying, spotifyConnected } from "@/lib/spotify";

export const dynamic = "force-dynamic";

// public: what's playing on spotify right now. Served from the watcher's last look (or the cache); ?fresh=1 makes the
// watcher ask spotify right now, rate limited, so a browser that saw the track end can catch the next one immediately.
export async function GET(req: NextRequest) {
  if (!spotifyConnected()) return NextResponse.json({ connected: false }, { headers: { "cache-control": "no-store" } });
  const fresh = req.nextUrl.searchParams.get("fresh") === "1";
  const now = fresh ? ((await bump()) ?? (await getNowPlaying())) : (currentSpotify() ?? (await getNowPlaying()));
  return NextResponse.json({ connected: true, ...(now ?? { playing: false, track: null, progressMs: 0, fetchedAt: new Date().toISOString(), device: null }) }, { headers: { "cache-control": "no-store" } });
}
