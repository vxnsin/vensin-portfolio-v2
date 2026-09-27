import Link from "next/link";
import { site, socials } from "@/data/site";
import { getSettings } from "@/lib/store";
import { getContributionYears, getLatestGithubActivity } from "@/lib/github";
import { Window } from "@/components/layout/Window";
import { GithubBox } from "@/components/github/GithubBox";
import { Wordmark } from "@/components/layout/Wordmark";
import { SpecialNote } from "@/components/home/SpecialNote";
import { resolveSeason } from "@/lib/season";

export default async function Home() {
  const [settings, gh, contributions] = await Promise.all([getSettings(), getLatestGithubActivity(), getContributionYears()]);
  const { season } = await resolveSeason();

  return (
    <div className="grid gap-5">
      <div>
        <h2 className="pixel text-lg text-accent mb-2">welcome to <Wordmark /> _(:з)∠)_</h2>
        {site.intro.map((p) => (
          <p key={p} className="mb-3">
            {p}
          </p>
        ))}
        <p className="text-ink-soft">
          love, luis. <span className="text-accent-2">☆*: .｡. o(≧▽≦)o .｡.:*☆</span>
        </p>
      </div>

      <SpecialNote initial={season} />

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
              dm me on discord: <span className="chip">vxnsin</span>
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

      <GithubBox gh={gh} contributions={contributions} />

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

    </div>
  );
}
