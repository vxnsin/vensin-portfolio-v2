import { parse } from "node-html-parser";
import { getDb } from "./db";
import { cached, DAY } from "./cache";

// A watch log: every episode the "recently watched" scrape sees is written down once (title + season + episode),
// with the time it was first seen. That gives "this week", a year of weekly bars, and finished seasons: a season
// counts as finished when the last logged episode is the season's last episode (episode count read from the
// series page and cached for a week).

export type WatchedEpisode = { title: string; season: number | null; episode: number | null; sourceUrl: string; url: string; cover: string | null };
export type Finished = { title: string; season: number | null; episodes: number; at: string; url: string; cover: string | null };
export type WatchLogStats = {
  thisWeek: number;
  thisMonth: number;
  thisYear: number;
  total: number;
  /** rows pulled from the profile history without a date (everything before the log started) */
  imported: number;
  /** episodes per iso week for the last 52 weeks, oldest first */
  weekly: number[];
  finished: Finished[];
  since: string | null;
};

const seriesBase = (url: string) => url.replace(/\/staffel-\d+.*$/, "").replace(/\/filme.*$/, "");

/** number of episodes in a season, from the season page (…/staffel-N); null when the page cannot be read */
export function seasonEpisodeCount(sourceUrl: string, season: number): Promise<number | null> {
  const base = seriesBase(sourceUrl);
  return cached(`aniworld:eps:${base}:${season}`, 7 * DAY, async () => {
    try {
      const res = await fetch(`${base}/staffel-${season}`, { headers: { "user-agent": "Mozilla/5.0 (compatible; vensin.dev)" }, cache: "no-store" });
      if (!res.ok) return null;
      const root = parse(await res.text());
      const nums = new Set<number>();
      for (const a of root.querySelectorAll("a")) {
        const m = a.getAttribute("href")?.match(new RegExp(`/staffel-${season}/episode-(\\d+)`));
        if (m) nums.add(Number(m[1]));
      }
      return nums.size ? Math.max(...nums) : null;
    } catch {
      return null;
    }
  });
}

/** writes new episodes into the log and checks whether any of them finished a season */
export async function recordWatched(items: WatchedEpisode[]): Promise<number> {
  const db = getDb();
  const ins = db.prepare("insert or ignore into anime_log (title, season, episode, url, cover, seen_at, finished) values (?, ?, ?, ?, ?, ?, 0)");
  let added = 0;
  for (const it of items) {
    if (!it.title) continue;
    const r = ins.run(it.title, it.season, it.episode, it.url, it.cover, new Date().toISOString());
    added += r.changes;
  }
  // finished check for the newest episode per (title, season) that has one
  const latest = db.prepare("select title, season, max(episode) episode from anime_log where season is not null and episode is not null group by title, season").all() as Array<{ title: string; season: number; episode: number }>;
  const upd = db.prepare("update anime_log set finished = ? where title = ? and season = ? and episode = ?");
  for (const row of latest) {
    const src = items.find((i) => i.title === row.title)?.sourceUrl;
    if (!src) continue;
    const count = await seasonEpisodeCount(src, row.season);
    if (count) upd.run(row.episode >= count ? 1 : 0, row.title, row.season, row.episode);
  }
  return added;
}

const isoWeekStart = (d: Date) => {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = x.getUTCDay() || 7;
  x.setUTCDate(x.getUTCDate() - day + 1);
  return x;
};

export function watchLogStats(): WatchLogStats {
  const db = getDb();
  const rows = db.prepare("select title, season, episode, url, cover, seen_at, finished from anime_log order by seen_at asc").all() as Array<{ title: string; season: number | null; episode: number | null; url: string; cover: string | null; seen_at: string; finished: number }>;
  const now = new Date();
  const weekStart = isoWeekStart(now).getTime();
  const monthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const yearStart = Date.UTC(now.getUTCFullYear(), 0, 1);
  const weekly = new Array<number>(52).fill(0);
  let thisWeek = 0, thisMonth = 0, thisYear = 0, imported = 0;
  for (const r of rows) {
    if (r.seen_at === IMPORT_DATE) {
      imported++;
      continue;
    }
    const t = new Date(r.seen_at).getTime();
    if (t >= weekStart) thisWeek++;
    if (t >= monthStart) thisMonth++;
    if (t >= yearStart) thisYear++;
    const weeksAgo = Math.floor((weekStart - isoWeekStart(new Date(r.seen_at)).getTime()) / (7 * 86_400_000));
    if (weeksAgo >= 0 && weeksAgo < 52) weekly[51 - weeksAgo]++;
  }
  const finished: Finished[] = rows
    .filter((r) => r.finished === 1)
    .map((r) => ({ title: r.title, season: r.season, episodes: r.episode ?? 0, at: r.seen_at, url: r.url, cover: r.cover }))
    .reverse();
  const dated = rows.find((r) => r.seen_at !== IMPORT_DATE);
  return { thisWeek, thisMonth, thisYear, total: rows.length, imported, weekly, finished, since: dated?.seen_at ?? null };
}

/** placeholder date for history rows: they count in totals and finished checks, but not in the weekly bars */
export const IMPORT_DATE = "2024-01-01T00:00:00.000Z";

/**
 * pulls the whole watched history from the profile (newest first, no dates) into the log. rows already there are left alone,
 * new ones get the placeholder date and the imported flag. then every (title, season) is checked for "finished".
 */
export async function importWatchedHistory(items: WatchedEpisode[]): Promise<{ added: number; finished: number }> {
  const db = getDb();
  const ins = db.prepare("insert or ignore into anime_log (title, season, episode, url, cover, seen_at, finished, imported) values (?, ?, ?, ?, ?, ?, 0, 1)");
  let added = 0;
  db.transaction(() => {
    for (const it of items) {
      if (!it.title) continue;
      added += ins.run(it.title, it.season, it.episode, it.url, it.cover, IMPORT_DATE).changes;
    }
  })();
  const latest = db.prepare("select title, season, max(episode) episode from anime_log where season is not null and episode is not null group by title, season").all() as Array<{ title: string; season: number; episode: number }>;
  const upd = db.prepare("update anime_log set finished = ? where title = ? and season = ? and episode = ?");
  let finished = 0;
  for (const row of latest) {
    const src = items.find((i) => i.title === row.title)?.sourceUrl;
    if (!src) continue;
    const count = await seasonEpisodeCount(src, row.season);
    if (!count) continue;
    const done = row.episode >= count ? 1 : 0;
    upd.run(done, row.title, row.season, row.episode);
    finished += done;
  }
  return { added, finished };
}

/** finished seasons as "title|season", to badge the recently watched shelf (a finished s1 says nothing about a running s2) */
export function finishedSeasons(): Set<string> {
  const rows = getDb().prepare("select distinct title, season from anime_log where finished = 1 and season is not null").all() as Array<{ title: string; season: number }>;
  return new Set(rows.map((r) => `${r.title}|${r.season}`));
}
