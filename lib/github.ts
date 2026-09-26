import { site } from "@/data/site";

export type GithubStats = { repos: number; followers: number; url: string } | null;

/** Public GitHub profile numbers. Cached for 1h. */
export async function getGithubStats(): Promise<GithubStats> {
  try {
    const res = await fetch(`https://api.github.com/users/${site.githubUser}`, {
      headers: { accept: "application/vnd.github+json", "user-agent": "vensin.dev" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const j = await res.json();
    return { repos: j.public_repos ?? 0, followers: j.followers ?? 0, url: j.html_url };
  } catch {
    return null;
  }
}
