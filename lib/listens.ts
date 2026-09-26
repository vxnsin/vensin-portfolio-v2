import { getDb } from "./db";

// Listening log: the scheduler asks Lanyard once a minute; every minute Spotify is playing becomes one row.
// That gives hours listened, top tracks/artists and a listening clock without any Spotify login.

type SpotifyPresence = { song: string; artist: string; album?: string; album_art_url?: string | null; track_id?: string | null };

export function recordListen(s: SpotifyPresence, at: string) {
  const db = getDb();
  // guard against double counting when the job runs more than once a minute
  const last = db.prepare("select at from listens order by id desc limit 1").get() as { at: string } | undefined;
  if (last && new Date(at).getTime() - new Date(last.at).getTime() < 45_000) return;
  db.prepare("insert into listens (track_id, song, artist, album, art, at) values (?, ?, ?, ?, ?, ?)").run(s.track_id ?? null, s.song, s.artist, s.album ?? null, s.album_art_url ?? null, at);
}

export type LogTrack = { trackId: string | null; song: string; artist: string; art: string | null; minutes: number };
export type LogArtist = { artist: string; minutes: number; art: string | null };
export type ListenStats = {
  minutesThisYear: number;
  minutesTotal: number;
  tracksThisYear: number;
  since: string | null;
  topTracks: LogTrack[];
  topArtists: LogArtist[];
  byHour: number[]; // 24 buckets, minutes
  byWeekday: number[]; // 7 buckets (0 = sunday), minutes
  lastPlayed: (LogTrack & { at: string }) | null;
};

export function listenStats(year = new Date().getFullYear()): ListenStats {
  const db = getDb();
  const y0 = `${year}-01-01`;
  const one = <T>(sql: string, ...args: unknown[]) => db.prepare(sql).get(...args) as T;
  const all = <T>(sql: string, ...args: unknown[]) => db.prepare(sql).all(...args) as T[];

  const minutesThisYear = one<{ c: number }>("select count(*) c from listens where at >= ?", y0).c;
  const minutesTotal = one<{ c: number }>("select count(*) c from listens").c;
  const tracksThisYear = one<{ c: number }>("select count(distinct coalesce(track_id, song || '|' || artist)) c from listens where at >= ?", y0).c;
  const since = one<{ m: string | null }>("select min(at) m from listens").m;

  const topTracks = all<{ track_id: string | null; song: string; artist: string; art: string | null; minutes: number }>(
    "select track_id, song, artist, max(art) art, count(*) minutes from listens where at >= ? group by coalesce(track_id, song || '|' || artist) order by minutes desc limit 10",
    y0,
  ).map((r) => ({ trackId: r.track_id, song: r.song, artist: r.artist, art: r.art, minutes: r.minutes }));

  const topArtists = all<{ artist: string; minutes: number; art: string | null }>(
    "select artist, count(*) minutes, max(art) art from listens where at >= ? group by artist order by minutes desc limit 10",
    y0,
  );

  const byHour = Array(24).fill(0) as number[];
  for (const r of all<{ h: string; c: number }>("select strftime('%H', at, 'localtime') h, count(*) c from listens where at >= ? group by h", y0)) byHour[Number(r.h)] = r.c;
  const byWeekday = Array(7).fill(0) as number[];
  for (const r of all<{ d: string; c: number }>("select strftime('%w', at, 'localtime') d, count(*) c from listens where at >= ? group by d", y0)) byWeekday[Number(r.d)] = r.c;

  const last = one<{ track_id: string | null; song: string; artist: string; art: string | null; at: string } | undefined>("select track_id, song, artist, art, at from listens order by id desc limit 1");
  const lastPlayed = last ? { trackId: last.track_id, song: last.song, artist: last.artist, art: last.art, minutes: 0, at: last.at } : null;

  return { minutesThisYear, minutesTotal, tracksThisYear, since, topTracks, topArtists, byHour, byWeekday, lastPlayed };
}
