import Link from "next/link";
import type { ReactNode } from "react";
import { site } from "@/data/site";
import { build } from "@/lib/build";
import { getSettings } from "@/lib/store";
import { NavTabs } from "./NavTabs";
import { Marquee } from "./Marquee";
import { ThemeToggle } from "./ThemeToggle";
import { Window } from "./Window";
import { LanyardProvider } from "@/components/discord/LanyardProvider";
import { DiscordPresence } from "@/components/discord/DiscordPresence";
import { TodayCycle } from "@/components/widgets/TodayCycle";
import { NowBox } from "@/components/widgets/NowBox";
import { Typewriter } from "@/components/widgets/Typewriter";
import { Kaomoji } from "@/components/widgets/Kaomoji";

export async function Shell({ children }: { children: ReactNode }) {
  const year = new Date().getFullYear();
  const settings = await getSettings();

  return (
    <LanyardProvider>
      <div id="top" className="relative z-10 mx-auto w-full max-w-[1040px] px-4 py-6 md:py-10">
        {/* header */}
        <header className="text-center mb-6">
          <Link href="/" className="no-underline hover:no-underline inline-block text-ink hover:text-accent transition-colors">
            <h1 className="pixel text-3xl md:text-4xl tracking-wide">{site.domain}</h1>
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
            <TodayCycle />
            <Window title="now">
              <NowBox fallback={settings.now} />
            </Window>
          </aside>
        </div>

        {/* marquee */}
        <div className="win mt-6">
          <Marquee items={settings.marquee} />
        </div>

        {/* footer */}
        <footer className="mt-5 win win-dashed">
          <div className="win-body grid gap-3 sm:grid-cols-[1fr_auto] items-center text-xs">
            <div className="grid gap-1">
              <div className="pixel text-ink text-sm">{site.domain}</div>
              <div className="text-ink-soft">© {year} luis. all the bugs are mine.</div>
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
              <Link href="/contact" className="btn text-xs no-underline">
                contact
              </Link>
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
    </LanyardProvider>
  );
}
