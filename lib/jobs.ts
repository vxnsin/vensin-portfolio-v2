import { DAY, HOUR, MIN, refresh } from "./cache";
import { fetchContributionYears, fetchGithubStats, fetchLatestGithubActivity } from "./github";
import { fetchRecentlyWatched } from "./anime";
import { fetchWeather } from "./weather";
import { refreshLatest } from "./latest";
import { fetchNowPlaying, fetchRecentPlays, fetchSpotifyData, spotifyConnected, SPOTIFY_CACHE_KEY, SPOTIFY_NOW_KEY, SPOTIFY_NOW_TTL, SPOTIFY_TTL } from "./spotify";
import { importPlays } from "./listens";
import { getLatest, saveLatest } from "./store";
import { kvGet } from "./db";

// a fresh spotify connection makes every spotify job due right away
const spotifySince = () => { const at = kvGet<string | null>("spotify:connected_at", null); return at ? new Date(at).getTime() : 0; };

/** every finished play with its real length, straight from spotify history (last 50 plays, so 5 minutes is plenty) */
async function importSpotifyHistory() {
  if (!spotifyConnected()) return null;
  const plays = await fetchRecentPlays();
  if (!plays) return null;
  return importPlays(plays.map((p) => ({ trackId: p.track.id, song: p.track.name, artist: p.track.artists.join(", "), album: p.track.album, art: p.track.art, playedAt: p.playedAt, durationMs: p.track.durationMs })));
}

/** currently playing from the spotify api; feeds the listening log and the "latest" box without needing discord */
async function pollSpotifyNow() {
  if (!spotifyConnected()) return null;
  const now = await refresh(SPOTIFY_NOW_KEY, SPOTIFY_NOW_TTL, fetchNowPlaying, { throwOnError: true });
  if (now?.playing && now.track) {
    const at = new Date().toISOString();
    const latest = await getLatest();
    await saveLatest({ ...latest, items: { ...(latest.items ?? {}), listening: { value: `${now.track.name} – ${now.track.artists.join(", ")}`, href: now.track.url, at } } });
  }
  return now;
}

/**
 * Everything the site pulls from the outside world, and how often.
 * `every` runs on an interval, `daily` runs once a day at that local time (HH:MM).
 * Each job writes into the sqlite cache; pages only ever read from there.
 */
export type Job = { id: string; label: string; every?: number; daily?: string; run: () => Promise<unknown>; /** timestamp after which the job is due regardless of its schedule (e.g. a fresh spotify login) */ since?: () => number };

export const CACHE_KEYS = {
  githubStats: "github:stats",
  githubActivity: "github:activity",
  githubContributions: "github:contributions",
  animeRecent: "anime:recent",
  weather: "weather",
} as const;

export const TTL = {
  githubStats: 2 * DAY,
  githubActivity: 3 * HOUR,
  githubContributions: 2 * DAY,
  animeRecent: 3 * HOUR,
  weather: 30 * MIN,
} as const;

export const jobs: Job[] = [
  { id: "discord-latest", label: "discord: latest activity", every: MIN, run: refreshLatest },
  { id: "weather", label: "weather", every: 10 * MIN, run: () => refresh(CACHE_KEYS.weather, TTL.weather, fetchWeather, { throwOnError: true }) },
  { id: "github-activity", label: "github: latest commit", every: HOUR, run: () => refresh(CACHE_KEYS.githubActivity, TTL.githubActivity, fetchLatestGithubActivity, { throwOnError: true }) },
  { id: "anime-recent", label: "anime: recently watched", every: HOUR, run: () => refresh(CACHE_KEYS.animeRecent, TTL.animeRecent, fetchRecentlyWatched, { throwOnError: true }) },
  { id: "spotify-now", label: "spotify: now playing", every: 30_000, run: pollSpotifyNow, since: spotifySince },
  { id: "spotify-history", label: "spotify: import plays into the log", every: 5 * MIN, run: importSpotifyHistory, since: spotifySince },
  { id: "spotify", label: "spotify: top tracks, artists, playlists", every: HOUR, run: () => (spotifyConnected() ? refresh(SPOTIFY_CACHE_KEY, SPOTIFY_TTL, fetchSpotifyData, { throwOnError: true }) : Promise.resolve(null)), since: spotifySince },
  { id: "github-stats", label: "github: followers & repos", daily: "00:00", run: () => refresh(CACHE_KEYS.githubStats, TTL.githubStats, fetchGithubStats, { throwOnError: true }) },
  { id: "github-contributions", label: "github: contribution graph", daily: "00:05", run: () => refresh(CACHE_KEYS.githubContributions, TTL.githubContributions, fetchContributionYears, { throwOnError: true }) },
];
