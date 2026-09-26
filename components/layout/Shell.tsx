import Link from "next/link";
import type { ReactNode } from "react";
import { site } from "@/data/site";
import { build } from "@/lib/build";
import { NavTabs } from "./NavTabs";
import { Marquee } from "./Marquee";
import { ThemeToggle } from "./ThemeToggle";
import { Window } from "./Window";
import { DiscordPresence } from "@/components/discord/DiscordPresence";
import { DateBlock } from "@/components/widgets/DateBlock";
import { Typewriter } from "@/components/widgets/Typewriter";
import { Kaomoji } from "@/components/widgets/Kaomoji";

export function Shell({ children }: { children: ReactNode }) {
  const year = new Date().getFullYear();

  return (
    <div id="top" className="relative z-10 mx-auto w-full max-w-[1040px] px-4 py-6 md:py-10">
      {/* header */}
      <header className="text-center mb-6">
        <Link href="/" className="no-underline hover:no-underline inline-block">
          <h1 className="pixel text-3xl md:text-4xl text-ink tracking-wide">
            {site.domain}
            <span className="text-accent">.</span>
          </h1>
        </Link>
        <div className="text-xs text-ink-soft mt-1">
          <span className="text-accent-2">{site.jpName}</span> · <Typewriter words={site.typewriter} />
        </div>
      </header>

      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_260px] items-start">
        {/* main column */}
        <div className="min-w-0">
          <NavTabs />
          <main className="win min-h-[420px]">
            <div className="win-body">{children}</div>
          </main>
        </div>

        {/* sidebar */}
        <aside className="grid gap-5 min-w-0 md:sticky md:top-6">
          <Window title="discord" right={<Kaomoji className="text-[11px] text-ink-soft" />}>
            <DiscordPresence />
          </Window>
          <Window title="today" dashed>
            <DateBlock />
          </Window>
          <Window title="now">
            <dl className="text-xs grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
              <dt className="text-ink-soft">watching:</dt>
              <dd>
                <Link href="/anime">{site.now.watching}</Link>
              </dd>
              <dt className="text-ink-soft">playing:</dt>
              <dd>{site.now.playing}</dd>
              <dt className="text-ink-soft">listening:</dt>
              <dd>{site.now.listening}</dd>
              <dt className="text-ink-soft">mood:</dt>
              <dd>{site.now.mood}</dd>
            </dl>
          </Window>
        </aside>
      </div>

      {/* marquee */}
      <div className="win mt-6">
        <Marquee items={site.marquee} />
      </div>

      {/* footer */}
      <footer className="mt-5 win win-dashed">
        <div className="win-body grid gap-3 sm:grid-cols-[1fr_auto] items-center text-xs">
          <div className="grid gap-1">
            <div>
              <span className="pixel text-ink">{site.domain}</span>
              <span className="text-ink-soft"> · © {year} luis. all the bugs are mine.</span>
            </div>
            <div className="text-ink-soft">
              hand-built with next.js, coffee and anime osts.{" "}
              <a href={build.repo} target="_blank" rel="noreferrer" title="source code">
                build {build.sha}
              </a>{" "}
              · {build.date}
            </div>
            <div className="text-ink-soft">
              status widget by{" "}
              <a href="https://github.com/Phineas/lanyard" target="_blank" rel="noreferrer">
                lanyard
              </a>
              , posters by{" "}
              <a href="https://kitsu.app" target="_blank" rel="noreferrer">
                kitsu
              </a>
              . no cookies, no tracking.
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <Link href="/impressum" className="btn text-xs no-underline">
              impressum
            </Link>
            <ThemeToggle />
            <a href="#top" className="btn text-xs no-underline" aria-label="back to top">
              ↑ top
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
