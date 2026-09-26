import type { Metadata } from "next";
import { socials } from "@/data/site";
import { PixelIcon } from "@/components/icons/PixelIcon";

export const metadata: Metadata = { title: "links" };

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
              className="win win-dashed flex items-center gap-3 px-3 py-2 no-underline hover:bg-accent-soft transition-colors group"
            >
              <span className="w-9 grid place-items-center text-accent-2 group-hover:text-accent transition-colors">
                <PixelIcon name={s.id} size={30} />
              </span>
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
