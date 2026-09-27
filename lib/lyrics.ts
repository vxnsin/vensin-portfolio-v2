import { cached, DAY } from "./cache";
import type { Track } from "./spotify";

// Time-synced lyrics from LRCLIB (lrclib.net, open and key-less). Fetched server-side and cached for a month,
// so the browser never talks to a third party for this.

export type LyricLine = { t: number; text: string };
export type Lyrics = { synced: LyricLine[] | null; plain: string | null; instrumental: boolean; source: "lrclib" };

const API = "https://lrclib.net/api";
const UA = "vensin.dev (https://vensin.dev; personal site now-playing widget)";
const TTL = 30 * DAY;
const EMPTY: Lyrics = { synced: null, plain: null, instrumental: false, source: "lrclib" };

type Hit = { id: number; instrumental?: boolean; plainLyrics?: string | null; syncedLyrics?: string | null };

/** "[mm:ss.xx] text" lines (several stamps per line allowed) → sorted {t, text}; empty lines are kept as pauses */
export function parseLrc(lrc: string): LyricLine[] {
  const out: LyricLine[] = [];
  for (const raw of lrc.split(/\r?\n/)) {
    const stamps = [...raw.matchAll(/\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g)];
    if (!stamps.length) continue;
    const text = raw.replace(/\[[^\]]*\]/g, "").trim();
    for (const s of stamps) {
      const frac = s[3] ? Number((s[3] + "00").slice(0, 3)) : 0;
      out.push({ t: Number(s[1]) * 60_000 + Number(s[2]) * 1_000 + frac, text });
    }
  }
  return out.sort((a, b) => a.t - b.t);
}

const clean = (s: string) => s.replace(/\s*[-–(]\s*(\d{4} )?(remaster(ed)?|live|radio edit|single version|deluxe|feat\.?|ft\.?)[^)]*\)?/gi, "").trim();

async function lookup(track: Track): Promise<Lyrics> {
  const artist = track.artists[0] ?? "";
  const headers = { "user-agent": UA };
  const q = new URLSearchParams({ track_name: track.name, artist_name: artist, album_name: track.album, duration: String(Math.round(track.durationMs / 1000)) });
  let hit: Hit | null = null;
  try {
    const res = await fetch(`${API}/get?${q}`, { headers });
    if (res.ok) hit = (await res.json()) as Hit;
  } catch {}
  if (!hit) {
    // exact match failed (remaster suffixes, album mismatch): search and take the first synced result
    try {
      const s = new URLSearchParams({ track_name: clean(track.name), artist_name: artist });
      const res = await fetch(`${API}/search?${s}`, { headers });
      if (res.ok) {
        const list = (await res.json()) as Hit[];
        hit = list.find((h) => h.syncedLyrics) ?? list[0] ?? null;
      }
    } catch {}
  }
  if (!hit) return EMPTY;
  return { synced: hit.syncedLyrics ? parseLrc(hit.syncedLyrics) : null, plain: hit.plainLyrics ?? null, instrumental: Boolean(hit.instrumental), source: "lrclib" };
}

export const getLyrics = (track: Track): Promise<Lyrics | null> => cached(`lyrics:${track.id}`, TTL, () => lookup(track));
