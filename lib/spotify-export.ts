import { getDb } from "./db";

// Imports Spotify's "Download your data" JSON files into the listening log.
//  - account data:            StreamingHistory_music_*.json   { endTime, artistName, trackName, msPlayed }
//  - extended streaming history: Streaming_History_Audio_*.json { ts, master_metadata_track_name, ..., spotify_track_uri, ms_played }
// A play counts once it ran for 30 seconds (that is also spotify's own rule for a "stream").

type Account = { endTime: string; artistName: string; trackName: string; msPlayed: number };
type Extended = {
  ts: string;
  ms_played: number;
  master_metadata_track_name: string | null;
  master_metadata_album_artist_name: string | null;
  master_metadata_album_album_name: string | null;
  spotify_track_uri: string | null;
};

const MIN_MS = 30_000;

type Row = { trackId: string | null; song: string; artist: string; album: string | null; at: string; minutes: number; key: string };

function parse(json: unknown): Row[] {
  if (!Array.isArray(json)) return [];
  const rows: Row[] = [];
  for (const e of json as Array<Partial<Account> & Partial<Extended>>) {
    if (typeof e.msPlayed === "number" && e.trackName && e.endTime) {
      if (e.msPlayed < MIN_MS) continue;
      // account data: "2026-01-01 12:34" in the account's local time
      const at = new Date(e.endTime.replace(" ", "T") + ":00").toISOString();
      rows.push({ trackId: null, song: e.trackName, artist: e.artistName ?? "", album: null, at, minutes: e.msPlayed / 60000, key: `export|${at}|${e.trackName}|${e.artistName}` });
    } else if (typeof e.ms_played === "number" && e.master_metadata_track_name && e.ts) {
      if (e.ms_played < MIN_MS) continue;
      const trackId = e.spotify_track_uri?.startsWith("spotify:track:") ? e.spotify_track_uri.slice("spotify:track:".length) : null;
      const at = new Date(e.ts).toISOString();
      rows.push({ trackId, song: e.master_metadata_track_name, artist: e.master_metadata_album_artist_name ?? "", album: e.master_metadata_album_album_name ?? null, at, minutes: e.ms_played / 60000, key: `export|${at}|${trackId ?? e.master_metadata_track_name}` });
    }
  }
  return rows;
}

export type ImportResult = { files: number; entries: number; imported: number; skippedOverlap: number; from: string | null; to: string | null };

/** Parses the given JSON texts and inserts every play; entries that overlap with the live api import are skipped. */
export function importExport(texts: string[]): ImportResult {
  const db = getDb();
  const rows = texts.flatMap((t) => {
    try {
      return parse(JSON.parse(t));
    } catch {
      return [];
    }
  });
  // everything from the moment the api started recording is already in the log
  const apiStart = (db.prepare("select min(played_at) m from listens where source = 'spotify'").get() as { m: string | null }).m;
  const ins = db.prepare("insert or ignore into listens (track_id, song, artist, album, art, at, minutes, played_at, source) values (?, ?, ?, ?, null, ?, ?, ?, 'export')");
  let imported = 0;
  let skippedOverlap = 0;
  let from: string | null = null;
  let to: string | null = null;
  db.transaction(() => {
    for (const r of rows) {
      if (apiStart && r.at >= apiStart) {
        skippedOverlap++;
        continue;
      }
      const res = ins.run(r.trackId, r.song, r.artist, r.album, r.at, r.minutes, r.key);
      if (res.changes) {
        imported++;
        if (!from || r.at < from) from = r.at;
        if (!to || r.at > to) to = r.at;
      }
    }
  })();
  return { files: texts.length, entries: rows.length, imported, skippedOverlap, from, to };
}

export function exportStats() {
  const db = getDb();
  return db.prepare("select count(*) c, round(sum(minutes)) m, min(at) f, max(at) t from listens where source = 'export'").get() as { c: number; m: number | null; f: string | null; t: string | null };
}
