import type { Metadata } from "next";
import { socials } from "@/data/site";

export const metadata: Metadata = { title: "links" };

const ICON: Record<string, string> = {
  github: "⌥",
  tiktok: "♪",
  youtube: "▶",
  steam: "♨",
  discord: "◉",
};

export default function LinksPage() {
  return (
    <div className="grid gap-5">
      <div>
        <h2 className="pixel text-lg text-accent mb-2">links.</h2>
        <p className="text-xs text-ink-soft">where else to find me on the internet.</p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {socials.map((s) => (
          <li key={s.id}>
            <a
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="win win-dashed flex items-center gap-3 px-3 py-2 no-underline hover:bg-accent-soft transition-colors"
            >
              <span className="pixel text-xl text-accent-2 w-7 text-center">{ICON[s.id] ?? "↗"}</span>
              <span className="min-w-0">
                <span className="block pixel text-ink">{s.label}</span>
                <span className="block text-xs text-ink-soft truncate">{s.handle}</span>
              </span>
              <span className="ml-auto text-ink-soft">↗</span>
            </a>
          </li>
        ))}
      </ul>

      <p className="text-xs text-ink-soft">
        want to link back? this site is <span className="chip">vensin.dev</span> — no 88x31 button yet, but soon (probably).
      </p>
    </div>
  );
}
