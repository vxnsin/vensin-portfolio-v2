import { DAY, HOUR, MIN, refresh } from "./cache";
import { fetchContributionYears, fetchGithubStats, fetchLatestGithubActivity } from "./github";
import { fetchRecentlyWatched } from "./anime";
import { fetchWeather } from "./weather";
import { refreshLatest } from "./latest";

/**
 * Everything the site pulls from the outside world, and how often.
 * `every` runs on an interval, `daily` runs once a day at that local time (HH:MM).
 * Each job writes into the sqlite cache; pages only ever read from there.
 */
export type Job = { id: string; label: string; every?: number; daily?: string; run: () => Promise<unknown> };

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
  { id: "weather", label: "weather", every: 10 * MIN, run: () => refresh(CACHE_KEYS.weather, TTL.weather, fetchWeather) },
  { id: "github-activity", label: "github: latest commit", every: HOUR, run: () => refresh(CACHE_KEYS.githubActivity, TTL.githubActivity, fetchLatestGithubActivity) },
  { id: "anime-recent", label: "anime: recently watched", every: HOUR, run: () => refresh(CACHE_KEYS.animeRecent, TTL.animeRecent, fetchRecentlyWatched) },
  { id: "github-stats", label: "github: followers & repos", daily: "00:00", run: () => refresh(CACHE_KEYS.githubStats, TTL.githubStats, fetchGithubStats) },
  { id: "github-contributions", label: "github: contribution graph", daily: "00:05", run: () => refresh(CACHE_KEYS.githubContributions, TTL.githubContributions, fetchContributionYears) },
];
