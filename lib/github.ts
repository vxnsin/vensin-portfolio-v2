import { site } from "@/data/site";

const H = { accept: "application/vnd.github+json", "user-agent": "vensin.dev" };

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

export type LatestActivity = {
  repo: string;
  url: string;
  description: string | null;
  language: string | null;
  pushedAt: string;
  commit: { message: string; url: string; date: string } | null;
} | null;

/** The public repo Luis pushed to most recently, plus its latest commit. Cached 10 min. */
export async function getLatestGithubActivity(): Promise<LatestActivity> {
  try {
    const res = await fetch(`https://api.github.com/users/${site.githubUser}/repos?sort=pushed&direction=desc&per_page=1&type=owner`, {
      headers: H,
      next: { revalidate: 600 },
    });
    if (!res.ok) return null;
    const [repo] = await res.json();
    if (!repo) return null;

    let commit: NonNullable<LatestActivity>["commit"] = null;
    try {
      const c = await fetch(`https://api.github.com/repos/${repo.full_name}/commits?per_page=1`, { headers: H, next: { revalidate: 600 } });
      if (c.ok) {
        const [latest] = await c.json();
        if (latest) {
          commit = {
            message: String(latest.commit?.message ?? "").split("\n")[0],
            url: latest.html_url,
            date: latest.commit?.committer?.date ?? latest.commit?.author?.date ?? repo.pushed_at,
          };
        }
      }
    } catch {}

    return {
      repo: repo.name,
      url: repo.html_url,
      description: repo.description,
      language: repo.language,
      pushedAt: repo.pushed_at,
      commit,
    };
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
