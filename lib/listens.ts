import { getDb } from "./db";

// Listening log: the scheduler asks Lanyard once a minute; every minute Spotify is playing becomes one row.
// That gives hours listened, top tracks/artists and a listening clock without any Spotify login.

type SpotifyPresence = { song: string; artist: string; album?: string; album_art_url?: string | null; track_id?: string | null };

export function recordListen(s: SpotifyPresence, at: string) {
  const db = getDb();
  // guard against double counting when the job runs more than once a minute
  const last = db.prepare("select at from listens where source = 'poll' order by id desc limit 1").get() as { at: string } | undefined;
  if (last && new Date(at).getTime() - new Date(last.at).getTime() < 45_000) return;
  db.prepare("insert into listens (track_id, song, artist, album, art, at, minutes, source) values (?, ?, ?, ?, ?, ?, 1, 'poll')").run(s.track_id ?? null, s.song, s.artist, s.album ?? null, s.album_art_url ?? null, at);
}

export type Play = { trackId: string; song: string; artist: string; album: string; art: string | null; playedAt: string; durationMs: number };

/** Spotify "recently played": one row per play with its real length. played_at is unique, so re-imports are no-ops. */
export function importPlays(plays: Play[]): number {
  const db = getDb();
  const ins = db.prepare("insert or ignore into listens (track_id, song, artist, album, art, at, minutes, played_at, source) values (?, ?, ?, ?, ?, ?, ?, ?, 'spotify')");
  let n = 0;
  db.transaction(() => {
    for (const p of plays) {
      const r = ins.run(p.trackId, p.song, p.artist, p.album, p.art, p.playedAt, Math.max(0.5, p.durationMs / 60000), p.playedAt);
      n += r.changes;
    }
  })();
  return n;
}

export type RecentPlay = { trackId: string | null; song: string; artist: string; art: string | null; playedAt: string };

/** the last finished plays as spotify reported them, newest first */
export function recentPlays(limit = 10): RecentPlay[] {
  const rows = getDb()
    .prepare("select track_id, song, artist, art, played_at from listens where source = 'spotify' and played_at is not null order by played_at desc limit ?")
    .all(limit) as Array<{ track_id: string | null; song: string; artist: string; art: string | null; played_at: string }>;
  return rows.map((r) => ({ trackId: r.track_id, song: r.song, artist: r.artist, art: r.art, playedAt: r.played_at }));
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

  const minutesThisYear = Math.round(one<{ c: number | null }>("select sum(minutes) c from listens where at >= ?", y0).c ?? 0);
  const minutesTotal = Math.round(one<{ c: number | null }>("select sum(minutes) c from listens").c ?? 0);
  const tracksThisYear = one<{ c: number }>("select count(distinct coalesce(track_id, song || '|' || artist)) c from listens where at >= ?", y0).c;
  const since = one<{ m: string | null }>("select min(at) m from listens").m;

  const topTracks = all<{ track_id: string | null; song: string; artist: string; art: string | null; minutes: number }>(
    "select track_id, song, artist, max(art) art, round(sum(minutes)) minutes from listens where at >= ? group by coalesce(track_id, song || '|' || artist) order by minutes desc limit 10",
    y0,
  ).map((r) => ({ trackId: r.track_id, song: r.song, artist: r.artist, art: r.art, minutes: r.minutes }));

  const topArtists = all<{ artist: string; minutes: number; art: string | null }>(
    "select artist, round(sum(minutes)) minutes, max(art) art from listens where at >= ? group by artist order by minutes desc limit 10",
    y0,
  );

  const byHour = Array(24).fill(0) as number[];
  for (const r of all<{ h: string; c: number }>("select strftime('%H', at, 'localtime') h, round(sum(minutes)) c from listens where at >= ? group by h", y0)) byHour[Number(r.h)] = r.c;
  const byWeekday = Array(7).fill(0) as number[];
  for (const r of all<{ d: string; c: number }>("select strftime('%w', at, 'localtime') d, round(sum(minutes)) c from listens where at >= ? group by d", y0)) byWeekday[Number(r.d)] = r.c;

  const last = one<{ track_id: string | null; song: string; artist: string; art: string | null; at: string } | undefined>("select track_id, song, artist, art, at from listens order by at desc limit 1");
  const lastPlayed = last ? { trackId: last.track_id, song: last.song, artist: last.artist, art: last.art, minutes: 0, at: last.at } : null;

  return { minutesThisYear, minutesTotal, tracksThisYear, since, topTracks, topArtists, byHour, byWeekday, lastPlayed };
}
