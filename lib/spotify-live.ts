import { fetchNowPlaying, spotifyConnected, SPOTIFY_NOW_KEY, SPOTIFY_NOW_TTL, type NowPlaying } from "./spotify";
import { put } from "./cache";
import { getLatest, saveLatest } from "./store";

// "Live" now-playing without a push api: one in-process watcher polls spotify, but smartly. While a track plays it
// asks again right when that track should end (or after 12 s at most), so a change is seen within about a second;
// while nothing plays it checks every 20 s. Every change is pushed to open browsers through /api/spotify/stream.
// Anything that wants a fresh look right now (a discord presence change, a track running out) calls bump().

type Listener = (now: NowPlaying) => void;
type Live = { current: NowPlaying | null; listeners: Set<Listener>; timer: ReturnType<typeof setTimeout> | null; lastPoll: number; inflight: Promise<NowPlaying | null> | null; started: boolean };

declare global {
  var __spotifyLive: Live | undefined;
}

const live: Live = globalThis.__spotifyLive ?? (globalThis.__spotifyLive = { current: null, listeners: new Set(), timer: null, lastPoll: 0, inflight: null, started: false });

const MAX_WAIT_PLAYING = 12_000;
const WAIT_IDLE = 20_000;
const WAIT_ERROR = 30_000;
const MIN_GAP = 2_500; // bump() never hits spotify more often than this

const signature = (n: NowPlaying | null) => (n?.playing && n.track ? `${n.track.id}|${n.device ?? ""}` : "idle");

export function subscribeSpotify(fn: Listener): () => void {
  live.listeners.add(fn);
  return () => {
    live.listeners.delete(fn);
  };
}

export const currentSpotify = () => live.current;

/** polls now (rate limited) and returns the result; used by the api route with ?fresh=1 */
export async function bump(): Promise<NowPlaying | null> {
  if (live.inflight) return live.inflight;
  if (Date.now() - live.lastPoll < MIN_GAP) return live.current;
  return poll();
}

async function poll(): Promise<NowPlaying | null> {
  if (live.timer) clearTimeout(live.timer);
  live.timer = null;
  if (!spotifyConnected()) {
    schedule(WAIT_IDLE);
    return null;
  }
  live.inflight = (async () => {
    live.lastPoll = Date.now();
    let now: NowPlaying | null = null;
    try {
      now = await fetchNowPlaying();
    } catch {
      schedule(WAIT_ERROR);
      return live.current;
    }
    if (!now) {
      schedule(WAIT_ERROR);
      return live.current;
    }
    put(SPOTIFY_NOW_KEY, now, SPOTIFY_NOW_TTL);
    const before = live.current;
    live.current = now;

    // a new track, a pause, a different device, or a seek of more than 4 s: tell the browsers
    const expected = before?.playing && before.track ? before.progressMs + (Date.now() - new Date(before.fetchedAt).getTime()) : -1;
    const seeked = now.playing && before?.playing && Math.abs(now.progressMs - expected) > 4_000;
    if (signature(now) !== signature(before) || seeked) {
      for (const fn of live.listeners) {
        try {
          fn(now);
        } catch {}
      }
      if (now.playing && now.track) {
        const at = new Date().toISOString();
        const latest = await getLatest();
        await saveLatest({ ...latest, items: { ...(latest.items ?? {}), listening: { value: `${now.track.name} – ${now.track.artists.join(", ")}`, href: now.track.url, at } } });
      }
    }

    if (now.playing && now.track) {
      const remaining = now.track.durationMs - now.progressMs;
      schedule(Math.max(1_000, Math.min(MAX_WAIT_PLAYING, remaining + 700)));
    } else {
      schedule(WAIT_IDLE);
    }
    return now;
  })();
  try {
    return await live.inflight;
  } finally {
    live.inflight = null;
  }
}

function schedule(ms: number) {
  if (live.timer) clearTimeout(live.timer);
  live.timer = setTimeout(() => void poll(), ms);
  live.timer.unref?.();
}

/** started once from instrumentation.ts alongside the scheduler */
export function startSpotifyLive() {
  if (live.started) return;
  live.started = true;
  schedule(3_000);
}
