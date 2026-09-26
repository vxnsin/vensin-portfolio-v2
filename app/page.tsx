import Link from "next/link";
import { site, socials } from "@/data/site";
import { getSettings } from "@/lib/store";
import { getLatestGithubActivity, relativeTime } from "@/lib/github";
import { Window } from "@/components/layout/Window";

export default async function Home() {
  const [settings, gh] = await Promise.all([getSettings(), getLatestGithubActivity()]);

  return (
    <div className="grid gap-5">
      <div>
        <h2 className="pixel text-lg text-accent mb-2">welcome to {site.domain} _(:з)∠)_</h2>
        {site.intro.map((p) => (
          <p key={p} className="mb-3">
            {p}
          </p>
        ))}
        <p className="text-ink-soft">
          love, luis. <span className="text-accent-2">☆*: .｡. o(≧▽≦)o .｡.:*☆</span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Window title="update log" dashed bodyClassName="scroll-y max-h-52 text-xs">
          <ul className="grid gap-2">
            {settings.updateLog.map((u) => (
              <li key={u.id}>
                <span className="text-accent-2 italic">{u.date}:</span> {u.text}
              </li>
            ))}
            {settings.updateLog.length === 0 && <li className="text-ink-soft">nothing yet.</li>}
          </ul>
        </Window>

        <Window title="say hi" dashed bodyClassName="text-xs">
          <ul className="grid gap-1.5">
            <li>
              dm me on discord: <span className="chip">vensin</span>
            </li>
            {socials.map((s) => (
              <li key={s.id}>
                {s.label.toLowerCase()}:{" "}
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.handle}
                </a>
              </li>
            ))}
            <li className="pt-1">
              or use the <Link href="/contact">contact form</Link> — it pings me on discord.
            </li>
          </ul>
        </Window>
      </div>

      <Window title="latest on github" dashed bodyClassName="text-xs">
        {gh ? (
          <div className="grid gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <a href={gh.url} target="_blank" rel="noreferrer" className="pixel text-sm">
                {gh.repo}
              </a>
              {gh.language && <span className="chip text-[10px]">{gh.language}</span>}
              <span className="text-ink-soft">pushed {relativeTime(gh.pushedAt)}</span>
            </div>
            {gh.description && <div className="text-ink-soft">{gh.description}</div>}
            {gh.commit && (
              <div className="truncate">
                <span className="text-ink-soft">last commit:</span>{" "}
                <a href={gh.commit.url} target="_blank" rel="noreferrer" title={gh.commit.message}>
                  {gh.commit.message}
                </a>
              </div>
            )}
          </div>
        ) : (
          <p className="text-ink-soft">github is being shy right now.</p>
        )}
      </Window>

      <div className="grid gap-4 sm:grid-cols-3 text-center">
        <Link href="/about" className="btn justify-center no-underline">
          about me →
        </Link>
        <Link href="/projects" className="btn justify-center no-underline">
          projects →
        </Link>
        <Link href="/gallery" className="btn justify-center no-underline">
          gallery →
        </Link>
      </div>

      <p className="text-[11px] text-ink-soft text-center">
        this site uses javascript and looks best on a screen that is not upside down. updates whenever i feel like it.
      </p>
    </div>
  );
}
