import { site } from "@/data/site";
import { cached } from "./cache";
import { CACHE_KEYS, TTL } from "./jobs";

// Raw fetchers (`fetch*`) talk to GitHub. Pages use the `get*` wrappers, which read from the
// sqlite cache that the scheduler keeps warm.

const H = { accept: "application/vnd.github+json", "user-agent": "vensin.dev" };
const BOT = /\[bot\]$|^github-actions$|^dependabot|^renovate/i;

/* ---------- profile numbers ---------- */

export type GithubStats = { repos: number; followers: number; url: string; createdAt: string };

export async function fetchGithubStats(): Promise<GithubStats | null> {
  const res = await fetch(`https://api.github.com/users/${site.githubUser}`, { headers: H, cache: "no-store" });
  if (!res.ok) return null;
  const j = await res.json();
  return { repos: j.public_repos ?? 0, followers: j.followers ?? 0, url: j.html_url, createdAt: j.created_at };
}
export const getGithubStats = () => cached(CACHE_KEYS.githubStats, TTL.githubStats, fetchGithubStats);

/* ---------- latest own commit ---------- */

export type LatestActivity = {
  repo: string;
  url: string;
  description: string | null;
  language: string | null;
  pushedAt: string;
  commit: { message: string; url: string; date: string } | null;
};

type Commit = {
  html_url: string;
  author?: { login?: string } | null;
  committer?: { login?: string } | null;
  commit: { message: string; author?: { name?: string; date?: string }; committer?: { name?: string; date?: string } };
};

const isBot = (c: Commit) => [c.author?.login, c.committer?.login, c.commit.author?.name, c.commit.committer?.name].some((n) => n && BOT.test(n));

async function latestHumanCommit(fullName: string) {
  const res = await fetch(`https://api.github.com/repos/${fullName}/commits?per_page=15`, { headers: H, cache: "no-store" });
  if (!res.ok) return null;
  const commits = (await res.json()) as Commit[];
  // my own commit first, otherwise any human one (shared repos)
  const c = commits.find((x) => x.author?.login === site.githubUser) ?? commits.find((x) => !isBot(x));
  if (!c) return null;
  return { message: c.commit.message.split("\n")[0], url: c.html_url, date: c.commit.committer?.date ?? c.commit.author?.date ?? new Date().toISOString() };
}

/** Most recent repo with a commit by me (bots like github-actions are skipped). */
export async function fetchLatestGithubActivity(): Promise<LatestActivity | null> {
  const candidates: string[] = [];

  // own push events first (actor is me, so bot pushes never show up here)
  const ev = await fetch(`https://api.github.com/users/${site.githubUser}/events/public?per_page=60`, { headers: H, cache: "no-store" });
  if (ev.ok) {
    for (const e of (await ev.json()) as Array<{ type: string; actor: { login: string }; repo: { name: string } }>) {
      if (e.type === "PushEvent" && e.actor.login === site.githubUser && !candidates.includes(e.repo.name)) candidates.push(e.repo.name);
      if (candidates.length >= 4) break;
    }
  }
  if (candidates.length === 0) {
    const rp = await fetch(`https://api.github.com/users/${site.githubUser}/repos?sort=pushed&direction=desc&per_page=5&type=owner`, { headers: H, cache: "no-store" });
    if (rp.ok) for (const r of (await rp.json()) as Array<{ full_name: string }>) candidates.push(r.full_name);
  }

  for (const fullName of candidates) {
    const commit = await latestHumanCommit(fullName);
    if (!commit) continue;
    const rr = await fetch(`https://api.github.com/repos/${fullName}`, { headers: H, cache: "no-store" });
    if (!rr.ok) continue;
    const repo = (await rr.json()) as { html_url: string; description: string | null; language: string | null };
    return { repo: fullName, url: repo.html_url, description: repo.description, language: repo.language, pushedAt: commit.date, commit };
  }
  return null;
}
export const getLatestGithubActivity = () => cached(CACHE_KEYS.githubActivity, TTL.githubActivity, fetchLatestGithubActivity);

/* ---------- contribution calendar ---------- */

export type ContributionDay = { date: string; level: number; count: number };
export type Contributions = { days: ContributionDay[]; total: number; streak: number; best: ContributionDay | null };
export type ContributionYears = { years: number[]; byYear: Record<number, Contributions> };

async function fetchContributions(year: number): Promise<Contributions | null> {
  const res = await fetch(`https://github.com/users/${site.githubUser}/contributions?from=${year}-01-01&to=${year}-12-31`, {
    headers: { accept: "text/html", "user-agent": "vensin.dev" },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const html = await res.text();

  const counts = new Map<string, number>();
  for (const m of html.matchAll(/<tool-tip[^>]*\sfor="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)) {
    const n = m[2].trim().match(/^(\d+|No) contribution/i);
    if (n) counts.set(m[1], n[1].toLowerCase() === "no" ? 0 : Number(n[1]));
  }
  const days: ContributionDay[] = [];
  for (const m of html.matchAll(/<td\b([^>]*)>/g)) {
    const attrs = m[1];
    const date = attrs.match(/data-date="(\d{4}-\d{2}-\d{2})"/)?.[1];
    if (!date) continue;
    const level = Number(attrs.match(/data-level="(\d)"/)?.[1] ?? 0);
    const id = attrs.match(/\sid="([^"]+)"/)?.[1];
    days.push({ date, level, count: id ? (counts.get(id) ?? 0) : 0 });
  }
  days.sort((a, b) => a.date.localeCompare(b.date));
  const today = new Date().toISOString().slice(0, 10);
  while (days.length && days[days.length - 1].date > today) days.pop();
  if (days.length === 0) return null;

  const total = days.reduce((s, d) => s + d.count, 0);
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) streak++;
    else if (i === days.length - 1) continue; // today may still be empty
    else break;
  }
  const best = days.reduce<ContributionDay | null>((b, d) => (!b || d.count > b.count ? d : b), null);
  return { days, total, streak, best: best && best.count > 0 ? best : null };
}

/** One calendar per year since the account was created (current year first). */
export async function fetchContributionYears(): Promise<ContributionYears | null> {
  const stats = await getGithubStats();
  const start = stats ? new Date(stats.createdAt).getFullYear() : new Date().getFullYear();
  const now = new Date().getFullYear();
  const years: number[] = [];
  const byYear: Record<number, Contributions> = {};
  for (let y = now; y >= start; y--) {
    const c = await fetchContributions(y);
    if (c) {
      years.push(y);
      byYear[y] = c;
    }
  }
  return years.length ? { years, byYear } : null;
}
export const getContributionYears = () => cached(CACHE_KEYS.githubContributions, TTL.githubContributions, fetchContributionYears);

export { relativeTime } from "./time";
