import { NextResponse } from "next/server";
import { site } from "@/data/site";
import { LanyardDataSchema } from "@/components/discord/schemas";
import { isGame, watchingInfo } from "@/components/discord/detect";
import { getLatestFresh, saveLatest, type Latest } from "@/lib/store";

// Visitors' browsers ping this route while they watch the Discord widget.
// The server then asks Lanyard itself (source of truth) and remembers the last
// game / video / song, so the "latest" box has something to show when nothing is live.

const MIN_INTERVAL_MS = 60_000;
let lastRun = 0;

export async function POST() {
  const now = Date.now();
  if (now - lastRun < MIN_INTERVAL_MS) return NextResponse.json({ ok: true, skipped: "throttled" });
  lastRun = now;

  const current = await getLatestFresh();
  if (current.checkedAt && now - new Date(current.checkedAt).getTime() < MIN_INTERVAL_MS) {
    return NextResponse.json({ ok: true, skipped: "fresh" });
  }

  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${site.discordUserId}`, { cache: "no-store" });
    if (!res.ok) return NextResponse.json({ ok: false }, { status: 502 });
    const parsed = LanyardDataSchema.safeParse((await res.json())?.data);
    if (!parsed.success) return NextResponse.json({ ok: false }, { status: 502 });

    const d = parsed.data;
    const at = new Date(now).toISOString();
    const next: Latest = { ...current, checkedAt: at };

    const game = d.activities.find(isGame);
    if (game) next.playing = { name: game.name, at };

    const watching = d.activities.find((a) => a.type === 3);
    if (watching) {
      const info = watchingInfo(watching);
      next.watching = { title: info.title, service: info.service, at };
    }

    if (d.spotify) next.listening = { song: d.spotify.song, artist: d.spotify.artist, trackId: d.spotify.track_id ?? null, at };

    await saveLatest(next);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
