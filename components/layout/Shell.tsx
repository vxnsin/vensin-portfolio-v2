import Link from "next/link";
import type { ReactNode } from "react";
import { site } from "@/data/site";
import { NavTabs } from "./NavTabs";
import { Marquee } from "./Marquee";
import { ThemeToggle } from "./ThemeToggle";
import { Window } from "./Window";
import { DiscordPresence } from "@/components/discord/DiscordPresence";
import { DateBlock } from "@/components/widgets/DateBlock";
import { Typewriter } from "@/components/widgets/Typewriter";
import { Kaomoji } from "@/components/widgets/Kaomoji";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="relative z-10 mx-auto w-full max-w-[1040px] px-4 py-6 md:py-10">
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

      {/* marquee + footer */}
      <div className="win mt-6">
        <Marquee items={site.marquee} />
      </div>
      <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-soft">
        <span>
          {site.version.tag} &quot;{site.version.codename}&quot; · {site.version.since} to forever · {site.name} @ {site.domain}
        </span>
        <span className="flex items-center gap-3">
          <Link href="/impressum">impressum</Link>
          <ThemeToggle />
        </span>
      </footer>
    </div>
  );
}
