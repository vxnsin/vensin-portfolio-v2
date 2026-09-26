import { site } from "@/data/site";

const H = { accept: "application/vnd.github+json", "user-agent": "vensin.dev" };
const BOT = /\[bot\]$|^github-actions$|^dependabot|^renovate/i;

export type GithubStats = { repos: number; followers: number; url: string } | null;

/** Public GitHub profile numbers. Cached for 1h. */
export async function getGithubStats(): Promise<GithubStats> {
  try {
    const res = await fetch(`https://api.github.com/users/${site.githubUser}`, { headers: H, next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const j = await res.json();
    return { repos: j.public_repos ?? 0, followers: j.followers ?? 0, url: j.html_url };
  } catch {
    return null;
  }
}

/* ---------- latest own commit ---------- */

export type LatestActivity = {
  repo: string;
  url: string;
  description: string | null;
  language: string | null;
  pushedAt: string;
  commit: { message: string; url: string; date: string } | null;
} | null;

type Commit = {
  html_url: string;
  author?: { login?: string } | null;
  committer?: { login?: string } | null;
  commit: { message: string; author?: { name?: string; date?: string }; committer?: { name?: string; date?: string } };
};

function isBot(c: Commit) {
  return [c.author?.login, c.committer?.login, c.commit.author?.name, c.commit.committer?.name].some((n) => n && BOT.test(n));
}

async function latestHumanCommit(fullName: string) {
  try {
    const res = await fetch(`https://api.github.com/repos/${fullName}/commits?per_page=15`, { headers: H, next: { revalidate: 600 } });
    if (!res.ok) return null;
    const commits = (await res.json()) as Commit[];
    // my own commit first, otherwise any human one (shared repos)
    const c = commits.find((x) => x.author?.login === site.githubUser) ?? commits.find((x) => !isBot(x));
    if (!c) return null;
    return {
      message: c.commit.message.split("\n")[0],
      url: c.html_url,
      date: c.commit.committer?.date ?? c.commit.author?.date ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

async function repoInfo(fullName: string) {
  try {
    const res = await fetch(`https://api.github.com/repos/${fullName}`, { headers: H, next: { revalidate: 600 } });
    if (!res.ok) return null;
    return (await res.json()) as { name: string; html_url: string; description: string | null; language: string | null; pushed_at: string };
  } catch {
    return null;
  }
}

/** Most recent repo with a commit by me (bots like github-actions are skipped). Cached 10 min. */
export async function getLatestGithubActivity(): Promise<LatestActivity> {
  const candidates: string[] = [];

  // own push events first (actor is me, so bot pushes never show up here)
  try {
    const res = await fetch(`https://api.github.com/users/${site.githubUser}/events/public?per_page=60`, { headers: H, next: { revalidate: 600 } });
    if (res.ok) {
      const events = (await res.json()) as Array<{ type: string; actor: { login: string }; repo: { name: string } }>;
      for (const e of events) {
        if (e.type === "PushEvent" && e.actor.login === site.githubUser && !candidates.includes(e.repo.name)) candidates.push(e.repo.name);
        if (candidates.length >= 4) break;
      }
    }
  } catch {}

  // fallback: recently pushed repos
  if (candidates.length === 0) {
    try {
      const res = await fetch(`https://api.github.com/users/${site.githubUser}/repos?sort=pushed&direction=desc&per_page=5&type=owner`, {
        headers: H,
        next: { revalidate: 600 },
      });
      if (res.ok) for (const r of (await res.json()) as Array<{ full_name: string }>) candidates.push(r.full_name);
    } catch {}
  }

  for (const fullName of candidates) {
    const commit = await latestHumanCommit(fullName);
    if (!commit) continue;
    const repo = await repoInfo(fullName);
    if (!repo) continue;
    return { repo: fullName, url: repo.html_url, description: repo.description, language: repo.language, pushedAt: commit.date, commit };
  }
  return null;
}

/* ---------- contribution calendar ---------- */

export type ContributionDay = { date: string; level: number; count: number };
export type Contributions = { days: ContributionDay[]; total: number; streak: number; best: ContributionDay | null };

export type ContributionYears = { years: number[]; byYear: Record<number, Contributions> };

/** One calendar per year since the account was created (current year first). Cached 1h. */
export async function getContributionYears(): Promise<ContributionYears | null> {
  let start = new Date().getFullYear();
  try {
    const res = await fetch(`https://api.github.com/users/${site.githubUser}`, { headers: H, next: { revalidate: 86400 } });
    if (res.ok) start = new Date((await res.json()).created_at).getFullYear();
  } catch {}

  const now = new Date().getFullYear();
  const years: number[] = [];
  const byYear: Record<number, Contributions> = {};
  for (let y = now; y >= start; y--) {
    const c = await getContributions(y);
    if (c) {
      years.push(y);
      byYear[y] = c;
    }
  }
  return years.length ? { years, byYear } : null;
}

/** Contribution graph, scraped from the public profile calendar. Cached 1h. */
export async function getContributions(year?: number): Promise<Contributions | null> {
  try {
    const range = year ? `?from=${year}-01-01&to=${year}-12-31` : "";
    const res = await fetch(`https://github.com/users/${site.githubUser}/contributions${range}`, {
      headers: { accept: "text/html", "user-agent": "vensin.dev" },
      next: { revalidate: 3600 },
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
    if (days.length === 0) return null;
    days.sort((a, b) => a.date.localeCompare(b.date));
    // a year view must not run past today
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
  } catch {
    return null;
  }
}

export function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  return mo < 12 ? `${mo}mo ago` : `${Math.floor(mo / 12)}y ago`;
}
