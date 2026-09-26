import Link from "next/link";
import { site, socials } from "@/data/site";
import { Window } from "@/components/layout/Window";

export default function Home() {
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
        <Window title="update log (yyyy-mm-dd)" dashed bodyClassName="scroll-y max-h-52 text-xs">
          <ul className="grid gap-2">
            {site.updateLog.map((u, i) => (
              <li key={i}>
                <span className="text-accent-2 italic">{u.date}:</span> {u.text}
              </li>
            ))}
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
            <li className="pt-1 text-ink-soft">
              more on the <Link href="/links">links page</Link>
            </li>
          </ul>
        </Window>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 text-center">
        <Link href="/about" className="btn justify-center no-underline">
          about me →
        </Link>
        <Link href="/projects" className="btn justify-center no-underline">
          projects →
        </Link>
        <Link href="/anime" className="btn justify-center no-underline">
          anime →
        </Link>
      </div>

      <p className="text-[11px] text-ink-soft text-center">
        this site uses javascript and looks best on a screen that is not upside down. updates whenever i feel like it.
      </p>
    </div>
  );
}
