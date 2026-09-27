import { NextResponse, type NextRequest } from "next/server";
import { bump, currentSpotify } from "@/lib/spotify-live";
import { clientIp, limited, tooManyResponse } from "@/lib/ratelimit";
import { getNowPlaying, spotifyConnected } from "@/lib/spotify";

export const dynamic = "force-dynamic";

// public: what's playing on spotify right now. Served from the watcher's last look (or the cache); ?fresh=1 makes the
// watcher ask spotify right now, rate limited, so a browser that saw the track end can catch the next one immediately.
export async function GET(req: NextRequest) {
  if (!spotifyConnected()) return NextResponse.json({ connected: false }, { headers: { "cache-control": "no-store" } });
  const fresh = req.nextUrl.searchParams.get("fresh") === "1";
  const ip = clientIp(req.headers);
  if (limited(`now:${ip}`, 120, 60_000) || (fresh && limited(`now-fresh:${ip}`, 20, 60_000))) return tooManyResponse();
  const now = fresh ? ((await bump()) ?? (await getNowPlaying())) : (currentSpotify() ?? (await getNowPlaying()));
  return NextResponse.json({ connected: true, ...(now ?? { playing: false, track: null, progressMs: 0, fetchedAt: new Date().toISOString(), device: null }) }, { headers: { "cache-control": "no-store" } });
}
