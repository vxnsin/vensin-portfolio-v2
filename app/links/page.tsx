/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import { socials } from "@/data/site";
import { listNeighbors } from "@/lib/store";
import { PixelIcon } from "@/components/icons/PixelIcon";
import { Window } from "@/components/layout/Window";
import { LinkBack } from "@/components/links/LinkBack";

export const metadata: Metadata = { title: "links" };

export default async function LinksPage() {
  const neighbors = await listNeighbors();
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

      <Window title="neighbors" dashed>
        {neighbors.length === 0 ? (
          <p className="text-xs text-ink-soft">no neighbors yet. want to swap buttons? send me yours via the contact form.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {neighbors.map((n) => (
              <li key={n.id}>
                <a href={n.url} target="_blank" rel="noreferrer" title={n.name} className="block border border-line hover:border-accent">
                  <img src={n.buttonUrl} alt={n.name} width={88} height={31} loading="lazy" style={{ imageRendering: "pixelated", display: "block" }} />
                </a>
              </li>
            ))}
          </ul>
        )}
        <p className="text-[10px] text-ink-soft mt-2">sites i like, run by people i like. want in? swap buttons with me.</p>
      </Window>

      <Window title="link back" dashed>
        <LinkBack />
      </Window>
    </div>
  );
}
