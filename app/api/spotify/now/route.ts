import { NextResponse } from "next/server";
import { getNowPlaying, spotifyConnected } from "@/lib/spotify";

export const dynamic = "force-dynamic";

// public: what's playing on spotify right now (served from the 25s cache the scheduler keeps warm)
export async function GET() {
  if (!spotifyConnected()) return NextResponse.json({ connected: false }, { headers: { "cache-control": "no-store" } });
  const now = await getNowPlaying();
  return NextResponse.json({ connected: true, ...(now ?? { playing: false, track: null, progressMs: 0, fetchedAt: new Date().toISOString(), device: null }) }, { headers: { "cache-control": "no-store" } });
}
