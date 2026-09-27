import { NextResponse, type NextRequest } from "next/server";
import { getNowPlaying, spotifyConnected } from "@/lib/spotify";
import { currentSpotify } from "@/lib/spotify-live";
import { getLyrics } from "@/lib/lyrics";
import { clientIp, limited, tooManyResponse } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

// lyrics for the track that is playing right now (only that one: the id has to match what spotify reports)
export async function GET(req: NextRequest) {
  if (limited(`lyrics:${clientIp(req.headers)}`, 30, 60_000)) return tooManyResponse();
  if (!spotifyConnected()) return NextResponse.json({ error: "not connected" }, { status: 404 });
  const id = req.nextUrl.searchParams.get("id");
  const now = currentSpotify() ?? (await getNowPlaying());
  const track = now?.track;
  if (!id || !track || track.id !== id) return NextResponse.json({ error: "not playing" }, { status: 404 });
  const lyrics = await getLyrics(track);
  return NextResponse.json({ id, ...(lyrics ?? { synced: null, plain: null, instrumental: false }) }, { headers: { "cache-control": "private, max-age=600" } });
}
